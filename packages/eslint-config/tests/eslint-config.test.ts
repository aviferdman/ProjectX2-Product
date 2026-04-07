import { describe, it, expect } from 'vitest';
import {
  crewspaceConfig,
  recommended,
  strict,
  testOverrides,
  ignores,
} from '../src/index.js';
import type { CrewspaceConfigOptions, FlatConfig } from '../src/types.js';

/** Helper: find the last config entry that has the given rule defined (last wins in flat config). */
function findRuleInConfigs(
  configs: FlatConfig[],
  ruleName: string,
  options?: { excludeTestFiles?: boolean },
): Record<string, unknown> | undefined {
  let result: Record<string, unknown> | undefined;
  for (const config of configs) {
    if (
      options?.excludeTestFiles &&
      Array.isArray(config.files) &&
      config.files.some((f) => typeof f === 'string' && (f.includes('.test.') || f.includes('.spec.') || f.includes('tests/')))
    ) {
      continue;
    }
    const rules = config.rules as Record<string, unknown> | undefined;
    if (rules && ruleName in rules) {
      result = rules;
    }
  }
  return result;
}

/** Helper: check if ignores config contains a pattern. */
function hasIgnorePattern(configs: FlatConfig[], pattern: string): boolean {
  return configs.some(
    (c) => Array.isArray(c.ignores) && c.ignores.includes(pattern),
  );
}

describe('@crewspace/eslint-config', () => {
  describe('crewspaceConfig()', () => {
    it('returns a non-empty array of config objects with default options', () => {
      const configs = crewspaceConfig();
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);
    });

    it('includes ignore patterns by default', () => {
      const configs = crewspaceConfig();
      expect(hasIgnorePattern(configs, '**/dist/**')).toBe(true);
      expect(hasIgnorePattern(configs, '**/node_modules/**')).toBe(true);
      expect(hasIgnorePattern(configs, '**/coverage/**')).toBe(true);
    });

    it('includes extra ignores when specified', () => {
      const configs = crewspaceConfig({ ignores: ['generated/**'] });
      expect(hasIgnorePattern(configs, 'generated/**')).toBe(true);
      expect(hasIgnorePattern(configs, '**/dist/**')).toBe(true);
    });

    it('includes recommended async-safety rules', () => {
      const configs = crewspaceConfig();
      const rules = findRuleInConfigs(configs, '@typescript-eslint/no-floating-promises', { excludeTestFiles: true });
      expect(rules).toBeDefined();
      expect(rules!['@typescript-eslint/no-floating-promises']).toBe('error');
    });

    it('includes no-misused-promises rule', () => {
      const configs = crewspaceConfig();
      const rules = findRuleInConfigs(configs, '@typescript-eslint/no-misused-promises', { excludeTestFiles: true });
      expect(rules).toBeDefined();
      expect(rules!['@typescript-eslint/no-misused-promises']).toBe('error');
    });

    it('includes explicit-function-return-type rule', () => {
      const configs = crewspaceConfig();
      const rules = findRuleInConfigs(
        configs,
        '@typescript-eslint/explicit-function-return-type',
        { excludeTestFiles: true },
      );
      expect(rules).toBeDefined();
      const rule = rules!['@typescript-eslint/explicit-function-return-type'];
      expect(Array.isArray(rule)).toBe(true);
      expect((rule as unknown[])[0]).toBe('error');
    });

    it('includes naming convention rules', () => {
      const configs = crewspaceConfig();
      const rules = findRuleInConfigs(configs, '@typescript-eslint/naming-convention', { excludeTestFiles: true });
      expect(rules).toBeDefined();
    });

    it('includes prefer-readonly rule', () => {
      const configs = crewspaceConfig();
      const rules = findRuleInConfigs(configs, '@typescript-eslint/prefer-readonly', { excludeTestFiles: true });
      expect(rules).toBeDefined();
      expect(rules!['@typescript-eslint/prefer-readonly']).toBe('error');
    });

    it('includes general best-practice rules', () => {
      const configs = crewspaceConfig();
      const rules = findRuleInConfigs(configs, 'eqeqeq', { excludeTestFiles: true });
      expect(rules).toBeDefined();
      expect(rules!['eqeqeq']).toEqual(['error', 'always']);
      expect(rules!['no-eval']).toBe('error');
      expect(rules!['prefer-const']).toBe('error');
      expect(rules!['no-var']).toBe('error');
    });

    it('includes test overrides by default', () => {
      const configs = crewspaceConfig();
      const testConfig = configs.find(
        (c) =>
          Array.isArray(c.files) &&
          c.files.some((f) => typeof f === 'string' && f.includes('.test.')),
      );
      expect(testConfig).toBeDefined();
      const rules = testConfig!.rules as Record<string, unknown>;
      expect(rules['@typescript-eslint/no-explicit-any']).toBe('off');
      expect(rules['@typescript-eslint/no-floating-promises']).toBe('off');
    });

    it('excludes test overrides when disabled', () => {
      const configs = crewspaceConfig({ testOverrides: false });
      const testConfig = configs.find(
        (c) =>
          Array.isArray(c.files) &&
          c.files.some((f) => typeof f === 'string' && f.includes('.test.')),
      );
      expect(testConfig).toBeUndefined();
    });

    it('does not include strict rules by default', () => {
      const configs = crewspaceConfig();
      const rules = findRuleInConfigs(
        configs,
        '@typescript-eslint/switch-exhaustiveness-check',
      );
      // switch-exhaustiveness-check is only in the strict config overlay
      // It may be undefined or not 'error' from the base configs
      if (rules) {
        // If it exists from base tseslint, it shouldn't be 'error'
        expect(rules['@typescript-eslint/switch-exhaustiveness-check']).not.toBe('error');
      }
    });

    it('includes strict rules when strict: true', () => {
      const configs = crewspaceConfig({ strict: true });
      const rules = findRuleInConfigs(
        configs,
        '@typescript-eslint/switch-exhaustiveness-check',
        { excludeTestFiles: true },
      );
      expect(rules).toBeDefined();
      expect(rules!['@typescript-eslint/switch-exhaustiveness-check']).toBe('error');
    });

    it('accepts custom file patterns', () => {
      const configs = crewspaceConfig({ files: ['src/**/*.ts'] });
      const fileConfig = configs.find(
        (c) =>
          Array.isArray(c.files) &&
          c.files.some((f) => typeof f === 'string' && f === 'src/**/*.ts'),
      );
      expect(fileConfig).toBeDefined();
    });

    it('accepts custom test file patterns', () => {
      const configs = crewspaceConfig({ testFiles: ['**/*.mytest.ts'] });
      const testConfig = configs.find(
        (c) =>
          Array.isArray(c.files) &&
          c.files.some((f) => typeof f === 'string' && f.includes('.mytest.')),
      );
      expect(testConfig).toBeDefined();
    });
  });

  describe('ignores()', () => {
    it('returns standard ignore patterns', () => {
      const configs = ignores();
      expect(configs).toHaveLength(1);
      const patterns = configs[0]!.ignores!;
      expect(patterns).toContain('**/dist/**');
      expect(patterns).toContain('**/node_modules/**');
      expect(patterns).toContain('**/coverage/**');
      expect(patterns).toContain('**/*.js');
      expect(patterns).toContain('**/*.mjs');
      expect(patterns).toContain('**/*.cjs');
    });

    it('merges extra ignore patterns', () => {
      const configs = ignores(['build/**', 'tmp/**']);
      const patterns = configs[0]!.ignores!;
      expect(patterns).toContain('build/**');
      expect(patterns).toContain('tmp/**');
      expect(patterns).toContain('**/dist/**');
    });
  });

  describe('recommended()', () => {
    it('returns config array with async-safety rules', () => {
      const configs = recommended({ project: true });
      const rules = findRuleInConfigs(configs, '@typescript-eslint/no-floating-promises');
      expect(rules).toBeDefined();
      expect(rules!['@typescript-eslint/no-floating-promises']).toBe('error');
      expect(rules!['@typescript-eslint/await-thenable']).toBe('error');
      expect(rules!['@typescript-eslint/require-await']).toBe('error');
    });

    it('returns config array with no-console set to warn', () => {
      const configs = recommended({ project: true });
      const rules = findRuleInConfigs(configs, 'no-console');
      expect(rules).toBeDefined();
      const noConsole = rules!['no-console'] as [string, { allow: string[] }];
      expect(noConsole[0]).toBe('warn');
      expect(noConsole[1].allow).toContain('warn');
      expect(noConsole[1].allow).toContain('error');
    });

    it('configures unused-vars to allow underscore prefix', () => {
      const configs = recommended({ project: true });
      const rules = findRuleInConfigs(configs, '@typescript-eslint/no-unused-vars');
      expect(rules).toBeDefined();
      const unusedVars = rules!['@typescript-eslint/no-unused-vars'] as [
        string,
        { argsIgnorePattern: string },
      ];
      expect(unusedVars[0]).toBe('error');
      expect(unusedVars[1].argsIgnorePattern).toBe('^_');
    });

    it('accepts string project path', () => {
      const configs = recommended({ project: './tsconfig.json' });
      expect(configs.length).toBeGreaterThan(0);
    });

    it('accepts array project paths', () => {
      const configs = recommended({
        project: ['./tsconfig.json', './tsconfig.test.json'],
      });
      expect(configs.length).toBeGreaterThan(0);
    });
  });

  describe('strict()', () => {
    it('returns config array with no-unsafe-* rules', () => {
      const configs = strict({});
      const rules = findRuleInConfigs(configs, '@typescript-eslint/no-unsafe-assignment');
      expect(rules).toBeDefined();
      expect(rules!['@typescript-eslint/no-unsafe-assignment']).toBe('error');
      expect(rules!['@typescript-eslint/no-unsafe-call']).toBe('error');
      expect(rules!['@typescript-eslint/no-unsafe-member-access']).toBe('error');
      expect(rules!['@typescript-eslint/no-unsafe-return']).toBe('error');
      expect(rules!['@typescript-eslint/no-unsafe-argument']).toBe('error');
    });

    it('includes switch-exhaustiveness-check', () => {
      const configs = strict({});
      const rules = findRuleInConfigs(
        configs,
        '@typescript-eslint/switch-exhaustiveness-check',
      );
      expect(rules).toBeDefined();
      expect(rules!['@typescript-eslint/switch-exhaustiveness-check']).toBe('error');
    });

    it('includes only-throw-error', () => {
      const configs = strict({});
      const rules = findRuleInConfigs(configs, '@typescript-eslint/only-throw-error');
      expect(rules).toBeDefined();
      expect(rules!['@typescript-eslint/only-throw-error']).toBe('error');
    });

    it('includes strict-boolean-expressions', () => {
      const configs = strict({});
      const rules = findRuleInConfigs(
        configs,
        '@typescript-eslint/strict-boolean-expressions',
      );
      expect(rules).toBeDefined();
      const boolRule = rules!['@typescript-eslint/strict-boolean-expressions'] as [
        string,
        Record<string, unknown>,
      ];
      expect(boolRule[0]).toBe('error');
      expect(boolRule[1]['allowNumber']).toBe(false);
    });

    it('accepts custom file patterns', () => {
      const configs = strict({ files: ['src/**/*.ts'] });
      const fileConfig = configs.find(
        (c) =>
          Array.isArray(c.files) &&
          c.files.some((f) => typeof f === 'string' && f === 'src/**/*.ts'),
      );
      expect(fileConfig).toBeDefined();
    });
  });

  describe('testOverrides()', () => {
    it('returns config with relaxed rules for default test patterns', () => {
      const configs = testOverrides();
      expect(configs).toHaveLength(1);
      const config = configs[0]!;
      expect(config.files).toContain('**/*.test.ts');
      expect(config.files).toContain('**/*.spec.ts');
      expect(config.files).toContain('**/tests/**/*.ts');
      expect(config.files).toContain('**/__tests__/**/*.ts');
    });

    it('disables strict typing rules in test files', () => {
      const configs = testOverrides();
      const rules = configs[0]!.rules as Record<string, unknown>;
      expect(rules['@typescript-eslint/no-explicit-any']).toBe('off');
      expect(rules['@typescript-eslint/no-floating-promises']).toBe('off');
      expect(rules['@typescript-eslint/explicit-function-return-type']).toBe('off');
      expect(rules['@typescript-eslint/naming-convention']).toBe('off');
      expect(rules['no-console']).toBe('off');
    });

    it('accepts custom test file patterns', () => {
      const configs = testOverrides({ testFiles: ['custom/**/*.test.ts'] });
      expect(configs[0]!.files).toContain('custom/**/*.test.ts');
      expect(configs[0]!.files).not.toContain('**/*.spec.ts');
    });
  });

  describe('types', () => {
    it('CrewspaceConfigOptions allows all expected properties', () => {
      const options: CrewspaceConfigOptions = {
        project: true,
        tsconfigRootDir: '/root',
        files: ['**/*.ts'],
        ignores: ['dist/**'],
        strict: true,
        testOverrides: true,
        testFiles: ['**/*.test.ts'],
      };
      // If this compiles, the types are correct
      const configs = crewspaceConfig(options);
      expect(configs.length).toBeGreaterThan(0);
    });

    it('CrewspaceConfigOptions works with no arguments', () => {
      const configs = crewspaceConfig();
      expect(configs.length).toBeGreaterThan(0);
    });

    it('CrewspaceConfigOptions project accepts string', () => {
      const configs = crewspaceConfig({ project: './tsconfig.json' });
      expect(configs.length).toBeGreaterThan(0);
    });

    it('CrewspaceConfigOptions project accepts string array', () => {
      const configs = crewspaceConfig({ project: ['./tsconfig.json'] });
      expect(configs.length).toBeGreaterThan(0);
    });
  });
});
