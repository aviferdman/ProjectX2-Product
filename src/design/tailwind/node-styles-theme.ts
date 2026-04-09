/**
 * TASK-133: Agent/Task Node Styles — Tailwind Theme Extension
 *
 * Extends the Crewspace Tailwind theme with granular node-type tokens,
 * state treatments, icon sizing, badge styles, and animations.
 *
 * Usage:
 *   import { nodeStylesTheme } from './node-styles-theme';
 *   // Merge into tailwind.config.ts → theme.extend
 */

export const nodeStylesTheme = {
  colors: {
    node: {
      agent: {
        bg:           'rgba(124,58,237,0.12)',
        'bg-hover':   'rgba(124,58,237,0.18)',
        'bg-active':  'rgba(124,58,237,0.24)',
        'bg-muted':   'rgba(124,58,237,0.06)',
        border:       '#7c3aed',
        'border-hover': '#8b5cf6',
        'border-focus': '#a78bfa',
        icon:         '#a78bfa',
        'icon-muted': 'rgba(167,139,250,0.6)',
        'badge-bg':   'rgba(124,58,237,0.2)',
        'badge-text': '#c4b5fd',
        accent:       '#7c3aed',
      },
      task: {
        bg:           'rgba(14,165,233,0.12)',
        'bg-hover':   'rgba(14,165,233,0.18)',
        'bg-active':  'rgba(14,165,233,0.24)',
        'bg-muted':   'rgba(14,165,233,0.06)',
        border:       '#0284c7',
        'border-hover': '#0ea5e9',
        'border-focus': '#38bdf8',
        icon:         '#38bdf8',
        'icon-muted': 'rgba(56,189,248,0.6)',
        'badge-bg':   'rgba(14,165,233,0.2)',
        'badge-text': '#7dd3fc',
        accent:       '#0284c7',
      },
      tool: {
        bg:           'rgba(16,185,129,0.12)',
        'bg-hover':   'rgba(16,185,129,0.18)',
        'bg-active':  'rgba(16,185,129,0.24)',
        'bg-muted':   'rgba(16,185,129,0.06)',
        border:       '#059669',
        'border-hover': '#10b981',
        'border-focus': '#34d399',
        icon:         '#34d399',
        'icon-muted': 'rgba(52,211,153,0.6)',
        'badge-bg':   'rgba(16,185,129,0.2)',
        'badge-text': '#6ee7b7',
        accent:       '#059669',
      },
      llm: {
        bg:           'rgba(245,158,11,0.12)',
        'bg-hover':   'rgba(245,158,11,0.18)',
        'bg-active':  'rgba(245,158,11,0.24)',
        'bg-muted':   'rgba(245,158,11,0.06)',
        border:       '#d97706',
        'border-hover': '#f59e0b',
        'border-focus': '#fbbf24',
        icon:         '#fbbf24',
        'icon-muted': 'rgba(251,191,36,0.6)',
        'badge-bg':   'rgba(245,158,11,0.2)',
        'badge-text': '#fde68a',
        accent:       '#d97706',
      },

      // State colors
      state: {
        'idle-badge-bg':     'rgba(100,116,139,0.2)',
        'idle-badge-text':   '#94a3b8',
        'running-glow':      'rgba(52,211,153,0.35)',
        'running-badge-bg':  'rgba(16,185,129,0.25)',
        'running-badge-text':'#34d399',
        'running-dot':       '#10b981',
        'success-flash':     'rgba(16,185,129,0.4)',
        'success-border':    '#10b981',
        'success-badge-bg':  'rgba(16,185,129,0.2)',
        'success-badge-text':'#10b981',
        'error-border':      '#f43f5e',
        'error-glow':        'rgba(244,63,94,0.3)',
        'error-badge-bg':    'rgba(244,63,94,0.2)',
        'error-badge-text':  '#fb7185',
        'disabled-border':   '#475569',
        'disabled-badge-bg': 'rgba(71,85,105,0.2)',
        'disabled-badge-text':'#64748b',
        'queued-badge-bg':   'rgba(148,163,184,0.15)',
        'queued-badge-text': '#94a3b8',
      },

      // Body field colors
      body: {
        label:        '#64748b',
        value:        '#e2e8f0',
        separator:    'rgba(148,163,184,0.1)',
      },

      // Handle type-aware colors
      handle: {
        'agent-connected': '#8b5cf6',
        'task-connected':  '#0ea5e9',
        'tool-connected':  '#10b981',
        'llm-connected':   '#f59e0b',
        'compatible':      'rgba(139,92,246,0.4)',
        'incompatible':    'rgba(244,63,94,0.3)',
        label:             '#94a3b8',
      },
    },
  },

  spacing: {
    'node-icon':         '20px',
    'node-icon-compact': '16px',
    'node-icon-expanded':'24px',
    'node-icon-minimal': '28px',
    'node-header-h':     '40px',
    'node-icon-gap':     '8px',
    'node-accent-w':     '3px',
    'node-body-field-gap':'4px',
    'node-body-label-w': '64px',
    'node-badge-h':      '18px',
    'node-badge-dot':    '6px',
    'node-badge-dot-gap':'4px',
    'handle-label-offset':'6px',
  },

  fontSize: {
    'node-badge':  ['10px', { lineHeight: '18px', letterSpacing: '0.05em', fontWeight: '600' }],
    'handle-label':['10px', { lineHeight: '1.25', fontWeight: '400' }],
  },

  borderRadius: {
    'node-badge': '9px',
  },

  boxShadow: {
    'node-hover':     '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(148,163,184,0.15)',
    'node-selected':  '0 0 0 2px #8b5cf6, 0 4px 20px rgba(139,92,246,0.25)',
    'node-dragging':  '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(148,163,184,0.2)',
  },

  opacity: {
    'node-disabled': '0.4',
    'node-queued':   '0.7',
    'node-dragging': '0.95',
  },

  scale: {
    'node-dragging': '1.02',
    'node-success-peak': '1.03',
  },

  animation: {
    'node-enter':        'cs-node-enter 200ms cubic-bezier(0.34,1.56,0.64,1) forwards',
    'node-exit':         'cs-node-exit 150ms ease-in forwards',
    'node-running':      'cs-node-running-pulse 1.5s ease-in-out infinite',
    'node-error':        'cs-node-error-pulse 1.5s ease-in-out infinite',
    'node-success':      'cs-node-success-flash 600ms ease-out forwards',
    'badge-enter':       'cs-badge-enter 150ms cubic-bezier(0.34,1.56,0.64,1) forwards',
    'badge-dot-blink':   'cs-badge-dot-blink 1s ease-in-out infinite',
    'handle-pulse':      'cs-handle-pulse 800ms ease-in-out infinite',
  },

  keyframes: {
    'cs-node-enter': {
      '0%':   { opacity: '0', transform: 'scale(0.85)' },
      '60%':  { opacity: '1', transform: 'scale(1.03)' },
      '100%': { transform: 'scale(1)' },
    },
    'cs-node-exit': {
      '0%':   { opacity: '1', transform: 'scale(1)' },
      '100%': { opacity: '0', transform: 'scale(0.9)' },
    },
    'cs-node-running-pulse': {
      '0%, 100%': { boxShadow: '0 0 0 0 rgba(52,211,153,0.35)' },
      '50%':      { boxShadow: '0 0 8px 2px rgba(52,211,153,0.35)' },
    },
    'cs-node-error-pulse': {
      '0%, 100%': { boxShadow: '0 0 0 0 rgba(244,63,94,0.3)' },
      '50%':      { boxShadow: '0 0 6px 2px rgba(244,63,94,0.3)' },
    },
    'cs-node-success-flash': {
      '0%':   { boxShadow: '0 0 0 0 rgba(16,185,129,0.4)', transform: 'scale(1)' },
      '30%':  { boxShadow: '0 0 16px 4px rgba(16,185,129,0.4)', transform: 'scale(1.03)' },
      '100%': { boxShadow: '0 0 0 0 transparent', transform: 'scale(1)' },
    },
    'cs-badge-enter': {
      '0%':   { opacity: '0', transform: 'scale(0.7)' },
      '100%': { opacity: '1', transform: 'scale(1)' },
    },
    'cs-badge-dot-blink': {
      '0%, 100%': { opacity: '1' },
      '50%':      { opacity: '0.3' },
    },
    'cs-handle-pulse': {
      '0%, 100%': { boxShadow: '0 0 0 0 rgba(139,92,246,0.4)' },
      '50%':      { boxShadow: '0 0 0 6px rgba(139,92,246,0.4)' },
    },
  },
} as const;

/**
 * Icon mapping — maps node subtypes to Lucide React icon names.
 * Import this in React components to resolve the correct icon.
 */
export const nodeIconMap = {
  agent: {
    default:      'bot',
    researcher:   'search',
    writer:       'pen-line',
    analyst:      'bar-chart-3',
    coordinator:  'network',
    coder:        'code-2',
    reviewer:     'shield-check',
    custom:       'user-circle',
  },
  task: {
    default:      'clipboard-list',
    sequential:   'list-ordered',
    parallel:     'git-branch',
    conditional:  'git-fork',
    loop:         'repeat',
    'human-input':'hand',
    output:       'file-output',
    custom:       'square-check',
  },
  tool: {
    default:      'wrench',
    api:          'globe',
    database:     'database',
    file:         'file-text',
    search:       'search',
    calculator:   'calculator',
    custom:       'puzzle',
  },
  llm: {
    default:      'sparkles',
    openai:       'sparkles',
    anthropic:    'brain',
    local:        'hard-drive',
    custom:       'cpu',
  },
} as const;

/** State badge configuration */
export const nodeStateBadges = {
  idle:     { label: 'IDLE',     icon: null,           dotAnimated: false },
  running:  { label: 'RUNNING',  icon: null,           dotAnimated: true  },
  success:  { label: 'DONE',     icon: 'check',        dotAnimated: false },
  error:    { label: 'ERROR',    icon: 'alert-circle',  dotAnimated: false },
  disabled: { label: 'DISABLED', icon: null,           dotAnimated: false },
  queued:   { label: 'QUEUED',   icon: 'clock',        dotAnimated: false },
} as const;

export type NodeType = keyof typeof nodeIconMap;
export type NodeState = keyof typeof nodeStateBadges;
