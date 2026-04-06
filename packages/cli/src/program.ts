/**
 * CLI program factory — creates the Commander.js program with all commands registered.
 *
 * @packageDocumentation
 */

import { Command } from 'commander';

import { CLI_VERSION } from './index.js';
import { registerInitCommand } from './commands/init.js';
import { registerRunCommand } from './commands/run.js';
import { registerValidateCommand } from './commands/validate.js';

/**
 * Creates and configures the main CLI program.
 *
 * The returned `Command` has global options and subcommands registered
 * but has NOT been parsed yet — call `.parseAsync(argv)` to execute.
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name('crewspace')
    .description('Crewspace — TypeScript-native agent orchestration framework')
    .version(CLI_VERSION, '-V, --version', 'Output the current version')
    .option('-c, --config <path>', 'Path to config file')
    .option('--verbose', 'Enable verbose output', false)
    .option('--quiet', 'Suppress all output except errors', false)
    .option('--log-level <level>', 'Set log level (debug, info, warn, error)')
    .option('--cwd <dir>', 'Set working directory')
    .configureOutput({
      writeOut: (str) => process.stdout.write(str),
      writeErr: (str) => process.stderr.write(str),
    });

  registerInitCommand(program);
  registerRunCommand(program);
  registerValidateCommand(program);

  return program;
}
