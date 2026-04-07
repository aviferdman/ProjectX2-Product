import type { Options } from 'prettier';

/**
 * Options for customizing the Crewspace Prettier config.
 */
export interface CrewspacePrettierOptions {
  /** Print semicolons at the ends of statements. Default: `true` */
  readonly semi?: boolean;

  /** Use single quotes instead of double quotes. Default: `true` */
  readonly singleQuote?: boolean;

  /** Print trailing commas wherever possible in multi-line structures. Default: `"all"` */
  readonly trailingComma?: 'all' | 'es5' | 'none';

  /** Line width before wrapping. Default: `100` */
  readonly printWidth?: number;

  /** Number of spaces per indentation level. Default: `2` */
  readonly tabWidth?: number;

  /** Indent with tabs instead of spaces. Default: `false` */
  readonly useTabs?: boolean;

  /** Print spaces between brackets in object literals. Default: `true` */
  readonly bracketSpacing?: boolean;

  /** Include parentheses around a sole arrow function parameter. Default: `"always"` */
  readonly arrowParens?: 'always' | 'avoid';

  /** Line ending style. Default: `"lf"` */
  readonly endOfLine?: 'lf' | 'crlf' | 'cr' | 'auto';

  /** Additional Prettier options to merge (for plugins or advanced settings). */
  readonly overrides?: Partial<Options>;
}

export type { Options as PrettierOptions };
