/**
 * Tests for the BenchmarkSuite methodology module.
 *
 * Validates the suite runner, statistical helpers, regression detection,
 * scenario management, and report formatting.
 */

import { describe, it, expect, vi } from 'vitest';

import {
  BenchmarkSuite,
  percentile,
  standardDeviation,
  runScenario,
  checkRegressions,
  formatScenarioResult,
  formatSuiteMarkdown,
  formatRegressionMarkdown,
  DEFAULT_WARNING_THRESHOLD,
  DEFAULT_REGRESSION_THRESHOLD,
} from '../../benchmarks/suite.js';
import type {
  BenchmarkScenario,
  BenchmarkScenarioResult,
  Baseline,
  RegressionReport,
} from '../../benchmarks/suite.js';

// ---------------------------------------------------------------------------
// Statistical helpers
// ---------------------------------------------------------------------------

describe('percentile()', () => {
  it('should return 0 for an empty array', () => {
    expect(percentile([], 0.5)).toBe(0);
  });

  it('should return the median for a sorted array', () => {
    const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentile(sorted, 0.5)).toBe(6);
  });

  it('should return the p95 value', () => {
    const sorted = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(percentile(sorted, 0.95)).toBe(96);
  });

  it('should return the last element for p99 on a small array', () => {
    const sorted = [1, 2, 3];
    expect(percentile(sorted, 0.99)).toBe(3);
  });

  it('should return the single element for any percentile on length-1 array', () => {
    expect(percentile([42], 0.0)).toBe(42);
    expect(percentile([42], 0.5)).toBe(42);
    expect(percentile([42], 1.0)).toBe(42);
  });
});

describe('standardDeviation()', () => {
  it('should return 0 for an empty array', () => {
    expect(standardDeviation([], 0)).toBe(0);
  });

  it('should return 0 for a single-element array', () => {
    expect(standardDeviation([5], 5)).toBe(0);
  });

  it('should compute sample standard deviation correctly', () => {
    // values: [2, 4, 4, 4, 5, 5, 7, 9], mean = 5
    // sample variance = sum((x-5)^2)/(8-1) = 32/7 ≈ 4.571
    // stddev ≈ 2.138
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    const mean = 5;
    const result = standardDeviation(values, mean);
    expect(result).toBeCloseTo(2.138, 2);
  });

  it('should return 0 when all values are identical', () => {
    const values = [3, 3, 3, 3, 3];
    expect(standardDeviation(values, 3)).toBeCloseTo(0);
  });
});

// ---------------------------------------------------------------------------
// runScenario
// ---------------------------------------------------------------------------

describe('runScenario()', () => {
  it('should run the function the specified number of iterations', async () => {
    let count = 0;
    const scenario: BenchmarkScenario = {
      name: 'counter',
      category: 'Test',
      fn: () => {
        count++;
      },
      iterations: 50,
      warmup: 5,
      budget: 100,
    };

    const result = await runScenario(scenario, { iterations: 1000, warmup: 10 });

    // warmup(5) + measured(50) = 55 calls
    expect(count).toBe(55);
    expect(result.iterations).toBe(50);
    expect(result.name).toBe('counter');
    expect(result.category).toBe('Test');
    expect(result.budget).toBe(100);
  });

  it('should use default iterations/warmup when scenario does not specify', async () => {
    let count = 0;
    const scenario: BenchmarkScenario = {
      name: 'defaults',
      category: 'Test',
      fn: () => {
        count++;
      },
      budget: 100,
    };

    const result = await runScenario(scenario, { iterations: 20, warmup: 3 });

    expect(count).toBe(23); // 3 warmup + 20 measured
    expect(result.iterations).toBe(20);
  });

  it('should call setup and teardown', async () => {
    const calls: string[] = [];
    const scenario: BenchmarkScenario = {
      name: 'lifecycle',
      category: 'Test',
      fn: () => {
        calls.push('fn');
      },
      setup: () => {
        calls.push('setup');
      },
      teardown: () => {
        calls.push('teardown');
      },
      iterations: 2,
      warmup: 1,
      budget: 100,
    };

    await runScenario(scenario, { iterations: 1000, warmup: 10 });

    expect(calls[0]).toBe('setup');
    expect(calls[calls.length - 1]).toBe('teardown');
    // setup + 1 warmup fn + 2 measured fn + teardown = 5
    expect(calls.length).toBe(5);
  });

  it('should produce valid statistical fields', async () => {
    const scenario: BenchmarkScenario = {
      name: 'stats',
      category: 'Test',
      fn: () => {
        /* noop */
      },
      iterations: 100,
      warmup: 5,
      budget: 1000,
    };

    const result = await runScenario(scenario, { iterations: 1000, warmup: 10 });

    expect(result.avgMs).toBeGreaterThanOrEqual(0);
    expect(result.minMs).toBeLessThanOrEqual(result.avgMs);
    expect(result.maxMs).toBeGreaterThanOrEqual(result.avgMs);
    expect(result.p50Ms).toBeGreaterThanOrEqual(result.minMs);
    expect(result.p95Ms).toBeGreaterThanOrEqual(result.p50Ms);
    expect(result.p99Ms).toBeGreaterThanOrEqual(result.p95Ms);
    expect(result.stdDevMs).toBeGreaterThanOrEqual(0);
    expect(result.opsPerSecond).toBeGreaterThan(0);
    expect(result.totalMs).toBeGreaterThanOrEqual(0);
    expect(result.withinBudget).toBe(true);
  });

  it('should mark withinBudget as false when p95 exceeds budget', async () => {
    const scenario: BenchmarkScenario = {
      name: 'slow',
      category: 'Test',
      fn: async () => {
        await new Promise((r) => setTimeout(r, 5));
      },
      iterations: 10,
      warmup: 1,
      budget: 0.001, // impossibly tight budget
    };

    const result = await runScenario(scenario, { iterations: 100, warmup: 5 });

    expect(result.withinBudget).toBe(false);
  });

  it('should handle async functions correctly', async () => {
    let val = 0;
    const scenario: BenchmarkScenario = {
      name: 'async',
      category: 'Test',
      fn: async () => {
        await Promise.resolve();
        val++;
      },
      iterations: 10,
      warmup: 2,
      budget: 100,
    };

    const result = await runScenario(scenario, { iterations: 100, warmup: 5 });

    expect(val).toBe(12); // 2 warmup + 10 measured
    expect(result.iterations).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// checkRegressions
// ---------------------------------------------------------------------------

describe('checkRegressions()', () => {
  const makeResult = (name: string, p95Ms: number, budget = 100): BenchmarkScenarioResult => ({
    name,
    category: 'Test',
    iterations: 100,
    totalMs: p95Ms * 100,
    avgMs: p95Ms * 0.8,
    minMs: p95Ms * 0.5,
    maxMs: p95Ms * 1.2,
    p50Ms: p95Ms * 0.7,
    p95Ms,
    p99Ms: p95Ms * 1.1,
    stdDevMs: p95Ms * 0.1,
    opsPerSecond: 1000 / (p95Ms * 0.8),
    budget,
    withinBudget: p95Ms <= budget,
  });

  const baseline: Baseline = {
    version: 1,
    timestamp: '2026-01-01T00:00:00.000Z',
    entries: {
      'stable-bench': { p95Ms: 1.0, avgMs: 0.8, budget: 100 },
      'fast-bench': { p95Ms: 2.0, avgMs: 1.5, budget: 100 },
      'slow-bench': { p95Ms: 1.0, avgMs: 0.8, budget: 100 },
    },
  };

  it('should mark a benchmark as "pass" when within warning threshold', () => {
    const results = [makeResult('stable-bench', 1.04)]; // +4% (below 5% warning)
    const report = checkRegressions(results, baseline);

    expect(report.entries).toHaveLength(1);
    expect(report.entries[0]!.status).toBe('pass');
    expect(report.hasRegression).toBe(false);
    expect(report.hasWarning).toBe(false);
  });

  it('should mark a benchmark as "warning" when between warning and regression threshold', () => {
    const results = [makeResult('stable-bench', 1.1)]; // +10% (5% < x < 15%)
    const report = checkRegressions(results, baseline);

    expect(report.entries[0]!.status).toBe('warning');
    expect(report.hasWarning).toBe(true);
    expect(report.hasRegression).toBe(false);
  });

  it('should mark a benchmark as "regression" when above regression threshold', () => {
    const results = [makeResult('stable-bench', 1.2)]; // +20% (above 15%)
    const report = checkRegressions(results, baseline);

    expect(report.entries[0]!.status).toBe('regression');
    expect(report.hasRegression).toBe(true);
  });

  it('should mark a benchmark as "improvement" when significantly faster', () => {
    const results = [makeResult('fast-bench', 1.8)]; // -10% (below -5%)
    const report = checkRegressions(results, baseline);

    expect(report.entries[0]!.status).toBe('improvement');
    expect(report.hasRegression).toBe(false);
  });

  it('should mark a benchmark as "new" when not in baseline', () => {
    const results = [makeResult('brand-new-bench', 0.5)];
    const report = checkRegressions(results, baseline);

    expect(report.entries[0]!.status).toBe('new');
    expect(report.entries[0]!.baselineP95).toBeNull();
    expect(report.entries[0]!.changePercent).toBeNull();
  });

  it('should handle multiple results with mixed statuses', () => {
    const results = [
      makeResult('stable-bench', 1.0), // pass
      makeResult('fast-bench', 1.5), // improvement (-25%)
      makeResult('slow-bench', 1.2), // regression (+20%)
      makeResult('unknown', 0.5), // new
    ];
    const report = checkRegressions(results, baseline);

    expect(report.entries).toHaveLength(4);
    expect(report.hasRegression).toBe(true);
    expect(report.summary).toContain('4 benchmarks compared');
    expect(report.summary).toContain('regressions');
  });

  it('should respect custom thresholds', () => {
    const results = [makeResult('stable-bench', 1.06)]; // +6%
    // With default thresholds (5/15), this would be "warning"
    // With custom thresholds (10/20), this should be "pass"
    const report = checkRegressions(results, baseline, 10, 20);

    expect(report.entries[0]!.status).toBe('pass');
  });

  it('should export default threshold constants', () => {
    expect(DEFAULT_WARNING_THRESHOLD).toBe(5);
    expect(DEFAULT_REGRESSION_THRESHOLD).toBe(15);
  });

  it('should handle zero baseline p95Ms gracefully', () => {
    const zeroBaseline: Baseline = {
      version: 1,
      timestamp: '2026-01-01T00:00:00.000Z',
      entries: {
        'zero-bench': { p95Ms: 0, avgMs: 0, budget: 100 },
      },
    };
    const results = [makeResult('zero-bench', 0.5)];
    const report = checkRegressions(results, zeroBaseline);

    // changePercent should be 0 when baseline p95 is 0
    expect(report.entries[0]!.changePercent).toBe(0);
    expect(report.entries[0]!.status).toBe('pass');
  });
});

// ---------------------------------------------------------------------------
// BenchmarkSuite class
// ---------------------------------------------------------------------------

describe('BenchmarkSuite', () => {
  describe('construction and scenario management', () => {
    it('should create a suite with the given name', () => {
      const suite = new BenchmarkSuite({ name: 'Test Suite' });
      expect(suite.name).toBe('Test Suite');
      expect(suite.size).toBe(0);
    });

    it('should add scenarios and track them', () => {
      const suite = new BenchmarkSuite({ name: 'Test' });
      const scenario: BenchmarkScenario = {
        name: 'bench-1',
        category: 'Cat',
        fn: () => {},
        budget: 50,
      };

      suite.add(scenario);

      expect(suite.size).toBe(1);
      expect(suite.scenarios).toHaveLength(1);
      expect(suite.scenarios[0]!.name).toBe('bench-1');
    });

    it('should support chained .add() calls', () => {
      const suite = new BenchmarkSuite({ name: 'Test' });
      const result = suite
        .add({ name: 'a', category: 'Cat', fn: () => {}, budget: 50 })
        .add({ name: 'b', category: 'Cat', fn: () => {}, budget: 50 });

      expect(result).toBe(suite);
      expect(suite.size).toBe(2);
    });

    it('should add multiple scenarios with addAll()', () => {
      const suite = new BenchmarkSuite({ name: 'Test' });
      suite.addAll([
        { name: 'a', category: 'Cat', fn: () => {}, budget: 50 },
        { name: 'b', category: 'Dog', fn: () => {}, budget: 100 },
      ]);

      expect(suite.size).toBe(2);
    });

    it('should remove a scenario by name', () => {
      const suite = new BenchmarkSuite({ name: 'Test' });
      suite.add({ name: 'keep', category: 'A', fn: () => {}, budget: 50 });
      suite.add({ name: 'remove', category: 'B', fn: () => {}, budget: 50 });

      expect(suite.remove('remove')).toBe(true);
      expect(suite.size).toBe(1);
      expect(suite.scenarios[0]!.name).toBe('keep');
    });

    it('should return false when removing a non-existent scenario', () => {
      const suite = new BenchmarkSuite({ name: 'Test' });
      expect(suite.remove('nope')).toBe(false);
    });

    it('should return distinct categories', () => {
      const suite = new BenchmarkSuite({ name: 'Test' });
      suite.addAll([
        { name: 'a', category: 'Agent', fn: () => {}, budget: 50 },
        { name: 'b', category: 'Memory', fn: () => {}, budget: 50 },
        { name: 'c', category: 'Agent', fn: () => {}, budget: 50 },
      ]);

      const categories = suite.getCategories();
      expect(categories).toEqual(['Agent', 'Memory']);
    });

    it('should filter scenarios by category', () => {
      const suite = new BenchmarkSuite({ name: 'Test' });
      suite.addAll([
        { name: 'a', category: 'Agent', fn: () => {}, budget: 50 },
        { name: 'b', category: 'Memory', fn: () => {}, budget: 50 },
        { name: 'c', category: 'Agent', fn: () => {}, budget: 50 },
      ]);

      const agentScenarios = suite.getByCategory('Agent');
      expect(agentScenarios).toHaveLength(2);
      expect(agentScenarios.every((s) => s.category === 'Agent')).toBe(true);
    });

    it('should return a defensive copy of scenarios', () => {
      const suite = new BenchmarkSuite({ name: 'Test' });
      suite.add({ name: 'a', category: 'X', fn: () => {}, budget: 50 });

      const snap = suite.scenarios;
      expect(snap).toHaveLength(1);

      // Mutating the snapshot should not affect the suite
      (snap as BenchmarkScenario[]).push({ name: 'b', category: 'Y', fn: () => {}, budget: 50 });
      expect(suite.size).toBe(1);
    });
  });

  describe('run()', () => {
    it('should run all scenarios and return aggregated results', async () => {
      const suite = new BenchmarkSuite({
        name: 'Run Test',
        defaultIterations: 10,
        defaultWarmup: 2,
      });

      suite.addAll([
        { name: 'fast', category: 'A', fn: () => {}, budget: 1000 },
        { name: 'also-fast', category: 'B', fn: () => {}, budget: 1000 },
      ]);

      const result = await suite.run();

      expect(result.suiteName).toBe('Run Test');
      expect(result.results).toHaveLength(2);
      expect(result.passCount).toBe(2);
      expect(result.failCount).toBe(0);
      expect(result.allWithinBudget).toBe(true);
      expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeTruthy();
    });

    it('should group results by category in the categories map', async () => {
      const suite = new BenchmarkSuite({
        name: 'Categories Test',
        defaultIterations: 5,
        defaultWarmup: 1,
      });

      suite.addAll([
        { name: 'a1', category: 'Alpha', fn: () => {}, budget: 1000 },
        { name: 'b1', category: 'Beta', fn: () => {}, budget: 1000 },
        { name: 'a2', category: 'Alpha', fn: () => {}, budget: 1000 },
      ]);

      const result = await suite.run();

      expect(result.categories.get('Alpha')).toHaveLength(2);
      expect(result.categories.get('Beta')).toHaveLength(1);
    });

    it('should track pass/fail counts correctly', async () => {
      const suite = new BenchmarkSuite({
        name: 'PassFail',
        defaultIterations: 10,
        defaultWarmup: 1,
      });

      suite.addAll([
        { name: 'pass', category: 'T', fn: () => {}, budget: 1000 },
        {
          name: 'fail',
          category: 'T',
          fn: async () => {
            await new Promise((r) => setTimeout(r, 5));
          },
          budget: 0.001,
        },
      ]);

      const result = await suite.run();

      expect(result.passCount).toBe(1);
      expect(result.failCount).toBe(1);
      expect(result.allWithinBudget).toBe(false);
    });

    it('should invoke onScenarioComplete hook for each scenario', async () => {
      const completed: string[] = [];
      const suite = new BenchmarkSuite({
        name: 'Hook Test',
        defaultIterations: 5,
        defaultWarmup: 1,
        onScenarioComplete: (r) => completed.push(r.name),
      });

      suite.addAll([
        { name: 'first', category: 'T', fn: () => {}, budget: 1000 },
        { name: 'second', category: 'T', fn: () => {}, budget: 1000 },
      ]);

      await suite.run();

      expect(completed).toEqual(['first', 'second']);
    });

    it('should invoke the reporter with the final suite result', async () => {
      const reporterFn = vi.fn();
      const suite = new BenchmarkSuite({
        name: 'Reporter Test',
        defaultIterations: 5,
        defaultWarmup: 1,
        reporter: reporterFn,
      });

      suite.add({ name: 'bench', category: 'T', fn: () => {}, budget: 1000 });
      const result = await suite.run();

      expect(reporterFn).toHaveBeenCalledTimes(1);
      expect(reporterFn).toHaveBeenCalledWith(result);
    });

    it('should return an empty suite result when no scenarios are registered', async () => {
      const suite = new BenchmarkSuite({ name: 'Empty' });
      const result = await suite.run();

      expect(result.results).toHaveLength(0);
      expect(result.passCount).toBe(0);
      expect(result.failCount).toBe(0);
      expect(result.allWithinBudget).toBe(true);
    });
  });

  describe('runWithRegression()', () => {
    it('should run the suite and detect regressions against baseline', async () => {
      const suite = new BenchmarkSuite({
        name: 'Regression Test',
        defaultIterations: 5,
        defaultWarmup: 1,
      });

      suite.add({ name: 'known-bench', category: 'T', fn: () => {}, budget: 1000 });

      const baseline: Baseline = {
        version: 1,
        timestamp: '2026-01-01T00:00:00.000Z',
        entries: {
          'known-bench': { p95Ms: 0.001, avgMs: 0.001, budget: 1000 },
        },
      };

      const { suiteResult, regressionReport } = await suite.runWithRegression(baseline);

      expect(suiteResult.results).toHaveLength(1);
      expect(regressionReport.entries).toHaveLength(1);
      // We can't predict exact timing, but the structure should be correct
      expect(regressionReport.entries[0]!.name).toBe('known-bench');
      expect(regressionReport.entries[0]!.baselineP95).toBe(0.001);
    });

    it('should flag new benchmarks not in baseline', async () => {
      const suite = new BenchmarkSuite({
        name: 'New Bench',
        defaultIterations: 5,
        defaultWarmup: 1,
      });

      suite.add({ name: 'new-only', category: 'T', fn: () => {}, budget: 1000 });

      const baseline: Baseline = {
        version: 1,
        timestamp: '2026-01-01T00:00:00.000Z',
        entries: {},
      };

      const { regressionReport } = await suite.runWithRegression(baseline);

      expect(regressionReport.entries[0]!.status).toBe('new');
      expect(regressionReport.hasRegression).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

describe('formatScenarioResult()', () => {
  const makeResult = (overrides?: Partial<BenchmarkScenarioResult>): BenchmarkScenarioResult => ({
    name: 'Test Bench',
    category: 'Test',
    iterations: 100,
    totalMs: 10,
    avgMs: 0.1,
    minMs: 0.05,
    maxMs: 0.2,
    p50Ms: 0.08,
    p95Ms: 0.15,
    p99Ms: 0.18,
    stdDevMs: 0.03,
    opsPerSecond: 10000,
    budget: 50,
    withinBudget: true,
    ...overrides,
  });

  it('should include PASS status when within budget', () => {
    const output = formatScenarioResult(makeResult());
    expect(output).toContain('PASS');
    expect(output).toContain('Test Bench');
    expect(output).toContain('[Test]');
  });

  it('should include FAIL status when over budget', () => {
    const output = formatScenarioResult(makeResult({ withinBudget: false }));
    expect(output).toContain('FAIL');
  });

  it('should include all statistical fields', () => {
    const output = formatScenarioResult(makeResult());
    expect(output).toContain('avg:');
    expect(output).toContain('p50:');
    expect(output).toContain('p95:');
    expect(output).toContain('p99:');
    expect(output).toContain('min:');
    expect(output).toContain('max:');
    expect(output).toContain('stddev:');
    expect(output).toContain('ops/s:');
    expect(output).toContain('budget:');
    expect(output).toContain('iterations:');
  });
});

describe('formatSuiteMarkdown()', () => {
  it('should produce valid markdown with headers and tables', () => {
    const categories = new Map([
      [
        'Agent',
        [
          {
            name: 'Agent init',
            category: 'Agent',
            iterations: 100,
            totalMs: 10,
            avgMs: 0.1,
            minMs: 0.05,
            maxMs: 0.2,
            p50Ms: 0.08,
            p95Ms: 0.15,
            p99Ms: 0.18,
            stdDevMs: 0.03,
            opsPerSecond: 10000,
            budget: 100,
            withinBudget: true,
          },
        ],
      ],
    ]);

    const suiteResult = {
      suiteName: 'Core Benchmarks',
      timestamp: '2026-04-07T00:00:00.000Z',
      results: [...categories.values()].flat(),
      passCount: 1,
      failCount: 0,
      allWithinBudget: true,
      totalDurationMs: 500,
      categories,
    };

    const md = formatSuiteMarkdown(suiteResult);

    expect(md).toContain('# Benchmark Suite: Core Benchmarks');
    expect(md).toContain('**Total benchmarks:** 1');
    expect(md).toContain('**Passed:** 1');
    expect(md).toContain('**Failed:** 0');
    expect(md).toContain('## Agent');
    expect(md).toContain('Agent init');
    expect(md).toContain('All within budget');
  });

  it('should show fail indicator when not all within budget', () => {
    const suiteResult = {
      suiteName: 'Failing Suite',
      timestamp: '2026-04-07T00:00:00.000Z',
      results: [],
      passCount: 0,
      failCount: 1,
      allWithinBudget: false,
      totalDurationMs: 100,
      categories: new Map(),
    };

    const md = formatSuiteMarkdown(suiteResult);
    expect(md).toContain('Some benchmarks exceed budget');
  });
});

describe('formatRegressionMarkdown()', () => {
  it('should produce a markdown table with statuses', () => {
    const report: RegressionReport = {
      entries: [
        {
          name: 'bench-a',
          currentP95: 1.0,
          baselineP95: 1.0,
          changePercent: 0,
          budget: 100,
          status: 'pass',
        },
        {
          name: 'bench-b',
          currentP95: 0.5,
          baselineP95: 1.0,
          changePercent: -50,
          budget: 100,
          status: 'improvement',
        },
        {
          name: 'bench-c',
          currentP95: 2.0,
          baselineP95: null,
          changePercent: null,
          budget: 100,
          status: 'new',
        },
      ],
      hasRegression: false,
      hasWarning: false,
      summary: '3 benchmarks compared, 1 passed, 1 improved, 1 new',
    };

    const md = formatRegressionMarkdown(report);

    expect(md).toContain('## Regression Analysis');
    expect(md).toContain('bench-a');
    expect(md).toContain('bench-b');
    expect(md).toContain('bench-c');
    expect(md).toContain('All benchmarks within acceptable range');
  });

  it('should show regression message when regressions exist', () => {
    const report: RegressionReport = {
      entries: [
        {
          name: 'slow',
          currentP95: 5.0,
          baselineP95: 1.0,
          changePercent: 400,
          budget: 10,
          status: 'regression',
        },
      ],
      hasRegression: true,
      hasWarning: false,
      summary: '1 benchmarks compared, 1 regressions',
    };

    const md = formatRegressionMarkdown(report);
    expect(md).toContain('Regressions detected');
  });

  it('should show warning message when only warnings exist', () => {
    const report: RegressionReport = {
      entries: [
        {
          name: 'warn',
          currentP95: 1.1,
          baselineP95: 1.0,
          changePercent: 10,
          budget: 100,
          status: 'warning',
        },
      ],
      hasRegression: false,
      hasWarning: true,
      summary: '1 benchmarks compared, 1 warnings',
    };

    const md = formatRegressionMarkdown(report);
    expect(md).toContain('Warnings detected');
  });
});
