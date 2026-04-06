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
  matchesPattern,
  MAX_READ_SIZE,
  MAX_WRITE_SIZE,
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
  HARD_MAX_RESULTS,
  MAX_RESPONSE_SIZE,
  stripTags,
} from './web/index.js';

export type {
  FetchUrlToolOptions,
  WebSearchToolOptions,
} from './web/index.js';

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

export {
  createExecCommandTool,
  createShellTools,
  DEFAULT_TIMEOUT_MS as SHELL_DEFAULT_TIMEOUT_MS,
  DENIED_COMMANDS,
  MAX_OUTPUT_SIZE,
  MAX_TIMEOUT_MS,
} from './shell/index.js';

export type {
  ExecCommandInput,
  ExecCommandOutput,
  ShellTools,
  ShellToolsOptions,
} from './shell/index.js';
