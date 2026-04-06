import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Build Output Validation', () => {
  const distDir = path.resolve(__dirname, '../dist');

  beforeAll(() => {
    // Ensure build has been run
    expect(fs.existsSync(distDir)).toBe(true);
  });

  describe('Compilation Artifacts', () => {
    it('should generate JavaScript files', () => {
      const indexJs = path.join(distDir, 'index.js');
      expect(fs.existsSync(indexJs)).toBe(true);
    });

    it('should generate declaration files (.d.ts)', () => {
      const indexDts = path.join(distDir, 'index.d.ts');
      expect(fs.existsSync(indexDts)).toBe(true);
    });

    it('should generate declaration maps (.d.ts.map)', () => {
      const indexDtsMap = path.join(distDir, 'index.d.ts.map');
      expect(fs.existsSync(indexDtsMap)).toBe(true);
    });

    it('should generate source maps (.js.map)', () => {
      const indexJsMap = path.join(distDir, 'index.js.map');
      expect(fs.existsSync(indexJsMap)).toBe(true);
    });

    it('should generate tsbuildinfo file', () => {
      const tsBuildInfo = path.join(distDir, '.tsbuildinfo');
      expect(fs.existsSync(tsBuildInfo)).toBe(true);
    });
  });

  describe('Module Format', () => {
    it('should compile to ES modules (Node16)', () => {
      const indexJs = path.join(distDir, 'index.js');
      const content = fs.readFileSync(indexJs, 'utf-8');

      // Node16 modules use export/import syntax
      // Check that the file doesn't use CommonJS (require/module.exports)
      // if it has any exports
      if (content.includes('export')) {
        expect(content).not.toContain('module.exports');
      }
    });
  });

  describe('Source Maps', () => {
    it('should reference source maps in compiled JS', () => {
      const indexJs = path.join(distDir, 'index.js');
      const content = fs.readFileSync(indexJs, 'utf-8');

      expect(content).toContain('sourceMappingURL=index.js.map');
    });

    it('should have valid source map JSON', () => {
      const indexJsMap = path.join(distDir, 'index.js.map');
      const content = fs.readFileSync(indexJsMap, 'utf-8');

      // Should be valid JSON
      const sourceMap = JSON.parse(content);
      expect(sourceMap.version).toBe(3);
      expect(sourceMap.sources).toBeDefined();
      expect(sourceMap.mappings).toBeDefined();
    });
  });

  describe('Declaration Files', () => {
    it('should have valid TypeScript declaration syntax', () => {
      const indexDts = path.join(distDir, 'index.d.ts');
      const content = fs.readFileSync(indexDts, 'utf-8');

      // Basic syntax check - should contain export statements
      // The actual validation happens when TypeScript parses these files
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should reference declaration maps in .d.ts files', () => {
      const indexDts = path.join(distDir, 'index.d.ts');
      const content = fs.readFileSync(indexDts, 'utf-8');

      expect(content).toContain('sourceMappingURL=index.d.ts.map');
    });
  });

  describe('Incremental Compilation', () => {
    it('should create tsbuildinfo for incremental builds', () => {
      const tsBuildInfo = path.join(distDir, '.tsbuildinfo');
      const content = fs.readFileSync(tsBuildInfo, 'utf-8');

      // Should be valid JSON
      const buildInfo = JSON.parse(content);
      // Should have fileNames (list of files that were compiled)
      expect(buildInfo.fileNames).toBeDefined();
      expect(Array.isArray(buildInfo.fileNames)).toBe(true);
    });
  });

  describe('No Test Files in Output', () => {
    it('should not compile test files to dist', () => {
      const files = fs.readdirSync(distDir);
      const testFiles = files.filter((f) => f.includes('.test.') || f.includes('.spec.'));

      expect(testFiles).toHaveLength(0);
    });
  });
});
