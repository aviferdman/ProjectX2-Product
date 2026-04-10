/**
 * Crewspace Design System — Foundational Tailwind CSS theme
 * TASK-125: Core design system (colors, typography, spacing, tokens)
 *
 * This is the base Tailwind theme extension for Crewspace. It maps every
 * foundational design token to Tailwind utilities. Component-specific themes
 * (canvas, timeline, dashboard, etc.) extend this base.
 *
 * Usage:
 *   import { designSystemTheme } from './src/design/tailwind/design-system-theme';
 *   export default { theme: { extend: designSystemTheme } };
 */

export const designSystemTheme = {
  /* -------------------------------------------------------------- */
  /* Colors                                                          */
  /* -------------------------------------------------------------- */
  colors: {
    brand: {
      primary: 'var(--cs-brand-primary, #7c3aed)',
      secondary: 'var(--cs-brand-secondary, #a78bfa)',
      subtle: 'var(--cs-brand-subtle, #ede9fe)',
    },
    surface: {
      app: 'var(--cs-surface-app, #020617)',
      canvas: 'var(--cs-surface-canvas, #0a0e1a)',
      panel: 'var(--cs-surface-panel, #0f172a)',
      card: 'var(--cs-surface-card, #1e293b)',
      elevated: 'var(--cs-surface-elevated, #334155)',
      overlay: 'var(--cs-surface-overlay, rgba(0,0,0,0.6))',
    },
    border: {
      DEFAULT: 'var(--cs-border-default, #334155)',
      subtle: 'var(--cs-border-subtle, #1e293b)',
      strong: 'var(--cs-border-strong, #64748b)',
      focus: 'var(--cs-border-focus, #8b5cf6)',
    },
    text: {
      primary: 'var(--cs-text-primary, #f8fafc)',
      secondary: 'var(--cs-text-secondary, #94a3b8)',
      tertiary: 'var(--cs-text-tertiary, #64748b)',
      inverse: 'var(--cs-text-inverse, #0f172a)',
      disabled: 'var(--cs-text-disabled, #475569)',
      link: 'var(--cs-text-link, #a78bfa)',
      'link-hover': 'var(--cs-text-link-hover, #c4b5fd)',
    },
    status: {
      success: 'var(--cs-status-success, #10b981)',
      'success-subtle': 'var(--cs-status-success-subtle, #ecfdf5)',
      warning: 'var(--cs-status-warning, #f59e0b)',
      'warning-subtle': 'var(--cs-status-warning-subtle, #fffbeb)',
      error: 'var(--cs-status-error, #f43f5e)',
      'error-subtle': 'var(--cs-status-error-subtle, #fff1f2)',
      info: 'var(--cs-status-info, #0ea5e9)',
      'info-subtle': 'var(--cs-status-info-subtle, #f0f9ff)',
    },
    interactive: {
      DEFAULT: 'var(--cs-interactive-default, #7c3aed)',
      hover: 'var(--cs-interactive-hover, #8b5cf6)',
      active: 'var(--cs-interactive-active, #6d28d9)',
      disabled: 'var(--cs-interactive-disabled, #475569)',
    },
  },

  /* -------------------------------------------------------------- */
  /* Typography                                                      */
  /* -------------------------------------------------------------- */
  fontFamily: {
    sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ["'JetBrains Mono'", "'Fira Code'", 'ui-monospace', 'monospace'],
  },

  fontSize: {
    '2xs': ['0.625rem', { lineHeight: '1' }],
    xs: ['0.75rem', { lineHeight: '1.5' }],
    sm: ['0.8125rem', { lineHeight: '1.5' }],
    base: ['0.875rem', { lineHeight: '1.5' }],
    md: ['1rem', { lineHeight: '1.5' }],
    lg: ['1.125rem', { lineHeight: '1.5' }],
    xl: ['1.25rem', { lineHeight: '1.375' }],
    '2xl': ['1.5rem', { lineHeight: '1.25' }],
    '3xl': ['1.875rem', { lineHeight: '1.25' }],
    '4xl': ['2.25rem', { lineHeight: '1.25' }],
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  /* -------------------------------------------------------------- */
  /* Spacing (4px grid)                                              */
  /* -------------------------------------------------------------- */
  spacing: {
    px: '1px',
    0: '0px',
    0.5: '2px',
    1: '4px',
    1.5: '6px',
    2: '8px',
    2.5: '10px',
    3: '12px',
    3.5: '14px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    9: '36px',
    10: '40px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
    24: '96px',
  },

  /* -------------------------------------------------------------- */
  /* Border radius                                                   */
  /* -------------------------------------------------------------- */
  borderRadius: {
    none: '0px',
    sm: '4px',
    DEFAULT: '6px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px',
    node: '10px',
  },

  /* -------------------------------------------------------------- */
  /* Shadows                                                         */
  /* -------------------------------------------------------------- */
  boxShadow: {
    xs: 'var(--cs-shadow-xs, 0 1px 2px rgba(0,0,0,0.2))',
    sm: 'var(--cs-shadow-sm, 0 1px 3px rgba(0,0,0,0.3))',
    DEFAULT: 'var(--cs-shadow-md, 0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(148,163,184,0.1))',
    md: 'var(--cs-shadow-md, 0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(148,163,184,0.1))',
    lg: 'var(--cs-shadow-lg, 0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(148,163,184,0.15))',
    xl: 'var(--cs-shadow-xl, 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(148,163,184,0.1))',
    inner: 'var(--cs-shadow-inner, inset 0 2px 4px rgba(0,0,0,0.2))',
    none: 'none',
    node: 'var(--cs-shadow-node, 0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(148,163,184,0.1))',
    'node-hover': 'var(--cs-shadow-node-hover, 0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(148,163,184,0.15))',
    'node-selected':
      'var(--cs-shadow-node-selected, 0 0 0 2px #8b5cf6, 0 4px 20px rgba(139,92,246,0.25))',
    panel: 'var(--cs-shadow-panel, 0 1px 3px rgba(0,0,0,0.3))',
    toolbar: 'var(--cs-shadow-toolbar, 0 2px 12px rgba(0,0,0,0.35))',
    dropdown:
      'var(--cs-shadow-dropdown, 0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(148,163,184,0.1))',
  },

  /* -------------------------------------------------------------- */
  /* Transitions                                                     */
  /* -------------------------------------------------------------- */
  transitionDuration: {
    0: '0ms',
    fast: '100ms',
    DEFAULT: '200ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '1000ms',
  },

  transitionTimingFunction: {
    DEFAULT: 'ease-out',
    in: 'ease-in',
    'in-out': 'ease-in-out',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    linear: 'linear',
  },

  /* -------------------------------------------------------------- */
  /* Z-index layers                                                  */
  /* -------------------------------------------------------------- */
  zIndex: {
    base: '0',
    canvas: '1',
    edge: '5',
    node: '10',
    toolbar: '100',
    sidebar: '100',
    dropdown: '200',
    overlay: '250',
    modal: '300',
    toast: '400',
    tooltip: '500',
  },

  /* -------------------------------------------------------------- */
  /* Opacity                                                         */
  /* -------------------------------------------------------------- */
  opacity: {
    disabled: '0.4',
    overlay: '0.6',
    subtle: '0.1',
  },

  /* -------------------------------------------------------------- */
  /* Breakpoints                                                     */
  /* -------------------------------------------------------------- */
  screens: {
    xs: '375px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;
