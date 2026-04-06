import * as fsPromises from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ToolExecutionError } from '../../../../src/errors/tool-errors.js';
import { createReadFileTool } from '../../../../src/tools/file/read-file.js';
import { MAX_READ_SIZE } from '../../../../src/tools/file/types.js';
import { ToolCategory, ToolPermission } from '../../../../src/types/tool.js';

describe('createReadFileTool', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'crewspace-readfile-'));
  });

  afterEach(async () => {
    await fsPromises.rm(tmpDir, { recursive: true, force: true });
  });

  it('should create a tool with correct metadata', () => {
    const tool = createReadFileTool(tmpDir);
    expect(tool.name).toBe('readFile');
    expect(tool.description).toContain('Read');
    expect(tool.category).toBe(ToolCategory.FILE);
    expect(tool.permissions).toEqual([ToolPermission.FILE_READ]);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('should read a text file with default encoding', async () => {
    const filePath = path.join(tmpDir, 'hello.txt');
    await fsPromises.writeFile(filePath, 'Hello, world!', 'utf-8');

    const tool = createReadFileTool(tmpDir);
    const result = await tool.execute({ path: 'hello.txt' });
    const output = result as { content: string; size: number; path: string };

    expect(output.content).toBe('Hello, world!');
    expect(output.size).toBe(13);
    expect(output.path).toBe(filePath);
  });

  it('should read a file with absolute path inside base', async () => {
    const filePath = path.join(tmpDir, 'abs.txt');
    await fsPromises.writeFile(filePath, 'absolute', 'utf-8');

    const tool = createReadFileTool(tmpDir);
    const result = await tool.execute({ path: filePath });
    const output = result as { content: string; size: number; path: string };

    expect(output.content).toBe('absolute');
  });

  it('should read a file with specified encoding', async () => {
    const filePath = path.join(tmpDir, 'encoded.txt');
    await fsPromises.writeFile(filePath, 'encoded content', 'utf-8');

    const tool = createReadFileTool(tmpDir);
    const result = await tool.execute({ path: 'encoded.txt', encoding: 'utf-8' });
    const output = result as { content: string };

    expect(output.content).toBe('encoded content');
  });

  it('should read files in subdirectories', async () => {
    const subDir = path.join(tmpDir, 'sub', 'deep');
    await fsPromises.mkdir(subDir, { recursive: true });
    await fsPromises.writeFile(path.join(subDir, 'nested.txt'), 'nested', 'utf-8');

    const tool = createReadFileTool(tmpDir);
    const result = await tool.execute({ path: 'sub/deep/nested.txt' });
    const output = result as { content: string };

    expect(output.content).toBe('nested');
  });

  it('should throw ToolExecutionError for non-existent file', async () => {
    const tool = createReadFileTool(tmpDir);

    await expect(tool.execute({ path: 'missing.txt' })).rejects.toThrow(ToolExecutionError);
    await expect(tool.execute({ path: 'missing.txt' })).rejects.toThrow('File not found');
  });

  it('should throw ToolExecutionError for directory path', async () => {
    const subDir = path.join(tmpDir, 'adir');
    await fsPromises.mkdir(subDir);

    const tool = createReadFileTool(tmpDir);

    await expect(tool.execute({ path: 'adir' })).rejects.toThrow(ToolExecutionError);
    await expect(tool.execute({ path: 'adir' })).rejects.toThrow('not a file');
  });

  it('should throw ToolExecutionError for empty path', async () => {
    const tool = createReadFileTool(tmpDir);

    await expect(tool.execute({ path: '' })).rejects.toThrow(ToolExecutionError);
  });

  it('should throw ToolExecutionError for non-string path', async () => {
    const tool = createReadFileTool(tmpDir);

    await expect(tool.execute({ path: 123 })).rejects.toThrow(ToolExecutionError);
  });

  it('should reject path traversal outside base directory', async () => {
    const tool = createReadFileTool(tmpDir);

    await expect(tool.execute({ path: '../../etc/passwd' })).rejects.toThrow(ToolExecutionError);
    await expect(tool.execute({ path: '../../etc/passwd' })).rejects.toThrow(
      'outside the allowed base directory',
    );
  });

  it('should throw ToolExecutionError for file exceeding MAX_READ_SIZE', async () => {
    // Create a file slightly over the limit using a sparse approach
    const filePath = path.join(tmpDir, 'large.bin');
    const handle = await fsPromises.open(filePath, 'w');
    await handle.truncate(MAX_READ_SIZE + 1);
    await handle.close();

    const tool = createReadFileTool(tmpDir);

    await expect(tool.execute({ path: 'large.bin' })).rejects.toThrow(ToolExecutionError);
    await expect(tool.execute({ path: 'large.bin' })).rejects.toThrow('exceeds maximum');
  });

  it('should handle empty files', async () => {
    await fsPromises.writeFile(path.join(tmpDir, 'empty.txt'), '', 'utf-8');

    const tool = createReadFileTool(tmpDir);
    const result = await tool.execute({ path: 'empty.txt' });
    const output = result as { content: string; size: number };

    expect(output.content).toBe('');
    expect(output.size).toBe(0);
  });

  it('should handle unicode content', async () => {
    const unicode = '日本語テスト 🎉 émojis';
    await fsPromises.writeFile(path.join(tmpDir, 'unicode.txt'), unicode, 'utf-8');

    const tool = createReadFileTool(tmpDir);
    const result = await tool.execute({ path: 'unicode.txt' });
    const output = result as { content: string };

    expect(output.content).toBe(unicode);
  });
});
