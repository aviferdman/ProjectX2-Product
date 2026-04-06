/**
 * Built-in writeFile tool — write content to a file on disk.
 *
 * @packageDocumentation
 */

import * as fsPromises from 'node:fs/promises';
import * as path from 'node:path';

import { ToolExecutionError } from '../../errors/tool-errors.js';
import type { Tool } from '../../types/tool.js';
import { ToolCategory, ToolPermission } from '../../types/tool.js';
import { parseToolInput } from '../../tool/validation.js';
import { WriteFileInputSchema } from './schemas.js';
import type { WriteFileOutput } from './types.js';
import { MAX_WRITE_SIZE } from './types.js';

/**
 * Resolve a path against a base directory and ensure it stays within bounds.
 */
function resolveSafePath(filePath: string, basePath: string): string {
  const resolved = path.resolve(basePath, filePath);
  const normalizedBase = path.resolve(basePath);

  if (!resolved.startsWith(normalizedBase + path.sep) && resolved !== normalizedBase) {
    throw new ToolExecutionError(
      'writeFile',
      `Path "${filePath}" resolves outside the allowed base directory`,
    );
  }
  return resolved;
}

/**
 * Create a writeFile {@link Tool} scoped to the given base directory.
 *
 * @param basePath - Root directory for sandboxed file access
 * @returns A `Tool` instance
 */
export function createWriteFileTool(basePath: string): Tool {
  const resolvedBase = path.resolve(basePath);

  return {
    name: 'writeFile',
    description: 'Write content to a file on disk',
    category: ToolCategory.FILE,
    permissions: [ToolPermission.FILE_WRITE],
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to write' },
        content: { type: 'string', description: 'Content to write' },
        createDirectories: {
          type: 'boolean',
          description: 'Create intermediate directories if missing (default: false)',
        },
      },
      required: ['path', 'content'],
    },
    inputZodSchema: WriteFileInputSchema,
    outputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Resolved absolute path' },
        size: { type: 'number', description: 'Bytes written' },
        created: { type: 'boolean', description: 'True if file was newly created' },
      },
      required: ['path', 'size', 'created'],
    },

    async execute(input: unknown): Promise<WriteFileOutput> {
      const parsed = parseToolInput('writeFile', WriteFileInputSchema, input);
      const { path: filePath, content, createDirectories } = parsed;

      const contentBytes = Buffer.byteLength(content, 'utf-8');
      if (contentBytes > MAX_WRITE_SIZE) {
        throw new ToolExecutionError(
          'writeFile',
          `Content size (${String(contentBytes)} bytes) exceeds maximum allowed (${String(MAX_WRITE_SIZE)} bytes)`,
        );
      }

      const resolvedPath = resolveSafePath(filePath, resolvedBase);

      // Determine if the file already exists
      let fileExists = false;
      try {
        await fsPromises.access(resolvedPath);
        fileExists = true;
      } catch {
        // File does not exist — will be created
      }

      // Create parent directories if requested
      if (createDirectories) {
        const dir = path.dirname(resolvedPath);
        await fsPromises.mkdir(dir, { recursive: true });
      }

      try {
        await fsPromises.writeFile(resolvedPath, content, 'utf-8');
      } catch (err: unknown) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === 'ENOENT') {
          throw new ToolExecutionError(
            'writeFile',
            `Parent directory does not exist: ${path.dirname(resolvedPath)}. Set createDirectories to true.`,
          );
        }
        throw new ToolExecutionError(
          'writeFile',
          `Failed to write file: ${resolvedPath}`,
          err instanceof Error ? err : new Error(String(err)),
        );
      }

      return {
        path: resolvedPath,
        size: contentBytes,
        created: !fileExists,
      };
    },
  };
}
