/**
 * Unified release orchestration script for the Crewspace monorepo.
 *
 * Combines validation, release notes generation, git tagging, and
 * GitHub release creation into a single end-to-end workflow.
 *
 * Usage:
 *   npx tsx scripts/create-release.ts --version 0.1.0
 *   npx tsx scripts/create-release.ts --version 0.1.0 --dry-run
 *   npx tsx scripts/create-release.ts --version 0.1.0 --skip-github
 *   npx tsx scripts/create-release.ts --version 0.1.0 --output release-notes.md
 *
 * Environment variables:
 *   GITHUB_TOKEN       — Required for creating GitHub releases (skipped in dry-run)
 *   GITHUB_REPOSITORY  — owner/repo format (defaults to aviferdman/ProjectX2-Product)
 */

import { writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  checkWorkingTree,
  checkBranch,
  checkTagNotExists,
  checkBuildOutput,
  validateRelease,
  createTag,
  pushTag,
} from './release.js';
import type { ReleaseStepResult } from './release.js';
import { generateReleaseNotes } from './generate-release-notes.js';
import type { ReleasePackageInfo, ReleaseNotesResult } from './generate-release-notes.js';
import { createGitHubRelease } from './github-release.js';
import type { GitHubReleaseResult } from './github-release.js';
import type { PackageInfo } from './prepare-publish.js';

export interface CreateReleaseOptions {
  /** Version string (e.g., "0.1.0") */
  version: string;
  /** Repository root directory */
  rootDir: string;
  /** Packages to validate and include in release */
  packages: PackageInfo[];
  /** If true, skip actual tag/release creation */
  dryRun?: boolean;
  /** If true, skip pushing the tag to remote */
  skipPush?: boolean;
  /** If true, skip creating a GitHub release */
  skipGitHub?: boolean;
  /** Create GitHub release as draft */
  draft?: boolean;
  /** GitHub API token */
  githubToken?: string;
  /** GitHub repository in owner/repo format */
  githubRepo?: string;
  /** Branches allowed for release */
  allowedBranches?: string[];
  /** File path to write release notes */
  outputFile?: string;
}

export interface CreateReleaseStep {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
}

export interface CreateReleaseResult {
  success: boolean;
  version: string;
  tag: string;
  steps: CreateReleaseStep[];
  releaseNotes: ReleaseNotesResult | null;
  githubRelease: GitHubReleaseResult | null;
}

/**
 * Map a ReleaseStepResult to CreateReleaseStep (same shape but explicit).
 */
function mapStep(step: ReleaseStepResult): CreateReleaseStep {
  return { name: step.name, status: step.status, message: step.message };
}

/**
 * Run the full release orchestration: validate → generate notes → tag → GitHub release.
 */
export async function createRelease(options: CreateReleaseOptions): Promise<CreateReleaseResult> {
  const {
    version,
    rootDir,
    packages,
    dryRun = false,
    skipPush = false,
    skipGitHub = false,
    draft = false,
    githubToken = '',
    githubRepo = '',
    allowedBranches = ['main'],
    outputFile,
  } = options;

  const tag = `v${version}`;
  const steps: CreateReleaseStep[] = [];
  let releaseNotes: ReleaseNotesResult | null = null;
  let githubRelease: GitHubReleaseResult | null = null;

  // Step 1: Validate release metadata (package.json, CHANGELOG, VERSION exports)
  const validationStep = validateRelease(version, rootDir, packages);
  steps.push(mapStep(validationStep));
  if (validationStep.status === 'fail') {
    return { success: false, version, tag, steps, releaseNotes, githubRelease };
  }

  // Step 2: Check build output
  const buildStep = checkBuildOutput(rootDir, packages);
  steps.push(mapStep(buildStep));
  if (buildStep.status === 'fail') {
    return { success: false, version, tag, steps, releaseNotes, githubRelease };
  }

  // Step 3: Check working tree is clean
  const workingTreeStep = checkWorkingTree(rootDir);
  steps.push(mapStep(workingTreeStep));
  if (workingTreeStep.status === 'fail' && !dryRun) {
    return { success: false, version, tag, steps, releaseNotes, githubRelease };
  }

  // Step 4: Check branch
  const branchStep = checkBranch(rootDir, allowedBranches);
  steps.push(mapStep(branchStep));
  if (branchStep.status === 'fail' && !dryRun) {
    return { success: false, version, tag, steps, releaseNotes, githubRelease };
  }

  // Step 5: Check tag doesn't already exist
  const tagExistsStep = checkTagNotExists(tag, rootDir);
  steps.push(mapStep(tagExistsStep));
  if (tagExistsStep.status === 'fail') {
    return { success: false, version, tag, steps, releaseNotes, githubRelease };
  }

  // Step 6: Generate release notes
  const releasePackages: ReleasePackageInfo[] = packages.map((p) => ({
    name: p.name,
    path: p.path,
  }));

  try {
    releaseNotes = generateReleaseNotes({
      version,
      rootDir,
      packages: releasePackages,
    });

    steps.push({
      name: 'generate-release-notes',
      status: 'pass',
      message: `Generated release notes (${releaseNotes.commits.length} commits, ${releaseNotes.contributors.length} contributors)`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    steps.push({
      name: 'generate-release-notes',
      status: 'fail',
      message: `Failed to generate release notes: ${message}`,
    });
    return { success: false, version, tag, steps, releaseNotes, githubRelease };
  }

  // Step 7: Write release notes to file (if requested)
  if (outputFile && releaseNotes) {
    try {
      if (!dryRun) {
        writeFileSync(outputFile, releaseNotes.markdown, 'utf-8');
      }
      steps.push({
        name: 'write-release-notes',
        status: dryRun ? 'skip' : 'pass',
        message: dryRun
          ? `[dry-run] Would write release notes to: ${outputFile}`
          : `Release notes written to: ${outputFile}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      steps.push({
        name: 'write-release-notes',
        status: 'fail',
        message: `Failed to write release notes: ${message}`,
      });
      // Non-fatal: continue with tagging
    }
  }

  // Step 8: Create git tag
  const createTagStep = createTag(tag, version, rootDir, dryRun);
  steps.push(mapStep(createTagStep));
  if (createTagStep.status === 'fail') {
    return { success: false, version, tag, steps, releaseNotes, githubRelease };
  }

  // Step 9: Push tag
  const pushTagStep = pushTag(tag, rootDir, dryRun, skipPush);
  steps.push(mapStep(pushTagStep));
  if (pushTagStep.status === 'fail') {
    return { success: false, version, tag, steps, releaseNotes, githubRelease };
  }

  // Step 10: Create GitHub release
  if (skipGitHub) {
    steps.push({
      name: 'github-release',
      status: 'skip',
      message: 'GitHub release creation skipped (--skip-github)',
    });
  } else if (!githubToken && !dryRun) {
    steps.push({
      name: 'github-release',
      status: 'skip',
      message: 'GitHub release skipped — no GITHUB_TOKEN provided',
    });
  } else {
    try {
      githubRelease = await createGitHubRelease({
        tag,
        rootDir,
        repo: githubRepo || 'aviferdman/ProjectX2-Product',
        token: githubToken,
        dryRun,
        draft,
      });

      if (githubRelease.success) {
        steps.push({
          name: 'github-release',
          status: dryRun ? 'skip' : 'pass',
          message: dryRun
            ? `[dry-run] Would create GitHub release for ${tag}`
            : `GitHub release created: ${githubRelease.releaseUrl}`,
        });
      } else {
        steps.push({
          name: 'github-release',
          status: 'fail',
          message: `GitHub release failed: ${githubRelease.error}`,
        });
        // Non-fatal: tag was already created
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      steps.push({
        name: 'github-release',
        status: 'fail',
        message: `GitHub release error: ${message}`,
      });
    }
  }

  return { success: true, version, tag, steps, releaseNotes, githubRelease };
}

/**
 * Format the full release result for console output.
 */
export function formatCreateReleaseOutput(
  result: CreateReleaseResult,
  dryRun: boolean,
): string {
  const lines: string[] = [];

  lines.push(`=== Crewspace Release ${result.tag} ===`);
  if (dryRun) {
    lines.push('(DRY RUN — no changes will be made)');
  }
  lines.push('');

  for (const step of result.steps) {
    const icon = step.status === 'pass' ? '✓' : step.status === 'fail' ? '✗' : '⊘';
    lines.push(`  ${icon} [${step.name}] ${step.message}`);
  }

  lines.push('');

  if (result.releaseNotes) {
    lines.push(`  Commits: ${result.releaseNotes.commits.length}`);
    lines.push(`  Contributors: ${result.releaseNotes.contributors.length}`);
    lines.push('');
  }

  if (result.success) {
    if (dryRun) {
      lines.push('✓ Dry run passed — release is ready.');
      lines.push('  Run without --dry-run to create the release.');
    } else {
      lines.push(`✓ Release ${result.tag} completed successfully!`);
      if (result.githubRelease?.releaseUrl) {
        lines.push(`  Release: ${result.githubRelease.releaseUrl}`);
      }
    }
  } else {
    lines.push('✗ Release failed — fix the errors above before retrying.');
  }

  return lines.join('\n');
}

/**
 * Parse CLI arguments for create-release.
 */
export function parseCreateReleaseArgs(argv: string[]): {
  version: string;
  dryRun: boolean;
  skipPush: boolean;
  skipGitHub: boolean;
  draft: boolean;
  output?: string;
  repo: string;
  token: string;
} {
  let version = '';
  let dryRun = false;
  let skipPush = false;
  let skipGitHub = false;
  let draft = false;
  let output: string | undefined;
  let repo = process.env['GITHUB_REPOSITORY'] ?? '';
  let token = process.env['GITHUB_TOKEN'] ?? '';

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--version' && argv[i + 1]) {
      version = argv[i + 1]!;
      i++;
    }
    if (argv[i] === '--repo' && argv[i + 1]) {
      repo = argv[i + 1]!;
      i++;
    }
    if (argv[i] === '--token' && argv[i + 1]) {
      token = argv[i + 1]!;
      i++;
    }
    if (argv[i] === '--output' && argv[i + 1]) {
      output = argv[i + 1]!;
      i++;
    }
    if (argv[i] === '--dry-run') {
      dryRun = true;
    }
    if (argv[i] === '--skip-push') {
      skipPush = true;
    }
    if (argv[i] === '--skip-github') {
      skipGitHub = true;
    }
    if (argv[i] === '--draft') {
      draft = true;
    }
  }

  return { version, dryRun, skipPush, skipGitHub, draft, output, repo, token };
}

// --- CLI entry point ---

async function main(): Promise<void> {
  const args = parseCreateReleaseArgs(process.argv.slice(2));

  if (!args.version) {
    console.error(
      'Usage: create-release.ts --version <version> [options]',
    );
    console.error('');
    console.error('Options:');
    console.error('  --dry-run        Validate without creating release');
    console.error('  --skip-push      Create tag locally but do not push');
    console.error('  --skip-github    Skip GitHub release creation');
    console.error('  --draft          Create GitHub release as draft');
    console.error('  --output <file>  Write release notes to file');
    console.error('  --repo <owner/repo>   GitHub repository');
    console.error('  --token <token>       GitHub API token');
    console.error('');
    console.error('Environment: GITHUB_TOKEN, GITHUB_REPOSITORY');
    process.exit(1);
  }

  const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

  const packages: PackageInfo[] = [
    { path: 'packages/core', name: '@crewspace/core', versionExport: 'src/index.ts' },
    { path: 'packages/cli', name: '@crewspace/cli', versionExport: 'src/index.ts' },
    { path: 'packages/tools-file', name: '@crewspace/tools-file', versionExport: 'src/index.ts' },
    { path: 'packages/tools-web', name: '@crewspace/tools-web', versionExport: 'src/index.ts' },
    { path: 'packages/tools-shell', name: '@crewspace/tools-shell', versionExport: 'src/index.ts' },
  ];

  console.log(
    args.dryRun
      ? `\n🔍 Running release validation for v${args.version} (dry run)...\n`
      : `\n🚀 Creating release v${args.version}...\n`,
  );

  const result = await createRelease({
    version: args.version,
    rootDir: ROOT,
    packages,
    dryRun: args.dryRun,
    skipPush: args.skipPush,
    skipGitHub: args.skipGitHub,
    draft: args.draft,
    githubToken: args.token,
    githubRepo: args.repo,
    outputFile: args.output,
  });

  console.log(formatCreateReleaseOutput(result, args.dryRun));

  if (!result.success) {
    process.exit(1);
  }
}

const isDirectExecution = process.argv[1]?.endsWith('create-release.ts') ?? false;
if (isDirectExecution) {
  void main();
}
