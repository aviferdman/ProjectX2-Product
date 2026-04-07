/**
 * Unified metrics collector for the Crewspace framework.
 *
 * Aggregates execution time, memory usage, token efficiency, and workflow
 * complexity into a single cohesive report. This is the primary entry point
 * for comprehensive performance measurement.
 *
 * @packageDocumentation
 */

import { MemoryTracker } from './memory-metrics.js';
import type { MemoryMeasurement, MemorySummary, MemoryTrackerConfig } from './memory-metrics.js';
import { TokenEfficiencyTracker } from './token-efficiency.js';
import type {
  TokenRecord,
  TokenRecordInput,
  TokenEfficiencyReport,
  TokenEfficiencyTrackerConfig,
} from './token-efficiency.js';
import { analyzeComplexity } from './complexity-analyzer.js';
import type { WorkflowDescriptor, ComplexityReport } from './complexity-analyzer.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single execution time measurement. */
export interface ExecutionTimeMeasurement {
  /** Label for the operation. */
  readonly label: string;
  /** Category (e.g. 'agent', 'task', 'engine', 'tool'). */
  readonly category: string;
  /** Duration in milliseconds. */
  readonly durationMs: number;
  /** Whether the operation succeeded. */
  readonly success: boolean;
  /** High-resolution timestamp. */
  readonly timestamp: number;
}

/** Input for recording an execution time measurement. */
export interface ExecutionTimeInput {
  readonly label: string;
  readonly category: string;
  readonly durationMs: number;
  readonly success?: boolean;
}

/** Statistical summary of execution time measurements. */
export interface ExecutionTimeSummary {
  readonly count: number;
  readonly totalMs: number;
  readonly avgMs: number;
  readonly minMs: number;
  readonly maxMs: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly successCount: number;
  readonly failureCount: number;
  /** Breakdown by category. */
  readonly byCategory: ReadonlyMap<string, CategoryTimeSummary>;
}

/** Time summary for a specific category. */
export interface CategoryTimeSummary {
  readonly category: string;
  readonly count: number;
  readonly totalMs: number;
  readonly avgMs: number;
  readonly minMs: number;
  readonly maxMs: number;
}

/** Full unified metrics report. */
export interface UnifiedMetricsReport {
  /** Execution time statistics. */
  readonly executionTime: ExecutionTimeSummary;
  /** Memory usage statistics. */
  readonly memory: MemorySummary;
  /** Token efficiency analysis. */
  readonly tokenEfficiency: TokenEfficiencyReport;
  /** Workflow complexity analysis (null if no workflow analyzed). */
  readonly complexity: ComplexityReport | null;
  /** When the report was generated. */
  readonly generatedAt: string;
}

/** Configuration for MetricsCollector. */
export interface MetricsCollectorConfig {
  /** Max execution time measurements to retain (default: 5000). */
  readonly maxExecutionTimeMeasurements?: number;
  /** Configuration for the memory tracker sub-component. */
  readonly memoryTrackerConfig?: MemoryTrackerConfig;
  /** Configuration for the token efficiency tracker sub-component. */
  readonly tokenTrackerConfig?: TokenEfficiencyTrackerConfig;
  /** Clock function for timestamps (default: performance.now). */
  readonly now?: () => number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of execution-time measurements to retain before oldest are evicted. */
export const DEFAULT_MAX_EXECUTION_TIME_MEASUREMENTS = 5000;

// ---------------------------------------------------------------------------
// Percentile helper
// ---------------------------------------------------------------------------

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower]!;
  const weight = index - lower;
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

// ---------------------------------------------------------------------------
// MetricsCollector
// ---------------------------------------------------------------------------

/**
 * Unified metrics collector that combines execution time, memory,
 * token efficiency, and complexity analysis.
 *
 * @example
 * ```typescript
 * import { MetricsCollector } from '@crewspace/core';
 *
 * const metrics = new MetricsCollector();
 *
 * // Record execution time
 * metrics.recordExecutionTime({ label: 'task-run', category: 'task', durationMs: 150 });
 *
 * // Measure memory
 * await metrics.measureMemory('agent-init', () => new Agent({ id: 'a', role: 'r', goal: 'g' }));
 *
 * // Record token usage
 * metrics.recordTokenUsage({
 *   operationType: 'llm-call',
 *   promptTokens: 500,
 *   completionTokens: 200,
 *   totalTokens: 700,
 *   durationMs: 1500,
 * });
 *
 * // Analyze complexity
 * metrics.analyzeWorkflow(workflowDescriptor);
 *
 * // Get unified report
 * const report = metrics.getReport();
 * ```
 */
export class MetricsCollector {
  private readonly _executionTimes: ExecutionTimeMeasurement[] = [];
  private readonly _maxExecutionTimes: number;
  private readonly _now: () => number;
  private readonly _memoryTracker: MemoryTracker;
  private readonly _tokenTracker: TokenEfficiencyTracker;
  private _lastComplexityReport: ComplexityReport | null = null;

  constructor(config?: MetricsCollectorConfig) {
    this._maxExecutionTimes =
      config?.maxExecutionTimeMeasurements ?? DEFAULT_MAX_EXECUTION_TIME_MEASUREMENTS;
    this._now = config?.now ?? (() => performance.now());
    this._memoryTracker = new MemoryTracker(config?.memoryTrackerConfig);
    this._tokenTracker = new TokenEfficiencyTracker(config?.tokenTrackerConfig);
  }

  // -----------------------------------------------------------------------
  // Execution Time
  // -----------------------------------------------------------------------

  /** Record an execution time measurement. */
  recordExecutionTime(input: ExecutionTimeInput): ExecutionTimeMeasurement {
    const measurement: ExecutionTimeMeasurement = {
      label: input.label,
      category: input.category,
      durationMs: input.durationMs,
      success: input.success ?? true,
      timestamp: this._now(),
    };

    this._executionTimes.push(measurement);
    if (this._executionTimes.length > this._maxExecutionTimes) {
      this._executionTimes.splice(0, this._executionTimes.length - this._maxExecutionTimes);
    }

    return measurement;
  }

  /**
   * Time an operation and automatically record it.
   *
   * @param label - Operation label
   * @param category - Category for grouping
   * @param fn - The operation to time
   * @returns The operation's return value
   */
  async timeExecution<T>(label: string, category: string, fn: () => T | Promise<T>): Promise<T> {
    const start = this._now();
    let success = true;
    try {
      return await fn();
    } catch (err) {
      success = false;
      throw err;
    } finally {
      const durationMs = this._now() - start;
      this.recordExecutionTime({ label, category, durationMs, success });
    }
  }

  /** Get all execution time measurements. */
  getExecutionTimes(): readonly ExecutionTimeMeasurement[] {
    return [...this._executionTimes];
  }

  /** Get execution time measurements by category. */
  getExecutionTimesByCategory(category: string): readonly ExecutionTimeMeasurement[] {
    return this._executionTimes.filter((m) => m.category === category);
  }

  /** Get execution time summary. */
  getExecutionTimeSummary(): ExecutionTimeSummary {
    return computeExecutionTimeSummary(this._executionTimes);
  }

  // -----------------------------------------------------------------------
  // Memory
  // -----------------------------------------------------------------------

  /** The underlying memory tracker instance. */
  get memoryTracker(): MemoryTracker {
    return this._memoryTracker;
  }

  /** Measure memory consumed by an operation. */
  async measureMemory<T>(
    label: string,
    fn: () => T | Promise<T>,
  ): Promise<MemoryMeasurement & { result: T }> {
    return this._memoryTracker.measure(label, fn);
  }

  /** Get memory summary. */
  getMemorySummary(): MemorySummary {
    return this._memoryTracker.getSummary();
  }

  // -----------------------------------------------------------------------
  // Token Efficiency
  // -----------------------------------------------------------------------

  /** The underlying token tracker instance. */
  get tokenTracker(): TokenEfficiencyTracker {
    return this._tokenTracker;
  }

  /** Record token usage for an operation. */
  recordTokenUsage(input: TokenRecordInput): TokenRecord {
    return this._tokenTracker.record(input);
  }

  /** Get token efficiency report. */
  getTokenEfficiencyReport(): TokenEfficiencyReport {
    return this._tokenTracker.getReport();
  }

  // -----------------------------------------------------------------------
  // Complexity
  // -----------------------------------------------------------------------

  /** Analyze a workflow and cache the result. */
  analyzeWorkflow(workflow: WorkflowDescriptor): ComplexityReport {
    this._lastComplexityReport = analyzeComplexity(workflow);
    return this._lastComplexityReport;
  }

  /** Get the last computed complexity report (or null). */
  getComplexityReport(): ComplexityReport | null {
    return this._lastComplexityReport;
  }

  // -----------------------------------------------------------------------
  // Unified Report
  // -----------------------------------------------------------------------

  /** Generate a unified report combining all metric dimensions. */
  getReport(): UnifiedMetricsReport {
    return {
      executionTime: this.getExecutionTimeSummary(),
      memory: this.getMemorySummary(),
      tokenEfficiency: this.getTokenEfficiencyReport(),
      complexity: this._lastComplexityReport,
      generatedAt: new Date().toISOString(),
    };
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /** Reset all collected metrics. */
  reset(): void {
    this._executionTimes.length = 0;
    this._memoryTracker.reset();
    this._tokenTracker.reset();
    this._lastComplexityReport = null;
  }
}

// ---------------------------------------------------------------------------
// Execution time summary computation
// ---------------------------------------------------------------------------

/**
 * Compute an aggregate summary from a list of execution-time measurements.
 *
 * Returns totals, averages, percentiles (p50/p95/p99), success/failure counts,
 * and per-category breakdowns.
 */
export function computeExecutionTimeSummary(
  measurements: readonly ExecutionTimeMeasurement[],
): ExecutionTimeSummary {
  if (measurements.length === 0) {
    return {
      count: 0,
      totalMs: 0,
      avgMs: 0,
      minMs: 0,
      maxMs: 0,
      p50Ms: 0,
      p95Ms: 0,
      p99Ms: 0,
      successCount: 0,
      failureCount: 0,
      byCategory: new Map(),
    };
  }

  const durations = measurements.map((m) => m.durationMs).sort((a, b) => a - b);
  let totalMs = 0;
  let successCount = 0;
  let failureCount = 0;

  const categoryGroups = new Map<string, number[]>();

  for (const m of measurements) {
    totalMs += m.durationMs;
    if (m.success) {
      successCount++;
    } else {
      failureCount++;
    }

    let group = categoryGroups.get(m.category);
    if (!group) {
      group = [];
      categoryGroups.set(m.category, group);
    }
    group.push(m.durationMs);
  }

  const byCategory = new Map<string, CategoryTimeSummary>();
  for (const [category, times] of categoryGroups) {
    const sorted = [...times].sort((a, b) => a - b);
    const catTotal = sorted.reduce((s, t) => s + t, 0);
    byCategory.set(category, {
      category,
      count: sorted.length,
      totalMs: catTotal,
      avgMs: catTotal / sorted.length,
      minMs: sorted[0]!,
      maxMs: sorted[sorted.length - 1]!,
    });
  }

  return {
    count: measurements.length,
    totalMs,
    avgMs: totalMs / measurements.length,
    minMs: durations[0]!,
    maxMs: durations[durations.length - 1]!,
    p50Ms: percentile(durations, 50),
    p95Ms: percentile(durations, 95),
    p99Ms: percentile(durations, 99),
    successCount,
    failureCount,
    byCategory,
  };
}
