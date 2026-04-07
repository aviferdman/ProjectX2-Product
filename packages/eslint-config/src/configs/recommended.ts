import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import type { FlatConfig } from '../types.js';

/**
 * Base ESLint + TypeScript config with Crewspace recommended rules.
 * Enforces type safety, async correctness, and clean code patterns
 * essential for agent orchestration workflows.
 */
export function recommended(options: {
  readonly files?: string[];
  readonly project?: boolean | string | string[];
  readonly tsconfigRootDir?: string;
}): FlatConfig[] {
  const files = options.files ?? ['**/*.ts'];
  const projectService = options.project === undefined ? true : options.project;
  const tsconfigRootDir = options.tsconfigRootDir ?? process.cwd();

  return [
    eslint.configs.recommended,

    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,

    {
      files,
      languageOptions: {
        globals: {
          ...globals.node,
        },
        parserOptions:
          typeof projectService === 'boolean'
            ? { projectService, tsconfigRootDir }
            : { project: projectService, tsconfigRootDir },
      },
      rules: {
        // --- Async correctness (critical for agent orchestration) ---
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/require-await': 'error',
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/return-await': ['error', 'in-try-catch'],

        // --- Type safety ---
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
            allowHigherOrderFunctions: true,
          },
        ],
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/prefer-readonly': 'error',

        // --- Naming conventions ---
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'variable',
            format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
            leadingUnderscore: 'allow',
          },
          {
            selector: 'function',
            format: ['camelCase', 'PascalCase'],
          },
          {
            selector: 'typeLike',
            format: ['PascalCase'],
          },
          {
            selector: 'enumMember',
            format: ['UPPER_CASE', 'PascalCase'],
          },
        ],

        // --- General best practices ---
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        eqeqeq: ['error', 'always'],
        'no-eval': 'error',
        'prefer-const': 'error',
        'no-var': 'error',
        'no-throw-literal': 'error',
        'prefer-promise-reject-errors': 'error',
      },
    },
  ];
}
