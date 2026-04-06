/**
 * Built-in web tools — fetch URLs, parse HTML, and search the web.
 *
 * @packageDocumentation
 */

import type { WebTools, WebToolsOptions } from './types.js';

export { createFetchUrlTool } from './fetch-url.js';
export type { FetchUrlToolOptions } from './fetch-url.js';

export {
  createParseHtmlTool,
  decodeHtmlEntities,
  extractLinks,
  extractMetadata,
  extractTitle,
  stripTags,
} from './parse-html.js';

export { createWebSearchTool } from './web-search.js';
export type { WebSearchToolOptions } from './web-search.js';

export { FetchUrlInputSchema, ParseHtmlInputSchema, WebSearchInputSchema } from './schemas.js';

export {
  DEFAULT_MAX_RESULTS,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_USER_AGENT,
  HARD_MAX_RESULTS,
  MAX_RESPONSE_SIZE,
} from './types.js';
export type {
  ExtractedLink,
  FetchUrlInput,
  FetchUrlOutput,
  HtmlMetadata,
  ParseHtmlInput,
  ParseHtmlOutput,
  SearchResult,
  WebSearchInput,
  WebSearchOutput,
  WebTools,
  WebToolsOptions,
} from './types.js';

// ---------------------------------------------------------------------------
// Re-imported for the factory below
// ---------------------------------------------------------------------------
import { createFetchUrlTool } from './fetch-url.js';
import { createParseHtmlTool } from './parse-html.js';
import { createWebSearchTool } from './web-search.js';

/**
 * Create all three web tools (`fetchUrl`, `parseHtml`, `webSearch`) as a
 * convenient bundle.
 *
 * @param options - Optional configuration
 * @returns A {@link WebTools} object
 *
 * @example
 * ```typescript
 * const tools = createWebTools();
 * registry.register(tools.fetchUrl);
 * registry.register(tools.parseHtml);
 * registry.register(tools.webSearch);
 * ```
 */
export function createWebTools(options?: WebToolsOptions): WebTools {
  return {
    fetchUrl: createFetchUrlTool(options),
    parseHtml: createParseHtmlTool(),
    webSearch: createWebSearchTool(options),
  };
}
