/**
 * GitHub release creation script for the Crewspace monorepo.
 *
 * Extracts release notes from CHANGELOG.md and creates a GitHub release
 * via the GitHub REST API. Intended for use in CI workflows after a
 * tag-triggered publish.
 *
 * Usage:
 *   npx tsx scripts/github-release.ts --tag v0.1.0
 *   npx tsx scripts/github-release.ts --tag v0.1.0 --dry-run
 *
 * Environment variables:
 *   GITHUB_TOKEN  — Personal access token or GITHUB_TOKEN from Actions
 *   GITHUB_REPOSITORY — owner/repo (auto-set in GitHub Actions)
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

export interface GitHubReleaseOptions {
  /** Git tag (e.g., "v0.1.0") */
  tag: string;
  /** Repository root directory */
  rootDir: string;
  /** GitHub repository in "owner/repo" format */
  repo: string;
  /** GitHub API token */
  token: string;
  /** If true, skip the actual API call */
  dryRun?: boolean;
  /** Mark as pre-release */
  preRelease?: boolean;
  /** Mark as draft */
  draft?: boolean;
}

export interface GitHubReleaseResult {
  success: boolean;
  tag: string;
  releaseUrl?: string;
  error?: string;
  body: string;
}

/**
 * Extract release notes for a specific version from CHANGELOG.md.
 *
 * Parses the Keep a Changelog format and returns the content between
 * the target version heading and the next version heading.
 */
export function extractReleaseNotes(changelogPath: string, version: string): string | null {
  if (!existsSync(changelogPath)) {
    return null;
  }

  const content = readFileSync(changelogPath, 'utf-8');
  const lines = content.split('\n');

  let capturing = false;
  const captured: string[] = [];

  for (const line of lines) {
    // Match version headings like "## [0.1.0] - 2026-04-06" or "## [0.1.0]"
    const versionHeadingMatch = /^## \[([^\]]+)\]/.exec(line);

    if (versionHeadingMatch) {
      if (capturing) {
        // Hit the next version heading — stop capturing
        break;
      }
      if (versionHeadingMatch[1] === version) {
        capturing = true;
        continue;
      }
    } else if (capturing) {
      captured.push(line);
    }
  }

  if (!capturing) {
    return null;
  }

  // Trim leading/trailing blank lines
  const trimmed = trimBlankLines(captured);
  return trimmed.length > 0 ? trimmed.join('\n') : null;
}

/**
 * Remove leading and trailing blank lines from an array of strings.
 */
function trimBlankLines(lines: string[]): string[] {
  let start = 0;
  while (start < lines.length && lines[start]!.trim() === '') {
    start++;
  }
  let end = lines.length - 1;
  while (end > start && lines[end]!.trim() === '') {
    end--;
  }
  return lines.slice(start, end + 1);
}

/**
 * Build the release body including version header, release notes, and
 * a link to the npm package.
 */
export function buildReleaseBody(version: string, releaseNotes: string | null, packages: string[]): string {
  const sections: string[] = [];

  if (releaseNotes) {
    sections.push(releaseNotes);
  } else {
    sections.push('*No release notes found in CHANGELOG.md for this version.*');
  }

  if (packages.length > 0) {
    sections.push('');
    sections.push('## 📦 Packages');
    sections.push('');
    for (const pkg of packages) {
      sections.push(`- [\`${pkg}@${version}\`](https://www.npmjs.com/package/${pkg}/v/${version})`);
    }
  }

  sections.push('');
  sections.push('---');
  sections.push(`*Full changelog: [CHANGELOG.md](https://github.com/aviferdman/ProjectX2-Product/blob/v${version}/CHANGELOG.md)*`);

  return sections.join('\n');
}

/**
 * Determine if a version is a pre-release based on semver conventions.
 */
export function isPreRelease(version: string): boolean {
  return /-(alpha|beta|rc|dev|canary|next)/.test(version);
}

/**
 * Create a GitHub release using the GitHub REST API.
 */
export async function createGitHubRelease(options: GitHubReleaseOptions): Promise<GitHubReleaseResult> {
  const { tag, rootDir, repo, token, dryRun = false, draft = false } = options;

  const version = tag.startsWith('v') ? tag.slice(1) : tag;
  const changelogPath = join(rootDir, 'CHANGELOG.md');

  const releaseNotes = extractReleaseNotes(changelogPath, version);
  const body = buildReleaseBody(version, releaseNotes, ['@crewspace/core', '@crewspace/cli']);
  const preRelease = options.preRelease ?? isPreRelease(version);

  if (dryRun) {
    return {
      success: true,
      tag,
      body,
      releaseUrl: `https://github.com/${repo}/releases/tag/${tag} (dry-run)`,
    };
  }

  const url = `https://api.github.com/repos/${repo}/releases`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      tag_name: tag,
      name: `${tag}`,
      body,
      draft,
      prerelease: preRelease,
      generate_release_notes: false,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return {
      success: false,
      tag,
      body,
      error: `GitHub API error (${response.status}): ${errorBody}`,
    };
  }

  const data = (await response.json()) as { html_url?: string };

  return {
    success: true,
    tag,
    body,
    releaseUrl: data.html_url ?? `https://github.com/${repo}/releases/tag/${tag}`,
  };
}

/**
 * Format release result for console output.
 */
export function formatGitHubReleaseOutput(result: GitHubReleaseResult, dryRun: boolean): string {
  const lines: string[] = [];

  lines.push(`=== GitHub Release: ${result.tag} ===`);
  if (dryRun) {
    lines.push('(DRY RUN — no release will be created)');
  }
  lines.push('');

  if (result.success) {
    lines.push('Release body:');
    lines.push('---');
    lines.push(result.body);
    lines.push('---');
    lines.push('');
    if (result.releaseUrl) {
      lines.push(`✓ Release URL: ${result.releaseUrl}`);
    }
  } else {
    lines.push(`✗ Failed to create release: ${result.error}`);
  }

  return lines.join('\n');
}

/**
 * Parse CLI arguments for the github-release script.
 */
export function parseGitHubReleaseArgs(argv: string[]): {
  tag: string;
  dryRun: boolean;
  draft: boolean;
  repo: string;
  token: string;
} {
  let tag = '';
  let dryRun = false;
  let draft = false;
  let repo = process.env['GITHUB_REPOSITORY'] ?? '';
  let token = process.env['GITHUB_TOKEN'] ?? '';

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--tag' && argv[i + 1]) {
      tag = argv[i + 1]!;
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
    if (argv[i] === '--dry-run') {
      dryRun = true;
    }
    if (argv[i] === '--draft') {
      draft = true;
    }
  }

  return { tag, dryRun, draft, repo, token };
}

// --- CLI entry point ---

async function main(): Promise<void> {
  const args = parseGitHubReleaseArgs(process.argv.slice(2));

  if (!args.tag) {
    console.error('Usage: github-release.ts --tag <tag> [--repo owner/repo] [--token TOKEN] [--dry-run] [--draft]');
    console.error('');
    console.error('Environment variables: GITHUB_TOKEN, GITHUB_REPOSITORY');
    process.exit(1);
  }

  if (!args.repo) {
    console.error('ERROR: No repository specified. Set GITHUB_REPOSITORY or pass --repo owner/repo');
    process.exit(1);
  }

  if (!args.token && !args.dryRun) {
    console.error('ERROR: No token provided. Set GITHUB_TOKEN or pass --token TOKEN');
    process.exit(1);
  }

  const ROOT = resolve(import.meta.dirname ?? '.', '..');

  console.log(args.dryRun ? '\n🔍 GitHub release dry run...\n' : '\n🚀 Creating GitHub release...\n');

  const result = await createGitHubRelease({
    tag: args.tag,
    rootDir: ROOT,
    repo: args.repo,
    token: args.token,
    dryRun: args.dryRun,
    draft: args.draft,
  });

  console.log(formatGitHubReleaseOutput(result, args.dryRun));

  if (!result.success) {
    process.exit(1);
  }
}

const isDirectExecution = process.argv[1]?.endsWith('github-release.ts') ?? false;
if (isDirectExecution) {
  main();
}
