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

// ── Integration Card Token JSON ───────────────────────────────────

describe('integration-card.json — design tokens', () => {
  const tokens = loadTokens('integration-card.json');

  it('has DTCG schema reference', () => {
    expect(tokens.$schema).toBe('https://design-tokens.github.io/community-group/format/');
  });

  it('has crewspace.integrationCard namespace', () => {
    expect(tokens).toHaveProperty('crewspace');
    const crewspace = tokens.crewspace as Record<string, unknown>;
    expect(crewspace).toHaveProperty('integrationCard');
  });

  const integrationCard = (tokens as { crewspace: { integrationCard: Record<string, unknown> } }).crewspace.integrationCard;

  it('contains required top-level sections', () => {
    const requiredSections = [
      'card',
      'sizing',
      'logo',
      'title',
      'provider',
      'description',
      'oauthStatus',
      'connectButton',
      'divider',
      'footer',
      'scopesBadge',
      'skeleton',
      'animation',
    ];
    for (const section of requiredSections) {
      expect(integrationCard).toHaveProperty(section);
    }
  });

  it('has a _description field for task traceability', () => {
    expect(integrationCard._description).toContain('TASK-164');
  });

  describe('token leaf values', () => {
    const leaves = collectTokenLeaves(integrationCard);

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
        'color', 'sizing', 'number', 'borderRadius', 'boxShadow',
        'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
        'duration', 'cubicBezier', 'gradient',
      ];
      for (const leaf of leaves) {
        expect(validTypes, `${leaf.path} has type "${leaf.type}"`).toContain(leaf.type);
      }
    });
  });

  describe('logo section', () => {
    const logo = integrationCard.logo as Record<string, Record<string, unknown>>;

    it('has container size tokens', () => {
      expect(logo).toHaveProperty('container-size');
      expect(logo).toHaveProperty('container-size-sm');
    });

    it('has icon size tokens', () => {
      expect(logo).toHaveProperty('icon-size');
      expect(logo).toHaveProperty('icon-size-sm');
    });

    it('has visual styling tokens', () => {
      expect(logo).toHaveProperty('container-bg');
      expect(logo).toHaveProperty('container-border');
      expect(logo).toHaveProperty('container-radius');
      expect(logo).toHaveProperty('placeholder-color');
      expect(logo).toHaveProperty('shadow');
    });
  });

  describe('OAuth status section', () => {
    const oauthStatus = integrationCard.oauthStatus as Record<string, Record<string, unknown>>;

    it('has connected state tokens', () => {
      expect(oauthStatus).toHaveProperty('connected-bg');
      expect(oauthStatus).toHaveProperty('connected-text');
      expect(oauthStatus).toHaveProperty('connected-icon');
      expect(oauthStatus).toHaveProperty('connected-border');
    });

    it('has disconnected state tokens', () => {
      expect(oauthStatus).toHaveProperty('disconnected-bg');
      expect(oauthStatus).toHaveProperty('disconnected-text');
      expect(oauthStatus).toHaveProperty('disconnected-icon');
      expect(oauthStatus).toHaveProperty('disconnected-border');
    });

    it('has pending state tokens', () => {
      expect(oauthStatus).toHaveProperty('pending-bg');
      expect(oauthStatus).toHaveProperty('pending-text');
      expect(oauthStatus).toHaveProperty('pending-icon');
      expect(oauthStatus).toHaveProperty('pending-border');
    });

    it('has error state tokens', () => {
      expect(oauthStatus).toHaveProperty('error-bg');
      expect(oauthStatus).toHaveProperty('error-text');
      expect(oauthStatus).toHaveProperty('error-icon');
      expect(oauthStatus).toHaveProperty('error-border');
    });

    it('has sizing tokens for the badge', () => {
      expect(oauthStatus).toHaveProperty('height');
      expect(oauthStatus).toHaveProperty('radius');
      expect(oauthStatus).toHaveProperty('icon-size');
      expect(oauthStatus).toHaveProperty('font-size');
    });
  });

  describe('connect button section', () => {
    const btn = integrationCard.connectButton as Record<string, Record<string, unknown>>;

    it('has default connect state', () => {
      expect(btn).toHaveProperty('default-bg');
      expect(btn).toHaveProperty('default-bg-hover');
      expect(btn).toHaveProperty('default-text');
      expect(btn).toHaveProperty('default-shadow');
    });

    it('has disconnect state', () => {
      expect(btn).toHaveProperty('disconnect-bg');
      expect(btn).toHaveProperty('disconnect-bg-hover');
      expect(btn).toHaveProperty('disconnect-text-hover');
    });

    it('has reconnect state', () => {
      expect(btn).toHaveProperty('reconnect-bg');
      expect(btn).toHaveProperty('reconnect-bg-hover');
      expect(btn).toHaveProperty('reconnect-text');
    });
  });

  describe('description section', () => {
    const desc = integrationCard.description as Record<string, Record<string, unknown>>;

    it('has typography tokens', () => {
      expect(desc).toHaveProperty('color');
      expect(desc).toHaveProperty('font-size');
      expect(desc).toHaveProperty('font-weight');
      expect(desc).toHaveProperty('line-height');
    });

    it('has layout tokens', () => {
      expect(desc).toHaveProperty('max-lines');
      expect(desc).toHaveProperty('min-height');
      expect(desc).toHaveProperty('margin-top');
    });
  });

  describe('animation tokens', () => {
    const anim = integrationCard.animation as Record<string, { value: string }>;

    it('includes card, status, and spinner durations', () => {
      expect(anim).toHaveProperty('card-enter-duration');
      expect(anim).toHaveProperty('status-transition-duration');
      expect(anim).toHaveProperty('spinner-duration');
      expect(anim).toHaveProperty('pulse-duration');
    });

    it('uses spring easing for card enter', () => {
      expect(anim['card-enter-easing'].value).toContain('cubic-bezier');
    });

    it('has stagger delay for sequential card animation', () => {
      expect(anim['stagger-delay'].value).toBe('50ms');
      expect(anim['max-stagger'].value).toBe('600ms');
    });
  });
});

// ── Integration Card CSS Variables ────────────────────────────────

describe('integration-card-variables.css — custom properties', () => {
  const css = loadCSS('integration-card-variables.css');

  it('contains TASK-164 reference', () => {
    expect(css).toContain('TASK-164');
  });

  it('defines the root .cs-integration-card class', () => {
    expect(css).toContain('.cs-integration-card');
  });

  describe('component selectors', () => {
    const requiredSelectors = [
      '.cs-integration-card',
      '.cs-integration-card-logo',
      '.cs-integration-card-title',
      '.cs-integration-card-provider',
      '.cs-integration-card-description',
      '.cs-integration-card-oauth',
      '.cs-integration-card-oauth--connected',
      '.cs-integration-card-oauth--disconnected',
      '.cs-integration-card-oauth--pending',
      '.cs-integration-card-oauth--error',
      '.cs-integration-card-btn',
      '.cs-integration-card-btn--connect',
      '.cs-integration-card-btn--disconnect',
      '.cs-integration-card-btn--reconnect',
      '.cs-integration-card-divider',
      '.cs-integration-card-footer',
      '.cs-integration-card-scopes',
      '.cs-integration-card-skeleton',
    ];

    for (const selector of requiredSelectors) {
      it(`has ${selector}`, () => {
        expect(css).toContain(selector);
      });
    }
  });

  describe('animations', () => {
    const requiredKeyframes = [
      'cs-ic-card-enter',
      'cs-ic-status-change',
      'cs-ic-connected-pulse',
      'cs-ic-spinner',
      'cs-ic-skeleton-shimmer',
      'cs-ic-error-shake',
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

  describe('OAuth status variables', () => {
    it('defines connected status variables', () => {
      expect(css).toContain('--oauth-bg: rgba(52, 211, 153');
      expect(css).toContain('--oauth-text: #34d399');
    });

    it('defines disconnected status variables', () => {
      expect(css).toContain('--oauth-bg: rgba(148, 163, 184');
    });

    it('defines pending status variables', () => {
      expect(css).toContain('--oauth-bg: rgba(251, 191, 36');
      expect(css).toContain('--oauth-text: #fbbf24');
    });

    it('defines error status variables', () => {
      expect(css).toContain('--oauth-bg: rgba(251, 113, 133');
      expect(css).toContain('--oauth-text: #fb7185');
    });
  });

  describe('logo variables', () => {
    it('defines logo container size', () => {
      expect(css).toContain('--logo-size: 48px');
    });

    it('defines logo background', () => {
      expect(css).toContain('--logo-bg');
    });

    it('defines logo placeholder color', () => {
      expect(css).toContain('--logo-placeholder-color');
    });
  });

  describe('connect button variables', () => {
    it('defines connect button background', () => {
      expect(css).toContain('--btn-bg: #7c3aed');
    });

    it('defines disconnect button hover', () => {
      expect(css).toContain('--btn-bg-hover: rgba(251, 113, 133');
    });

    it('defines reconnect button', () => {
      expect(css).toContain('--btn-text: #fbbf24');
    });
  });
});

// ── Integration Card Tailwind Theme ───────────────────────────────

describe('integration-card-theme.ts — Tailwind theme extension', () => {
  const themeSource = readFileSync(resolve(TAILWIND_DIR, 'integration-card-theme.ts'), 'utf-8');

  it('exports integrationCardTheme as const', () => {
    expect(themeSource).toContain('export const integrationCardTheme');
    expect(themeSource).toContain('as const');
  });

  it('contains TASK-164 reference', () => {
    expect(themeSource).toContain('TASK-164');
  });

  describe('theme sections', () => {
    const requiredSections = ['colors', 'spacing', 'fontSize', 'borderRadius', 'boxShadow', 'animation', 'keyframes'];
    for (const section of requiredSections) {
      it(`has ${section} section`, () => {
        expect(themeSource).toContain(`${section}:`);
      });
    }
  });

  describe('color groups', () => {
    const requiredColorGroups = [
      'ic-card',
      'ic-logo',
      'ic-title',
      'ic-provider',
      'ic-description',
      'ic-oauth',
      'ic-connect-btn',
      'ic-disconnect-btn',
      'ic-reconnect-btn',
      'ic-divider',
      'ic-footer',
      'ic-scopes',
      'ic-skeleton',
    ];

    for (const group of requiredColorGroups) {
      it(`has '${group}' color group`, () => {
        expect(themeSource).toContain(`'${group}'`);
      });
    }
  });

  describe('spacing tokens', () => {
    const requiredSpacing = [
      'ic-card-w',
      'ic-card-min-w',
      'ic-card-max-w',
      'ic-card-gap',
      'ic-card-p',
      'ic-logo-size',
      'ic-oauth-h',
      'ic-btn-h',
      'ic-footer-pt',
      'ic-scopes-h',
    ];

    for (const token of requiredSpacing) {
      it(`has '${token}' spacing`, () => {
        expect(themeSource).toContain(`'${token}'`);
      });
    }
  });

  describe('fontSize presets', () => {
    const requiredFontSizes = [
      'ic-title',
      'ic-provider',
      'ic-description',
      'ic-oauth-label',
      'ic-btn',
      'ic-footer-meta',
      'ic-scopes',
    ];

    for (const preset of requiredFontSizes) {
      it(`has '${preset}' fontSize preset`, () => {
        expect(themeSource).toContain(`'${preset}'`);
      });
    }
  });

  describe('animation keyframes', () => {
    const requiredKeyframes = [
      'ic-card-enter',
      'ic-status-change',
      'ic-connected-pulse',
      'ic-spinner',
      'ic-skeleton-shimmer',
      'ic-error-shake',
    ];

    for (const kf of requiredKeyframes) {
      it(`has '${kf}' keyframe`, () => {
        expect(themeSource).toContain(`'${kf}'`);
      });
    }
  });

  describe('OAuth color tokens', () => {
    it('has all four OAuth state colors', () => {
      expect(themeSource).toContain("'connected-bg'");
      expect(themeSource).toContain("'disconnected-bg'");
      expect(themeSource).toContain("'pending-bg'");
      expect(themeSource).toContain("'error-bg'");
    });
  });

  it('uses ic- prefix consistently for spacing keys', () => {
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
        expect(key, `spacing key "${key}" should start with ic-`).toMatch(/^ic-/);
      }
    }
  });
});
