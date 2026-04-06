/**
 * Performance dashboard report generator.
 *
 * Generates a markdown report from benchmark results, optionally comparing
 * against a baseline to show trends.
 *
 * Usage:
 *   npx tsx scripts/generate-perf-report.ts [--results path] [--baseline path] [--output path]
 *
 * @packageDocumentation
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Baseline, CurrentResult } from './compare-benchmarks.js';
import { loadBaseline, loadCurrentResults } from './compare-benchmarks.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportEntry {
  readonly name: string;
  readonly avgMs: number;
  readonly p95Ms: number;
  readonly budget: number;
  readonly withinBudget: boolean;
  readonly baselineP95: number | null;
  readonly trend: 'faster' | 'slower' | 'stable' | 'new';
}

export interface PerformanceReport {
  readonly timestamp: string;
  readonly totalBenchmarks: number;
  readonly allWithinBudget: boolean;
  readonly categories: ReadonlyMap<string, readonly ReportEntry[]>;
  readonly markdown: string;
}

// ---------------------------------------------------------------------------
// Categorization
// ---------------------------------------------------------------------------

function categorize(name: string): string {
  if (name.startsWith('Agent')) return 'Agent';
  if (name.startsWith('Memory')) return 'Memory';
  if (name.startsWith('Task')) return 'Task';
  if (name.startsWith('Engine')) return 'Engine';
  if (name.startsWith('Tool')) return 'Tool';
  return 'Other';
}

// ---------------------------------------------------------------------------
// Report generation (pure)
// ---------------------------------------------------------------------------

export function generateReport(
  results: readonly CurrentResult[],
  baseline?: Baseline,
): PerformanceReport {
  const timestamp = new Date().toISOString();
  const categoriesMap = new Map<string, ReportEntry[]>();
  let allWithinBudget = true;

  for (const result of results) {
    const category = categorize(result.name);
    const baseEntry = baseline?.entries[result.name];

    let trend: ReportEntry['trend'];
    let baselineP95: number | null = null;

    if (baseEntry !== undefined) {
      baselineP95 = baseEntry.p95Ms;
      const changePct =
        baseEntry.p95Ms > 0
          ? ((result.p95Ms - baseEntry.p95Ms) / baseEntry.p95Ms) * 100
          : 0;
      if (changePct < -5) trend = 'faster';
      else if (changePct > 5) trend = 'slower';
      else trend = 'stable';
    } else {
      trend = 'new';
    }

    if (!result.withinBudget) allWithinBudget = false;

    const entry: ReportEntry = {
      name: result.name,
      avgMs: result.avgMs,
      p95Ms: result.p95Ms,
      budget: result.budget,
      withinBudget: result.withinBudget,
      baselineP95,
      trend,
    };

    let existing = categoriesMap.get(category);
    if (existing === undefined) {
      existing = [];
      categoriesMap.set(category, existing);
    }
    existing.push(entry);
  }

  const markdown = buildMarkdown(timestamp, results.length, allWithinBudget, categoriesMap);

  return {
    timestamp,
    totalBenchmarks: results.length,
    allWithinBudget,
    categories: categoriesMap,
    markdown,
  };
}

// ---------------------------------------------------------------------------
// Markdown builder
// ---------------------------------------------------------------------------

function trendIcon(trend: ReportEntry['trend']): string {
  switch (trend) {
    case 'faster':
      return '🚀';
    case 'slower':
      return '🐢';
    case 'stable':
      return '✅';
    case 'new':
      return '🆕';
  }
}

function buildMarkdown(
  timestamp: string,
  totalBenchmarks: number,
  allWithinBudget: boolean,
  categories: ReadonlyMap<string, readonly ReportEntry[]>,
): string {
  const lines: string[] = [];

  lines.push('# Crewspace Performance Dashboard');
  lines.push('');
  lines.push(`**Generated:** ${timestamp}`);
  lines.push(`**Total benchmarks:** ${String(totalBenchmarks)}`);
  lines.push(
    `**Budget compliance:** ${allWithinBudget ? '✅ All within budget' : '❌ Some benchmarks exceed budget'}`,
  );
  lines.push('');
  lines.push('---');

  for (const [category, entries] of categories) {
    lines.push('');
    lines.push(`## ${category}`);
    lines.push('');
    lines.push('| Trend | Benchmark | Avg | p95 | Budget | Status |');
    lines.push('|-------|-----------|-----|-----|--------|--------|');

    for (const entry of entries) {
      const icon = trendIcon(entry.trend);
      const status = entry.withinBudget ? '✅' : '❌';
      lines.push(
        `| ${icon} | ${entry.name} | ${entry.avgMs.toFixed(3)}ms | ${entry.p95Ms.toFixed(3)}ms | ${String(entry.budget)}ms | ${status} |`,
      );
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('### Trend Legend');
  lines.push('');
  lines.push('| Icon | Meaning |');
  lines.push('|------|---------|');
  lines.push('| 🚀 | Faster than baseline (>5% improvement) |');
  lines.push('| ✅ | Stable (within ±5% of baseline) |');
  lines.push('| 🐢 | Slower than baseline (>5% regression) |');
  lines.push('| 🆕 | New benchmark (no baseline) |');
  lines.push('');
  lines.push(
    '*Budgets are p95 latency thresholds. See CONTRIBUTING.md for performance policy.*',
  );

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CLI argument parser
// ---------------------------------------------------------------------------

function parseArgs(argv: readonly string[]): {
  results: string;
  baseline: string | null;
  output: string | null;
} {
  let results = resolve('benchmark-results-detailed.jsonl');
  let baseline: string | null = resolve('benchmarks', 'baseline.json');
  let output: string | null = null;

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

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function main(argv: readonly string[] = process.argv.slice(2)): number {
  const { results: resultsPath, baseline: baselinePath, output: outputPath } = parseArgs(argv);

  console.log('Generating performance report...');
  console.log(`  Results:  ${resultsPath}`);
  if (baselinePath !== null) console.log(`  Baseline: ${baselinePath}`);
  console.log('');

  const results = loadCurrentResults(resultsPath);
  if (results.length === 0) {
    console.log('No benchmark results found.');
    return 1;
  }

  let baseline: Baseline | undefined;
  if (baselinePath !== null) {
    try {
      baseline = loadBaseline(baselinePath);
    } catch {
      console.log('Warning: Could not load baseline. Generating report without trends.');
    }
  }

  const report = generateReport(results, baseline);

  if (outputPath !== null) {
    writeFileSync(outputPath, report.markdown, 'utf-8');
    console.log(`Report written to: ${outputPath}`);
  } else {
    console.log(report.markdown);
  }

  return 0;
}

// Run if executed directly
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename || process.argv[1]?.endsWith('generate-perf-report.ts')) {
  process.exit(main());
}
