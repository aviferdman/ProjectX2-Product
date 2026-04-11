/**
 * Timeline design token constants.
 * TASK-143: Implement timeline chart
 *
 * Values sourced from TASK-140 design spec and design tokens.
 */

/* ------------------------------------------------------------------ */
/* Sizing                                                              */
/* ------------------------------------------------------------------ */
export const TIMELINE_SIZING = {
  axisHeight: 32,
  laneHeight: 48,
  laneLabelWidth: 160,
  eventHeight: 28,
  eventMinWidth: 8,
  eventMarkerSize: 12,
  eventBorderRadius: 4,
  eventBorderWidth: 1.5,
  eventPadding: { x: 6, y: 4 },
  playheadWidth: 2,
  playheadHandleSize: 12,
} as const;

/* ------------------------------------------------------------------ */
/* Event type visual configuration                                     */
/* ------------------------------------------------------------------ */

/** Whether an event type renders as a point marker instead of a block. */
export function isPointEvent(type: string): boolean {
  return type === 'task-start' || type === 'task-complete';
}

export const EVENT_STYLES = {
  'llm-call': {
    bg: 'rgba(245,158,11,0.2)',
    border: '#f59e0b',
    icon: '⚡',
    iconColor: '#fbbf24',
    label: 'LLM Call',
  },
  'tool-use': {
    bg: 'rgba(16,185,129,0.2)',
    border: '#10b981',
    icon: '🔧',
    iconColor: '#34d399',
    label: 'Tool Use',
  },
  'task-start': {
    bg: 'rgba(14,165,233,0.2)',
    border: '#06b6d4',
    icon: '▶',
    iconColor: '#22d3ee',
    label: 'Task Start',
  },
  'task-complete': {
    bg: 'rgba(16,185,129,0.15)',
    border: '#10b981',
    icon: '✓',
    iconColor: '#34d399',
    label: 'Task Complete',
  },
  error: {
    bg: 'rgba(244,63,94,0.2)',
    border: '#ef4444',
    icon: '✕',
    iconColor: '#f87171',
    label: 'Error',
  },
  message: {
    bg: 'rgba(99,102,241,0.15)',
    border: '#818cf8',
    icon: '💬',
    iconColor: '#818cf8',
    label: 'Message',
  },
} as const;

/* ------------------------------------------------------------------ */
/* Selection / highlight colours                                       */
/* ------------------------------------------------------------------ */
export const SELECTION = {
  ringColor: '#818cf8',
  glowColor: 'rgba(99,102,241,0.25)',
  ringWidth: 2,
} as const;

/* ------------------------------------------------------------------ */
/* Playhead colours                                                    */
/* ------------------------------------------------------------------ */
export const PLAYHEAD = {
  color: '#818cf8',
  glowColor: 'rgba(99,102,241,0.3)',
} as const;

/* ------------------------------------------------------------------ */
/* Grid line styling                                                   */
/* ------------------------------------------------------------------ */
export const GRID = {
  lineColor: 'rgba(113,113,122,0.06)',
  axisLineColor: '#27272a',
  axisTickColor: '#3f3f46',
} as const;

/* ------------------------------------------------------------------ */
/* Lane colours                                                        */
/* ------------------------------------------------------------------ */
export const LANE = {
  bg: 'rgba(17,17,19,0.6)',
  bgAlt: 'rgba(17,17,19,0.8)',
  borderColor: 'var(--cs-border-subtle, rgba(39,39,42,0.5))',
} as const;

/* ------------------------------------------------------------------ */
/* Log Viewer constants (TASK-144)                                     */
/* ------------------------------------------------------------------ */

export const LOG_SIZING = {
  rowHeight: 32,
  timestampWidth: 100,
  levelWidth: 56,
  agentWidth: 120,
  headerHeight: 40,
} as const;

export const LOG_LEVEL_STYLES = {
  debug: {
    color: '#a1a1aa',
    bg: 'rgba(113,113,122,0.1)',
    label: 'DEBUG',
  },
  info: {
    color: '#22d3ee',
    bg: 'rgba(14,165,233,0.1)',
    label: 'INFO',
  },
  warn: {
    color: '#fbbf24',
    bg: 'rgba(245,158,11,0.1)',
    label: 'WARN',
  },
  error: {
    color: '#f87171',
    bg: 'rgba(244,63,94,0.1)',
    label: 'ERROR',
  },
} as const;

export const LOG_COLORS = {
  background: 'var(--cs-surface-panel, #111113)',
  headerBg: 'var(--cs-surface-card, #18181b)',
  rowBg: 'transparent',
  rowBgAlt: 'rgba(24,24,27,0.3)',
  rowBgHover: 'rgba(24,24,27,0.6)',
  rowBgSelected: 'rgba(99,102,241,0.1)',
  rowBorder: 'rgba(39,39,42,0.3)',
  timestamp: '#52525b',
  searchHighlight: 'rgba(251,191,36,0.3)',
  searchHighlightActive: 'rgba(251,191,36,0.6)',
} as const;

/** Syntax highlighting token colors for JSON/code in log messages.
 * Aligned with TASK-140 spec §4.5 (emerald/amber/violet/sky/rose palette). */
export const SYNTAX_COLORS = {
  string: '#34d399',      // emerald-400
  number: '#fbbf24',      // amber-400
  boolean: '#818cf8',     // indigo-400
  null: '#818cf8',        // indigo-400
  key: '#22d3ee',         // sky-400
  error: '#f87171',       // rose-400
  punctuation: '#a1a1aa', // slate-400
  default: 'var(--cs-text-secondary, #cbd5e1)',
} as const;
