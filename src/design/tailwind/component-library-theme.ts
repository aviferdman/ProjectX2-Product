/**
 * Crewspace — Tailwind CSS theme extensions for Component Library
 * TASK-126: Design component library (buttons, inputs, cards, modals)
 *
 * Merge into your tailwind.config.ts alongside other themes:
 *   import { componentLibraryTheme } from './src/design/tailwind/component-library-theme';
 *   export default { theme: { extend: { ...componentLibraryTheme } } };
 */

export const componentLibraryTheme = {
  /* -------------------------------------------------------------- */
  /* Colors                                                          */
  /* -------------------------------------------------------------- */
  colors: {
    btn: {
      primary: {
        bg: 'var(--cs-interactive-default, #7c3aed)',
        'bg-hover': 'var(--cs-interactive-hover, #8b5cf6)',
        'bg-active': 'var(--cs-interactive-active, #6d28d9)',
        text: '#ffffff',
      },
      secondary: {
        bg: 'transparent',
        'bg-hover': 'rgba(139,92,246,0.1)',
        'bg-active': 'rgba(139,92,246,0.15)',
        text: 'var(--cs-violet-400, #a78bfa)',
      },
      ghost: {
        bg: 'transparent',
        'bg-hover': 'rgba(148,163,184,0.1)',
        'bg-active': 'rgba(148,163,184,0.15)',
        text: 'var(--cs-text-secondary, #94a3b8)',
      },
      danger: {
        bg: 'var(--cs-rose-600, #e11d48)',
        'bg-hover': 'var(--cs-rose-500, #f43f5e)',
        'bg-active': 'rgba(225,29,72,0.9)',
        text: '#ffffff',
      },
      success: {
        bg: 'var(--cs-emerald-600, #059669)',
        'bg-hover': 'var(--cs-emerald-500, #10b981)',
        'bg-active': 'rgba(5,150,105,0.9)',
        text: '#ffffff',
      },
      focus: {
        ring: 'var(--cs-violet-500, #8b5cf6)',
      },
    },
    input: {
      bg: 'var(--cs-slate-900, #0f172a)',
      'bg-hover': 'var(--cs-slate-800, #1e293b)',
      'bg-disabled': 'var(--cs-slate-900, #0f172a)',
      text: 'var(--cs-text-primary, #f8fafc)',
      'text-disabled': 'var(--cs-text-disabled, #475569)',
      placeholder: 'var(--cs-slate-500, #64748b)',
      border: 'var(--cs-border-default, #334155)',
      'border-hover': 'var(--cs-slate-500, #64748b)',
      'border-focus': 'var(--cs-violet-500, #8b5cf6)',
      'border-error': 'var(--cs-rose-500, #f43f5e)',
      'border-success': 'var(--cs-emerald-500, #10b981)',
      label: 'var(--cs-text-secondary, #94a3b8)',
      helper: 'var(--cs-text-tertiary, #64748b)',
      error: 'var(--cs-rose-400, #fb7185)',
      success: 'var(--cs-emerald-400, #34d399)',
      icon: 'var(--cs-slate-400, #94a3b8)',
      'icon-focus': 'var(--cs-violet-400, #a78bfa)',
      focus: {
        ring: 'var(--cs-violet-500, #8b5cf6)',
      },
    },
    'cs-card': {
      bg: 'var(--cs-surface-card, #1e293b)',
      'bg-hover': 'var(--cs-surface-elevated, #334155)',
      'bg-selected': 'rgba(139,92,246,0.08)',
      border: 'var(--cs-border-default, #334155)',
      'border-hover': 'var(--cs-slate-500, #64748b)',
      'border-selected': 'var(--cs-violet-500, #8b5cf6)',
      'header-text': 'var(--cs-text-primary, #f8fafc)',
      'body-text': 'var(--cs-text-secondary, #94a3b8)',
      'meta-text': 'var(--cs-text-tertiary, #64748b)',
      divider: 'rgba(51,65,85,0.4)',
      'footer-bg': 'rgba(15,23,42,0.3)',
    },
    modal: {
      bg: 'var(--cs-slate-900, #0f172a)',
      border: 'var(--cs-border-default, #334155)',
      'header-text': 'var(--cs-text-primary, #f8fafc)',
      'body-text': 'var(--cs-text-secondary, #94a3b8)',
      divider: 'rgba(51,65,85,0.4)',
      'close-icon': 'var(--cs-slate-400, #94a3b8)',
      'close-icon-hover': 'var(--cs-text-primary, #f8fafc)',
      overlay: 'rgba(0,0,0,0.6)',
    },
  },

  /* -------------------------------------------------------------- */
  /* Sizing (heights for components)                                  */
  /* -------------------------------------------------------------- */
  height: {
    'btn-xs': '28px',
    'btn-sm': '32px',
    'btn-md': '36px',
    'btn-lg': '44px',
    'btn-xl': '52px',
    'input-sm': '32px',
    'input-md': '36px',
    'input-lg': '44px',
    'card-header': '48px',
    'card-footer': '44px',
    'modal-header': '56px',
    'modal-footer': '64px',
  },

  /* -------------------------------------------------------------- */
  /* Width (modal sizes)                                              */
  /* -------------------------------------------------------------- */
  width: {
    'modal-sm': '400px',
    'modal-md': '560px',
    'modal-lg': '720px',
    'modal-xl': '960px',
  },

  /* -------------------------------------------------------------- */
  /* Max width (modal sizes)                                          */
  /* -------------------------------------------------------------- */
  maxWidth: {
    'modal-sm': '400px',
    'modal-md': '560px',
    'modal-lg': '720px',
    'modal-xl': '960px',
  },

  /* -------------------------------------------------------------- */
  /* Box shadow                                                       */
  /* -------------------------------------------------------------- */
  boxShadow: {
    'btn-primary': '0 1px 3px rgba(124,58,237,0.3)',
    'btn-primary-hover': '0 4px 12px rgba(124,58,237,0.4)',
    'btn-danger': '0 1px 3px rgba(225,29,72,0.3)',
    'btn-danger-hover': '0 4px 12px rgba(225,29,72,0.4)',
    'btn-success': '0 1px 3px rgba(5,150,105,0.3)',
    'btn-success-hover': '0 4px 12px rgba(5,150,105,0.4)',
    'cs-card': '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(148,163,184,0.06)',
    'cs-card-hover': '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(148,163,184,0.1)',
    'cs-card-selected': '0 0 0 2px rgba(139,92,246,0.5), 0 4px 16px rgba(0,0,0,0.3)',
    modal: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(148,163,184,0.08)',
  },

  /* -------------------------------------------------------------- */
  /* Border radius                                                    */
  /* -------------------------------------------------------------- */
  borderRadius: {
    'btn-xs': '4px',
    'btn-sm': '6px',
    'btn-md': '6px',
    'btn-lg': '8px',
    'btn-xl': '8px',
    'input-sm': '6px',
    'input-md': '6px',
    'input-lg': '8px',
    'card-sm': '8px',
    'card-md': '10px',
    'card-lg': '12px',
    modal: '12px',
  },

  /* -------------------------------------------------------------- */
  /* Ring width (focus indicators)                                    */
  /* -------------------------------------------------------------- */
  ringWidth: {
    btn: '2px',
    input: '2px',
  },

  /* -------------------------------------------------------------- */
  /* Ring offset                                                      */
  /* -------------------------------------------------------------- */
  ringOffsetWidth: {
    btn: '2px',
    input: '1px',
  },

  /* -------------------------------------------------------------- */
  /* Backdrop blur                                                    */
  /* -------------------------------------------------------------- */
  backdropBlur: {
    modal: '4px',
  },

  /* -------------------------------------------------------------- */
  /* Animation (keyframes + durations for modals)                     */
  /* -------------------------------------------------------------- */
  keyframes: {
    'modal-enter': {
      '0%': { opacity: '0', transform: 'scale(0.95) translateY(8px)' },
      '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
    },
    'modal-exit': {
      '0%': { opacity: '1', transform: 'scale(1) translateY(0)' },
      '100%': { opacity: '0', transform: 'scale(0.95) translateY(8px)' },
    },
    'overlay-enter': {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    'overlay-exit': {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' },
    },
  },

  animation: {
    'modal-enter': 'modal-enter 200ms cubic-bezier(0.16,1,0.3,1)',
    'modal-exit': 'modal-exit 150ms cubic-bezier(0.4,0,1,1)',
    'overlay-enter': 'overlay-enter 200ms ease-out',
    'overlay-exit': 'overlay-exit 150ms ease-in',
  },
} as const;
