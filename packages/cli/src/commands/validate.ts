/**
 * `crewspace validate` — validate a Crewspace workflow file.
 *
 * Performs static analysis on a workflow file to check for:
 * - File existence and supported extension (.ts, .mts, .js, .mjs)
 * - Crewspace imports (@crewspace/core)
 * - Agent / Crew instantiation patterns with required properties
 * - Duplicate IDs across agents and tasks
 * - Reference integrity (agentId → agent, dependencies → task)
 * - (Strict mode) additional warnings for missing optional fields
 *
 * @packageDocumentation
 */

import type { Command } from 'commander';

import { validateWorkflowFile, formatValidationResult } from './validator.js';
import { createLogger } from '../ui/index.js';
import type { Verbosity } from '../ui/index.js';

export interface ValidateOptions {
  readonly strict?: boolean;
}

export function registerValidateCommand(parent: Command): void {
  parent
    .command('validate <file>')
    .description('Validate a Crewspace workflow file')
    .option('--strict', 'Enable strict validation mode', false)
    .action((file: string, options: ValidateOptions) => {
      const globalOpts = parent.opts();
      const cwd = (globalOpts['cwd'] as string | undefined) ?? process.cwd();
      const quiet = (globalOpts['quiet'] as boolean | undefined) ?? false;
      const verbose = (globalOpts['verbose'] as boolean | undefined) ?? false;
      const verbosity: Verbosity = quiet ? 'quiet' : verbose ? 'verbose' : 'normal';
      const logger = createLogger({ verbosity });

      logger.debug(`Validating file: ${file}`);
      logger.debug(`Working directory: ${cwd}`);
      logger.debug(`Strict mode: ${String(options.strict ?? false)}`);

      const startTime = Date.now();
      const spinner = logger.spinner('Validating workflow…').start();

      const result = validateWorkflowFile({
        file,
        cwd,
        strict: options.strict ?? false,
      });

      const elapsed = Date.now() - startTime;
      logger.debug(`Validation completed in ${String(elapsed)}ms`);
      logger.debug(`Resolved file: ${result.file}`);
      logger.debug(
        `Errors: ${String(result.errorCount)}, Warnings: ${String(result.warningCount)}`,
      );

      for (const diag of result.diagnostics) {
        const loc = diag.line !== undefined ? ` (line ${String(diag.line)})` : '';
        logger.debug(`  [${diag.level}]${loc}: ${diag.message}`);
      }

      if (result.valid) {
        spinner.succeed('Validation passed');
      } else {
        spinner.fail('Validation failed');
      }

      const output = formatValidationResult(result, logger.colors);
      process.stdout.write(output);

      if (!result.valid) {
        process.exitCode = 1;
      }
    });
}
