import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── Helpers ────────────────────────────────────────────────────────

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

// Recursively collect all leaf token objects (those with "value" and "type")
function collectTokenLeaves(
  obj: Record<string, unknown>,
  path = '',
): Array<{ path: string; value: unknown; type: string; description?: string }> {
  const results: Array<{ path: string; value: unknown; type: string; description?: string }> = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('_')) continue;
    const current = path ? `${path}.${key}` : key;
    if (val && typeof val === 'object' && 'value' in (val as Record<string, unknown>) && 'type' in (val as Record<string, unknown>)) {
      const token = val as { value: unknown; type: string; description?: string };
      results.push({ path: current, value: token.value, type: token.type, description: token.description });
    } else if (val && typeof val === 'object') {
      results.push(...collectTokenLeaves(val as Record<string, unknown>, current));
    }
  }
  return results;
}

// ── Visual Polish Token JSON ──────────────────────────────────────

describe('visual-polish.json — design tokens', () => {
  const tokens = loadTokens('visual-polish.json');

  it('has DTCG schema reference', () => {
    expect(tokens.$schema).toBe('https://design-tokens.github.io/community-group/format/');
  });

  it('has crewspace.visualPolish namespace', () => {
    expect(tokens).toHaveProperty('crewspace');
    const crewspace = tokens.crewspace as Record<string, unknown>;
    expect(crewspace).toHaveProperty('visualPolish');
  });

  const visualPolish = (tokens as { crewspace: { visualPolish: Record<string, unknown> } }).crewspace.visualPolish;

  it('contains required top-level sections', () => {
    const requiredSections = [
      'spacing',
      'card',
      'focus',
      'divider',
      'overlay',
      'iconSize',
      'button',
      'input',
      'badge',
      'typography',
      'stateOpacity',
      'animation',
      'scrollbar',
      'zIndex',
    ];
    for (const section of requiredSections) {
      expect(visualPolish, `missing section: ${section}`).toHaveProperty(section);
    }
  });

  it('has a _description field for task traceability', () => {
    expect(visualPolish._description).toContain('TASK-177');
  });

  describe('token leaf values', () => {
    const leaves = collectTokenLeaves(visualPolish);

    it('has at least 100 token leaves', () => {
      expect(leaves.length).toBeGreaterThanOrEqual(100);
    });

    it('every leaf has a non-empty value', () => {
      for (const leaf of leaves) {
        expect(leaf.value, `${leaf.path} should have a value`).toBeDefined();
        expect(String(leaf.value).length, `${leaf.path} value should not be empty`).toBeGreaterThan(0);
      }
    });

    it('every leaf has a valid type', () => {
      const validTypes = [
        'color', 'sizing', 'number', 'borderRadius', 'boxShadow',
        'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
        'duration', 'cubicBezier', 'gradient', 'typography',
      ];
      for (const leaf of leaves) {
        expect(validTypes, `${leaf.path} has type "${leaf.type}"`).toContain(leaf.type);
      }
    });
  });

  describe('spacing section', () => {
    const spacing = visualPolish.spacing as Record<string, Record<string, unknown>>;

    it('has component gap scale', () => {
      const gaps = ['component-gap-xs', 'component-gap-sm', 'component-gap-md', 'component-gap-lg', 'component-gap-xl', 'component-gap-2xl'];
      for (const gap of gaps) {
        expect(spacing, `missing ${gap}`).toHaveProperty(gap);
      }
    });

    it('has inset padding scale', () => {
      const insets = ['inset-xs', 'inset-sm', 'inset-md', 'inset-lg', 'inset-xl', 'inset-2xl'];
      for (const inset of insets) {
        expect(spacing, `missing ${inset}`).toHaveProperty(inset);
      }
    });

    it('has stack spacing scale', () => {
      const stacks = ['stack-xs', 'stack-sm', 'stack-md', 'stack-lg', 'stack-xl'];
      for (const stack of stacks) {
        expect(spacing, `missing ${stack}`).toHaveProperty(stack);
      }
    });

    it('gap values increase monotonically', () => {
      const gapValues = ['component-gap-xs', 'component-gap-sm', 'component-gap-md', 'component-gap-lg', 'component-gap-xl', 'component-gap-2xl']
        .map(k => parseInt((spacing[k] as { value: string }).value));
      for (let i = 1; i < gapValues.length; i++) {
        expect(gapValues[i], `gap scale should increase`).toBeGreaterThan(gapValues[i - 1]);
      }
    });
  });

  describe('card section', () => {
    const card = visualPolish.card as Record<string, Record<string, unknown>>;

    it('has unified card padding', () => {
      expect(card).toHaveProperty('padding');
      expect(card).toHaveProperty('padding-compact');
    });

    it('has unified card shadows', () => {
      expect(card).toHaveProperty('shadow');
      expect(card).toHaveProperty('shadow-hover');
      expect(card).toHaveProperty('shadow-active');
    });

    it('has unified card colors', () => {
      expect(card).toHaveProperty('bg');
      expect(card).toHaveProperty('bg-hover');
      expect(card).toHaveProperty('border-color');
      expect(card).toHaveProperty('border-color-hover');
    });

    it('has unified card radius', () => {
      expect(card).toHaveProperty('radius');
      expect((card.radius as { value: string }).value).toBe('12px');
    });
  });

  describe('focus section', () => {
    const focus = visualPolish.focus as Record<string, Record<string, unknown>>;

    it('defines focus ring tokens', () => {
      expect(focus).toHaveProperty('ring-color');
      expect(focus).toHaveProperty('ring-width');
      expect(focus).toHaveProperty('ring-offset');
      expect(focus).toHaveProperty('ring-offset-color');
      expect(focus).toHaveProperty('ring-shadow');
    });
  });

  describe('button section', () => {
    const button = visualPolish.button as Record<string, Record<string, unknown>>;

    it('has button size scale', () => {
      expect(button).toHaveProperty('height-sm');
      expect(button).toHaveProperty('height-md');
      expect(button).toHaveProperty('height-lg');
    });

    it('has primary variant', () => {
      expect(button).toHaveProperty('primary-bg');
      expect(button).toHaveProperty('primary-bg-hover');
      expect(button).toHaveProperty('primary-text');
      expect(button).toHaveProperty('primary-shadow');
    });

    it('has ghost variant', () => {
      expect(button).toHaveProperty('ghost-bg');
      expect(button).toHaveProperty('ghost-bg-hover');
      expect(button).toHaveProperty('ghost-text');
      expect(button).toHaveProperty('ghost-text-hover');
    });

    it('has danger variant', () => {
      expect(button).toHaveProperty('danger-bg');
      expect(button).toHaveProperty('danger-bg-hover');
      expect(button).toHaveProperty('danger-text');
    });
  });

  describe('input section', () => {
    const input = visualPolish.input as Record<string, Record<string, unknown>>;

    it('has input height and padding', () => {
      expect(input).toHaveProperty('height');
      expect(input).toHaveProperty('height-sm');
      expect(input).toHaveProperty('padding-x');
    });

    it('has input border states', () => {
      expect(input).toHaveProperty('border-color');
      expect(input).toHaveProperty('border-color-hover');
      expect(input).toHaveProperty('border-color-focus');
    });
  });

  describe('badge section', () => {
    const badge = visualPolish.badge as Record<string, Record<string, unknown>>;

    it('has badge sizing and typography', () => {
      expect(badge).toHaveProperty('height');
      expect(badge).toHaveProperty('height-sm');
      expect(badge).toHaveProperty('padding-x');
      expect(badge).toHaveProperty('font-size');
      expect(badge).toHaveProperty('font-weight');
    });

    it('has status dot tokens', () => {
      expect(badge).toHaveProperty('dot-size');
      expect(badge).toHaveProperty('dot-gap');
    });
  });

  describe('icon size section', () => {
    const iconSize = visualPolish.iconSize as Record<string, Record<string, unknown>>;

    it('has full icon size scale', () => {
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
      for (const size of sizes) {
        expect(iconSize, `missing icon size ${size}`).toHaveProperty(size);
      }
    });

    it('icon sizes increase monotonically', () => {
      const sizeValues = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
        .map(k => parseInt((iconSize[k] as { value: string }).value));
      for (let i = 1; i < sizeValues.length; i++) {
        expect(sizeValues[i]).toBeGreaterThan(sizeValues[i - 1]);
      }
    });
  });

  describe('typography section', () => {
    const typography = visualPolish.typography as Record<string, Record<string, unknown>>;

    it('has all standard typography presets', () => {
      const presets = ['page-title', 'section-title', 'card-title', 'card-body', 'card-meta', 'label', 'caption', 'overline'];
      for (const preset of presets) {
        expect(typography, `missing preset ${preset}`).toHaveProperty(preset);
      }
    });

    it('each preset has fontSize and fontWeight', () => {
      const presets = ['page-title', 'section-title', 'card-title', 'card-body', 'card-meta', 'label', 'caption', 'overline'];
      for (const preset of presets) {
        const val = (typography[preset] as { value: Record<string, string> }).value;
        expect(val).toHaveProperty('fontSize');
        expect(val).toHaveProperty('fontWeight');
      }
    });
  });

  describe('animation section', () => {
    const animation = visualPolish.animation as Record<string, { value: string }>;

    it('has duration scale', () => {
      const durations = ['duration-instant', 'duration-fast', 'duration-normal', 'duration-moderate', 'duration-slow', 'duration-enter'];
      for (const d of durations) {
        expect(animation, `missing ${d}`).toHaveProperty(d);
      }
    });

    it('has easing presets', () => {
      const easings = ['easing-default', 'easing-in', 'easing-out', 'easing-spring'];
      for (const e of easings) {
        expect(animation, `missing ${e}`).toHaveProperty(e);
      }
    });

    it('spring easing uses cubic-bezier', () => {
      expect(animation['easing-spring'].value).toContain('cubic-bezier');
    });

    it('has stagger tokens', () => {
      expect(animation).toHaveProperty('stagger-delay');
      expect(animation).toHaveProperty('max-stagger');
    });
  });

  describe('overlay section', () => {
    const overlay = visualPolish.overlay as Record<string, Record<string, unknown>>;

    it('has three overlay weight variants', () => {
      expect(overlay).toHaveProperty('bg');
      expect(overlay).toHaveProperty('bg-light');
      expect(overlay).toHaveProperty('bg-heavy');
    });

    it('has backdrop blur values', () => {
      expect(overlay).toHaveProperty('backdrop-blur');
      expect(overlay).toHaveProperty('backdrop-blur-sm');
    });
  });

  describe('z-index section', () => {
    const zIndex = visualPolish.zIndex as Record<string, { value: string }>;

    it('has complete stacking scale', () => {
      const layers = ['base', 'dropdown', 'sticky', 'overlay', 'modal', 'popover', 'tooltip', 'toast'];
      for (const layer of layers) {
        expect(zIndex, `missing z-index ${layer}`).toHaveProperty(layer);
      }
    });

    it('z-index values increase monotonically', () => {
      const values = ['base', 'dropdown', 'sticky', 'overlay', 'modal', 'popover', 'tooltip', 'toast']
        .map(k => parseInt(zIndex[k].value));
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1]);
      }
    });
  });

  describe('scrollbar section', () => {
    const scrollbar = visualPolish.scrollbar as Record<string, Record<string, unknown>>;

    it('has scrollbar customization tokens', () => {
      expect(scrollbar).toHaveProperty('width');
      expect(scrollbar).toHaveProperty('track-bg');
      expect(scrollbar).toHaveProperty('thumb-bg');
      expect(scrollbar).toHaveProperty('thumb-bg-hover');
      expect(scrollbar).toHaveProperty('thumb-radius');
    });
  });

  describe('state opacity section', () => {
    const stateOpacity = visualPolish.stateOpacity as Record<string, { value: string }>;

    it('has all interaction state opacities', () => {
      expect(stateOpacity).toHaveProperty('hover-highlight');
      expect(stateOpacity).toHaveProperty('active-highlight');
      expect(stateOpacity).toHaveProperty('selected-highlight');
      expect(stateOpacity).toHaveProperty('disabled');
      expect(stateOpacity).toHaveProperty('placeholder');
    });

    it('hover < active < selected opacities', () => {
      const hover = parseFloat(stateOpacity['hover-highlight'].value);
      const active = parseFloat(stateOpacity['active-highlight'].value);
      const selected = parseFloat(stateOpacity['selected-highlight'].value);
      expect(active).toBeGreaterThan(hover);
      expect(selected).toBeGreaterThan(active);
    });
  });

  describe('divider section', () => {
    const divider = visualPolish.divider as Record<string, Record<string, unknown>>;

    it('has divider tokens', () => {
      expect(divider).toHaveProperty('color');
      expect(divider).toHaveProperty('color-strong');
      expect(divider).toHaveProperty('width');
      expect(divider).toHaveProperty('spacing');
      expect(divider).toHaveProperty('spacing-compact');
    });
  });
});

// ── Visual Polish CSS Variables ───────────────────────────────────

describe('visual-polish-variables.css — custom properties', () => {
  const css = loadCSS('visual-polish-variables.css');

  it('contains TASK-177 reference', () => {
    expect(css).toContain('TASK-177');
  });

  describe('root spacing variables', () => {
    it('defines gap scale', () => {
      expect(css).toContain('--cs-gap-xs');
      expect(css).toContain('--cs-gap-sm');
      expect(css).toContain('--cs-gap-md');
      expect(css).toContain('--cs-gap-lg');
      expect(css).toContain('--cs-gap-xl');
      expect(css).toContain('--cs-gap-2xl');
    });

    it('defines inset scale', () => {
      expect(css).toContain('--cs-inset-xs');
      expect(css).toContain('--cs-inset-sm');
      expect(css).toContain('--cs-inset-md');
      expect(css).toContain('--cs-inset-lg');
      expect(css).toContain('--cs-inset-xl');
      expect(css).toContain('--cs-inset-2xl');
    });

    it('defines stack scale', () => {
      expect(css).toContain('--cs-stack-xs');
      expect(css).toContain('--cs-stack-sm');
      expect(css).toContain('--cs-stack-md');
      expect(css).toContain('--cs-stack-lg');
      expect(css).toContain('--cs-stack-xl');
    });
  });

  describe('icon size variables', () => {
    it('defines icon size scale', () => {
      expect(css).toContain('--cs-icon-xs');
      expect(css).toContain('--cs-icon-sm');
      expect(css).toContain('--cs-icon-md');
      expect(css).toContain('--cs-icon-lg');
      expect(css).toContain('--cs-icon-xl');
      expect(css).toContain('--cs-icon-2xl');
    });
  });

  describe('focus ring variables', () => {
    it('defines focus ring tokens', () => {
      expect(css).toContain('--cs-focus-ring-color');
      expect(css).toContain('--cs-focus-ring-width');
      expect(css).toContain('--cs-focus-ring-offset');
      expect(css).toContain('--cs-focus-ring-shadow');
    });
  });

  describe('overlay variables', () => {
    it('defines overlay backgrounds', () => {
      expect(css).toContain('--cs-overlay-bg:');
      expect(css).toContain('--cs-overlay-bg-light');
      expect(css).toContain('--cs-overlay-bg-heavy');
      expect(css).toContain('--cs-overlay-blur');
    });
  });

  describe('animation variables', () => {
    it('defines duration scale', () => {
      expect(css).toContain('--cs-duration-instant');
      expect(css).toContain('--cs-duration-fast');
      expect(css).toContain('--cs-duration-normal');
      expect(css).toContain('--cs-duration-moderate');
      expect(css).toContain('--cs-duration-slow');
      expect(css).toContain('--cs-duration-enter');
    });

    it('defines easing presets', () => {
      expect(css).toContain('--cs-easing-default');
      expect(css).toContain('--cs-easing-in');
      expect(css).toContain('--cs-easing-out');
      expect(css).toContain('--cs-easing-spring');
    });

    it('defines stagger tokens', () => {
      expect(css).toContain('--cs-stagger-delay');
      expect(css).toContain('--cs-stagger-max');
    });
  });

  describe('z-index variables', () => {
    it('defines z-index scale', () => {
      expect(css).toContain('--cs-z-base');
      expect(css).toContain('--cs-z-dropdown');
      expect(css).toContain('--cs-z-sticky');
      expect(css).toContain('--cs-z-overlay');
      expect(css).toContain('--cs-z-modal');
      expect(css).toContain('--cs-z-popover');
      expect(css).toContain('--cs-z-tooltip');
      expect(css).toContain('--cs-z-toast');
    });
  });

  describe('component classes', () => {
    const requiredSelectors = [
      '.cs-card-polished',
      '.cs-btn-polished',
      '.cs-input-polished',
      '.cs-badge-polished',
      '.cs-focus-ring',
      '.cs-divider',
      '.cs-divider--compact',
      '.cs-divider--strong',
      '.cs-divider--vertical',
      '.cs-scrollbar',
      '.cs-overlay',
      '.cs-overlay--light',
      '.cs-overlay--heavy',
      '.cs-disabled',
    ];

    for (const selector of requiredSelectors) {
      it(`has ${selector}`, () => {
        expect(css).toContain(selector);
      });
    }
  });

  describe('typography classes', () => {
    const requiredClasses = [
      '.cs-type-page-title',
      '.cs-type-section-title',
      '.cs-type-card-title',
      '.cs-type-card-body',
      '.cs-type-card-meta',
      '.cs-type-label',
      '.cs-type-caption',
      '.cs-type-overline',
    ];

    for (const cls of requiredClasses) {
      it(`has ${cls}`, () => {
        expect(css).toContain(cls);
      });
    }
  });

  describe('animations', () => {
    const requiredKeyframes = [
      'cs-polish-fade-in',
      'cs-polish-slide-up',
      'cs-polish-scale-in',
      'cs-polish-spring-in',
      'cs-polish-shimmer',
      'cs-polish-spin',
      'cs-polish-pulse',
    ];

    for (const kf of requiredKeyframes) {
      it(`defines @keyframes ${kf}`, () => {
        expect(css).toContain(`@keyframes ${kf}`);
      });
    }
  });

  it('has reduced-motion media query', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('has responsive breakpoint for mobile', () => {
    expect(css).toContain('@media (max-width: 768px)');
  });

  describe('scrollbar variables', () => {
    it('defines scrollbar customization', () => {
      expect(css).toContain('--cs-scrollbar-w');
      expect(css).toContain('--cs-scrollbar-track');
      expect(css).toContain('--cs-scrollbar-thumb');
      expect(css).toContain('--cs-scrollbar-thumb-hover');
    });
  });

  describe('state opacity variables', () => {
    it('defines interaction opacities', () => {
      expect(css).toContain('--cs-opacity-hover');
      expect(css).toContain('--cs-opacity-active');
      expect(css).toContain('--cs-opacity-selected');
      expect(css).toContain('--cs-opacity-disabled');
      expect(css).toContain('--cs-opacity-placeholder');
    });
  });

  describe('card polished variables', () => {
    it('defines unified card surface tokens', () => {
      expect(css).toContain('--card-p:');
      expect(css).toContain('--card-gap:');
      expect(css).toContain('--card-radius');
      expect(css).toContain('--card-shadow:');
      expect(css).toContain('--card-shadow-hover');
      expect(css).toContain('--card-shadow-active');
      expect(css).toContain('--card-transition');
    });
  });

  describe('button polished variables', () => {
    it('defines unified button tokens', () => {
      expect(css).toContain('--btn-h-sm');
      expect(css).toContain('--btn-h-md');
      expect(css).toContain('--btn-h-lg');
      expect(css).toContain('--btn-primary-bg');
      expect(css).toContain('--btn-ghost-bg');
      expect(css).toContain('--btn-danger-bg');
    });
  });

  describe('input polished variables', () => {
    it('defines unified input tokens', () => {
      expect(css).toContain('--input-h:');
      expect(css).toContain('--input-px');
      expect(css).toContain('--input-radius');
      expect(css).toContain('--input-border-focus');
    });
  });

  describe('reduced motion overrides', () => {
    it('zeroes all durations in prefers-reduced-motion', () => {
      const reducedMotionMatch = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/);
      expect(reducedMotionMatch).not.toBeNull();
      if (reducedMotionMatch) {
        expect(reducedMotionMatch[1]).toContain('--cs-duration-instant: 0ms');
        expect(reducedMotionMatch[1]).toContain('--cs-duration-fast: 0ms');
        expect(reducedMotionMatch[1]).toContain('--cs-duration-normal: 0ms');
      }
    });
  });
});

// ── Visual Polish Tailwind Theme ──────────────────────────────────

describe('visual-polish-theme.ts — Tailwind theme extension', () => {
  const themeSource = readFileSync(resolve(TAILWIND_DIR, 'visual-polish-theme.ts'), 'utf-8');

  it('exports visualPolishTheme as const', () => {
    expect(themeSource).toContain('export const visualPolishTheme');
    expect(themeSource).toContain('as const');
  });

  it('contains TASK-177 reference', () => {
    expect(themeSource).toContain('TASK-177');
  });

  describe('theme sections', () => {
    const requiredSections = [
      'colors',
      'spacing',
      'fontSize',
      'borderRadius',
      'boxShadow',
      'opacity',
      'zIndex',
      'backdropBlur',
      'transitionDuration',
      'transitionTimingFunction',
      'animation',
      'keyframes',
    ];
    for (const section of requiredSections) {
      it(`has ${section} section`, () => {
        expect(themeSource).toContain(`${section}:`);
      });
    }
  });

  describe('color groups', () => {
    const requiredColorGroups = [
      'polish-card',
      'polish-btn',
      'polish-input',
      'polish-focus',
      'polish-divider',
      'polish-overlay',
      'polish-scrollbar',
    ];

    for (const group of requiredColorGroups) {
      it(`has '${group}' color group`, () => {
        expect(themeSource).toContain(`'${group}'`);
      });
    }
  });

  describe('spacing tokens', () => {
    const requiredSpacing = [
      'gap-xs',
      'gap-lg',
      'gap-2xl',
      'inset-xs',
      'inset-lg',
      'inset-2xl',
      'stack-xs',
      'stack-lg',
      'icon-xs',
      'icon-2xl',
      'btn-h-sm',
      'btn-h-lg',
      'input-h',
      'badge-h',
      'card-p',
      'card-gap',
      'divider-spacing',
      'scrollbar-w',
      'focus-ring-w',
    ];

    for (const token of requiredSpacing) {
      it(`has '${token}' spacing`, () => {
        expect(themeSource).toContain(`'${token}'`);
      });
    }
  });

  describe('fontSize presets', () => {
    const requiredFontSizes = [
      'polish-page-title',
      'polish-section-title',
      'polish-card-title',
      'polish-card-body',
      'polish-card-meta',
      'polish-label',
      'polish-caption',
      'polish-overline',
      'polish-btn',
      'polish-input',
      'polish-badge',
    ];

    for (const preset of requiredFontSizes) {
      it(`has '${preset}' fontSize preset`, () => {
        expect(themeSource).toContain(`'${preset}'`);
      });
    }
  });

  describe('border radius tokens', () => {
    it('has polished card radius', () => {
      expect(themeSource).toContain("'card-polished'");
    });

    it('has polished button radius', () => {
      expect(themeSource).toContain("'btn-polished'");
    });

    it('has polished input radius', () => {
      expect(themeSource).toContain("'input-polished'");
    });
  });

  describe('box shadow tokens', () => {
    const requiredShadows = [
      'card-polished',
      'card-polished-hover',
      'card-polished-active',
      'btn-primary',
      'btn-primary-hover',
      'focus-ring',
    ];

    for (const shadow of requiredShadows) {
      it(`has '${shadow}' shadow`, () => {
        expect(themeSource).toContain(`'${shadow}'`);
      });
    }
  });

  describe('z-index tokens', () => {
    const requiredLayers = ['dropdown', 'sticky', 'overlay', 'modal', 'popover', 'tooltip', 'toast'];

    for (const layer of requiredLayers) {
      it(`has '${layer}' z-index`, () => {
        expect(themeSource).toContain(`${layer}:`);
      });
    }
  });

  describe('animation keyframes', () => {
    const requiredKeyframes = [
      'polish-fade-in',
      'polish-slide-up',
      'polish-scale-in',
      'polish-spring-in',
      'polish-shimmer',
      'polish-spin',
      'polish-pulse',
    ];

    for (const kf of requiredKeyframes) {
      it(`has '${kf}' keyframe`, () => {
        expect(themeSource).toContain(`'${kf}'`);
      });
    }
  });

  describe('transition timing functions', () => {
    it('has polish-default easing', () => {
      expect(themeSource).toContain("'polish-default'");
    });

    it('has polish-spring easing', () => {
      expect(themeSource).toContain("'polish-spring'");
    });
  });

  describe('transition durations', () => {
    const requiredDurations = ['instant', 'fast', 'normal', 'moderate', 'slow', 'enter'];

    for (const d of requiredDurations) {
      it(`has '${d}' duration`, () => {
        expect(themeSource).toContain(`${d}:`);
      });
    }
  });

  describe('opacity tokens', () => {
    it('has interaction state opacities', () => {
      expect(themeSource).toContain("'hover-highlight'");
      expect(themeSource).toContain("'active-highlight'");
      expect(themeSource).toContain("'selected-highlight'");
      expect(themeSource).toContain('disabled');
      expect(themeSource).toContain('placeholder');
    });
  });
});
