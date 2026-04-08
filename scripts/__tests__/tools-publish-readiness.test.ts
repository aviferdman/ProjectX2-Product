/**
 * Publish readiness tests for @crewspace/tools-* packages.
 *
 * Validates that tools-file, tools-web, and tools-shell are correctly
 * configured for npm publishing alongside @crewspace/core and @crewspace/cli.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { checkPackageMetadata, checkDistOutput } from '../publish-check.js';
import { validatePackage } from '../prepare-publish.js';
import { verifyExports } from '../verify-package-exports.js';
import type { PackageInfo } from '../prepare-publish.js';

const ROOT = resolve(__dirname, '..', '..');

const TOOLS_PACKAGES = [
  {
    dir: 'packages/tools-file',
    name: '@crewspace/tools-file',
    description: 'File tools',
    expectedExports: ['createFileTools', 'createReadFileTool', 'createWriteFileTool', 'createListFilesTool'],
  },
  {
    dir: 'packages/tools-web',
    name: '@crewspace/tools-web',
    description: 'Web tools',
    expectedExports: ['createWebTools', 'createFetchUrlTool', 'createParseHtmlTool', 'createWebSearchTool'],
  },
  {
    dir: 'packages/tools-shell',
    name: '@crewspace/tools-shell',
    description: 'Shell tools',
    expectedExports: ['createShellTools', 'createShellExecTool'],
  },
] as const;

describe('tools-* publish readiness', () => {
  for (const pkg of TOOLS_PACKAGES) {
    describe(pkg.name, () => {
      const pkgDir = resolve(ROOT, pkg.dir);

      it('has a valid package.json with all required fields', () => {
        const checks = checkPackageMetadata(pkgDir);
        const failures = checks.filter((c) => c.status === 'fail');
        expect(failures, `Failed checks: ${failures.map((f) => f.message).join(', ')}`).toHaveLength(0);
      });

      it('is not marked as private', () => {
        const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')) as Record<string, unknown>;
        expect(pkgJson['private']).not.toBe(true);
      });

      it('has correct package name', () => {
        const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')) as Record<string, unknown>;
        expect(pkgJson['name']).toBe(pkg.name);
      });

      it('has version 0.1.0', () => {
        const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')) as Record<string, unknown>;
        expect(pkgJson['version']).toBe('0.1.0');
      });

      it('has MIT license', () => {
        const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')) as Record<string, unknown>;
        expect(pkgJson['license']).toBe('MIT');
      });

      it('has "type": "module"', () => {
        const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')) as Record<string, unknown>;
        expect(pkgJson['type']).toBe('module');
      });

      it('has proper exports configuration', () => {
        const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')) as Record<string, unknown>;
        const exports = pkgJson['exports'] as Record<string, Record<string, string>>;
        expect(exports).toBeDefined();
        expect(exports['.']).toBeDefined();
        expect(exports['.']!['types']).toBe('./dist/index.d.ts');
        expect(exports['.']!['import']).toBe('./dist/index.js');
        expect(exports['.']!['require']).toBe('./dist/cjs/index.js');
      });

      it('has dual ESM/CJS entry points', () => {
        const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')) as Record<string, unknown>;
        expect(pkgJson['main']).toBe('./dist/cjs/index.js');
        expect(pkgJson['module']).toBe('./dist/index.js');
        expect(pkgJson['types']).toBe('./dist/index.d.ts');
      });

      it('has "files" field including dist, README.md, and LICENSE', () => {
        const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')) as Record<string, unknown>;
        const files = pkgJson['files'] as string[];
        expect(files).toContain('dist');
        expect(files).toContain('README.md');
        expect(files).toContain('LICENSE');
      });

      it('has sideEffects set to false', () => {
        const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')) as Record<string, unknown>;
        expect(pkgJson['sideEffects']).toBe(false);
      });

      it('has engines field requiring Node >= 18', () => {
        const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')) as Record<string, unknown>;
        const engines = pkgJson['engines'] as Record<string, string>;
        expect(engines).toBeDefined();
        expect(engines['node']).toBe('>=18.0.0');
      });

      it('has repository field pointing to correct directory', () => {
        const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')) as Record<string, unknown>;
        const repo = pkgJson['repository'] as Record<string, string>;
        expect(repo).toBeDefined();
        expect(repo['directory']).toBe(pkg.dir);
      });

      it('has @crewspace/core as a dependency', () => {
        const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')) as Record<string, unknown>;
        const deps = pkgJson['dependencies'] as Record<string, string>;
        expect(deps).toBeDefined();
        expect(deps['@crewspace/core']).toBeDefined();
      });

      it('has keywords including "crewspace" and "tools"', () => {
        const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')) as Record<string, unknown>;
        const keywords = pkgJson['keywords'] as string[];
        expect(keywords).toContain('crewspace');
        expect(keywords).toContain('tools');
      });

      it('has prepublishOnly script', () => {
        const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')) as Record<string, unknown>;
        const scripts = pkgJson['scripts'] as Record<string, string>;
        expect(scripts['prepublishOnly']).toBeDefined();
        expect(scripts['prepublishOnly']).toContain('build');
        expect(scripts['prepublishOnly']).toContain('typecheck');
      });

      it('has README.md', () => {
        expect(existsSync(join(pkgDir, 'README.md'))).toBe(true);
        const readme = readFileSync(join(pkgDir, 'README.md'), 'utf-8');
        expect(readme).toContain(pkg.name);
        expect(readme).toContain('## Installation');
        expect(readme).toContain('npm install');
        expect(readme).toContain('## License');
      });

      it('has LICENSE file', () => {
        expect(existsSync(join(pkgDir, 'LICENSE'))).toBe(true);
        const license = readFileSync(join(pkgDir, 'LICENSE'), 'utf-8');
        expect(license).toContain('MIT License');
      });

      it('has source index.ts that re-exports from @crewspace/core', () => {
        const indexPath = join(pkgDir, 'src', 'index.ts');
        expect(existsSync(indexPath)).toBe(true);
        const content = readFileSync(indexPath, 'utf-8');
        expect(content).toContain('@crewspace/core');
        for (const exp of pkg.expectedExports) {
          expect(content).toContain(exp);
        }
      });

      it('has tsconfig.json for ESM build', () => {
        expect(existsSync(join(pkgDir, 'tsconfig.json'))).toBe(true);
      });

      it('has tsconfig.cjs.json for CJS build', () => {
        expect(existsSync(join(pkgDir, 'tsconfig.cjs.json'))).toBe(true);
      });

      it('has tsconfig.test.json', () => {
        expect(existsSync(join(pkgDir, 'tsconfig.test.json'))).toBe(true);
      });

      it('has vitest.config.ts', () => {
        expect(existsSync(join(pkgDir, 'vitest.config.ts'))).toBe(true);
      });

      it('has unit tests', () => {
        const testsDir = join(pkgDir, 'tests', 'unit');
        expect(existsSync(testsDir)).toBe(true);
      });
    });
  }

  describe('publish pipeline integration', () => {
    it('prepare-publish.ts includes all tools packages', () => {
      const content = readFileSync(resolve(ROOT, 'scripts', 'prepare-publish.ts'), 'utf-8');
      expect(content).toContain('tools-file');
      expect(content).toContain('tools-web');
      expect(content).toContain('tools-shell');
    });

    it('release.ts includes all tools packages', () => {
      const content = readFileSync(resolve(ROOT, 'scripts', 'release.ts'), 'utf-8');
      expect(content).toContain('tools-file');
      expect(content).toContain('tools-web');
      expect(content).toContain('tools-shell');
    });

    it('check-versions.ts includes all tools packages', () => {
      const content = readFileSync(resolve(ROOT, 'scripts', 'check-versions.ts'), 'utf-8');
      expect(content).toContain('tools-file');
      expect(content).toContain('tools-web');
      expect(content).toContain('tools-shell');
    });

    it('publish.yml workflow publishes all tools packages', () => {
      const content = readFileSync(resolve(ROOT, '.github', 'workflows', 'publish.yml'), 'utf-8');
      expect(content).toContain('workspace=packages/tools-file');
      expect(content).toContain('workspace=packages/tools-web');
      expect(content).toContain('workspace=packages/tools-shell');
    });

    it('publish.yml workflow verifies dist output for tools packages', () => {
      const content = readFileSync(resolve(ROOT, '.github', 'workflows', 'publish.yml'), 'utf-8');
      expect(content).toContain('packages/tools-file/dist');
      expect(content).toContain('packages/tools-web/dist');
      expect(content).toContain('packages/tools-shell/dist');
    });

    it('publish.yml workflow uploads tools dist artifacts', () => {
      const content = readFileSync(resolve(ROOT, '.github', 'workflows', 'publish.yml'), 'utf-8');
      expect(content).toContain('packages/tools-file/dist/');
      expect(content).toContain('packages/tools-web/dist/');
      expect(content).toContain('packages/tools-shell/dist/');
    });

    it('publish.yml workflow verifies tools packages after publish', () => {
      const content = readFileSync(resolve(ROOT, '.github', 'workflows', 'publish.yml'), 'utf-8');
      expect(content).toContain('@crewspace/tools-file');
      expect(content).toContain('@crewspace/tools-web');
      expect(content).toContain('@crewspace/tools-shell');
    });

    it('ci.yml workflow verifies dist output for tools packages', () => {
      const content = readFileSync(resolve(ROOT, '.github', 'workflows', 'ci.yml'), 'utf-8');
      expect(content).toContain('packages/tools-file/dist');
      expect(content).toContain('packages/tools-web/dist');
      expect(content).toContain('packages/tools-shell/dist');
    });

    it('CHANGELOG.md mentions tools packages', () => {
      const content = readFileSync(resolve(ROOT, 'CHANGELOG.md'), 'utf-8');
      expect(content).toContain('@crewspace/tools-file');
      expect(content).toContain('@crewspace/tools-web');
      expect(content).toContain('@crewspace/tools-shell');
    });

    it('all tools packages have the same version as core', () => {
      const coreVersion = (JSON.parse(
        readFileSync(resolve(ROOT, 'packages', 'core', 'package.json'), 'utf-8'),
      ) as Record<string, unknown>)['version'];

      for (const pkg of TOOLS_PACKAGES) {
        const pkgJson = JSON.parse(
          readFileSync(resolve(ROOT, pkg.dir, 'package.json'), 'utf-8'),
        ) as Record<string, unknown>;
        expect(pkgJson['version']).toBe(coreVersion);
      }
    });
  });
});
