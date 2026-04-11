/**
 * Crewspace — Tailwind CSS theme extensions for the Visual Canvas UI
 * TASK-132: Design visual canvas UI
 * TASK-139: Design QA — canvas implementation vs specs
 *
 * Merge into your tailwind.config.ts:
 *   import { crewspaceTheme } from './src/design/tailwind/canvas-theme';
 *   export default { theme: { extend: crewspaceTheme } };
 */

export const crewspaceTheme = {
  colors: {
    brand: {
      primary: '#6366f1',
      secondary: '#818cf8',
      subtle: '#eef2ff',
      accent: '#06b6d4',
    },
    surface: {
      app: '#09090b',
      canvas: '#0c0c14',
      panel: '#111113',
      card: '#18181b',
      elevated: '#27272a',
    },
    canvas: {
      'grid-dot': 'rgba(113,113,122,0.12)',
      'grid-line': 'rgba(113,113,122,0.06)',
      'selection-bg': 'rgba(99,102,241,0.08)',
      'selection-border': 'rgba(99,102,241,0.5)',
      'minimap-bg': 'rgba(17,17,19,0.9)',
      'minimap-viewport': 'rgba(99,102,241,0.3)',
      'edge-label-bg': 'rgba(17,17,19,0.9)',
    },
    node: {
      agent: {
        bg: 'rgba(99,102,241,0.12)',
        border: '#6366f1',
        icon: '#818cf8',
      },
      task: {
        bg: 'rgba(6,182,212,0.12)',
        border: '#0891b2',
        icon: '#22d3ee',
      },
      tool: {
        bg: 'rgba(16,185,129,0.12)',
        border: '#059669',
        icon: '#34d399',
      },
      llm: {
        bg: 'rgba(245,158,11,0.12)',
        border: '#d97706',
        icon: '#fbbf24',
      },
      selected: {
        ring: '#818cf8',
        glow: 'rgba(99,102,241,0.25)',
      },
      running: '#34d399',
      error: '#f87171',
    },
    handle: {
      bg: '#18181b',
      border: '#52525b',
      'hover-bg': '#6366f1',
      'hover-border': '#818cf8',
      'connected-bg': '#818cf8',
    },
    edge: {
      DEFAULT: '#52525b',
      active: '#818cf8',
      'data-flow': '#22d3ee',
      error: '#f87171',
    },
    border: {
      DEFAULT: '#27272a',
      subtle: '#1c1c1f',
      strong: '#3f3f46',
      focus: '#818cf8',
    },
    text: {
      primary: '#fafafa',
      secondary: '#a1a1aa',
      tertiary: '#71717a',
      inverse: '#09090b',
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
    },
  },

  fontFamily: {
    sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ["'JetBrains Mono'", "'Fira Code'", 'ui-monospace', 'monospace'],
  },

  fontSize: {
    'node-title': ['0.8125rem', { lineHeight: '1.25', fontWeight: '600' }],
    'node-body': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
    'node-badge': ['0.625rem', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.05em' }],
    'panel-heading': ['0.8125rem', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '0.025em' }],
    'toolbar-label': ['0.6875rem', { lineHeight: '1', fontWeight: '500', letterSpacing: '0.025em' }],
    'property-label': ['0.75rem', { lineHeight: '1.5', fontWeight: '500' }],
    'property-value': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
  },

  spacing: {
    'node-w': '220px',
    'node-min-w': '180px',
    'node-max-w': '280px',
    'node-gap': '6px',
    'node-header-h': '40px',
    'toolbar-h': '48px',
    'toolbar-padding': '0 12px',
    'toolbar-divider-gap': '8px',
    'sidebar-w': '280px',
    'sidebar-collapsed-w': '48px',
    'sidebar-padding': '12px',
    'properties-w': '320px',
    'properties-padding': '16px',
    'properties-header-h': '48px',
    'minimap-w': '200px',
    'minimap-h': '140px',
    'minimap-margin': '16px',
    'canvas-grid-size': '20px',
    'canvas-snap-grid': '10px',
    'edge-arrow-size': '12px',
    'handle-size': '10px',
    'handle-hit-area': '20px',
    'handle-border-width': '2px',
  },

  borderRadius: {
    node: '10px',
    minimap: '8px',
    'edge-label': '4px',
  },

  boxShadow: {
    node: '0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(113,113,122,0.1)',
    'node-hover': '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(113,113,122,0.15)',
    'node-selected': '0 0 0 2px #818cf8, 0 4px 20px rgba(99,102,241,0.25)',
    panel: '0 1px 3px rgba(0,0,0,0.3)',
    toolbar: '0 2px 12px rgba(0,0,0,0.35)',
    dropdown: '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(113,113,122,0.1)',
  },

  opacity: {
    minimap: '0.85',
    'node-disabled': '0.4',
  },

  transitionTimingFunction: {
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  animation: {
    'node-enter': 'node-enter 200ms cubic-bezier(0.34,1.56,0.64,1)',
    'running-pulse': 'running-pulse 1.5s ease-in-out infinite',
    'error-pulse': 'error-pulse 1.5s ease-in-out infinite',
    'edge-flow': 'edge-flow 1s linear infinite',
    'edge-draw': 'edge-draw 300ms ease-out',
  },

  keyframes: {
    'node-enter': {
      '0%': { opacity: '0', transform: 'scale(0.85)' },
      '60%': { opacity: '1', transform: 'scale(1.03)' },
      '100%': { transform: 'scale(1)' },
    },
    'running-pulse': {
      '0%, 100%': { boxShadow: '0 0 0 0 rgba(52,211,153,0.35)' },
      '50%': { boxShadow: '0 0 8px 2px rgba(52,211,153,0.35)' },
    },
    'error-pulse': {
      '0%, 100%': { boxShadow: '0 0 0 0 rgba(244,63,94,0.3)' },
      '50%': { boxShadow: '0 0 6px 2px rgba(244,63,94,0.3)' },
    },
    'edge-flow': {
      to: { strokeDashoffset: '-10' },
    },
    'edge-draw': {
      from: { strokeDasharray: '0 100%' },
      to: { strokeDasharray: '100% 0' },
    },
  },
} as const;
