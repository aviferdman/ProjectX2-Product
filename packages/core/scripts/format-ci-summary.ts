/* eslint-disable no-console */
/**
 * GitHub Actions CI summary formatter.
 *
 * Reads benchmark results and baseline, then generates:
 * 1. A markdown job summary (written to $GITHUB_STEP_SUMMARY or stdout)
 * 2. GitHub Actions annotations (::error:: / ::warning::) for regressions
 *
 * Usage:
 *   npx tsx scripts/format-ci-summary.ts [--results path] [--baseline path] [--output-file path]
 *
 * @packageDocumentation
 */

import { writeFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Baseline, CurrentResult, ComparisonReport } from './compare-benchmarks.js';
import {
  loadBaseline,
  loadCurrentResults,
  compareResults,
  DEFAULT_REGRESSION_THRESHOLD,
  DEFAULT_WARNING_THRESHOLD,
} from './compare-benchmarks.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CISummaryOptions {
  readonly results: readonly CurrentResult[];
  readonly baseline?: Baseline;
  readonly regressionThreshold?: number;
  readonly warningThreshold?: number;
  readonly commitSha?: string;
  readonly runId?: string;
  readonly runUrl?: string;
}

export interface CISummary {
  readonly markdown: string;
  readonly annotations: readonly string[];
  readonly hasRegression: boolean;
  readonly hasWarning: boolean;
  readonly totalBenchmarks: number;
  readonly passCount: number;
  readonly failCount: number;
}

// ---------------------------------------------------------------------------
// Annotation formatting
// ---------------------------------------------------------------------------

export function formatAnnotation(
  level: 'error' | 'warning' | 'notice',
  message: string,
): string {
  return `::${level}::${message}`;
}

export function generateAnnotations(report: ComparisonReport): string[] {
  const annotations: string[] = [];

  for (const entry of report.entries) {
    if (entry.status === 'regression') {
      const change = entry.changePercent !== null ? `+${entry.changePercent.toFixed(1)}%` : 'N/A';
      annotations.push(
        formatAnnotation(
          'error',
          `Performance regression: "${entry.name}" p95 ${entry.currentP95.toFixed(3)}ms (was ${entry.baselineP95?.toFixed(3) ?? 'N/A'}ms, ${change})`,
        ),
      );
    } else if (entry.status === 'warning') {
      const change = entry.changePercent !== null ? `+${entry.changePercent.toFixed(1)}%` : 'N/A';
      annotations.push(
        formatAnnotation(
          'warning',
          `Performance warning: "${entry.name}" p95 ${entry.currentP95.toFixed(3)}ms (was ${entry.baselineP95?.toFixed(3) ?? 'N/A'}ms, ${change})`,
        ),
      );
    }
  }

  return annotations;
}

// ---------------------------------------------------------------------------
// Budget check annotations (no baseline needed)
// ---------------------------------------------------------------------------

export function generateBudgetAnnotations(results: readonly CurrentResult[]): string[] {
  const annotations: string[] = [];

  for (const result of results) {
    if (!result.withinBudget) {
      annotations.push(
        formatAnnotation(
          'error',
          `Budget exceeded: "${result.name}" p95 ${result.p95Ms.toFixed(3)}ms exceeds budget of ${String(result.budget)}ms`,
        ),
      );
    }
  }

  return annotations;
}

// ---------------------------------------------------------------------------
// Markdown summary generation
// ---------------------------------------------------------------------------

export function generateCISummary(options: CISummaryOptions): CISummary {
  const { results, baseline, commitSha, runId, runUrl } = options;
  const regressionThreshold = options.regressionThreshold ?? DEFAULT_REGRESSION_THRESHOLD;
  const warningThreshold = options.warningThreshold ?? DEFAULT_WARNING_THRESHOLD;

  const withinBudget = results.filter((r) => r.withinBudget);
  const exceedingBudget = results.filter((r) => !r.withinBudget);

  const lines: string[] = [];
  const allAnnotations: string[] = [];

  // Header
  lines.push('## ⚡ Performance Benchmark Results');
  lines.push('');

  // Metadata
  if (commitSha) lines.push(`**Commit:** \`${commitSha.slice(0, 7)}\``);
  if (runUrl) lines.push(`**Run:** [#${runId ?? 'link'}](${runUrl})`);
  lines.push(`**Benchmarks:** ${String(results.length)} total`);
  lines.push(
    `**Budget compliance:** ${exceedingBudget.length === 0 ? '✅ All within budget' : `❌ ${String(exceedingBudget.length)} exceeded budget`}`,
  );
  lines.push('');

  // Budget annotations
  allAnnotations.push(...generateBudgetAnnotations(results));

  // Regression analysis (only if baseline is available)
  let hasRegression = false;
  let hasWarning = false;

  if (baseline !== undefined) {
    const report = compareResults(baseline, results, regressionThreshold, warningThreshold);
    hasRegression = report.hasRegression;
    hasWarning = report.hasWarning;

    const regressions = report.entries.filter((e) => e.status === 'regression');
    const warnings = report.entries.filter((e) => e.status === 'warning');
    const improvements = report.entries.filter((e) => e.status === 'improvement');
    const newEntries = report.entries.filter((e) => e.status === 'new');

    // Status badge
    if (hasRegression) {
      lines.push('> ❌ **Regressions detected** — review before merging');
    } else if (hasWarning) {
      lines.push('> ⚠️ **Warnings detected** — performance degraded but within tolerance');
    } else {
      lines.push('> ✅ **All benchmarks within acceptable range**');
    }
    lines.push('');

    // Regression table
    if (regressions.length > 0 || warnings.length > 0) {
      lines.push('### Regressions & Warnings');
      lines.push('');
      lines.push('| Status | Benchmark | Baseline p95 | Current p95 | Change |');
      lines.push('|--------|-----------|:------------:|:-----------:|:------:|');

      for (const entry of [...regressions, ...warnings]) {
        const icon = entry.status === 'regression' ? '❌' : '⚠️';
        const baselineVal = entry.baselineP95 !== null ? `${entry.baselineP95.toFixed(3)}ms` : '—';
        const change =
          entry.changePercent !== null
            ? `+${entry.changePercent.toFixed(1)}%`
            : 'new';
        lines.push(
          `| ${icon} | ${entry.name} | ${baselineVal} | ${entry.currentP95.toFixed(3)}ms | ${change} |`,
        );
      }
      lines.push('');
    }

    // Improvements
    if (improvements.length > 0) {
      lines.push('<details>');
      lines.push(`<summary>🚀 ${String(improvements.length)} improvement(s)</summary>`);
      lines.push('');
      for (const entry of improvements) {
        const change = entry.changePercent !== null ? `${entry.changePercent.toFixed(1)}%` : '';
        lines.push(`- **${entry.name}**: ${entry.currentP95.toFixed(3)}ms (${change})`);
      }
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }

    // New benchmarks
    if (newEntries.length > 0) {
      lines.push('<details>');
      lines.push(`<summary>🆕 ${String(newEntries.length)} new benchmark(s)</summary>`);
      lines.push('');
      for (const entry of newEntries) {
        lines.push(`- **${entry.name}**: ${entry.currentP95.toFixed(3)}ms (budget: ${String(entry.budget)}ms)`);
      }
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }

    // Regression annotations
    allAnnotations.push(...generateAnnotations(report));
  }

  // Full results table
  lines.push('<details>');
  lines.push('<summary>📊 All benchmark results</summary>');
  lines.push('');
  lines.push('| Status | Benchmark | Avg | p95 | Budget |');
  lines.push('|:------:|-----------|:---:|:---:|:------:|');

  for (const result of results) {
    const icon = result.withinBudget ? '✅' : '❌';
    lines.push(
      `| ${icon} | ${result.name} | ${result.avgMs.toFixed(3)}ms | ${result.p95Ms.toFixed(3)}ms | ${String(result.budget)}ms |`,
    );
  }

  lines.push('');
  lines.push('</details>');
  lines.push('');

  return {
    markdown: lines.join('\n'),
    annotations: allAnnotations,
    hasRegression,
    hasWarning,
    totalBenchmarks: results.length,
    passCount: withinBudget.length,
    failCount: exceedingBudget.length,
  };
}

// ---------------------------------------------------------------------------
// CLI argument parser
// ---------------------------------------------------------------------------

function parseArgs(argv: readonly string[]): {
  results: string;
  baseline: string | null;
  outputFile: string | null;
} {
  let results = resolve('benchmark-results-detailed.jsonl');
  let baseline: string | null = resolve('benchmarks', 'baseline.json');
  let outputFile: string | null = null;

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
    } else if (arg === '--output-file' && next !== undefined) {
      outputFile = resolve(next);
      i++;
    }
  }

  return { results, baseline, outputFile };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function main(argv: readonly string[] = process.argv.slice(2)): number {
  const { results: resultsPath, baseline: baselinePath, outputFile } = parseArgs(argv);

  const results = loadCurrentResults(resultsPath);
  if (results.length === 0) {
    console.log('No benchmark results found. Skipping CI summary.');
    return 0;
  }

  let baseline: Baseline | undefined;
  if (baselinePath !== null) {
    try {
      baseline = loadBaseline(baselinePath);
    } catch {
      console.log('Warning: Could not load baseline. Generating summary without regression analysis.');
    }
  }

  const summary = generateCISummary({
    results,
    baseline,
    commitSha: process.env['GITHUB_SHA'],
    runId: process.env['GITHUB_RUN_ID'],
    runUrl: process.env['GITHUB_SERVER_URL'] && process.env['GITHUB_REPOSITORY'] && process.env['GITHUB_RUN_ID']
      ? `${process.env['GITHUB_SERVER_URL']}/${process.env['GITHUB_REPOSITORY']}/actions/runs/${process.env['GITHUB_RUN_ID']}`
      : undefined,
  });

  // Write to GITHUB_STEP_SUMMARY if available
  const summaryFile = outputFile ?? process.env['GITHUB_STEP_SUMMARY'];
  if (summaryFile) {
    appendFileSync(summaryFile, summary.markdown, 'utf-8');
    console.log(`CI summary written to: ${summaryFile}`);
  } else {
    console.log(summary.markdown);
  }

  // Emit annotations
  for (const annotation of summary.annotations) {
    console.log(annotation);
  }

  if (summary.hasRegression) {
    console.log(`\n❌ ${String(summary.failCount)} benchmark(s) exceeded budget. ${String(summary.annotations.length)} annotation(s) emitted.`);
    return 1;
  }

  console.log(`\n✅ All ${String(summary.totalBenchmarks)} benchmarks passed.`);
  return 0;
}

// Run if executed directly
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile || process.argv[1]?.endsWith('format-ci-summary.ts')) {
  process.exit(main());
}
