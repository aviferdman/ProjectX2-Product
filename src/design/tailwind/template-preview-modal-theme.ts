/**
 * Crewspace — Tailwind CSS theme extensions for the Template Preview Modal
 * TASK-158: Design template preview modal (workflow diagram, details, use button)
 *
 * Merge into your tailwind.config.ts alongside other themes:
 *   import { templatePreviewModalTheme } from './src/design/tailwind/template-preview-modal-theme';
 *   export default { theme: { extend: { ...templateLibraryTheme, ...templatePreviewModalTheme } } };
 */

export const templatePreviewModalTheme = {
  colors: {
    'pm-overlay': 'rgba(0,0,0,0.7)',

    'pm-container': {
      bg: 'var(--cs-surface-panel)',
      border: 'var(--cs-border-default)',
    },

    'pm-header': {
      bg: 'var(--cs-surface-card)',
      border: 'var(--cs-border-subtle)',
      title: 'var(--cs-text-primary)',
      rating: 'var(--cs-text-secondary)',
      'star-filled': '#fbbf24',
      'star-empty': 'var(--cs-text-tertiary)',
      'close-icon': 'var(--cs-text-tertiary)',
      'close-icon-hover': 'var(--cs-text-primary)',
      'close-bg-hover': 'rgba(30,41,59,0.5)',
    },

    'pm-diagram': {
      bg: 'rgba(10,14,26,0.9)',
      border: 'var(--cs-border-subtle)',
      'grid-dot': 'rgba(113,113,122,0.08)',
      'node-agent-bg': 'rgba(99,102,241,0.15)',
      'node-agent-border': '#818cf8',
      'node-agent-icon': '#818cf8',
      'node-task-bg': 'rgba(14,165,233,0.15)',
      'node-task-border': '#06b6d4',
      'node-task-icon': '#22d3ee',
      'node-tool-bg': 'rgba(16,185,129,0.15)',
      'node-tool-border': '#10b981',
      'node-tool-icon': '#34d399',
      'node-llm-bg': 'rgba(245,158,11,0.15)',
      'node-llm-border': '#f59e0b',
      'node-llm-icon': '#fbbf24',
      edge: 'rgba(113,113,122,0.25)',
      'edge-active': '#818cf8',
      'ctrl-bg': 'rgba(15,23,42,0.8)',
      'ctrl-border': 'var(--cs-border-subtle)',
      'ctrl-btn': 'var(--cs-text-secondary)',
      'ctrl-btn-hover': 'var(--cs-text-primary)',
      'ctrl-btn-bg-hover': 'rgba(30,41,59,0.6)',
      'empty-icon': '#3f3f46',
      'empty-text': 'var(--cs-text-tertiary)',
    },

    'pm-sidebar': {
      bg: 'var(--cs-surface-card)',
      border: 'var(--cs-border-subtle)',
      divider: 'var(--cs-border-subtle)',
      label: 'var(--cs-text-tertiary)',
      'avatar-bg': 'rgba(99,102,241,0.15)',
      'avatar-text': '#a5b4fc',
      'author-name': 'var(--cs-text-primary)',
      'stat-icon': 'var(--cs-text-tertiary)',
      'stat-label': 'var(--cs-text-tertiary)',
      'stat-value': 'var(--cs-text-secondary)',
      description: 'var(--cs-text-secondary)',
      'comp-bg': 'rgba(30,41,59,0.3)',
      'comp-border': 'var(--cs-border-subtle)',
      'comp-label': 'var(--cs-text-secondary)',
      'comp-count': 'var(--cs-text-primary)',
      'comp-agent': '#818cf8',
      'comp-task': '#22d3ee',
      'comp-tool': '#34d399',
      'comp-llm': '#fbbf24',
    },

    'pm-tag': {
      bg: 'var(--cs-surface-elevated)',
      'bg-hover': 'rgba(99,102,241,0.12)',
      border: 'var(--cs-border-subtle)',
      text: 'var(--cs-text-tertiary)',
      'text-hover': '#a5b4fc',
    },

    'pm-footer': {
      bg: 'var(--cs-surface-card)',
      border: 'var(--cs-border-subtle)',
    },

    'pm-use-btn': {
      bg: '#6366f1',
      'bg-hover': '#818cf8',
      'bg-active': '#6d28d9',
      'bg-disabled': 'rgba(99,102,241,0.3)',
      text: '#ffffff',
      'text-disabled': 'rgba(255,255,255,0.5)',
    },

    'pm-canvas-btn': {
      bg: 'transparent',
      'bg-hover': 'rgba(99,102,241,0.12)',
      text: '#a5b4fc',
      'text-hover': '#ddd6fe',
      border: '#6366f1',
      'border-hover': '#818cf8',
    },
  },

  spacing: {
    'pm-modal-w': '900px',
    'pm-header-h': '64px',
    'pm-header-px': '24px',
    'pm-header-gap': '12px',
    'pm-diagram-h': '400px',
    'pm-diagram-p': '24px',
    'pm-sidebar-w': '300px',
    'pm-sidebar-p': '20px',
    'pm-sidebar-gap': '20px',
    'pm-footer-h': '64px',
    'pm-footer-px': '24px',
    'pm-footer-gap': '12px',
    'pm-node-w': '140px',
    'pm-node-h': '48px',
    'pm-close-size': '32px',
    'pm-avatar-size': '28px',
    'pm-badge-h': '24px',
    'pm-tag-h': '24px',
    'pm-comp-item-h': '32px',
    'pm-ctrl-btn-size': '28px',
    'pm-use-btn-h': '40px',
    'pm-use-btn-min-w': '160px',
    'pm-canvas-btn-h': '40px',
  },

  fontSize: {
    'pm-title': ['1.25rem', { lineHeight: '1.25', fontWeight: '700' }],
    'pm-badge': [
      '0.6875rem',
      { lineHeight: '1.25', fontWeight: '600', letterSpacing: '0.03em' },
    ],
    'pm-rating': ['0.8125rem', { lineHeight: '1.25', fontWeight: '500' }],
    'pm-section-label': [
      '0.6875rem',
      { lineHeight: '1.25', fontWeight: '600', letterSpacing: '0.05em' },
    ],
    'pm-author': ['0.8125rem', { lineHeight: '1.25', fontWeight: '500' }],
    'pm-stat-label': ['0.75rem', { lineHeight: '1.25', fontWeight: '400' }],
    'pm-stat-value': ['0.8125rem', { lineHeight: '1.5', fontWeight: '500' }],
    'pm-description': ['0.875rem', { lineHeight: '1.625', fontWeight: '400' }],
    'pm-comp-label': ['0.75rem', { lineHeight: '1.25', fontWeight: '400' }],
    'pm-comp-count': ['0.8125rem', { lineHeight: '1.25', fontWeight: '600' }],
    'pm-tag': ['0.6875rem', { lineHeight: '1', fontWeight: '500' }],
    'pm-node-label': ['0.6875rem', { lineHeight: '1.25', fontWeight: '500' }],
    'pm-btn': ['0.875rem', { lineHeight: '1', fontWeight: '600' }],
    'pm-btn-secondary': ['0.875rem', { lineHeight: '1', fontWeight: '500' }],
    'pm-date': ['0.75rem', { lineHeight: '1.25', fontWeight: '400' }],
  },

  maxHeight: {
    'pm-modal': '85vh',
    'pm-description': '160px',
  },

  boxShadow: {
    'pm-modal':
      '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(113,113,122,0.08)',
    'pm-node': '0 1px 4px rgba(0,0,0,0.3)',
    'pm-use-btn': '0 2px 8px rgba(99,102,241,0.35)',
    'pm-use-btn-hover': '0 4px 12px rgba(99,102,241,0.45)',
    'pm-focus-ring': '0 0 0 3px rgba(99,102,241,0.25)',
  },

  animation: {
    'pm-overlay-enter': 'pm-overlay-enter 200ms ease-out',
    'pm-overlay-exit': 'pm-overlay-exit 150ms ease-in',
    'pm-modal-enter':
      'pm-modal-enter 300ms cubic-bezier(0.34,1.56,0.64,1)',
    'pm-modal-exit': 'pm-modal-exit 200ms ease-in',
    'pm-node-enter':
      'pm-node-enter 250ms cubic-bezier(0.34,1.56,0.64,1)',
    'pm-edge-draw': 'pm-edge-draw 400ms ease-out',
    'pm-sidebar-enter': 'pm-sidebar-enter 200ms ease-out 150ms',
  },

  keyframes: {
    'pm-overlay-enter': {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    'pm-overlay-exit': {
      from: { opacity: '1' },
      to: { opacity: '0' },
    },
    'pm-modal-enter': {
      from: { opacity: '0', transform: 'scale(0.95) translateY(12px)' },
      to: { opacity: '1', transform: 'scale(1) translateY(0)' },
    },
    'pm-modal-exit': {
      from: { opacity: '1', transform: 'scale(1) translateY(0)' },
      to: { opacity: '0', transform: 'scale(0.95) translateY(8px)' },
    },
    'pm-node-enter': {
      from: { opacity: '0', transform: 'scale(0.85)' },
      to: { opacity: '1', transform: 'scale(1)' },
    },
    'pm-edge-draw': {
      from: { strokeDashoffset: '100', opacity: '0' },
      to: { strokeDashoffset: '0', opacity: '1' },
    },
    'pm-sidebar-enter': {
      from: { opacity: '0', transform: 'translateX(8px)' },
      to: { opacity: '1', transform: 'translateX(0)' },
    },
  },
} as const;
