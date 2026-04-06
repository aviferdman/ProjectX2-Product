import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for performance benchmarks.
 *
 * Run with: npm run bench
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['benchmarks/**/*.bench.ts'],
    testTimeout: 120_000,
    hookTimeout: 30_000,
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
});
