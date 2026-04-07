/**
 * Version bump script for the Crewspace monorepo.
 *
 * Automates version bumping across all configured packages:
 * 1. Validates the requested bump type and target version
 * 2. Updates package.json version in all packages
 * 3. Updates VERSION / CLI_VERSION exports in source files
 * 4. Validates the result with semver rules
 *
 * Usage:
 *   npx tsx scripts/version-bump.ts --bump minor
 *   npx tsx scripts/version-bump.ts --bump patch --preid beta
 *   npx tsx scripts/version-bump.ts --to 0.2.0
 *   npx tsx scripts/version-bump.ts --bump major --dry-run
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { isValidSemver, bumpVersion, compareSemver, parseSemver, formatSemver } from './semver.js';
import type { BumpType } from './semver.js';

export interface VersionBumpOptions {
  rootDir: string;
  packages: PackageBumpInfo[];
  bump?: BumpType;
  to?: string;
  preid?: string;
  dryRun?: boolean;
}

export interface PackageBumpInfo {
  /** Package path relative to repo root */
  path: string;
  /** npm package name */
  name: string;
  /** File containing the version export, relative to package path */
  versionExportFile: string;
  /** The exported constant name (e.g., "VERSION" or "CLI_VERSION") */
  versionExportName: string;
}

export interface VersionBumpResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  updatedFiles: string[];
  errors: string[];
}

/**
 * Read the current version from the first package's package.json.
 */
export function readCurrentVersion(rootDir: string, packagePath: string): string | null {
  const pkgJsonPath = join(rootDir, packagePath, 'package.json');
  if (!existsSync(pkgJsonPath)) return null;
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as { version?: string };
  return pkgJson.version ?? null;
}

/**
 * Compute the target version from bump options.
 */
export function computeTargetVersion(
  currentVersion: string,
  options: Pick<VersionBumpOptions, 'bump' | 'to' | 'preid'>,
): { version: string | null; error: string | null } {
  if (options.to) {
    if (!isValidSemver(options.to)) {
      return { version: null, error: `Invalid target version: "${options.to}"` };
    }
    if (compareSemver(options.to, currentVersion) <= 0) {
      return {
        version: null,
        error: `Target version "${options.to}" must be greater than current "${currentVersion}"`,
      };
    }
    return { version: options.to, error: null };
  }

  if (options.bump) {
    try {
      const next = bumpVersion(currentVersion, options.bump, options.preid);
      return { version: next, error: null };
    } catch (err) {
      return { version: null, error: err instanceof Error ? err.message : String(err) };
    }
  }

  return { version: null, error: 'Either --bump or --to must be specified' };
}

/**
 * Update the version field in a package.json file.
 * Returns the file path if updated, or null if skipped/failed.
 */
export function updatePackageJson(
  rootDir: string,
  packagePath: string,
  newVersion: string,
  dryRun: boolean,
): { path: string; error: string | null } {
  const pkgJsonPath = join(rootDir, packagePath, 'package.json');

  if (!existsSync(pkgJsonPath)) {
    return { path: pkgJsonPath, error: `package.json not found at ${pkgJsonPath}` };
  }

  const content = readFileSync(pkgJsonPath, 'utf-8');
  const pkgJson = JSON.parse(content) as Record<string, unknown>;
  pkgJson['version'] = newVersion;

  if (!dryRun) {
    writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
  }

  return { path: pkgJsonPath, error: null };
}

/**
 * Update a VERSION export constant in a source file.
 * Matches patterns like: export const VERSION = '0.1.0';
 */
export function updateVersionExport(
  rootDir: string,
  packagePath: string,
  exportFile: string,
  exportName: string,
  newVersion: string,
  dryRun: boolean,
): { path: string; error: string | null } {
  const filePath = join(rootDir, packagePath, exportFile);

  if (!existsSync(filePath)) {
    return { path: filePath, error: `Version export file not found: ${filePath}` };
  }

  const content = readFileSync(filePath, 'utf-8');
  const pattern = new RegExp(`(export const ${exportName} = ')[^']+(')`);
  const match = pattern.exec(content);

  if (!match) {
    return { path: filePath, error: `No "${exportName}" export found in ${filePath}` };
  }

  const updated = content.replace(pattern, `$1${newVersion}$2`);

  if (!dryRun) {
    writeFileSync(filePath, updated);
  }

  return { path: filePath, error: null };
}

/**
 * Run the version bump across all configured packages.
 */
export function runVersionBump(options: VersionBumpOptions): VersionBumpResult {
  const { rootDir, packages, dryRun = false } = options;
  const errors: string[] = [];
  const updatedFiles: string[] = [];

  if (packages.length === 0) {
    return {
      success: false,
      fromVersion: '',
      toVersion: '',
      updatedFiles: [],
      errors: ['No packages configured'],
    };
  }

  // Read current version from the first package
  const currentVersion = readCurrentVersion(rootDir, packages[0]!.path);
  if (!currentVersion) {
    return {
      success: false,
      fromVersion: '',
      toVersion: '',
      updatedFiles: [],
      errors: [`Could not read current version from ${packages[0]!.path}/package.json`],
    };
  }

  // Compute target version
  const { version: targetVersion, error: computeError } = computeTargetVersion(
    currentVersion,
    options,
  );
  if (!targetVersion || computeError) {
    return {
      success: false,
      fromVersion: currentVersion,
      toVersion: '',
      updatedFiles: [],
      errors: [computeError ?? 'Failed to compute target version'],
    };
  }

  // Update each package
  for (const pkg of packages) {
    // Update package.json
    const pkgResult = updatePackageJson(rootDir, pkg.path, targetVersion, dryRun);
    if (pkgResult.error) {
      errors.push(pkgResult.error);
    } else {
      updatedFiles.push(pkgResult.path);
    }

    // Update version export
    const exportResult = updateVersionExport(
      rootDir,
      pkg.path,
      pkg.versionExportFile,
      pkg.versionExportName,
      targetVersion,
      dryRun,
    );
    if (exportResult.error) {
      errors.push(exportResult.error);
    } else {
      updatedFiles.push(exportResult.path);
    }
  }

  return {
    success: errors.length === 0,
    fromVersion: currentVersion,
    toVersion: targetVersion,
    updatedFiles,
    errors,
  };
}

/**
 * Format version bump results for console output.
 */
export function formatBumpOutput(result: VersionBumpResult, dryRun: boolean): string {
  const lines: string[] = [];

  lines.push('=== Version Bump ===');
  if (dryRun) {
    lines.push('(DRY RUN — no files will be modified)');
  }
  lines.push('');

  if (result.success) {
    lines.push(`✓ ${result.fromVersion} → ${result.toVersion}`);
    lines.push('');
    lines.push('Updated files:');
    for (const file of result.updatedFiles) {
      lines.push(`  • ${file}`);
    }
    lines.push('');
    lines.push('Next steps:');
    lines.push('  1. Update CHANGELOG.md with new entries under [Unreleased]');
    lines.push('  2. Commit the version bump');
    lines.push(`  3. Run: npm run release -- --version ${result.toVersion}`);
  } else {
    lines.push(`✗ Version bump failed`);
    for (const err of result.errors) {
      lines.push(`  - ${err}`);
    }
  }

  return lines.join('\n');
}

/**
 * Parse CLI arguments for the version-bump script.
 */
export function parseBumpArgs(argv: string[]): {
  bump?: BumpType;
  to?: string;
  preid?: string;
  dryRun: boolean;
} {
  let bump: BumpType | undefined;
  let to: string | undefined;
  let preid: string | undefined;
  let dryRun = false;

  const validBumps = new Set<string>([
    'major',
    'minor',
    'patch',
    'premajor',
    'preminor',
    'prepatch',
    'prerelease',
  ]);

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--bump' && argv[i + 1]) {
      const val = argv[i + 1]!;
      if (!validBumps.has(val)) {
        console.error(`Invalid bump type: "${val}". Valid types: ${[...validBumps].join(', ')}`);
        process.exit(1);
      }
      bump = val as BumpType;
      i++;
    }
    if (argv[i] === '--to' && argv[i + 1]) {
      to = argv[i + 1]!;
      i++;
    }
    if (argv[i] === '--preid' && argv[i + 1]) {
      preid = argv[i + 1]!;
      i++;
    }
    if (argv[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { bump, to, preid, dryRun };
}

// --- CLI entry point ---

function main(): void {
  const args = parseBumpArgs(process.argv.slice(2));

  if (!args.bump && !args.to) {
    console.error('Usage: version-bump.ts --bump <type> [--preid <id>] [--dry-run]');
    console.error('       version-bump.ts --to <version> [--dry-run]');
    console.error('');
    console.error('Bump types: major, minor, patch, premajor, preminor, prepatch, prerelease');
    console.error('');
    console.error('Examples:');
    console.error('  npx tsx scripts/version-bump.ts --bump minor');
    console.error('  npx tsx scripts/version-bump.ts --bump prerelease --preid beta');
    console.error('  npx tsx scripts/version-bump.ts --to 1.0.0');
    console.error('  npx tsx scripts/version-bump.ts --bump patch --dry-run');
    process.exit(1);
  }

  const ROOT = resolve(import.meta.dirname ?? '.', '..');

  const packages: PackageBumpInfo[] = [
    {
      path: 'packages/core',
      name: '@crewspace/core',
      versionExportFile: 'src/index.ts',
      versionExportName: 'VERSION',
    },
    {
      path: 'packages/cli',
      name: '@crewspace/cli',
      versionExportFile: 'src/index.ts',
      versionExportName: 'CLI_VERSION',
    },
  ];

  const result = runVersionBump({
    rootDir: ROOT,
    packages,
    bump: args.bump,
    to: args.to,
    preid: args.preid,
    dryRun: args.dryRun,
  });

  console.log(formatBumpOutput(result, args.dryRun ?? false));

  if (!result.success) {
    process.exit(1);
  }
}

const isDirectExecution = process.argv[1]?.endsWith('version-bump.ts') ?? false;
if (isDirectExecution) {
  main();
}
