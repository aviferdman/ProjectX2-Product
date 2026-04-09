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

// ── Marketplace Token JSON ─────────────────────────────────────────

describe('marketplace.json — design tokens', () => {
  const tokens = loadTokens('marketplace.json');

  it('has DTCG schema reference', () => {
    expect(tokens.$schema).toBe('https://design-tokens.github.io/community-group/format/');
  });

  it('has crewspace.marketplace namespace', () => {
    expect(tokens).toHaveProperty('crewspace');
    const crewspace = tokens.crewspace as Record<string, unknown>;
    expect(crewspace).toHaveProperty('marketplace');
  });

  const marketplace = (tokens as { crewspace: { marketplace: Record<string, unknown> } }).crewspace.marketplace;

  it('contains required top-level sections', () => {
    const requiredSections = [
      'layout',
      'sizing',
      'grid',
      'searchBar',
      'filterChip',
      'sortDropdown',
      'categorySidebar',
      'categoryColor',
      'featured',
      'installButton',
      'progressBar',
      'installModal',
      'permissionList',
      'installStatus',
      'emptyState',
      'pagination',
      'typography',
      'animation',
    ];
    for (const section of requiredSections) {
      expect(marketplace).toHaveProperty(section);
    }
  });

  it('has a _description field for task traceability', () => {
    expect(marketplace._description).toContain('TASK-163');
  });

  describe('token leaf values', () => {
    const leaves = collectTokenLeaves(marketplace);

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
        'duration', 'cubicBezier', 'gradient',
      ];
      for (const leaf of leaves) {
        expect(validTypes, `${leaf.path} has type "${leaf.type}"`).toContain(leaf.type);
      }
    });
  });

  describe('install button states', () => {
    const installBtn = marketplace.installButton as Record<string, Record<string, unknown>>;

    it('has default state tokens', () => {
      expect(installBtn).toHaveProperty('default-bg');
      expect(installBtn).toHaveProperty('default-text');
      expect(installBtn).toHaveProperty('default-shadow');
    });

    it('has installing state tokens', () => {
      expect(installBtn).toHaveProperty('installing-bg');
      expect(installBtn).toHaveProperty('installing-text');
      expect(installBtn).toHaveProperty('installing-border');
    });

    it('has installed state tokens', () => {
      expect(installBtn).toHaveProperty('installed-bg');
      expect(installBtn).toHaveProperty('installed-text');
      expect(installBtn).toHaveProperty('installed-icon');
    });

    it('has uninstall state tokens', () => {
      expect(installBtn).toHaveProperty('uninstall-bg');
      expect(installBtn).toHaveProperty('uninstall-bg-hover');
      expect(installBtn).toHaveProperty('uninstall-text-hover');
    });
  });

  describe('install flow components', () => {
    it('has install modal with overlay, header, close, and body tokens', () => {
      const modal = marketplace.installModal as Record<string, unknown>;
      expect(modal).toHaveProperty('overlay');
      expect(modal).toHaveProperty('bg');
      expect(modal).toHaveProperty('header-bg');
      expect(modal).toHaveProperty('close-color');
      expect(modal).toHaveProperty('body-padding');
      expect(modal).toHaveProperty('icon-container-size');
    });

    it('has permission list with granted/required/optional icon states', () => {
      const perms = marketplace.permissionList as Record<string, unknown>;
      expect(perms).toHaveProperty('icon-color-granted');
      expect(perms).toHaveProperty('icon-color-required');
      expect(perms).toHaveProperty('icon-color-optional');
    });

    it('has install status with pending/running/success/error states', () => {
      const status = marketplace.installStatus as Record<string, unknown>;
      expect(status).toHaveProperty('pending-color');
      expect(status).toHaveProperty('running-color');
      expect(status).toHaveProperty('success-color');
      expect(status).toHaveProperty('error-color');
      expect(status).toHaveProperty('step-connector-color');
      expect(status).toHaveProperty('step-connector-color-done');
    });

    it('has progress bar with track, fill, complete, and error colors', () => {
      const bar = marketplace.progressBar as Record<string, unknown>;
      expect(bar).toHaveProperty('track-bg');
      expect(bar).toHaveProperty('fill-bg');
      expect(bar).toHaveProperty('fill-bg-complete');
      expect(bar).toHaveProperty('fill-bg-error');
    });
  });

  describe('responsive grid configuration', () => {
    const grid = marketplace.grid as Record<string, { value: string }>;

    it('defines breakpoint column counts', () => {
      expect(grid['columns-sm'].value).toBe('1');
      expect(grid['columns-md'].value).toBe('2');
      expect(grid['columns-lg'].value).toBe('3');
      expect(grid['columns-xl'].value).toBe('4');
    });
  });

  describe('animation tokens', () => {
    const anim = marketplace.animation as Record<string, { value: string }>;

    it('includes card, modal, progress, and spinner durations', () => {
      expect(anim).toHaveProperty('card-enter-duration');
      expect(anim).toHaveProperty('modal-enter-duration');
      expect(anim).toHaveProperty('progress-duration');
      expect(anim).toHaveProperty('spinner-duration');
    });

    it('uses spring easing for card and modal enter', () => {
      expect(anim['card-enter-easing'].value).toContain('cubic-bezier');
      expect(anim['modal-enter-easing'].value).toContain('cubic-bezier');
    });

    it('has stagger delay for sequential card animation', () => {
      expect(anim['stagger-delay'].value).toBe('40ms');
      expect(anim['max-stagger'].value).toBe('500ms');
    });
  });

  describe('category colors', () => {
    const cats = marketplace.categoryColor as Record<string, Record<string, string>>;

    it('provides 6 category color pairs', () => {
      const categories = ['ai-ml', 'communication', 'data', 'devtools', 'productivity', 'storage'];
      for (const cat of categories) {
        expect(cats).toHaveProperty(cat);
        expect(cats).toHaveProperty(`${cat}-bg`);
      }
    });
  });
});

// ── Marketplace CSS Variables ──────────────────────────────────────

describe('marketplace-variables.css — custom properties', () => {
  const css = loadCSS('marketplace-variables.css');

  it('contains TASK-163 reference', () => {
    expect(css).toContain('TASK-163');
  });

  it('defines the root .cs-marketplace class', () => {
    expect(css).toContain('.cs-marketplace');
  });

  describe('component selectors', () => {
    const requiredSelectors = [
      '.cs-marketplace-header',
      '.cs-marketplace-sidebar',
      '.cs-marketplace-toolbar',
      '.cs-marketplace-grid',
      '.cs-marketplace-featured',
      '.cs-mp-install-btn',
      '.cs-mp-install-btn--default',
      '.cs-mp-install-btn--installing',
      '.cs-mp-install-btn--installed',
      '.cs-mp-install-btn--uninstall',
      '.cs-mp-progress-bar',
      '.cs-mp-install-modal',
      '.cs-mp-permission-list',
      '.cs-mp-install-status',
      '.cs-marketplace-pagination',
      '.cs-marketplace-empty',
    ];

    for (const selector of requiredSelectors) {
      it(`has ${selector}`, () => {
        expect(css).toContain(selector);
      });
    }
  });

  describe('animations', () => {
    const requiredKeyframes = [
      'cs-mp-card-enter',
      'cs-mp-modal-enter',
      'cs-mp-overlay-fade',
      'cs-mp-progress-shimmer',
      'cs-mp-spinner',
      'cs-mp-success-pulse',
      'cs-mp-grid-reflow',
      'cs-mp-empty-in',
      'cs-mp-status-step-enter',
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

  describe('install flow variables', () => {
    it('defines progress bar variables', () => {
      expect(css).toContain('--progress-h');
      expect(css).toContain('--progress-track-bg');
      expect(css).toContain('--progress-fill-bg');
      expect(css).toContain('--progress-fill-bg-complete');
      expect(css).toContain('--progress-fill-bg-error');
    });

    it('defines install status step variables', () => {
      expect(css).toContain('--status-pending-color');
      expect(css).toContain('--status-running-color');
      expect(css).toContain('--status-success-color');
      expect(css).toContain('--status-error-color');
    });

    it('defines permission list variables', () => {
      expect(css).toContain('--perm-icon-granted');
      expect(css).toContain('--perm-icon-required');
      expect(css).toContain('--perm-icon-optional');
    });
  });
});

// ── Marketplace Tailwind Theme ─────────────────────────────────────

describe('marketplace-theme.ts — Tailwind theme extension', () => {
  // Dynamic import not needed — we loaded the JSON above for validation.
  // For the Tailwind theme, we validate the exported TypeScript structure at source level.
  const themeSource = readFileSync(resolve(TAILWIND_DIR, 'marketplace-theme.ts'), 'utf-8');

  it('exports marketplaceTheme as const', () => {
    expect(themeSource).toContain('export const marketplaceTheme');
    expect(themeSource).toContain('as const');
  });

  it('contains TASK-163 reference', () => {
    expect(themeSource).toContain('TASK-163');
  });

  describe('theme sections', () => {
    const requiredSections = ['colors', 'spacing', 'fontSize', 'maxHeight', 'boxShadow', 'animation', 'keyframes'];
    for (const section of requiredSections) {
      it(`has ${section} section`, () => {
        expect(themeSource).toContain(`${section}:`);
      });
    }
  });

  describe('color groups', () => {
    const requiredColorGroups = [
      'mp-layout',
      'mp-category',
      'mp-search',
      'mp-filter',
      'mp-sort',
      'mp-featured',
      'mp-install-btn',
      'mp-progress',
      'mp-modal',
      'mp-permission',
      'mp-status',
      'mp-pagination',
      'mp-empty',
    ];

    for (const group of requiredColorGroups) {
      it(`has '${group}' color group`, () => {
        expect(themeSource).toContain(`'${group}'`);
      });
    }
  });

  describe('spacing tokens', () => {
    const requiredSpacing = [
      'mp-header-h',
      'mp-sidebar-w',
      'mp-content-max-w',
      'mp-card-w',
      'mp-card-gap',
      'mp-modal-w',
      'mp-install-btn-h',
      'mp-progress-h',
      'mp-empty-icon-size',
    ];

    for (const token of requiredSpacing) {
      it(`has '${token}' spacing`, () => {
        expect(themeSource).toContain(`'${token}'`);
      });
    }
  });

  describe('fontSize presets', () => {
    const requiredFontSizes = [
      'mp-page-title',
      'mp-section-title',
      'mp-sidebar-item',
      'mp-install-btn',
      'mp-modal-title',
      'mp-perm-label',
      'mp-empty-heading',
    ];

    for (const preset of requiredFontSizes) {
      it(`has '${preset}' fontSize preset`, () => {
        expect(themeSource).toContain(`'${preset}'`);
      });
    }
  });

  describe('animation keyframes', () => {
    const requiredKeyframes = [
      'mp-card-enter',
      'mp-modal-enter',
      'mp-overlay-fade',
      'mp-progress-shimmer',
      'mp-spinner',
      'mp-success-pulse',
      'mp-grid-reflow',
      'mp-empty-in',
      'mp-status-step-enter',
    ];

    for (const kf of requiredKeyframes) {
      it(`has '${kf}' keyframe`, () => {
        expect(themeSource).toContain(`'${kf}'`);
      });
    }
  });

  it('uses mp- prefix consistently for marketplace spacing keys', () => {
    // Match key-value pairs like 'mp-header-h': '56px'
    const spacingBlock = themeSource.match(/spacing:\s*\{([\s\S]*?)\n  \}/);
    if (spacingBlock) {
      const keyPattern = /^\s+'([^']+)':/gm;
      let match;
      const keys: string[] = [];
      while ((match = keyPattern.exec(spacingBlock[1])) !== null) {
        keys.push(match[1]);
      }
      expect(keys.length).toBeGreaterThan(0);
      for (const key of keys) {
        expect(key, `spacing key "${key}" should start with mp-`).toMatch(/^mp-/);
      }
    }
  });
});
