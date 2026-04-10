import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  server: {
    port: 3000,
    open: false,
    strictPort: false,
  },
  build: {
    outDir: 'dist-app',
  },
  resolve: {
    alias: {
      '@crewspace/app': resolve(__dirname, 'src/index.ts'),
    },
  },
});
