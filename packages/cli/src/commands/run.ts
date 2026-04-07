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
import { createLogger } from '../ui/index.js';
import type { Verbosity } from '../ui/index.js';

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
      const quiet = (globalOpts['quiet'] as boolean | undefined) ?? false;

      const verbosity: Verbosity = quiet ? 'quiet' : verbose ? 'verbose' : 'normal';
      const logger = createLogger({ verbosity });

      try {
        const timeout = parseTimeout(options.timeout);

        if (options.watch) {
          await runWithWatch(file, cwd, timeout, logger);
        } else {
          await runOnce(file, cwd, timeout, logger);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(message);
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
  logger: ReturnType<typeof createLogger>,
): Promise<void> {
  const resolved = resolveWorkflowFile(file, cwd);
  logger.debug(`Running workflow: ${resolved}`);
  if (timeout !== undefined) {
    logger.debug(`Timeout: ${String(timeout)}ms`);
  }

  const spinner = logger.spinner('Running workflow…').start();

  const result = await executeWorkflow({ file, cwd, timeout });

  if (result.timedOut) {
    spinner.fail(`Workflow timed out after ${String(timeout)}ms`);
    process.exitCode = 1;
    return;
  }

  if (result.exitCode !== 0) {
    spinner.fail(`Workflow failed with exit code ${String(result.exitCode)}`);
    process.exitCode = result.exitCode;
    return;
  }

  spinner.succeed(`Workflow completed in ${String(result.durationMs)}ms`);
}

/**
 * Watches the workflow file for changes and re-runs on each change.
 */
async function runWithWatch(
  file: string,
  cwd: string,
  timeout: number | undefined,
  logger: ReturnType<typeof createLogger>,
): Promise<void> {
  const resolved = resolveWorkflowFile(file, cwd);
  logger.info(`Watching ${logger.colors.highlight(resolved)} for changes…`);

  // Run once initially
  await runOnce(file, cwd, timeout, logger);

  // Watch for changes and re-run
  const watcher = fs.watch(resolved, { persistent: true }, (eventType) => {
    if (eventType === 'change') {
      logger.info('File changed, re-running…');
      process.exitCode = 0;
      runOnce(file, cwd, timeout, logger).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(message);
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
