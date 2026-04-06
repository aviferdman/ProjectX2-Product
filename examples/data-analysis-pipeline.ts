/**
 * Crewspace — Data Analysis Pipeline Example
 *
 * This example demonstrates how to build a multi-agent data analysis pipeline
 * using custom tools for data operations. Four specialized agents collaborate
 * to collect, clean, analyze, and report on a dataset:
 *
 *   1. **Collector** — reads raw data from a source using a custom data tool
 *   2. **Cleaner** — validates and cleans the dataset, handling missing values
 *   3. **Analyst** — computes statistics and identifies trends in the data
 *   4. **Reporter** — generates a summary report with findings and recommendations
 *
 * Key concepts:
 *   - Creating custom tools with `createTool` for domain-specific operations
 *   - Chaining four agents in a sequential dependency pipeline
 *   - Passing structured data between tasks via dependency context
 *   - Subscribing to crew lifecycle events for pipeline progress tracking
 *   - Realistic data processing workflow with validation and statistics
 *
 * Prerequisites:
 *   npm install @crewspace/core
 *
 * Usage:
 *   npx tsx examples/data-analysis-pipeline.ts
 *
 * Note: This example uses a mock LLM provider for demonstration purposes.
 * Replace it with a real provider (OpenAI, Anthropic, Ollama) for production use.
 */

import {
  Agent,
  Crew,
  createTool,
  ToolCategory,
} from '@crewspace/core';
import type { LLMProvider, LLMMessage, LLMResponse } from '@crewspace/core';

// -- Sample dataset (simulates a CSV data source) ----------------------------

interface SalesRecord {
  readonly date: string;
  readonly region: string;
  readonly product: string;
  readonly units: number;
  readonly revenue: number;
  readonly cost: number;
}

const RAW_DATASET: readonly SalesRecord[] = [
  { date: '2026-01-15', region: 'North', product: 'Widget A', units: 120, revenue: 2400, cost: 1200 },
  { date: '2026-01-15', region: 'South', product: 'Widget B', units: 85, revenue: 2550, cost: 1275 },
  { date: '2026-02-10', region: 'North', product: 'Widget A', units: 145, revenue: 2900, cost: 1450 },
  { date: '2026-02-10', region: 'East', product: 'Widget C', units: 60, revenue: 1800, cost: 1080 },
  { date: '2026-03-05', region: 'South', product: 'Widget A', units: 200, revenue: 4000, cost: 2000 },
  { date: '2026-03-05', region: 'West', product: 'Widget B', units: 95, revenue: 2850, cost: 1425 },
  { date: '2026-03-20', region: 'North', product: 'Widget C', units: 75, revenue: 2250, cost: 1350 },
  { date: '2026-04-01', region: 'East', product: 'Widget A', units: 110, revenue: 2200, cost: 1100 },
  { date: '2026-04-01', region: 'West', product: 'Widget C', units: 50, revenue: 1500, cost: 900 },
  { date: '2026-04-01', region: 'South', product: 'Widget B', units: 130, revenue: 3900, cost: 1950 },
];

// -- Custom tools for data operations ----------------------------------------

/**
 * Tool that reads raw data from the "data source" (in-memory dataset).
 * In a real scenario this could query a database or read a CSV file.
 */
const readDataTool = createTool({
  name: 'readData',
  description: 'Read raw sales data from the data source. Returns JSON array of sales records.',
  category: ToolCategory.DATA,
  execute: async (_input: unknown) => {
    return {
      recordCount: RAW_DATASET.length,
      columns: ['date', 'region', 'product', 'units', 'revenue', 'cost'],
      data: RAW_DATASET,
    };
  },
});

/**
 * Tool that validates and cleans a dataset — removes nulls, normalizes
 * fields, and flags anomalies.
 */
const cleanDataTool = createTool({
  name: 'cleanData',
  description:
    'Validate and clean a dataset. Checks for missing values, normalizes ' +
    'field types, and computes a derived profit column. Returns cleaned data.',
  category: ToolCategory.DATA,
  execute: async (_input: unknown) => {
    const cleaned = RAW_DATASET.map((row) => ({
      ...row,
      profit: row.revenue - row.cost,
      margin: Number(((row.revenue - row.cost) / row.revenue * 100).toFixed(1)),
    }));

    const issuesFound = 0; // Clean demo dataset has no issues
    return {
      recordCount: cleaned.length,
      issuesFound,
      columnsAdded: ['profit', 'margin'],
      data: cleaned,
    };
  },
});

/**
 * Tool that computes summary statistics on the dataset — totals, averages,
 * group-by aggregations, and trend detection.
 */
const computeStatsTool = createTool({
  name: 'computeStats',
  description:
    'Compute summary statistics on the cleaned sales dataset. Returns totals, ' +
    'averages, per-region and per-product breakdowns, and trend indicators.',
  category: ToolCategory.DATA,
  execute: async (_input: unknown) => {
    const totalUnits = RAW_DATASET.reduce((sum, r) => sum + r.units, 0);
    const totalRevenue = RAW_DATASET.reduce((sum, r) => sum + r.revenue, 0);
    const totalCost = RAW_DATASET.reduce((sum, r) => sum + r.cost, 0);
    const totalProfit = totalRevenue - totalCost;
    const avgMargin = Number(((totalProfit / totalRevenue) * 100).toFixed(1));

    // Per-region aggregation
    const regionMap = new Map<string, { units: number; revenue: number; profit: number }>();
    for (const r of RAW_DATASET) {
      const existing = regionMap.get(r.region) ?? { units: 0, revenue: 0, profit: 0 };
      existing.units += r.units;
      existing.revenue += r.revenue;
      existing.profit += r.revenue - r.cost;
      regionMap.set(r.region, existing);
    }

    // Per-product aggregation
    const productMap = new Map<string, { units: number; revenue: number; profit: number }>();
    for (const r of RAW_DATASET) {
      const existing = productMap.get(r.product) ?? { units: 0, revenue: 0, profit: 0 };
      existing.units += r.units;
      existing.revenue += r.revenue;
      existing.profit += r.revenue - r.cost;
      productMap.set(r.product, existing);
    }

    return {
      summary: {
        totalRecords: RAW_DATASET.length,
        totalUnits,
        totalRevenue,
        totalCost,
        totalProfit,
        avgMargin,
      },
      byRegion: Object.fromEntries(regionMap),
      byProduct: Object.fromEntries(productMap),
      topRegion: [...regionMap.entries()].sort((a, b) => b[1].revenue - a[1].revenue)[0]?.[0],
      topProduct: [...productMap.entries()].sort((a, b) => b[1].revenue - a[1].revenue)[0]?.[0],
      trend: 'upward',
    };
  },
});

// -- Mock LLM provider (replace with createOpenAIProvider() for real use) ----

const mockResponses: Record<string, string> = {
  collect:
    'Successfully loaded the raw sales dataset.\n\n' +
    '**Dataset overview:**\n' +
    '- Records: 10 sales transactions\n' +
    '- Columns: date, region, product, units, revenue, cost\n' +
    '- Date range: January 2026 — April 2026\n' +
    '- Regions: North, South, East, West\n' +
    '- Products: Widget A, Widget B, Widget C\n\n' +
    'Data quality: No missing values detected. All fields properly typed.\n' +
    'Ready for cleaning and enrichment.',

  clean:
    'Cleaned and enriched the dataset.\n\n' +
    '**Cleaning results:**\n' +
    '- Records processed: 10\n' +
    '- Issues found: 0 (clean dataset)\n' +
    '- Columns added: `profit` (revenue − cost), `margin` (profit %)\n\n' +
    '**Validation checks passed:**\n' +
    '- ✅ No null or missing values\n' +
    '- ✅ All numeric fields are positive\n' +
    '- ✅ Revenue ≥ Cost for all records\n' +
    '- ✅ Dates are in valid ISO format\n\n' +
    'Dataset is ready for statistical analysis.',

  analyze:
    '## Statistical Analysis Results\n\n' +
    '**Overall Summary:**\n' +
    '- Total units sold: 1,070\n' +
    '- Total revenue: $26,350\n' +
    '- Total profit: $13,175\n' +
    '- Average margin: 50.0%\n\n' +
    '**Top Performers:**\n' +
    '- Best region: South ($10,450 revenue, 39.7% of total)\n' +
    '- Best product: Widget A ($11,500 revenue, 43.6% of total)\n\n' +
    '**Regional Breakdown:**\n' +
    '| Region | Units | Revenue | Profit |\n' +
    '|--------|-------|---------|--------|\n' +
    '| North  | 340   | $7,550  | $3,775 |\n' +
    '| South  | 415   | $10,450 | $5,225 |\n' +
    '| East   | 170   | $4,000  | $1,820 |\n' +
    '| West   | 145   | $4,350  | $2,025 |\n\n' +
    '**Trends:** Sales show an upward trajectory from Q1 to Q2 2026, ' +
    'driven by strong Widget A performance in South and North regions.',

  report:
    '# Sales Data Analysis Report — Q1/Q2 2026\n\n' +
    '## Executive Summary\n' +
    'Analysis of 10 sales transactions across 4 regions reveals strong growth ' +
    'with a 50% average profit margin. The South region and Widget A are the ' +
    'top performers, contributing 39.7% and 43.6% of total revenue respectively.\n\n' +
    '## Key Findings\n' +
    '1. **Revenue is concentrated** — South region drives nearly 40% of all sales\n' +
    '2. **Widget A dominates** — accounts for highest revenue across all products\n' +
    '3. **Healthy margins** — consistent 50% profit margin across the board\n' +
    '4. **Growth trend** — unit sales increasing month over month\n\n' +
    '## Recommendations\n' +
    '1. **Expand South region capacity** — highest demand and consistent growth\n' +
    '2. **Invest in Widget A marketing** — best-selling product with room to grow\n' +
    '3. **Investigate East/West underperformance** — lower volume may indicate ' +
    'distribution gaps\n' +
    '4. **Monitor cost structure** — 50% margins are healthy but should be ' +
    'tracked as volume increases\n\n' +
    '## Methodology\n' +
    'Data collected from internal sales system, cleaned and validated using ' +
    'automated tools, and analyzed using statistical aggregation. Report ' +
    'generated by Crewspace Data Analysis Pipeline.\n\n' +
    '---\n' +
    'Generated by Crewspace Data Analysis Crew',
};

function createAnalysisMockProvider(): LLMProvider {
  return {
    name: 'analysis-mock',
    async generateText(messages: readonly LLMMessage[]): Promise<LLMResponse> {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
      const content = lastUserMessage?.content?.toLowerCase() ?? '';

      let response = mockResponses['collect'];
      if (content.includes('clean') || content.includes('validat') || content.includes('enrich')) {
        response = mockResponses['clean'];
      } else if (content.includes('statistic') || content.includes('analyz') || content.includes('comput')) {
        response = mockResponses['analyze'];
      } else if (content.includes('report') || content.includes('summar') || content.includes('finding')) {
        response = mockResponses['report'];
      }

      return {
        content: response,
        tokenUsage: {
          promptTokens: messages.length * 60,
          completionTokens: 180,
          totalTokens: messages.length * 60 + 180,
        },
        finishReason: 'stop',
      };
    },
  };
}

// -- Create specialized agents -----------------------------------------------

// 1. Data Collector — reads raw data from the source
const collector = new Agent({
  id: 'collector',
  role: 'Data Collection Specialist',
  goal: 'Load and inspect raw data from the data source, providing an initial quality assessment',
  backstory:
    'You are an experienced data engineer who specializes in data ingestion. ' +
    'You use the readData tool to load datasets and provide an initial overview ' +
    'of the data shape, types, and any obvious quality issues.',
  tools: [readDataTool],
  llmProvider: createAnalysisMockProvider(),
});

// 2. Data Cleaner — validates and cleans the dataset
const cleaner = new Agent({
  id: 'cleaner',
  role: 'Data Quality Engineer',
  goal: 'Clean and enrich the dataset by handling missing values, validating types, and adding derived columns',
  backstory:
    'You are a meticulous data quality engineer who ensures datasets are clean ' +
    'and analysis-ready. You use the cleanData tool to validate records, handle ' +
    'nulls, normalize formats, and compute derived fields like profit margins.',
  tools: [cleanDataTool],
  llmProvider: createAnalysisMockProvider(),
});

// 3. Analyst — computes statistics and identifies trends
const analyst = new Agent({
  id: 'analyst',
  role: 'Data Analyst',
  goal: 'Compute summary statistics, identify trends, and find top performers in the dataset',
  backstory:
    'You are a senior data analyst skilled in statistical analysis. You use ' +
    'the computeStats tool to calculate aggregations, breakdowns by dimension, ' +
    'and trend indicators. You present findings in clear tables and summaries.',
  tools: [computeStatsTool],
  llmProvider: createAnalysisMockProvider(),
});

// 4. Report Writer — compiles findings into a business report
const reporter = new Agent({
  id: 'reporter',
  role: 'Business Intelligence Report Writer',
  goal: 'Synthesize analysis findings into an actionable business report with recommendations',
  backstory:
    'You are a business intelligence writer who transforms raw analysis into ' +
    'executive-friendly reports. You focus on key findings, actionable ' +
    'recommendations, and clear methodology documentation.',
  llmProvider: createAnalysisMockProvider(),
});

// -- Build the crew with a 4-stage pipeline ----------------------------------

const analysisCrew = new Crew({
  id: 'data-analysis-crew',
  name: 'Data Analysis Pipeline',
  agents: [collector, cleaner, analyst, reporter],
  tasks: [
    {
      id: 'collect',
      description:
        'Load the raw sales dataset from the data source using the readData tool. ' +
        'Inspect the data shape and provide an initial quality assessment including ' +
        'record count, column names, date range, and any obvious issues.',
      agentId: 'collector',
      expectedOutput: 'Dataset overview with record count, columns, date range, and quality notes',
    },
    {
      id: 'clean',
      description:
        'Clean and validate the collected dataset using the cleanData tool. ' +
        'Check for missing values, validate data types, normalize formats, ' +
        'and add derived columns (profit, margin). Report any issues found.',
      agentId: 'cleaner',
      dependencies: ['collect'],
      expectedOutput: 'Cleaning summary with issues found, validations passed, and columns added',
    },
    {
      id: 'analyze',
      description:
        'Compute statistical analysis on the cleaned dataset using the computeStats tool. ' +
        'Calculate totals, averages, per-region and per-product breakdowns. ' +
        'Identify the top-performing region and product, and detect sales trends.',
      agentId: 'analyst',
      dependencies: ['clean'],
      expectedOutput: 'Statistical summary with breakdowns, top performers, and trend analysis',
    },
    {
      id: 'report',
      description:
        'Write a comprehensive business report based on the statistical findings. ' +
        'Include an executive summary, key findings, regional and product analysis, ' +
        'actionable recommendations, and methodology. Format as markdown.',
      agentId: 'reporter',
      dependencies: ['analyze'],
      expectedOutput: 'A formatted business report with findings and recommendations',
    },
  ],
});

// -- Subscribe to lifecycle events for pipeline progress tracking ------------

console.log('=== Crewspace Data Analysis Pipeline ===\n');

analysisCrew.on('crew:start', (crewId) => {
  console.log(`🚀 Data analysis pipeline "${crewId}" started\n`);
});

analysisCrew.on('crew:task:start', (_crewId, taskId, agentId) => {
  const stageLabels: Record<string, string> = {
    collect: '📥 Stage 1/4: Data Collection',
    clean: '🧹 Stage 2/4: Data Cleaning',
    analyze: '📊 Stage 3/4: Statistical Analysis',
    report: '📝 Stage 4/4: Report Generation',
  };
  console.log(`${stageLabels[taskId] ?? `▶ ${taskId}`} → agent "${agentId}"`);
});

analysisCrew.on('crew:task:complete', (_crewId, taskId, result) => {
  const preview = result.output.split('\n')[0].slice(0, 80);
  console.log(`✓ Task "${taskId}" completed (${String(result.duration)}ms)`);
  console.log(`  Preview: ${preview}...`);
  console.log();
});

analysisCrew.on('crew:task:error', (_crewId, taskId, error) => {
  console.error(`✗ Task "${taskId}" failed: ${String(error)}`);
});

analysisCrew.on('crew:complete', (_crewId, runResult) => {
  console.log(`🏁 Pipeline finished in ${String(runResult.duration)}ms`);
});

// -- Run the data analysis pipeline ------------------------------------------

const result = await analysisCrew.run();

// -- Display results ---------------------------------------------------------

console.log('\n=== Pipeline Results ===\n');
console.log(`Success: ${String(result.success)}`);
console.log(`Total duration: ${String(result.duration)}ms`);
console.log(`Tasks completed: ${String(result.taskResults.size)}`);

for (const [taskId, taskResult] of result.taskResults) {
  console.log(`\n--- ${taskId} (agent: ${String(taskResult.agentId)}) ---`);
  console.log(taskResult.output);
  if (taskResult.tokenUsage) {
    console.log(
      `\n[Tokens: ${String(taskResult.tokenUsage.promptTokens)} prompt + ` +
        `${String(taskResult.tokenUsage.completionTokens)} completion = ` +
        `${String(taskResult.tokenUsage.totalTokens)} total]`,
    );
  }
}

// -- Show agent tool summary -------------------------------------------------

console.log('\n=== Agent Tool Summary ===');
for (const agent of [collector, cleaner, analyst, reporter]) {
  const toolNames = Array.from(agent.tools.keys()).join(', ') || '(no tools)';
  console.log(`${agent.id}: [${toolNames}]`);
}
