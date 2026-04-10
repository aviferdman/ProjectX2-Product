/**
 * Crewspace Icon System — Design token constants
 * TASK-127: Create icon set and visual assets
 *
 * Typed constants for icon sizing, stroke widths, and color mappings.
 * Mirrors the JSON tokens and CSS variables in a TS-consumable format.
 */

/* ------------------------------------------------------------------ */
/* Icon sizing                                                         */
/* ------------------------------------------------------------------ */
export const iconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export type IconSize = keyof typeof iconSize;

/* ------------------------------------------------------------------ */
/* Stroke weights                                                      */
/* ------------------------------------------------------------------ */
export const iconStroke = {
  thin: 1.25,
  default: 1.75,
  bold: 2.25,
} as const;

export type IconStrokeWeight = keyof typeof iconStroke;

/* ------------------------------------------------------------------ */
/* Icon color semantic map                                             */
/* ------------------------------------------------------------------ */
export const iconColor = {
  default: 'var(--cs-icon-color-default)',
  primary: 'var(--cs-icon-color-primary)',
  muted: 'var(--cs-icon-color-muted)',
  brand: 'var(--cs-icon-color-brand)',
  success: 'var(--cs-icon-color-success)',
  warning: 'var(--cs-icon-color-warning)',
  error: 'var(--cs-icon-color-error)',
  info: 'var(--cs-icon-color-info)',
  hover: 'var(--cs-icon-color-hover)',
  disabled: 'var(--cs-icon-color-disabled)',
  agent: 'var(--cs-icon-color-agent)',
  task: 'var(--cs-icon-color-task)',
  tool: 'var(--cs-icon-color-tool)',
  llm: 'var(--cs-icon-color-llm)',
} as const;

export type IconColorToken = keyof typeof iconColor;

/* ------------------------------------------------------------------ */
/* Node-type → icon name mapping                                       */
/* ------------------------------------------------------------------ */
export const nodeTypeIcons = {
  agent: {
    primary: 'bot',
    researcher: 'search',
    writer: 'pen-line',
    analyst: 'bar-chart-3',
    coordinator: 'network',
    coder: 'code-2',
    reviewer: 'shield-check',
    custom: 'user-circle',
  },
  task: {
    primary: 'clipboard-list',
    sequential: 'list-ordered',
    parallel: 'git-branch',
    conditional: 'git-fork',
    loop: 'repeat',
    'human-input': 'hand',
    output: 'file-output',
    custom: 'square-check',
  },
  tool: {
    primary: 'wrench',
    api: 'globe',
    database: 'database',
    file: 'file-text',
    search: 'search',
    calculator: 'calculator',
    custom: 'puzzle',
  },
  llm: {
    primary: 'sparkles',
    openai: 'sparkles',
    anthropic: 'brain',
    local: 'hard-drive',
    custom: 'cpu',
  },
} as const;

export type NodeType = keyof typeof nodeTypeIcons;
