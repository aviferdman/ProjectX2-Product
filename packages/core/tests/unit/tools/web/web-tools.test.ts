import { describe, expect, it } from 'vitest';

import { createWebTools } from '../../../../src/tools/web/index.js';

describe('createWebTools', () => {
  it('should create all three web tools', () => {
    const tools = createWebTools();
    expect(tools.fetchUrl).toBeDefined();
    expect(tools.parseHtml).toBeDefined();
    expect(tools.webSearch).toBeDefined();
  });

  it('should create fetchUrl tool with correct name', () => {
    const tools = createWebTools();
    expect(tools.fetchUrl.name).toBe('fetchUrl');
  });

  it('should create parseHtml tool with correct name', () => {
    const tools = createWebTools();
    expect(tools.parseHtml.name).toBe('parseHtml');
  });

  it('should create webSearch tool with correct name', () => {
    const tools = createWebTools();
    expect(tools.webSearch.name).toBe('webSearch');
  });

  it('should pass options through to sub-tools', () => {
    const tools = createWebTools({
      userAgent: 'CustomAgent/1.0',
      timeoutMs: 5000,
    });

    // Tools should still be created successfully with options
    expect(tools.fetchUrl).toBeDefined();
    expect(tools.parseHtml).toBeDefined();
    expect(tools.webSearch).toBeDefined();
  });

  it('should work with no options', () => {
    const tools = createWebTools();
    expect(tools.fetchUrl).toBeDefined();
  });

  it('should work with empty options', () => {
    const tools = createWebTools({});
    expect(tools.fetchUrl).toBeDefined();
  });
});
