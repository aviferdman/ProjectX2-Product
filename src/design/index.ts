/**
 * Crewspace Design System — Public API
 * TASK-125: Core design system entry point
 *
 * Re-exports all design tokens, Tailwind themes, and utilities
 * so consumers can import from a single `@crewspace/design` path.
 */

/* ------------------------------------------------------------------ */
/* Tailwind themes                                                     */
/* ------------------------------------------------------------------ */
export { designSystemTheme } from './tailwind/design-system-theme.js';
export { crewspaceTheme } from './tailwind/canvas-theme.js';
export { responsiveTheme } from './tailwind/responsive-theme.js';
export { componentLibraryTheme } from './tailwind/component-library-theme.js';

/* ------------------------------------------------------------------ */
/* Token constants (TypeScript)                                        */
/* ------------------------------------------------------------------ */
export {
  colors,
  sizing,
  radius,
  typography,
  transitions,
  shadows,
  fontWeight,
  lineHeight,
  letterSpacing,
  zIndex,
  breakpoints,
  responsive,
  spacing,
  duration,
  easing,
  opacity,
} from '../../packages/ui/src/theme/tokens.js';

/* ------------------------------------------------------------------ */
/* Design token JSON paths (for build tooling / style-dictionary)      */
/* ------------------------------------------------------------------ */
export const tokenPaths = {
  designSystem: './tokens/design-system.json',
  componentLibrary: './tokens/component-library.json',
  colors: './tokens/colors.json',
  typography: './tokens/typography.json',
  spacing: './tokens/spacing.json',
  canvas: './tokens/canvas.json',
  timeline: './tokens/timeline.json',
  dashboard: './tokens/dashboard.json',
} as const;

/* ------------------------------------------------------------------ */
/* CSS entry points                                                    */
/* ------------------------------------------------------------------ */
export const cssPaths = {
  designSystem: './css/design-system-variables.css',
  componentLibrary: './css/component-library-variables.css',
  canvas: './css/canvas-variables.css',
  timeline: './css/timeline-variables.css',
  dashboard: './css/dashboard-variables.css',
} as const;
