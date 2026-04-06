/**
 * CLI types and interfaces.
 *
 * @packageDocumentation
 */

/** Global options available to all commands. */
export interface GlobalOptions {
  /** Path to the crewspace configuration file. */
  readonly config?: string;
  /** Enable verbose/debug output. */
  readonly verbose?: boolean;
  /** Suppress all output except errors. */
  readonly quiet?: boolean;
  /** Log level override (debug, info, warn, error). */
  readonly logLevel?: string;
  /** Working directory override. */
  readonly cwd?: string;
}

/** Resolved CLI options after parsing and validation. */
export interface CLIOptions {
  readonly config: string | undefined;
  readonly verbose: boolean;
  readonly quiet: boolean;
  readonly logLevel: string;
  readonly cwd: string;
}
