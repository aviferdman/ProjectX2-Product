/**
 * Semver compliance checker for CI.
 *
 * Scans public API surface (barrel exports from index.ts) and compares
 * against a committed baseline snapshot. Detects:
 *
 *  - Removed exports (BREAKING)
 *  - Renamed type-only → value exports or vice-versa (BREAKING)
 *  - New exports (non-breaking — informational)
 *
 * When breaking changes are found on a PR that does NOT bump the minor
 * (pre-1.0) or major (post-1.0) version, the check fails.
 *
 * Usage:
 *   npx tsx scripts/check-semver-compliance.ts              # check mode (CI)
 *   npx tsx scripts/check-semver-compliance.ts --update      # regenerate baseline
 *   npx tsx scripts/check-semver-compliance.ts --dry-run     # preview without failing
 *
 * @packageDocumentation
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Packages whose public API surface we track. */
const TRACKED_PACKAGES = [
  {
    name: '@crewspace/core',
    entryPoint: 'packages/core/src/index.ts',
    baselineFile: 'scripts/api-baseline/core-exports.json',
  },
  {
    name: '@crewspace/cli',
    entryPoint: 'packages/cli/src/index.ts',
    baselineFile: 'scripts/api-baseline/cli-exports.json',
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExportEntry {
  /** Exported symbol name. */
  name: string;
  /** Whether this is a type-only export (`export type`). */
  typeOnly: boolean;
}

export interface ApiBaseline {
  /** Package name. */
  package: string;
  /** ISO timestamp of last baseline update. */
  generatedAt: string;
  /** Sorted list of public exports. */
  exports: ExportEntry[];
}

export type BreakingChangeKind = 'removed' | 'changed-to-type' | 'changed-to-value';

export interface BreakingChange {
  symbol: string;
  kind: BreakingChangeKind;
  message: string;
}

export interface ComplianceResult {
  packageName: string;
  breaking: BreakingChange[];
  added: string[];
  baselineExists: boolean;
}

// ---------------------------------------------------------------------------
// Export extraction
// ---------------------------------------------------------------------------

/**
 * Parse an index.ts barrel file and extract all named exports.
 *
 * Handles patterns:
 *   export { Foo, Bar } from './module.js';
 *   export type { Baz } from './module.js';
 *   export const VERSION = '...';
 *   export { Foo as Alias } from './module.js';
 */
export function extractExports(source: string): ExportEntry[] {
  const exports: ExportEntry[] = [];
  const seen = new Set<string>();

  // Pattern 1: export { A, B, C } from '...';
  //            export type { A, B } from '...';
  const reExportBlock = /export\s+(type\s+)?\{([^}]+)\}\s+from\s+['"][^'"]+['"]/g;
  let match: RegExpExecArray | null;
  while ((match = reExportBlock.exec(source)) !== null) {
    const typeOnly = match[1] != null;
    const symbols = match[2]!
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const sym of symbols) {
      // Handle `Foo as Bar` — track the exported name (Bar)
      const parts = sym.split(/\s+as\s+/);
      const exportedName = (parts.length > 1 ? parts[1]! : parts[0]!).trim();
      if (exportedName && !seen.has(exportedName)) {
        seen.add(exportedName);
        exports.push({ name: exportedName, typeOnly });
      }
    }
  }

  // Pattern 2: export const FOO = ...
  const reExportConst = /export\s+const\s+(\w+)\s*=/g;
  while ((match = reExportConst.exec(source)) !== null) {
    const name = match[1]!;
    if (!seen.has(name)) {
      seen.add(name);
      exports.push({ name, typeOnly: false });
    }
  }

  // Pattern 3: export function foo(...)
  const reExportFn = /export\s+function\s+(\w+)/g;
  while ((match = reExportFn.exec(source)) !== null) {
    const name = match[1]!;
    if (!seen.has(name)) {
      seen.add(name);
      exports.push({ name, typeOnly: false });
    }
  }

  // Pattern 4: export class Foo
  const reExportClass = /export\s+class\s+(\w+)/g;
  while ((match = reExportClass.exec(source)) !== null) {
    const name = match[1]!;
    if (!seen.has(name)) {
      seen.add(name);
      exports.push({ name, typeOnly: false });
    }
  }

  // Pattern 5: export enum Foo
  const reExportEnum = /export\s+enum\s+(\w+)/g;
  while ((match = reExportEnum.exec(source)) !== null) {
    const name = match[1]!;
    if (!seen.has(name)) {
      seen.add(name);
      exports.push({ name, typeOnly: false });
    }
  }

  // Pattern 6: export type Foo = ...
  const reExportType = /export\s+type\s+(\w+)\s*=/g;
  while ((match = reExportType.exec(source)) !== null) {
    const name = match[1]!;
    if (!seen.has(name)) {
      seen.add(name);
      exports.push({ name, typeOnly: true });
    }
  }

  // Pattern 7: export interface Foo
  const reExportInterface = /export\s+interface\s+(\w+)/g;
  while ((match = reExportInterface.exec(source)) !== null) {
    const name = match[1]!;
    if (!seen.has(name)) {
      seen.add(name);
      exports.push({ name, typeOnly: true });
    }
  }

  return exports.sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

/**
 * Compare current exports against a baseline and detect breaking changes.
 */
export function compareExports(
  baseline: ExportEntry[],
  current: ExportEntry[],
): { breaking: BreakingChange[]; added: string[] } {
  const currentMap = new Map(current.map((e) => [e.name, e]));
  const baselineMap = new Map(baseline.map((e) => [e.name, e]));

  const breaking: BreakingChange[] = [];
  const added: string[] = [];

  // Detect removals & type-kind changes
  for (const entry of baseline) {
    const cur = currentMap.get(entry.name);
    if (!cur) {
      breaking.push({
        symbol: entry.name,
        kind: 'removed',
        message: `Export "${entry.name}" was removed from the public API`,
      });
    } else if (!entry.typeOnly && cur.typeOnly) {
      // Value export changed to type-only — callers importing the value will break
      breaking.push({
        symbol: entry.name,
        kind: 'changed-to-type',
        message: `Export "${entry.name}" changed from value to type-only export`,
      });
    } else if (entry.typeOnly && !cur.typeOnly) {
      // Type-only → value is technically non-breaking for consumers, but
      // flag it as informational since it changes the contract
      breaking.push({
        symbol: entry.name,
        kind: 'changed-to-value',
        message: `Export "${entry.name}" changed from type-only to value export`,
      });
    }
  }

  // Detect additions
  for (const entry of current) {
    if (!baselineMap.has(entry.name)) {
      added.push(entry.name);
    }
  }

  return { breaking, added };
}

// ---------------------------------------------------------------------------
// Baseline I/O
// ---------------------------------------------------------------------------

function readBaseline(filePath: string): ApiBaseline | null {
  const abs = resolve(ROOT, filePath);
  if (!existsSync(abs)) return null;
  return JSON.parse(readFileSync(abs, 'utf-8')) as ApiBaseline;
}

function writeBaseline(filePath: string, baseline: ApiBaseline): void {
  const abs = resolve(ROOT, filePath);
  writeFileSync(abs, JSON.stringify(baseline, null, 2) + '\n', 'utf-8');
}

// ---------------------------------------------------------------------------
// Version helpers
// ---------------------------------------------------------------------------

interface PackageJson {
  name: string;
  version: string;
}

function readPackageVersion(pkgDir: string): string {
  const pkgPath = join(ROOT, pkgDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageJson;
  return pkg.version;
}

/**
 * Determine whether a version bump is sufficient for a breaking change.
 *
 * Pre-1.0: minor bump required (0.x.0 → 0.x+1.0)
 * Post-1.0: major bump required (x.0.0 → x+1.0.0)
 */
export function isBreakingBumpRequired(oldVersion: string, newVersion: string): boolean {
  const old = parseSimpleVersion(oldVersion);
  const cur = parseSimpleVersion(newVersion);
  if (!old || !cur) return true; // err on side of caution

  if (old.major === 0) {
    // Pre-1.0: breaking changes require at least a minor bump
    return cur.minor <= old.minor;
  }
  // Post-1.0: breaking changes require a major bump
  return cur.major <= old.major;
}

function parseSimpleVersion(v: string): { major: number; minor: number; patch: number } | null {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v);
  if (!m) return null;
  return { major: parseInt(m[1]!, 10), minor: parseInt(m[2]!, 10), patch: parseInt(m[3]!, 10) };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);
  const updateMode = args.includes('--update');
  const dryRun = args.includes('--dry-run');

  let hasFailure = false;

  console.log('=== Semver Compliance Check ===\n');

  for (const pkg of TRACKED_PACKAGES) {
    const entryPath = resolve(ROOT, pkg.entryPoint);
    if (!existsSync(entryPath)) {
      console.log(`⚠  ${pkg.name}: entry point not found (${pkg.entryPoint}), skipping`);
      continue;
    }

    const source = readFileSync(entryPath, 'utf-8');
    const currentExports = extractExports(source);

    console.log(`📦 ${pkg.name} — ${currentExports.length} public exports`);

    if (updateMode) {
      const baseline: ApiBaseline = {
        package: pkg.name,
        generatedAt: new Date().toISOString(),
        exports: currentExports,
      };
      writeBaseline(pkg.baselineFile, baseline);
      console.log(`   ✅ Baseline updated: ${pkg.baselineFile}\n`);
      continue;
    }

    const baseline = readBaseline(pkg.baselineFile);
    if (!baseline) {
      console.log(
        `   ⚠  No baseline found at ${pkg.baselineFile}. ` + `Run with --update to create one.\n`,
      );
      continue;
    }

    const { breaking, added } = compareExports(baseline.exports, currentExports);

    if (added.length > 0) {
      console.log(`   ➕ ${added.length} new export(s): ${added.join(', ')}`);
    }

    if (breaking.length === 0) {
      console.log('   ✅ No breaking changes detected\n');
      continue;
    }

    console.log(`   🚨 ${breaking.length} breaking change(s) detected:`);
    for (const b of breaking) {
      console.log(`      - [${b.kind}] ${b.message}`);
    }

    // Check whether the version has been bumped appropriately
    const pkgDir = pkg.entryPoint.split('/').slice(0, 2).join('/');
    const currentVersion = readPackageVersion(pkgDir);
    const baselineVersion = baseline.exports.length > 0 ? currentVersion : '0.0.0';

    // In a real CI scenario we'd compare against the base branch version.
    // For now, we flag the breaking changes and require the developer to
    // update the baseline after a proper version bump.
    if (!dryRun) {
      console.log(
        `\n   ❌ FAIL: Breaking changes detected without baseline update.` +
          `\n      Current version: ${currentVersion}` +
          `\n      To acknowledge a breaking change:` +
          `\n        1. Bump the version (minor for pre-1.0, major for post-1.0)` +
          `\n        2. Run: npx tsx scripts/check-semver-compliance.ts --update` +
          `\n        3. Commit the updated baseline\n`,
      );
      hasFailure = true;
    } else {
      console.log('   ℹ  Dry-run mode — not failing\n');
    }
  }

  if (hasFailure) {
    process.exit(1);
  }

  console.log('✅ Semver compliance check passed');
}

main();
