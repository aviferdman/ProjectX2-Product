/**
 * TASK-126: Component Library design token tests
 *
 * Validates design tokens, CSS variables, and Tailwind theme extension
 * for all four core components: buttons, inputs, cards, and modals.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
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

/* ================================================================== */
/* 1. File existence                                                   */
/* ================================================================== */
describe('Component library — file existence', () => {
  it('token file exists', () => {
    expect(existsSync(resolve(TOKENS_DIR, 'component-library.json'))).toBe(true);
  });

  it('CSS variables file exists', () => {
    expect(existsSync(resolve(CSS_DIR, 'component-library-variables.css'))).toBe(true);
  });

  it('Tailwind theme file exists', () => {
    const tw = resolve(__dirname, '..', 'tailwind', 'component-library-theme.ts');
    expect(existsSync(tw)).toBe(true);
  });
});

/* ================================================================== */
/* 2. DTCG JSON Token Schema                                           */
/* ================================================================== */
describe('Component library — DTCG JSON tokens', () => {
  const tokens = loadTokens('component-library.json') as Record<string, unknown>;

  it('has $schema field pointing to DTCG community group', () => {
    expect(tokens.$schema).toContain('design-tokens.github.io');
  });

  it('has top-level crewspace namespace', () => {
    expect(tokens).toHaveProperty('crewspace');
  });

  it('has component group with all four components', () => {
    const cs = tokens.crewspace as Record<string, unknown>;
    const comp = cs.component as Record<string, unknown>;
    expect(comp).toHaveProperty('button');
    expect(comp).toHaveProperty('input');
    expect(comp).toHaveProperty('card');
    expect(comp).toHaveProperty('modal');
  });

  it('all leaf tokens have $value and $type fields', () => {
    function checkLeaves(obj: Record<string, unknown>, path: string): void {
      for (const [key, val] of Object.entries(obj)) {
        if (key.startsWith('$') || key.startsWith('_')) continue;
        if (typeof val === 'object' && val !== null) {
          const record = val as Record<string, unknown>;
          if ('$value' in record) {
            expect(record, `Missing $type at ${path}.${key}`).toHaveProperty('$type');
          } else {
            checkLeaves(record, `${path}.${key}`);
          }
        }
      }
    }
    checkLeaves(tokens.crewspace as Record<string, unknown>, 'crewspace');
  });
});

/* ================================================================== */
/* 3. Button tokens                                                    */
/* ================================================================== */
describe('Component library — Button tokens', () => {
  const tokens = loadTokens('component-library.json') as any;
  const button = tokens.crewspace.component.button;

  it('has all size presets', () => {
    const sizes = button.size;
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl']) {
      expect(sizes).toHaveProperty(size);
      expect(sizes[size]).toHaveProperty('height');
      expect(sizes[size]).toHaveProperty('paddingX');
      expect(sizes[size]).toHaveProperty('fontSize');
      expect(sizes[size]).toHaveProperty('borderRadius');
    }
  });

  it('md is 36px default height', () => {
    expect(button.size.md.height.$value).toBe('36px');
  });

  it('has all variant color sets', () => {
    const variants = button.variant;
    for (const v of ['primary', 'secondary', 'ghost', 'danger', 'success']) {
      expect(variants).toHaveProperty(v);
      expect(variants[v]).toHaveProperty('bg');
      expect(variants[v]).toHaveProperty('bgHover');
      expect(variants[v]).toHaveProperty('text');
    }
  });

  it('has disabled and loading states', () => {
    expect(button.state.disabled.opacity.$value).toBe('0.4');
    expect(button.state.loading.opacity.$value).toBe('0.7');
  });

  it('has focus ring tokens', () => {
    expect(button.state.focus.ringWidth.$value).toBe('2px');
    expect(button.state.focus.ringOffset.$value).toBe('2px');
  });

  it('has font weight set to semibold (600)', () => {
    expect(button.fontWeight.$value).toBe('600');
  });
});

/* ================================================================== */
/* 4. Input tokens                                                     */
/* ================================================================== */
describe('Component library — Input tokens', () => {
  const tokens = loadTokens('component-library.json') as any;
  const input = tokens.crewspace.component.input;

  it('has all size presets', () => {
    for (const size of ['sm', 'md', 'lg']) {
      expect(input.size).toHaveProperty(size);
      expect(input.size[size]).toHaveProperty('height');
      expect(input.size[size]).toHaveProperty('paddingX');
      expect(input.size[size]).toHaveProperty('fontSize');
    }
  });

  it('md is 36px default height', () => {
    expect(input.size.md.height.$value).toBe('36px');
  });

  it('has full color set including error and success', () => {
    const c = input.color;
    expect(c).toHaveProperty('bg');
    expect(c).toHaveProperty('text');
    expect(c).toHaveProperty('placeholder');
    expect(c).toHaveProperty('border');
    expect(c).toHaveProperty('borderFocus');
    expect(c).toHaveProperty('borderError');
    expect(c).toHaveProperty('borderSuccess');
    expect(c).toHaveProperty('errorText');
    expect(c).toHaveProperty('successText');
  });

  it('has label and helper text tokens', () => {
    expect(input.label.fontSize.$value).toBe('0.8125rem');
    expect(input.label.fontWeight.$value).toBe('500');
    expect(input.helper.fontSize.$value).toBe('0.75rem');
  });

  it('has focus and error ring states', () => {
    expect(input.state.focus.ringWidth.$value).toBe('2px');
    expect(input.state.error.ringWidth.$value).toBe('2px');
  });
});

/* ================================================================== */
/* 5. Card tokens                                                      */
/* ================================================================== */
describe('Component library — Card tokens', () => {
  const tokens = loadTokens('component-library.json') as any;
  const card = tokens.crewspace.component.card;

  it('has all size presets', () => {
    for (const size of ['sm', 'md', 'lg']) {
      expect(card.size).toHaveProperty(size);
      expect(card.size[size]).toHaveProperty('padding');
      expect(card.size[size]).toHaveProperty('borderRadius');
      expect(card.size[size]).toHaveProperty('gap');
    }
  });

  it('has complete color set', () => {
    const c = card.color;
    expect(c).toHaveProperty('bg');
    expect(c).toHaveProperty('bgHover');
    expect(c).toHaveProperty('bgSelected');
    expect(c).toHaveProperty('border');
    expect(c).toHaveProperty('headerText');
    expect(c).toHaveProperty('bodyText');
    expect(c).toHaveProperty('divider');
  });

  it('has shadow scale (default, hover, selected)', () => {
    expect(card.shadow).toHaveProperty('default');
    expect(card.shadow).toHaveProperty('hover');
    expect(card.shadow).toHaveProperty('selected');
  });

  it('has header and footer sections', () => {
    expect(card.header.height.$value).toBe('48px');
    expect(card.header.fontWeight.$value).toBe('600');
    expect(card.footer.height.$value).toBe('44px');
  });
});

/* ================================================================== */
/* 6. Modal tokens                                                     */
/* ================================================================== */
describe('Component library — Modal tokens', () => {
  const tokens = loadTokens('component-library.json') as any;
  const modal = tokens.crewspace.component.modal;

  it('has overlay tokens', () => {
    expect(modal.overlay.bg.$value).toBe('rgba(0,0,0,0.6)');
    expect(modal.overlay.backdropBlur.$value).toBe('4px');
    expect(modal.overlay.zIndex.$value).toBe('300');
  });

  it('has all size presets', () => {
    for (const size of ['sm', 'md', 'lg', 'xl', 'fullscreen']) {
      expect(modal.size).toHaveProperty(size);
      expect(modal.size[size]).toHaveProperty('width');
      expect(modal.size[size]).toHaveProperty('maxHeight');
      expect(modal.size[size]).toHaveProperty('padding');
    }
  });

  it('md is 560px default width', () => {
    expect(modal.size.md.width.$value).toBe('560px');
  });

  it('has color tokens', () => {
    const c = modal.color;
    expect(c).toHaveProperty('bg');
    expect(c).toHaveProperty('headerText');
    expect(c).toHaveProperty('bodyText');
    expect(c).toHaveProperty('closeIcon');
    expect(c).toHaveProperty('closeIconHover');
  });

  it('has animation tokens for enter and exit', () => {
    expect(modal.animation.enter.$value).toContain('cubic-bezier');
    expect(modal.animation.exit.$value).toContain('cubic-bezier');
    expect(modal.animation.overlayEnter.$value).toContain('ease-out');
    expect(modal.animation.overlayExit.$value).toContain('ease-in');
  });

  it('has header and footer sections', () => {
    expect(modal.header.height.$value).toBe('56px');
    expect(modal.header.fontWeight.$value).toBe('600');
    expect(modal.footer.height.$value).toBe('64px');
    expect(modal.footer.gap.$value).toBe('12px');
  });

  it('has border radius of 12px', () => {
    expect(modal.borderRadius.$value).toBe('12px');
  });
});

/* ================================================================== */
/* 7. CSS Variables                                                    */
/* ================================================================== */
describe('Component library — CSS variables', () => {
  const css = loadCSS('component-library-variables.css');

  it('defines button variables under .cs-btn', () => {
    expect(css).toContain('.cs-btn');
    expect(css).toContain('--btn-height:');
    expect(css).toContain('--btn-px:');
    expect(css).toContain('--btn-bg:');
    expect(css).toContain('--btn-text:');
    expect(css).toContain('--btn-radius:');
    expect(css).toContain('--btn-font-weight:');
  });

  it('defines all button size modifiers', () => {
    expect(css).toContain('.cs-btn--xs');
    expect(css).toContain('.cs-btn--sm');
    expect(css).toContain('.cs-btn--lg');
    expect(css).toContain('.cs-btn--xl');
  });

  it('defines all button variant modifiers', () => {
    expect(css).toContain('.cs-btn--secondary');
    expect(css).toContain('.cs-btn--ghost');
    expect(css).toContain('.cs-btn--danger');
    expect(css).toContain('.cs-btn--success');
  });

  it('defines input variables under .cs-input', () => {
    expect(css).toContain('.cs-input');
    expect(css).toContain('--input-height:');
    expect(css).toContain('--input-bg:');
    expect(css).toContain('--input-border:');
    expect(css).toContain('--input-border-focus:');
    expect(css).toContain('--input-border-error:');
    expect(css).toContain('--input-label-font-size:');
    expect(css).toContain('--input-helper-font-size:');
  });

  it('defines input size modifiers', () => {
    expect(css).toContain('.cs-input--sm');
    expect(css).toContain('.cs-input--lg');
  });

  it('defines card variables under .cs-card', () => {
    expect(css).toContain('.cs-card');
    expect(css).toContain('--card-padding:');
    expect(css).toContain('--card-bg:');
    expect(css).toContain('--card-shadow:');
    expect(css).toContain('--card-header-height:');
    expect(css).toContain('--card-footer-height:');
  });

  it('defines card size modifiers', () => {
    expect(css).toContain('.cs-card--sm');
    expect(css).toContain('.cs-card--lg');
  });

  it('defines modal overlay variables', () => {
    expect(css).toContain('.cs-modal-overlay');
    expect(css).toContain('--modal-overlay-bg:');
    expect(css).toContain('--modal-overlay-blur:');
  });

  it('defines modal variables under .cs-modal', () => {
    expect(css).toContain('.cs-modal');
    expect(css).toContain('--modal-width:');
    expect(css).toContain('--modal-bg:');
    expect(css).toContain('--modal-shadow:');
    expect(css).toContain('--modal-header-height:');
    expect(css).toContain('--modal-footer-height:');
    expect(css).toContain('--modal-enter:');
    expect(css).toContain('--modal-exit:');
  });

  it('defines modal size modifiers', () => {
    expect(css).toContain('.cs-modal--sm');
    expect(css).toContain('.cs-modal--lg');
    expect(css).toContain('.cs-modal--xl');
    expect(css).toContain('.cs-modal--fullscreen');
  });

  it('has light mode overrides', () => {
    expect(css).toContain("[data-theme='light']");
  });

  it('references design system tokens via var()', () => {
    expect(css).toContain('var(--cs-interactive-default)');
    expect(css).toContain('var(--cs-border-default)');
    expect(css).toContain('var(--cs-text-primary)');
    expect(css).toContain('var(--cs-surface-card)');
  });
});

/* ================================================================== */
/* 8. Tailwind theme                                                   */
/* ================================================================== */
describe('Component library — Tailwind theme', () => {
  // Dynamic import to test the theme object
  let theme: Record<string, unknown>;

  it('exports componentLibraryTheme', async () => {
    const mod = await import('../tailwind/component-library-theme.js');
    theme = mod.componentLibraryTheme as Record<string, unknown>;
    expect(theme).toBeDefined();
  });

  it('has colors for all components', async () => {
    const mod = await import('../tailwind/component-library-theme.js');
    const t = mod.componentLibraryTheme;
    expect(t.colors).toHaveProperty('btn');
    expect(t.colors).toHaveProperty('input');
    expect(t.colors).toHaveProperty('cs-card');
    expect(t.colors).toHaveProperty('modal');
  });

  it('has button variant color groups', async () => {
    const mod = await import('../tailwind/component-library-theme.js');
    const btn = mod.componentLibraryTheme.colors.btn;
    expect(btn).toHaveProperty('primary');
    expect(btn).toHaveProperty('secondary');
    expect(btn).toHaveProperty('ghost');
    expect(btn).toHaveProperty('danger');
    expect(btn).toHaveProperty('success');
  });

  it('has component height utilities', async () => {
    const mod = await import('../tailwind/component-library-theme.js');
    const h = mod.componentLibraryTheme.height;
    expect(h['btn-md']).toBe('36px');
    expect(h['input-md']).toBe('36px');
    expect(h['modal-header']).toBe('56px');
  });

  it('has modal width utilities', async () => {
    const mod = await import('../tailwind/component-library-theme.js');
    const w = mod.componentLibraryTheme.width;
    expect(w['modal-sm']).toBe('400px');
    expect(w['modal-md']).toBe('560px');
    expect(w['modal-lg']).toBe('720px');
    expect(w['modal-xl']).toBe('960px');
  });

  it('has component shadow utilities', async () => {
    const mod = await import('../tailwind/component-library-theme.js');
    const sh = mod.componentLibraryTheme.boxShadow;
    expect(sh['btn-primary']).toContain('rgba(124,58,237');
    expect(sh['cs-card']).toContain('rgba(0,0,0');
    expect(sh.modal).toContain('rgba(0,0,0');
  });

  it('has component border radius utilities', async () => {
    const mod = await import('../tailwind/component-library-theme.js');
    const br = mod.componentLibraryTheme.borderRadius;
    expect(br['btn-md']).toBe('6px');
    expect(br['card-md']).toBe('10px');
    expect(br.modal).toBe('12px');
  });

  it('has modal animation keyframes', async () => {
    const mod = await import('../tailwind/component-library-theme.js');
    const kf = mod.componentLibraryTheme.keyframes;
    expect(kf).toHaveProperty('modal-enter');
    expect(kf).toHaveProperty('modal-exit');
    expect(kf).toHaveProperty('overlay-enter');
    expect(kf).toHaveProperty('overlay-exit');
  });

  it('has modal animation presets', async () => {
    const mod = await import('../tailwind/component-library-theme.js');
    const anim = mod.componentLibraryTheme.animation;
    expect(anim['modal-enter']).toContain('cubic-bezier');
    expect(anim['modal-exit']).toContain('cubic-bezier');
  });

  it('button colors reference CSS variables with fallbacks', async () => {
    const mod = await import('../tailwind/component-library-theme.js');
    const primary = mod.componentLibraryTheme.colors.btn.primary;
    expect(primary.bg).toContain('var(--cs-interactive-default');
    expect(primary.bg).toContain('#7c3aed');
  });

  it('has backdrop blur for modal', async () => {
    const mod = await import('../tailwind/component-library-theme.js');
    expect(mod.componentLibraryTheme.backdropBlur.modal).toBe('4px');
  });
});

/* ================================================================== */
/* 9. Cross-format consistency                                         */
/* ================================================================== */
describe('Component library — Cross-format consistency', () => {
  const tokens = loadTokens('component-library.json') as any;
  const css = loadCSS('component-library-variables.css');

  it('JSON button md height matches CSS --btn-height default', () => {
    expect(tokens.crewspace.component.button.size.md.height.$value).toBe('36px');
    expect(css).toContain('--btn-height: 36px');
  });

  it('JSON modal md width matches CSS --modal-width default', () => {
    expect(tokens.crewspace.component.modal.size.md.width.$value).toBe('560px');
    expect(css).toContain('--modal-width: 560px');
  });

  it('JSON card md padding matches CSS --card-padding default', () => {
    expect(tokens.crewspace.component.card.size.md.padding.$value).toBe('16px');
    expect(css).toContain('--card-padding: 16px');
  });

  it('JSON input md height matches CSS --input-height default', () => {
    expect(tokens.crewspace.component.input.size.md.height.$value).toBe('36px');
    expect(css).toContain('--input-height: 36px');
  });

  it('JSON modal borderRadius matches CSS --modal-radius', () => {
    expect(tokens.crewspace.component.modal.borderRadius.$value).toBe('12px');
    expect(css).toContain('--modal-radius: 12px');
  });

  it('JSON button disabled opacity matches CSS --btn-disabled-opacity', () => {
    expect(tokens.crewspace.component.button.state.disabled.opacity.$value).toBe('0.4');
    expect(css).toContain('--btn-disabled-opacity: 0.4');
  });
});
