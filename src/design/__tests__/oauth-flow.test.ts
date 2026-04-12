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

// ── OAuth Flow Token JSON ─────────────────────────────────────────

describe('oauth-flow.json — design tokens', () => {
  const tokens = loadTokens('oauth-flow.json');

  it('has DTCG schema reference', () => {
    expect(tokens.$schema).toBe('https://design-tokens.github.io/community-group/format/');
  });

  it('has crewspace.oauthFlow namespace', () => {
    expect(tokens).toHaveProperty('crewspace');
    const crewspace = tokens.crewspace as Record<string, unknown>;
    expect(crewspace).toHaveProperty('oauthFlow');
  });

  it('has TASK-165 reference in metadata', () => {
    const metadata = tokens.$metadata as Record<string, unknown>;
    expect(metadata.taskRef).toBe('TASK-165');
  });

  const oauthFlow = (tokens as { crewspace: { oauthFlow: Record<string, unknown> } }).crewspace
    .oauthFlow;

  it('contains required top-level sections', () => {
    const requiredSections = [
      'screen',
      'header',
      'providerCard',
      'consent',
      'callback',
      'status',
      'button',
      'accountLink',
      'stepIndicator',
      'animation',
    ];
    for (const section of requiredSections) {
      expect(oauthFlow, `missing section: ${section}`).toHaveProperty(section);
    }
  });

  describe('token leaf values', () => {
    const leaves = collectTokenLeaves(oauthFlow);

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
        'sizing',
        'number',
        'borderRadius',
        'boxShadow',
        'fontSize',
        'fontWeight',
        'lineHeight',
        'letterSpacing',
        'duration',
        'cubicBezier',
        'gradient',
      ];
      for (const leaf of leaves) {
        expect(validTypes, `${leaf.path} has type "${leaf.type}"`).toContain(leaf.type);
      }
    });
  });

  describe('screen section', () => {
    const screen = oauthFlow.screen as Record<string, Record<string, unknown>>;

    it('has layout tokens', () => {
      expect(screen).toHaveProperty('maxWidth');
      expect(screen).toHaveProperty('minHeight');
      expect(screen).toHaveProperty('padding');
      expect(screen).toHaveProperty('borderRadius');
    });

    it('has visual tokens', () => {
      expect(screen).toHaveProperty('background');
      expect(screen).toHaveProperty('overlay');
      expect(screen).toHaveProperty('shadow');
    });
  });

  describe('providerCard section', () => {
    const provider = oauthFlow.providerCard as Record<string, Record<string, unknown>>;

    it('has background and border states', () => {
      expect(provider).toHaveProperty('background');
      expect(provider).toHaveProperty('backgroundHover');
      expect(provider).toHaveProperty('border');
      expect(provider).toHaveProperty('borderHover');
      expect(provider).toHaveProperty('borderSelected');
    });

    it('has icon sizing', () => {
      expect(provider).toHaveProperty('iconSize');
      expect(provider).toHaveProperty('iconRadius');
    });

    it('has name and description typography', () => {
      expect(provider).toHaveProperty('name');
      expect(provider).toHaveProperty('description');
      const name = provider.name as Record<string, Record<string, unknown>>;
      expect(name).toHaveProperty('fontSize');
      expect(name).toHaveProperty('fontWeight');
      expect(name).toHaveProperty('color');
    });
  });

  describe('consent section', () => {
    const consent = oauthFlow.consent as Record<string, unknown>;

    it('has scope item tokens', () => {
      expect(consent).toHaveProperty('scopeItem');
      const scopeItem = consent.scopeItem as Record<string, Record<string, unknown>>;
      expect(scopeItem).toHaveProperty('iconSize');
      expect(scopeItem).toHaveProperty('iconColor');
      expect(scopeItem).toHaveProperty('textColor');
    });

    it('has warning tokens', () => {
      expect(consent).toHaveProperty('warning');
      const warning = consent.warning as Record<string, Record<string, unknown>>;
      expect(warning).toHaveProperty('background');
      expect(warning).toHaveProperty('border');
      expect(warning).toHaveProperty('textColor');
    });
  });

  describe('callback section', () => {
    const callback = oauthFlow.callback as Record<string, Record<string, unknown>>;

    it('has spinner tokens', () => {
      expect(callback).toHaveProperty('spinnerSize');
      expect(callback).toHaveProperty('spinnerTrack');
      expect(callback).toHaveProperty('spinnerArc');
      expect(callback).toHaveProperty('spinnerWidth');
    });

    it('has progress bar tokens', () => {
      expect(callback).toHaveProperty('progressHeight');
      expect(callback).toHaveProperty('progressBackground');
      expect(callback).toHaveProperty('progressFill');
      expect(callback).toHaveProperty('progressRadius');
    });
  });

  describe('status section', () => {
    const status = oauthFlow.status as Record<string, Record<string, unknown>>;

    it('has success state tokens', () => {
      expect(status).toHaveProperty('success');
      const success = status.success as Record<string, Record<string, unknown>>;
      expect(success).toHaveProperty('iconColor');
      expect(success).toHaveProperty('iconBackground');
      expect(success).toHaveProperty('iconSize');
      expect(success).toHaveProperty('checkmarkSize');
    });

    it('has error state tokens', () => {
      expect(status).toHaveProperty('error');
      const error = status.error as Record<string, Record<string, unknown>>;
      expect(error).toHaveProperty('iconColor');
      expect(error).toHaveProperty('iconBackground');
      expect(error).toHaveProperty('retryColor');
      expect(error).toHaveProperty('errorCodeColor');
    });
  });

  describe('button section', () => {
    const button = oauthFlow.button as Record<string, Record<string, unknown>>;

    it('has primary button tokens', () => {
      expect(button).toHaveProperty('primary');
      const primary = button.primary as Record<string, Record<string, unknown>>;
      expect(primary).toHaveProperty('background');
      expect(primary).toHaveProperty('backgroundHover');
      expect(primary).toHaveProperty('text');
    });

    it('has secondary button tokens', () => {
      expect(button).toHaveProperty('secondary');
    });

    it('has danger button tokens', () => {
      expect(button).toHaveProperty('danger');
    });

    it('has shared button sizing', () => {
      expect(button).toHaveProperty('height');
      expect(button).toHaveProperty('paddingX');
      expect(button).toHaveProperty('borderRadius');
    });
  });

  describe('stepIndicator section', () => {
    const step = oauthFlow.stepIndicator as Record<string, Record<string, unknown>>;

    it('has step sizing tokens', () => {
      expect(step).toHaveProperty('size');
      expect(step).toHaveProperty('gap');
      expect(step).toHaveProperty('lineWidth');
    });

    it('has step state colors', () => {
      expect(step).toHaveProperty('activeColor');
      expect(step).toHaveProperty('completedColor');
      expect(step).toHaveProperty('inactiveColor');
    });
  });

  describe('animation tokens', () => {
    const anim = oauthFlow.animation as Record<string, { value: string }>;

    it('includes screen enter/exit durations', () => {
      expect(anim).toHaveProperty('screenEnter');
      expect(anim).toHaveProperty('screenExit');
    });

    it('includes spinner and progress durations', () => {
      expect(anim).toHaveProperty('spinnerRotation');
      expect(anim).toHaveProperty('progressFill');
    });

    it('includes success and error animation durations', () => {
      expect(anim).toHaveProperty('successBounce');
      expect(anim).toHaveProperty('errorShake');
    });

    it('uses spring easing', () => {
      expect(anim.easeSpring.value).toContain('cubic-bezier');
    });

    it('has stagger delay for provider cards', () => {
      expect(anim.staggerDelay.value).toBe('60ms');
      expect(anim.maxStaggerDelay.value).toBe('480ms');
    });
  });
});

// ── OAuth Flow CSS Variables ──────────────────────────────────────

describe('oauth-flow-variables.css — custom properties', () => {
  const css = loadCSS('oauth-flow-variables.css');

  it('contains TASK-165 reference', () => {
    expect(css).toContain('TASK-165');
  });

  it('defines the root .cs-oauth-flow class', () => {
    expect(css).toContain('.cs-oauth-flow');
  });

  describe('component selectors', () => {
    const requiredSelectors = [
      '.cs-oauth-flow',
      '.cs-oauth-flow-header',
      '.cs-oauth-flow-title',
      '.cs-oauth-flow-subtitle',
      '.cs-oauth-flow-provider',
      '.cs-oauth-flow-provider--selected',
      '.cs-oauth-flow-provider-icon',
      '.cs-oauth-flow-provider-name',
      '.cs-oauth-flow-provider-desc',
      '.cs-oauth-flow-consent',
      '.cs-oauth-flow-scope-item',
      '.cs-oauth-flow-consent-warning',
      '.cs-oauth-flow-callback',
      '.cs-oauth-flow-spinner',
      '.cs-oauth-flow-callback-message',
      '.cs-oauth-flow-progress',
      '.cs-oauth-flow-status--success',
      '.cs-oauth-flow-status--error',
      '.cs-oauth-flow-btn',
      '.cs-oauth-flow-btn--primary',
      '.cs-oauth-flow-btn--secondary',
      '.cs-oauth-flow-btn--danger',
      '.cs-oauth-flow-account',
      '.cs-oauth-flow-account-avatar',
      '.cs-oauth-flow-account-name',
      '.cs-oauth-flow-account-email',
      '.cs-oauth-flow-steps',
      '.cs-oauth-flow-step--active',
      '.cs-oauth-flow-step--completed',
      '.cs-oauth-flow-step--inactive',
      '.cs-oauth-flow-step-label',
    ];

    for (const selector of requiredSelectors) {
      it(`has ${selector}`, () => {
        expect(css).toContain(selector);
      });
    }
  });

  describe('animations', () => {
    const requiredKeyframes = [
      'oauth-screen-enter',
      'oauth-screen-exit',
      'oauth-step-transition',
      'oauth-spinner',
      'oauth-success-bounce',
      'oauth-error-shake',
      'oauth-progress-fill',
      'oauth-provider-stagger',
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

  describe('screen container variables', () => {
    it('defines overlay color', () => {
      expect(css).toContain('--oflow-overlay: rgba(0, 0, 0, 0.6)');
    });

    it('defines max width', () => {
      expect(css).toContain('--oflow-max-w: 480px');
    });

    it('defines screen shadow', () => {
      expect(css).toContain('--oflow-shadow');
    });
  });

  describe('button variables', () => {
    it('defines primary button background', () => {
      expect(css).toContain('--btn-bg: var(--cs-brand-primary)');
    });

    it('defines danger button', () => {
      expect(css).toContain('--btn-bg: var(--cs-status-error)');
    });

    it('defines secondary button border', () => {
      expect(css).toContain('--btn-border: var(--cs-border-default)');
    });
  });

  describe('status variables', () => {
    it('defines success icon background', () => {
      expect(css).toContain('--status-icon-bg: rgba(16, 185, 129, 0.15)');
    });

    it('defines error icon background', () => {
      expect(css).toContain('--status-icon-bg: rgba(244, 63, 94, 0.15)');
    });
  });

  describe('spinner variables', () => {
    it('defines spinner size', () => {
      expect(css).toContain('--spinner-size: 48px');
    });

    it('defines spinner arc color', () => {
      expect(css).toContain('--spinner-arc: var(--cs-brand-primary)');
    });
  });
});

// ── OAuth Flow Tailwind Theme ─────────────────────────────────────

describe('oauth-flow-theme.ts — Tailwind theme extension', () => {
  const themeSource = readFileSync(resolve(TAILWIND_DIR, 'oauth-flow-theme.ts'), 'utf-8');

  it('exports oauthFlowTheme as const', () => {
    expect(themeSource).toContain('export const oauthFlowTheme');
    expect(themeSource).toContain('as const');
  });

  it('contains TASK-165 reference', () => {
    expect(themeSource).toContain('TASK-165');
  });

  describe('theme sections', () => {
    const requiredSections = [
      'colors',
      'spacing',
      'fontSize',
      'borderRadius',
      'boxShadow',
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
      'oflow-screen',
      'oflow-provider',
      'oflow-consent',
      'oflow-warning',
      'oflow-callback',
      'oflow-success',
      'oflow-error',
      'oflow-btn-primary',
      'oflow-btn-secondary',
      'oflow-btn-danger',
      'oflow-account',
      'oflow-step',
      'oflow-header',
    ];

    for (const group of requiredColorGroups) {
      it(`has '${group}' color group`, () => {
        expect(themeSource).toContain(`'${group}'`);
      });
    }
  });

  describe('spacing tokens', () => {
    const requiredSpacing = [
      'oflow-screen-padding',
      'oflow-screen-max-w',
      'oflow-provider-padding',
      'oflow-provider-gap',
      'oflow-provider-icon',
      'oflow-consent-padding',
      'oflow-scope-padding',
      'oflow-spinner-size',
      'oflow-btn-h',
      'oflow-btn-px',
      'oflow-avatar-size',
      'oflow-step-size',
    ];

    for (const token of requiredSpacing) {
      it(`has '${token}' spacing`, () => {
        expect(themeSource).toContain(`'${token}'`);
      });
    }
  });

  describe('fontSize presets', () => {
    const requiredFontSizes = [
      'oflow-title',
      'oflow-subtitle',
      'oflow-provider-name',
      'oflow-provider-desc',
      'oflow-scope',
      'oflow-warning',
      'oflow-btn',
      'oflow-account-name',
      'oflow-account-email',
      'oflow-step-num',
      'oflow-step-label',
      'oflow-error-code',
      'oflow-callback-msg',
    ];

    for (const preset of requiredFontSizes) {
      it(`has '${preset}' fontSize preset`, () => {
        expect(themeSource).toContain(`'${preset}'`);
      });
    }
  });

  describe('animation keyframes', () => {
    const requiredKeyframes = [
      'oauth-screen-enter',
      'oauth-screen-exit',
      'oauth-step-transition',
      'oauth-spinner',
      'oauth-success-bounce',
      'oauth-error-shake',
      'oauth-progress-fill',
      'oauth-provider-stagger',
    ];

    for (const kf of requiredKeyframes) {
      it(`has '${kf}' keyframe`, () => {
        expect(themeSource).toContain(`'${kf}'`);
      });
    }
  });

  it('uses oflow- prefix consistently for spacing keys', () => {
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
        expect(key, `spacing key "${key}" should start with oflow-`).toMatch(/^oflow-/);
      }
    }
  });
});
