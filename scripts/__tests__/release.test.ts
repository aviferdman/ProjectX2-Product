import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import {
  checkWorkingTree,
  checkBranch,
  checkTagNotExists,
  validateRelease,
  checkBuildOutput,
  createTag,
  pushTag,
  runRelease,
  formatReleaseOutput,
  parseReleaseArgs,
} from '../release.js';
import type { PackageInfo } from '../prepare-publish.js';

describe('release', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'release-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function initGitRepo(): void {
    execSync('git init', { cwd: tempDir, stdio: 'pipe' });
    execSync('git config user.email "test@test.com"', { cwd: tempDir, stdio: 'pipe' });
    execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'pipe' });
    writeFileSync(join(tempDir, 'README.md'), '# Test');
    execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
    execSync('git commit -m "Initial commit"', { cwd: tempDir, stdio: 'pipe' });
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
      `# Changelog\n\n## [Unreleased]\n\n## [${version}] - 2026-04-06\n\n### Added\n- Initial release\n`,
    );

    return [
      {
        path: 'packages/core',
        name: '@crewspace/core',
        versionExport: 'src/index.ts',
      },
    ];
  }

  describe('parseReleaseArgs', () => {
    it('parses --version flag', () => {
      expect(parseReleaseArgs(['--version', '0.1.0'])).toEqual({
        version: '0.1.0',
        dryRun: false,
        skipPush: false,
      });
    });

    it('parses --dry-run flag', () => {
      expect(parseReleaseArgs(['--version', '0.1.0', '--dry-run'])).toEqual({
        version: '0.1.0',
        dryRun: true,
        skipPush: false,
      });
    });

    it('parses --skip-push flag', () => {
      expect(parseReleaseArgs(['--version', '0.1.0', '--skip-push'])).toEqual({
        version: '0.1.0',
        dryRun: false,
        skipPush: true,
      });
    });

    it('parses all flags together', () => {
      expect(parseReleaseArgs(['--version', '1.0.0', '--dry-run', '--skip-push'])).toEqual({
        version: '1.0.0',
        dryRun: true,
        skipPush: true,
      });
    });

    it('returns empty version when not provided', () => {
      expect(parseReleaseArgs([])).toEqual({
        version: '',
        dryRun: false,
        skipPush: false,
      });
    });
  });

  describe('checkWorkingTree', () => {
    it('passes when working tree is clean', () => {
      initGitRepo();
      const result = checkWorkingTree(tempDir);
      expect(result.status).toBe('pass');
      expect(result.name).toBe('clean-working-tree');
    });

    it('fails when there are uncommitted changes', () => {
      initGitRepo();
      writeFileSync(join(tempDir, 'dirty.txt'), 'uncommitted');
      const result = checkWorkingTree(tempDir);
      expect(result.status).toBe('fail');
      expect(result.message).toContain('uncommitted');
    });

    it('fails when not a git repository', () => {
      const result = checkWorkingTree(tempDir);
      expect(result.status).toBe('fail');
      expect(result.message).toContain('git');
    });
  });

  describe('checkBranch', () => {
    it('passes when on an allowed branch', () => {
      initGitRepo();
      // Default branch after git init might be "master" or "main"
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: tempDir,
        encoding: 'utf-8',
      }).trim();
      const result = checkBranch(tempDir, [branch]);
      expect(result.status).toBe('pass');
    });

    it('fails when on a non-allowed branch', () => {
      initGitRepo();
      execSync('git checkout -b feature-branch', { cwd: tempDir, stdio: 'pipe' });
      const result = checkBranch(tempDir, ['main']);
      expect(result.status).toBe('fail');
      expect(result.message).toContain('feature-branch');
    });

    it('fails when not a git repository', () => {
      const result = checkBranch(tempDir);
      expect(result.status).toBe('fail');
    });
  });

  describe('checkTagNotExists', () => {
    it('passes when tag does not exist', () => {
      initGitRepo();
      const result = checkTagNotExists('v0.1.0', tempDir);
      expect(result.status).toBe('pass');
      expect(result.message).toContain('available');
    });

    it('fails when tag already exists', () => {
      initGitRepo();
      execSync('git tag v0.1.0', { cwd: tempDir, stdio: 'pipe' });
      const result = checkTagNotExists('v0.1.0', tempDir);
      expect(result.status).toBe('fail');
      expect(result.message).toContain('already exists');
    });

    it('fails when not a git repository', () => {
      const result = checkTagNotExists('v0.1.0', tempDir);
      expect(result.status).toBe('fail');
    });
  });

  describe('validateRelease', () => {
    it('passes for a valid setup', () => {
      const packages = setupValidPackage('0.1.0');
      const result = validateRelease('0.1.0', tempDir, packages);
      expect(result.status).toBe('pass');
      expect(result.name).toBe('publish-validation');
    });

    it('fails when version does not match package.json', () => {
      const packages = setupValidPackage('0.2.0');
      const result = validateRelease('0.1.0', tempDir, packages);
      expect(result.status).toBe('fail');
      expect(result.message).toContain('Version mismatch');
    });

    it('fails when CHANGELOG entry is missing', () => {
      const packages = setupValidPackage('0.1.0');
      writeFileSync(join(tempDir, 'CHANGELOG.md'), '# Changelog\n\n## [Unreleased]\n');
      const result = validateRelease('0.1.0', tempDir, packages);
      expect(result.status).toBe('fail');
      expect(result.message).toContain('CHANGELOG');
    });
  });

  describe('checkBuildOutput', () => {
    it('passes when dist exists', () => {
      const packages = setupValidPackage('0.1.0');
      const result = checkBuildOutput(tempDir, packages);
      expect(result.status).toBe('pass');
    });

    it('fails when dist is missing', () => {
      const pkgDir = join(tempDir, 'packages', 'core');
      mkdirSync(pkgDir, { recursive: true });
      const packages: PackageInfo[] = [
        { path: 'packages/core', name: '@crewspace/core', versionExport: 'src/index.ts' },
      ];
      const result = checkBuildOutput(tempDir, packages);
      expect(result.status).toBe('fail');
      expect(result.message).toContain('dist');
    });
  });

  describe('createTag', () => {
    it('creates a tag in a git repo', () => {
      initGitRepo();
      const result = createTag('v0.1.0', '0.1.0', tempDir, false);
      expect(result.status).toBe('pass');
      expect(result.message).toContain('v0.1.0');

      // Verify tag was created
      const tags = execSync('git tag --list', { cwd: tempDir, encoding: 'utf-8' }).trim();
      expect(tags).toContain('v0.1.0');
    });

    it('skips in dry-run mode', () => {
      initGitRepo();
      const result = createTag('v0.1.0', '0.1.0', tempDir, true);
      expect(result.status).toBe('skip');
      expect(result.message).toContain('dry-run');

      // Verify tag was NOT created
      const tags = execSync('git tag --list', { cwd: tempDir, encoding: 'utf-8' }).trim();
      expect(tags).not.toContain('v0.1.0');
    });

    it('fails when not a git repo', () => {
      const result = createTag('v0.1.0', '0.1.0', tempDir, false);
      expect(result.status).toBe('fail');
    });
  });

  describe('pushTag', () => {
    it('skips in dry-run mode', () => {
      const result = pushTag('v0.1.0', tempDir, true, false);
      expect(result.status).toBe('skip');
      expect(result.message).toContain('dry-run');
    });

    it('skips when skip-push is set', () => {
      const result = pushTag('v0.1.0', tempDir, false, true);
      expect(result.status).toBe('skip');
      expect(result.message).toContain('not pushed');
      expect(result.message).toContain('git push origin v0.1.0');
    });

    it('fails when no remote configured', () => {
      initGitRepo();
      const result = pushTag('v0.1.0', tempDir, false, false);
      expect(result.status).toBe('fail');
    });
  });

  describe('runRelease (dry-run)', () => {
    it('succeeds for a valid setup in dry-run mode', () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      // Stage and commit the package files
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "Add package"', { cwd: tempDir, stdio: 'pipe' });

      const result = runRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.tag).toBe('v0.1.0');
      expect(result.version).toBe('0.1.0');
      expect(result.steps.length).toBeGreaterThanOrEqual(5);
    });

    it('fails when validation fails', () => {
      initGitRepo();
      const packages = setupValidPackage('0.2.0');

      const result = runRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: true,
      });

      expect(result.success).toBe(false);
      expect(result.steps[0]!.name).toBe('publish-validation');
      expect(result.steps[0]!.status).toBe('fail');
    });

    it('fails when build output is missing', () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      // Remove the dist directory
      rmSync(join(tempDir, 'packages', 'core', 'dist'), { recursive: true });

      const result = runRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: true,
      });

      expect(result.success).toBe(false);
      expect(result.steps.some((s) => s.name === 'build-output' && s.status === 'fail')).toBe(true);
    });

    it('fails when tag already exists', () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "Add package"', { cwd: tempDir, stdio: 'pipe' });
      execSync('git tag v0.1.0', { cwd: tempDir, stdio: 'pipe' });

      const result = runRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: true,
      });

      expect(result.success).toBe(false);
      expect(result.steps.some((s) => s.name === 'tag-not-exists' && s.status === 'fail')).toBe(
        true,
      );
    });
  });

  describe('runRelease (with skip-push)', () => {
    it('creates tag but skips push', () => {
      initGitRepo();
      const packages = setupValidPackage('0.1.0');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "Add package"', { cwd: tempDir, stdio: 'pipe' });

      // Get the actual branch name
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: tempDir,
        encoding: 'utf-8',
      }).trim();

      const result = runRelease({
        version: '0.1.0',
        rootDir: tempDir,
        packages,
        dryRun: false,
        skipPush: true,
      });

      // Branch check might fail if not on 'main', so check accordingly
      if (branch !== 'main') {
        expect(result.success).toBe(false);
      } else {
        expect(result.success).toBe(true);
        expect(result.steps.some((s) => s.name === 'push-tag' && s.status === 'skip')).toBe(true);
        // Verify tag was created
        const tags = execSync('git tag --list', { cwd: tempDir, encoding: 'utf-8' }).trim();
        expect(tags).toContain('v0.1.0');
      }
    });
  });

  describe('formatReleaseOutput', () => {
    it('formats successful release', () => {
      const output = formatReleaseOutput(
        {
          success: true,
          version: '0.1.0',
          tag: 'v0.1.0',
          steps: [
            { name: 'publish-validation', status: 'pass', message: 'All validations passed' },
            { name: 'create-tag', status: 'pass', message: 'Created tag: v0.1.0' },
            { name: 'push-tag', status: 'pass', message: 'Pushed tag to origin' },
          ],
        },
        false,
      );

      expect(output).toContain('Release 0.1.0');
      expect(output).toContain('successfully');
      expect(output).toContain('✓');
    });

    it('formats dry-run output', () => {
      const output = formatReleaseOutput(
        {
          success: true,
          version: '0.1.0',
          tag: 'v0.1.0',
          steps: [
            { name: 'publish-validation', status: 'pass', message: 'All validations passed' },
            { name: 'create-tag', status: 'skip', message: '[dry-run] Would create tag' },
          ],
        },
        true,
      );

      expect(output).toContain('DRY RUN');
      expect(output).toContain('release is ready');
    });

    it('formats failed release', () => {
      const output = formatReleaseOutput(
        {
          success: false,
          version: '0.1.0',
          tag: 'v0.1.0',
          steps: [{ name: 'publish-validation', status: 'fail', message: 'Version mismatch' }],
        },
        false,
      );

      expect(output).toContain('failed');
      expect(output).toContain('✗');
    });

    it('shows skip icon for skipped steps', () => {
      const output = formatReleaseOutput(
        {
          success: true,
          version: '0.1.0',
          tag: 'v0.1.0',
          steps: [{ name: 'push-tag', status: 'skip', message: 'Skipped push' }],
        },
        false,
      );

      expect(output).toContain('⊘');
    });
  });
});

describe('release script file', () => {
  it('exists at the expected path', () => {
    const { existsSync } = require('node:fs') as typeof import('node:fs');
    const { resolve } = require('node:path') as typeof import('node:path');
    const scriptPath = resolve(__dirname, '..', 'release.ts');
    expect(existsSync(scriptPath)).toBe(true);
  });
});
