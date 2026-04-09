import { defineWorkspace } from 'vitest/config';

/**
 * Vitest workspace configuration for monorepo.
 * Each package defines its own vitest.config.ts with specific settings.
 */
export default defineWorkspace([
  'packages/*',
  {
    test: {
      name: 'community',
      root: './community',
      include: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
      environment: 'node',
    },
  },
  {
    test: {
      name: 'scripts',
      root: './scripts',
      include: ['__tests__/**/*.test.ts'],
      environment: 'node',
    },
  },
  {
    test: {
      name: 'docs',
      root: './docs',
      include: ['__tests__/**/*.test.ts'],
      environment: 'node',
    },
  },
  {
    test: {
      name: 'design',
      root: './src/design',
      include: ['__tests__/**/*.test.ts'],
      environment: 'node',
    },
  },
]);
