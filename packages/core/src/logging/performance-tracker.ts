/**
 * Performance metrics tracking for the Crewspace framework.
 *
 * Provides a {@link PerformanceTracker} that records timing, token usage,
 * and API call metrics across engine runs, task executions, LLM calls,
 * and tool invocations.
 *
 * Use {@link PerformanceTimer} for convenient start/stop timing of
 * individual operations.
 *
 * @example
 * ```typescript
 * import { PerformanceTracker, PerformanceTimer } from '@crewspace/core';
 *
 * const tracker = new PerformanceTracker();
 *
 * // Record a task execution
 * const timer = tracker.startTimer({ type: MetricType.TASK_EXECUTION, taskId: 'summarize' });
 * // ... do work ...
 * timer.stop({ tokenUsage: { promptTokens: 200, completionTokens: 80, totalTokens: 280 } });
 *
 * // Get a performance report
 * const report = tracker.getReport();
 * console.log(report.totals.avgDurationMs);
 * console.log(report.byType.get('task-execution')?.count);
 * ```
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Metric Types
// ---------------------------------------------------------------------------

/** The category of operation being measured. */
export enum MetricType {
  /** Full engine run (one call to engine.run()). */
  ENGINE_RUN = 'engine-run',
  /** Execution of a single task within an engine run. */
  TASK_EXECUTION = 'task-execution',
  /** A single LLM API call (text or streaming). */
  LLM_CALL = 'llm-call',
  /** Execution of a tool by an agent. */
  TOOL_CALL = 'tool-call',
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Token usage associated with a metric (mirrors the LLM TokenUsage shape).
 */
export interface MetricTokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

/**
 * A single recorded performance measurement.
 */
export interface PerformanceMetric {
  /** Unique identifier for this metric. */
  readonly id: string;
  /** Category of operation measured. */
  readonly type: MetricType;
  /** Engine that produced this metric (if applicable). */
  readonly engineId?: string;
  /** Task being executed (if applicable). */
  readonly taskId?: string;
  /** Agent performing the action (if applicable). */
  readonly agentId?: string;
  /** Tool being invoked (if applicable). */
  readonly toolId?: string;
  /** When the operation started. */
  readonly startTime: number;
  /** When the operation ended. */
  readonly endTime: number;
  /** Duration in milliseconds. */
  readonly durationMs: number;
  /** Token usage, if an LLM was involved. */
  readonly tokenUsage?: MetricTokenUsage;
  /** Whether the operation succeeded. */
  readonly success: boolean;
  /** Error message if the operation failed. */
  readonly errorMessage?: string;
  /** Arbitrary metadata for custom tracking. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Input for recording a metric. The tracker fills in `id` automatically.
 */
export interface PerformanceMetricInput {
  readonly type: MetricType;
  readonly engineId?: string;
  readonly taskId?: string;
  readonly agentId?: string;
  readonly toolId?: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly durationMs: number;
  readonly tokenUsage?: MetricTokenUsage;
  readonly success?: boolean;
  readonly errorMessage?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Input for starting a timer. Only contextual identifiers are needed;
 * timing is handled automatically.
 */
export interface TimerStartInput {
  readonly type: MetricType;
  readonly engineId?: string;
  readonly taskId?: string;
  readonly agentId?: string;
  readonly toolId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Optional data to attach when stopping a timer.
 */
export interface TimerStopInput {
  readonly tokenUsage?: MetricTokenUsage;
  readonly success?: boolean;
  readonly errorMessage?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Statistical summary of a group of metrics.
 */
export interface PerformanceSummary {
  /** Number of recorded metrics. */
  readonly count: number;
  /** Total duration across all metrics (ms). */
  readonly totalDurationMs: number;
  /** Mean duration (ms). */
  readonly avgDurationMs: number;
  /** Shortest duration (ms). */
  readonly minDurationMs: number;
  /** Longest duration (ms). */
  readonly maxDurationMs: number;
  /** Median duration (ms). */
  readonly p50DurationMs: number;
  /** 95th percentile duration (ms). */
  readonly p95DurationMs: number;
  /** 99th percentile duration (ms). */
  readonly p99DurationMs: number;
  /** Total prompt tokens consumed. */
  readonly totalPromptTokens: number;
  /** Total completion tokens produced. */
  readonly totalCompletionTokens: number;
  /** Total tokens (prompt + completion). */
  readonly totalTokens: number;
  /** Number of successful operations. */
  readonly successCount: number;
  /** Number of failed operations. */
  readonly failureCount: number;
}

/**
 * Full performance report with breakdowns by type, engine, task, and agent.
 */
export interface PerformanceReport {
  /** Aggregate summary across all metrics. */
  readonly totals: PerformanceSummary;
  /** Breakdown by {@link MetricType}. */
  readonly byType: ReadonlyMap<string, PerformanceSummary>;
  /** Breakdown by engine ID. */
  readonly byEngine: ReadonlyMap<string, PerformanceSummary>;
  /** Breakdown by task ID. */
  readonly byTask: ReadonlyMap<string, PerformanceSummary>;
  /** Breakdown by agent ID. */
  readonly byAgent: ReadonlyMap<string, PerformanceSummary>;
  /** Earliest metric start time, or `undefined` if no metrics exist. */
  readonly startTime: number | undefined;
  /** Latest metric end time, or `undefined` if no metrics exist. */
  readonly endTime: number | undefined;
}

/**
 * Configuration for the performance tracker.
 */
export interface PerformanceTrackerConfig {
  /** Maximum number of metrics to retain (default: 10_000). Oldest are evicted first. */
  readonly maxMetrics?: number;
  /** Clock function for timestamps (default: `Date.now`). Override for deterministic tests. */
  readonly now?: () => number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default maximum metrics retained in the tracker. */
export const DEFAULT_MAX_METRICS = 10_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _nextMetricId = 0;

/** @internal */
export function _resetMetricIdCounter(): void {
  _nextMetricId = 0;
}

function generateMetricId(): string {
  return `perf-${String(++_nextMetricId)}`;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function computeSummary(metrics: readonly PerformanceMetric[]): PerformanceSummary {
  if (metrics.length === 0) {
    return {
      count: 0,
      totalDurationMs: 0,
      avgDurationMs: 0,
      minDurationMs: 0,
      maxDurationMs: 0,
      p50DurationMs: 0,
      p95DurationMs: 0,
      p99DurationMs: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      successCount: 0,
      failureCount: 0,
    };
  }

  const durations = metrics.map((m) => m.durationMs).sort((a, b) => a - b);
  let totalDurationMs = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let successCount = 0;
  let failureCount = 0;

  for (const m of metrics) {
    totalDurationMs += m.durationMs;
    if (m.tokenUsage) {
      totalPromptTokens += m.tokenUsage.promptTokens;
      totalCompletionTokens += m.tokenUsage.completionTokens;
      totalTokens += m.tokenUsage.totalTokens;
    }
    if (m.success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  return {
    count: metrics.length,
    totalDurationMs,
    avgDurationMs: totalDurationMs / metrics.length,
    minDurationMs: durations[0],
    maxDurationMs: durations[durations.length - 1],
    p50DurationMs: percentile(durations, 50),
    p95DurationMs: percentile(durations, 95),
    p99DurationMs: percentile(durations, 99),
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens,
    successCount,
    failureCount,
  };
}

function groupBy<K extends string>(
  metrics: readonly PerformanceMetric[],
  keyFn: (m: PerformanceMetric) => K | undefined,
): Map<string, PerformanceSummary> {
  const groups = new Map<string, PerformanceMetric[]>();
  for (const m of metrics) {
    const key = keyFn(m);
    if (key === undefined) continue;
    const group = groups.get(key);
    if (group) {
      group.push(m);
    } else {
      groups.set(key, [m]);
    }
  }
  const result = new Map<string, PerformanceSummary>();
  for (const [key, group] of groups) {
    result.set(key, computeSummary(group));
  }
  return result;
}

// ---------------------------------------------------------------------------
// PerformanceTimer
// ---------------------------------------------------------------------------

/**
 * A running timer that records a {@link PerformanceMetric} when stopped.
 *
 * Created via {@link PerformanceTracker.startTimer}. Call {@link stop} to
 * finalize the measurement and record it in the tracker.
 *
 * @example
 * ```typescript
 * const timer = tracker.startTimer({ type: MetricType.LLM_CALL, agentId: 'writer' });
 * const response = await llm.generateText(messages);
 * const metric = timer.stop({ tokenUsage: response.tokenUsage });
 * ```
 */
export class PerformanceTimer {
  private _stopped = false;

  /** @internal */
  constructor(
    private readonly _tracker: PerformanceTracker,
    private readonly _input: TimerStartInput,
    private readonly _startTime: number,
    private readonly _now: () => number,
  ) {}

  /** Whether this timer has been stopped. */
  get stopped(): boolean {
    return this._stopped;
  }

  /** The start time captured when this timer was created. */
  get startTime(): number {
    return this._startTime;
  }

  /**
   * Stop the timer, calculate duration, and record the metric.
   *
   * @param extra - Optional token usage, success flag, or metadata
   * @returns The recorded {@link PerformanceMetric}
   * @throws If the timer has already been stopped
   */
  stop(extra?: TimerStopInput): PerformanceMetric {
    if (this._stopped) {
      throw new Error('PerformanceTimer has already been stopped');
    }
    this._stopped = true;

    const endTime = this._now();
    const durationMs = endTime - this._startTime;

    const mergedMetadata =
      this._input.metadata || extra?.metadata
        ? { ...this._input.metadata, ...extra?.metadata }
        : undefined;

    return this._tracker.record({
      type: this._input.type,
      engineId: this._input.engineId,
      taskId: this._input.taskId,
      agentId: this._input.agentId,
      toolId: this._input.toolId,
      startTime: this._startTime,
      endTime,
      durationMs,
      tokenUsage: extra?.tokenUsage,
      success: extra?.success ?? true,
      errorMessage: extra?.errorMessage,
      metadata: mergedMetadata,
    });
  }
}

// ---------------------------------------------------------------------------
// PerformanceTracker
// ---------------------------------------------------------------------------

/**
 * Central performance metrics collector for Crewspace.
 *
 * Tracks duration, token usage, and API call counts across engine runs,
 * task executions, LLM calls, and tool invocations. Generates statistical
 * reports with percentile breakdowns.
 *
 * @example
 * ```typescript
 * import { PerformanceTracker, MetricType } from '@crewspace/core';
 *
 * const tracker = new PerformanceTracker();
 *
 * // Using the timer API
 * const timer = tracker.startTimer({ type: MetricType.LLM_CALL, agentId: 'writer' });
 * // ... do work ...
 * timer.stop({ tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 } });
 *
 * // Direct recording
 * tracker.record({
 *   type: MetricType.TOOL_CALL,
 *   toolId: 'web-search',
 *   startTime: 1000,
 *   endTime: 1500,
 *   durationMs: 500,
 * });
 *
 * // Query metrics
 * const llmMetrics = tracker.getMetricsByType(MetricType.LLM_CALL);
 * const report = tracker.getReport();
 * console.log(`Avg LLM call: ${report.byType.get('llm-call')?.avgDurationMs}ms`);
 * ```
 */
export class PerformanceTracker {
  private readonly _metrics: PerformanceMetric[] = [];
  private readonly _maxMetrics: number;
  private readonly _now: () => number;

  constructor(config?: PerformanceTrackerConfig) {
    this._maxMetrics = config?.maxMetrics ?? DEFAULT_MAX_METRICS;
    this._now = config?.now ?? (() => Date.now());
  }

  /**
   * Record a fully-formed performance metric.
   *
   * @param input - The metric data (an `id` is generated automatically)
   * @returns The recorded {@link PerformanceMetric}
   */
  record(input: PerformanceMetricInput): PerformanceMetric {
    const metric: PerformanceMetric = {
      id: generateMetricId(),
      type: input.type,
      engineId: input.engineId,
      taskId: input.taskId,
      agentId: input.agentId,
      toolId: input.toolId,
      startTime: input.startTime,
      endTime: input.endTime,
      durationMs: input.durationMs,
      tokenUsage: input.tokenUsage ? { ...input.tokenUsage } : undefined,
      success: input.success ?? true,
      errorMessage: input.errorMessage,
      metadata: input.metadata,
    };

    this._metrics.push(metric);

    // Evict oldest metrics if we've exceeded the cap
    if (this._metrics.length > this._maxMetrics) {
      this._metrics.splice(0, this._metrics.length - this._maxMetrics);
    }

    return metric;
  }

  /**
   * Start a timer for an operation. Call {@link PerformanceTimer.stop}
   * to record the metric when the operation completes.
   *
   * @param input - Context about the operation being timed
   * @returns A {@link PerformanceTimer} instance
   */
  startTimer(input: TimerStartInput): PerformanceTimer {
    return new PerformanceTimer(this, input, this._now(), this._now);
  }

  // -----------------------------------------------------------------------
  // Query methods
  // -----------------------------------------------------------------------

  /** Get all recorded metrics (shallow copy). */
  getMetrics(): readonly PerformanceMetric[] {
    return [...this._metrics];
  }

  /** Get the total number of recorded metrics. */
  get metricCount(): number {
    return this._metrics.length;
  }

  /** Get metrics filtered by {@link MetricType}. */
  getMetricsByType(type: MetricType): readonly PerformanceMetric[] {
    return this._metrics.filter((m) => m.type === type);
  }

  /** Get metrics filtered by engine ID. */
  getMetricsByEngine(engineId: string): readonly PerformanceMetric[] {
    return this._metrics.filter((m) => m.engineId === engineId);
  }

  /** Get metrics filtered by task ID. */
  getMetricsByTask(taskId: string): readonly PerformanceMetric[] {
    return this._metrics.filter((m) => m.taskId === taskId);
  }

  /** Get metrics filtered by agent ID. */
  getMetricsByAgent(agentId: string): readonly PerformanceMetric[] {
    return this._metrics.filter((m) => m.agentId === agentId);
  }

  // -----------------------------------------------------------------------
  // Aggregation
  // -----------------------------------------------------------------------

  /** Compute a {@link PerformanceSummary} over all recorded metrics. */
  getSummary(): PerformanceSummary {
    return computeSummary(this._metrics);
  }

  /**
   * Generate a full {@link PerformanceReport} with breakdowns by type,
   * engine, task, and agent.
   */
  getReport(): PerformanceReport {
    const totals = computeSummary(this._metrics);

    const byType = groupBy(this._metrics, (m) => m.type);
    const byEngine = groupBy(this._metrics, (m) => m.engineId);
    const byTask = groupBy(this._metrics, (m) => m.taskId);
    const byAgent = groupBy(this._metrics, (m) => m.agentId);

    let startTime: number | undefined;
    let endTime: number | undefined;

    for (const m of this._metrics) {
      if (startTime === undefined || m.startTime < startTime) {
        startTime = m.startTime;
      }
      if (endTime === undefined || m.endTime > endTime) {
        endTime = m.endTime;
      }
    }

    return { totals, byType, byEngine, byTask, byAgent, startTime, endTime };
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /** Clear all recorded metrics. */
  reset(): void {
    this._metrics.length = 0;
  }
}
