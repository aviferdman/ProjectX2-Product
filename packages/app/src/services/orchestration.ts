/**
 * Orchestration service — bridges React UI to @crewspace/core engine.
 *
 * This module uses an LLM to:
 *  1. Parse a user prompt into a multi-agent workflow plan (agents + tasks)
 *  2. Execute that workflow via Crew, streaming progress events back to the UI
 *  3. Handle chat follow-ups (add/remove agents, modify tasks)
 */
import { Agent } from '@crewspace/core/agent';
import { Crew } from '@crewspace/core/crew';
import {
  OpenAIProvider,
  AnthropicProvider,
  OllamaProvider,
} from '@crewspace/core/llm';
import { LLMRole } from '@crewspace/core/types';
import { ConvergenceStrategy } from '@crewspace/core/types';
import type {
  LLMProvider,
  LLMProviderConfig,
  CrewRunResult,
  TaskResult,
  LLMResponse,
  DiscussionMessage,
  DiscussionResult,
} from '@crewspace/core/types';
import type { AgentNode, TaskNode, WorkflowState, DiscussionEdge } from '../types/workflow.js';
import { ALL_HARDCODED_AGENTS } from '../data/hardcoded-agents.js';
import type { HardcodedAgent } from '../data/hardcoded-agents.js';

// ---------------------------------------------------------------------------
// LLM provider configuration
// ---------------------------------------------------------------------------

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'ollama' | 'azure';
  modelId: string;
  apiKey?: string | undefined;
  baseUrl?: string | undefined;
}

const AGENT_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

/** Create an LLM provider from config. */
export function createProvider(config: LLMConfig): LLMProvider {
  // In the browser, route API calls through the Vite dev proxy to avoid CORS.
  // /api/openai/* → https://api.openai.com/*
  // /api/anthropic/* → https://api.anthropic.com/*
  const isBrowser = typeof window !== 'undefined';
  const proxyBaseUrl = (provider: string): string | undefined => {
    if (!isBrowser) return config.baseUrl;
    switch (provider) {
      case 'openai': return config.baseUrl ?? '/api/openai/v1';
      case 'anthropic': return config.baseUrl ?? '/api/anthropic';
      default: return config.baseUrl;
    }
  };

  // Azure provider uses the server-side Azure Function proxy — no API key needed in the browser.
  if (config.provider === 'azure') {
    const azureBase: LLMProviderConfig = {
      provider: 'openai',
      modelId: config.modelId || 'gpt-4o-mini',
      apiKey: 'azure-managed',
      baseUrl: '/api/chat/v1',
    };
    return new OpenAIProvider(azureBase);
  }

  const base: LLMProviderConfig = {
    provider: config.provider,
    modelId: config.modelId,
    ...(config.apiKey ? { apiKey: config.apiKey } : {}),
    baseUrl: proxyBaseUrl(config.provider) ?? undefined,
  };
  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider(base);
    case 'anthropic':
      return new AnthropicProvider(base);
    case 'ollama':
      return new OllamaProvider(base);
  }
}

/** Read LLM config from environment / localStorage. */
export function getDefaultLLMConfig(): LLMConfig {
  // Check localStorage first (user may have configured via Settings UI)
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('crewspace:llm-config');
    if (saved) {
      try {
        return JSON.parse(saved) as LLMConfig;
      } catch {
        // fall through
      }
    }
  }
  // Default to Azure OpenAI when deployed (no client-side API key needed)
  const envKey = import.meta.env['VITE_OPENAI_API_KEY'] as string | undefined;
  if (envKey) {
    return {
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: envKey,
    };
  }
  // No API key configured — use Azure backend proxy
  return {
    provider: 'azure',
    modelId: 'gpt-4o-mini',
  };
}

export function saveLLMConfig(config: LLMConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('crewspace:llm-config', JSON.stringify(config));
  }
}

// ---------------------------------------------------------------------------
// Prompt → Workflow plan (LLM-driven)
// ---------------------------------------------------------------------------

// Build a compact agent catalog for the system prompt (minimize tokens for local models)
const AGENT_CATALOG = ALL_HARDCODED_AGENTS.map(
  (a) => `${a.id} (${a.role})`,
).join('\n');

const PLAN_SYSTEM_PROMPT = `You are an AI workflow planner. Output ONLY valid JSON — no prose, no markdown, no comments, no trailing commas.

The user describes a goal. Decompose it into agents and tasks.

You MUST pick agents from this catalog using their exact id:
${AGENT_CATALOG}

Rules:
- agentIds: pick 2-6 ids from the catalog
- tasks: 3-8 tasks, each with id ("task-*"), description, agentId (from catalog), dependencies (array of task ids), expectedOutput
- Every agent must have ≥1 task. No circular deps.
- discussion field is optional, set to null when not needed

Output exactly:
{"name":"string","agentIds":["id1","id2"],"tasks":[{"id":"task-1","description":"...","agentId":"id1","dependencies":[],"expectedOutput":"...","discussion":null}]}`;

interface WorkflowPlan {
  name: string;
  agentIds: string[];
  tasks: Array<{
    id: string;
    description: string;
    agentId: string;
    dependencies: string[];
    expectedOutput: string;
    discussion?: {
      participantIds: string[];
      maxRounds: number;
      convergenceStrategy: string;
      topic?: string;
    } | null;
  }>;
}

/** Build an AgentNode from a HardcodedAgent definition with a color and position. */
function hardcodedToAgentNode(agent: HardcodedAgent, index: number): AgentNode {
  return {
    id: agent.id,
    role: agent.role,
    goal: agent.goal,
    backstory: agent.backstory,
    tools: [...agent.tools],
    status: 'idle' as const,
    color: AGENT_COLORS[index % AGENT_COLORS.length] ?? '#6366f1',
    position: { x: 100 + (index % 4) * 300, y: 80 + Math.floor(index / 4) * 220 },
  };
}

/** Ask the LLM to decompose a user prompt into agents + tasks with optional discussions. */
export async function generateWorkflowPlan(
  prompt: string,
  provider: LLMProvider,
): Promise<WorkflowState> {
  const response: LLMResponse = await provider.generateText([
    { role: LLMRole.SYSTEM, content: PLAN_SYSTEM_PROMPT },
    { role: LLMRole.USER, content: `Create a JSON workflow plan for this goal: ${prompt}` },
  ]);

  const plan = parseJsonResponse<WorkflowPlan>(response.content);

  // Resolve agents from the hardcoded catalog
  const hardcodedMap = new Map(ALL_HARDCODED_AGENTS.map((a) => [a.id, a]));

  // The LLM may return agentIds or the old agents array format — handle both.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawPlan = plan as any;
  let selectedIds: string[] = plan.agentIds ?? [];
  if ((!selectedIds || selectedIds.length === 0) && rawPlan.agents) {
    // Fallback: LLM returned old format with agents array — extract ids
    selectedIds = (rawPlan.agents as Array<{ id: string }>).map((a) => a.id);
  }

  // Filter to only valid hardcoded agent IDs
  const validIds = selectedIds.filter((id) => hardcodedMap.has(id));

  // Also collect any agentIds referenced by tasks that are valid
  for (const t of plan.tasks) {
    if (t.agentId && hardcodedMap.has(t.agentId) && !validIds.includes(t.agentId)) {
      validIds.push(t.agentId);
    }
  }

  // Ensure we have at least 2 agents
  if (validIds.length < 2) {
    // Pick the first 2 from the catalog as fallback
    for (const a of ALL_HARDCODED_AGENTS) {
      if (!validIds.includes(a.id)) {
        validIds.push(a.id);
        if (validIds.length >= 2) break;
      }
    }
  }

  const agents: AgentNode[] = validIds.map((id, i) => {
    const def = hardcodedMap.get(id)!;
    return hardcodedToAgentNode(def, i);
  });

  // Build a set of valid agent IDs for lookup
  const validAgentIds = new Set(agents.map((a) => a.id));

  const tasks: TaskNode[] = plan.tasks.map((t, i) => {
    // Resolve agentId: use the LLM value if it matches a real agent, else
    // try to match by index reference ("agent-1" style), else round-robin assign.
    let resolvedAgentId = t.agentId ?? '';
    if (!validAgentIds.has(resolvedAgentId)) {
      // Fallback: round-robin assign to agents so no task is orphaned
      resolvedAgentId = agents[i % agents.length]?.id ?? '';
    }
    return {
      id: t.id ?? `task-${i + 1}`,
      description: t.description ?? 'No description',
      agentId: resolvedAgentId,
      dependencies: t.dependencies ?? [],
      expectedOutput: t.expectedOutput ?? '',
      status: 'pending' as const,
      ...(t.discussion
        ? {
            discussion: {
              participantIds: t.discussion.participantIds,
              maxRounds: t.discussion.maxRounds,
              convergenceStrategy: t.discussion.convergenceStrategy as NonNullable<TaskNode['discussion']>['convergenceStrategy'],
              ...(t.discussion.topic ? { topic: t.discussion.topic } : {}),
            },
          }
        : {}),
    };
  });

  // Strip invalid dependency references (deps pointing to task IDs not in the plan)
  const validTaskIds = new Set(tasks.map((t) => t.id));
  for (const task of tasks) {
    task.dependencies = task.dependencies.filter((depId) => validTaskIds.has(depId) && depId !== task.id);
    // Also strip invalid discussion participant IDs
    if (task.discussion) {
      task.discussion.participantIds = task.discussion.participantIds.filter((pid) => validAgentIds.has(pid));
    }
  }

  // Break circular dependencies using topological sort (Kahn's algorithm)
  breakCycles(tasks);

  // Build discussion edges from task discussion configs
  const discussionEdges = buildDiscussionEdges(tasks);

  return {
    id: `wf-${Date.now()}`,
    name: plan.name,
    description: prompt,
    agents,
    tasks,
    discussionEdges,
    status: 'draft',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/** Build DiscussionEdge entries from tasks that have discussion configs. */
function buildDiscussionEdges(tasks: TaskNode[]): DiscussionEdge[] {
  const edges: DiscussionEdge[] = [];
  for (const task of tasks) {
    if (!task.discussion) continue;
    const participants = task.discussion.participantIds;
    // Create a bidirectional edge for each pair of participants
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        edges.push({
          id: `edge-${task.id}-${participants[i]}-${participants[j]}`,
          fromAgentId: participants[i]!,
          toAgentId: participants[j]!,
          taskId: task.id,
          status: 'idle',
          messages: [],
        });
      }
    }
  }
  return edges;
}

// ---------------------------------------------------------------------------
// Chat follow-up (LLM-driven)
// ---------------------------------------------------------------------------

const CHAT_SYSTEM_PROMPT = `You are an AI assistant helping the user refine their agent workflow.

Agents come from a fixed catalog (only these ids are valid):
${AGENT_CATALOG}

If the user wants to modify the workflow, respond with JSON (no trailing commas) wrapped in <json>...</json> tags containing {"name","agentIds":[...],"tasks":[...]}.
Otherwise respond in markdown.

Current workflow:
`;

export async function chatWithWorkflow(
  userMessage: string,
  workflow: WorkflowState | null,
  provider: LLMProvider,
): Promise<{ text: string; updatedWorkflow: WorkflowState | null }> {
  const workflowContext = workflow
    ? JSON.stringify(
        {
          name: workflow.name,
          agents: workflow.agents.map((a) => ({
            id: a.id,
            role: a.role,
            goal: a.goal,
            tools: a.tools,
          })),
          tasks: workflow.tasks.map((t) => ({
            id: t.id,
            description: t.description,
            agentId: t.agentId,
            dependencies: t.dependencies,
            ...(t.discussion ? { discussion: t.discussion } : {}),
          })),
        },
        null,
        2,
      )
    : 'No workflow yet.';

  const response = await provider.generateText([
    { role: LLMRole.SYSTEM, content: CHAT_SYSTEM_PROMPT + workflowContext },
    { role: LLMRole.USER, content: userMessage },
  ]);

  const content = response.content;

  // Check if the response contains a JSON workflow update
  const jsonMatch = content.match(/<json>([\s\S]*?)<\/json>/);
  if (jsonMatch?.[1] && workflow) {
    try {
      const plan = JSON.parse(jsonMatch[1]) as WorkflowPlan;
      const hardcodedMap = new Map(ALL_HARDCODED_AGENTS.map((a) => [a.id, a]));

      // Resolve agent IDs from the hardcoded catalog
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawPlan = plan as any;
      let selectedIds: string[] = plan.agentIds ?? [];
      if ((!selectedIds || selectedIds.length === 0) && rawPlan.agents) {
        selectedIds = (rawPlan.agents as Array<{ id: string }>).map((a) => a.id);
      }
      const validIds = selectedIds.filter((id) => hardcodedMap.has(id));
      // Also include any agentIds from tasks
      for (const t of plan.tasks) {
        if (t.agentId && hardcodedMap.has(t.agentId) && !validIds.includes(t.agentId)) {
          validIds.push(t.agentId);
        }
      }

      const agents: AgentNode[] = validIds.map((id, i) => {
        const def = hardcodedMap.get(id)!;
        return hardcodedToAgentNode(def, i);
      });
      const tasks: TaskNode[] = plan.tasks.map((t) => ({
        id: t.id,
        description: t.description,
        agentId: t.agentId,
        dependencies: t.dependencies ?? [],
        expectedOutput: t.expectedOutput ?? '',
        status: 'pending' as const,
        ...(t.discussion
          ? {
              discussion: {
                participantIds: t.discussion.participantIds,
                maxRounds: t.discussion.maxRounds,
                convergenceStrategy: t.discussion.convergenceStrategy as NonNullable<TaskNode['discussion']>['convergenceStrategy'],
                ...(t.discussion.topic ? { topic: t.discussion.topic } : {}),
              },
            }
          : {}),
      }));
      const discussionEdges = buildDiscussionEdges(tasks);
      const updatedWorkflow: WorkflowState = {
        ...workflow,
        name: plan.name ?? workflow.name,
        agents,
        tasks,
        discussionEdges,
        updatedAt: Date.now(),
      };
      // Strip the JSON block from the visible text
      const textContent = content.replace(/<json>[\s\S]*?<\/json>/, '').trim();
      return {
        text: textContent || "I've updated the workflow. Here's what changed.",
        updatedWorkflow,
      };
    } catch {
      // JSON parse failed — return text as-is
    }
  }

  return { text: content, updatedWorkflow: null };
}

// ---------------------------------------------------------------------------
// Workflow execution — real Crew engine
// ---------------------------------------------------------------------------

export interface ExecutionCallbacks {
  onTaskStart: (taskId: string, agentId: string) => void;
  onTaskComplete: (taskId: string, result: TaskResult) => void;
  onTaskError: (taskId: string, error: Error) => void;
  onCrewComplete: (result: CrewRunResult) => void;
  onCrewError: (error: Error) => void;
  onDiscussionStart?: (discussionId: string, participantIds: readonly string[]) => void;
  onDiscussionMessage?: (discussionId: string, message: DiscussionMessage) => void;
  onDiscussionComplete?: (discussionId: string, result: DiscussionResult) => void;
}

/** Map UI convergence strategy string to core enum. */
function mapConvergenceStrategy(strategy: string): ConvergenceStrategy {
  switch (strategy) {
    case 'unanimous': return ConvergenceStrategy.UNANIMOUS;
    case 'majority': return ConvergenceStrategy.MAJORITY;
    case 'llm-judge': return ConvergenceStrategy.LLM_JUDGE;
    case 'stable-output': return ConvergenceStrategy.STABLE_OUTPUT;
    default: return ConvergenceStrategy.UNANIMOUS;
  }
}

/** Execute a workflow using the real Crew engine, with discussion support. */
export async function executeWorkflow(
  workflow: WorkflowState,
  provider: LLMProvider,
  callbacks: ExecutionCallbacks,
): Promise<CrewRunResult> {
  // Tool capability descriptions injected into agent backstories
  // (real Tool objects use Node.js APIs; in-browser we enrich the persona instead)
  const TOOL_DESCRIPTIONS: Record<string, string> = {
    'web-search': 'You can search the web to find current information, articles, and data.',
    'web-scraper': 'You can extract structured data from web pages.',
    'document-reader': 'You can read and analyze documents, PDFs, and text files.',
    'data-processor': 'You can process, transform, and analyze structured data and datasets.',
    'chart-generator': 'You can create data visualizations, charts, and graphs.',
    'document-writer': 'You can compose well-structured documents, reports, and articles.',
    'code-executor': 'You can write and reason about code to solve computational problems.',
    'api-caller': 'You can interact with external APIs to fetch or send data.',
  };

  // 1. Create real Agent instances with enriched personas
  const agents: Agent[] = workflow.agents.map(
    (agentNode) => {
      // Build enriched backstory with tool capability context
      const toolCapabilities = (agentNode.tools ?? [])
        .map((t) => TOOL_DESCRIPTIONS[t])
        .filter(Boolean);
      const enrichedBackstory = [
        agentNode.backstory,
        ...(toolCapabilities.length > 0
          ? [`Capabilities: ${toolCapabilities.join(' ')}`]
          : []),
      ].filter(Boolean).join('\n\n');

      return new Agent({
        id: agentNode.id,
        role: agentNode.role,
        goal: agentNode.goal,
        backstory: enrichedBackstory,
        llmProvider: provider,
        verbose: true,
      });
    },
  );

  // 2. Build CrewTask array, including discussion configs
  // Ensure every task has a valid agentId that maps to a real agent
  const agentIdSet = new Set(agents.map((a) => a.id));
  const taskIdSet = new Set(workflow.tasks.map((t) => t.id));
  const crewTasks = workflow.tasks.map((t, i) => {
    let safeAgentId = t.agentId;
    if (!safeAgentId || !agentIdSet.has(safeAgentId)) {
      // Fallback: round-robin so Crew validation doesn't fail
      safeAgentId = agents[i % agents.length]?.id ?? t.agentId;
    }
    // Strip dependencies that reference non-existent tasks
    const safeDeps = t.dependencies.filter((d) => taskIdSet.has(d) && d !== t.id);
    const task: {
      id: string;
      description: string;
      agentId: string;
      expectedOutput?: string;
      dependencies?: string[];
      discussion?: {
        participantIds: string[];
        maxRounds: number;
        convergenceStrategy: ConvergenceStrategy;
        topic?: string;
      };
    } = {
      id: t.id,
      description: t.description || 'Execute task',
      agentId: safeAgentId,
    };
    if (t.expectedOutput) {
      task.expectedOutput = t.expectedOutput;
    }
    if (safeDeps.length > 0) {
      task.dependencies = safeDeps;
    }
    if (t.discussion) {
      task.discussion = {
        participantIds: t.discussion.participantIds.filter((pid) => agentIdSet.has(pid)),
        maxRounds: t.discussion.maxRounds,
        convergenceStrategy: mapConvergenceStrategy(t.discussion.convergenceStrategy),
        ...(t.discussion.topic ? { topic: t.discussion.topic } : {}),
      };
    }
    return task;
  });

  // Break circular dependencies before handing to Crew
  breakCycles(crewTasks as Array<{ id: string; dependencies?: string[] }>);

  // 3. Create and configure Crew
  const crew = new Crew({
    id: workflow.id,
    name: workflow.name,
    agents,
    tasks: crewTasks,
    verbose: true,
  });

  // 4. Wire up event listeners
  crew.on('crew:task:start', (_crewId: string, taskId: string, agentId: string) => {
    callbacks.onTaskStart(taskId, agentId);
  });

  crew.on('crew:task:complete', (_crewId: string, taskId: string, result: TaskResult) => {
    callbacks.onTaskComplete(taskId, result);
  });

  crew.on('crew:task:error', (_crewId: string, taskId: string, error: Error) => {
    callbacks.onTaskError(taskId, error);
  });

  // 5. Wire discussion events
  crew.on('crew:discussion:start', (_crewId: string, discussionId: string, participantIds: readonly string[]) => {
    callbacks.onDiscussionStart?.(discussionId, participantIds);
  });

  crew.on('crew:discussion:message', (_crewId: string, discussionId: string, message: DiscussionMessage) => {
    callbacks.onDiscussionMessage?.(discussionId, message);
  });

  crew.on('crew:discussion:complete', (_crewId: string, discussionId: string, result: DiscussionResult) => {
    callbacks.onDiscussionComplete?.(discussionId, result);
  });

  // 5. Run!
  try {
    const result = await crew.run();
    callbacks.onCrewComplete(result);
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks.onCrewError(err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseJsonResponse<T>(content: string): T {
  // Strip markdown code fences if present
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  // Local models (Ollama) sometimes emit preamble text before the JSON object.
  // Try a direct parse first; if it fails, extract the first { ... } block.
  const attempts: string[] = [cleaned];

  // Extract {…} block if there's preamble/postamble text
  const braceStart = cleaned.indexOf('{');
  const braceEnd = cleaned.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    attempts.push(cleaned.slice(braceStart, braceEnd + 1));
  }

  for (const raw of attempts) {
    // Try raw first
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Apply common LLM JSON fixes and retry
      try {
        return JSON.parse(fixLlmJson(raw)) as T;
      } catch {
        // continue to next attempt
      }
    }
  }

  throw new Error(`LLM response is not valid JSON:\n${cleaned.slice(0, 300)}`);
}

/**
 * Fix common JSON mistakes that LLMs (especially local models) produce:
 * - Trailing commas before ] or }
 * - Single-line // comments
 * - Single quotes instead of double quotes (only outside existing double-quoted strings)
 * - Unquoted object keys
 */
function fixLlmJson(raw: string): string {
  let s = raw;

  // Remove single-line comments (// ...)
  s = s.replace(/\/\/[^\n]*/g, '');

  // Remove multi-line comments (/* ... */)
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');

  // Trailing commas: ",]" → "]"  and ",}" → "}"
  // We need to be careful not to touch commas inside strings.
  // Simple approach: repeatedly strip trailing commas outside strings.
  s = s.replace(/,\s*([\]\}])/g, '$1');

  // Handle control characters that break JSON.parse
  s = s.replace(/[\x00-\x1f]/g, (ch) => {
    if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
    return '';
  });

  return s;
}

/**
 * Break circular dependencies by removing back-edges.
 * Uses Kahn's algorithm: tasks that can't be resolved are stripped of the offending deps.
 */
function breakCycles(tasks: Array<{ id: string; dependencies?: string[] }>): void {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const t of tasks) {
    inDegree.set(t.id, 0);
    adj.set(t.id, []);
  }
  for (const t of tasks) {
    for (const dep of t.dependencies ?? []) {
      if (taskMap.has(dep)) {
        adj.get(dep)!.push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
      }
    }
  }

  // Kahn's: find all nodes with in-degree 0
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }
  const resolved = new Set<string>();
  while (queue.length > 0) {
    const id = queue.shift()!;
    resolved.add(id);
    for (const next of adj.get(id) ?? []) {
      const newDeg = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, newDeg);
      if (newDeg === 0) queue.push(next);
    }
  }

  // Any tasks NOT resolved are in cycles — strip their cycle-causing deps
  if (resolved.size < tasks.length) {
    for (const t of tasks) {
      if (!resolved.has(t.id) && t.dependencies) {
        // Remove deps that are themselves unresolved (cycle participants)
        t.dependencies = t.dependencies.filter((d) => resolved.has(d));
      }
    }
  }
}
