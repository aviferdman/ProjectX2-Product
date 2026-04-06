/**
<<<<<<< HEAD
 * Tests for TASK-085: Research Crew Example
 *
 * Validates the research crew example file and that the multi-agent
 * research workflow with web + file tools works end-to-end.
 */

import { describe, it, expect, vi } from 'vitest';
=======
 * Tests for TASK-085: Research Crew Example (Web + File Tools)
 *
 * Validates the research crew example file, its structure, and that the
 * multi-agent research workflow with web and file tools works end-to-end.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
>>>>>>> agent/developer/development-developer-c71
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
<<<<<<< HEAD
import { CrewStatus } from '../../src/types/crew.js';
import { ToolCategory, ToolPermission } from '../../src/types/tool.js';
import { createWebTools } from '../../src/tools/web/index.js';
import { createFileTools } from '../../src/tools/file/index.js';
=======
import { createWebTools } from '../../src/tools/web/index.js';
import { createFileTools } from '../../src/tools/file/index.js';
import { ToolCategory, ToolPermission } from '../../src/types/tool.js';
>>>>>>> agent/developer/development-developer-c71
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

<<<<<<< HEAD
function createMockTool(name: string, category?: ToolCategory): Tool {
  return {
    name,
    description: `Mock ${name} tool`,
    category,
    execute: vi.fn<(input: unknown) => Promise<unknown>>().mockResolvedValue({ success: true }),
=======
function createTaskAwareMockProvider(responses: Record<string, string>): LLMProvider {
  return {
    name: 'task-aware-mock',
    generateText: vi
      .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
      .mockImplementation(async (messages) => {
        const userMsg = [...messages].reverse().find((m) => m.role === 'user');
        const content = userMsg?.content?.toLowerCase() ?? '';
        const key = Object.keys(responses).find((k) => content.includes(k));
        return {
          content: key ? responses[key] : 'Default mock response',
          tokenUsage: { promptTokens: 30, completionTokens: 40, totalTokens: 70 },
          finishReason: 'stop',
        };
      }),
>>>>>>> agent/developer/development-developer-c71
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

<<<<<<< HEAD
=======
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

>>>>>>> agent/developer/development-developer-c71
  it('should include usage instructions in header', () => {
    expect(content).toContain('npx tsx examples/research-crew.ts');
  });

  it('should mention mock provider replacement', () => {
    expect(content).toMatch(/[Rr]eplace.*real provider|[Mm]ock.*provider/);
  });

<<<<<<< HEAD
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
=======
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
>>>>>>> agent/developer/development-developer-c71
  });
});

// ---------------------------------------------------------------------------
<<<<<<< HEAD
// Web tools validation
// ---------------------------------------------------------------------------

describe('TASK-085: Research Crew — Web Tools', () => {
  it('should create web tools bundle', () => {
=======
// Web tools integration
// ---------------------------------------------------------------------------

describe('TASK-085: Research Crew — Web Tools', () => {
  it('should create web tools bundle with all three tools', () => {
>>>>>>> agent/developer/development-developer-c71
    const tools = createWebTools();
    expect(tools.webSearch).toBeDefined();
    expect(tools.fetchUrl).toBeDefined();
    expect(tools.parseHtml).toBeDefined();
  });

<<<<<<< HEAD
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
=======
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
>>>>>>> agent/developer/development-developer-c71
    expect(tools.readFile).toBeDefined();
    expect(tools.writeFile).toBeDefined();
    expect(tools.listFiles).toBeDefined();
  });

<<<<<<< HEAD
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
=======
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
>>>>>>> agent/developer/development-developer-c71
  });
});

// ---------------------------------------------------------------------------
// Functional validation — research crew workflow
// ---------------------------------------------------------------------------

describe('TASK-085: Research Crew — Functional Validation', () => {
<<<<<<< HEAD
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
=======
  let webResearcher: Agent;
  let contentAnalyst: Agent;
  let reportWriter: Agent;

  beforeEach(() => {
    const webToolBundle = createWebTools();
    const fileToolBundle = createFileTools({ basePath: '.' });

    webResearcher = new Agent({
      id: 'web-researcher',
      role: 'Web Research Specialist',
      goal: 'Search the web and gather relevant sources',
      backstory: 'Expert at finding authoritative sources using web search.',
      tools: [webToolBundle.webSearch, webToolBundle.fetchUrl],
      llmProvider: createMockLLMProvider(
        'Found 3 sources: arxiv.org, blog.example.com, research.example.com',
      ),
    });

    contentAnalyst = new Agent({
      id: 'content-analyst',
      role: 'Content Analyst',
      goal: 'Analyze web content and extract key insights',
      backstory: 'Meticulous analyst who extracts structured insights.',
      tools: [webToolBundle.parseHtml, fileToolBundle.readFile, fileToolBundle.listFiles],
      llmProvider: createMockLLMProvider(
        'Key findings: 1) Agents are production-ready 2) Multi-agent is 40% better 3) Tools reduce hallucination',
      ),
    });

    reportWriter = new Agent({
      id: 'report-writer',
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
      agents: [webResearcher, contentAnalyst, reportWriter],
      tasks: [
        {
          id: 'search-sources',
          description: 'Search for AI agents 2026',
          agentId: 'web-researcher',
        },
        {
          id: 'analyze-content',
          description: 'Analyze the search results',
          agentId: 'content-analyst',
          dependencies: ['search-sources'],
        },
        {
          id: 'write-report',
          description: 'Write a comprehensive report',
          agentId: 'report-writer',
          dependencies: ['analyze-content'],
>>>>>>> agent/developer/development-developer-c71
        },
      ],
    });

    const result = await crew.run();

    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(3);
<<<<<<< HEAD
    expect(result.taskResults.get('search')?.agentId).toBe('researcher');
    expect(result.taskResults.get('analyze')?.agentId).toBe('analyst');
    expect(result.taskResults.get('write-report')?.agentId).toBe('writer');
=======
    expect(result.duration).toBeGreaterThanOrEqual(0);
>>>>>>> agent/developer/development-developer-c71
  });

  it('should execute tasks in dependency order', async () => {
    const executionOrder: string[] = [];

<<<<<<< HEAD
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
=======
    const crew = new Crew({
      id: 'order-crew',
      agents: [webResearcher, contentAnalyst, reportWriter],
      tasks: [
        {
          id: 'search-sources',
          description: 'Search for topic',
          agentId: 'web-researcher',
        },
        {
          id: 'analyze-content',
          description: 'Analyze sources',
          agentId: 'content-analyst',
          dependencies: ['search-sources'],
        },
        {
          id: 'write-report',
          description: 'Write the report',
          agentId: 'report-writer',
          dependencies: ['analyze-content'],
>>>>>>> agent/developer/development-developer-c71
        },
      ],
    });

    crew.on('crew:task:start', (_crewId, taskId) => {
      executionOrder.push(taskId);
    });

    await crew.run();

<<<<<<< HEAD
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
=======
    expect(executionOrder).toEqual(['search-sources', 'analyze-content', 'write-report']);
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
>>>>>>> agent/developer/development-developer-c71
            tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            finishReason: 'stop',
          };
        }),
    };

<<<<<<< HEAD
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
=======
    const fileToolBundle = createFileTools({ basePath: '.' });
    const webToolBundle = createWebTools();
    const analyst = new Agent({
      id: 'content-analyst',
      role: 'Analyst',
      goal: 'Analyze content',
      tools: [webToolBundle.parseHtml, fileToolBundle.readFile],
      llmProvider: analyzerProvider,
    });

    const crew = new Crew({
      id: 'context-crew',
      agents: [webResearcher, analyst, reportWriter],
      tasks: [
        {
          id: 'search-sources',
          description: 'Search for AI agents',
          agentId: 'web-researcher',
        },
        {
          id: 'analyze-content',
          description: 'Analyze the discovered sources',
          agentId: 'content-analyst',
          dependencies: ['search-sources'],
        },
        {
          id: 'write-report',
          description: 'Write the report',
          agentId: 'report-writer',
          dependencies: ['analyze-content'],
>>>>>>> agent/developer/development-developer-c71
        },
      ],
    });

    await crew.run();

<<<<<<< HEAD
    // Analyst should receive researcher's output
    const analystUserMsg = analystMessages.find((m) => m.role === 'user');
    expect(analystUserMsg?.content).toContain('Found 5 AI trends with sources');

    // Writer should receive analyst's output
    const writerUserMsg = writerMessages.find((m) => m.role === 'user');
    expect(writerUserMsg?.content).toContain('Structured analysis of trends');
=======
    // The analyst should receive the researcher's output as context
    const userMessage = analyzerMessages.find((m) => m.role === 'user');
    expect(userMessage?.content).toContain('arxiv.org');
>>>>>>> agent/developer/development-developer-c71
  });

  it('should emit all crew lifecycle events', async () => {
    const events: string[] = [];

<<<<<<< HEAD
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
=======
    const crew = new Crew({
      id: 'events-crew',
      agents: [webResearcher, contentAnalyst, reportWriter],
      tasks: [
        {
          id: 'search-sources',
          description: 'Search',
          agentId: 'web-researcher',
        },
        {
          id: 'analyze-content',
          description: 'Analyze',
          agentId: 'content-analyst',
          dependencies: ['search-sources'],
        },
        {
          id: 'write-report',
          description: 'Report',
          agentId: 'report-writer',
          dependencies: ['analyze-content'],
        },
>>>>>>> agent/developer/development-developer-c71
      ],
    });

    crew.on('crew:start', () => events.push('crew:start'));
<<<<<<< HEAD
    crew.on('crew:task:start', (_crewId, taskId) => events.push(`task:start:${taskId}`));
    crew.on('crew:task:complete', (_crewId, taskId) => events.push(`task:complete:${taskId}`));
=======
    crew.on('crew:task:start', () => events.push('crew:task:start'));
    crew.on('crew:task:complete', () => events.push('crew:task:complete'));
>>>>>>> agent/developer/development-developer-c71
    crew.on('crew:complete', () => events.push('crew:complete'));

    await crew.run();

    expect(events).toEqual([
      'crew:start',
<<<<<<< HEAD
      'task:start:search',
      'task:complete:search',
      'task:start:analyze',
      'task:complete:analyze',
=======
      'crew:task:start',
      'crew:task:complete',
      'crew:task:start',
      'crew:task:complete',
      'crew:task:start',
      'crew:task:complete',
>>>>>>> agent/developer/development-developer-c71
      'crew:complete',
    ]);
  });

<<<<<<< HEAD
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
=======
  it('should include token usage in all task results', async () => {
    const crew = new Crew({
      id: 'tokens-crew',
      agents: [webResearcher, contentAnalyst, reportWriter],
      tasks: [
        { id: 'search', description: 'Search', agentId: 'web-researcher' },
        {
          id: 'analyze',
          description: 'Analyze',
          agentId: 'content-analyst',
          dependencies: ['search'],
        },
        {
          id: 'report',
          description: 'Report',
          agentId: 'report-writer',
          dependencies: ['analyze'],
        },
>>>>>>> agent/developer/development-developer-c71
      ],
    });

    const result = await crew.run();

<<<<<<< HEAD
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
=======
    for (const [, taskResult] of result.taskResults) {
      expect(taskResult.tokenUsage).toBeDefined();
      expect(taskResult.tokenUsage?.totalTokens).toBeGreaterThan(0);
    }
  });

  it('should include task outputs in results', async () => {
    const crew = new Crew({
      id: 'output-crew',
      agents: [webResearcher, contentAnalyst, reportWriter],
      tasks: [
        { id: 'search', description: 'Search', agentId: 'web-researcher' },
        {
          id: 'analyze',
          description: 'Analyze',
          agentId: 'content-analyst',
          dependencies: ['search'],
        },
        {
          id: 'report',
          description: 'Report',
          agentId: 'report-writer',
          dependencies: ['analyze'],
        },
>>>>>>> agent/developer/development-developer-c71
      ],
    });

    const result = await crew.run();
<<<<<<< HEAD
    expect(result.success).toBe(true);
=======

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
      agents: [webResearcher, contentAnalyst, reportWriter],
      tasks: [
        { id: 'search', description: 'Search', agentId: 'web-researcher' },
        {
          id: 'analyze',
          description: 'Analyze',
          agentId: 'content-analyst',
          dependencies: ['search'],
        },
        {
          id: 'report',
          description: 'Report',
          agentId: 'report-writer',
          dependencies: ['analyze'],
        },
      ],
    });

    const result = await crew.run();

    expect(result.taskResults.get('search')?.agentId).toBe('web-researcher');
    expect(result.taskResults.get('analyze')?.agentId).toBe('content-analyst');
    expect(result.taskResults.get('report')?.agentId).toBe('report-writer');
>>>>>>> agent/developer/development-developer-c71
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('TASK-085: Research Crew — Edge Cases', () => {
<<<<<<< HEAD
  it('should handle a single-agent crew with tools', async () => {
=======
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

    await expect(
      agent.execute({ description: 'Search for AI trends' }),
    ).rejects.toThrow('No LLM provider configured');
  });

  it('should handle a single-task research crew', async () => {
>>>>>>> agent/developer/development-developer-c71
    const agent = new Agent({
      id: 'solo-researcher',
      role: 'Solo Researcher',
      goal: 'Do everything',
<<<<<<< HEAD
      tools: [
        createMockTool('webSearch', ToolCategory.WEB),
        createMockTool('writeFile', ToolCategory.FILE),
      ],
=======
      tools: [createWebTools().webSearch, createFileTools({ basePath: '.' }).writeFile],
>>>>>>> agent/developer/development-developer-c71
      llmProvider: createMockLLMProvider('Solo research complete'),
    });

    const crew = new Crew({
      id: 'solo-crew',
      agents: [agent],
<<<<<<< HEAD
      tasks: [{ id: 'research-all', description: 'Research and write', agentId: 'solo-researcher' }],
=======
      tasks: [
        {
          id: 'research-all',
          description: 'Research and write report',
          agentId: 'solo-researcher',
        },
      ],
>>>>>>> agent/developer/development-developer-c71
    });

    const result = await crew.run();
    expect(result.success).toBe(true);
<<<<<<< HEAD
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
=======
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
>>>>>>> agent/developer/development-developer-c71
      ],
    });

    const result = await crew.run();
    expect(result.success).toBe(true);
<<<<<<< HEAD
    expect(result.taskResults.size).toBe(4);

    const executionOrder: string[] = [];
    crew.reset();
    crew.on('crew:task:start', (_crewId, taskId) => executionOrder.push(taskId));
    await crew.run();
    expect(executionOrder).toEqual(['task1', 'task2', 'task3', 'task4']);
=======
>>>>>>> agent/developer/development-developer-c71
  });
});
