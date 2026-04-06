/**
 * Type definitions for the built-in web tools.
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default request timeout in milliseconds (30 seconds). */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** Maximum response body size in bytes (5 MB). */
export const MAX_RESPONSE_SIZE = 5 * 1024 * 1024;

/** Default number of search results. */
export const DEFAULT_MAX_RESULTS = 10;

/** Hard upper bound on search results. */
export const HARD_MAX_RESULTS = 50;

/** Default User-Agent header for outbound requests. */
export const DEFAULT_USER_AGENT = 'Crewspace/0.1.0 (Agent Web Tool)';

// ---------------------------------------------------------------------------
// FetchUrl types
// ---------------------------------------------------------------------------

/** Input for the `fetchUrl` tool. */
export interface FetchUrlInput {
  /** URL to fetch (must be http or https). */
  readonly url: string;
  /** HTTP method (default: `'GET'`). */
  readonly method?: 'GET' | 'HEAD';
  /** Additional request headers. */
  readonly headers?: Readonly<Record<string, string>>;
  /** Request timeout in milliseconds. */
  readonly timeoutMs?: number;
  /** Maximum response body size in bytes. */
  readonly maxSize?: number;
}

/** Output returned by the `fetchUrl` tool. */
export interface FetchUrlOutput {
  /** HTTP status code. */
  readonly status: number;
  /** HTTP status text. */
  readonly statusText: string;
  /** Response body as a string. */
  readonly body: string;
  /** Content-Type header value. */
  readonly contentType: string;
  /** Final URL after redirects. */
  readonly url: string;
  /** Response body size in bytes. */
  readonly size: number;
}

// ---------------------------------------------------------------------------
// ParseHtml types
// ---------------------------------------------------------------------------

/** Input for the `parseHtml` tool. */
export interface ParseHtmlInput {
  /** Raw HTML string to parse. */
  readonly html: string;
  /** What to extract from the HTML. */
  readonly extract: 'text' | 'links' | 'metadata';
}

/** A hyperlink extracted from HTML. */
export interface ExtractedLink {
  /** Link text content. */
  readonly text: string;
  /** href attribute value. */
  readonly href: string;
}

/** Metadata extracted from HTML `<head>`. */
export interface HtmlMetadata {
  /** Content of `<title>` element. */
  readonly title: string;
  /** Content of `<meta name="description">`. */
  readonly description: string;
  /** All meta tags as key-value pairs. */
  readonly meta: Readonly<Record<string, string>>;
}

/** Output returned by the `parseHtml` tool. */
export interface ParseHtmlOutput {
  /** Extracted plain text (when `extract` is `'text'`). */
  readonly text?: string;
  /** Extracted links (when `extract` is `'links'`). */
  readonly links?: readonly ExtractedLink[];
  /** Extracted metadata (when `extract` is `'metadata'`). */
  readonly metadata?: HtmlMetadata;
}

// ---------------------------------------------------------------------------
// WebSearch types
// ---------------------------------------------------------------------------

/** Input for the `webSearch` tool. */
export interface WebSearchInput {
  /** Search query string. */
  readonly query: string;
  /** Maximum number of results (default: {@link DEFAULT_MAX_RESULTS}). */
  readonly maxResults?: number;
}

/** A single search result. */
export interface SearchResult {
  /** Result title. */
  readonly title: string;
  /** Result URL. */
  readonly url: string;
  /** Result snippet / description. */
  readonly snippet: string;
}

/** Output returned by the `webSearch` tool. */
export interface WebSearchOutput {
  /** The search query that was executed. */
  readonly query: string;
  /** Search results. */
  readonly results: readonly SearchResult[];
  /** Number of results returned. */
  readonly count: number;
}

// ---------------------------------------------------------------------------
// WebTools factory types
// ---------------------------------------------------------------------------

/** Options for {@link createWebTools}. */
export interface WebToolsOptions {
  /** Default request timeout in milliseconds. */
  readonly timeoutMs?: number;
  /** Default User-Agent header. */
  readonly userAgent?: string;
  /**
   * Rate-limit configuration shared by all web tools in the bundle.
   *
   * When set, all outbound requests (fetchUrl, webSearch) are gated by
   * a shared token-bucket limiter. Set to `false` to disable rate
   * limiting entirely.
   *
   * Default: 30 requests per 60 000 ms.
   */
  readonly rateLimit?: import('./rate-limiter.js').RateLimiterConfig | false;
}

/** Bundle of all web tools created by {@link createWebTools}. */
export interface WebTools {
  /** Fetch a URL and return its content. */
  readonly fetchUrl: import('../../types/tool.js').Tool;
  /** Parse HTML and extract text, links, or metadata. */
  readonly parseHtml: import('../../types/tool.js').Tool;
  /** Search the web using DuckDuckGo. */
  readonly webSearch: import('../../types/tool.js').Tool;
}
