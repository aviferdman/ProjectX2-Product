/**
 * Publish readiness tests for @crewspace/cli.
 *
 * Validates that the CLI package is correctly configured for npm publishing:
 * - package.json has all required fields
 * - bin entry is configured
 * - exports and dual ESM/CJS are correct
 * - prepublishOnly script exists
 * - README and LICENSE are present with required content
 * - Publish pipeline scripts and CI workflows include the CLI package
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { checkPackageMetadata } from '../publish-check.js';

const ROOT = resolve(__dirname, '..', '..');
const CLI_DIR = resolve(ROOT, 'packages', 'cli');

describe('@crewspace/cli publish readiness', () => {
  describe('package.json configuration', () => {
    it('has all required metadata fields', () => {
      const checks = checkPackageMetadata(CLI_DIR);
      const failures = checks.filter((c) => c.status === 'fail');
      expect(failures, `Failed checks: ${failures.map((f) => f.message).join(', ')}`).toHaveLength(
        0,
      );
    });

    it('is not marked as private', () => {
      const pkgJson = JSON.parse(
        readFileSync(join(CLI_DIR, 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(pkgJson['private']).not.toBe(true);
    });

    it('has correct package name', () => {
      const pkgJson = JSON.parse(
        readFileSync(join(CLI_DIR, 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(pkgJson['name']).toBe('@crewspace/cli');
    });

    it('has version 0.1.0', () => {
      const pkgJson = JSON.parse(
        readFileSync(join(CLI_DIR, 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(pkgJson['version']).toBe('0.1.0');
    });

    it('has the same version as @crewspace/core', () => {
      const cliPkg = JSON.parse(
        readFileSync(join(CLI_DIR, 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      const corePkg = JSON.parse(
        readFileSync(resolve(ROOT, 'packages', 'core', 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(cliPkg['version']).toBe(corePkg['version']);
    });

    it('has MIT license', () => {
      const pkgJson = JSON.parse(
        readFileSync(join(CLI_DIR, 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(pkgJson['license']).toBe('MIT');
    });

    it('has "type": "module"', () => {
      const pkgJson = JSON.parse(
        readFileSync(join(CLI_DIR, 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(pkgJson['type']).toBe('module');
    });

    it('has proper exports configuration', () => {
      const pkgJson = JSON.parse(
        readFileSync(join(CLI_DIR, 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      const exports = pkgJson['exports'] as Record<string, Record<string, string>>;
      expect(exports).toBeDefined();
      expect(exports['.']).toBeDefined();
      expect(exports['.']!['types']).toBe('./dist/index.d.ts');
      expect(exports['.']!['import']).toBe('./dist/index.js');
      expect(exports['.']!['require']).toBe('./dist/cjs/index.js');
    });

    it('has dual ESM/CJS entry points', () => {
      const pkgJson = JSON.parse(
        readFileSync(join(CLI_DIR, 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(pkgJson['main']).toBe('./dist/cjs/index.js');
      expect(pkgJson['module']).toBe('./dist/index.js');
      expect(pkgJson['types']).toBe('./dist/index.d.ts');
    });

    it('has bin entry for "crewspace" command', () => {
      const pkgJson = JSON.parse(
        readFileSync(join(CLI_DIR, 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      const bin = pkgJson['bin'] as Record<string, string>;
      expect(bin).toBeDefined();
      expect(bin['crewspace']).toBe('./dist/bin.js');
    });

    it('has "files" field including dist, README.md, and LICENSE', () => {
      const pkgJson = JSON.parse(
        readFileSync(join(CLI_DIR, 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      const files = pkgJson['files'] as string[];
      expect(files).toContain('dist');
      expect(files).toContain('README.md');
      expect(files).toContain('LICENSE');
    });

    it('has sideEffects set to false', () => {
      const pkgJson = JSON.parse(
        readFileSync(join(CLI_DIR, 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(pkgJson['sideEffects']).toBe(false);
    });

    it('has engines field requiring Node >= 18', () => {
      const pkgJson = JSON.parse(
        readFileSync(join(CLI_DIR, 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      const engines = pkgJson['engines'] as Record<string, string>;
      expect(engines).toBeDefined();
      expect(engines['node']).toBe('>=18.0.0');
    });

    it('has repository field pointing to packages/cli', () => {
      const pkgJson = JSON.parse(
        readFileSync(join(CLI_DIR, 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      const repo = pkgJson['repository'] as Record<string, string>;
      expect(repo).toBeDefined();
      expect(repo['directory']).toBe('packages/cli');
    });

    it('has keywords including "crewspace" and "cli"', () => {
      const pkgJson = JSON.parse(
        readFileSync(join(CLI_DIR, 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      const keywords = pkgJson['keywords'] as string[];
      expect(keywords).toContain('crewspace');
      expect(keywords).toContain('cli');
    });

    it('has @crewspace/core as optional peer dependency', () => {
      const pkgJson = JSON.parse(
        readFileSync(join(CLI_DIR, 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      const peerDeps = pkgJson['peerDependencies'] as Record<string, string>;
      expect(peerDeps).toBeDefined();
      expect(peerDeps['@crewspace/core']).toBeDefined();

      const peerMeta = pkgJson['peerDependenciesMeta'] as Record<
        string,
        Record<string, boolean>
      >;
      expect(peerMeta).toBeDefined();
      expect(peerMeta['@crewspace/core']!['optional']).toBe(true);
    });

    it('has prepublishOnly script that builds and typechecks', () => {
      const pkgJson = JSON.parse(
        readFileSync(join(CLI_DIR, 'package.json'), 'utf-8'),
      ) as Record<string, unknown>;
      const scripts = pkgJson['scripts'] as Record<string, string>;
      expect(scripts['prepublishOnly']).toBeDefined();
      expect(scripts['prepublishOnly']).toContain('build');
      expect(scripts['prepublishOnly']).toContain('typecheck');
    });
  });

  describe('required files', () => {
    it('has README.md with package name and install instructions', () => {
      expect(existsSync(join(CLI_DIR, 'README.md'))).toBe(true);
      const readme = readFileSync(join(CLI_DIR, 'README.md'), 'utf-8');
      expect(readme).toContain('@crewspace/cli');
      expect(readme).toContain('## Installation');
      expect(readme).toContain('npm install');
      expect(readme).toContain('## License');
    });

    it('has README.md with npm badges', () => {
      const readme = readFileSync(join(CLI_DIR, 'README.md'), 'utf-8');
      expect(readme).toContain('[![npm version]');
      expect(readme).toContain('npmjs.com/package/@crewspace/cli');
    });

    it('has LICENSE file', () => {
      expect(existsSync(join(CLI_DIR, 'LICENSE'))).toBe(true);
      const license = readFileSync(join(CLI_DIR, 'LICENSE'), 'utf-8');
      expect(license).toContain('MIT License');
    });

    it('has source index.ts with CLI_VERSION export', () => {
      const indexPath = join(CLI_DIR, 'src', 'index.ts');
      expect(existsSync(indexPath)).toBe(true);
      const content = readFileSync(indexPath, 'utf-8');
      expect(content).toContain("export const CLI_VERSION = '0.1.0'");
    });

    it('has bin.ts entry point with shebang-ready content', () => {
      const binPath = join(CLI_DIR, 'src', 'bin.ts');
      expect(existsSync(binPath)).toBe(true);
      const content = readFileSync(binPath, 'utf-8');
      expect(content).toContain('#!/usr/bin/env node');
      expect(content).toContain('createProgram');
    });

    it('has tsconfig.json for ESM build', () => {
      expect(existsSync(join(CLI_DIR, 'tsconfig.json'))).toBe(true);
    });

    it('has tsconfig.cjs.json for CJS build', () => {
      expect(existsSync(join(CLI_DIR, 'tsconfig.cjs.json'))).toBe(true);
    });

    it('has tsconfig.test.json', () => {
      expect(existsSync(join(CLI_DIR, 'tsconfig.test.json'))).toBe(true);
    });

    it('has vitest.config.ts', () => {
      expect(existsSync(join(CLI_DIR, 'vitest.config.ts'))).toBe(true);
    });

    it('has unit tests', () => {
      const testsDir = join(CLI_DIR, 'tests', 'unit');
      expect(existsSync(testsDir)).toBe(true);
    });
  });

  describe('publish pipeline integration', () => {
    it('prepare-publish.ts includes cli package', () => {
      const content = readFileSync(resolve(ROOT, 'scripts', 'prepare-publish.ts'), 'utf-8');
      expect(content).toContain("path: 'packages/cli'");
      expect(content).toContain("name: '@crewspace/cli'");
    });

    it('release.ts includes cli package', () => {
      const content = readFileSync(resolve(ROOT, 'scripts', 'release.ts'), 'utf-8');
      expect(content).toContain("path: 'packages/cli'");
      expect(content).toContain("name: '@crewspace/cli'");
    });

    it('publish.yml workflow publishes cli package', () => {
      const content = readFileSync(
        resolve(ROOT, '.github', 'workflows', 'publish.yml'),
        'utf-8',
      );
      expect(content).toContain('workspace=packages/cli');
      expect(content).toContain('Publish @crewspace/cli');
    });

    it('publish.yml workflow verifies cli dist output', () => {
      const content = readFileSync(
        resolve(ROOT, '.github', 'workflows', 'publish.yml'),
        'utf-8',
      );
      expect(content).toContain('packages/cli/dist');
    });

    it('publish.yml workflow uploads cli dist artifacts', () => {
      const content = readFileSync(
        resolve(ROOT, '.github', 'workflows', 'publish.yml'),
        'utf-8',
      );
      expect(content).toContain('packages/cli/dist/');
    });

    it('publish.yml workflow verifies cli after publish', () => {
      const content = readFileSync(
        resolve(ROOT, '.github', 'workflows', 'publish.yml'),
        'utf-8',
      );
      expect(content).toContain('@crewspace/cli');
    });

    it('publish-check.ts includes cli in default packages', () => {
      const content = readFileSync(resolve(ROOT, 'scripts', 'publish-check.ts'), 'utf-8');
      expect(content).toContain("'packages/cli'");
    });
  });
});
