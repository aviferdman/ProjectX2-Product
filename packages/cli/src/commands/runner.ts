/**
 * Workflow execution logic — resolves, validates, and spawns workflow files.
 *
 * This module is intentionally separated from the Commander action so that
 * it can be tested independently without wiring up the CLI parser.
 *
 * @packageDocumentation
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn } from 'node:child_process';

/** Supported workflow file extensions. */
export const SUPPORTED_EXTENSIONS = ['.ts', '.mts', '.js', '.mjs'] as const;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

/** Options accepted by {@link executeWorkflow}. */
export interface RunnerOptions {
  /** Path to the workflow file (absolute or relative to cwd). */
  readonly file: string;
  /** Working directory for resolution and execution. */
  readonly cwd: string;
  /** Execution timeout in milliseconds. `undefined` means no timeout. */
  readonly timeout?: number | undefined;
}

/** Result returned by {@link executeWorkflow}. */
export interface RunResult {
  /** Process exit code (0 = success). */
  readonly exitCode: number;
  /** Whether the process was killed due to timeout. */
  readonly timedOut: boolean;
  /** Absolute path of the executed file. */
  readonly file: string;
  /** Total execution duration in milliseconds. */
  readonly durationMs: number;
}

/**
 * Resolves and validates a workflow file path.
 *
 * @throws {Error} If the file does not exist.
 * @throws {Error} If the file has an unsupported extension.
 */
export function resolveWorkflowFile(file: string, cwd: string): string {
  const resolved = path.resolve(cwd, file);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Workflow file not found: ${resolved}`);
  }

  if (!fs.statSync(resolved).isFile()) {
    throw new Error(`Not a file: ${resolved}`);
  }

  const ext = path.extname(resolved).toLowerCase();
  if (!isSupportedExtension(ext)) {
    throw new Error(
      `Unsupported file extension "${ext}". Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`,
    );
  }

  return resolved;
}

/**
 * Determines the command and arguments needed to execute a workflow file.
 *
 * TypeScript files (.ts, .mts) are run with `tsx`.
 * JavaScript files (.js, .mjs) are run with `node`.
 */
export function getRunCommand(filePath: string): { command: string; args: string[] } {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.ts' || ext === '.mts') {
    return { command: 'tsx', args: [filePath] };
  }
  return { command: 'node', args: [filePath] };
}

/**
 * Parses and validates a timeout string from CLI input.
 *
 * @returns The timeout as a positive integer, or `undefined` if no timeout.
 * @throws {Error} If the value is not a valid positive integer.
 */
export function parseTimeout(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    throw new Error(
      `Invalid timeout "${value}". Must be a positive integer (milliseconds).`,
    );
  }

  return parsed;
}

/**
 * Executes a workflow file in a child process.
 *
 * Resolves the file, spawns the appropriate runtime (`tsx` or `node`),
 * and waits for completion. Optionally kills the process after `timeout` ms.
 */
export async function executeWorkflow(options: RunnerOptions): Promise<RunResult> {
  const resolvedFile = resolveWorkflowFile(options.file, options.cwd);
  const { command, args } = getRunCommand(resolvedFile);
  const startTime = Date.now();

  return new Promise<RunResult>((resolve, reject) => {
    // On Windows with shell: true, paths with spaces need quoting
    const spawnArgs = process.platform === 'win32'
      ? args.map((a) => (a.includes(' ') ? `"${a}"` : a))
      : args;

    const child = spawn(command, spawnArgs, {
      cwd: options.cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    let timedOut = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (options.timeout !== undefined && options.timeout > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, options.timeout);
    }

    child.on('error', (err) => {
      if (timer) clearTimeout(timer);
      reject(new Error(`Failed to start workflow process: ${err.message}`));
    });

    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      resolve({
        exitCode: code ?? 1,
        timedOut,
        file: resolvedFile,
        durationMs: Date.now() - startTime,
      });
    });
  });
}

function isSupportedExtension(ext: string): ext is SupportedExtension {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext);
}
