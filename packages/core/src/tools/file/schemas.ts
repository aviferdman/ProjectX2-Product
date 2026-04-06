/**
 * Zod input schemas for built-in file tools.
 *
 * These schemas provide runtime validation of tool inputs, replacing
 * ad-hoc type checks with structured Zod parsing. They are attached
 * to each tool's `inputZodSchema` property so the {@link ToolExecutor}
 * can validate inputs automatically before execution.
 *
 * @packageDocumentation
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// ReadFile input schema
// ---------------------------------------------------------------------------

/** Zod schema for `readFile` tool input. */
export const ReadFileInputSchema = z.object({
  path: z.string().min(1, 'path must be a non-empty string'),
  encoding: z
    .enum(['utf-8', 'ascii', 'utf8', 'base64', 'hex', 'latin1'])
    .optional()
    .default('utf-8'),
});

// ---------------------------------------------------------------------------
// WriteFile input schema
// ---------------------------------------------------------------------------

/** Zod schema for `writeFile` tool input. */
export const WriteFileInputSchema = z.object({
  path: z.string().min(1, 'path must be a non-empty string'),
  content: z.string({ required_error: 'content is required' }),
  createDirectories: z.boolean().optional().default(false),
});

// ---------------------------------------------------------------------------
// ListFiles input schema
// ---------------------------------------------------------------------------

/** Zod schema for `listFiles` tool input. */
export const ListFilesInputSchema = z.object({
  path: z.string().min(1, 'path must be a non-empty string'),
  pattern: z.string().optional(),
  recursive: z.boolean().optional().default(false),
  maxEntries: z.number().int().positive().optional(),
});
