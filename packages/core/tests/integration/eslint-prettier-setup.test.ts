import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const rootDir = join(__dirname, '../../../..');

describe('ESLint + Prettier Setup (TASK-003)', () => {
  describe('Configuration Files', () => {
    it('should have eslint.config.mjs in root', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      expect(existsSync(eslintConfigPath)).toBe(true);
    });

    it('should have .prettierrc in root', () => {
      const prettierrcPath = join(rootDir, '.prettierrc');
      expect(existsSync(prettierrcPath)).toBe(true);
    });

    it('should have .prettierignore in root', () => {
      const prettierIgnorePath = join(rootDir, '.prettierignore');
      expect(existsSync(prettierIgnorePath)).toBe(true);
    });

    it('should use ESLint 9 flat config format', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('export default');
      expect(content).toContain('tseslint.config');
    });

    it('should configure TypeScript strict type-checked rules', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('strictTypeChecked');
      expect(content).toContain('stylisticTypeChecked');
    });

    it('should integrate Prettier with ESLint', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('prettier');
      expect(content).toContain("'prettier/prettier': 'error'");
    });

    it('should have relaxed rules for test files', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('**/*.test.ts');
      expect(content).toContain('**/*.spec.ts');
    });
  });

  describe('Prettier Configuration', () => {
    // .prettierrc references a shared config package ("@crewspace/prettier-config").
    // We resolve the actual config values from that package.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const resolvedConfig = require('@crewspace/prettier-config');
    const config = resolvedConfig.default ?? resolvedConfig;

    it('should reference shared config package', () => {
      const prettierrcPath = join(rootDir, '.prettierrc');
      const raw = JSON.parse(readFileSync(prettierrcPath, 'utf-8'));
      expect(raw).toBe('@crewspace/prettier-config');
    });

    it('should enforce semicolons', () => {
      expect(config.semi).toBe(true);
    });

    it('should use single quotes', () => {
      expect(config.singleQuote).toBe(true);
    });

    it('should have printWidth of 100', () => {
      expect(config.printWidth).toBe(100);
    });

    it('should use 2 spaces for indentation', () => {
      expect(config.tabWidth).toBe(2);
      expect(config.useTabs).toBe(false);
    });

    it('should use trailing commas', () => {
      expect(config.trailingComma).toBe('all');
    });

    it('should use LF line endings', () => {
      expect(config.endOfLine).toBe('lf');
    });
  });

  describe('Prettier Ignore Configuration', () => {
    it('should ignore dist directories', () => {
      const prettierIgnorePath = join(rootDir, '.prettierignore');
      const content = readFileSync(prettierIgnorePath, 'utf-8');
      expect(content).toContain('dist');
    });

    it('should ignore node_modules', () => {
      const prettierIgnorePath = join(rootDir, '.prettierignore');
      const content = readFileSync(prettierIgnorePath, 'utf-8');
      expect(content).toContain('node_modules');
    });

    it('should ignore coverage reports', () => {
      const prettierIgnorePath = join(rootDir, '.prettierignore');
      const content = readFileSync(prettierIgnorePath, 'utf-8');
      expect(content).toContain('coverage');
    });
  });

  describe('NPM Scripts', () => {
    it('should have lint script in root package.json', () => {
      const packageJsonPath = join(rootDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.scripts).toHaveProperty('lint');
      expect(packageJson.scripts.lint).toBe('eslint .');
    });

    it('should have lint:fix script in root package.json', () => {
      const packageJsonPath = join(rootDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.scripts).toHaveProperty('lint:fix');
      expect(packageJson.scripts['lint:fix']).toBe('eslint . --fix');
    });

    it('should have format script in root package.json', () => {
      const packageJsonPath = join(rootDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.scripts).toHaveProperty('format');
      expect(packageJson.scripts.format).toContain('prettier');
      expect(packageJson.scripts.format).toContain('--write');
    });

    it('should have format:check script in root package.json', () => {
      const packageJsonPath = join(rootDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.scripts).toHaveProperty('format:check');
      expect(packageJson.scripts['format:check']).toContain('prettier');
      expect(packageJson.scripts['format:check']).toContain('--check');
    });
  });

  describe('Dependencies', () => {
    it('should have ESLint 9+ installed', () => {
      const packageJsonPath = join(rootDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.devDependencies).toHaveProperty('eslint');
      const eslintVersion = packageJson.devDependencies.eslint;
      expect(eslintVersion).toMatch(/^\^9\./);
    });

    it('should have typescript-eslint installed', () => {
      const packageJsonPath = join(rootDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.devDependencies).toHaveProperty('typescript-eslint');
    });

    it('should have Prettier installed', () => {
      const packageJsonPath = join(rootDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.devDependencies).toHaveProperty('prettier');
    });

    it('should have eslint-config-prettier installed', () => {
      const packageJsonPath = join(rootDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.devDependencies).toHaveProperty('eslint-config-prettier');
    });

    it('should have eslint-plugin-prettier installed', () => {
      const packageJsonPath = join(rootDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.devDependencies).toHaveProperty('eslint-plugin-prettier');
    });

    it('should have @eslint/js installed', () => {
      const packageJsonPath = join(rootDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.devDependencies).toHaveProperty('@eslint/js');
    });

    it('should have globals installed', () => {
      const packageJsonPath = join(rootDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.devDependencies).toHaveProperty('globals');
    });
  });

  describe('ESLint Execution', () => {
    it('should run ESLint without errors on existing code', () => {
      expect(() => {
        execSync('npm run lint', {
          cwd: rootDir,
          stdio: 'pipe',
          encoding: 'utf-8',
        });
      }).not.toThrow();
    }, 120_000); // 120 second timeout for ESLint
  });

  describe('Prettier Execution', () => {
    it('should verify all files are formatted correctly', () => {
      expect(() => {
        execSync('npm run format:check', {
          cwd: rootDir,
          stdio: 'pipe',
          encoding: 'utf-8',
        });
      }).not.toThrow();
    }, 60_000); // 60 second timeout for Prettier
  });

  describe('TypeScript Integration', () => {
    it('should configure type-checked linting with tsconfig', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('tsconfigRootDir');
      expect(content).toContain('project:');
    });

    it('should enforce explicit function return types', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('@typescript-eslint/explicit-function-return-type');
    });

    it('should enforce naming conventions', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('@typescript-eslint/naming-convention');
    });
  });

  describe('Code Quality Rules', () => {
    it('should enforce no-console warnings (except warn/error)', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('no-console');
      expect(content).toContain("allow: ['warn', 'error']");
    });

    it('should enforce strict equality (===)', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('eqeqeq');
    });

    it('should enforce prefer-const', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('prefer-const');
    });

    it('should disallow var', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('no-var');
    });

    it('should disallow eval', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('no-eval');
    });

    it('should check for floating promises', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('@typescript-eslint/no-floating-promises');
    });

    it('should check for misused promises', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('@typescript-eslint/no-misused-promises');
    });

    it('should enforce prefer-readonly', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('@typescript-eslint/prefer-readonly');
    });
  });

  describe('Compliance with Coding Conventions', () => {
    it('should align with TypeScript style naming conventions', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      // Variables: camelCase, UPPER_CASE, PascalCase
      expect(content).toContain("format: ['camelCase', 'UPPER_CASE', 'PascalCase']");
      // Functions: camelCase, PascalCase
      expect(content).toContain("selector: 'function'");
      // Types: PascalCase
      expect(content).toContain("selector: 'typeLike'");
    });

    it('should allow leading underscores for private fields', () => {
      const eslintConfigPath = join(rootDir, 'eslint.config.mjs');
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('leadingUnderscore');
      expect(content).toContain('argsIgnorePattern');
    });

    it('should enforce single quotes per conventions', () => {
      // .prettierrc references shared config; resolve from the package
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const resolvedConfig = require('@crewspace/prettier-config');
      const config = resolvedConfig.default ?? resolvedConfig;
      expect(config.singleQuote).toBe(true);
    });
  });
});
