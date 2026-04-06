import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts', 'src/bin.ts'],
      reporter: ['text', 'text-summary', 'lcov', 'html'],
    },
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
});
