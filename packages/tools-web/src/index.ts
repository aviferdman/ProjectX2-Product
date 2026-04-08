/**
 * @crewspace/tools-web — Web tools for Crewspace agents.
 *
 * Provides URL fetching, HTML parsing, and web search capabilities.
 * This is a standalone package that re-exports web tools from @crewspace/core.
 *
 * @packageDocumentation
 */

// Factory
export { createWebTools } from '@crewspace/core';

// Individual tool creators
export { createFetchUrlTool, createParseHtmlTool, createWebSearchTool } from '@crewspace/core';

// HTML utilities
export {
  stripTags,
  decodeHtmlEntities,
  extractTitle,
  extractLinks,
  extractMetadata,
} from '@crewspace/core';

// Rate limiter
export { RateLimiter, ToolRateLimitError, DEFAULT_RATE_LIMIT } from '@crewspace/core';

// Schemas
export { FetchUrlInputSchema, ParseHtmlInputSchema, WebSearchInputSchema } from '@crewspace/core';

// Constants
export {
  DEFAULT_TIMEOUT_MS,
  DEFAULT_USER_AGENT,
  DEFAULT_MAX_RESULTS,
  HARD_MAX_RESULTS,
  MAX_RESPONSE_SIZE,
} from '@crewspace/core';

// Types
export type {
  WebTools,
  WebToolsOptions,
  FetchUrlInput,
  FetchUrlOutput,
  FetchUrlToolOptions,
  ParseHtmlInput,
  ParseHtmlOutput,
  ExtractedLink,
  HtmlMetadata,
  SearchResult,
  WebSearchInput,
  WebSearchOutput,
  WebSearchToolOptions,
  RateLimiterConfig,
} from '@crewspace/core';
