/**
 * Crewspace — Tailwind CSS theme extensions for Action/Event Cards
 * TASK-141: Design action/event cards (LLM calls, tool use, task completion)
 *
 * Merge into your tailwind.config.ts alongside other themes:
 *   import { actionEventCardsTheme } from './src/design/tailwind/action-event-cards-theme';
 *   export default { theme: { extend: { ...actionEventCardsTheme } } };
 */

export const actionEventCardsTheme = {
  colors: {
    'action-card': {
      bg: 'var(--cs-surface-card)',
      'bg-hover': 'var(--cs-surface-elevated)',
      border: 'var(--cs-border-default)',
      divider: 'rgba(51,65,85,0.4)',
      'header-text': 'var(--cs-text-primary)',
      'label-text': 'var(--cs-text-tertiary)',
      'value-text': 'var(--cs-text-secondary)',
      'code-bg': 'rgba(15,23,42,0.6)',
      'code-border': 'rgba(51,65,85,0.5)',
      'metrics-bg': 'rgba(15,23,42,0.4)',
      'metrics-divider': 'rgba(51,65,85,0.5)',
      'badge-bg': 'rgba(30,41,59,0.6)',
      'close-icon': '#52525b',
      'close-icon-hover': '#cbd5e1',
    },
    'card-llm': {
      accent: '#f59e0b',
      'accent-subtle': 'rgba(245,158,11,0.1)',
      'icon-bg': 'rgba(245,158,11,0.15)',
      icon: '#fbbf24',
      'badge-text': '#fbbf24',
      'badge-bg': 'rgba(245,158,11,0.12)',
    },
    'card-tool': {
      accent: '#10b981',
      'accent-subtle': 'rgba(16,185,129,0.1)',
      'icon-bg': 'rgba(16,185,129,0.15)',
      icon: '#34d399',
      'badge-text': '#34d399',
      'badge-bg': 'rgba(16,185,129,0.12)',
    },
    'card-task-start': {
      accent: '#06b6d4',
      'accent-subtle': 'rgba(14,165,233,0.1)',
      'icon-bg': 'rgba(14,165,233,0.15)',
      icon: '#22d3ee',
      'badge-text': '#22d3ee',
      'badge-bg': 'rgba(14,165,233,0.12)',
    },
    'card-task-complete': {
      accent: '#10b981',
      'accent-subtle': 'rgba(16,185,129,0.08)',
      'icon-bg': 'rgba(16,185,129,0.15)',
      icon: '#34d399',
      'badge-text': '#34d399',
      'badge-bg': 'rgba(16,185,129,0.12)',
    },
    'card-error': {
      accent: '#ef4444',
      'accent-subtle': 'rgba(244,63,94,0.1)',
      'icon-bg': 'rgba(244,63,94,0.15)',
      icon: '#f87171',
      'badge-text': '#f87171',
      'badge-bg': 'rgba(244,63,94,0.12)',
    },
    'card-message': {
      accent: '#818cf8',
      'accent-subtle': 'rgba(99,102,241,0.1)',
      'icon-bg': 'rgba(99,102,241,0.15)',
      icon: '#818cf8',
      'badge-text': '#818cf8',
      'badge-bg': 'rgba(99,102,241,0.12)',
    },
    'card-status': {
      running: '#34d399',
      'running-glow': 'rgba(52,211,153,0.4)',
      completed: '#10b981',
      error: '#ef4444',
      pending: '#52525b',
    },
  },

  spacing: {
    'card-w': '380px',
    'card-min-w': '320px',
    'card-max-w': '480px',
    'card-padding': '16px',
    'card-gap': '12px',
    'card-header-h': '44px',
    'card-section-gap': '8px',
    'card-code-padding': '12px',
    'card-code-max-h': '200px',
    'card-metrics-padding': '12px',
    'card-metrics-gap': '16px',
  },

  borderRadius: {
    'card': '10px',
    'card-code': '6px',
    'card-metrics': '8px',
    'card-badge': '9999px',
    'card-icon': '10px',
  },

  fontSize: {
    'card-title': ['0.875rem', { lineHeight: '1.25', fontWeight: '600' }],
    'card-subtitle': ['0.75rem', { lineHeight: '1.25', fontWeight: '500' }],
    'card-label': ['0.6875rem', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.04em' }],
    'card-value': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
    'card-code': ['0.75rem', { lineHeight: '1.6', fontWeight: '400' }],
    'card-metric': ['1.125rem', { lineHeight: '1.2', fontWeight: '700' }],
    'card-metric-label': ['0.625rem', { lineHeight: '1.2', fontWeight: '500' }],
  },

  boxShadow: {
    'action-card': '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(113,113,122,0.08)',
    'action-card-hover': '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(113,113,122,0.12)',
    'action-card-selected': '0 0 0 2px #818cf8, 0 4px 24px rgba(99,102,241,0.2)',
  },

  animation: {
    'card-enter': 'card-enter 200ms cubic-bezier(0.34,1.56,0.64,1)',
    'card-exit': 'card-exit 150ms ease-in forwards',
    'section-expand': 'section-expand 200ms ease-out',
    'metric-count': 'metric-count 600ms ease-out',
    'success-pulse': 'success-pulse 1.5s ease-in-out',
    'error-shake': 'error-shake 400ms ease-out',
    'status-dot-pulse': 'status-dot-pulse 2s ease-in-out infinite',
  },

  keyframes: {
    'card-enter': {
      from: { opacity: '0', transform: 'scale(0.95) translateY(8px)' },
      to: { opacity: '1', transform: 'scale(1) translateY(0)' },
    },
    'card-exit': {
      from: { opacity: '1', transform: 'scale(1) translateY(0)' },
      to: { opacity: '0', transform: 'scale(0.95) translateY(8px)' },
    },
    'section-expand': {
      from: { maxHeight: '0', opacity: '0' },
      to: { maxHeight: '500px', opacity: '1' },
    },
    'metric-count': {
      from: { opacity: '0', transform: 'translateY(4px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    'success-pulse': {
      '0%, 100%': { transform: 'scale(1)', opacity: '1' },
      '50%': { transform: 'scale(1.15)', opacity: '0.8' },
    },
    'error-shake': {
      '0%, 100%': { transform: 'translateX(0)' },
      '15%, 45%, 75%': { transform: 'translateX(-3px)' },
      '30%, 60%': { transform: 'translateX(3px)' },
    },
    'status-dot-pulse': {
      '0%, 100%': { boxShadow: '0 0 0 0 rgba(52,211,153,0.4)' },
      '50%': { boxShadow: '0 0 0 4px rgba(52,211,153,0.4)' },
    },
  },
} as const;

/** Lucide icon mapping for each action/event card type */
export const actionCardIcons = {
  'llm-call': 'zap',
  'tool-use': 'wrench',
  'task-start': 'play',
  'task-complete': 'check-circle-2',
  error: 'alert-triangle',
  message: 'message-square',
} as const;

/** Card type display labels */
export const actionCardLabels = {
  'llm-call': 'LLM Call',
  'tool-use': 'Tool Execution',
  'task-start': 'Task Started',
  'task-complete': 'Task Completed',
  error: 'Error',
  message: 'Agent Message',
} as const;
