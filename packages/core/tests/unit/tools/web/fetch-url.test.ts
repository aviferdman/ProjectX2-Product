import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { ToolExecutionError } from '../../../../src/errors/tool-errors.js';
import { createFetchUrlTool } from '../../../../src/tools/web/fetch-url.js';
import { MAX_RESPONSE_SIZE } from '../../../../src/tools/web/types.js';
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

  it('should have correct input schema', () => {
    const tool = createFetchUrlTool();
    expect(tool.inputSchema?.properties?.['url']).toBeDefined();
    expect(tool.inputSchema?.properties?.['method']).toBeDefined();
    expect(tool.inputSchema?.properties?.['headers']).toBeDefined();
    expect(tool.inputSchema?.properties?.['timeoutMs']).toBeDefined();
    expect(tool.inputSchema?.required).toContain('url');
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

  it('should throw on data: protocol', async () => {
    const tool = createFetchUrlTool();
    await expect(tool.execute({ url: 'data:text/plain,hello' })).rejects.toThrow('Unsupported protocol');
  });

  it('should handle timeout via AbortController', async () => {
    const tool = createFetchUrlTool({ timeoutMs: 1 });
    await expect(
      tool.execute({ url: 'https://httpbin.org/delay/10', timeoutMs: 1 }),
    ).rejects.toThrow(ToolExecutionError);
  });
});

describe('createFetchUrlTool (mocked fetch)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Reset before each test
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should fetch a URL and return response data', async () => {
    const mockBody = '<html><body>Hello World</body></html>';
    const mockHeaders = { get: (name: string) => name === 'content-type' ? 'text/html; charset=utf-8' : null };
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      url: 'https://example.com/',
      headers: mockHeaders,
      text: () => Promise.resolve(mockBody),
    });

    const tool = createFetchUrlTool();
    const result = (await tool.execute({ url: 'https://example.com' })) as {
      status: number;
      statusText: string;
      body: string;
      contentType: string;
      url: string;
      size: number;
    };

    expect(result.status).toBe(200);
    expect(result.statusText).toBe('OK');
    expect(result.body).toBe(mockBody);
    expect(result.contentType).toBe('text/html; charset=utf-8');
    expect(result.url).toBe('https://example.com/');
    expect(result.size).toBeGreaterThan(0);
  });

  it('should pass custom headers to fetch', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      url: 'https://api.example.com/data',
      headers: { get: () => 'application/json' },
      text: () => Promise.resolve('{"data": "test"}'),
    });

    const tool = createFetchUrlTool();
    await tool.execute({
      url: 'https://api.example.com/data',
      headers: { 'Authorization': 'Bearer test-token', 'Accept': 'application/json' },
    });

    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const requestInit = fetchCall?.[1] as RequestInit | undefined;
    const headers = requestInit?.headers as Record<string, string> | undefined;
    expect(headers?.['Authorization']).toBe('Bearer test-token');
    expect(headers?.['Accept']).toBe('application/json');
  });

  it('should use HEAD method when specified', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      url: 'https://example.com/',
      headers: { get: () => 'text/html' },
      text: () => Promise.resolve(''),
    });

    const tool = createFetchUrlTool();
    await tool.execute({ url: 'https://example.com', method: 'HEAD' });

    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const requestInit = fetchCall?.[1] as RequestInit | undefined;
    expect(requestInit?.method).toBe('HEAD');
  });

  it('should set User-Agent header', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      url: 'https://example.com/',
      headers: { get: () => '' },
      text: () => Promise.resolve(''),
    });

    const tool = createFetchUrlTool({ userAgent: 'CustomBot/2.0' });
    await tool.execute({ url: 'https://example.com' });

    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const requestInit = fetchCall?.[1] as RequestInit | undefined;
    const headers = requestInit?.headers as Record<string, string> | undefined;
    expect(headers?.['User-Agent']).toBe('CustomBot/2.0');
  });

  it('should throw on response body exceeding max size', async () => {
    const largeBody = 'x'.repeat(100);
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      url: 'https://example.com/',
      headers: { get: () => 'text/plain' },
      text: () => Promise.resolve(largeBody),
    });

    const tool = createFetchUrlTool();
    await expect(
      tool.execute({ url: 'https://example.com', maxSize: 10 }),
    ).rejects.toThrow('exceeds maximum');
  });

  it('should handle non-OK HTTP status codes', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 404,
      statusText: 'Not Found',
      url: 'https://example.com/missing',
      headers: { get: () => 'text/html' },
      text: () => Promise.resolve('<h1>Not Found</h1>'),
    });

    const tool = createFetchUrlTool();
    const result = (await tool.execute({ url: 'https://example.com/missing' })) as {
      status: number;
      statusText: string;
    };

    expect(result.status).toBe(404);
    expect(result.statusText).toBe('Not Found');
  });

  it('should handle network errors', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const tool = createFetchUrlTool();
    await expect(tool.execute({ url: 'https://example.com' })).rejects.toThrow(
      'HTTP request failed',
    );
  });

  it('should handle DNS resolution errors', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

    const tool = createFetchUrlTool();
    await expect(tool.execute({ url: 'https://nonexistent.invalid' })).rejects.toThrow(
      ToolExecutionError,
    );
  });

  it('should handle missing content-type header', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      url: 'https://example.com/',
      headers: { get: () => null },
      text: () => Promise.resolve('raw data'),
    });

    const tool = createFetchUrlTool();
    const result = (await tool.execute({ url: 'https://example.com' })) as {
      contentType: string;
    };
    expect(result.contentType).toBe('');
  });

  it('should use per-request timeout override', async () => {
    globalThis.fetch = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      expect(init.signal).toBeDefined();
      return Promise.resolve({
        status: 200,
        statusText: 'OK',
        url: 'https://example.com/',
        headers: { get: () => 'text/html' },
        text: () => Promise.resolve('ok'),
      });
    });

    const tool = createFetchUrlTool({ timeoutMs: 60000 });
    const result = (await tool.execute({
      url: 'https://example.com',
      timeoutMs: 5000,
    })) as { status: number };
    expect(result.status).toBe(200);
  });

  it('should use redirect follow mode', async () => {
    globalThis.fetch = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      expect(init.redirect).toBe('follow');
      return Promise.resolve({
        status: 200,
        statusText: 'OK',
        url: 'https://example.com/final',
        headers: { get: () => 'text/html' },
        text: () => Promise.resolve('redirected'),
      });
    });

    const tool = createFetchUrlTool();
    const result = (await tool.execute({ url: 'https://example.com/redirect' })) as {
      url: string;
    };
    expect(result.url).toBe('https://example.com/final');
  });

  it('should return correct byte size for multi-byte content', async () => {
    const body = 'Hello, 世界!';
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      url: 'https://example.com/',
      headers: { get: () => 'text/plain' },
      text: () => Promise.resolve(body),
    });

    const tool = createFetchUrlTool();
    const result = (await tool.execute({ url: 'https://example.com' })) as {
      size: number;
      body: string;
    };

    expect(result.body).toBe(body);
    expect(result.size).toBe(Buffer.byteLength(body, 'utf-8'));
    expect(result.size).toBeGreaterThan(body.length);
  });

  it('should report MAX_RESPONSE_SIZE constant correctly', () => {
    expect(MAX_RESPONSE_SIZE).toBe(5 * 1024 * 1024);
  });
});
