/**
 * Tests for TokenUsageTracker — token usage accumulation and cost calculation.
 */

import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { TokenUsageTracker } from '../../../src/llm/usage-tracker.js';
import type { UsageRecord, UsageRecordInput, UsageReport } from '../../../src/llm/usage-tracker.js';
import type { TokenUsage } from '../../../src/types/llm.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInput(overrides: Partial<UsageRecordInput> = {}): UsageRecordInput {
  return {
    modelId: 'gpt-4o',
    provider: 'openai',
    tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// TokenUsageTracker
// ---------------------------------------------------------------------------

describe('TokenUsageTracker', () => {
  let tracker: TokenUsageTracker;

  beforeEach(() => {
    tracker = new TokenUsageTracker();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // record()
  // -------------------------------------------------------------------------

  describe('record()', () => {
    it('should record a usage event and return a UsageRecord', () => {
      const record = tracker.record(makeInput());

      expect(record).toBeDefined();
      expect(record.modelId).toBe('gpt-4o');
      expect(record.provider).toBe('openai');
      expect(record.tokenUsage.promptTokens).toBe(100);
      expect(record.tokenUsage.completionTokens).toBe(50);
      expect(record.tokenUsage.totalTokens).toBe(150);
      expect(record.streaming).toBe(false);
    });

    it('should generate a unique ID for each record', () => {
      const r1 = tracker.record(makeInput());
      const r2 = tracker.record(makeInput());

      expect(r1.id).not.toBe(r2.id);
    });

    it('should set timestamp to current time', () => {
      const before = new Date();
      const record = tracker.record(makeInput());
      const after = new Date();

      expect(record.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(record.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should calculate cost using ModelCatalog for known models', () => {
      const record = tracker.record(
        makeInput({
          modelId: 'gpt-4o',
          tokenUsage: { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 },
        }),
      );

      // gpt-4o: $0.0025/1k input + $0.01/1k output
      // (1000/1000)*0.0025 + (500/1000)*0.01 = 0.0025 + 0.005 = 0.0075
      expect(record.costUsd).toBeCloseTo(0.0075, 6);
    });

    it('should return undefined cost for unknown models', () => {
      const record = tracker.record(
        makeInput({
          modelId: 'unknown-model',
        }),
      );

      expect(record.costUsd).toBeUndefined();
    });

    it('should return undefined cost for local models without pricing', () => {
      const record = tracker.record(
        makeInput({
          modelId: 'llama3.1:8b',
          provider: 'ollama',
        }),
      );

      expect(record.costUsd).toBeUndefined();
    });

    it('should record durationMs when provided', () => {
      const record = tracker.record(makeInput({ durationMs: 1234 }));

      expect(record.durationMs).toBe(1234);
    });

    it('should default streaming to false', () => {
      const record = tracker.record(makeInput());

      expect(record.streaming).toBe(false);
    });

    it('should record streaming flag when set to true', () => {
      const record = tracker.record(makeInput({ streaming: true }));

      expect(record.streaming).toBe(true);
    });

    it('should make a defensive copy of tokenUsage', () => {
      const usage = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };
      const record = tracker.record(makeInput({ tokenUsage: usage }));

      // Mutating the original should not affect the record
      (usage as { promptTokens: number }).promptTokens = 999;
      expect(record.tokenUsage.promptTokens).toBe(100);
    });
  });

  // -------------------------------------------------------------------------
  // getRecords()
  // -------------------------------------------------------------------------

  describe('getRecords()', () => {
    it('should return empty array when no records exist', () => {
      expect(tracker.getRecords()).toEqual([]);
    });

    it('should return all recorded records', () => {
      tracker.record(makeInput({ modelId: 'gpt-4o' }));
      tracker.record(makeInput({ modelId: 'gpt-4o-mini' }));

      const records = tracker.getRecords();
      expect(records).toHaveLength(2);
      expect(records[0].modelId).toBe('gpt-4o');
      expect(records[1].modelId).toBe('gpt-4o-mini');
    });

    it('should return a copy (not the internal array)', () => {
      tracker.record(makeInput());
      const records1 = tracker.getRecords();
      const records2 = tracker.getRecords();

      expect(records1).not.toBe(records2);
      expect(records1).toEqual(records2);
    });
  });

  // -------------------------------------------------------------------------
  // getRecordsByModel()
  // -------------------------------------------------------------------------

  describe('getRecordsByModel()', () => {
    it('should return empty array when no matching records', () => {
      tracker.record(makeInput({ modelId: 'gpt-4o' }));

      expect(tracker.getRecordsByModel('claude-3-5-sonnet-20241022')).toEqual([]);
    });

    it('should filter records by model ID', () => {
      tracker.record(makeInput({ modelId: 'gpt-4o' }));
      tracker.record(makeInput({ modelId: 'gpt-4o-mini' }));
      tracker.record(makeInput({ modelId: 'gpt-4o' }));

      const gpt4oRecords = tracker.getRecordsByModel('gpt-4o');
      expect(gpt4oRecords).toHaveLength(2);
      expect(gpt4oRecords.every((r) => r.modelId === 'gpt-4o')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // getRecordsByProvider()
  // -------------------------------------------------------------------------

  describe('getRecordsByProvider()', () => {
    it('should return empty array when no matching records', () => {
      tracker.record(makeInput({ provider: 'openai' }));

      expect(tracker.getRecordsByProvider('anthropic')).toEqual([]);
    });

    it('should filter records by provider name', () => {
      tracker.record(makeInput({ provider: 'openai' }));
      tracker.record(makeInput({ provider: 'anthropic', modelId: 'claude-3-5-sonnet-20241022' }));
      tracker.record(makeInput({ provider: 'openai' }));

      const openaiRecords = tracker.getRecordsByProvider('openai');
      expect(openaiRecords).toHaveLength(2);
      expect(openaiRecords.every((r) => r.provider === 'openai')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // recordCount
  // -------------------------------------------------------------------------

  describe('recordCount', () => {
    it('should return 0 when no records exist', () => {
      expect(tracker.recordCount).toBe(0);
    });

    it('should return the correct count after recording', () => {
      tracker.record(makeInput());
      tracker.record(makeInput());
      tracker.record(makeInput());

      expect(tracker.recordCount).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // getTotalTokens()
  // -------------------------------------------------------------------------

  describe('getTotalTokens()', () => {
    it('should return zeros when no records exist', () => {
      const totals = tracker.getTotalTokens();

      expect(totals.promptTokens).toBe(0);
      expect(totals.completionTokens).toBe(0);
      expect(totals.totalTokens).toBe(0);
    });

    it('should aggregate tokens across multiple requests', () => {
      tracker.record(
        makeInput({
          tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        }),
      );
      tracker.record(
        makeInput({
          tokenUsage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 },
        }),
      );
      tracker.record(
        makeInput({
          tokenUsage: { promptTokens: 300, completionTokens: 150, totalTokens: 450 },
        }),
      );

      const totals = tracker.getTotalTokens();
      expect(totals.promptTokens).toBe(600);
      expect(totals.completionTokens).toBe(300);
      expect(totals.totalTokens).toBe(900);
    });

    it('should aggregate tokens across different models', () => {
      tracker.record(
        makeInput({
          modelId: 'gpt-4o',
          tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        }),
      );
      tracker.record(
        makeInput({
          modelId: 'claude-3-5-sonnet-20241022',
          provider: 'anthropic',
          tokenUsage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 },
        }),
      );

      const totals = tracker.getTotalTokens();
      expect(totals.promptTokens).toBe(300);
      expect(totals.completionTokens).toBe(150);
      expect(totals.totalTokens).toBe(450);
    });
  });

  // -------------------------------------------------------------------------
  // getTotalCost()
  // -------------------------------------------------------------------------

  describe('getTotalCost()', () => {
    it('should return 0 when no records exist', () => {
      expect(tracker.getTotalCost()).toBe(0);
    });

    it('should aggregate cost across multiple requests', () => {
      // gpt-4o: $0.0025/1k in, $0.01/1k out
      tracker.record(
        makeInput({
          modelId: 'gpt-4o',
          tokenUsage: { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 },
        }),
      );
      // gpt-4o-mini: $0.00015/1k in, $0.0006/1k out
      tracker.record(
        makeInput({
          modelId: 'gpt-4o-mini',
          tokenUsage: { promptTokens: 2000, completionTokens: 1000, totalTokens: 3000 },
        }),
      );

      // gpt-4o cost: (1000/1000)*0.0025 + (500/1000)*0.01 = 0.0025 + 0.005 = 0.0075
      // gpt-4o-mini cost: (2000/1000)*0.00015 + (1000/1000)*0.0006 = 0.0003 + 0.0006 = 0.0009
      // Total: 0.0075 + 0.0009 = 0.0084
      expect(tracker.getTotalCost()).toBeCloseTo(0.0084, 6);
    });

    it('should treat unknown model costs as 0', () => {
      tracker.record(
        makeInput({
          modelId: 'gpt-4o',
          tokenUsage: { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 },
        }),
      );
      tracker.record(
        makeInput({
          modelId: 'unknown-model',
          tokenUsage: { promptTokens: 5000, completionTokens: 5000, totalTokens: 10000 },
        }),
      );

      // Only gpt-4o cost counted
      expect(tracker.getTotalCost()).toBeCloseTo(0.0075, 6);
    });

    it('should handle local models (no cost) correctly', () => {
      tracker.record(
        makeInput({
          modelId: 'llama3.1:8b',
          provider: 'ollama',
          tokenUsage: { promptTokens: 5000, completionTokens: 2000, totalTokens: 7000 },
        }),
      );

      expect(tracker.getTotalCost()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // getReport()
  // -------------------------------------------------------------------------

  describe('getReport()', () => {
    it('should return empty report when no records exist', () => {
      const report = tracker.getReport();

      expect(report.totals.requests).toBe(0);
      expect(report.totals.promptTokens).toBe(0);
      expect(report.totals.completionTokens).toBe(0);
      expect(report.totals.totalTokens).toBe(0);
      expect(report.totals.totalCostUsd).toBe(0);
      expect(report.byModel.size).toBe(0);
      expect(report.byProvider.size).toBe(0);
      expect(report.startTime).toBeUndefined();
      expect(report.endTime).toBeUndefined();
    });

    it('should produce correct totals', () => {
      tracker.record(
        makeInput({
          modelId: 'gpt-4o',
          tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        }),
      );
      tracker.record(
        makeInput({
          modelId: 'gpt-4o',
          tokenUsage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 },
        }),
      );

      const report = tracker.getReport();
      expect(report.totals.requests).toBe(2);
      expect(report.totals.promptTokens).toBe(300);
      expect(report.totals.completionTokens).toBe(150);
      expect(report.totals.totalTokens).toBe(450);
    });

    it('should produce per-model breakdown', () => {
      tracker.record(
        makeInput({
          modelId: 'gpt-4o',
          tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        }),
      );
      tracker.record(
        makeInput({
          modelId: 'gpt-4o-mini',
          tokenUsage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 },
        }),
      );
      tracker.record(
        makeInput({
          modelId: 'gpt-4o',
          tokenUsage: { promptTokens: 300, completionTokens: 150, totalTokens: 450 },
        }),
      );

      const report = tracker.getReport();
      expect(report.byModel.size).toBe(2);

      const gpt4o = report.byModel.get('gpt-4o')!;
      expect(gpt4o.requests).toBe(2);
      expect(gpt4o.promptTokens).toBe(400);
      expect(gpt4o.completionTokens).toBe(200);
      expect(gpt4o.totalTokens).toBe(600);

      const gpt4oMini = report.byModel.get('gpt-4o-mini')!;
      expect(gpt4oMini.requests).toBe(1);
      expect(gpt4oMini.promptTokens).toBe(200);
    });

    it('should produce per-provider breakdown', () => {
      tracker.record(
        makeInput({
          modelId: 'gpt-4o',
          provider: 'openai',
          tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        }),
      );
      tracker.record(
        makeInput({
          modelId: 'claude-3-5-sonnet-20241022',
          provider: 'anthropic',
          tokenUsage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 },
        }),
      );

      const report = tracker.getReport();
      expect(report.byProvider.size).toBe(2);

      const openai = report.byProvider.get('openai')!;
      expect(openai.requests).toBe(1);
      expect(openai.promptTokens).toBe(100);

      const anthropic = report.byProvider.get('anthropic')!;
      expect(anthropic.requests).toBe(1);
      expect(anthropic.promptTokens).toBe(200);
    });

    it('should track time range', () => {
      tracker.record(makeInput());
      const firstTime = tracker.getRecords()[0].timestamp;

      tracker.record(makeInput());
      const lastTime = tracker.getRecords()[1].timestamp;

      const report = tracker.getReport();
      expect(report.startTime).toEqual(firstTime);
      expect(report.endTime).toEqual(lastTime);
    });

    it('should aggregate costs in per-model breakdown', () => {
      // gpt-4o: $0.0025/1k in, $0.01/1k out
      tracker.record(
        makeInput({
          modelId: 'gpt-4o',
          tokenUsage: { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 },
        }),
      );

      const report = tracker.getReport();
      const gpt4o = report.byModel.get('gpt-4o')!;
      expect(gpt4o.totalCostUsd).toBeCloseTo(0.0075, 6);
    });
  });

  // -------------------------------------------------------------------------
  // reset()
  // -------------------------------------------------------------------------

  describe('reset()', () => {
    it('should clear all records', () => {
      tracker.record(makeInput());
      tracker.record(makeInput());
      expect(tracker.recordCount).toBe(2);

      tracker.reset();

      expect(tracker.recordCount).toBe(0);
      expect(tracker.getRecords()).toEqual([]);
      expect(tracker.getTotalCost()).toBe(0);
      expect(tracker.getTotalTokens().totalTokens).toBe(0);
    });

    it('should allow recording after reset', () => {
      tracker.record(makeInput());
      tracker.reset();
      tracker.record(makeInput());

      expect(tracker.recordCount).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // calculateCost() (static)
  // -------------------------------------------------------------------------

  describe('calculateCost()', () => {
    it('should calculate cost for gpt-4o', () => {
      const cost = TokenUsageTracker.calculateCost('gpt-4o', {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      });

      // (1000/1000)*0.0025 + (500/1000)*0.01 = 0.0025 + 0.005 = 0.0075
      expect(cost).toBeCloseTo(0.0075, 6);
    });

    it('should calculate cost for gpt-4o-mini', () => {
      const cost = TokenUsageTracker.calculateCost('gpt-4o-mini', {
        promptTokens: 1000,
        completionTokens: 1000,
        totalTokens: 2000,
      });

      // (1000/1000)*0.00015 + (1000/1000)*0.0006 = 0.00015 + 0.0006 = 0.00075
      expect(cost).toBeCloseTo(0.00075, 6);
    });

    it('should calculate cost for gpt-4-turbo', () => {
      const cost = TokenUsageTracker.calculateCost('gpt-4-turbo', {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      });

      // (1000/1000)*0.01 + (500/1000)*0.03 = 0.01 + 0.015 = 0.025
      expect(cost).toBeCloseTo(0.025, 6);
    });

    it('should calculate cost for claude-3-5-sonnet', () => {
      const cost = TokenUsageTracker.calculateCost('claude-3-5-sonnet-20241022', {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      });

      // (1000/1000)*0.003 + (500/1000)*0.015 = 0.003 + 0.0075 = 0.0105
      expect(cost).toBeCloseTo(0.0105, 6);
    });

    it('should calculate cost for claude-3-5-haiku', () => {
      const cost = TokenUsageTracker.calculateCost('claude-3-5-haiku-20241022', {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      });

      // (1000/1000)*0.001 + (500/1000)*0.005 = 0.001 + 0.0025 = 0.0035
      expect(cost).toBeCloseTo(0.0035, 6);
    });

    it('should calculate cost for claude-3-opus', () => {
      const cost = TokenUsageTracker.calculateCost('claude-3-opus-20240229', {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      });

      // (1000/1000)*0.015 + (500/1000)*0.075 = 0.015 + 0.0375 = 0.0525
      expect(cost).toBeCloseTo(0.0525, 6);
    });

    it('should return undefined for unknown models', () => {
      const cost = TokenUsageTracker.calculateCost('nonexistent', {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      });

      expect(cost).toBeUndefined();
    });

    it('should return undefined for local models without pricing', () => {
      const cost = TokenUsageTracker.calculateCost('llama3.1:8b', {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      });

      expect(cost).toBeUndefined();
    });

    it('should handle zero tokens', () => {
      const cost = TokenUsageTracker.calculateCost('gpt-4o', {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });

      expect(cost).toBe(0);
    });

    it('should handle large token counts', () => {
      const cost = TokenUsageTracker.calculateCost('gpt-4o', {
        promptTokens: 128_000,
        completionTokens: 16_384,
        totalTokens: 144_384,
      });

      // (128000/1000)*0.0025 + (16384/1000)*0.01 = 0.32 + 0.16384 = 0.48384
      expect(cost).toBeCloseTo(0.48384, 4);
    });
  });

  // -------------------------------------------------------------------------
  // Multi-model aggregation scenarios
  // -------------------------------------------------------------------------

  describe('multi-model aggregation', () => {
    it('should correctly aggregate across OpenAI and Anthropic models', () => {
      // 3 OpenAI requests
      tracker.record(
        makeInput({
          modelId: 'gpt-4o',
          provider: 'openai',
          tokenUsage: { promptTokens: 500, completionTokens: 200, totalTokens: 700 },
        }),
      );
      tracker.record(
        makeInput({
          modelId: 'gpt-4o-mini',
          provider: 'openai',
          tokenUsage: { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 },
        }),
      );
      tracker.record(
        makeInput({
          modelId: 'gpt-4o',
          provider: 'openai',
          tokenUsage: { promptTokens: 500, completionTokens: 200, totalTokens: 700 },
        }),
      );

      // 2 Anthropic requests
      tracker.record(
        makeInput({
          modelId: 'claude-3-5-sonnet-20241022',
          provider: 'anthropic',
          tokenUsage: { promptTokens: 800, completionTokens: 400, totalTokens: 1200 },
        }),
      );
      tracker.record(
        makeInput({
          modelId: 'claude-3-5-haiku-20241022',
          provider: 'anthropic',
          tokenUsage: { promptTokens: 2000, completionTokens: 1000, totalTokens: 3000 },
        }),
      );

      // 1 Local (Ollama) request
      tracker.record(
        makeInput({
          modelId: 'llama3.1:8b',
          provider: 'ollama',
          tokenUsage: { promptTokens: 3000, completionTokens: 1500, totalTokens: 4500 },
        }),
      );

      const report = tracker.getReport();

      // Totals
      expect(report.totals.requests).toBe(6);
      expect(report.totals.promptTokens).toBe(7800);
      expect(report.totals.completionTokens).toBe(3800);
      expect(report.totals.totalTokens).toBe(11600);

      // Provider breakdown
      expect(report.byProvider.size).toBe(3);
      const openaiSummary = report.byProvider.get('openai')!;
      expect(openaiSummary.requests).toBe(3);
      expect(openaiSummary.promptTokens).toBe(2000);

      const anthropicSummary = report.byProvider.get('anthropic')!;
      expect(anthropicSummary.requests).toBe(2);

      const ollamaSummary = report.byProvider.get('ollama')!;
      expect(ollamaSummary.requests).toBe(1);
      expect(ollamaSummary.totalCostUsd).toBe(0); // Local = no cost

      // Model breakdown
      expect(report.byModel.size).toBe(5);
      expect(report.byModel.get('gpt-4o')!.requests).toBe(2);
      expect(report.byModel.get('gpt-4o-mini')!.requests).toBe(1);
      expect(report.byModel.get('claude-3-5-sonnet-20241022')!.requests).toBe(1);
      expect(report.byModel.get('claude-3-5-haiku-20241022')!.requests).toBe(1);
      expect(report.byModel.get('llama3.1:8b')!.requests).toBe(1);
    });
  });
});
