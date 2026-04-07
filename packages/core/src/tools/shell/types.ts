/**
 * Type definitions for the built-in shell tools.
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default timeout for shell command execution: 30 seconds. */
export const DEFAULT_SHELL_TIMEOUT_MS = 30_000;

/** Maximum allowed timeout: 5 minutes. */
export const MAX_SHELL_TIMEOUT_MS = 300_000;

/** Maximum output size (in bytes) captured from stdout/stderr. 1 MB. */
export const MAX_OUTPUT_SIZE = 1 * 1024 * 1024;

/**
 * Patterns that match potentially destructive shell commands.
 * The shell tool emits a warning (but does not block) when these are detected.
 */
export const DESTRUCTIVE_PATTERNS: readonly RegExp[] = [
  /\brm\s+(-[a-zA-Z]*f|-[a-zA-Z]*r|--force|--recursive)\b/,
  /\brm\b.*\s+\/($|\s)/,
  /\brmdir\b/,
  /\bmkfs\b/,
  /\bdd\s+/,
  /\b(chmod|chown)\s+(-R|--recursive)\b/,
  /\bformat\b/,
  />\s*\/dev\/sd[a-z]/,
  /\b:[(][)]\s*[{]\s*:.*[}]/,
  /\bshutdown\b/,
  /\breboot\b/,
  /\bkill\s+-9\b/,
  /\bkillall\b/,
];

// ---------------------------------------------------------------------------
// ShellExec types
// ---------------------------------------------------------------------------

/** Input for the `shellExec` tool. */
export interface ShellExecInput {
  /** The shell command to execute. */
  readonly command: string;
  /** Working directory for the command. Resolved relative to the sandbox base. */
  readonly cwd?: string;
  /** Timeout in milliseconds. Default: {@link DEFAULT_SHELL_TIMEOUT_MS}. */
  readonly timeoutMs?: number;
  /** Environment variables to set for the command (merged with process.env). */
  readonly env?: Readonly<Record<string, string>>;
  /** Text to pipe to stdin. */
  readonly stdin?: string;
}

/** Output returned by the `shellExec` tool. */
export interface ShellExecOutput {
  /** Process exit code (`null` if the process was killed). */
  readonly exitCode: number | null;
  /** Captured stdout content. */
  readonly stdout: string;
  /** Captured stderr content. */
  readonly stderr: string;
  /** Whether the command was killed due to timeout. */
  readonly timedOut: boolean;
  /** Execution duration in milliseconds. */
  readonly durationMs: number;
  /** Warnings emitted (e.g. destructive command detection). */
  readonly warnings: readonly string[];
}

// ---------------------------------------------------------------------------
// ShellTools factory types
// ---------------------------------------------------------------------------

/** Options for {@link createShellTools}. */
export interface ShellToolsOptions {
  /**
   * Base directory that restricts the working directory for shell commands.
   * All `cwd` values are resolved relative to this directory, and traversal
   * outside of it is denied. When omitted, `process.cwd()` is used.
   */
  readonly basePath?: string;

  /**
   * Default timeout in milliseconds for all shell commands.
   * Individual commands can override this via `timeoutMs`.
   * Default: {@link DEFAULT_SHELL_TIMEOUT_MS}.
   */
  readonly defaultTimeoutMs?: number;
}

/** Bundle of shell tools created by {@link createShellTools}. */
export interface ShellTools {
  /** Execute a shell command. */
  readonly shellExec: import('../../types/tool.js').Tool;
}
