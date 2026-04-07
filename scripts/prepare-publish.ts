/**
 * Publish preparation and validation script.
 *
 * Validates that the repository is ready for an npm publish:
 * - Tag version matches package.json versions
 * - VERSION exports match package.json
 * - CHANGELOG has an entry for the release version
 * - Required files exist in each package
 * - Package.json has required publish fields
 *
 * Usage:
 *   npx tsx scripts/prepare-publish.ts --tag v0.1.0
 *   npx tsx scripts/prepare-publish.ts --tag v0.1.0 --dry-run
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

export interface PackageInfo {
  path: string;
  name: string;
  versionExport: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  packageName: string;
  packageVersion: string;
}

export interface PublishValidationOptions {
  tag: string;
  rootDir: string;
  packages: PackageInfo[];
  dryRun?: boolean;
}

const REQUIRED_PACKAGE_FIELDS = [
  'name',
  'version',
  'description',
  'license',
  'main',
  'types',
  'files',
] as const;

const REQUIRED_PACKAGE_FILES = ['README.md', 'LICENSE'] as const;

const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Extract semver version from a git tag string (e.g., "v1.2.3" → "1.2.3").
 */
export function extractVersionFromTag(tag: string): string | null {
  const match = /^v(.+)$/.exec(tag);
  if (!match?.[1]) return null;
  return SEMVER_RE.test(match[1]) ? match[1] : null;
}

/**
 * Validate a single package is ready for publishing.
 */
export function validatePackage(
  packageInfo: PackageInfo,
  expectedVersion: string,
  rootDir: string,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pkgDir = resolve(rootDir, packageInfo.path);
  const pkgJsonPath = join(pkgDir, 'package.json');

  // Check package.json exists
  if (!existsSync(pkgJsonPath)) {
    return {
      valid: false,
      errors: [`package.json not found at ${pkgJsonPath}`],
      warnings: [],
      packageName: packageInfo.name,
      packageVersion: '',
    };
  }

  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as Record<string, unknown>;
  const packageVersion = String(pkgJson['version'] ?? '');

  // Validate required fields
  for (const field of REQUIRED_PACKAGE_FIELDS) {
    if (!pkgJson[field]) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  // Validate version matches tag
  if (packageVersion !== expectedVersion) {
    errors.push(
      `Version mismatch: package.json has "${packageVersion}", expected "${expectedVersion}" from tag`,
    );
  }

  // Validate semver
  if (!SEMVER_RE.test(packageVersion)) {
    errors.push(`Invalid semver version: "${packageVersion}"`);
  }

  // Validate VERSION export matches
  const versionExportPath = join(pkgDir, packageInfo.versionExport);
  if (existsSync(versionExportPath)) {
    const content = readFileSync(versionExportPath, 'utf-8');
    const versionMatch = /export const (?:CLI_)?VERSION = '([^']+)'/.exec(content);
    if (versionMatch?.[1]) {
      if (versionMatch[1] !== packageVersion) {
        errors.push(
          `VERSION export mismatch: "${versionMatch[1]}" vs package.json "${packageVersion}"`,
        );
      }
    } else {
      warnings.push('No VERSION export found in source');
    }
  } else {
    warnings.push(`Version export file not found: ${packageInfo.versionExport}`);
  }

  // Validate required files exist
  for (const file of REQUIRED_PACKAGE_FILES) {
    if (!existsSync(join(pkgDir, file))) {
      errors.push(`Required file missing: ${file}`);
    }
  }

  // Validate files field lists dist
  const filesField = pkgJson['files'] as string[] | undefined;
  if (Array.isArray(filesField)) {
    if (!filesField.includes('dist')) {
      errors.push('"files" field in package.json must include "dist"');
    }
  }

  // Check for private flag
  if (pkgJson['private'] === true) {
    errors.push('Package is marked as private — cannot publish');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    packageName: packageInfo.name,
    packageVersion,
  };
}

/**
 * Validate the CHANGELOG has an entry for the given version.
 */
export function validateChangelog(
  version: string,
  rootDir: string,
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const changelogPath = join(rootDir, 'CHANGELOG.md');

  if (!existsSync(changelogPath)) {
    return { valid: false, errors: ['CHANGELOG.md not found'], warnings: [] };
  }

  const content = readFileSync(changelogPath, 'utf-8');

  if (!content.includes(`## [${version}]`)) {
    errors.push(`CHANGELOG.md has no entry for version ${version}`);
  }

  if (!content.includes('# Changelog')) {
    errors.push('CHANGELOG.md missing title');
  }

  if (!content.includes('[Unreleased]')) {
    warnings.push('CHANGELOG.md has no [Unreleased] section');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Run full publish validation.
 */
export function validatePublish(options: PublishValidationOptions): {
  valid: boolean;
  results: ValidationResult[];
  changelogResult: { valid: boolean; errors: string[]; warnings: string[] };
  tagVersion: string | null;
} {
  const tagVersion = extractVersionFromTag(options.tag);

  if (!tagVersion) {
    return {
      valid: false,
      results: [],
      changelogResult: {
        valid: false,
        errors: [`Invalid tag format: "${options.tag}". Expected "v<semver>"`],
        warnings: [],
      },
      tagVersion: null,
    };
  }

  const results = options.packages.map((pkg) => validatePackage(pkg, tagVersion, options.rootDir));

  const changelogResult = validateChangelog(tagVersion, options.rootDir);

  const valid = results.every((r) => r.valid) && changelogResult.valid;

  return { valid, results, changelogResult, tagVersion };
}

/**
 * Format validation results for console output.
 */
export function formatValidationOutput(validation: ReturnType<typeof validatePublish>): string {
  const lines: string[] = [];

  lines.push('=== Publish Validation ===');
  lines.push('');

  if (!validation.tagVersion) {
    lines.push(`ERROR: Invalid tag format`);
    for (const err of validation.changelogResult.errors) {
      lines.push(`  ✗ ${err}`);
    }
    return lines.join('\n');
  }

  lines.push(`Tag version: ${validation.tagVersion}`);
  lines.push('');

  for (const result of validation.results) {
    lines.push(`Package: ${result.packageName}@${result.packageVersion}`);
    if (result.errors.length === 0) {
      lines.push('  ✓ All checks passed');
    }
    for (const err of result.errors) {
      lines.push(`  ✗ ${err}`);
    }
    for (const warn of result.warnings) {
      lines.push(`  ⚠ ${warn}`);
    }
    lines.push('');
  }

  lines.push('CHANGELOG.md');
  if (validation.changelogResult.errors.length === 0) {
    lines.push('  ✓ All checks passed');
  }
  for (const err of validation.changelogResult.errors) {
    lines.push(`  ✗ ${err}`);
  }
  for (const warn of validation.changelogResult.warnings) {
    lines.push(`  ⚠ ${warn}`);
  }

  lines.push('');
  lines.push(
    validation.valid ? '✓ Ready to publish' : '✗ Validation failed — fix errors before publishing',
  );

  return lines.join('\n');
}

// --- CLI entry point ---

export function parseArgs(argv: string[]): { tag: string; dryRun: boolean } {
  let tag = '';
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--tag' && argv[i + 1]) {
      tag = argv[i + 1]!;
      i++;
    }
    if (argv[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { tag, dryRun };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (!args.tag) {
    console.error('Usage: prepare-publish.ts --tag <tag> [--dry-run]');
    process.exit(1);
  }

  const ROOT = resolve(import.meta.dirname ?? '.', '..');

  const packages: PackageInfo[] = [
    {
      path: 'packages/core',
      name: '@crewspace/core',
      versionExport: 'src/index.ts',
    },
    {
      path: 'packages/cli',
      name: '@crewspace/cli',
      versionExport: 'src/index.ts',
    },
  ];

  const validation = validatePublish({
    tag: args.tag,
    rootDir: ROOT,
    packages,
    dryRun: args.dryRun,
  });

  console.log(formatValidationOutput(validation));

  if (!validation.valid) {
    process.exit(1);
  }

  if (args.dryRun) {
    console.log('\n(dry run — no changes made)');
  }
}

// Only run CLI when executed directly (not imported in tests)
const isDirectExecution = process.argv[1]?.endsWith('prepare-publish.ts') ?? false;
if (isDirectExecution) {
  main();
}
