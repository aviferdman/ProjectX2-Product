/**
 * Crewspace Design System — Comprehensive tests
 * TASK-125: Validates foundational design tokens across all output formats
 *
 * Tests cover:
 *  1. DTCG JSON schema compliance
 *  2. Cross-format consistency (JSON ↔ TS ↔ CSS ↔ Tailwind)
 *  3. Token completeness (all categories present)
 *  4. Value correctness (spot checks against design spec)
 *  5. Tailwind theme structure
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { designSystemTheme } from '../tailwind/design-system-theme.js';
import {
  colors,
  sizing,
  radius,
  typography,
  transitions,
  shadows,
  fontWeight,
  lineHeight,
  letterSpacing,
  zIndex,
  spacing,
  duration,
  easing,
  opacity,
  breakpoints,
} from '../../../packages/ui/src/theme/tokens.js';

/* ------------------------------------------------------------------ */
/* Helper: load JSON token file                                        */
/* ------------------------------------------------------------------ */
function loadTokens(filename: string): Record<string, unknown> {
  const filePath = resolve(__dirname, '..', 'tokens', filename);
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function loadCss(filename: string): string {
  const filePath = resolve(__dirname, '..', 'css', filename);
  return readFileSync(filePath, 'utf-8');
}

/* ================================================================== */
/* 1. DTCG JSON Token Schema Compliance                                */
/* ================================================================== */
describe('DTCG JSON tokens — design-system.json', () => {
  const tokens = loadTokens('design-system.json') as Record<string, unknown>;

  it('has $schema field pointing to DTCG community group', () => {
    expect(tokens.$schema).toContain('design-tokens.github.io');
  });

  it('has top-level crewspace namespace', () => {
    expect(tokens).toHaveProperty('crewspace');
  });

  it('contains all foundational token categories', () => {
    const cs = tokens.crewspace as Record<string, unknown>;
    const expectedCategories = [
      'color',
      'typography',
      'spacing',
      'radius',
      'shadow',
      'transition',
      'duration',
      'easing',
      'zIndex',
      'breakpoint',
      'opacity',
    ];
    for (const cat of expectedCategories) {
      expect(cs).toHaveProperty(cat);
    }
  });

  it('color primitives include all palette families', () => {
    const cs = tokens.crewspace as Record<string, unknown>;
    const color = cs.color as Record<string, unknown>;
    const primitive = color.primitive as Record<string, unknown>;
    const expected = ['slate', 'violet', 'emerald', 'amber', 'rose', 'sky'];
    for (const family of expected) {
      expect(primitive).toHaveProperty(family);
    }
  });

  it('color semantics include brand, surface, border, text, status, interactive', () => {
    const cs = tokens.crewspace as Record<string, unknown>;
    const color = cs.color as Record<string, unknown>;
    const semantic = color.semantic as Record<string, unknown>;
    const expected = ['brand', 'surface', 'border', 'text', 'status', 'interactive'];
    for (const group of expected) {
      expect(semantic).toHaveProperty(group);
    }
  });

  it('all leaf tokens have $value and $type fields', () => {
    function checkLeaves(obj: Record<string, unknown>, path: string): void {
      for (const [key, val] of Object.entries(obj)) {
        if (key.startsWith('$')) continue;
        if (typeof val === 'object' && val !== null) {
          const record = val as Record<string, unknown>;
          if ('$value' in record) {
            expect(record).toHaveProperty('$type');
          } else {
            checkLeaves(record, `${path}.${key}`);
          }
        }
      }
    }
    checkLeaves(
      (tokens.crewspace as Record<string, unknown>),
      'crewspace',
    );
  });
});

/* ================================================================== */
/* 2. TypeScript Token Exports                                         */
/* ================================================================== */
describe('TypeScript tokens — completeness', () => {
  it('colors has brand.primary matching spec', () => {
    expect(colors.brand.primary).toBe('#7c3aed');
  });

  it('colors has all semantic groups', () => {
    expect(colors).toHaveProperty('brand');
    expect(colors).toHaveProperty('surface');
    expect(colors).toHaveProperty('border');
    expect(colors).toHaveProperty('text');
    expect(colors).toHaveProperty('status');
    expect(colors).toHaveProperty('node');
    expect(colors).toHaveProperty('edge');
  });

  it('shadows has elevation scale', () => {
    expect(shadows).toHaveProperty('xs');
    expect(shadows).toHaveProperty('sm');
    expect(shadows).toHaveProperty('md');
    expect(shadows).toHaveProperty('lg');
    expect(shadows).toHaveProperty('xl');
    expect(shadows).toHaveProperty('none');
  });

  it('shadows has component-specific entries', () => {
    expect(shadows).toHaveProperty('node');
    expect(shadows).toHaveProperty('node-hover');
    expect(shadows).toHaveProperty('node-selected');
    expect(shadows).toHaveProperty('panel');
    expect(shadows).toHaveProperty('toolbar');
    expect(shadows).toHaveProperty('dropdown');
  });

  it('fontWeight has all levels', () => {
    expect(fontWeight.normal).toBe(400);
    expect(fontWeight.medium).toBe(500);
    expect(fontWeight.semibold).toBe(600);
    expect(fontWeight.bold).toBe(700);
  });

  it('lineHeight has full scale', () => {
    expect(lineHeight.none).toBe(1);
    expect(lineHeight.tight).toBe(1.25);
    expect(lineHeight.normal).toBe(1.5);
    expect(lineHeight.relaxed).toBe(1.625);
    expect(lineHeight.loose).toBe(2);
  });

  it('letterSpacing has full range', () => {
    expect(letterSpacing.tighter).toBe('-0.02em');
    expect(letterSpacing.tight).toBe('-0.01em');
    expect(letterSpacing.normal).toBe('0');
    expect(letterSpacing.wide).toBe('0.025em');
    expect(letterSpacing.wider).toBe('0.05em');
  });

  it('zIndex has layer hierarchy', () => {
    expect(zIndex.base).toBe(0);
    expect(zIndex.canvas).toBeLessThan(zIndex.node);
    expect(zIndex.node).toBeLessThan(zIndex.toolbar);
    expect(zIndex.toolbar).toBeLessThan(zIndex.dropdown);
    expect(zIndex.dropdown).toBeLessThan(zIndex.modal);
    expect(zIndex.modal).toBeLessThan(zIndex.toast);
    expect(zIndex.toast).toBeLessThan(zIndex.tooltip);
  });

  it('spacing follows 4px grid', () => {
    expect(spacing[1]).toBe(4);
    expect(spacing[2]).toBe(8);
    expect(spacing[4]).toBe(16);
    expect(spacing[8]).toBe(32);
  });

  it('transitions has all presets including slower', () => {
    expect(transitions).toHaveProperty('fast');
    expect(transitions).toHaveProperty('normal');
    expect(transitions).toHaveProperty('slow');
    expect(transitions).toHaveProperty('slower');
    expect(transitions).toHaveProperty('spring');
  });

  it('duration values are numeric milliseconds', () => {
    expect(duration.instant).toBe(0);
    expect(duration.fast).toBe(100);
    expect(duration.normal).toBe(200);
    expect(duration.slow).toBe(300);
  });

  it('easing has standard curves', () => {
    expect(easing.default).toBe('ease-out');
    expect(easing.spring).toContain('cubic-bezier');
    expect(easing.linear).toBe('linear');
  });

  it('opacity has semantic values', () => {
    expect(opacity.disabled).toBe(0.4);
    expect(opacity.overlay).toBe(0.6);
    expect(opacity.subtle).toBe(0.1);
  });

  it('breakpoints match responsive spec', () => {
    expect(breakpoints.xs).toBe(375);
    expect(breakpoints.sm).toBe(640);
    expect(breakpoints.md).toBe(768);
    expect(breakpoints.lg).toBe(1024);
    expect(breakpoints.xl).toBe(1280);
  });

  it('sizing and radius are present', () => {
    expect(sizing.node.defaultWidth).toBe(220);
    expect(radius.node).toBe(10);
    expect(radius.sm).toBe(4);
  });

  it('typography has font families', () => {
    expect(typography.fontFamily.sans).toContain('Inter');
    expect(typography.fontFamily.mono).toContain('JetBrains Mono');
  });
});

/* ================================================================== */
/* 3. CSS Variables File                                               */
/* ================================================================== */
describe('CSS variables — design-system-variables.css', () => {
  const css = loadCss('design-system-variables.css');

  it('declares :root block', () => {
    expect(css).toContain(':root');
  });

  it('has all primitive slate palette variables', () => {
    for (const shade of ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']) {
      expect(css).toContain(`--cs-slate-${shade}:`);
    }
  });

  it('has all semantic brand variables', () => {
    expect(css).toContain('--cs-brand-primary:');
    expect(css).toContain('--cs-brand-secondary:');
    expect(css).toContain('--cs-brand-subtle:');
  });

  it('has all semantic surface variables', () => {
    for (const suf of ['app', 'canvas', 'panel', 'card', 'elevated', 'overlay']) {
      expect(css).toContain(`--cs-surface-${suf}:`);
    }
  });

  it('has all text variables including disabled and link', () => {
    for (const suf of ['primary', 'secondary', 'tertiary', 'inverse', 'disabled', 'link', 'link-hover']) {
      expect(css).toContain(`--cs-text-${suf}:`);
    }
  });

  it('has typography variables', () => {
    expect(css).toContain('--cs-font-sans:');
    expect(css).toContain('--cs-font-mono:');
    expect(css).toContain('--cs-text-base:');
    expect(css).toContain('--cs-font-semibold:');
    expect(css).toContain('--cs-leading-normal:');
    expect(css).toContain('--cs-tracking-wide:');
  });

  it('has spacing variables', () => {
    expect(css).toContain('--cs-space-0:');
    expect(css).toContain('--cs-space-4:');
    expect(css).toContain('--cs-space-8:');
    expect(css).toContain('--cs-space-16:');
  });

  it('has shadow variables', () => {
    expect(css).toContain('--cs-shadow-xs:');
    expect(css).toContain('--cs-shadow-sm:');
    expect(css).toContain('--cs-shadow-md:');
    expect(css).toContain('--cs-shadow-lg:');
    expect(css).toContain('--cs-shadow-xl:');
    expect(css).toContain('--cs-shadow-node:');
    expect(css).toContain('--cs-shadow-dropdown:');
  });

  it('has transition and duration variables', () => {
    expect(css).toContain('--cs-transition-fast:');
    expect(css).toContain('--cs-transition-spring:');
    expect(css).toContain('--cs-duration-fast:');
    expect(css).toContain('--cs-duration-slow:');
  });

  it('has z-index layer variables', () => {
    expect(css).toContain('--cs-z-base:');
    expect(css).toContain('--cs-z-modal:');
    expect(css).toContain('--cs-z-tooltip:');
  });

  it('has interactive color variables', () => {
    expect(css).toContain('--cs-interactive-default:');
    expect(css).toContain('--cs-interactive-hover:');
    expect(css).toContain('--cs-interactive-active:');
    expect(css).toContain('--cs-interactive-disabled:');
  });

  it('has light mode overrides', () => {
    expect(css).toContain("[data-theme='light']");
  });
});

/* ================================================================== */
/* 4. Tailwind Theme Structure                                         */
/* ================================================================== */
describe('Tailwind design-system-theme', () => {
  it('has colors with all semantic groups', () => {
    const c = designSystemTheme.colors;
    expect(c).toHaveProperty('brand');
    expect(c).toHaveProperty('surface');
    expect(c).toHaveProperty('border');
    expect(c).toHaveProperty('text');
    expect(c).toHaveProperty('status');
    expect(c).toHaveProperty('interactive');
  });

  it('color values reference CSS variables with fallbacks', () => {
    expect(designSystemTheme.colors.brand.primary).toContain('var(--cs-brand-primary');
    expect(designSystemTheme.colors.brand.primary).toContain('#7c3aed');
  });

  it('has fontFamily with Inter and JetBrains Mono', () => {
    expect(designSystemTheme.fontFamily.sans[0]).toBe('Inter');
    expect(designSystemTheme.fontFamily.mono[0]).toContain('JetBrains Mono');
  });

  it('has complete fontSize scale', () => {
    const sizes = Object.keys(designSystemTheme.fontSize);
    expect(sizes).toContain('xs');
    expect(sizes).toContain('base');
    expect(sizes).toContain('lg');
    expect(sizes).toContain('2xl');
    expect(sizes).toContain('4xl');
  });

  it('has spacing scale on 4px grid', () => {
    const sp = designSystemTheme.spacing;
    expect(sp[1]).toBe('4px');
    expect(sp[2]).toBe('8px');
    expect(sp[4]).toBe('16px');
  });

  it('has border radius including node', () => {
    expect(designSystemTheme.borderRadius.node).toBe('10px');
    expect(designSystemTheme.borderRadius.sm).toBe('4px');
    expect(designSystemTheme.borderRadius.full).toBe('9999px');
  });

  it('has box shadow scale', () => {
    const sh = designSystemTheme.boxShadow;
    expect(sh).toHaveProperty('xs');
    expect(sh).toHaveProperty('sm');
    expect(sh).toHaveProperty('md');
    expect(sh).toHaveProperty('lg');
    expect(sh).toHaveProperty('xl');
    expect(sh).toHaveProperty('node');
    expect(sh).toHaveProperty('dropdown');
  });

  it('shadow values reference CSS variables', () => {
    expect(designSystemTheme.boxShadow.md).toContain('var(--cs-shadow-md');
  });

  it('has transition timing functions including spring', () => {
    expect(designSystemTheme.transitionTimingFunction.spring).toContain('cubic-bezier');
  });

  it('has z-index layer hierarchy', () => {
    const z = designSystemTheme.zIndex;
    expect(Number(z.base)).toBeLessThan(Number(z.node));
    expect(Number(z.node)).toBeLessThan(Number(z.toolbar));
    expect(Number(z.toolbar)).toBeLessThan(Number(z.modal));
    expect(Number(z.modal)).toBeLessThan(Number(z.tooltip));
  });

  it('has responsive breakpoints', () => {
    const screens = designSystemTheme.screens;
    expect(screens).toHaveProperty('xs');
    expect(screens).toHaveProperty('sm');
    expect(screens).toHaveProperty('md');
    expect(screens).toHaveProperty('lg');
    expect(screens).toHaveProperty('xl');
    expect(screens).toHaveProperty('2xl');
  });
});

/* ================================================================== */
/* 5. Cross-format Consistency                                         */
/* ================================================================== */
describe('Cross-format consistency', () => {
  const jsonTokens = loadTokens('design-system.json') as Record<string, unknown>;
  const cs = jsonTokens.crewspace as Record<string, unknown>;
  const css = loadCss('design-system-variables.css');

  it('JSON brand.primary matches TS colors.brand.primary', () => {
    const color = cs.color as Record<string, unknown>;
    const semantic = color.semantic as Record<string, unknown>;
    const brand = semantic.brand as Record<string, { $value: string }>;
    // JSON references primitive; TS has resolved value
    expect(brand.primary.$value).toContain('violet.600');
    expect(colors.brand.primary).toBe('#7c3aed');
  });

  it('JSON spacing.4 matches TS spacing[4] matches CSS --cs-space-4', () => {
    const jsonSpacing = cs.spacing as Record<string, { $value: string }>;
    expect(jsonSpacing['4'].$value).toBe('16px');
    expect(spacing[4]).toBe(16);
    expect(css).toContain('--cs-space-4: 16px');
  });

  it('JSON radius.node matches TS radius.node matches Tailwind borderRadius.node', () => {
    const jsonRadius = cs.radius as Record<string, { $value: string }>;
    expect(jsonRadius.node.$value).toBe('10px');
    expect(radius.node).toBe(10);
    expect(designSystemTheme.borderRadius.node).toBe('10px');
  });

  it('JSON transition.spring matches TS transitions.spring', () => {
    const jsonTransition = cs.transition as Record<string, { $value: string }>;
    expect(jsonTransition.spring.$value).toContain('cubic-bezier');
    expect(transitions.spring).toContain('cubic-bezier');
  });

  it('Tailwind colors reference CSS variables matching CSS file', () => {
    // Tailwind brand.primary → var(--cs-brand-primary, ...)
    expect(designSystemTheme.colors.brand.primary).toContain('--cs-brand-primary');
    // CSS file defines --cs-brand-primary
    expect(css).toContain('--cs-brand-primary:');
  });
});
