/**
 * Tests for the PerformanceMetricsTracker module.
 *
 * Covers: PerformanceMetricsTracker, ApiCallTimer, ApiCallCategory,
 * recording, querying, aggregation, reports, rates, eviction, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  ApiCallCategory,
  ApiCallTimer,
  computeApiCallSummary,
  DEFAULT_MAX_RECORDS,
  PerformanceMetricsTracker,
  resetApiCallIdCounter,
} from '../../../src/metrics/index.js';

import type {
  ApiCallInput,
  ApiCallRecord,
  ApiCallSummary,
  CallRate,
  EndpointBreakdown,
  PerformanceMetricsReport,
  PerformanceMetricsTrackerConfig,
} from '../../../src/metrics/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let clock = 1000;

function fakeClock(): number {
  return clock;
}

function advanceClock(ms: number): void {
  clock += ms;
}

function makeApiCallInput(overrides?: Partial<ApiCallInput>): ApiCallInput {
  return {
    category: ApiCallCategory.LLM,
    endpoint: 'gpt-4o',
    durationMs: 500,
    ...overrides,
  };
}

function createTracker(
  overrides?: Partial<PerformanceMetricsTrackerConfig>,
): PerformanceMetricsTracker {
  return new PerformanceMetricsTracker({
    now: fakeClock,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// ApiCallCategory
// ---------------------------------------------------------------------------

describe('ApiCallCategory', () => {
  it('has the expected values', () => {
    expect(ApiCallCategory.LLM).toBe('llm');
    expect(ApiCallCategory.TOOL).toBe('tool');
    expect(ApiCallCategory.HTTP).toBe('http');
    expect(ApiCallCategory.CUSTOM).toBe('custom');
  });
});

// ---------------------------------------------------------------------------
// computeApiCallSummary
// ---------------------------------------------------------------------------

describe('computeApiCallSummary', () => {
  it('returns zeros for empty array', () => {
    const summary = computeApiCallSummary([]);
    expect(summary.totalCalls).toBe(0);
    expect(summary.successCount).toBe(0);
    expect(summary.failureCount).toBe(0);
    expect(summary.successRate).toBe(0);
    expect(summary.totalDurationMs).toBe(0);
    expect(summary.avgDurationMs).toBe(0);
    expect(summary.totalTokens).toBe(0);
    expect(summary.tokensPerSecond).toBe(0);
  });

  it('computes correct statistics for a set of records', () => {
    const records: ApiCallRecord[] = [
      {
        id: 'r1',
        category: ApiCallCategory.LLM,
        endpoint: 'gpt-4o',
        durationMs: 100,
        success: true,
        timestamp: 1000,
        tokenUsage: { promptTokens: 50, completionTokens: 30, totalTokens: 80 },
      },
      {
        id: 'r2',
        category: ApiCallCategory.LLM,
        endpoint: 'gpt-4o',
        durationMs: 300,
        success: true,
        timestamp: 2000,
        tokenUsage: { promptTokens: 100, completionTokens: 70, totalTokens: 170 },
      },
      {
        id: 'r3',
        category: ApiCallCategory.LLM,
        endpoint: 'gpt-4o',
        durationMs: 200,
        success: false,
        timestamp: 3000,
        errorMessage: 'rate limited',
      },
    ];

    const summary = computeApiCallSummary(records);
    expect(summary.totalCalls).toBe(3);
    expect(summary.successCount).toBe(2);
    expect(summary.failureCount).toBe(1);
    expect(summary.successRate).toBeCloseTo(2 / 3);
    expect(summary.totalDurationMs).toBe(600);
    expect(summary.avgDurationMs).toBe(200);
    expect(summary.minDurationMs).toBe(100);
    expect(summary.maxDurationMs).toBe(300);
    expect(summary.totalPromptTokens).toBe(150);
    expect(summary.totalCompletionTokens).toBe(100);
    expect(summary.totalTokens).toBe(250);
    expect(summary.avgTokensPerCall).toBeCloseTo(250 / 3);
    expect(summary.tokensPerSecond).toBeCloseTo((250 / 600) * 1000);
  });

  it('handles records without token usage', () => {
    const records: ApiCallRecord[] = [
      {
        id: 'r1',
        category: ApiCallCategory.TOOL,
        endpoint: 'search',
        durationMs: 100,
        success: true,
        timestamp: 1000,
      },
    ];
    const summary = computeApiCallSummary(records);
    expect(summary.totalTokens).toBe(0);
    expect(summary.tokensPerSecond).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// PerformanceMetricsTracker — Construction
// ---------------------------------------------------------------------------

describe('PerformanceMetricsTracker', () => {
  beforeEach(() => {
    clock = 1000;
    resetApiCallIdCounter();
  });

  describe('construction', () => {
    it('creates a tracker with default config', () => {
      const tracker = new PerformanceMetricsTracker();
      expect(tracker.recordCount).toBe(0);
    });

    it('creates a tracker with custom config', () => {
      const tracker = createTracker({ maxRecords: 100 });
      expect(tracker.recordCount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Recording
  // -------------------------------------------------------------------------

  describe('recordApiCall', () => {
    it('records a basic API call and generates an ID', () => {
      const tracker = createTracker();
      const record = tracker.recordApiCall(makeApiCallInput());

      expect(record.id).toBe('api-1');
      expect(record.category).toBe(ApiCallCategory.LLM);
      expect(record.endpoint).toBe('gpt-4o');
      expect(record.durationMs).toBe(500);
      expect(record.success).toBe(true);
      expect(record.timestamp).toBe(1000);
      expect(tracker.recordCount).toBe(1);
    });

    it('defaults success to true when not specified', () => {
      const tracker = createTracker();
      const record = tracker.recordApiCall(makeApiCallInput());
      expect(record.success).toBe(true);
    });

    it('records a failed API call', () => {
      const tracker = createTracker();
      const record = tracker.recordApiCall(
        makeApiCallInput({
          success: false,
          errorMessage: 'timeout',
          statusCode: 504,
        }),
      );

      expect(record.success).toBe(false);
      expect(record.errorMessage).toBe('timeout');
      expect(record.statusCode).toBe(504);
    });

    it('records token usage', () => {
      const tracker = createTracker();
      const record = tracker.recordApiCall(
        makeApiCallInput({
          tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        }),
      );

      expect(record.tokenUsage).toEqual({
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      });
    });

    it('records metadata', () => {
      const tracker = createTracker();
      const record = tracker.recordApiCall(
        makeApiCallInput({
          metadata: { model: 'gpt-4o', temperature: 0.7 },
        }),
      );

      expect(record.metadata).toEqual({ model: 'gpt-4o', temperature: 0.7 });
    });

    it('generates sequential IDs', () => {
      const tracker = createTracker();
      const r1 = tracker.recordApiCall(makeApiCallInput());
      const r2 = tracker.recordApiCall(makeApiCallInput());
      const r3 = tracker.recordApiCall(makeApiCallInput());

      expect(r1.id).toBe('api-1');
      expect(r2.id).toBe('api-2');
      expect(r3.id).toBe('api-3');
    });

    it('uses clock for timestamps', () => {
      const tracker = createTracker();
      const r1 = tracker.recordApiCall(makeApiCallInput());
      advanceClock(500);
      const r2 = tracker.recordApiCall(makeApiCallInput());

      expect(r1.timestamp).toBe(1000);
      expect(r2.timestamp).toBe(1500);
    });
  });

  // -------------------------------------------------------------------------
  // Eviction
  // -------------------------------------------------------------------------

  describe('eviction', () => {
    it('evicts oldest records when maxRecords is exceeded', () => {
      const tracker = createTracker({ maxRecords: 3 });

      tracker.recordApiCall(makeApiCallInput({ endpoint: 'ep-1' }));
      tracker.recordApiCall(makeApiCallInput({ endpoint: 'ep-2' }));
      tracker.recordApiCall(makeApiCallInput({ endpoint: 'ep-3' }));
      tracker.recordApiCall(makeApiCallInput({ endpoint: 'ep-4' }));

      expect(tracker.recordCount).toBe(3);
      const records = tracker.getRecords();
      expect(records[0]!.endpoint).toBe('ep-2');
      expect(records[2]!.endpoint).toBe('ep-4');
    });

    it('DEFAULT_MAX_RECORDS is 10_000', () => {
      expect(DEFAULT_MAX_RECORDS).toBe(10_000);
    });
  });

  // -------------------------------------------------------------------------
  // Timer API
  // -------------------------------------------------------------------------

  describe('startTimer / ApiCallTimer', () => {
    it('creates a timer and records on stop', () => {
      const tracker = createTracker();
      const timer = tracker.startTimer(ApiCallCategory.LLM, 'gpt-4o');

      expect(timer.stopped).toBe(false);
      expect(timer.startTime).toBe(1000);

      advanceClock(200);
      const record = timer.stop();

      expect(timer.stopped).toBe(true);
      expect(record.category).toBe(ApiCallCategory.LLM);
      expect(record.endpoint).toBe('gpt-4o');
      expect(record.durationMs).toBe(200);
      expect(record.success).toBe(true);
      expect(tracker.recordCount).toBe(1);
    });

    it('records token usage on stop', () => {
      const tracker = createTracker();
      const timer = tracker.startTimer(ApiCallCategory.LLM, 'claude-3');
      advanceClock(300);

      const record = timer.stop({
        tokenUsage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 },
      });

      expect(record.tokenUsage).toEqual({
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300,
      });
    });

    it('records failure on stop', () => {
      const tracker = createTracker();
      const timer = tracker.startTimer(ApiCallCategory.HTTP, 'api.example.com');
      advanceClock(1000);

      const record = timer.stop({
        success: false,
        errorMessage: 'connection refused',
        statusCode: 503,
      });

      expect(record.success).toBe(false);
      expect(record.errorMessage).toBe('connection refused');
      expect(record.statusCode).toBe(503);
    });

    it('merges metadata from start and stop', () => {
      const tracker = createTracker();
      const timer = tracker.startTimer(ApiCallCategory.LLM, 'gpt-4o', {
        requestId: 'req-1',
      });
      advanceClock(100);

      const record = timer.stop({
        metadata: { responseSize: 1024 },
      });

      expect(record.metadata).toEqual({
        requestId: 'req-1',
        responseSize: 1024,
      });
    });

    it('throws when stopping a timer twice', () => {
      const tracker = createTracker();
      const timer = tracker.startTimer(ApiCallCategory.LLM, 'gpt-4o');
      advanceClock(50);
      timer.stop();

      expect(() => timer.stop()).toThrow('ApiCallTimer has already been stopped');
    });
  });

  // -------------------------------------------------------------------------
  // timeApiCall
  // -------------------------------------------------------------------------

  describe('timeApiCall', () => {
    it('times a successful async operation', async () => {
      const tracker = createTracker();

      const result = await tracker.timeApiCall(ApiCallCategory.TOOL, 'web-search', async () => {
        advanceClock(150);
        return 'search results';
      });

      expect(result).toBe('search results');
      expect(tracker.recordCount).toBe(1);
      const records = tracker.getRecords();
      expect(records[0]!.durationMs).toBe(150);
      expect(records[0]!.success).toBe(true);
    });

    it('records failures and re-throws', async () => {
      const tracker = createTracker();

      await expect(
        tracker.timeApiCall(ApiCallCategory.LLM, 'gpt-4o', async () => {
          advanceClock(50);
          throw new Error('rate limit exceeded');
        }),
      ).rejects.toThrow('rate limit exceeded');

      expect(tracker.recordCount).toBe(1);
      const records = tracker.getRecords();
      expect(records[0]!.success).toBe(false);
      expect(records[0]!.errorMessage).toBe('rate limit exceeded');
    });

    it('times a synchronous operation', async () => {
      const tracker = createTracker();

      const result = await tracker.timeApiCall(ApiCallCategory.CUSTOM, 'cache-lookup', () => {
        advanceClock(10);
        return 42;
      });

      expect(result).toBe(42);
      expect(tracker.recordCount).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Query methods
  // -------------------------------------------------------------------------

  describe('query methods', () => {
    let tracker: PerformanceMetricsTracker;

    beforeEach(() => {
      tracker = createTracker();
      tracker.recordApiCall(
        makeApiCallInput({ category: ApiCallCategory.LLM, endpoint: 'gpt-4o' }),
      );
      advanceClock(100);
      tracker.recordApiCall(
        makeApiCallInput({ category: ApiCallCategory.TOOL, endpoint: 'web-search' }),
      );
      advanceClock(100);
      tracker.recordApiCall(
        makeApiCallInput({ category: ApiCallCategory.LLM, endpoint: 'claude-3' }),
      );
      advanceClock(100);
      tracker.recordApiCall(
        makeApiCallInput({ category: ApiCallCategory.LLM, endpoint: 'gpt-4o' }),
      );
    });

    it('getRecords returns all records', () => {
      expect(tracker.getRecords()).toHaveLength(4);
    });

    it('getRecords returns a shallow copy', () => {
      const records = tracker.getRecords();
      expect(records).not.toBe(tracker.getRecords());
    });

    it('getRecordsByCategory filters correctly', () => {
      const llmRecords = tracker.getRecordsByCategory(ApiCallCategory.LLM);
      expect(llmRecords).toHaveLength(3);
      for (const r of llmRecords) {
        expect(r.category).toBe(ApiCallCategory.LLM);
      }

      const toolRecords = tracker.getRecordsByCategory(ApiCallCategory.TOOL);
      expect(toolRecords).toHaveLength(1);
    });

    it('getRecordsByEndpoint filters correctly', () => {
      const gptRecords = tracker.getRecordsByEndpoint('gpt-4o');
      expect(gptRecords).toHaveLength(2);

      const claudeRecords = tracker.getRecordsByEndpoint('claude-3');
      expect(claudeRecords).toHaveLength(1);

      const nonExistent = tracker.getRecordsByEndpoint('non-existent');
      expect(nonExistent).toHaveLength(0);
    });

    it('getRecordsSince filters by timestamp', () => {
      const since1150 = tracker.getRecordsSince(1150);
      expect(since1150).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Aggregation
  // -------------------------------------------------------------------------

  describe('aggregation', () => {
    it('getSummary returns aggregate statistics', () => {
      const tracker = createTracker();
      tracker.recordApiCall(makeApiCallInput({ durationMs: 100 }));
      tracker.recordApiCall(makeApiCallInput({ durationMs: 300 }));
      tracker.recordApiCall(makeApiCallInput({ durationMs: 200, success: false }));

      const summary = tracker.getSummary();
      expect(summary.totalCalls).toBe(3);
      expect(summary.totalDurationMs).toBe(600);
      expect(summary.avgDurationMs).toBe(200);
      expect(summary.successCount).toBe(2);
      expect(summary.failureCount).toBe(1);
    });

    it('getCategorySummary returns category-specific stats', () => {
      const tracker = createTracker();
      tracker.recordApiCall(makeApiCallInput({ category: ApiCallCategory.LLM, durationMs: 200 }));
      tracker.recordApiCall(makeApiCallInput({ category: ApiCallCategory.TOOL, durationMs: 50 }));
      tracker.recordApiCall(makeApiCallInput({ category: ApiCallCategory.LLM, durationMs: 400 }));

      const llmSummary = tracker.getCategorySummary(ApiCallCategory.LLM);
      expect(llmSummary.totalCalls).toBe(2);
      expect(llmSummary.totalDurationMs).toBe(600);

      const toolSummary = tracker.getCategorySummary(ApiCallCategory.TOOL);
      expect(toolSummary.totalCalls).toBe(1);
      expect(toolSummary.totalDurationMs).toBe(50);
    });

    it('getEndpointSummary returns endpoint-specific stats', () => {
      const tracker = createTracker();
      tracker.recordApiCall(makeApiCallInput({ endpoint: 'gpt-4o', durationMs: 100 }));
      tracker.recordApiCall(makeApiCallInput({ endpoint: 'gpt-4o', durationMs: 200 }));
      tracker.recordApiCall(makeApiCallInput({ endpoint: 'claude', durationMs: 300 }));

      const gptSummary = tracker.getEndpointSummary('gpt-4o');
      expect(gptSummary.totalCalls).toBe(2);
      expect(gptSummary.avgDurationMs).toBe(150);
    });
  });

  // -------------------------------------------------------------------------
  // Call rates
  // -------------------------------------------------------------------------

  describe('getCallRate', () => {
    it('calculates rate within a time window', () => {
      const tracker = createTracker();

      // Record 5 calls over 500ms
      for (let i = 0; i < 5; i++) {
        tracker.recordApiCall(makeApiCallInput());
        advanceClock(100);
      }

      // Window of 1000ms from current time (1500) back to 500
      const rate = tracker.getCallRate(1000);
      expect(rate.windowMs).toBe(1000);
      expect(rate.callCount).toBe(5);
      expect(rate.callsPerSecond).toBe(5);
      expect(rate.callsPerMinute).toBe(300);
    });

    it('returns zeros for empty tracker', () => {
      const tracker = createTracker();
      const rate = tracker.getCallRate();
      expect(rate.callCount).toBe(0);
      expect(rate.callsPerSecond).toBe(0);
      expect(rate.callsPerMinute).toBe(0);
    });

    it('filters to recent calls only', () => {
      const tracker = createTracker();

      // Old calls at t=1000
      tracker.recordApiCall(makeApiCallInput());
      tracker.recordApiCall(makeApiCallInput());

      // Advance past the window
      advanceClock(120_000); // 2 minutes later

      // Recent calls at t=121000
      tracker.recordApiCall(makeApiCallInput());

      // 60-second window should only include the recent one
      const rate = tracker.getCallRate(60_000);
      expect(rate.callCount).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Full report
  // -------------------------------------------------------------------------

  describe('getReport', () => {
    it('generates a full report with all breakdowns', () => {
      const tracker = createTracker();

      tracker.recordApiCall(
        makeApiCallInput({
          category: ApiCallCategory.LLM,
          endpoint: 'gpt-4o',
          durationMs: 200,
          tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        }),
      );
      advanceClock(1000);

      tracker.recordApiCall(
        makeApiCallInput({
          category: ApiCallCategory.TOOL,
          endpoint: 'web-search',
          durationMs: 100,
        }),
      );
      advanceClock(1000);

      tracker.recordApiCall(
        makeApiCallInput({
          category: ApiCallCategory.LLM,
          endpoint: 'claude-3',
          durationMs: 300,
          tokenUsage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 },
        }),
      );

      const report = tracker.getReport();

      // Totals
      expect(report.totals.totalCalls).toBe(3);
      expect(report.totals.totalDurationMs).toBe(600);
      expect(report.totals.totalTokens).toBe(450);

      // By category
      expect(report.byCategory.size).toBe(2);
      expect(report.byCategory.get(ApiCallCategory.LLM)!.totalCalls).toBe(2);
      expect(report.byCategory.get(ApiCallCategory.TOOL)!.totalCalls).toBe(1);

      // By endpoint
      expect(report.byEndpoint.size).toBe(3);
      expect(report.byEndpoint.get('gpt-4o')!.summary.totalCalls).toBe(1);
      expect(report.byEndpoint.get('gpt-4o')!.category).toBe(ApiCallCategory.LLM);
      expect(report.byEndpoint.get('web-search')!.category).toBe(ApiCallCategory.TOOL);

      // Time range
      expect(report.startTime).toBe(1000);
      expect(report.endTime).toBe(3000);

      // Rates
      expect(report.overallRate.callCount).toBe(3);
      expect(report.overallRate.windowMs).toBe(2000);

      // Generated at
      expect(report.generatedAt).toBeTruthy();
    });

    it('generates an empty report for no records', () => {
      const tracker = createTracker();
      const report = tracker.getReport();

      expect(report.totals.totalCalls).toBe(0);
      expect(report.byCategory.size).toBe(0);
      expect(report.byEndpoint.size).toBe(0);
      expect(report.startTime).toBeUndefined();
      expect(report.endTime).toBeUndefined();
      expect(report.overallRate.callCount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  describe('reset', () => {
    it('clears all records', () => {
      const tracker = createTracker();
      tracker.recordApiCall(makeApiCallInput());
      tracker.recordApiCall(makeApiCallInput());
      expect(tracker.recordCount).toBe(2);

      tracker.reset();
      expect(tracker.recordCount).toBe(0);
      expect(tracker.getRecords()).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles single record correctly', () => {
      const tracker = createTracker();
      tracker.recordApiCall(makeApiCallInput({ durationMs: 42 }));

      const summary = tracker.getSummary();
      expect(summary.totalCalls).toBe(1);
      expect(summary.avgDurationMs).toBe(42);
      expect(summary.minDurationMs).toBe(42);
      expect(summary.maxDurationMs).toBe(42);
      expect(summary.p50DurationMs).toBe(42);
      expect(summary.p95DurationMs).toBe(42);
    });

    it('handles all categories', () => {
      const tracker = createTracker();

      for (const category of [
        ApiCallCategory.LLM,
        ApiCallCategory.TOOL,
        ApiCallCategory.HTTP,
        ApiCallCategory.CUSTOM,
      ]) {
        tracker.recordApiCall(makeApiCallInput({ category }));
      }

      const report = tracker.getReport();
      expect(report.byCategory.size).toBe(4);
    });

    it('percentile calculations are correct for 5 values', () => {
      const tracker = createTracker();
      const durations = [10, 20, 30, 40, 50];
      for (const d of durations) {
        tracker.recordApiCall(makeApiCallInput({ durationMs: d }));
      }

      const summary = tracker.getSummary();
      expect(summary.minDurationMs).toBe(10);
      expect(summary.maxDurationMs).toBe(50);
      expect(summary.p50DurationMs).toBe(30);
    });

    it('token usage is isolated (deep copy)', () => {
      const tracker = createTracker();
      const usage = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };
      const record = tracker.recordApiCall(makeApiCallInput({ tokenUsage: usage }));

      // Mutating the input should not affect the record
      (usage as { promptTokens: number }).promptTokens = 999;
      expect(record.tokenUsage!.promptTokens).toBe(100);
    });

    it('handles zero-duration calls', () => {
      const tracker = createTracker();
      tracker.recordApiCall(makeApiCallInput({ durationMs: 0 }));

      const summary = tracker.getSummary();
      expect(summary.totalDurationMs).toBe(0);
      expect(summary.avgDurationMs).toBe(0);
    });

    it('handles non-Error throws in timeApiCall', async () => {
      const tracker = createTracker();

      await expect(
        tracker.timeApiCall(ApiCallCategory.LLM, 'test', async () => {
          advanceClock(10);
          throw 'string error'; // eslint-disable-line no-throw-literal
        }),
      ).rejects.toBe('string error');

      const records = tracker.getRecords();
      expect(records[0]!.errorMessage).toBe('string error');
      expect(records[0]!.success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Integration-style tests
  // -------------------------------------------------------------------------

  describe('integration: mixed workload', () => {
    it('tracks a realistic LLM + tool workflow', () => {
      const tracker = createTracker();

      // Simulate: LLM call -> tool call -> LLM call
      tracker.recordApiCall({
        category: ApiCallCategory.LLM,
        endpoint: 'gpt-4o',
        durationMs: 1200,
        tokenUsage: { promptTokens: 500, completionTokens: 200, totalTokens: 700 },
      });
      advanceClock(1200);

      tracker.recordApiCall({
        category: ApiCallCategory.TOOL,
        endpoint: 'web-search',
        durationMs: 350,
      });
      advanceClock(350);

      tracker.recordApiCall({
        category: ApiCallCategory.LLM,
        endpoint: 'gpt-4o',
        durationMs: 800,
        tokenUsage: { promptTokens: 900, completionTokens: 300, totalTokens: 1200 },
      });
      advanceClock(800);

      // Verify totals
      const summary = tracker.getSummary();
      expect(summary.totalCalls).toBe(3);
      expect(summary.totalTokens).toBe(1900);
      expect(summary.totalPromptTokens).toBe(1400);
      expect(summary.totalCompletionTokens).toBe(500);

      // Verify per-category
      const llmSummary = tracker.getCategorySummary(ApiCallCategory.LLM);
      expect(llmSummary.totalCalls).toBe(2);
      expect(llmSummary.totalTokens).toBe(1900);

      const toolSummary = tracker.getCategorySummary(ApiCallCategory.TOOL);
      expect(toolSummary.totalCalls).toBe(1);
      expect(toolSummary.totalTokens).toBe(0);

      // Verify per-endpoint
      const gptSummary = tracker.getEndpointSummary('gpt-4o');
      expect(gptSummary.totalCalls).toBe(2);
      expect(gptSummary.avgDurationMs).toBe(1000);
    });

    it('tracks errors across categories', () => {
      const tracker = createTracker();

      tracker.recordApiCall({
        category: ApiCallCategory.LLM,
        endpoint: 'gpt-4o',
        durationMs: 100,
        success: false,
        errorMessage: 'rate limited',
        statusCode: 429,
      });

      tracker.recordApiCall({
        category: ApiCallCategory.HTTP,
        endpoint: 'api.example.com/data',
        durationMs: 5000,
        success: false,
        errorMessage: 'timeout',
        statusCode: 504,
      });

      tracker.recordApiCall({
        category: ApiCallCategory.LLM,
        endpoint: 'gpt-4o',
        durationMs: 200,
        success: true,
        tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      });

      const summary = tracker.getSummary();
      expect(summary.successCount).toBe(1);
      expect(summary.failureCount).toBe(2);
      expect(summary.successRate).toBeCloseTo(1 / 3);
    });
  });
});
