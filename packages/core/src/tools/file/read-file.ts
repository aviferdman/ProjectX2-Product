/**
 * Built-in readFile tool — read file contents from disk.
 *
 * @packageDocumentation
 */

import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import * as path from 'node:path';

import { ToolExecutionError } from '../../errors/tool-errors.js';
import type { Tool } from '../../types/tool.js';
import { ToolCategory, ToolPermission } from '../../types/tool.js';
import type { ReadFileInput, ReadFileOutput } from './types.js';
import { MAX_READ_SIZE } from './types.js';

/**
 * Resolve a path against a base directory and ensure it stays within bounds.
 *
 * @param filePath - The user-supplied path
 * @param basePath - The sandbox root
 * @returns The resolved absolute path
 * @throws {ToolExecutionError} If the path escapes the sandbox
 */
function resolveSafePath(filePath: string, basePath: string): string {
  const resolved = path.resolve(basePath, filePath);
  const normalizedBase = path.resolve(basePath);

  if (!resolved.startsWith(normalizedBase + path.sep) && resolved !== normalizedBase) {
    throw new ToolExecutionError(
      'readFile',
      `Path "${filePath}" resolves outside the allowed base directory`,
    );
  }
  return resolved;
}

/**
 * Create a readFile {@link Tool} scoped to the given base directory.
 *
 * @param basePath - Root directory for sandboxed file access
 * @returns A `Tool` instance
 */
export function createReadFileTool(basePath: string): Tool {
  const resolvedBase = path.resolve(basePath);

  return {
    name: 'readFile',
    description: 'Read the contents of a file from disk',
    category: ToolCategory.FILE,
    permissions: [ToolPermission.FILE_READ],
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to read' },
        encoding: {
          type: 'string',
          description: 'Text encoding (default: utf-8)',
          enum: ['utf-8', 'ascii', 'utf8', 'base64', 'hex', 'latin1'],
        },
      },
      required: ['path'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'File content' },
        size: { type: 'number', description: 'File size in bytes' },
        path: { type: 'string', description: 'Resolved absolute path' },
      },
      required: ['content', 'size', 'path'],
    },

    async execute(input: unknown): Promise<ReadFileOutput> {
      const { path: filePath, encoding = 'utf-8' } = input as ReadFileInput;

      if (!filePath || typeof filePath !== 'string') {
        throw new ToolExecutionError('readFile', 'input.path must be a non-empty string');
      }

      const resolvedPath = resolveSafePath(filePath, resolvedBase);

      // Check existence and get stats
      let stats: fs.Stats;
      try {
        stats = await fsPromises.stat(resolvedPath);
      } catch (err: unknown) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === 'ENOENT') {
          throw new ToolExecutionError('readFile', `File not found: ${resolvedPath}`);
        }
        throw new ToolExecutionError(
          'readFile',
          `Cannot access file: ${resolvedPath}`,
          err instanceof Error ? err : new Error(String(err)),
        );
      }

      if (!stats.isFile()) {
        throw new ToolExecutionError('readFile', `Path is not a file: ${resolvedPath}`);
      }

      if (stats.size > MAX_READ_SIZE) {
        throw new ToolExecutionError(
          'readFile',
          `File size (${String(stats.size)} bytes) exceeds maximum allowed (${String(MAX_READ_SIZE)} bytes)`,
        );
      }

      const content = await fsPromises.readFile(resolvedPath, { encoding });

      return {
        content,
        size: stats.size,
        path: resolvedPath,
      };
    },
  };
}
