import { describe, it, expect } from 'vitest';
import prettierConfig, { config, createConfig, DEFAULT_IGNORE_PATTERNS } from '../src/index.js';
import type { CrewspacePrettierOptions } from '../src/types.js';

describe('@crewspace/prettier-config', () => {
  describe('default export', () => {
    it('exports a non-null config object', () => {
      expect(prettierConfig).toBeDefined();
      expect(typeof prettierConfig).toBe('object');
    });

    it('is the same reference as the named config export', () => {
      expect(prettierConfig).toBe(config);
    });
  });

  describe('config', () => {
    it('uses single quotes', () => {
      expect(config.singleQuote).toBe(true);
    });

    it('uses semicolons', () => {
      expect(config.semi).toBe(true);
    });

    it('uses trailing commas everywhere', () => {
      expect(config.trailingComma).toBe('all');
    });

    it('sets print width to 100', () => {
      expect(config.printWidth).toBe(100);
    });

    it('uses 2-space indentation', () => {
      expect(config.tabWidth).toBe(2);
      expect(config.useTabs).toBe(false);
    });

    it('uses bracket spacing', () => {
      expect(config.bracketSpacing).toBe(true);
    });

    it('always uses arrow parens', () => {
      expect(config.arrowParens).toBe('always');
    });

    it('uses LF line endings', () => {
      expect(config.endOfLine).toBe('lf');
    });

    it('contains exactly the expected keys', () => {
      const keys = Object.keys(config).sort();
      expect(keys).toEqual([
        'arrowParens',
        'bracketSpacing',
        'endOfLine',
        'printWidth',
        'semi',
        'singleQuote',
        'tabWidth',
        'trailingComma',
        'useTabs',
      ]);
    });
  });

  describe('createConfig()', () => {
    it('returns defaults when called with no arguments', () => {
      const result = createConfig();
      expect(result).toEqual(config);
    });

    it('returns defaults when called with empty object', () => {
      const result = createConfig({});
      expect(result).toEqual(config);
    });

    it('overrides printWidth', () => {
      const result = createConfig({ printWidth: 120 });
      expect(result.printWidth).toBe(120);
      expect(result.singleQuote).toBe(true);
      expect(result.semi).toBe(true);
    });

    it('overrides singleQuote', () => {
      const result = createConfig({ singleQuote: false });
      expect(result.singleQuote).toBe(false);
      expect(result.printWidth).toBe(100);
    });

    it('overrides trailingComma', () => {
      const result = createConfig({ trailingComma: 'es5' });
      expect(result.trailingComma).toBe('es5');
    });

    it('overrides tabWidth', () => {
      const result = createConfig({ tabWidth: 4 });
      expect(result.tabWidth).toBe(4);
    });

    it('overrides useTabs', () => {
      const result = createConfig({ useTabs: true });
      expect(result.useTabs).toBe(true);
    });

    it('overrides semi', () => {
      const result = createConfig({ semi: false });
      expect(result.semi).toBe(false);
    });

    it('overrides bracketSpacing', () => {
      const result = createConfig({ bracketSpacing: false });
      expect(result.bracketSpacing).toBe(false);
    });

    it('overrides arrowParens', () => {
      const result = createConfig({ arrowParens: 'avoid' });
      expect(result.arrowParens).toBe('avoid');
    });

    it('overrides endOfLine', () => {
      const result = createConfig({ endOfLine: 'auto' });
      expect(result.endOfLine).toBe('auto');
    });

    it('supports multiple overrides at once', () => {
      const result = createConfig({
        printWidth: 80,
        tabWidth: 4,
        singleQuote: false,
      });
      expect(result.printWidth).toBe(80);
      expect(result.tabWidth).toBe(4);
      expect(result.singleQuote).toBe(false);
      expect(result.semi).toBe(true);
      expect(result.trailingComma).toBe('all');
    });

    it('merges overrides from the overrides option', () => {
      const result = createConfig({
        overrides: { quoteProps: 'consistent' },
      });
      expect(result.quoteProps).toBe('consistent');
      expect(result.singleQuote).toBe(true);
    });

    it('overrides option takes precedence over direct options', () => {
      const result = createConfig({
        printWidth: 80,
        overrides: { printWidth: 120 },
      });
      expect(result.printWidth).toBe(120);
    });

    it('does not mutate the base config', () => {
      const before = { ...config };
      createConfig({ printWidth: 200, tabWidth: 8 });
      expect(config).toEqual(before);
    });

    it('returns a new object each time', () => {
      const a = createConfig();
      const b = createConfig();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe('DEFAULT_IGNORE_PATTERNS', () => {
    it('is a non-empty array', () => {
      expect(Array.isArray(DEFAULT_IGNORE_PATTERNS)).toBe(true);
      expect(DEFAULT_IGNORE_PATTERNS.length).toBeGreaterThan(0);
    });

    it('includes dist', () => {
      expect(DEFAULT_IGNORE_PATTERNS).toContain('dist');
    });

    it('includes node_modules', () => {
      expect(DEFAULT_IGNORE_PATTERNS).toContain('node_modules');
    });

    it('includes coverage', () => {
      expect(DEFAULT_IGNORE_PATTERNS).toContain('coverage');
    });

    it('includes package-lock.json', () => {
      expect(DEFAULT_IGNORE_PATTERNS).toContain('package-lock.json');
    });

    it('includes markdown files', () => {
      expect(DEFAULT_IGNORE_PATTERNS).toContain('*.md');
    });
  });

  describe('types', () => {
    it('CrewspacePrettierOptions allows all expected properties', () => {
      const options: CrewspacePrettierOptions = {
        semi: false,
        singleQuote: false,
        trailingComma: 'none',
        printWidth: 80,
        tabWidth: 4,
        useTabs: true,
        bracketSpacing: false,
        arrowParens: 'avoid',
        endOfLine: 'crlf',
        overrides: { quoteProps: 'consistent' },
      };
      const result = createConfig(options);
      expect(result.semi).toBe(false);
      expect(result.singleQuote).toBe(false);
      expect(result.trailingComma).toBe('none');
      expect(result.printWidth).toBe(80);
      expect(result.tabWidth).toBe(4);
      expect(result.useTabs).toBe(true);
      expect(result.bracketSpacing).toBe(false);
      expect(result.arrowParens).toBe('avoid');
      expect(result.endOfLine).toBe('crlf');
      expect(result.quoteProps).toBe('consistent');
    });

    it('CrewspacePrettierOptions works with no arguments', () => {
      const result = createConfig();
      expect(result.printWidth).toBe(100);
    });
  });
});
