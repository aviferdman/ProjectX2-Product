import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  define: {
    // The core LLM providers reference process.env for API key fallback.
    // Provide a browser-safe shim so property access returns undefined instead of crashing.
    'process.env': '{}',
  },
  server: {
    port: 3000,
    open: false,
    strictPort: false,
  },
  build: {
    outDir: 'dist-app',
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        // Suppress node:* externalization warnings from @crewspace/core tools
        if (warning.message?.includes('__vite-browser-external')) return;
        defaultHandler(warning);
      },
    },
  },
  resolve: {
    alias: {
      '@crewspace/app': resolve(__dirname, 'src/index.ts'),
      '@crewspace/core/agent': resolve(__dirname, '../core/src/agent/index.ts'),
      '@crewspace/core/crew': resolve(__dirname, '../core/src/crew/index.ts'),
      '@crewspace/core/llm': resolve(__dirname, '../core/src/llm/index.ts'),
      '@crewspace/core/types': resolve(__dirname, '../core/src/types/index.ts'),
      '@crewspace/core': resolve(__dirname, '../core/src/index.ts'),
      '@crewspace/ui/styles': resolve(__dirname, '../ui/src/styles/globals.css'),
      '@crewspace/ui': resolve(__dirname, '../ui/src/index.ts'),
    },
  },
});
