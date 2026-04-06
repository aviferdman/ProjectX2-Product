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

describe('Vitest Configuration', () => {
  it('should have vitest.config.ts file', () => {
    const configPath = join(packageRoot, 'vitest.config.ts');
    expect(() => readFileSync(configPath, 'utf-8') as string).not.toThrow();
  });

  it('should have coverage thresholds set to 80%', () => {
    const configPath = join(packageRoot, 'vitest.config.ts');
    const configContent = readFileSync(configPath, 'utf-8');
    expect(configContent).toContain('lines: 80');
    expect(configContent).toContain('functions: 80');
    expect(configContent).toContain('branches: 80');
    expect(configContent).toContain('statements: 80');
  });

  it('should use v8 coverage provider', () => {
    const configPath = join(packageRoot, 'vitest.config.ts');
    const configContent = readFileSync(configPath, 'utf-8');
    expect(configContent).toContain("provider: 'v8'");
  });

  it('should have node test environment', () => {
    const configPath = join(packageRoot, 'vitest.config.ts');
    const configContent = readFileSync(configPath, 'utf-8');
    expect(configContent).toContain("environment: 'node'");
  });

  it('should include unit and integration test paths', () => {
    const configPath = join(packageRoot, 'vitest.config.ts');
    const configContent = readFileSync(configPath, 'utf-8');
    expect(configContent).toContain('tests/unit/**/*.test.ts');
    expect(configContent).toContain('tests/integration/**/*.test.ts');
  });

  it('should exclude test files and index files from coverage', () => {
    const configPath = join(packageRoot, 'vitest.config.ts');
    const configContent = readFileSync(configPath, 'utf-8');
    expect(configContent).toContain('src/**/*.test.ts');
    expect(configContent).toContain('src/**/index.ts');
  });

  it('should have typecheck configuration', () => {
    const configPath = join(packageRoot, 'vitest.config.ts');
    const configContent = readFileSync(configPath, 'utf-8');
    expect(configContent).toContain('typecheck');
    expect(configContent).toContain('tsconfig.test.json');
  });

  it('should have multiple coverage reporters', () => {
    const configPath = join(packageRoot, 'vitest.config.ts');
    const configContent = readFileSync(configPath, 'utf-8');
    expect(configContent).toContain("'text'");
    expect(configContent).toContain("'text-summary'");
    expect(configContent).toContain("'lcov'");
    expect(configContent).toContain("'html'");
  });
});
