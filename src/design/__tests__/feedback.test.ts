/**
 * TASK-182: Design QA tests for feedback tokens and CSS variables.
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

describe('Feedback design tokens (TASK-182)', () => {
  const tokens = loadTokens('feedback.json');

  it('token file is valid JSON with $schema', () => {
    expect(tokens).toHaveProperty('$schema');
  });

  it('contains all required token groups', () => {
    const feedback = (tokens as Record<string, Record<string, unknown>>).crewspace
      .feedback as Record<string, unknown>;
    expect(feedback).toHaveProperty('success');
    expect(feedback).toHaveProperty('error');
    expect(feedback).toHaveProperty('warning');
    expect(feedback).toHaveProperty('info');
    expect(feedback).toHaveProperty('empty');
    expect(feedback).toHaveProperty('loading');
    expect(feedback).toHaveProperty('toast');
    expect(feedback).toHaveProperty('transition');
  });

  it('each status variant has bg, border, and icon tokens', () => {
    const feedback = (tokens as Record<string, Record<string, unknown>>).crewspace
      .feedback as Record<string, Record<string, unknown>>;
    for (const variant of ['success', 'error', 'warning', 'info']) {
      const group = feedback[variant];
      expect(group).toHaveProperty('bg');
      expect(group).toHaveProperty('border');
      expect(group).toHaveProperty('icon');
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

describe('Feedback CSS variables (TASK-182)', () => {
  const css = loadCSS('feedback-variables.css');

  it('CSS file is non-empty', () => {
    expect(css.length).toBeGreaterThan(0);
  });

  it('defines all required CSS custom properties', () => {
    const requiredVars = [
      '--cs-feedback-success-bg',
      '--cs-feedback-success-border',
      '--cs-feedback-success-icon',
      '--cs-feedback-error-bg',
      '--cs-feedback-error-border',
      '--cs-feedback-error-icon',
      '--cs-feedback-warning-bg',
      '--cs-feedback-warning-border',
      '--cs-feedback-warning-icon',
      '--cs-feedback-info-bg',
      '--cs-feedback-info-border',
      '--cs-feedback-info-icon',
      '--cs-feedback-empty-border',
      '--cs-feedback-empty-icon',
      '--cs-feedback-loading-spinner',
      '--cs-feedback-loading-track',
      '--cs-feedback-loading-bar',
      '--cs-toast-bg',
      '--cs-toast-shadow',
      '--cs-toast-max-width',
      '--cs-toast-min-width',
      '--cs-toast-z-index',
      '--cs-toast-gap',
      '--cs-feedback-transition',
      '--cs-feedback-enter-duration',
      '--cs-feedback-exit-duration',
    ];
    for (const v of requiredVars) {
      expect(css).toContain(v);
    }
  });

  it('uses :root selector', () => {
    expect(css).toContain(':root');
  });
});
