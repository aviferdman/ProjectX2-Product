/**
 * Crewspace — Tailwind CSS theme extensions for the Visual Polish system
 * TASK-177: Visual polish pass (spacing, alignment, colors, consistency)
 *
 * This theme provides unified design tokens that harmonise spacing rhythm,
 * card surfaces, focus rings, buttons, inputs, badges, typography, overlays,
 * animations, and z-index stacking across all Crewspace components.
 *
 * Merge into your tailwind.config.ts alongside other themes:
 *   import { visualPolishTheme } from './src/design/tailwind/visual-polish-theme';
 *   export default { theme: { extend: { ...canvasTheme, ...visualPolishTheme } } };
 */

export const visualPolishTheme = {
  colors: {
    'polish-card': {
      bg: 'var(--cs-surface-card)',
      'bg-hover': 'var(--cs-surface-elevated)',
      border: 'var(--cs-border-default)',
      'border-hover': 'var(--cs-border-strong)',
    },
    'polish-btn': {
      'primary-bg': '#7c3aed',
      'primary-bg-hover': '#8b5cf6',
      'primary-text': '#ffffff',
      'ghost-bg': 'transparent',
      'ghost-bg-hover': 'rgba(148,163,184,0.08)',
      'ghost-text': 'var(--cs-text-secondary)',
      'ghost-text-hover': 'var(--cs-text-primary)',
      'danger-bg': '#e11d48',
      'danger-bg-hover': '#f43f5e',
      'danger-text': '#ffffff',
    },
    'polish-input': {
      bg: 'var(--cs-surface-elevated)',
      border: 'var(--cs-border-default)',
      'border-hover': 'var(--cs-border-strong)',
      'border-focus': '#8b5cf6',
      placeholder: 'var(--cs-text-tertiary)',
      text: 'var(--cs-text-primary)',
    },
    'polish-focus': {
      ring: '#8b5cf6',
      'ring-offset': '#020617',
    },
    'polish-divider': {
      DEFAULT: 'var(--cs-border-subtle)',
      strong: 'var(--cs-border-default)',
    },
    'polish-overlay': {
      DEFAULT: 'rgba(0,0,0,0.6)',
      light: 'rgba(0,0,0,0.4)',
      heavy: 'rgba(0,0,0,0.75)',
    },
    'polish-scrollbar': {
      track: 'transparent',
      thumb: 'rgba(148,163,184,0.2)',
      'thumb-hover': 'rgba(148,163,184,0.35)',
    },
  },

  spacing: {
    /* Component gaps */
    'gap-xs': '4px',
    'gap-sm': '8px',
    'gap-md': '12px',
    'gap-lg': '16px',
    'gap-xl': '24px',
    'gap-2xl': '32px',

    /* Inset padding */
    'inset-xs': '4px',
    'inset-sm': '8px',
    'inset-md': '12px',
    'inset-lg': '16px',
    'inset-xl': '24px',
    'inset-2xl': '32px',

    /* Stack spacing */
    'stack-xs': '2px',
    'stack-sm': '4px',
    'stack-md': '8px',
    'stack-lg': '16px',
    'stack-xl': '24px',

    /* Icon sizes */
    'icon-xs': '12px',
    'icon-sm': '16px',
    'icon-md': '20px',
    'icon-lg': '24px',
    'icon-xl': '32px',
    'icon-2xl': '48px',

    /* Button heights */
    'btn-h-sm': '28px',
    'btn-h-md': '36px',
    'btn-h-lg': '40px',

    /* Input heights */
    'input-h': '36px',
    'input-h-sm': '28px',

    /* Badge heights */
    'badge-h': '22px',
    'badge-h-sm': '18px',

    /* Card tokens */
    'card-p': '16px',
    'card-p-compact': '12px',
    'card-gap': '16px',
    'card-gap-compact': '12px',

    /* Divider spacing */
    'divider-spacing': '16px',
    'divider-spacing-compact': '8px',

    /* Scrollbar */
    'scrollbar-w': '6px',

    /* Focus ring */
    'focus-ring-w': '2px',
    'focus-ring-offset': '2px',
  },

  fontSize: {
    'polish-page-title': ['1.5rem', { lineHeight: '1.25', fontWeight: '700', letterSpacing: '-0.01em' }],
    'polish-section-title': ['1rem', { lineHeight: '1.25', fontWeight: '600' }],
    'polish-card-title': ['0.875rem', { lineHeight: '1.25', fontWeight: '600' }],
    'polish-card-body': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
    'polish-card-meta': ['0.6875rem', { lineHeight: '1.25', fontWeight: '400' }],
    'polish-label': ['0.75rem', { lineHeight: '1.5', fontWeight: '500' }],
    'polish-caption': ['0.6875rem', { lineHeight: '1.25', fontWeight: '500', letterSpacing: '0.025em' }],
    'polish-overline': ['0.625rem', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.05em' }],
    'polish-btn': ['0.8125rem', { lineHeight: '1.25', fontWeight: '500' }],
    'polish-input': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
    'polish-badge': ['0.6875rem', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.025em' }],
  },

  borderRadius: {
    'card-polished': '12px',
    'btn-polished': '8px',
    'btn-pill': '9999px',
    'input-polished': '6px',
    'badge-polished': '9999px',
  },

  boxShadow: {
    'card-polished': '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(148,163,184,0.06)',
    'card-polished-hover': '0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(148,163,184,0.1)',
    'card-polished-active': '0 1px 2px rgba(0,0,0,0.2), 0 0 0 1px rgba(148,163,184,0.08)',
    'btn-primary': '0 2px 8px rgba(124,58,237,0.35)',
    'btn-primary-hover': '0 4px 12px rgba(124,58,237,0.45)',
    'focus-ring': '0 0 0 2px #020617, 0 0 0 4px #8b5cf6',
  },

  opacity: {
    'hover-highlight': '0.08',
    'active-highlight': '0.12',
    'selected-highlight': '0.15',
    disabled: '0.4',
    placeholder: '0.5',
  },

  zIndex: {
    dropdown: '100',
    sticky: '200',
    overlay: '300',
    modal: '400',
    popover: '500',
    tooltip: '600',
    toast: '700',
  },

  backdropBlur: {
    'overlay': '8px',
    'overlay-sm': '4px',
  },

  transitionDuration: {
    instant: '50ms',
    fast: '100ms',
    normal: '150ms',
    moderate: '200ms',
    slow: '300ms',
    enter: '250ms',
  },

  transitionTimingFunction: {
    'polish-default': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'polish-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'polish-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'polish-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  animation: {
    'polish-fade-in': 'polish-fade-in var(--cs-duration-moderate, 200ms) var(--cs-easing-out, ease-out)',
    'polish-slide-up': 'polish-slide-up var(--cs-duration-enter, 250ms) var(--cs-easing-out, ease-out)',
    'polish-scale-in': 'polish-scale-in var(--cs-duration-enter, 250ms) var(--cs-easing-spring, cubic-bezier(0.34,1.56,0.64,1))',
    'polish-spring-in': 'polish-spring-in var(--cs-duration-enter, 250ms) var(--cs-easing-spring, cubic-bezier(0.34,1.56,0.64,1))',
    'polish-shimmer': 'polish-shimmer 1.5s ease-in-out infinite',
    'polish-spin': 'polish-spin 1s linear infinite',
    'polish-pulse': 'polish-pulse 2s ease-in-out infinite',
  },

  keyframes: {
    'polish-fade-in': {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    'polish-slide-up': {
      from: { opacity: '0', transform: 'translateY(8px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    'polish-scale-in': {
      from: { opacity: '0', transform: 'scale(0.92)' },
      to: { opacity: '1', transform: 'scale(1)' },
    },
    'polish-spring-in': {
      from: { opacity: '0', transform: 'scale(0.85)' },
      to: { opacity: '1', transform: 'scale(1)' },
    },
    'polish-shimmer': {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    'polish-spin': {
      to: { transform: 'rotate(360deg)' },
    },
    'polish-pulse': {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },
  },
} as const;
