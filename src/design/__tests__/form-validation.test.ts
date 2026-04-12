/**
 * TASK-187: Design QA tests for form validation tokens and CSS variables.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TOKENS_DIR = resolve(__dirname, '..', 'tokens');
const CSS_DIR = resolve(__dirname, '..', 'css');

function loadTokens(filename: string): Record<string, unknown> {
  const raw = readFileSync(resolve(TOKENS_DIR, filename), 'utf-8');
  return JSON.parse(raw);
}

function loadCSS(filename: string): string {
  return readFileSync(resolve(CSS_DIR, filename), 'utf-8');
}

function collectTokenLeaves(
  obj: Record<string, unknown>,
  path = '',
): Array<{ path: string; value: unknown; type: string }> {
  const results: Array<{ path: string; value: unknown; type: string }> = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$') || key.startsWith('_')) continue;
    const current = path ? `${path}.${key}` : key;
    if (
      val &&
      typeof val === 'object' &&
      'value' in (val as Record<string, unknown>) &&
      'type' in (val as Record<string, unknown>)
    ) {
      const token = val as { value: unknown; type: string };
      results.push({ path: current, value: token.value, type: token.type });
    } else if (val && typeof val === 'object') {
      results.push(...collectTokenLeaves(val as Record<string, unknown>, current));
    }
  }
  return results;
}

describe('Form validation design tokens (TASK-187)', () => {
  const tokens = loadTokens('form-validation.json');

  it('token file is valid JSON with $schema', () => {
    expect(tokens).toHaveProperty('$schema');
  });

  it('contains all required token groups', () => {
    const form = (tokens as Record<string, Record<string, unknown>>).crewspace.form as Record<
      string,
      unknown
    >;
    expect(form).toHaveProperty('validation');
    expect(form).toHaveProperty('label');
    expect(form).toHaveProperty('helper');
    expect(form).toHaveProperty('transition');
    expect(form).toHaveProperty('message');
  });

  it('each validation variant has border, text, icon, and bg tokens', () => {
    const validation = (
      (tokens as Record<string, Record<string, unknown>>).crewspace.form as Record<
        string,
        Record<string, unknown>
      >
    ).validation as Record<string, Record<string, unknown>>;
    for (const variant of ['valid', 'invalid', 'warning']) {
      const group = validation[variant];
      expect(group).toHaveProperty('border');
      expect(group).toHaveProperty('text');
      expect(group).toHaveProperty('icon');
      expect(group).toHaveProperty('bg');
    }
  });

  it('all leaf tokens have valid value and type', () => {
    const leaves = collectTokenLeaves(tokens);
    expect(leaves.length).toBeGreaterThan(0);
    for (const leaf of leaves) {
      expect(leaf.value).toBeDefined();
      expect(typeof leaf.type).toBe('string');
    }
  });
});

describe('Form validation CSS variables (TASK-187)', () => {
  const css = loadCSS('form-validation-variables.css');

  it('CSS file is non-empty', () => {
    expect(css.length).toBeGreaterThan(0);
  });

  it('defines all required CSS custom properties', () => {
    const requiredVars = [
      '--cs-form-valid-border',
      '--cs-form-valid-text',
      '--cs-form-valid-icon',
      '--cs-form-valid-bg',
      '--cs-form-invalid-border',
      '--cs-form-invalid-text',
      '--cs-form-invalid-icon',
      '--cs-form-invalid-bg',
      '--cs-form-warning-border',
      '--cs-form-warning-text',
      '--cs-form-warning-icon',
      '--cs-form-warning-bg',
      '--cs-form-label-color',
      '--cs-form-label-required',
      '--cs-form-helper-color',
      '--cs-form-transition-duration',
      '--cs-form-message-font-size',
      '--cs-form-message-line-height',
      '--cs-form-message-gap',
    ];
    for (const v of requiredVars) {
      expect(css).toContain(v);
    }
  });

  it('uses :root selector', () => {
    expect(css).toContain(':root');
  });
});
