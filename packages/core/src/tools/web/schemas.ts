/**
 * Zod input schemas for built-in web tools.
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
// FetchUrl input schema
// ---------------------------------------------------------------------------

/** Zod schema for `fetchUrl` tool input. */
export const FetchUrlInputSchema = z.object({
  url: z.string().min(1, 'url must be a non-empty string'),
  method: z.enum(['GET', 'HEAD']).optional().default('GET'),
  headers: z.record(z.string()).optional(),
  timeoutMs: z.number().int().nonnegative().optional(),
  maxSize: z.number().int().nonnegative().optional(),
});

// ---------------------------------------------------------------------------
// ParseHtml input schema
// ---------------------------------------------------------------------------

/** Zod schema for `parseHtml` tool input. */
export const ParseHtmlInputSchema = z.object({
  html: z.string().min(1, 'html must be a non-empty string'),
  extract: z.enum(['text', 'links', 'metadata'], {
    errorMap: () => ({ message: "extract must be one of: 'text', 'links', 'metadata'" }),
  }),
});

// ---------------------------------------------------------------------------
// WebSearch input schema
// ---------------------------------------------------------------------------

/** Zod schema for `webSearch` tool input. */
export const WebSearchInputSchema = z.object({
  query: z.string().min(1, 'query must be a non-empty string'),
  maxResults: z.number().int().nonnegative().optional(),
});
