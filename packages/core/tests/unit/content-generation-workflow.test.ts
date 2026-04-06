/**
 * Tests for TASK-089: Content Generation Workflow Example
 *
 * Validates the content generation workflow example file, its structure,
 * custom tools, and that the multi-agent content pipeline works end-to-end.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
import { defineTool } from '../../src/tool/define-tool.js';
import { createFileTools } from '../../src/tools/file/index.js';
import { ToolCategory, ToolPermission } from '../../src/types/tool.js';
import type { LLMProvider, LLMResponse, LLMMessage } from '../../src/types/index.js';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = dirname(currentFilename);
const PROJECT_ROOT = join(currentDirname, '../../../..');
const EXAMPLES_DIR = join(PROJECT_ROOT, 'examples');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockLLMProvider(content?: string): LLMProvider {
  return {
    name: 'mock-provider',
    generateText: vi
      .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
      .mockResolvedValue({
        content: content ?? 'Mock response',
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
      }),
  };
}

function createTopicResearchTool() {
  return defineTool({
    name: 'topicResearch',
    description: 'Search for reference material on a given topic',
    schema: z.object({
      topic: z.string(),
      depth: z.enum(['brief', 'detailed']).optional(),
    }),
    async execute({ topic, depth }) {
      const depthLevel = depth ?? 'brief';
      return `[${depthLevel}] Research on "${topic}": 1. Source A 2. Source B 3. Source C`;
    },
  });
}

function createToneAnalyzerTool() {
  return defineTool({
    name: 'toneAnalyzer',
    description: 'Analyze the tone and readability of a text passage',
    schema: z.object({
      text: z.string(),
      targetTone: z.enum(['professional', 'casual', 'academic', 'conversational']).optional(),
    }),
    async execute({ text, targetTone }) {
      const wordCount = text.split(/\s+/).length;
      const tone = targetTone ?? 'professional';
      return `Tone Analysis: ${String(wordCount)} words, target: ${tone}, readability: Good`;
    },
  });
}

function createFactCheckTool() {
  return defineTool({
    name: 'factCheck',
    description: 'Check content claims for factual consistency',
    schema: z.object({
      content: z.string(),
    }),
    async execute({ content }) {
      const claimCount = (content.match(/\d+%/g) ?? []).length;
      return `Fact Check: ${String(claimCount)} statistical claims found`;
    },
  });
}

// ---------------------------------------------------------------------------
// Example file validation
// ---------------------------------------------------------------------------

describe('TASK-089: Content Generation Workflow — Example File', () => {
  const examplePath = join(EXAMPLES_DIR, 'content-generation-workflow.ts');
  let content: string;

  it('should exist at examples/content-generation-workflow.ts', () => {
    expect(existsSync(examplePath)).toBe(true);
    content = readFileSync(examplePath, 'utf-8');
  });

  it('should include a file header comment', () => {
    expect(content).toMatch(/^\/\*\*/);
  });

  it('should import Agent and Crew from @crewspace/core', () => {
    expect(content).toContain('Agent');
    expect(content).toContain('Crew');
    expect(content).toContain("from '@crewspace/core'");
  });

  it('should import defineTool from @crewspace/core', () => {
    expect(content).toContain('defineTool');
  });

  it('should import createFileTools from @crewspace/core', () => {
    expect(content).toContain('createFileTools');
  });

  it('should create at least four agents', () => {
    const agentCreations = content.match(/new Agent\(/g) ?? [];
    expect(agentCreations.length).toBeGreaterThanOrEqual(4);
  });

  it('should create a Crew', () => {
    expect(content).toContain('new Crew');
  });

  it('should call crew.run() or contentCrew.run()', () => {
    expect(content).toMatch(/\.run\(\)/);
  });

  it('should demonstrate task dependencies', () => {
    expect(content).toContain('dependencies');
  });

  it('should define at least three custom tools', () => {
    const toolDefs = content.match(/defineTool\(/g) ?? [];
    expect(toolDefs.length).toBeGreaterThanOrEqual(3);
  });

  it('should show lifecycle event subscription', () => {
    expect(content).toContain(".on('crew:");
  });

  it('should include usage instructions in header', () => {
    expect(content).toContain('npx tsx examples/content-generation-workflow.ts');
  });

  it('should mention mock provider replacement', () => {
    expect(content).toMatch(/[Rr]eplace.*real provider|[Mm]ock.*provider/);
  });

  it('should define agents with distinct roles', () => {
    expect(content).toMatch(/role:.*[Rr]esearch/);
    expect(content).toMatch(/role:.*[Oo]utlin/);
    expect(content).toMatch(/role:.*[Ww]riter/);
    expect(content).toMatch(/role:.*[Ee]ditor/);
  });

  it('should define agents with backstories', () => {
    const backstoryCount = (content.match(/backstory:/g) ?? []).length;
    expect(backstoryCount).toBeGreaterThanOrEqual(4);
  });

  it('should use expectedOutput for tasks', () => {
    const expectedOutputCount = (content.match(/expectedOutput:/g) ?? []).length;
    expect(expectedOutputCount).toBeGreaterThanOrEqual(4);
  });

  it('should define four tasks in the pipeline', () => {
    const taskIds = content.match(/id:\s*'(research|outline|write|edit)'/g) ?? [];
    expect(taskIds.length).toBeGreaterThanOrEqual(4);
  });

  it('should have sequential task dependencies forming a pipeline', () => {
    expect(content).toContain("dependencies: ['research']");
    expect(content).toContain("dependencies: ['outline']");
    expect(content).toContain("dependencies: ['write']");
  });
});

// ---------------------------------------------------------------------------
// Custom tools validation
// ---------------------------------------------------------------------------

describe('TASK-089: Content Generation Workflow — Custom Tools', () => {
  it('topicResearch tool should return research results', async () => {
    const tool = createTopicResearchTool();
    const result = await tool.execute({ topic: 'AI agents' });
    expect(result).toContain('Research on "AI agents"');
    expect(result).toContain('Source A');
  });

  it('topicResearch tool should accept depth parameter', async () => {
    const tool = createTopicResearchTool();
    const result = await tool.execute({ topic: 'AI agents', depth: 'detailed' });
    expect(result).toContain('[detailed]');
  });

  it('topicResearch tool should default to brief depth', async () => {
    const tool = createTopicResearchTool();
    const result = await tool.execute({ topic: 'testing' });
    expect(result).toContain('[brief]');
  });

  it('toneAnalyzer tool should return analysis', async () => {
    const tool = createToneAnalyzerTool();
    const result = await tool.execute({ text: 'This is a test sentence with several words.' });
    expect(result).toContain('Tone Analysis');
    expect(result).toContain('words');
    expect(result).toContain('readability');
  });

  it('toneAnalyzer tool should accept target tone', async () => {
    const tool = createToneAnalyzerTool();
    const result = await tool.execute({
      text: 'Hello world',
      targetTone: 'casual',
    });
    expect(result).toContain('casual');
  });

  it('toneAnalyzer tool should default to professional tone', async () => {
    const tool = createToneAnalyzerTool();
    const result = await tool.execute({ text: 'Some text' });
    expect(result).toContain('professional');
  });

  it('factCheck tool should detect statistical claims', async () => {
    const tool = createFactCheckTool();
    const result = await tool.execute({ content: 'Adoption grew 300% and accuracy improved 45%.' });
    expect(result).toContain('2 statistical claims');
  });

  it('factCheck tool should report zero claims when none present', async () => {
    const tool = createFactCheckTool();
    const result = await tool.execute({ content: 'No numbers here, just text.' });
    expect(result).toContain('0 statistical claims');
  });

  it('custom tools should have correct names', () => {
    const research = createTopicResearchTool();
    const tone = createToneAnalyzerTool();
    const factCheck = createFactCheckTool();
    expect(research.name).toBe('topicResearch');
    expect(tone.name).toBe('toneAnalyzer');
    expect(factCheck.name).toBe('factCheck');
  });
});

// ---------------------------------------------------------------------------
// Agent + tools integration
// ---------------------------------------------------------------------------

describe('TASK-089: Content Generation Workflow — Agent Tool Registration', () => {
  it('should register custom tools on the researcher agent', () => {
    const research = createTopicResearchTool();
    const agent = new Agent({
      id: 'researcher',
      role: 'Content Researcher',
      goal: 'Research topics',
      tools: [research],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('topicResearch')).toBe(true);
    expect(agent.tools.size).toBe(1);
  });

  it('should register editing tools on the editor agent', () => {
    const tone = createToneAnalyzerTool();
    const factCheck = createFactCheckTool();
    const fileToolBundle = createFileTools({ basePath: '.' });

    const agent = new Agent({
      id: 'editor',
      role: 'Content Editor',
      goal: 'Edit content',
      tools: [tone, factCheck, fileToolBundle.writeFile, fileToolBundle.readFile],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('toneAnalyzer')).toBe(true);
    expect(agent.hasTool('factCheck')).toBe(true);
    expect(agent.hasTool('writeFile')).toBe(true);
    expect(agent.hasTool('readFile')).toBe(true);
    expect(agent.tools.size).toBe(4);
  });

  it('should register file tools on the writer agent', () => {
    const fileToolBundle = createFileTools({ basePath: '.' });
    const agent = new Agent({
      id: 'writer',
      role: 'Content Writer',
      goal: 'Write articles',
      tools: [fileToolBundle.writeFile],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('writeFile')).toBe(true);
    expect(agent.tools.size).toBe(1);
  });

  it('outliner agent can work without tools', () => {
    const agent = new Agent({
      id: 'outliner',
      role: 'Content Strategist',
      goal: 'Create outlines',
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.tools.size).toBe(0);
  });

  it('should include custom tool descriptions in agent system prompt', () => {
    const research = createTopicResearchTool();
    const agent = new Agent({
      id: 'prompted-agent',
      role: 'Researcher',
      goal: 'Research topics',
      tools: [research],
      llmProvider: createMockLLMProvider(),
    });

    const systemPrompt = agent.buildSystemPrompt();
    expect(systemPrompt).toContain('Available tools');
    expect(systemPrompt).toContain('topicResearch');
  });
});

// ---------------------------------------------------------------------------
// Functional validation — content generation pipeline
// ---------------------------------------------------------------------------

describe('TASK-089: Content Generation Workflow — Functional Validation', () => {
  let researchAgent: Agent;
  let outlinerAgent: Agent;
  let writerAgent: Agent;
  let editorAgent: Agent;

  beforeEach(() => {
    const researchTool = createTopicResearchTool();
    const toneTool = createToneAnalyzerTool();
    const factTool = createFactCheckTool();
    const fileToolBundle = createFileTools({ basePath: '.' });

    researchAgent = new Agent({
      id: 'researcher',
      role: 'Content Researcher',
      goal: 'Research topics thoroughly',
      backstory: 'Expert researcher who finds authoritative sources.',
      tools: [researchTool],
      llmProvider: createMockLLMProvider(
        'Research findings: 1) AI agents grow 300% 2) Multi-agent is 40% better 3) Tool use reduces hallucination',
      ),
    });

    outlinerAgent = new Agent({
      id: 'outliner',
      role: 'Content Strategist',
      goal: 'Create structured outlines',
      backstory: 'Strategist who organizes research into compelling narratives.',
      llmProvider: createMockLLMProvider(
        '# Outline\n## 1. Introduction\n## 2. Key Findings\n## 3. Use Cases\n## 4. Conclusion',
      ),
    });

    writerAgent = new Agent({
      id: 'writer',
      role: 'Content Writer',
      goal: 'Write polished articles',
      backstory: 'Skilled writer who creates engaging content.',
      tools: [fileToolBundle.writeFile],
      llmProvider: createMockLLMProvider(
        '# The Rise of AI Agents\n\nEnterprise AI is evolving rapidly. AI agents now collaborate on complex tasks.\n\n## Conclusion\nThe future is multi-agent.',
      ),
    });

    editorAgent = new Agent({
      id: 'editor',
      role: 'Senior Content Editor',
      goal: 'Polish articles to publication quality',
      backstory: 'Meticulous editor with an eye for detail.',
      tools: [toneTool, factTool, fileToolBundle.writeFile, fileToolBundle.readFile],
      llmProvider: createMockLLMProvider(
        '# The Rise of AI Agents\n\n*Edited and polished for clarity.*\n\nEnterprise AI is evolving rapidly.\n\n---\nFinal version.',
      ),
    });
  });

  it('should run the full content generation pipeline end-to-end', async () => {
    const crew = new Crew({
      id: 'content-crew',
      name: 'Content Generation Crew',
      agents: [researchAgent, outlinerAgent, writerAgent, editorAgent],
      tasks: [
        {
          id: 'research',
          description: 'Research AI Agents in Enterprise',
          agentId: 'researcher',
        },
        {
          id: 'outline',
          description: 'Create article outline from research',
          agentId: 'outliner',
          dependencies: ['research'],
        },
        {
          id: 'write',
          description: 'Write the full article',
          agentId: 'writer',
          dependencies: ['outline'],
        },
        {
          id: 'edit',
          description: 'Edit and polish the article',
          agentId: 'editor',
          dependencies: ['write'],
        },
      ],
    });

    const result = await crew.run();

    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(4);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should execute tasks in dependency order', async () => {
    const executionOrder: string[] = [];

    const crew = new Crew({
      id: 'order-crew',
      agents: [researchAgent, outlinerAgent, writerAgent, editorAgent],
      tasks: [
        {
          id: 'research',
          description: 'Research the topic',
          agentId: 'researcher',
        },
        {
          id: 'outline',
          description: 'Create the outline',
          agentId: 'outliner',
          dependencies: ['research'],
        },
        {
          id: 'write',
          description: 'Write the article',
          agentId: 'writer',
          dependencies: ['outline'],
        },
        {
          id: 'edit',
          description: 'Edit the article',
          agentId: 'editor',
          dependencies: ['write'],
        },
      ],
    });

    crew.on('crew:task:start', (_crewId, taskId) => {
      executionOrder.push(taskId);
    });

    await crew.run();

    expect(executionOrder).toEqual(['research', 'outline', 'write', 'edit']);
  });

  it('should pass upstream outputs as context to downstream tasks', async () => {
    let outlinerMessages: readonly LLMMessage[] = [];

    const outlinerWithCapture = new Agent({
      id: 'outliner',
      role: 'Content Strategist',
      goal: 'Create outlines',
      llmProvider: {
        name: 'capture-provider',
        async generateText(messages: readonly LLMMessage[]): Promise<LLMResponse> {
          outlinerMessages = messages;
          return {
            content: '# Outline\n## Section 1\n## Section 2',
            tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            finishReason: 'stop',
          };
        },
      },
    });

    const crew = new Crew({
      id: 'context-crew',
      agents: [researchAgent, outlinerWithCapture, writerAgent, editorAgent],
      tasks: [
        {
          id: 'research',
          description: 'Research AI agents',
          agentId: 'researcher',
        },
        {
          id: 'outline',
          description: 'Create outline from research',
          agentId: 'outliner',
          dependencies: ['research'],
        },
        {
          id: 'write',
          description: 'Write the article',
          agentId: 'writer',
          dependencies: ['outline'],
        },
        {
          id: 'edit',
          description: 'Edit the article',
          agentId: 'editor',
          dependencies: ['write'],
        },
      ],
    });

    await crew.run();

    const allContent = outlinerMessages.map((m) => m.content).join(' ');
    expect(allContent).toContain('Research findings');
  });

  it('should produce output for each task in the pipeline', async () => {
    const crew = new Crew({
      id: 'output-crew',
      agents: [researchAgent, outlinerAgent, writerAgent, editorAgent],
      tasks: [
        { id: 'research', description: 'Research', agentId: 'researcher' },
        { id: 'outline', description: 'Outline', agentId: 'outliner', dependencies: ['research'] },
        { id: 'write', description: 'Write', agentId: 'writer', dependencies: ['outline'] },
        { id: 'edit', description: 'Edit', agentId: 'editor', dependencies: ['write'] },
      ],
    });

    const result = await crew.run();

    for (const [, taskResult] of result.taskResults) {
      expect(taskResult.output).toBeTruthy();
      expect(taskResult.output.length).toBeGreaterThan(0);
    }
  });

  it('should track token usage across all tasks', async () => {
    const crew = new Crew({
      id: 'token-crew',
      agents: [researchAgent, outlinerAgent, writerAgent, editorAgent],
      tasks: [
        { id: 'research', description: 'Research', agentId: 'researcher' },
        { id: 'outline', description: 'Outline', agentId: 'outliner', dependencies: ['research'] },
        { id: 'write', description: 'Write', agentId: 'writer', dependencies: ['outline'] },
        { id: 'edit', description: 'Edit', agentId: 'editor', dependencies: ['write'] },
      ],
    });

    const result = await crew.run();

    for (const [, taskResult] of result.taskResults) {
      expect(taskResult.tokenUsage).toBeDefined();
      expect(taskResult.tokenUsage!.totalTokens).toBeGreaterThan(0);
    }
  });

  it('should emit lifecycle events for all four tasks', async () => {
    const startedTasks: string[] = [];
    const completedTasks: string[] = [];

    const crew = new Crew({
      id: 'event-crew',
      agents: [researchAgent, outlinerAgent, writerAgent, editorAgent],
      tasks: [
        { id: 'research', description: 'Research', agentId: 'researcher' },
        { id: 'outline', description: 'Outline', agentId: 'outliner', dependencies: ['research'] },
        { id: 'write', description: 'Write', agentId: 'writer', dependencies: ['outline'] },
        { id: 'edit', description: 'Edit', agentId: 'editor', dependencies: ['write'] },
      ],
    });

    crew.on('crew:task:start', (_crewId, taskId) => {
      startedTasks.push(taskId);
    });

    crew.on('crew:task:complete', (_crewId, taskId) => {
      completedTasks.push(taskId);
    });

    await crew.run();

    expect(startedTasks).toEqual(['research', 'outline', 'write', 'edit']);
    expect(completedTasks).toEqual(['research', 'outline', 'write', 'edit']);
  });

  it('should assign the correct agent to each task', async () => {
    const taskAgentPairs: Array<[string, string]> = [];

    const crew = new Crew({
      id: 'agent-assignment-crew',
      agents: [researchAgent, outlinerAgent, writerAgent, editorAgent],
      tasks: [
        { id: 'research', description: 'Research', agentId: 'researcher' },
        { id: 'outline', description: 'Outline', agentId: 'outliner', dependencies: ['research'] },
        { id: 'write', description: 'Write', agentId: 'writer', dependencies: ['outline'] },
        { id: 'edit', description: 'Edit', agentId: 'editor', dependencies: ['write'] },
      ],
    });

    crew.on('crew:task:start', (_crewId, taskId, agentId) => {
      taskAgentPairs.push([taskId, agentId]);
    });

    await crew.run();

    expect(taskAgentPairs).toEqual([
      ['research', 'researcher'],
      ['outline', 'outliner'],
      ['write', 'writer'],
      ['edit', 'editor'],
    ]);
  });
});
