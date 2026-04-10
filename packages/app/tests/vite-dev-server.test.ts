/**
 * Tests for the Vite dev server configuration.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const APP_ROOT = resolve(__dirname, '..');

describe('Vite dev server setup', () => {
  it('vite.config.ts exists', () => {
    expect(existsSync(resolve(APP_ROOT, 'vite.config.ts'))).toBe(true);
  });

  it('index.html exists and references the dev entry point', () => {
    const htmlPath = resolve(APP_ROOT, 'index.html');
    expect(existsSync(htmlPath)).toBe(true);
    const html = readFileSync(htmlPath, 'utf-8');
    expect(html).toContain('id="root"');
    expect(html).toContain('/src/dev/main.tsx');
  });

  it('index.html has correct doctype and lang attribute', () => {
    const html = readFileSync(resolve(APP_ROOT, 'index.html'), 'utf-8');
    expect(html).toMatch(/<!doctype html>/i);
    expect(html).toContain('lang="en"');
  });

  it('package.json includes a dev script', () => {
    const pkg = JSON.parse(readFileSync(resolve(APP_ROOT, 'package.json'), 'utf-8'));
    expect(pkg.scripts.dev).toBeDefined();
    expect(pkg.scripts.dev).toContain('vite');
  });

  it('package.json lists vite and @vitejs/plugin-react as devDependencies', () => {
    const pkg = JSON.parse(readFileSync(resolve(APP_ROOT, 'package.json'), 'utf-8'));
    expect(pkg.devDependencies['vite']).toBeDefined();
    expect(pkg.devDependencies['@vitejs/plugin-react']).toBeDefined();
  });

  it('dev entry point main.tsx exists', () => {
    expect(existsSync(resolve(APP_ROOT, 'src/dev/main.tsx'))).toBe(true);
  });

  it('stub auth adapter exists', () => {
    expect(existsSync(resolve(APP_ROOT, 'src/dev/stubAuthAdapter.ts'))).toBe(true);
  });
});
