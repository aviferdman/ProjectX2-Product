import { describe, expect, it } from 'vitest';

import { ToolExecutionError } from '../../../../src/errors/tool-errors.js';
import { createFetchUrlTool } from '../../../../src/tools/web/fetch-url.js';
import { ToolCategory, ToolPermission } from '../../../../src/types/tool.js';

describe('createFetchUrlTool', () => {
  it('should create a tool with correct metadata', () => {
    const tool = createFetchUrlTool();
    expect(tool.name).toBe('fetchUrl');
    expect(tool.description).toContain('Fetch');
    expect(tool.category).toBe(ToolCategory.WEB);
    expect(tool.permissions).toEqual([ToolPermission.NETWORK]);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('should accept custom options', () => {
    const tool = createFetchUrlTool({ userAgent: 'TestAgent/1.0', timeoutMs: 5000 });
    expect(tool.name).toBe('fetchUrl');
  });

  it('should throw on empty url', async () => {
    const tool = createFetchUrlTool();
    await expect(tool.execute({ url: '' })).rejects.toThrow(ToolExecutionError);
    await expect(tool.execute({ url: '' })).rejects.toThrow('non-empty string');
  });

  it('should throw on missing url', async () => {
    const tool = createFetchUrlTool();
    await expect(tool.execute({})).rejects.toThrow(ToolExecutionError);
  });

  it('should throw on non-string url', async () => {
    const tool = createFetchUrlTool();
    await expect(tool.execute({ url: 123 })).rejects.toThrow(ToolExecutionError);
  });

  it('should throw on invalid URL', async () => {
    const tool = createFetchUrlTool();
    await expect(tool.execute({ url: 'not-a-url' })).rejects.toThrow('Invalid URL');
  });

  it('should throw on disallowed protocol', async () => {
    const tool = createFetchUrlTool();
    await expect(tool.execute({ url: 'ftp://example.com' })).rejects.toThrow('Unsupported protocol');
  });

  it('should reject file:// protocol', async () => {
    const tool = createFetchUrlTool();
    await expect(tool.execute({ url: 'file:///etc/passwd' })).rejects.toThrow('Unsupported protocol');
  });

  it('should handle timeout via AbortController', async () => {
    const tool = createFetchUrlTool({ timeoutMs: 1 });
    // Very short timeout should cause abort
    await expect(
      tool.execute({ url: 'https://httpbin.org/delay/10', timeoutMs: 1 }),
    ).rejects.toThrow(ToolExecutionError);
  });
});
