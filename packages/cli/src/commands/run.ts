/**
 * `crewspace run` — execute a Crewspace workflow file.
 *
 * Resolves the target file, spawns the appropriate runtime (`tsx` for
 * TypeScript, `node` for JavaScript), and streams output to the terminal.
 *
 * @packageDocumentation
 */

import * as fs from 'node:fs';
import type { Command } from 'commander';

import { executeWorkflow, parseTimeout, resolveWorkflowFile } from './runner.js';

export interface RunOptions {
  readonly watch?: boolean;
  readonly timeout?: string;
}

export function registerRunCommand(parent: Command): void {
  parent
    .command('run <file>')
    .description('Execute a Crewspace workflow file')
    .option('-w, --watch', 'Watch for file changes and re-run', false)
    .option('--timeout <ms>', 'Execution timeout in milliseconds')
    .action(async (file: string, options: RunOptions) => {
      const globalOpts = parent.opts();
      const cwd = (globalOpts['cwd'] as string | undefined) ?? process.cwd();
      const verbose = (globalOpts['verbose'] as boolean | undefined) ?? false;

      try {
        const timeout = parseTimeout(options.timeout);

        if (options.watch) {
          await runWithWatch(file, cwd, timeout, verbose);
        } else {
          await runOnce(file, cwd, timeout, verbose);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`Error: ${message}\n`);
        process.exitCode = 1;
      }
    });
}

/**
 * Executes the workflow file once and exits.
 */
async function runOnce(
  file: string,
  cwd: string,
  timeout: number | undefined,
  verbose: boolean,
): Promise<void> {
  if (verbose) {
    const resolved = resolveWorkflowFile(file, cwd);
    process.stdout.write(`Running workflow: ${resolved}\n`);
    if (timeout !== undefined) {
      process.stdout.write(`Timeout: ${String(timeout)}ms\n`);
    }
  }

  const result = await executeWorkflow({ file, cwd, timeout });

  if (result.timedOut) {
    process.stderr.write(
      `Error: Workflow timed out after ${String(timeout)}ms\n`,
    );
    process.exitCode = 1;
    return;
  }

  if (result.exitCode !== 0) {
    process.exitCode = result.exitCode;
    return;
  }

  if (verbose) {
    process.stdout.write(`✓ Workflow completed in ${String(result.durationMs)}ms\n`);
  }
}

/**
 * Watches the workflow file for changes and re-runs on each change.
 */
async function runWithWatch(
  file: string,
  cwd: string,
  timeout: number | undefined,
  verbose: boolean,
): Promise<void> {
  const resolved = resolveWorkflowFile(file, cwd);
  process.stdout.write(`Watching ${resolved} for changes…\n`);

  // Run once initially
  await runOnce(file, cwd, timeout, verbose);

  // Watch for changes and re-run
  const watcher = fs.watch(resolved, { persistent: true }, (eventType) => {
    if (eventType === 'change') {
      process.stdout.write(`\nFile changed, re-running…\n`);
      // Reset exit code for the new run
      process.exitCode = 0;
      runOnce(file, cwd, timeout, verbose).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`Error: ${message}\n`);
        process.exitCode = 1;
      });
    }
  });

  // Keep the process alive until SIGINT/SIGTERM
  const cleanup = () => {
    watcher.close();
    process.exit(process.exitCode ?? 0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Return a promise that never resolves (keep watching)
  return new Promise(() => {});
}
