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

// ── Template Library Token JSON ──────────────────────────────────

describe('template-library.json — design tokens', () => {
  const tokens = loadTokens('template-library.json');

  it('has DTCG schema reference', () => {
    expect(tokens.$schema).toBe('https://design-tokens.github.io/community-group/format/');
  });

  it('has crewspace.templateLibrary namespace', () => {
    expect(tokens).toHaveProperty('crewspace');
    const crewspace = tokens.crewspace as Record<string, unknown>;
    expect(crewspace).toHaveProperty('templateLibrary');
  });

  const templateLibrary = (tokens as { crewspace: { templateLibrary: Record<string, unknown> } })
    .crewspace.templateLibrary;

  it('contains required top-level sections', () => {
    const requiredSections = [
      'color',
      'templateCard',
      'category',
      'tag',
      'useButton',
      'previewButton',
      'previewModal',
      'searchBar',
      'filterChip',
      'sortDropdown',
      'featured',
      'emptyState',
      'pagination',
      'sizing',
      'grid',
      'animation',
    ];
    for (const section of requiredSections) {
      expect(templateLibrary, `missing section: ${section}`).toHaveProperty(section);
    }
  });

  describe('token leaf values', () => {
    const leaves = collectTokenLeaves(templateLibrary);

    it('has at least 80 token leaves', () => {
      expect(leaves.length).toBeGreaterThanOrEqual(80);
    });

    it('every leaf has a non-empty value', () => {
      for (const leaf of leaves) {
        expect(leaf.value, `${leaf.path} should have a value`).toBeDefined();
        expect(String(leaf.value).length, `${leaf.path} value should not be empty`).toBeGreaterThan(
          0,
        );
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
        'fontSize',
        'fontWeight',
        'lineHeight',
        'letterSpacing',
        'gradient',
        'duration',
        'cubicBezier',
      ];
      for (const leaf of leaves) {
        expect(validTypes, `${leaf.path} has type "${leaf.type}"`).toContain(leaf.type);
      }
    });
  });

  describe('sizing section — spec alignment', () => {
    const sizing = templateLibrary.sizing as Record<string, { value: string }>;

    it('header height matches spec (56px)', () => {
      expect(sizing['header-height'].value).toBe('56px');
    });

    it('sidebar width matches spec (220px)', () => {
      expect(sizing['sidebar-width'].value).toBe('220px');
    });

    it('content max-width matches spec (1440px)', () => {
      expect(sizing['content-max-width'].value).toBe('1440px');
    });

    it('content padding matches spec (24px)', () => {
      expect(sizing['content-padding'].value).toBe('24px');
    });

    it('toolbar height matches spec (52px)', () => {
      expect(sizing['toolbar-height'].value).toBe('52px');
    });

    it('card width matches spec (300px)', () => {
      expect(sizing['card-width'].value).toBe('300px');
    });

    it('card min-width matches spec (260px)', () => {
      expect(sizing['card-min-width'].value).toBe('260px');
    });

    it('card max-width matches spec (360px)', () => {
      expect(sizing['card-max-width'].value).toBe('360px');
    });

    it('card thumbnail height matches spec (180px)', () => {
      expect(sizing['card-thumbnail-height'].value).toBe('180px');
    });

    it('card body padding matches spec (16px)', () => {
      expect(sizing['card-body-padding'].value).toBe('16px');
    });

    it('card gap matches spec (20px)', () => {
      expect(sizing['card-gap'].value).toBe('20px');
    });

    it('tag height matches spec (22px)', () => {
      expect(sizing['tag-height'].value).toBe('22px');
    });

    it('search height matches spec (40px)', () => {
      expect(sizing['search-height'].value).toBe('40px');
    });

    it('search width matches spec (320px)', () => {
      expect(sizing['search-width'].value).toBe('320px');
    });

    it('search max-width matches spec (400px)', () => {
      expect(sizing['search-max-width'].value).toBe('400px');
    });

    it('filter chip height matches spec (30px)', () => {
      expect(sizing['filter-chip-height'].value).toBe('30px');
    });

    it('use button height matches spec (36px)', () => {
      expect(sizing['use-button-height'].value).toBe('36px');
    });

    it('modal width matches spec (900px)', () => {
      expect(sizing['modal-width'].value).toBe('900px');
    });

    it('modal max-height matches spec (85vh)', () => {
      expect(sizing['modal-max-height'].value).toBe('85vh');
    });

    it('modal diagram height matches spec (400px)', () => {
      expect(sizing['modal-diagram-height'].value).toBe('400px');
    });

    it('modal sidebar width matches spec (300px)', () => {
      expect(sizing['modal-sidebar-width'].value).toBe('300px');
    });

    it('pagination button size matches spec (32px)', () => {
      expect(sizing['pagination-button-size'].value).toBe('32px');
    });

    it('empty state icon size matches spec (72px)', () => {
      expect(sizing['empty-state-icon-size'].value).toBe('72px');
    });
  });

  describe('grid section — spec alignment', () => {
    const grid = templateLibrary.grid as Record<string, { value: string }>;

    it('sm breakpoint = 1 column', () => {
      expect(grid['columns-sm'].value).toBe('1');
    });

    it('md breakpoint = 2 columns', () => {
      expect(grid['columns-md'].value).toBe('2');
    });

    it('lg breakpoint = 3 columns', () => {
      expect(grid['columns-lg'].value).toBe('3');
    });

    it('xl breakpoint = 4 columns', () => {
      expect(grid['columns-xl'].value).toBe('4');
    });
  });

  describe('category colors — spec alignment', () => {
    const category = templateLibrary.category as Record<string, Record<string, { value: string }>>;

    const expectedCategories = ['research', 'code', 'support', 'content', 'data', 'automation'];
    for (const cat of expectedCategories) {
      it(`has "${cat}" category with color, bg, and icon-bg`, () => {
        expect(category).toHaveProperty(cat);
        expect(category[cat]).toHaveProperty('color');
        expect(category[cat]).toHaveProperty('bg');
        expect(category[cat]).toHaveProperty('icon-bg');
      });
    }
  });

  describe('featured section — all badge types', () => {
    const featured = templateLibrary.featured as Record<string, { value: string }>;

    it('has featured badge tokens', () => {
      expect(featured).toHaveProperty('badge-bg');
      expect(featured).toHaveProperty('badge-text');
      expect(featured).toHaveProperty('badge-border');
    });

    it('has popular badge tokens', () => {
      expect(featured).toHaveProperty('popular-badge-bg');
      expect(featured).toHaveProperty('popular-badge-text');
      expect(featured).toHaveProperty('popular-badge-border');
    });

    it('has new badge tokens', () => {
      expect(featured).toHaveProperty('new-badge-bg');
      expect(featured).toHaveProperty('new-badge-text');
      expect(featured).toHaveProperty('new-badge-border');
    });
  });

  describe('sort dropdown — spec alignment', () => {
    const sort = templateLibrary.sortDropdown as Record<string, { value: string }>;

    it('has menu shadow token', () => {
      expect(sort).toHaveProperty('menu-shadow');
    });

    it('has menu-bg referencing surface-overlay', () => {
      expect(sort['menu-bg'].value).toContain('surface.overlay');
    });

    it('has item-bg-hover as rgba(30,41,59,0.5)', () => {
      expect(sort['item-bg-hover'].value).toBe('rgba(30,41,59,0.5)');
    });
  });

  describe('animation section — spec alignment', () => {
    const animation = templateLibrary.animation as Record<string, { value: string }>;

    it('card enter is 250ms with spring curve', () => {
      expect(animation['card-enter'].value).toContain('250ms');
      expect(animation['card-enter'].value).toContain('cubic-bezier');
    });

    it('card hover is 150ms ease-out', () => {
      expect(animation['card-hover'].value).toBe('150ms ease-out');
    });

    it('modal enter is 300ms with spring curve', () => {
      expect(animation['modal-enter'].value).toContain('300ms');
      expect(animation['modal-enter'].value).toContain('cubic-bezier');
    });

    it('modal overlay is 200ms ease-out', () => {
      expect(animation['modal-overlay'].value).toBe('200ms ease-out');
    });

    it('filter toggle is 150ms ease-out', () => {
      expect(animation['filter-toggle'].value).toBe('150ms ease-out');
    });

    it('card stagger delay is 40ms', () => {
      expect(animation['card-stagger-delay'].value).toBe('40ms');
    });
  });
});

// ── Template Card Token JSON ─────────────────────────────────────

describe('template-card.json — design tokens', () => {
  const tokens = loadTokens('template-card.json');

  it('has DTCG schema reference', () => {
    expect(tokens.$schema).toBe('https://design-tokens.github.io/community-group/format/');
  });

  it('has crewspace.templateCard namespace', () => {
    const crewspace = tokens.crewspace as Record<string, unknown>;
    expect(crewspace).toHaveProperty('templateCard');
  });

  const templateCard = (tokens as { crewspace: { templateCard: Record<string, unknown> } })
    .crewspace.templateCard;

  it('contains required sections', () => {
    const requiredSections = [
      'card',
      'sizing',
      'thumbnail',
      'previewOverlay',
      'badge',
      'categoryIcon',
      'title',
      'description',
      'tag',
      'meta',
      'previewButton',
      'useButton',
      'skeleton',
      'animation',
    ];
    for (const section of requiredSections) {
      expect(templateCard, `missing section: ${section}`).toHaveProperty(section);
    }
  });

  describe('card dimensions — spec alignment', () => {
    const sizing = templateCard.sizing as Record<string, { value: string }>;

    it('width is 300px', () => {
      expect(sizing.width.value).toBe('300px');
    });

    it('min-width is 260px', () => {
      expect(sizing['min-width'].value).toBe('260px');
    });

    it('max-width is 360px', () => {
      expect(sizing['max-width'].value).toBe('360px');
    });

    it('gap is 20px', () => {
      expect(sizing.gap.value).toBe('20px');
    });

    it('body-padding is 16px', () => {
      expect(sizing['body-padding'].value).toBe('16px');
    });
  });

  describe('thumbnail — spec alignment', () => {
    const thumb = templateCard.thumbnail as Record<string, { value: string }>;

    it('height is 180px', () => {
      expect(thumb.height.value).toBe('180px');
    });

    it('bg is rgba(10,14,26,0.8)', () => {
      expect(thumb.bg.value).toBe('rgba(10,14,26,0.8)');
    });

    it('has responsive height tokens', () => {
      expect(thumb['height-md'].value).toBe('160px');
      expect(thumb['height-sm'].value).toBe('140px');
    });

    it('has node type colors', () => {
      expect(thumb).toHaveProperty('node-agent');
      expect(thumb).toHaveProperty('node-task');
      expect(thumb).toHaveProperty('node-tool');
      expect(thumb).toHaveProperty('node-llm');
    });
  });

  describe('typography — spec alignment', () => {
    const title = templateCard.title as Record<string, { value: string }>;
    const desc = templateCard.description as Record<string, { value: string }>;
    const tag = templateCard.tag as Record<string, { value: string }>;
    const meta = templateCard.meta as Record<string, { value: string }>;

    it('title is 14px (0.875rem) / 600 weight', () => {
      expect(title['font-size'].value).toBe('0.875rem');
      expect(title['font-weight'].value).toBe('600');
    });

    it('description is 12px (0.75rem) / 400 weight, 2-line clamp', () => {
      expect(desc['font-size'].value).toBe('0.75rem');
      expect(desc['font-weight'].value).toBe('400');
      expect(desc['max-lines'].value).toBe('2');
    });

    it('tag is 10px (0.625rem) / 500 weight / 0.02em tracking', () => {
      expect(tag['font-size'].value).toBe('0.625rem');
      expect(tag['font-weight'].value).toBe('500');
      expect(tag['letter-spacing'].value).toBe('0.02em');
    });

    it('meta is 11px (0.6875rem) / 400 weight', () => {
      expect(meta['font-size'].value).toBe('0.6875rem');
      expect(meta['font-weight'].value).toBe('400');
    });
  });

  describe('badge variants — spec alignment', () => {
    const badge = templateCard.badge as Record<string, { value: string }>;

    it('has featured, popular, and new variants', () => {
      expect(badge).toHaveProperty('featured-bg');
      expect(badge).toHaveProperty('popular-bg');
      expect(badge).toHaveProperty('new-bg');
    });

    it('badge height is 20px', () => {
      expect(badge.height.value).toBe('20px');
    });

    it('badge inset is 8px', () => {
      expect(badge.inset.value).toBe('8px');
    });
  });

  describe('action buttons — spec alignment', () => {
    const previewBtn = templateCard.previewButton as Record<string, { value: string }>;
    const useBtn = templateCard.useButton as Record<string, { value: string }>;

    it('buttons are 36px tall', () => {
      expect(previewBtn.height.value).toBe('36px');
      expect(useBtn.height.value).toBe('36px');
    });

    it('use button bg is indigo-600', () => {
      expect(useBtn.bg.value).toContain('violet.600');
    });

    it('preview button is transparent with indigo-600 border', () => {
      expect(previewBtn.bg.value).toBe('transparent');
      expect(previewBtn.border.value).toContain('violet.600');
    });
  });

  describe('animation — spec alignment', () => {
    const animation = templateCard.animation as Record<string, { value: string }>;

    it('card enter is 250ms', () => {
      expect(animation['card-enter-duration'].value).toBe('250ms');
    });

    it('stagger delay is 40ms', () => {
      expect(animation['stagger-delay'].value).toBe('40ms');
    });

    it('hover duration is 150ms', () => {
      expect(animation['hover-duration'].value).toBe('150ms');
    });
  });
});

// ── Template Preview Modal Token JSON ────────────────────────────

describe('template-preview-modal.json — design tokens', () => {
  const tokens = loadTokens('template-preview-modal.json');

  it('has DTCG schema reference', () => {
    expect(tokens.$schema).toBe('https://design-tokens.github.io/community-group/format/');
  });

  const leaves = collectTokenLeaves(tokens);

  it('has at least 50 token leaves', () => {
    expect(leaves.length).toBeGreaterThanOrEqual(50);
  });

  it('every leaf has a non-empty value', () => {
    for (const leaf of leaves) {
      expect(leaf.value, `${leaf.path} should have a value`).toBeDefined();
      expect(String(leaf.value).length, `${leaf.path} value should not be empty`).toBeGreaterThan(
        0,
      );
    }
  });
});

// ── Template Library CSS ↔ Token Consistency ─────────────────────

describe('template-library-variables.css — consistency with tokens', () => {
  const css = loadCSS('template-library-variables.css');

  it('references TASK-156 for traceability', () => {
    expect(css).toContain('TASK-156');
  });

  describe('layout variables', () => {
    it('has header height (56px)', () => {
      expect(css).toContain('--tpl-header-h: 56px');
    });

    it('has sidebar width (220px)', () => {
      expect(css).toContain('--tpl-sidebar-w: 220px');
    });

    it('has content max-width (1440px)', () => {
      expect(css).toContain('--tpl-content-max-w: 1440px');
    });

    it('has content padding (24px)', () => {
      expect(css).toContain('--tpl-content-padding: 24px');
    });

    it('has toolbar height (52px)', () => {
      expect(css).toContain('--toolbar-h: 52px');
    });
  });

  describe('search bar variables', () => {
    it('has search height (40px)', () => {
      expect(css).toContain('--search-h: 40px');
    });

    it('has search width (320px)', () => {
      expect(css).toContain('--search-w: 320px');
    });

    it('has search max width (400px)', () => {
      expect(css).toContain('--search-max-w: 400px');
    });

    it('has search border focus (indigo-500)', () => {
      expect(css).toContain('--search-border-focus: #818cf8');
    });

    it('has search radius', () => {
      expect(css).toContain('--search-radius');
    });
  });

  describe('filter chip variables', () => {
    it('has chip height (30px)', () => {
      expect(css).toContain('--chip-h: 30px');
    });

    it('has chip active bg', () => {
      expect(css).toContain('--chip-bg-active');
    });

    it('has chip active border (indigo-500)', () => {
      expect(css).toContain('--chip-border-active: #818cf8');
    });

    it('has pill radius (9999px)', () => {
      expect(css).toContain('--chip-radius: 9999px');
    });
  });

  describe('sort dropdown variables', () => {
    it('has sort menu bg', () => {
      expect(css).toContain('--sort-menu-bg');
    });

    it('has sort menu shadow', () => {
      expect(css).toContain('--sort-menu-shadow');
    });

    it('has sort item hover bg', () => {
      expect(css).toContain('--sort-item-bg-hover');
    });
  });

  describe('card variables', () => {
    it('has card dimensions', () => {
      expect(css).toContain('--card-w: 300px');
      expect(css).toContain('--card-min-w: 260px');
      expect(css).toContain('--card-max-w: 360px');
    });

    it('has card shadow matching spec', () => {
      expect(css).toContain('0 1px 3px rgba(0, 0, 0, 0.3)');
      expect(css).toContain('0 8px 24px rgba(0, 0, 0, 0.4)');
    });

    it('has thumbnail height (180px)', () => {
      expect(css).toContain('--thumb-h: 180px');
    });

    it('has thumbnail bg', () => {
      expect(css).toContain('--thumb-bg: rgba(10, 14, 26, 0.8)');
    });

    it('has card gap (20px)', () => {
      expect(css).toContain('--card-gap: 20px');
    });
  });

  describe('category sidebar variables', () => {
    const categories = ['research', 'code', 'support', 'content', 'data', 'automation'];
    for (const cat of categories) {
      it(`has --cat-${cat} color`, () => {
        expect(css).toContain(`--cat-${cat}:`);
      });
      it(`has --cat-${cat}-bg`, () => {
        expect(css).toContain(`--cat-${cat}-bg:`);
      });
    }

    it('has sidebar icon size (32px)', () => {
      expect(css).toContain('--cat-item-icon-size: 32px');
    });

    it('has sidebar item hover bg', () => {
      expect(css).toContain('--cat-item-bg-hover');
    });
  });

  describe('badge variables', () => {
    it('has featured badge class', () => {
      expect(css).toContain('.cs-template-badge-featured');
    });

    it('has popular badge class', () => {
      expect(css).toContain('.cs-template-badge-popular');
    });

    it('has new badge class', () => {
      expect(css).toContain('.cs-template-badge-new');
    });
  });

  describe('button variables', () => {
    it('has Use Template button (indigo-600 bg)', () => {
      expect(css).toContain('.cs-use-template-btn');
      expect(css).toContain('--btn-bg: #6366f1');
    });

    it('has Preview button (transparent bg)', () => {
      expect(css).toContain('.cs-preview-template-btn');
      expect(css).toContain('--btn-bg: transparent');
    });

    it('buttons are 36px tall', () => {
      expect(css).toContain('--btn-h: 36px');
    });
  });

  describe('modal variables', () => {
    it('has modal overlay', () => {
      expect(css).toContain('--modal-overlay: rgba(0, 0, 0, 0.7)');
    });

    it('has modal width (900px)', () => {
      expect(css).toContain('--modal-w: 900px');
    });

    it('has modal max-height (85vh)', () => {
      expect(css).toContain('--modal-max-h: 85vh');
    });

    it('has modal header height (64px)', () => {
      expect(css).toContain('--modal-header-h: 64px');
    });

    it('has diagram height (400px)', () => {
      expect(css).toContain('--diagram-h: 400px');
    });

    it('has modal sidebar width (300px)', () => {
      expect(css).toContain('--modal-sidebar-w: 300px');
    });
  });

  describe('pagination variables', () => {
    it('has pagination button size (32px)', () => {
      expect(css).toContain('--page-btn-size: 32px');
    });

    it('has active page bg', () => {
      expect(css).toContain('--page-btn-bg-active');
    });
  });

  describe('empty state variables', () => {
    it('has empty icon size (72px)', () => {
      expect(css).toContain('--empty-icon-size: 72px');
    });

    it('has dashed border style', () => {
      expect(css).toContain('--empty-border-style: dashed');
    });
  });

  describe('animations', () => {
    it('has card enter keyframe with scale(0.92) and translateY(8px)', () => {
      expect(css).toContain('@keyframes cs-tpl-card-enter');
      expect(css).toContain('scale(0.92) translateY(8px)');
    });

    it('has modal enter keyframe with scale(0.95) and translateY(12px)', () => {
      expect(css).toContain('@keyframes cs-tpl-modal-enter');
      expect(css).toContain('scale(0.95) translateY(12px)');
    });

    it('has overlay fade keyframe', () => {
      expect(css).toContain('@keyframes cs-tpl-overlay-fade');
    });

    it('has grid reflow keyframe', () => {
      expect(css).toContain('@keyframes cs-tpl-grid-reflow');
    });

    it('has empty state keyframe', () => {
      expect(css).toContain('@keyframes cs-tpl-empty-in');
    });

    it('has filter toggle keyframe', () => {
      expect(css).toContain('@keyframes cs-tpl-filter-toggle');
    });
  });
});

// ── Template Card CSS ↔ Token Consistency ────────────────────────

describe('template-card-variables.css — consistency with tokens', () => {
  const css = loadCSS('template-card-variables.css');

  it('references TASK-157 for traceability', () => {
    expect(css).toContain('TASK-157');
  });

  describe('card container tokens', () => {
    it('has card dimensions matching spec', () => {
      expect(css).toContain('--card-w: 300px');
      expect(css).toContain('--card-min-w: 260px');
      expect(css).toContain('--card-max-w: 360px');
    });

    it('has focus border for accessibility', () => {
      expect(css).toContain('--card-border-focus: #818cf8');
    });

    it('has focus shadow ring', () => {
      expect(css).toContain('--card-shadow-focus');
    });
  });

  describe('thumbnail tokens', () => {
    it('has responsive thumbnail heights', () => {
      expect(css).toContain('--thumb-h: 180px');
      expect(css).toContain('--thumb-h-md: 160px');
      expect(css).toContain('--thumb-h-sm: 140px');
    });

    it('has node type colors', () => {
      expect(css).toContain('--thumb-node-agent: #818cf8');
      expect(css).toContain('--thumb-node-task: #22d3ee');
      expect(css).toContain('--thumb-node-tool: #34d399');
      expect(css).toContain('--thumb-node-llm: #fbbf24');
    });

    it('has edge color', () => {
      expect(css).toContain('--thumb-edge-color');
    });

    it('has overlay gradient', () => {
      expect(css).toContain('--thumb-overlay-gradient');
    });
  });

  describe('badge variants', () => {
    it('has featured badge', () => {
      expect(css).toContain('.cs-tpl-card__badge--featured');
    });

    it('has popular badge', () => {
      expect(css).toContain('.cs-tpl-card__badge--popular');
    });

    it('has new badge', () => {
      expect(css).toContain('.cs-tpl-card__badge--new');
    });
  });

  describe('category icon variants', () => {
    const categories = ['research', 'code', 'support', 'content', 'data', 'automation'];
    for (const cat of categories) {
      it(`has ${cat} category icon class`, () => {
        expect(css).toContain(`.cs-tpl-card__cat-icon--${cat}`);
      });
    }
  });

  describe('typography tokens', () => {
    it('title is 14px (0.875rem) / 600 weight', () => {
      expect(css).toContain('--title-font-size: 0.875rem');
      expect(css).toContain('--title-font-weight: 600');
    });

    it('description is 12px (0.75rem) / 400 weight', () => {
      expect(css).toContain('--desc-font-size: 0.75rem');
      expect(css).toContain('--desc-font-weight: 400');
    });

    it('tag is 10px (0.625rem) / 500 weight / 0.02em tracking', () => {
      expect(css).toContain('--tag-font-size: 0.625rem');
      expect(css).toContain('--tag-font-weight: 500');
      expect(css).toContain('--tag-letter-spacing: 0.02em');
    });

    it('meta is 11px (0.6875rem) / 400 weight', () => {
      expect(css).toContain('--meta-font-size: 0.6875rem');
      expect(css).toContain('--meta-font-weight: 400');
    });
  });

  describe('action buttons', () => {
    it('has preview button class', () => {
      expect(css).toContain('.cs-tpl-card__btn-preview');
    });

    it('has use button class', () => {
      expect(css).toContain('.cs-tpl-card__btn-use');
    });

    it('use button has active state tokens', () => {
      expect(css).toContain('--btn-bg-active: #4f46e5');
      expect(css).toContain('--btn-shadow-active');
    });
  });

  describe('skeleton loading state', () => {
    it('has skeleton class', () => {
      expect(css).toContain('.cs-tpl-card--skeleton');
    });

    it('has shimmer animation', () => {
      expect(css).toContain('@keyframes cs-tpl-card-shimmer');
    });
  });

  describe('reduced motion support', () => {
    it('has prefers-reduced-motion media query', () => {
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});

// ── Template Preview Modal CSS ↔ Token Consistency ───────────────

describe('template-preview-modal-variables.css — consistency with tokens', () => {
  const css = loadCSS('template-preview-modal-variables.css');

  it('references TASK-158 for traceability', () => {
    expect(css).toContain('TASK-158');
  });

  describe('modal container', () => {
    it('has modal width (900px)', () => {
      expect(css).toContain('--modal-w: 900px');
    });

    it('has modal max-height (85vh)', () => {
      expect(css).toContain('--modal-max-h: 85vh');
    });

    it('has min-height (520px)', () => {
      expect(css).toContain('--modal-min-h: 520px');
    });

    it('has responsive max-width', () => {
      expect(css).toContain('--modal-max-w: calc(100vw - 48px)');
    });
  });

  describe('overlay', () => {
    it('has overlay bg', () => {
      expect(css).toContain('--overlay-bg: rgba(0, 0, 0, 0.7)');
    });

    it('has overlay blur (8px)', () => {
      expect(css).toContain('--overlay-blur: 8px');
    });
  });

  describe('header', () => {
    it('has header height (64px)', () => {
      expect(css).toContain('--header-h: 64px');
    });

    it('has close button', () => {
      expect(css).toContain('--close-size: 32px');
      expect(css).toContain('--close-icon-size: 16px');
    });

    it('has star rating colors', () => {
      expect(css).toContain('--star-filled: #fbbf24');
    });
  });

  describe('diagram area', () => {
    it('has diagram height (400px)', () => {
      expect(css).toContain('--diagram-h: 400px');
    });

    it('has diagram bg', () => {
      expect(css).toContain('--diagram-bg: rgba(10, 14, 26, 0.9)');
    });

    it('has dot grid tokens', () => {
      expect(css).toContain('--grid-dot-color');
      expect(css).toContain('--grid-dot-size');
      expect(css).toContain('--grid-dot-spacing');
    });

    it('has node type colors', () => {
      expect(css).toContain('--node-agent-bg');
      expect(css).toContain('--node-task-bg');
      expect(css).toContain('--node-tool-bg');
      expect(css).toContain('--node-llm-bg');
    });

    it('has edge tokens', () => {
      expect(css).toContain('--edge-color');
      expect(css).toContain('--edge-width');
    });

    it('has zoom control tokens', () => {
      expect(css).toContain('--ctrl-btn-size: 28px');
    });

    it('has node dimensions from spec (140×48)', () => {
      expect(css).toContain('--node-w: 140px');
      expect(css).toContain('--node-h: 48px');
    });
  });

  describe('detail sidebar', () => {
    it('has sidebar width (300px)', () => {
      expect(css).toContain('--sidebar-w: 300px');
    });

    it('has sidebar min-width (260px)', () => {
      expect(css).toContain('--sidebar-min-w: 260px');
    });

    it('has section label styling tokens', () => {
      expect(css).toContain('--label-transform: uppercase');
      expect(css).toContain('--label-spacing: 0.05em');
    });
  });

  describe('composition section', () => {
    it('has composition type colors', () => {
      expect(css).toContain('--comp-agent: #818cf8');
      expect(css).toContain('--comp-task: #22d3ee');
      expect(css).toContain('--comp-tool: #34d399');
      expect(css).toContain('--comp-llm: #fbbf24');
    });
  });

  describe('footer', () => {
    it('has footer height (64px)', () => {
      expect(css).toContain('--footer-h: 64px');
    });

    it('has Use Template button (40px tall)', () => {
      expect(css).toContain('.cs-preview-modal-use-btn');
    });

    it('has Open in Canvas button', () => {
      expect(css).toContain('.cs-preview-modal-canvas-btn');
    });
  });

  describe('focus ring (accessibility)', () => {
    it('has :focus-visible styling', () => {
      expect(css).toContain(':focus-visible');
      expect(css).toContain('outline: 2px solid #818cf8');
    });
  });

  describe('animations', () => {
    it('has overlay enter/exit', () => {
      expect(css).toContain('@keyframes cs-preview-overlay-enter');
      expect(css).toContain('@keyframes cs-preview-overlay-exit');
    });

    it('has modal enter/exit with correct transforms', () => {
      expect(css).toContain('@keyframes cs-preview-modal-enter');
      expect(css).toContain('@keyframes cs-preview-modal-exit');
      expect(css).toContain('scale(0.95) translateY(12px)');
    });

    it('has node enter animation', () => {
      expect(css).toContain('@keyframes cs-preview-node-enter');
      expect(css).toContain('scale(0.85)');
    });

    it('has edge draw animation', () => {
      expect(css).toContain('@keyframes cs-preview-edge-draw');
    });

    it('has sidebar enter animation', () => {
      expect(css).toContain('@keyframes cs-preview-sidebar-enter');
      expect(css).toContain('translateX(8px)');
    });
  });

  describe('responsive behavior', () => {
    it('has mobile breakpoint at 767px', () => {
      expect(css).toContain('@media (max-width: 767px)');
    });

    it('has reduced motion support', () => {
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});

// ── Tailwind ↔ Token Consistency ─────────────────────────────────

describe('template-library-theme.ts — consistency with tokens', () => {
  const twSource = loadTailwind('template-library-theme.ts');

  it('references TASK-156 for traceability', () => {
    expect(twSource).toContain('TASK-156');
  });

  describe('color tokens in Tailwind', () => {
    it('has tpl-library namespace', () => {
      expect(twSource).toContain("'tpl-library'");
    });

    it('has tpl-card namespace', () => {
      expect(twSource).toContain("'tpl-card'");
    });

    it('has all category colors', () => {
      const categories = ['research', 'code', 'support', 'content', 'data', 'automation'];
      for (const cat of categories) {
        expect(twSource).toContain(`${cat}:`);
      }
    });

    it('has all badge types (featured, popular, new)', () => {
      expect(twSource).toContain("'featured-bg'");
      expect(twSource).toContain("'popular-bg'");
      expect(twSource).toContain("'new-bg'");
    });

    it('has tag colors', () => {
      expect(twSource).toContain("'tpl-tag'");
    });

    it('has use button colors', () => {
      expect(twSource).toContain("'tpl-use-btn'");
    });

    it('has preview button colors', () => {
      expect(twSource).toContain("'tpl-preview-btn'");
    });

    it('has modal colors', () => {
      expect(twSource).toContain("'tpl-modal'");
    });

    it('has filter chip colors', () => {
      expect(twSource).toContain("'tpl-filter'");
    });

    it('has search colors', () => {
      expect(twSource).toContain("'tpl-search'");
    });

    it('has pagination colors', () => {
      expect(twSource).toContain("'tpl-pagination'");
    });
  });

  describe('spacing tokens in Tailwind', () => {
    it('has layout spacing', () => {
      expect(twSource).toContain("'tpl-header-h': '56px'");
      expect(twSource).toContain("'tpl-sidebar-w': '220px'");
      expect(twSource).toContain("'tpl-content-max-w': '1440px'");
      expect(twSource).toContain("'tpl-content-p': '24px'");
    });

    it('has card spacing', () => {
      expect(twSource).toContain("'tpl-card-w': '300px'");
      expect(twSource).toContain("'tpl-card-gap': '20px'");
    });

    it('has search width (320px)', () => {
      expect(twSource).toContain("'tpl-search-w': '320px'");
    });

    it('has search max-width (400px)', () => {
      expect(twSource).toContain("'tpl-search-max-w': '400px'");
    });

    it('has modal spacing', () => {
      expect(twSource).toContain("'tpl-modal-w': '900px'");
      expect(twSource).toContain("'tpl-modal-sidebar-w': '300px'");
      expect(twSource).toContain("'tpl-modal-diagram-h': '400px'");
    });
  });

  describe('fontSize tokens in Tailwind', () => {
    it('has card typography sizes', () => {
      expect(twSource).toContain("'tpl-card-title'");
      expect(twSource).toContain("'tpl-card-desc'");
      expect(twSource).toContain("'tpl-card-meta'");
      expect(twSource).toContain("'tpl-tag'");
    });

    it('has modal typography sizes', () => {
      expect(twSource).toContain("'tpl-modal-title'");
      expect(twSource).toContain("'tpl-modal-desc'");
    });

    it('has empty state typography', () => {
      expect(twSource).toContain("'tpl-empty-heading'");
      expect(twSource).toContain("'tpl-empty-desc'");
    });
  });

  describe('boxShadow tokens in Tailwind', () => {
    it('has card shadow', () => {
      expect(twSource).toContain("'tpl-card':");
    });

    it('has card hover shadow', () => {
      expect(twSource).toContain("'tpl-card-hover':");
    });

    it('has use button shadow', () => {
      expect(twSource).toContain("'tpl-use-btn':");
    });

    it('has modal shadow', () => {
      expect(twSource).toContain("'tpl-modal':");
    });

    it('has sort menu shadow', () => {
      expect(twSource).toContain("'tpl-sort-menu':");
    });
  });

  describe('animation tokens in Tailwind', () => {
    it('has card enter animation', () => {
      expect(twSource).toContain("'tpl-card-enter'");
      expect(twSource).toContain('250ms');
    });

    it('has modal enter animation', () => {
      expect(twSource).toContain("'tpl-modal-enter'");
      expect(twSource).toContain('300ms');
    });

    it('has overlay fade animation', () => {
      expect(twSource).toContain("'tpl-overlay-fade'");
    });

    it('has grid reflow animation', () => {
      expect(twSource).toContain("'tpl-grid-reflow'");
    });

    it('has filter toggle animation', () => {
      expect(twSource).toContain("'tpl-filter-toggle'");
    });
  });

  describe('keyframe consistency', () => {
    it('card enter keyframe matches spec transforms', () => {
      expect(twSource).toContain('scale(0.92) translateY(8px)');
      expect(twSource).toContain('scale(1) translateY(0)');
    });

    it('modal enter keyframe matches spec transforms', () => {
      expect(twSource).toContain('scale(0.95) translateY(12px)');
    });
  });
});

describe('template-card-theme.ts — consistency with tokens', () => {
  const twSource = loadTailwind('template-card-theme.ts');

  it('references TASK-157 for traceability', () => {
    expect(twSource).toContain('TASK-157');
  });

  it('has thumbnail node type colors', () => {
    expect(twSource).toContain("'node-agent': '#818cf8'");
    expect(twSource).toContain("'node-task': '#22d3ee'");
    expect(twSource).toContain("'node-tool': '#34d399'");
    expect(twSource).toContain("'node-llm': '#fbbf24'");
  });

  it('has all badge variants', () => {
    expect(twSource).toContain("'featured-bg'");
    expect(twSource).toContain("'popular-bg'");
    expect(twSource).toContain("'new-bg'");
  });

  it('has category icon colors for all 6 categories', () => {
    const categories = ['research', 'code', 'support', 'content', 'data', 'automation'];
    for (const cat of categories) {
      expect(twSource).toContain(`'${cat}-color'`);
      expect(twSource).toContain(`'${cat}-bg'`);
    }
  });

  it('has skeleton loading tokens', () => {
    expect(twSource).toContain("'tpl-card-skeleton'");
  });

  it('has card focus shadow for accessibility', () => {
    expect(twSource).toContain("'tpl-card-focus'");
  });
});

describe('template-preview-modal-theme.ts — consistency with tokens', () => {
  const twSource = loadTailwind('template-preview-modal-theme.ts');

  it('references TASK-158 for traceability', () => {
    expect(twSource).toContain('TASK-158');
  });

  it('has diagram node type colors', () => {
    expect(twSource).toContain("'node-agent-bg'");
    expect(twSource).toContain("'node-task-bg'");
    expect(twSource).toContain("'node-tool-bg'");
    expect(twSource).toContain("'node-llm-bg'");
  });

  it('has composition type colors', () => {
    expect(twSource).toContain("'comp-agent': '#818cf8'");
    expect(twSource).toContain("'comp-task': '#22d3ee'");
    expect(twSource).toContain("'comp-tool': '#34d399'");
    expect(twSource).toContain("'comp-llm': '#fbbf24'");
  });

  it('has footer button tokens', () => {
    expect(twSource).toContain("'pm-use-btn'");
    expect(twSource).toContain("'pm-canvas-btn'");
  });

  it('has animation choreography (overlay → modal → nodes → edges → sidebar)', () => {
    expect(twSource).toContain("'pm-overlay-enter'");
    expect(twSource).toContain("'pm-modal-enter'");
    expect(twSource).toContain("'pm-node-enter'");
    expect(twSource).toContain("'pm-edge-draw'");
    expect(twSource).toContain("'pm-sidebar-enter'");
  });

  it('has exit animations', () => {
    expect(twSource).toContain("'pm-overlay-exit'");
    expect(twSource).toContain("'pm-modal-exit'");
  });

  it('has focus ring shadow', () => {
    expect(twSource).toContain("'pm-focus-ring'");
  });
});

// ── Cross-file Consistency ───────────────────────────────────────

describe('template library cross-file consistency', () => {
  const libraryCss = loadCSS('template-library-variables.css');
  const cardCss = loadCSS('template-card-variables.css');
  const modalCss = loadCSS('template-preview-modal-variables.css');
  const libraryTw = loadTailwind('template-library-theme.ts');
  const cardTw = loadTailwind('template-card-theme.ts');
  const modalTw = loadTailwind('template-preview-modal-theme.ts');

  it('card width is consistent across all files (300px)', () => {
    expect(libraryCss).toContain('--card-w: 300px');
    expect(cardCss).toContain('--card-w: 300px');
    expect(libraryTw).toContain("'tpl-card-w': '300px'");
    expect(cardTw).toContain("'tpl-card-w': '300px'");
  });

  it('card gap is consistent across files (20px)', () => {
    expect(libraryCss).toContain('--card-gap: 20px');
    expect(cardCss).toContain('--card-gap: 20px');
    expect(libraryTw).toContain("'tpl-card-gap': '20px'");
    expect(cardTw).toContain("'tpl-card-gap': '20px'");
  });

  it('thumbnail height is consistent (180px)', () => {
    expect(libraryCss).toContain('--thumb-h: 180px');
    expect(cardCss).toContain('--thumb-h: 180px');
  });

  it('thumbnail bg is consistent across files', () => {
    expect(libraryCss).toContain('rgba(10, 14, 26, 0.8)');
    expect(cardCss).toContain('rgba(10, 14, 26, 0.8)');
    expect(libraryTw).toContain('rgba(10,14,26,0.8)');
    expect(cardTw).toContain('rgba(10,14,26,0.8)');
  });

  it('use button indigo-600 bg is consistent across files', () => {
    expect(libraryCss).toContain('--btn-bg: #6366f1');
    expect(cardCss).toContain('--btn-bg: #6366f1');
    expect(libraryTw).toContain("bg: '#6366f1'");
    expect(cardTw).toContain("bg: '#6366f1'");
  });

  it('modal overlay is consistent', () => {
    expect(libraryCss).toContain('--modal-overlay: rgba(0, 0, 0, 0.7)');
    expect(modalCss).toContain('--overlay-bg: rgba(0, 0, 0, 0.7)');
    expect(libraryTw).toContain("overlay: 'rgba(0,0,0,0.7)'");
    expect(modalTw).toContain("'pm-overlay': 'rgba(0,0,0,0.7)'");
  });

  it('modal width is consistent (900px)', () => {
    expect(libraryCss).toContain('--modal-w: 900px');
    expect(modalCss).toContain('--modal-w: 900px');
    expect(libraryTw).toContain("'tpl-modal-w': '900px'");
    expect(modalTw).toContain("'pm-modal-w': '900px'");
  });

  it('modal diagram height is consistent (400px)', () => {
    expect(libraryCss).toContain('--diagram-h: 400px');
    expect(modalCss).toContain('--diagram-h: 400px');
    expect(libraryTw).toContain("'tpl-modal-diagram-h': '400px'");
    expect(modalTw).toContain("'pm-diagram-h': '400px'");
  });

  it('modal sidebar width is consistent (300px)', () => {
    expect(libraryCss).toContain('--modal-sidebar-w: 300px');
    expect(modalCss).toContain('--sidebar-w: 300px');
    expect(libraryTw).toContain("'tpl-modal-sidebar-w': '300px'");
    expect(modalTw).toContain("'pm-sidebar-w': '300px'");
  });

  it('card enter keyframe exists in all CSS and Tailwind files', () => {
    expect(libraryCss).toContain('@keyframes cs-tpl-card-enter');
    expect(cardCss).toContain('@keyframes cs-tpl-card-enter');
    expect(libraryTw).toContain("'tpl-card-enter'");
    expect(cardTw).toContain("'tpl-card-enter'");
  });

  it('both CSS files agree on card enter transforms', () => {
    expect(libraryCss).toContain('scale(0.92) translateY(8px)');
    expect(cardCss).toContain('scale(0.92) translateY(8px)');
  });

  it('tag height is consistent (22px) in library CSS and card CSS', () => {
    expect(libraryCss).toContain('--tag-h: 22px');
    expect(cardCss).toContain('--tag-h: 22px');
  });

  it('featured badge values are consistent between library and card CSS', () => {
    expect(libraryCss).toContain('rgba(251, 191, 36, 0.15)');
    expect(cardCss).toContain('rgba(251, 191, 36, 0.15)');
  });

  it('composition colors match between modal CSS and Tailwind', () => {
    expect(modalCss).toContain('--comp-agent: #818cf8');
    expect(modalTw).toContain("'comp-agent': '#818cf8'");
    expect(modalCss).toContain('--comp-task: #22d3ee');
    expect(modalTw).toContain("'comp-task': '#22d3ee'");
  });
});
