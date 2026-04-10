/**
 * Crewspace — Tailwind CSS theme extensions for the Dashboard & Workflow Management UI
 * TASK-148: Design dashboard UI (workflow list, create, usage stats)
 *
 * Merge into your tailwind.config.ts alongside other themes:
 *   import { dashboardTheme } from './src/design/tailwind/dashboard-theme';
 *   export default { theme: { extend: { ...canvasTheme, ...timelineTheme, ...dashboardTheme } } };
 */

export const dashboardTheme = {
  colors: {
    dashboard: {
      bg: 'var(--cs-surface-app)',
      'header-bg': 'var(--cs-surface-panel)',
      'header-border': 'var(--cs-border-subtle)',
      'sidebar-bg': 'var(--cs-surface-panel)',
      'sidebar-border': 'var(--cs-border-subtle)',
    },
    'workflow-card': {
      bg: 'var(--cs-surface-card)',
      'bg-hover': 'var(--cs-surface-elevated)',
      border: 'var(--cs-border-default)',
      'border-hover': 'var(--cs-border-strong)',
      'thumb-bg': 'rgba(10,14,26,0.8)',
      title: 'var(--cs-text-primary)',
      desc: 'var(--cs-text-secondary)',
      meta: 'var(--cs-text-tertiary)',
    },
    'workflow-status': {
      draft: '#94a3b8',
      'draft-bg': 'rgba(148,163,184,0.1)',
      active: '#10b981',
      'active-bg': 'rgba(16,185,129,0.1)',
      error: '#f43f5e',
      'error-bg': 'rgba(244,63,94,0.1)',
      archived: '#64748b',
      'archived-bg': 'rgba(100,116,139,0.1)',
    },
    'workflow-list': {
      'row-hover': 'rgba(30,41,59,0.5)',
      'row-selected': 'rgba(139,92,246,0.08)',
      'row-border': 'var(--cs-border-subtle)',
      'header-bg': 'var(--cs-surface-card)',
      'header-text': 'var(--cs-text-tertiary)',
    },
    'create-btn': {
      bg: '#7c3aed',
      'bg-hover': '#8b5cf6',
      text: '#ffffff',
    },
    stat: {
      'card-bg': 'var(--cs-surface-card)',
      'card-border': 'var(--cs-border-default)',
      label: 'var(--cs-text-secondary)',
      value: 'var(--cs-text-primary)',
      'trend-up': '#34d399',
      'trend-down': '#fb7185',
      'icon-workflows': '#a78bfa',
      'icon-runs': '#38bdf8',
      'icon-agents': '#34d399',
      'icon-errors': '#fb7185',
    },
    'usage-bar': {
      bg: 'var(--cs-surface-elevated)',
      fill: '#8b5cf6',
      'fill-warning': '#f59e0b',
      'fill-critical': '#f43f5e',
    },
    upgrade: {
      bg: 'rgba(124,58,237,0.08)',
      border: '#6d28d9',
      text: 'var(--cs-text-secondary)',
      'cta-bg': '#7c3aed',
      'cta-bg-hover': '#8b5cf6',
      'cta-text': '#ffffff',
    },
    nav: {
      item: 'var(--cs-text-secondary)',
      'item-hover': 'var(--cs-text-primary)',
      'item-active': '#c4b5fd',
      'item-bg-hover': 'rgba(30,41,59,0.5)',
      'item-bg-active': 'rgba(139,92,246,0.12)',
      'item-border-active': '#7c3aed',
    },
  },

  spacing: {
    'dashboard-header-h': '56px',
    'dashboard-sidebar-w': '240px',
    'dashboard-sidebar-collapsed-w': '64px',
    'dashboard-content-max-w': '1280px',
    'dashboard-content-p': '24px',
    'dashboard-toolbar-h': '48px',
    'workflow-card-w': '320px',
    'workflow-card-min-w': '280px',
    'workflow-card-thumb-h': '160px',
    'workflow-card-body-p': '16px',
    'workflow-card-gap': '16px',
    'workflow-list-row-h': '56px',
    'stat-card-min-w': '200px',
    'stat-card-h': '100px',
    'stat-gap': '16px',
    'usage-bar-h': '6px',
    'search-h': '36px',
    'chip-h': '28px',
    'create-btn-h': '40px',
    'empty-icon-size': '64px',
  },

  fontSize: {
    'dashboard-page-title': ['1.5rem', { lineHeight: '1.25', fontWeight: '700' }],
    'dashboard-section-title': ['1rem', { lineHeight: '1.25', fontWeight: '600' }],
    'workflow-card-title': ['0.875rem', { lineHeight: '1.25', fontWeight: '600' }],
    'workflow-card-desc': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
    'workflow-card-meta': ['0.6875rem', { lineHeight: '1.25', fontWeight: '400' }],
    'workflow-status-badge': ['0.625rem', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.05em' }],
    'stat-value': ['1.5rem', { lineHeight: '1.25', fontWeight: '700' }],
    'stat-label': ['0.75rem', { lineHeight: '1.5', fontWeight: '500' }],
    'stat-trend': ['0.6875rem', { lineHeight: '1', fontWeight: '500' }],
    'nav-item': ['0.8125rem', { lineHeight: '1.25', fontWeight: '500' }],
    'nav-section': ['0.6875rem', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.05em' }],
    'search-input': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
    'filter-chip': ['0.6875rem', { lineHeight: '1', fontWeight: '500' }],
    'list-header': ['0.6875rem', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.05em' }],
    'create-btn-text': ['0.875rem', { lineHeight: '1', fontWeight: '600' }],
    'upgrade-text': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
    'empty-heading': ['1.125rem', { lineHeight: '1.25', fontWeight: '600' }],
    'empty-desc': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
  },

  boxShadow: {
    'workflow-card': '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(148,163,184,0.06)',
    'workflow-card-hover': '0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(148,163,184,0.1)',
    'create-btn': '0 2px 8px rgba(124,58,237,0.35)',
    'create-btn-hover': '0 4px 12px rgba(124,58,237,0.45)',
    'stat-card': '0 1px 3px rgba(0,0,0,0.2), 0 0 0 1px rgba(148,163,184,0.06)',
  },

  borderRadius: {
    'workflow-card': '12px',
    'stat-card': '12px',
    'search-input': '6px',
    'filter-chip': '9999px',
    'status-badge': '9999px',
    'usage-bar': '9999px',
    'create-btn': '8px',
    'upgrade-prompt': '12px',
    'empty-state': '12px',
  },

  transitionDuration: {
    'card-hover': '150ms',
    'thumb-hover': '200ms',
    'card-enter': '250ms',
    'filter-toggle': '150ms',
    'view-switch': '200ms',
    'empty-in': '300ms',
    'progress-fill': '400ms',
    'stat-count': '600ms',
  },

  animation: {
    'card-enter': 'card-enter 250ms cubic-bezier(0.34,1.56,0.64,1)',
    'stat-count-up': 'stat-count-up 600ms cubic-bezier(0.16,1,0.3,1)',
    'progress-fill': 'progress-fill 400ms ease-out',
    'view-switch': 'view-switch 200ms ease-out',
    'empty-state-in': 'empty-state-in 300ms ease-out',
  },

  keyframes: {
    'card-enter': {
      from: { opacity: '0', transform: 'scale(0.92) translateY(8px)' },
      to: { opacity: '1', transform: 'scale(1) translateY(0)' },
    },
    'stat-count-up': {
      from: { opacity: '0', transform: 'translateY(8px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    'progress-fill': {
      from: { width: '0' },
    },
    'view-switch': {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    'empty-state-in': {
      from: { opacity: '0', transform: 'translateY(12px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
  },
} as const;
