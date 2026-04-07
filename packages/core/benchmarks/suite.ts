/**
 * BenchmarkSuite — structured methodology for defining, running, and
 * analyzing performance benchmarks in Crewspace.
 *
 * Design goals:
 * 1. **Declarative scenarios** — each benchmark is described by a plain
 *    object (BenchmarkScenario) so suites are easy to review and extend.
 * 2. **Statistical rigour** — configurable warmup, iteration count, and
 *    percentile extraction (p50/p95/p99) following industry best practices.
 * 3. **Budget enforcement** — every scenario carries an explicit latency
 *    budget (p95); regressions are detected automatically.
 * 4. **Baseline comparison** — results can be diffed against a committed
 *    baseline to surface regressions in CI.
 * 5. **Extensibility** — custom reporters and hooks enable integration
 *    with dashboards, JSONL logs, and GitHub Actions annotations.
 *
 * @packageDocumentation
 */

import { appendFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Configuration for a single benchmark scenario. */
export interface BenchmarkScenario {
  /** Human-readable name displayed in reports. */
  readonly name: string;
  /** Category for grouping in dashboards (e.g. "Agent", "Memory"). */
  readonly category: string;
  /** The function under test. May be sync or async. */
  readonly fn: () => void | Promise<void>;
  /** Optional setup called once before warmup + measured runs. */
  readonly setup?: () => void | Promise<void>;
  /** Optional teardown called once after all runs complete. */
  readonly teardown?: () => void | Promise<void>;
  /** Number of measured iterations (default: 1000). */
  readonly iterations?: number;
  /** Number of warmup iterations (default: 10). */
  readonly warmup?: number;
  /** p95 latency budget in milliseconds. */
  readonly budget: number;
}

/** Statistical result of running a single benchmark scenario. */
export interface BenchmarkScenarioResult {
  readonly name: string;
  readonly category: string;
  readonly iterations: number;
  readonly totalMs: number;
  readonly avgMs: number;
  readonly minMs: number;
  readonly maxMs: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly stdDevMs: number;
  readonly opsPerSecond: number;
  readonly budget: number;
  readonly withinBudget: boolean;
}

/** Aggregated result of running an entire suite. */
export interface BenchmarkSuiteResult {
  readonly suiteName: string;
  readonly timestamp: string;
  readonly results: readonly BenchmarkScenarioResult[];
  readonly passCount: number;
  readonly failCount: number;
  readonly allWithinBudget: boolean;
  readonly totalDurationMs: number;
  readonly categories: ReadonlyMap<string, readonly BenchmarkScenarioResult[]>;
}

/** Baseline entry for regression comparison. */
export interface BaselineEntry {
  readonly p95Ms: number;
  readonly avgMs: number;
  readonly budget: number;
}

/** A complete baseline snapshot. */
export interface Baseline {
  readonly version: number;
  readonly timestamp: string;
  readonly entries: Readonly<Record<string, BaselineEntry>>;
}

/** Status of a comparison between current and baseline. */
export type RegressionStatus = 'pass' | 'warning' | 'regression' | 'improvement' | 'new';

/** Result of comparing one scenario against its baseline. */
export interface RegressionCheckResult {
  readonly name: string;
  readonly currentP95: number;
  readonly baselineP95: number | null;
  readonly changePercent: number | null;
  readonly budget: number;
  readonly status: RegressionStatus;
}

/** Summary of regression analysis across all scenarios. */
export interface RegressionReport {
  readonly entries: readonly RegressionCheckResult[];
  readonly hasRegression: boolean;
  readonly hasWarning: boolean;
  readonly summary: string;
}

/** Hook called after each scenario completes. */
export type ScenarioHook = (result: BenchmarkScenarioResult) => void;

/** Optional reporter that receives the final suite result. */
export type SuiteReporter = (result: BenchmarkSuiteResult) => void;

/** Configuration for BenchmarkSuite. */
export interface BenchmarkSuiteConfig {
  /** Suite name shown in reports. */
  readonly name: string;
  /** Default iterations if a scenario does not specify. */
  readonly defaultIterations?: number;
  /** Default warmup if a scenario does not specify. */
  readonly defaultWarmup?: number;
  /** Warning threshold percentage for regression detection (default: 5). */
  readonly warningThreshold?: number;
  /** Regression threshold percentage (default: 15). */
  readonly regressionThreshold?: number;
  /** Path to write JSONL results (null to disable). */
  readonly jsonlOutputPath?: string | null;
  /** Hook called after each scenario runs. */
  readonly onScenarioComplete?: ScenarioHook;
  /** Reporter called after the entire suite completes. */
  readonly reporter?: SuiteReporter;
}

// ---------------------------------------------------------------------------
// Statistical helpers
// ---------------------------------------------------------------------------

/** Compute percentile from a **sorted** array. */
export function percentile(sorted: readonly number[], pct: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.floor(sorted.length * pct);
  return sorted[Math.min(idx, sorted.length - 1)]!;
}

/** Compute standard deviation. */
export function standardDeviation(values: readonly number[], mean: number): number {
  if (values.length < 2) return 0;
  const sumSq = values.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  return Math.sqrt(sumSq / (values.length - 1));
}

// ---------------------------------------------------------------------------
// Core runner (pure — no I/O except optional JSONL append)
// ---------------------------------------------------------------------------

/**
 * Run a single scenario and return its result.
 *
 * This is the heart of the measurement methodology:
 * 1. Run `setup()` once.
 * 2. Execute `warmup` iterations (results discarded).
 * 3. Execute `iterations` measured iterations, recording high-resolution timings.
 * 4. Sort timings and extract percentiles + stats.
 * 5. Run `teardown()` once.
 */
export async function runScenario(
  scenario: BenchmarkScenario,
  defaults: { iterations: number; warmup: number },
): Promise<BenchmarkScenarioResult> {
  const iterations = scenario.iterations ?? defaults.iterations;
  const warmup = scenario.warmup ?? defaults.warmup;

  // Setup
  if (scenario.setup) {
    await scenario.setup();
  }

  // Warmup
  for (let i = 0; i < warmup; i++) {
    await scenario.fn();
  }

  // Measured runs
  const timings: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await scenario.fn();
    timings.push(performance.now() - start);
  }

  // Teardown
  if (scenario.teardown) {
    await scenario.teardown();
  }

  // Statistics
  timings.sort((a, b) => a - b);

  const totalMs = timings.reduce((s, t) => s + t, 0);
  const avgMs = iterations > 0 ? totalMs / iterations : 0;
  const minMs = timings[0] ?? 0;
  const maxMs = timings[timings.length - 1] ?? 0;
  const p50Ms = percentile(timings, 0.5);
  const p95Ms = percentile(timings, 0.95);
  const p99Ms = percentile(timings, 0.99);
  const stdDevMs = standardDeviation(timings, avgMs);
  const opsPerSecond = avgMs > 0 ? 1000 / avgMs : 0;

  return {
    name: scenario.name,
    category: scenario.category,
    iterations,
    totalMs,
    avgMs,
    minMs,
    maxMs,
    p50Ms,
    p95Ms,
    p99Ms,
    stdDevMs,
    opsPerSecond,
    budget: scenario.budget,
    withinBudget: p95Ms <= scenario.budget,
  };
}

// ---------------------------------------------------------------------------
// Regression analysis (pure)
// ---------------------------------------------------------------------------

export const DEFAULT_WARNING_THRESHOLD = 5;
export const DEFAULT_REGRESSION_THRESHOLD = 15;

/**
 * Compare scenario results against a baseline and produce a regression report.
 */
export function checkRegressions(
  results: readonly BenchmarkScenarioResult[],
  baseline: Baseline,
  warningThreshold: number = DEFAULT_WARNING_THRESHOLD,
  regressionThreshold: number = DEFAULT_REGRESSION_THRESHOLD,
): RegressionReport {
  const entries: RegressionCheckResult[] = [];
  let hasRegression = false;
  let hasWarning = false;

  for (const result of results) {
    const baseEntry: BaselineEntry | undefined = baseline.entries[result.name];

    if (baseEntry === undefined) {
      entries.push({
        name: result.name,
        currentP95: result.p95Ms,
        baselineP95: null,
        changePercent: null,
        budget: result.budget,
        status: 'new',
      });
      continue;
    }

    const changePercent =
      baseEntry.p95Ms > 0 ? ((result.p95Ms - baseEntry.p95Ms) / baseEntry.p95Ms) * 100 : 0;

    let status: RegressionStatus;
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
      currentP95: result.p95Ms,
      baselineP95: baseEntry.p95Ms,
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

  const parts: string[] = [`${String(entries.length)} benchmarks compared`];
  if (passCount > 0) parts.push(`${String(passCount)} passed`);
  if (improvementCount > 0) parts.push(`${String(improvementCount)} improved`);
  if (warningCount > 0) parts.push(`${String(warningCount)} warnings`);
  if (regressionCount > 0) parts.push(`${String(regressionCount)} regressions`);
  if (newCount > 0) parts.push(`${String(newCount)} new`);

  return { entries, hasRegression, hasWarning, summary: parts.join(', ') };
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

/** Format a single scenario result as a human-readable string. */
export function formatScenarioResult(result: BenchmarkScenarioResult): string {
  const status = result.withinBudget ? '\u2705 PASS' : '\u274c FAIL';
  return [
    `${status} [${result.category}] ${result.name}`,
    `  avg: ${result.avgMs.toFixed(3)}ms | p50: ${result.p50Ms.toFixed(3)}ms | p95: ${result.p95Ms.toFixed(3)}ms | p99: ${result.p99Ms.toFixed(3)}ms`,
    `  min: ${result.minMs.toFixed(3)}ms | max: ${result.maxMs.toFixed(3)}ms | stddev: ${result.stdDevMs.toFixed(3)}ms`,
    `  ops/s: ${result.opsPerSecond.toFixed(0)} | budget: ${String(result.budget)}ms | iterations: ${String(result.iterations)}`,
  ].join('\n');
}

/** Format an entire suite result as a markdown report. */
export function formatSuiteMarkdown(suiteResult: BenchmarkSuiteResult): string {
  const lines: string[] = [];

  lines.push(`# Benchmark Suite: ${suiteResult.suiteName}`);
  lines.push('');
  lines.push(`**Timestamp:** ${suiteResult.timestamp}`);
  lines.push(`**Total benchmarks:** ${String(suiteResult.results.length)}`);
  lines.push(`**Passed:** ${String(suiteResult.passCount)} | **Failed:** ${String(suiteResult.failCount)}`);
  lines.push(`**Total duration:** ${suiteResult.totalDurationMs.toFixed(0)}ms`);
  lines.push(
    `**Budget compliance:** ${suiteResult.allWithinBudget ? '\u2705 All within budget' : '\u274c Some benchmarks exceed budget'}`,
  );
  lines.push('');

  for (const [category, entries] of suiteResult.categories) {
    lines.push(`## ${category}`);
    lines.push('');
    lines.push('| Benchmark | Avg | p50 | p95 | p99 | Budget | Status |');
    lines.push('|-----------|-----|-----|-----|-----|--------|--------|');

    for (const entry of entries) {
      const status = entry.withinBudget ? '\u2705' : '\u274c';
      lines.push(
        `| ${entry.name} | ${entry.avgMs.toFixed(3)}ms | ${entry.p50Ms.toFixed(3)}ms | ${entry.p95Ms.toFixed(3)}ms | ${entry.p99Ms.toFixed(3)}ms | ${String(entry.budget)}ms | ${status} |`,
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

/** Format a regression report as markdown. */
export function formatRegressionMarkdown(report: RegressionReport): string {
  const lines: string[] = [];

  lines.push('## Regression Analysis');
  lines.push('');
  lines.push(`**Summary:** ${report.summary}`);
  lines.push('');
  lines.push('| Status | Benchmark | Baseline p95 | Current p95 | Change | Budget |');
  lines.push('|--------|-----------|-------------|------------|--------|--------|');

  for (const entry of report.entries) {
    const icon =
      entry.status === 'pass'
        ? '\u2705'
        : entry.status === 'improvement'
          ? '\ud83d\ude80'
          : entry.status === 'warning'
            ? '\u26a0\ufe0f'
            : entry.status === 'regression'
              ? '\u274c'
              : '\ud83c\udd95';

    const baseline = entry.baselineP95 !== null ? `${entry.baselineP95.toFixed(3)}ms` : '\u2014';
    const current = `${entry.currentP95.toFixed(3)}ms`;
    const change =
      entry.changePercent !== null
        ? `${entry.changePercent >= 0 ? '+' : ''}${entry.changePercent.toFixed(1)}%`
        : 'new';
    const budget = `${String(entry.budget)}ms`;

    lines.push(`| ${icon} ${entry.status} | ${entry.name} | ${baseline} | ${current} | ${change} | ${budget} |`);
  }

  lines.push('');
  if (report.hasRegression) {
    lines.push('> \u274c **Regressions detected.** Performance degraded beyond the threshold.');
  } else if (report.hasWarning) {
    lines.push('> \u26a0\ufe0f **Warnings detected.** Performance degraded but within tolerance.');
  } else {
    lines.push('> \u2705 **All benchmarks within acceptable range.**');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// JSONL output helper
// ---------------------------------------------------------------------------

function appendJsonl(path: string, result: BenchmarkScenarioResult): void {
  try {
    appendFileSync(path, JSON.stringify(result) + '\n', 'utf-8');
  } catch {
    // Best-effort — do not fail benchmarks if collection fails
  }
}

// ---------------------------------------------------------------------------
// BenchmarkSuite class
// ---------------------------------------------------------------------------

/**
 * A structured container for benchmark scenarios.
 *
 * Usage:
 * ```ts
 * const suite = new BenchmarkSuite({ name: 'Agent Benchmarks' });
 * suite.add({
 *   name: 'Agent init',
 *   category: 'Agent',
 *   fn: () => new Agent({ id: 'a', role: 'r', goal: 'g' }),
 *   budget: 100,
 * });
 * const result = await suite.run();
 * ```
 */
export class BenchmarkSuite {
  readonly name: string;

  private readonly _scenarios: BenchmarkScenario[] = [];
  private readonly _defaultIterations: number;
  private readonly _defaultWarmup: number;
  private readonly _warningThreshold: number;
  private readonly _regressionThreshold: number;
  private readonly _jsonlOutputPath: string | null;
  private readonly _onScenarioComplete: ScenarioHook | undefined;
  private readonly _reporter: SuiteReporter | undefined;

  constructor(config: BenchmarkSuiteConfig) {
    this.name = config.name;
    this._defaultIterations = config.defaultIterations ?? 1000;
    this._defaultWarmup = config.defaultWarmup ?? 10;
    this._warningThreshold = config.warningThreshold ?? DEFAULT_WARNING_THRESHOLD;
    this._regressionThreshold = config.regressionThreshold ?? DEFAULT_REGRESSION_THRESHOLD;
    this._jsonlOutputPath = config.jsonlOutputPath ?? null;
    this._onScenarioComplete = config.onScenarioComplete;
    this._reporter = config.reporter;
  }

  /** Number of scenarios in the suite. */
  get size(): number {
    return this._scenarios.length;
  }

  /** Return a snapshot of registered scenarios. */
  get scenarios(): readonly BenchmarkScenario[] {
    return [...this._scenarios];
  }

  /** Add a benchmark scenario. */
  add(scenario: BenchmarkScenario): this {
    this._scenarios.push(scenario);
    return this;
  }

  /** Add multiple scenarios at once. */
  addAll(scenarios: readonly BenchmarkScenario[]): this {
    for (const s of scenarios) {
      this._scenarios.push(s);
    }
    return this;
  }

  /** Remove a scenario by name. Returns true if removed. */
  remove(name: string): boolean {
    const idx = this._scenarios.findIndex((s) => s.name === name);
    if (idx === -1) return false;
    this._scenarios.splice(idx, 1);
    return true;
  }

  /** Retrieve distinct categories across all scenarios. */
  getCategories(): string[] {
    return [...new Set(this._scenarios.map((s) => s.category))];
  }

  /** Filter scenarios by category. */
  getByCategory(category: string): readonly BenchmarkScenario[] {
    return this._scenarios.filter((s) => s.category === category);
  }

  /**
   * Run all registered scenarios sequentially and return the aggregated result.
   *
   * Methodology:
   * 1. Scenarios run in registration order.
   * 2. Each scenario follows: setup → warmup → measure → teardown.
   * 3. Results are collected and optionally written to JSONL.
   * 4. The suite reporter (if any) is invoked with the final result.
   */
  async run(): Promise<BenchmarkSuiteResult> {
    const suiteStart = performance.now();
    const results: BenchmarkScenarioResult[] = [];

    for (const scenario of this._scenarios) {
      const result = await runScenario(scenario, {
        iterations: this._defaultIterations,
        warmup: this._defaultWarmup,
      });

      results.push(result);

      if (this._jsonlOutputPath !== null) {
        appendJsonl(this._jsonlOutputPath, result);
      }

      if (this._onScenarioComplete) {
        this._onScenarioComplete(result);
      }
    }

    const totalDurationMs = performance.now() - suiteStart;

    // Build category map
    const categories = new Map<string, BenchmarkScenarioResult[]>();
    for (const r of results) {
      let arr = categories.get(r.category);
      if (arr === undefined) {
        arr = [];
        categories.set(r.category, arr);
      }
      arr.push(r);
    }

    const passCount = results.filter((r) => r.withinBudget).length;
    const failCount = results.length - passCount;

    const suiteResult: BenchmarkSuiteResult = {
      suiteName: this.name,
      timestamp: new Date().toISOString(),
      results,
      passCount,
      failCount,
      allWithinBudget: failCount === 0,
      totalDurationMs,
      categories,
    };

    if (this._reporter) {
      this._reporter(suiteResult);
    }

    return suiteResult;
  }

  /**
   * Run the suite and then compare results against a baseline.
   * Returns both the suite result and the regression report.
   */
  async runWithRegression(baseline: Baseline): Promise<{
    suiteResult: BenchmarkSuiteResult;
    regressionReport: RegressionReport;
  }> {
    const suiteResult = await this.run();
    const regressionReport = checkRegressions(
      suiteResult.results,
      baseline,
      this._warningThreshold,
      this._regressionThreshold,
    );
    return { suiteResult, regressionReport };
  }
}
