/**
 * @crewspace/tools-file — File tools for Crewspace agents.
 *
 * Provides read, write, and list file operations with sandbox safety.
 * This is a standalone package that re-exports file tools from @crewspace/core.
 *
 * @packageDocumentation
 */

// Factory
export { createFileTools } from '@crewspace/core';

// Individual tool creators
export { createReadFileTool, createWriteFileTool, createListFilesTool } from '@crewspace/core';

// Utilities
export { matchesPattern } from '@crewspace/core';

// Schemas
export { ReadFileInputSchema, WriteFileInputSchema, ListFilesInputSchema } from '@crewspace/core';

// Constants
export {
  MAX_READ_SIZE,
  MAX_WRITE_SIZE,
  DEFAULT_MAX_ENTRIES,
  HARD_MAX_ENTRIES,
} from '@crewspace/core';

// Types
export type {
  FileTools,
  FileToolsOptions,
  FileEntry,
  ReadFileInput,
  ReadFileOutput,
  WriteFileInput,
  WriteFileOutput,
  ListFilesInput,
  ListFilesOutput,
} from '@crewspace/core';
