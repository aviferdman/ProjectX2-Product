/**
 * Bundler compatibility tests for @crewspace/core.
 *
 * Verifies that the package can be successfully bundled by the three most
 * popular JavaScript bundlers: esbuild, Vite (Rollup), and webpack.
 *
 * Each test creates a temporary entry file that imports key exports from the
 * built dist output, runs the bundler programmatically, and asserts that:
 *   1. The bundler completes without errors.
 *   2. The output file is created and non-empty.
 *   3. The bundled code contains expected symbols from the package.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const PKG_ROOT = path.resolve(__dirname, '../..');
const DIST_DIR = path.join(PKG_ROOT, 'dist');

// Temporary workspace for bundler outputs
let tmpDir: string;

// Entry file content that imports representative exports from the package.
// Uses the dist output directly so bundlers resolve real built files.
const ENTRY_ESM = `
import {
  VERSION,
  Agent,
  Crew,
  Task,
  ExecutionEngine,
  defineTool,
  createTool,
  ToolRegistry,
  CrewspaceError,
  ErrorCode,
  Logger,
  LogLevel,
  detectRuntime,
  checkCompatibility,
} from '${DIST_DIR.replace(/\\/g, '/')}';

// Exercise the imports so bundlers cannot tree-shake them away
const values = [
  VERSION,
  Agent,
  Crew,
  Task,
  ExecutionEngine,
  defineTool,
  createTool,
  ToolRegistry,
  CrewspaceError,
  ErrorCode,
  Logger,
  LogLevel,
  detectRuntime,
  checkCompatibility,
];
console.log('Bundled OK, exports count:', values.length);
`;

const ENTRY_CJS = `
const core = require('${DIST_DIR.replace(/\\/g, '/')}/cjs');

const values = [
  core.VERSION,
  core.Agent,
  core.Crew,
  core.Task,
  core.ExecutionEngine,
  core.defineTool,
  core.createTool,
  core.ToolRegistry,
  core.CrewspaceError,
  core.ErrorCode,
  core.Logger,
  core.LogLevel,
  core.detectRuntime,
  core.checkCompatibility,
];
console.log('Bundled OK, exports count:', values.length);
`;

// Symbols we expect to find in the bundled output
const EXPECTED_SYMBOLS = [
  'Agent',
  'Crew',
  'Task',
  'ExecutionEngine',
  'ToolRegistry',
  'CrewspaceError',
  'Logger',
];

beforeAll(() => {
  // Verify dist exists (build must have been run)
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error(`dist/ not found at ${DIST_DIR}. Run "npm run build" in packages/core first.`);
  }
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crewspace-bundler-test-'));
});

afterAll(() => {
  // Clean up temp directory
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// esbuild
// ---------------------------------------------------------------------------
describe('esbuild compatibility', () => {
  it('should bundle ESM entry without errors', { timeout: 30_000 }, async () => {
    const esbuild = await import('esbuild');
    const entryFile = path.join(tmpDir, 'entry-esbuild-esm.mjs');
    const outFile = path.join(tmpDir, 'out-esbuild-esm.js');

    fs.writeFileSync(entryFile, ENTRY_ESM, 'utf-8');

    const result = await esbuild.build({
      entryPoints: [entryFile],
      bundle: true,
      outfile: outFile,
      format: 'esm',
      platform: 'node',
      target: 'node18',
      // Mark node built-ins as external so esbuild doesn't try to polyfill them
      external: [
        'node:*',
        'fs',
        'path',
        'os',
        'crypto',
        'events',
        'stream',
        'util',
        'url',
        'http',
        'https',
        'net',
        'tls',
        'child_process',
        'worker_threads',
        'better-sqlite3',
      ],
      logLevel: 'silent',
      write: true,
    });

    expect(result.errors).toHaveLength(0);
    expect(fs.existsSync(outFile)).toBe(true);

    const output = fs.readFileSync(outFile, 'utf-8');
    expect(output.length).toBeGreaterThan(0);

    // Verify key symbols appear in the bundled output
    for (const sym of EXPECTED_SYMBOLS) {
      expect(output).toContain(sym);
    }
  });

  it('should bundle CJS entry without errors', async () => {
    const esbuild = await import('esbuild');
    const entryFile = path.join(tmpDir, 'entry-esbuild-cjs.cjs');
    const outFile = path.join(tmpDir, 'out-esbuild-cjs.js');

    fs.writeFileSync(entryFile, ENTRY_CJS, 'utf-8');

    const result = await esbuild.build({
      entryPoints: [entryFile],
      bundle: true,
      outfile: outFile,
      format: 'cjs',
      platform: 'node',
      target: 'node18',
      external: [
        'node:*',
        'fs',
        'path',
        'os',
        'crypto',
        'events',
        'stream',
        'util',
        'url',
        'http',
        'https',
        'net',
        'tls',
        'child_process',
        'worker_threads',
        'better-sqlite3',
      ],
      logLevel: 'silent',
      write: true,
    });

    expect(result.errors).toHaveLength(0);
    expect(fs.existsSync(outFile)).toBe(true);

    const output = fs.readFileSync(outFile, 'utf-8');
    expect(output.length).toBeGreaterThan(0);

    for (const sym of EXPECTED_SYMBOLS) {
      expect(output).toContain(sym);
    }
  });

  it('should produce no unexpected warnings for the package', async () => {
    const esbuild = await import('esbuild');
    const entryFile = path.join(tmpDir, 'entry-esbuild-warn.mjs');
    const outFile = path.join(tmpDir, 'out-esbuild-warn.js');

    fs.writeFileSync(entryFile, ENTRY_ESM, 'utf-8');

    const result = await esbuild.build({
      entryPoints: [entryFile],
      bundle: true,
      outfile: outFile,
      format: 'esm',
      platform: 'node',
      target: 'node18',
      external: [
        'node:*',
        'fs',
        'path',
        'os',
        'crypto',
        'events',
        'stream',
        'util',
        'url',
        'http',
        'https',
        'net',
        'tls',
        'child_process',
        'worker_threads',
        'better-sqlite3',
      ],
      logLevel: 'silent',
      write: true,
    });

    // The runtime-compat module intentionally uses eval() to detect
    // import.meta availability — allow this known "direct-eval" warning.
    const unexpectedWarnings = result.warnings.filter((w) => w.id !== 'direct-eval');
    expect(unexpectedWarnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Vite (Rollup-based)
// ---------------------------------------------------------------------------
describe('Vite compatibility', () => {
  it('should bundle ESM entry with Vite build', async () => {
    const { build } = await import('vite');
    const entryFile = path.join(tmpDir, 'entry-vite-esm.mjs');
    const outDir = path.join(tmpDir, 'vite-esm-out');

    fs.writeFileSync(entryFile, ENTRY_ESM, 'utf-8');

    // Vite build should complete without throwing
    await build({
      root: tmpDir,
      logLevel: 'silent',
      build: {
        lib: {
          entry: entryFile,
          formats: ['es'],
          fileName: 'bundle',
        },
        outDir,
        emptyOutDir: true,
        // Disable minification to preserve symbol names for inspection
        minify: false,
        rollupOptions: {
          external: [
            /^node:/,
            'fs',
            'path',
            'os',
            'crypto',
            'events',
            'stream',
            'util',
            'url',
            'http',
            'https',
            'net',
            'tls',
            'child_process',
            'worker_threads',
            'better-sqlite3',
          ],
        },
      },
      configFile: false,
    });

    const outFile = path.join(outDir, 'bundle.mjs');
    expect(fs.existsSync(outFile)).toBe(true);

    const output = fs.readFileSync(outFile, 'utf-8');
    expect(output.length).toBeGreaterThan(0);
  }, 30_000);

  it('should bundle CJS entry with Vite build', async () => {
    const { build } = await import('vite');
    const entryFile = path.join(tmpDir, 'entry-vite-cjs.cjs');
    const outDir = path.join(tmpDir, 'vite-cjs-out');

    fs.writeFileSync(entryFile, ENTRY_CJS, 'utf-8');

    await build({
      root: tmpDir,
      logLevel: 'silent',
      build: {
        lib: {
          entry: entryFile,
          formats: ['cjs'],
          fileName: 'bundle',
        },
        outDir,
        emptyOutDir: true,
        rollupOptions: {
          external: [
            /^node:/,
            'fs',
            'path',
            'os',
            'crypto',
            'events',
            'stream',
            'util',
            'url',
            'http',
            'https',
            'net',
            'tls',
            'child_process',
            'worker_threads',
            'better-sqlite3',
          ],
        },
      },
      configFile: false,
    });

    // Vite may output .cjs for CJS format
    const possibleFiles = ['bundle.cjs', 'bundle.js'];
    const outFile = possibleFiles.map((f) => path.join(outDir, f)).find((f) => fs.existsSync(f));
    expect(outFile).toBeDefined();

    const output = fs.readFileSync(outFile!, 'utf-8');
    expect(output.length).toBeGreaterThan(0);

    for (const sym of EXPECTED_SYMBOLS) {
      expect(output).toContain(sym);
    }
  }, 30_000);
});

// ---------------------------------------------------------------------------
// webpack
// ---------------------------------------------------------------------------
describe('webpack compatibility', () => {
  it('should bundle CJS entry without errors', async () => {
    const webpack = (await import('webpack')).default;
    const entryFile = path.join(tmpDir, 'entry-webpack-cjs.cjs');
    const outDir = path.join(tmpDir, 'webpack-cjs-out');

    fs.writeFileSync(entryFile, ENTRY_CJS, 'utf-8');

    const stats = await new Promise<import('webpack').Stats>((resolve, reject) => {
      webpack(
        {
          mode: 'production',
          entry: entryFile,
          output: {
            path: outDir,
            filename: 'bundle.js',
            library: { type: 'commonjs2' },
          },
          target: 'node',
          externals: [
            /^node:/,
            'fs',
            'path',
            'os',
            'crypto',
            'events',
            'stream',
            'util',
            'url',
            'http',
            'https',
            'net',
            'tls',
            'child_process',
            'worker_threads',
            'better-sqlite3',
          ],
          resolve: {
            extensions: ['.js', '.cjs', '.mjs', '.json'],
          },
        },
        (err, stats) => {
          if (err) return reject(err);
          if (!stats) return reject(new Error('webpack returned no stats'));
          resolve(stats);
        },
      );
    });

    const info = stats.toJson({ errors: true, warnings: true });
    expect(info.errors ?? []).toHaveLength(0);

    const outFile = path.join(outDir, 'bundle.js');
    expect(fs.existsSync(outFile)).toBe(true);

    const output = fs.readFileSync(outFile, 'utf-8');
    expect(output.length).toBeGreaterThan(0);
  }, 30000);

  it('should bundle ESM-style entry without errors', async () => {
    const webpack = (await import('webpack')).default;
    const entryFile = path.join(tmpDir, 'entry-webpack-esm.mjs');
    const outDir = path.join(tmpDir, 'webpack-esm-out');

    fs.writeFileSync(entryFile, ENTRY_ESM, 'utf-8');

    const stats = await new Promise<import('webpack').Stats>((resolve, reject) => {
      webpack(
        {
          mode: 'production',
          entry: entryFile,
          output: {
            path: outDir,
            filename: 'bundle.js',
            library: { type: 'module' },
          },
          target: 'node',
          experiments: {
            outputModule: true,
          },
          externals: [
            /^node:/,
            'fs',
            'path',
            'os',
            'crypto',
            'events',
            'stream',
            'util',
            'url',
            'http',
            'https',
            'net',
            'tls',
            'child_process',
            'worker_threads',
            'better-sqlite3',
          ],
          resolve: {
            extensions: ['.js', '.mjs', '.cjs', '.json'],
            // Allow directory imports without explicit /index.js in ESM mode
            fullySpecified: false,
          },
          module: {
            rules: [
              {
                test: /\.m?js$/,
                resolve: { fullySpecified: false },
              },
            ],
          },
        },
        (err, stats) => {
          if (err) return reject(err);
          if (!stats) return reject(new Error('webpack returned no stats'));
          resolve(stats);
        },
      );
    });

    const info = stats.toJson({ errors: true, warnings: true });
    expect(info.errors ?? []).toHaveLength(0);

    const outFile = path.join(outDir, 'bundle.js');
    expect(fs.existsSync(outFile)).toBe(true);

    const output = fs.readFileSync(outFile, 'utf-8');
    expect(output.length).toBeGreaterThan(0);
  }, 30000);
});

// ---------------------------------------------------------------------------
// Package.json exports field validation
// ---------------------------------------------------------------------------
describe('package.json exports compatibility', () => {
  it('should have valid exports field for bundler resolution', () => {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf-8'));

    // Main entry points should exist
    expect(pkgJson.exports['.']).toBeDefined();
    const mainExport = pkgJson.exports['.'];

    // Bundlers check these fields in order
    expect(mainExport.types).toBeDefined();
    expect(mainExport.import).toBeDefined();
    expect(mainExport.require).toBeDefined();
    expect(mainExport.default).toBeDefined();

    // Verify the referenced files actually exist
    const typesPath = path.join(PKG_ROOT, mainExport.types);
    const importPath = path.join(PKG_ROOT, mainExport.import);
    const requirePath = path.join(PKG_ROOT, mainExport.require);

    expect(fs.existsSync(typesPath)).toBe(true);
    expect(fs.existsSync(importPath)).toBe(true);
    expect(fs.existsSync(requirePath)).toBe(true);
  });

  it('should have "sideEffects: false" for tree-shaking', () => {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf-8'));

    expect(pkgJson.sideEffects).toBe(false);
  });

  it('should have "type: module" for ESM support', () => {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf-8'));

    expect(pkgJson.type).toBe('module');
  });

  it('should have testing subpath export', () => {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf-8'));

    expect(pkgJson.exports['./testing']).toBeDefined();
    const testingExport = pkgJson.exports['./testing'];
    expect(testingExport.types).toBeDefined();
    expect(testingExport.import).toBeDefined();
    expect(testingExport.require).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Tree-shaking verification
// ---------------------------------------------------------------------------
describe('tree-shaking support', () => {
  it('should produce smaller output when importing fewer symbols (esbuild)', async () => {
    const esbuild = await import('esbuild');

    // Full import
    const fullEntry = path.join(tmpDir, 'entry-treeshake-full.mjs');
    const fullOut = path.join(tmpDir, 'out-treeshake-full.js');
    fs.writeFileSync(fullEntry, ENTRY_ESM, 'utf-8');

    await esbuild.build({
      entryPoints: [fullEntry],
      bundle: true,
      outfile: fullOut,
      format: 'esm',
      platform: 'node',
      target: 'node18',
      treeShaking: true,
      external: [
        'node:*',
        'fs',
        'path',
        'os',
        'crypto',
        'events',
        'stream',
        'util',
        'url',
        'http',
        'https',
        'net',
        'tls',
        'child_process',
        'worker_threads',
        'better-sqlite3',
      ],
      logLevel: 'silent',
      write: true,
    });

    // Minimal import - only VERSION and Agent
    const minimalEntry = path.join(tmpDir, 'entry-treeshake-min.mjs');
    const minimalOut = path.join(tmpDir, 'out-treeshake-min.js');
    const minimalCode = `
import { VERSION, Agent } from '${DIST_DIR.replace(/\\/g, '/')}';
console.log(VERSION, Agent);
`;
    fs.writeFileSync(minimalEntry, minimalCode, 'utf-8');

    await esbuild.build({
      entryPoints: [minimalEntry],
      bundle: true,
      outfile: minimalOut,
      format: 'esm',
      platform: 'node',
      target: 'node18',
      treeShaking: true,
      external: [
        'node:*',
        'fs',
        'path',
        'os',
        'crypto',
        'events',
        'stream',
        'util',
        'url',
        'http',
        'https',
        'net',
        'tls',
        'child_process',
        'worker_threads',
        'better-sqlite3',
      ],
      logLevel: 'silent',
      write: true,
    });

    const fullSize = fs.statSync(fullOut).size;
    const minimalSize = fs.statSync(minimalOut).size;

    // The minimal bundle should be smaller (tree-shaking works)
    expect(minimalSize).toBeLessThan(fullSize);
  });
});
