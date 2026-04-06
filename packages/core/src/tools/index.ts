/**
 * Built-in tools module — batteries-included tools for common agent operations.
 *
 * @packageDocumentation
 */

export {
  createFileTools,
  createListFilesTool,
  createReadFileTool,
  createWriteFileTool,
  DEFAULT_MAX_ENTRIES,
  HARD_MAX_ENTRIES,
  ListFilesInputSchema,
  matchesPattern,
  MAX_READ_SIZE,
  MAX_WRITE_SIZE,
  ReadFileInputSchema,
  WriteFileInputSchema,
} from './file/index.js';

export type {
  FileEntry,
  FileTools,
  FileToolsOptions,
  ListFilesInput,
  ListFilesOutput,
  ReadFileInput,
  ReadFileOutput,
  WriteFileInput,
  WriteFileOutput,
} from './file/index.js';

export {
  createFetchUrlTool,
  createParseHtmlTool,
  createWebSearchTool,
  createWebTools,
  decodeHtmlEntities,
  DEFAULT_MAX_RESULTS,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_USER_AGENT,
  extractLinks,
  extractMetadata,
  extractTitle,
  FetchUrlInputSchema,
  HARD_MAX_RESULTS,
  MAX_RESPONSE_SIZE,
  ParseHtmlInputSchema,
  stripTags,
  WebSearchInputSchema,
} from './web/index.js';

export type { FetchUrlToolOptions, WebSearchToolOptions } from './web/index.js';

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
} from './web/index.js';
