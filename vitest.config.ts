import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for monorepo.
 * Each package defines its own vitest.config.ts with specific settings.
 * Uses the modern `projects` API (replaces deprecated workspace).
 */
export default defineConfig({
  test: {
    projects: [
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
          testTimeout: 30_000,
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
    ],
  },
});
