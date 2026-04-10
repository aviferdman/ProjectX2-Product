import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import {
  createRelease,
  formatCreateReleaseOutput,
  parseCreateReleaseArgs,
} from '../create-release.js';
import type { CreateReleaseResult } from '../create-release.js';
import type { PackageInfo } from '../prepare-publish.js';

describe('create-release', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'create-release-test-'));
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

  function setupValidPackage(version: string): PackageInfo[] {
    const pkgDir = join(tempDir, 'packages', 'core');
    const distDir = join(pkgDir, 'dist');
    mkdirSync(join(pkgDir, 'src'), { recursive: true });
    mkdirSync(distDir, { recursive: true });

    writeFileSync(
      join(pkgDir, 'package.json'),
      JSON.stringify({
        name: '@crewspace/core',
        version,
        description: 'Core package',
        license: 'MIT',
        main: './dist/index.js',
        types: './dist/index.d.ts',
        files: ['dist', 'README.md', 'LICENSE'],
      }),
    );
    writeFileSync(join(pkgDir, 'src', 'index.ts'), `export const VERSION = '${version}';\n`);
    writeFileSync(join(pkgDir, 'README.md'), '# @crewspace/core');
    writeFileSync(join(pkgDir, 'LICENSE'), 'MIT');
    writeFileSync(join(distDir, 'index.js'), 'export {};');
    writeFileSync(join(distDir, 'index.d.ts'), 'export {};');

    writeFileSync(
      join(tempDir, 'CHANGELOG.md'),
      `# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [${version}] - 2026-04-06

### Added
- Core agent orchestration framework
- Agent, Crew, and Task primitives
- Execution engine with sequential and parallel strategies

[Unreleased]: https://github.com/aviferdman/ProjectX2-Product/compare/v${version}...HEAD
[${version}]: https://github.com/aviferdman/ProjectX2-Product/releases/tag/v${version}
`,
    );

    return [
      {
        path: 'packages/core',
        name: '@crewspace/core',
        versionExport: 'src/index.ts',
      },
    ];
  }

  function commitAll(message: string): void {
    execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
    execSync(`git commit -m "${message}"`, { cwd: tempDir, stdio: 'pipe' });
  }

  describe('parseCreateReleaseArgs', () => {
    it('parses --version flag', () => {
      const args = parseCreateReleaseArgs(['--version', '0.1.0']);
      expect(args.version).toBe('0.1.0');
      expect(args.dryRun).toBe(false);
      expect(args.skipPush).toBe(false);
      expect(args.skipGitHub).toBe(false);
      expect(args.draft).toBe(false);
    });

    it('parses --dry-run flag', () => {
      const args = parseCreateReleaseArgs(['--version', '0.1.0', '--dry-run']);
      expect(args.dryRun).toBe(true);
    });

    it('parses --skip-push flag', () => {
      const args = parseCreateReleaseArgs(['--version', '0.1.0', '--skip-push']);
      expect(args.skipPush).toBe(true);
    });

    it('parses --skip-github flag', () => {
      const args = parseCreateReleaseArgs(['--version', '0.1.0', '--skip-github']);
      expect(args.skipGitHub).toBe(true);
    });

    it('parses --draft flag', () => {
      const args = parseCreateReleaseArgs(['--version', '0.1.0', '--draft']);
      expect(args.draft).toBe(true);
    });

    it('parses --output flag', () => {
      const args = parseCreateReleaseArgs(['--version', '0.1.0', '--output', 'notes.md']);
      expect(args.output).toBe('notes.md');
    });

    it('parses --repo flag', () => {
      const args = parseCreateReleaseArgs(['--version', '0.1.0', '--repo', 'owner/repo']);
      expect(args.repo).toBe('owner/repo');
    });

    it('parses --token flag', () => {
      const args = parseCreateReleaseArgs(['--version', '0.1.0', '--token', 'ghp_abc']);
      expect(args.token).toBe('ghp_abc');
    });

    it('returns empty version when not provided', () => {
      const args = parseCreateReleaseArgs([]);
      expect(args.version).toBe('');
    });

    it('parses all flags together', () => {
      const args = parseCreateReleaseArgs([
        '--version', '1.0.0',
        '--dry-run',
        '--skip-push',
        '--skip-github',
        '--draft',
        '--output', 'notes.md',
        '--repo', 'test/repo',
        '--token', 'tok',
      ]);
      expect(args.version).toBe('1.0.0');
      expect(args.dryRun).toBe(true);
      expect(args.skipPush).toBe(true);
      expect(args.skipGitHub).toBe(true);
      expect(args.draft).toBe(true);
      expect(args.output).toBe('notes.md');
      expect(args.repo).toBe('test/repo');
      expect(args.token).toBe('tok');
    });
  });

  describe('createRelease (dry-run)', () => {
    it('succeeds for a valid setup in dry-run mode', async () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      commitAll('feat: add package');

      const result = await createRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: true,
        skipGitHub: true,
      });

      expect(result.success).toBe(true);
      expect(result.version).toBe('0.1.0');
      expect(result.tag).toBe('v0.1.0');
      expect(result.steps.length).toBeGreaterThanOrEqual(6);
    });

    it('generates release notes in dry-run mode', async () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      commitAll('feat: add package');

      const result = await createRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: true,
        skipGitHub: true,
      });

      expect(result.releaseNotes).not.toBeNull();
      expect(result.releaseNotes!.markdown).toContain('Release v0.1.0');
      expect(result.releaseNotes!.markdown).toContain('Core agent orchestration framework');
    });

    it('does not create a git tag in dry-run mode', async () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      commitAll('feat: add package');

      await createRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: true,
        skipGitHub: true,
      });

      const tags = execSync('git tag --list', { cwd: tempDir, encoding: 'utf-8' }).trim();
      expect(tags).not.toContain('v0.1.0');
    });

    it('includes release notes step in results', async () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      commitAll('feat: add package');

      const result = await createRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: true,
        skipGitHub: true,
      });

      const notesStep = result.steps.find((s) => s.name === 'generate-release-notes');
      expect(notesStep).toBeDefined();
      expect(notesStep!.status).toBe('pass');
      expect(notesStep!.message).toContain('commits');
    });
  });

  describe('createRelease validation failures', () => {
    it('fails when version does not match package.json', async () => {
      initGitRepo();
      setupValidPackage('0.2.0');
      commitAll('feat: add package');

      const result = await createRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages: [
          { path: 'packages/core', name: '@crewspace/core', versionExport: 'src/index.ts' },
        ],
        dryRun: true,
        skipGitHub: true,
      });

      expect(result.success).toBe(false);
      expect(result.steps[0]!.status).toBe('fail');
      expect(result.steps[0]!.message).toContain('Version mismatch');
    });

    it('fails when CHANGELOG entry is missing', async () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      writeFileSync(join(tempDir, 'CHANGELOG.md'), '# Changelog\n\n## [Unreleased]\n');
      commitAll('feat: add package');

      const result = await createRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: true,
        skipGitHub: true,
      });

      expect(result.success).toBe(false);
      expect(result.steps[0]!.message).toContain('CHANGELOG');
    });

    it('fails when build output is missing', async () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      rmSync(join(tempDir, 'packages', 'core', 'dist'), { recursive: true });
      commitAll('feat: add package');

      const result = await createRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: true,
        skipGitHub: true,
      });

      expect(result.success).toBe(false);
      expect(result.steps.some((s) => s.name === 'build-output' && s.status === 'fail')).toBe(
        true,
      );
    });

    it('fails when tag already exists', async () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      commitAll('feat: add package');
      execSync('git tag v0.1.0', { cwd: tempDir, stdio: 'pipe' });

      const result = await createRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: true,
        skipGitHub: true,
      });

      expect(result.success).toBe(false);
      expect(result.steps.some((s) => s.name === 'tag-not-exists' && s.status === 'fail')).toBe(
        true,
      );
    });
  });

  describe('createRelease with skip-push and skip-github', () => {
    it('creates tag but skips push and github', async () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      commitAll('feat: add package');

      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: tempDir,
        encoding: 'utf-8',
      }).trim();

      const result = await createRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: false,
        skipPush: true,
        skipGitHub: true,
        allowedBranches: [branch],
      });

      expect(result.success).toBe(true);

      // Verify tag was created
      const tags = execSync('git tag --list', { cwd: tempDir, encoding: 'utf-8' }).trim();
      expect(tags).toContain('v0.1.0');

      // Verify push was skipped
      const pushStep = result.steps.find((s) => s.name === 'push-tag');
      expect(pushStep).toBeDefined();
      expect(pushStep!.status).toBe('skip');

      // Verify github release was skipped
      const ghStep = result.steps.find((s) => s.name === 'github-release');
      expect(ghStep).toBeDefined();
      expect(ghStep!.status).toBe('skip');
      expect(ghStep!.message).toContain('--skip-github');
    });
  });

  describe('createRelease with output file', () => {
    it('writes release notes to file when output specified', async () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      commitAll('feat: add package');

      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: tempDir,
        encoding: 'utf-8',
      }).trim();

      const outputPath = join(tempDir, 'release-notes.md');

      const result = await createRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: false,
        skipPush: true,
        skipGitHub: true,
        allowedBranches: [branch],
        outputFile: outputPath,
      });

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('Release v0.1.0');
      expect(content).toContain('Core agent orchestration framework');
    });

    it('skips writing release notes file in dry-run mode', async () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      commitAll('feat: add package');

      const outputPath = join(tempDir, 'release-notes.md');

      await createRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: true,
        skipGitHub: true,
        outputFile: outputPath,
      });

      expect(existsSync(outputPath)).toBe(false);
    });
  });

  describe('createRelease with GitHub release (dry-run)', () => {
    it('simulates GitHub release in dry-run mode', async () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      commitAll('feat: add package');

      const result = await createRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: true,
        githubToken: '',
        githubRepo: 'test/repo',
      });

      expect(result.success).toBe(true);
      expect(result.githubRelease).not.toBeNull();
      expect(result.githubRelease!.success).toBe(true);
    });

    it('skips GitHub release when no token provided (non-dry-run)', async () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      commitAll('feat: add package');

      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: tempDir,
        encoding: 'utf-8',
      }).trim();

      const result = await createRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: false,
        skipPush: true,
        allowedBranches: [branch],
        githubToken: '',
      });

      expect(result.success).toBe(true);
      const ghStep = result.steps.find((s) => s.name === 'github-release');
      expect(ghStep).toBeDefined();
      expect(ghStep!.status).toBe('skip');
      expect(ghStep!.message).toContain('no GITHUB_TOKEN');
    });
  });

  describe('createRelease with GitHub API mock', () => {
    it('creates GitHub release on success', async () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      commitAll('feat: add package');

      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: tempDir,
        encoding: 'utf-8',
      }).trim();

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          html_url: 'https://github.com/test/repo/releases/tag/v0.1.0',
        }),
      });

      try {
        const result = await createRelease({
          version: '0.1.0',
          rootDir: tempDir,
          packages,
          dryRun: false,
          skipPush: true,
          allowedBranches: [branch],
          githubToken: 'fake-token',
          githubRepo: 'test/repo',
        });

        expect(result.success).toBe(true);
        expect(result.githubRelease).not.toBeNull();
        expect(result.githubRelease!.success).toBe(true);
        expect(result.githubRelease!.releaseUrl).toBe(
          'https://github.com/test/repo/releases/tag/v0.1.0',
        );

        const ghStep = result.steps.find((s) => s.name === 'github-release');
        expect(ghStep!.status).toBe('pass');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('handles GitHub API error gracefully', async () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      commitAll('feat: add package');

      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: tempDir,
        encoding: 'utf-8',
      }).trim();

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        text: async () => '{"message":"Validation Failed"}',
      });

      try {
        const result = await createRelease({
          version: '0.1.0',
          rootDir: tempDir,
          packages,
          dryRun: false,
          skipPush: true,
          allowedBranches: [branch],
          githubToken: 'fake-token',
          githubRepo: 'test/repo',
        });

        // Still succeeds overall — GitHub release is non-fatal since tag was created
        expect(result.success).toBe(true);
        const ghStep = result.steps.find((s) => s.name === 'github-release');
        expect(ghStep!.status).toBe('fail');
        expect(ghStep!.message).toContain('422');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('createRelease includes changelog data', () => {
    it('captures changelog content in release notes', async () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      commitAll('feat: add package');

      const result = await createRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: true,
        skipGitHub: true,
      });

      expect(result.releaseNotes).not.toBeNull();
      expect(result.releaseNotes!.version).toBe('0.1.0');
      expect(result.releaseNotes!.tag).toBe('v0.1.0');
      expect(result.releaseNotes!.markdown).toContain("What's Changed");
      expect(result.releaseNotes!.markdown).toContain('Agent, Crew, and Task primitives');
    });

    it('includes package table in release notes', async () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      commitAll('feat: add package');

      const result = await createRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: true,
        skipGitHub: true,
      });

      expect(result.releaseNotes!.markdown).toContain('📦 Packages');
      expect(result.releaseNotes!.markdown).toContain('@crewspace/core');
    });
  });

  describe('formatCreateReleaseOutput', () => {
    it('formats successful release', () => {
      const result: CreateReleaseResult = {
        success: true,
        version: '0.1.0',
        tag: 'v0.1.0',
        steps: [
          { name: 'publish-validation', status: 'pass', message: 'All validations passed' },
          { name: 'generate-release-notes', status: 'pass', message: 'Generated (5 commits)' },
          { name: 'create-tag', status: 'pass', message: 'Created tag: v0.1.0' },
          { name: 'github-release', status: 'pass', message: 'Release created' },
        ],
        releaseNotes: {
          success: true,
          markdown: '# Release',
          version: '0.1.0',
          tag: 'v0.1.0',
          commits: [{ hash: 'abc', subject: 'feat: test', author: 'Test' }],
          contributors: ['Test'],
        },
        githubRelease: {
          success: true,
          tag: 'v0.1.0',
          body: 'notes',
          releaseUrl: 'https://github.com/test/repo/releases/tag/v0.1.0',
        },
      };

      const output = formatCreateReleaseOutput(result, false);

      expect(output).toContain('Crewspace Release v0.1.0');
      expect(output).toContain('completed successfully');
      expect(output).toContain('✓');
      expect(output).toContain('Commits: 1');
      expect(output).toContain('Contributors: 1');
      expect(output).toContain('https://github.com/test/repo/releases/tag/v0.1.0');
      expect(output).not.toContain('DRY RUN');
    });

    it('formats dry-run output', () => {
      const result: CreateReleaseResult = {
        success: true,
        version: '0.1.0',
        tag: 'v0.1.0',
        steps: [
          { name: 'publish-validation', status: 'pass', message: 'Passed' },
          { name: 'create-tag', status: 'skip', message: '[dry-run] Would create tag' },
        ],
        releaseNotes: null,
        githubRelease: null,
      };

      const output = formatCreateReleaseOutput(result, true);

      expect(output).toContain('DRY RUN');
      expect(output).toContain('release is ready');
    });

    it('formats failed release', () => {
      const result: CreateReleaseResult = {
        success: false,
        version: '0.1.0',
        tag: 'v0.1.0',
        steps: [
          { name: 'publish-validation', status: 'fail', message: 'Version mismatch' },
        ],
        releaseNotes: null,
        githubRelease: null,
      };

      const output = formatCreateReleaseOutput(result, false);

      expect(output).toContain('failed');
      expect(output).toContain('✗');
    });

    it('shows step names in output', () => {
      const result: CreateReleaseResult = {
        success: true,
        version: '0.1.0',
        tag: 'v0.1.0',
        steps: [
          { name: 'publish-validation', status: 'pass', message: 'OK' },
          { name: 'generate-release-notes', status: 'pass', message: 'Done' },
          { name: 'github-release', status: 'skip', message: 'Skipped' },
        ],
        releaseNotes: null,
        githubRelease: null,
      };

      const output = formatCreateReleaseOutput(result, false);

      expect(output).toContain('[publish-validation]');
      expect(output).toContain('[generate-release-notes]');
      expect(output).toContain('[github-release]');
    });

    it('shows skip icon for skipped steps', () => {
      const result: CreateReleaseResult = {
        success: true,
        version: '0.1.0',
        tag: 'v0.1.0',
        steps: [{ name: 'push-tag', status: 'skip', message: 'Skipped' }],
        releaseNotes: null,
        githubRelease: null,
      };

      const output = formatCreateReleaseOutput(result, false);
      expect(output).toContain('⊘');
    });
  });
});

describe('create-release script file', () => {
  it('exists at the expected path', () => {
    const { existsSync } = require('node:fs') as typeof import('node:fs');
    const { resolve } = require('node:path') as typeof import('node:path');
    const scriptPath = resolve(__dirname, '..', 'create-release.ts');
    expect(existsSync(scriptPath)).toBe(true);
  });
});
