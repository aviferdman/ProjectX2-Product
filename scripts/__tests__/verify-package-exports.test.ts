import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  parseExportsField,
  verifyExports,
  formatVerifyExportsOutput,
  parseVerifyExportsArgs,
} from '../verify-package-exports.js';

describe('verify-package-exports', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'verify-exports-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('parseExportsField', () => {
    it('parses conditional exports', () => {
      const entries = parseExportsField({
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.js',
          require: './dist/cjs/index.js',
          default: './dist/index.js',
        },
      });

      expect(entries).toHaveLength(1);
      expect(entries[0]!.subpath).toBe('.');
      expect(entries[0]!.conditions).toEqual({
        types: './dist/index.d.ts',
        import: './dist/index.js',
        require: './dist/cjs/index.js',
        default: './dist/index.js',
      });
    });

    it('parses string export values', () => {
      const entries = parseExportsField({
        '.': './dist/index.js',
      });

      expect(entries).toHaveLength(1);
      expect(entries[0]!.subpath).toBe('.');
      expect(entries[0]!.conditions).toEqual({ default: './dist/index.js' });
    });

    it('parses multiple subpath exports', () => {
      const entries = parseExportsField({
        '.': { import: './dist/index.js' },
        './testing': { import: './dist/testing/index.js' },
      });

      expect(entries).toHaveLength(2);
      expect(entries[0]!.subpath).toBe('.');
      expect(entries[1]!.subpath).toBe('./testing');
    });

    it('skips non-string/object values', () => {
      const entries = parseExportsField({
        '.': { import: './dist/index.js' },
      });

      expect(entries).toHaveLength(1);
    });

    it('returns empty array for empty exports', () => {
      expect(parseExportsField({})).toHaveLength(0);
    });
  });

  describe('verifyExports', () => {
    it('passes when all exports resolve', () => {
      const pkgDir = join(tempDir, 'pkg');
      mkdirSync(join(pkgDir, 'dist', 'testing'), { recursive: true });
      mkdirSync(join(pkgDir, 'dist', 'cjs', 'testing'), { recursive: true });

      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({
          name: '@crewspace/core',
          version: '0.1.0',
          main: './dist/cjs/index.js',
          module: './dist/index.js',
          types: './dist/index.d.ts',
          exports: {
            '.': {
              types: './dist/index.d.ts',
              import: './dist/index.js',
              require: './dist/cjs/index.js',
            },
            './testing': {
              types: './dist/testing/index.d.ts',
              import: './dist/testing/index.js',
              require: './dist/cjs/testing/index.js',
            },
          },
        }),
      );

      writeFileSync(join(pkgDir, 'dist', 'index.js'), 'export {};');
      writeFileSync(join(pkgDir, 'dist', 'index.d.ts'), 'export {};');
      writeFileSync(join(pkgDir, 'dist', 'testing', 'index.js'), 'export {};');
      writeFileSync(join(pkgDir, 'dist', 'testing', 'index.d.ts'), 'export {};');
      writeFileSync(join(pkgDir, 'dist', 'cjs', 'index.js'), 'exports = {};');
      writeFileSync(join(pkgDir, 'dist', 'cjs', 'testing', 'index.js'), 'exports = {};');

      const result = verifyExports(pkgDir);
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.packageName).toBe('@crewspace/core');
      expect(result.packageVersion).toBe('0.1.0');
    });

    it('fails when export target is missing', () => {
      const pkgDir = join(tempDir, 'pkg');
      mkdirSync(join(pkgDir, 'dist'), { recursive: true });

      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({
          name: '@crewspace/core',
          version: '0.1.0',
          exports: {
            '.': {
              types: './dist/index.d.ts',
              import: './dist/index.js',
            },
          },
        }),
      );

      // Only create one of the two expected files
      writeFileSync(join(pkgDir, 'dist', 'index.js'), 'export {};');

      const result = verifyExports(pkgDir);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes('index.d.ts'))).toBe(true);
    });

    it('fails when main field target is missing', () => {
      const pkgDir = join(tempDir, 'pkg');
      mkdirSync(pkgDir, { recursive: true });

      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({
          name: '@crewspace/core',
          version: '0.1.0',
          main: './dist/cjs/index.js',
        }),
      );

      const result = verifyExports(pkgDir);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes('"main"'))).toBe(true);
    });

    it('fails when types field target is missing', () => {
      const pkgDir = join(tempDir, 'pkg');
      mkdirSync(pkgDir, { recursive: true });

      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({
          name: '@crewspace/core',
          version: '0.1.0',
          types: './dist/index.d.ts',
        }),
      );

      const result = verifyExports(pkgDir);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes('"types"'))).toBe(true);
    });

    it('fails when module field target is missing', () => {
      const pkgDir = join(tempDir, 'pkg');
      mkdirSync(pkgDir, { recursive: true });

      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({
          name: '@crewspace/core',
          version: '0.1.0',
          module: './dist/index.js',
        }),
      );

      const result = verifyExports(pkgDir);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes('"module"'))).toBe(true);
    });

    it('returns error when package.json is not found', () => {
      const result = verifyExports(join(tempDir, 'nonexistent'));
      expect(result.passed).toBe(false);
      expect(result.errors).toContain('package.json not found');
    });

    it('warns when exports field is missing', () => {
      const pkgDir = join(tempDir, 'pkg');
      mkdirSync(pkgDir, { recursive: true });

      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' }),
      );

      const result = verifyExports(pkgDir);
      expect(result.warnings.some((w) => w.includes('No "exports"'))).toBe(true);
    });
  });

  describe('formatVerifyExportsOutput', () => {
    it('formats passing result', () => {
      const output = formatVerifyExportsOutput({
        packageName: '@crewspace/core',
        packageVersion: '0.1.0',
        passed: true,
        checks: [
          {
            subpath: '.',
            condition: 'import',
            filePath: './dist/index.js',
            resolvedPath: '/pkg/dist/index.js',
            exists: true,
          },
        ],
        errors: [],
        warnings: [],
      });

      expect(output).toContain('@crewspace/core@0.1.0');
      expect(output).toContain('All exports resolve correctly');
      expect(output).toContain('1 resolved');
      expect(output).toContain('0 missing');
    });

    it('formats failing result', () => {
      const output = formatVerifyExportsOutput({
        packageName: '@crewspace/core',
        packageVersion: '0.1.0',
        passed: false,
        checks: [
          {
            subpath: '.',
            condition: 'import',
            filePath: './dist/index.js',
            resolvedPath: '/pkg/dist/index.js',
            exists: false,
          },
        ],
        errors: ['exports["."].import → "./dist/index.js" not found'],
        warnings: [],
      });

      expect(output).toContain('do not resolve');
      expect(output).toContain('1 missing');
    });

    it('formats warnings', () => {
      const output = formatVerifyExportsOutput({
        packageName: 'test',
        packageVersion: '1.0.0',
        passed: true,
        checks: [],
        errors: [],
        warnings: ['No "exports" field in package.json'],
      });

      expect(output).toContain('No "exports"');
    });
  });

  describe('parseVerifyExportsArgs', () => {
    it('parses --package flag', () => {
      expect(parseVerifyExportsArgs(['--package', 'packages/cli'])).toEqual({
        packagePath: 'packages/cli',
      });
    });

    it('defaults to packages/core', () => {
      expect(parseVerifyExportsArgs([])).toEqual({
        packagePath: 'packages/core',
      });
    });
  });
});
