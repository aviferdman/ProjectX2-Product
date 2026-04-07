/**
 * Zod input schemas for built-in shell tools.
 *
 * @packageDocumentation
 */

import { z } from 'zod';

import { MAX_SHELL_TIMEOUT_MS } from './types.js';

// ---------------------------------------------------------------------------
// ShellExec input schema
// ---------------------------------------------------------------------------

/** Zod schema for `shellExec` tool input. */
export const ShellExecInputSchema = z.object({
  command: z.string().min(1, 'command must be a non-empty string'),
  cwd: z.string().optional(),
  timeoutMs: z
    .number()
    .int('timeoutMs must be an integer')
    .positive('timeoutMs must be positive')
    .max(MAX_SHELL_TIMEOUT_MS, `timeoutMs must be ≤ ${String(MAX_SHELL_TIMEOUT_MS)}ms`)
    .optional(),
  env: z.record(z.string()).optional(),
  stdin: z.string().optional(),
});
