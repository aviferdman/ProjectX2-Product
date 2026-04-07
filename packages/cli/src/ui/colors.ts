/**
 * Color theme for CLI output — wraps Chalk with semantic color functions.
 *
 * Respects the `NO_COLOR` environment variable and provides a force-disable
 * mechanism for non-interactive environments.
 *
 * @packageDocumentation
 */

import chalk from 'chalk';

/** Semantic color functions for CLI output. */
export interface ColorTheme {
  /** Green — successful operations. */
  readonly success: (text: string) => string;
  /** Red — errors. */
  readonly error: (text: string) => string;
  /** Yellow — warnings. */
  readonly warning: (text: string) => string;
  /** Cyan — informational messages. */
  readonly info: (text: string) => string;
  /** Gray/dim — secondary text. */
  readonly dim: (text: string) => string;
  /** Bold — emphasis. */
  readonly bold: (text: string) => string;
  /** Bold cyan — command names, paths. */
  readonly highlight: (text: string) => string;
  /** Magenta — labels and badges. */
  readonly label: (text: string) => string;
  /** Whether colors are enabled. */
  readonly enabled: boolean;
}

export interface ColorOptions {
  /** Force-disable colors regardless of environment. */
  readonly forceDisable?: boolean | undefined;
}

/** Identity function — returns the input unchanged. */
const identity = (text: string): string => text;

/**
 * Creates a color theme instance.
 *
 * Colors are automatically disabled when `NO_COLOR` is set or `forceDisable`
 * is `true`. This follows the https://no-color.org/ convention.
 */
export function createColorTheme(options?: ColorOptions): ColorTheme {
  const disabled = options?.forceDisable === true;

  if (disabled) {
    return {
      success: identity,
      error: identity,
      warning: identity,
      info: identity,
      dim: identity,
      bold: identity,
      highlight: identity,
      label: identity,
      enabled: false,
    };
  }

  return {
    success: (text: string) => chalk.green(text),
    error: (text: string) => chalk.red(text),
    warning: (text: string) => chalk.yellow(text),
    info: (text: string) => chalk.cyan(text),
    dim: (text: string) => chalk.dim(text),
    bold: (text: string) => chalk.bold(text),
    highlight: (text: string) => chalk.bold.cyan(text),
    label: (text: string) => chalk.magenta(text),
    enabled: chalk.level > 0,
  };
}

/** Default shared color theme instance. */
export const colors: ColorTheme = createColorTheme();
