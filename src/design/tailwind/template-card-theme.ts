/**
 * Crewspace — Tailwind CSS theme extensions for the Template Card component
 * TASK-157: Design template cards (thumbnail, title, description, tags)
 *
 * Merge into your tailwind.config.ts:
 *   import { templateCardTheme } from './src/design/tailwind/template-card-theme';
 *   export default { theme: { extend: { ...templateLibraryTheme, ...templateCardTheme } } };
 */

export const templateCardTheme = {
  colors: {
    // Card container
    'tpl-card': {
      bg: 'var(--cs-surface-card)',
      'bg-hover': 'var(--cs-surface-elevated)',
      border: 'var(--cs-border-default)',
      'border-hover': 'var(--cs-border-strong)',
      'border-focus': '#8b5cf6',
    },

    // Thumbnail
    'tpl-thumb': {
      bg: 'rgba(10,14,26,0.8)',
      border: 'var(--cs-border-subtle)',
      'node-agent': '#a78bfa',
      'node-task': '#38bdf8',
      'node-tool': '#34d399',
      'node-llm': '#fbbf24',
      edge: 'rgba(148,163,184,0.2)',
      'node-ring': 'rgba(255,255,255,0.1)',
      'empty-icon': '#475569',
    },

    // Thumbnail preview overlay button
    'tpl-thumb-preview': {
      bg: 'rgba(255,255,255,0.1)',
      'bg-hover': 'rgba(255,255,255,0.2)',
      border: 'rgba(255,255,255,0.2)',
      icon: 'rgba(255,255,255,0.9)',
    },

    // Featured / Popular / New badges
    'tpl-card-badge': {
      'featured-bg': 'rgba(251,191,36,0.15)',
      'featured-text': '#fcd34d',
      'featured-border': 'rgba(251,191,36,0.3)',
      'popular-bg': 'rgba(52,211,153,0.15)',
      'popular-text': '#6ee7b7',
      'popular-border': 'rgba(52,211,153,0.3)',
      'new-bg': 'rgba(56,189,248,0.15)',
      'new-text': '#7dd3fc',
      'new-border': 'rgba(56,189,248,0.3)',
    },

    // Category icon backgrounds & colors
    'tpl-cat-icon': {
      'research-color': '#38bdf8',
      'research-bg': 'rgba(56,189,248,0.15)',
      'code-color': '#a78bfa',
      'code-bg': 'rgba(167,139,250,0.15)',
      'support-color': '#34d399',
      'support-bg': 'rgba(52,211,153,0.15)',
      'content-color': '#fbbf24',
      'content-bg': 'rgba(251,191,36,0.15)',
      'data-color': '#fb7185',
      'data-bg': 'rgba(251,113,133,0.15)',
      'automation-color': '#cbd5e1',
      'automation-bg': 'rgba(203,213,225,0.15)',
    },

    // Title & description text
    'tpl-card-title': 'var(--cs-text-primary)',
    'tpl-card-desc': 'var(--cs-text-secondary)',

    // Tags
    'tpl-card-tag': {
      bg: 'var(--cs-surface-elevated)',
      'bg-hover': 'rgba(139,92,246,0.12)',
      border: 'var(--cs-border-subtle)',
      'border-hover': 'rgba(139,92,246,0.25)',
      text: 'var(--cs-text-tertiary)',
      'text-hover': '#c4b5fd',
      'overflow-bg': 'rgba(148,163,184,0.08)',
    },

    // Meta row
    'tpl-card-meta': {
      text: 'var(--cs-text-tertiary)',
      separator: '#475569',
      'star-filled': '#fbbf24',
      'star-empty': 'var(--cs-text-tertiary)',
    },

    // Preview button (secondary)
    'tpl-card-preview-btn': {
      bg: 'transparent',
      'bg-hover': 'rgba(139,92,246,0.12)',
      text: '#c4b5fd',
      'text-hover': '#ddd6fe',
      border: '#7c3aed',
      'border-hover': '#8b5cf6',
    },

    // Use Template button (primary)
    'tpl-card-use-btn': {
      bg: '#7c3aed',
      'bg-hover': '#8b5cf6',
      'bg-active': '#6d28d9',
      text: '#ffffff',
    },

    // Skeleton loading state
    'tpl-card-skeleton': {
      bg: 'rgba(30,41,59,0.3)',
      highlight: 'rgba(30,41,59,0.5)',
      static: 'rgba(30,41,59,0.4)',
    },
  },

  spacing: {
    // Card sizing
    'tpl-card-w': '300px',
    'tpl-card-min-w': '260px',
    'tpl-card-max-w': '360px',
    'tpl-card-gap': '20px',
    'tpl-card-body-p': '16px',
    'tpl-card-body-gap': '10px',

    // Thumbnail
    'tpl-thumb-h': '180px',
    'tpl-thumb-h-md': '160px',
    'tpl-thumb-h-sm': '140px',
    'tpl-thumb-node-p': '16px',
    'tpl-thumb-empty-icon': '40px',

    // Preview overlay button
    'tpl-thumb-preview-size': '40px',
    'tpl-thumb-preview-icon': '18px',

    // Badge
    'tpl-badge-h': '20px',
    'tpl-badge-inset': '8px',

    // Category icon
    'tpl-cat-icon-size': '36px',
    'tpl-cat-icon-size-sm': '28px',
    'tpl-cat-icon-inner': '18px',
    'tpl-cat-icon-mr': '12px',

    // Tags
    'tpl-card-tag-h': '22px',
    'tpl-card-tag-gap': '6px',

    // Meta
    'tpl-card-meta-icon': '12px',
    'tpl-card-meta-gap': '8px',

    // Actions
    'tpl-card-actions-gap': '8px',
    'tpl-card-actions-pt': '12px',
    'tpl-card-btn-h': '36px',
    'tpl-card-btn-icon': '14px',

    // Description min-height
    'tpl-card-desc-min-h': '36px',
  },

  fontSize: {
    'tpl-card-title': ['0.875rem', { lineHeight: '1.25', fontWeight: '600' }],
    'tpl-card-desc': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
    'tpl-card-tag': ['0.625rem', { lineHeight: '1', fontWeight: '500', letterSpacing: '0.02em' }],
    'tpl-card-meta': ['0.6875rem', { lineHeight: '1.25', fontWeight: '400' }],
    'tpl-card-badge': ['0.5625rem', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.05em' }],
    'tpl-card-btn': ['0.8125rem', { lineHeight: '1', fontWeight: '500' }],
    'tpl-card-btn-primary': ['0.8125rem', { lineHeight: '1', fontWeight: '600' }],
  },

  boxShadow: {
    'tpl-card': '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(148,163,184,0.06)',
    'tpl-card-hover': '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(148,163,184,0.1)',
    'tpl-card-focus': '0 0 0 3px rgba(139,92,246,0.25)',
    'tpl-card-use-btn': '0 2px 8px rgba(124,58,237,0.35)',
    'tpl-card-use-btn-hover': '0 4px 12px rgba(124,58,237,0.45)',
    'tpl-card-use-btn-active': '0 1px 4px rgba(124,58,237,0.25)',
  },

  animation: {
    'tpl-card-enter': 'tpl-card-enter 250ms cubic-bezier(0.34,1.56,0.64,1)',
    'tpl-card-shimmer': 'tpl-card-shimmer 1.5s ease-in-out infinite',
    'tpl-card-overlay-in': 'tpl-card-overlay-in 200ms ease-out',
  },

  keyframes: {
    'tpl-card-enter': {
      from: { opacity: '0', transform: 'scale(0.92) translateY(8px)' },
      to: { opacity: '1', transform: 'scale(1) translateY(0)' },
    },
    'tpl-card-shimmer': {
      from: { backgroundPosition: '-200% 0' },
      to: { backgroundPosition: '200% 0' },
    },
    'tpl-card-overlay-in': {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
  },
} as const;
