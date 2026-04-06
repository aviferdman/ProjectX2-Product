/**
 * Built-in execCommand tool — execute shell commands with timeout and sandbox.
 *
 * Uses `node:child_process.exec` for shell command execution with
 * configurable timeouts, working-directory sandboxing, and command filtering.
 *
 * @packageDocumentation
 */

import { exec as execCb } from 'node:child_process';
import * as path from 'node:path';
import { promisify } from 'node:util';

import { ToolExecutionError } from '../../errors/tool-errors.js';
import type { Tool } from '../../types/tool.js';
import { ToolCategory, ToolPermission } from '../../types/tool.js';
import type { ExecCommandInput, ExecCommandOutput, ShellToolsOptions } from './types.js';
import {
  DEFAULT_TIMEOUT_MS,
  DENIED_COMMANDS,
  MAX_OUTPUT_SIZE,
  MAX_TIMEOUT_MS,
} from './types.js';

const execAsync = promisify(execCb);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a working directory against a base path and ensure it stays within
 * the sandbox boundary.
 */
function resolveSafeCwd(cwd: string, basePath: string): string {
  const resolved = path.resolve(basePath, cwd);
  const normalizedBase = path.resolve(basePath);

  if (!resolved.startsWith(normalizedBase + path.sep) && resolved !== normalizedBase) {
    throw new ToolExecutionError(
      'execCommand',
      `Working directory "${cwd}" resolves outside the allowed base directory`,
    );
  }
  return resolved;
}

/**
 * Build the full command string from `command` and optional `args`.
 */
function buildCommandString(command: string, args?: readonly string[]): string {
  if (!args || args.length === 0) return command;

  const escaped = args.map((a) => {
    if (/["\s]/.test(a)) {
      return `"${a.replace(/"/g, '\\"')}"`;
    }
    return a;
  });

  return `${command} ${escaped.join(' ')}`;
}

/**
 * Check whether a command is allowed given the allow/deny lists and the
 * hard-coded deny list.
 */
function assertCommandAllowed(
  fullCommand: string,
  allowed?: readonly string[],
  denied?: readonly string[],
): void {
  const normalised = fullCommand.trim().toLowerCase();

  // Hard-coded deny list always applies
  for (const pattern of DENIED_COMMANDS) {
    if (normalised.startsWith(pattern.toLowerCase())) {
      throw new ToolExecutionError(
        'execCommand',
        `Command is denied for safety: "${fullCommand}"`,
      );
    }
  }

  // Explicit allowlist takes priority
  if (allowed && allowed.length > 0) {
    const isAllowed = allowed.some((prefix) =>
      normalised.startsWith(prefix.toLowerCase()),
    );
    if (!isAllowed) {
      throw new ToolExecutionError(
        'execCommand',
        `Command "${fullCommand}" is not in the allowed command list`,
      );
    }
    return;
  }

  // Explicit denylist
  if (denied && denied.length > 0) {
    const isDenied = denied.some((prefix) =>
      normalised.startsWith(prefix.toLowerCase()),
    );
    if (isDenied) {
      throw new ToolExecutionError(
        'execCommand',
        `Command "${fullCommand}" is in the denied command list`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create an execCommand {@link Tool} scoped to the given base directory.
 *
 * @param basePath - Root directory for sandboxed command execution
 * @param options  - Optional configuration (timeout, allow/deny lists)
 * @returns A `Tool` instance
 */
export function createExecCommandTool(
  basePath: string,
  options?: Omit<ShellToolsOptions, 'basePath'>,
): Tool {
  const resolvedBase = path.resolve(basePath);
  const defaultTimeout = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const allowedCommands = options?.allowedCommands;
  const deniedCommands = options?.deniedCommands;

  return {
    name: 'execCommand',
    description: 'Execute a shell command with timeout and working-directory sandbox',
    category: ToolCategory.SHELL,
    permissions: [ToolPermission.SHELL_EXEC],
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to execute' },
        args: {
          type: 'array',
          items: { type: 'string' },
          description: 'Arguments to pass to the command',
        },
        cwd: {
          type: 'string',
          description: 'Working directory (relative to base path)',
        },
        timeoutMs: {
          type: 'number',
          description: 'Execution timeout in milliseconds',
        },
        env: {
          type: 'object',
          description: 'Additional environment variables',
        },
        shell: {
          type: 'string',
          description: 'Shell to use (true for default shell)',
        },
      },
      required: ['command'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        stdout: { type: 'string', description: 'Standard output' },
        stderr: { type: 'string', description: 'Standard error' },
        exitCode: { type: 'number', description: 'Exit code' },
        duration: { type: 'number', description: 'Duration in ms' },
        command: { type: 'string', description: 'Executed command' },
        timedOut: { type: 'boolean', description: 'Whether the command timed out' },
      },
      required: ['stdout', 'stderr', 'exitCode', 'duration', 'command', 'timedOut'],
    },

    async execute(input: unknown): Promise<ExecCommandOutput> {
      const {
        command,
        args,
        cwd,
        timeoutMs,
        env: extraEnv,
        shell = true,
      } = input as ExecCommandInput;

      // --- Input validation ---
      if (!command || typeof command !== 'string') {
        throw new ToolExecutionError('execCommand', 'input.command must be a non-empty string');
      }

      const fullCommand = buildCommandString(command, args);

      // --- Security checks ---
      assertCommandAllowed(fullCommand, allowedCommands, deniedCommands);

      // --- Resolve working directory ---
      const resolvedCwd = cwd ? resolveSafeCwd(cwd, resolvedBase) : resolvedBase;

      // --- Timeout ---
      const timeout = Math.min(
        Math.max(timeoutMs ?? defaultTimeout, 0),
        MAX_TIMEOUT_MS,
      );

      // --- Execute ---
      const start = Date.now();

      try {
        const { stdout, stderr } = await execAsync(fullCommand, {
          cwd: resolvedCwd,
          timeout,
          maxBuffer: MAX_OUTPUT_SIZE,
          env: extraEnv ? { ...process.env, ...extraEnv } : undefined,
          shell: typeof shell === 'string' ? shell : shell ? true : false,
          windowsHide: true,
        });

        return {
          stdout: stdout ?? '',
          stderr: stderr ?? '',
          exitCode: 0,
          duration: Date.now() - start,
          command: fullCommand,
          timedOut: false,
        };
      } catch (err: unknown) {
        const duration = Date.now() - start;

        if (err instanceof ToolExecutionError) throw err;

        // node child_process error shape
        const cpErr = err as {
          stdout?: string;
          stderr?: string;
          code?: number | string;
          killed?: boolean;
          signal?: string;
        };

        // Timeout — process was killed by the timer
        const wasKilled = cpErr.killed === true || cpErr.signal === 'SIGTERM';
        if (wasKilled) {
          return {
            stdout: cpErr.stdout ?? '',
            stderr: cpErr.stderr ?? '',
            exitCode: null,
            duration,
            command: fullCommand,
            timedOut: true,
          };
        }

        // Non-zero exit code — still a "successful execution", just with an
        // error status. Return the output to the caller.
        if (typeof cpErr.code === 'number') {
          return {
            stdout: cpErr.stdout ?? '',
            stderr: cpErr.stderr ?? '',
            exitCode: cpErr.code,
            duration,
            command: fullCommand,
            timedOut: false,
          };
        }

        // Buffer overflow
        if (cpErr.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
          throw new ToolExecutionError(
            'execCommand',
            `Command output exceeded maximum size (${String(MAX_OUTPUT_SIZE)} bytes)`,
          );
        }

        // Unknown error
        const message = err instanceof Error ? err.message : String(err);
        throw new ToolExecutionError(
          'execCommand',
          `Command execution failed: ${message}`,
          err instanceof Error ? err : undefined,
        );
      }
    },
  };
}
