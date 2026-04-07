/**
 * Tests for bundle size comparison analysis.
 */

import { describe, it, expect } from 'vitest';

import {
  buildPackageSizeInfo,
  compareFiles,
  comparePackageSizes,
  formatBytes,
  formatChange,
  formatBundleSizeTable,
  buildSizeBaseline,
  parseArgs,
  DEFAULT_WARNING_THRESHOLD,
  DEFAULT_REGRESSION_THRESHOLD,
  DEFAULT_BUDGET_BYTES,
} from '../../scripts/bundle-size-analysis.js';
import type {
  PackageSizeInfo,
  BundleSizeBaseline,
  BundleSizeReport,
} from '../../scripts/bundle-size-analysis.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSizeInfo(overrides: Partial<PackageSizeInfo> = {}): PackageSizeInfo {
  return {
    totalBytes: 100_000,
    jsBytes: 50_000,
    dtsBytes: 30_000,
    mapBytes: 20_000,
    fileCount: 10,
    files: { 'index.js': 50_000, 'index.d.ts': 30_000, 'index.js.map': 20_000 },
    ...overrides,
  };
}

function makeBaseline(
  packages: Record<string, PackageSizeInfo>,
): BundleSizeBaseline {
  return { version: 1, timestamp: '2026-01-01T00:00:00.000Z', packages };
}

// ---------------------------------------------------------------------------
// buildPackageSizeInfo
// ---------------------------------------------------------------------------

describe('buildPackageSizeInfo', () => {
  it('should compute correct totals from file map', () => {
    const files = {
      'index.js': 5000,
      'index.d.ts': 3000,
      'index.js.map': 2000,
      'utils.js': 1500,
      'utils.d.ts': 800,
      'utils.js.map': 1200,
    };

    const info = buildPackageSizeInfo(files);

    expect(info.totalBytes).toBe(13500);
    expect(info.jsBytes).toBe(6500);
    expect(info.dtsBytes).toBe(3800);
    expect(info.mapBytes).toBe(3200);
    expect(info.fileCount).toBe(6);
  });

  it('should handle empty file map', () => {
    const info = buildPackageSizeInfo({});

    expect(info.totalBytes).toBe(0);
    expect(info.jsBytes).toBe(0);
    expect(info.dtsBytes).toBe(0);
    expect(info.mapBytes).toBe(0);
    expect(info.fileCount).toBe(0);
  });

  it('should categorize .d.ts.map files as dts', () => {
    const files = {
      'types.d.ts': 1000,
      'types.d.ts.map': 500,
    };

    const info = buildPackageSizeInfo(files);

    expect(info.dtsBytes).toBe(1500);
    expect(info.mapBytes).toBe(0);
    expect(info.jsBytes).toBe(0);
  });

  it('should handle files with no recognized extension', () => {
    const files = {
      'README.md': 2000,
      'LICENSE': 1000,
      'index.js': 500,
    };

    const info = buildPackageSizeInfo(files);

    expect(info.totalBytes).toBe(3500);
    expect(info.jsBytes).toBe(500);
    expect(info.fileCount).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// compareFiles
// ---------------------------------------------------------------------------

describe('compareFiles', () => {
  it('should detect unchanged files', () => {
    const baseline = { 'index.js': 1000 };
    const current = { 'index.js': 1000 };

    const result = compareFiles(baseline, current);

    expect(result).toHaveLength(1);
    expect(result[0]!.status).toBe('unchanged');
    expect(result[0]!.changeBytes).toBe(0);
    expect(result[0]!.changePercent).toBe(0);
  });

  it('should detect increased files', () => {
    const baseline = { 'index.js': 1000 };
    const current = { 'index.js': 1500 };

    const result = compareFiles(baseline, current);

    expect(result).toHaveLength(1);
    expect(result[0]!.status).toBe('increased');
    expect(result[0]!.changeBytes).toBe(500);
    expect(result[0]!.changePercent).toBe(50);
  });

  it('should detect decreased files', () => {
    const baseline = { 'index.js': 2000 };
    const current = { 'index.js': 1500 };

    const result = compareFiles(baseline, current);

    expect(result).toHaveLength(1);
    expect(result[0]!.status).toBe('decreased');
    expect(result[0]!.changeBytes).toBe(-500);
    expect(result[0]!.changePercent).toBe(-25);
  });

  it('should detect added files', () => {
    const baseline = { 'index.js': 1000 };
    const current = { 'index.js': 1000, 'utils.js': 500 };

    const result = compareFiles(baseline, current);

    expect(result).toHaveLength(2);
    const added = result.find((f) => f.file === 'utils.js');
    expect(added).toBeDefined();
    expect(added!.status).toBe('added');
    expect(added!.baselineSize).toBeNull();
    expect(added!.currentSize).toBe(500);
  });

  it('should detect removed files', () => {
    const baseline = { 'index.js': 1000, 'old.js': 500 };
    const current = { 'index.js': 1000 };

    const result = compareFiles(baseline, current);

    expect(result).toHaveLength(2);
    const removed = result.find((f) => f.file === 'old.js');
    expect(removed).toBeDefined();
    expect(removed!.status).toBe('removed');
    expect(removed!.baselineSize).toBe(500);
    expect(removed!.currentSize).toBeNull();
  });

  it('should handle null baseline (all files are added)', () => {
    const current = { 'index.js': 1000, 'utils.js': 500 };

    const result = compareFiles(null, current);

    expect(result).toHaveLength(2);
    expect(result.every((f) => f.status === 'added')).toBe(true);
  });

  it('should sort results by file name', () => {
    const baseline = { 'z.js': 100, 'a.js': 200 };
    const current = { 'z.js': 100, 'a.js': 200, 'm.js': 50 };

    const result = compareFiles(baseline, current);

    expect(result.map((f) => f.file)).toEqual(['a.js', 'm.js', 'z.js']);
  });
});

// ---------------------------------------------------------------------------
// comparePackageSizes
// ---------------------------------------------------------------------------

describe('comparePackageSizes', () => {
  it('should report pass when within threshold', () => {
    const current: Record<string, PackageSizeInfo> = {
      core: makeSizeInfo({ totalBytes: 102_000 }),
    };
    const baseline = makeBaseline({
      core: makeSizeInfo({ totalBytes: 100_000 }),
    });

    const report = comparePackageSizes(current, baseline);

    expect(report.hasRegression).toBe(false);
    expect(report.hasWarning).toBe(false);
    expect(report.entries).toHaveLength(1);
    expect(report.entries[0]!.status).toBe('pass');
    expect(report.entries[0]!.changePercent).toBe(2);
  });

  it('should report warning when between warning and regression thresholds', () => {
    const current: Record<string, PackageSizeInfo> = {
      core: makeSizeInfo({ totalBytes: 110_000 }),
    };
    const baseline = makeBaseline({
      core: makeSizeInfo({ totalBytes: 100_000 }),
    });

    const report = comparePackageSizes(current, baseline);

    expect(report.hasWarning).toBe(true);
    expect(report.hasRegression).toBe(false);
    expect(report.entries[0]!.status).toBe('warning');
  });

  it('should report regression when exceeding threshold', () => {
    const current: Record<string, PackageSizeInfo> = {
      core: makeSizeInfo({ totalBytes: 120_000 }),
    };
    const baseline = makeBaseline({
      core: makeSizeInfo({ totalBytes: 100_000 }),
    });

    const report = comparePackageSizes(current, baseline);

    expect(report.hasRegression).toBe(true);
    expect(report.entries[0]!.status).toBe('regression');
    expect(report.entries[0]!.changePercent).toBe(20);
  });

  it('should report improvement when size decreased significantly', () => {
    const current: Record<string, PackageSizeInfo> = {
      core: makeSizeInfo({ totalBytes: 90_000 }),
    };
    const baseline = makeBaseline({
      core: makeSizeInfo({ totalBytes: 100_000 }),
    });

    const report = comparePackageSizes(current, baseline);

    expect(report.entries[0]!.status).toBe('improvement');
    expect(report.entries[0]!.changePercent).toBe(-10);
  });

  it('should report new when package not in baseline', () => {
    const current: Record<string, PackageSizeInfo> = {
      'new-pkg': makeSizeInfo({ totalBytes: 50_000 }),
    };
    const baseline = makeBaseline({
      core: makeSizeInfo(),
    });

    const report = comparePackageSizes(current, baseline);

    expect(report.entries[0]!.status).toBe('new');
    expect(report.entries[0]!.changeBytes).toBeNull();
  });

  it('should handle null baseline (no comparison)', () => {
    const current: Record<string, PackageSizeInfo> = {
      core: makeSizeInfo({ totalBytes: 100_000 }),
    };

    const report = comparePackageSizes(current, null);

    expect(report.entries).toHaveLength(1);
    expect(report.entries[0]!.status).toBe('new');
    expect(report.totalBaselineBytes).toBeNull();
  });

  it('should flag regression when budget is exceeded', () => {
    const current: Record<string, PackageSizeInfo> = {
      core: makeSizeInfo({ totalBytes: 600_000 }),
    };
    const baseline = makeBaseline({
      core: makeSizeInfo({ totalBytes: 600_000 }),
    });

    // Size is same as baseline (pass on threshold) but exceeds 512KB budget
    const report = comparePackageSizes(current, baseline, 15, 5, 512_000);

    expect(report.entries[0]!.withinBudget).toBe(false);
    expect(report.hasRegression).toBe(true);
  });

  it('should respect custom thresholds', () => {
    const current: Record<string, PackageSizeInfo> = {
      core: makeSizeInfo({ totalBytes: 108_000 }),
    };
    const baseline = makeBaseline({
      core: makeSizeInfo({ totalBytes: 100_000 }),
    });

    // With 5% regression threshold, 8% increase is a regression
    const report = comparePackageSizes(current, baseline, 5, 3, null);

    expect(report.hasRegression).toBe(true);
    expect(report.entries[0]!.status).toBe('regression');
  });

  it('should handle multiple packages', () => {
    const current: Record<string, PackageSizeInfo> = {
      core: makeSizeInfo({ totalBytes: 100_000 }),
      cli: makeSizeInfo({ totalBytes: 50_000 }),
    };
    const baseline = makeBaseline({
      core: makeSizeInfo({ totalBytes: 100_000 }),
      cli: makeSizeInfo({ totalBytes: 50_000 }),
    });

    const report = comparePackageSizes(current, baseline);

    expect(report.entries).toHaveLength(2);
    expect(report.totalCurrentBytes).toBe(150_000);
    expect(report.totalBaselineBytes).toBe(150_000);
  });

  it('should compute correct total bytes across packages', () => {
    const current: Record<string, PackageSizeInfo> = {
      core: makeSizeInfo({ totalBytes: 120_000 }),
      cli: makeSizeInfo({ totalBytes: 30_000 }),
    };
    const baseline = makeBaseline({
      core: makeSizeInfo({ totalBytes: 100_000 }),
      cli: makeSizeInfo({ totalBytes: 30_000 }),
    });

    const report = comparePackageSizes(current, baseline);

    expect(report.totalCurrentBytes).toBe(150_000);
    expect(report.totalBaselineBytes).toBe(130_000);
  });

  it('should include summary text', () => {
    const current: Record<string, PackageSizeInfo> = {
      core: makeSizeInfo({ totalBytes: 100_000 }),
    };
    const baseline = makeBaseline({
      core: makeSizeInfo({ totalBytes: 100_000 }),
    });

    const report = comparePackageSizes(current, baseline);

    expect(report.summary).toContain('1 packages analyzed');
    expect(report.summary).toContain('1 passed');
  });

  it('should skip budget check when budget is null', () => {
    const current: Record<string, PackageSizeInfo> = {
      core: makeSizeInfo({ totalBytes: 10_000_000 }),
    };
    const baseline = makeBaseline({
      core: makeSizeInfo({ totalBytes: 10_000_000 }),
    });

    const report = comparePackageSizes(current, baseline, 15, 5, null);

    expect(report.entries[0]!.withinBudget).toBe(true);
    expect(report.entries[0]!.budgetBytes).toBeNull();
    expect(report.hasRegression).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatBytes
// ---------------------------------------------------------------------------

describe('formatBytes', () => {
  it('should format bytes', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('should format kilobytes', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  it('should format megabytes', () => {
    expect(formatBytes(1_572_864)).toBe('1.50 MB');
  });

  it('should format zero', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('should format exactly 1 KB', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
  });
});

// ---------------------------------------------------------------------------
// formatChange
// ---------------------------------------------------------------------------

describe('formatChange', () => {
  it('should format positive change', () => {
    const result = formatChange(5120, 10);
    expect(result).toContain('+');
    expect(result).toContain('5.0 KB');
    expect(result).toContain('+10.0%');
  });

  it('should format negative change', () => {
    const result = formatChange(-2048, -5);
    expect(result).not.toMatch(/^\+/);
    expect(result).toContain('-5.0%');
  });

  it('should return "new" for null values', () => {
    expect(formatChange(null, null)).toBe('new');
  });
});

// ---------------------------------------------------------------------------
// formatBundleSizeTable
// ---------------------------------------------------------------------------

describe('formatBundleSizeTable', () => {
  it('should produce markdown table with correct headers', () => {
    const report: BundleSizeReport = {
      entries: [
        {
          packageName: 'core',
          baselineTotal: 100_000,
          currentTotal: 102_000,
          changeBytes: 2000,
          changePercent: 2,
          status: 'pass',
          budgetBytes: 512_000,
          withinBudget: true,
          files: [],
        },
      ],
      hasRegression: false,
      hasWarning: false,
      totalCurrentBytes: 102_000,
      totalBaselineBytes: 100_000,
      summary: '1 packages analyzed, 1 passed',
    };

    const markdown = formatBundleSizeTable(report);

    expect(markdown).toContain('## Bundle Size Comparison Report');
    expect(markdown).toContain('| Status | Package | Baseline | Current | Change | Budget |');
    expect(markdown).toContain('core');
    expect(markdown).toContain('✅ **All packages within acceptable size range.**');
  });

  it('should show regression message when regressions exist', () => {
    const report: BundleSizeReport = {
      entries: [
        {
          packageName: 'core',
          baselineTotal: 100_000,
          currentTotal: 200_000,
          changeBytes: 100_000,
          changePercent: 100,
          status: 'regression',
          budgetBytes: 512_000,
          withinBudget: true,
          files: [],
        },
      ],
      hasRegression: true,
      hasWarning: false,
      totalCurrentBytes: 200_000,
      totalBaselineBytes: 100_000,
      summary: '1 packages analyzed, 1 regressions',
    };

    const markdown = formatBundleSizeTable(report);

    expect(markdown).toContain('❌ **Bundle size regression detected.**');
  });

  it('should show warning message', () => {
    const report: BundleSizeReport = {
      entries: [
        {
          packageName: 'core',
          baselineTotal: 100_000,
          currentTotal: 110_000,
          changeBytes: 10_000,
          changePercent: 10,
          status: 'warning',
          budgetBytes: 512_000,
          withinBudget: true,
          files: [],
        },
      ],
      hasRegression: false,
      hasWarning: true,
      totalCurrentBytes: 110_000,
      totalBaselineBytes: 100_000,
      summary: '1 packages analyzed, 1 warnings',
    };

    const markdown = formatBundleSizeTable(report);

    expect(markdown).toContain('⚠️ **Bundle size warning.**');
  });

  it('should include file-level details for changed files', () => {
    const report: BundleSizeReport = {
      entries: [
        {
          packageName: 'core',
          baselineTotal: 100_000,
          currentTotal: 110_000,
          changeBytes: 10_000,
          changePercent: 10,
          status: 'warning',
          budgetBytes: 512_000,
          withinBudget: true,
          files: [
            {
              file: 'index.js',
              baselineSize: 50_000,
              currentSize: 60_000,
              changeBytes: 10_000,
              changePercent: 20,
              status: 'increased',
            },
          ],
        },
      ],
      hasRegression: false,
      hasWarning: true,
      totalCurrentBytes: 110_000,
      totalBaselineBytes: 100_000,
      summary: '1 packages analyzed, 1 warnings',
    };

    const markdown = formatBundleSizeTable(report);

    expect(markdown).toContain('📦 core');
    expect(markdown).toContain('index.js');
    expect(markdown).toContain('1 file(s) changed');
  });

  it('should not include file details when no files changed', () => {
    const report: BundleSizeReport = {
      entries: [
        {
          packageName: 'core',
          baselineTotal: 100_000,
          currentTotal: 100_000,
          changeBytes: 0,
          changePercent: 0,
          status: 'pass',
          budgetBytes: 512_000,
          withinBudget: true,
          files: [
            {
              file: 'index.js',
              baselineSize: 50_000,
              currentSize: 50_000,
              changeBytes: 0,
              changePercent: 0,
              status: 'unchanged',
            },
          ],
        },
      ],
      hasRegression: false,
      hasWarning: false,
      totalCurrentBytes: 100_000,
      totalBaselineBytes: 100_000,
      summary: '1 packages analyzed, 1 passed',
    };

    const markdown = formatBundleSizeTable(report);

    expect(markdown).not.toContain('📦 core');
  });

  it('should display total change', () => {
    const report: BundleSizeReport = {
      entries: [],
      hasRegression: false,
      hasWarning: false,
      totalCurrentBytes: 110_000,
      totalBaselineBytes: 100_000,
      summary: '0 packages analyzed',
    };

    const markdown = formatBundleSizeTable(report);

    expect(markdown).toContain('**Total change:**');
  });
});

// ---------------------------------------------------------------------------
// buildSizeBaseline
// ---------------------------------------------------------------------------

describe('buildSizeBaseline', () => {
  it('should create baseline with version and timestamp', () => {
    const packages = { core: makeSizeInfo() };
    const baseline = buildSizeBaseline(packages);

    expect(baseline.version).toBe(1);
    expect(baseline.timestamp).toBeTruthy();
    expect(baseline.packages).toEqual(packages);
  });

  it('should handle multiple packages', () => {
    const packages = {
      core: makeSizeInfo({ totalBytes: 100_000 }),
      cli: makeSizeInfo({ totalBytes: 50_000 }),
    };

    const baseline = buildSizeBaseline(packages);

    expect(Object.keys(baseline.packages)).toHaveLength(2);
    expect(baseline.packages['core']!.totalBytes).toBe(100_000);
    expect(baseline.packages['cli']!.totalBytes).toBe(50_000);
  });
});

// ---------------------------------------------------------------------------
// parseArgs
// ---------------------------------------------------------------------------

describe('parseArgs', () => {
  it('should use defaults when no args provided', () => {
    const options = parseArgs([]);

    expect(options.threshold).toBe(DEFAULT_REGRESSION_THRESHOLD);
    expect(options.packageNames).toEqual(['core', 'cli']);
    expect(options.output).toBeNull();
    expect(options.updateBaseline).toBe(false);
  });

  it('should parse --threshold', () => {
    const options = parseArgs(['--threshold', '20']);
    expect(options.threshold).toBe(20);
  });

  it('should parse --package-names', () => {
    const options = parseArgs(['--package-names', 'core,cli,web']);
    expect(options.packageNames).toEqual(['core', 'cli', 'web']);
  });

  it('should parse --budget', () => {
    const options = parseArgs(['--budget', '1024']);
    expect(options.budgetKb).toBe(1024);
  });

  it('should parse --no-budget', () => {
    const options = parseArgs(['--no-budget']);
    expect(options.budgetKb).toBeNull();
  });

  it('should parse --update-baseline', () => {
    const options = parseArgs(['--update-baseline']);
    expect(options.updateBaseline).toBe(true);
  });

  it('should parse --output', () => {
    const options = parseArgs(['--output', 'report.md']);
    expect(options.output).toBeTruthy();
    expect(options.output).toContain('report.md');
  });

  it('should handle multiple flags together', () => {
    const options = parseArgs([
      '--threshold', '10',
      '--package-names', 'core',
      '--budget', '256',
      '--update-baseline',
    ]);

    expect(options.threshold).toBe(10);
    expect(options.packageNames).toEqual(['core']);
    expect(options.budgetKb).toBe(256);
    expect(options.updateBaseline).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Default constants
// ---------------------------------------------------------------------------

describe('default constants', () => {
  it('should have warning threshold of 5%', () => {
    expect(DEFAULT_WARNING_THRESHOLD).toBe(5);
  });

  it('should have regression threshold of 15%', () => {
    expect(DEFAULT_REGRESSION_THRESHOLD).toBe(15);
  });

  it('should have budget of 512KB', () => {
    expect(DEFAULT_BUDGET_BYTES).toBe(512_000);
  });
});
