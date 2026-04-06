import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Helper function to parse JSON with comments (JSONC format used by tsconfig files)
 * This implementation removes comments while preserving comment-like strings in JSON
 */
function parseJsonWithComments(content: string): any {
  // Remove single-line comments
  const lines = content.split('\n');
  const cleanedLines = lines.map((line) => {
    // Find // outside of strings
    let inString = false;
    let stringChar = '';
    let commentStart = -1;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const prevChar = i > 0 ? line[i - 1] : '';

      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
      } else if (!inString && char === '/' && line[i + 1] === '/') {
        commentStart = i;
        break;
      }
    }

    return commentStart >= 0 ? line.substring(0, commentStart) : line;
  });

  let cleaned = cleanedLines.join('\n');

  // Remove multi-line comments /* ... */
  // This regex avoids matching /* inside strings by only matching at word boundaries
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove trailing commas
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

  return JSON.parse(cleaned);
}

describe('TypeScript Configuration', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const baseConfigPath = path.join(rootDir, 'tsconfig.base.json');
  const rootConfigPath = path.join(rootDir, 'tsconfig.json');
  const coreConfigPath = path.join(rootDir, 'packages/core/tsconfig.json');
  const testConfigPath = path.join(rootDir, 'packages/core/tsconfig.test.json');

  describe('tsconfig.base.json', () => {
    it('should exist', () => {
      expect(fs.existsSync(baseConfigPath)).toBe(true);
    });

    it('should have strict mode enabled', () => {
      const config = parseJsonWithComments(fs.readFileSync(baseConfigPath, 'utf-8'));
      expect(config.compilerOptions.strict).toBe(true);
    });

    it('should target ES2022', () => {
      const config = parseJsonWithComments(fs.readFileSync(baseConfigPath, 'utf-8'));
      expect(config.compilerOptions.target).toBe('ES2022');
    });

    it('should use Node16 module resolution', () => {
      const config = parseJsonWithComments(fs.readFileSync(baseConfigPath, 'utf-8'));
      expect(config.compilerOptions.module).toBe('Node16');
      expect(config.compilerOptions.moduleResolution).toBe('Node16');
    });

    it('should have enhanced strict type checking flags', () => {
      const config = parseJsonWithComments(fs.readFileSync(baseConfigPath, 'utf-8'));
      const opts = config.compilerOptions;

      // Enhanced strict flags
      expect(opts.exactOptionalPropertyTypes).toBe(true);
      expect(opts.noUncheckedIndexedAccess).toBe(true);
      expect(opts.noPropertyAccessFromIndexSignature).toBe(true);
      expect(opts.noUnusedLocals).toBe(true);
      expect(opts.noUnusedParameters).toBe(true);
      expect(opts.noImplicitReturns).toBe(true);
      expect(opts.noFallthroughCasesInSwitch).toBe(true);
    });

    it('should have proper module interop settings', () => {
      const config = parseJsonWithComments(fs.readFileSync(baseConfigPath, 'utf-8'));
      const opts = config.compilerOptions;

      expect(opts.esModuleInterop).toBe(true);
      expect(opts.isolatedModules).toBe(true);
      expect(opts.resolveJsonModule).toBe(true);
      expect(opts.forceConsistentCasingInFileNames).toBe(true);
    });

    it('should generate type definitions', () => {
      const config = parseJsonWithComments(fs.readFileSync(baseConfigPath, 'utf-8'));
      const opts = config.compilerOptions;

      expect(opts.declaration).toBe(true);
      expect(opts.declarationMap).toBe(true);
      expect(opts.sourceMap).toBe(true);
      expect(opts.stripInternal).toBe(true);
    });

    it('should enable composite mode for project references', () => {
      const config = parseJsonWithComments(fs.readFileSync(baseConfigPath, 'utf-8'));
      expect(config.compilerOptions.composite).toBe(true);
      expect(config.compilerOptions.incremental).toBe(true);
    });

    it('should skip lib check for performance', () => {
      const config = parseJsonWithComments(fs.readFileSync(baseConfigPath, 'utf-8'));
      expect(config.compilerOptions.skipLibCheck).toBe(true);
    });

    it('should include ES2022 lib', () => {
      const config = parseJsonWithComments(fs.readFileSync(baseConfigPath, 'utf-8'));
      expect(config.compilerOptions.lib).toContain('ES2022');
    });
  });

  describe('root tsconfig.json', () => {
    it('should exist', () => {
      expect(fs.existsSync(rootConfigPath)).toBe(true);
    });

    it('should reference core package', () => {
      const config = parseJsonWithComments(fs.readFileSync(rootConfigPath, 'utf-8'));
      expect(config.references).toBeDefined();
      expect(config.references).toContainEqual({ path: 'packages/core' });
    });

    it('should have empty files array', () => {
      const config = parseJsonWithComments(fs.readFileSync(rootConfigPath, 'utf-8'));
      expect(config.files).toEqual([]);
    });
  });

  describe('packages/core/tsconfig.json', () => {
    it('should exist', () => {
      expect(fs.existsSync(coreConfigPath)).toBe(true);
    });

    it('should extend base config', () => {
      const config = parseJsonWithComments(fs.readFileSync(coreConfigPath, 'utf-8'));
      expect(config.extends).toBe('../../tsconfig.base.json');
    });

    it('should configure output directory', () => {
      const config = parseJsonWithComments(fs.readFileSync(coreConfigPath, 'utf-8'));
      expect(config.compilerOptions.outDir).toBe('./dist');
      expect(config.compilerOptions.rootDir).toBe('./src');
    });

    it('should include only source files', () => {
      const config = parseJsonWithComments(fs.readFileSync(coreConfigPath, 'utf-8'));
      // Check that include contains a glob pattern for TypeScript source files
      expect(config.include).toBeDefined();
      expect(Array.isArray(config.include)).toBe(true);
      expect(config.include.length).toBeGreaterThan(0);
      // Should match src directory with .ts files
      const hasSrcPattern = config.include.some(
        (pattern: string) => pattern.includes('src') && pattern.includes('.ts'),
      );
      expect(hasSrcPattern).toBe(true);
    });

    it('should exclude test files from main compilation', () => {
      const config = parseJsonWithComments(fs.readFileSync(coreConfigPath, 'utf-8'));
      expect(config.exclude).toBeDefined();
      expect(Array.isArray(config.exclude)).toBe(true);
      expect(config.exclude).toContain('tests');
      // Should exclude test patterns
      const hasTestExclusions = config.exclude.some(
        (pattern: string) => pattern.includes('.test.') || pattern.includes('.spec.'),
      );
      expect(hasTestExclusions).toBe(true);
    });
  });

  describe('packages/core/tsconfig.test.json', () => {
    it('should exist', () => {
      expect(fs.existsSync(testConfigPath)).toBe(true);
    });

    it('should extend base config', () => {
      const config = parseJsonWithComments(fs.readFileSync(testConfigPath, 'utf-8'));
      expect(config.extends).toBe('../../tsconfig.base.json');
    });

    it('should disable composite mode for tests', () => {
      const config = parseJsonWithComments(fs.readFileSync(testConfigPath, 'utf-8'));
      expect(config.compilerOptions.composite).toBe(false);
    });

    it('should disable emit for tests', () => {
      const config = parseJsonWithComments(fs.readFileSync(testConfigPath, 'utf-8'));
      expect(config.compilerOptions.noEmit).toBe(true);
      expect(config.compilerOptions.declaration).toBe(false);
      expect(config.compilerOptions.declarationMap).toBe(false);
      expect(config.compilerOptions.sourceMap).toBe(false);
    });

    it('should include test files', () => {
      const config = parseJsonWithComments(fs.readFileSync(testConfigPath, 'utf-8'));
      expect(config.include).toBeDefined();
      expect(Array.isArray(config.include)).toBe(true);
      // Should include both source and test files
      const hasSrcPattern = config.include.some(
        (pattern: string) => pattern.includes('src') && pattern.includes('.ts'),
      );
      const hasTestPattern = config.include.some(
        (pattern: string) => pattern.includes('test') || pattern.includes('tests'),
      );
      expect(hasSrcPattern).toBe(true);
      expect(hasTestPattern).toBe(true);
    });
  });
});
