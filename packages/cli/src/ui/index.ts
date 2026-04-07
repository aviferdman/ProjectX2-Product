/**
 * UI module — progress indicators and colored output for the CLI.
 *
 * @packageDocumentation
 */

export { createColorTheme, colors } from './colors.js';
export type { ColorTheme, ColorOptions } from './colors.js';

export { createSpinner, createNoopSpinner } from './spinner.js';
export type { Spinner, SpinnerOptions } from './spinner.js';

export { createLogger } from './logger.js';
export type { Logger, LoggerOptions, Verbosity } from './logger.js';
