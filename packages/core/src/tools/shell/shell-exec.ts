/**
 * Built-in shellExec tool — execute shell commands with timeout and sandbox.
 *
 * @packageDocumentation
 */

import { execFile } from 'node:child_process';
import * as path from 'node:path';

import { ToolExecutionError } from '../../errors/tool-errors.js';
import type { Tool } from '../../types/tool.js';
import { ToolCategory, ToolPermission } from '../../types/tool.js';
import { parseToolInput } from '../../tool/validation.js';
import { ShellExecInputSchema } from './schemas.js';
import type { ShellExecOutput } from './types.js';
import {
  DEFAULT_SHELL_TIMEOUT_MS,
  DESTRUCTIVE_PATTERNS,
  MAX_OUTPUT_SIZE,
} from './types.js';

/**
 * Resolve a working directory against a base path and ensure it stays within bounds.
 *
 * @param cwd - The user-supplied working directory
 * @param basePath - The sandbox root
 * @returns The resolved absolute path
 * @throws {ToolExecutionError} If the path escapes the sandbox
 */
function resolveSafeCwd(cwd: string, basePath: string): string {
  const resolved = path.resolve(basePath, cwd);
  const normalizedBase = path.resolve(basePath);

  if (!resolved.startsWith(normalizedBase + path.sep) && resolved !== normalizedBase) {
    throw new ToolExecutionError(
      'shellExec',
      `Working directory "${cwd}" resolves outside the allowed base directory`,
    );
  }
  return resolved;
}

/**
 * Check a command string against known destructive patterns and return warnings.
 *
 * @param command - The shell command to check
 * @returns Array of warning strings (empty if no destructive patterns detected)
 */
export function checkDestructiveCommand(command: string): string[] {
  const warnings: string[] = [];
  for (const pattern of DESTRUCTIVE_PATTERNS) {
    if (pattern.test(command)) {
      warnings.push(
        `Potentially destructive command detected (matched ${String(pattern)}). Proceed with caution.`,
      );
    }
  }
  return warnings;
}

/**
 * Truncate output to the maximum allowed size, appending a truncation notice.
 */
function truncateOutput(output: string): string {
  if (Buffer.byteLength(output, 'utf-8') <= MAX_OUTPUT_SIZE) {
    return output;
  }
  const truncated = Buffer.from(output, 'utf-8').subarray(0, MAX_OUTPUT_SIZE).toString('utf-8');
  return truncated + '\n... [output truncated]';
}

/**
 * Create a shellExec {@link Tool} scoped to the given base directory.
 *
 * The tool executes commands via the system shell with configurable timeout
 * and working directory sandboxing. Destructive commands trigger warnings
 * in the output but are not blocked.
 *
 * @param basePath - Root directory that constrains working directory
 * @param defaultTimeoutMs - Default timeout for command execution
 * @returns A `Tool` instance
 */
export function createShellExecTool(
  basePath: string,
  defaultTimeoutMs: number = DEFAULT_SHELL_TIMEOUT_MS,
): Tool {
  const resolvedBase = path.resolve(basePath);

  return {
    name: 'shellExec',
    description: 'Execute a shell command with timeout and sandboxed working directory',
    category: ToolCategory.SHELL,
    permissions: [ToolPermission.SHELL_EXEC],
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute' },
        cwd: {
          type: 'string',
          description: 'Working directory (relative to base path)',
        },
        timeoutMs: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 30000)',
        },
        env: {
          type: 'object',
          description: 'Environment variables to set for the command',
        },
        stdin: {
          type: 'string',
          description: 'Text to pipe to stdin',
        },
      },
      required: ['command'],
    },
    inputZodSchema: ShellExecInputSchema,
    outputSchema: {
      type: 'object',
      properties: {
        exitCode: { type: 'number', description: 'Process exit code (null if killed)' },
        stdout: { type: 'string', description: 'Captured stdout' },
        stderr: { type: 'string', description: 'Captured stderr' },
        timedOut: { type: 'boolean', description: 'Whether the command timed out' },
        durationMs: { type: 'number', description: 'Execution duration in milliseconds' },
        warnings: { type: 'array', description: 'Warnings emitted during execution' },
      },
      required: ['exitCode', 'stdout', 'stderr', 'timedOut', 'durationMs', 'warnings'],
    },

    async execute(input: unknown): Promise<ShellExecOutput> {
      const parsed = parseToolInput('shellExec', ShellExecInputSchema, input);
      const {
        command,
        cwd,
        timeoutMs: inputTimeout,
        env: inputEnv,
        stdin,
      } = parsed;

      const timeout = inputTimeout ?? defaultTimeoutMs;
      const workingDir = cwd ? resolveSafeCwd(cwd, resolvedBase) : resolvedBase;

      // Check for destructive commands
      const warnings = checkDestructiveCommand(command);

      const startTime = Date.now();

      return new Promise<ShellExecOutput>((resolve, reject) => {
        const isWindows = process.platform === 'win32';
        const shell = isWindows ? 'cmd.exe' : '/bin/sh';
        const shellArgs = isWindows ? ['/c', command] : ['-c', command];

        const child = execFile(shell, shellArgs, {
          cwd: workingDir,
          timeout,
          maxBuffer: MAX_OUTPUT_SIZE,
          env: inputEnv ? { ...process.env, ...inputEnv } : undefined,
          killSignal: 'SIGTERM',
        }, (error, stdout, stderr) => {
          const durationMs = Date.now() - startTime;
          const timedOut = error !== null && 'killed' in error && error.killed === true;

          if (error && !timedOut && error.code === undefined && !('killed' in error)) {
            reject(
              new ToolExecutionError(
                'shellExec',
                `Failed to execute command: ${error.message}`,
                error,
              ),
            );
            return;
          }

          const exitCode = timedOut
            ? null
            : (error && 'code' in error ? (error as { code: number }).code : 0);

          resolve({
            exitCode,
            stdout: truncateOutput(stdout),
            stderr: truncateOutput(stderr),
            timedOut,
            durationMs,
            warnings,
          });
        });

        if (stdin && child.stdin) {
          child.stdin.write(stdin);
          child.stdin.end();
        }
      });
    },
  };
}
