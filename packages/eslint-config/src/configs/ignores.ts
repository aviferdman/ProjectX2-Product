import type { FlatConfig } from '../types.js';

/** Standard ignore patterns for Crewspace projects. */
export function ignores(extra?: string[]): FlatConfig[] {
  return [
    {
      ignores: [
        '**/dist/**',
        '**/node_modules/**',
        '**/coverage/**',
        '**/*.js',
        '**/*.mjs',
        '**/*.cjs',
        ...(extra ?? []),
      ],
    },
  ];
}
