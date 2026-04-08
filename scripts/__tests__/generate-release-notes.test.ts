import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import {
  getPreviousTag,
  getCommitsBetween,
  getContributors,
  categorizeCommits,
  getPackageVersions,
  generateReleaseNotes,
  parseReleaseNotesArgs,
} from '../generate-release-notes.js';
import type { CommitInfo, ReleasePackageInfo } from '../generate-release-notes.js';

describe('generate-release-notes', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'release-notes-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function initGitRepo(): void {
    execSync('git init', { cwd: tempDir, stdio: 'pipe' });
    execSync('git config user.email "test@test.com"', { cwd: tempDir, stdio: 'pipe' });
    execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'pipe' });
    writeFileSync(join(tempDir, 'README.md'), '# Test');
    execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
    execSync('git commit -m "feat: initial commit"', { cwd: tempDir, stdio: 'pipe' });
  }

  function addCommit(message: string, author?: string): void {
    const file = `file-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
    writeFileSync(join(tempDir, file), message);
    execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
    const authorFlag = author ? `--author="${author} <${author}@test.com>"` : '';
    execSync(`git commit -m "${message}" ${authorFlag}`, { cwd: tempDir, stdio: 'pipe' });
  }

  function createTag(tag: string): void {
    execSync(`git tag -a ${tag} -m "Release ${tag}"`, { cwd: tempDir, stdio: 'pipe' });
  }

  describe('getPreviousTag', () => {
    it('returns null when no tags exist', () => {
      initGitRepo();
      const result = getPreviousTag(tempDir);
      expect(result).toBeNull();
    });

    it('returns null when only one tag exists', () => {
      initGitRepo();
      createTag('v0.1.0');
      const result = getPreviousTag(tempDir, 'v0.1.0');
      expect(result).toBeNull();
    });

    it('returns the previous tag when multiple tags exist', () => {
      initGitRepo();
      createTag('v0.1.0');
      addCommit('feat: second feature');
      createTag('v0.2.0');
      const result = getPreviousTag(tempDir, 'v0.2.0');
      expect(result).toBe('v0.1.0');
    });

    it('returns the most recent tag when no currentTag specified', () => {
      initGitRepo();
      createTag('v0.1.0');
      addCommit('feat: second');
      createTag('v0.2.0');
      const result = getPreviousTag(tempDir);
      expect(result).toBe('v0.2.0');
    });

    it('returns null for non-git directory', () => {
      const result = getPreviousTag(tempDir);
      expect(result).toBeNull();
    });
  });

  describe('getCommitsBetween', () => {
    it('returns commits in range', () => {
      initGitRepo();
      createTag('v0.1.0');
      addCommit('feat: new feature');
      addCommit('fix: bug fix');

      const commits = getCommitsBetween(tempDir, 'v0.1.0', 'HEAD');
      expect(commits.length).toBe(2);
      expect(commits.some((c) => c.subject.includes('new feature'))).toBe(true);
      expect(commits.some((c) => c.subject.includes('bug fix'))).toBe(true);
    });

    it('returns all commits when fromRef is null', () => {
      initGitRepo();
      addCommit('feat: second commit');

      const commits = getCommitsBetween(tempDir, null, 'HEAD');
      expect(commits.length).toBe(2); // initial + second
    });

    it('returns empty array when no commits in range', () => {
      initGitRepo();
      createTag('v0.1.0');
      const commits = getCommitsBetween(tempDir, 'v0.1.0', 'HEAD');
      expect(commits).toEqual([]);
    });

    it('returns empty array for non-git directory', () => {
      const commits = getCommitsBetween(tempDir, null, 'HEAD');
      expect(commits).toEqual([]);
    });

    it('includes commit hash, subject, and author', () => {
      initGitRepo();
      const commits = getCommitsBetween(tempDir, null, 'HEAD');
      expect(commits.length).toBeGreaterThan(0);
      expect(commits[0]!.hash).toBeTruthy();
      expect(commits[0]!.subject).toBeTruthy();
      expect(commits[0]!.author).toBeTruthy();
    });
  });

  describe('getContributors', () => {
    it('returns unique sorted contributors', () => {
      const commits: CommitInfo[] = [
        { hash: 'abc', subject: 'feat: x', author: 'Charlie' },
        { hash: 'def', subject: 'fix: y', author: 'Alice' },
        { hash: 'ghi', subject: 'docs: z', author: 'Charlie' },
        { hash: 'jkl', subject: 'test: w', author: 'Bob' },
      ];

      const contributors = getContributors(commits);
      expect(contributors).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('returns empty array for no commits', () => {
      expect(getContributors([])).toEqual([]);
    });

    it('handles single contributor', () => {
      const commits: CommitInfo[] = [
        { hash: 'abc', subject: 'feat: x', author: 'Alice' },
        { hash: 'def', subject: 'fix: y', author: 'Alice' },
      ];

      const contributors = getContributors(commits);
      expect(contributors).toEqual(['Alice']);
    });
  });

  describe('categorizeCommits', () => {
    it('categorizes commits by conventional prefix', () => {
      const commits: CommitInfo[] = [
        { hash: 'a1', subject: 'feat: add login', author: 'A' },
        { hash: 'a2', subject: 'fix: resolve crash', author: 'A' },
        { hash: 'a3', subject: 'docs: update readme', author: 'A' },
        { hash: 'a4', subject: 'test: add unit test', author: 'A' },
        { hash: 'a5', subject: 'refactor: clean up code', author: 'A' },
        { hash: 'a6', subject: 'perf: optimize query', author: 'A' },
        { hash: 'a7', subject: 'ci: update pipeline', author: 'A' },
        { hash: 'a8', subject: 'build: upgrade deps', author: 'A' },
        { hash: 'a9', subject: 'chore: bump version', author: 'A' },
      ];

      const categorized = categorizeCommits(commits);
      expect(categorized.get('Features')?.length).toBe(1);
      expect(categorized.get('Bug Fixes')?.length).toBe(1);
      expect(categorized.get('Documentation')?.length).toBe(1);
      expect(categorized.get('Tests')?.length).toBe(1);
      expect(categorized.get('Refactoring')?.length).toBe(1);
      expect(categorized.get('Performance')?.length).toBe(1);
      expect(categorized.get('CI/CD')?.length).toBe(1);
      expect(categorized.get('Build')?.length).toBe(1);
      expect(categorized.get('Chores')?.length).toBe(1);
    });

    it('puts non-conventional commits in Other', () => {
      const commits: CommitInfo[] = [
        { hash: 'a1', subject: 'random commit message', author: 'A' },
        { hash: 'a2', subject: 'another random one', author: 'A' },
      ];

      const categorized = categorizeCommits(commits);
      expect(categorized.get('Other')?.length).toBe(2);
    });

    it('handles scoped conventional commits', () => {
      const commits: CommitInfo[] = [
        { hash: 'a1', subject: 'feat(core): add agent', author: 'A' },
        { hash: 'a2', subject: 'fix(cli): parse error', author: 'A' },
      ];

      const categorized = categorizeCommits(commits);
      expect(categorized.get('Features')?.length).toBe(1);
      expect(categorized.get('Bug Fixes')?.length).toBe(1);
    });

    it('returns empty map for empty commits', () => {
      const categorized = categorizeCommits([]);
      expect(categorized.size).toBe(0);
    });
  });

  describe('getPackageVersions', () => {
    it('reads versions from package.json files', () => {
      const pkgDir = join(tempDir, 'packages', 'core');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({ name: '@crewspace/core', version: '0.1.0' }),
      );

      const packages: ReleasePackageInfo[] = [{ name: '@crewspace/core', path: 'packages/core' }];

      const versions = getPackageVersions(tempDir, packages);
      expect(versions.get('@crewspace/core')).toBe('0.1.0');
    });

    it('handles missing package.json', () => {
      const packages: ReleasePackageInfo[] = [
        { name: '@crewspace/missing', path: 'packages/missing' },
      ];

      const versions = getPackageVersions(tempDir, packages);
      expect(versions.has('@crewspace/missing')).toBe(false);
    });

    it('reads multiple package versions', () => {
      for (const name of ['core', 'cli']) {
        const pkgDir = join(tempDir, 'packages', name);
        mkdirSync(pkgDir, { recursive: true });
        writeFileSync(
          join(pkgDir, 'package.json'),
          JSON.stringify({ name: `@crewspace/${name}`, version: '0.1.0' }),
        );
      }

      const packages: ReleasePackageInfo[] = [
        { name: '@crewspace/core', path: 'packages/core' },
        { name: '@crewspace/cli', path: 'packages/cli' },
      ];

      const versions = getPackageVersions(tempDir, packages);
      expect(versions.get('@crewspace/core')).toBe('0.1.0');
      expect(versions.get('@crewspace/cli')).toBe('0.1.0');
    });
  });

  describe('generateReleaseNotes', () => {
    function setupPackages(version: string): ReleasePackageInfo[] {
      const pkgDir = join(tempDir, 'packages', 'core');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({ name: '@crewspace/core', version }),
      );
      return [{ name: '@crewspace/core', path: 'packages/core' }];
    }

    function setupChangelog(version: string): void {
      writeFileSync(
        join(tempDir, 'CHANGELOG.md'),
        `# Changelog

## [Unreleased]

## [${version}] - 2026-04-06

### Added
- Core agent orchestration framework
- Agent, Crew, and Task primitives
- Execution engine with sequential and parallel strategies

### Fixed
- Memory leak in task executor
`,
      );
    }

    it('generates release notes with changelog entries', () => {
      initGitRepo();
      const packages = setupPackages('0.1.0');
      setupChangelog('0.1.0');

      const result = generateReleaseNotes({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
      });

      expect(result.success).toBe(true);
      expect(result.version).toBe('0.1.0');
      expect(result.tag).toBe('v0.1.0');
      expect(result.markdown).toContain('Release v0.1.0');
      expect(result.markdown).toContain('Core agent orchestration framework');
      expect(result.markdown).toContain('Agent, Crew, and Task primitives');
    });

    it('includes package information table', () => {
      initGitRepo();
      const packages = setupPackages('0.1.0');
      setupChangelog('0.1.0');

      const result = generateReleaseNotes({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
      });

      expect(result.markdown).toContain('📦 Packages');
      expect(result.markdown).toContain('@crewspace/core');
      expect(result.markdown).toContain('0.1.0');
      expect(result.markdown).toContain('npmjs.com');
    });

    it('includes contributors section', () => {
      initGitRepo();
      const packages = setupPackages('0.1.0');
      setupChangelog('0.1.0');

      const result = generateReleaseNotes({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
      });

      expect(result.contributors.length).toBeGreaterThan(0);
      expect(result.markdown).toContain('👥 Contributors');
    });

    it('includes commit summary section', () => {
      initGitRepo();
      addCommit('feat: add new feature');
      addCommit('fix: resolve bug');
      const packages = setupPackages('0.1.0');
      setupChangelog('0.1.0');

      const result = generateReleaseNotes({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
      });

      expect(result.commits.length).toBeGreaterThan(0);
      expect(result.markdown).toContain('Commit Summary');
    });

    it('handles missing changelog gracefully', () => {
      initGitRepo();
      const packages = setupPackages('0.1.0');

      const result = generateReleaseNotes({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
      });

      expect(result.success).toBe(true);
      expect(result.markdown).toContain('Release v0.1.0');
      // Should still have packages and commit sections
      expect(result.markdown).toContain('📦 Packages');
    });

    it('uses custom repoUrl when provided', () => {
      initGitRepo();
      const packages = setupPackages('0.1.0');
      setupChangelog('0.1.0');

      const result = generateReleaseNotes({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        repoUrl: 'https://github.com/custom/repo',
      });

      expect(result.markdown).toContain('https://github.com/custom/repo');
    });

    it('includes full changelog link', () => {
      initGitRepo();
      const packages = setupPackages('0.1.0');

      const result = generateReleaseNotes({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
      });

      expect(result.markdown).toContain('Full Changelog');
    });

    it('includes compare link when previous tag exists', () => {
      initGitRepo();
      createTag('v0.1.0');
      addCommit('feat: new stuff');
      const packages = setupPackages('0.2.0');

      const result = generateReleaseNotes({
        version: '0.2.0',
        rootDir: tempDir,
        packages,
        previousTag: 'v0.1.0',
      });

      expect(result.markdown).toContain('v0.1.0...v0.2.0');
    });

    it('handles empty packages array', () => {
      initGitRepo();
      setupChangelog('0.1.0');

      const result = generateReleaseNotes({
        version: '0.1.0',
        rootDir: tempDir,
        packages: [],
      });

      expect(result.success).toBe(true);
      expect(result.markdown).not.toContain('📦 Packages');
    });
  });

  describe('parseReleaseNotesArgs', () => {
    it('parses --version flag', () => {
      const args = parseReleaseNotesArgs(['--version', '0.1.0']);
      expect(args.version).toBe('0.1.0');
    });

    it('parses --previous-tag flag', () => {
      const args = parseReleaseNotesArgs(['--version', '0.2.0', '--previous-tag', 'v0.1.0']);
      expect(args.previousTag).toBe('v0.1.0');
    });

    it('parses --output flag', () => {
      const args = parseReleaseNotesArgs(['--version', '0.1.0', '--output', 'notes.md']);
      expect(args.output).toBe('notes.md');
    });

    it('returns empty version when not provided', () => {
      const args = parseReleaseNotesArgs([]);
      expect(args.version).toBe('');
    });

    it('parses all flags together', () => {
      const args = parseReleaseNotesArgs([
        '--version',
        '1.0.0',
        '--previous-tag',
        'v0.9.0',
        '--output',
        'release.md',
      ]);
      expect(args.version).toBe('1.0.0');
      expect(args.previousTag).toBe('v0.9.0');
      expect(args.output).toBe('release.md');
    });
  });
});
