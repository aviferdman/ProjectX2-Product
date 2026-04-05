import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Monorepo Structure Validation', () => {
  const rootPath = join(__dirname, '..', '..', '..', '..');
  const corePath = join(__dirname, '..', '..');

  describe('Root Configuration', () => {
    it('should have valid root package.json', () => {
      const pkgPath = join(rootPath, 'package.json');
      expect(existsSync(pkgPath)).toBe(true);

      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      expect(pkg.name).toBe('crewspace');
      expect(pkg.private).toBe(true);
      expect(pkg.workspaces).toEqual(['packages/*']);
      expect(pkg.engines.node).toBe('>=18.0.0');
    });

    it('should have MIT license file', () => {
      const licensePath = join(rootPath, 'LICENSE');
      expect(existsSync(licensePath)).toBe(true);

      const license = readFileSync(licensePath, 'utf-8');
      expect(license).toContain('MIT License');
      expect(license).toContain('Copyright (c) 2026 Crewspace Contributors');
    });

    it('should have README.md with project description', () => {
      const readmePath = join(rootPath, 'README.md');
      expect(existsSync(readmePath)).toBe(true);

      const readme = readFileSync(readmePath, 'utf-8');
      expect(readme).toContain('Crewspace');
      expect(readme).toContain('TypeScript-native agent orchestration');
      expect(readme).toContain('MIT');
    });

    it('should have TypeScript configuration files', () => {
      expect(existsSync(join(rootPath, 'tsconfig.json'))).toBe(true);
      expect(existsSync(join(rootPath, 'tsconfig.base.json'))).toBe(true);
    });

    it('should have strict TypeScript configuration', () => {
      const tsconfigBase = JSON.parse(
        readFileSync(join(rootPath, 'tsconfig.base.json'), 'utf-8')
      );
      expect(tsconfigBase.compilerOptions.strict).toBe(true);
      expect(tsconfigBase.compilerOptions.target).toBe('ES2022');
      expect(tsconfigBase.compilerOptions.noUnusedLocals).toBe(true);
      expect(tsconfigBase.compilerOptions.noUnusedParameters).toBe(true);
    });

    it('should have project references to core package', () => {
      const tsconfig = JSON.parse(
        readFileSync(join(rootPath, 'tsconfig.json'), 'utf-8')
      );
      expect(tsconfig.references).toBeDefined();
      expect(tsconfig.references).toContainEqual({ path: 'packages/core' });
    });

    it('should have .gitignore', () => {
      const gitignorePath = join(rootPath, '.gitignore');
      expect(existsSync(gitignorePath)).toBe(true);

      const gitignore = readFileSync(gitignorePath, 'utf-8');
      expect(gitignore).toContain('node_modules');
      expect(gitignore).toContain('dist');
    });
  });

  describe('@crewspace/core Package', () => {
    it('should have valid package.json', () => {
      const pkgPath = join(corePath, 'package.json');
      expect(existsSync(pkgPath)).toBe(true);

      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      expect(pkg.name).toBe('@crewspace/core');
      expect(pkg.version).toBe('0.1.0');
      expect(pkg.license).toBe('MIT');
      expect(pkg.engines.node).toBe('>=18.0.0');
    });

    it('should have required npm scripts', () => {
      const pkg = JSON.parse(
        readFileSync(join(corePath, 'package.json'), 'utf-8')
      );
      const scripts = pkg.scripts;

      expect(scripts.build).toBeDefined();
      expect(scripts.test).toBeDefined();
      expect(scripts.lint).toBeDefined();
      expect(scripts.clean).toBeDefined();
      expect(scripts.typecheck).toBeDefined();
    });

    it('should export correct entry points', () => {
      const pkg = JSON.parse(
        readFileSync(join(corePath, 'package.json'), 'utf-8')
      );

      expect(pkg.main).toBe('./dist/index.js');
      expect(pkg.types).toBe('./dist/index.d.ts');
      expect(pkg.exports['.']).toBeDefined();
      expect(pkg.exports['.'].types).toBe('./dist/index.d.ts');
    });

    it('should have src/index.ts entry file', () => {
      const indexPath = join(corePath, 'src', 'index.ts');
      expect(existsSync(indexPath)).toBe(true);

      const index = readFileSync(indexPath, 'utf-8');
      expect(index).toContain('VERSION');
      expect(index).toContain('@crewspace/core');
      expect(index).toContain('@packageDocumentation');
    });

    it('should have TypeScript configuration', () => {
      const tsconfigPath = join(corePath, 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);
    });

    it('should have README.md', () => {
      const readmePath = join(corePath, 'README.md');
      expect(existsSync(readmePath)).toBe(true);
    });

    it('should have appropriate package keywords', () => {
      const pkg = JSON.parse(
        readFileSync(join(corePath, 'package.json'), 'utf-8')
      );

      expect(pkg.keywords).toContain('agent');
      expect(pkg.keywords).toContain('orchestration');
      expect(pkg.keywords).toContain('typescript');
    });

    it('should include dist and README.md in files array', () => {
      const pkg = JSON.parse(
        readFileSync(join(corePath, 'package.json'), 'utf-8')
      );

      expect(pkg.files).toContain('dist');
      expect(pkg.files).toContain('README.md');
    });
  });

  describe('Build System', () => {
    it('should have workspace scripts defined at root', () => {
      const pkg = JSON.parse(
        readFileSync(join(rootPath, 'package.json'), 'utf-8')
      );

      expect(pkg.scripts.build).toBe('npm run build --workspaces');
      expect(pkg.scripts.test).toBe('npm run test --workspaces');
      expect(pkg.scripts.lint).toBe('npm run lint --workspaces');
    });

    it('should have TypeScript as dev dependency at root', () => {
      const pkg = JSON.parse(
        readFileSync(join(rootPath, 'package.json'), 'utf-8')
      );

      expect(pkg.devDependencies.typescript).toBeDefined();
      expect(pkg.devDependencies.typescript).toMatch(/^\^5\./);
    });
  });

  describe('Node.js Version Requirements', () => {
    it('should require Node.js 18+ in root package', () => {
      const pkg = JSON.parse(
        readFileSync(join(rootPath, 'package.json'), 'utf-8')
      );

      expect(pkg.engines.node).toBe('>=18.0.0');
    });

    it('should require Node.js 18+ in core package', () => {
      const pkg = JSON.parse(
        readFileSync(join(corePath, 'package.json'), 'utf-8')
      );

      expect(pkg.engines.node).toBe('>=18.0.0');
    });

    it('should be compatible with current Node.js version', () => {
      const currentVersion = process.version;
      const majorVersion = parseInt(currentVersion.slice(1).split('.')[0]);

      expect(majorVersion).toBeGreaterThanOrEqual(18);
    });
  });
});
