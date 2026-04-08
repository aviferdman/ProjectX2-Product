/**
 * Release notes generator for the Crewspace monorepo.
 *
 * Generates comprehensive release notes by combining:
 * - CHANGELOG.md entries for the target version
 * - Git commit history between the previous and current tag
 * - Package information (names, versions, npm links)
 * - Contributor list from git log
 *
 * Usage:
 *   npx tsx scripts/generate-release-notes.ts --version 0.1.0
 *   npx tsx scripts/generate-release-notes.ts --version 0.1.0 --previous-tag v0.0.0
 *   npx tsx scripts/generate-release-notes.ts --version 0.1.0 --output release-notes.md
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { extractReleaseNotes } from './github-release.js';

export interface ReleaseNotesOptions {
  /** Version string (e.g., "0.1.0") */
  version: string;
  /** Repository root directory */
  rootDir: string;
  /** Previous git tag to compare from (auto-detected if omitted) */
  previousTag?: string;
  /** Package names to include in the release */
  packages: ReleasePackageInfo[];
  /** Repository URL for commit links */
  repoUrl?: string;
}

export interface ReleasePackageInfo {
  /** npm package name */
  name: string;
  /** Path relative to repo root */
  path: string;
}

export interface CommitInfo {
  /** Short commit hash */
  hash: string;
  /** Commit subject line */
  subject: string;
  /** Commit author name */
  author: string;
}

export interface ReleaseNotesResult {
  /** Whether generation succeeded */
  success: boolean;
  /** The generated release notes markdown */
  markdown: string;
  /** Version used */
  version: string;
  /** Tag used */
  tag: string;
  /** Error message if generation failed */
  error?: string;
  /** Commits included in the release */
  commits: CommitInfo[];
  /** Unique contributors */
  contributors: string[];
}

/**
 * Get the previous git tag before the given tag.
 * Returns null if no previous tag exists (first release).
 */
export function getPreviousTag(rootDir: string, currentTag?: string): string | null {
  try {
    const args = currentTag
      ? `git --no-pager tag --sort=-v:refname --list "v*"`
      : `git --no-pager tag --sort=-v:refname --list "v*"`;

    const output = execSync(args, {
      cwd: rootDir,
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (!output) return null;

    const tags = output.split('\n').filter(Boolean);

    if (currentTag) {
      const idx = tags.indexOf(currentTag);
      if (idx >= 0) {
        // Found the current tag; return the next older tag, or null if it's the first
        return idx < tags.length - 1 ? tags[idx + 1]! : null;
      }
      // Current tag not yet created — return the most recent existing tag
      return tags[0] ?? null;
    }

    return tags[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the list of commits between two git refs.
 * If fromRef is null, returns all commits up to toRef.
 */
export function getCommitsBetween(
  rootDir: string,
  fromRef: string | null,
  toRef: string,
): CommitInfo[] {
  try {
    const range = fromRef ? `${fromRef}..${toRef}` : toRef;
    const output = execSync(
      `git --no-pager log ${range} --pretty=format:"%h|||%s|||%an" --no-merges`,
      {
        cwd: rootDir,
        encoding: 'utf-8',
        timeout: 15000,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    ).trim();

    if (!output) return [];

    return output
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [hash = '', subject = '', author = ''] = line.split('|||');
        return { hash, subject, author };
      });
  } catch {
    return [];
  }
}

/**
 * Extract unique contributors from a list of commits.
 */
export function getContributors(commits: CommitInfo[]): string[] {
  const seen = new Set<string>();
  for (const commit of commits) {
    if (commit.author) {
      seen.add(commit.author);
    }
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

/**
 * Categorize commits by conventional-commit-style prefixes.
 */
export function categorizeCommits(commits: CommitInfo[]): Map<string, CommitInfo[]> {
  const categories = new Map<string, CommitInfo[]>();

  const prefixMap: Record<string, string> = {
    feat: 'Features',
    fix: 'Bug Fixes',
    docs: 'Documentation',
    test: 'Tests',
    refactor: 'Refactoring',
    perf: 'Performance',
    ci: 'CI/CD',
    build: 'Build',
    chore: 'Chores',
  };

  for (const commit of commits) {
    const match = /^(\w+)(?:\(.+?\))?:\s/.exec(commit.subject);
    const prefix = match?.[1]?.toLowerCase() ?? '';
    const category = prefixMap[prefix] ?? 'Other';

    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(commit);
  }

  return categories;
}

/**
 * Read package versions from package.json files.
 */
export function getPackageVersions(
  rootDir: string,
  packages: ReleasePackageInfo[],
): Map<string, string> {
  const versions = new Map<string, string>();

  for (const pkg of packages) {
    const pkgJsonPath = join(rootDir, pkg.path, 'package.json');
    if (existsSync(pkgJsonPath)) {
      try {
        const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as Record<string, unknown>;
        const version = String(pkgJson['version'] ?? 'unknown');
        versions.set(pkg.name, version);
      } catch {
        versions.set(pkg.name, 'unknown');
      }
    }
  }

  return versions;
}

/**
 * Generate comprehensive release notes markdown.
 */
export function generateReleaseNotes(options: ReleaseNotesOptions): ReleaseNotesResult {
  const { version, rootDir, packages } = options;
  const tag = `v${version}`;
  const repoUrl = options.repoUrl ?? 'https://github.com/aviferdman/ProjectX2-Product';

  // Extract changelog notes
  const changelogPath = join(rootDir, 'CHANGELOG.md');
  const changelogNotes = extractReleaseNotes(changelogPath, version);

  // Determine previous tag
  const previousTag = options.previousTag ?? getPreviousTag(rootDir, tag);

  // Get commits between tags
  const commits = getCommitsBetween(rootDir, previousTag, 'HEAD');
  const contributors = getContributors(commits);
  const categorized = categorizeCommits(commits);

  // Get package versions
  const packageVersions = getPackageVersions(rootDir, packages);

  // Build markdown
  const sections: string[] = [];

  // Header
  sections.push(`# Release ${tag}`);
  sections.push('');

  // Changelog section
  if (changelogNotes) {
    sections.push('## What\'s Changed');
    sections.push('');
    sections.push(changelogNotes);
    sections.push('');
  }

  // Commit summary (if there are categorized commits)
  if (commits.length > 0 && categorized.size > 0) {
    sections.push('## Commit Summary');
    sections.push('');

    // Sort categories to show Features first, then Bug Fixes, etc.
    const categoryOrder = [
      'Features',
      'Bug Fixes',
      'Performance',
      'Documentation',
      'Tests',
      'Refactoring',
      'CI/CD',
      'Build',
      'Chores',
      'Other',
    ];

    for (const category of categoryOrder) {
      const categoryCommits = categorized.get(category);
      if (!categoryCommits || categoryCommits.length === 0) continue;

      sections.push(`### ${category}`);
      sections.push('');
      for (const commit of categoryCommits) {
        sections.push(
          `- ${commit.subject} ([\`${commit.hash}\`](${repoUrl}/commit/${commit.hash}))`,
        );
      }
      sections.push('');
    }
  }

  // Packages section
  if (packages.length > 0) {
    sections.push('## 📦 Packages');
    sections.push('');
    sections.push('| Package | Version |');
    sections.push('|---------|---------|');
    for (const pkg of packages) {
      const pkgVersion = packageVersions.get(pkg.name) ?? version;
      sections.push(
        `| [\`${pkg.name}\`](https://www.npmjs.com/package/${pkg.name}) | \`${pkgVersion}\` |`,
      );
    }
    sections.push('');
  }

  // Contributors section
  if (contributors.length > 0) {
    sections.push('## 👥 Contributors');
    sections.push('');
    sections.push(`Thanks to ${contributors.length} contributor(s) for this release:`);
    sections.push('');
    for (const contributor of contributors) {
      sections.push(`- ${contributor}`);
    }
    sections.push('');
  }

  // Compare link
  if (previousTag) {
    sections.push('---');
    sections.push('');
    sections.push(
      `**Full Changelog**: [${previousTag}...${tag}](${repoUrl}/compare/${previousTag}...${tag})`,
    );
  } else {
    sections.push('---');
    sections.push('');
    sections.push(
      `**Full Changelog**: [${tag}](${repoUrl}/commits/${tag})`,
    );
  }
  sections.push('');

  const markdown = sections.join('\n');

  return {
    success: true,
    markdown,
    version,
    tag,
    commits,
    contributors,
  };
}

/**
 * Parse CLI arguments for the generate-release-notes script.
 */
export function parseReleaseNotesArgs(argv: string[]): {
  version: string;
  previousTag?: string;
  output?: string;
} {
  let version = '';
  let previousTag: string | undefined;
  let output: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--version' && argv[i + 1]) {
      version = argv[i + 1]!;
      i++;
    }
    if (argv[i] === '--previous-tag' && argv[i + 1]) {
      previousTag = argv[i + 1]!;
      i++;
    }
    if (argv[i] === '--output' && argv[i + 1]) {
      output = argv[i + 1]!;
      i++;
    }
  }

  return { version, previousTag, output };
}

// --- CLI entry point ---

function main(): void {
  const args = parseReleaseNotesArgs(process.argv.slice(2));

  if (!args.version) {
    console.error(
      'Usage: generate-release-notes.ts --version <version> [--previous-tag <tag>] [--output <file>]',
    );
    console.error('');
    console.error('Example: npx tsx scripts/generate-release-notes.ts --version 0.1.0');
    process.exit(1);
  }

  const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

  const packages: ReleasePackageInfo[] = [
    { name: '@crewspace/core', path: 'packages/core' },
    { name: '@crewspace/cli', path: 'packages/cli' },
    { name: '@crewspace/tools-file', path: 'packages/tools-file' },
    { name: '@crewspace/tools-web', path: 'packages/tools-web' },
    { name: '@crewspace/tools-shell', path: 'packages/tools-shell' },
  ];

  console.log(`\n📝 Generating release notes for v${args.version}...\n`);

  const result = generateReleaseNotes({
    version: args.version,
    rootDir: ROOT,
    packages,
    previousTag: args.previousTag,
  });

  if (!result.success) {
    console.error(`✗ Failed to generate release notes: ${result.error}`);
    process.exit(1);
  }

  if (args.output) {
    writeFileSync(args.output, result.markdown, 'utf-8');
    console.log(`✓ Release notes written to: ${args.output}`);
  } else {
    console.log(result.markdown);
  }

  console.log(`\n✓ Generated release notes for ${result.tag}`);
  console.log(`  Commits: ${result.commits.length}`);
  console.log(`  Contributors: ${result.contributors.length}`);
}

const isDirectExecution = process.argv[1]?.endsWith('generate-release-notes.ts') ?? false;
if (isDirectExecution) {
  main();
}
