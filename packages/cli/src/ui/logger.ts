/**
 * High-level CLI logger — combines colored output and spinners.
 *
 * Respects `--quiet` and `--verbose` flags:
 * - **quiet**: suppresses everything except errors
 * - **verbose**: enables debug output
 * - **default**: info, success, warning, and error
 *
 * @packageDocumentation
 */

import { createColorTheme } from './colors.js';
import { createSpinner } from './spinner.js';
import type { ColorTheme } from './colors.js';
import type { Spinner } from './spinner.js';

/** Logger verbosity level. */
export type Verbosity = 'quiet' | 'normal' | 'verbose';

export interface LoggerOptions {
  /** Verbosity mode. */
  readonly verbosity?: Verbosity | undefined;
  /** Force-disable colors. */
  readonly noColor?: boolean | undefined;
  /** Output stream for normal messages. Defaults to `process.stdout`. */
  readonly stdout?: NodeJS.WritableStream | undefined;
  /** Output stream for errors. Defaults to `process.stderr`. */
  readonly stderr?: NodeJS.WritableStream | undefined;
}

/** CLI logger with colored output and spinner support. */
export interface Logger {
  /** Print a success message with green checkmark. */
  success(message: string): void;
  /** Print an error message to stderr. */
  error(message: string): void;
  /** Print a warning message. */
  warn(message: string): void;
  /** Print an informational message. */
  info(message: string): void;
  /** Print a debug message (only in verbose mode). */
  debug(message: string): void;
  /** Print a raw message (respects quiet mode). */
  log(message: string): void;
  /** Create a new spinner. Disabled in quiet mode. */
  spinner(text?: string): Spinner;
  /** The color theme in use. */
  readonly colors: ColorTheme;
  /** Current verbosity level. */
  readonly verbosity: Verbosity;
}

/**
 * Creates a CLI logger instance.
 */
export function createLogger(options?: LoggerOptions): Logger {
  const verbosity = options?.verbosity ?? 'normal';
  const isQuiet = verbosity === 'quiet';
  const isVerbose = verbosity === 'verbose';
  const theme = createColorTheme({ forceDisable: options?.noColor });
  const stdout = options?.stdout ?? process.stdout;
  const stderr = options?.stderr ?? process.stderr;

  function write(stream: NodeJS.WritableStream, message: string): void {
    stream.write(message + '\n');
  }

  return {
    success(message: string) {
      if (isQuiet) return;
      write(stdout, `${theme.success('✔')} ${message}`);
    },

    error(message: string) {
      write(stderr, `${theme.error('✖')} ${theme.error(message)}`);
    },

    warn(message: string) {
      if (isQuiet) return;
      write(stderr, `${theme.warning('⚠')} ${theme.warning(message)}`);
    },

    info(message: string) {
      if (isQuiet) return;
      write(stdout, `${theme.info('ℹ')} ${message}`);
    },

    debug(message: string) {
      if (!isVerbose) return;
      write(stdout, `${theme.dim(`[debug] ${message}`)}`);
    },

    log(message: string) {
      if (isQuiet) return;
      write(stdout, message);
    },

    spinner(text?: string) {
      return createSpinner({
        text,
        disabled: isQuiet,
        stream: stderr,
      });
    },

    get colors() {
      return theme;
    },

    get verbosity() {
      return verbosity;
    },
  };
}
