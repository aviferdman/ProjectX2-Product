/**
 * TASK-173: Animation design token QA tests
 *
 * Validates the animation design tokens, CSS variables, and
 * Tailwind theme extension are correctly defined and consistent.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const TOKENS_DIR = resolve(__dirname, '..', 'tokens');
const CSS_DIR = resolve(__dirname, '..', 'css');
const TAILWIND_DIR = resolve(__dirname, '..', 'tailwind');

function loadTokens(filename: string): Record<string, unknown> {
  const raw = readFileSync(resolve(TOKENS_DIR, filename), 'utf-8');
  return JSON.parse(raw);
}

function loadCSS(filename: string): string {
  return readFileSync(resolve(CSS_DIR, filename), 'utf-8');
}

describe('Animation design tokens', () => {
  it('animation token file exists', () => {
    expect(existsSync(resolve(TOKENS_DIR, 'animations.json'))).toBe(true);
  });

  it('contains required duration presets', () => {
    const tokens = loadTokens('animations.json') as any;
    const durations = tokens.crewspace.animations.duration;
    expect(durations.instant.value).toBe('50ms');
    expect(durations.fast.value).toBe('100ms');
    expect(durations.normal.value).toBe('150ms');
    expect(durations.moderate.value).toBe('200ms');
    expect(durations.slow.value).toBe('300ms');
    expect(durations.enter.value).toBe('250ms');
    expect(durations.exit.value).toBe('200ms');
    expect(durations.page.value).toBe('350ms');
  });

  it('contains required easing presets', () => {
    const tokens = loadTokens('animations.json') as any;
    const easings = tokens.crewspace.animations.easing;
    expect(easings.default.value).toContain('cubic-bezier');
    expect(easings.in.value).toContain('cubic-bezier');
    expect(easings.out.value).toContain('cubic-bezier');
    expect(easings.spring.value).toContain('cubic-bezier');
  });

  it('contains page transition presets', () => {
    const tokens = loadTokens('animations.json') as any;
    const page = tokens.crewspace.animations.pageTransition;
    expect(page.fade).toBeDefined();
    expect(page.slideUp).toBeDefined();
    expect(page.slideLeft).toBeDefined();
  });

  it('contains loading presets', () => {
    const tokens = loadTokens('animations.json') as any;
    const loading = tokens.crewspace.animations.loading;
    expect(loading.skeleton).toBeDefined();
    expect(loading.shimmer).toBeDefined();
    expect(loading.pulse).toBeDefined();
    expect(loading.spin).toBeDefined();
  });

  it('contains stagger presets', () => {
    const tokens = loadTokens('animations.json') as any;
    const stagger = tokens.crewspace.animations.stagger;
    expect(stagger.delay.value).toBe('40ms');
    expect(stagger.maxDelay.value).toBe('500ms');
    expect(stagger.maxItems.value).toBe('12');
  });
});

describe('Animation CSS variables file', () => {
  it('CSS file exists', () => {
    expect(existsSync(resolve(CSS_DIR, 'animation-variables.css'))).toBe(true);
  });

  it('defines page transition custom properties', () => {
    const css = loadCSS('animation-variables.css');
    expect(css).toContain('--cs-page-fade-duration');
    expect(css).toContain('--cs-page-slide-duration');
    expect(css).toContain('--cs-page-slide-easing');
  });

  it('defines state change custom properties', () => {
    const css = loadCSS('animation-variables.css');
    expect(css).toContain('--cs-state-hover-duration');
    expect(css).toContain('--cs-state-toggle-duration');
    expect(css).toContain('--cs-state-collapse-duration');
  });

  it('defines loading custom properties', () => {
    const css = loadCSS('animation-variables.css');
    expect(css).toContain('--cs-loading-skeleton-duration');
    expect(css).toContain('--cs-loading-shimmer-duration');
    expect(css).toContain('--cs-loading-pulse-duration');
  });

  it('defines keyframe animations', () => {
    const css = loadCSS('animation-variables.css');
    expect(css).toContain('@keyframes cs-page-fade-in');
    expect(css).toContain('@keyframes cs-page-slide-up-in');
    expect(css).toContain('@keyframes cs-state-scale-in');
    expect(css).toContain('@keyframes cs-loading-skeleton');
    expect(css).toContain('@keyframes cs-loading-shimmer');
    expect(css).toContain('@keyframes cs-loading-pulse');
  });

  it('includes reduced-motion support', () => {
    const css = loadCSS('animation-variables.css');
    expect(css).toContain('prefers-reduced-motion');
  });

  it('defines utility classes', () => {
    const css = loadCSS('animation-variables.css');
    expect(css).toContain('.cs-anim-page-fade-in');
    expect(css).toContain('.cs-anim-page-slide-up');
    expect(css).toContain('.cs-anim-skeleton');
    expect(css).toContain('.cs-anim-pulse');
    expect(css).toContain('.cs-anim-shimmer');
    expect(css).toContain('.cs-stagger-child');
  });
});

describe('Animation Tailwind theme', () => {
  it('theme file exists', () => {
    expect(existsSync(resolve(TAILWIND_DIR, 'animation-theme.ts'))).toBe(true);
  });
});
