/**
 * @crewspace/cli — Command-line interface for Crewspace
 *
 * @packageDocumentation
 */

export const CLI_VERSION = '0.1.0';

export { createProgram } from './program.js';
export type { CLIOptions, GlobalOptions } from './types.js';
export { resolveLogLevel, resolveConfigPath } from './options.js';
