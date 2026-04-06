/**
 * Type definitions for the built-in file tools.
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum file size (in bytes) that the read tool will accept. 10 MB. */
export const MAX_READ_SIZE = 10 * 1024 * 1024;

/** Maximum content size (in bytes) that the write tool will accept. 10 MB. */
export const MAX_WRITE_SIZE = 10 * 1024 * 1024;

/** Default maximum number of entries returned by the list tool. */
export const DEFAULT_MAX_ENTRIES = 500;

/** Absolute upper bound on list entries to prevent runaway directory scans. */
export const HARD_MAX_ENTRIES = 10_000;

// ---------------------------------------------------------------------------
// ReadFile types
// ---------------------------------------------------------------------------

/** Input for the `readFile` tool. */
export interface ReadFileInput {
  /** Absolute or relative file path to read. */
  readonly path: string;
  /** Text encoding (default: `'utf-8'`). */
  readonly encoding?: BufferEncoding;
}

/** Output returned by the `readFile` tool. */
export interface ReadFileOutput {
  /** The file content as a string. */
  readonly content: string;
  /** File size in bytes. */
  readonly size: number;
  /** Resolved absolute path. */
  readonly path: string;
}

// ---------------------------------------------------------------------------
// WriteFile types
// ---------------------------------------------------------------------------

/** Input for the `writeFile` tool. */
export interface WriteFileInput {
  /** Absolute or relative file path to write. */
  readonly path: string;
  /** Content to write. */
  readonly content: string;
  /** When `true`, create intermediate directories if they don't exist. Default: `false`. */
  readonly createDirectories?: boolean;
}

/** Output returned by the `writeFile` tool. */
export interface WriteFileOutput {
  /** Resolved absolute path where the file was written. */
  readonly path: string;
  /** Number of bytes written. */
  readonly size: number;
  /** `true` if the file was newly created; `false` if it was overwritten. */
  readonly created: boolean;
}

// ---------------------------------------------------------------------------
// ListFiles types
// ---------------------------------------------------------------------------

/** A single entry in a directory listing. */
export interface FileEntry {
  /** File or directory name (basename). */
  readonly name: string;
  /** Resolved absolute path. */
  readonly path: string;
  /** Entry type. */
  readonly type: 'file' | 'directory';
  /** Size in bytes (`0` for directories). */
  readonly size: number;
}

/** Input for the `listFiles` tool. */
export interface ListFilesInput {
  /** Directory path to list. */
  readonly path: string;
  /** Glob-like pattern to filter entries (e.g. `"*.ts"`). Default: match all. */
  readonly pattern?: string;
  /** When `true`, recurse into subdirectories. Default: `false`. */
  readonly recursive?: boolean;
  /** Maximum number of entries to return. Capped at {@link HARD_MAX_ENTRIES}. */
  readonly maxEntries?: number;
}

/** Output returned by the `listFiles` tool. */
export interface ListFilesOutput {
  /** Directory entries matching the criteria. */
  readonly entries: readonly FileEntry[];
  /** Total number of entries found (may exceed `entries.length` when truncated). */
  readonly total: number;
  /** `true` if the result was truncated to `maxEntries`. */
  readonly truncated: boolean;
}

// ---------------------------------------------------------------------------
// FileTools factory types
// ---------------------------------------------------------------------------

/** Options for {@link createFileTools}. */
export interface FileToolsOptions {
  /**
   * Base directory that restricts all file operations.
   * All paths are resolved relative to this directory, and traversal
   * outside of it is denied. When omitted, `process.cwd()` is used.
   */
  readonly basePath?: string;
}

/** Bundle of all three file tools created by {@link createFileTools}. */
export interface FileTools {
  /** Read file contents from disk. */
  readonly readFile: import('../../types/tool.js').Tool;
  /** Write content to a file on disk. */
  readonly writeFile: import('../../types/tool.js').Tool;
  /** List directory entries. */
  readonly listFiles: import('../../types/tool.js').Tool;
}
