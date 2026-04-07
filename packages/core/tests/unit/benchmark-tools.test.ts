/**
 * Tests for benchmark regression detection and report generation scripts.
 */

import { describe, it, expect } from 'vitest';

import {
  compareResults,
  formatComparisonTable,
  DEFAULT_REGRESSION_THRESHOLD,
  DEFAULT_WARNING_THRESHOLD,
} from '../../scripts/compare-benchmarks.js';
import type {
  Baseline,
  CurrentResult,
  ComparisonReport,
} from '../../scripts/compare-benchmarks.js';
import { generateReport } from '../../scripts/generate-perf-report.js';
import { buildBaseline } from '../../scripts/update-baseline.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBaseline(
  entries: Record<string, { p95Ms: number; avgMs: number; budget: number }>,
): Baseline {
  return {
    version: 1,
    timestamp: '2026-01-01T00:00:00.000Z',
    entries,
  };
}

function makeResult(
  name: string,
  p95Ms: number,
  budget: number,
  avgMs: number = p95Ms * 0.7,
): CurrentResult {
  return { name, p95Ms, avgMs, budget, withinBudget: p95Ms <= budget };
}

// ---------------------------------------------------------------------------
// compareResults
// ---------------------------------------------------------------------------

describe('compareResults', () => {
  it('should mark all as pass when within threshold', () => {
    const baseline = makeBaseline({
      'Agent init': { p95Ms: 1.0, avgMs: 0.5, budget: 100 },
      'Memory add': { p95Ms: 0.5, avgMs: 0.3, budget: 50 },
    });
    const current: CurrentResult[] = [
      makeResult('Agent init', 1.02, 100),
      makeResult('Memory add', 0.48, 50),
    ];

    const report = compareResults(baseline, current);

    expect(report.hasRegression).toBe(false);
    expect(report.hasWarning).toBe(false);
    expect(report.entries).toHaveLength(2);
    expect(report.entries[0]!.status).toBe('pass');
    expect(report.entries[1]!.status).toBe('pass');
  });

  it('should detect regression beyond threshold', () => {
    const baseline = makeBaseline({
      'Agent init': { p95Ms: 1.0, avgMs: 0.5, budget: 100 },
    });
    const current: CurrentResult[] = [
      makeResult('Agent init', 1.2, 100), // 20% regression
    ];

    const report = compareResults(baseline, current);

    expect(report.hasRegression).toBe(true);
    expect(report.entries[0]!.status).toBe('regression');
    expect(report.entries[0]!.changePercent).toBeCloseTo(20, 1);
  });

  it('should detect warning (5-15% regression)', () => {
    const baseline = makeBaseline({
      'Task init': { p95Ms: 1.0, avgMs: 0.5, budget: 100 },
    });
    const current: CurrentResult[] = [
      makeResult('Task init', 1.1, 100), // 10% regression
    ];

    const report = compareResults(baseline, current);

    expect(report.hasRegression).toBe(false);
    expect(report.hasWarning).toBe(true);
    expect(report.entries[0]!.status).toBe('warning');
    expect(report.entries[0]!.changePercent).toBeCloseTo(10, 1);
  });

  it('should detect improvement (>5% faster)', () => {
    const baseline = makeBaseline({
      'Memory get': { p95Ms: 1.0, avgMs: 0.5, budget: 50 },
    });
    const current: CurrentResult[] = [
      makeResult('Memory get', 0.8, 50), // 20% improvement
    ];

    const report = compareResults(baseline, current);

    expect(report.hasRegression).toBe(false);
    expect(report.entries[0]!.status).toBe('improvement');
    expect(report.entries[0]!.changePercent).toBeCloseTo(-20, 1);
  });

  it('should mark new benchmarks as "new"', () => {
    const baseline = makeBaseline({});
    const current: CurrentResult[] = [makeResult('New bench', 1.0, 100)];

    const report = compareResults(baseline, current);

    expect(report.entries[0]!.status).toBe('new');
    expect(report.entries[0]!.baselineP95).toBeNull();
    expect(report.entries[0]!.changePercent).toBeNull();
  });

  it('should handle empty results', () => {
    const baseline = makeBaseline({
      'Agent init': { p95Ms: 1.0, avgMs: 0.5, budget: 100 },
    });

    const report = compareResults(baseline, []);

    expect(report.entries).toHaveLength(0);
    expect(report.hasRegression).toBe(false);
    expect(report.summary).toContain('0 benchmarks');
  });

  it('should handle mixed results', () => {
    const baseline = makeBaseline({
      'Bench A': { p95Ms: 1.0, avgMs: 0.5, budget: 100 },
      'Bench B': { p95Ms: 1.0, avgMs: 0.5, budget: 100 },
      'Bench C': { p95Ms: 1.0, avgMs: 0.5, budget: 100 },
    });
    const current: CurrentResult[] = [
      makeResult('Bench A', 0.5, 100), // improvement
      makeResult('Bench B', 1.1, 100), // warning
      makeResult('Bench C', 1.3, 100), // regression
      makeResult('Bench D', 0.5, 100), // new
    ];

    const report = compareResults(baseline, current);

    expect(report.hasRegression).toBe(true);
    expect(report.hasWarning).toBe(true);
    expect(report.entries[0]!.status).toBe('improvement');
    expect(report.entries[1]!.status).toBe('warning');
    expect(report.entries[2]!.status).toBe('regression');
    expect(report.entries[3]!.status).toBe('new');
    expect(report.summary).toContain('1 improved');
    expect(report.summary).toContain('1 warnings');
    expect(report.summary).toContain('1 regressions');
    expect(report.summary).toContain('1 new');
  });

  it('should respect custom thresholds', () => {
    const baseline = makeBaseline({
      'Bench A': { p95Ms: 1.0, avgMs: 0.5, budget: 100 },
    });
    const current: CurrentResult[] = [
      makeResult('Bench A', 1.08, 100), // 8% regression
    ];

    // With default thresholds: warning (5-15%)
    const defaultReport = compareResults(baseline, current);
    expect(defaultReport.entries[0]!.status).toBe('warning');

    // With higher threshold: pass
    const lenientReport = compareResults(baseline, current, 20, 10);
    expect(lenientReport.entries[0]!.status).toBe('pass');

    // With lower threshold: regression
    const strictReport = compareResults(baseline, current, 5, 2);
    expect(strictReport.entries[0]!.status).toBe('regression');
  });

  it('should handle zero baseline p95 gracefully', () => {
    const baseline = makeBaseline({
      'Fast op': { p95Ms: 0, avgMs: 0, budget: 50 },
    });
    const current: CurrentResult[] = [makeResult('Fast op', 0.001, 50)];

    const report = compareResults(baseline, current);

    expect(report.entries[0]!.status).toBe('pass');
    expect(report.entries[0]!.changePercent).toBe(0);
  });

  it('should use correct default thresholds', () => {
    expect(DEFAULT_WARNING_THRESHOLD).toBe(5);
    expect(DEFAULT_REGRESSION_THRESHOLD).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// formatComparisonTable
// ---------------------------------------------------------------------------

describe('formatComparisonTable', () => {
  it('should produce markdown table for all-pass report', () => {
    const report: ComparisonReport = {
      entries: [
        {
          name: 'Agent init',
          baselineP95: 1.0,
          currentP95: 0.95,
          changePercent: -5,
          budget: 100,
          status: 'pass',
        },
      ],
      hasRegression: false,
      hasWarning: false,
      summary: '1 benchmarks compared, 1 passed',
    };

    const table = formatComparisonTable(report);

    expect(table).toContain('## Performance Regression Report');
    expect(table).toContain('1 benchmarks compared');
    expect(table).toContain('Agent init');
    expect(table).toContain('1.000ms');
    expect(table).toContain('0.950ms');
    expect(table).toContain('✅ **All benchmarks within acceptable range.**');
  });

  it('should include regression warning in output', () => {
    const report: ComparisonReport = {
      entries: [
        {
          name: 'Slow bench',
          baselineP95: 1.0,
          currentP95: 2.0,
          changePercent: 100,
          budget: 50,
          status: 'regression',
        },
      ],
      hasRegression: true,
      hasWarning: false,
      summary: '1 benchmarks compared, 1 regressions',
    };

    const table = formatComparisonTable(report);

    expect(table).toContain('❌ **Regressions detected.**');
    expect(table).toContain('+100.0%');
  });

  it('should show "new" for benchmarks without baseline', () => {
    const report: ComparisonReport = {
      entries: [
        {
          name: 'New bench',
          baselineP95: null,
          currentP95: 0.5,
          changePercent: null,
          budget: 50,
          status: 'new',
        },
      ],
      hasRegression: false,
      hasWarning: false,
      summary: '1 benchmarks compared, 1 new',
    };

    const table = formatComparisonTable(report);

    expect(table).toContain('🆕');
    expect(table).toContain('new');
    expect(table).toContain('—');
  });

  it('should include warning message when warnings present', () => {
    const report: ComparisonReport = {
      entries: [
        {
          name: 'Warn bench',
          baselineP95: 1.0,
          currentP95: 1.1,
          changePercent: 10,
          budget: 100,
          status: 'warning',
        },
      ],
      hasRegression: false,
      hasWarning: true,
      summary: '1 benchmarks compared, 1 warnings',
    };

    const table = formatComparisonTable(report);

    expect(table).toContain('⚠️ **Warnings detected.**');
  });
});

// ---------------------------------------------------------------------------
// generateReport
// ---------------------------------------------------------------------------

describe('generateReport', () => {
  it('should generate a performance dashboard with categories', () => {
    const results: CurrentResult[] = [
      makeResult('Agent init', 0.05, 100),
      makeResult('Memory add', 0.02, 50),
      makeResult('Task init', 0.08, 100),
      makeResult('Engine run', 0.5, 5000),
      makeResult('Tool execute', 0.01, 50),
    ];

    const report = generateReport(results);

    expect(report.totalBenchmarks).toBe(5);
    expect(report.allWithinBudget).toBe(true);
    expect(report.categories.has('Agent')).toBe(true);
    expect(report.categories.has('Memory')).toBe(true);
    expect(report.categories.has('Task')).toBe(true);
    expect(report.categories.has('Engine')).toBe(true);
    expect(report.categories.has('Tool')).toBe(true);
    expect(report.markdown).toContain('# Crewspace Performance Dashboard');
  });

  it('should include trend data when baseline is provided', () => {
    const baseline = makeBaseline({
      'Agent init': { p95Ms: 1.0, avgMs: 0.5, budget: 100 },
    });
    const results: CurrentResult[] = [
      makeResult('Agent init', 0.5, 100), // much faster
    ];

    const report = generateReport(results, baseline);

    const agentEntries = report.categories.get('Agent');
    expect(agentEntries).toBeDefined();
    expect(agentEntries![0]!.trend).toBe('faster');
    expect(agentEntries![0]!.baselineP95).toBe(1.0);
  });

  it('should mark exceeding-budget benchmarks', () => {
    const results: CurrentResult[] = [
      makeResult('Agent init', 200, 100), // exceeds budget
    ];

    const report = generateReport(results);

    expect(report.allWithinBudget).toBe(false);
    expect(report.markdown).toContain('❌ Some benchmarks exceed budget');
  });

  it('should mark new benchmarks with "new" trend', () => {
    const baseline = makeBaseline({});
    const results: CurrentResult[] = [makeResult('Agent init', 0.5, 100)];

    const report = generateReport(results, baseline);

    const agentEntries = report.categories.get('Agent');
    expect(agentEntries![0]!.trend).toBe('new');
  });

  it('should generate markdown with trend legend', () => {
    const results: CurrentResult[] = [makeResult('Agent init', 0.5, 100)];

    const report = generateReport(results);

    expect(report.markdown).toContain('### Trend Legend');
    expect(report.markdown).toContain('🚀');
    expect(report.markdown).toContain('🐢');
    expect(report.markdown).toContain('🆕');
  });
});

// ---------------------------------------------------------------------------
// buildBaseline
// ---------------------------------------------------------------------------

describe('buildBaseline', () => {
  it('should create a baseline from results', () => {
    const results = [
      { name: 'Bench A', p95Ms: 1.5, avgMs: 0.8, budget: 100 },
      { name: 'Bench B', p95Ms: 0.3, avgMs: 0.1, budget: 50 },
    ];

    const baseline = buildBaseline(results);

    expect(baseline.version).toBe(1);
    expect(baseline.timestamp).toBeDefined();
    expect(baseline.entries['Bench A']).toEqual({
      p95Ms: 1.5,
      avgMs: 0.8,
      budget: 100,
    });
    expect(baseline.entries['Bench B']).toEqual({
      p95Ms: 0.3,
      avgMs: 0.1,
      budget: 50,
    });
  });

  it('should handle empty results', () => {
    const baseline = buildBaseline([]);

    expect(baseline.version).toBe(1);
    expect(Object.keys(baseline.entries)).toHaveLength(0);
  });
});
