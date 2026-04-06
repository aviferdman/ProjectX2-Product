/**
 * Built-in file tools — read, write, and list files.
 *
 * @packageDocumentation
 */

import * as path from 'node:path';

import type { FileTools, FileToolsOptions } from './types.js';

export { createListFilesTool, matchesPattern } from './list-files.js';
export { createReadFileTool } from './read-file.js';
export { createWriteFileTool } from './write-file.js';
export {
  DEFAULT_MAX_ENTRIES,
  HARD_MAX_ENTRIES,
  MAX_READ_SIZE,
  MAX_WRITE_SIZE,
} from './types.js';
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
} from './types.js';

// ---------------------------------------------------------------------------
// Re-imported for the factory below (avoid circular barrel issues)
// ---------------------------------------------------------------------------
import { createListFilesTool } from './list-files.js';
import { createReadFileTool } from './read-file.js';
import { createWriteFileTool } from './write-file.js';

/**
 * Create all three file tools (`readFile`, `writeFile`, `listFiles`) as a
 * convenient bundle.
 *
 * @param options - Optional configuration (base path)
 * @returns A {@link FileTools} object
 *
 * @example
 * ```typescript
 * const tools = createFileTools({ basePath: '/workspace/project' });
 * registry.register(tools.readFile);
 * registry.register(tools.writeFile);
 * registry.register(tools.listFiles);
 * ```
 */
export function createFileTools(options?: FileToolsOptions): FileTools {
  const basePath = path.resolve(options?.basePath ?? process.cwd());

  return {
    readFile: createReadFileTool(basePath),
    writeFile: createWriteFileTool(basePath),
    listFiles: createListFilesTool(basePath),
  };
}
