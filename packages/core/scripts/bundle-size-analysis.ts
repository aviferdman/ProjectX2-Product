/* eslint-disable no-console */
/**
 * Bundle size comparison analysis.
 *
 * Scans package dist directories, measures file sizes, and compares them
 * against a committed baseline. Reports regressions when total bundle size
 * exceeds the configured threshold.
 *
 * Usage:
 *   npx tsx scripts/bundle-size-analysis.ts [--baseline path] [--packages dir,...] [--threshold pct] [--budget kb] [--output path]
 *
 * @packageDocumentation
 */

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PackageSizeInfo {
  readonly totalBytes: number;
  readonly jsBytes: number;
  readonly dtsBytes: number;
  readonly mapBytes: number;
  readonly fileCount: number;
  readonly files: Readonly<Record<string, number>>;
}

export interface BundleSizeBaseline {
  readonly version: number;
  readonly timestamp: string;
  readonly packages: Readonly<Record<string, PackageSizeInfo>>;
}

export type FileSizeStatus = 'added' | 'removed' | 'unchanged' | 'increased' | 'decreased';

export interface FileSizeComparison {
  readonly file: string;
  readonly baselineSize: number | null;
  readonly currentSize: number | null;
  readonly changeBytes: number | null;
  readonly changePercent: number | null;
  readonly status: FileSizeStatus;
}

export type PackageSizeStatus = 'pass' | 'warning' | 'regression' | 'improvement' | 'new';

export interface PackageSizeComparison {
  readonly packageName: string;
  readonly baselineTotal: number | null;
  readonly currentTotal: number;
  readonly changeBytes: number | null;
  readonly changePercent: number | null;
  readonly status: PackageSizeStatus;
  readonly budgetBytes: number | null;
  readonly withinBudget: boolean;
  readonly files: readonly FileSizeComparison[];
}

export interface BundleSizeReport {
  readonly entries: readonly PackageSizeComparison[];
  readonly hasRegression: boolean;
  readonly hasWarning: boolean;
  readonly totalCurrentBytes: number;
  readonly totalBaselineBytes: number | null;
  readonly summary: string;
}

// ---------------------------------------------------------------------------
// Default thresholds
// ---------------------------------------------------------------------------

/** Warn if package size increases by more than 5% */
export const DEFAULT_WARNING_THRESHOLD = 5;

/** Fail if package size increases by more than 15% */
export const DEFAULT_REGRESSION_THRESHOLD = 15;

/** Default per-package budget in bytes (500 KB) */
export const DEFAULT_BUDGET_BYTES = 512_000;

// ---------------------------------------------------------------------------
// File system scanning
// ---------------------------------------------------------------------------

/**
 * Recursively collects all files under a directory with their sizes.
 * Returns a map of relative paths to sizes in bytes.
 */
export function scanDirectory(dirPath: string): Record<string, number> {
  const result: Record<string, number> = {};

  if (!existsSync(dirPath)) {
    return result;
  }

  function walk(currentPath: string): void {
    const entries = readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const relPath = relative(dirPath, fullPath).replace(/\\/g, '/');
        const stat = statSync(fullPath);
        result[relPath] = stat.size;
      }
    }
  }

  walk(dirPath);
  return result;
}

/**
 * Builds a PackageSizeInfo from a set of files.
 */
export function buildPackageSizeInfo(files: Readonly<Record<string, number>>): PackageSizeInfo {
  let totalBytes = 0;
  let jsBytes = 0;
  let dtsBytes = 0;
  let mapBytes = 0;
  let fileCount = 0;

  for (const [filePath, size] of Object.entries(files)) {
    totalBytes += size;
    fileCount++;

    const ext = extname(filePath);
    if (filePath.endsWith('.d.ts') || filePath.endsWith('.d.ts.map')) {
      dtsBytes += size;
    } else if (ext === '.map') {
      mapBytes += size;
    } else if (ext === '.js') {
      jsBytes += size;
    }
  }

  return { totalBytes, jsBytes, dtsBytes, mapBytes, fileCount, files };
}

/**
 * Scans a package's dist directory and returns its size info.
 */
export function scanPackage(packageDir: string): PackageSizeInfo {
  const distDir = join(packageDir, 'dist');
  const files = scanDirectory(distDir);
  return buildPackageSizeInfo(files);
}

// ---------------------------------------------------------------------------
// I/O helpers
// ---------------------------------------------------------------------------

export function loadSizeBaseline(filePath: string): BundleSizeBaseline {
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as BundleSizeBaseline;
}

export function saveSizeBaseline(filePath: string, baseline: BundleSizeBaseline): void {
  writeFileSync(filePath, JSON.stringify(baseline, null, 2) + '\n', 'utf-8');
}

// ---------------------------------------------------------------------------
// Comparison logic (pure - no I/O)
// ---------------------------------------------------------------------------

export function compareFiles(
  baselineFiles: Readonly<Record<string, number>> | null,
  currentFiles: Readonly<Record<string, number>>,
): FileSizeComparison[] {
  const comparisons: FileSizeComparison[] = [];
  const allFiles = new Set<string>();

  for (const f of Object.keys(currentFiles)) allFiles.add(f);
  if (baselineFiles !== null) {
    for (const f of Object.keys(baselineFiles)) allFiles.add(f);
  }

  for (const file of [...allFiles].sort()) {
    const baselineSize = baselineFiles !== null ? (baselineFiles[file] ?? null) : null;
    const currentSize = currentFiles[file] ?? null;

    if (baselineSize === null && currentSize !== null) {
      comparisons.push({
        file,
        baselineSize: null,
        currentSize,
        changeBytes: null,
        changePercent: null,
        status: 'added',
      });
    } else if (baselineSize !== null && currentSize === null) {
      comparisons.push({
        file,
        baselineSize,
        currentSize: null,
        changeBytes: null,
        changePercent: null,
        status: 'removed',
      });
    } else if (baselineSize !== null && currentSize !== null) {
      const changeBytes = currentSize - baselineSize;
      const changePercent = baselineSize > 0 ? (changeBytes / baselineSize) * 100 : 0;

      let status: FileSizeStatus;
      if (changeBytes > 0) status = 'increased';
      else if (changeBytes < 0) status = 'decreased';
      else status = 'unchanged';

      comparisons.push({
        file,
        baselineSize,
        currentSize,
        changeBytes,
        changePercent,
        status,
      });
    }
  }

  return comparisons;
}

export function comparePackageSizes(
  current: Readonly<Record<string, PackageSizeInfo>>,
  baseline: BundleSizeBaseline | null,
  regressionThreshold: number = DEFAULT_REGRESSION_THRESHOLD,
  warningThreshold: number = DEFAULT_WARNING_THRESHOLD,
  budgetBytes: number | null = DEFAULT_BUDGET_BYTES,
): BundleSizeReport {
  const entries: PackageSizeComparison[] = [];
  let hasRegression = false;
  let hasWarning = false;
  let totalCurrentBytes = 0;
  let totalBaselineBytes: number | null = baseline !== null ? 0 : null;

  for (const [pkgName, currentInfo] of Object.entries(current)) {
    totalCurrentBytes += currentInfo.totalBytes;

    const baseInfo: PackageSizeInfo | undefined =
      baseline !== null ? baseline.packages[pkgName] : undefined;

    if (baseInfo !== undefined && totalBaselineBytes !== null) {
      totalBaselineBytes += baseInfo.totalBytes;
    }

    const fileComparisons = compareFiles(
      baseInfo !== undefined ? baseInfo.files : null,
      currentInfo.files,
    );

    if (baseInfo === undefined) {
      const withinBudget = budgetBytes === null || currentInfo.totalBytes <= budgetBytes;
      entries.push({
        packageName: pkgName,
        baselineTotal: null,
        currentTotal: currentInfo.totalBytes,
        changeBytes: null,
        changePercent: null,
        status: 'new',
        budgetBytes,
        withinBudget,
        files: fileComparisons,
      });
      continue;
    }

    const changeBytes = currentInfo.totalBytes - baseInfo.totalBytes;
    const changePercent = baseInfo.totalBytes > 0 ? (changeBytes / baseInfo.totalBytes) * 100 : 0;

    let status: PackageSizeStatus;
    if (changePercent > regressionThreshold) {
      status = 'regression';
      hasRegression = true;
    } else if (changePercent > warningThreshold) {
      status = 'warning';
      hasWarning = true;
    } else if (changePercent < -warningThreshold) {
      status = 'improvement';
    } else {
      status = 'pass';
    }

    const withinBudget = budgetBytes === null || currentInfo.totalBytes <= budgetBytes;
    if (!withinBudget) {
      hasRegression = true;
    }

    entries.push({
      packageName: pkgName,
      baselineTotal: baseInfo.totalBytes,
      currentTotal: currentInfo.totalBytes,
      changeBytes,
      changePercent,
      status,
      budgetBytes,
      withinBudget,
      files: fileComparisons,
    });
  }

  const regressionCount = entries.filter((e) => e.status === 'regression').length;
  const warningCount = entries.filter((e) => e.status === 'warning').length;
  const passCount = entries.filter((e) => e.status === 'pass').length;
  const improvementCount = entries.filter((e) => e.status === 'improvement').length;
  const newCount = entries.filter((e) => e.status === 'new').length;
  const budgetExceeded = entries.filter((e) => !e.withinBudget).length;

  const parts: string[] = [];
  parts.push(`${String(entries.length)} packages analyzed`);
  if (passCount > 0) parts.push(`${String(passCount)} passed`);
  if (improvementCount > 0) parts.push(`${String(improvementCount)} improved`);
  if (warningCount > 0) parts.push(`${String(warningCount)} warnings`);
  if (regressionCount > 0) parts.push(`${String(regressionCount)} regressions`);
  if (newCount > 0) parts.push(`${String(newCount)} new`);
  if (budgetExceeded > 0) parts.push(`${String(budgetExceeded)} exceeded budget`);

  return {
    entries,
    hasRegression,
    hasWarning,
    totalCurrentBytes,
    totalBaselineBytes,
    summary: parts.join(', '),
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatChange(changeBytes: number | null, changePercent: number | null): string {
  if (changeBytes === null || changePercent === null) return 'new';
  const sign = changeBytes >= 0 ? '+' : '';
  return `${sign}${formatBytes(changeBytes)} (${sign}${changePercent.toFixed(1)}%)`;
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

export function formatBundleSizeTable(report: BundleSizeReport): string {
  const lines: string[] = [];

  lines.push('## Bundle Size Comparison Report');
  lines.push('');
  lines.push(`**Summary:** ${report.summary}`);
  lines.push(`**Total size:** ${formatBytes(report.totalCurrentBytes)}`);
  if (report.totalBaselineBytes !== null) {
    const totalChange = report.totalCurrentBytes - report.totalBaselineBytes;
    const sign = totalChange >= 0 ? '+' : '';
    lines.push(`**Total change:** ${sign}${formatBytes(totalChange)}`);
  }
  lines.push('');
  lines.push('| Status | Package | Baseline | Current | Change | Budget |');
  lines.push('|--------|---------|:--------:|:-------:|:------:|:------:|');

  for (const entry of report.entries) {
    const icon =
      entry.status === 'pass'
        ? '✅'
        : entry.status === 'improvement'
          ? '🚀'
          : entry.status === 'warning'
            ? '⚠️'
            : entry.status === 'regression'
              ? '❌'
              : '🆕';

    const baseline = entry.baselineTotal !== null ? formatBytes(entry.baselineTotal) : '—';
    const current = formatBytes(entry.currentTotal);
    const change = formatChange(entry.changeBytes, entry.changePercent);
    const budget =
      entry.budgetBytes !== null
        ? `${entry.withinBudget ? '✅' : '❌'} ${formatBytes(entry.budgetBytes)}`
        : '—';

    lines.push(
      `| ${icon} ${entry.status} | ${entry.packageName} | ${baseline} | ${current} | ${change} | ${budget} |`,
    );
  }

  lines.push('');

  // File-level details (collapsed)
  for (const entry of report.entries) {
    const changedFiles = entry.files.filter((f) => f.status !== 'unchanged');
    if (changedFiles.length === 0) continue;

    lines.push('<details>');
    lines.push(
      `<summary>📦 ${entry.packageName} — ${String(changedFiles.length)} file(s) changed</summary>`,
    );
    lines.push('');
    lines.push('| Status | File | Baseline | Current | Change |');
    lines.push('|--------|------|:--------:|:-------:|:------:|');

    for (const file of changedFiles) {
      const fileIcon =
        file.status === 'added'
          ? '🆕'
          : file.status === 'removed'
            ? '🗑️'
            : file.status === 'increased'
              ? '📈'
              : '📉';

      const bl = file.baselineSize !== null ? formatBytes(file.baselineSize) : '—';
      const cur = file.currentSize !== null ? formatBytes(file.currentSize) : '—';
      const ch = formatChange(file.changeBytes, file.changePercent);

      lines.push(`| ${fileIcon} | ${file.file} | ${bl} | ${cur} | ${ch} |`);
    }

    lines.push('');
    lines.push('</details>');
    lines.push('');
  }

  if (report.hasRegression) {
    lines.push(
      '> ❌ **Bundle size regression detected.** Size increased beyond the 15% threshold or budget exceeded.',
    );
    lines.push('> Review file changes and tree-shake unused code before merging.');
  } else if (report.hasWarning) {
    lines.push(
      '> ⚠️ **Bundle size warning.** Size increased 5–15%. Please justify in PR description.',
    );
  } else {
    lines.push('> ✅ **All packages within acceptable size range.**');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Baseline generation
// ---------------------------------------------------------------------------

export function buildSizeBaseline(
  packages: Readonly<Record<string, PackageSizeInfo>>,
): BundleSizeBaseline {
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    packages,
  };
}

// ---------------------------------------------------------------------------
// CLI argument parser
// ---------------------------------------------------------------------------

export interface CliOptions {
  readonly baseline: string;
  readonly packagesRoot: string;
  readonly packageNames: readonly string[];
  readonly threshold: number;
  readonly budgetKb: number | null;
  readonly output: string | null;
  readonly updateBaseline: boolean;
}

export function parseArgs(argv: readonly string[]): CliOptions {
  let baseline = resolve('benchmarks', 'bundle-size-baseline.json');
  let packagesRoot = resolve('..'); // from packages/core -> packages/
  let packageNames: string[] = ['core', 'cli'];
  let threshold = DEFAULT_REGRESSION_THRESHOLD;
  let budgetKb: number | null = DEFAULT_BUDGET_BYTES / 1024;
  let output: string | null = null;
  let updateBaseline = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next: string | undefined = argv[i + 1];
    if (arg === '--baseline' && next !== undefined) {
      baseline = resolve(next);
      i++;
    } else if (arg === '--packages-root' && next !== undefined) {
      packagesRoot = resolve(next);
      i++;
    } else if (arg === '--package-names' && next !== undefined) {
      packageNames = next.split(',').map((s) => s.trim());
      i++;
    } else if (arg === '--threshold' && next !== undefined) {
      threshold = Number(next);
      i++;
    } else if (arg === '--budget' && next !== undefined) {
      budgetKb = Number(next);
      i++;
    } else if (arg === '--no-budget') {
      budgetKb = null;
    } else if (arg === '--output' && next !== undefined) {
      output = resolve(next);
      i++;
    } else if (arg === '--update-baseline') {
      updateBaseline = true;
    }
  }

  return {
    baseline,
    packagesRoot,
    packageNames,
    threshold,
    budgetKb,
    output,
    updateBaseline,
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function main(argv: readonly string[] = process.argv.slice(2)): number {
  const options = parseArgs(argv);

  const budgetBytes = options.budgetKb !== null ? options.budgetKb * 1024 : null;

  console.log('Bundle size analysis...');
  console.log(`  Baseline:  ${options.baseline}`);
  console.log(`  Packages:  ${options.packageNames.join(', ')}`);
  console.log(`  Threshold: ${String(options.threshold)}%`);
  if (budgetBytes !== null) console.log(`  Budget:    ${formatBytes(budgetBytes)}`);
  console.log('');

  // Scan current package sizes
  const current: Record<string, PackageSizeInfo> = {};
  for (const pkgName of options.packageNames) {
    const pkgDir = join(options.packagesRoot, pkgName);
    if (!existsSync(join(pkgDir, 'dist'))) {
      console.log(`Warning: ${pkgName}/dist not found. Run build first.`);
      continue;
    }
    current[pkgName] = scanPackage(pkgDir);
    console.log(
      `  ${pkgName}: ${formatBytes(current[pkgName]!.totalBytes)} (${String(current[pkgName]!.fileCount)} files)`,
    );
  }
  console.log('');

  if (Object.keys(current).length === 0) {
    console.log('No packages found. Build packages first.');
    return 1;
  }

  // Update baseline mode
  if (options.updateBaseline) {
    const newBaseline = buildSizeBaseline(current);
    saveSizeBaseline(options.baseline, newBaseline);
    console.log(`Baseline updated: ${options.baseline}`);
    return 0;
  }

  // Load baseline and compare
  let baseline: BundleSizeBaseline | null = null;
  try {
    baseline = loadSizeBaseline(options.baseline);
  } catch {
    console.log('Warning: Could not load baseline. Generating report without comparison.');
  }

  const report = comparePackageSizes(current, baseline, options.threshold, undefined, budgetBytes);
  const markdown = formatBundleSizeTable(report);

  if (options.output !== null) {
    writeFileSync(options.output, markdown, 'utf-8');
    console.log(`Report written to: ${options.output}`);
  } else {
    console.log(markdown);
  }

  console.log('');

  if (report.hasRegression) {
    console.log('EXIT: 1 (bundle size regression detected)');
    return 1;
  }

  console.log('EXIT: 0 (all packages within threshold)');
  return 0;
}

// Run if executed directly
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile || process.argv[1]?.endsWith('bundle-size-analysis.ts')) {
  process.exit(main());
}
