import * as fsPromises from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createFileTools } from '../../../../src/tools/file/index.js';
import type { FileTools } from '../../../../src/tools/file/types.js';
import { ToolCategory, ToolPermission } from '../../../../src/types/tool.js';

describe('createFileTools', () => {
  let tmpDir: string;
  let tools: FileTools;

  beforeEach(async () => {
    tmpDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'crewspace-filetools-'));
    tools = createFileTools({ basePath: tmpDir });
  });

  afterEach(async () => {
    await fsPromises.rm(tmpDir, { recursive: true, force: true });
  });

  it('should create all three file tools', () => {
    expect(tools.readFile).toBeDefined();
    expect(tools.writeFile).toBeDefined();
    expect(tools.listFiles).toBeDefined();
  });

  it('should create tools with correct names', () => {
    expect(tools.readFile.name).toBe('readFile');
    expect(tools.writeFile.name).toBe('writeFile');
    expect(tools.listFiles.name).toBe('listFiles');
  });

  it('should create tools in the FILE category', () => {
    expect(tools.readFile.category).toBe(ToolCategory.FILE);
    expect(tools.writeFile.category).toBe(ToolCategory.FILE);
    expect(tools.listFiles.category).toBe(ToolCategory.FILE);
  });

  it('should set correct permissions', () => {
    expect(tools.readFile.permissions).toEqual([ToolPermission.FILE_READ]);
    expect(tools.writeFile.permissions).toEqual([ToolPermission.FILE_WRITE]);
    expect(tools.listFiles.permissions).toEqual([ToolPermission.FILE_READ]);
  });

  it('should default basePath to cwd when options are omitted', () => {
    const defaultTools = createFileTools();
    expect(defaultTools.readFile).toBeDefined();
    expect(defaultTools.writeFile).toBeDefined();
    expect(defaultTools.listFiles).toBeDefined();
  });

  it('should perform a full write-read-list roundtrip', async () => {
    // Write a file
    const writeResult = await tools.writeFile.execute({
      path: 'roundtrip.txt',
      content: 'round trip data',
    });
    const writeOutput = writeResult as { created: boolean; path: string };
    expect(writeOutput.created).toBe(true);

    // Read the file back
    const readResult = await tools.readFile.execute({ path: 'roundtrip.txt' });
    const readOutput = readResult as { content: string };
    expect(readOutput.content).toBe('round trip data');

    // List the directory
    const listResult = await tools.listFiles.execute({ path: '.' });
    const listOutput = listResult as { entries: Array<{ name: string }> };
    const names = listOutput.entries.map((e) => e.name);
    expect(names).toContain('roundtrip.txt');
  });

  it('should write to nested dirs and list recursively', async () => {
    await tools.writeFile.execute({
      path: 'a/b/deep.txt',
      content: 'deep file',
      createDirectories: true,
    });

    const listResult = await tools.listFiles.execute({
      path: '.',
      recursive: true,
      pattern: '*.txt',
    });
    const listOutput = listResult as { entries: Array<{ name: string }> };
    const names = listOutput.entries.map((e) => e.name);
    expect(names).toContain('deep.txt');
  });

  it('should overwrite file and report created=false', async () => {
    await tools.writeFile.execute({ path: 'overwrite.txt', content: 'v1' });

    const result = await tools.writeFile.execute({ path: 'overwrite.txt', content: 'v2' });
    const output = result as { created: boolean };
    expect(output.created).toBe(false);

    const readResult = await tools.readFile.execute({ path: 'overwrite.txt' });
    const readOutput = readResult as { content: string };
    expect(readOutput.content).toBe('v2');
  });
});
