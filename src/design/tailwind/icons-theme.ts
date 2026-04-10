/**
 * Crewspace Icon System — Tailwind CSS Theme Extension
 * TASK-127: Icon set and visual assets
 *
 * Extends Tailwind with icon-specific sizing, colors, and utilities.
 *
 * Usage:
 *   import { iconsTheme } from './src/design/tailwind/icons-theme';
 *   export default { theme: { extend: iconsTheme } };
 */

export const iconsTheme = {
  /* -------------------------------------------------------------- */
  /* Icon sizing utilities (use as w-icon-md h-icon-md)              */
  /* -------------------------------------------------------------- */
  width: {
    'icon-xs': 'var(--cs-icon-size-xs, 12px)',
    'icon-sm': 'var(--cs-icon-size-sm, 16px)',
    'icon-md': 'var(--cs-icon-size-md, 20px)',
    'icon-lg': 'var(--cs-icon-size-lg, 24px)',
    'icon-xl': 'var(--cs-icon-size-xl, 32px)',
    'icon-2xl': 'var(--cs-icon-size-2xl, 48px)',
  },

  height: {
    'icon-xs': 'var(--cs-icon-size-xs, 12px)',
    'icon-sm': 'var(--cs-icon-size-sm, 16px)',
    'icon-md': 'var(--cs-icon-size-md, 20px)',
    'icon-lg': 'var(--cs-icon-size-lg, 24px)',
    'icon-xl': 'var(--cs-icon-size-xl, 32px)',
    'icon-2xl': 'var(--cs-icon-size-2xl, 48px)',
  },

  /* Uniform size utilities (use as size-icon-md) */
  size: {
    'icon-xs': 'var(--cs-icon-size-xs, 12px)',
    'icon-sm': 'var(--cs-icon-size-sm, 16px)',
    'icon-md': 'var(--cs-icon-size-md, 20px)',
    'icon-lg': 'var(--cs-icon-size-lg, 24px)',
    'icon-xl': 'var(--cs-icon-size-xl, 32px)',
    'icon-2xl': 'var(--cs-icon-size-2xl, 48px)',
  },

  /* -------------------------------------------------------------- */
  /* Icon colors (use as text-icon-brand, text-icon-success, etc.)   */
  /* -------------------------------------------------------------- */
  colors: {
    icon: {
      DEFAULT: 'var(--cs-icon-color-default, #94a3b8)',
      primary: 'var(--cs-icon-color-primary, #f8fafc)',
      muted: 'var(--cs-icon-color-muted, #64748b)',
      brand: 'var(--cs-icon-color-brand, #7c3aed)',
      success: 'var(--cs-icon-color-success, #10b981)',
      warning: 'var(--cs-icon-color-warning, #f59e0b)',
      error: 'var(--cs-icon-color-error, #f43f5e)',
      info: 'var(--cs-icon-color-info, #0ea5e9)',
      hover: 'var(--cs-icon-color-hover, #f8fafc)',
      disabled: 'var(--cs-icon-color-disabled, #475569)',
      agent: 'var(--cs-icon-color-agent, #a78bfa)',
      task: 'var(--cs-icon-color-task, #38bdf8)',
      tool: 'var(--cs-icon-color-tool, #34d399)',
      llm: 'var(--cs-icon-color-llm, #fbbf24)',
    },
  },

  /* -------------------------------------------------------------- */
  /* Stroke width utilities                                          */
  /* -------------------------------------------------------------- */
  strokeWidth: {
    'icon-thin': 'var(--cs-icon-stroke-thin, 1.25)',
    'icon-default': 'var(--cs-icon-stroke-default, 1.75)',
    'icon-bold': 'var(--cs-icon-stroke-bold, 2.25)',
  },
} as const;
