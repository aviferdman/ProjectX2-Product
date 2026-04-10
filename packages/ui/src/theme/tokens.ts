/**
 * Design-system token map
 *
 * Re-exports every semantic color, spacing, radius, shadow and transition
 * value so TypeScript consumers can reference tokens without touching CSS.
 */

/* ------------------------------------------------------------------ */
/* Colors                                                              */
/* ------------------------------------------------------------------ */
export const colors = {
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
    overlay: 'rgba(0,0,0,0.6)',
  },
  border: {
    default: '#334155',
    subtle: '#1e293b',
    strong: '#64748b',
    focus: '#8b5cf6',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#94a3b8',
    tertiary: '#64748b',
    inverse: '#0f172a',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#f43f5e',
    info: '#0ea5e9',
  },
  node: {
    agent: { bg: 'rgba(124,58,237,0.12)', border: '#7c3aed', icon: '#a78bfa' },
    task: { bg: 'rgba(14,165,233,0.12)', border: '#0284c7', icon: '#38bdf8' },
    tool: { bg: 'rgba(16,185,129,0.12)', border: '#059669', icon: '#34d399' },
    llm: { bg: 'rgba(245,158,11,0.12)', border: '#d97706', icon: '#fbbf24' },
    selected: { ring: '#8b5cf6', glow: 'rgba(139,92,246,0.25)' },
  },
  edge: {
    default: '#64748b',
    active: '#a78bfa',
    dataFlow: '#38bdf8',
    error: '#fb7185',
  },
} as const;

/* ------------------------------------------------------------------ */
/* Spacing / sizing                                                    */
/* ------------------------------------------------------------------ */
export const sizing = {
  node: {
    minWidth: 180,
    maxWidth: 280,
    defaultWidth: 220,
    headerHeight: 40,
    iconSize: 20,
    badgeHeight: 18,
    handleSize: 10,
  },
  toolbar: { height: 48, buttonSize: 36, iconSize: 18, gap: 4 },
  sidebar: { width: 280, collapsedWidth: 48, sectionGap: 16 },
  properties: { width: 320, labelWidth: 100, inputHeight: 32 },
  minimap: { width: 200, height: 140 },
} as const;

export const radius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
  node: 10,
} as const;

/* ------------------------------------------------------------------ */
/* Typography                                                          */
/* ------------------------------------------------------------------ */
export const typography = {
  fontFamily: {
    sans: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.8125rem',
    base: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
  },
} as const;

/* ------------------------------------------------------------------ */
/* Font weight                                                         */
/* ------------------------------------------------------------------ */
export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/* ------------------------------------------------------------------ */
/* Line height                                                         */
/* ------------------------------------------------------------------ */
export const lineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

/* ------------------------------------------------------------------ */
/* Letter spacing                                                      */
/* ------------------------------------------------------------------ */
export const letterSpacing = {
  tighter: '-0.02em',
  tight: '-0.01em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

/* ------------------------------------------------------------------ */
/* Shadows                                                             */
/* ------------------------------------------------------------------ */
export const shadows = {
  xs: '0 1px 2px rgba(0,0,0,0.2)',
  sm: '0 1px 3px rgba(0,0,0,0.3)',
  md: '0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(148,163,184,0.1)',
  lg: '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(148,163,184,0.15)',
  xl: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(148,163,184,0.1)',
  node: '0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(148,163,184,0.1)',
  'node-hover': '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(148,163,184,0.15)',
  'node-selected': '0 0 0 2px rgba(139,92,246,1), 0 4px 20px rgba(139,92,246,0.25)',
  panel: '0 1px 3px rgba(0,0,0,0.3)',
  toolbar: '0 2px 12px rgba(0,0,0,0.35)',
  dropdown: '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(148,163,184,0.1)',
  inner: 'inset 0 2px 4px rgba(0,0,0,0.2)',
  none: 'none',
} as const;

/* ------------------------------------------------------------------ */
/* Transitions                                                         */
/* ------------------------------------------------------------------ */
export const transitions = {
  fast: '100ms ease-out',
  normal: '200ms ease-out',
  slow: '300ms ease-out',
  slower: '500ms ease-out',
  spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

/* ------------------------------------------------------------------ */
/* Duration (raw values for animation composition)                     */
/* ------------------------------------------------------------------ */
export const duration = {
  instant: 0,
  fast: 100,
  normal: 200,
  slow: 300,
  slower: 500,
  slowest: 1000,
} as const;

/* ------------------------------------------------------------------ */
/* Easing curves                                                       */
/* ------------------------------------------------------------------ */
export const easing = {
  default: 'ease-out',
  in: 'ease-in',
  'in-out': 'ease-in-out',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  linear: 'linear',
} as const;

/* ------------------------------------------------------------------ */
/* Z-index layers                                                      */
/* ------------------------------------------------------------------ */
export const zIndex = {
  base: 0,
  canvas: 1,
  edge: 5,
  node: 10,
  toolbar: 100,
  sidebar: 100,
  dropdown: 200,
  overlay: 250,
  modal: 300,
  toast: 400,
  tooltip: 500,
} as const;

/* ------------------------------------------------------------------ */
/* Spacing scale                                                       */
/* ------------------------------------------------------------------ */
export const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

/* ------------------------------------------------------------------ */
/* Opacity                                                             */
/* ------------------------------------------------------------------ */
export const opacity = {
  disabled: 0.4,
  overlay: 0.6,
  subtle: 0.1,
} as const;

/* ------------------------------------------------------------------ */
/* Responsive breakpoints (TASK-172)                                   */
/* ------------------------------------------------------------------ */
export const breakpoints = {
  xs: 375,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const responsive = {
  container: {
    padding: { xs: 12, sm: 16, md: 20, lg: 24, xl: 24, '2xl': 32 },
    maxWidth: { xs: '100%', sm: '100%', md: '100%', lg: '100%', xl: 1280, '2xl': 1440 },
  },
  sidebar: {
    collapsed: 64,
    expanded: 240,
    overlay: 280,
  },
  header: {
    mobile: 48,
    desktop: 56,
  },
  grid: {
    columns: { xs: 1, sm: 1, md: 2, lg: 3, xl: 3, '2xl': 4 },
    gap: { mobile: 12, tablet: 16, desktop: 20 },
  },
  touch: {
    minTargetSize: 44,
    comfortableTargetSize: 48,
    targetSpacing: 8,
  },
} as const;
