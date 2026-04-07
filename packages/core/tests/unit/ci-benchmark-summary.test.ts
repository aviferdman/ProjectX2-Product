/**
 * Tests for CI summary formatting and annotation generation.
 */

import { describe, it, expect } from 'vitest';

import {
  generateCISummary,
  generateAnnotations,
  generateBudgetAnnotations,
  formatAnnotation,
} from '../../scripts/format-ci-summary.js';
import type { CISummaryOptions } from '../../scripts/format-ci-summary.js';
import type {
  Baseline,
  CurrentResult,
  ComparisonReport,
} from '../../scripts/compare-benchmarks.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBaseline(
  entries: Record<string, { p95Ms: number; avgMs: number; budget: number }>,
): Baseline {
  return { version: 1, timestamp: '2026-01-01T00:00:00.000Z', entries };
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
// formatAnnotation
// ---------------------------------------------------------------------------

describe('formatAnnotation', () => {
  it('should format error annotation', () => {
    const result = formatAnnotation('error', 'Something broke');
    expect(result).toBe('::error::Something broke');
  });

  it('should format warning annotation', () => {
    const result = formatAnnotation('warning', 'Heads up');
    expect(result).toBe('::warning::Heads up');
  });

  it('should format notice annotation', () => {
    const result = formatAnnotation('notice', 'FYI');
    expect(result).toBe('::notice::FYI');
  });
});

// ---------------------------------------------------------------------------
// generateBudgetAnnotations
// ---------------------------------------------------------------------------

describe('generateBudgetAnnotations', () => {
  it('should return empty array when all within budget', () => {
    const results: CurrentResult[] = [
      makeResult('Agent init', 0.5, 100),
      makeResult('Memory add', 0.2, 50),
    ];

    const annotations = generateBudgetAnnotations(results);

    expect(annotations).toHaveLength(0);
  });

  it('should generate annotations for exceeded budgets', () => {
    const results: CurrentResult[] = [
      makeResult('Agent init', 150, 100), // exceeds
      makeResult('Memory add', 0.2, 50), // within
      makeResult('Tool exec', 75, 50), // exceeds
    ];

    const annotations = generateBudgetAnnotations(results);

    expect(annotations).toHaveLength(2);
    expect(annotations[0]).toContain('::error::');
    expect(annotations[0]).toContain('Agent init');
    expect(annotations[0]).toContain('150.000ms');
    expect(annotations[0]).toContain('100ms');
    expect(annotations[1]).toContain('Tool exec');
  });
});

// ---------------------------------------------------------------------------
// generateAnnotations (regression-based)
// ---------------------------------------------------------------------------

describe('generateAnnotations', () => {
  it('should return empty for all-pass report', () => {
    const report: ComparisonReport = {
      entries: [
        {
          name: 'Agent init',
          baselineP95: 1.0,
          currentP95: 1.02,
          changePercent: 2,
          budget: 100,
          status: 'pass',
        },
      ],
      hasRegression: false,
      hasWarning: false,
      summary: '1 benchmarks compared, 1 passed',
    };

    const annotations = generateAnnotations(report);

    expect(annotations).toHaveLength(0);
  });

  it('should generate error annotation for regressions', () => {
    const report: ComparisonReport = {
      entries: [
        {
          name: 'Slow bench',
          baselineP95: 1.0,
          currentP95: 1.5,
          changePercent: 50,
          budget: 100,
          status: 'regression',
        },
      ],
      hasRegression: true,
      hasWarning: false,
      summary: '1 benchmarks compared, 1 regressions',
    };

    const annotations = generateAnnotations(report);

    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toContain('::error::');
    expect(annotations[0]).toContain('Performance regression');
    expect(annotations[0]).toContain('Slow bench');
    expect(annotations[0]).toContain('+50.0%');
  });

  it('should generate warning annotation for warnings', () => {
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

    const annotations = generateAnnotations(report);

    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toContain('::warning::');
    expect(annotations[0]).toContain('Performance warning');
    expect(annotations[0]).toContain('Warn bench');
  });

  it('should handle mixed results', () => {
    const report: ComparisonReport = {
      entries: [
        {
          name: 'OK',
          baselineP95: 1.0,
          currentP95: 1.0,
          changePercent: 0,
          budget: 100,
          status: 'pass',
        },
        {
          name: 'Regressed',
          baselineP95: 1.0,
          currentP95: 2.0,
          changePercent: 100,
          budget: 100,
          status: 'regression',
        },
        {
          name: 'Warned',
          baselineP95: 1.0,
          currentP95: 1.1,
          changePercent: 10,
          budget: 100,
          status: 'warning',
        },
        {
          name: 'Improved',
          baselineP95: 1.0,
          currentP95: 0.5,
          changePercent: -50,
          budget: 100,
          status: 'improvement',
        },
        {
          name: 'Brand New',
          baselineP95: null,
          currentP95: 0.5,
          changePercent: null,
          budget: 100,
          status: 'new',
        },
      ],
      hasRegression: true,
      hasWarning: true,
      summary: '5 benchmarks compared',
    };

    const annotations = generateAnnotations(report);

    // Only regressions and warnings get annotations
    expect(annotations).toHaveLength(2);
    expect(annotations[0]).toContain('::error::');
    expect(annotations[0]).toContain('Regressed');
    expect(annotations[1]).toContain('::warning::');
    expect(annotations[1]).toContain('Warned');
  });
});

// ---------------------------------------------------------------------------
// generateCISummary
// ---------------------------------------------------------------------------

describe('generateCISummary', () => {
  it('should generate a summary for all-passing benchmarks', () => {
    const results: CurrentResult[] = [
      makeResult('Agent init', 0.5, 100),
      makeResult('Memory add', 0.2, 50),
    ];

    const summary = generateCISummary({ results });

    expect(summary.totalBenchmarks).toBe(2);
    expect(summary.passCount).toBe(2);
    expect(summary.failCount).toBe(0);
    expect(summary.hasRegression).toBe(false);
    expect(summary.hasWarning).toBe(false);
    expect(summary.annotations).toHaveLength(0);
    expect(summary.markdown).toContain('⚡ Performance Benchmark Results');
    expect(summary.markdown).toContain('✅ All within budget');
    expect(summary.markdown).toContain('Agent init');
    expect(summary.markdown).toContain('Memory add');
  });

  it('should include regression details when baseline is provided', () => {
    const baseline = makeBaseline({
      'Agent init': { p95Ms: 1.0, avgMs: 0.5, budget: 100 },
    });
    const results: CurrentResult[] = [
      makeResult('Agent init', 1.5, 100), // 50% regression
    ];

    const summary = generateCISummary({ results, baseline });

    expect(summary.hasRegression).toBe(true);
    expect(summary.markdown).toContain('❌ **Regressions detected**');
    expect(summary.markdown).toContain('Regressions & Warnings');
    expect(summary.markdown).toContain('Agent init');
    expect(summary.annotations.length).toBeGreaterThan(0);
    expect(summary.annotations[0]).toContain('::error::');
  });

  it('should show warnings when performance degrades within tolerance', () => {
    const baseline = makeBaseline({
      'Memory add': { p95Ms: 1.0, avgMs: 0.5, budget: 50 },
    });
    const results: CurrentResult[] = [
      makeResult('Memory add', 1.1, 50), // 10% warning
    ];

    const summary = generateCISummary({ results, baseline });

    expect(summary.hasWarning).toBe(true);
    expect(summary.hasRegression).toBe(false);
    expect(summary.markdown).toContain('⚠️ **Warnings detected**');
  });

  it('should show improvements in collapsible section', () => {
    const baseline = makeBaseline({
      'Agent init': { p95Ms: 1.0, avgMs: 0.5, budget: 100 },
    });
    const results: CurrentResult[] = [
      makeResult('Agent init', 0.5, 100), // 50% improvement
    ];

    const summary = generateCISummary({ results, baseline });

    expect(summary.markdown).toContain('🚀');
    expect(summary.markdown).toContain('improvement');
    expect(summary.markdown).toContain('✅ **All benchmarks within acceptable range**');
  });

  it('should show new benchmarks in collapsible section', () => {
    const baseline = makeBaseline({});
    const results: CurrentResult[] = [makeResult('New bench', 0.5, 100)];

    const summary = generateCISummary({ results, baseline });

    expect(summary.markdown).toContain('🆕');
    expect(summary.markdown).toContain('new benchmark');
    expect(summary.markdown).toContain('New bench');
  });

  it('should include commit SHA when provided', () => {
    const results: CurrentResult[] = [makeResult('Agent init', 0.5, 100)];

    const summary = generateCISummary({
      results,
      commitSha: 'abc1234567890',
    });

    expect(summary.markdown).toContain('`abc1234`');
  });

  it('should include run URL when provided', () => {
    const results: CurrentResult[] = [makeResult('Agent init', 0.5, 100)];

    const summary = generateCISummary({
      results,
      runId: '12345',
      runUrl: 'https://github.com/org/repo/actions/runs/12345',
    });

    expect(summary.markdown).toContain('[#12345]');
    expect(summary.markdown).toContain('https://github.com/org/repo/actions/runs/12345');
  });

  it('should report budget failures even without baseline', () => {
    const results: CurrentResult[] = [
      makeResult('Agent init', 150, 100), // exceeds budget
    ];

    const summary = generateCISummary({ results });

    expect(summary.failCount).toBe(1);
    expect(summary.markdown).toContain('❌ 1 exceeded budget');
    expect(summary.annotations).toHaveLength(1);
    expect(summary.annotations[0]).toContain('::error::');
    expect(summary.annotations[0]).toContain('Budget exceeded');
  });

  it('should handle empty results gracefully', () => {
    const summary = generateCISummary({ results: [] });

    expect(summary.totalBenchmarks).toBe(0);
    expect(summary.passCount).toBe(0);
    expect(summary.failCount).toBe(0);
    expect(summary.annotations).toHaveLength(0);
    expect(summary.markdown).toContain('0 total');
  });

  it('should include full results table in collapsible section', () => {
    const results: CurrentResult[] = [
      makeResult('Agent init', 0.5, 100),
      makeResult('Memory add', 0.2, 50),
      makeResult('Tool exec', 0.1, 50),
    ];

    const summary = generateCISummary({ results });

    expect(summary.markdown).toContain('<details>');
    expect(summary.markdown).toContain('All benchmark results');
    expect(summary.markdown).toContain('Agent init');
    expect(summary.markdown).toContain('Memory add');
    expect(summary.markdown).toContain('Tool exec');
    expect(summary.markdown).toContain('</details>');
  });

  it('should respect custom thresholds', () => {
    const baseline = makeBaseline({
      'Bench A': { p95Ms: 1.0, avgMs: 0.5, budget: 100 },
    });
    const results: CurrentResult[] = [
      makeResult('Bench A', 1.08, 100), // 8% regression
    ];

    // With default: 8% is a warning (between 5% and 15%)
    const defaultSummary = generateCISummary({ results, baseline });
    expect(defaultSummary.hasWarning).toBe(true);
    expect(defaultSummary.hasRegression).toBe(false);

    // With strict thresholds: 8% is a regression (threshold = 5%)
    const strictSummary = generateCISummary({
      results,
      baseline,
      regressionThreshold: 5,
      warningThreshold: 2,
    });
    expect(strictSummary.hasRegression).toBe(true);
  });
});
