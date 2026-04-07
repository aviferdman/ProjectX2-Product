/**
 * Token efficiency analysis for the Crewspace framework.
 *
 * Measures how effectively tokens are used across LLM operations,
 * including tokens-per-task, tokens-per-second throughput, prompt/completion
 * ratios, and cost efficiency.
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Token usage record for a single operation. */
export interface TokenRecord {
  /** Unique identifier for the record. */
  readonly id: string;
  /** Category of operation (e.g. 'task', 'tool-call', 'llm-call'). */
  readonly operationType: string;
  /** Optional task, agent, or engine identifier. */
  readonly operationId?: string | undefined;
  /** Number of prompt/input tokens. */
  readonly promptTokens: number;
  /** Number of completion/output tokens. */
  readonly completionTokens: number;
  /** Total tokens (prompt + completion). */
  readonly totalTokens: number;
  /** Operation duration in milliseconds. */
  readonly durationMs: number;
  /** Whether the operation succeeded. */
  readonly success: boolean;
  /** Timestamp when recorded. */
  readonly timestamp: number;
  /** Optional cost in USD. */
  readonly costUsd?: number | undefined;
}

/** Input for recording a token usage entry. */
export interface TokenRecordInput {
  readonly operationType: string;
  readonly operationId?: string;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
  readonly durationMs: number;
  readonly success?: boolean;
  readonly costUsd?: number;
}

/** Token efficiency metrics for a set of operations. */
export interface TokenEfficiencyReport {
  /** Total operations analyzed. */
  readonly operationCount: number;
  /** Total tokens consumed. */
  readonly totalTokens: number;
  /** Total prompt tokens. */
  readonly totalPromptTokens: number;
  /** Total completion tokens. */
  readonly totalCompletionTokens: number;
  /** Ratio of prompt to completion tokens. */
  readonly promptToCompletionRatio: number;
  /** Average tokens per operation. */
  readonly avgTokensPerOperation: number;
  /** Average tokens per second (throughput). */
  readonly avgTokensPerSecond: number;
  /** Average prompt tokens per operation. */
  readonly avgPromptTokensPerOp: number;
  /** Average completion tokens per operation. */
  readonly avgCompletionTokensPerOp: number;
  /** Total duration across all operations (ms). */
  readonly totalDurationMs: number;
  /** Average duration per operation (ms). */
  readonly avgDurationMs: number;
  /** Total estimated cost (USD). */
  readonly totalCostUsd: number;
  /** Average cost per operation (USD). */
  readonly avgCostPerOperation: number;
  /** Cost per 1000 tokens (USD). */
  readonly costPer1kTokens: number;
  /** Number of successful operations. */
  readonly successCount: number;
  /** Number of failed operations (tokens wasted). */
  readonly failureCount: number;
  /** Tokens consumed by failed operations. */
  readonly wastedTokens: number;
  /** Waste ratio: wastedTokens / totalTokens. */
  readonly wasteRatio: number;
  /** Breakdown by operation type. */
  readonly byOperationType: ReadonlyMap<string, TokenTypeBreakdown>;
}

/** Breakdown of token efficiency for a specific operation type. */
export interface TokenTypeBreakdown {
  readonly operationType: string;
  readonly count: number;
  readonly totalTokens: number;
  readonly avgTokensPerOp: number;
  readonly totalDurationMs: number;
  readonly avgTokensPerSecond: number;
  readonly totalCostUsd: number;
}

/** Configuration for TokenEfficiencyTracker. */
export interface TokenEfficiencyTrackerConfig {
  /** Maximum records to retain (default: 5000). */
  readonly maxRecords?: number;
  /** Clock function for timestamps (default: Date.now). */
  readonly now?: () => number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_MAX_TOKEN_RECORDS = 5000;

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

let _nextTokenRecordId = 0;

/** @internal Reset ID counter (for tests). */
export function _resetTokenRecordIdCounter(): void {
  _nextTokenRecordId = 0;
}

function generateTokenRecordId(): string {
  return `tok-${String(++_nextTokenRecordId)}`;
}

// ---------------------------------------------------------------------------
// TokenEfficiencyTracker
// ---------------------------------------------------------------------------

/**
 * Tracks token usage across LLM operations and computes efficiency metrics.
 *
 * @example
 * ```typescript
 * const tracker = new TokenEfficiencyTracker();
 *
 * tracker.record({
 *   operationType: 'task',
 *   operationId: 'summarize',
 *   promptTokens: 500,
 *   completionTokens: 200,
 *   totalTokens: 700,
 *   durationMs: 1500,
 * });
 *
 * const report = tracker.getReport();
 * console.log(`Avg tokens/sec: ${report.avgTokensPerSecond.toFixed(0)}`);
 * ```
 */
export class TokenEfficiencyTracker {
  private readonly _records: TokenRecord[] = [];
  private readonly _maxRecords: number;
  private readonly _now: () => number;

  constructor(config?: TokenEfficiencyTrackerConfig) {
    this._maxRecords = config?.maxRecords ?? DEFAULT_MAX_TOKEN_RECORDS;
    this._now = config?.now ?? (() => Date.now());
  }

  /** Number of recorded token entries. */
  get recordCount(): number {
    return this._records.length;
  }

  /** Record a token usage entry. */
  record(input: TokenRecordInput): TokenRecord {
    const record: TokenRecord = {
      id: generateTokenRecordId(),
      operationType: input.operationType,
      operationId: input.operationId,
      promptTokens: input.promptTokens,
      completionTokens: input.completionTokens,
      totalTokens: input.totalTokens,
      durationMs: input.durationMs,
      success: input.success ?? true,
      timestamp: this._now(),
      costUsd: input.costUsd,
    };

    this._records.push(record);

    if (this._records.length > this._maxRecords) {
      this._records.splice(0, this._records.length - this._maxRecords);
    }

    return record;
  }

  /** Get all recorded entries. */
  getRecords(): readonly TokenRecord[] {
    return [...this._records];
  }

  /** Get records by operation type. */
  getRecordsByType(operationType: string): readonly TokenRecord[] {
    return this._records.filter((r) => r.operationType === operationType);
  }

  /** Get records by operation ID. */
  getRecordsByOperationId(operationId: string): readonly TokenRecord[] {
    return this._records.filter((r) => r.operationId === operationId);
  }

  /** Generate a full token efficiency report. */
  getReport(): TokenEfficiencyReport {
    return computeTokenEfficiencyReport(this._records);
  }

  /** Clear all recorded entries. */
  reset(): void {
    this._records.length = 0;
  }
}

// ---------------------------------------------------------------------------
// Report computation
// ---------------------------------------------------------------------------

export function computeTokenEfficiencyReport(
  records: readonly TokenRecord[],
): TokenEfficiencyReport {
  if (records.length === 0) {
    return {
      operationCount: 0,
      totalTokens: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      promptToCompletionRatio: 0,
      avgTokensPerOperation: 0,
      avgTokensPerSecond: 0,
      avgPromptTokensPerOp: 0,
      avgCompletionTokensPerOp: 0,
      totalDurationMs: 0,
      avgDurationMs: 0,
      totalCostUsd: 0,
      avgCostPerOperation: 0,
      costPer1kTokens: 0,
      successCount: 0,
      failureCount: 0,
      wastedTokens: 0,
      wasteRatio: 0,
      byOperationType: new Map(),
    };
  }

  let totalTokens = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalDurationMs = 0;
  let totalCostUsd = 0;
  let successCount = 0;
  let failureCount = 0;
  let wastedTokens = 0;

  const typeGroups = new Map<string, TokenRecord[]>();

  for (const r of records) {
    totalTokens += r.totalTokens;
    totalPromptTokens += r.promptTokens;
    totalCompletionTokens += r.completionTokens;
    totalDurationMs += r.durationMs;
    totalCostUsd += r.costUsd ?? 0;

    if (r.success) {
      successCount++;
    } else {
      failureCount++;
      wastedTokens += r.totalTokens;
    }

    let group = typeGroups.get(r.operationType);
    if (!group) {
      group = [];
      typeGroups.set(r.operationType, group);
    }
    group.push(r);
  }

  const byOperationType = new Map<string, TokenTypeBreakdown>();
  for (const [opType, group] of typeGroups) {
    let grpTokens = 0;
    let grpDuration = 0;
    let grpCost = 0;
    for (const r of group) {
      grpTokens += r.totalTokens;
      grpDuration += r.durationMs;
      grpCost += r.costUsd ?? 0;
    }
    byOperationType.set(opType, {
      operationType: opType,
      count: group.length,
      totalTokens: grpTokens,
      avgTokensPerOp: grpTokens / group.length,
      totalDurationMs: grpDuration,
      avgTokensPerSecond: grpDuration > 0 ? (grpTokens / grpDuration) * 1000 : 0,
      totalCostUsd: grpCost,
    });
  }

  const avgDurationMs = totalDurationMs / records.length;

  return {
    operationCount: records.length,
    totalTokens,
    totalPromptTokens,
    totalCompletionTokens,
    promptToCompletionRatio: totalCompletionTokens > 0 ? totalPromptTokens / totalCompletionTokens : 0,
    avgTokensPerOperation: totalTokens / records.length,
    avgTokensPerSecond: totalDurationMs > 0 ? (totalTokens / totalDurationMs) * 1000 : 0,
    avgPromptTokensPerOp: totalPromptTokens / records.length,
    avgCompletionTokensPerOp: totalCompletionTokens / records.length,
    totalDurationMs,
    avgDurationMs,
    totalCostUsd,
    avgCostPerOperation: totalCostUsd / records.length,
    costPer1kTokens: totalTokens > 0 ? (totalCostUsd / totalTokens) * 1000 : 0,
    successCount,
    failureCount,
    wastedTokens,
    wasteRatio: totalTokens > 0 ? wastedTokens / totalTokens : 0,
    byOperationType,
  };
}
