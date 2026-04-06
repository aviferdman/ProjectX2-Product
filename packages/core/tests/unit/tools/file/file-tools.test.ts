/**
 * Unit tests for the createFileTools factory.
 */

import * as fsPromises from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createFileTools } from '../../../../src/tools/file/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'crewspace-filetools-'));
});

afterEach(async () => {
  await fsPromises.rm(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createFileTools', () => {
  it('should return all three file tools', () => {
    const tools = createFileTools({ basePath: tmpDir });
    expect(tools.readFile).toBeDefined();
    expect(tools.readFile.name).toBe('readFile');
    expect(tools.writeFile).toBeDefined();
    expect(tools.writeFile.name).toBe('writeFile');
    expect(tools.listFiles).toBeDefined();
    expect(tools.listFiles.name).toBe('listFiles');
  });

  it('should work with default basePath (process.cwd)', () => {
    const tools = createFileTools();
    expect(tools.readFile).toBeDefined();
    expect(tools.writeFile).toBeDefined();
    expect(tools.listFiles).toBeDefined();
  });

  it('should create functional tools that can interoperate', async () => {
    const tools = createFileTools({ basePath: tmpDir });

    // Write a file
    await tools.writeFile.execute({ path: 'interop.txt', content: 'test data' });

    // Read it back
    const readResult = (await tools.readFile.execute({ path: 'interop.txt' })) as {
      content: string;
    };
    expect(readResult.content).toBe('test data');

    // List the directory
    const listResult = (await tools.listFiles.execute({ path: '.' })) as {
      entries: { name: string }[];
    };
    expect(listResult.entries.some((e) => e.name === 'interop.txt')).toBe(true);
  });
});
