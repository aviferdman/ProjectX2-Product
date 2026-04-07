/**
 * Token usage tracking and cost calculation for LLM providers.
 *
 * Provides a {@link TokenUsageTracker} that accumulates per-request usage
 * records and calculates costs using {@link ModelCatalog} pricing data.
 *
 * Use {@link UsageTrackingProvider} to wrap any {@link LLMProvider} and
 * automatically record token usage for every request.
 *
 * @packageDocumentation
 */

import type { TokenUsage } from '../types/llm.js';
import { ModelCatalog } from './model-catalog.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single recorded LLM request with token usage and cost metadata.
 */
export interface UsageRecord {
  /** Unique identifier for this record. */
  readonly id: string;
  /** Model used for this request. */
  readonly modelId: string;
  /** Provider name (e.g. "openai", "anthropic"). */
  readonly provider: string;
  /** Token counts from the response. */
  readonly tokenUsage: TokenUsage;
  /** Estimated cost in USD, or `undefined` if pricing data is unavailable. */
  readonly costUsd: number | undefined;
  /** When the request completed. */
  readonly timestamp: Date;
  /** Request duration in milliseconds, if measured. */
  readonly durationMs?: number | undefined;
  /** Whether the request used streaming. */
  readonly streaming: boolean;
}

/**
 * Input for recording a usage event. The tracker fills in `id`, `timestamp`,
 * and `costUsd` automatically.
 */
export interface UsageRecordInput {
  /** Model used for this request. */
  readonly modelId: string;
  /** Provider name. */
  readonly provider: string;
  /** Token counts from the response. */
  readonly tokenUsage: TokenUsage;
  /** Request duration in milliseconds (optional). */
  readonly durationMs?: number;
  /** Whether the request used streaming (default: false). */
  readonly streaming?: boolean;
}

/**
 * Aggregated token and cost totals for a group of requests.
 */
export interface UsageSummary {
  /** Number of requests in this group. */
  readonly requests: number;
  /** Total prompt (input) tokens. */
  readonly promptTokens: number;
  /** Total completion (output) tokens. */
  readonly completionTokens: number;
  /** Total tokens (prompt + completion). */
  readonly totalTokens: number;
  /** Total estimated cost in USD. */
  readonly totalCostUsd: number;
}

/**
 * Full usage report with per-model and per-provider breakdowns.
 */
export interface UsageReport {
  /** Overall totals across all requests. */
  readonly totals: UsageSummary;
  /** Breakdown by model ID. */
  readonly byModel: ReadonlyMap<string, UsageSummary>;
  /** Breakdown by provider name. */
  readonly byProvider: ReadonlyMap<string, UsageSummary>;
  /** Earliest request timestamp, or `undefined` if no records exist. */
  readonly startTime: Date | undefined;
  /** Latest request timestamp, or `undefined` if no records exist. */
  readonly endTime: Date | undefined;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _nextId = 0;

function generateRecordId(): string {
  return `usage-${String(Date.now())}-${String(++_nextId)}`;
}

function createEmptySummary(): UsageSummary {
  return {
    requests: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    totalCostUsd: 0,
  };
}

function addToSummary(summary: UsageSummary, record: UsageRecord): UsageSummary {
  return {
    requests: summary.requests + 1,
    promptTokens: summary.promptTokens + record.tokenUsage.promptTokens,
    completionTokens: summary.completionTokens + record.tokenUsage.completionTokens,
    totalTokens: summary.totalTokens + record.tokenUsage.totalTokens,
    totalCostUsd: summary.totalCostUsd + (record.costUsd ?? 0),
  };
}

// ---------------------------------------------------------------------------
// TokenUsageTracker
// ---------------------------------------------------------------------------

/**
 * Tracks token usage and calculates costs across multiple LLM requests.
 *
 * Records are stored in memory and can be queried or aggregated into
 * reports. Use {@link UsageTrackingProvider} for automatic recording.
 *
 * @example
 * ```typescript
 * import { TokenUsageTracker } from '@crewspace/core';
 *
 * const tracker = new TokenUsageTracker();
 *
 * tracker.record({
 *   modelId: 'gpt-4o',
 *   provider: 'openai',
 *   tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
 * });
 *
 * console.log(tracker.getTotalCost());   // 0.00075 USD
 * console.log(tracker.getTotalTokens()); // { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
 * ```
 */
export class TokenUsageTracker {
  private readonly _records: UsageRecord[] = [];

  /**
   * Record a single LLM request's token usage.
   *
   * The tracker automatically calculates cost using {@link ModelCatalog}
   * pricing data for known models.
   *
   * @param input - Usage data to record
   * @returns The created {@link UsageRecord} with generated ID, timestamp, and cost
   */
  record(input: UsageRecordInput): UsageRecord {
    const costUsd = TokenUsageTracker.calculateCost(input.modelId, input.tokenUsage);

    const record: UsageRecord = {
      id: generateRecordId(),
      modelId: input.modelId,
      provider: input.provider,
      tokenUsage: { ...input.tokenUsage },
      costUsd,
      timestamp: new Date(),
      durationMs: input.durationMs,
      streaming: input.streaming ?? false,
    };

    this._records.push(record);
    return record;
  }

  /**
   * Get all recorded usage records.
   *
   * @returns A shallow copy of the records array
   */
  getRecords(): readonly UsageRecord[] {
    return [...this._records];
  }

  /**
   * Get usage records filtered by model ID.
   *
   * @param modelId - The model identifier to filter by
   */
  getRecordsByModel(modelId: string): readonly UsageRecord[] {
    return this._records.filter((r) => r.modelId === modelId);
  }

  /**
   * Get usage records filtered by provider name.
   *
   * @param provider - The provider name to filter by
   */
  getRecordsByProvider(provider: string): readonly UsageRecord[] {
    return this._records.filter((r) => r.provider === provider);
  }

  /**
   * Get the total number of recorded requests.
   */
  get recordCount(): number {
    return this._records.length;
  }

  /**
   * Get aggregated token totals across all recorded requests.
   */
  getTotalTokens(): TokenUsage {
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;

    for (const record of this._records) {
      promptTokens += record.tokenUsage.promptTokens;
      completionTokens += record.tokenUsage.completionTokens;
      totalTokens += record.tokenUsage.totalTokens;
    }

    return { promptTokens, completionTokens, totalTokens };
  }

  /**
   * Get the total estimated cost in USD across all recorded requests.
   *
   * Records with unknown pricing (`costUsd === undefined`) contribute 0.
   */
  getTotalCost(): number {
    let total = 0;
    for (const record of this._records) {
      total += record.costUsd ?? 0;
    }
    return total;
  }

  /**
   * Generate a full usage report with per-model and per-provider breakdowns.
   */
  getReport(): UsageReport {
    const byModel = new Map<string, UsageSummary>();
    const byProvider = new Map<string, UsageSummary>();
    let totals = createEmptySummary();
    let startTime: Date | undefined;
    let endTime: Date | undefined;

    for (const record of this._records) {
      // Overall totals
      totals = addToSummary(totals, record);

      // Per-model
      const modelSummary = byModel.get(record.modelId) ?? createEmptySummary();
      byModel.set(record.modelId, addToSummary(modelSummary, record));

      // Per-provider
      const providerSummary = byProvider.get(record.provider) ?? createEmptySummary();
      byProvider.set(record.provider, addToSummary(providerSummary, record));

      // Time range
      if (!startTime || record.timestamp < startTime) {
        startTime = record.timestamp;
      }
      if (!endTime || record.timestamp > endTime) {
        endTime = record.timestamp;
      }
    }

    return { totals, byModel, byProvider, startTime, endTime };
  }

  /**
   * Clear all recorded usage data.
   */
  reset(): void {
    this._records.length = 0;
  }

  /**
   * Calculate the cost of a request using {@link ModelCatalog} pricing data.
   *
   * @param modelId - The model identifier
   * @param tokenUsage - Token counts from the response
   * @returns Cost in USD, or `undefined` if pricing data is unavailable
   */
  static calculateCost(modelId: string, tokenUsage: TokenUsage): number | undefined {
    return ModelCatalog.estimateCost(modelId, tokenUsage.promptTokens, tokenUsage.completionTokens);
  }
}
