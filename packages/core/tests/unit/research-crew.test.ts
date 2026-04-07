/**
 * Tests for TASK-085: Research Crew Example (Web + File Tools)
 *
 * Validates the research crew example file, its structure, and that the
 * multi-agent research workflow with web and file tools works end-to-end.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
import { createWebTools } from '../../src/tools/web/index.js';
import { createFileTools } from '../../src/tools/file/index.js';
import { ToolCategory, ToolPermission } from '../../src/types/tool.js';
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

  it('should import Agent and Crew from @crewspace/core', () => {
    expect(content).toContain('Agent');
    expect(content).toContain('Crew');
    expect(content).toContain("from '@crewspace/core'");
  });

  it('should import createWebTools from @crewspace/core', () => {
    expect(content).toContain('createWebTools');
  });

  it('should import createFileTools from @crewspace/core', () => {
    expect(content).toContain('createFileTools');
  });

  it('should create at least three agents', () => {
    const agentCreations = content.match(/new Agent\(/g) ?? [];
    expect(agentCreations.length).toBeGreaterThanOrEqual(3);
  });

  it('should create a Crew', () => {
    expect(content).toContain('new Crew');
  });

  it('should call crew.run() or researchCrew.run()', () => {
    expect(content).toMatch(/\.run\(\)/);
  });

  it('should demonstrate task dependencies', () => {
    expect(content).toContain('dependencies');
  });

  it('should assign web tools to agents', () => {
    expect(content).toContain('webTools.webSearch');
    expect(content).toContain('webTools.fetchUrl');
  });

  it('should assign file tools to agents', () => {
    expect(content).toContain('fileTools.writeFile');
    expect(content).toContain('fileTools.readFile');
  });

  it('should show lifecycle event subscription', () => {
    expect(content).toContain(".on('crew:");
  });

  it('should include usage instructions in header', () => {
    expect(content).toContain('npx tsx examples/research-crew.ts');
  });

  it('should mention mock provider replacement', () => {
    expect(content).toMatch(/[Rr]eplace.*real provider|[Mm]ock.*provider/);
  });

  it('should define agents with distinct roles', () => {
    expect(content).toMatch(/role:.*[Rr]esearch/);
    expect(content).toMatch(/role:.*[Aa]nalyst/);
    expect(content).toMatch(/role:.*[Ww]riter/);
  });

  it('should define agents with backstories', () => {
    const backstoryCount = (content.match(/backstory:/g) ?? []).length;
    expect(backstoryCount).toBeGreaterThanOrEqual(3);
  });

  it('should use expectedOutput for tasks', () => {
    const expectedOutputCount = (content.match(/expectedOutput:/g) ?? []).length;
    expect(expectedOutputCount).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Web tools integration
// ---------------------------------------------------------------------------

describe('TASK-085: Research Crew — Web Tools', () => {
  it('should create web tools bundle with all three tools', () => {
    const tools = createWebTools();
    expect(tools.webSearch).toBeDefined();
    expect(tools.fetchUrl).toBeDefined();
    expect(tools.parseHtml).toBeDefined();
  });

  it('web tools should have correct names', () => {
    const tools = createWebTools();
    expect(tools.webSearch.name).toBe('webSearch');
    expect(tools.fetchUrl.name).toBe('fetchUrl');
    expect(tools.parseHtml.name).toBe('parseHtml');
  });

  it('web tools should have WEB category', () => {
    const tools = createWebTools();
    expect(tools.webSearch.category).toBe(ToolCategory.WEB);
    expect(tools.fetchUrl.category).toBe(ToolCategory.WEB);
    expect(tools.parseHtml.category).toBe(ToolCategory.WEB);
  });

  it('web search and fetch should require NETWORK permission', () => {
    const tools = createWebTools();
    expect(tools.webSearch.permissions).toContain(ToolPermission.NETWORK);
    expect(tools.fetchUrl.permissions).toContain(ToolPermission.NETWORK);
  });

  it('should accept custom options', () => {
    const tools = createWebTools({ timeoutMs: 5000, userAgent: 'TestAgent/1.0' });
    expect(tools.webSearch).toBeDefined();
    expect(tools.fetchUrl).toBeDefined();
  });

  it('parseHtml should extract text from HTML', async () => {
    const tools = createWebTools();
    const result = (await tools.parseHtml.execute({
      html: '<html><body><h1>Hello</h1><p>World</p></body></html>',
      extract: 'text',
    })) as { text: string };
    expect(result.text).toContain('Hello');
    expect(result.text).toContain('World');
  });

  it('parseHtml should extract links from HTML', async () => {
    const tools = createWebTools();
    const result = (await tools.parseHtml.execute({
      html: '<html><body><a href="https://example.com">Example</a></body></html>',
      extract: 'links',
    })) as { links: Array<{ text: string; href: string }> };
    expect(result.links).toHaveLength(1);
    expect(result.links[0].href).toBe('https://example.com');
    expect(result.links[0].text).toBe('Example');
  });

  it('parseHtml should extract metadata from HTML', async () => {
    const tools = createWebTools();
    const result = (await tools.parseHtml.execute({
      html: '<html><head><title>Test Page</title><meta name="description" content="A test page"></head><body></body></html>',
      extract: 'metadata',
    })) as { metadata: { title: string; description: string } };
    expect(result.metadata.title).toBe('Test Page');
    expect(result.metadata.description).toBe('A test page');
  });
});

// ---------------------------------------------------------------------------
// File tools integration
// ---------------------------------------------------------------------------

describe('TASK-085: Research Crew — File Tools', () => {
  it('should create file tools bundle with all three tools', () => {
    const tools = createFileTools({ basePath: '.' });
    expect(tools.readFile).toBeDefined();
    expect(tools.writeFile).toBeDefined();
    expect(tools.listFiles).toBeDefined();
  });

  it('file tools should have correct names', () => {
    const tools = createFileTools({ basePath: '.' });
    expect(tools.readFile.name).toBe('readFile');
    expect(tools.writeFile.name).toBe('writeFile');
    expect(tools.listFiles.name).toBe('listFiles');
  });

  it('file tools should have FILE category', () => {
    const tools = createFileTools({ basePath: '.' });
    expect(tools.readFile.category).toBe(ToolCategory.FILE);
    expect(tools.writeFile.category).toBe(ToolCategory.FILE);
    expect(tools.listFiles.category).toBe(ToolCategory.FILE);
  });

  it('file tools should have correct permissions', () => {
    const tools = createFileTools({ basePath: '.' });
    expect(tools.readFile.permissions).toContain(ToolPermission.FILE_READ);
    expect(tools.writeFile.permissions).toContain(ToolPermission.FILE_WRITE);
    expect(tools.listFiles.permissions).toContain(ToolPermission.FILE_READ);
  });

  it('should accept basePath option', () => {
    const tools = createFileTools({ basePath: '/tmp/test-research' });
    expect(tools.readFile).toBeDefined();
    expect(tools.writeFile).toBeDefined();
    expect(tools.listFiles).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Agent + tools integration
// ---------------------------------------------------------------------------

describe('TASK-085: Research Crew — Agent Tool Registration', () => {
  it('should register web tools on an agent via constructor', () => {
    const tools = createWebTools();
    const agent = new Agent({
      id: 'web-agent',
      role: 'Web Researcher',
      goal: 'Search the web',
      tools: [tools.webSearch, tools.fetchUrl],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('webSearch')).toBe(true);
    expect(agent.hasTool('fetchUrl')).toBe(true);
    expect(agent.tools.size).toBe(2);
  });

  it('should register file tools on an agent via constructor', () => {
    const tools = createFileTools({ basePath: '.' });
    const agent = new Agent({
      id: 'file-agent',
      role: 'File Manager',
      goal: 'Manage files',
      tools: [tools.readFile, tools.writeFile, tools.listFiles],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('readFile')).toBe(true);
    expect(agent.hasTool('writeFile')).toBe(true);
    expect(agent.hasTool('listFiles')).toBe(true);
    expect(agent.tools.size).toBe(3);
  });

  it('should register mixed web and file tools on an agent', () => {
    const webToolBundle = createWebTools();
    const fileToolBundle = createFileTools({ basePath: '.' });

    const agent = new Agent({
      id: 'mixed-agent',
      role: 'Research Analyst',
      goal: 'Research and save findings',
      tools: [webToolBundle.parseHtml, fileToolBundle.readFile, fileToolBundle.listFiles],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('parseHtml')).toBe(true);
    expect(agent.hasTool('readFile')).toBe(true);
    expect(agent.hasTool('listFiles')).toBe(true);
    expect(agent.tools.size).toBe(3);
  });

  it('should include tool descriptions in agent system prompt', () => {
    const webToolBundle = createWebTools();
    const agent = new Agent({
      id: 'prompted-agent',
      role: 'Researcher',
      goal: 'Research topics',
      tools: [webToolBundle.webSearch, webToolBundle.fetchUrl],
      llmProvider: createMockLLMProvider(),
    });

    const systemPrompt = agent.buildSystemPrompt();
    expect(systemPrompt).toContain('Available tools');
    expect(systemPrompt).toContain('webSearch');
    expect(systemPrompt).toContain('fetchUrl');
  });

  it('should allow adding tools after construction', () => {
    const webToolBundle = createWebTools();
    const fileToolBundle = createFileTools({ basePath: '.' });

    const agent = new Agent({
      id: 'addtool-agent',
      role: 'Worker',
      goal: 'Do work',
      tools: [webToolBundle.webSearch],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.tools.size).toBe(1);
    agent.addTool(fileToolBundle.writeFile);
    expect(agent.tools.size).toBe(2);
    expect(agent.hasTool('writeFile')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Functional validation — research crew workflow
// ---------------------------------------------------------------------------

describe('TASK-085: Research Crew — Functional Validation', () => {
  let researcher: Agent;
  let analyst: Agent;
  let reportWriter: Agent;

  beforeEach(() => {
    const webToolBundle = createWebTools();
    const fileToolBundle = createFileTools({ basePath: '.' });

    researcher = new Agent({
      id: 'researcher',
      role: 'Web Research Specialist',
      goal: 'Search the web and gather relevant sources',
      backstory: 'Expert at finding authoritative sources using web search.',
      tools: [webToolBundle.webSearch, webToolBundle.fetchUrl],
      llmProvider: createMockLLMProvider(
        'Found 3 sources: arxiv.org, blog.example.com, research.example.com',
      ),
    });

    analyst = new Agent({
      id: 'analyst',
      role: 'Content Analyst',
      goal: 'Analyze web content and extract key insights',
      backstory: 'Meticulous analyst who extracts structured insights.',
      tools: [webToolBundle.parseHtml, fileToolBundle.readFile, fileToolBundle.listFiles],
      llmProvider: createMockLLMProvider(
        'Key findings: 1) Agents are production-ready 2) Multi-agent is 40% better 3) Tools reduce hallucination',
      ),
    });

    reportWriter = new Agent({
      id: 'writer',
      role: 'Technical Report Writer',
      goal: 'Compile findings into a well-structured report',
      backstory: 'Skilled writer producing clear reports.',
      tools: [fileToolBundle.writeFile, fileToolBundle.listFiles],
      llmProvider: createMockLLMProvider(
        '# Research Report\n\n## Findings\n1. Agents are production-ready\n2. Multi-agent outperforms single\n3. Tool use reduces errors',
      ),
    });
  });

  it('should run the full research crew workflow end-to-end', async () => {
    const crew = new Crew({
      id: 'research-crew',
      name: 'AI Research Crew',
      agents: [researcher, analyst, reportWriter],
      tasks: [
        {
          id: 'search',
          description: 'Search for AI agents 2026',
          agentId: 'researcher',
        },
        {
          id: 'analyze',
          description: 'Analyze the search results',
          agentId: 'analyst',
          dependencies: ['search'],
        },
        {
          id: 'write-report',
          description: 'Write a comprehensive report',
          agentId: 'writer',
          dependencies: ['analyze'],
        },
      ],
    });

    const result = await crew.run();

    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(3);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should execute tasks in dependency order', async () => {
    const executionOrder: string[] = [];

    const crew = new Crew({
      id: 'order-crew',
      agents: [researcher, analyst, reportWriter],
      tasks: [
        {
          id: 'search',
          description: 'Search for topic',
          agentId: 'researcher',
        },
        {
          id: 'analyze',
          description: 'Analyze sources',
          agentId: 'analyst',
          dependencies: ['search'],
        },
        {
          id: 'write-report',
          description: 'Write the report',
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

  it('should pass upstream outputs as context to downstream tasks', async () => {
    let analyzerMessages: readonly LLMMessage[] = [];

    const analyzerProvider: LLMProvider = {
      name: 'analyzer-provider',
      generateText: vi
        .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
        .mockImplementation(async (messages) => {
          analyzerMessages = messages;
          return {
            content: 'Analysis complete',
            tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            finishReason: 'stop',
          };
        }),
    };

    const fileToolBundle = createFileTools({ basePath: '.' });
    const webToolBundle = createWebTools();
    const customAnalyst = new Agent({
      id: 'analyst',
      role: 'Analyst',
      goal: 'Analyze content',
      tools: [webToolBundle.parseHtml, fileToolBundle.readFile],
      llmProvider: analyzerProvider,
    });

    const crew = new Crew({
      id: 'context-crew',
      agents: [researcher, customAnalyst, reportWriter],
      tasks: [
        {
          id: 'search',
          description: 'Search for AI agents',
          agentId: 'researcher',
        },
        {
          id: 'analyze',
          description: 'Analyze the discovered sources',
          agentId: 'analyst',
          dependencies: ['search'],
        },
        {
          id: 'write-report',
          description: 'Write the report',
          agentId: 'writer',
          dependencies: ['analyze'],
        },
      ],
    });

    await crew.run();

    // The analyst should receive the researcher's output as context
    const userMessage = analyzerMessages.find((m) => m.role === 'user');
    expect(userMessage?.content).toContain('arxiv.org');
  });

  it('should emit all crew lifecycle events', async () => {
    const events: string[] = [];

    const crew = new Crew({
      id: 'events-crew',
      agents: [researcher, analyst, reportWriter],
      tasks: [
        {
          id: 'search',
          description: 'Search',
          agentId: 'researcher',
        },
        {
          id: 'analyze',
          description: 'Analyze',
          agentId: 'analyst',
          dependencies: ['search'],
        },
        {
          id: 'write-report',
          description: 'Report',
          agentId: 'writer',
          dependencies: ['analyze'],
        },
      ],
    });

    crew.on('crew:start', () => events.push('crew:start'));
    crew.on('crew:task:start', () => events.push('crew:task:start'));
    crew.on('crew:task:complete', () => events.push('crew:task:complete'));
    crew.on('crew:complete', () => events.push('crew:complete'));

    await crew.run();

    expect(events).toEqual([
      'crew:start',
      'crew:task:start',
      'crew:task:complete',
      'crew:task:start',
      'crew:task:complete',
      'crew:task:start',
      'crew:task:complete',
      'crew:complete',
    ]);
  });

  it('should include token usage in all task results', async () => {
    const crew = new Crew({
      id: 'tokens-crew',
      agents: [researcher, analyst, reportWriter],
      tasks: [
        { id: 'search', description: 'Search', agentId: 'researcher' },
        {
          id: 'analyze',
          description: 'Analyze',
          agentId: 'analyst',
          dependencies: ['search'],
        },
        {
          id: 'report',
          description: 'Report',
          agentId: 'writer',
          dependencies: ['analyze'],
        },
      ],
    });

    const result = await crew.run();

    for (const [, taskResult] of result.taskResults) {
      expect(taskResult.tokenUsage).toBeDefined();
      expect(taskResult.tokenUsage?.totalTokens).toBeGreaterThan(0);
    }
  });

  it('should include task outputs in results', async () => {
    const crew = new Crew({
      id: 'output-crew',
      agents: [researcher, analyst, reportWriter],
      tasks: [
        { id: 'search', description: 'Search', agentId: 'researcher' },
        {
          id: 'analyze',
          description: 'Analyze',
          agentId: 'analyst',
          dependencies: ['search'],
        },
        {
          id: 'report',
          description: 'Report',
          agentId: 'writer',
          dependencies: ['analyze'],
        },
      ],
    });

    const result = await crew.run();

    const searchResult = result.taskResults.get('search');
    expect(searchResult?.output).toContain('sources');

    const analyzeResult = result.taskResults.get('analyze');
    expect(analyzeResult?.output).toBeDefined();

    const reportResult = result.taskResults.get('report');
    expect(reportResult?.output).toContain('Research Report');
  });

  it('should correctly assign agent IDs to task results', async () => {
    const crew = new Crew({
      id: 'agent-id-crew',
      agents: [researcher, analyst, reportWriter],
      tasks: [
        { id: 'search', description: 'Search', agentId: 'researcher' },
        {
          id: 'analyze',
          description: 'Analyze',
          agentId: 'analyst',
          dependencies: ['search'],
        },
        {
          id: 'report',
          description: 'Report',
          agentId: 'writer',
          dependencies: ['analyze'],
        },
      ],
    });

    const result = await crew.run();

    expect(result.taskResults.get('search')?.agentId).toBe('researcher');
    expect(result.taskResults.get('analyze')?.agentId).toBe('analyst');
    expect(result.taskResults.get('report')?.agentId).toBe('writer');
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('TASK-085: Research Crew — Edge Cases', () => {
  it('should reject circular dependencies between research tasks', () => {
    const agent = new Agent({
      id: 'agent-1',
      role: 'Worker',
      goal: 'Work',
      llmProvider: createMockLLMProvider(),
    });

    expect(
      () =>
        new Crew({
          id: 'circular-crew',
          agents: [agent],
          tasks: [
            { id: 'task-a', description: 'A', agentId: 'agent-1', dependencies: ['task-b'] },
            { id: 'task-b', description: 'B', agentId: 'agent-1', dependencies: ['task-a'] },
          ],
        }),
    ).toThrow();
  });

  it('should handle agent with both web and file tools', () => {
    const webToolBundle = createWebTools();
    const fileToolBundle = createFileTools({ basePath: '.' });

    const allTools: Tool[] = [
      webToolBundle.webSearch,
      webToolBundle.fetchUrl,
      webToolBundle.parseHtml,
      fileToolBundle.readFile,
      fileToolBundle.writeFile,
      fileToolBundle.listFiles,
    ];

    const agent = new Agent({
      id: 'all-tools-agent',
      role: 'Full-Stack Researcher',
      goal: 'Use all available tools',
      tools: allTools,
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.tools.size).toBe(6);
    const systemPrompt = agent.buildSystemPrompt();
    expect(systemPrompt).toContain('webSearch');
    expect(systemPrompt).toContain('fetchUrl');
    expect(systemPrompt).toContain('parseHtml');
    expect(systemPrompt).toContain('readFile');
    expect(systemPrompt).toContain('writeFile');
    expect(systemPrompt).toContain('listFiles');
  });

  it('should fail if a research agent has no LLM provider', async () => {
    const webToolBundle = createWebTools();
    const agent = new Agent({
      id: 'no-llm-researcher',
      role: 'Researcher',
      goal: 'Research',
      tools: [webToolBundle.webSearch],
    });

    await expect(agent.execute({ description: 'Search for AI trends' })).rejects.toThrow(
      'No LLM provider configured',
    );
  });

  it('should handle a single-task research crew', async () => {
    const agent = new Agent({
      id: 'solo-researcher',
      role: 'Solo Researcher',
      goal: 'Do everything',
      tools: [createWebTools().webSearch, createFileTools({ basePath: '.' }).writeFile],
      llmProvider: createMockLLMProvider('Solo research complete'),
    });

    const crew = new Crew({
      id: 'solo-crew',
      agents: [agent],
      tasks: [
        {
          id: 'research-all',
          description: 'Research and write report',
          agentId: 'solo-researcher',
        },
      ],
    });

    const result = await crew.run();
    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(1);
    expect(result.taskResults.get('research-all')?.output).toBe('Solo research complete');
  });

  it('should handle research crew with expectedOutput on tasks', async () => {
    const agent = new Agent({
      id: 'agent-1',
      role: 'Worker',
      goal: 'Work',
      llmProvider: createMockLLMProvider('Task output'),
    });

    const crew = new Crew({
      id: 'expected-output-crew',
      agents: [agent],
      tasks: [
        {
          id: 'task-1',
          description: 'Do a task',
          expectedOutput: 'A structured report in markdown format',
          agentId: 'agent-1',
        },
      ],
    });

    const result = await crew.run();
    expect(result.success).toBe(true);
  });
});
