/**
 * Crewspace Icon System — Comprehensive tests
 * TASK-127: Validates icon design tokens across all output formats
 *
 * Tests cover:
 *  1. DTCG JSON schema compliance for icon tokens
 *  2. Icon registry completeness and structure
 *  3. CSS variables file correctness
 *  4. Tailwind theme extension structure
 *  5. TypeScript token constants
 *  6. Cross-format consistency
 *  7. Node-type icon mapping coverage
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { iconsTheme } from '../tailwind/icons-theme.js';
import {
  iconRegistry,
  ICON_CATEGORIES,
  ICON_COUNT,
  getIconData,
  getIconsByCategory,
  hasIcon,
} from '../icons/registry.js';
import {
  iconSize,
  iconStroke,
  iconColor,
  nodeTypeIcons,
} from '../icons/tokens.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
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
/* 1. DTCG JSON Token Schema — icons.json                              */
/* ================================================================== */
describe('DTCG JSON tokens — icons.json', () => {
  const tokens = loadTokens('icons.json') as Record<string, unknown>;

  it('has $schema field pointing to DTCG community group', () => {
    expect(tokens.$schema).toContain('design-tokens.github.io');
  });

  it('has top-level crewspace namespace', () => {
    expect(tokens).toHaveProperty('crewspace');
  });

  it('has icon namespace under crewspace', () => {
    const cs = tokens.crewspace as Record<string, unknown>;
    expect(cs).toHaveProperty('icon');
  });

  it('has size tokens with all scale steps', () => {
    const cs = tokens.crewspace as Record<string, unknown>;
    const icon = cs.icon as Record<string, unknown>;
    const size = icon.size as Record<string, unknown>;
    const expectedSizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    for (const s of expectedSizes) {
      expect(size).toHaveProperty(s);
    }
  });

  it('has stroke tokens', () => {
    const cs = tokens.crewspace as Record<string, unknown>;
    const icon = cs.icon as Record<string, unknown>;
    const stroke = icon.stroke as Record<string, unknown>;
    expect(stroke).toHaveProperty('thin');
    expect(stroke).toHaveProperty('default');
    expect(stroke).toHaveProperty('bold');
  });

  it('has category definitions for all icon groups', () => {
    const cs = tokens.crewspace as Record<string, unknown>;
    const icon = cs.icon as Record<string, unknown>;
    const category = icon.category as Record<string, unknown>;
    const expectedCategories = [
      'navigation', 'action', 'node', 'status', 'content',
      'layout', 'communication', 'workflow', 'brand',
    ];
    for (const cat of expectedCategories) {
      expect(category).toHaveProperty(cat);
    }
  });

  it('size tokens have $value and $type fields', () => {
    const cs = tokens.crewspace as Record<string, unknown>;
    const icon = cs.icon as Record<string, unknown>;
    const size = icon.size as Record<string, Record<string, string>>;
    for (const [key, val] of Object.entries(size)) {
      if (key.startsWith('$')) continue;
      expect(val).toHaveProperty('$value');
      expect(val).toHaveProperty('$type');
      expect(val.$type).toBe('dimension');
    }
  });

  it('category icon tokens have $value and $type string fields', () => {
    const cs = tokens.crewspace as Record<string, unknown>;
    const icon = cs.icon as Record<string, unknown>;
    const category = icon.category as Record<string, Record<string, Record<string, string>>>;
    for (const [catKey, catVal] of Object.entries(category)) {
      if (catKey.startsWith('$')) continue;
      for (const [iconKey, iconVal] of Object.entries(catVal)) {
        if (iconKey.startsWith('$')) continue;
        expect(iconVal.$type).toBe('string');
        expect(typeof iconVal.$value).toBe('string');
      }
    }
  });
});

/* ================================================================== */
/* 2. Icon Registry — Completeness and Structure                       */
/* ================================================================== */
describe('Icon registry — completeness', () => {
  it('has a meaningful number of icons (≥ 60)', () => {
    expect(ICON_COUNT).toBeGreaterThanOrEqual(60);
  });

  it('every icon in the registry has paths or elements array', () => {
    for (const [name, data] of Object.entries(iconRegistry)) {
      const hasPaths = Array.isArray(data.paths) && data.paths.length > 0;
      const hasElements = Array.isArray(data.elements) && data.elements.length > 0;
      expect(hasPaths || hasElements).toBe(true);
    }
  });

  it('all icons in ICON_CATEGORIES exist in the registry', () => {
    for (const [category, icons] of Object.entries(ICON_CATEGORIES)) {
      for (const iconName of icons) {
        expect(
          hasIcon(iconName),
          `Icon "${iconName}" from category "${category}" not found in registry`,
        ).toBe(true);
      }
    }
  });

  it('has all 9 expected icon categories', () => {
    const categories = Object.keys(ICON_CATEGORIES);
    expect(categories).toContain('navigation');
    expect(categories).toContain('action');
    expect(categories).toContain('node');
    expect(categories).toContain('status');
    expect(categories).toContain('content');
    expect(categories).toContain('layout');
    expect(categories).toContain('communication');
    expect(categories).toContain('workflow');
    expect(categories).toContain('brand');
  });

  it('getIconData returns correct data for known icon', () => {
    const home = getIconData('home');
    expect(home).toBeDefined();
    expect(home!.paths.length).toBeGreaterThanOrEqual(1);
  });

  it('getIconData returns undefined for unknown icon', () => {
    expect(getIconData('nonexistent-icon-xyz')).toBeUndefined();
  });

  it('getIconsByCategory returns icons for valid category', () => {
    const navIcons = getIconsByCategory('navigation');
    expect(navIcons.length).toBeGreaterThanOrEqual(5);
    expect(navIcons).toContain('home');
  });

  it('hasIcon returns true for registry icons, false for unknown', () => {
    expect(hasIcon('bot')).toBe(true);
    expect(hasIcon('sparkles')).toBe(true);
    expect(hasIcon('not-a-real-icon')).toBe(false);
  });
});

/* ================================================================== */
/* 3. CSS Variables — icons-variables.css                              */
/* ================================================================== */
describe('CSS variables — icons-variables.css', () => {
  const css = loadCss('icons-variables.css');

  it('declares :root block', () => {
    expect(css).toContain(':root');
  });

  it('has all icon size variables', () => {
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl', '2xl']) {
      expect(css).toContain(`--cs-icon-size-${size}:`);
    }
  });

  it('has all stroke width variables', () => {
    expect(css).toContain('--cs-icon-stroke-thin:');
    expect(css).toContain('--cs-icon-stroke-default:');
    expect(css).toContain('--cs-icon-stroke-bold:');
  });

  it('has semantic icon color variables', () => {
    for (const color of ['default', 'primary', 'muted', 'brand', 'success', 'warning', 'error', 'info']) {
      expect(css).toContain(`--cs-icon-color-${color}:`);
    }
  });

  it('has node-type icon color variables', () => {
    for (const nodeType of ['agent', 'task', 'tool', 'llm']) {
      expect(css).toContain(`--cs-icon-color-${nodeType}:`);
    }
  });

  it('has interactive state variables', () => {
    expect(css).toContain('--cs-icon-color-hover:');
    expect(css).toContain('--cs-icon-color-disabled:');
    expect(css).toContain('--cs-icon-opacity-disabled:');
  });

  it('has icon transition variable', () => {
    expect(css).toContain('--cs-icon-transition:');
  });

  it('has light mode overrides', () => {
    expect(css).toContain("[data-theme='light']");
  });

  it('has utility classes for icon sizes', () => {
    expect(css).toContain('.cs-icon--xs');
    expect(css).toContain('.cs-icon--md');
    expect(css).toContain('.cs-icon--xl');
  });

  it('has utility classes for icon colors', () => {
    expect(css).toContain('.cs-icon--brand');
    expect(css).toContain('.cs-icon--success');
    expect(css).toContain('.cs-icon--error');
  });

  it('has node-type utility classes', () => {
    expect(css).toContain('.cs-icon--agent');
    expect(css).toContain('.cs-icon--task');
    expect(css).toContain('.cs-icon--tool');
    expect(css).toContain('.cs-icon--llm');
  });

  it('has disabled state utility class', () => {
    expect(css).toContain('.cs-icon--disabled');
  });
});

/* ================================================================== */
/* 4. Tailwind Theme — icons-theme.ts                                  */
/* ================================================================== */
describe('Tailwind icons-theme', () => {
  it('has width utilities for all icon sizes', () => {
    const w = iconsTheme.width;
    expect(w).toHaveProperty('icon-xs');
    expect(w).toHaveProperty('icon-sm');
    expect(w).toHaveProperty('icon-md');
    expect(w).toHaveProperty('icon-lg');
    expect(w).toHaveProperty('icon-xl');
    expect(w).toHaveProperty('icon-2xl');
  });

  it('has height utilities for all icon sizes', () => {
    const h = iconsTheme.height;
    expect(h).toHaveProperty('icon-xs');
    expect(h).toHaveProperty('icon-md');
    expect(h).toHaveProperty('icon-2xl');
  });

  it('has size utilities matching width/height', () => {
    expect(iconsTheme.size['icon-md']).toBe(iconsTheme.width['icon-md']);
    expect(iconsTheme.size['icon-lg']).toBe(iconsTheme.height['icon-lg']);
  });

  it('has icon color tokens', () => {
    const c = iconsTheme.colors.icon;
    expect(c).toHaveProperty('DEFAULT');
    expect(c).toHaveProperty('brand');
    expect(c).toHaveProperty('success');
    expect(c).toHaveProperty('error');
    expect(c).toHaveProperty('agent');
    expect(c).toHaveProperty('task');
    expect(c).toHaveProperty('tool');
    expect(c).toHaveProperty('llm');
  });

  it('color values reference CSS variables with fallbacks', () => {
    expect(iconsTheme.colors.icon.brand).toContain('var(--cs-icon-color-brand');
    expect(iconsTheme.colors.icon.brand).toContain('#7c3aed');
  });

  it('has strokeWidth utilities', () => {
    expect(iconsTheme.strokeWidth).toHaveProperty('icon-thin');
    expect(iconsTheme.strokeWidth).toHaveProperty('icon-default');
    expect(iconsTheme.strokeWidth).toHaveProperty('icon-bold');
  });

  it('width values reference CSS variables', () => {
    expect(iconsTheme.width['icon-md']).toContain('var(--cs-icon-size-md');
  });
});

/* ================================================================== */
/* 5. TypeScript Token Constants                                       */
/* ================================================================== */
describe('TypeScript icon tokens', () => {
  it('iconSize has all scale values as numbers', () => {
    expect(iconSize.xs).toBe(12);
    expect(iconSize.sm).toBe(16);
    expect(iconSize.md).toBe(20);
    expect(iconSize.lg).toBe(24);
    expect(iconSize.xl).toBe(32);
    expect(iconSize['2xl']).toBe(48);
  });

  it('iconSize follows ascending order', () => {
    expect(iconSize.xs).toBeLessThan(iconSize.sm);
    expect(iconSize.sm).toBeLessThan(iconSize.md);
    expect(iconSize.md).toBeLessThan(iconSize.lg);
    expect(iconSize.lg).toBeLessThan(iconSize.xl);
    expect(iconSize.xl).toBeLessThan(iconSize['2xl']);
  });

  it('iconStroke has correct weight values', () => {
    expect(iconStroke.thin).toBe(1.25);
    expect(iconStroke.default).toBe(1.75);
    expect(iconStroke.bold).toBe(2.25);
  });

  it('iconStroke follows ascending weight order', () => {
    expect(iconStroke.thin).toBeLessThan(iconStroke.default);
    expect(iconStroke.default).toBeLessThan(iconStroke.bold);
  });

  it('iconColor has all semantic keys referencing CSS variables', () => {
    expect(iconColor.default).toContain('var(--cs-icon-color-default)');
    expect(iconColor.brand).toContain('var(--cs-icon-color-brand)');
    expect(iconColor.success).toContain('var(--cs-icon-color-success)');
    expect(iconColor.agent).toContain('var(--cs-icon-color-agent)');
  });
});

/* ================================================================== */
/* 6. Cross-format Consistency                                         */
/* ================================================================== */
describe('Cross-format consistency — icons', () => {
  const jsonTokens = loadTokens('icons.json') as Record<string, unknown>;
  const cs = jsonTokens.crewspace as Record<string, unknown>;
  const icon = cs.icon as Record<string, unknown>;
  const css = loadCss('icons-variables.css');

  it('JSON icon size.md matches TS iconSize.md', () => {
    const size = icon.size as Record<string, { $value: string }>;
    expect(size.md.$value).toBe('20px');
    expect(iconSize.md).toBe(20);
  });

  it('JSON icon stroke.default matches TS iconStroke.default', () => {
    const stroke = icon.stroke as Record<string, { $value: string }>;
    expect(stroke.default.$value).toBe('1.75');
    expect(iconStroke.default).toBe(1.75);
  });

  it('CSS --cs-icon-size-md matches JSON and TS values', () => {
    expect(css).toContain('--cs-icon-size-md: 20px');
  });

  it('CSS --cs-icon-stroke-default matches JSON and TS values', () => {
    expect(css).toContain('--cs-icon-stroke-default: 1.75');
  });

  it('Tailwind icon width references CSS variable matching CSS file', () => {
    expect(iconsTheme.width['icon-md']).toContain('--cs-icon-size-md');
    expect(css).toContain('--cs-icon-size-md:');
  });

  it('JSON category node icons exist in TS nodeTypeIcons', () => {
    const category = icon.category as Record<string, Record<string, { $value: string }>>;
    const nodeCategory = category.node;
    expect(nodeCategory.agent.$value).toBe(nodeTypeIcons.agent.primary);
    expect(nodeCategory.task.$value).toBe(nodeTypeIcons.task.primary);
    expect(nodeCategory.tool.$value).toBe(nodeTypeIcons.tool.primary);
    expect(nodeCategory.llm.$value).toBe(nodeTypeIcons.llm.primary);
  });
});

/* ================================================================== */
/* 7. Node-Type Icon Mapping Coverage                                  */
/* ================================================================== */
describe('Node-type icon mapping', () => {
  it('all node types have a primary icon', () => {
    for (const nodeType of Object.keys(nodeTypeIcons)) {
      const icons = nodeTypeIcons[nodeType as keyof typeof nodeTypeIcons];
      expect(icons).toHaveProperty('primary');
    }
  });

  it('all node type icons exist in the icon registry', () => {
    for (const [nodeType, subtypes] of Object.entries(nodeTypeIcons)) {
      for (const [subtype, iconName] of Object.entries(subtypes)) {
        expect(
          hasIcon(iconName),
          `Icon "${iconName}" for ${nodeType}.${subtype} not found in registry`,
        ).toBe(true);
      }
    }
  });

  it('covers all four canvas node types', () => {
    expect(nodeTypeIcons).toHaveProperty('agent');
    expect(nodeTypeIcons).toHaveProperty('task');
    expect(nodeTypeIcons).toHaveProperty('tool');
    expect(nodeTypeIcons).toHaveProperty('llm');
  });

  it('agent subtypes include specialized roles', () => {
    const agent = nodeTypeIcons.agent;
    expect(agent).toHaveProperty('researcher');
    expect(agent).toHaveProperty('writer');
    expect(agent).toHaveProperty('analyst');
    expect(agent).toHaveProperty('coordinator');
    expect(agent).toHaveProperty('coder');
    expect(agent).toHaveProperty('reviewer');
    expect(agent).toHaveProperty('custom');
  });

  it('task subtypes include flow control patterns', () => {
    const task = nodeTypeIcons.task;
    expect(task).toHaveProperty('sequential');
    expect(task).toHaveProperty('parallel');
    expect(task).toHaveProperty('conditional');
    expect(task).toHaveProperty('loop');
    expect(task).toHaveProperty('human-input');
  });
});
