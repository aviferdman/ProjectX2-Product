/**
 * `crewspace validate` — validate a Crewspace workflow file.
 *
 * This is a placeholder that registers the command structure.
 * Full implementation is tracked by TASK-057.
 *
 * @packageDocumentation
 */

import type { Command } from 'commander';

export interface ValidateOptions {
  readonly strict?: boolean;
}

export function registerValidateCommand(parent: Command): void {
  parent
    .command('validate <file>')
    .description('Validate a Crewspace workflow file')
    .option('--strict', 'Enable strict validation mode', false)
    .action((_file: string, _options: ValidateOptions) => {
      // Stub — full implementation in TASK-057
      console.log('crewspace validate is not yet implemented.');
      process.exitCode = 1;
    });
}
