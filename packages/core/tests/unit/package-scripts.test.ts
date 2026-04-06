import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the package root directory (2 levels up from tests/unit)
// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, '..', '..');

describe('Package.json Scripts', () => {
  const packageJsonPath = join(packageRoot, 'package.json');
  const packageJsonStr: string = readFileSync(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(packageJsonStr) as {
    scripts: Record<string, string>;
  };

  it('should have test script', () => {
    expect(packageJson.scripts).toHaveProperty('test');
    expect(packageJson.scripts.test).toBe('vitest run');
  });

  it('should have test:unit script', () => {
    expect(packageJson.scripts).toHaveProperty('test:unit');
    expect(packageJson.scripts['test:unit']).toBe('vitest run tests/unit');
  });

  it('should have test:integration script', () => {
    expect(packageJson.scripts).toHaveProperty('test:integration');
    expect(packageJson.scripts['test:integration']).toBe('vitest run tests/integration');
  });

  it('should have test:watch script', () => {
    expect(packageJson.scripts).toHaveProperty('test:watch');
    expect(packageJson.scripts['test:watch']).toBe('vitest');
  });

  it('should have test:coverage script', () => {
    expect(packageJson.scripts).toHaveProperty('test:coverage');
    expect(packageJson.scripts['test:coverage']).toBe('vitest run --coverage');
  });

  it('should have typecheck script', () => {
    expect(packageJson.scripts).toHaveProperty('typecheck');
    expect(packageJson.scripts.typecheck).toContain('tsc --noEmit');
  });
});

describe('Package.json Dependencies', () => {
  const rootPackageJsonPath = join(packageRoot, '..', '..', 'package.json');
  const rootPackageJsonStr: string = readFileSync(rootPackageJsonPath, 'utf-8');
  const rootPackageJson = JSON.parse(rootPackageJsonStr) as {
    devDependencies: Record<string, string>;
  };

  it('should have vitest in devDependencies', () => {
    expect(rootPackageJson.devDependencies).toHaveProperty('vitest');
  });

  it('should have @vitest/coverage-v8 in devDependencies', () => {
    expect(rootPackageJson.devDependencies).toHaveProperty('@vitest/coverage-v8');
  });
});

describe('Test File Organization', () => {
  it('should have tests/unit directory', () => {
    const unitPath = join(packageRoot, 'tests', 'unit');
    const testFilePath = join(unitPath, 'core.test.ts');
    expect(() => readFileSync(testFilePath, 'utf-8') as string).not.toThrow();
  });

  it('should have tests/integration directory', () => {
    const integrationPath = join(packageRoot, 'tests', 'integration');
    const testFilePath = join(integrationPath, 'module-import.test.ts');
    expect(() => readFileSync(testFilePath, 'utf-8') as string).not.toThrow();
  });

  it('should have tsconfig.test.json', () => {
    const tsconfigTestPath = join(packageRoot, 'tsconfig.test.json');
    expect(() => readFileSync(tsconfigTestPath, 'utf-8') as string).not.toThrow();
  });
});
