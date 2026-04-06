import * as fsPromises from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ToolExecutionError } from '../../../../src/errors/tool-errors.js';
import { createListFilesTool, matchesPattern } from '../../../../src/tools/file/list-files.js';
import { DEFAULT_MAX_ENTRIES, HARD_MAX_ENTRIES } from '../../../../src/tools/file/types.js';
import { ToolCategory, ToolPermission } from '../../../../src/types/tool.js';

describe('matchesPattern', () => {
  it('should match wildcard *', () => {
    expect(matchesPattern('hello.ts', '*.ts')).toBe(true);
    expect(matchesPattern('hello.js', '*.ts')).toBe(false);
  });

  it('should match single character ?', () => {
    expect(matchesPattern('a.ts', '?.ts')).toBe(true);
    expect(matchesPattern('ab.ts', '?.ts')).toBe(false);
  });

  it('should match everything with *', () => {
    expect(matchesPattern('anything', '*')).toBe(true);
  });

  it('should be case-insensitive', () => {
    expect(matchesPattern('README.MD', '*.md')).toBe(true);
    expect(matchesPattern('file.TS', '*.ts')).toBe(true);
  });

  it('should handle patterns with dots', () => {
    expect(matchesPattern('tsconfig.json', 'tsconfig.*')).toBe(true);
    expect(matchesPattern('tsconfig.json', '*.json')).toBe(true);
  });

  it('should escape special regex characters', () => {
    expect(matchesPattern('file.test.ts', 'file.test.ts')).toBe(true);
    expect(matchesPattern('file+test.ts', 'file+test.ts')).toBe(true);
  });
});

describe('createListFilesTool', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'crewspace-listfiles-'));
  });

  afterEach(async () => {
    await fsPromises.rm(tmpDir, { recursive: true, force: true });
  });

  it('should create a tool with correct metadata', () => {
    const tool = createListFilesTool(tmpDir);
    expect(tool.name).toBe('listFiles');
    expect(tool.description).toContain('List');
    expect(tool.category).toBe(ToolCategory.FILE);
    expect(tool.permissions).toEqual([ToolPermission.FILE_READ]);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('should list files in a directory', async () => {
    await fsPromises.writeFile(path.join(tmpDir, 'a.txt'), 'aaa');
    await fsPromises.writeFile(path.join(tmpDir, 'b.txt'), 'bb');
    await fsPromises.mkdir(path.join(tmpDir, 'sub'));

    const tool = createListFilesTool(tmpDir);
    const result = await tool.execute({ path: '.' });
    const output = result as {
      entries: Array<{ name: string; type: string; size: number }>;
      total: number;
      truncated: boolean;
    };

    expect(output.entries.length).toBe(3);
    expect(output.truncated).toBe(false);

    const names = output.entries.map((e) => e.name).sort();
    expect(names).toEqual(['a.txt', 'b.txt', 'sub']);

    const subEntry = output.entries.find((e) => e.name === 'sub');
    expect(subEntry?.type).toBe('directory');

    const aEntry = output.entries.find((e) => e.name === 'a.txt');
    expect(aEntry?.type).toBe('file');
    expect(aEntry?.size).toBe(3);
  });

  it('should list an empty directory', async () => {
    const emptyDir = path.join(tmpDir, 'empty');
    await fsPromises.mkdir(emptyDir);

    const tool = createListFilesTool(tmpDir);
    const result = await tool.execute({ path: 'empty' });
    const output = result as { entries: unknown[]; total: number };

    expect(output.entries).toEqual([]);
    expect(output.total).toBe(0);
  });

  it('should filter entries by pattern', async () => {
    await fsPromises.writeFile(path.join(tmpDir, 'app.ts'), '');
    await fsPromises.writeFile(path.join(tmpDir, 'app.js'), '');
    await fsPromises.writeFile(path.join(tmpDir, 'readme.md'), '');

    const tool = createListFilesTool(tmpDir);
    const result = await tool.execute({ path: '.', pattern: '*.ts' });
    const output = result as { entries: Array<{ name: string }> };

    expect(output.entries.length).toBe(1);
    expect(output.entries[0]!.name).toBe('app.ts');
  });

  it('should recurse into subdirectories when recursive is true', async () => {
    await fsPromises.mkdir(path.join(tmpDir, 'src'));
    await fsPromises.writeFile(path.join(tmpDir, 'root.ts'), '');
    await fsPromises.writeFile(path.join(tmpDir, 'src', 'index.ts'), '');

    const tool = createListFilesTool(tmpDir);
    const result = await tool.execute({ path: '.', recursive: true });
    const output = result as { entries: Array<{ name: string }> };

    const names = output.entries.map((e) => e.name);
    expect(names).toContain('root.ts');
    expect(names).toContain('src');
    expect(names).toContain('index.ts');
  });

  it('should not recurse by default', async () => {
    await fsPromises.mkdir(path.join(tmpDir, 'sub'));
    await fsPromises.writeFile(path.join(tmpDir, 'top.txt'), '');
    await fsPromises.writeFile(path.join(tmpDir, 'sub', 'nested.txt'), '');

    const tool = createListFilesTool(tmpDir);
    const result = await tool.execute({ path: '.' });
    const output = result as { entries: Array<{ name: string }> };

    const names = output.entries.map((e) => e.name);
    expect(names).toContain('top.txt');
    expect(names).toContain('sub');
    expect(names).not.toContain('nested.txt');
  });

  it('should truncate results to maxEntries', async () => {
    for (let i = 0; i < 10; i++) {
      await fsPromises.writeFile(path.join(tmpDir, `file-${String(i)}.txt`), '');
    }

    const tool = createListFilesTool(tmpDir);
    const result = await tool.execute({ path: '.', maxEntries: 3 });
    const output = result as { entries: unknown[]; total: number; truncated: boolean };

    expect(output.entries.length).toBe(3);
    expect(output.truncated).toBe(true);
  });

  it('should cap maxEntries at HARD_MAX_ENTRIES', async () => {
    const tool = createListFilesTool(tmpDir);
    // Providing a value over the hard max should not crash
    const result = await tool.execute({ path: '.', maxEntries: HARD_MAX_ENTRIES + 100 });
    const output = result as { entries: unknown[] };
    expect(output.entries).toBeDefined();
  });

  it('should throw ToolExecutionError for non-existent directory', async () => {
    const tool = createListFilesTool(tmpDir);

    await expect(tool.execute({ path: 'nope' })).rejects.toThrow(ToolExecutionError);
    await expect(tool.execute({ path: 'nope' })).rejects.toThrow('Directory not found');
  });

  it('should throw ToolExecutionError when path is a file', async () => {
    await fsPromises.writeFile(path.join(tmpDir, 'afile.txt'), '');

    const tool = createListFilesTool(tmpDir);

    await expect(tool.execute({ path: 'afile.txt' })).rejects.toThrow(ToolExecutionError);
    await expect(tool.execute({ path: 'afile.txt' })).rejects.toThrow('not a directory');
  });

  it('should throw ToolExecutionError for empty path', async () => {
    const tool = createListFilesTool(tmpDir);

    await expect(tool.execute({ path: '' })).rejects.toThrow(ToolExecutionError);
  });

  it('should reject path traversal outside base directory', async () => {
    const tool = createListFilesTool(tmpDir);

    await expect(tool.execute({ path: '../../..' })).rejects.toThrow(ToolExecutionError);
    await expect(tool.execute({ path: '../../..' })).rejects.toThrow(
      'outside the allowed base directory',
    );
  });

  it('should filter recursively with pattern only matching matching entries', async () => {
    await fsPromises.mkdir(path.join(tmpDir, 'src'));
    await fsPromises.writeFile(path.join(tmpDir, 'src', 'index.ts'), '');
    await fsPromises.writeFile(path.join(tmpDir, 'src', 'style.css'), '');
    await fsPromises.writeFile(path.join(tmpDir, 'readme.md'), '');

    const tool = createListFilesTool(tmpDir);
    const result = await tool.execute({
      path: '.',
      pattern: '*.ts',
      recursive: true,
    });
    const output = result as { entries: Array<{ name: string }> };

    const names = output.entries.map((e) => e.name);
    expect(names).toContain('index.ts');
    expect(names).not.toContain('style.css');
    expect(names).not.toContain('readme.md');
  });

  it('should use DEFAULT_MAX_ENTRIES and HARD_MAX_ENTRIES constants correctly', () => {
    expect(DEFAULT_MAX_ENTRIES).toBe(500);
    expect(HARD_MAX_ENTRIES).toBe(10_000);
    expect(DEFAULT_MAX_ENTRIES).toBeLessThan(HARD_MAX_ENTRIES);
  });
});
