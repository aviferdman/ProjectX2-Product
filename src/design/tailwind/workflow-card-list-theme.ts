/**
 * Crewspace — Tailwind CSS theme extensions for Workflow Card & List Views
 * TASK-149: Design workflow card/list views (thumbnails, metadata, actions)
 *
 * Merge into your tailwind.config.ts alongside other themes:
 *   import { workflowCardListTheme } from './src/design/tailwind/workflow-card-list-theme';
 *   export default { theme: { extend: { ...dashboardTheme, ...workflowCardListTheme } } };
 */

export const workflowCardListTheme = {
  colors: {
    'wf-card': {
      bg: 'var(--cs-surface-card)',
      'bg-hover': 'var(--cs-surface-elevated)',
      'bg-selected': 'rgba(99,102,241,0.06)',
      border: 'var(--cs-border-default)',
      'border-hover': 'var(--cs-border-strong)',
      'border-selected': '#818cf8',
      title: 'var(--cs-text-primary)',
      desc: 'var(--cs-text-secondary)',
      meta: 'var(--cs-text-tertiary)',
      'meta-separator': '#3f3f46',
    },
    'wf-thumb': {
      bg: 'rgba(10,14,26,0.8)',
      border: 'var(--cs-border-subtle)',
      'node-agent': '#818cf8',
      'node-task': '#22d3ee',
      'node-tool': '#34d399',
      'node-llm': '#fbbf24',
      edge: 'rgba(113,113,122,0.25)',
      placeholder: '#3f3f46',
      'running-pulse': '#34d399',
    },
    'wf-status': {
      draft: '#a1a1aa',
      'draft-bg': 'rgba(113,113,122,0.1)',
      active: '#10b981',
      'active-bg': 'rgba(16,185,129,0.1)',
      running: '#34d399',
      'running-bg': 'rgba(52,211,153,0.1)',
      error: '#ef4444',
      'error-bg': 'rgba(244,63,94,0.1)',
      paused: '#fbbf24',
      'paused-bg': 'rgba(251,191,36,0.1)',
      archived: '#52525b',
      'archived-bg': 'rgba(100,116,139,0.1)',
    },
    'wf-action': {
      trigger: 'var(--cs-text-tertiary)',
      'trigger-hover': 'var(--cs-text-primary)',
      'trigger-bg-hover': 'rgba(113,113,122,0.1)',
      'menu-bg': 'var(--cs-surface-elevated)',
      'menu-border': 'var(--cs-border-default)',
      item: 'var(--cs-text-secondary)',
      'item-hover': 'var(--cs-text-primary)',
      'item-bg-hover': 'rgba(113,113,122,0.08)',
      'item-icon': 'var(--cs-text-tertiary)',
      destructive: '#f87171',
      'destructive-hover': '#fda4af',
      'destructive-bg-hover': 'rgba(244,63,94,0.08)',
    },
    'wf-quick': {
      bg: 'rgba(15,23,42,0.8)',
      'bg-hover': 'rgba(15,23,42,0.95)',
      border: 'var(--cs-border-default)',
      icon: 'var(--cs-text-secondary)',
      'icon-hover': 'var(--cs-text-primary)',
    },
    'wf-list': {
      'row-hover': 'rgba(30,41,59,0.5)',
      'row-selected': 'rgba(99,102,241,0.08)',
      'row-border': 'var(--cs-border-subtle)',
      'header-bg': 'var(--cs-surface-card)',
      'header-text': 'var(--cs-text-tertiary)',
      'sort-active': '#818cf8',
      'checkbox-border': 'var(--cs-border-default)',
      'checkbox-checked': '#6366f1',
      'icon-bg': 'rgba(99,102,241,0.1)',
      'icon-color': '#818cf8',
    },
    'wf-bulk': {
      bg: 'var(--cs-surface-elevated)',
      border: 'var(--cs-border-default)',
      'btn-bg': 'rgba(113,113,122,0.08)',
      'btn-bg-hover': 'rgba(113,113,122,0.15)',
      'btn-text': 'var(--cs-text-secondary)',
      'btn-text-hover': 'var(--cs-text-primary)',
      count: 'var(--cs-text-primary)',
    },
    'wf-avatar': {
      border: 'var(--cs-surface-card)',
      'overflow-bg': 'var(--cs-surface-elevated)',
      'overflow-text': 'var(--cs-text-tertiary)',
    },
  },

  spacing: {
    'wf-card-w': '320px',
    'wf-card-min-w': '280px',
    'wf-card-max-w': '360px',
    'wf-card-gap': '16px',
    'wf-thumb-h': '160px',
    'wf-thumb-h-compact': '120px',
    'wf-card-body-p': '16px',
    'wf-card-body-gap': '8px',
    'wf-card-footer-p': '12px',
    'wf-meta-gap': '8px',
    'wf-meta-icon-size': '12px',
    'wf-avatar-size': '20px',
    'wf-avatar-overlap': '-4px',
    'wf-action-trigger': '28px',
    'wf-action-menu-w': '200px',
    'wf-qa-btn': '28px',
    'wf-list-row-h': '56px',
    'wf-list-header-h': '40px',
    'wf-list-checkbox': '16px',
    'wf-list-icon': '32px',
    'wf-bulk-h': '44px',
    'wf-bulk-btn-h': '28px',
  },

  fontSize: {
    'wf-card-title': ['0.875rem', { lineHeight: '1.25', fontWeight: '600' }],
    'wf-card-desc': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
    'wf-card-meta': ['0.6875rem', { lineHeight: '1.25', fontWeight: '400' }],
    'wf-status-badge': [
      '0.625rem',
      { lineHeight: '1', fontWeight: '600', letterSpacing: '0.05em' },
    ],
    'wf-action-item': ['0.8125rem', { lineHeight: '1.25', fontWeight: '400' }],
    'wf-avatar-overflow': ['0.5625rem', { lineHeight: '1', fontWeight: '500' }],
    'wf-list-header': [
      '0.6875rem',
      { lineHeight: '1', fontWeight: '600', letterSpacing: '0.05em' },
    ],
    'wf-list-name': ['0.8125rem', { lineHeight: '1.25', fontWeight: '500' }],
    'wf-list-subtitle': ['0.6875rem', { lineHeight: '1.25', fontWeight: '400' }],
  },

  boxShadow: {
    'wf-card': '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(113,113,122,0.06)',
    'wf-card-hover': '0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(113,113,122,0.1)',
    'wf-card-selected': '0 0 0 2px rgba(99,102,241,0.5), 0 4px 12px rgba(0,0,0,0.3)',
    'wf-action-menu': '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(113,113,122,0.1)',
    'wf-bulk': '0 4px 24px rgba(0,0,0,0.5)',
  },

  animation: {
    'wf-card-enter': 'wf-card-enter 250ms cubic-bezier(0.34,1.56,0.64,1)',
    'wf-quick-actions-in': 'wf-quick-actions-in 150ms ease-out',
    'wf-action-menu-in': 'wf-action-menu-in 120ms cubic-bezier(0.16,1,0.3,1)',
    'wf-status-dot-pulse': 'wf-status-dot-pulse 2s ease-in-out infinite',
    'wf-row-enter': 'wf-row-enter 200ms ease-out',
    'wf-bulk-bar-in': 'wf-bulk-bar-in 200ms cubic-bezier(0.34,1.56,0.64,1)',
  },

  keyframes: {
    'wf-card-enter': {
      from: { opacity: '0', transform: 'scale(0.92) translateY(8px)' },
      to: { opacity: '1', transform: 'scale(1) translateY(0)' },
    },
    'wf-quick-actions-in': {
      from: { opacity: '0', transform: 'translateY(4px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    'wf-action-menu-in': {
      from: { opacity: '0', transform: 'scale(0.95) translateY(-4px)' },
      to: { opacity: '1', transform: 'scale(1) translateY(0)' },
    },
    'wf-status-dot-pulse': {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.4' },
    },
    'wf-row-enter': {
      from: { opacity: '0', transform: 'translateX(-8px)' },
      to: { opacity: '1', transform: 'translateX(0)' },
    },
    'wf-bulk-bar-in': {
      from: { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
      to: { opacity: '1', transform: 'translateY(0) scale(1)' },
    },
  },
} as const;
