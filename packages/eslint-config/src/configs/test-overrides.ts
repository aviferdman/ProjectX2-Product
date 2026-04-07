import type { FlatConfig } from '../types.js';

const DEFAULT_TEST_FILES = [
  '**/*.test.ts',
  '**/*.spec.ts',
  '**/tests/**/*.ts',
  '**/__tests__/**/*.ts',
];

/**
 * Relaxed overrides for test files.
 * Tests often need `any`, unbound methods, and loose typing
 * for mocks and assertions.
 */
export function testOverrides(options?: { readonly testFiles?: string[] }): FlatConfig[] {
  const files = options?.testFiles ?? DEFAULT_TEST_FILES;

  return [
    {
      files,
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-confusing-void-expression': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/naming-convention': 'off',
        '@typescript-eslint/no-unnecessary-condition': 'off',
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        '@typescript-eslint/only-throw-error': 'off',
        '@typescript-eslint/prefer-optional-chain': 'off',
        '@typescript-eslint/prefer-promise-reject-errors': 'off',
        '@typescript-eslint/strict-boolean-expressions': 'off',
        '@typescript-eslint/switch-exhaustiveness-check': 'off',
        '@typescript-eslint/no-unsafe-enum-comparison': 'off',
        '@typescript-eslint/prefer-regexp-exec': 'off',
        '@typescript-eslint/array-type': 'off',
        '@typescript-eslint/consistent-indexed-object-style': 'off',
        '@typescript-eslint/dot-notation': 'off',
        'no-console': 'off',
      },
    },
  ];
}
