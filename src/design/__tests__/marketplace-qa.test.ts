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

function loadTailwind(filename: string): string {
  return readFileSync(resolve(TAILWIND_DIR, filename), 'utf-8');
}

function collectTokenLeaves(
  obj: Record<string, unknown>,
  path = '',
): Array<{ path: string; value: unknown; type: string; description?: string }> {
  const results: Array<{ path: string; value: unknown; type: string; description?: string }> = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('_') || key.startsWith('$')) continue;
    const current = path ? `${path}.${key}` : key;
    if (
      val &&
      typeof val === 'object' &&
      'value' in (val as Record<string, unknown>) &&
      'type' in (val as Record<string, unknown>)
    ) {
      const token = val as { value: unknown; type: string; description?: string };
      results.push({
        path: current,
        value: token.value,
        type: token.type,
        description: token.description,
      });
    } else if (val && typeof val === 'object') {
      results.push(...collectTokenLeaves(val as Record<string, unknown>, current));
    }
  }
  return results;
}

// Normalize CSS value for comparison (strip spaces around commas / inside rgba)
function normalizeCSSValue(v: string): string {
  return String(v)
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ',')
    .trim();
}

// ── Load all three marketplace files ──────────────────────────────

const mpTokens = loadTokens('marketplace.json');
const marketplace = (mpTokens as { crewspace: { marketplace: Record<string, unknown> } }).crewspace
  .marketplace;
const mpCSS = loadCSS('marketplace-variables.css');
const mpTW = loadTailwind('marketplace-theme.ts');

// Also load integration card for cross-component checks
const icTokens = loadTokens('integration-card.json');
const integrationCard = (icTokens as { crewspace: { integrationCard: Record<string, unknown> } })
  .crewspace.integrationCard;
const icCSS = loadCSS('integration-card-variables.css');
const icTW = loadTailwind('integration-card-theme.ts');

// ── TASK-168: Design QA — marketplace implementation vs specs ─────

describe('TASK-168: Marketplace Tokens ↔ CSS consistency', () => {
  it('CSS references TASK-163 for traceability', () => {
    expect(mpCSS).toContain('TASK-163');
  });

  describe('layout sizing tokens reflected in CSS', () => {
    const sizing = marketplace.sizing as Record<string, { value: string }>;

    it('header height matches', () => {
      expect(mpCSS).toContain(`--mp-header-h: ${sizing['header-height'].value}`);
    });

    it('sidebar width matches', () => {
      expect(mpCSS).toContain(`--mp-sidebar-w: ${sizing['sidebar-width'].value}`);
    });

    it('sidebar collapsed width matches', () => {
      expect(mpCSS).toContain(
        `--mp-sidebar-collapsed-w: ${sizing['sidebar-collapsed-width'].value}`,
      );
    });

    it('content max width matches', () => {
      expect(mpCSS).toContain(`--mp-content-max-w: ${sizing['content-max-width'].value}`);
    });

    it('content padding matches', () => {
      expect(mpCSS).toContain(`--mp-content-padding: ${sizing['content-padding'].value}`);
    });

    it('toolbar height matches', () => {
      expect(mpCSS).toContain(`--mp-toolbar-h: ${sizing['toolbar-height'].value}`);
    });
  });

  describe('grid tokens reflected in CSS', () => {
    const grid = marketplace.grid as Record<string, { value: string }>;
    const sizing = marketplace.sizing as Record<string, { value: string }>;

    it('card width matches', () => {
      expect(mpCSS).toContain(`--grid-card-w: ${sizing['card-width'].value}`);
    });

    it('card min width matches', () => {
      expect(mpCSS).toContain(`--grid-card-min-w: ${sizing['card-min-width'].value}`);
    });

    it('card max width matches', () => {
      expect(mpCSS).toContain(`--grid-card-max-w: ${sizing['card-max-width'].value}`);
    });

    it('card gap matches', () => {
      expect(mpCSS).toContain(`--grid-card-gap: ${sizing['card-gap'].value}`);
    });

    it('responsive column counts are in CSS', () => {
      expect(mpCSS).toContain(`--grid-columns-sm: ${grid['columns-sm'].value}`);
      expect(mpCSS).toContain(`--grid-columns-md: ${grid['columns-md'].value}`);
      expect(mpCSS).toContain(`--grid-columns-lg: ${grid['columns-lg'].value}`);
      expect(mpCSS).toContain(`--grid-columns-xl: ${grid['columns-xl'].value}`);
    });
  });

  describe('search bar tokens reflected in CSS', () => {
    const search = marketplace.searchBar as Record<string, { value: string }>;

    it('search height matches', () => {
      expect(mpCSS).toContain(`--search-h: ${search.height.value}`);
    });

    it('search border focus color present', () => {
      expect(mpCSS).toContain('--search-border-focus');
    });
  });

  describe('filter chip tokens reflected in CSS', () => {
    it('chip height present', () => {
      expect(mpCSS).toContain('--chip-h: 30px');
    });

    it('chip gap present', () => {
      expect(mpCSS).toContain('--chip-gap: 8px');
    });

    it('chip radius is pill shape', () => {
      expect(mpCSS).toContain('--chip-radius: 9999px');
    });
  });

  describe('install button state tokens reflected in CSS', () => {
    it('default state bg matches token', () => {
      expect(mpCSS).toContain('--btn-bg: #6366f1');
    });

    it('installing state has bg, text, border', () => {
      expect(mpCSS).toContain('--btn-bg: rgba(139, 92, 246, 0.15)');
      expect(mpCSS).toContain('--btn-text: #a5b4fc');
      expect(mpCSS).toContain('--btn-border: rgba(139, 92, 246, 0.3)');
    });

    it('installed state has green tokens', () => {
      expect(mpCSS).toContain('--btn-bg: rgba(52, 211, 153, 0.12)');
      expect(mpCSS).toContain('--btn-text: #34d399');
      expect(mpCSS).toContain('--btn-icon-color: #34d399');
    });

    it('uninstall hover state has rose accent', () => {
      expect(mpCSS).toContain('--btn-text-hover: #f87171');
      expect(mpCSS).toContain('--btn-bg-hover: rgba(251, 113, 133, 0.1)');
    });
  });

  describe('progress bar tokens reflected in CSS', () => {
    it('track bg present', () => {
      expect(mpCSS).toContain('--progress-track-bg');
    });

    it('fill colors for all states', () => {
      expect(mpCSS).toContain('--progress-fill-bg: #818cf8');
      expect(mpCSS).toContain('--progress-fill-bg-complete: #10b981');
      expect(mpCSS).toContain('--progress-fill-bg-error: #ef4444');
    });

    it('shimmer highlight present', () => {
      expect(mpCSS).toContain('--progress-shimmer');
    });

    it('transition duration present', () => {
      expect(mpCSS).toContain('--progress-transition: 400ms ease-out');
    });
  });

  describe('install modal tokens reflected in CSS', () => {
    it('modal width matches token', () => {
      const sizing = marketplace.sizing as Record<string, { value: string }>;
      expect(mpCSS).toContain(`--modal-w: ${sizing['install-modal-width'].value}`);
    });

    it('modal max height matches token', () => {
      const sizing = marketplace.sizing as Record<string, { value: string }>;
      expect(mpCSS).toContain(`--modal-max-h: ${sizing['install-modal-max-height'].value}`);
    });

    it('modal shadow present', () => {
      expect(mpCSS).toContain('--modal-shadow');
    });

    it('modal icon size present', () => {
      expect(mpCSS).toContain('--modal-icon-size: 48px');
    });
  });

  describe('permission list tokens reflected in CSS', () => {
    it('has icon state colors', () => {
      expect(mpCSS).toContain('--perm-icon-granted: #34d399');
      expect(mpCSS).toContain('--perm-icon-required: #fbbf24');
      expect(mpCSS).toContain('--perm-icon-optional');
    });
  });

  describe('install status tokens reflected in CSS', () => {
    it('has all 4 states', () => {
      expect(mpCSS).toContain('--status-pending-color');
      expect(mpCSS).toContain('--status-running-color');
      expect(mpCSS).toContain('--status-success-color');
      expect(mpCSS).toContain('--status-error-color');
    });

    it('has connector tokens', () => {
      expect(mpCSS).toContain('--status-connector');
      expect(mpCSS).toContain('--status-connector-done');
    });
  });

  describe('empty state tokens reflected in CSS', () => {
    it('has border style', () => {
      expect(mpCSS).toContain('--empty-border-style: dashed');
    });
  });

  describe('responsive breakpoints in CSS', () => {
    it('mobile breakpoint overrides sidebar width', () => {
      expect(mpCSS).toContain('@media (max-width: 768px)');
      expect(mpCSS).toContain('--mp-sidebar-w: 0px');
    });

    it('mobile breakpoint overrides content padding', () => {
      expect(mpCSS).toContain('--mp-content-padding: 16px');
    });

    it('mobile modal is fullscreen', () => {
      expect(mpCSS).toContain('--modal-w: 100%');
      expect(mpCSS).toContain('--modal-radius: 0');
    });
  });

  describe('reduced motion in CSS', () => {
    it('disables all animations', () => {
      expect(mpCSS).toContain('@media (prefers-reduced-motion: reduce)');
      expect(mpCSS).toContain('animation-duration: 0ms !important');
      expect(mpCSS).toContain('transition-duration: 0ms !important');
    });

    it('disables progress shimmer', () => {
      expect(mpCSS).toContain('--progress-shimmer: transparent');
    });
  });
});

// ── Marketplace Tokens ↔ Tailwind Consistency ─────────────────────

describe('TASK-168: Marketplace Tokens ↔ Tailwind consistency', () => {
  it('Tailwind references TASK-163 for traceability', () => {
    expect(mpTW).toContain('TASK-163');
  });

  describe('color groups match token sections', () => {
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
        expect(mpTW).toContain(`'${group}'`);
      });
    }
  });

  describe('spacing tokens match token sizing values', () => {
    const sizing = marketplace.sizing as Record<string, { value: string }>;

    it('header height matches token', () => {
      expect(mpTW).toContain(`'mp-header-h': '${sizing['header-height'].value}'`);
    });

    it('sidebar width matches token', () => {
      expect(mpTW).toContain(`'mp-sidebar-w': '${sizing['sidebar-width'].value}'`);
    });

    it('content max width matches token', () => {
      expect(mpTW).toContain(`'mp-content-max-w': '${sizing['content-max-width'].value}'`);
    });

    it('content padding matches token', () => {
      expect(mpTW).toContain(`'mp-content-p': '${sizing['content-padding'].value}'`);
    });

    it('card width matches token', () => {
      expect(mpTW).toContain(`'mp-card-w': '${sizing['card-width'].value}'`);
    });

    it('card gap matches token', () => {
      expect(mpTW).toContain(`'mp-card-gap': '${sizing['card-gap'].value}'`);
    });

    it('modal width matches token', () => {
      expect(mpTW).toContain(`'mp-modal-w': '${sizing['install-modal-width'].value}'`);
    });

    it('progress height matches token', () => {
      expect(mpTW).toContain(`'mp-progress-h': '${sizing['progress-bar-height'].value}'`);
    });
  });

  describe('borderRadius section covers all component radii', () => {
    const requiredRadii = [
      'mp-search',
      'mp-chip',
      'mp-sort',
      'mp-featured',
      'mp-featured-badge',
      'mp-install-btn',
      'mp-progress',
      'mp-modal',
      'mp-modal-icon',
      'mp-cat-item',
      'mp-pagination',
      'mp-empty',
    ];

    for (const key of requiredRadii) {
      it(`has '${key}' borderRadius`, () => {
        expect(mpTW).toContain(`'${key}'`);
      });
    }

    it('chip radius is pill (9999px)', () => {
      expect(mpTW).toContain("'mp-chip': '9999px'");
    });

    it('progress radius matches token', () => {
      const sizing = marketplace.sizing as Record<string, { value: string }>;
      expect(mpTW).toContain(`'mp-progress': '${sizing['progress-bar-radius'].value}'`);
    });
  });

  describe('fontSize presets match token typography', () => {
    const typography = marketplace.typography as Record<string, Record<string, { value: string }>>;

    it('page title font size matches', () => {
      expect(mpTW).toContain(`'${typography['page-title']['font-size'].value}'`);
    });

    it('sidebar item font size matches', () => {
      expect(mpTW).toContain(`'${typography['sidebar-item']['font-size'].value}'`);
    });

    it('install button font size matches', () => {
      expect(mpTW).toContain(`'${typography['install-btn']['font-size'].value}'`);
    });

    it('modal title font size matches', () => {
      expect(mpTW).toContain(`'${typography['modal-title']['font-size'].value}'`);
    });
  });

  describe('animation keyframes match token durations', () => {
    const anim = marketplace.animation as Record<string, { value: string }>;

    it('card enter duration matches', () => {
      expect(mpTW).toContain(anim['card-enter-duration'].value);
    });

    it('card enter easing matches', () => {
      expect(mpTW).toContain(normalizeCSSValue(anim['card-enter-easing'].value));
    });

    it('modal enter duration matches', () => {
      expect(mpTW).toContain(anim['modal-enter-duration'].value);
    });

    it('spinner duration matches', () => {
      expect(mpTW).toContain(anim['spinner-duration'].value);
    });

    it('progress shimmer is infinite', () => {
      expect(mpTW).toContain('infinite');
    });
  });

  describe('boxShadow values match tokens', () => {
    const installBtn = marketplace.installButton as Record<string, { value: string }>;

    it('install button shadow matches', () => {
      expect(mpTW).toContain(normalizeCSSValue(installBtn['default-shadow'].value));
    });

    it('install button hover shadow matches', () => {
      expect(mpTW).toContain(normalizeCSSValue(installBtn['default-shadow-hover'].value));
    });

    it('modal shadow present', () => {
      expect(mpTW).toContain('mp-modal');
    });
  });
});

// ── Marketplace CSS ↔ Tailwind Cross-file Consistency ─────────────

describe('TASK-168: Marketplace CSS ↔ Tailwind cross-file consistency', () => {
  it('both files use same install button default bg color', () => {
    expect(mpCSS).toContain('--btn-bg: #6366f1');
    expect(mpTW).toContain("bg: '#6366f1'");
  });

  it('both files use same install button hover bg color', () => {
    expect(mpCSS).toContain('--btn-bg-hover: #818cf8');
    expect(mpTW).toContain("'bg-hover': '#818cf8'");
  });

  it('both files use same installed state text color', () => {
    expect(mpCSS).toContain('--btn-text: #34d399');
    expect(mpTW).toContain("'installed-text': '#34d399'");
  });

  it('both files use same progress fill color', () => {
    expect(mpCSS).toContain('--progress-fill-bg: #818cf8');
    expect(mpTW).toContain("fill: '#818cf8'");
  });

  it('both files use same progress complete color', () => {
    expect(mpCSS).toContain('--progress-fill-bg-complete: #10b981');
    expect(mpTW).toContain("'fill-complete': '#10b981'");
  });

  it('both files use same progress error color', () => {
    expect(mpCSS).toContain('--progress-fill-bg-error: #ef4444');
    expect(mpTW).toContain("'fill-error': '#ef4444'");
  });

  it('both files use same featured badge text color', () => {
    expect(mpCSS).toContain('--featured-badge-text: #fcd34d');
    expect(mpTW).toContain("'badge-text': '#fcd34d'");
  });

  it('both files use same empty state icon color', () => {
    expect(mpCSS).toContain('--empty-icon-color: #3f3f46');
    expect(mpTW).toContain("icon: '#3f3f46'");
  });

  describe('animation keyframes exist in both CSS and Tailwind', () => {
    const keyframeNames = [
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

    for (const kf of keyframeNames) {
      it(`'${kf}' exists in both files`, () => {
        // CSS uses cs- prefix for @keyframes
        expect(mpCSS).toContain(`@keyframes cs-${kf}`);
        expect(mpTW).toContain(`'${kf}'`);
      });
    }
  });

  describe('category colors match across files', () => {
    const categories = ['ai-ml', 'communication', 'data', 'devtools', 'productivity', 'storage'];
    const catColors: Record<string, string> = {
      'ai-ml': '#818cf8',
      communication: '#22d3ee',
      data: '#34d399',
      devtools: '#fbbf24',
      productivity: '#f87171',
      storage: '#cbd5e1',
    };

    for (const cat of categories) {
      it(`${cat} color matches in CSS and Tailwind`, () => {
        expect(mpCSS).toContain(`--cat-${cat}: ${catColors[cat]}`);
        expect(mpTW).toContain(`'${catColors[cat]}'`);
      });
    }
  });
});

// ── Integration Card Cross-component Consistency ──────────────────

describe('TASK-168: Marketplace ↔ Integration Card cross-component consistency', () => {
  describe('shared color palette alignment', () => {
    it('both use same violet accent for primary actions', () => {
      // Marketplace install button bg = #6366f1
      expect(mpCSS).toContain('#6366f1');
      expect(icCSS).toContain('#6366f1');
    });

    it('both use same green for success/connected state', () => {
      expect(mpCSS).toContain('#34d399');
      expect(icCSS).toContain('#34d399');
    });

    it('both use same rose for error/uninstall state', () => {
      expect(mpCSS).toContain('#f87171');
      expect(icCSS).toContain('#f87171');
    });

    it('both use same amber for pending/warning state', () => {
      expect(mpCSS).toContain('#fbbf24');
      expect(icCSS).toContain('#fbbf24');
    });
  });

  describe('animation easing consistency', () => {
    const mpAnim = marketplace.animation as Record<string, { value: string }>;
    const icAnim = integrationCard.animation as Record<string, { value: string }>;

    it('card enter easing matches between components', () => {
      expect(normalizeCSSValue(mpAnim['card-enter-easing'].value)).toBe(
        normalizeCSSValue(icAnim['card-enter-easing'].value),
      );
    });

    it('card enter duration matches between components', () => {
      expect(mpAnim['card-enter-duration'].value).toBe(icAnim['card-enter-duration'].value);
    });

    it('spinner duration matches between components', () => {
      expect(mpAnim['spinner-duration'].value).toBe(icAnim['spinner-duration'].value);
    });
  });

  describe('button style alignment', () => {
    const mpBtn = marketplace.installButton as Record<string, { value: string }>;
    const icBtn = (integrationCard as { connectButton: Record<string, { value: string }> })
      .connectButton;

    it('primary button text is white in both', () => {
      expect(mpBtn['default-text'].value).toBe('#ffffff');
      expect(icBtn['default-text'].value).toBe('#ffffff');
    });

    it('disconnect/uninstall hover text uses same rose color', () => {
      expect(mpBtn['uninstall-text-hover'].value).toContain('rose');
      expect(icBtn['disconnect-text-hover'].value).toBe('#f87171');
    });
  });

  describe('reduced motion in both CSS files', () => {
    it('marketplace has prefers-reduced-motion', () => {
      expect(mpCSS).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('integration card has prefers-reduced-motion', () => {
      expect(icCSS).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });

  describe('responsive breakpoints aligned', () => {
    it('both use 768px mobile breakpoint', () => {
      expect(mpCSS).toContain('@media (max-width: 768px)');
      expect(icCSS).toContain('@media (max-width: 768px)');
    });
  });
});

// ── Token Completeness Audit ──────────────────────────────────────

describe('TASK-168: Token completeness audit', () => {
  const mpLeaves = collectTokenLeaves(marketplace);
  const icLeaves = collectTokenLeaves(integrationCard);

  it('marketplace has 100+ tokens', () => {
    expect(mpLeaves.length).toBeGreaterThanOrEqual(100);
  });

  it('integration card has 50+ tokens', () => {
    expect(icLeaves.length).toBeGreaterThanOrEqual(50);
  });

  it('all marketplace color tokens reference semantic/primitive tokens or raw values', () => {
    const colorTokens = mpLeaves.filter((t) => t.type === 'color');
    for (const token of colorTokens) {
      const val = String(token.value);
      const isReference = val.startsWith('{');
      const isRawHex = /^#[0-9a-fA-F]{3,8}$/.test(val);
      const isRgba = val.startsWith('rgba(');
      const isTransparent = val === 'transparent';
      expect(
        isReference || isRawHex || isRgba || isTransparent,
        `${token.path} has unexpected color format: ${val}`,
      ).toBe(true);
    }
  });

  it('all marketplace sizing tokens use px or % units', () => {
    const sizingTokens = mpLeaves.filter((t) => t.type === 'sizing');
    for (const token of sizingTokens) {
      const val = String(token.value);
      expect(
        val.endsWith('px') || val.endsWith('%') || val.endsWith('vh'),
        `${token.path} has unexpected sizing unit: ${val}`,
      ).toBe(true);
    }
  });

  it('all marketplace duration tokens use ms units', () => {
    const durationTokens = mpLeaves.filter((t) => t.type === 'duration');
    for (const token of durationTokens) {
      const val = String(token.value);
      expect(val.endsWith('ms'), `${token.path} should use ms: ${val}`).toBe(true);
    }
  });

  it('marketplace JSON has border-style token for empty state', () => {
    const emptyState = marketplace.emptyState as Record<string, { value: string; type: string }>;
    expect(emptyState).toHaveProperty('border-style');
    expect(emptyState['border-style'].value).toBe('dashed');
  });

  it('marketplace Tailwind includes borderRadius section', () => {
    expect(mpTW).toContain('borderRadius:');
  });
});
