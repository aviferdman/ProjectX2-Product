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

// ── Landing Page Token JSON ───────────────────────────────────────

describe('landing-page.json — design tokens', () => {
  const tokens = loadTokens('landing-page.json');

  it('has DTCG schema reference', () => {
    expect(tokens.$schema).toBe('https://design-tokens.github.io/community-group/format/');
  });

  it('has crewspace.landingPage namespace', () => {
    expect(tokens).toHaveProperty('crewspace');
    const crewspace = tokens.crewspace as Record<string, unknown>;
    expect(crewspace).toHaveProperty('landingPage');
  });

  const landingPage = (tokens as { crewspace: { landingPage: Record<string, unknown> } }).crewspace
    .landingPage;

  it('contains required top-level sections', () => {
    const requiredSections = [
      'layout',
      'hero',
      'heroTypography',
      'ctaButton',
      'nav',
      'featureSection',
      'featureCard',
      'codeDemo',
      'screenshot',
      'videoEmbed',
      'socialProof',
      'statsBar',
      'footerCta',
      'footer',
      'animation',
    ];
    for (const section of requiredSections) {
      expect(landingPage, `missing section: ${section}`).toHaveProperty(section);
    }
  });

  it('has a _description field for task traceability', () => {
    expect(landingPage._description).toContain('TASK-183');
  });

  describe('token leaf values', () => {
    const leaves = collectTokenLeaves(landingPage);

    it('has at least 100 token leaves', () => {
      expect(leaves.length).toBeGreaterThanOrEqual(100);
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

  describe('hero section', () => {
    const hero = landingPage.hero as Record<string, Record<string, unknown>>;

    it('has background gradient', () => {
      expect(hero).toHaveProperty('bg-gradient');
    });

    it('has headline and subheadline colors', () => {
      expect(hero).toHaveProperty('headline-color');
      expect(hero).toHaveProperty('headline-gradient');
      expect(hero).toHaveProperty('subheadline-color');
    });

    it('has version badge tokens', () => {
      expect(hero).toHaveProperty('badge-bg');
      expect(hero).toHaveProperty('badge-border');
      expect(hero).toHaveProperty('badge-text');
      expect(hero).toHaveProperty('badge-height');
    });
  });

  describe('CTA buttons', () => {
    const cta = landingPage.ctaButton as Record<string, Record<string, unknown>>;

    it('has primary button states', () => {
      expect(cta).toHaveProperty('primary-bg');
      expect(cta).toHaveProperty('primary-bg-hover');
      expect(cta).toHaveProperty('primary-bg-active');
      expect(cta).toHaveProperty('primary-text');
      expect(cta).toHaveProperty('primary-shadow');
    });

    it('has secondary button states', () => {
      expect(cta).toHaveProperty('secondary-bg');
      expect(cta).toHaveProperty('secondary-bg-hover');
      expect(cta).toHaveProperty('secondary-border');
      expect(cta).toHaveProperty('secondary-text');
    });
  });

  describe('feature cards', () => {
    const card = landingPage.featureCard as Record<string, Record<string, unknown>>;

    it('has card surface tokens', () => {
      expect(card).toHaveProperty('bg');
      expect(card).toHaveProperty('bg-hover');
      expect(card).toHaveProperty('border');
      expect(card).toHaveProperty('border-hover');
      expect(card).toHaveProperty('shadow');
    });

    it('has icon tokens', () => {
      expect(card).toHaveProperty('icon-size');
      expect(card).toHaveProperty('icon-bg');
      expect(card).toHaveProperty('icon-color');
    });

    it('has responsive grid columns', () => {
      expect(card).toHaveProperty('grid-columns-lg');
      expect(card).toHaveProperty('grid-columns-md');
      expect(card).toHaveProperty('grid-columns-sm');
    });
  });

  describe('code demo', () => {
    const code = landingPage.codeDemo as Record<string, Record<string, unknown>>;

    it('has syntax highlighting colors', () => {
      expect(code).toHaveProperty('keyword-color');
      expect(code).toHaveProperty('string-color');
      expect(code).toHaveProperty('comment-color');
      expect(code).toHaveProperty('function-color');
      expect(code).toHaveProperty('type-color');
    });

    it('has chrome window dots', () => {
      expect(code).toHaveProperty('dot-red');
      expect(code).toHaveProperty('dot-yellow');
      expect(code).toHaveProperty('dot-green');
    });

    it('has tab tokens for multi-file demo', () => {
      expect(code).toHaveProperty('tab-bg');
      expect(code).toHaveProperty('tab-bg-active');
      expect(code).toHaveProperty('tab-text');
      expect(code).toHaveProperty('tab-text-active');
      expect(code).toHaveProperty('tab-border-active');
    });
  });

  describe('screenshot gallery', () => {
    const shot = landingPage.screenshot as Record<string, Record<string, unknown>>;

    it('has browser chrome tokens', () => {
      expect(shot).toHaveProperty('chrome-bg');
      expect(shot).toHaveProperty('chrome-height');
      expect(shot).toHaveProperty('url-bar-bg');
      expect(shot).toHaveProperty('url-bar-text');
    });

    it('has thumbnail gallery tokens', () => {
      expect(shot).toHaveProperty('thumb-size');
      expect(shot).toHaveProperty('thumb-radius');
      expect(shot).toHaveProperty('thumb-border');
      expect(shot).toHaveProperty('thumb-border-active');
      expect(shot).toHaveProperty('thumb-opacity');
      expect(shot).toHaveProperty('thumb-opacity-active');
    });
  });

  describe('video embed', () => {
    const video = landingPage.videoEmbed as Record<string, Record<string, unknown>>;

    it('has play button tokens', () => {
      expect(video).toHaveProperty('play-btn-size');
      expect(video).toHaveProperty('play-btn-bg');
      expect(video).toHaveProperty('play-btn-bg-hover');
      expect(video).toHaveProperty('play-btn-icon-color');
      expect(video).toHaveProperty('play-btn-shadow');
    });

    it('has video overlay and duration badge', () => {
      expect(video).toHaveProperty('overlay-bg');
      expect(video).toHaveProperty('duration-bg');
      expect(video).toHaveProperty('duration-text');
    });

    it('has progress bar tokens', () => {
      expect(video).toHaveProperty('progress-track');
      expect(video).toHaveProperty('progress-fill');
      expect(video).toHaveProperty('progress-height');
    });
  });

  describe('social proof', () => {
    const proof = landingPage.socialProof as Record<string, Record<string, unknown>>;

    it('has testimonial quote tokens', () => {
      expect(proof).toHaveProperty('quote-color');
      expect(proof).toHaveProperty('quote-mark-color');
      expect(proof).toHaveProperty('quote-size');
    });

    it('has author tokens', () => {
      expect(proof).toHaveProperty('author-name-color');
      expect(proof).toHaveProperty('author-role-color');
      expect(proof).toHaveProperty('avatar-size');
      expect(proof).toHaveProperty('avatar-border');
    });

    it('has company logo bar tokens', () => {
      expect(proof).toHaveProperty('logo-height');
      expect(proof).toHaveProperty('logo-opacity');
      expect(proof).toHaveProperty('logo-opacity-hover');
    });
  });

  describe('stats bar', () => {
    const stats = landingPage.statsBar as Record<string, Record<string, unknown>>;

    it('has stat value and label tokens', () => {
      expect(stats).toHaveProperty('value-color');
      expect(stats).toHaveProperty('value-size');
      expect(stats).toHaveProperty('value-weight');
      expect(stats).toHaveProperty('label-color');
      expect(stats).toHaveProperty('label-size');
    });

    it('has responsive column counts', () => {
      expect(stats).toHaveProperty('columns');
      expect(stats).toHaveProperty('columns-mobile');
    });
  });

  describe('animation tokens', () => {
    const anim = landingPage.animation as Record<string, { value: string }>;

    it('includes hero, feature, and scroll reveal durations', () => {
      expect(anim).toHaveProperty('hero-enter-duration');
      expect(anim).toHaveProperty('feature-enter-duration');
      expect(anim).toHaveProperty('scroll-reveal-duration');
    });

    it('uses smooth easing for page entrance animations', () => {
      expect(anim['hero-enter-easing'].value).toContain('cubic-bezier');
      expect(anim['feature-enter-easing'].value).toContain('cubic-bezier');
      expect(anim['scroll-reveal-easing'].value).toContain('cubic-bezier');
    });

    it('has stagger delays for sequential animations', () => {
      expect(anim['hero-stagger'].value).toBe('100ms');
      expect(anim['feature-stagger'].value).toBe('80ms');
    });

    it('has code typing animation speed', () => {
      expect(anim['code-type-speed'].value).toBe('40ms');
    });

    it('has decorative animation durations', () => {
      expect(anim).toHaveProperty('gradient-shift-duration');
      expect(anim).toHaveProperty('float-duration');
      expect(anim).toHaveProperty('pulse-duration');
    });

    it('has stat counter animation', () => {
      expect(anim['stat-count-duration'].value).toBe('1200ms');
    });
  });
});

// ── Landing Page CSS Variables ────────────────────────────────────

describe('landing-page-variables.css — custom properties', () => {
  const css = loadCSS('landing-page-variables.css');

  it('contains TASK-183 reference', () => {
    expect(css).toContain('TASK-183');
  });

  it('defines the root .cs-landing class', () => {
    expect(css).toContain('.cs-landing');
  });

  describe('component selectors', () => {
    const requiredSelectors = [
      '.cs-landing-nav',
      '.cs-landing-hero',
      '.cs-landing-cta-primary',
      '.cs-landing-cta-secondary',
      '.cs-landing-features',
      '.cs-landing-feature-card',
      '.cs-landing-feature-grid',
      '.cs-landing-code',
      '.cs-landing-screenshot',
      '.cs-landing-video',
      '.cs-landing-testimonial',
      '.cs-landing-logo-bar',
      '.cs-landing-stats',
      '.cs-landing-footer-cta',
      '.cs-landing-footer',
    ];

    for (const selector of requiredSelectors) {
      it(`has ${selector}`, () => {
        expect(css).toContain(selector);
      });
    }
  });

  describe('animations', () => {
    const requiredKeyframes = [
      'cs-lp-hero-enter',
      'cs-lp-feature-enter',
      'cs-lp-scroll-reveal',
      'cs-lp-cursor-blink',
      'cs-lp-screenshot-fade',
      'cs-lp-gradient-shift',
      'cs-lp-float',
      'cs-lp-cta-pulse',
      'cs-lp-count-up',
      'cs-lp-play-pulse',
      'cs-lp-logo-slide',
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

  describe('hero variables', () => {
    it('defines hero background and layout variables', () => {
      expect(css).toContain('--hero-bg');
      expect(css).toContain('--hero-min-h');
      expect(css).toContain('--hero-pt');
    });

    it('defines headline variables', () => {
      expect(css).toContain('--headline-color');
      expect(css).toContain('--headline-gradient');
    });

    it('defines badge variables', () => {
      expect(css).toContain('--badge-bg');
      expect(css).toContain('--badge-text');
    });
  });

  describe('code demo variables', () => {
    it('defines syntax highlighting variables', () => {
      expect(css).toContain('--keyword-color');
      expect(css).toContain('--string-color');
      expect(css).toContain('--function-color');
    });

    it('defines code chrome variables', () => {
      expect(css).toContain('--dot-red');
      expect(css).toContain('--dot-yellow');
      expect(css).toContain('--dot-green');
    });
  });

  describe('video embed variables', () => {
    it('defines play button variables', () => {
      expect(css).toContain('--play-size');
      expect(css).toContain('--play-bg');
      expect(css).toContain('--play-icon-color');
    });

    it('defines video progress variables', () => {
      expect(css).toContain('--progress-track');
      expect(css).toContain('--progress-fill');
    });
  });

  describe('social proof variables', () => {
    it('defines testimonial variables', () => {
      expect(css).toContain('--quote-color');
      expect(css).toContain('--quote-mark-color');
      expect(css).toContain('--author-name-color');
    });
  });
});

// ── Landing Page Tailwind Theme ───────────────────────────────────

describe('landing-page-theme.ts — Tailwind theme extension', () => {
  const themeSource = readFileSync(resolve(TAILWIND_DIR, 'landing-page-theme.ts'), 'utf-8');

  it('exports landingPageTheme as const', () => {
    expect(themeSource).toContain('export const landingPageTheme');
    expect(themeSource).toContain('as const');
  });

  it('contains TASK-183 reference', () => {
    expect(themeSource).toContain('TASK-183');
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
      'lp-layout',
      'lp-nav',
      'lp-hero',
      'lp-cta',
      'lp-feature',
      'lp-feature-card',
      'lp-code',
      'lp-screenshot',
      'lp-video',
      'lp-testimonial',
      'lp-logo-bar',
      'lp-stats',
      'lp-footer-cta',
      'lp-footer',
    ];

    for (const group of requiredColorGroups) {
      it(`has '${group}' color group`, () => {
        expect(themeSource).toContain(`'${group}'`);
      });
    }
  });

  describe('spacing tokens', () => {
    const requiredSpacing = [
      'lp-content-max-w',
      'lp-nav-h',
      'lp-hero-min-h',
      'lp-hero-pt',
      'lp-cta-h',
      'lp-feature-padding',
      'lp-feature-icon-size',
      'lp-code-max-w',
      'lp-play-size',
      'lp-avatar-size',
      'lp-thumb-size',
      'lp-stats-padding',
      'lp-footer-py',
    ];

    for (const token of requiredSpacing) {
      it(`has '${token}' spacing`, () => {
        expect(themeSource).toContain(`'${token}'`);
      });
    }
  });

  describe('fontSize presets', () => {
    const requiredFontSizes = [
      'lp-headline',
      'lp-subheadline',
      'lp-section-heading',
      'lp-card-title',
      'lp-card-desc',
      'lp-code-text',
      'lp-cta-btn',
      'lp-quote',
      'lp-stat-value',
      'lp-footer-heading',
    ];

    for (const preset of requiredFontSizes) {
      it(`has '${preset}' fontSize preset`, () => {
        expect(themeSource).toContain(`'${preset}'`);
      });
    }
  });

  describe('animation keyframes', () => {
    const requiredKeyframes = [
      'lp-hero-enter',
      'lp-feature-enter',
      'lp-scroll-reveal',
      'lp-cursor-blink',
      'lp-screenshot-fade',
      'lp-gradient-shift',
      'lp-float',
      'lp-cta-pulse',
      'lp-count-up',
      'lp-play-pulse',
      'lp-logo-slide',
    ];

    for (const kf of requiredKeyframes) {
      it(`has '${kf}' keyframe`, () => {
        expect(themeSource).toContain(`'${kf}'`);
      });
    }
  });

  it('uses lp- prefix consistently for landing page spacing keys', () => {
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
        expect(key, `spacing key "${key}" should start with lp-`).toMatch(/^lp-/);
      }
    }
  });
});
