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

export interface InitOptions {
  readonly template?: string;
  readonly force?: boolean;
}

/**
 * Formats the result of a scaffold operation into user-friendly output lines.
 */
export function formatScaffoldResult(result: ScaffoldResult): string {
  const lines: string[] = [];

  lines.push(`\n✓ Crewspace project created in ${result.projectDir}\n`);
  lines.push(`  Template: ${result.template}`);

  if (result.filesCreated.length > 0) {
    lines.push(`  Files created:`);
    for (const f of result.filesCreated) {
      lines.push(`    + ${f}`);
    }
  }

  if (result.filesSkipped.length > 0) {
    lines.push(`  Files skipped (already exist):`);
    for (const f of result.filesSkipped) {
      lines.push(`    - ${f}`);
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
      const targetDir = directory ?? '.';
      const template = options.template ?? 'default';
      const force = options.force ?? false;

      try {
        const result = scaffoldProject({ directory: targetDir, template, force });
        const output = formatScaffoldResult(result);
        process.stdout.write(output);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`Error: ${message}\n`);
        process.exitCode = 1;
      }
    });
}
