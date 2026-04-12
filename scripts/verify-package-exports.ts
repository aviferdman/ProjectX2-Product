/**
 * Package exports verification script.
 *
 * Validates that all export paths defined in package.json "exports" map
 * resolve to real files in the dist directory. This catches misconfigurations
 * that would cause import failures for consumers.
 *
 * Usage:
 *   npx tsx scripts/verify-package-exports.ts
 *   npx tsx scripts/verify-package-exports.ts --package packages/core
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ExportEntry {
  /** The export path (e.g., ".", "./testing") */
  subpath: string;
  /** Condition → file path mappings */
  conditions: Record<string, string>;
}

export interface ExportCheckResult {
  subpath: string;
  condition: string;
  filePath: string;
  resolvedPath: string;
  exists: boolean;
}

export interface VerifyExportsResult {
  packageName: string;
  packageVersion: string;
  passed: boolean;
  checks: ExportCheckResult[];
  errors: string[];
  warnings: string[];
}

/**
 * Parse the "exports" field from package.json into a flat list of entries.
 */
export function parseExportsField(exports: Record<string, unknown>): ExportEntry[] {
  const entries: ExportEntry[] = [];

  for (const [subpath, value] of Object.entries(exports)) {
    if (typeof value === 'string') {
      entries.push({ subpath, conditions: { default: value } });
    } else if (typeof value === 'object' && value !== null) {
      const conditions: Record<string, string> = {};
      for (const [condition, target] of Object.entries(value as Record<string, unknown>)) {
        if (typeof target === 'string') {
          conditions[condition] = target;
        }
      }
      if (Object.keys(conditions).length > 0) {
        entries.push({ subpath, conditions });
      }
    }
  }

  return entries;
}

/**
 * Verify that all export targets resolve to existing files.
 */
export function verifyExports(pkgDir: string): VerifyExportsResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checks: ExportCheckResult[] = [];

  const pkgJsonPath = join(pkgDir, 'package.json');
  if (!existsSync(pkgJsonPath)) {
    return {
      packageName: 'unknown',
      packageVersion: 'unknown',
      passed: false,
      checks: [],
      errors: ['package.json not found'],
      warnings: [],
    };
  }

  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as Record<string, unknown>;
  const packageName = String(pkgJson['name'] ?? 'unknown');
  const packageVersion = String(pkgJson['version'] ?? 'unknown');

  // Check "exports" field
  const exportsField = pkgJson['exports'] as Record<string, unknown> | undefined;
  if (!exportsField) {
    warnings.push('No "exports" field in package.json');
  } else {
    const entries = parseExportsField(exportsField);
    for (const entry of entries) {
      for (const [condition, filePath] of Object.entries(entry.conditions)) {
        const resolvedPath = resolve(pkgDir, filePath);
        const exists = existsSync(resolvedPath);

        checks.push({
          subpath: entry.subpath,
          condition,
          filePath,
          resolvedPath,
          exists,
        });

        if (!exists) {
          errors.push(`exports["${entry.subpath}"].${condition} → "${filePath}" not found`);
        }
      }
    }
  }

  // Check "main" field
  const mainField = pkgJson['main'] as string | undefined;
  if (mainField) {
    const mainPath = resolve(pkgDir, mainField);
    const exists = existsSync(mainPath);
    checks.push({
      subpath: '(main)',
      condition: 'main',
      filePath: mainField,
      resolvedPath: mainPath,
      exists,
    });
    if (!exists) {
      errors.push(`"main" field → "${mainField}" not found`);
    }
  }

  // Check "module" field
  const moduleField = pkgJson['module'] as string | undefined;
  if (moduleField) {
    const modulePath = resolve(pkgDir, moduleField);
    const exists = existsSync(modulePath);
    checks.push({
      subpath: '(module)',
      condition: 'module',
      filePath: moduleField,
      resolvedPath: modulePath,
      exists,
    });
    if (!exists) {
      errors.push(`"module" field → "${moduleField}" not found`);
    }
  }

  // Check "types" field
  const typesField = pkgJson['types'] as string | undefined;
  if (typesField) {
    const typesPath = resolve(pkgDir, typesField);
    const exists = existsSync(typesPath);
    checks.push({
      subpath: '(types)',
      condition: 'types',
      filePath: typesField,
      resolvedPath: typesPath,
      exists,
    });
    if (!exists) {
      errors.push(`"types" field → "${typesField}" not found`);
    }
  }

  return {
    packageName,
    packageVersion,
    passed: errors.length === 0,
    checks,
    errors,
    warnings,
  };
}

/**
 * Format verification results for console output.
 */
export function formatVerifyExportsOutput(result: VerifyExportsResult): string {
  const lines: string[] = [];

  lines.push('=== Package Exports Verification ===');
  lines.push('');
  lines.push(`Package: ${result.packageName}@${result.packageVersion}`);
  lines.push('');

  for (const check of result.checks) {
    const icon = check.exists ? '✓' : '✗';
    const label = check.subpath.startsWith('(')
      ? check.subpath
      : `exports["${check.subpath}"].${check.condition}`;
    lines.push(`  ${icon} ${label} → ${check.filePath}`);
  }

  lines.push('');

  for (const warn of result.warnings) {
    lines.push(`  ⚠ ${warn}`);
  }

  for (const err of result.errors) {
    lines.push(`  ✗ ${err}`);
  }

  lines.push('');
  const passCount = result.checks.filter((c) => c.exists).length;
  const failCount = result.checks.filter((c) => !c.exists).length;
  lines.push(`Results: ${passCount} resolved, ${failCount} missing`);
  lines.push('');
  lines.push(
    result.passed
      ? '✓ All exports resolve correctly'
      : '✗ Some exports do not resolve — fix before publishing',
  );

  return lines.join('\n');
}

/**
 * Parse CLI arguments.
 */
export function parseVerifyExportsArgs(argv: string[]): { packagePath: string } {
  let packagePath = 'packages/core';

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--package' && argv[i + 1]) {
      packagePath = argv[i + 1]!;
      i++;
    }
  }

  return { packagePath };
}

// --- CLI entry point ---

function main(): void {
  const args = parseVerifyExportsArgs(process.argv.slice(2));
  const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const pkgDir = resolve(ROOT, args.packagePath);

  const result = verifyExports(pkgDir);
  console.log(formatVerifyExportsOutput(result));

  if (!result.passed) {
    process.exit(1);
  }
}

const isDirectExecution = process.argv[1]?.endsWith('verify-package-exports.ts') ?? false;
if (isDirectExecution) {
  main();
}
