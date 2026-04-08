/**
 * Crewspace — Tailwind CSS theme extensions for the Visual Canvas UI
 * TASK-132: Design visual canvas UI
 *
 * Merge into your tailwind.config.ts:
 *   import { crewspaceTheme } from './src/design/tailwind/canvas-theme';
 *   export default { theme: { extend: crewspaceTheme } };
 */

export const crewspaceTheme = {
  colors: {
    brand: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      subtle: '#ede9fe',
    },
    surface: {
      app: '#020617',
      canvas: '#0a0e1a',
      panel: '#0f172a',
      card: '#1e293b',
      elevated: '#334155',
    },
    canvas: {
      'grid-dot': 'rgba(148,163,184,0.12)',
      'grid-line': 'rgba(148,163,184,0.06)',
      'selection-bg': 'rgba(139,92,246,0.08)',
      'selection-border': 'rgba(139,92,246,0.5)',
      'minimap-bg': 'rgba(15,23,42,0.9)',
      'minimap-viewport': 'rgba(139,92,246,0.3)',
    },
    node: {
      agent: {
        bg: 'rgba(124,58,237,0.12)',
        border: '#7c3aed',
        icon: '#a78bfa',
      },
      task: {
        bg: 'rgba(14,165,233,0.12)',
        border: '#0284c7',
        icon: '#38bdf8',
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
        ring: '#8b5cf6',
        glow: 'rgba(139,92,246,0.25)',
      },
    },
    edge: {
      DEFAULT: '#64748b',
      active: '#a78bfa',
      'data-flow': '#38bdf8',
      error: '#fb7185',
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#f43f5e',
      info: '#0ea5e9',
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
    'toolbar-h': '48px',
    'sidebar-w': '280px',
    'sidebar-collapsed-w': '48px',
    'properties-w': '320px',
    'minimap-w': '200px',
    'minimap-h': '140px',
  },

  borderRadius: {
    node: '10px',
  },

  boxShadow: {
    node: '0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(148,163,184,0.1)',
    'node-hover': '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(148,163,184,0.15)',
    'node-selected': '0 0 0 2px #8b5cf6, 0 4px 20px rgba(139,92,246,0.25)',
    panel: '0 1px 3px rgba(0,0,0,0.3)',
    toolbar: '0 2px 12px rgba(0,0,0,0.35)',
  },

  transitionTimingFunction: {
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  animation: {
    'node-enter': 'node-enter 200ms cubic-bezier(0.34,1.56,0.64,1)',
    'running-pulse': 'running-pulse 1.5s ease-in-out infinite',
    'error-pulse': 'error-pulse 1.5s ease-in-out infinite',
    'edge-flow': 'edge-flow 1s linear infinite',
  },

  keyframes: {
    'node-enter': {
      from: { opacity: '0', transform: 'scale(0.85)' },
      to: { opacity: '1', transform: 'scale(1)' },
    },
    'running-pulse': {
      '0%, 100%': { boxShadow: '0 0 0 0 rgba(52,211,153,0)' },
      '50%': { boxShadow: '0 0 12px 4px rgba(52,211,153,0.4)' },
    },
    'error-pulse': {
      '0%, 100%': { boxShadow: '0 0 0 0 rgba(251,113,133,0)' },
      '50%': { boxShadow: '0 0 12px 4px rgba(251,113,133,0.4)' },
    },
    'edge-flow': {
      to: { strokeDashoffset: '-10' },
    },
  },
} as const;
