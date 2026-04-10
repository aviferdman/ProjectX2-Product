import { defineProject } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootModules = path.resolve(__dirname, '../../node_modules');

export default defineProject({
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      // Force all React imports to the root copy to avoid dual-instance issues
      react: path.join(rootModules, 'react'),
      'react-dom': path.join(rootModules, 'react-dom'),
      'react/jsx-runtime': path.join(rootModules, 'react/jsx-runtime'),
      'react/jsx-dev-runtime': path.join(rootModules, 'react/jsx-dev-runtime'),
    },
  },
  test: {
    name: 'ui',
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
});
