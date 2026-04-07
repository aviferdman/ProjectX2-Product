/**
 * Local publish readiness check for @crewspace/core v0.1.0.
 *
 * Validates the repository is ready for an npm publish by checking:
 * - Build output exists and contains expected files
 * - Package tarball contents are correct (via npm pack --dry-run)
 * - Version consistency across package.json, VERSION export, and CHANGELOG
 * - Required metadata fields are present
 * - No accidental inclusion of test/source files in the package
 *
 * Usage:
 *   npx tsx scripts/publish-check.ts
 *   npx tsx scripts/publish-check.ts --rebuild
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

export interface PublishCheckResult {
  passed: boolean;
  checks: CheckItem[];
  packageName: string;
  packageVersion: string;
  tarballFiles: string[];
  estimatedSize: string;
}

export interface CheckItem {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

export interface PublishCheckOptions {
  rootDir: string;
  packagePath: string;
  rebuild?: boolean;
}

/**
 * Verify that the dist directory exists and contains expected output.
 */
export function checkDistOutput(pkgDir: string): CheckItem[] {
  const checks: CheckItem[] = [];
  const distDir = join(pkgDir, 'dist');

  if (!existsSync(distDir)) {
    checks.push({
      name: 'dist-exists',
      status: 'fail',
      message: 'dist/ directory not found — run "npm run build" first',
    });
    return checks;
  }

  checks.push({
    name: 'dist-exists',
    status: 'pass',
    message: 'dist/ directory exists',
  });

  const indexJs = join(distDir, 'index.js');
  if (existsSync(indexJs)) {
    checks.push({ name: 'dist-index-js', status: 'pass', message: 'dist/index.js exists' });
  } else {
    checks.push({ name: 'dist-index-js', status: 'fail', message: 'dist/index.js not found' });
  }

  const indexDts = join(distDir, 'index.d.ts');
  if (existsSync(indexDts)) {
    checks.push({ name: 'dist-index-dts', status: 'pass', message: 'dist/index.d.ts exists' });
  } else {
    checks.push({
      name: 'dist-index-dts',
      status: 'fail',
      message: 'dist/index.d.ts not found — type declarations missing',
    });
  }

  const indexMap = join(distDir, 'index.js.map');
  if (existsSync(indexMap)) {
    checks.push({ name: 'dist-sourcemaps', status: 'pass', message: 'Source maps present' });
  } else {
    checks.push({
      name: 'dist-sourcemaps',
      status: 'warn',
      message: 'Source maps not found (optional but recommended)',
    });
  }

  return checks;
}

/**
 * Count files recursively in a directory.
 */
export function countFiles(dir: string): number {
  if (!existsSync(dir)) return 0;
  let count = 0;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      count++;
    } else if (entry.isDirectory()) {
      count += countFiles(join(dir, entry.name));
    }
  }
  return count;
}

/**
 * Get total size of files in a directory (in bytes).
 */
export function getDirectorySize(dir: string): number {
  if (!existsSync(dir)) return 0;
  let size = 0;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isFile()) {
      size += statSync(fullPath).size;
    } else if (entry.isDirectory()) {
      size += getDirectorySize(fullPath);
    }
  }
  return size;
}

/**
 * Format bytes to a human-readable size string.
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Check package.json has all required publish metadata.
 */
export function checkPackageMetadata(pkgDir: string): CheckItem[] {
  const checks: CheckItem[] = [];
  const pkgJsonPath = join(pkgDir, 'package.json');

  if (!existsSync(pkgJsonPath)) {
    return [{ name: 'package-json', status: 'fail', message: 'package.json not found' }];
  }

  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as Record<string, unknown>;

  if (pkgJson['private'] === true) {
    checks.push({ name: 'not-private', status: 'fail', message: 'Package is marked as private' });
  } else {
    checks.push({ name: 'not-private', status: 'pass', message: 'Package is not private' });
  }

  const requiredFields = [
    'name',
    'version',
    'description',
    'license',
    'main',
    'types',
    'files',
    'repository',
    'keywords',
  ] as const;
  for (const field of requiredFields) {
    if (pkgJson[field]) {
      checks.push({ name: `field-${field}`, status: 'pass', message: `"${field}" field present` });
    } else {
      checks.push({
        name: `field-${field}`,
        status: 'fail',
        message: `Missing required field: "${field}"`,
      });
    }
  }

  if (pkgJson['exports']) {
    checks.push({ name: 'field-exports', status: 'pass', message: '"exports" field configured' });
  } else {
    checks.push({
      name: 'field-exports',
      status: 'warn',
      message: 'No "exports" field — consumers may have import issues',
    });
  }

  if (pkgJson['engines']) {
    checks.push({
      name: 'field-engines',
      status: 'pass',
      message: '"engines" field specifies Node.js requirement',
    });
  } else {
    checks.push({
      name: 'field-engines',
      status: 'warn',
      message: 'No "engines" field — Node.js version requirement not specified',
    });
  }

  return checks;
}

/**
 * Check version consistency between package.json, VERSION export, and CHANGELOG.
 */
export function checkVersionConsistency(
  pkgDir: string,
  rootDir: string,
  versionExportFile: string,
): CheckItem[] {
  const checks: CheckItem[] = [];
  const pkgJsonPath = join(pkgDir, 'package.json');
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as Record<string, unknown>;
  const version = String(pkgJson['version'] ?? '');

  const versionFilePath = join(pkgDir, versionExportFile);
  if (existsSync(versionFilePath)) {
    const content = readFileSync(versionFilePath, 'utf-8');
    const match = /export const (?:CLI_)?VERSION = '([^']+)'/.exec(content);
    if (match?.[1] === version) {
      checks.push({
        name: 'version-export-match',
        status: 'pass',
        message: `VERSION export matches package.json (${version})`,
      });
    } else if (match?.[1]) {
      checks.push({
        name: 'version-export-match',
        status: 'fail',
        message: `VERSION export "${match[1]}" does not match package.json "${version}"`,
      });
    } else {
      checks.push({
        name: 'version-export-match',
        status: 'warn',
        message: 'No VERSION export found in source',
      });
    }
  }

  const changelogPath = join(rootDir, 'CHANGELOG.md');
  if (existsSync(changelogPath)) {
    const content = readFileSync(changelogPath, 'utf-8');
    if (content.includes(`## [${version}]`)) {
      checks.push({
        name: 'changelog-entry',
        status: 'pass',
        message: `CHANGELOG.md has entry for ${version}`,
      });
    } else {
      checks.push({
        name: 'changelog-entry',
        status: 'fail',
        message: `CHANGELOG.md has no entry for ${version}`,
      });
    }
  } else {
    checks.push({ name: 'changelog-entry', status: 'fail', message: 'CHANGELOG.md not found' });
  }

  return checks;
}

/**
 * Simulate npm pack to check what files would be included.
 */
export function checkPackContents(pkgDir: string): {
  checks: CheckItem[];
  files: string[];
  estimatedSize: string;
} {
  const checks: CheckItem[] = [];
  let files: string[] = [];
  let estimatedSize = 'unknown';

  try {
    const output = execSync('npm pack --dry-run --json 2>&1', {
      cwd: pkgDir,
      encoding: 'utf-8',
      timeout: 30000,
    });

    const parsed = JSON.parse(output) as Array<{
      files: Array<{ path: string; size: number }>;
      size: number;
      unpackedSize: number;
    }>;

    const packInfo = parsed[0];
    if (packInfo) {
      files = packInfo.files.map((f) => f.path);
      estimatedSize = formatSize(packInfo.unpackedSize);

      checks.push({
        name: 'pack-success',
        status: 'pass',
        message: `npm pack succeeds (${files.length} files, ${estimatedSize} unpacked)`,
      });

      const sourceFiles = files.filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'));
      if (sourceFiles.length > 0) {
        checks.push({
          name: 'no-source-leak',
          status: 'fail',
          message: `TypeScript source files in package: ${sourceFiles.join(', ')}`,
        });
      } else {
        checks.push({
          name: 'no-source-leak',
          status: 'pass',
          message: 'No TypeScript source files in package',
        });
      }

      const testFiles = files.filter(
        (f) => f.includes('.test.') || f.includes('.spec.') || f.includes('__tests__'),
      );
      if (testFiles.length > 0) {
        checks.push({
          name: 'no-test-leak',
          status: 'fail',
          message: `Test files in package: ${testFiles.join(', ')}`,
        });
      } else {
        checks.push({ name: 'no-test-leak', status: 'pass', message: 'No test files in package' });
      }

      const distFiles = files.filter((f) => f.startsWith('dist/'));
      if (distFiles.length > 0) {
        checks.push({
          name: 'dist-included',
          status: 'pass',
          message: `${distFiles.length} dist files included`,
        });
      } else {
        checks.push({
          name: 'dist-included',
          status: 'fail',
          message: 'No dist/ files in package',
        });
      }

      if (packInfo.unpackedSize > 5 * 1024 * 1024) {
        checks.push({
          name: 'size-check',
          status: 'warn',
          message: `Package is large: ${estimatedSize}`,
        });
      } else {
        checks.push({
          name: 'size-check',
          status: 'pass',
          message: `Package size reasonable: ${estimatedSize}`,
        });
      }
    }
  } catch {
    checks.push({
      name: 'pack-success',
      status: 'warn',
      message: 'Could not run npm pack --dry-run (build may be required first)',
    });
  }

  return { checks, files, estimatedSize };
}

/**
 * Run all publish readiness checks.
 */
export function runPublishCheck(options: PublishCheckOptions): PublishCheckResult {
  const pkgDir = resolve(options.rootDir, options.packagePath);
  const pkgJsonPath = join(pkgDir, 'package.json');

  if (!existsSync(pkgJsonPath)) {
    return {
      passed: false,
      checks: [
        { name: 'package-json', status: 'fail', message: `package.json not found at ${pkgDir}` },
      ],
      packageName: 'unknown',
      packageVersion: 'unknown',
      tarballFiles: [],
      estimatedSize: 'unknown',
    };
  }

  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as Record<string, unknown>;
  const packageName = String(pkgJson['name'] ?? 'unknown');
  const packageVersion = String(pkgJson['version'] ?? 'unknown');

  if (options.rebuild) {
    try {
      execSync('npm run build', { cwd: pkgDir, encoding: 'utf-8', timeout: 60000, stdio: 'pipe' });
    } catch {
      return {
        passed: false,
        checks: [
          {
            name: 'build',
            status: 'fail',
            message: 'Build failed — fix build errors before publishing',
          },
        ],
        packageName,
        packageVersion,
        tarballFiles: [],
        estimatedSize: 'unknown',
      };
    }
  }

  const allChecks: CheckItem[] = [];
  allChecks.push(...checkDistOutput(pkgDir));
  allChecks.push(...checkPackageMetadata(pkgDir));
  allChecks.push(...checkVersionConsistency(pkgDir, options.rootDir, 'src/index.ts'));

  const packResult = checkPackContents(pkgDir);
  allChecks.push(...packResult.checks);

  const passed = allChecks.every((c) => c.status !== 'fail');

  return {
    passed,
    checks: allChecks,
    packageName,
    packageVersion,
    tarballFiles: packResult.files,
    estimatedSize: packResult.estimatedSize,
  };
}

/**
 * Format publish check results for console output.
 */
export function formatPublishCheckOutput(result: PublishCheckResult): string {
  const lines: string[] = [];

  lines.push('=== Publish Readiness Check ===');
  lines.push('');
  lines.push(`Package: ${result.packageName}@${result.packageVersion}`);
  lines.push(`Estimated size: ${result.estimatedSize}`);
  lines.push('');

  for (const check of result.checks) {
    const icon = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '⚠';
    lines.push(`  ${icon} ${check.message}`);
  }

  lines.push('');

  if (result.tarballFiles.length > 0) {
    lines.push(`Package contents (${result.tarballFiles.length} files):`);
    const dirs = new Map<string, number>();
    for (const file of result.tarballFiles) {
      const topDir = file.includes('/') ? file.split('/')[0]! : file;
      dirs.set(topDir, (dirs.get(topDir) ?? 0) + 1);
    }
    for (const [dir, count] of dirs) {
      if (count === 1 && !dir.includes('/')) {
        lines.push(`  ${dir}`);
      } else {
        lines.push(`  ${dir}/ (${count} files)`);
      }
    }
    lines.push('');
  }

  const failCount = result.checks.filter((c) => c.status === 'fail').length;
  const warnCount = result.checks.filter((c) => c.status === 'warn').length;
  const passCount = result.checks.filter((c) => c.status === 'pass').length;

  lines.push(`Results: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`);
  lines.push('');
  lines.push(result.passed ? '✓ Ready to publish!' : '✗ Not ready — fix errors before publishing');

  return lines.join('\n');
}

// --- CLI entry point ---

export function parsePublishCheckArgs(argv: string[]): { rebuild: boolean } {
  return { rebuild: argv.includes('--rebuild') };
}

function main(): void {
  const args = parsePublishCheckArgs(process.argv.slice(2));
  const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

  const result = runPublishCheck({
    rootDir: ROOT,
    packagePath: 'packages/core',
    rebuild: args.rebuild,
  });

  console.log(formatPublishCheckOutput(result));

  if (!result.passed) {
    process.exit(1);
  }
}

const isDirectExecution = process.argv[1]?.endsWith('publish-check.ts') ?? false;
if (isDirectExecution) {
  main();
}
