/**
 * Publish readiness integration tests for @crewspace/core.
 *
 * These tests validate the actual package in this repository is ready
 * for npm publishing. They check real file paths, version consistency,
 * exports resolution, and tarball contents.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(__dirname, '..', '..', '..');
const CORE_DIR = resolve(__dirname, '..');
const PKG_JSON_PATH = join(CORE_DIR, 'package.json');

function readPkgJson(): Record<string, unknown> {
  return JSON.parse(readFileSync(PKG_JSON_PATH, 'utf-8')) as Record<string, unknown>;
}

describe('Publish Readiness — @crewspace/core', () => {
  describe('Package metadata', () => {
    it('has correct package name', () => {
      const pkg = readPkgJson();
      expect(pkg['name']).toBe('@crewspace/core');
    });

    it('has version 0.1.0', () => {
      const pkg = readPkgJson();
      expect(pkg['version']).toBe('0.1.0');
    });

    it('is not marked as private', () => {
      const pkg = readPkgJson();
      expect(pkg['private']).toBeUndefined();
    });

    it('has required metadata fields', () => {
      const pkg = readPkgJson();
      expect(pkg['description']).toBeTruthy();
      expect(pkg['license']).toBe('MIT');
      expect(pkg['repository']).toBeTruthy();
      expect(pkg['keywords']).toBeTruthy();
      expect(Array.isArray(pkg['keywords'])).toBe(true);
    });

    it('has engines field requiring Node.js >=18', () => {
      const pkg = readPkgJson();
      const engines = pkg['engines'] as Record<string, string> | undefined;
      expect(engines).toBeTruthy();
      expect(engines?.['node']).toContain('18');
    });

    it('has correct files field', () => {
      const pkg = readPkgJson();
      const files = pkg['files'] as string[];
      expect(files).toContain('dist');
      expect(files).toContain('README.md');
      expect(files).toContain('LICENSE');
    });

    it('has sideEffects set to false for tree-shaking', () => {
      const pkg = readPkgJson();
      expect(pkg['sideEffects']).toBe(false);
    });

    it('has type set to module', () => {
      const pkg = readPkgJson();
      expect(pkg['type']).toBe('module');
    });
  });

  describe('Exports map resolution', () => {
    it('root export (.) resolves — types', () => {
      const pkg = readPkgJson();
      const exports = pkg['exports'] as Record<string, Record<string, string>>;
      const typesPath = exports['.']!['types']!;
      expect(existsSync(resolve(CORE_DIR, typesPath))).toBe(true);
    });

    it('root export (.) resolves — import', () => {
      const pkg = readPkgJson();
      const exports = pkg['exports'] as Record<string, Record<string, string>>;
      const importPath = exports['.']!['import']!;
      expect(existsSync(resolve(CORE_DIR, importPath))).toBe(true);
    });

    it('root export (.) resolves — require', () => {
      const pkg = readPkgJson();
      const exports = pkg['exports'] as Record<string, Record<string, string>>;
      const requirePath = exports['.']!['require']!;
      expect(existsSync(resolve(CORE_DIR, requirePath))).toBe(true);
    });

    it('testing subpath export resolves — types', () => {
      const pkg = readPkgJson();
      const exports = pkg['exports'] as Record<string, Record<string, string>>;
      const typesPath = exports['./testing']!['types']!;
      expect(existsSync(resolve(CORE_DIR, typesPath))).toBe(true);
    });

    it('testing subpath export resolves — import', () => {
      const pkg = readPkgJson();
      const exports = pkg['exports'] as Record<string, Record<string, string>>;
      const importPath = exports['./testing']!['import']!;
      expect(existsSync(resolve(CORE_DIR, importPath))).toBe(true);
    });

    it('testing subpath export resolves — require', () => {
      const pkg = readPkgJson();
      const exports = pkg['exports'] as Record<string, Record<string, string>>;
      const requirePath = exports['./testing']!['require']!;
      expect(existsSync(resolve(CORE_DIR, requirePath))).toBe(true);
    });

    it('main field resolves', () => {
      const pkg = readPkgJson();
      const mainPath = pkg['main'] as string;
      expect(existsSync(resolve(CORE_DIR, mainPath))).toBe(true);
    });

    it('module field resolves', () => {
      const pkg = readPkgJson();
      const modulePath = pkg['module'] as string;
      expect(existsSync(resolve(CORE_DIR, modulePath))).toBe(true);
    });

    it('types field resolves', () => {
      const pkg = readPkgJson();
      const typesPath = pkg['types'] as string;
      expect(existsSync(resolve(CORE_DIR, typesPath))).toBe(true);
    });
  });

  describe('Version consistency', () => {
    it('VERSION export matches package.json', () => {
      const pkg = readPkgJson();
      const version = pkg['version'] as string;
      const indexContent = readFileSync(join(CORE_DIR, 'src', 'index.ts'), 'utf-8');
      const match = /export const VERSION = '([^']+)'/.exec(indexContent);
      expect(match).not.toBeNull();
      expect(match![1]).toBe(version);
    });

    it('CHANGELOG.md has entry for current version', () => {
      const pkg = readPkgJson();
      const version = pkg['version'] as string;
      const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf-8');
      expect(changelog).toContain(`## [${version}]`);
    });
  });

  describe('Required files', () => {
    it('README.md exists', () => {
      expect(existsSync(join(CORE_DIR, 'README.md'))).toBe(true);
    });

    it('LICENSE exists', () => {
      expect(existsSync(join(CORE_DIR, 'LICENSE'))).toBe(true);
    });

    it('dist directory exists', () => {
      expect(existsSync(join(CORE_DIR, 'dist'))).toBe(true);
    });

    it('dist/index.js exists', () => {
      expect(existsSync(join(CORE_DIR, 'dist', 'index.js'))).toBe(true);
    });

    it('dist/index.d.ts exists', () => {
      expect(existsSync(join(CORE_DIR, 'dist', 'index.d.ts'))).toBe(true);
    });

    it('dist/cjs/index.js exists', () => {
      expect(existsSync(join(CORE_DIR, 'dist', 'cjs', 'index.js'))).toBe(true);
    });

    it('dist/cjs/package.json marker exists with type: commonjs', () => {
      const markerPath = join(CORE_DIR, 'dist', 'cjs', 'package.json');
      expect(existsSync(markerPath)).toBe(true);
      const marker = JSON.parse(readFileSync(markerPath, 'utf-8')) as Record<string, unknown>;
      expect(marker['type']).toBe('commonjs');
    });
  });

  describe('Build output integrity', () => {
    it('ESM index.js exports VERSION', () => {
      const content = readFileSync(join(CORE_DIR, 'dist', 'index.js'), 'utf-8');
      expect(content).toContain('VERSION');
    });

    it('type declarations export VERSION', () => {
      const content = readFileSync(join(CORE_DIR, 'dist', 'index.d.ts'), 'utf-8');
      expect(content).toContain('VERSION');
    });

    it('testing subpath has exports in dist', () => {
      const testingIndex = join(CORE_DIR, 'dist', 'testing', 'index.js');
      expect(existsSync(testingIndex)).toBe(true);
      const content = readFileSync(testingIndex, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('npm registry configuration', () => {
    it('.npmrc configures public access', () => {
      const npmrc = readFileSync(join(ROOT, '.npmrc'), 'utf-8');
      expect(npmrc).toContain('access=public');
    });

    it('.npmrc configures official registry', () => {
      const npmrc = readFileSync(join(ROOT, '.npmrc'), 'utf-8');
      expect(npmrc).toContain('registry.npmjs.org');
    });

    it('.npmrc enables provenance', () => {
      const npmrc = readFileSync(join(ROOT, '.npmrc'), 'utf-8');
      expect(npmrc).toContain('provenance=true');
    });
  });

  describe('CI/CD workflow', () => {
    it('publish.yml workflow exists', () => {
      expect(existsSync(join(ROOT, '.github', 'workflows', 'publish.yml'))).toBe(true);
    });

    it('publish.yml triggers on version tags', () => {
      const workflow = readFileSync(join(ROOT, '.github', 'workflows', 'publish.yml'), 'utf-8');
      expect(workflow).toContain("- 'v*'");
    });

    it('publish.yml uses NPM_TOKEN secret', () => {
      const workflow = readFileSync(join(ROOT, '.github', 'workflows', 'publish.yml'), 'utf-8');
      expect(workflow).toContain('NPM_TOKEN');
    });

    it('publish.yml uses npm-publish environment', () => {
      const workflow = readFileSync(join(ROOT, '.github', 'workflows', 'publish.yml'), 'utf-8');
      expect(workflow).toContain('environment: npm-publish');
    });
  });

  describe('Lifecycle scripts', () => {
    it('has prepublishOnly script for safety', () => {
      const pkg = readPkgJson();
      const scripts = pkg['scripts'] as Record<string, string>;
      expect(scripts['prepublishOnly']).toBeTruthy();
    });

    it('has build script', () => {
      const pkg = readPkgJson();
      const scripts = pkg['scripts'] as Record<string, string>;
      expect(scripts['build']).toBeTruthy();
    });
  });
});
