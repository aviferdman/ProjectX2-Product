/**
 * Tests for the performance metrics tracking module.
 *
 * Covers: PerformanceTracker, PerformanceTimer, MetricType, reports,
 * aggregation, eviction, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  DEFAULT_MAX_METRICS,
  MetricType,
  PerformanceTimer,
  PerformanceTracker,
  _resetMetricIdCounter,
} from '../../../src/logging/index.js';

import type {
  MetricTokenUsage,
  PerformanceMetric,
  PerformanceMetricInput,
  PerformanceReport,
  PerformanceSummary,
  TimerStartInput,
} from '../../../src/logging/index.js';

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

function makeMetricInput(overrides?: Partial<PerformanceMetricInput>): PerformanceMetricInput {
  return {
    type: MetricType.TASK_EXECUTION,
    startTime: 1000,
    endTime: 1500,
    durationMs: 500,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// MetricType
// ---------------------------------------------------------------------------

describe('MetricType', () => {
  it('has the expected values', () => {
    expect(MetricType.ENGINE_RUN).toBe('engine-run');
    expect(MetricType.TASK_EXECUTION).toBe('task-execution');
    expect(MetricType.LLM_CALL).toBe('llm-call');
    expect(MetricType.TOOL_CALL).toBe('tool-call');
  });
});

// ---------------------------------------------------------------------------
// PerformanceTracker — recording
// ---------------------------------------------------------------------------

describe('PerformanceTracker', () => {
  let tracker: PerformanceTracker;

  beforeEach(() => {
    clock = 1000;
    _resetMetricIdCounter();
    tracker = new PerformanceTracker({ now: fakeClock });
  });

  describe('record()', () => {
    it('records a metric and returns it with an auto-generated ID', () => {
      const metric = tracker.record(makeMetricInput());

      expect(metric.id).toMatch(/^perf-\d+$/);
      expect(metric.type).toBe(MetricType.TASK_EXECUTION);
      expect(metric.startTime).toBe(1000);
      expect(metric.endTime).toBe(1500);
      expect(metric.durationMs).toBe(500);
      expect(metric.success).toBe(true);
    });

    it('defaults success to true when not specified', () => {
      const metric = tracker.record(makeMetricInput());
      expect(metric.success).toBe(true);
    });

    it('records success=false when specified', () => {
      const metric = tracker.record(makeMetricInput({ success: false, errorMessage: 'timeout' }));
      expect(metric.success).toBe(false);
      expect(metric.errorMessage).toBe('timeout');
    });

    it('stores optional context fields (engineId, taskId, agentId, toolId)', () => {
      const metric = tracker.record(
        makeMetricInput({
          engineId: 'eng-1',
          taskId: 'task-1',
          agentId: 'agent-1',
          toolId: 'tool-1',
        }),
      );
      expect(metric.engineId).toBe('eng-1');
      expect(metric.taskId).toBe('task-1');
      expect(metric.agentId).toBe('agent-1');
      expect(metric.toolId).toBe('tool-1');
    });

    it('stores token usage when provided', () => {
      const tokenUsage: MetricTokenUsage = {
        promptTokens: 200,
        completionTokens: 80,
        totalTokens: 280,
      };
      const metric = tracker.record(makeMetricInput({ tokenUsage }));
      expect(metric.tokenUsage).toEqual(tokenUsage);
    });

    it('copies token usage to prevent mutation', () => {
      const tokenUsage = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };
      const metric = tracker.record(makeMetricInput({ tokenUsage }));
      // Even if input object were mutable, the recorded copy should be independent
      expect(metric.tokenUsage).toEqual(tokenUsage);
      expect(metric.tokenUsage).not.toBe(tokenUsage);
    });

    it('stores arbitrary metadata', () => {
      const metric = tracker.record(makeMetricInput({ metadata: { model: 'gpt-4o' } }));
      expect(metric.metadata).toEqual({ model: 'gpt-4o' });
    });

    it('generates unique IDs for each metric', () => {
      const m1 = tracker.record(makeMetricInput());
      const m2 = tracker.record(makeMetricInput());
      expect(m1.id).not.toBe(m2.id);
    });

    it('omits undefined optional fields', () => {
      const metric = tracker.record(makeMetricInput());
      expect(metric.engineId).toBeUndefined();
      expect(metric.taskId).toBeUndefined();
      expect(metric.agentId).toBeUndefined();
      expect(metric.toolId).toBeUndefined();
      expect(metric.tokenUsage).toBeUndefined();
      expect(metric.errorMessage).toBeUndefined();
      expect(metric.metadata).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Query methods
  // -------------------------------------------------------------------------

  describe('query methods', () => {
    beforeEach(() => {
      tracker.record(
        makeMetricInput({
          type: MetricType.ENGINE_RUN,
          engineId: 'eng-1',
          startTime: 0,
          endTime: 1000,
          durationMs: 1000,
        }),
      );
      tracker.record(
        makeMetricInput({
          type: MetricType.TASK_EXECUTION,
          engineId: 'eng-1',
          taskId: 'task-a',
          agentId: 'agent-1',
          startTime: 0,
          endTime: 300,
          durationMs: 300,
        }),
      );
      tracker.record(
        makeMetricInput({
          type: MetricType.LLM_CALL,
          engineId: 'eng-1',
          taskId: 'task-a',
          agentId: 'agent-1',
          startTime: 50,
          endTime: 250,
          durationMs: 200,
        }),
      );
      tracker.record(
        makeMetricInput({
          type: MetricType.TOOL_CALL,
          engineId: 'eng-1',
          taskId: 'task-b',
          agentId: 'agent-2',
          toolId: 'search',
          startTime: 300,
          endTime: 500,
          durationMs: 200,
        }),
      );
    });

    it('getMetrics() returns all metrics', () => {
      expect(tracker.getMetrics()).toHaveLength(4);
    });

    it('getMetrics() returns a copy', () => {
      const metrics = tracker.getMetrics();
      expect(metrics).toHaveLength(4);
      // Modifying returned array shouldn't affect tracker
      (metrics as PerformanceMetric[]).pop();
      expect(tracker.getMetrics()).toHaveLength(4);
    });

    it('metricCount returns the number of metrics', () => {
      expect(tracker.metricCount).toBe(4);
    });

    it('getMetricsByType() filters by metric type', () => {
      expect(tracker.getMetricsByType(MetricType.ENGINE_RUN)).toHaveLength(1);
      expect(tracker.getMetricsByType(MetricType.TASK_EXECUTION)).toHaveLength(1);
      expect(tracker.getMetricsByType(MetricType.LLM_CALL)).toHaveLength(1);
      expect(tracker.getMetricsByType(MetricType.TOOL_CALL)).toHaveLength(1);
    });

    it('getMetricsByEngine() filters by engine ID', () => {
      expect(tracker.getMetricsByEngine('eng-1')).toHaveLength(4);
      expect(tracker.getMetricsByEngine('eng-unknown')).toHaveLength(0);
    });

    it('getMetricsByTask() filters by task ID', () => {
      expect(tracker.getMetricsByTask('task-a')).toHaveLength(2);
      expect(tracker.getMetricsByTask('task-b')).toHaveLength(1);
    });

    it('getMetricsByAgent() filters by agent ID', () => {
      expect(tracker.getMetricsByAgent('agent-1')).toHaveLength(2);
      expect(tracker.getMetricsByAgent('agent-2')).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Aggregation & reporting
  // -------------------------------------------------------------------------

  describe('getSummary()', () => {
    it('returns zeros for empty tracker', () => {
      const summary = tracker.getSummary();
      expect(summary.count).toBe(0);
      expect(summary.totalDurationMs).toBe(0);
      expect(summary.avgDurationMs).toBe(0);
      expect(summary.minDurationMs).toBe(0);
      expect(summary.maxDurationMs).toBe(0);
      expect(summary.p50DurationMs).toBe(0);
      expect(summary.p95DurationMs).toBe(0);
      expect(summary.p99DurationMs).toBe(0);
      expect(summary.totalPromptTokens).toBe(0);
      expect(summary.totalCompletionTokens).toBe(0);
      expect(summary.totalTokens).toBe(0);
      expect(summary.successCount).toBe(0);
      expect(summary.failureCount).toBe(0);
    });

    it('computes correct stats for a single metric', () => {
      tracker.record(makeMetricInput({ durationMs: 100, startTime: 0, endTime: 100 }));
      const summary = tracker.getSummary();
      expect(summary.count).toBe(1);
      expect(summary.totalDurationMs).toBe(100);
      expect(summary.avgDurationMs).toBe(100);
      expect(summary.minDurationMs).toBe(100);
      expect(summary.maxDurationMs).toBe(100);
      expect(summary.p50DurationMs).toBe(100);
      expect(summary.successCount).toBe(1);
      expect(summary.failureCount).toBe(0);
    });

    it('computes correct stats for multiple metrics', () => {
      tracker.record(makeMetricInput({ durationMs: 100, startTime: 0, endTime: 100 }));
      tracker.record(makeMetricInput({ durationMs: 200, startTime: 100, endTime: 300 }));
      tracker.record(makeMetricInput({ durationMs: 300, startTime: 300, endTime: 600 }));

      const summary = tracker.getSummary();
      expect(summary.count).toBe(3);
      expect(summary.totalDurationMs).toBe(600);
      expect(summary.avgDurationMs).toBe(200);
      expect(summary.minDurationMs).toBe(100);
      expect(summary.maxDurationMs).toBe(300);
    });

    it('aggregates token usage across metrics', () => {
      tracker.record(
        makeMetricInput({
          tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        }),
      );
      tracker.record(
        makeMetricInput({
          tokenUsage: { promptTokens: 200, completionTokens: 80, totalTokens: 280 },
        }),
      );
      // One without token usage
      tracker.record(makeMetricInput());

      const summary = tracker.getSummary();
      expect(summary.totalPromptTokens).toBe(300);
      expect(summary.totalCompletionTokens).toBe(130);
      expect(summary.totalTokens).toBe(430);
    });

    it('counts successes and failures', () => {
      tracker.record(makeMetricInput({ success: true }));
      tracker.record(makeMetricInput({ success: true }));
      tracker.record(makeMetricInput({ success: false, errorMessage: 'fail' }));

      const summary = tracker.getSummary();
      expect(summary.successCount).toBe(2);
      expect(summary.failureCount).toBe(1);
    });
  });

  describe('percentile calculations', () => {
    it('computes correct p50 (median)', () => {
      // 5 values: 10, 20, 30, 40, 50 → p50 = 30
      for (const d of [10, 20, 30, 40, 50]) {
        tracker.record(makeMetricInput({ durationMs: d, startTime: 0, endTime: d }));
      }
      const summary = tracker.getSummary();
      expect(summary.p50DurationMs).toBe(30);
    });

    it('interpolates percentiles for even-count arrays', () => {
      // 4 values: 10, 20, 30, 40
      // p50 index = 0.5 * 3 = 1.5 → interpolate between 20 and 30 → 25
      for (const d of [10, 20, 30, 40]) {
        tracker.record(makeMetricInput({ durationMs: d, startTime: 0, endTime: d }));
      }
      const summary = tracker.getSummary();
      expect(summary.p50DurationMs).toBe(25);
    });

    it('computes p95 and p99 for larger datasets', () => {
      // 100 metrics with durations 1..100
      for (let i = 1; i <= 100; i++) {
        tracker.record(makeMetricInput({ durationMs: i, startTime: 0, endTime: i }));
      }
      const summary = tracker.getSummary();
      expect(summary.p50DurationMs).toBeCloseTo(50.5, 1);
      expect(summary.p95DurationMs).toBeCloseTo(95.05, 1);
      expect(summary.p99DurationMs).toBeCloseTo(99.01, 1);
    });
  });

  describe('getReport()', () => {
    it('returns empty report for empty tracker', () => {
      const report = tracker.getReport();
      expect(report.totals.count).toBe(0);
      expect(report.byType.size).toBe(0);
      expect(report.byEngine.size).toBe(0);
      expect(report.byTask.size).toBe(0);
      expect(report.byAgent.size).toBe(0);
      expect(report.startTime).toBeUndefined();
      expect(report.endTime).toBeUndefined();
    });

    it('groups metrics by type', () => {
      tracker.record(makeMetricInput({ type: MetricType.LLM_CALL, durationMs: 100 }));
      tracker.record(makeMetricInput({ type: MetricType.LLM_CALL, durationMs: 200 }));
      tracker.record(makeMetricInput({ type: MetricType.TOOL_CALL, durationMs: 50 }));

      const report = tracker.getReport();
      expect(report.byType.get('llm-call')?.count).toBe(2);
      expect(report.byType.get('tool-call')?.count).toBe(1);
      expect(report.byType.get('engine-run')).toBeUndefined();
    });

    it('groups metrics by engine', () => {
      tracker.record(makeMetricInput({ engineId: 'eng-1' }));
      tracker.record(makeMetricInput({ engineId: 'eng-1' }));
      tracker.record(makeMetricInput({ engineId: 'eng-2' }));

      const report = tracker.getReport();
      expect(report.byEngine.get('eng-1')?.count).toBe(2);
      expect(report.byEngine.get('eng-2')?.count).toBe(1);
    });

    it('groups metrics by task', () => {
      tracker.record(makeMetricInput({ taskId: 'summarize' }));
      tracker.record(makeMetricInput({ taskId: 'summarize' }));
      tracker.record(makeMetricInput({ taskId: 'translate' }));

      const report = tracker.getReport();
      expect(report.byTask.get('summarize')?.count).toBe(2);
      expect(report.byTask.get('translate')?.count).toBe(1);
    });

    it('groups metrics by agent', () => {
      tracker.record(makeMetricInput({ agentId: 'writer' }));
      tracker.record(makeMetricInput({ agentId: 'reviewer' }));
      tracker.record(makeMetricInput({ agentId: 'reviewer' }));

      const report = tracker.getReport();
      expect(report.byAgent.get('writer')?.count).toBe(1);
      expect(report.byAgent.get('reviewer')?.count).toBe(2);
    });

    it('skips undefined keys in groupBy', () => {
      // Metrics without engineId should not appear in byEngine
      tracker.record(makeMetricInput());
      const report = tracker.getReport();
      expect(report.byEngine.size).toBe(0);
    });

    it('computes correct time range', () => {
      tracker.record(makeMetricInput({ startTime: 500, endTime: 1000 }));
      tracker.record(makeMetricInput({ startTime: 100, endTime: 2000 }));
      tracker.record(makeMetricInput({ startTime: 300, endTime: 1500 }));

      const report = tracker.getReport();
      expect(report.startTime).toBe(100);
      expect(report.endTime).toBe(2000);
    });

    it('totals match sum of all metrics', () => {
      tracker.record(
        makeMetricInput({
          type: MetricType.LLM_CALL,
          durationMs: 100,
          tokenUsage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
        }),
      );
      tracker.record(
        makeMetricInput({
          type: MetricType.TOOL_CALL,
          durationMs: 200,
          tokenUsage: { promptTokens: 30, completionTokens: 10, totalTokens: 40 },
        }),
      );

      const report = tracker.getReport();
      expect(report.totals.count).toBe(2);
      expect(report.totals.totalDurationMs).toBe(300);
      expect(report.totals.totalTokens).toBe(110);
    });
  });

  // -------------------------------------------------------------------------
  // Eviction
  // -------------------------------------------------------------------------

  describe('maxMetrics eviction', () => {
    it('evicts oldest metrics when limit is exceeded', () => {
      const small = new PerformanceTracker({ maxMetrics: 3, now: fakeClock });
      _resetMetricIdCounter();

      small.record(makeMetricInput({ durationMs: 10 })); // id perf-1
      small.record(makeMetricInput({ durationMs: 20 })); // id perf-2
      small.record(makeMetricInput({ durationMs: 30 })); // id perf-3

      expect(small.metricCount).toBe(3);

      small.record(makeMetricInput({ durationMs: 40 })); // id perf-4 → evicts perf-1

      expect(small.metricCount).toBe(3);
      const metrics = small.getMetrics();
      expect(metrics[0].durationMs).toBe(20);
      expect(metrics[2].durationMs).toBe(40);
    });

    it('uses DEFAULT_MAX_METRICS when not configured', () => {
      expect(DEFAULT_MAX_METRICS).toBe(10_000);
    });
  });

  // -------------------------------------------------------------------------
  // reset()
  // -------------------------------------------------------------------------

  describe('reset()', () => {
    it('clears all metrics', () => {
      tracker.record(makeMetricInput());
      tracker.record(makeMetricInput());
      expect(tracker.metricCount).toBe(2);

      tracker.reset();
      expect(tracker.metricCount).toBe(0);
      expect(tracker.getMetrics()).toHaveLength(0);
    });

    it('allows recording new metrics after reset', () => {
      tracker.record(makeMetricInput());
      tracker.reset();
      tracker.record(makeMetricInput({ durationMs: 999 }));
      expect(tracker.metricCount).toBe(1);
      expect(tracker.getMetrics()[0].durationMs).toBe(999);
    });
  });
});

// ---------------------------------------------------------------------------
// PerformanceTimer
// ---------------------------------------------------------------------------

describe('PerformanceTimer', () => {
  let tracker: PerformanceTracker;

  beforeEach(() => {
    clock = 1000;
    _resetMetricIdCounter();
    tracker = new PerformanceTracker({ now: fakeClock });
  });

  it('records metric with measured duration when stopped', () => {
    const timer = tracker.startTimer({ type: MetricType.LLM_CALL, agentId: 'writer' });
    expect(timer.stopped).toBe(false);
    expect(timer.startTime).toBe(1000);

    advanceClock(250);
    const metric = timer.stop();

    expect(timer.stopped).toBe(true);
    expect(metric.type).toBe(MetricType.LLM_CALL);
    expect(metric.agentId).toBe('writer');
    expect(metric.startTime).toBe(1000);
    expect(metric.endTime).toBe(1250);
    expect(metric.durationMs).toBe(250);
    expect(metric.success).toBe(true);
  });

  it('attaches token usage from stop()', () => {
    const timer = tracker.startTimer({ type: MetricType.LLM_CALL });
    advanceClock(100);
    const metric = timer.stop({
      tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    });
    expect(metric.tokenUsage).toEqual({
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    });
  });

  it('records failure with error message', () => {
    const timer = tracker.startTimer({ type: MetricType.TASK_EXECUTION, taskId: 'summarize' });
    advanceClock(500);
    const metric = timer.stop({ success: false, errorMessage: 'LLM timeout' });

    expect(metric.success).toBe(false);
    expect(metric.errorMessage).toBe('LLM timeout');
    expect(metric.durationMs).toBe(500);
  });

  it('merges metadata from start and stop', () => {
    const timer = tracker.startTimer({
      type: MetricType.TOOL_CALL,
      metadata: { toolName: 'web-search' },
    });
    advanceClock(50);
    const metric = timer.stop({ metadata: { resultCount: 5 } });

    expect(metric.metadata).toEqual({ toolName: 'web-search', resultCount: 5 });
  });

  it('stop metadata overrides start metadata for same keys', () => {
    const timer = tracker.startTimer({
      type: MetricType.TOOL_CALL,
      metadata: { phase: 'init' },
    });
    advanceClock(10);
    const metric = timer.stop({ metadata: { phase: 'complete' } });

    expect(metric.metadata).toEqual({ phase: 'complete' });
  });

  it('throws if stopped twice', () => {
    const timer = tracker.startTimer({ type: MetricType.LLM_CALL });
    advanceClock(10);
    timer.stop();

    expect(() => timer.stop()).toThrow('PerformanceTimer has already been stopped');
  });

  it('preserves all context fields from start input', () => {
    const timer = tracker.startTimer({
      type: MetricType.LLM_CALL,
      engineId: 'eng-1',
      taskId: 'task-1',
      agentId: 'agent-1',
      toolId: 'tool-1',
    });
    advanceClock(10);
    const metric = timer.stop();

    expect(metric.engineId).toBe('eng-1');
    expect(metric.taskId).toBe('task-1');
    expect(metric.agentId).toBe('agent-1');
    expect(metric.toolId).toBe('tool-1');
  });

  it('uses tracker clock consistently', () => {
    // Start at clock=1000
    const timer = tracker.startTimer({ type: MetricType.ENGINE_RUN });

    // Advance clock
    advanceClock(1000);

    const metric = timer.stop();
    expect(metric.startTime).toBe(1000);
    expect(metric.endTime).toBe(2000);
    expect(metric.durationMs).toBe(1000);
  });

  it('adds metric to tracker on stop', () => {
    expect(tracker.metricCount).toBe(0);
    const timer = tracker.startTimer({ type: MetricType.TASK_EXECUTION });
    advanceClock(10);
    timer.stop();
    expect(tracker.metricCount).toBe(1);
  });

  it('handles zero-duration timers', () => {
    const timer = tracker.startTimer({ type: MetricType.TOOL_CALL });
    // Don't advance clock
    const metric = timer.stop();
    expect(metric.durationMs).toBe(0);
    expect(metric.startTime).toBe(metric.endTime);
  });
});

// ---------------------------------------------------------------------------
// Integration scenarios
// ---------------------------------------------------------------------------

describe('PerformanceTracker integration', () => {
  let tracker: PerformanceTracker;

  beforeEach(() => {
    clock = 0;
    _resetMetricIdCounter();
    tracker = new PerformanceTracker({ now: fakeClock });
  });

  it('simulates a full engine run with nested task and LLM timings', () => {
    // Engine run starts
    const engineTimer = tracker.startTimer({
      type: MetricType.ENGINE_RUN,
      engineId: 'eng-1',
    });

    advanceClock(10);

    // Task 1: summarize
    const task1Timer = tracker.startTimer({
      type: MetricType.TASK_EXECUTION,
      engineId: 'eng-1',
      taskId: 'summarize',
      agentId: 'writer',
    });

    advanceClock(5);

    // LLM call within task 1
    const llm1Timer = tracker.startTimer({
      type: MetricType.LLM_CALL,
      engineId: 'eng-1',
      taskId: 'summarize',
      agentId: 'writer',
    });

    advanceClock(100);
    llm1Timer.stop({
      tokenUsage: { promptTokens: 200, completionTokens: 80, totalTokens: 280 },
    });

    advanceClock(5);
    task1Timer.stop();

    advanceClock(10);

    // Task 2: review (with tool call)
    const task2Timer = tracker.startTimer({
      type: MetricType.TASK_EXECUTION,
      engineId: 'eng-1',
      taskId: 'review',
      agentId: 'reviewer',
    });

    advanceClock(5);

    // Tool call within task 2
    const toolTimer = tracker.startTimer({
      type: MetricType.TOOL_CALL,
      engineId: 'eng-1',
      taskId: 'review',
      agentId: 'reviewer',
      toolId: 'file-read',
    });

    advanceClock(50);
    toolTimer.stop();

    advanceClock(5);

    // LLM call within task 2
    const llm2Timer = tracker.startTimer({
      type: MetricType.LLM_CALL,
      engineId: 'eng-1',
      taskId: 'review',
      agentId: 'reviewer',
    });

    advanceClock(150);
    llm2Timer.stop({
      tokenUsage: { promptTokens: 300, completionTokens: 120, totalTokens: 420 },
    });

    advanceClock(5);
    task2Timer.stop();

    advanceClock(10);
    engineTimer.stop();

    // Verify report
    const report = tracker.getReport();

    // Total: 6 metrics
    expect(report.totals.count).toBe(6);

    // By type
    expect(report.byType.get('engine-run')?.count).toBe(1);
    expect(report.byType.get('task-execution')?.count).toBe(2);
    expect(report.byType.get('llm-call')?.count).toBe(2);
    expect(report.byType.get('tool-call')?.count).toBe(1);

    // Token aggregation across LLM calls
    const llmSummary = report.byType.get('llm-call')!;
    expect(llmSummary.totalPromptTokens).toBe(500);
    expect(llmSummary.totalCompletionTokens).toBe(200);
    expect(llmSummary.totalTokens).toBe(700);

    // By agent
    expect(report.byAgent.get('writer')?.count).toBe(2); // task + llm
    expect(report.byAgent.get('reviewer')?.count).toBe(3); // task + tool + llm

    // By task
    expect(report.byTask.get('summarize')?.count).toBe(2); // task + llm
    expect(report.byTask.get('review')?.count).toBe(3); // task + tool + llm

    // By engine
    expect(report.byEngine.get('eng-1')?.count).toBe(6);

    // All operations succeeded
    expect(report.totals.successCount).toBe(6);
    expect(report.totals.failureCount).toBe(0);

    // Time range
    expect(report.startTime).toBe(0);
    expect(report.endTime).toBeDefined();
  });

  it('tracks failures alongside successes', () => {
    tracker.record(makeMetricInput({ type: MetricType.LLM_CALL, durationMs: 100, success: true }));
    tracker.record(
      makeMetricInput({
        type: MetricType.LLM_CALL,
        durationMs: 5000,
        success: false,
        errorMessage: 'Rate limit exceeded',
      }),
    );
    tracker.record(makeMetricInput({ type: MetricType.LLM_CALL, durationMs: 150, success: true }));

    const report = tracker.getReport();
    const llm = report.byType.get('llm-call')!;
    expect(llm.count).toBe(3);
    expect(llm.successCount).toBe(2);
    expect(llm.failureCount).toBe(1);
    expect(llm.maxDurationMs).toBe(5000);
  });

  it('works with default Date.now clock', () => {
    const realTracker = new PerformanceTracker();
    _resetMetricIdCounter();
    const timer = realTracker.startTimer({ type: MetricType.TOOL_CALL });
    const metric = timer.stop();
    // Just verify it works — exact times depend on system clock
    expect(metric.durationMs).toBeGreaterThanOrEqual(0);
    expect(metric.startTime).toBeLessThanOrEqual(metric.endTime);
  });
});
