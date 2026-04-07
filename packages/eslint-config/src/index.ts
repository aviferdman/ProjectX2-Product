import type { CrewspaceConfigOptions, FlatConfigArray } from './types.js';
import { ignores } from './configs/ignores.js';
import { recommended } from './configs/recommended.js';
import { strict } from './configs/strict.js';
import { testOverrides } from './configs/test-overrides.js';

/**
 * Create a complete ESLint flat config for a Crewspace project.
 *
 * @example
 * ```js
 * // eslint.config.mjs
 * import { crewspaceConfig } from '@crewspace/eslint-config';
 *
 * export default crewspaceConfig();
 * ```
 *
 * @example
 * ```js
 * // With options
 * import { crewspaceConfig } from '@crewspace/eslint-config';
 *
 * export default crewspaceConfig({
 *   strict: true,
 *   project: './tsconfig.json',
 *   ignores: ['generated/**'],
 * });
 * ```
 */
export function crewspaceConfig(options: CrewspaceConfigOptions = {}): FlatConfigArray {
  const {
    files,
    project,
    tsconfigRootDir,
    strict: useStrict = false,
    testOverrides: useTestOverrides = true,
    testFiles,
    ignores: extraIgnores,
  } = options;

  const configs: FlatConfigArray = [
    ...ignores(extraIgnores),
    ...recommended({
      ...(files !== undefined ? { files } : {}),
      ...(project !== undefined ? { project } : {}),
      ...(tsconfigRootDir !== undefined ? { tsconfigRootDir } : {}),
    }),
  ];

  if (useStrict) {
    configs.push(...strict(files !== undefined ? { files } : {}));
  }

  if (useTestOverrides) {
    configs.push(...testOverrides(testFiles !== undefined ? { testFiles } : undefined));
  }

  return configs;
}

// Re-export individual configs for advanced composition
export { recommended, strict, testOverrides, ignores };
export * from './configs/index.js';
export type { CrewspaceConfigOptions, FlatConfig, FlatConfigArray } from './types.js';
