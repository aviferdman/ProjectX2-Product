import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  checkDistOutput,
  checkPackageMetadata,
  checkVersionConsistency,
  countFiles,
  getDirectorySize,
  formatSize,
  runPublishCheck,
  formatPublishCheckOutput,
  parsePublishCheckArgs,
} from '../publish-check.js';

describe('publish-check', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'publish-check-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('checkDistOutput', () => {
    it('fails when dist directory does not exist', () => {
      const pkgDir = join(tempDir, 'pkg');
      mkdirSync(pkgDir, { recursive: true });
      const checks = checkDistOutput(pkgDir);
      expect(checks.some((c) => c.status === 'fail' && c.name === 'dist-exists')).toBe(true);
    });

    it('passes when dist has index.js and index.d.ts', () => {
      const pkgDir = join(tempDir, 'pkg');
      const distDir = join(pkgDir, 'dist');
      mkdirSync(distDir, { recursive: true });
      writeFileSync(join(distDir, 'index.js'), 'export {};');
      writeFileSync(join(distDir, 'index.d.ts'), 'export {};');
      writeFileSync(join(distDir, 'index.js.map'), '{}');

      const checks = checkDistOutput(pkgDir);
      expect(checks.every((c) => c.status === 'pass')).toBe(true);
    });

    it('fails when index.js is missing', () => {
      const pkgDir = join(tempDir, 'pkg');
      const distDir = join(pkgDir, 'dist');
      mkdirSync(distDir, { recursive: true });
      writeFileSync(join(distDir, 'index.d.ts'), 'export {};');

      const checks = checkDistOutput(pkgDir);
      expect(checks.some((c) => c.status === 'fail' && c.name === 'dist-index-js')).toBe(true);
    });

    it('fails when index.d.ts is missing', () => {
      const pkgDir = join(tempDir, 'pkg');
      const distDir = join(pkgDir, 'dist');
      mkdirSync(distDir, { recursive: true });
      writeFileSync(join(distDir, 'index.js'), 'export {};');

      const checks = checkDistOutput(pkgDir);
      expect(checks.some((c) => c.status === 'fail' && c.name === 'dist-index-dts')).toBe(true);
    });

    it('warns when source maps are missing', () => {
      const pkgDir = join(tempDir, 'pkg');
      const distDir = join(pkgDir, 'dist');
      mkdirSync(distDir, { recursive: true });
      writeFileSync(join(distDir, 'index.js'), 'export {};');
      writeFileSync(join(distDir, 'index.d.ts'), 'export {};');

      const checks = checkDistOutput(pkgDir);
      expect(checks.some((c) => c.status === 'warn' && c.name === 'dist-sourcemaps')).toBe(true);
    });
  });

  describe('checkPackageMetadata', () => {
    it('passes for a well-formed package.json', () => {
      const pkgDir = join(tempDir, 'pkg');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({
          name: '@crewspace/core',
          version: '0.1.0',
          description: 'Core package',
          license: 'MIT',
          main: './dist/index.js',
          types: './dist/index.d.ts',
          files: ['dist'],
          repository: { type: 'git', url: 'https://github.com/test/repo' },
          keywords: ['agent'],
          exports: { '.': { import: './dist/index.js' } },
          engines: { node: '>=18.0.0' },
        }),
      );

      const checks = checkPackageMetadata(pkgDir);
      expect(checks.every((c) => c.status === 'pass')).toBe(true);
    });

    it('fails when package is private', () => {
      const pkgDir = join(tempDir, 'pkg');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({
          name: '@crewspace/core',
          version: '0.1.0',
          description: 'Core',
          license: 'MIT',
          main: './dist/index.js',
          types: './dist/index.d.ts',
          files: ['dist'],
          repository: { type: 'git', url: 'https://github.com/test/repo' },
          keywords: ['agent'],
          private: true,
        }),
      );

      const checks = checkPackageMetadata(pkgDir);
      expect(checks.some((c) => c.status === 'fail' && c.name === 'not-private')).toBe(true);
    });

    it('fails when required fields are missing', () => {
      const pkgDir = join(tempDir, 'pkg');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({ name: '@crewspace/core', version: '0.1.0' }),
      );

      const checks = checkPackageMetadata(pkgDir);
      const failedChecks = checks.filter((c) => c.status === 'fail');
      expect(failedChecks.length).toBeGreaterThan(0);
    });

    it('returns fail when package.json not found', () => {
      const pkgDir = join(tempDir, 'nonexistent');
      const checks = checkPackageMetadata(pkgDir);
      expect(checks).toHaveLength(1);
      expect(checks[0]!.status).toBe('fail');
    });

    it('warns when exports field is missing', () => {
      const pkgDir = join(tempDir, 'pkg');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({
          name: '@crewspace/core',
          version: '0.1.0',
          description: 'Core',
          license: 'MIT',
          main: './dist/index.js',
          types: './dist/index.d.ts',
          files: ['dist'],
          repository: { type: 'git', url: 'https://github.com/test/repo' },
          keywords: ['agent'],
        }),
      );

      const checks = checkPackageMetadata(pkgDir);
      expect(checks.some((c) => c.status === 'warn' && c.name === 'field-exports')).toBe(true);
    });
  });

  describe('checkVersionConsistency', () => {
    function setupPackageDir(version: string, versionExport?: string): string {
      const pkgDir = join(tempDir, 'pkg');
      mkdirSync(join(pkgDir, 'src'), { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({ name: '@crewspace/core', version }),
      );
      writeFileSync(
        join(pkgDir, 'src', 'index.ts'),
        versionExport ?? `export const VERSION = '${version}';\n`,
      );
      return pkgDir;
    }

    it('passes when versions are consistent', () => {
      const pkgDir = setupPackageDir('0.1.0');
      writeFileSync(
        join(tempDir, 'CHANGELOG.md'),
        '# Changelog\n\n## [Unreleased]\n\n## [0.1.0] - 2026-04-06\n\n### Added\n- Initial release\n',
      );

      const checks = checkVersionConsistency(pkgDir, tempDir, 'src/index.ts');
      expect(checks.every((c) => c.status === 'pass')).toBe(true);
    });

    it('fails when VERSION export does not match', () => {
      const pkgDir = setupPackageDir('0.1.0', "export const VERSION = '0.2.0';\n");
      writeFileSync(
        join(tempDir, 'CHANGELOG.md'),
        '# Changelog\n\n## [Unreleased]\n\n## [0.1.0] - 2026-04-06\n',
      );

      const checks = checkVersionConsistency(pkgDir, tempDir, 'src/index.ts');
      expect(checks.some((c) => c.status === 'fail' && c.name === 'version-export-match')).toBe(
        true,
      );
    });

    it('fails when CHANGELOG entry is missing', () => {
      const pkgDir = setupPackageDir('0.1.0');
      writeFileSync(join(tempDir, 'CHANGELOG.md'), '# Changelog\n\n## [Unreleased]\n');

      const checks = checkVersionConsistency(pkgDir, tempDir, 'src/index.ts');
      expect(checks.some((c) => c.status === 'fail' && c.name === 'changelog-entry')).toBe(true);
    });

    it('fails when CHANGELOG.md is missing', () => {
      const pkgDir = setupPackageDir('0.1.0');

      const checks = checkVersionConsistency(pkgDir, tempDir, 'src/index.ts');
      expect(checks.some((c) => c.status === 'fail' && c.name === 'changelog-entry')).toBe(true);
    });

    it('warns when no VERSION export found', () => {
      const pkgDir = setupPackageDir('0.1.0', 'export const FOO = 42;\n');
      writeFileSync(join(tempDir, 'CHANGELOG.md'), '# Changelog\n\n## [0.1.0] - 2026-04-06\n');

      const checks = checkVersionConsistency(pkgDir, tempDir, 'src/index.ts');
      expect(checks.some((c) => c.status === 'warn' && c.name === 'version-export-match')).toBe(
        true,
      );
    });
  });

  describe('countFiles', () => {
    it('returns 0 for nonexistent directory', () => {
      expect(countFiles(join(tempDir, 'nonexistent'))).toBe(0);
    });

    it('counts files recursively', () => {
      const dir = join(tempDir, 'files');
      mkdirSync(join(dir, 'sub'), { recursive: true });
      writeFileSync(join(dir, 'a.txt'), 'a');
      writeFileSync(join(dir, 'b.txt'), 'b');
      writeFileSync(join(dir, 'sub', 'c.txt'), 'c');

      expect(countFiles(dir)).toBe(3);
    });
  });

  describe('getDirectorySize', () => {
    it('returns 0 for nonexistent directory', () => {
      expect(getDirectorySize(join(tempDir, 'nonexistent'))).toBe(0);
    });

    it('sums file sizes', () => {
      const dir = join(tempDir, 'sized');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'a.txt'), 'hello');
      writeFileSync(join(dir, 'b.txt'), 'world!');

      expect(getDirectorySize(dir)).toBe(11);
    });
  });

  describe('formatSize', () => {
    it('formats bytes', () => {
      expect(formatSize(500)).toBe('500 B');
    });

    it('formats kilobytes', () => {
      expect(formatSize(2048)).toBe('2.0 KB');
    });

    it('formats megabytes', () => {
      expect(formatSize(2 * 1024 * 1024)).toBe('2.0 MB');
    });
  });

  describe('runPublishCheck', () => {
    function setupValidPackage(): void {
      const pkgDir = join(tempDir, 'packages', 'core');
      const distDir = join(pkgDir, 'dist');
      mkdirSync(join(pkgDir, 'src'), { recursive: true });
      mkdirSync(distDir, { recursive: true });

      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({
          name: '@crewspace/core',
          version: '0.1.0',
          description: 'Core package',
          license: 'MIT',
          main: './dist/index.js',
          types: './dist/index.d.ts',
          files: ['dist', 'README.md', 'LICENSE'],
          repository: { type: 'git', url: 'https://github.com/test/repo' },
          keywords: ['agent'],
          exports: { '.': { import: './dist/index.js' } },
          engines: { node: '>=18.0.0' },
        }),
      );
      writeFileSync(join(pkgDir, 'src', 'index.ts'), "export const VERSION = '0.1.0';\n");
      writeFileSync(join(distDir, 'index.js'), 'export {};');
      writeFileSync(join(distDir, 'index.d.ts'), 'export {};');
      writeFileSync(join(distDir, 'index.js.map'), '{}');

      writeFileSync(
        join(tempDir, 'CHANGELOG.md'),
        '# Changelog\n\n## [Unreleased]\n\n## [0.1.0] - 2026-04-06\n\n### Added\n- Initial release\n',
      );
    }

    it('passes for a well-configured package', () => {
      setupValidPackage();
      const result = runPublishCheck({
        rootDir: tempDir,
        packagePath: 'packages/core',
      });

      // All non-pack-related checks should pass (pack may fail in temp dirs)
      const nonPackChecks = result.checks.filter(
        (c) =>
          !c.name.startsWith('pack-') &&
          !c.name.startsWith('no-') &&
          !c.name.startsWith('dist-included') &&
          !c.name.startsWith('size-'),
      );
      expect(nonPackChecks.every((c) => c.status !== 'fail')).toBe(true);
      expect(result.packageName).toBe('@crewspace/core');
      expect(result.packageVersion).toBe('0.1.0');
    });

    it('fails when package.json is missing', () => {
      const result = runPublishCheck({
        rootDir: tempDir,
        packagePath: 'packages/nonexistent',
      });

      expect(result.passed).toBe(false);
      expect(result.packageName).toBe('unknown');
    });
  });

  describe('formatPublishCheckOutput', () => {
    it('formats passing result', () => {
      const output = formatPublishCheckOutput({
        passed: true,
        checks: [
          { name: 'dist-exists', status: 'pass', message: 'dist/ directory exists' },
          { name: 'version-match', status: 'pass', message: 'Versions consistent' },
        ],
        packageName: '@crewspace/core',
        packageVersion: '0.1.0',
        tarballFiles: ['dist/index.js', 'dist/index.d.ts', 'README.md', 'LICENSE'],
        estimatedSize: '150.0 KB',
      });

      expect(output).toContain('@crewspace/core@0.1.0');
      expect(output).toContain('150.0 KB');
      expect(output).toContain('Ready to publish');
      expect(output).toContain('2 passed');
    });

    it('formats failing result', () => {
      const output = formatPublishCheckOutput({
        passed: false,
        checks: [
          { name: 'dist-exists', status: 'fail', message: 'dist/ not found' },
          { name: 'version-match', status: 'pass', message: 'OK' },
          { name: 'sourcemaps', status: 'warn', message: 'No source maps' },
        ],
        packageName: '@crewspace/core',
        packageVersion: '0.1.0',
        tarballFiles: [],
        estimatedSize: 'unknown',
      });

      expect(output).toContain('Not ready');
      expect(output).toContain('1 failed');
      expect(output).toContain('1 warnings');
    });

    it('groups tarball files by directory', () => {
      const output = formatPublishCheckOutput({
        passed: true,
        checks: [],
        packageName: '@crewspace/core',
        packageVersion: '0.1.0',
        tarballFiles: ['dist/index.js', 'dist/index.d.ts', 'dist/agent/index.js', 'README.md'],
        estimatedSize: '100.0 KB',
      });

      expect(output).toContain('dist/');
      expect(output).toContain('README.md');
    });
  });

  describe('parsePublishCheckArgs', () => {
    it('parses --rebuild flag', () => {
      expect(parsePublishCheckArgs(['--rebuild'])).toEqual({ rebuild: true });
    });

    it('defaults to no rebuild', () => {
      expect(parsePublishCheckArgs([])).toEqual({ rebuild: false });
    });
  });
});
