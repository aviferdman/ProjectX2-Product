/**
 * Tests for TASK-085: Research Crew Example
 *
 * Validates the research crew example file and that the multi-agent
 * research workflow with web + file tools works end-to-end.
 */

import { describe, it, expect, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
import { CrewStatus } from '../../src/types/crew.js';
import { ToolCategory, ToolPermission } from '../../src/types/tool.js';
import { createWebTools } from '../../src/tools/web/index.js';
import { createFileTools } from '../../src/tools/file/index.js';
import type { LLMProvider, LLMResponse, LLMMessage, Tool } from '../../src/types/index.js';

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

function createMockTool(name: string, category?: ToolCategory): Tool {
  return {
    name,
    description: `Mock ${name} tool`,
    category,
    execute: vi.fn<(input: unknown) => Promise<unknown>>().mockResolvedValue({ success: true }),
  };
}

// ---------------------------------------------------------------------------
// Example file validation
// ---------------------------------------------------------------------------

describe('TASK-085: Research Crew — Example File', () => {
  const examplePath = join(EXAMPLES_DIR, 'research-crew.ts');
  let content: string;

  it('should exist at examples/research-crew.ts', () => {
    expect(existsSync(examplePath)).toBe(true);
    content = readFileSync(examplePath, 'utf-8');
  });

  it('should include a file header comment', () => {
    expect(content).toMatch(/^\/\*\*/);
  });

  it('should include usage instructions in header', () => {
    expect(content).toContain('npx tsx examples/research-crew.ts');
  });

  it('should mention mock provider replacement', () => {
    expect(content).toMatch(/[Rr]eplace.*real provider|[Mm]ock.*provider/);
  });

  describe('Imports', () => {
    it('should import Agent and Crew from @crewspace/core', () => {
      expect(content).toContain('Agent');
      expect(content).toContain('Crew');
      expect(content).toContain('@crewspace/core');
    });

    it('should import createWebTools', () => {
      expect(content).toContain('createWebTools');
    });

    it('should import createFileTools', () => {
      expect(content).toContain('createFileTools');
    });

    it('should import LLM types', () => {
      expect(content).toContain('LLMProvider');
      expect(content).toContain('LLMMessage');
      expect(content).toContain('LLMResponse');
    });
  });

  describe('Agents', () => {
    it('should create at least three agents', () => {
      const agentCreations = content.match(/new Agent\(/g) ?? [];
      expect(agentCreations.length).toBeGreaterThanOrEqual(3);
    });

    it('should have a researcher agent', () => {
      expect(content).toMatch(/id:\s*['"]researcher['"]/);
    });

    it('should have an analyst agent', () => {
      expect(content).toMatch(/id:\s*['"]analyst['"]/);
    });

    it('should have a writer agent', () => {
      expect(content).toMatch(/id:\s*['"]writer['"]/);
    });

    it('should assign web tools to researcher', () => {
      expect(content).toContain('webTools.webSearch');
    });

    it('should assign web tools to analyst', () => {
      expect(content).toContain('webTools.fetchUrl');
      expect(content).toContain('webTools.parseHtml');
    });

    it('should assign file tools to writer', () => {
      expect(content).toContain('fileTools.writeFile');
    });
  });

  describe('Crew Configuration', () => {
    it('should create a Crew', () => {
      expect(content).toContain('new Crew');
    });

    it('should call crew.run() or researchCrew.run()', () => {
      expect(content).toMatch(/\.run\(\)/);
    });

    it('should have task dependencies', () => {
      expect(content).toContain('dependencies');
    });

    it('should define at least 3 tasks', () => {
      const taskIdMatches = content.match(/id:\s*'[^']+',\s*\n\s*description:/g) ?? [];
      expect(taskIdMatches.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Events and Output', () => {
    it('should subscribe to crew lifecycle events', () => {
      expect(content).toContain("'crew:task:start'");
      expect(content).toContain("'crew:task:complete'");
    });

    it('should display results', () => {
      expect(content).toContain('result.success');
      expect(content).toContain('result.taskResults');
    });

    it('should show token usage', () => {
      expect(content).toContain('tokenUsage');
    });
  });
});

// ---------------------------------------------------------------------------
// Web tools validation
// ---------------------------------------------------------------------------

describe('TASK-085: Research Crew — Web Tools', () => {
  it('should create web tools bundle', () => {
    const tools = createWebTools();
    expect(tools.webSearch).toBeDefined();
    expect(tools.fetchUrl).toBeDefined();
    expect(tools.parseHtml).toBeDefined();
  });

  it('webSearch tool should have correct metadata', () => {
    const tools = createWebTools();
    expect(tools.webSearch.name).toBe('webSearch');
    expect(tools.webSearch.category).toBe(ToolCategory.WEB);
    expect(tools.webSearch.permissions).toContain(ToolPermission.NETWORK);
  });

  it('fetchUrl tool should have correct metadata', () => {
    const tools = createWebTools();
    expect(tools.fetchUrl.name).toBe('fetchUrl');
    expect(tools.fetchUrl.category).toBe(ToolCategory.WEB);
    expect(tools.fetchUrl.permissions).toContain(ToolPermission.NETWORK);
  });

  it('parseHtml tool should have correct metadata', () => {
    const tools = createWebTools();
    expect(tools.parseHtml.name).toBe('parseHtml');
    expect(tools.parseHtml.category).toBe(ToolCategory.WEB);
  });

  it('should accept custom options', () => {
    const tools = createWebTools({ timeoutMs: 5000 });
    expect(tools.webSearch).toBeDefined();
    expect(tools.fetchUrl).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// File tools validation
// ---------------------------------------------------------------------------

describe('TASK-085: Research Crew — File Tools', () => {
  it('should create file tools bundle', () => {
    const tools = createFileTools();
    expect(tools.readFile).toBeDefined();
    expect(tools.writeFile).toBeDefined();
    expect(tools.listFiles).toBeDefined();
  });

  it('readFile tool should have correct metadata', () => {
    const tools = createFileTools();
    expect(tools.readFile.name).toBe('readFile');
    expect(tools.readFile.category).toBe(ToolCategory.FILE);
    expect(tools.readFile.permissions).toContain(ToolPermission.FILE_READ);
  });

  it('writeFile tool should have correct metadata', () => {
    const tools = createFileTools();
    expect(tools.writeFile.name).toBe('writeFile');
    expect(tools.writeFile.category).toBe(ToolCategory.FILE);
    expect(tools.writeFile.permissions).toContain(ToolPermission.FILE_WRITE);
  });

  it('listFiles tool should have correct metadata', () => {
    const tools = createFileTools();
    expect(tools.listFiles.name).toBe('listFiles');
    expect(tools.listFiles.category).toBe(ToolCategory.FILE);
    expect(tools.listFiles.permissions).toContain(ToolPermission.FILE_READ);
  });

  it('should accept custom basePath', () => {
    const tools = createFileTools({ basePath: '/tmp/test' });
    expect(tools.readFile).toBeDefined();
    expect(tools.writeFile).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Functional validation — research crew workflow
// ---------------------------------------------------------------------------

describe('TASK-085: Research Crew — Functional Validation', () => {
  it('should run a three-agent research crew end-to-end', async () => {
    const researcher = new Agent({
      id: 'researcher',
      role: 'Web Research Specialist',
      goal: 'Find relevant information on a topic',
      tools: [createMockTool('webSearch', ToolCategory.WEB)],
      llmProvider: createMockLLMProvider('Top 5 AI trends: agents, SLMs, RAG, codegen, multimodal'),
    });

    const analyst = new Agent({
      id: 'analyst',
      role: 'Data Analyst',
      goal: 'Analyze and structure research findings',
      tools: [
        createMockTool('fetchUrl', ToolCategory.WEB),
        createMockTool('parseHtml', ToolCategory.WEB),
      ],
      llmProvider: createMockLLMProvider('Key insight: multi-agent systems are transformative'),
    });

    const writer = new Agent({
      id: 'writer',
      role: 'Technical Report Writer',
      goal: 'Write and save a comprehensive report',
      tools: [
        createMockTool('writeFile', ToolCategory.FILE),
        createMockTool('readFile', ToolCategory.FILE),
      ],
      llmProvider: createMockLLMProvider('# AI Trends Report 2026\n\nMulti-agent systems lead.'),
    });

    const crew = new Crew({
      id: 'research-crew',
      agents: [researcher, analyst, writer],
      tasks: [
        {
          id: 'search',
          description: 'Search for AI trends',
          agentId: 'researcher',
          expectedOutput: 'List of trends with sources',
        },
        {
          id: 'analyze',
          description: 'Analyze the research findings',
          agentId: 'analyst',
          dependencies: ['search'],
          expectedOutput: 'Structured insights',
        },
        {
          id: 'write-report',
          description: 'Write and save the final report',
          agentId: 'writer',
          dependencies: ['analyze'],
          expectedOutput: 'Markdown report saved to file',
        },
      ],
    });

    const result = await crew.run();

    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(3);
    expect(result.taskResults.get('search')?.agentId).toBe('researcher');
    expect(result.taskResults.get('analyze')?.agentId).toBe('analyst');
    expect(result.taskResults.get('write-report')?.agentId).toBe('writer');
  });

  it('should execute tasks in dependency order', async () => {
    const executionOrder: string[] = [];

    const researcher = new Agent({
      id: 'researcher',
      role: 'Researcher',
      goal: 'Research',
      llmProvider: createMockLLMProvider('Research results'),
    });

    const analyst = new Agent({
      id: 'analyst',
      role: 'Analyst',
      goal: 'Analyze',
      llmProvider: createMockLLMProvider('Analysis results'),
    });

    const writer = new Agent({
      id: 'writer',
      role: 'Writer',
      goal: 'Write',
      llmProvider: createMockLLMProvider('Written report'),
    });

    const crew = new Crew({
      id: 'order-crew',
      agents: [researcher, analyst, writer],
      tasks: [
        { id: 'search', description: 'Search', agentId: 'researcher' },
        { id: 'analyze', description: 'Analyze', agentId: 'analyst', dependencies: ['search'] },
        {
          id: 'write-report',
          description: 'Write',
          agentId: 'writer',
          dependencies: ['analyze'],
        },
      ],
    });

    crew.on('crew:task:start', (_crewId, taskId) => {
      executionOrder.push(taskId);
    });

    await crew.run();

    expect(executionOrder).toEqual(['search', 'analyze', 'write-report']);
  });

  it('should pass dependency results through the chain', async () => {
    let analystMessages: readonly LLMMessage[] = [];
    let writerMessages: readonly LLMMessage[] = [];

    const researcherProvider = createMockLLMProvider('Found 5 AI trends with sources');

    const analystProvider: LLMProvider = {
      name: 'analyst-provider',
      generateText: vi
        .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
        .mockImplementation(async (messages) => {
          analystMessages = messages;
          return {
            content: 'Structured analysis of trends',
            tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            finishReason: 'stop',
          };
        }),
    };

    const writerProvider: LLMProvider = {
      name: 'writer-provider',
      generateText: vi
        .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
        .mockImplementation(async (messages) => {
          writerMessages = messages;
          return {
            content: '# Final Report',
            tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            finishReason: 'stop',
          };
        }),
    };

    const researcher = new Agent({
      id: 'researcher',
      role: 'Researcher',
      goal: 'Research',
      llmProvider: researcherProvider,
    });

    const analyst = new Agent({
      id: 'analyst',
      role: 'Analyst',
      goal: 'Analyze',
      llmProvider: analystProvider,
    });

    const writer = new Agent({
      id: 'writer',
      role: 'Writer',
      goal: 'Write',
      llmProvider: writerProvider,
    });

    const crew = new Crew({
      id: 'chain-crew',
      agents: [researcher, analyst, writer],
      tasks: [
        { id: 'search', description: 'Search for AI trends', agentId: 'researcher' },
        {
          id: 'analyze',
          description: 'Analyze the findings',
          agentId: 'analyst',
          dependencies: ['search'],
        },
        {
          id: 'write-report',
          description: 'Write the final report',
          agentId: 'writer',
          dependencies: ['analyze'],
        },
      ],
    });

    await crew.run();

    // Analyst should receive researcher's output
    const analystUserMsg = analystMessages.find((m) => m.role === 'user');
    expect(analystUserMsg?.content).toContain('Found 5 AI trends with sources');

    // Writer should receive analyst's output
    const writerUserMsg = writerMessages.find((m) => m.role === 'user');
    expect(writerUserMsg?.content).toContain('Structured analysis of trends');
  });

  it('should emit all crew lifecycle events', async () => {
    const events: string[] = [];

    const researcher = new Agent({
      id: 'researcher',
      role: 'Researcher',
      goal: 'Research',
      llmProvider: createMockLLMProvider('Research output'),
    });

    const analyst = new Agent({
      id: 'analyst',
      role: 'Analyst',
      goal: 'Analyze',
      llmProvider: createMockLLMProvider('Analysis output'),
    });

    const crew = new Crew({
      id: 'events-crew',
      agents: [researcher, analyst],
      tasks: [
        { id: 'search', description: 'Search', agentId: 'researcher' },
        { id: 'analyze', description: 'Analyze', agentId: 'analyst', dependencies: ['search'] },
      ],
    });

    crew.on('crew:start', () => events.push('crew:start'));
    crew.on('crew:task:start', (_crewId, taskId) => events.push(`task:start:${taskId}`));
    crew.on('crew:task:complete', (_crewId, taskId) => events.push(`task:complete:${taskId}`));
    crew.on('crew:complete', () => events.push('crew:complete'));

    await crew.run();

    expect(events).toEqual([
      'crew:start',
      'task:start:search',
      'task:complete:search',
      'task:start:analyze',
      'task:complete:analyze',
      'crew:complete',
    ]);
  });

  it('should report correct crew status after completion', async () => {
    const agent = new Agent({
      id: 'researcher',
      role: 'Researcher',
      goal: 'Research',
      llmProvider: createMockLLMProvider('Done'),
    });

    const crew = new Crew({
      id: 'status-crew',
      agents: [agent],
      tasks: [{ id: 'search', description: 'Search', agentId: 'researcher' }],
    });

    expect(crew.status).toBe(CrewStatus.IDLE);
    await crew.run();
    expect(crew.status).toBe(CrewStatus.COMPLETED);
  });

  it('should track duration and token usage for each task', async () => {
    const researcher = new Agent({
      id: 'researcher',
      role: 'Researcher',
      goal: 'Research',
      llmProvider: createMockLLMProvider('Results'),
    });

    const writer = new Agent({
      id: 'writer',
      role: 'Writer',
      goal: 'Write',
      llmProvider: createMockLLMProvider('Report'),
    });

    const crew = new Crew({
      id: 'metrics-crew',
      agents: [researcher, writer],
      tasks: [
        { id: 'search', description: 'Search', agentId: 'researcher' },
        { id: 'write', description: 'Write', agentId: 'writer', dependencies: ['search'] },
      ],
    });

    const result = await crew.run();

    expect(result.duration).toBeGreaterThanOrEqual(0);

    for (const [, taskResult] of result.taskResults) {
      expect(taskResult.duration).toBeGreaterThanOrEqual(0);
      expect(taskResult.tokenUsage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
    }
  });

  it('should support agents with tools registered', async () => {
    const mockWebSearch = createMockTool('webSearch', ToolCategory.WEB);
    const mockWriteFile = createMockTool('writeFile', ToolCategory.FILE);

    const researcher = new Agent({
      id: 'researcher',
      role: 'Researcher',
      goal: 'Research',
      tools: [mockWebSearch],
      llmProvider: createMockLLMProvider('Research with tools'),
    });

    const writer = new Agent({
      id: 'writer',
      role: 'Writer',
      goal: 'Write',
      tools: [mockWriteFile],
      llmProvider: createMockLLMProvider('Written report'),
    });

    expect(researcher.hasTool('webSearch')).toBe(true);
    expect(writer.hasTool('writeFile')).toBe(true);

    const crew = new Crew({
      id: 'tools-crew',
      agents: [researcher, writer],
      tasks: [
        { id: 'search', description: 'Search', agentId: 'researcher' },
        { id: 'write', description: 'Write', agentId: 'writer', dependencies: ['search'] },
      ],
    });

    const result = await crew.run();
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('TASK-085: Research Crew — Edge Cases', () => {
  it('should handle a single-agent crew with tools', async () => {
    const agent = new Agent({
      id: 'solo-researcher',
      role: 'Solo Researcher',
      goal: 'Do everything',
      tools: [
        createMockTool('webSearch', ToolCategory.WEB),
        createMockTool('writeFile', ToolCategory.FILE),
      ],
      llmProvider: createMockLLMProvider('Solo research complete'),
    });

    const crew = new Crew({
      id: 'solo-crew',
      agents: [agent],
      tasks: [{ id: 'research-all', description: 'Research and write', agentId: 'solo-researcher' }],
    });

    const result = await crew.run();
    expect(result.success).toBe(true);
    expect(result.taskResults.get('research-all')?.output).toBe('Solo research complete');
  });

  it('should include tool descriptions in agent system prompt', () => {
    const agent = new Agent({
      id: 'tool-agent',
      role: 'Researcher',
      goal: 'Use tools effectively',
      tools: [
        createMockTool('webSearch', ToolCategory.WEB),
        createMockTool('fetchUrl', ToolCategory.WEB),
      ],
      llmProvider: createMockLLMProvider('Done'),
    });

    const systemPrompt = agent.buildSystemPrompt();
    expect(systemPrompt).toContain('webSearch');
    expect(systemPrompt).toContain('fetchUrl');
  });

  it('should handle agents with multiple tools from different categories', async () => {
    const agent = new Agent({
      id: 'multi-tool',
      role: 'Jack of All Trades',
      goal: 'Use multiple tool types',
      tools: [
        createMockTool('webSearch', ToolCategory.WEB),
        createMockTool('readFile', ToolCategory.FILE),
      ],
      llmProvider: createMockLLMProvider('Used multiple tools'),
    });

    expect(agent.hasTool('webSearch')).toBe(true);
    expect(agent.hasTool('readFile')).toBe(true);
    expect(agent.tools.size).toBe(2);

    const result = await agent.execute({ description: 'Use both tools' });
    expect(result.output).toBe('Used multiple tools');
  });

  it('should handle long dependency chains gracefully', async () => {
    const agents = ['step1', 'step2', 'step3', 'step4'].map(
      (id) =>
        new Agent({
          id,
          role: `Agent ${id}`,
          goal: `Execute ${id}`,
          llmProvider: createMockLLMProvider(`Output from ${id}`),
        }),
    );

    const crew = new Crew({
      id: 'long-chain',
      agents,
      tasks: [
        { id: 'task1', description: 'Step 1', agentId: 'step1' },
        { id: 'task2', description: 'Step 2', agentId: 'step2', dependencies: ['task1'] },
        { id: 'task3', description: 'Step 3', agentId: 'step3', dependencies: ['task2'] },
        { id: 'task4', description: 'Step 4', agentId: 'step4', dependencies: ['task3'] },
      ],
    });

    const result = await crew.run();
    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(4);

    const executionOrder: string[] = [];
    crew.reset();
    crew.on('crew:task:start', (_crewId, taskId) => executionOrder.push(taskId));
    await crew.run();
    expect(executionOrder).toEqual(['task1', 'task2', 'task3', 'task4']);
  });
});
