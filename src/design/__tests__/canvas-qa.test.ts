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

// ── Canvas Token JSON ─────────────────────────────────────────────

describe('canvas.json — design tokens', () => {
  const tokens = loadTokens('canvas.json');

  it('has DTCG schema reference', () => {
    expect(tokens.$schema).toBe('https://design-tokens.github.io/community-group/format/');
  });

  it('has crewspace.canvas namespace', () => {
    expect(tokens).toHaveProperty('crewspace');
    const crewspace = tokens.crewspace as Record<string, unknown>;
    expect(crewspace).toHaveProperty('canvas');
  });

  const canvas = (tokens as { crewspace: { canvas: Record<string, unknown> } }).crewspace.canvas;

  it('contains required top-level sections', () => {
    const requiredSections = [
      'viewport', 'node', 'edge', 'handle', 'selection',
      'minimap', 'toolbar', 'sidebar', 'properties', 'animation',
    ];
    for (const section of requiredSections) {
      expect(canvas, `missing section: ${section}`).toHaveProperty(section);
    }
  });

  describe('token leaf values', () => {
    const leaves = collectTokenLeaves(canvas);

    it('has at least 60 token leaves', () => {
      expect(leaves.length).toBeGreaterThanOrEqual(60);
    });

    it('every leaf has a non-empty value', () => {
      for (const leaf of leaves) {
        expect(leaf.value, `${leaf.path} should have a value`).toBeDefined();
        expect(String(leaf.value).length, `${leaf.path} value should not be empty`).toBeGreaterThan(0);
      }
    });

    it('every leaf has a valid type', () => {
      const validTypes = [
        'color', 'number', 'string', 'boolean', 'sizing', 'spacing',
        'borderWidth', 'borderRadius', 'transition', 'boxShadow',
      ];
      for (const leaf of leaves) {
        expect(validTypes, `${leaf.path} has type "${leaf.type}"`).toContain(leaf.type);
      }
    });
  });

  describe('viewport section', () => {
    const viewport = canvas.viewport as Record<string, Record<string, unknown>>;

    it('has background color', () => {
      expect(viewport).toHaveProperty('background');
      expect((viewport.background as { value: string }).value).toBe('#0a0e1a');
    });

    it('has grid sizing tokens', () => {
      expect(viewport).toHaveProperty('grid-size');
      expect(viewport).toHaveProperty('grid-dot-radius');
      expect(viewport).toHaveProperty('snap-grid');
    });

    it('has grid color tokens', () => {
      expect(viewport).toHaveProperty('grid-dot-color');
      expect(viewport).toHaveProperty('grid-line-color');
    });

    it('has zoom range tokens', () => {
      expect(viewport).toHaveProperty('min-zoom');
      expect(viewport).toHaveProperty('max-zoom');
      expect(viewport).toHaveProperty('default-zoom');
      expect(viewport).toHaveProperty('zoom-step');

      const minZoom = Number((viewport['min-zoom'] as { value: string }).value);
      const maxZoom = Number((viewport['max-zoom'] as { value: string }).value);
      const defaultZoom = Number((viewport['default-zoom'] as { value: string }).value);
      expect(minZoom).toBeLessThan(defaultZoom);
      expect(defaultZoom).toBeLessThanOrEqual(maxZoom);
    });
  });

  describe('node section', () => {
    const node = canvas.node as Record<string, Record<string, unknown>>;

    it('has dimension tokens', () => {
      expect(node).toHaveProperty('width');
      expect(node).toHaveProperty('min-width');
      expect(node).toHaveProperty('max-width');
      expect(node).toHaveProperty('header-height');
      expect(node).toHaveProperty('border-radius');
    });

    it('has correct dimension values from spec', () => {
      expect((node.width as { value: string }).value).toBe('220px');
      expect((node['min-width'] as { value: string }).value).toBe('180px');
      expect((node['max-width'] as { value: string }).value).toBe('280px');
      expect((node['header-height'] as { value: string }).value).toBe('40px');
      expect((node['border-radius'] as { value: string }).value).toBe('10px');
    });

    it('has node type color tokens', () => {
      const types = ['agent', 'task', 'tool', 'llm'] as const;
      for (const t of types) {
        expect(node, `missing ${t}-bg`).toHaveProperty(`${t}-bg`);
        expect(node, `missing ${t}-border`).toHaveProperty(`${t}-border`);
        expect(node, `missing ${t}-icon`).toHaveProperty(`${t}-icon`);
      }
    });

    it('has node state tokens', () => {
      expect(node).toHaveProperty('selected-ring');
      expect(node).toHaveProperty('selected-glow');
      expect(node).toHaveProperty('running-pulse');
      expect(node).toHaveProperty('error-pulse');
      expect(node).toHaveProperty('disabled-opacity');
    });

    it('disabled-opacity matches spec (0.4)', () => {
      expect((node['disabled-opacity'] as { value: string }).value).toBe('0.4');
    });
  });

  describe('edge section', () => {
    const edge = canvas.edge as Record<string, Record<string, unknown>>;

    it('has width tokens', () => {
      expect(edge).toHaveProperty('width');
      expect(edge).toHaveProperty('width-hover');
      const w = Number((edge.width as { value: string }).value);
      const wh = Number((edge['width-hover'] as { value: string }).value);
      expect(wh).toBeGreaterThan(w);
    });

    it('has type and animation tokens', () => {
      expect(edge).toHaveProperty('type');
      expect(edge).toHaveProperty('animated');
      expect(edge).toHaveProperty('dash-array');
      expect(edge).toHaveProperty('arrow-size');
    });

    it('has edge color tokens', () => {
      expect(edge).toHaveProperty('color-default');
      expect(edge).toHaveProperty('color-active');
      expect(edge).toHaveProperty('color-data-flow');
      expect(edge).toHaveProperty('color-error');
      expect((edge['color-default'] as { value: string }).value).toBe('#64748b');
      expect((edge['color-active'] as { value: string }).value).toBe('#a78bfa');
      expect((edge['color-data-flow'] as { value: string }).value).toBe('#38bdf8');
      expect((edge['color-error'] as { value: string }).value).toBe('#fb7185');
    });

    it('has label tokens', () => {
      expect(edge).toHaveProperty('label-bg');
      expect(edge).toHaveProperty('label-padding');
      expect(edge).toHaveProperty('label-radius');
      expect(edge).toHaveProperty('label-font-size');
      expect(edge).toHaveProperty('label-max-width');
    });

    it('has correct label detail values from spec', () => {
      expect((edge['label-radius'] as { value: string }).value).toBe('4px');
      expect((edge['label-font-size'] as { value: string }).value).toBe('12px');
      expect((edge['label-max-width'] as { value: string }).value).toBe('120px');
    });
  });

  describe('handle section', () => {
    const handle = canvas.handle as Record<string, Record<string, unknown>>;

    it('has size and border tokens', () => {
      expect(handle).toHaveProperty('size');
      expect(handle).toHaveProperty('border-width');
      expect(handle).toHaveProperty('hit-area');
    });

    it('has color state tokens', () => {
      expect(handle).toHaveProperty('bg');
      expect(handle).toHaveProperty('border-color');
      expect(handle).toHaveProperty('hover-bg');
      expect(handle).toHaveProperty('hover-border');
      expect(handle).toHaveProperty('connected-bg');
    });

    it('hit-area is 20px per spec', () => {
      expect((handle['hit-area'] as { value: string }).value).toBe('20px');
    });
  });

  describe('selection section', () => {
    const selection = canvas.selection as Record<string, Record<string, unknown>>;

    it('has marquee tokens', () => {
      expect(selection).toHaveProperty('marquee-bg');
      expect(selection).toHaveProperty('marquee-border');
      expect(selection).toHaveProperty('marquee-dash');
    });
  });

  describe('minimap section', () => {
    const minimap = canvas.minimap as Record<string, Record<string, unknown>>;

    it('has layout tokens', () => {
      expect(minimap).toHaveProperty('position');
      expect(minimap).toHaveProperty('margin');
      expect(minimap).toHaveProperty('border-radius');
      expect(minimap).toHaveProperty('opacity');
    });

    it('has dimension tokens', () => {
      expect(minimap).toHaveProperty('width');
      expect(minimap).toHaveProperty('height');
      expect((minimap.width as { value: string }).value).toBe('200px');
      expect((minimap.height as { value: string }).value).toBe('140px');
    });

    it('has color tokens', () => {
      expect(minimap).toHaveProperty('bg');
      expect(minimap).toHaveProperty('viewport-color');
    });
  });

  describe('toolbar section', () => {
    const toolbar = canvas.toolbar as Record<string, Record<string, unknown>>;

    it('has all toolbar tokens', () => {
      expect(toolbar).toHaveProperty('height');
      expect(toolbar).toHaveProperty('btn-size');
      expect(toolbar).toHaveProperty('icon-size');
      expect(toolbar).toHaveProperty('gap');
      expect(toolbar).toHaveProperty('padding');
      expect(toolbar).toHaveProperty('divider-gap');
    });

    it('has correct values from spec', () => {
      expect((toolbar.height as { value: string }).value).toBe('48px');
      expect((toolbar['btn-size'] as { value: string }).value).toBe('36px');
      expect((toolbar['icon-size'] as { value: string }).value).toBe('18px');
      expect((toolbar.gap as { value: string }).value).toBe('4px');
      expect((toolbar['divider-gap'] as { value: string }).value).toBe('8px');
    });
  });

  describe('sidebar section', () => {
    const sidebar = canvas.sidebar as Record<string, Record<string, unknown>>;

    it('has all sidebar tokens', () => {
      expect(sidebar).toHaveProperty('width');
      expect(sidebar).toHaveProperty('collapsed-width');
      expect(sidebar).toHaveProperty('padding');
      expect(sidebar).toHaveProperty('section-gap');
    });

    it('has correct values from spec', () => {
      expect((sidebar.width as { value: string }).value).toBe('280px');
      expect((sidebar['collapsed-width'] as { value: string }).value).toBe('48px');
      expect((sidebar.padding as { value: string }).value).toBe('12px');
    });
  });

  describe('properties section', () => {
    const properties = canvas.properties as Record<string, Record<string, unknown>>;

    it('has all properties panel tokens', () => {
      expect(properties).toHaveProperty('width');
      expect(properties).toHaveProperty('padding');
      expect(properties).toHaveProperty('label-width');
      expect(properties).toHaveProperty('input-height');
      expect(properties).toHaveProperty('header-height');
    });

    it('has correct values from spec', () => {
      expect((properties.width as { value: string }).value).toBe('320px');
      expect((properties.padding as { value: string }).value).toBe('16px');
      expect((properties['header-height'] as { value: string }).value).toBe('48px');
    });
  });

  describe('animation section', () => {
    const animation = canvas.animation as Record<string, Record<string, unknown>>;

    it('has lifecycle animations', () => {
      expect(animation).toHaveProperty('node-enter');
      expect(animation).toHaveProperty('edge-draw');
      expect(animation).toHaveProperty('running-pulse');
      expect(animation).toHaveProperty('data-flow');
    });
  });
});

// ── CSS ↔ Token Consistency ──────────────────────────────────────

describe('canvas-variables.css — consistency with tokens', () => {
  const css = loadCSS('canvas-variables.css');
  const tokens = loadTokens('canvas.json');
  const canvas = (tokens as { crewspace: { canvas: Record<string, unknown> } }).crewspace.canvas;

  it('references TASK-139 for QA traceability', () => {
    expect(css).toContain('TASK-139');
  });

  describe('viewport tokens reflected in CSS', () => {
    it('has --canvas-grid-size matching token', () => {
      const tokenVal = ((canvas.viewport as Record<string, any>)['grid-size'] as { value: string }).value;
      expect(css).toContain(`--canvas-grid-size: ${tokenVal}px`);
    });

    it('has --canvas-grid-dot-radius', () => {
      expect(css).toContain('--canvas-grid-dot-radius');
    });

    it('has zoom control variables', () => {
      expect(css).toContain('--canvas-min-zoom');
      expect(css).toContain('--canvas-max-zoom');
      expect(css).toContain('--canvas-default-zoom');
      expect(css).toContain('--canvas-zoom-step');
    });

    it('has --canvas-snap-grid', () => {
      expect(css).toContain('--canvas-snap-grid');
    });
  });

  describe('node dimension tokens reflected in CSS', () => {
    it('has --node-width matching spec (220px)', () => {
      expect(css).toContain('--node-width: 220px');
    });

    it('has --node-min-width matching spec (180px)', () => {
      expect(css).toContain('--node-min-width: 180px');
    });

    it('has --node-max-width matching spec (280px)', () => {
      expect(css).toContain('--node-max-width: 280px');
    });

    it('has --node-header-height matching spec (40px)', () => {
      expect(css).toContain('--node-header-height: 40px');
    });

    it('has --node-border-width matching spec (1.5px)', () => {
      expect(css).toContain('--node-border-width: 1.5px');
    });

    it('has --node-border-width-hover matching spec (2px)', () => {
      expect(css).toContain('--node-border-width-hover: 2px');
    });

    it('has --node-header-padding', () => {
      expect(css).toContain('--node-header-padding: 10px 12px');
    });

    it('has --node-body-padding', () => {
      expect(css).toContain('--node-body-padding: 8px 12px');
    });
  });

  describe('node color tokens reflected in CSS', () => {
    const nodeTypes = ['agent', 'task', 'tool', 'llm'] as const;

    for (const nodeType of nodeTypes) {
      it(`has --node-${nodeType}-bg`, () => {
        expect(css).toContain(`--node-${nodeType}-bg`);
      });
      it(`has --node-${nodeType}-border`, () => {
        expect(css).toContain(`--node-${nodeType}-border`);
      });
      it(`has --node-${nodeType}-icon`, () => {
        expect(css).toContain(`--node-${nodeType}-icon`);
      });
    }

    it('has --node-gap', () => {
      expect(css).toContain('--node-gap: 6px');
    });
  });

  describe('edge tokens reflected in CSS', () => {
    it('has edge width matching token', () => {
      expect(css).toContain('--edge-width: 2px');
      expect(css).toContain('--edge-width-hover: 3px');
    });

    it('has edge type token', () => {
      expect(css).toContain('--edge-type: smoothstep');
    });

    it('has edge animated token', () => {
      expect(css).toContain('--edge-animated');
    });

    it('has edge dash-array', () => {
      expect(css).toContain('--edge-dash-array: 5 5');
    });

    it('has edge arrow-size', () => {
      expect(css).toContain('--edge-arrow-size: 12px');
    });

    it('has edge label tokens', () => {
      expect(css).toContain('--edge-label-bg');
      expect(css).toContain('--edge-label-padding');
    });

    it('has edge label detail tokens from spec', () => {
      expect(css).toContain('--edge-label-radius: 4px');
      expect(css).toContain('--edge-label-font-size: 12px');
      expect(css).toContain('--edge-label-max-width: 120px');
    });
  });

  describe('handle tokens reflected in CSS', () => {
    it('has handle size matching token', () => {
      expect(css).toContain('--handle-size: 10px');
    });

    it('has handle border-width', () => {
      expect(css).toContain('--handle-border-width: 2px');
    });

    it('has handle hit-area from spec', () => {
      expect(css).toContain('--handle-hit-area: 20px');
    });

    it('has handle color values matching tokens', () => {
      const handle = canvas.handle as Record<string, { value: string }>;
      expect(css).toContain(`--handle-bg: ${handle.bg.value}`);
      expect(css).toContain(`--handle-border: ${handle['border-color'].value}`);
      expect(css).toContain(`--handle-hover-bg: ${handle['hover-bg'].value}`);
      expect(css).toContain(`--handle-hover-border: ${handle['hover-border'].value}`);
      expect(css).toContain(`--handle-connected-bg: ${handle['connected-bg'].value}`);
    });
  });

  describe('selection tokens reflected in CSS', () => {
    it('has selection variables', () => {
      expect(css).toContain('--selection-bg');
      expect(css).toContain('--selection-border');
      expect(css).toContain('--selection-dash');
    });
  });

  describe('minimap tokens reflected in CSS', () => {
    it('has minimap variables', () => {
      expect(css).toContain('--minimap-bg');
      expect(css).toContain('--minimap-viewport');
      expect(css).toContain('--minimap-margin: 16px');
      expect(css).toContain('--minimap-border-radius: 8px');
      expect(css).toContain('--minimap-opacity: 0.85');
    });
  });

  describe('toolbar tokens reflected in CSS', () => {
    it('has toolbar padding from spec', () => {
      expect(css).toContain('--toolbar-padding: 0 12px');
    });

    it('has toolbar divider-gap from spec', () => {
      expect(css).toContain('--toolbar-divider-gap: 8px');
    });
  });

  describe('sidebar tokens reflected in CSS', () => {
    it('has sidebar padding from spec', () => {
      expect(css).toContain('--sidebar-padding: 12px');
    });
  });

  describe('properties panel tokens reflected in CSS', () => {
    it('has properties padding from spec', () => {
      expect(css).toContain('--properties-padding: 16px');
    });

    it('has properties header-height from spec', () => {
      expect(css).toContain('--properties-header-height: 48px');
    });
  });

  describe('animations', () => {
    it('has cs-node-enter keyframe with bounce (3-frame)', () => {
      expect(css).toContain('@keyframes cs-node-enter');
      expect(css).toContain('scale(0.85)');
      expect(css).toContain('scale(1.03)');
      expect(css).toContain('scale(1)');
    });

    it('has cs-running-pulse with correct glow spread (8px)', () => {
      expect(css).toContain('@keyframes cs-running-pulse');
      expect(css).toContain('0 0 8px 2px');
    });

    it('has cs-error-pulse with correct glow spread (6px)', () => {
      expect(css).toContain('@keyframes cs-error-pulse');
      expect(css).toContain('0 0 6px 2px');
    });

    it('has cs-edge-flow keyframe', () => {
      expect(css).toContain('@keyframes cs-edge-flow');
    });

    it('has cs-edge-draw keyframe', () => {
      expect(css).toContain('@keyframes cs-edge-draw');
    });
  });
});

// ── Tailwind ↔ Token Consistency ─────────────────────────────────

describe('canvas-theme.ts — consistency with tokens', () => {
  const twSource = loadTailwind('canvas-theme.ts');
  const tokens = loadTokens('canvas.json');
  const canvas = (tokens as { crewspace: { canvas: Record<string, unknown> } }).crewspace.canvas;

  it('references TASK-139 for QA traceability', () => {
    expect(twSource).toContain('TASK-139');
  });

  describe('color tokens in Tailwind', () => {
    const nodeTypes = ['agent', 'task', 'tool', 'llm'] as const;

    for (const nodeType of nodeTypes) {
      it(`has node.${nodeType} colors`, () => {
        expect(twSource).toContain(`${nodeType}:`);
      });
    }

    it('has node state colors', () => {
      expect(twSource).toContain("running: '#34d399'");
      expect(twSource).toContain("error: '#fb7185'");
    });

    it('has handle colors', () => {
      expect(twSource).toContain("bg: '#1e293b'");
      expect(twSource).toContain("border: '#64748b'");
      expect(twSource).toContain("'hover-bg': '#7c3aed'");
      expect(twSource).toContain("'hover-border': '#a78bfa'");
      expect(twSource).toContain("'connected-bg': '#8b5cf6'");
    });

    it('has edge colors', () => {
      expect(twSource).toContain("DEFAULT: '#64748b'");
      expect(twSource).toContain("active: '#a78bfa'");
      expect(twSource).toContain("'data-flow': '#38bdf8'");
    });

    it('has canvas utility colors', () => {
      expect(twSource).toContain("'grid-dot'");
      expect(twSource).toContain("'grid-line'");
      expect(twSource).toContain("'selection-bg'");
      expect(twSource).toContain("'selection-border'");
      expect(twSource).toContain("'minimap-bg'");
      expect(twSource).toContain("'minimap-viewport'");
    });

    it('has edge-label-bg color', () => {
      expect(twSource).toContain("'edge-label-bg'");
    });

    it('has border semantic colors', () => {
      expect(twSource).toContain("subtle: '#1e293b'");
      expect(twSource).toContain("strong: '#64748b'");
      expect(twSource).toContain("focus: '#8b5cf6'");
    });

    it('has text semantic colors', () => {
      expect(twSource).toContain("primary: '#f8fafc'");
      expect(twSource).toContain("secondary: '#94a3b8'");
      expect(twSource).toContain("tertiary: '#64748b'");
      expect(twSource).toContain("inverse: '#0f172a'");
    });
  });

  describe('spacing tokens in Tailwind', () => {
    it('has node spacing', () => {
      expect(twSource).toContain("'node-w'");
      expect(twSource).toContain("'node-gap': '6px'");
    });

    it('has node header height', () => {
      expect(twSource).toContain("'node-header-h': '40px'");
    });

    it('has toolbar spacing from spec', () => {
      expect(twSource).toContain("'toolbar-padding': '0 12px'");
      expect(twSource).toContain("'toolbar-divider-gap': '8px'");
    });

    it('has sidebar spacing from spec', () => {
      expect(twSource).toContain("'sidebar-padding': '12px'");
    });

    it('has properties spacing from spec', () => {
      expect(twSource).toContain("'properties-padding': '16px'");
      expect(twSource).toContain("'properties-header-h': '48px'");
    });

    it('has minimap margin', () => {
      expect(twSource).toContain("'minimap-margin': '16px'");
    });

    it('has grid sizing', () => {
      expect(twSource).toContain("'canvas-grid-size': '20px'");
      expect(twSource).toContain("'canvas-snap-grid': '10px'");
    });

    it('has edge arrow size', () => {
      expect(twSource).toContain("'edge-arrow-size': '12px'");
    });

    it('has handle sizing', () => {
      expect(twSource).toContain("'handle-size': '10px'");
      expect(twSource).toContain("'handle-hit-area': '20px'");
      expect(twSource).toContain("'handle-border-width': '2px'");
    });
  });

  describe('borderRadius tokens in Tailwind', () => {
    it('has node radius', () => {
      expect(twSource).toContain("node: '10px'");
    });

    it('has minimap radius matching token', () => {
      const minimapRadius = ((canvas.minimap as Record<string, any>)['border-radius'] as { value: string }).value;
      expect(twSource).toContain(`minimap: '${minimapRadius}'`);
    });

    it('has edge-label radius from spec', () => {
      expect(twSource).toContain("'edge-label': '4px'");
    });
  });

  describe('animation tokens in Tailwind', () => {
    it('has node-enter animation with spring easing', () => {
      expect(twSource).toContain("'node-enter'");
      expect(twSource).toContain('cubic-bezier(0.34,1.56,0.64,1)');
    });

    it('has edge-draw animation', () => {
      expect(twSource).toContain("'edge-draw'");
      expect(twSource).toContain('300ms ease-out');
    });

    it('has running-pulse animation', () => {
      expect(twSource).toContain("'running-pulse'");
      expect(twSource).toContain('1.5s ease-in-out infinite');
    });
  });

  describe('keyframe consistency with node-styles spec', () => {
    it('node-enter keyframe has 3 steps (bounce)', () => {
      expect(twSource).toContain("'0%'");
      expect(twSource).toContain("'60%'");
      expect(twSource).toContain("'100%'");
    });

    it('running-pulse uses spec glow-spread (8px) and alpha (0.35)', () => {
      expect(twSource).toContain("'0 0 8px 2px rgba(52,211,153,0.35)'");
    });

    it('error-pulse uses spec glow-spread (6px) and color (244,63,94,0.3)', () => {
      expect(twSource).toContain("'0 0 6px 2px rgba(244,63,94,0.3)'");
    });
  });

  describe('opacity tokens in Tailwind', () => {
    it('has minimap opacity matching token', () => {
      const minimapOpacity = ((canvas.minimap as Record<string, any>).opacity as { value: string }).value;
      expect(twSource).toContain(`minimap: '${minimapOpacity}'`);
    });

    it('has node disabled opacity from spec', () => {
      expect(twSource).toContain("'node-disabled': '0.4'");
    });
  });
});

// ── Cross-file Consistency ───────────────────────────────────────

describe('canvas CSS ↔ Tailwind cross-file consistency', () => {
  const css = loadCSS('canvas-variables.css');
  const twSource = loadTailwind('canvas-theme.ts');

  it('both files reference the same background color', () => {
    expect(css).toContain('--cs-surface-canvas: #0a0e1a');
    expect(twSource).toContain("canvas: '#0a0e1a'");
  });

  it('both files have matching node selection ring color', () => {
    expect(css).toContain('--node-selected-ring: #8b5cf6');
    expect(twSource).toContain("ring: '#8b5cf6'");
  });

  it('both files have matching handle bg color', () => {
    expect(css).toContain('--handle-bg: #1e293b');
    expect(twSource).toContain("bg: '#1e293b'");
  });

  it('both files have matching handle hover-bg color', () => {
    expect(css).toContain('--handle-hover-bg: #7c3aed');
    expect(twSource).toContain("'hover-bg': '#7c3aed'");
  });

  it('both files have matching edge default color', () => {
    expect(css).toContain('--edge-default: #64748b');
    expect(twSource).toContain("DEFAULT: '#64748b'");
  });

  it('both files have matching node disabled opacity', () => {
    expect(css).toContain('--node-disabled-opacity: 0.4');
    expect(twSource).toContain("'node-disabled': '0.4'");
  });

  it('node-enter animation exists in both CSS and Tailwind', () => {
    expect(css).toContain('@keyframes cs-node-enter');
    expect(twSource).toContain("'node-enter'");
  });

  it('edge-draw animation exists in both CSS and Tailwind', () => {
    expect(css).toContain('@keyframes cs-edge-draw');
    expect(twSource).toContain("'edge-draw'");
  });

  it('edge-flow animation exists in both CSS and Tailwind', () => {
    expect(css).toContain('@keyframes cs-edge-flow');
    expect(twSource).toContain("'edge-flow'");
  });
});

// ── Token ↔ Spec Value Verification ─────────────────────────────

describe('canvas tokens match design spec values', () => {
  const tokens = loadTokens('canvas.json');
  const canvas = (tokens as { crewspace: { canvas: Record<string, unknown> } }).crewspace.canvas;

  it('agent border color matches spec (violet-600: #7c3aed)', () => {
    expect(((canvas.node as any)['agent-border'] as { value: string }).value).toBe('#7c3aed');
  });

  it('task border color matches spec (sky-600: #0284c7)', () => {
    expect(((canvas.node as any)['task-border'] as { value: string }).value).toBe('#0284c7');
  });

  it('tool border color matches spec (emerald-600: #059669)', () => {
    expect(((canvas.node as any)['tool-border'] as { value: string }).value).toBe('#059669');
  });

  it('llm border color matches spec (amber-600: #d97706)', () => {
    expect(((canvas.node as any)['llm-border'] as { value: string }).value).toBe('#d97706');
  });

  it('running-pulse color matches spec (emerald: #34d399)', () => {
    expect(((canvas.node as any)['running-pulse'] as { value: string }).value).toBe('#34d399');
  });

  it('error-pulse color matches spec (rose: #fb7185)', () => {
    expect(((canvas.node as any)['error-pulse'] as { value: string }).value).toBe('#fb7185');
  });

  it('handle connected-bg matches spec (#8b5cf6)', () => {
    expect(((canvas.handle as any)['connected-bg'] as { value: string }).value).toBe('#8b5cf6');
  });

  it('edge smoothstep type matches spec', () => {
    expect(((canvas.edge as any).type as { value: string }).value).toBe('smoothstep');
  });

  it('minimap dimensions match spec (200×140px)', () => {
    expect(((canvas.minimap as any).width as { value: string }).value).toBe('200px');
    expect(((canvas.minimap as any).height as { value: string }).value).toBe('140px');
  });
});
