/**
 * Core Agent class — the fundamental building block of Crewspace.
 *
 * An Agent wraps an LLM provider with a persona (role, goal, backstory)
 * and a set of tools. It emits lifecycle events and validates its
 * configuration at construction time using Zod schemas.
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'eventemitter3';
import { z, ZodError } from 'zod';

import { AgentConfigError, AgentExecutionError } from '../errors/index.js';
import type { AgentConfig, AgentEventMap } from '../types/agent.js';
import { AgentStatus } from '../types/agent.js';
import { LLMRole } from '../types/llm.js';
import type { LLMMessage, LLMProvider, LLMResponse } from '../types/llm.js';
import type { TaskInput, TaskResult } from '../types/task.js';
import type { Tool } from '../types/tool.js';

// ---------------------------------------------------------------------------
// Zod schema for runtime validation of AgentConfig
// ---------------------------------------------------------------------------

const AGENT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_ITERATIONS_DEFAULT = 10;
const MAX_ITERATIONS_UPPER_BOUND = 100;

const AgentConfigSchema = z.object({
  id: z
    .string()
    .min(1, 'Agent id must not be empty')
    .regex(AGENT_ID_PATTERN, 'Agent id must be alphanumeric (dashes and underscores allowed)'),
  role: z.string().min(1, 'Agent role must not be empty'),
  goal: z.string().min(1, 'Agent goal must not be empty'),
  backstory: z.string().optional(),
  tools: z
    .array(
      z.custom<Tool>(
        (val) => typeof val === 'object' && val !== null && 'name' in val && 'execute' in val,
      ),
    )
    .optional(),
  llmProvider: z.custom<LLMProvider>().optional(),
  maxIterations: z
    .number()
    .int()
    .positive()
    .max(
      MAX_ITERATIONS_UPPER_BOUND,
      `maxIterations must be ≤ ${String(MAX_ITERATIONS_UPPER_BOUND)}`,
    )
    .optional(),
  verbose: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Agent class
// ---------------------------------------------------------------------------

/**
 * An AI agent with a persona, tools, and an injectable LLM provider.
 *
 * @example
 * ```typescript
 * const agent = new Agent({
 *   id: 'researcher',
 *   role: 'Senior Research Analyst',
 *   goal: 'Find the latest AI breakthroughs',
 *   tools: [webSearchTool],
 * });
 *
 * agent.setLLMProvider(openaiProvider);
 * const result = await agent.execute({ description: 'Summarize GPT-5 papers' });
 * ```
 */
export class Agent {
  /** Unique identifier. */
  public readonly id: string;

  /** Role description (used in system prompt). */
  public readonly role: string;

  /** Primary goal (used in system prompt). */
  public readonly goal: string;

  /** Optional backstory for persona context. */
  public readonly backstory: string;

  /** Maximum LLM iterations per execution. */
  public readonly maxIterations: number;

  /** Whether verbose logging is enabled. */
  public readonly verbose: boolean;

  private readonly _tools: Map<string, Tool>;
  private readonly _emitter: EventEmitter<AgentEventMap>;
  private _llmProvider: LLMProvider | undefined;
  private _status: AgentStatus;

  constructor(config: AgentConfig) {
    try {
      const parsed = AgentConfigSchema.parse(config);

      this.id = parsed.id;
      this.role = parsed.role;
      this.goal = parsed.goal;
      this.backstory = parsed.backstory ?? '';
      this.maxIterations = parsed.maxIterations ?? MAX_ITERATIONS_DEFAULT;
      this.verbose = parsed.verbose ?? false;

      this._tools = new Map<string, Tool>();
      this._emitter = new EventEmitter<AgentEventMap>();
      this._status = AgentStatus.IDLE;

      if (parsed.tools) {
        for (const tool of parsed.tools) {
          this._tools.set(tool.name, tool);
        }
      }

      this._llmProvider = parsed.llmProvider;
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => e.message).join('; ');
        throw new AgentConfigError(messages, typeof config.id === 'string' ? config.id : undefined);
      }
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // Read-only accessors
  // -------------------------------------------------------------------------

  /** Current lifecycle status. */
  get status(): AgentStatus {
    return this._status;
  }

  /** Read-only view of registered tools. */
  get tools(): ReadonlyMap<string, Tool> {
    return this._tools;
  }

  /** The currently configured LLM provider, if any. */
  get llmProvider(): LLMProvider | undefined {
    return this._llmProvider;
  }

  // -------------------------------------------------------------------------
  // Provider & tool management
  // -------------------------------------------------------------------------

  /**
   * Set or replace the LLM provider.
   *
   * @param provider - An LLM provider implementing {@link LLMProvider}
   */
  setLLMProvider(provider: LLMProvider): void {
    this._llmProvider = provider;
  }

  /**
   * Register a tool for this agent.
   *
   * @param tool - The tool to add
   * @throws {AgentConfigError} If a tool with the same name already exists
   */
  addTool(tool: Tool): void {
    if (this._tools.has(tool.name)) {
      throw new AgentConfigError(`Tool "${tool.name}" is already registered`, this.id);
    }
    this._tools.set(tool.name, tool);
  }

  /**
   * Remove a tool by name.
   *
   * @param name - Tool name to remove
   * @returns `true` if the tool was found and removed
   */
  removeTool(name: string): boolean {
    return this._tools.delete(name);
  }

  /**
   * Check whether a specific tool is registered.
   *
   * @param name - Tool name to look up
   */
  hasTool(name: string): boolean {
    return this._tools.has(name);
  }

  // -------------------------------------------------------------------------
  // Event system (type-safe delegation to EventEmitter)
  // -------------------------------------------------------------------------

  /**
   * Subscribe to an agent lifecycle event.
   *
   * @param event    - Event name
   * @param listener - Callback
   */
  on<E extends keyof AgentEventMap>(event: E, listener: AgentEventMap[E]): this {
    this._emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Unsubscribe from an agent lifecycle event.
   *
   * @param event    - Event name
   * @param listener - Callback to remove
   */
  off<E extends keyof AgentEventMap>(event: E, listener: AgentEventMap[E]): this {
    this._emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Subscribe to an agent lifecycle event (fires once).
   *
   * @param event    - Event name
   * @param listener - Callback
   */
  once<E extends keyof AgentEventMap>(event: E, listener: AgentEventMap[E]): this {
    this._emitter.once(event, listener as (...args: unknown[]) => void);
    return this;
  }

  // -------------------------------------------------------------------------
  // Execution
  // -------------------------------------------------------------------------

  /**
   * Execute a task using this agent's persona and LLM provider.
   *
   * @param taskInput - Describes what the agent should accomplish
   * @returns The task result including output text and metadata
   * @throws {AgentExecutionError} If no LLM provider is set or execution fails
   */
  async execute(taskInput: TaskInput): Promise<TaskResult> {
    if (!this._llmProvider) {
      throw new AgentExecutionError(
        this.id,
        'No LLM provider configured. Call setLLMProvider() before execute().',
      );
    }

    this._setStatus(AgentStatus.EXECUTING);
    this._emit('agent:start', this.id, taskInput);

    const startTime = Date.now();

    try {
      const messages = this._buildMessages(taskInput);

      this._emit('agent:llm:start', this.id);
      const response: LLMResponse = await this._llmProvider.generateText(messages);
      this._emit('agent:llm:complete', this.id, response);

      const result: TaskResult = {
        output: response.content,
        agentId: this.id,
        duration: Date.now() - startTime,
        tokenUsage: response.tokenUsage,
      };

      this._setStatus(AgentStatus.IDLE);
      this._emit('agent:complete', this.id, result);

      return result;
    } catch (error) {
      this._setStatus(AgentStatus.ERROR);

      const wrappedError = error instanceof Error ? error : new Error(String(error));

      this._emit('agent:error', this.id, wrappedError);

      if (error instanceof AgentExecutionError) {
        throw error;
      }

      throw new AgentExecutionError(this.id, wrappedError.message, wrappedError);
    }
  }

  // -------------------------------------------------------------------------
  // Prompt building
  // -------------------------------------------------------------------------

  /**
   * Build the system prompt from the agent's persona.
   * Visible for testing; not part of the public API.
   *
   * @internal
   */
  buildSystemPrompt(): string {
    const parts: string[] = [
      `You are a specialist AI agent.`,
      `Role: ${this.role}`,
      `Primary objective: ${this.goal}`,
    ];

    if (this.backstory) {
      parts.push(`Professional background: ${this.backstory}`);
    }

    if (this._tools.size > 0) {
      const toolLines = Array.from(this._tools.values())
        .map((t) => `- ${t.name}: ${t.description}`)
        .join('\n');
      parts.push(`Available tools:\n${toolLines}`);
    }

    parts.push(
      `Operating principles:\n` +
        `- Think step by step before producing your final answer\n` +
        `- Draw on your specialized expertise and methodology described in your background\n` +
        `- Be thorough and precise — quality over speed\n` +
        `- Structure your output clearly with headings or bullet points when appropriate\n` +
        `- If you lack information to confidently answer, state what you know and what remains uncertain\n` +
        `- Stay focused on your assigned task — do not drift into areas outside your specialty`,
    );

    return parts.join('\n\n');
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _buildMessages(taskInput: TaskInput): LLMMessage[] {
    const systemPrompt = this.buildSystemPrompt();

    let userPrompt = `## Task Assignment\n\n${taskInput.description}`;

    if (taskInput.expectedOutput) {
      userPrompt += `\n\n## Expected Output\nFormat and content: ${taskInput.expectedOutput}`;
    }

    if (taskInput.context && Object.keys(taskInput.context).length > 0) {
      userPrompt += `\n\n## Context from Previous Tasks\n${JSON.stringify(taskInput.context, null, 2)}`;
    }

    userPrompt += `\n\n## Instructions\nApply your specialist expertise to complete this task. Think through your approach step by step, then provide your final output.`;

    return [
      { role: LLMRole.SYSTEM, content: systemPrompt },
      { role: LLMRole.USER, content: userPrompt },
    ];
  }

  private _setStatus(status: AgentStatus): void {
    this._status = status;
    this._emit('agent:status-changed', this.id, status);
  }

  /** Type-safe event emission helper. */
  private _emit<E extends keyof AgentEventMap>(
    event: E,
    ...args: Parameters<AgentEventMap[E]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._emitter.emit as (event: string, ...args: any[]) => boolean)(event, ...args);
  }
}
