import type tseslint from 'typescript-eslint';

export interface CrewspaceConfigOptions {
  /** TypeScript project paths for type-aware linting. Defaults to `true` (auto-detect). */
  readonly project?: boolean | string | string[];

  /** Root directory for TypeScript project resolution. Defaults to `process.cwd()`. */
  readonly tsconfigRootDir?: string;

  /** File patterns to lint. Defaults to `['**\/*.ts']`. */
  readonly files?: string[];

  /** File patterns to ignore. */
  readonly ignores?: string[];

  /** Enable stricter rules beyond recommended. */
  readonly strict?: boolean;

  /** Relax rules for test files. Defaults to `true`. */
  readonly testOverrides?: boolean;

  /** Test file patterns. Defaults to common test patterns. */
  readonly testFiles?: string[];
}

export type FlatConfig = ReturnType<typeof tseslint.config>[number];
export type FlatConfigArray = ReturnType<typeof tseslint.config>;
