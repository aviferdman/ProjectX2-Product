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

      const result = validateWorkflowFile({
        file,
        cwd,
        strict: options.strict ?? false,
      });

      const output = formatValidationResult(result);
      process.stdout.write(output);

      if (!result.valid) {
        process.exitCode = 1;
      }
    });
}
