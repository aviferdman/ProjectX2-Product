/**
 * Tests for TASK-087: Data Analysis Pipeline Example
 *
 * Validates the data analysis pipeline example file, its structure, custom
 * data tools, and that the 4-stage multi-agent pipeline (collect → clean →
 * analyze → report) works end-to-end.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
import { createTool } from '../../src/tool/create-tool.js';
import { ToolCategory } from '../../src/types/tool.js';
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

// Sample dataset matching the example
interface SalesRecord {
  readonly date: string;
  readonly region: string;
  readonly product: string;
  readonly units: number;
  readonly revenue: number;
  readonly cost: number;
}

const SAMPLE_DATASET: readonly SalesRecord[] = [
  { date: '2026-01-15', region: 'North', product: 'Widget A', units: 120, revenue: 2400, cost: 1200 },
  { date: '2026-01-15', region: 'South', product: 'Widget B', units: 85, revenue: 2550, cost: 1275 },
  { date: '2026-02-10', region: 'North', product: 'Widget A', units: 145, revenue: 2900, cost: 1450 },
  { date: '2026-02-10', region: 'East', product: 'Widget C', units: 60, revenue: 1800, cost: 1080 },
  { date: '2026-03-05', region: 'South', product: 'Widget A', units: 200, revenue: 4000, cost: 2000 },
];

// Custom data tools (mirrors the example pattern)
function createReadDataTool() {
  return createTool({
    name: 'readData',
    description: 'Read raw sales data from the data source',
    category: ToolCategory.DATA,
    execute: async (_input: unknown) => ({
      recordCount: SAMPLE_DATASET.length,
      columns: ['date', 'region', 'product', 'units', 'revenue', 'cost'],
      data: SAMPLE_DATASET,
    }),
  });
}

function createCleanDataTool() {
  return createTool({
    name: 'cleanData',
    description: 'Validate and clean a dataset, adding derived columns',
    category: ToolCategory.DATA,
    execute: async (_input: unknown) => {
      const cleaned = SAMPLE_DATASET.map((row) => ({
        ...row,
        profit: row.revenue - row.cost,
        margin: Number((((row.revenue - row.cost) / row.revenue) * 100).toFixed(1)),
      }));
      return {
        recordCount: cleaned.length,
        issuesFound: 0,
        columnsAdded: ['profit', 'margin'],
        data: cleaned,
      };
    },
  });
}

function createComputeStatsTool() {
  return createTool({
    name: 'computeStats',
    description: 'Compute summary statistics on the cleaned sales dataset',
    category: ToolCategory.DATA,
    execute: async (_input: unknown) => {
      const totalUnits = SAMPLE_DATASET.reduce((sum, r) => sum + r.units, 0);
      const totalRevenue = SAMPLE_DATASET.reduce((sum, r) => sum + r.revenue, 0);
      const totalCost = SAMPLE_DATASET.reduce((sum, r) => sum + r.cost, 0);
      const totalProfit = totalRevenue - totalCost;
      const avgMargin = Number(((totalProfit / totalRevenue) * 100).toFixed(1));

      const regionMap = new Map<string, { units: number; revenue: number; profit: number }>();
      for (const r of SAMPLE_DATASET) {
        const existing = regionMap.get(r.region) ?? { units: 0, revenue: 0, profit: 0 };
        existing.units += r.units;
        existing.revenue += r.revenue;
        existing.profit += r.revenue - r.cost;
        regionMap.set(r.region, existing);
      }

      return {
        summary: { totalRecords: SAMPLE_DATASET.length, totalUnits, totalRevenue, totalCost, totalProfit, avgMargin },
        byRegion: Object.fromEntries(regionMap),
        topRegion: [...regionMap.entries()].sort((a, b) => b[1].revenue - a[1].revenue)[0]?.[0],
        trend: 'upward',
      };
    },
  });
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

  it('should import Agent, Crew, and createTool from @crewspace/core', () => {
    expect(content).toContain('Agent');
    expect(content).toContain('Crew');
    expect(content).toContain('createTool');
    expect(content).toContain("from '@crewspace/core'");
  });

  it('should use ToolCategory.DATA for custom tools', () => {
    expect(content).toContain('ToolCategory.DATA');
  });

  it('should create four specialized agents', () => {
    const agentCreations = content.match(/new Agent\(/g) ?? [];
    expect(agentCreations.length).toBe(4);
  });

  it('should create a Crew', () => {
    expect(content).toContain('new Crew');
  });

  it('should call analysisCrew.run()', () => {
    expect(content).toMatch(/\.run\(\)/);
  });

  it('should demonstrate 4-stage task dependencies', () => {
    expect(content).toContain("dependencies: ['collect']");
    expect(content).toContain("dependencies: ['clean']");
    expect(content).toContain("dependencies: ['analyze']");
  });

  it('should define three custom data tools', () => {
    expect(content).toContain("name: 'readData'");
    expect(content).toContain("name: 'cleanData'");
    expect(content).toContain("name: 'computeStats'");
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
    expect(expectedOutputCount).toBeGreaterThanOrEqual(1);
  });

  it('should define a SalesRecord interface', () => {
    expect(content).toContain('interface SalesRecord');
  });

  it('should include a sample dataset', () => {
    expect(content).toMatch(/RAW_DATASET/);
    expect(content).toContain('Widget A');
  });
});

// ---------------------------------------------------------------------------
// Custom data tools
// ---------------------------------------------------------------------------

describe('TASK-087: Data Analysis Pipeline — Custom Data Tools', () => {
  it('should create a readData tool with DATA category', () => {
    const tool = createReadDataTool();
    expect(tool.name).toBe('readData');
    expect(tool.category).toBe(ToolCategory.DATA);
  });

  it('readData tool should return dataset with record count and columns', async () => {
    const tool = createReadDataTool();
    const result = (await tool.execute({})) as {
      recordCount: number;
      columns: string[];
      data: SalesRecord[];
    };
    expect(result.recordCount).toBe(SAMPLE_DATASET.length);
    expect(result.columns).toContain('date');
    expect(result.columns).toContain('revenue');
    expect(result.columns).toContain('cost');
    expect(result.data).toHaveLength(SAMPLE_DATASET.length);
  });

  it('should create a cleanData tool with DATA category', () => {
    const tool = createCleanDataTool();
    expect(tool.name).toBe('cleanData');
    expect(tool.category).toBe(ToolCategory.DATA);
  });

  it('cleanData tool should add profit and margin columns', async () => {
    const tool = createCleanDataTool();
    const result = (await tool.execute({})) as {
      recordCount: number;
      issuesFound: number;
      columnsAdded: string[];
      data: Array<SalesRecord & { profit: number; margin: number }>;
    };
    expect(result.columnsAdded).toContain('profit');
    expect(result.columnsAdded).toContain('margin');
    expect(result.issuesFound).toBe(0);
    // Verify profit calculation: revenue - cost
    const first = result.data[0];
    expect(first.profit).toBe(first.revenue - first.cost);
    expect(first.margin).toBeGreaterThan(0);
    expect(first.margin).toBeLessThanOrEqual(100);
  });

  it('should create a computeStats tool with DATA category', () => {
    const tool = createComputeStatsTool();
    expect(tool.name).toBe('computeStats');
    expect(tool.category).toBe(ToolCategory.DATA);
  });

  it('computeStats tool should return summary statistics', async () => {
    const tool = createComputeStatsTool();
    const result = (await tool.execute({})) as {
      summary: {
        totalRecords: number;
        totalUnits: number;
        totalRevenue: number;
        totalCost: number;
        totalProfit: number;
        avgMargin: number;
      };
      byRegion: Record<string, { units: number; revenue: number; profit: number }>;
      topRegion: string;
      trend: string;
    };
    expect(result.summary.totalRecords).toBe(SAMPLE_DATASET.length);
    expect(result.summary.totalRevenue).toBeGreaterThan(0);
    expect(result.summary.totalProfit).toBe(result.summary.totalRevenue - result.summary.totalCost);
    expect(result.summary.avgMargin).toBeGreaterThan(0);
    expect(result.summary.avgMargin).toBeLessThanOrEqual(100);
    expect(result.byRegion).toBeDefined();
    expect(result.topRegion).toBeDefined();
    expect(result.trend).toBe('upward');
  });

  it('computeStats should aggregate by region correctly', async () => {
    const tool = createComputeStatsTool();
    const result = (await tool.execute({})) as {
      byRegion: Record<string, { units: number; revenue: number; profit: number }>;
    };
    // North has 2 records (120+145=265 units), South has 2 records (85+200=285 units), East has 1 record (60 units)
    expect(result.byRegion['North']?.units).toBe(265);
    expect(result.byRegion['South']?.units).toBe(285);
    expect(result.byRegion['East']?.units).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// Agent + custom tool integration
// ---------------------------------------------------------------------------

describe('TASK-087: Data Analysis Pipeline — Agent Tool Registration', () => {
  it('should register readData tool on collector agent', () => {
    const agent = new Agent({
      id: 'collector',
      role: 'Data Collection Specialist',
      goal: 'Load raw data',
      tools: [createReadDataTool()],
      llmProvider: createMockLLMProvider(),
    });
    expect(agent.hasTool('readData')).toBe(true);
    expect(agent.tools.size).toBe(1);
  });

  it('should register cleanData tool on cleaner agent', () => {
    const agent = new Agent({
      id: 'cleaner',
      role: 'Data Quality Engineer',
      goal: 'Clean data',
      tools: [createCleanDataTool()],
      llmProvider: createMockLLMProvider(),
    });
    expect(agent.hasTool('cleanData')).toBe(true);
    expect(agent.tools.size).toBe(1);
  });

  it('should register computeStats tool on analyst agent', () => {
    const agent = new Agent({
      id: 'analyst',
      role: 'Data Analyst',
      goal: 'Analyze data',
      tools: [createComputeStatsTool()],
      llmProvider: createMockLLMProvider(),
    });
    expect(agent.hasTool('computeStats')).toBe(true);
    expect(agent.tools.size).toBe(1);
  });

  it('should include data tool descriptions in agent system prompt', () => {
    const agent = new Agent({
      id: 'prompted-collector',
      role: 'Data Collector',
      goal: 'Collect data',
      tools: [createReadDataTool()],
      llmProvider: createMockLLMProvider(),
    });
    const systemPrompt = agent.buildSystemPrompt();
    expect(systemPrompt).toContain('Available tools');
    expect(systemPrompt).toContain('readData');
  });

  it('should allow reporter agent with no tools', () => {
    const agent = new Agent({
      id: 'reporter',
      role: 'Report Writer',
      goal: 'Write reports',
      llmProvider: createMockLLMProvider(),
    });
    expect(agent.tools.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Functional validation — 4-stage data analysis pipeline
// ---------------------------------------------------------------------------

describe('TASK-087: Data Analysis Pipeline — Functional Validation', () => {
  let collector: Agent;
  let cleaner: Agent;
  let analyst: Agent;
  let reporter: Agent;

  beforeEach(() => {
    collector = new Agent({
      id: 'collector',
      role: 'Data Collection Specialist',
      goal: 'Load and inspect raw data',
      backstory: 'Experienced data engineer specializing in data ingestion.',
      tools: [createReadDataTool()],
      llmProvider: createMockLLMProvider(
        'Loaded 5 sales records spanning Jan–Mar 2026 across North, South, East regions.',
      ),
    });

    cleaner = new Agent({
      id: 'cleaner',
      role: 'Data Quality Engineer',
      goal: 'Clean and enrich the dataset',
      backstory: 'Meticulous data quality engineer.',
      tools: [createCleanDataTool()],
      llmProvider: createMockLLMProvider(
        'Cleaned dataset: 0 issues found. Added profit and margin columns.',
      ),
    });

    analyst = new Agent({
      id: 'analyst',
      role: 'Data Analyst',
      goal: 'Compute statistics and identify trends',
      backstory: 'Senior data analyst skilled in statistical analysis.',
      tools: [createComputeStatsTool()],
      llmProvider: createMockLLMProvider(
        'Total revenue: $13,650. Top region: South. Trend: upward.',
      ),
    });

    reporter = new Agent({
      id: 'reporter',
      role: 'Business Intelligence Report Writer',
      goal: 'Synthesize findings into a report',
      backstory: 'BI writer who transforms analysis into executive reports.',
      llmProvider: createMockLLMProvider(
        '# Sales Data Analysis Report\n\n## Key Findings\n1. South region leads\n2. Widget A dominates\n3. 50% margins',
      ),
    });
  });

  it('should run the full 4-stage pipeline end-to-end', async () => {
    const crew = new Crew({
      id: 'data-analysis-crew',
      name: 'Data Analysis Pipeline',
      agents: [collector, cleaner, analyst, reporter],
      tasks: [
        { id: 'collect', description: 'Load raw data', agentId: 'collector' },
        { id: 'clean', description: 'Clean the data', agentId: 'cleaner', dependencies: ['collect'] },
        { id: 'analyze', description: 'Compute statistics', agentId: 'analyst', dependencies: ['clean'] },
        { id: 'report', description: 'Write the report', agentId: 'reporter', dependencies: ['analyze'] },
      ],
    });

    const result = await crew.run();

    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(4);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should execute tasks in sequential dependency order', async () => {
    const executionOrder: string[] = [];

    const crew = new Crew({
      id: 'order-crew',
      agents: [collector, cleaner, analyst, reporter],
      tasks: [
        { id: 'collect', description: 'Load raw data', agentId: 'collector' },
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
    let cleanerMessages: readonly LLMMessage[] = [];

    const captureProvider: LLMProvider = {
      name: 'capture-provider',
      generateText: vi
        .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
        .mockImplementation(async (messages) => {
          cleanerMessages = messages;
          return {
            content: 'Cleaned data result',
            tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            finishReason: 'stop',
          };
        }),
    };

    const captureCleaner = new Agent({
      id: 'cleaner',
      role: 'Data Quality Engineer',
      goal: 'Clean data',
      tools: [createCleanDataTool()],
      llmProvider: captureProvider,
    });

    const crew = new Crew({
      id: 'context-crew',
      agents: [collector, captureCleaner, analyst, reporter],
      tasks: [
        { id: 'collect', description: 'Load raw data', agentId: 'collector' },
        { id: 'clean', description: 'Clean the dataset', agentId: 'cleaner', dependencies: ['collect'] },
        { id: 'analyze', description: 'Analyze', agentId: 'analyst', dependencies: ['clean'] },
        { id: 'report', description: 'Report', agentId: 'reporter', dependencies: ['analyze'] },
      ],
    });

    await crew.run();

    // Cleaner should receive collector's output as context
    const userMessage = cleanerMessages.find((m) => m.role === 'user');
    expect(userMessage?.content).toContain('sales records');
  });

  it('should emit all crew lifecycle events for a 4-task pipeline', async () => {
    const events: string[] = [];

    const crew = new Crew({
      id: 'events-crew',
      agents: [collector, cleaner, analyst, reporter],
      tasks: [
        { id: 'collect', description: 'Collect', agentId: 'collector' },
        { id: 'clean', description: 'Clean', agentId: 'cleaner', dependencies: ['collect'] },
        { id: 'analyze', description: 'Analyze', agentId: 'analyst', dependencies: ['clean'] },
        { id: 'report', description: 'Report', agentId: 'reporter', dependencies: ['analyze'] },
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
      'crew:task:start',
      'crew:task:complete',
      'crew:complete',
    ]);
  });

  it('should include token usage in all task results', async () => {
    const crew = new Crew({
      id: 'tokens-crew',
      agents: [collector, cleaner, analyst, reporter],
      tasks: [
        { id: 'collect', description: 'Collect', agentId: 'collector' },
        { id: 'clean', description: 'Clean', agentId: 'cleaner', dependencies: ['collect'] },
        { id: 'analyze', description: 'Analyze', agentId: 'analyst', dependencies: ['clean'] },
        { id: 'report', description: 'Report', agentId: 'reporter', dependencies: ['analyze'] },
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
      agents: [collector, cleaner, analyst, reporter],
      tasks: [
        { id: 'collect', description: 'Collect', agentId: 'collector' },
        { id: 'clean', description: 'Clean', agentId: 'cleaner', dependencies: ['collect'] },
        { id: 'analyze', description: 'Analyze', agentId: 'analyst', dependencies: ['clean'] },
        { id: 'report', description: 'Report', agentId: 'reporter', dependencies: ['analyze'] },
      ],
    });

    const result = await crew.run();

    const collectResult = result.taskResults.get('collect');
    expect(collectResult?.output).toContain('sales records');

    const cleanResult = result.taskResults.get('clean');
    expect(cleanResult?.output).toContain('Cleaned');

    const analyzeResult = result.taskResults.get('analyze');
    expect(analyzeResult?.output).toContain('revenue');

    const reportResult = result.taskResults.get('report');
    expect(reportResult?.output).toContain('Report');
  });

  it('should correctly assign agent IDs to task results', async () => {
    const crew = new Crew({
      id: 'agent-id-crew',
      agents: [collector, cleaner, analyst, reporter],
      tasks: [
        { id: 'collect', description: 'Collect', agentId: 'collector' },
        { id: 'clean', description: 'Clean', agentId: 'cleaner', dependencies: ['collect'] },
        { id: 'analyze', description: 'Analyze', agentId: 'analyst', dependencies: ['clean'] },
        { id: 'report', description: 'Report', agentId: 'reporter', dependencies: ['analyze'] },
      ],
    });

    const result = await crew.run();

    expect(result.taskResults.get('collect')?.agentId).toBe('collector');
    expect(result.taskResults.get('clean')?.agentId).toBe('cleaner');
    expect(result.taskResults.get('analyze')?.agentId).toBe('analyst');
    expect(result.taskResults.get('report')?.agentId).toBe('reporter');
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('TASK-087: Data Analysis Pipeline — Edge Cases', () => {
  it('should reject circular dependencies in pipeline tasks', () => {
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

  it('should handle agent with multiple data tools', () => {
    const agent = new Agent({
      id: 'multi-tool-agent',
      role: 'Full-Stack Data Engineer',
      goal: 'Do all data operations',
      tools: [createReadDataTool(), createCleanDataTool(), createComputeStatsTool()],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.tools.size).toBe(3);
    expect(agent.hasTool('readData')).toBe(true);
    expect(agent.hasTool('cleanData')).toBe(true);
    expect(agent.hasTool('computeStats')).toBe(true);
    const systemPrompt = agent.buildSystemPrompt();
    expect(systemPrompt).toContain('readData');
    expect(systemPrompt).toContain('cleanData');
    expect(systemPrompt).toContain('computeStats');
  });

  it('should fail if a data agent has no LLM provider', async () => {
    const agent = new Agent({
      id: 'no-llm-collector',
      role: 'Collector',
      goal: 'Collect data',
      tools: [createReadDataTool()],
    });

    await expect(agent.execute({ description: 'Load the dataset' })).rejects.toThrow(
      'No LLM provider configured',
    );
  });

  it('should handle a single-task data crew', async () => {
    const agent = new Agent({
      id: 'solo-analyst',
      role: 'Solo Analyst',
      goal: 'Do everything',
      tools: [createReadDataTool(), createComputeStatsTool()],
      llmProvider: createMockLLMProvider('Solo analysis complete'),
    });

    const crew = new Crew({
      id: 'solo-crew',
      agents: [agent],
      tasks: [
        {
          id: 'analyze-all',
          description: 'Read and analyze data',
          agentId: 'solo-analyst',
        },
      ],
    });

    const result = await crew.run();
    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(1);
    expect(result.taskResults.get('analyze-all')?.output).toBe('Solo analysis complete');
  });

  it('should handle data pipeline with expectedOutput on tasks', async () => {
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
          description: 'Collect and analyze data',
          expectedOutput: 'A statistical summary with breakdowns by region',
          agentId: 'agent-1',
        },
      ],
    });

    const result = await crew.run();
    expect(result.success).toBe(true);
  });
});
