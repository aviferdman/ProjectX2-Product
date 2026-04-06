import * as fsPromises from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ToolExecutionError } from '../../../../src/errors/tool-errors.js';
import { createWriteFileTool } from '../../../../src/tools/file/write-file.js';
import { MAX_WRITE_SIZE } from '../../../../src/tools/file/types.js';
import { ToolCategory, ToolPermission } from '../../../../src/types/tool.js';

describe('createWriteFileTool', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'crewspace-writefile-'));
  });

  afterEach(async () => {
    await fsPromises.rm(tmpDir, { recursive: true, force: true });
  });

  it('should create a tool with correct metadata', () => {
    const tool = createWriteFileTool(tmpDir);
    expect(tool.name).toBe('writeFile');
    expect(tool.description).toContain('Write');
    expect(tool.category).toBe(ToolCategory.FILE);
    expect(tool.permissions).toEqual([ToolPermission.FILE_WRITE]);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('should write a new file', async () => {
    const tool = createWriteFileTool(tmpDir);
    const result = await tool.execute({ path: 'new.txt', content: 'hello world' });
    const output = result as { path: string; size: number; created: boolean };

    expect(output.created).toBe(true);
    expect(output.size).toBe(Buffer.byteLength('hello world', 'utf-8'));
    expect(output.path).toBe(path.join(tmpDir, 'new.txt'));

    const written = await fsPromises.readFile(path.join(tmpDir, 'new.txt'), 'utf-8');
    expect(written).toBe('hello world');
  });

  it('should overwrite an existing file', async () => {
    const filePath = path.join(tmpDir, 'existing.txt');
    await fsPromises.writeFile(filePath, 'old content', 'utf-8');

    const tool = createWriteFileTool(tmpDir);
    const result = await tool.execute({ path: 'existing.txt', content: 'new content' });
    const output = result as { created: boolean };

    expect(output.created).toBe(false);

    const written = await fsPromises.readFile(filePath, 'utf-8');
    expect(written).toBe('new content');
  });

  it('should create directories when createDirectories is true', async () => {
    const tool = createWriteFileTool(tmpDir);
    const result = await tool.execute({
      path: 'deep/nested/dir/file.txt',
      content: 'deep content',
      createDirectories: true,
    });
    const output = result as { path: string; created: boolean };

    expect(output.created).toBe(true);

    const written = await fsPromises.readFile(
      path.join(tmpDir, 'deep', 'nested', 'dir', 'file.txt'),
      'utf-8',
    );
    expect(written).toBe('deep content');
  });

  it('should throw when parent directory is missing and createDirectories is false', async () => {
    const tool = createWriteFileTool(tmpDir);

    await expect(
      tool.execute({ path: 'missing-dir/file.txt', content: 'content' }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it('should throw ToolExecutionError for empty path', async () => {
    const tool = createWriteFileTool(tmpDir);

    await expect(tool.execute({ path: '', content: 'hi' })).rejects.toThrow(ToolExecutionError);
  });

  it('should throw ToolExecutionError for non-string path', async () => {
    const tool = createWriteFileTool(tmpDir);

    await expect(tool.execute({ path: 42, content: 'hi' })).rejects.toThrow(ToolExecutionError);
  });

  it('should throw ToolExecutionError for non-string content', async () => {
    const tool = createWriteFileTool(tmpDir);

    await expect(tool.execute({ path: 'file.txt', content: 123 })).rejects.toThrow(
      ToolExecutionError,
    );
  });

  it('should reject path traversal outside base directory', async () => {
    const tool = createWriteFileTool(tmpDir);

    await expect(
      tool.execute({ path: '../../escape.txt', content: 'bad' }),
    ).rejects.toThrow(ToolExecutionError);
    await expect(
      tool.execute({ path: '../../escape.txt', content: 'bad' }),
    ).rejects.toThrow('outside the allowed base directory');
  });

  it('should reject content exceeding MAX_WRITE_SIZE', async () => {
    const tool = createWriteFileTool(tmpDir);
    const largeContent = 'x'.repeat(MAX_WRITE_SIZE + 1);

    await expect(
      tool.execute({ path: 'large.txt', content: largeContent }),
    ).rejects.toThrow(ToolExecutionError);
    await expect(
      tool.execute({ path: 'large.txt', content: largeContent }),
    ).rejects.toThrow('exceeds maximum');
  });

  it('should handle empty content', async () => {
    const tool = createWriteFileTool(tmpDir);
    const result = await tool.execute({ path: 'empty.txt', content: '' });
    const output = result as { size: number; created: boolean };

    expect(output.size).toBe(0);
    expect(output.created).toBe(true);

    const written = await fsPromises.readFile(path.join(tmpDir, 'empty.txt'), 'utf-8');
    expect(written).toBe('');
  });

  it('should handle unicode content', async () => {
    const unicode = '日本語テスト 🎉 émojis';
    const tool = createWriteFileTool(tmpDir);
    const result = await tool.execute({ path: 'unicode.txt', content: unicode });
    const output = result as { size: number };

    expect(output.size).toBe(Buffer.byteLength(unicode, 'utf-8'));

    const written = await fsPromises.readFile(path.join(tmpDir, 'unicode.txt'), 'utf-8');
    expect(written).toBe(unicode);
  });

  it('should write to absolute path inside base directory', async () => {
    const absPath = path.join(tmpDir, 'absolute.txt');
    const tool = createWriteFileTool(tmpDir);
    const result = await tool.execute({ path: absPath, content: 'abs' });
    const output = result as { path: string };

    expect(output.path).toBe(absPath);
  });
});
