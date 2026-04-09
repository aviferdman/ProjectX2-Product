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
/* Transitions                                                         */
/* ------------------------------------------------------------------ */
export const transitions = {
  fast: '100ms ease-out',
  normal: '200ms ease-out',
  slow: '300ms ease-out',
  spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
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
