/**
 * Crewspace — Tailwind CSS theme extensions for the Integration Card component
 * TASK-164: Design integration cards (logo, description, OAuth status)
 *
 * Merge into your tailwind.config.ts:
 *   import { integrationCardTheme } from './src/design/tailwind/integration-card-theme';
 *   export default { theme: { extend: { ...integrationCardTheme } } };
 */

export const integrationCardTheme = {
  colors: {
    // Card container
    'ic-card': {
      bg: 'var(--cs-surface-card)',
      'bg-hover': 'var(--cs-surface-elevated)',
      border: 'var(--cs-border-default)',
      'border-hover': 'var(--cs-border-strong)',
      'border-focus': '#8b5cf6',
    },

    // Logo
    'ic-logo': {
      bg: 'rgba(30,41,59,0.5)',
      border: 'var(--cs-border-subtle)',
      placeholder: '#64748b',
    },

    // Title & provider
    'ic-title': {
      color: 'var(--cs-text-primary)',
    },
    'ic-provider': {
      color: 'var(--cs-text-tertiary)',
    },

    // Description
    'ic-description': {
      color: 'var(--cs-text-secondary)',
    },

    // OAuth status states
    'ic-oauth': {
      'connected-bg': 'rgba(52,211,153,0.12)',
      'connected-text': '#34d399',
      'connected-icon': '#34d399',
      'connected-border': 'rgba(52,211,153,0.25)',

      'disconnected-bg': 'rgba(148,163,184,0.08)',
      'disconnected-text': 'var(--cs-text-tertiary)',
      'disconnected-icon': '#64748b',
      'disconnected-border': 'var(--cs-border-subtle)',

      'pending-bg': 'rgba(251,191,36,0.12)',
      'pending-text': '#fbbf24',
      'pending-icon': '#fbbf24',
      'pending-border': 'rgba(251,191,36,0.25)',

      'error-bg': 'rgba(251,113,133,0.1)',
      'error-text': '#fb7185',
      'error-icon': '#fb7185',
      'error-border': 'rgba(251,113,133,0.25)',
    },

    // Connect button
    'ic-connect-btn': {
      bg: '#7c3aed',
      'bg-hover': '#8b5cf6',
      'bg-active': '#6d28d9',
      text: '#ffffff',
    },

    // Disconnect button
    'ic-disconnect-btn': {
      bg: 'transparent',
      'bg-hover': 'rgba(251,113,133,0.1)',
      text: 'var(--cs-text-secondary)',
      'text-hover': '#fb7185',
      border: 'var(--cs-border-default)',
      'border-hover': 'rgba(251,113,133,0.3)',
    },

    // Reconnect button
    'ic-reconnect-btn': {
      bg: 'rgba(251,191,36,0.12)',
      'bg-hover': 'rgba(251,191,36,0.2)',
      text: '#fbbf24',
      border: 'rgba(251,191,36,0.3)',
    },

    // Divider
    'ic-divider': {
      color: 'var(--cs-border-subtle)',
    },

    // Footer meta
    'ic-footer': {
      meta: 'var(--cs-text-tertiary)',
      separator: '#475569',
    },

    // Scopes badge
    'ic-scopes': {
      bg: 'rgba(139,92,246,0.1)',
      text: '#c4b5fd',
      border: 'rgba(139,92,246,0.2)',
    },

    // Skeleton
    'ic-skeleton': {
      bg: 'rgba(30,41,59,0.3)',
      highlight: 'rgba(30,41,59,0.5)',
      static: 'rgba(30,41,59,0.4)',
    },
  },

  spacing: {
    // Card sizing
    'ic-card-w': '320px',
    'ic-card-min-w': '280px',
    'ic-card-max-w': '380px',
    'ic-card-gap': '20px',
    'ic-card-p': '20px',
    'ic-header-gap': '14px',

    // Logo
    'ic-logo-size': '48px',
    'ic-logo-size-sm': '40px',
    'ic-logo-icon': '28px',
    'ic-logo-icon-sm': '22px',

    // Description
    'ic-desc-min-h': '40px',
    'ic-desc-mt': '12px',

    // OAuth badge
    'ic-oauth-h': '28px',
    'ic-oauth-icon': '14px',
    'ic-oauth-gap': '6px',
    'ic-oauth-px': '10px',
    'ic-oauth-mt': '14px',

    // Connect button
    'ic-btn-h': '32px',
    'ic-btn-icon': '14px',

    // Divider
    'ic-divider-my': '14px',

    // Footer
    'ic-footer-pt': '14px',
    'ic-footer-icon': '12px',
    'ic-footer-gap': '12px',

    // Scopes badge
    'ic-scopes-h': '20px',
  },

  fontSize: {
    // Title
    'ic-title': ['0.9375rem', { lineHeight: '1.25', fontWeight: '600' }],
    // Provider
    'ic-provider': ['0.6875rem', { lineHeight: '1.25', fontWeight: '400' }],
    // Description
    'ic-description': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
    // OAuth status label
    'ic-oauth-label': ['0.75rem', { lineHeight: '1', fontWeight: '500' }],
    // Connect button
    'ic-btn': ['0.8125rem', { lineHeight: '1', fontWeight: '600' }],
    // Footer meta
    'ic-footer-meta': ['0.6875rem', { lineHeight: '1.25', fontWeight: '400' }],
    // Scopes badge
    'ic-scopes': ['0.625rem', { lineHeight: '1', fontWeight: '500' }],
  },

  borderRadius: {
    'ic-card': '12px',
    'ic-logo': '8px',
    'ic-oauth': '9999px',
    'ic-btn': '8px',
    'ic-scopes': '4px',
  },

  boxShadow: {
    'ic-card': '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(148,163,184,0.06)',
    'ic-card-hover': '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(148,163,184,0.1)',
    'ic-card-focus': '0 0 0 3px rgba(139,92,246,0.25)',
    'ic-logo': '0 1px 2px rgba(0,0,0,0.2)',
    'ic-connect-btn': '0 2px 8px rgba(124,58,237,0.35)',
    'ic-connect-btn-hover': '0 4px 12px rgba(124,58,237,0.45)',
    'ic-connected-pulse': '0 0 0 0 rgba(52,211,153,0.4)',
  },

  animation: {
    'ic-card-enter': 'ic-card-enter 250ms cubic-bezier(0.34,1.56,0.64,1)',
    'ic-status-change': 'ic-status-change 200ms ease-out',
    'ic-connected-pulse': 'ic-connected-pulse 600ms ease-out',
    'ic-spinner': 'ic-spinner 800ms linear infinite',
    'ic-skeleton-shimmer': 'ic-skeleton-shimmer 1.5s ease-in-out infinite',
    'ic-error-shake': 'ic-error-shake 400ms ease-out',
  },

  keyframes: {
    'ic-card-enter': {
      from: { opacity: '0', transform: 'scale(0.92) translateY(8px)' },
      to: { opacity: '1', transform: 'scale(1) translateY(0)' },
    },
    'ic-status-change': {
      '0%': { opacity: '0.6', transform: 'scale(0.95)' },
      '100%': { opacity: '1', transform: 'scale(1)' },
    },
    'ic-connected-pulse': {
      '0%': { boxShadow: '0 0 0 0 rgba(52,211,153,0.4)' },
      '70%': { boxShadow: '0 0 0 8px rgba(52,211,153,0)' },
      '100%': { boxShadow: '0 0 0 0 rgba(52,211,153,0)' },
    },
    'ic-spinner': {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    'ic-skeleton-shimmer': {
      from: { backgroundPosition: '-200% 0' },
      to: { backgroundPosition: '200% 0' },
    },
    'ic-error-shake': {
      '0%, 100%': { transform: 'translateX(0)' },
      '20%, 60%': { transform: 'translateX(-3px)' },
      '40%, 80%': { transform: 'translateX(3px)' },
    },
  },
} as const;
