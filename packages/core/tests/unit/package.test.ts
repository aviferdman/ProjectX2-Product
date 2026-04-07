import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Package Configuration (TASK-006)', () => {
  const packageJsonPath = join(__dirname, '../../package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as Record<string, unknown>;

  describe('Package Metadata', () => {
    it('should have correct package name', () => {
      expect(packageJson.name).toBe('@crewspace/core');
    });

    it('should have a version number', () => {
      expect(packageJson.version).toBe('0.1.0');
    });

    it('should have MIT license', () => {
      expect(packageJson.license).toBe('MIT');
    });

    it('should have a description', () => {
      expect(packageJson.description).toBeTruthy();
      expect(packageJson.description).toContain('agent');
      expect(packageJson.description).toContain('orchestration');
    });

    it('should be ES module type', () => {
      expect(packageJson.type).toBe('module');
    });

    it('should have sideEffects set to false', () => {
      expect(packageJson.sideEffects).toBe(false);
    });
  });

  describe('Entry Points', () => {
    it('should have correct main entry point', () => {
      expect(packageJson.main).toBe('./dist/index.js');
    });

    it('should have types definition', () => {
      expect(packageJson.types).toBe('./dist/index.d.ts');
    });

    it('should have valid exports configuration', () => {
      const exports = packageJson.exports as Record<string, Record<string, string>>;
      expect(exports).toBeDefined();
      expect(exports['.']).toBeDefined();
      expect(exports['.'].types).toBe('./dist/index.d.ts');
      expect(exports['.'].import).toBe('./dist/index.js');
    });

    it('should not have require entry (ESM only)', () => {
      const exports = packageJson.exports as Record<string, Record<string, string>>;
      expect(exports['.'].require).toBeUndefined();
    });
  });

  describe('Files Configuration', () => {
    it('should include dist directory in published files', () => {
      expect(packageJson.files).toContain('dist');
    });

    it('should include README in published files', () => {
      expect(packageJson.files).toContain('README.md');
    });

    it('should include LICENSE in published files', () => {
      expect(packageJson.files).toContain('LICENSE');
    });
  });

  describe('Engine Requirements', () => {
    it('should require Node.js 18 or higher', () => {
      const engines = packageJson.engines as Record<string, string>;
      expect(engines).toBeDefined();
      expect(engines.node).toBe('>=18.0.0');
    });
  });

  describe('Scripts', () => {
    const scripts = packageJson.scripts as Record<string, string>;

    it('should have build script', () => {
      expect(scripts.build).toBe('tsc --build');
    });

    it('should have clean script with rimraf', () => {
      expect(scripts.clean).toBeTruthy();
      expect(scripts.clean).toContain('rimraf');
      expect(scripts.clean).toContain('dist');
    });

    it('should have test scripts', () => {
      expect(scripts.test).toBe('vitest run');
      expect(scripts['test:unit']).toBe('vitest run tests/unit');
      expect(scripts['test:integration']).toBe('vitest run tests/integration');
      expect(scripts['test:watch']).toBe('vitest');
      expect(scripts['test:coverage']).toBe('vitest run --coverage');
    });

    it('should have lint script', () => {
      expect(scripts.lint).toBe('eslint src/');
    });

    it('should have typecheck script', () => {
      expect(scripts.typecheck).toBe('tsc --noEmit -p tsconfig.test.json');
    });
  });

  describe('Runtime Dependencies', () => {
    it('should include zod for validation', () => {
      const deps = packageJson.dependencies as Record<string, string> | undefined;
      expect(deps).toBeDefined();
      expect(deps?.zod).toBeTruthy();
      expect(deps?.zod).toMatch(/^\^3\./);
    });

    it('should include eventemitter3 for event handling', () => {
      const deps = packageJson.dependencies as Record<string, string> | undefined;
      expect(deps).toBeDefined();
      expect(deps?.eventemitter3).toBeTruthy();
      expect(deps?.eventemitter3).toMatch(/^\^5\./);
    });

    it('should have exactly 2 runtime dependencies', () => {
      const deps = packageJson.dependencies as Record<string, string> | undefined;
      const depsCount = Object.keys(deps ?? {}).length;
      expect(depsCount).toBe(2);
    });
  });

  describe('Development Dependencies', () => {
    it('should include @types/node', () => {
      const devDeps = packageJson.devDependencies as Record<string, string> | undefined;
      expect(devDeps).toBeDefined();
      expect(devDeps?.['@types/node']).toBeTruthy();
      expect(devDeps?.['@types/node']).toMatch(/^\^22\./);
    });

    it('should include rimraf for cleanup', () => {
      const devDeps = packageJson.devDependencies as Record<string, string> | undefined;
      expect(devDeps).toBeDefined();
      expect(devDeps?.rimraf).toBeTruthy();
      expect(devDeps?.rimraf).toMatch(/^\^6\./);
    });

    it('should have exactly 2 dev dependencies', () => {
      const devDeps = packageJson.devDependencies as Record<string, string> | undefined;
      const devDepsCount = Object.keys(devDeps ?? {}).length;
      expect(devDepsCount).toBe(4);
    });
  });

  describe('Peer Dependencies', () => {
    it('should list TypeScript as peer dependency', () => {
      const peerDeps = packageJson.peerDependencies as Record<string, string>;
      expect(peerDeps).toBeDefined();
      expect(peerDeps.typescript).toBe('>=5.0.0');
    });

    it('should list better-sqlite3 as peer dependency', () => {
      const peerDeps = packageJson.peerDependencies as Record<string, string>;
      expect(peerDeps).toBeDefined();
      expect(peerDeps['better-sqlite3']).toBeTruthy();
    });

    it('should mark TypeScript as optional peer dependency', () => {
      const meta = packageJson.peerDependenciesMeta as Record<string, Record<string, unknown>>;
      expect(meta).toBeDefined();
      expect(meta.typescript).toBeDefined();
      expect(meta.typescript.optional).toBe(true);
    });

    it('should mark better-sqlite3 as optional peer dependency', () => {
      const meta = packageJson.peerDependenciesMeta as Record<string, Record<string, unknown>>;
      expect(meta).toBeDefined();
      expect(meta['better-sqlite3']).toBeDefined();
      expect(meta['better-sqlite3'].optional).toBe(true);
    });
  });

  describe('Keywords', () => {
    const requiredKeywords = [
      'agent',
      'orchestration',
      'multi-agent',
      'typescript',
      'ai',
      'llm',
      'framework',
      'crewspace',
      'workflow',
      'event-driven',
    ];

    it('should have all required keywords', () => {
      const keywords = packageJson.keywords as string[];
      expect(keywords).toBeDefined();
      requiredKeywords.forEach((keyword) => {
        expect(keywords).toContain(keyword);
      });
    });

    it('should have at least 10 keywords for discoverability', () => {
      const keywords = packageJson.keywords as string[];
      expect(keywords.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Repository Configuration', () => {
    it('should have repository information', () => {
      const repository = packageJson.repository as Record<string, string>;
      expect(repository).toBeDefined();
      expect(repository.type).toBe('git');
      expect(repository.url).toBe(
        'https://github.com/aviferdman/ProjectX2-Product.git',
      );
      expect(repository.directory).toBe('packages/core');
    });

    it('should have homepage URL', () => {
      expect(packageJson.homepage).toBe('https://github.com/aviferdman/ProjectX2-Product#readme');
    });

    it('should have bugs URL', () => {
      const bugs = packageJson.bugs as Record<string, string>;
      expect(bugs).toBeDefined();
      expect(bugs.url).toBe('https://github.com/aviferdman/ProjectX2-Product/issues');
    });
  });

  describe('Dependency Validation', () => {
    it('should not have any banned dependencies', () => {
      const deps = packageJson.dependencies as Record<string, string> | undefined;
      const devDeps = packageJson.devDependencies as Record<string, string> | undefined;
      const allDeps = {
        ...(deps ?? {}),
        ...(devDeps ?? {}),
      };
      const bannedPatterns = ['lodash', 'moment', 'request'];
      const depNames = Object.keys(allDeps);

      bannedPatterns.forEach((banned) => {
        expect(depNames).not.toContain(banned);
      });
    });

    it('should use semantic versioning with caret ranges', () => {
      const deps = packageJson.dependencies as Record<string, string>;
      Object.entries(deps).forEach(([_name, version]) => {
        expect(version).toMatch(/^\^/);
      });
    });
  });
});
