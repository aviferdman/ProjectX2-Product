/**
 * @crewspace/tools-shell — Shell tools for Crewspace agents.
 *
 * Provides shell command execution with timeout, sandbox safety,
 * and destructive command detection.
 * This is a standalone package that re-exports shell tools from @crewspace/core.
 *
 * @packageDocumentation
 */

// Factory
export { createShellTools } from '@crewspace/core';

// Individual tool creator
export { createShellExecTool } from '@crewspace/core';

// Utilities
export { checkDestructiveCommand } from '@crewspace/core';

// Schema
export { ShellExecInputSchema } from '@crewspace/core';

// Constants
export {
  DEFAULT_SHELL_TIMEOUT_MS,
  MAX_SHELL_TIMEOUT_MS,
  MAX_OUTPUT_SIZE,
  DESTRUCTIVE_PATTERNS,
} from '@crewspace/core';

// Types
export type {
  ShellTools,
  ShellToolsOptions,
  ShellExecInput,
  ShellExecOutput,
} from '@crewspace/core';
