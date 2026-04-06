/**
 * Performance regression detection script.
 *
 * Compares current benchmark results against a committed baseline.
 * Exits with code 1 if any benchmark regresses beyond the threshold.
 *
 * Usage:
 *   npx tsx scripts/compare-benchmarks.ts [--baseline path] [--current path] [--threshold pct]
 *
 * @packageDocumentation
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

export interface CurrentResult {
  readonly name: string;
  readonly p95Ms: number;
  readonly avgMs: number;
  readonly budget: number;
  readonly withinBudget: boolean;
}

export type ComparisonStatus = 'pass' | 'warning' | 'regression' | 'improvement' | 'new';

export interface ComparisonEntry {
  readonly name: string;
  readonly baselineP95: number | null;
  readonly currentP95: number;
  readonly changePercent: number | null;
  readonly budget: number;
  readonly status: ComparisonStatus;
}

export interface ComparisonReport {
  readonly entries: readonly ComparisonEntry[];
  readonly hasRegression: boolean;
  readonly hasWarning: boolean;
  readonly summary: string;
}

// ---------------------------------------------------------------------------
// Default thresholds (match CONTRIBUTING.md regression policy)
// ---------------------------------------------------------------------------

export const DEFAULT_WARNING_THRESHOLD = 5;
export const DEFAULT_REGRESSION_THRESHOLD = 15;

// ---------------------------------------------------------------------------
// I/O helpers
// ---------------------------------------------------------------------------

export function loadBaseline(filePath: string): Baseline {
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Baseline;
}

export function loadCurrentResults(filePath: string): CurrentResult[] {
  const raw = readFileSync(filePath, 'utf-8').trim();
  if (raw.length === 0) return [];

  return raw
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as CurrentResult);
}

// ---------------------------------------------------------------------------
// Core comparison logic (pure — no I/O)
// ---------------------------------------------------------------------------

export function compareResults(
  baseline: Baseline,
  current: readonly CurrentResult[],
  regressionThreshold: number = DEFAULT_REGRESSION_THRESHOLD,
  warningThreshold: number = DEFAULT_WARNING_THRESHOLD,
): ComparisonReport {
  const entries: ComparisonEntry[] = [];
  let hasRegression = false;
  let hasWarning = false;

  for (const result of current) {
    const baseEntry: BaselineEntry | undefined = baseline.entries[result.name];

    if (baseEntry === undefined) {
      entries.push({
        name: result.name,
        baselineP95: null,
        currentP95: result.p95Ms,
        changePercent: null,
        budget: result.budget,
        status: 'new',
      });
      continue;
    }

    const changePercent =
      baseEntry.p95Ms > 0
        ? ((result.p95Ms - baseEntry.p95Ms) / baseEntry.p95Ms) * 100
        : 0;

    let status: ComparisonStatus;
    if (changePercent > regressionThreshold) {
      status = 'regression';
      hasRegression = true;
    } else if (changePercent > warningThreshold) {
      status = 'warning';
      hasWarning = true;
    } else if (changePercent < -warningThreshold) {
      status = 'improvement';
    } else {
      status = 'pass';
    }

    entries.push({
      name: result.name,
      baselineP95: baseEntry.p95Ms,
      currentP95: result.p95Ms,
      changePercent,
      budget: result.budget,
      status,
    });
  }

  const regressionCount = entries.filter((e) => e.status === 'regression').length;
  const warningCount = entries.filter((e) => e.status === 'warning').length;
  const passCount = entries.filter((e) => e.status === 'pass').length;
  const improvementCount = entries.filter((e) => e.status === 'improvement').length;
  const newCount = entries.filter((e) => e.status === 'new').length;

  const parts: string[] = [];
  parts.push(`${String(entries.length)} benchmarks compared`);
  if (passCount > 0) parts.push(`${String(passCount)} passed`);
  if (improvementCount > 0) parts.push(`${String(improvementCount)} improved`);
  if (warningCount > 0) parts.push(`${String(warningCount)} warnings`);
  if (regressionCount > 0) parts.push(`${String(regressionCount)} regressions`);
  if (newCount > 0) parts.push(`${String(newCount)} new`);

  return {
    entries,
    hasRegression,
    hasWarning,
    summary: parts.join(', '),
  };
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

export function formatComparisonTable(report: ComparisonReport): string {
  const lines: string[] = [];

  lines.push('## Performance Regression Report');
  lines.push('');
  lines.push(`**Summary:** ${report.summary}`);
  lines.push('');
  lines.push('| Status | Benchmark | Baseline p95 | Current p95 | Change | Budget |');
  lines.push('|--------|-----------|-------------|------------|--------|--------|');

  for (const entry of report.entries) {
    const icon =
      entry.status === 'pass'
        ? '✅'
        : entry.status === 'improvement'
          ? '🚀'
          : entry.status === 'warning'
            ? '⚠️'
            : entry.status === 'regression'
              ? '❌'
              : '🆕';

    const baseline =
      entry.baselineP95 !== null ? `${entry.baselineP95.toFixed(3)}ms` : '—';
    const current = `${entry.currentP95.toFixed(3)}ms`;
    const change =
      entry.changePercent !== null
        ? `${entry.changePercent >= 0 ? '+' : ''}${entry.changePercent.toFixed(1)}%`
        : 'new';
    const budget = `${String(entry.budget)}ms`;

    lines.push(
      `| ${icon} ${entry.status} | ${entry.name} | ${baseline} | ${current} | ${change} | ${budget} |`,
    );
  }

  lines.push('');
  if (report.hasRegression) {
    lines.push(
      '> ❌ **Regressions detected.** Performance degraded beyond the 15% threshold.',
    );
    lines.push(
      '> Fix regressions before merging, or update the baseline with team approval.',
    );
  } else if (report.hasWarning) {
    lines.push(
      '> ⚠️ **Warnings detected.** Performance degraded 5–15%. Please justify in PR description.',
    );
  } else {
    lines.push('> ✅ **All benchmarks within acceptable range.**');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CLI argument parser
// ---------------------------------------------------------------------------

function parseArgs(argv: readonly string[]): {
  baseline: string;
  current: string;
  threshold: number;
} {
  let baseline = resolve('benchmarks', 'baseline.json');
  let current = resolve('benchmark-results-detailed.jsonl');
  let threshold = DEFAULT_REGRESSION_THRESHOLD;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next: string | undefined = argv[i + 1];
    if (arg === '--baseline' && next !== undefined) {
      baseline = resolve(next);
      i++;
    } else if (arg === '--current' && next !== undefined) {
      current = resolve(next);
      i++;
    } else if (arg === '--threshold' && next !== undefined) {
      threshold = Number(next);
      i++;
    }
  }

  return { baseline, current, threshold };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function main(argv: readonly string[] = process.argv.slice(2)): number {
  const {
    baseline: baselinePath,
    current: currentPath,
    threshold,
  } = parseArgs(argv);

  console.log('Comparing benchmarks...');
  console.log(`  Baseline: ${baselinePath}`);
  console.log(`  Current:  ${currentPath}`);
  console.log(`  Threshold: ${String(threshold)}%`);
  console.log('');

  const baseline = loadBaseline(baselinePath);
  const current = loadCurrentResults(currentPath);

  if (current.length === 0) {
    console.log('No benchmark results found. Skipping comparison.');
    return 0;
  }

  const report = compareResults(baseline, current, threshold);
  console.log(formatComparisonTable(report));
  console.log('');

  if (report.hasRegression) {
    console.log('EXIT: 1 (regressions detected)');
    return 1;
  }

  console.log('EXIT: 0 (all benchmarks within threshold)');
  return 0;
}

// Run if executed directly
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename || process.argv[1]?.endsWith('compare-benchmarks.ts')) {
  process.exit(main());
}
