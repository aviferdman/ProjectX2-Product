import tseslint from 'typescript-eslint';
import type { FlatConfig } from '../types.js';

/**
 * Strict config layered on top of recommended.
 * Enables additional type-checked rules that catch subtle bugs
 * in agent orchestration code — unsafe assignments, unchecked returns,
 * and loose boolean expressions.
 */
export function strict(options: {
  readonly files?: string[];
}): FlatConfig[] {
  const files = options.files ?? ['**/*.ts'];

  return [
    ...tseslint.configs.strictTypeChecked,

    {
      files,
      rules: {
        // Prevent unsafe type operations that can cause runtime errors in agents
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        '@typescript-eslint/no-unsafe-return': 'error',
        '@typescript-eslint/no-unsafe-argument': 'error',

        // Stricter boolean checks — prevents truthy/falsy surprises in agent config
        '@typescript-eslint/strict-boolean-expressions': [
          'error',
          {
            allowString: true,
            allowNumber: false,
            allowNullableObject: true,
            allowNullableBoolean: true,
            allowNullableString: false,
            allowNullableNumber: false,
            allowAny: false,
          },
        ],

        // Exhaustive switch for enums (agent status, task status, etc.)
        '@typescript-eslint/switch-exhaustiveness-check': 'error',

        // Prevent non-Error throws — agents should always throw proper Error objects
        '@typescript-eslint/only-throw-error': 'error',

        // Restrict template literal types to safe expressions
        '@typescript-eslint/restrict-template-expressions': [
          'error',
          {
            allowNumber: true,
            allowBoolean: false,
            allowNullish: false,
          },
        ],
      },
    },
  ];
}
