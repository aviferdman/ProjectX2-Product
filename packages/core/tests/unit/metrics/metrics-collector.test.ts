/**
 * Tests for the unified MetricsCollector.
 *
 * Covers: MetricsCollector construction, execution time recording,
 * memory measurement, token usage, complexity analysis, unified report,
 * and lifecycle.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  MetricsCollector,
  DEFAULT_MAX_EXECUTION_TIME_MEASUREMENTS,
  computeExecutionTimeSummary,
  _resetTokenRecordIdCounter,
} from '../../../src/metrics/index.js';

import type {
  ExecutionTimeInput,
  ExecutionTimeMeasurement,
  ExecutionTimeSummary,
  UnifiedMetricsReport,
  WorkflowDescriptor,
  AgentDescriptor,
  TaskDescriptor,
} from '../../../src/metrics/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let clockValue = 1000;

function fakeClock(): number {
  return clockValue;
}

function advanceClock(ms: number): void {
  clockValue += ms;
}

function makeExecutionTimeInput(overrides?: Partial<ExecutionTimeInput>): ExecutionTimeInput {
  return {
    label: overrides?.label ?? 'test-op',
    category: overrides?.category ?? 'task',
    durationMs: overrides?.durationMs ?? 100,
    success: overrides?.success,
  };
}

function makeWorkflow(overrides?: Partial<WorkflowDescriptor>): WorkflowDescriptor {
  return {
    id: overrides?.id ?? 'wf-1',
    agents: overrides?.agents ?? [
      { id: 'agent-1', toolCount: 2, hasLLMProvider: true, hasBackstory: false },
    ],
    tasks: overrides?.tasks ?? [
      { id: 'task-1', agentId: 'agent-1', dependencies: [], hasTimeout: false, hasRetry: false },
    ],
    strategy: overrides?.strategy ?? 'sequential',
    hasHooks: overrides?.hasHooks ?? false,
  };
}

// ---------------------------------------------------------------------------
// computeExecutionTimeSummary (pure function)
// ---------------------------------------------------------------------------

describe('computeExecutionTimeSummary', () => {
  it('should return zeros for empty input', () => {
    const summary = computeExecutionTimeSummary([]);

    expect(summary.count).toBe(0);
    expect(summary.totalMs).toBe(0);
    expect(summary.avgMs).toBe(0);
    expect(summary.minMs).toBe(0);
    expect(summary.maxMs).toBe(0);
    expect(summary.p50Ms).toBe(0);
    expect(summary.p95Ms).toBe(0);
    expect(summary.p99Ms).toBe(0);
    expect(summary.successCount).toBe(0);
    expect(summary.failureCount).toBe(0);
    expect(summary.byCategory.size).toBe(0);
  });

  it('should compute statistics for multiple measurements', () => {
    const measurements: ExecutionTimeMeasurement[] = [
      { label: 'op1', category: 'task', durationMs: 10, success: true, timestamp: 1000 },
      { label: 'op2', category: 'task', durationMs: 20, success: true, timestamp: 1001 },
      { label: 'op3', category: 'task', durationMs: 30, success: false, timestamp: 1002 },
      { label: 'op4', category: 'task', durationMs: 40, success: true, timestamp: 1003 },
      { label: 'op5', category: 'task', durationMs: 50, success: true, timestamp: 1004 },
    ];

    const summary = computeExecutionTimeSummary(measurements);

    expect(summary.count).toBe(5);
    expect(summary.totalMs).toBe(150);
    expect(summary.avgMs).toBe(30);
    expect(summary.minMs).toBe(10);
    expect(summary.maxMs).toBe(50);
    expect(summary.successCount).toBe(4);
    expect(summary.failureCount).toBe(1);
  });

  it('should compute category breakdown', () => {
    const measurements: ExecutionTimeMeasurement[] = [
      { label: 'a', category: 'task', durationMs: 100, success: true, timestamp: 1000 },
      { label: 'b', category: 'agent', durationMs: 200, success: true, timestamp: 1001 },
      { label: 'c', category: 'task', durationMs: 300, success: true, timestamp: 1002 },
    ];

    const summary = computeExecutionTimeSummary(measurements);

    expect(summary.byCategory.size).toBe(2);

    const taskSummary = summary.byCategory.get('task')!;
    expect(taskSummary.count).toBe(2);
    expect(taskSummary.totalMs).toBe(400);
    expect(taskSummary.avgMs).toBe(200);
    expect(taskSummary.minMs).toBe(100);
    expect(taskSummary.maxMs).toBe(300);

    const agentSummary = summary.byCategory.get('agent')!;
    expect(agentSummary.count).toBe(1);
    expect(agentSummary.totalMs).toBe(200);
  });

  it('should compute percentiles correctly', () => {
    // 100 measurements: 1, 2, 3, ..., 100
    const measurements: ExecutionTimeMeasurement[] = Array.from({ length: 100 }, (_, i) => ({
      label: `op-${i}`,
      category: 'task',
      durationMs: i + 1,
      success: true,
      timestamp: 1000 + i,
    }));

    const summary = computeExecutionTimeSummary(measurements);

    expect(summary.p50Ms).toBeCloseTo(50.5, 0);
    expect(summary.p95Ms).toBeCloseTo(95.05, 0);
    expect(summary.p99Ms).toBeCloseTo(99.01, 0);
  });
});

// ---------------------------------------------------------------------------
// MetricsCollector
// ---------------------------------------------------------------------------

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    clockValue = 1000;
    _resetTokenRecordIdCounter();
    collector = new MetricsCollector({ now: fakeClock });
  });

  // -----------------------------------------------------------------------
  // Construction
  // -----------------------------------------------------------------------

  describe('constructor', () => {
    it('should create with default config', () => {
      const c = new MetricsCollector();
      expect(c.getExecutionTimes()).toHaveLength(0);
    });

    it('should accept custom config', () => {
      const c = new MetricsCollector({
        maxExecutionTimeMeasurements: 10,
        now: fakeClock,
      });
      expect(c.getExecutionTimes()).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Execution Time
  // -----------------------------------------------------------------------

  describe('recordExecutionTime', () => {
    it('should record a measurement', () => {
      const m = collector.recordExecutionTime(makeExecutionTimeInput());

      expect(m.label).toBe('test-op');
      expect(m.category).toBe('task');
      expect(m.durationMs).toBe(100);
      expect(m.success).toBe(true);
      expect(m.timestamp).toBe(1000);
    });

    it('should default success to true', () => {
      const m = collector.recordExecutionTime(makeExecutionTimeInput({ success: undefined }));
      expect(m.success).toBe(true);
    });

    it('should record failure', () => {
      const m = collector.recordExecutionTime(makeExecutionTimeInput({ success: false }));
      expect(m.success).toBe(false);
    });

    it('should accumulate measurements', () => {
      collector.recordExecutionTime(makeExecutionTimeInput({ label: 'a' }));
      collector.recordExecutionTime(makeExecutionTimeInput({ label: 'b' }));

      expect(collector.getExecutionTimes()).toHaveLength(2);
    });
  });

  describe('timeExecution', () => {
    it('should time a successful operation', async () => {
      const result = await collector.timeExecution('op', 'task', () => {
        advanceClock(50);
        return 42;
      });

      expect(result).toBe(42);
      const times = collector.getExecutionTimes();
      expect(times).toHaveLength(1);
      expect(times[0]!.label).toBe('op');
      expect(times[0]!.durationMs).toBe(50);
      expect(times[0]!.success).toBe(true);
    });

    it('should time a failed operation', async () => {
      await expect(
        collector.timeExecution('fail-op', 'task', () => {
          advanceClock(30);
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      const times = collector.getExecutionTimes();
      expect(times).toHaveLength(1);
      expect(times[0]!.success).toBe(false);
      expect(times[0]!.durationMs).toBe(30);
    });

    it('should time async operations', async () => {
      const result = await collector.timeExecution('async-op', 'agent', async () => {
        advanceClock(200);
        return 'hello';
      });

      expect(result).toBe('hello');
      const times = collector.getExecutionTimes();
      expect(times[0]!.durationMs).toBe(200);
      expect(times[0]!.category).toBe('agent');
    });
  });

  describe('getExecutionTimesByCategory', () => {
    it('should filter by category', () => {
      collector.recordExecutionTime(makeExecutionTimeInput({ category: 'task' }));
      collector.recordExecutionTime(makeExecutionTimeInput({ category: 'agent' }));
      collector.recordExecutionTime(makeExecutionTimeInput({ category: 'task' }));

      const tasks = collector.getExecutionTimesByCategory('task');
      expect(tasks).toHaveLength(2);
      expect(tasks.every((m) => m.category === 'task')).toBe(true);
    });
  });

  describe('getExecutionTimeSummary', () => {
    it('should return empty summary when no measurements', () => {
      const summary = collector.getExecutionTimeSummary();
      expect(summary.count).toBe(0);
    });

    it('should return aggregated summary', () => {
      collector.recordExecutionTime(makeExecutionTimeInput({ durationMs: 100 }));
      collector.recordExecutionTime(makeExecutionTimeInput({ durationMs: 200 }));

      const summary = collector.getExecutionTimeSummary();
      expect(summary.count).toBe(2);
      expect(summary.totalMs).toBe(300);
      expect(summary.avgMs).toBe(150);
    });
  });

  describe('execution time eviction', () => {
    it('should evict oldest measurements when cap is exceeded', () => {
      const small = new MetricsCollector({ maxExecutionTimeMeasurements: 3, now: fakeClock });

      small.recordExecutionTime(makeExecutionTimeInput({ label: 'a' }));
      small.recordExecutionTime(makeExecutionTimeInput({ label: 'b' }));
      small.recordExecutionTime(makeExecutionTimeInput({ label: 'c' }));
      small.recordExecutionTime(makeExecutionTimeInput({ label: 'd' }));

      const times = small.getExecutionTimes();
      expect(times).toHaveLength(3);
      expect(times.map((t) => t.label)).toEqual(['b', 'c', 'd']);
    });
  });

  // -----------------------------------------------------------------------
  // Memory Measurement
  // -----------------------------------------------------------------------

  describe('measureMemory', () => {
    it('should delegate to memory tracker', async () => {
      const result = await collector.measureMemory('alloc', () => {
        return Array.from({ length: 100 }, (_, i) => i);
      });

      expect(result.label).toBe('alloc');
      expect(result.result).toHaveLength(100);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should expose memory tracker', () => {
      expect(collector.memoryTracker).toBeDefined();
      expect(collector.memoryTracker.measurementCount).toBe(0);
    });
  });

  describe('getMemorySummary', () => {
    it('should return empty summary when no measurements', () => {
      const summary = collector.getMemorySummary();
      expect(summary.count).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Token Efficiency
  // -----------------------------------------------------------------------

  describe('recordTokenUsage', () => {
    it('should delegate to token tracker', () => {
      const record = collector.recordTokenUsage({
        operationType: 'llm-call',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        durationMs: 1000,
      });

      expect(record.id).toBe('tok-1');
      expect(record.totalTokens).toBe(150);
    });

    it('should expose token tracker', () => {
      expect(collector.tokenTracker).toBeDefined();
      expect(collector.tokenTracker.recordCount).toBe(0);
    });
  });

  describe('getTokenEfficiencyReport', () => {
    it('should return empty report when no records', () => {
      const report = collector.getTokenEfficiencyReport();
      expect(report.operationCount).toBe(0);
    });

    it('should return aggregated report', () => {
      collector.recordTokenUsage({
        operationType: 'llm-call',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        durationMs: 1000,
      });

      const report = collector.getTokenEfficiencyReport();
      expect(report.operationCount).toBe(1);
      expect(report.totalTokens).toBe(150);
    });
  });

  // -----------------------------------------------------------------------
  // Complexity Analysis
  // -----------------------------------------------------------------------

  describe('analyzeWorkflow', () => {
    it('should analyze and cache complexity report', () => {
      const report = collector.analyzeWorkflow(makeWorkflow());

      expect(report.agentCount).toBe(1);
      expect(report.taskCount).toBe(1);
      expect(report.complexityGrade).toBe('trivial');
    });

    it('should return cached report via getComplexityReport', () => {
      expect(collector.getComplexityReport()).toBeNull();

      collector.analyzeWorkflow(makeWorkflow());
      expect(collector.getComplexityReport()).not.toBeNull();
    });

    it('should overwrite previous report', () => {
      collector.analyzeWorkflow(
        makeWorkflow({
          agents: [{ id: 'a', toolCount: 0, hasLLMProvider: true, hasBackstory: false }],
          tasks: [{ id: 't', agentId: 'a', dependencies: [], hasTimeout: false, hasRetry: false }],
        }),
      );
      const r1 = collector.getComplexityReport()!;
      expect(r1.taskCount).toBe(1);

      collector.analyzeWorkflow(
        makeWorkflow({
          agents: [{ id: 'a', toolCount: 0, hasLLMProvider: true, hasBackstory: false }],
          tasks: [
            { id: 't1', agentId: 'a', dependencies: [], hasTimeout: false, hasRetry: false },
            { id: 't2', agentId: 'a', dependencies: [], hasTimeout: false, hasRetry: false },
          ],
        }),
      );
      const r2 = collector.getComplexityReport()!;
      expect(r2.taskCount).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // Unified Report
  // -----------------------------------------------------------------------

  describe('getReport', () => {
    it('should return a unified report with all dimensions', () => {
      collector.recordExecutionTime(makeExecutionTimeInput());
      collector.recordTokenUsage({
        operationType: 'llm-call',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        durationMs: 1000,
      });
      collector.analyzeWorkflow(makeWorkflow());

      const report = collector.getReport();

      expect(report.executionTime.count).toBe(1);
      expect(report.tokenEfficiency.operationCount).toBe(1);
      expect(report.complexity).not.toBeNull();
      expect(report.generatedAt).toBeDefined();
    });

    it('should return null complexity when no workflow analyzed', () => {
      const report = collector.getReport();
      expect(report.complexity).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Reset
  // -----------------------------------------------------------------------

  describe('reset', () => {
    it('should clear all collected metrics', async () => {
      collector.recordExecutionTime(makeExecutionTimeInput());
      await collector.measureMemory('op', () => {});
      collector.recordTokenUsage({
        operationType: 'llm-call',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        durationMs: 1000,
      });
      collector.analyzeWorkflow(makeWorkflow());

      collector.reset();

      expect(collector.getExecutionTimes()).toHaveLength(0);
      expect(collector.memoryTracker.measurementCount).toBe(0);
      expect(collector.tokenTracker.recordCount).toBe(0);
      expect(collector.getComplexityReport()).toBeNull();
    });
  });
});
