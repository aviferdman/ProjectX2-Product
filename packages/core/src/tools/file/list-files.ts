/**
 * Built-in listFiles tool — list directory entries with optional filtering.
 *
 * @packageDocumentation
 */

import * as fsPromises from 'node:fs/promises';
import * as path from 'node:path';

import { ToolExecutionError } from '../../errors/tool-errors.js';
import type { Tool } from '../../types/tool.js';
import { ToolCategory, ToolPermission } from '../../types/tool.js';
import { parseToolInput } from '../../tool/validation.js';
import { ListFilesInputSchema } from './schemas.js';
import type { FileEntry, ListFilesOutput } from './types.js';
import { DEFAULT_MAX_ENTRIES, HARD_MAX_ENTRIES } from './types.js';

/**
 * Resolve a path against a base directory and ensure it stays within bounds.
 */
function resolveSafePath(dirPath: string, basePath: string): string {
  const resolved = path.resolve(basePath, dirPath);
  const normalizedBase = path.resolve(basePath);

  if (!resolved.startsWith(normalizedBase + path.sep) && resolved !== normalizedBase) {
    throw new ToolExecutionError(
      'listFiles',
      `Path "${dirPath}" resolves outside the allowed base directory`,
    );
  }
  return resolved;
}

/**
 * Match a filename against a simple glob pattern.
 *
 * Supports `*` (match any characters) and `?` (match single character).
 * Does **not** support brace expansion, character classes, or `**`.
 *
 * @param filename - The filename to test
 * @param pattern  - The glob pattern
 * @returns `true` if the filename matches
 */
export function matchesPattern(filename: string, pattern: string): boolean {
  // Convert the glob pattern to a regex
  let regexStr = '^';
  for (const ch of pattern) {
    if (ch === '*') {
      regexStr += '.*';
    } else if (ch === '?') {
      regexStr += '.';
    } else if ('.+^${}()|[]\\'.includes(ch)) {
      regexStr += `\\${ch}`;
    } else {
      regexStr += ch;
    }
  }
  regexStr += '$';

  return new RegExp(regexStr, 'i').test(filename);
}

/**
 * Recursively collect directory entries up to a hard limit.
 */
async function collectEntries(
  dirPath: string,
  basePath: string,
  pattern: string | undefined,
  recursive: boolean,
  hardLimit: number,
): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  const queue: string[] = [dirPath];

  while (queue.length > 0 && entries.length < hardLimit) {
    const currentDir = queue.shift();
    if (!currentDir) break;
    let dirEntries: import('node:fs').Dirent[];
    try {
      dirEntries = await fsPromises.readdir(currentDir, { withFileTypes: true });
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'EACCES') {
        continue;
      }
      throw err;
    }

    for (const dirent of dirEntries) {
      if (entries.length >= hardLimit) {
        break;
      }

      const entryPath = path.join(currentDir, dirent.name);

      // Ensure recursive entries remain inside the sandbox
      const normalizedBase = path.resolve(basePath);
      if (!entryPath.startsWith(normalizedBase + path.sep) && entryPath !== normalizedBase) {
        continue;
      }

      const isDir = dirent.isDirectory();
      const isFile = dirent.isFile();

      if (!isDir && !isFile) {
        continue;
      }

      // Apply pattern filter (only against basename)
      if (pattern && !matchesPattern(dirent.name, pattern)) {
        // Even if the entry doesn't match, we still recurse into directories
        if (recursive && isDir) {
          queue.push(entryPath);
        }
        continue;
      }

      let size = 0;
      if (isFile) {
        try {
          const stats = await fsPromises.stat(entryPath);
          size = stats.size;
        } catch {
          // If we can't stat, include with size 0
        }
      }

      entries.push({
        name: dirent.name,
        path: entryPath,
        type: isDir ? 'directory' : 'file',
        size,
      });

      if (recursive && isDir) {
        queue.push(entryPath);
      }
    }
  }

  return entries;
}

/**
 * Create a listFiles {@link Tool} scoped to the given base directory.
 *
 * @param basePath - Root directory for sandboxed file access
 * @returns A `Tool` instance
 */
export function createListFilesTool(basePath: string): Tool {
  const resolvedBase = path.resolve(basePath);

  return {
    name: 'listFiles',
    description: 'List files and directories with optional glob filtering',
    category: ToolCategory.FILE,
    permissions: [ToolPermission.FILE_READ],
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path to list' },
        pattern: { type: 'string', description: 'Glob pattern to filter entries (e.g. "*.ts")' },
        recursive: {
          type: 'boolean',
          description: 'Recurse into subdirectories (default: false)',
        },
        maxEntries: {
          type: 'number',
          description: `Maximum entries to return (default: ${String(DEFAULT_MAX_ENTRIES)}, max: ${String(HARD_MAX_ENTRIES)})`,
        },
      },
      required: ['path'],
    },
    inputZodSchema: ListFilesInputSchema,
    outputSchema: {
      type: 'object',
      properties: {
        entries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              type: { type: 'string', enum: ['file', 'directory'] },
              size: { type: 'number' },
            },
          },
        },
        total: { type: 'number' },
        truncated: { type: 'boolean' },
      },
      required: ['entries', 'total', 'truncated'],
    },

    async execute(input: unknown): Promise<ListFilesOutput> {
      const parsed = parseToolInput('listFiles', ListFilesInputSchema, input);
      const { path: dirPath, pattern, recursive, maxEntries } = parsed;
      const effectiveMaxEntries = maxEntries ?? DEFAULT_MAX_ENTRIES;

      const resolvedPath = resolveSafePath(dirPath, resolvedBase);

      // Verify the path is a directory
      try {
        const stats = await fsPromises.stat(resolvedPath);
        if (!stats.isDirectory()) {
          throw new ToolExecutionError('listFiles', `Path is not a directory: ${resolvedPath}`);
        }
      } catch (err: unknown) {
        if (err instanceof ToolExecutionError) {
          throw err;
        }
        const code = (err as NodeJS.ErrnoException).code;
        if (code === 'ENOENT') {
          throw new ToolExecutionError('listFiles', `Directory not found: ${resolvedPath}`);
        }
        throw new ToolExecutionError(
          'listFiles',
          `Cannot access directory: ${resolvedPath}`,
          err instanceof Error ? err : new Error(String(err)),
        );
      }

      const effectiveMax = Math.min(Math.max(1, effectiveMaxEntries), HARD_MAX_ENTRIES);

      // Collect one extra so we know if the result is truncated
      const allEntries = await collectEntries(
        resolvedPath,
        resolvedBase,
        pattern,
        recursive ?? false,
        effectiveMax + 1,
      );

      const truncated = allEntries.length > effectiveMax;
      const entries = truncated ? allEntries.slice(0, effectiveMax) : allEntries;

      return {
        entries,
        total: allEntries.length,
        truncated,
      };
    },
  };
}
