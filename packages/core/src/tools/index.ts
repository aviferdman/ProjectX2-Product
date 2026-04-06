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
