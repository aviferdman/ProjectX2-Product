/**
 * `crewspace init` — scaffold a new Crewspace project.
 *
 * This is a placeholder that registers the command structure.
 * Full implementation is tracked by TASK-055.
 *
 * @packageDocumentation
 */

import type { Command } from 'commander';

export interface InitOptions {
  readonly template?: string;
  readonly force?: boolean;
}

export function registerInitCommand(parent: Command): void {
  parent
    .command('init [directory]')
    .description('Scaffold a new Crewspace project')
    .option('-t, --template <name>', 'Project template to use', 'default')
    .option('--force', 'Overwrite existing files', false)
    .action((_directory: string | undefined, _options: InitOptions) => {
      // Stub — full implementation in TASK-055
      console.log('crewspace init is not yet implemented.');
      process.exitCode = 1;
    });
}
