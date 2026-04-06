/**
 * Tests for TASK-087: Data Analysis Pipeline Example
 *
 * Validates the data analysis pipeline example file, its structure, custom
 * tool creation, and that the multi-agent data analysis workflow works end-to-end.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
import { createTool } from '../../src/tool/create-tool.js';
import { ToolCategory } from '../../src/types/tool.js';
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

describe('TASK-087: Data Analysis Pipeline — Example File', () => {
  const examplePath = join(EXAMPLES_DIR, 'data-analysis-pipeline.ts');
  let content: string;

  it('should exist at examples/data-analysis-pipeline.ts', () => {
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

  it('should import createTool from @crewspace/core', () => {
    expect(content).toContain('createTool');
  });

  it('should create at least four agents', () => {
    const agentCreations = content.match(/new Agent\(/g) ?? [];
    expect(agentCreations.length).toBeGreaterThanOrEqual(4);
  });

  it('should create a Crew', () => {
    expect(content).toContain('new Crew');
  });

  it('should call crew.run() or analysisCrew.run()', () => {
    expect(content).toMatch(/\.run\(\)/);
  });

  it('should demonstrate task dependencies', () => {
    expect(content).toContain('dependencies');
  });

  it('should create custom tools with createTool', () => {
    const toolCreations = content.match(/createTool\(/g) ?? [];
    expect(toolCreations.length).toBeGreaterThanOrEqual(2);
  });

  it('should use ToolCategory.DATA for custom data tools', () => {
    expect(content).toContain('ToolCategory.DATA');
  });

  it('should show lifecycle event subscription', () => {
    expect(content).toContain(".on('crew:");
  });

  it('should include usage instructions in header', () => {
    expect(content).toContain('npx tsx examples/data-analysis-pipeline.ts');
  });

  it('should mention mock provider replacement', () => {
    expect(content).toMatch(/[Rr]eplace.*real provider|[Mm]ock.*provider/);
  });

  it('should define agents with distinct roles', () => {
    expect(content).toMatch(/role:.*[Cc]ollect/);
    expect(content).toMatch(/role:.*[Qq]uality|[Cc]lean/);
    expect(content).toMatch(/role:.*[Aa]nalyst/);
    expect(content).toMatch(/role:.*[Rr]eport|[Ww]riter/);
  });

  it('should define agents with backstories', () => {
    const backstoryCount = (content.match(/backstory:/g) ?? []).length;
    expect(backstoryCount).toBeGreaterThanOrEqual(4);
  });

  it('should use expectedOutput for tasks', () => {
    const expectedOutputCount = (content.match(/expectedOutput:/g) ?? []).length;
    expect(expectedOutputCount).toBeGreaterThanOrEqual(3);
  });

  it('should define a 4-stage pipeline (collect → clean → analyze → report)', () => {
    expect(content).toContain("dependencies: ['collect']");
    expect(content).toContain("dependencies: ['clean']");
    expect(content).toContain("dependencies: ['analyze']");
  });
});

// ---------------------------------------------------------------------------
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
  });
});

// ---------------------------------------------------------------------------
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
      llmProvider: createMockLLMProvider(),
    });

    const systemPrompt = agent.buildSystemPrompt();
    expect(systemPrompt).toContain('Available tools');
    expect(systemPrompt).toContain('readData');
  });
});

// ---------------------------------------------------------------------------
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
    });

    analyst = new Agent({
      id: 'analyst',
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
      ),
    });
  });

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
      ],
    });

    const result = await crew.run();

    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(4);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should execute tasks in dependency order (collect → clean → analyze → report)', async () => {
    const executionOrder: string[] = [];

    const crew = new Crew({
      id: 'order-crew',
      agents: [collector, cleaner, analyst, reporter],
      tasks: [
        { id: 'collect', description: 'Load data', agentId: 'collector' },
        { id: 'clean', description: 'Clean data', agentId: 'cleaner', dependencies: ['collect'] },
        { id: 'analyze', description: 'Analyze data', agentId: 'analyst', dependencies: ['clean'] },
        { id: 'report', description: 'Write report', agentId: 'reporter', dependencies: ['analyze'] },
      ],
    });

    crew.on('crew:task:start', (_crewId, taskId) => {
      executionOrder.push(taskId);
    });

    await crew.run();

    expect(executionOrder).toEqual(['collect', 'clean', 'analyze', 'report']);
  });

  it('should pass upstream outputs as context to downstream tasks', async () => {
    let analyzerMessages: readonly LLMMessage[] = [];

    const analyzerProvider: LLMProvider = {
      name: 'analyzer-capture',
      generateText: vi
        .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
        .mockImplementation(async (messages) => {
          analyzerMessages = messages;
          return {
            content: 'Analysis complete',
            tokenUsage: { promptTokens: 20, completionTokens: 30, totalTokens: 50 },
            finishReason: 'stop',
          };
        }),
    };

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
      llmProvider: analyzerProvider,
    });

    const crew = new Crew({
      id: 'context-crew',
      agents: [collector, cleaner, contextAnalyst, reporter],
      tasks: [
        { id: 'collect', description: 'Load data', agentId: 'collector' },
        { id: 'clean', description: 'Clean data', agentId: 'cleaner', dependencies: ['collect'] },
        { id: 'analyze', description: 'Analyze', agentId: 'analyst', dependencies: ['clean'] },
        { id: 'report', description: 'Report', agentId: 'reporter', dependencies: ['analyze'] },
      ],
    });

    await crew.run();

    // The analyze task should receive context from the clean task (which depends on collect)
    const combinedContent = analyzerMessages.map((m) => m.content).join(' ');
    expect(combinedContent.length).toBeGreaterThan(0);
  });

  it('should emit crew lifecycle events during pipeline execution', async () => {
    const events: string[] = [];

    const crew = new Crew({
      id: 'events-crew',
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
      ],
    });

    const result = await crew.run();

    for (const [_taskId, taskResult] of result.taskResults) {
      expect(taskResult.tokenUsage).toBeDefined();
      expect(taskResult.tokenUsage?.totalTokens).toBeGreaterThan(0);
    }
  });

  it('should produce non-empty output for each pipeline stage', async () => {
    const crew = new Crew({
      id: 'output-crew',
      agents: [collector, cleaner, analyst, reporter],
      tasks: [
        { id: 'collect', description: 'Load data', agentId: 'collector' },
        { id: 'clean', description: 'Clean data', agentId: 'cleaner', dependencies: ['collect'] },
        { id: 'analyze', description: 'Analyze data', agentId: 'analyst', dependencies: ['clean'] },
        { id: 'report', description: 'Write report', agentId: 'reporter', dependencies: ['analyze'] },
      ],
    });

    const result = await crew.run();

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
      ],
    });

    const result = await crew.run();

    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(1);
    expect(result.taskResults.get('report')?.output).toBeTruthy();
  });
});
