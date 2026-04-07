/**
 * Benchmark documentation generator.
 *
 * Reads detailed benchmark results (JSONL) and baseline data, then generates
 * a VitePress-compatible markdown page at docs/guide/benchmarks.md.
 *
 * Usage:
 *   npx tsx scripts/generate-benchmark-docs.ts [--results path] [--baseline path] [--output path]
 *
 * @packageDocumentation
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DetailedResult {
  readonly name: string;
  readonly iterations: number;
  readonly totalMs: number;
  readonly avgMs: number;
  readonly minMs: number;
  readonly maxMs: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly opsPerSecond: number;
  readonly budget: number;
  readonly withinBudget: boolean;
}

export interface BaselineEntry {
  readonly p95Ms: number;
  readonly avgMs: number;
  readonly budget: number;
}

export interface Baseline {
  readonly version: number;
  readonly timestamp: string;
  readonly entries: Readonly<Record<string, BaselineEntry>>;
}

export interface CategoryGroup {
  readonly name: string;
  readonly results: readonly DetailedResult[];
}

// ---------------------------------------------------------------------------
// I/O helpers
// ---------------------------------------------------------------------------

export function loadDetailedResults(filePath: string): DetailedResult[] {
  const raw = readFileSync(filePath, 'utf-8').trim();
  if (raw.length === 0) return [];

  return raw
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as DetailedResult);
}

export function loadBaseline(filePath: string): Baseline {
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Baseline;
}

// ---------------------------------------------------------------------------
// Categorization
// ---------------------------------------------------------------------------

export function categorize(name: string): string {
  if (name.startsWith('Agent')) return 'Agent Initialization';
  if (name.startsWith('Memory')) return 'Memory Operations';
  if (name.startsWith('Task')) return 'Task Lifecycle';
  if (name.startsWith('Engine')) return 'Execution Engine';
  if (name.startsWith('Tool')) return 'Tool System';
  if (
    name.includes('Workflow') ||
    name.includes('Crewspace:') ||
    name.includes('LangChain') ||
    name.includes('CrewAI')
  )
    return 'Cross-Framework Comparison';
  return 'Other';
}

export function groupByCategory(results: readonly DetailedResult[]): CategoryGroup[] {
  const categoryOrder = [
    'Agent Initialization',
    'Task Lifecycle',
    'Execution Engine',
    'Memory Operations',
    'Tool System',
    'Cross-Framework Comparison',
    'Other',
  ];

  const map = new Map<string, DetailedResult[]>();
  for (const result of results) {
    const category = categorize(result.name);
    let arr = map.get(category);
    if (arr === undefined) {
      arr = [];
      map.set(category, arr);
    }
    arr.push(result);
  }

  const groups: CategoryGroup[] = [];
  for (const name of categoryOrder) {
    const results = map.get(name);
    if (results !== undefined && results.length > 0) {
      groups.push({ name, results });
    }
  }

  // Add any remaining categories not in the predefined order
  for (const [name, results] of map) {
    if (!categoryOrder.includes(name) && results.length > 0) {
      groups.push({ name, results });
    }
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Markdown generation (pure)
// ---------------------------------------------------------------------------

function formatNumber(n: number, decimals = 3): string {
  return n.toFixed(decimals);
}

function formatOps(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

function statusIcon(withinBudget: boolean): string {
  return withinBudget ? '✅' : '❌';
}

function generateCategoryTable(group: CategoryGroup): string {
  const lines: string[] = [];

  lines.push(`### ${group.name}`);
  lines.push('');
  lines.push(
    '| Benchmark | Avg (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Ops/sec | Budget (ms) | Status |',
  );
  lines.push(
    '|-----------|----------|----------|----------|----------|---------|-------------|--------|',
  );

  for (const r of group.results) {
    const status = statusIcon(r.withinBudget);
    lines.push(
      `| ${r.name} | ${formatNumber(r.avgMs)} | ${formatNumber(r.p50Ms)} | ${formatNumber(r.p95Ms)} | ${formatNumber(r.p99Ms)} | ${formatOps(r.opsPerSecond)} | ${String(r.budget)} | ${status} |`,
    );
  }

  lines.push('');
  return lines.join('\n');
}

function generateComparisonSummary(results: readonly DetailedResult[]): string {
  const frameworks = results.filter((r) => r.name.includes('Workflow'));

  if (frameworks.length === 0) return '';

  const lines: string[] = [];
  lines.push('### Framework Overhead Comparison');
  lines.push('');
  lines.push('The following table shows the overhead of each framework running an identical');
  lines.push(
    '3-task "Research Assistant" workflow with mock LLM responses (zero network latency).',
  );
  lines.push('');
  lines.push('| Framework | Avg (ms) | p95 (ms) | Ops/sec | Budget (ms) | Status |');
  lines.push('|-----------|----------|----------|---------|-------------|--------|');

  for (const r of frameworks) {
    const status = statusIcon(r.withinBudget);
    const name = r.name.replace(': Research Assistant Workflow', '');
    lines.push(
      `| ${name} | ${formatNumber(r.avgMs)} | ${formatNumber(r.p95Ms)} | ${formatOps(r.opsPerSecond)} | ${String(r.budget)} | ${status} |`,
    );
  }

  lines.push('');
  return lines.join('\n');
}

export function generateBenchmarkDocs(
  results: readonly DetailedResult[],
  baseline?: Baseline,
): string {
  const groups = groupByCategory(results);
  const allPassing = results.every((r) => r.withinBudget);
  const totalBenchmarks = results.length;
  const passingCount = results.filter((r) => r.withinBudget).length;

  const lines: string[] = [];

  // --- Frontmatter & Title ---
  lines.push('# Benchmarks');
  lines.push('');
  lines.push('Crewspace maintains a comprehensive benchmark suite to track performance');
  lines.push('across releases and prevent regressions. This page documents our latest');
  lines.push('benchmark results and the methodology used to produce them.');
  lines.push('');

  // --- Summary ---
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Total benchmarks:** ${String(totalBenchmarks)}`);
  lines.push(`- **Passing:** ${String(passingCount)} / ${String(totalBenchmarks)}`);
  lines.push(
    `- **Budget compliance:** ${allPassing ? '✅ All within budget' : '❌ Some benchmarks exceed budget'}`,
  );
  if (baseline) {
    lines.push(`- **Baseline timestamp:** ${baseline.timestamp}`);
  }
  lines.push('');

  // --- Methodology ---
  lines.push('## Methodology');
  lines.push('');
  lines.push('### Measurement Approach');
  lines.push('');
  lines.push('Each benchmark follows a rigorous, repeatable protocol:');
  lines.push('');
  lines.push(
    '1. **Setup** — Initialize fixtures (agents, tasks, memory stores) once before measurement.',
  );
  lines.push(
    '2. **Warmup** — Execute 10 warm-up iterations (discarded) to allow JIT compilation and cache warming.',
  );
  lines.push(
    '3. **Measured runs** — Execute 1,000–10,000 iterations (depending on operation cost), recording `performance.now()` timestamps for each run.',
  );
  lines.push('4. **Statistical analysis** — Sort all timings and compute:');
  lines.push('   - **Average (mean)** — Sum of all timings divided by iteration count.');
  lines.push('   - **p50 (median)** — 50th percentile latency; represents typical performance.');
  lines.push('   - **p95** — 95th percentile latency; used for budget enforcement.');
  lines.push('   - **p99** — 99th percentile latency; captures worst-case tail latency.');
  lines.push('   - **Operations per second** — Computed as `1000 / avgMs`.');
  lines.push('5. **Teardown** — Clean up any resources created during setup.');
  lines.push('');
  lines.push('### Performance Budgets');
  lines.push('');
  lines.push('Every benchmark has an explicit **p95 latency budget**. A benchmark passes');
  lines.push('if its 95th-percentile latency is at or below the budget. Budgets are');
  lines.push('conservative upper bounds, not targets — actual performance is typically');
  lines.push('well below the budget threshold.');
  lines.push('');
  lines.push('| Category | Budget | Rationale |');
  lines.push('|----------|--------|-----------|');
  lines.push(
    '| Agent initialization | 100 ms | Agents are created at startup; must be fast enough for interactive use. |',
  );
  lines.push(
    '| Task initialization | 100 ms | Tasks are created dynamically; budget matches agent init. |',
  );
  lines.push(
    '| Memory operations | 50 ms | Memory is accessed on every agent turn; must be low-latency. |',
  );
  lines.push(
    '| Tool invocation | 50 ms | Tool overhead must be negligible compared to tool execution time. |',
  );
  lines.push('| Engine initialization | 100 ms | Engine is created once per workflow. |');
  lines.push(
    '| Engine execution (workflow) | 5,000 ms | Full workflow execution including task scheduling overhead. |',
  );
  lines.push('');
  lines.push('### Regression Detection');
  lines.push('');
  lines.push('Benchmark results are compared against a committed baseline (stored in');
  lines.push('`packages/core/benchmarks/baseline.json`). The CI pipeline flags:');
  lines.push('');
  lines.push('- **Warning** (>5% regression) — PR description must justify the change.');
  lines.push(
    '- **Regression** (>15% regression) — PR is blocked until fixed or baseline is updated with team approval.',
  );
  lines.push('- **Improvement** (>5% faster) — Automatically noted in the CI summary.');
  lines.push('');
  lines.push('### Environment');
  lines.push('');
  lines.push('- **Runtime:** Node.js 18+ with V8 JIT compilation');
  lines.push(
    '- **LLM providers:** Mock providers with zero network latency (isolates framework overhead)',
  );
  lines.push('- **Test runner:** Vitest with custom `measurePerformance()` harness');
  lines.push('- **Timing:** `performance.now()` high-resolution timestamps');
  lines.push('');

  // --- Results ---
  lines.push('## Results');
  lines.push('');

  for (const group of groups) {
    if (group.name === 'Cross-Framework Comparison') {
      lines.push(generateComparisonSummary(group.results));
      lines.push(generateCategoryTable(group));
    } else {
      lines.push(generateCategoryTable(group));
    }
  }

  // --- How to run ---
  lines.push('## Running Benchmarks');
  lines.push('');
  lines.push('To reproduce these results locally:');
  lines.push('');
  lines.push('```bash');
  lines.push('# Install dependencies');
  lines.push('npm install');
  lines.push('');
  lines.push('# Run the full benchmark suite');
  lines.push('cd packages/core');
  lines.push('npm run bench');
  lines.push('');
  lines.push('# Compare against baseline');
  lines.push('npm run bench:compare');
  lines.push('');
  lines.push('# Generate a performance report');
  lines.push('npm run bench:report');
  lines.push('');
  lines.push('# Update baseline (requires team approval)');
  lines.push('npm run bench:update-baseline');
  lines.push('```');
  lines.push('');
  lines.push('### Regenerating This Page');
  lines.push('');
  lines.push('This documentation is generated from benchmark data. To regenerate:');
  lines.push('');
  lines.push('```bash');
  lines.push('npx tsx scripts/generate-benchmark-docs.ts');
  lines.push('```');
  lines.push('');

  // --- Cross-framework methodology ---
  lines.push('## Cross-Framework Comparison Methodology');
  lines.push('');
  lines.push('The comparison benchmarks run an identical "Research Assistant" workflow');
  lines.push('across three frameworks:');
  lines.push('');
  lines.push('- **Crewspace** — native implementation using the `@crewspace/core` API');
  lines.push('- **LangChain.js** — behavioral shim replicating the LangChain.js execution model');
  lines.push('- **CrewAI** — behavioral shim replicating the CrewAI execution model');
  lines.push('');
  lines.push('All frameworks:');
  lines.push('');
  lines.push('1. Use mock LLM providers returning deterministic responses (zero network latency).');
  lines.push('2. Execute three tasks in sequence: **Search → Analyze → Write Report**.');
  lines.push('3. Use the same agent specifications (Researcher, Analyst, Writer).');
  lines.push('4. Produce structurally equivalent output verified by assertion.');
  lines.push('');
  lines.push('This isolates **framework overhead** — the time spent on orchestration,');
  lines.push('task scheduling, and inter-agent communication — from LLM inference time.');
  lines.push('');
  lines.push('::: info');
  lines.push('LangChain.js and CrewAI results use behavioral shims that replicate the');
  lines.push('execution patterns of those frameworks without importing their actual');
  lines.push('dependencies. This measures architectural overhead patterns, not exact');
  lines.push('library performance.');
  lines.push(':::');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv: readonly string[]): {
  results: string;
  baseline: string | null;
  output: string;
} {
  const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  let results = resolve(rootDir, 'packages', 'core', 'benchmark-results-detailed.jsonl');
  let baseline: string | null = resolve(rootDir, 'packages', 'core', 'benchmarks', 'baseline.json');
  let output = resolve(rootDir, 'docs', 'guide', 'benchmarks.md');

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next: string | undefined = argv[i + 1];
    if (arg === '--results' && next !== undefined) {
      results = resolve(next);
      i++;
    } else if (arg === '--baseline' && next !== undefined) {
      baseline = resolve(next);
      i++;
    } else if (arg === '--no-baseline') {
      baseline = null;
    } else if (arg === '--output' && next !== undefined) {
      output = resolve(next);
      i++;
    }
  }

  return { results, baseline, output };
}

export function main(argv: readonly string[] = process.argv.slice(2)): number {
  const { results: resultsPath, baseline: baselinePath, output: outputPath } = parseArgs(argv);

  // eslint-disable-next-line no-console
  console.log('Generating benchmark documentation...');
  // eslint-disable-next-line no-console
  console.log(`  Results:  ${resultsPath}`);
  if (baselinePath !== null) {
    // eslint-disable-next-line no-console
    console.log(`  Baseline: ${baselinePath}`);
  }
  // eslint-disable-next-line no-console
  console.log(`  Output:   ${outputPath}`);
  // eslint-disable-next-line no-console
  console.log('');

  let results: DetailedResult[];
  try {
    results = loadDetailedResults(resultsPath);
  } catch {
    // eslint-disable-next-line no-console
    console.error(`Error: Could not read results file at ${resultsPath}`);
    return 1;
  }

  if (results.length === 0) {
    // eslint-disable-next-line no-console
    console.error('Error: No benchmark results found.');
    return 1;
  }

  let baseline: Baseline | undefined;
  if (baselinePath !== null) {
    try {
      baseline = loadBaseline(baselinePath);
    } catch {
      // eslint-disable-next-line no-console
      console.log('Warning: Could not load baseline. Generating docs without baseline info.');
    }
  }

  const markdown = generateBenchmarkDocs(results, baseline);
  writeFileSync(outputPath, markdown, 'utf-8');

  // eslint-disable-next-line no-console
  console.log(`Benchmark docs written to: ${outputPath}`);
  return 0;
}

// Run if executed directly
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile || process.argv[1]?.endsWith('generate-benchmark-docs.ts')) {
  process.exit(main());
}
