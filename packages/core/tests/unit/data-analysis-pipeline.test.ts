/**
<<<<<<< HEAD
 * Tests for TASK-087: Data Analysis Pipeline Example
 *
 * Validates the data analysis pipeline example file, its structure, custom
 * tool creation, and that the multi-agent data analysis workflow works end-to-end.
=======
 * Tests for TASK-085: Research Crew Example (Web + File Tools)
 *
 * Validates the research crew example file, its structure, and that the
 * multi-agent research workflow with web and file tools works end-to-end.
>>>>>>> agent/developer/development-developer-c8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
<<<<<<< HEAD
import { createTool } from '../../src/tool/create-tool.js';
import { ToolCategory } from '../../src/types/tool.js';
=======
import { createWebTools } from '../../src/tools/web/index.js';
import { createFileTools } from '../../src/tools/file/index.js';
import { ToolCategory, ToolPermission } from '../../src/types/tool.js';
>>>>>>> agent/developer/development-developer-c8
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

<<<<<<< HEAD
describe('TASK-087: Data Analysis Pipeline — Example File', () => {
  const examplePath = join(EXAMPLES_DIR, 'data-analysis-pipeline.ts');
  let content: string;

  it('should exist at examples/data-analysis-pipeline.ts', () => {
=======
describe('TASK-085: Research Crew — Example File', () => {
  const examplePath = join(EXAMPLES_DIR, 'research-crew.ts');
  let content: string;

  it('should exist at examples/research-crew.ts', () => {
>>>>>>> agent/developer/development-developer-c8
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

<<<<<<< HEAD
  it('should import createTool from @crewspace/core', () => {
    expect(content).toContain('createTool');
  });

  it('should create at least four agents', () => {
    const agentCreations = content.match(/new Agent\(/g) ?? [];
    expect(agentCreations.length).toBeGreaterThanOrEqual(4);
=======
  it('should import createWebTools from @crewspace/core', () => {
    expect(content).toContain('createWebTools');
  });

  it('should import createFileTools from @crewspace/core', () => {
    expect(content).toContain('createFileTools');
  });

  it('should create at least three agents', () => {
    const agentCreations = content.match(/new Agent\(/g) ?? [];
    expect(agentCreations.length).toBeGreaterThanOrEqual(3);
>>>>>>> agent/developer/development-developer-c8
  });

  it('should create a Crew', () => {
    expect(content).toContain('new Crew');
  });

<<<<<<< HEAD
  it('should call crew.run() or analysisCrew.run()', () => {
=======
  it('should call crew.run() or researchCrew.run()', () => {
>>>>>>> agent/developer/development-developer-c8
    expect(content).toMatch(/\.run\(\)/);
  });

  it('should demonstrate task dependencies', () => {
    expect(content).toContain('dependencies');
  });

<<<<<<< HEAD
  it('should create custom tools with createTool', () => {
    const toolCreations = content.match(/createTool\(/g) ?? [];
    expect(toolCreations.length).toBeGreaterThanOrEqual(2);
  });

  it('should use ToolCategory.DATA for custom data tools', () => {
    expect(content).toContain('ToolCategory.DATA');
=======
  it('should assign web tools to agents', () => {
    expect(content).toContain('webTools.webSearch');
    expect(content).toContain('webTools.fetchUrl');
  });

  it('should assign file tools to agents', () => {
    expect(content).toContain('fileTools.writeFile');
    expect(content).toContain('fileTools.readFile');
>>>>>>> agent/developer/development-developer-c8
  });

  it('should show lifecycle event subscription', () => {
    expect(content).toContain(".on('crew:");
  });

  it('should include usage instructions in header', () => {
<<<<<<< HEAD
    expect(content).toContain('npx tsx examples/data-analysis-pipeline.ts');
=======
    expect(content).toContain('npx tsx examples/research-crew.ts');
>>>>>>> agent/developer/development-developer-c8
  });

  it('should mention mock provider replacement', () => {
    expect(content).toMatch(/[Rr]eplace.*real provider|[Mm]ock.*provider/);
  });

  it('should define agents with distinct roles', () => {
<<<<<<< HEAD
    expect(content).toMatch(/role:.*[Cc]ollect/);
    expect(content).toMatch(/role:.*[Qq]uality|[Cc]lean/);
    expect(content).toMatch(/role:.*[Aa]nalyst/);
    expect(content).toMatch(/role:.*[Rr]eport|[Ww]riter/);
=======
    expect(content).toMatch(/role:.*[Rr]esearch/);
    expect(content).toMatch(/role:.*[Aa]nalyst/);
    expect(content).toMatch(/role:.*[Ww]riter/);
>>>>>>> agent/developer/development-developer-c8
  });

  it('should define agents with backstories', () => {
    const backstoryCount = (content.match(/backstory:/g) ?? []).length;
<<<<<<< HEAD
    expect(backstoryCount).toBeGreaterThanOrEqual(4);
=======
    expect(backstoryCount).toBeGreaterThanOrEqual(3);
>>>>>>> agent/developer/development-developer-c8
  });

  it('should use expectedOutput for tasks', () => {
    const expectedOutputCount = (content.match(/expectedOutput:/g) ?? []).length;
<<<<<<< HEAD
    expect(expectedOutputCount).toBeGreaterThanOrEqual(3);
  });

  it('should define a 4-stage pipeline (collect → clean → analyze → report)', () => {
    expect(content).toContain("dependencies: ['collect']");
    expect(content).toContain("dependencies: ['clean']");
    expect(content).toContain("dependencies: ['analyze']");
=======
    expect(expectedOutputCount).toBeGreaterThanOrEqual(1);
>>>>>>> agent/developer/development-developer-c8
  });
});

// ---------------------------------------------------------------------------
<<<<<<< HEAD
// Custom tool creation
// ---------------------------------------------------------------------------

describe('TASK-087: Data Analysis Pipeline — Custom Tools', () => {
  it('should create a data reading tool with createTool', () => {
    const readDataTool = createTool({
      name: 'readData',
      description: 'Read raw sales data from the data source',
      category: ToolCategory.DATA,
      execute: async () => ({ recordCount: 5, data: [] }),
    });

    expect(readDataTool.name).toBe('readData');
    expect(readDataTool.description).toContain('Read raw sales data');
    expect(readDataTool.category).toBe(ToolCategory.DATA);
    expect(typeof readDataTool.execute).toBe('function');
  });

  it('should create a data cleaning tool with createTool', () => {
    const cleanDataTool = createTool({
      name: 'cleanData',
      description: 'Validate and clean a dataset',
      category: ToolCategory.DATA,
      execute: async () => ({ recordCount: 5, issuesFound: 0 }),
    });

    expect(cleanDataTool.name).toBe('cleanData');
    expect(cleanDataTool.category).toBe(ToolCategory.DATA);
  });

  it('should create a statistics tool with createTool', () => {
    const statsTool = createTool({
      name: 'computeStats',
      description: 'Compute summary statistics on a dataset',
      category: ToolCategory.DATA,
      execute: async () => ({ totalRevenue: 26350, avgMargin: 50.0 }),
    });

    expect(statsTool.name).toBe('computeStats');
    expect(statsTool.category).toBe(ToolCategory.DATA);
  });

  it('custom tools should be executable and return data', async () => {
    const sampleData = [
      { region: 'North', revenue: 2400 },
      { region: 'South', revenue: 2550 },
    ];

    const readTool = createTool({
      name: 'readSalesData',
      description: 'Read sales records',
      category: ToolCategory.DATA,
      execute: async () => ({
        recordCount: sampleData.length,
        data: sampleData,
      }),
    });

    const result = (await readTool.execute({})) as {
      recordCount: number;
      data: Array<{ region: string; revenue: number }>;
    };

    expect(result.recordCount).toBe(2);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]?.region).toBe('North');
    expect(result.data[1]?.revenue).toBe(2550);
  });

  it('custom tools should handle data transformations', async () => {
    const cleanTool = createTool({
      name: 'enrichData',
      description: 'Add derived columns to dataset',
      category: ToolCategory.DATA,
      execute: async (input: unknown) => {
        const data = (input as { data: Array<{ revenue: number; cost: number }> }).data;
        return {
          data: data.map((row) => ({
            ...row,
            profit: row.revenue - row.cost,
            margin: Number(((row.revenue - row.cost) / row.revenue * 100).toFixed(1)),
          })),
        };
      },
    });

    const result = (await cleanTool.execute({
      data: [{ revenue: 2400, cost: 1200 }],
    })) as {
      data: Array<{ revenue: number; cost: number; profit: number; margin: number }>;
    };

    expect(result.data[0]?.profit).toBe(1200);
    expect(result.data[0]?.margin).toBe(50.0);
  });

  it('custom tools should compute aggregations', async () => {
    const statsTool = createTool({
      name: 'aggregate',
      description: 'Compute aggregate statistics',
      category: ToolCategory.DATA,
      execute: async (input: unknown) => {
        const records = (input as { data: Array<{ revenue: number }> }).data;
        const totalRevenue = records.reduce((sum, r) => sum + r.revenue, 0);
        return {
          totalRevenue,
          averageRevenue: totalRevenue / records.length,
          count: records.length,
        };
      },
    });

    const result = (await statsTool.execute({
      data: [{ revenue: 1000 }, { revenue: 2000 }, { revenue: 3000 }],
    })) as { totalRevenue: number; averageRevenue: number; count: number };

    expect(result.totalRevenue).toBe(6000);
    expect(result.averageRevenue).toBe(2000);
    expect(result.count).toBe(3);
=======
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
>>>>>>> agent/developer/development-developer-c8
  });
});

// ---------------------------------------------------------------------------
<<<<<<< HEAD
// Agent + custom tool integration
// ---------------------------------------------------------------------------

describe('TASK-087: Data Analysis Pipeline — Agent Tool Registration', () => {
  it('should register custom tools on an agent via constructor', () => {
    const readTool = createTool({
      name: 'readData',
      description: 'Read data',
      category: ToolCategory.DATA,
      execute: async () => ({ data: [] }),
    });

    const agent = new Agent({
      id: 'data-collector',
      role: 'Data Collector',
      goal: 'Collect data',
      tools: [readTool],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('readData')).toBe(true);
    expect(agent.tools.size).toBe(1);
  });

  it('should register multiple custom tools on different agents', () => {
    const readTool = createTool({
      name: 'readData',
      description: 'Read data',
      category: ToolCategory.DATA,
      execute: async () => ({ data: [] }),
    });
    const cleanTool = createTool({
      name: 'cleanData',
      description: 'Clean data',
      category: ToolCategory.DATA,
      execute: async () => ({ data: [] }),
    });
    const statsTool = createTool({
      name: 'computeStats',
      description: 'Compute stats',
      category: ToolCategory.DATA,
      execute: async () => ({}),
    });

    const collector = new Agent({
      id: 'collector',
      role: 'Collector',
      goal: 'Collect data',
      tools: [readTool],
      llmProvider: createMockLLMProvider(),
    });
    const cleaner = new Agent({
      id: 'cleaner',
      role: 'Cleaner',
      goal: 'Clean data',
      tools: [cleanTool],
      llmProvider: createMockLLMProvider(),
    });
    const analyst = new Agent({
      id: 'analyst',
      role: 'Analyst',
      goal: 'Analyze data',
      tools: [statsTool],
      llmProvider: createMockLLMProvider(),
    });

    expect(collector.hasTool('readData')).toBe(true);
    expect(cleaner.hasTool('cleanData')).toBe(true);
    expect(analyst.hasTool('computeStats')).toBe(true);
  });

  it('should include custom tool descriptions in agent system prompt', () => {
    const readTool = createTool({
      name: 'readData',
      description: 'Read raw sales data from the source',
      category: ToolCategory.DATA,
      execute: async () => ({ data: [] }),
    });

    const agent = new Agent({
      id: 'prompted-agent',
      role: 'Data Collector',
      goal: 'Collect data',
      tools: [readTool],
=======
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
>>>>>>> agent/developer/development-developer-c8
      llmProvider: createMockLLMProvider(),
    });

    const systemPrompt = agent.buildSystemPrompt();
    expect(systemPrompt).toContain('Available tools');
<<<<<<< HEAD
    expect(systemPrompt).toContain('readData');
=======
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
>>>>>>> agent/developer/development-developer-c8
  });
});

// ---------------------------------------------------------------------------
<<<<<<< HEAD
// Functional validation — data analysis pipeline workflow
// ---------------------------------------------------------------------------

describe('TASK-087: Data Analysis Pipeline — Functional Validation', () => {
  let collector: Agent;
  let cleaner: Agent;
  let analyst: Agent;
  let reporter: Agent;

  beforeEach(() => {
    const readTool = createTool({
      name: 'readData',
      description: 'Read sales data',
      category: ToolCategory.DATA,
      execute: async () => ({ recordCount: 10, data: [{ region: 'North', revenue: 2400 }] }),
    });
    const cleanTool = createTool({
      name: 'cleanData',
      description: 'Clean and validate data',
      category: ToolCategory.DATA,
      execute: async () => ({ recordCount: 10, issuesFound: 0 }),
    });
    const statsTool = createTool({
      name: 'computeStats',
      description: 'Compute statistics',
      category: ToolCategory.DATA,
      execute: async () => ({ totalRevenue: 26350, topRegion: 'South' }),
    });

    collector = new Agent({
      id: 'collector',
      role: 'Data Collection Specialist',
      goal: 'Load raw data from the data source',
      backstory: 'Expert data engineer specializing in data ingestion.',
      tools: [readTool],
      llmProvider: createMockLLMProvider('Loaded 10 sales records across 4 regions.'),
    });

    cleaner = new Agent({
      id: 'cleaner',
      role: 'Data Quality Engineer',
      goal: 'Clean and enrich the dataset',
      backstory: 'Meticulous data quality engineer.',
      tools: [cleanTool],
      llmProvider: createMockLLMProvider('Cleaned 10 records. 0 issues found. Added profit and margin columns.'),
=======
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
>>>>>>> agent/developer/development-developer-c8
    });

    analyst = new Agent({
      id: 'analyst',
<<<<<<< HEAD
      role: 'Data Analyst',
      goal: 'Compute summary statistics and identify trends',
      backstory: 'Senior data analyst skilled in statistical analysis.',
      tools: [statsTool],
      llmProvider: createMockLLMProvider('Total revenue: $26,350. Top region: South. Trend: upward.'),
    });

    reporter = new Agent({
      id: 'reporter',
      role: 'Business Intelligence Report Writer',
      goal: 'Write an actionable business report',
      backstory: 'BI writer who transforms analysis into executive reports.',
      llmProvider: createMockLLMProvider(
        '# Sales Analysis Report\n\n## Key Findings\n1. South region leads with 39.7% of revenue\n2. Widget A is the top product',
=======
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
>>>>>>> agent/developer/development-developer-c8
      ),
    });
  });

<<<<<<< HEAD
  it('should run the full data analysis pipeline end-to-end', async () => {
    const crew = new Crew({
      id: 'data-analysis-crew',
      name: 'Data Analysis Pipeline',
      agents: [collector, cleaner, analyst, reporter],
      tasks: [
        { id: 'collect', description: 'Load raw sales data', agentId: 'collector' },
        { id: 'clean', description: 'Clean the dataset', agentId: 'cleaner', dependencies: ['collect'] },
        { id: 'analyze', description: 'Compute statistics', agentId: 'analyst', dependencies: ['clean'] },
        { id: 'report', description: 'Write the report', agentId: 'reporter', dependencies: ['analyze'] },
=======
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
>>>>>>> agent/developer/development-developer-c8
      ],
    });

    const result = await crew.run();

    expect(result.success).toBe(true);
<<<<<<< HEAD
    expect(result.taskResults.size).toBe(4);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should execute tasks in dependency order (collect → clean → analyze → report)', async () => {
=======
    expect(result.taskResults.size).toBe(3);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should execute tasks in dependency order', async () => {
>>>>>>> agent/developer/development-developer-c8
    const executionOrder: string[] = [];

    const crew = new Crew({
      id: 'order-crew',
<<<<<<< HEAD
      agents: [collector, cleaner, analyst, reporter],
      tasks: [
        { id: 'collect', description: 'Load data', agentId: 'collector' },
        { id: 'clean', description: 'Clean data', agentId: 'cleaner', dependencies: ['collect'] },
        { id: 'analyze', description: 'Analyze data', agentId: 'analyst', dependencies: ['clean'] },
        { id: 'report', description: 'Write report', agentId: 'reporter', dependencies: ['analyze'] },
=======
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
>>>>>>> agent/developer/development-developer-c8
      ],
    });

    crew.on('crew:task:start', (_crewId, taskId) => {
      executionOrder.push(taskId);
    });

    await crew.run();

<<<<<<< HEAD
    expect(executionOrder).toEqual(['collect', 'clean', 'analyze', 'report']);
=======
    expect(executionOrder).toEqual(['search', 'analyze', 'write-report']);
>>>>>>> agent/developer/development-developer-c8
  });

  it('should pass upstream outputs as context to downstream tasks', async () => {
    let analyzerMessages: readonly LLMMessage[] = [];

    const analyzerProvider: LLMProvider = {
<<<<<<< HEAD
      name: 'analyzer-capture',
=======
      name: 'analyzer-provider',
>>>>>>> agent/developer/development-developer-c8
      generateText: vi
        .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
        .mockImplementation(async (messages) => {
          analyzerMessages = messages;
          return {
            content: 'Analysis complete',
<<<<<<< HEAD
            tokenUsage: { promptTokens: 20, completionTokens: 30, totalTokens: 50 },
=======
            tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
>>>>>>> agent/developer/development-developer-c8
            finishReason: 'stop',
          };
        }),
    };

<<<<<<< HEAD
    const statsTool = createTool({
      name: 'computeStats',
      description: 'Compute statistics',
      category: ToolCategory.DATA,
      execute: async () => ({}),
    });

    const contextAnalyst = new Agent({
      id: 'analyst',
      role: 'Analyst',
      goal: 'Analyze data',
      tools: [statsTool],
=======
    const fileToolBundle = createFileTools({ basePath: '.' });
    const webToolBundle = createWebTools();
    const customAnalyst = new Agent({
      id: 'analyst',
      role: 'Analyst',
      goal: 'Analyze content',
      tools: [webToolBundle.parseHtml, fileToolBundle.readFile],
>>>>>>> agent/developer/development-developer-c8
      llmProvider: analyzerProvider,
    });

    const crew = new Crew({
      id: 'context-crew',
<<<<<<< HEAD
      agents: [collector, cleaner, contextAnalyst, reporter],
      tasks: [
        { id: 'collect', description: 'Load data', agentId: 'collector' },
        { id: 'clean', description: 'Clean data', agentId: 'cleaner', dependencies: ['collect'] },
        { id: 'analyze', description: 'Analyze', agentId: 'analyst', dependencies: ['clean'] },
        { id: 'report', description: 'Report', agentId: 'reporter', dependencies: ['analyze'] },
=======
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
>>>>>>> agent/developer/development-developer-c8
      ],
    });

    await crew.run();

<<<<<<< HEAD
    // The analyze task should receive context from the clean task (which depends on collect)
    const combinedContent = analyzerMessages.map((m) => m.content).join(' ');
    expect(combinedContent.length).toBeGreaterThan(0);
  });

  it('should emit crew lifecycle events during pipeline execution', async () => {
=======
    // The analyst should receive the researcher's output as context
    const userMessage = analyzerMessages.find((m) => m.role === 'user');
    expect(userMessage?.content).toContain('arxiv.org');
  });

  it('should emit all crew lifecycle events', async () => {
>>>>>>> agent/developer/development-developer-c8
    const events: string[] = [];

    const crew = new Crew({
      id: 'events-crew',
<<<<<<< HEAD
      agents: [collector, cleaner, analyst, reporter],
      tasks: [
        { id: 'collect', description: 'Load data', agentId: 'collector' },
        { id: 'clean', description: 'Clean data', agentId: 'cleaner', dependencies: ['collect'] },
        { id: 'analyze', description: 'Analyze data', agentId: 'analyst', dependencies: ['clean'] },
        { id: 'report', description: 'Write report', agentId: 'reporter', dependencies: ['analyze'] },
      ],
    });

    crew.on('crew:start', () => events.push('start'));
    crew.on('crew:task:start', () => events.push('task:start'));
    crew.on('crew:task:complete', () => events.push('task:complete'));
    crew.on('crew:complete', () => events.push('complete'));

    await crew.run();

    expect(events).toContain('start');
    expect(events).toContain('complete');
    expect(events.filter((e) => e === 'task:start')).toHaveLength(4);
    expect(events.filter((e) => e === 'task:complete')).toHaveLength(4);
  });

  it('should include token usage in task results', async () => {
    const crew = new Crew({
      id: 'tokens-crew',
      agents: [collector, cleaner, analyst, reporter],
      tasks: [
        { id: 'collect', description: 'Load data', agentId: 'collector' },
        { id: 'clean', description: 'Clean data', agentId: 'cleaner', dependencies: ['collect'] },
        { id: 'analyze', description: 'Analyze data', agentId: 'analyst', dependencies: ['clean'] },
        { id: 'report', description: 'Write report', agentId: 'reporter', dependencies: ['analyze'] },
=======
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
>>>>>>> agent/developer/development-developer-c8
      ],
    });

    const result = await crew.run();

<<<<<<< HEAD
    for (const [_taskId, taskResult] of result.taskResults) {
=======
    for (const [, taskResult] of result.taskResults) {
>>>>>>> agent/developer/development-developer-c8
      expect(taskResult.tokenUsage).toBeDefined();
      expect(taskResult.tokenUsage?.totalTokens).toBeGreaterThan(0);
    }
  });

<<<<<<< HEAD
  it('should produce non-empty output for each pipeline stage', async () => {
    const crew = new Crew({
      id: 'output-crew',
      agents: [collector, cleaner, analyst, reporter],
      tasks: [
        { id: 'collect', description: 'Load data', agentId: 'collector' },
        { id: 'clean', description: 'Clean data', agentId: 'cleaner', dependencies: ['collect'] },
        { id: 'analyze', description: 'Analyze data', agentId: 'analyst', dependencies: ['clean'] },
        { id: 'report', description: 'Write report', agentId: 'reporter', dependencies: ['analyze'] },
=======
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
>>>>>>> agent/developer/development-developer-c8
      ],
    });

    const result = await crew.run();

<<<<<<< HEAD
    expect(result.taskResults.get('collect')?.output).toBeTruthy();
    expect(result.taskResults.get('clean')?.output).toBeTruthy();
    expect(result.taskResults.get('analyze')?.output).toBeTruthy();
    expect(result.taskResults.get('report')?.output).toBeTruthy();
  });

  it('should handle a pipeline with an agent that has no tools (reporter)', async () => {
    const crew = new Crew({
      id: 'no-tools-crew',
      agents: [reporter],
      tasks: [
        { id: 'report', description: 'Write a summary', agentId: 'reporter' },
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
>>>>>>> agent/developer/development-developer-c8
      ],
    });

    const result = await crew.run();

<<<<<<< HEAD
    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(1);
    expect(result.taskResults.get('report')?.output).toBeTruthy();
  });
});
=======
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

    await expect(
      agent.execute({ description: 'Search for AI trends' }),
    ).rejects.toThrow('No LLM provider configured');
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
>>>>>>> agent/developer/development-developer-c8
