import type { Options } from 'prettier';
import type { CrewspacePrettierOptions } from './types.js';

/**
 * The Crewspace base Prettier config.
 *
 * Enforces consistent formatting across all Crewspace projects:
 * - Single quotes for strings
 * - Trailing commas everywhere (cleaner diffs)
 * - 100-char line width (readable without excessive wrapping)
 * - 2-space indentation (TypeScript community standard)
 * - LF line endings (cross-platform consistency)
 */
const config: Options = {
  semi: true,
  trailingComma: 'all',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
};

/**
 * Create a customized Crewspace Prettier config.
 *
 * @example
 * ```js
 * // .prettierrc.mjs
 * import { createConfig } from '@crewspace/prettier-config';
 *
 * export default createConfig({ printWidth: 120 });
 * ```
 *
 * @example
 * ```js
 * // Use defaults — no customization needed
 * import { createConfig } from '@crewspace/prettier-config';
 *
 * export default createConfig();
 * ```
 */
export function createConfig(options: CrewspacePrettierOptions = {}): Options {
  const { overrides, ...directOptions } = options;

  return {
    ...config,
    ...directOptions,
    ...overrides,
  };
}

/**
 * The default ignore patterns for Prettier in Crewspace projects.
 * Use these in your `.prettierignore` or pass to Prettier's `--ignore-path`.
 */
export const DEFAULT_IGNORE_PATTERNS: readonly string[] = [
  'dist',
  'node_modules',
  'coverage',
  'package-lock.json',
  '*.md',
];

export default config;
export { config };
export type { CrewspacePrettierOptions, PrettierOptions } from './types.js';
