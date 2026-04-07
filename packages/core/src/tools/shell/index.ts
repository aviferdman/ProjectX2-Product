/**
 * Built-in shell tools — execute shell commands with timeout and sandbox.
 *
 * @packageDocumentation
 */

import * as path from 'node:path';

import type { ShellTools, ShellToolsOptions } from './types.js';

export { checkDestructiveCommand, createShellExecTool } from './shell-exec.js';
export { ShellExecInputSchema } from './schemas.js';
export {
  DEFAULT_SHELL_TIMEOUT_MS,
  DESTRUCTIVE_PATTERNS,
  MAX_OUTPUT_SIZE,
  MAX_SHELL_TIMEOUT_MS,
} from './types.js';
export type { ShellExecInput, ShellExecOutput, ShellTools, ShellToolsOptions } from './types.js';

// ---------------------------------------------------------------------------
// Re-imported for the factory below (avoid circular barrel issues)
// ---------------------------------------------------------------------------
import { createShellExecTool } from './shell-exec.js';

/**
 * Create the shell tools bundle (`shellExec`) as a convenient factory.
 *
 * @param options - Optional configuration (base path, default timeout)
 * @returns A {@link ShellTools} object
 *
 * @example
 * ```typescript
 * const tools = createShellTools({ basePath: '/workspace/project' });
 * registry.register(tools.shellExec);
 * ```
 */
export function createShellTools(options?: ShellToolsOptions): ShellTools {
  const basePath = path.resolve(options?.basePath ?? process.cwd());
  const defaultTimeoutMs = options?.defaultTimeoutMs;

  return {
    shellExec: createShellExecTool(basePath, defaultTimeoutMs),
  };
}
