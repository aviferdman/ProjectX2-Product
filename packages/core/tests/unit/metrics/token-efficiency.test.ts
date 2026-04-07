/**
 * Tests for the token efficiency tracking module.
 *
 * Covers: TokenEfficiencyTracker, computeTokenEfficiencyReport,
 * recording, querying, aggregation, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  computeTokenEfficiencyReport,
  DEFAULT_MAX_TOKEN_RECORDS,
  TokenEfficiencyTracker,
  _resetTokenRecordIdCounter,
} from '../../../src/metrics/index.js';

import type {
  TokenEfficiencyReport,
  TokenRecord,
  TokenRecordInput,
} from '../../../src/metrics/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTokenInput(overrides?: Partial<TokenRecordInput>): TokenRecordInput {
  return {
    operationType: overrides?.operationType ?? 'llm-call',
    operationId: overrides?.operationId,
    promptTokens: overrides?.promptTokens ?? 100,
    completionTokens: overrides?.completionTokens ?? 50,
    totalTokens: overrides?.totalTokens ?? 150,
    durationMs: overrides?.durationMs ?? 1000,
    success: overrides?.success,
    costUsd: overrides?.costUsd,
  };
}

// ---------------------------------------------------------------------------
// computeTokenEfficiencyReport (pure function)
// ---------------------------------------------------------------------------

describe('computeTokenEfficiencyReport', () => {
  it('should return zeros for empty input', () => {
    const report = computeTokenEfficiencyReport([]);

    expect(report.operationCount).toBe(0);
    expect(report.totalTokens).toBe(0);
    expect(report.avgTokensPerSecond).toBe(0);
    expect(report.wasteRatio).toBe(0);
    expect(report.byOperationType.size).toBe(0);
  });

  it('should compute correct totals for a single record', () => {
    const record: TokenRecord = {
      id: 'tok-1',
      operationType: 'task',
      promptTokens: 200,
      completionTokens: 80,
      totalTokens: 280,
      durationMs: 2000,
      success: true,
      timestamp: 1000,
    };

    const report = computeTokenEfficiencyReport([record]);

    expect(report.operationCount).toBe(1);
    expect(report.totalTokens).toBe(280);
    expect(report.totalPromptTokens).toBe(200);
    expect(report.totalCompletionTokens).toBe(80);
    expect(report.promptToCompletionRatio).toBe(200 / 80);
    expect(report.avgTokensPerOperation).toBe(280);
    expect(report.avgTokensPerSecond).toBe(140); // 280 / 2000 * 1000
    expect(report.avgDurationMs).toBe(2000);
    expect(report.successCount).toBe(1);
    expect(report.failureCount).toBe(0);
    expect(report.wastedTokens).toBe(0);
    expect(report.wasteRatio).toBe(0);
  });

  it('should compute waste ratio for failed operations', () => {
    const records: TokenRecord[] = [
      {
        id: 'tok-1',
        operationType: 'task',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        durationMs: 1000,
        success: true,
        timestamp: 1000,
      },
      {
        id: 'tok-2',
        operationType: 'task',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        durationMs: 1000,
        success: false,
        timestamp: 2000,
      },
    ];

    const report = computeTokenEfficiencyReport(records);

    expect(report.successCount).toBe(1);
    expect(report.failureCount).toBe(1);
    expect(report.wastedTokens).toBe(150);
    expect(report.wasteRatio).toBe(150 / 300);
  });

  it('should compute cost metrics', () => {
    const records: TokenRecord[] = [
      {
        id: 'tok-1',
        operationType: 'task',
        promptTokens: 500,
        completionTokens: 200,
        totalTokens: 700,
        durationMs: 1000,
        success: true,
        timestamp: 1000,
        costUsd: 0.007,
      },
      {
        id: 'tok-2',
        operationType: 'task',
        promptTokens: 300,
        completionTokens: 100,
        totalTokens: 400,
        durationMs: 800,
        success: true,
        timestamp: 2000,
        costUsd: 0.004,
      },
    ];

    const report = computeTokenEfficiencyReport(records);

    expect(report.totalCostUsd).toBeCloseTo(0.011, 5);
    expect(report.avgCostPerOperation).toBeCloseTo(0.0055, 5);
    expect(report.costPer1kTokens).toBeCloseTo((0.011 / 1100) * 1000, 5);
  });

  it('should group by operation type', () => {
    const records: TokenRecord[] = [
      {
        id: 'tok-1',
        operationType: 'llm-call',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        durationMs: 1000,
        success: true,
        timestamp: 1000,
      },
      {
        id: 'tok-2',
        operationType: 'tool-call',
        promptTokens: 50,
        completionTokens: 25,
        totalTokens: 75,
        durationMs: 500,
        success: true,
        timestamp: 2000,
      },
      {
        id: 'tok-3',
        operationType: 'llm-call',
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300,
        durationMs: 2000,
        success: true,
        timestamp: 3000,
      },
    ];

    const report = computeTokenEfficiencyReport(records);

    expect(report.byOperationType.size).toBe(2);

    const llmBreakdown = report.byOperationType.get('llm-call')!;
    expect(llmBreakdown.count).toBe(2);
    expect(llmBreakdown.totalTokens).toBe(450);
    expect(llmBreakdown.avgTokensPerOp).toBe(225);

    const toolBreakdown = report.byOperationType.get('tool-call')!;
    expect(toolBreakdown.count).toBe(1);
    expect(toolBreakdown.totalTokens).toBe(75);
  });
});

// ---------------------------------------------------------------------------
// TokenEfficiencyTracker
// ---------------------------------------------------------------------------

describe('TokenEfficiencyTracker', () => {
  let tracker: TokenEfficiencyTracker;

  beforeEach(() => {
    _resetTokenRecordIdCounter();
    tracker = new TokenEfficiencyTracker({ now: () => 1000 });
  });

  // -----------------------------------------------------------------------
  // Construction
  // -----------------------------------------------------------------------

  describe('constructor', () => {
    it('should create with default config', () => {
      const t = new TokenEfficiencyTracker();
      expect(t.recordCount).toBe(0);
    });

    it('should accept custom config', () => {
      const t = new TokenEfficiencyTracker({ maxRecords: 100, now: () => 42 });
      expect(t.recordCount).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Recording
  // -----------------------------------------------------------------------

  describe('record', () => {
    it('should record a token entry and return it with an id', () => {
      const record = tracker.record(makeTokenInput());

      expect(record.id).toBe('tok-1');
      expect(record.operationType).toBe('llm-call');
      expect(record.promptTokens).toBe(100);
      expect(record.completionTokens).toBe(50);
      expect(record.totalTokens).toBe(150);
      expect(record.durationMs).toBe(1000);
      expect(record.success).toBe(true);
      expect(record.timestamp).toBe(1000);
    });

    it('should generate sequential ids', () => {
      const r1 = tracker.record(makeTokenInput());
      const r2 = tracker.record(makeTokenInput());

      expect(r1.id).toBe('tok-1');
      expect(r2.id).toBe('tok-2');
    });

    it('should default success to true', () => {
      const record = tracker.record(makeTokenInput({ success: undefined }));
      expect(record.success).toBe(true);
    });

    it('should record failure when success is false', () => {
      const record = tracker.record(makeTokenInput({ success: false }));
      expect(record.success).toBe(false);
    });

    it('should store costUsd', () => {
      const record = tracker.record(makeTokenInput({ costUsd: 0.005 }));
      expect(record.costUsd).toBe(0.005);
    });

    it('should increment recordCount', () => {
      tracker.record(makeTokenInput());
      tracker.record(makeTokenInput());

      expect(tracker.recordCount).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // Querying
  // -----------------------------------------------------------------------

  describe('getRecords', () => {
    it('should return all recorded entries', () => {
      tracker.record(makeTokenInput({ operationType: 'a' }));
      tracker.record(makeTokenInput({ operationType: 'b' }));

      const records = tracker.getRecords();
      expect(records).toHaveLength(2);
    });

    it('should return a shallow copy', () => {
      tracker.record(makeTokenInput());
      const r1 = tracker.getRecords();
      const r2 = tracker.getRecords();
      expect(r1).not.toBe(r2);
    });
  });

  describe('getRecordsByType', () => {
    it('should filter by operation type', () => {
      tracker.record(makeTokenInput({ operationType: 'llm-call' }));
      tracker.record(makeTokenInput({ operationType: 'tool-call' }));
      tracker.record(makeTokenInput({ operationType: 'llm-call' }));

      const llm = tracker.getRecordsByType('llm-call');
      expect(llm).toHaveLength(2);
      expect(llm.every((r) => r.operationType === 'llm-call')).toBe(true);
    });

    it('should return empty array for unknown type', () => {
      expect(tracker.getRecordsByType('unknown')).toHaveLength(0);
    });
  });

  describe('getRecordsByOperationId', () => {
    it('should filter by operation ID', () => {
      tracker.record(makeTokenInput({ operationId: 'task-1' }));
      tracker.record(makeTokenInput({ operationId: 'task-2' }));
      tracker.record(makeTokenInput({ operationId: 'task-1' }));

      const matches = tracker.getRecordsByOperationId('task-1');
      expect(matches).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // Eviction
  // -----------------------------------------------------------------------

  describe('eviction', () => {
    it('should evict oldest records when maxRecords is exceeded', () => {
      const small = new TokenEfficiencyTracker({ maxRecords: 3, now: () => 1000 });

      small.record(makeTokenInput({ operationType: 'a' }));
      small.record(makeTokenInput({ operationType: 'b' }));
      small.record(makeTokenInput({ operationType: 'c' }));
      small.record(makeTokenInput({ operationType: 'd' }));

      expect(small.recordCount).toBe(3);
      const types = small.getRecords().map((r) => r.operationType);
      expect(types).toEqual(['b', 'c', 'd']);
    });
  });

  // -----------------------------------------------------------------------
  // Report
  // -----------------------------------------------------------------------

  describe('getReport', () => {
    it('should return empty report when no records', () => {
      const report = tracker.getReport();
      expect(report.operationCount).toBe(0);
    });

    it('should return aggregated report', () => {
      tracker.record(makeTokenInput({
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300,
        durationMs: 1500,
      }));
      tracker.record(makeTokenInput({
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        durationMs: 500,
      }));

      const report = tracker.getReport();
      expect(report.operationCount).toBe(2);
      expect(report.totalTokens).toBe(450);
      expect(report.avgTokensPerOperation).toBe(225);
    });
  });

  // -----------------------------------------------------------------------
  // Reset
  // -----------------------------------------------------------------------

  describe('reset', () => {
    it('should clear all records', () => {
      tracker.record(makeTokenInput());
      tracker.record(makeTokenInput());
      expect(tracker.recordCount).toBe(2);

      tracker.reset();
      expect(tracker.recordCount).toBe(0);
      expect(tracker.getRecords()).toHaveLength(0);
    });
  });
});
