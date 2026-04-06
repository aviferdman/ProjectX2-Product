import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  extractVersionFromTag,
  validatePackage,
  validateChangelog,
  validatePublish,
  formatValidationOutput,
} from '../prepare-publish.js';
import type { PackageInfo } from '../prepare-publish.js';

describe('prepare-publish', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'publish-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('extractVersionFromTag', () => {
    it('extracts version from valid tag', () => {
      expect(extractVersionFromTag('v1.0.0')).toBe('1.0.0');
    });

    it('extracts version from pre-release tag', () => {
      expect(extractVersionFromTag('v0.1.0-beta.1')).toBe('0.1.0-beta.1');
    });

    it('extracts version with build metadata', () => {
      expect(extractVersionFromTag('v1.0.0+build.123')).toBe('1.0.0+build.123');
    });

    it('returns null for tag without v prefix', () => {
      expect(extractVersionFromTag('1.0.0')).toBeNull();
    });

    it('returns null for invalid semver after v prefix', () => {
      expect(extractVersionFromTag('vfoo')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(extractVersionFromTag('')).toBeNull();
    });

    it('returns null for tag with just v', () => {
      expect(extractVersionFromTag('v')).toBeNull();
    });

    it('extracts zero-based versions', () => {
      expect(extractVersionFromTag('v0.0.0')).toBe('0.0.0');
    });
  });

  describe('validatePackage', () => {
    function setupPackage(opts: {
      version?: string;
      name?: string;
      fields?: Record<string, unknown>;
      versionExport?: string;
      includeFiles?: boolean;
      isPrivate?: boolean;
    }): PackageInfo {
      const pkgDir = join(tempDir, 'packages', 'core');
      mkdirSync(pkgDir, { recursive: true });
      mkdirSync(join(pkgDir, 'src'), { recursive: true });

      const pkgJson: Record<string, unknown> = {
        name: opts.name ?? '@crewspace/core',
        version: opts.version ?? '0.1.0',
        description: 'Test package',
        license: 'MIT',
        main: './dist/index.js',
        types: './dist/index.d.ts',
        files: ['dist', 'README.md', 'LICENSE'],
        ...(opts.fields ?? {}),
      };

      if (opts.isPrivate) {
        pkgJson['private'] = true;
      }

      writeFileSync(join(pkgDir, 'package.json'), JSON.stringify(pkgJson, null, 2));

      if (opts.versionExport !== undefined) {
        writeFileSync(join(pkgDir, 'src', 'index.ts'), opts.versionExport);
      } else {
        writeFileSync(
          join(pkgDir, 'src', 'index.ts'),
          `export const VERSION = '${opts.version ?? '0.1.0'}';\n`,
        );
      }

      if (opts.includeFiles !== false) {
        writeFileSync(join(pkgDir, 'README.md'), '# Test');
        writeFileSync(join(pkgDir, 'LICENSE'), 'MIT');
      }

      return {
        path: 'packages/core',
        name: opts.name ?? '@crewspace/core',
        versionExport: 'src/index.ts',
      };
    }

    it('passes validation for a well-formed package', () => {
      const pkg = setupPackage({ version: '0.1.0' });
      const result = validatePackage(pkg, '0.1.0', tempDir);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.packageName).toBe('@crewspace/core');
      expect(result.packageVersion).toBe('0.1.0');
    });

    it('fails when version does not match expected', () => {
      const pkg = setupPackage({ version: '0.2.0' });
      const result = validatePackage(pkg, '0.1.0', tempDir);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('Version mismatch'));
    });

    it('fails when package.json is missing', () => {
      const pkg: PackageInfo = {
        path: 'packages/nonexistent',
        name: '@crewspace/nonexistent',
        versionExport: 'src/index.ts',
      };
      const result = validatePackage(pkg, '0.1.0', tempDir);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('package.json not found'));
    });

    it('fails when required fields are missing', () => {
      const pkgDir = join(tempDir, 'packages', 'core');
      mkdirSync(pkgDir, { recursive: true });
      mkdirSync(join(pkgDir, 'src'), { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({ name: '@crewspace/core', version: '0.1.0' }),
      );
      writeFileSync(join(pkgDir, 'src', 'index.ts'), "export const VERSION = '0.1.0';\n");
      writeFileSync(join(pkgDir, 'README.md'), '# Test');
      writeFileSync(join(pkgDir, 'LICENSE'), 'MIT');

      const pkg: PackageInfo = {
        path: 'packages/core',
        name: '@crewspace/core',
        versionExport: 'src/index.ts',
      };
      const result = validatePackage(pkg, '0.1.0', tempDir);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Missing required field'))).toBe(true);
    });

    it('fails when VERSION export mismatches', () => {
      const pkg = setupPackage({
        version: '0.1.0',
        versionExport: "export const VERSION = '0.2.0';\n",
      });
      const result = validatePackage(pkg, '0.1.0', tempDir);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('VERSION export mismatch'));
    });

    it('warns when no VERSION export found', () => {
      const pkg = setupPackage({
        version: '0.1.0',
        versionExport: 'export const FOO = 42;\n',
      });
      const result = validatePackage(pkg, '0.1.0', tempDir);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(expect.stringContaining('No VERSION export'));
    });

    it('fails when required files are missing', () => {
      const pkg = setupPackage({ version: '0.1.0', includeFiles: false });
      const result = validatePackage(pkg, '0.1.0', tempDir);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Required file missing'))).toBe(true);
    });

    it('fails when package is private', () => {
      const pkg = setupPackage({ version: '0.1.0', isPrivate: true });
      const result = validatePackage(pkg, '0.1.0', tempDir);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('private'));
    });

    it('fails when files field does not include dist', () => {
      const pkg = setupPackage({
        version: '0.1.0',
        fields: { files: ['README.md'] },
      });
      const result = validatePackage(pkg, '0.1.0', tempDir);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('"files" field'));
    });
  });

  describe('validateChangelog', () => {
    it('passes for valid changelog with version entry', () => {
      writeFileSync(
        join(tempDir, 'CHANGELOG.md'),
        '# Changelog\n\n## [Unreleased]\n\n## [0.1.0] - 2026-04-06\n\n### Added\n- Initial release\n',
      );
      const result = validateChangelog('0.1.0', tempDir);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails when CHANGELOG.md is missing', () => {
      const result = validateChangelog('0.1.0', tempDir);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('CHANGELOG.md not found'));
    });

    it('fails when version entry is missing', () => {
      writeFileSync(
        join(tempDir, 'CHANGELOG.md'),
        '# Changelog\n\n## [Unreleased]\n\n### Added\n- Something\n',
      );
      const result = validateChangelog('0.1.0', tempDir);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('no entry for version 0.1.0'));
    });

    it('fails when changelog title is missing', () => {
      writeFileSync(
        join(tempDir, 'CHANGELOG.md'),
        '## [Unreleased]\n\n## [0.1.0] - 2026-04-06\n',
      );
      const result = validateChangelog('0.1.0', tempDir);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('missing title'));
    });

    it('warns when Unreleased section is missing', () => {
      writeFileSync(
        join(tempDir, 'CHANGELOG.md'),
        '# Changelog\n\n## [0.1.0] - 2026-04-06\n\n### Added\n- Initial release\n',
      );
      const result = validateChangelog('0.1.0', tempDir);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(expect.stringContaining('[Unreleased]'));
    });
  });

  describe('validatePublish', () => {
    function setupValidRepo(version: string): PackageInfo[] {
      const pkgDir = join(tempDir, 'packages', 'core');
      mkdirSync(pkgDir, { recursive: true });
      mkdirSync(join(pkgDir, 'src'), { recursive: true });

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

      writeFileSync(
        join(tempDir, 'CHANGELOG.md'),
        `# Changelog\n\n## [Unreleased]\n\n## [${version}] - 2026-04-06\n\n### Added\n- Release\n`,
      );

      return [
        {
          path: 'packages/core',
          name: '@crewspace/core',
          versionExport: 'src/index.ts',
        },
      ];
    }

    it('passes for a valid repository', () => {
      const packages = setupValidRepo('0.1.0');
      const result = validatePublish({
        tag: 'v0.1.0',
        rootDir: tempDir,
        packages,
      });
      expect(result.valid).toBe(true);
      expect(result.tagVersion).toBe('0.1.0');
    });

    it('fails for invalid tag format', () => {
      const packages = setupValidRepo('0.1.0');
      const result = validatePublish({
        tag: 'invalid',
        rootDir: tempDir,
        packages,
      });
      expect(result.valid).toBe(false);
      expect(result.tagVersion).toBeNull();
    });

    it('fails when tag version does not match package version', () => {
      const packages = setupValidRepo('0.1.0');
      const result = validatePublish({
        tag: 'v0.2.0',
        rootDir: tempDir,
        packages,
      });
      expect(result.valid).toBe(false);
      expect(result.results[0]?.errors.some((e) => e.includes('Version mismatch'))).toBe(true);
    });

    it('collects errors from both packages and changelog', () => {
      // Set up package with wrong version and no changelog
      const pkgDir = join(tempDir, 'packages', 'core');
      mkdirSync(pkgDir, { recursive: true });
      mkdirSync(join(pkgDir, 'src'), { recursive: true });

      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({
          name: '@crewspace/core',
          version: '0.3.0',
          description: 'Core',
          license: 'MIT',
          main: './dist/index.js',
          types: './dist/index.d.ts',
          files: ['dist'],
        }),
      );
      writeFileSync(join(pkgDir, 'src', 'index.ts'), "export const VERSION = '0.3.0';\n");
      writeFileSync(join(pkgDir, 'README.md'), '# Test');
      writeFileSync(join(pkgDir, 'LICENSE'), 'MIT');
      // No CHANGELOG.md

      const packages: PackageInfo[] = [
        { path: 'packages/core', name: '@crewspace/core', versionExport: 'src/index.ts' },
      ];

      const result = validatePublish({
        tag: 'v0.1.0',
        rootDir: tempDir,
        packages,
      });

      expect(result.valid).toBe(false);
      // Package version mismatch + changelog missing
      expect(result.results[0]?.errors.length).toBeGreaterThan(0);
      expect(result.changelogResult.valid).toBe(false);
    });
  });

  describe('formatValidationOutput', () => {
    it('formats successful validation', () => {
      const output = formatValidationOutput({
        valid: true,
        tagVersion: '0.1.0',
        results: [
          {
            valid: true,
            errors: [],
            warnings: [],
            packageName: '@crewspace/core',
            packageVersion: '0.1.0',
          },
        ],
        changelogResult: { valid: true, errors: [], warnings: [] },
      });
      expect(output).toContain('Ready to publish');
      expect(output).toContain('@crewspace/core@0.1.0');
      expect(output).toContain('All checks passed');
    });

    it('formats failed validation with errors', () => {
      const output = formatValidationOutput({
        valid: false,
        tagVersion: '0.1.0',
        results: [
          {
            valid: false,
            errors: ['Version mismatch'],
            warnings: ['No VERSION export found'],
            packageName: '@crewspace/core',
            packageVersion: '0.2.0',
          },
        ],
        changelogResult: { valid: false, errors: ['CHANGELOG.md not found'], warnings: [] },
      });
      expect(output).toContain('Validation failed');
      expect(output).toContain('Version mismatch');
      expect(output).toContain('CHANGELOG.md not found');
      expect(output).toContain('No VERSION export found');
    });

    it('formats invalid tag error', () => {
      const output = formatValidationOutput({
        valid: false,
        tagVersion: null,
        results: [],
        changelogResult: { valid: false, errors: ['Invalid tag format: "bad"'], warnings: [] },
      });
      expect(output).toContain('Invalid tag format');
    });
  });
});

describe('publish workflow file', () => {
  it('exists at the expected path', () => {
    const { existsSync } = require('node:fs') as typeof import('node:fs');
    const { resolve } = require('node:path') as typeof import('node:path');
    const workflowPath = resolve(__dirname, '..', '..', '.github', 'workflows', 'publish.yml');
    expect(existsSync(workflowPath)).toBe(true);
  });

  it('contains required workflow configuration', () => {
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    const { resolve } = require('node:path') as typeof import('node:path');
    const workflowPath = resolve(__dirname, '..', '..', '.github', 'workflows', 'publish.yml');
    const content = readFileSync(workflowPath, 'utf-8');

    // Trigger on version tags
    expect(content).toContain("- 'v*'");

    // Has all required jobs
    expect(content).toContain('validate:');
    expect(content).toContain('ci:');
    expect(content).toContain('build:');
    expect(content).toContain('publish:');

    // Uses npm provenance
    expect(content).toContain('--provenance');

    // Uses NPM_TOKEN secret
    expect(content).toContain('NPM_TOKEN');

    // Registry URL configured
    expect(content).toContain('registry.npmjs.org');

    // Has id-token write permission for provenance
    expect(content).toContain('id-token: write');

    // Uses environment protection
    expect(content).toContain('environment: npm-publish');

    // Has concurrency control
    expect(content).toContain('cancel-in-progress: false');

    // Publishes with public access
    expect(content).toContain('--access public');
  });

  it('validates tag before publishing', () => {
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    const { resolve } = require('node:path') as typeof import('node:path');
    const workflowPath = resolve(__dirname, '..', '..', '.github', 'workflows', 'publish.yml');
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('prepare-publish.ts');
    expect(content).toContain('--tag');
  });

  it('runs CI checks across multiple Node.js versions', () => {
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    const { resolve } = require('node:path') as typeof import('node:path');
    const workflowPath = resolve(__dirname, '..', '..', '.github', 'workflows', 'publish.yml');
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('node-version: [18, 20, 22]');
  });

  it('has sequential job dependencies (validate → ci → build → publish)', () => {
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    const { resolve } = require('node:path') as typeof import('node:path');
    const workflowPath = resolve(__dirname, '..', '..', '.github', 'workflows', 'publish.yml');
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('needs: [validate]');
    expect(content).toContain('needs: [ci]');
    expect(content).toContain('needs: [build]');
  });
});
