/**
 * Built-in web tools — fetch URLs, parse HTML, and search the web.
 *
 * @packageDocumentation
 */

import type { WebTools, WebToolsOptions } from './types.js';
import { RateLimiter, DEFAULT_RATE_LIMIT } from './rate-limiter.js';

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

export { RateLimiter, ToolRateLimitError, DEFAULT_RATE_LIMIT } from './rate-limiter.js';
export type { RateLimiterConfig } from './rate-limiter.js';

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
 * By default a shared token-bucket rate limiter (30 req / 60 s) is
 * applied to `fetchUrl` and `webSearch`. Pass `rateLimit: false` to
 * disable, or supply a custom {@link RateLimiterConfig}.
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
  const rateLimiter =
    options?.rateLimit === false
      ? undefined
      : new RateLimiter(options?.rateLimit ?? DEFAULT_RATE_LIMIT);

  const shared: Record<string, unknown> = {};
  if (options?.userAgent !== undefined) shared['userAgent'] = options.userAgent;
  if (options?.timeoutMs !== undefined) shared['timeoutMs'] = options.timeoutMs;
  if (rateLimiter !== undefined) shared['rateLimiter'] = rateLimiter;

  return {
    fetchUrl: createFetchUrlTool(shared as import('./fetch-url.js').FetchUrlToolOptions),
    parseHtml: createParseHtmlTool(),
    webSearch: createWebSearchTool(shared as import('./web-search.js').WebSearchToolOptions),
  };
}
