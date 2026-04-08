import { describe, it, expect } from 'vitest';
import * as toolsFile from '../../src/index.js';

describe('@crewspace/tools-file', () => {
  describe('exports', () => {
    it('should export createFileTools factory', () => {
      expect(toolsFile.createFileTools).toBeDefined();
      expect(typeof toolsFile.createFileTools).toBe('function');
    });

    it('should export createReadFileTool', () => {
      expect(toolsFile.createReadFileTool).toBeDefined();
      expect(typeof toolsFile.createReadFileTool).toBe('function');
    });

    it('should export createWriteFileTool', () => {
      expect(toolsFile.createWriteFileTool).toBeDefined();
      expect(typeof toolsFile.createWriteFileTool).toBe('function');
    });

    it('should export createListFilesTool', () => {
      expect(toolsFile.createListFilesTool).toBeDefined();
      expect(typeof toolsFile.createListFilesTool).toBe('function');
    });

    it('should export matchesPattern utility', () => {
      expect(toolsFile.matchesPattern).toBeDefined();
      expect(typeof toolsFile.matchesPattern).toBe('function');
    });

    it('should export Zod schemas', () => {
      expect(toolsFile.ReadFileInputSchema).toBeDefined();
      expect(toolsFile.WriteFileInputSchema).toBeDefined();
      expect(toolsFile.ListFilesInputSchema).toBeDefined();
    });

    it('should export constants', () => {
      expect(toolsFile.MAX_READ_SIZE).toBeDefined();
      expect(toolsFile.MAX_WRITE_SIZE).toBeDefined();
      expect(toolsFile.DEFAULT_MAX_ENTRIES).toBeDefined();
      expect(toolsFile.HARD_MAX_ENTRIES).toBeDefined();
    });
  });

  describe('createFileTools', () => {
    it('should return an object with readFile, writeFile, and listFiles tools', () => {
      const tools = toolsFile.createFileTools();

      expect(tools).toBeDefined();
      expect(tools.readFile).toBeDefined();
      expect(tools.writeFile).toBeDefined();
      expect(tools.listFiles).toBeDefined();
    });

    it('should accept basePath option', () => {
      const tools = toolsFile.createFileTools({ basePath: '/tmp/test' });

      expect(tools.readFile).toBeDefined();
      expect(tools.writeFile).toBeDefined();
      expect(tools.listFiles).toBeDefined();
    });

    it('should create tools with name properties', () => {
      const tools = toolsFile.createFileTools();

      expect(tools.readFile.name).toBe('readFile');
      expect(tools.writeFile.name).toBe('writeFile');
      expect(tools.listFiles.name).toBe('listFiles');
    });
  });

  describe('matchesPattern', () => {
    it('should match simple glob patterns', () => {
      expect(toolsFile.matchesPattern('test.ts', '*.ts')).toBe(true);
      expect(toolsFile.matchesPattern('test.js', '*.ts')).toBe(false);
    });

    it('should match wildcard patterns', () => {
      expect(toolsFile.matchesPattern('hello.txt', '*')).toBe(true);
      expect(toolsFile.matchesPattern('file.log', '*.log')).toBe(true);
    });
  });

  describe('schemas', () => {
    it('should validate ReadFileInputSchema', () => {
      const valid = toolsFile.ReadFileInputSchema.safeParse({ path: '/test/file.txt' });
      expect(valid.success).toBe(true);
    });

    it('should reject ReadFileInputSchema with missing path', () => {
      const invalid = toolsFile.ReadFileInputSchema.safeParse({});
      expect(invalid.success).toBe(false);
    });

    it('should validate WriteFileInputSchema', () => {
      const valid = toolsFile.WriteFileInputSchema.safeParse({
        path: '/test/file.txt',
        content: 'hello',
      });
      expect(valid.success).toBe(true);
    });

    it('should validate ListFilesInputSchema', () => {
      const valid = toolsFile.ListFilesInputSchema.safeParse({ path: '/test' });
      expect(valid.success).toBe(true);
    });
  });

  describe('constants', () => {
    it('should have expected constant values', () => {
      expect(toolsFile.MAX_READ_SIZE).toBe(10 * 1024 * 1024);
      expect(toolsFile.MAX_WRITE_SIZE).toBe(10 * 1024 * 1024);
      expect(toolsFile.DEFAULT_MAX_ENTRIES).toBe(500);
      expect(toolsFile.HARD_MAX_ENTRIES).toBe(10_000);
    });
  });
});
