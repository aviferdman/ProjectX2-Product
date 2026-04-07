/**
 * Release orchestration script for the Crewspace monorepo.
 *
 * Automates the release process by:
 * 1. Validating the working tree is clean
 * 2. Running publish readiness checks
 * 3. Running version consistency checks
 * 4. Creating a git tag for the release
 * 5. Optionally pushing the tag to trigger the publish workflow
 *
 * Usage:
 *   npx tsx scripts/release.ts --version 0.1.0
 *   npx tsx scripts/release.ts --version 0.1.0 --dry-run
 *   npx tsx scripts/release.ts --version 0.1.0 --skip-push
 */

import { existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { validatePublish } from './prepare-publish.js';
import type { PackageInfo } from './prepare-publish.js';

export interface ReleaseOptions {
  version: string;
  rootDir: string;
  packages: PackageInfo[];
  dryRun?: boolean;
  skipPush?: boolean;
}

export interface ReleaseStepResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
}

export interface ReleaseResult {
  success: boolean;
  version: string;
  tag: string;
  steps: ReleaseStepResult[];
}

/**
 * Check that the git working tree is clean (no uncommitted changes).
 */
export function checkWorkingTree(rootDir: string): ReleaseStepResult {
  try {
    const status = execSync('git status --porcelain', {
      cwd: rootDir,
      encoding: 'utf-8',
      timeout: 15000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (status.length > 0) {
      const changedFiles = status.split('\n').length;
      return {
        name: 'clean-working-tree',
        status: 'fail',
        message: `Working tree has ${changedFiles} uncommitted change(s). Commit or stash before releasing.`,
      };
    }

    return {
      name: 'clean-working-tree',
      status: 'pass',
      message: 'Working tree is clean',
    };
  } catch {
    return {
      name: 'clean-working-tree',
      status: 'fail',
      message: 'Failed to check git status — is this a git repository?',
    };
  }
}

/**
 * Check that the current branch is main (or allowed release branch).
 */
export function checkBranch(
  rootDir: string,
  allowedBranches: string[] = ['main'],
): ReleaseStepResult {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: rootDir,
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (!allowedBranches.includes(branch)) {
      return {
        name: 'release-branch',
        status: 'fail',
        message: `Current branch "${branch}" is not an allowed release branch (${allowedBranches.join(', ')})`,
      };
    }

    return {
      name: 'release-branch',
      status: 'pass',
      message: `On release branch: ${branch}`,
    };
  } catch {
    return {
      name: 'release-branch',
      status: 'fail',
      message: 'Failed to determine current branch',
    };
  }
}

/**
 * Check that a git tag does not already exist.
 */
export function checkTagNotExists(tag: string, rootDir: string): ReleaseStepResult {
  try {
    const existingTags = execSync('git tag --list', {
      cwd: rootDir,
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    const tags = existingTags.split('\n').filter(Boolean);
    if (tags.includes(tag)) {
      return {
        name: 'tag-not-exists',
        status: 'fail',
        message: `Tag "${tag}" already exists. Delete it first or choose a different version.`,
      };
    }

    return {
      name: 'tag-not-exists',
      status: 'pass',
      message: `Tag "${tag}" is available`,
    };
  } catch {
    return {
      name: 'tag-not-exists',
      status: 'fail',
      message: 'Failed to list git tags',
    };
  }
}

/**
 * Validate package versions and changelog via prepare-publish checks.
 */
export function validateRelease(
  version: string,
  rootDir: string,
  packages: PackageInfo[],
): ReleaseStepResult {
  const tag = `v${version}`;
  const validation = validatePublish({ tag, rootDir, packages });

  if (!validation.valid) {
    const allErrors: string[] = [];
    for (const result of validation.results) {
      allErrors.push(...result.errors);
    }
    allErrors.push(...validation.changelogResult.errors);

    return {
      name: 'publish-validation',
      status: 'fail',
      message: `Publish validation failed:\n${allErrors.map((e) => `  - ${e}`).join('\n')}`,
    };
  }

  return {
    name: 'publish-validation',
    status: 'pass',
    message: `All publish validations passed for v${version}`,
  };
}

/**
 * Verify the build output exists for all packages.
 */
export function checkBuildOutput(rootDir: string, packages: PackageInfo[]): ReleaseStepResult {
  const missing: string[] = [];

  for (const pkg of packages) {
    const distDir = join(rootDir, pkg.path, 'dist');
    if (!existsSync(distDir)) {
      missing.push(pkg.name);
    }
  }

  if (missing.length > 0) {
    return {
      name: 'build-output',
      status: 'fail',
      message: `Missing dist/ for: ${missing.join(', ')}. Run "npm run build" first.`,
    };
  }

  return {
    name: 'build-output',
    status: 'pass',
    message: 'Build output exists for all packages',
  };
}

/**
 * Create a git tag for the release.
 */
export function createTag(
  tag: string,
  version: string,
  rootDir: string,
  dryRun: boolean,
): ReleaseStepResult {
  if (dryRun) {
    return {
      name: 'create-tag',
      status: 'skip',
      message: `[dry-run] Would create tag: ${tag}`,
    };
  }

  try {
    execSync(`git tag -a ${tag} -m "Release ${version}"`, {
      cwd: rootDir,
      encoding: 'utf-8',
      timeout: 15000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return {
      name: 'create-tag',
      status: 'pass',
      message: `Created tag: ${tag}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      name: 'create-tag',
      status: 'fail',
      message: `Failed to create tag: ${message}`,
    };
  }
}

/**
 * Push the git tag to the remote to trigger the publish workflow.
 */
export function pushTag(
  tag: string,
  rootDir: string,
  dryRun: boolean,
  skipPush: boolean,
): ReleaseStepResult {
  if (dryRun) {
    return {
      name: 'push-tag',
      status: 'skip',
      message: `[dry-run] Would push tag: ${tag}`,
    };
  }

  if (skipPush) {
    return {
      name: 'push-tag',
      status: 'skip',
      message: `Tag created but not pushed (--skip-push). Push manually with: git push origin ${tag}`,
    };
  }

  try {
    execSync(`git push origin ${tag}`, {
      cwd: rootDir,
      encoding: 'utf-8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return {
      name: 'push-tag',
      status: 'pass',
      message: `Pushed tag ${tag} to origin — publish workflow will start automatically`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      name: 'push-tag',
      status: 'fail',
      message: `Failed to push tag: ${message}`,
    };
  }
}

/**
 * Run the full release process.
 */
export function runRelease(options: ReleaseOptions): ReleaseResult {
  const { version, rootDir, packages, dryRun = false, skipPush = false } = options;
  const tag = `v${version}`;
  const steps: ReleaseStepResult[] = [];

  // Step 1: Validate release metadata
  const validationStep = validateRelease(version, rootDir, packages);
  steps.push(validationStep);
  if (validationStep.status === 'fail') {
    return { success: false, version, tag, steps };
  }

  // Step 2: Check build output exists
  const buildStep = checkBuildOutput(rootDir, packages);
  steps.push(buildStep);
  if (buildStep.status === 'fail') {
    return { success: false, version, tag, steps };
  }

  // Step 3: Check working tree is clean
  const workingTreeStep = checkWorkingTree(rootDir);
  steps.push(workingTreeStep);
  if (workingTreeStep.status === 'fail' && !dryRun) {
    return { success: false, version, tag, steps };
  }

  // Step 4: Check branch
  const branchStep = checkBranch(rootDir);
  steps.push(branchStep);
  if (branchStep.status === 'fail' && !dryRun) {
    return { success: false, version, tag, steps };
  }

  // Step 5: Check tag doesn't exist
  const tagExistsStep = checkTagNotExists(tag, rootDir);
  steps.push(tagExistsStep);
  if (tagExistsStep.status === 'fail') {
    return { success: false, version, tag, steps };
  }

  // Step 6: Create tag
  const createTagStep = createTag(tag, version, rootDir, dryRun);
  steps.push(createTagStep);
  if (createTagStep.status === 'fail') {
    return { success: false, version, tag, steps };
  }

  // Step 7: Push tag
  const pushTagStep = pushTag(tag, rootDir, dryRun, skipPush);
  steps.push(pushTagStep);
  if (pushTagStep.status === 'fail') {
    return { success: false, version, tag, steps };
  }

  return { success: true, version, tag, steps };
}

/**
 * Format release results for console output.
 */
export function formatReleaseOutput(result: ReleaseResult, dryRun: boolean): string {
  const lines: string[] = [];

  lines.push(`=== Release ${result.version} ===`);
  if (dryRun) {
    lines.push('(DRY RUN — no changes will be made)');
  }
  lines.push('');

  for (const step of result.steps) {
    const icon = step.status === 'pass' ? '✓' : step.status === 'fail' ? '✗' : '⊘';
    lines.push(`  ${icon} ${step.message}`);
  }

  lines.push('');

  if (result.success) {
    if (dryRun) {
      lines.push(
        '✓ Dry run passed — release is ready. Run without --dry-run to create the release.',
      );
    } else {
      lines.push(`✓ Release ${result.tag} created successfully!`);
      lines.push('');
      lines.push('The publish workflow will run automatically on GitHub Actions.');
      lines.push(
        'Monitor the workflow at: https://github.com/aviferdman/ProjectX2-Product/actions',
      );
    }
  } else {
    lines.push('✗ Release failed — fix the errors above before retrying.');
  }

  return lines.join('\n');
}

/**
 * Parse CLI arguments for the release script.
 */
export function parseReleaseArgs(argv: string[]): {
  version: string;
  dryRun: boolean;
  skipPush: boolean;
} {
  let version = '';
  let dryRun = false;
  let skipPush = false;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--version' && argv[i + 1]) {
      version = argv[i + 1]!;
      i++;
    }
    if (argv[i] === '--dry-run') {
      dryRun = true;
    }
    if (argv[i] === '--skip-push') {
      skipPush = true;
    }
  }

  return { version, dryRun, skipPush };
}

// --- CLI entry point ---

function main(): void {
  const args = parseReleaseArgs(process.argv.slice(2));

  if (!args.version) {
    console.error('Usage: release.ts --version <version> [--dry-run] [--skip-push]');
    console.error('');
    console.error('Example: npx tsx scripts/release.ts --version 0.1.0 --dry-run');
    process.exit(1);
  }

  const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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

  console.log(
    args.dryRun
      ? '\n🔍 Running release validation (dry run)...\n'
      : '\n🚀 Starting release process...\n',
  );

  const result = runRelease({
    version: args.version,
    rootDir: ROOT,
    packages,
    dryRun: args.dryRun,
    skipPush: args.skipPush,
  });

  console.log(formatReleaseOutput(result, args.dryRun));

  if (!result.success) {
    process.exit(1);
  }
}

const isDirectExecution = process.argv[1]?.endsWith('release.ts') ?? false;
if (isDirectExecution) {
  main();
}
