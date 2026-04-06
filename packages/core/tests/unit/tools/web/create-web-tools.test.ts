import { describe, expect, it } from 'vitest';

import { createFetchUrlTool } from '../../../../src/tools/web/fetch-url.js';
import { createParseHtmlTool } from '../../../../src/tools/web/parse-html.js';
import { createWebSearchTool } from '../../../../src/tools/web/web-search.js';
import { createWebTools } from '../../../../src/tools/web/index.js';
import {
  DEFAULT_MAX_RESULTS,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_USER_AGENT,
  HARD_MAX_RESULTS,
  MAX_RESPONSE_SIZE,
} from '../../../../src/tools/web/types.js';
import type { WebTools } from '../../../../src/tools/web/types.js';

describe('web tools constants', () => {
  it('should have correct default timeout', () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(30_000);
  });

  it('should have correct max response size', () => {
    expect(MAX_RESPONSE_SIZE).toBe(5 * 1024 * 1024);
  });

  it('should have correct default max results', () => {
    expect(DEFAULT_MAX_RESULTS).toBe(10);
  });

  it('should have correct hard max results', () => {
    expect(HARD_MAX_RESULTS).toBe(50);
  });

  it('should have correct default user agent', () => {
    expect(DEFAULT_USER_AGENT).toContain('Crewspace');
  });
});

describe('createWebTools factory', () => {
  it('should create all three tools', () => {
    const tools: WebTools = createWebTools();
    expect(tools.fetchUrl).toBeDefined();
    expect(tools.fetchUrl.name).toBe('fetchUrl');
    expect(tools.parseHtml).toBeDefined();
    expect(tools.parseHtml.name).toBe('parseHtml');
    expect(tools.webSearch).toBeDefined();
    expect(tools.webSearch.name).toBe('webSearch');
  });

  it('should create tools with default options', () => {
    const tools = createWebTools();
    expect(tools.fetchUrl.name).toBe('fetchUrl');
    expect(tools.parseHtml.name).toBe('parseHtml');
    expect(tools.webSearch.name).toBe('webSearch');
  });

  it('should create tools with custom options', () => {
    const tools = createWebTools({
      userAgent: 'Custom/1.0',
      timeoutMs: 10000,
    });
    expect(tools.fetchUrl.name).toBe('fetchUrl');
    expect(tools.parseHtml.name).toBe('parseHtml');
    expect(tools.webSearch.name).toBe('webSearch');
  });

  it('should create independent tools', () => {
    const fetchUrl = createFetchUrlTool();
    const parseHtml = createParseHtmlTool();
    const webSearch = createWebSearchTool();

    expect(fetchUrl.name).toBe('fetchUrl');
    expect(parseHtml.name).toBe('parseHtml');
    expect(webSearch.name).toBe('webSearch');
  });
});

describe('web tools module exports', () => {
  it('should export all factory functions', () => {
    expect(typeof createFetchUrlTool).toBe('function');
    expect(typeof createParseHtmlTool).toBe('function');
    expect(typeof createWebSearchTool).toBe('function');
    expect(typeof createWebTools).toBe('function');
  });

  it('should export all constants', () => {
    expect(typeof DEFAULT_TIMEOUT_MS).toBe('number');
    expect(typeof MAX_RESPONSE_SIZE).toBe('number');
    expect(typeof DEFAULT_MAX_RESULTS).toBe('number');
    expect(typeof HARD_MAX_RESULTS).toBe('number');
    expect(typeof DEFAULT_USER_AGENT).toBe('string');
  });
});
