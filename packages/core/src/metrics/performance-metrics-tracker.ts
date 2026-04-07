/**
 * Unified performance metrics tracker for the Crewspace framework.
 *
 * Provides a single, high-level API for tracking three key performance
 * dimensions:
 *
 * 1. **Duration** — wall-clock timing with percentile statistics
 * 2. **Tokens** — prompt/completion token counts and throughput
 * 3. **API Calls** — call counts, rates, and latency by endpoint
 *
 * Designed to be attached to agents, engines, or crews to capture
 * performance data during workflow execution.
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Category of API call being tracked. */
export enum ApiCallCategory {
  /** An LLM text-generation or chat-completion call. */
  LLM = 'llm',
  /** A tool invocation (e.g., web search, file read). */
  TOOL = 'tool',
  /** An external HTTP API call. */
  HTTP = 'http',
  /** A custom/uncategorized call. */
  CUSTOM = 'custom',
}

/** Token usage for a single operation. */
export interface OperationTokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

/** A single recorded API call with all associated metrics. */
export interface ApiCallRecord {
  /** Auto-generated unique identifier. */
  readonly id: string;
  /** Category of the call. */
  readonly category: ApiCallCategory;
  /** Specific endpoint or operation name (e.g., model ID, tool name). */
  readonly endpoint: string;
  /** Duration of the call in milliseconds. */
  readonly durationMs: number;
  /** Token usage, if applicable (e.g., LLM calls). */
  readonly tokenUsage?: OperationTokenUsage | undefined;
  /** Whether the call succeeded. */
  readonly success: boolean;
  /** Error message if the call failed. */
  readonly errorMessage?: string | undefined;
  /** HTTP status code, if applicable. */
  readonly statusCode?: number | undefined;
  /** Timestamp when the call was recorded. */
  readonly timestamp: number;
  /** Arbitrary metadata for custom tracking. */
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}

/** Input for recording an API call. The tracker fills in `id` and `timestamp`. */
export interface ApiCallInput {
  readonly category: ApiCallCategory;
  readonly endpoint: string;
  readonly durationMs: number;
  readonly tokenUsage?: OperationTokenUsage | undefined;
  readonly success?: boolean | undefined;
  readonly errorMessage?: string | undefined;
  readonly statusCode?: number | undefined;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}

/** Summary statistics for a group of API calls. */
export interface ApiCallSummary {
  /** Total number of calls. */
  readonly totalCalls: number;
  /** Successful calls. */
  readonly successCount: number;
  /** Failed calls. */
  readonly failureCount: number;
  /** Success rate (0–1). */
  readonly successRate: number;
  /** Total duration across all calls (ms). */
  readonly totalDurationMs: number;
  /** Average duration per call (ms). */
  readonly avgDurationMs: number;
  /** Minimum duration (ms). */
  readonly minDurationMs: number;
  /** Maximum duration (ms). */
  readonly maxDurationMs: number;
  /** Median duration (ms). */
  readonly p50DurationMs: number;
  /** 95th percentile duration (ms). */
  readonly p95DurationMs: number;
  /** 99th percentile duration (ms). */
  readonly p99DurationMs: number;
  /** Total prompt tokens across all calls. */
  readonly totalPromptTokens: number;
  /** Total completion tokens across all calls. */
  readonly totalCompletionTokens: number;
  /** Total tokens across all calls. */
  readonly totalTokens: number;
  /** Average tokens per call. */
  readonly avgTokensPerCall: number;
  /** Token throughput (tokens/second). */
  readonly tokensPerSecond: number;
}

/** Per-category breakdown of API call metrics. */
export interface CategoryBreakdown {
  readonly category: ApiCallCategory;
  readonly summary: ApiCallSummary;
}

/** Per-endpoint breakdown of API call metrics. */
export interface EndpointBreakdown {
  readonly endpoint: string;
  readonly category: ApiCallCategory;
  readonly summary: ApiCallSummary;
}

/** Rate information over a time window. */
export interface CallRate {
  /** Time window in milliseconds. */
  readonly windowMs: number;
  /** Number of calls in the window. */
  readonly callCount: number;
  /** Calls per second within the window. */
  readonly callsPerSecond: number;
  /** Calls per minute within the window. */
  readonly callsPerMinute: number;
}

/** Full performance metrics report. */
export interface PerformanceMetricsReport {
  /** Aggregate summary across all API calls. */
  readonly totals: ApiCallSummary;
  /** Breakdown by call category. */
  readonly byCategory: ReadonlyMap<ApiCallCategory, ApiCallSummary>;
  /** Breakdown by endpoint. */
  readonly byEndpoint: ReadonlyMap<string, EndpointBreakdown>;
  /** Call rate over the tracker's lifetime. */
  readonly overallRate: CallRate;
  /** Call rate over the last 60 seconds. */
  readonly recentRate: CallRate;
  /** Earliest call timestamp, or undefined if empty. */
  readonly startTime: number | undefined;
  /** Latest call timestamp, or undefined if empty. */
  readonly endTime: number | undefined;
  /** When the report was generated (ISO string). */
  readonly generatedAt: string;
}

/** Configuration for the PerformanceMetricsTracker. */
export interface PerformanceMetricsTrackerConfig {
  /** Maximum records to retain (default: 10_000). Oldest are evicted first. */
  readonly maxRecords?: number;
  /** Clock function for timestamps (default: Date.now). Override for tests. */
  readonly now?: () => number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default maximum records retained. */
export const DEFAULT_MAX_RECORDS = 10_000;

/** One minute in milliseconds — used for recent-rate calculation. */
const ONE_MINUTE_MS = 60_000;

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

let _nextApiCallId = 0;

/** @internal Reset the ID counter (for tests). */
export function _resetApiCallIdCounter(): void {
  _nextApiCallId = 0;
}

function generateApiCallId(): string {
  return `api-${String(++_nextApiCallId)}`;
}

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
// Summary computation
// ---------------------------------------------------------------------------

/** Compute an {@link ApiCallSummary} from a list of records. */
export function computeApiCallSummary(records: readonly ApiCallRecord[]): ApiCallSummary {
  if (records.length === 0) {
    return {
      totalCalls: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
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
      avgTokensPerCall: 0,
      tokensPerSecond: 0,
    };
  }

  const durations = records.map((r) => r.durationMs).sort((a, b) => a - b);
  let totalDurationMs = 0;
  let successCount = 0;
  let failureCount = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;

  for (const r of records) {
    totalDurationMs += r.durationMs;
    if (r.success) {
      successCount++;
    } else {
      failureCount++;
    }
    if (r.tokenUsage) {
      totalPromptTokens += r.tokenUsage.promptTokens;
      totalCompletionTokens += r.tokenUsage.completionTokens;
      totalTokens += r.tokenUsage.totalTokens;
    }
  }

  return {
    totalCalls: records.length,
    successCount,
    failureCount,
    successRate: successCount / records.length,
    totalDurationMs,
    avgDurationMs: totalDurationMs / records.length,
    minDurationMs: durations[0]!,
    maxDurationMs: durations[durations.length - 1]!,
    p50DurationMs: percentile(durations, 50),
    p95DurationMs: percentile(durations, 95),
    p99DurationMs: percentile(durations, 99),
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens,
    avgTokensPerCall: totalTokens / records.length,
    tokensPerSecond: totalDurationMs > 0 ? (totalTokens / totalDurationMs) * 1000 : 0,
  };
}

// ---------------------------------------------------------------------------
// PerformanceMetricsTracker
// ---------------------------------------------------------------------------

/**
 * Unified performance metrics tracker that combines duration, token usage,
 * and API call tracking into a single cohesive interface.
 *
 * @example
 * ```typescript
 * import { PerformanceMetricsTracker, ApiCallCategory } from '@crewspace/core';
 *
 * const tracker = new PerformanceMetricsTracker();
 *
 * // Record an LLM API call
 * tracker.recordApiCall({
 *   category: ApiCallCategory.LLM,
 *   endpoint: 'gpt-4o',
 *   durationMs: 1200,
 *   tokenUsage: { promptTokens: 500, completionTokens: 200, totalTokens: 700 },
 * });
 *
 * // Record a tool call
 * tracker.recordApiCall({
 *   category: ApiCallCategory.TOOL,
 *   endpoint: 'web-search',
 *   durationMs: 350,
 * });
 *
 * // Use the timer API for automatic duration measurement
 * const timer = tracker.startTimer(ApiCallCategory.LLM, 'gpt-4o');
 * // ... perform API call ...
 * timer.stop({
 *   tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
 * });
 *
 * // Get the full report
 * const report = tracker.getReport();
 * console.log(`Total API calls: ${report.totals.totalCalls}`);
 * console.log(`LLM calls: ${report.byCategory.get('llm')?.totalCalls}`);
 * console.log(`Calls/min: ${report.recentRate.callsPerMinute}`);
 * ```
 */
export class PerformanceMetricsTracker {
  private readonly _records: ApiCallRecord[] = [];
  private readonly _maxRecords: number;
  private readonly _now: () => number;

  constructor(config?: PerformanceMetricsTrackerConfig) {
    this._maxRecords = config?.maxRecords ?? DEFAULT_MAX_RECORDS;
    this._now = config?.now ?? (() => Date.now());
  }

  // -----------------------------------------------------------------------
  // Recording
  // -----------------------------------------------------------------------

  /**
   * Record a completed API call.
   *
   * @param input - API call data
   * @returns The recorded {@link ApiCallRecord}
   */
  recordApiCall(input: ApiCallInput): ApiCallRecord {
    const record: ApiCallRecord = {
      id: generateApiCallId(),
      category: input.category,
      endpoint: input.endpoint,
      durationMs: input.durationMs,
      tokenUsage: input.tokenUsage ? { ...input.tokenUsage } : undefined,
      success: input.success ?? true,
      errorMessage: input.errorMessage,
      statusCode: input.statusCode,
      timestamp: this._now(),
      metadata: input.metadata,
    };

    this._records.push(record);

    if (this._records.length > this._maxRecords) {
      this._records.splice(0, this._records.length - this._maxRecords);
    }

    return record;
  }

  /**
   * Start a timer for an API call. Call {@link ApiCallTimer.stop}
   * when the call completes to automatically record the duration.
   *
   * @param category - Category of the call
   * @param endpoint - Endpoint or operation name
   * @param metadata - Optional metadata
   * @returns An {@link ApiCallTimer} instance
   */
  startTimer(
    category: ApiCallCategory,
    endpoint: string,
    metadata?: Readonly<Record<string, unknown>>,
  ): ApiCallTimer {
    return new ApiCallTimer(this, category, endpoint, this._now(), this._now, metadata);
  }

  /**
   * Time an async operation and automatically record it.
   *
   * @param category - Category of the call
   * @param endpoint - Endpoint or operation name
   * @param fn - The async operation to time
   * @returns The operation's return value
   */
  async timeApiCall<T>(
    category: ApiCallCategory,
    endpoint: string,
    fn: () => T | Promise<T>,
  ): Promise<T> {
    const start = this._now();
    let success = true;
    let errorMessage: string | undefined;
    try {
      return await fn();
    } catch (err) {
      success = false;
      errorMessage = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      const durationMs = this._now() - start;
      this.recordApiCall({ category, endpoint, durationMs, success, errorMessage });
    }
  }

  // -----------------------------------------------------------------------
  // Query methods
  // -----------------------------------------------------------------------

  /** Get all recorded API call records (shallow copy). */
  getRecords(): readonly ApiCallRecord[] {
    return [...this._records];
  }

  /** Total number of recorded calls. */
  get recordCount(): number {
    return this._records.length;
  }

  /** Get records filtered by category. */
  getRecordsByCategory(category: ApiCallCategory): readonly ApiCallRecord[] {
    return this._records.filter((r) => r.category === category);
  }

  /** Get records filtered by endpoint. */
  getRecordsByEndpoint(endpoint: string): readonly ApiCallRecord[] {
    return this._records.filter((r) => r.endpoint === endpoint);
  }

  /** Get records within a time window. */
  getRecordsSince(sinceTimestamp: number): readonly ApiCallRecord[] {
    return this._records.filter((r) => r.timestamp >= sinceTimestamp);
  }

  // -----------------------------------------------------------------------
  // Aggregation
  // -----------------------------------------------------------------------

  /** Compute summary statistics across all recorded calls. */
  getSummary(): ApiCallSummary {
    return computeApiCallSummary(this._records);
  }

  /** Compute summary for a specific category. */
  getCategorySummary(category: ApiCallCategory): ApiCallSummary {
    return computeApiCallSummary(this._records.filter((r) => r.category === category));
  }

  /** Compute summary for a specific endpoint. */
  getEndpointSummary(endpoint: string): ApiCallSummary {
    return computeApiCallSummary(this._records.filter((r) => r.endpoint === endpoint));
  }

  /**
   * Compute the call rate within a given time window.
   *
   * @param windowMs - Time window in milliseconds (default: 60_000 = 1 minute)
   */
  getCallRate(windowMs: number = ONE_MINUTE_MS): CallRate {
    const now = this._now();
    const since = now - windowMs;
    const recent = this._records.filter((r) => r.timestamp >= since);
    const windowSeconds = windowMs / 1000;

    return {
      windowMs,
      callCount: recent.length,
      callsPerSecond: windowSeconds > 0 ? recent.length / windowSeconds : 0,
      callsPerMinute: windowSeconds > 0 ? (recent.length / windowSeconds) * 60 : 0,
    };
  }

  /**
   * Generate a full {@link PerformanceMetricsReport} with breakdowns by
   * category, endpoint, and call rates.
   */
  getReport(): PerformanceMetricsReport {
    const totals = computeApiCallSummary(this._records);

    // Group by category
    const categoryGroups = new Map<ApiCallCategory, ApiCallRecord[]>();
    // Group by endpoint
    const endpointGroups = new Map<string, { category: ApiCallCategory; records: ApiCallRecord[] }>();

    for (const r of this._records) {
      // Category grouping
      let catGroup = categoryGroups.get(r.category);
      if (!catGroup) {
        catGroup = [];
        categoryGroups.set(r.category, catGroup);
      }
      catGroup.push(r);

      // Endpoint grouping
      let epGroup = endpointGroups.get(r.endpoint);
      if (!epGroup) {
        epGroup = { category: r.category, records: [] };
        endpointGroups.set(r.endpoint, epGroup);
      }
      epGroup.records.push(r);
    }

    const byCategory = new Map<ApiCallCategory, ApiCallSummary>();
    for (const [cat, records] of categoryGroups) {
      byCategory.set(cat, computeApiCallSummary(records));
    }

    const byEndpoint = new Map<string, EndpointBreakdown>();
    for (const [ep, group] of endpointGroups) {
      byEndpoint.set(ep, {
        endpoint: ep,
        category: group.category,
        summary: computeApiCallSummary(group.records),
      });
    }

    // Compute rates
    let startTime: number | undefined;
    let endTime: number | undefined;

    for (const r of this._records) {
      if (startTime === undefined || r.timestamp < startTime) {
        startTime = r.timestamp;
      }
      if (endTime === undefined || r.timestamp > endTime) {
        endTime = r.timestamp;
      }
    }

    const overallWindowMs = startTime !== undefined && endTime !== undefined
      ? Math.max(endTime - startTime, 1)
      : 0;

    const overallRate: CallRate = {
      windowMs: overallWindowMs,
      callCount: this._records.length,
      callsPerSecond: overallWindowMs > 0 ? (this._records.length / overallWindowMs) * 1000 : 0,
      callsPerMinute: overallWindowMs > 0 ? (this._records.length / overallWindowMs) * 60_000 : 0,
    };

    const recentRate = this.getCallRate(ONE_MINUTE_MS);

    return {
      totals,
      byCategory,
      byEndpoint,
      overallRate,
      recentRate,
      startTime,
      endTime,
      generatedAt: new Date().toISOString(),
    };
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /** Clear all recorded metrics. */
  reset(): void {
    this._records.length = 0;
  }
}

// ---------------------------------------------------------------------------
// ApiCallTimer
// ---------------------------------------------------------------------------

/** Input for stopping an API call timer. */
export interface ApiCallTimerStopInput {
  readonly tokenUsage?: OperationTokenUsage;
  readonly success?: boolean;
  readonly errorMessage?: string;
  readonly statusCode?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * A running timer for an API call. Created via
 * {@link PerformanceMetricsTracker.startTimer}.
 *
 * Call {@link stop} when the operation completes to record the metric.
 */
export class ApiCallTimer {
  private _stopped = false;

  /** @internal */
  constructor(
    private readonly _tracker: PerformanceMetricsTracker,
    private readonly _category: ApiCallCategory,
    private readonly _endpoint: string,
    private readonly _startTime: number,
    private readonly _now: () => number,
    private readonly _metadata?: Readonly<Record<string, unknown>>,
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
   * Stop the timer, calculate duration, and record the API call.
   *
   * @param extra - Optional token usage, success flag, or metadata
   * @returns The recorded {@link ApiCallRecord}
   * @throws If the timer has already been stopped
   */
  stop(extra?: ApiCallTimerStopInput): ApiCallRecord {
    if (this._stopped) {
      throw new Error('ApiCallTimer has already been stopped');
    }
    this._stopped = true;

    const endTime = this._now();
    const durationMs = endTime - this._startTime;

    const mergedMetadata =
      this._metadata || extra?.metadata
        ? { ...this._metadata, ...extra?.metadata }
        : undefined;

    return this._tracker.recordApiCall({
      category: this._category,
      endpoint: this._endpoint,
      durationMs,
      tokenUsage: extra?.tokenUsage,
      success: extra?.success ?? true,
      errorMessage: extra?.errorMessage,
      statusCode: extra?.statusCode,
      metadata: mergedMetadata,
    });
  }
}
