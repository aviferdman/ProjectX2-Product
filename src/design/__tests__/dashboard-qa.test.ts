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
      results.push({ path: current, value: token.value, type: token.type, description: token.description });
    } else if (val && typeof val === 'object') {
      results.push(...collectTokenLeaves(val as Record<string, unknown>, current));
    }
  }
  return results;
}

// ── Dashboard Token JSON ──────────────────────────────────────────

describe('dashboard.json — design tokens', () => {
  const tokens = loadTokens('dashboard.json');

  it('has DTCG schema reference', () => {
    expect(tokens.$schema).toBe('https://design-tokens.github.io/community-group/format/');
  });

  it('has crewspace.dashboard namespace', () => {
    expect(tokens).toHaveProperty('crewspace');
    const crewspace = tokens.crewspace as Record<string, unknown>;
    expect(crewspace).toHaveProperty('dashboard');
  });

  const dashboard = (tokens as { crewspace: { dashboard: Record<string, unknown> } }).crewspace.dashboard;

  it('contains required top-level sections', () => {
    const requiredSections = [
      'color',
      'workflowCard',
      'workflowList',
      'createButton',
      'emptyState',
      'searchBar',
      'filterChip',
      'viewToggle',
      'stats',
      'upgradePrompt',
      'sizing',
      'animation',
    ];
    for (const section of requiredSections) {
      expect(dashboard, `missing section: ${section}`).toHaveProperty(section);
    }
  });

  describe('token leaf values', () => {
    const leaves = collectTokenLeaves(dashboard);

    it('has at least 80 token leaves', () => {
      expect(leaves.length).toBeGreaterThanOrEqual(80);
    });

    it('every leaf has a non-empty value', () => {
      for (const leaf of leaves) {
        expect(leaf.value, `${leaf.path} should have a value`).toBeDefined();
        expect(String(leaf.value).length, `${leaf.path} value should not be empty`).toBeGreaterThan(0);
      }
    });

    it('every leaf has a valid type', () => {
      const validTypes = [
        'color',
        'number',
        'string',
        'boolean',
        'sizing',
        'spacing',
        'borderWidth',
        'borderRadius',
        'transition',
        'boxShadow',
      ];
      for (const leaf of leaves) {
        expect(validTypes, `${leaf.path} has type "${leaf.type}"`).toContain(leaf.type);
      }
    });
  });

  describe('sizing section — spec alignment', () => {
    const sizing = dashboard.sizing as Record<string, { value: string }>;

    it('header height is 56px', () => {
      expect(sizing['header-height'].value).toBe('56px');
    });

    it('sidebar width is 240px / collapsed 64px', () => {
      expect(sizing['sidebar-width'].value).toBe('240px');
      expect(sizing['sidebar-collapsed-width'].value).toBe('64px');
    });

    it('content max-width is 1280px', () => {
      expect(sizing['content-max-width'].value).toBe('1280px');
    });

    it('stat card has padding, height, min-width, and radius tokens', () => {
      expect(sizing['stat-card-padding'].value).toBe('16px');
      expect(sizing['stat-card-height'].value).toBe('100px');
      expect(sizing['stat-card-min-width'].value).toBe('200px');
      expect(sizing['stat-card-radius'].value).toBe('12px');
    });

    it('search input has min/max width tokens', () => {
      expect(sizing['search-min-width'].value).toBe('200px');
      expect(sizing['search-max-width'].value).toBe('360px');
    });

    it('empty state border width is 2px', () => {
      expect(sizing['empty-state-border-width'].value).toBe('2px');
    });

    it('progress bar height is 6px', () => {
      expect(sizing['progress-bar-height'].value).toBe('6px');
    });

    it('filter chip height is 28px', () => {
      expect(sizing['filter-chip-height'].value).toBe('28px');
    });

    it('create button height is 40px', () => {
      expect(sizing['create-button-height'].value).toBe('40px');
    });
  });

  describe('workflow card colors', () => {
    const card = dashboard.workflowCard as Record<string, unknown>;

    it('has bg and bg-hover references', () => {
      expect(card).toHaveProperty('bg');
      expect(card).toHaveProperty('bg-hover');
    });

    it('has status colors for draft, active, error, archived', () => {
      const status = card.status as Record<string, unknown>;
      expect(status).toHaveProperty('draft');
      expect(status).toHaveProperty('active');
      expect(status).toHaveProperty('error');
      expect(status).toHaveProperty('archived');
    });

    it('has status background colors', () => {
      const statusBg = card['status-bg'] as Record<string, { value: string }>;
      expect(statusBg.draft.value).toBe('rgba(113,113,122,0.1)');
      expect(statusBg.active.value).toBe('rgba(16,185,129,0.1)');
      expect(statusBg.error.value).toBe('rgba(244,63,94,0.1)');
      expect(statusBg.archived.value).toBe('rgba(100,116,139,0.1)');
    });
  });

  describe('stat section colors', () => {
    const stats = dashboard.stats as Record<string, { value: string }>;

    it('has icon colors per category', () => {
      expect(stats['icon-workflows']).toBeDefined();
      expect(stats['icon-runs']).toBeDefined();
      expect(stats['icon-agents']).toBeDefined();
      expect(stats['icon-errors']).toBeDefined();
    });

    it('has progress bar fill variants', () => {
      expect(stats['progress-bar-fill']).toBeDefined();
      expect(stats['progress-bar-fill-warning']).toBeDefined();
      expect(stats['progress-bar-fill-critical']).toBeDefined();
    });
  });

  describe('animation section — spec alignment', () => {
    const animation = dashboard.animation as Record<string, { value: string; type: string }>;

    it('card-enter is 250ms spring', () => {
      expect(animation['card-enter'].value).toContain('250ms');
      expect(animation['card-enter'].value).toContain('cubic-bezier(0.34,1.56,0.64,1)');
    });

    it('card-hover is 150ms ease-out', () => {
      expect(animation['card-hover'].value).toBe('150ms ease-out');
    });

    it('has card stagger delay of 50ms', () => {
      expect(animation['card-stagger-delay'].value).toBe('50ms');
    });

    it('has thumbnail hover transition', () => {
      expect(animation['thumb-hover'].value).toBe('200ms ease-out');
    });

    it('stat count-up is 600ms', () => {
      expect(animation['stat-count'].value).toContain('600ms');
    });

    it('filter chip toggle is 150ms ease-out', () => {
      expect(animation['filter-chip-toggle'].value).toBe('150ms ease-out');
    });

    it('empty state is 300ms ease-out', () => {
      expect(animation['empty-state-in'].value).toBe('300ms ease-out');
    });
  });

  describe('stat-card-shadow token', () => {
    it('exists with correct boxShadow value', () => {
      expect(dashboard).toHaveProperty('stat-card-shadow');
      const shadow = (dashboard as Record<string, { value: string; type: string }>)['stat-card-shadow'];
      expect(shadow.type).toBe('boxShadow');
      expect(shadow.value).toContain('rgba(0,0,0,0.2)');
      expect(shadow.value).toContain('rgba(113,113,122,0.06)');
    });
  });
});

// ── CSS ↔ Token Consistency ──────────────────────────────────────

describe('dashboard-variables.css — consistency with spec', () => {
  const css = loadCSS('dashboard-variables.css');

  it('references TASK-148 for traceability', () => {
    expect(css).toContain('TASK-148');
  });

  describe('layout variables', () => {
    it('has --dashboard-header-h: 56px', () => {
      expect(css).toContain('--dashboard-header-h: 56px');
    });

    it('has --dashboard-sidebar-w: 240px', () => {
      expect(css).toContain('--dashboard-sidebar-w: 240px');
    });

    it('has --dashboard-sidebar-collapsed-w: 64px', () => {
      expect(css).toContain('--dashboard-sidebar-collapsed-w: 64px');
    });

    it('has --dashboard-content-max-w: 1280px', () => {
      expect(css).toContain('--dashboard-content-max-w: 1280px');
    });

    it('has --dashboard-content-padding: 24px', () => {
      expect(css).toContain('--dashboard-content-padding: 24px');
    });
  });

  describe('sidebar nav variables', () => {
    it('has --nav-item-color-active: #a5b4fc', () => {
      expect(css).toContain('--nav-item-color-active: #a5b4fc');
    });

    it('has --nav-item-bg-active: rgba(139, 92, 246, 0.12)', () => {
      expect(css).toContain('--nav-item-bg-active: rgba(139, 92, 246, 0.12)');
    });

    it('has --nav-item-border-active: #6366f1', () => {
      expect(css).toContain('--nav-item-border-active: #6366f1');
    });
  });

  describe('toolbar variables', () => {
    it('has --toolbar-h: 48px', () => {
      expect(css).toContain('--toolbar-h: 48px');
    });

    it('has search min/max width variables', () => {
      expect(css).toContain('--search-min-w: 200px');
      expect(css).toContain('--search-max-w: 360px');
    });

    it('has --search-border-focus: #818cf8', () => {
      expect(css).toContain('--search-border-focus: #818cf8');
    });

    it('has filter chip variables', () => {
      expect(css).toContain('--chip-h: 28px');
      expect(css).toContain('--chip-radius: 9999px');
      expect(css).toContain('--chip-bg-active: rgba(139, 92, 246, 0.2)');
      expect(css).toContain('--chip-border-active: #818cf8');
      expect(css).toContain('--chip-text-active: #a5b4fc');
    });
  });

  describe('workflow card variables', () => {
    it('has --card-min-w: 280px', () => {
      expect(css).toContain('--card-min-w: 280px');
    });

    it('has --card-radius: var(--cs-radius-xl)', () => {
      expect(css).toContain('--card-radius: var(--cs-radius-xl)');
    });

    it('has card shadow matching spec', () => {
      expect(css).toContain('--card-shadow:');
      expect(css).toContain('rgba(0, 0, 0, 0.3)');
    });

    it('has card hover shadow matching spec', () => {
      expect(css).toContain('--card-shadow-hover:');
      expect(css).toContain('rgba(0, 0, 0, 0.4)');
    });

    it('has thumbnail hover scale variable', () => {
      expect(css).toContain('--thumb-hover-scale: 1.02');
    });

    it('has thumbnail hover transition', () => {
      expect(css).toContain('--thumb-hover-transition: 200ms ease-out');
    });

    it('has card stagger delay variable', () => {
      expect(css).toContain('--card-stagger-delay: 50ms');
    });

    it('has --thumb-h: 160px', () => {
      expect(css).toContain('--thumb-h: 160px');
    });

    it('has --card-body-padding: 16px', () => {
      expect(css).toContain('--card-body-padding: 16px');
    });
  });

  describe('status badge variables', () => {
    const statuses = [
      { name: 'draft', color: '#a1a1aa', bg: 'rgba(148, 163, 184, 0.1)' },
      { name: 'active', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
      { name: 'error', color: '#ef4444', bg: 'rgba(244, 63, 94, 0.1)' },
      { name: 'archived', color: '#52525b', bg: 'rgba(100, 116, 139, 0.1)' },
    ];

    for (const status of statuses) {
      it(`has ${status.name} status color: ${status.color}`, () => {
        expect(css).toContain(`--status-color: ${status.color}`);
      });
    }
  });

  describe('stat card variables', () => {
    it('has --stat-card-shadow', () => {
      expect(css).toContain('--stat-card-shadow:');
    });

    it('has --stat-card-padding: 16px', () => {
      expect(css).toContain('--stat-card-padding: 16px');
    });

    it('has --stat-card-radius', () => {
      expect(css).toContain('--stat-card-radius');
    });

    it('has stat icon color variables', () => {
      expect(css).toContain('--stat-icon-workflows: #818cf8');
      expect(css).toContain('--stat-icon-runs: #22d3ee');
      expect(css).toContain('--stat-icon-agents: #34d399');
      expect(css).toContain('--stat-icon-errors: #f87171');
    });

    it('has trend colors', () => {
      expect(css).toContain('--stat-trend-up: #34d399');
      expect(css).toContain('--stat-trend-down: #f87171');
    });
  });

  describe('usage progress bar variables', () => {
    it('has --bar-h: 6px', () => {
      expect(css).toContain('--bar-h: 6px');
    });

    it('has --bar-radius: 9999px', () => {
      expect(css).toContain('--bar-radius: 9999px');
    });

    it('has fill variants (normal, warning, critical)', () => {
      expect(css).toContain('--bar-fill: #818cf8');
      expect(css).toContain('--bar-fill-warning: #f59e0b');
      expect(css).toContain('--bar-fill-critical: #ef4444');
    });
  });

  describe('create workflow button variables', () => {
    it('has --btn-bg: #6366f1 / hover: #818cf8', () => {
      expect(css).toContain('--btn-bg: #6366f1');
      expect(css).toContain('--btn-bg-hover: #818cf8');
    });

    it('has --btn-shadow and --btn-shadow-hover', () => {
      expect(css).toContain('--btn-shadow:');
      expect(css).toContain('--btn-shadow-hover:');
    });

    it('has --btn-radius: var(--cs-radius-lg)', () => {
      expect(css).toContain('--btn-radius: var(--cs-radius-lg)');
    });
  });

  describe('empty state variables', () => {
    it('has --empty-border-width: 2px', () => {
      expect(css).toContain('--empty-border-width: 2px');
    });

    it('has --empty-border-style: dashed', () => {
      expect(css).toContain('--empty-border-style: dashed');
    });

    it('has --empty-icon-size: 64px', () => {
      expect(css).toContain('--empty-icon-size: 64px');
    });

    it('has --empty-icon-color: #3f3f46', () => {
      expect(css).toContain('--empty-icon-color: #3f3f46');
    });
  });

  describe('upgrade prompt variables', () => {
    it('has --prompt-bg: rgba(124, 58, 237, 0.08)', () => {
      expect(css).toContain('--prompt-bg: rgba(124, 58, 237, 0.08)');
    });

    it('has --prompt-border: #4f46e5', () => {
      expect(css).toContain('--prompt-border: #4f46e5');
    });
  });

  describe('workflow list variables', () => {
    it('has --list-row-h: 56px', () => {
      expect(css).toContain('--list-row-h: 56px');
    });

    it('has list row state backgrounds', () => {
      expect(css).toContain('--list-row-bg: transparent');
      expect(css).toContain('--list-row-bg-hover: rgba(30, 41, 59, 0.5)');
      expect(css).toContain('--list-row-bg-selected: rgba(139, 92, 246, 0.08)');
    });
  });

  describe('keyframe animations', () => {
    it('has cs-card-enter keyframe', () => {
      expect(css).toContain('@keyframes cs-card-enter');
      expect(css).toContain('scale(0.92)');
      expect(css).toContain('translateY(8px)');
    });

    it('has cs-stat-count-up keyframe', () => {
      expect(css).toContain('@keyframes cs-stat-count-up');
    });

    it('has cs-progress-fill keyframe', () => {
      expect(css).toContain('@keyframes cs-progress-fill');
    });

    it('has cs-empty-state-in keyframe', () => {
      expect(css).toContain('@keyframes cs-empty-state-in');
      expect(css).toContain('translateY(12px)');
    });

    it('has cs-view-switch keyframe', () => {
      expect(css).toContain('@keyframes cs-view-switch');
    });
  });
});

// ── Tailwind ↔ Spec Consistency ─────────────────────────────────

describe('dashboard-theme.ts — consistency with spec', () => {
  const twSource = loadTailwind('dashboard-theme.ts');

  it('references TASK-148 for traceability', () => {
    expect(twSource).toContain('TASK-148');
  });

  describe('color tokens', () => {
    it('has dashboard layout colors', () => {
      expect(twSource).toContain("'header-bg'");
      expect(twSource).toContain("'sidebar-bg'");
    });

    it('has workflow card colors', () => {
      expect(twSource).toContain("'workflow-card'");
      expect(twSource).toContain("'bg-hover'");
      expect(twSource).toContain("'border-hover'");
      expect(twSource).toContain("'thumb-bg'");
    });

    it('has workflow status colors', () => {
      expect(twSource).toContain("draft: '#a1a1aa'");
      expect(twSource).toContain("active: '#10b981'");
      expect(twSource).toContain("error: '#ef4444'");
      expect(twSource).toContain("archived: '#52525b'");
    });

    it('has stat icon colors matching spec', () => {
      expect(twSource).toContain("'icon-workflows': '#818cf8'");
      expect(twSource).toContain("'icon-runs': '#22d3ee'");
      expect(twSource).toContain("'icon-agents': '#34d399'");
      expect(twSource).toContain("'icon-errors': '#f87171'");
    });

    it('has nav item-border-active for active left accent', () => {
      expect(twSource).toContain("'item-border-active': '#6366f1'");
    });

    it('has upgrade prompt colors', () => {
      expect(twSource).toContain("'cta-bg': '#6366f1'");
      expect(twSource).toContain("'cta-bg-hover': '#818cf8'");
    });
  });

  describe('spacing tokens', () => {
    it('has dashboard layout spacings', () => {
      expect(twSource).toContain("'dashboard-header-h': '56px'");
      expect(twSource).toContain("'dashboard-sidebar-w': '240px'");
      expect(twSource).toContain("'dashboard-sidebar-collapsed-w': '64px'");
      expect(twSource).toContain("'dashboard-content-max-w': '1280px'");
      expect(twSource).toContain("'dashboard-content-p': '24px'");
    });

    it('has workflow card spacings', () => {
      expect(twSource).toContain("'workflow-card-min-w': '280px'");
      expect(twSource).toContain("'workflow-card-thumb-h': '160px'");
      expect(twSource).toContain("'workflow-card-body-p': '16px'");
      expect(twSource).toContain("'workflow-card-gap': '16px'");
    });

    it('has stat card spacings', () => {
      expect(twSource).toContain("'stat-card-min-w': '200px'");
      expect(twSource).toContain("'stat-card-h': '100px'");
      expect(twSource).toContain("'stat-gap': '16px'");
    });
  });

  describe('fontSize tokens — spec alignment', () => {
    it('has workflow card typography', () => {
      expect(twSource).toContain("'workflow-card-title'");
      expect(twSource).toContain("'workflow-card-desc'");
      expect(twSource).toContain("'workflow-card-meta'");
      expect(twSource).toContain("'workflow-status-badge'");
    });

    it('has stat typography', () => {
      expect(twSource).toContain("'stat-value'");
      expect(twSource).toContain("'stat-label'");
      expect(twSource).toContain("'stat-trend'");
    });

    it('has nav typography', () => {
      expect(twSource).toContain("'nav-item'");
      expect(twSource).toContain("'nav-section'");
    });

    it('has filter chip fontSize (11px / 500)', () => {
      expect(twSource).toContain("'filter-chip'");
    });

    it('has list header fontSize (11px / 600)', () => {
      expect(twSource).toContain("'list-header'");
    });

    it('has create button text fontSize (14px / 600)', () => {
      expect(twSource).toContain("'create-btn-text'");
    });

    it('has upgrade prompt text fontSize (14px / 400)', () => {
      expect(twSource).toContain("'upgrade-text'");
    });

    it('has empty state typography', () => {
      expect(twSource).toContain("'empty-heading'");
      expect(twSource).toContain("'empty-desc'");
    });
  });

  describe('boxShadow tokens', () => {
    it('has workflow card shadows', () => {
      expect(twSource).toContain("'workflow-card':");
      expect(twSource).toContain("'workflow-card-hover':");
    });

    it('has create button shadows', () => {
      expect(twSource).toContain("'create-btn':");
      expect(twSource).toContain("'create-btn-hover':");
    });

    it('has stat card shadow', () => {
      expect(twSource).toContain("'stat-card':");
    });
  });

  describe('borderRadius tokens', () => {
    it('has workflow card radius: 12px', () => {
      expect(twSource).toContain("'workflow-card': '12px'");
    });

    it('has stat card radius: 12px', () => {
      expect(twSource).toContain("'stat-card': '12px'");
    });

    it('has search input radius: 6px', () => {
      expect(twSource).toContain("'search-input': '6px'");
    });

    it('has filter chip radius: 9999px (pill)', () => {
      expect(twSource).toContain("'filter-chip': '9999px'");
    });

    it('has status badge radius: 9999px (pill)', () => {
      expect(twSource).toContain("'status-badge': '9999px'");
    });

    it('has usage bar radius: 9999px', () => {
      expect(twSource).toContain("'usage-bar': '9999px'");
    });

    it('has create button radius: 8px', () => {
      expect(twSource).toContain("'create-btn': '8px'");
    });

    it('has upgrade prompt radius: 12px', () => {
      expect(twSource).toContain("'upgrade-prompt': '12px'");
    });

    it('has empty state radius: 12px', () => {
      expect(twSource).toContain("'empty-state': '12px'");
    });
  });

  describe('transitionDuration tokens', () => {
    it('has card hover duration: 150ms', () => {
      expect(twSource).toContain("'card-hover': '150ms'");
    });

    it('has thumb hover duration: 200ms', () => {
      expect(twSource).toContain("'thumb-hover': '200ms'");
    });

    it('has card enter duration: 250ms', () => {
      expect(twSource).toContain("'card-enter': '250ms'");
    });

    it('has filter toggle duration: 150ms', () => {
      expect(twSource).toContain("'filter-toggle': '150ms'");
    });

    it('has view switch duration: 200ms', () => {
      expect(twSource).toContain("'view-switch': '200ms'");
    });

    it('has stat count duration: 600ms', () => {
      expect(twSource).toContain("'stat-count': '600ms'");
    });

    it('has progress fill duration: 400ms', () => {
      expect(twSource).toContain("'progress-fill': '400ms'");
    });
  });

  describe('animation & keyframe tokens', () => {
    it('has card-enter animation with spring easing', () => {
      expect(twSource).toContain("'card-enter'");
      expect(twSource).toContain('cubic-bezier(0.34,1.56,0.64,1)');
    });

    it('has stat-count-up animation', () => {
      expect(twSource).toContain("'stat-count-up'");
      expect(twSource).toContain('cubic-bezier(0.16,1,0.3,1)');
    });

    it('has progress-fill animation', () => {
      expect(twSource).toContain("'progress-fill'");
    });

    it('has empty-state-in animation', () => {
      expect(twSource).toContain("'empty-state-in'");
    });

    it('card-enter keyframe has scale(0.92) and translateY(8px)', () => {
      expect(twSource).toContain("scale(0.92) translateY(8px)");
    });

    it('empty-state-in keyframe has translateY(12px)', () => {
      expect(twSource).toContain("translateY(12px)");
    });
  });
});

// ── Cross-file Consistency ───────────────────────────────────────

describe('dashboard CSS ↔ Tailwind cross-file consistency', () => {
  const css = loadCSS('dashboard-variables.css');
  const twSource = loadTailwind('dashboard-theme.ts');

  it('both files reference the same active nav color (#a5b4fc)', () => {
    expect(css).toContain('#a5b4fc');
    expect(twSource).toContain('#a5b4fc');
  });

  it('both files reference the same create button bg (#6366f1)', () => {
    expect(css).toContain('--btn-bg: #6366f1');
    expect(twSource).toContain("bg: '#6366f1'");
  });

  it('both files have matching stat trend-up color (#34d399)', () => {
    expect(css).toContain('--stat-trend-up: #34d399');
    expect(twSource).toContain("'trend-up': '#34d399'");
  });

  it('both files have matching stat trend-down color (#f87171)', () => {
    expect(css).toContain('--stat-trend-down: #f87171');
    expect(twSource).toContain("'trend-down': '#f87171'");
  });

  it('both files have matching usage bar fill (#818cf8)', () => {
    expect(css).toContain('--bar-fill: #818cf8');
    expect(twSource).toContain("fill: '#818cf8'");
  });

  it('card-enter animation exists in both CSS and Tailwind', () => {
    expect(css).toContain('@keyframes cs-card-enter');
    expect(twSource).toContain("'card-enter'");
  });

  it('empty-state-in animation exists in both CSS and Tailwind', () => {
    expect(css).toContain('@keyframes cs-empty-state-in');
    expect(twSource).toContain("'empty-state-in'");
  });

  it('view-switch animation exists in both CSS and Tailwind', () => {
    expect(css).toContain('@keyframes cs-view-switch');
    expect(twSource).toContain("'view-switch'");
  });
});

// ── Token ↔ CSS ↔ Tailwind Value Consistency ─────────────────────

describe('dashboard tokens ↔ CSS ↔ Tailwind value consistency', () => {
  const tokens = loadTokens('dashboard.json');
  const css = loadCSS('dashboard-variables.css');
  const twSource = loadTailwind('dashboard-theme.ts');
  const dashboard = (tokens as { crewspace: { dashboard: Record<string, unknown> } }).crewspace.dashboard;
  const sizing = dashboard.sizing as Record<string, { value: string }>;

  it('header height is consistent (56px)', () => {
    expect(sizing['header-height'].value).toBe('56px');
    expect(css).toContain('--dashboard-header-h: 56px');
    expect(twSource).toContain("'dashboard-header-h': '56px'");
  });

  it('sidebar width is consistent (240px)', () => {
    expect(sizing['sidebar-width'].value).toBe('240px');
    expect(css).toContain('--dashboard-sidebar-w: 240px');
    expect(twSource).toContain("'dashboard-sidebar-w': '240px'");
  });

  it('content max-width is consistent (1280px)', () => {
    expect(sizing['content-max-width'].value).toBe('1280px');
    expect(css).toContain('--dashboard-content-max-w: 1280px');
    expect(twSource).toContain("'dashboard-content-max-w': '1280px'");
  });

  it('stat card height is consistent (100px)', () => {
    expect(sizing['stat-card-height'].value).toBe('100px');
    expect(css).toContain('--stat-card-h: 100px');
    expect(twSource).toContain("'stat-card-h': '100px'");
  });

  it('progress bar height is consistent (6px)', () => {
    expect(sizing['progress-bar-height'].value).toBe('6px');
    expect(css).toContain('--bar-h: 6px');
    expect(twSource).toContain("'usage-bar-h': '6px'");
  });

  it('workflow card gap is consistent (16px)', () => {
    expect(sizing['card-gap'].value).toBe('16px');
    expect(css).toContain('--card-gap: 16px');
    expect(twSource).toContain("'workflow-card-gap': '16px'");
  });
});
