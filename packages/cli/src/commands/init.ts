/**
 * `crewspace init` — scaffold a new Crewspace project.
 *
 * Creates a new directory (or uses the current one) and writes template files
 * that give the user a working Crewspace project out of the box.
 *
 * @packageDocumentation
 */

import type { Command } from 'commander';

import { scaffoldProject } from './scaffold.js';
import type { ScaffoldResult } from './scaffold.js';
import { TEMPLATE_NAMES } from './templates.js';
import { createLogger } from '../ui/index.js';
import type { ColorTheme, Verbosity } from '../ui/index.js';

export interface InitOptions {
  readonly template?: string;
  readonly force?: boolean;
}

/**
 * Formats the result of a scaffold operation into user-friendly output lines.
 * Accepts an optional color theme for colored output.
 */
export function formatScaffoldResult(result: ScaffoldResult, theme?: ColorTheme): string {
  const lines: string[] = [];
  const s = theme?.success ?? ((t: string) => t);
  const w = theme?.warning ?? ((t: string) => t);
  const d = theme?.dim ?? ((t: string) => t);
  const h = theme?.highlight ?? ((t: string) => t);

  lines.push(`\n${s('✓')} Crewspace project created in ${h(result.projectDir)}\n`);
  lines.push(`  Template: ${result.template}`);

  if (result.filesCreated.length > 0) {
    lines.push(`  Files created:`);
    for (const f of result.filesCreated) {
      lines.push(`    ${s('+')} ${f}`);
    }
  }

  if (result.filesSkipped.length > 0) {
    lines.push(`  Files skipped (already exist):`);
    for (const f of result.filesSkipped) {
      lines.push(`    ${w('-')} ${d(f)}`);
    }
  }

  lines.push('');
  lines.push('  Next steps:');
  lines.push(`    cd ${result.projectDir}`);
  lines.push('    npm install');
  lines.push('    npm start');
  lines.push('');

  return lines.join('\n');
}

export function registerInitCommand(parent: Command): void {
  parent
    .command('init [directory]')
    .description('Scaffold a new Crewspace project')
    .option(
      '-t, --template <name>',
      `Project template to use (${TEMPLATE_NAMES.join(', ')})`,
      'default',
    )
    .option('--force', 'Overwrite existing files', false)
    .action((directory: string | undefined, options: InitOptions) => {
      const globalOpts = parent.opts();
      const quiet = (globalOpts['quiet'] as boolean | undefined) ?? false;
      const verbose = (globalOpts['verbose'] as boolean | undefined) ?? false;
      const verbosity: Verbosity = quiet ? 'quiet' : verbose ? 'verbose' : 'normal';
      const logger = createLogger({ verbosity });

      const targetDir = directory ?? '.';
      const template = options.template ?? 'default';
      const force = options.force ?? false;

      try {
        const spinner = logger.spinner('Scaffolding project…').start();
        const result = scaffoldProject({ directory: targetDir, template, force });
        spinner.stop();

        const output = formatScaffoldResult(result, logger.colors);
        process.stdout.write(output);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(message);
        process.exitCode = 1;
      }
    });
}
