/**
 * Crewspace — Tailwind CSS theme extensions for the Marketplace component
 * TASK-163: Design marketplace UI (integration browser, install flow)
 *
 * Merge into your tailwind.config.ts:
 *   import { marketplaceTheme } from './src/design/tailwind/marketplace-theme';
 *   export default { theme: { extend: { ...marketplaceTheme } } };
 */

export const marketplaceTheme = {
  colors: {
    // Page layout
    'mp-layout': {
      bg: 'var(--cs-surface-app)',
      'header-bg': 'var(--cs-surface-panel)',
      'header-border': 'var(--cs-border-default)',
      'sidebar-bg': 'var(--cs-surface-panel)',
      'sidebar-border': 'var(--cs-border-subtle)',
      'content-bg': 'var(--cs-surface-app)',
    },

    // Category sidebar
    'mp-category': {
      text: 'var(--cs-text-secondary)',
      'text-hover': 'var(--cs-text-primary)',
      'text-active': '#c4b5fd',
      'bg-hover': 'rgba(148,163,184,0.08)',
      'bg-active': 'rgba(139,92,246,0.1)',
      'section-label': 'var(--cs-text-tertiary)',
      // Category icon colors
      'ai-ml': '#a78bfa',
      'ai-ml-bg': 'rgba(167,139,250,0.15)',
      communication: '#38bdf8',
      'communication-bg': 'rgba(56,189,248,0.15)',
      data: '#34d399',
      'data-bg': 'rgba(52,211,153,0.15)',
      devtools: '#fbbf24',
      'devtools-bg': 'rgba(251,191,36,0.15)',
      productivity: '#fb7185',
      'productivity-bg': 'rgba(251,113,133,0.15)',
      storage: '#cbd5e1',
      'storage-bg': 'rgba(203,213,225,0.15)',
    },

    // Search bar
    'mp-search': {
      bg: 'rgba(30,41,59,0.5)',
      border: 'var(--cs-border-default)',
      'border-focus': '#8b5cf6',
      placeholder: 'var(--cs-text-tertiary)',
      text: 'var(--cs-text-primary)',
      icon: 'var(--cs-text-tertiary)',
    },

    // Filter chips
    'mp-filter': {
      'chip-bg': 'rgba(30,41,59,0.4)',
      'chip-bg-active': 'rgba(139,92,246,0.15)',
      'chip-border': 'var(--cs-border-subtle)',
      'chip-border-active': 'rgba(139,92,246,0.4)',
      'chip-text': 'var(--cs-text-secondary)',
      'chip-text-active': '#c4b5fd',
      'count-bg': 'rgba(148,163,184,0.12)',
      'count-text': 'var(--cs-text-tertiary)',
    },

    // Sort dropdown
    'mp-sort': {
      bg: 'rgba(30,41,59,0.6)',
      'bg-hover': 'rgba(30,41,59,0.8)',
      border: 'var(--cs-border-default)',
      text: 'var(--cs-text-secondary)',
      'text-active': 'var(--cs-text-primary)',
      'menu-bg': 'var(--cs-surface-elevated)',
      'menu-border': 'var(--cs-border-default)',
      'item-bg-hover': 'rgba(139,92,246,0.08)',
    },

    // Featured banner
    'mp-featured': {
      border: 'rgba(139,92,246,0.25)',
      'badge-bg': 'rgba(251,191,36,0.15)',
      'badge-text': '#fcd34d',
      'badge-border': 'rgba(251,191,36,0.3)',
      title: 'var(--cs-text-primary)',
      desc: 'var(--cs-text-secondary)',
    },

    // Install button states
    'mp-install-btn': {
      bg: '#7c3aed',
      'bg-hover': '#8b5cf6',
      'bg-active': '#6d28d9',
      text: '#ffffff',
      // Installing state
      'installing-bg': 'rgba(139,92,246,0.15)',
      'installing-text': '#c4b5fd',
      'installing-border': 'rgba(139,92,246,0.3)',
      // Installed state
      'installed-bg': 'rgba(52,211,153,0.12)',
      'installed-text': '#34d399',
      'installed-border': 'rgba(52,211,153,0.3)',
      'installed-icon': '#34d399',
      // Uninstall state
      'uninstall-text': 'var(--cs-text-secondary)',
      'uninstall-text-hover': '#fb7185',
      'uninstall-bg-hover': 'rgba(251,113,133,0.1)',
      'uninstall-border': 'var(--cs-border-default)',
      'uninstall-border-hover': 'rgba(251,113,133,0.3)',
    },

    // Progress bar
    'mp-progress': {
      track: 'rgba(30,41,59,0.5)',
      fill: '#8b5cf6',
      'fill-complete': '#10b981',
      'fill-error': '#f43f5e',
      shimmer: 'rgba(255,255,255,0.15)',
    },

    // Install modal
    'mp-modal': {
      overlay: 'rgba(0,0,0,0.6)',
      bg: 'var(--cs-surface-elevated)',
      border: 'var(--cs-border-default)',
      'header-bg': 'var(--cs-surface-panel)',
      'header-border': 'var(--cs-border-subtle)',
      title: 'var(--cs-text-primary)',
      subtitle: 'var(--cs-text-secondary)',
      'close-icon': 'var(--cs-text-tertiary)',
      'close-icon-hover': 'var(--cs-text-primary)',
    },

    // Permission list
    'mp-permission': {
      'icon-granted': '#34d399',
      'icon-required': '#fbbf24',
      'icon-optional': 'var(--cs-text-tertiary)',
      text: 'var(--cs-text-primary)',
      desc: 'var(--cs-text-secondary)',
      divider: 'var(--cs-border-subtle)',
    },

    // Install status steps
    'mp-status': {
      'pending-text': 'var(--cs-text-tertiary)',
      'pending-icon': '#64748b',
      'running-text': '#c4b5fd',
      'running-icon': '#a78bfa',
      'success-text': '#34d399',
      'success-icon': '#34d399',
      'error-text': '#fb7185',
      'error-icon': '#fb7185',
      connector: 'var(--cs-border-subtle)',
      'connector-done': '#10b981',
    },

    // Pagination
    'mp-pagination': {
      bg: 'transparent',
      'bg-hover': 'rgba(148,163,184,0.08)',
      'bg-active': 'rgba(139,92,246,0.15)',
      text: 'var(--cs-text-secondary)',
      'text-active': '#c4b5fd',
    },

    // Empty state
    'mp-empty': {
      icon: '#475569',
      heading: 'var(--cs-text-primary)',
      desc: 'var(--cs-text-secondary)',
      border: 'var(--cs-border-subtle)',
    },
  },

  spacing: {
    // Layout
    'mp-header-h': '56px',
    'mp-sidebar-w': '240px',
    'mp-content-max-w': '1440px',
    'mp-content-p': '24px',
    'mp-toolbar-h': '52px',

    // Grid
    'mp-card-w': '300px',
    'mp-card-min-w': '260px',
    'mp-card-max-w': '360px',
    'mp-card-gap': '20px',

    // Featured
    'mp-featured-h': '200px',
    'mp-featured-badge-h': '22px',

    // Category sidebar
    'mp-cat-item-h': '36px',
    'mp-cat-item-gap': '4px',
    'mp-cat-icon-size': '18px',
    'mp-section-gap': '16px',

    // Search
    'mp-search-h': '40px',

    // Filter chips
    'mp-chip-h': '30px',
    'mp-chip-gap': '8px',

    // Install button
    'mp-install-btn-h': '36px',
    'mp-install-btn-icon': '16px',

    // Progress bar
    'mp-progress-h': '4px',

    // Install modal
    'mp-modal-w': '520px',
    'mp-modal-header-h': '56px',
    'mp-modal-body-p': '24px',
    'mp-modal-close-size': '32px',
    'mp-modal-icon-size': '48px',

    // Permission list
    'mp-perm-item-h': '40px',
    'mp-perm-item-gap': '8px',
    'mp-perm-icon-size': '20px',

    // Pagination
    'mp-page-btn-size': '32px',
    'mp-page-gap': '4px',

    // Empty state
    'mp-empty-icon-size': '72px',
  },

  fontSize: {
    // Page-level typography
    'mp-page-title': ['1.5rem', { lineHeight: '1.25', fontWeight: '700' }],
    'mp-page-subtitle': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
    'mp-section-title': ['1.125rem', { lineHeight: '1.25', fontWeight: '600' }],

    // Sidebar
    'mp-sidebar-label': ['0.6875rem', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.05em' }],
    'mp-sidebar-item': ['0.8125rem', { lineHeight: '1.25', fontWeight: '500' }],

    // Filter/sort
    'mp-chip-label': ['0.75rem', { lineHeight: '1', fontWeight: '500' }],
    'mp-sort-label': ['0.8125rem', { lineHeight: '1', fontWeight: '500' }],

    // Install button
    'mp-install-btn': ['0.8125rem', { lineHeight: '1', fontWeight: '600' }],

    // Modal
    'mp-modal-title': ['1.125rem', { lineHeight: '1.25', fontWeight: '600' }],
    'mp-modal-subtitle': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],

    // Permission list
    'mp-perm-label': ['0.8125rem', { lineHeight: '1.25', fontWeight: '500' }],
    'mp-perm-desc': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],

    // Status steps
    'mp-status-label': ['0.75rem', { lineHeight: '1.25', fontWeight: '500' }],

    // Empty state
    'mp-empty-heading': ['1rem', { lineHeight: '1.25', fontWeight: '600' }],
    'mp-empty-desc': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],

    // Featured
    'mp-featured-title': ['1.25rem', { lineHeight: '1.25', fontWeight: '700' }],
    'mp-featured-desc': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
    'mp-featured-badge': ['0.5625rem', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.05em' }],

    // Pagination
    'mp-page-btn': ['0.75rem', { lineHeight: '1', fontWeight: '500' }],
  },

  maxHeight: {
    'mp-modal': '80vh',
  },

  boxShadow: {
    // Install button shadows
    'mp-install-btn': '0 2px 8px rgba(124,58,237,0.35)',
    'mp-install-btn-hover': '0 4px 12px rgba(124,58,237,0.45)',
    // Modal shadow
    'mp-modal': '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(148,163,184,0.06)',
    // Success pulse
    'mp-success-pulse': '0 0 0 0 rgba(52,211,153,0.4)',
  },

  animation: {
    'mp-card-enter': 'mp-card-enter 250ms cubic-bezier(0.34,1.56,0.64,1)',
    'mp-modal-enter': 'mp-modal-enter 300ms cubic-bezier(0.34,1.56,0.64,1)',
    'mp-overlay-fade': 'mp-overlay-fade 200ms ease-out',
    'mp-progress-shimmer': 'mp-progress-shimmer 1.5s ease-in-out infinite',
    'mp-spinner': 'mp-spinner 800ms linear infinite',
    'mp-success-pulse': 'mp-success-pulse 600ms ease-out',
    'mp-grid-reflow': 'mp-grid-reflow 200ms ease-out',
    'mp-empty-in': 'mp-empty-in 300ms ease-out',
    'mp-status-step': 'mp-status-step-enter 200ms ease-out',
  },

  keyframes: {
    'mp-card-enter': {
      from: { opacity: '0', transform: 'scale(0.92) translateY(8px)' },
      to: { opacity: '1', transform: 'scale(1) translateY(0)' },
    },
    'mp-modal-enter': {
      from: { opacity: '0', transform: 'scale(0.95) translateY(12px)' },
      to: { opacity: '1', transform: 'scale(1) translateY(0)' },
    },
    'mp-overlay-fade': {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    'mp-progress-shimmer': {
      from: { backgroundPosition: '-200% 0' },
      to: { backgroundPosition: '200% 0' },
    },
    'mp-spinner': {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    'mp-success-pulse': {
      '0%': { boxShadow: '0 0 0 0 rgba(52,211,153,0.4)' },
      '70%': { boxShadow: '0 0 0 8px rgba(52,211,153,0)' },
      '100%': { boxShadow: '0 0 0 0 rgba(52,211,153,0)' },
    },
    'mp-grid-reflow': {
      from: { opacity: '0.6' },
      to: { opacity: '1' },
    },
    'mp-empty-in': {
      from: { opacity: '0', transform: 'translateY(12px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    'mp-status-step-enter': {
      from: { opacity: '0', transform: 'translateX(-8px)' },
      to: { opacity: '1', transform: 'translateX(0)' },
    },
  },
} as const;
