/**
 * Crewspace — Tailwind CSS theme extensions for the Debugging Timeline UI
 * TASK-140: Design debugging timeline UI (timeline chart, log viewer, filters)
 *
 * Merge into your tailwind.config.ts alongside canvas-theme:
 *   import { timelineTheme } from './src/design/tailwind/timeline-theme';
 *   export default { theme: { extend: { ...canvasTheme, ...timelineTheme } } };
 */

export const timelineTheme = {
  colors: {
    timeline: {
      bg: 'var(--cs-surface-app)',
      'header-bg': 'var(--cs-surface-panel)',
      'lane-bg': 'rgba(15,23,42,0.6)',
      'lane-bg-alt': 'rgba(15,23,42,0.8)',
      'lane-border': 'var(--cs-border-subtle)',
      'lane-label-bg': 'var(--cs-surface-panel)',
      'axis-line': '#334155',
      'axis-tick': '#475569',
      'axis-label': 'var(--cs-text-tertiary)',
      'axis-grid': 'rgba(148,163,184,0.06)',
      playhead: '#8b5cf6',
      'playhead-glow': 'rgba(139,92,246,0.3)',
      'selection-range': 'rgba(139,92,246,0.1)',
      'selection-border': '#a78bfa',
    },
    event: {
      llm: {
        bg: 'rgba(245,158,11,0.2)',
        border: '#f59e0b',
        icon: '#fbbf24',
      },
      tool: {
        bg: 'rgba(16,185,129,0.2)',
        border: '#10b981',
        icon: '#34d399',
      },
      'task-start': {
        bg: 'rgba(14,165,233,0.2)',
        border: '#0ea5e9',
        icon: '#38bdf8',
      },
      'task-complete': {
        bg: 'rgba(16,185,129,0.15)',
        border: '#10b981',
        icon: '#34d399',
      },
      error: {
        bg: 'rgba(244,63,94,0.2)',
        border: '#f43f5e',
        icon: '#fb7185',
      },
      message: {
        bg: 'rgba(139,92,246,0.15)',
        border: '#8b5cf6',
        icon: '#a78bfa',
      },
      selected: {
        ring: '#8b5cf6',
        glow: 'rgba(139,92,246,0.25)',
      },
    },
    log: {
      bg: 'var(--cs-surface-panel)',
      'header-bg': 'var(--cs-surface-card)',
      'row-bg-alt': 'rgba(30,41,59,0.3)',
      'row-bg-hover': 'rgba(30,41,59,0.6)',
      'row-bg-selected': 'rgba(139,92,246,0.1)',
      'row-border': 'rgba(51,65,85,0.3)',
      timestamp: '#64748b',
      'search-hl': 'rgba(251,191,36,0.3)',
      'search-hl-active': 'rgba(251,191,36,0.6)',
      level: {
        debug: '#94a3b8',
        info: '#38bdf8',
        warn: '#fbbf24',
        error: '#fb7185',
      },
      'level-bg': {
        debug: 'rgba(148,163,184,0.1)',
        info: 'rgba(14,165,233,0.1)',
        warn: 'rgba(245,158,11,0.1)',
        error: 'rgba(244,63,94,0.1)',
      },
    },
    filter: {
      'bar-bg': 'var(--cs-surface-card)',
      'chip-bg': 'var(--cs-surface-elevated)',
      'chip-bg-active': 'rgba(139,92,246,0.2)',
      'chip-border': 'var(--cs-border-default)',
      'chip-border-active': '#8b5cf6',
      'chip-text': 'var(--cs-text-secondary)',
      'chip-text-active': '#c4b5fd',
      'dropdown-bg': 'var(--cs-surface-card)',
      'dropdown-hover': 'var(--cs-surface-elevated)',
      'search-bg': 'var(--cs-surface-elevated)',
      'search-border': 'var(--cs-border-default)',
      'search-border-focus': '#8b5cf6',
    },
  },

  spacing: {
    'timeline-panel-min-h': '200px',
    'timeline-panel-h': '320px',
    'timeline-panel-max-h': '600px',
    'timeline-header-h': '44px',
    'timeline-axis-h': '32px',
    'timeline-lane-h': '48px',
    'timeline-lane-label-w': '160px',
    'timeline-event-h': '28px',
    'timeline-event-min-w': '8px',
    'timeline-event-marker': '12px',
    'timeline-playhead-w': '2px',
    'timeline-playhead-handle': '12px',
    'timeline-filter-bar-h': '40px',
    'timeline-chip-h': '28px',
    'timeline-resizer': '6px',
    'log-row-h': '32px',
    'log-ts-w': '100px',
    'log-level-w': '56px',
    'log-agent-w': '120px',
  },

  fontSize: {
    'timeline-axis': ['0.6875rem', { lineHeight: '1', fontWeight: '400' }],
    'timeline-lane-label': ['0.75rem', { lineHeight: '1.25', fontWeight: '600' }],
    'timeline-event-label': ['0.6875rem', { lineHeight: '1', fontWeight: '500' }],
    'log-timestamp': ['0.6875rem', { lineHeight: '1.5', fontWeight: '400', letterSpacing: '0' }],
    'log-level': ['0.625rem', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.05em' }],
    'log-message': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
    'log-agent': ['0.75rem', { lineHeight: '1.5', fontWeight: '500' }],
    'filter-chip': ['0.6875rem', { lineHeight: '1', fontWeight: '500' }],
    'filter-search': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
  },

  animation: {
    'playhead-pulse': 'playhead-pulse 2s ease-in-out infinite',
    'event-enter': 'event-enter 150ms ease-out',
    'lane-expand': 'lane-expand 200ms ease-out',
    'filter-chip-in': 'filter-chip-in 150ms ease-out',
  },

  keyframes: {
    'playhead-pulse': {
      '0%, 100%': { boxShadow: '0 0 4px 0 rgba(139,92,246,0.3)' },
      '50%': { boxShadow: '0 0 10px 3px rgba(139,92,246,0.3)' },
    },
    'event-enter': {
      from: { opacity: '0', transform: 'scaleX(0.7)' },
      to: { opacity: '1', transform: 'scaleX(1)' },
    },
    'lane-expand': {
      from: { maxHeight: '0', opacity: '0' },
      to: { maxHeight: '48px', opacity: '1' },
    },
    'filter-chip-in': {
      from: { opacity: '0', transform: 'scale(0.9)' },
      to: { opacity: '1', transform: 'scale(1)' },
    },
  },
} as const;
