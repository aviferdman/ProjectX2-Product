/**
 * Type definitions for the built-in shell tools.
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default command execution timeout in milliseconds (30 seconds). */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** Hard upper limit on execution timeout (5 minutes). */
export const MAX_TIMEOUT_MS = 5 * 60 * 1_000;

/** Maximum combined stdout + stderr size in bytes (1 MB). */
export const MAX_OUTPUT_SIZE = 1 * 1024 * 1024;

/**
 * Commands that are always denied for safety.
 *
 * These target destructive system-level operations that agents should
 * never execute regardless of permission policy.
 */
export const DENIED_COMMANDS: readonly string[] = [
  'rm -rf /',
  'mkfs',
  'dd',
  'format',
  ':(){:|:&};:',
  'shutdown',
  'reboot',
  'halt',
  'poweroff',
  'init 0',
  'init 6',
];

// ---------------------------------------------------------------------------
// ExecCommand types
// ---------------------------------------------------------------------------

/** Input for the `execCommand` tool. */
export interface ExecCommandInput {
  /** The command to execute. */
  readonly command: string;
  /** Arguments to pass to the command. */
  readonly args?: readonly string[];
  /** Working directory for the command (resolved relative to base path). */
  readonly cwd?: string;
  /** Execution timeout in milliseconds (default: {@link DEFAULT_TIMEOUT_MS}). */
  readonly timeoutMs?: number;
  /** Additional environment variables (merged with process.env). */
  readonly env?: Readonly<Record<string, string>>;
  /** Shell to use. When `true`, runs inside the default OS shell. Default: `true`. */
  readonly shell?: boolean | string;
}

/** Output returned by the `execCommand` tool. */
export interface ExecCommandOutput {
  /** Contents of stdout. */
  readonly stdout: string;
  /** Contents of stderr. */
  readonly stderr: string;
  /** Process exit code (`null` if the process was killed). */
  readonly exitCode: number | null;
  /** Execution duration in milliseconds. */
  readonly duration: number;
  /** The command that was executed (for logging / debugging). */
  readonly command: string;
  /** `true` if the process was killed due to a timeout. */
  readonly timedOut: boolean;
}

// ---------------------------------------------------------------------------
// ShellTools factory types
// ---------------------------------------------------------------------------

/** Options for {@link createShellTools}. */
export interface ShellToolsOptions {
  /**
   * Base directory that restricts all command execution.
   * All `cwd` values are resolved relative to this directory, and traversal
   * outside of it is denied. When omitted, `process.cwd()` is used.
   */
  readonly basePath?: string;

  /** Default execution timeout in milliseconds. */
  readonly timeoutMs?: number;

  /**
   * Allowlist of command prefixes. When set, only commands that start with
   * one of these strings may be executed. Takes priority over `deniedCommands`.
   */
  readonly allowedCommands?: readonly string[];

  /**
   * Denylist of command prefixes. Commands that start with one of these
   * strings are rejected. Ignored when `allowedCommands` is set.
   */
  readonly deniedCommands?: readonly string[];
}

/** Bundle of shell tools created by {@link createShellTools}. */
export interface ShellTools {
  /** Execute a shell command. */
  readonly execCommand: import('../../types/tool.js').Tool;
}
