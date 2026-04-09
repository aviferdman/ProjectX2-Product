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
    border: '#0ea5e9',
    icon: '▶',
    iconColor: '#38bdf8',
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
    border: '#f43f5e',
    icon: '✕',
    iconColor: '#fb7185',
    label: 'Error',
  },
  message: {
    bg: 'rgba(139,92,246,0.15)',
    border: '#8b5cf6',
    icon: '💬',
    iconColor: '#a78bfa',
    label: 'Message',
  },
} as const;

/* ------------------------------------------------------------------ */
/* Selection / highlight colours                                       */
/* ------------------------------------------------------------------ */
export const SELECTION = {
  ringColor: '#8b5cf6',
  glowColor: 'rgba(139,92,246,0.25)',
  ringWidth: 2,
} as const;

/* ------------------------------------------------------------------ */
/* Playhead colours                                                    */
/* ------------------------------------------------------------------ */
export const PLAYHEAD = {
  color: '#8b5cf6',
  glowColor: 'rgba(139,92,246,0.3)',
} as const;

/* ------------------------------------------------------------------ */
/* Grid line styling                                                   */
/* ------------------------------------------------------------------ */
export const GRID = {
  lineColor: 'rgba(148,163,184,0.06)',
  axisLineColor: '#334155',
  axisTickColor: '#475569',
} as const;

/* ------------------------------------------------------------------ */
/* Lane colours                                                        */
/* ------------------------------------------------------------------ */
export const LANE = {
  bg: 'rgba(15,23,42,0.6)',
  bgAlt: 'rgba(15,23,42,0.8)',
  borderColor: 'var(--cs-border-subtle, rgba(51,65,85,0.5))',
} as const;
