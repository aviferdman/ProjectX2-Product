import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { ToolExecutionError } from '../../../../src/errors/tool-errors.js';
import { createWebSearchTool } from '../../../../src/tools/web/web-search.js';
import { ToolCategory, ToolPermission } from '../../../../src/types/tool.js';

describe('createWebSearchTool', () => {
  it('should create a tool with correct metadata', () => {
    const tool = createWebSearchTool();
    expect(tool.name).toBe('webSearch');
    expect(tool.description).toContain('Search');
    expect(tool.category).toBe(ToolCategory.WEB);
    expect(tool.permissions).toEqual([ToolPermission.NETWORK]);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('should accept custom options', () => {
    const tool = createWebSearchTool({ userAgent: 'Test/1.0', timeoutMs: 5000 });
    expect(tool.name).toBe('webSearch');
  });

  it('should throw on empty query', async () => {
    const tool = createWebSearchTool();
    await expect(tool.execute({ query: '' })).rejects.toThrow(ToolExecutionError);
    await expect(tool.execute({ query: '' })).rejects.toThrow('non-empty string');
  });

  it('should throw on missing query', async () => {
    const tool = createWebSearchTool();
    await expect(tool.execute({})).rejects.toThrow(ToolExecutionError);
  });

  it('should throw on non-string query', async () => {
    const tool = createWebSearchTool();
    await expect(tool.execute({ query: 42 })).rejects.toThrow(ToolExecutionError);
  });
});

describe('createWebSearchTool (mocked fetch)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Reset fetch mock before each test
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should return results from DuckDuckGo API', async () => {
    const mockResponse = {
      Abstract: '',
      AbstractText: '',
      Heading: 'TypeScript',
      RelatedTopics: [
        {
          Text: 'TypeScript is a programming language',
          FirstURL: 'https://www.typescriptlang.org/',
          Result: '<a href="https://www.typescriptlang.org/">TypeScript</a>TypeScript is a programming language',
        },
        {
          Text: 'TypeScript documentation',
          FirstURL: 'https://www.typescriptlang.org/docs/',
          Result: '<a href="https://www.typescriptlang.org/docs/">TS Docs</a>TypeScript documentation',
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const tool = createWebSearchTool();
    const result = (await tool.execute({ query: 'typescript' })) as {
      query: string;
      results: Array<{ title: string; url: string; snippet: string }>;
      count: number;
    };

    expect(result.query).toBe('typescript');
    expect(result.results).toHaveLength(2);
    expect(result.results[0]?.title).toBe('TypeScript');
    expect(result.results[0]?.url).toBe('https://www.typescriptlang.org/');
    expect(result.results[0]?.snippet).toBe('TypeScript is a programming language');
    expect(result.count).toBe(2);
  });

  it('should include abstract as first result when available', async () => {
    const mockResponse = {
      AbstractText: 'TypeScript is a typed superset of JavaScript.',
      AbstractURL: 'https://en.wikipedia.org/wiki/TypeScript',
      AbstractSource: 'Wikipedia',
      Heading: 'TypeScript',
      RelatedTopics: [
        {
          Text: 'A related topic',
          FirstURL: 'https://example.com/related',
          Result: '<a>Related</a>A related topic',
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const tool = createWebSearchTool();
    const result = (await tool.execute({ query: 'typescript' })) as {
      results: Array<{ title: string; url: string; snippet: string }>;
      count: number;
    };

    expect(result.results[0]?.title).toBe('TypeScript');
    expect(result.results[0]?.url).toBe('https://en.wikipedia.org/wiki/TypeScript');
    expect(result.results[0]?.snippet).toBe('TypeScript is a typed superset of JavaScript.');
    expect(result.count).toBe(2);
  });

  it('should handle nested topic groups', async () => {
    const mockResponse = {
      RelatedTopics: [
        {
          Name: 'Category',
          Topics: [
            {
              Text: 'Nested result',
              FirstURL: 'https://example.com/nested',
              Result: '<a>Nested</a>Nested result',
            },
          ],
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const tool = createWebSearchTool();
    const result = (await tool.execute({ query: 'test' })) as {
      results: Array<{ title: string }>;
    };

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.title).toBe('Nested');
  });

  it('should limit results to maxResults', async () => {
    const topics = Array.from({ length: 20 }, (_, i) => ({
      Text: `Result ${String(i)}`,
      FirstURL: `https://example.com/${String(i)}`,
      Result: `<a>R${String(i)}</a>Result ${String(i)}`,
    }));

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ RelatedTopics: topics }),
    });

    const tool = createWebSearchTool();
    const result = (await tool.execute({ query: 'test', maxResults: 5 })) as {
      results: unknown[];
      count: number;
    };

    expect(result.results).toHaveLength(5);
    expect(result.count).toBe(5);
  });

  it('should handle empty results', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ RelatedTopics: [] }),
    });

    const tool = createWebSearchTool();
    const result = (await tool.execute({ query: 'xyznotfound123' })) as {
      results: unknown[];
      count: number;
    };

    expect(result.results).toHaveLength(0);
    expect(result.count).toBe(0);
  });

  it('should throw on non-OK response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });

    const tool = createWebSearchTool();
    await expect(tool.execute({ query: 'test' })).rejects.toThrow('status 503');
  });

  it('should throw on network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const tool = createWebSearchTool();
    await expect(tool.execute({ query: 'test' })).rejects.toThrow('Web search failed');
  });

  it('should clamp maxResults to valid range', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ RelatedTopics: [] }),
    });

    const tool = createWebSearchTool();

    // maxResults: 0 should be clamped to 1
    const result = (await tool.execute({ query: 'test', maxResults: 0 })) as {
      results: unknown[];
    };
    expect(result.results).toHaveLength(0); // No results available but limit is valid
  });

  it('should handle timeout via AbortController', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('The operation was aborted'));

    const tool = createWebSearchTool({ timeoutMs: 100 });
    await expect(tool.execute({ query: 'test' })).rejects.toThrow('Search timed out');
  });

  it('should handle abort signal with "abort" keyword', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('abort'));

    const tool = createWebSearchTool();
    await expect(tool.execute({ query: 'test' })).rejects.toThrow('Search timed out');
  });

  it('should handle non-Error rejection', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue('string error');

    const tool = createWebSearchTool();
    await expect(tool.execute({ query: 'test' })).rejects.toThrow('Web search failed');
  });

  it('should handle response with undefined RelatedTopics', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const tool = createWebSearchTool();
    const result = (await tool.execute({ query: 'test' })) as {
      results: unknown[];
      count: number;
    };

    expect(result.results).toHaveLength(0);
    expect(result.count).toBe(0);
  });

  it('should clamp maxResults above HARD_MAX_RESULTS to the limit', async () => {
    const topics = Array.from({ length: 60 }, (_, i) => ({
      Text: `R${String(i)}`,
      FirstURL: `https://example.com/${String(i)}`,
      Result: `<a>R${String(i)}</a>R${String(i)}`,
    }));

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ RelatedTopics: topics }),
    });

    const tool = createWebSearchTool();
    const result = (await tool.execute({ query: 'test', maxResults: 100 })) as {
      results: unknown[];
      count: number;
    };

    // Should be capped at HARD_MAX_RESULTS (50)
    expect(result.results.length).toBeLessThanOrEqual(50);
  });
});
