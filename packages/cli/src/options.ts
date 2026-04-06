/**
 * Option resolution helpers.
 *
 * @packageDocumentation
 */

const VALID_LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

export type LogLevel = (typeof VALID_LOG_LEVELS)[number];

/**
 * Resolves the effective log level from CLI flags.
 *
 * Priority: --quiet → error, --verbose → debug, --log-level → value, default → info
 */
export function resolveLogLevel(opts: {
  quiet?: boolean;
  verbose?: boolean;
  logLevel?: string;
}): LogLevel {
  if (opts.quiet) return 'error';
  if (opts.verbose) return 'debug';

  if (opts.logLevel !== undefined) {
    const normalized = opts.logLevel.toLowerCase().trim();
    if (isValidLogLevel(normalized)) return normalized;
    throw new Error(
      `Invalid log level "${opts.logLevel}". Valid values: ${VALID_LOG_LEVELS.join(', ')}`,
    );
  }

  return 'info';
}

function isValidLogLevel(value: string): value is LogLevel {
  return (VALID_LOG_LEVELS as readonly string[]).includes(value);
}

/**
 * Resolves the configuration file path.
 *
 * Uses the --config flag if provided, otherwise falls back to
 * `crewspace.config.ts` in the working directory.
 */
export function resolveConfigPath(configFlag: string | undefined, cwd: string): string {
  if (configFlag !== undefined) return configFlag;
  return `${cwd}/crewspace.config.ts`;
}
