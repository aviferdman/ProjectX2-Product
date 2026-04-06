/**
 * Built-in shell tools — execute shell commands with timeout and sandbox.
 *
 * @packageDocumentation
 */

import * as path from 'node:path';

import type { ShellTools, ShellToolsOptions } from './types.js';

export { createExecCommandTool } from './exec-command.js';
export {
  DEFAULT_TIMEOUT_MS,
  DENIED_COMMANDS,
  MAX_OUTPUT_SIZE,
  MAX_TIMEOUT_MS,
} from './types.js';
export type {
  ExecCommandInput,
  ExecCommandOutput,
  ShellTools,
  ShellToolsOptions,
} from './types.js';

// ---------------------------------------------------------------------------
// Re-imported for the factory below (avoid circular barrel issues)
// ---------------------------------------------------------------------------
import { createExecCommandTool } from './exec-command.js';

/**
 * Create all shell tools (`execCommand`) as a convenient bundle.
 *
 * @param options - Optional configuration (base path, timeout, allow/deny lists)
 * @returns A {@link ShellTools} object
 *
 * @example
 * ```typescript
 * const tools = createShellTools({
 *   basePath: '/workspace/project',
 *   timeoutMs: 10_000,
 *   deniedCommands: ['rm -rf'],
 * });
 * registry.register(tools.execCommand);
 * ```
 */
export function createShellTools(options?: ShellToolsOptions): ShellTools {
  const basePath = path.resolve(options?.basePath ?? process.cwd());

  return {
    execCommand: createExecCommandTool(basePath, {
      timeoutMs: options?.timeoutMs,
      allowedCommands: options?.allowedCommands,
      deniedCommands: options?.deniedCommands,
    }),
  };
}
