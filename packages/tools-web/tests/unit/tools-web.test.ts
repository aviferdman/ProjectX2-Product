import { describe, it, expect } from 'vitest';
import * as toolsWeb from '../../src/index.js';

describe('@crewspace/tools-web', () => {
  describe('exports', () => {
    it('should export createWebTools factory', () => {
      expect(toolsWeb.createWebTools).toBeDefined();
      expect(typeof toolsWeb.createWebTools).toBe('function');
    });

    it('should export createFetchUrlTool', () => {
      expect(toolsWeb.createFetchUrlTool).toBeDefined();
      expect(typeof toolsWeb.createFetchUrlTool).toBe('function');
    });

    it('should export createParseHtmlTool', () => {
      expect(toolsWeb.createParseHtmlTool).toBeDefined();
      expect(typeof toolsWeb.createParseHtmlTool).toBe('function');
    });

    it('should export createWebSearchTool', () => {
      expect(toolsWeb.createWebSearchTool).toBeDefined();
      expect(typeof toolsWeb.createWebSearchTool).toBe('function');
    });

    it('should export HTML utility functions', () => {
      expect(toolsWeb.stripTags).toBeDefined();
      expect(toolsWeb.decodeHtmlEntities).toBeDefined();
      expect(toolsWeb.extractTitle).toBeDefined();
      expect(toolsWeb.extractLinks).toBeDefined();
      expect(toolsWeb.extractMetadata).toBeDefined();
    });

    it('should export RateLimiter class', () => {
      expect(toolsWeb.RateLimiter).toBeDefined();
      expect(typeof toolsWeb.RateLimiter).toBe('function');
    });

    it('should export ToolRateLimitError', () => {
      expect(toolsWeb.ToolRateLimitError).toBeDefined();
    });

    it('should export Zod schemas', () => {
      expect(toolsWeb.FetchUrlInputSchema).toBeDefined();
      expect(toolsWeb.ParseHtmlInputSchema).toBeDefined();
      expect(toolsWeb.WebSearchInputSchema).toBeDefined();
    });

    it('should export constants', () => {
      expect(toolsWeb.DEFAULT_TIMEOUT_MS).toBeDefined();
      expect(toolsWeb.DEFAULT_USER_AGENT).toBeDefined();
      expect(toolsWeb.DEFAULT_MAX_RESULTS).toBeDefined();
      expect(toolsWeb.HARD_MAX_RESULTS).toBeDefined();
      expect(toolsWeb.MAX_RESPONSE_SIZE).toBeDefined();
      expect(toolsWeb.DEFAULT_RATE_LIMIT).toBeDefined();
    });
  });

  describe('createWebTools', () => {
    it('should return an object with fetchUrl, parseHtml, and webSearch tools', () => {
      const tools = toolsWeb.createWebTools();

      expect(tools).toBeDefined();
      expect(tools.fetchUrl).toBeDefined();
      expect(tools.parseHtml).toBeDefined();
      expect(tools.webSearch).toBeDefined();
    });

    it('should accept options to disable rate limiting', () => {
      const tools = toolsWeb.createWebTools({ rateLimit: false });

      expect(tools.fetchUrl).toBeDefined();
      expect(tools.parseHtml).toBeDefined();
      expect(tools.webSearch).toBeDefined();
    });

    it('should create tools with name properties', () => {
      const tools = toolsWeb.createWebTools();

      expect(tools.fetchUrl.name).toBe('fetchUrl');
      expect(tools.parseHtml.name).toBe('parseHtml');
      expect(tools.webSearch.name).toBe('webSearch');
    });
  });

  describe('HTML utilities', () => {
    it('stripTags should remove HTML tags', () => {
      expect(toolsWeb.stripTags('<p>Hello <b>world</b></p>')).toBe('Hello world');
    });

    it('decodeHtmlEntities should decode entities', () => {
      expect(toolsWeb.decodeHtmlEntities('&amp;')).toBe('&');
      expect(toolsWeb.decodeHtmlEntities('&lt;')).toBe('<');
      expect(toolsWeb.decodeHtmlEntities('&gt;')).toBe('>');
    });

    it('extractTitle should extract title from HTML', () => {
      expect(toolsWeb.extractTitle('<title>My Page</title>')).toBe('My Page');
    });

    it('extractLinks should extract anchor links', () => {
      const links = toolsWeb.extractLinks('<a href="/about">About</a><a href="/help">Help</a>');
      expect(links).toHaveLength(2);
      expect(links[0]?.href).toBe('/about');
      expect(links[1]?.href).toBe('/help');
    });
  });

  describe('RateLimiter', () => {
    it('should construct with default config', () => {
      const limiter = new toolsWeb.RateLimiter(toolsWeb.DEFAULT_RATE_LIMIT);
      expect(limiter).toBeDefined();
    });

    it('should allow requests within the limit', () => {
      const limiter = new toolsWeb.RateLimiter({ maxRequests: 5, windowMs: 60_000 });
      expect(() => limiter.consume()).not.toThrow();
    });
  });

  describe('schemas', () => {
    it('should validate FetchUrlInputSchema', () => {
      const valid = toolsWeb.FetchUrlInputSchema.safeParse({ url: 'https://example.com' });
      expect(valid.success).toBe(true);
    });

    it('should reject FetchUrlInputSchema with missing url', () => {
      const invalid = toolsWeb.FetchUrlInputSchema.safeParse({});
      expect(invalid.success).toBe(false);
    });

    it('should validate ParseHtmlInputSchema', () => {
      const valid = toolsWeb.ParseHtmlInputSchema.safeParse({
        html: '<p>Hello</p>',
        extract: 'text',
      });
      expect(valid.success).toBe(true);
    });

    it('should validate WebSearchInputSchema', () => {
      const valid = toolsWeb.WebSearchInputSchema.safeParse({ query: 'test query' });
      expect(valid.success).toBe(true);
    });
  });

  describe('constants', () => {
    it('should have expected constant values', () => {
      expect(toolsWeb.DEFAULT_TIMEOUT_MS).toBe(30_000);
      expect(toolsWeb.DEFAULT_MAX_RESULTS).toBe(10);
      expect(toolsWeb.HARD_MAX_RESULTS).toBe(50);
      expect(toolsWeb.MAX_RESPONSE_SIZE).toBe(5 * 1024 * 1024);
    });
  });
});
