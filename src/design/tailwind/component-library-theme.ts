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
        bg: 'var(--cs-interactive-default, #6366f1)',
        'bg-hover': 'var(--cs-interactive-hover, #818cf8)',
        'bg-active': 'var(--cs-interactive-active, #4f46e5)',
        text: '#ffffff',
      },
      secondary: {
        bg: 'transparent',
        'bg-hover': 'rgba(99,102,241,0.1)',
        'bg-active': 'rgba(99,102,241,0.15)',
        text: 'var(--cs-indigo-400, #818cf8)',
      },
      ghost: {
        bg: 'transparent',
        'bg-hover': 'rgba(113,113,122,0.1)',
        'bg-active': 'rgba(113,113,122,0.15)',
        text: 'var(--cs-text-secondary, #a1a1aa)',
      },
      danger: {
        bg: 'var(--cs-rose-600, #e11d48)',
        'bg-hover': 'var(--cs-rose-500, #ef4444)',
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
        ring: 'var(--cs-indigo-500, #818cf8)',
      },
    },
    input: {
      bg: 'var(--cs-zinc-900, #18181b)',
      'bg-hover': 'var(--cs-zinc-800, #27272a)',
      'bg-disabled': 'var(--cs-zinc-900, #18181b)',
      text: 'var(--cs-text-primary, #fafafa)',
      'text-disabled': 'var(--cs-text-disabled, #3f3f46)',
      placeholder: 'var(--cs-zinc-500, #71717a)',
      border: 'var(--cs-border-default, #27272a)',
      'border-hover': 'var(--cs-zinc-500, #71717a)',
      'border-focus': 'var(--cs-indigo-500, #818cf8)',
      'border-error': 'var(--cs-rose-500, #ef4444)',
      'border-success': 'var(--cs-emerald-500, #10b981)',
      label: 'var(--cs-text-secondary, #a1a1aa)',
      helper: 'var(--cs-text-tertiary, #71717a)',
      error: 'var(--cs-rose-400, #f87171)',
      success: 'var(--cs-emerald-400, #34d399)',
      icon: 'var(--cs-zinc-400, #a1a1aa)',
      'icon-focus': 'var(--cs-indigo-400, #818cf8)',
      focus: {
        ring: 'var(--cs-indigo-500, #818cf8)',
      },
    },
    'cs-card': {
      bg: 'var(--cs-surface-card, #18181b)',
      'bg-hover': 'var(--cs-surface-elevated, #27272a)',
      'bg-selected': 'rgba(99,102,241,0.08)',
      border: 'var(--cs-border-default, #27272a)',
      'border-hover': 'var(--cs-zinc-500, #71717a)',
      'border-selected': 'var(--cs-indigo-500, #818cf8)',
      'header-text': 'var(--cs-text-primary, #fafafa)',
      'body-text': 'var(--cs-text-secondary, #a1a1aa)',
      'meta-text': 'var(--cs-text-tertiary, #71717a)',
      divider: 'rgba(39,39,42,0.4)',
      'footer-bg': 'rgba(17,17,19,0.3)',
    },
    modal: {
      bg: 'var(--cs-zinc-900, #18181b)',
      border: 'var(--cs-border-default, #27272a)',
      'header-text': 'var(--cs-text-primary, #fafafa)',
      'body-text': 'var(--cs-text-secondary, #a1a1aa)',
      divider: 'rgba(39,39,42,0.4)',
      'close-icon': 'var(--cs-zinc-400, #a1a1aa)',
      'close-icon-hover': 'var(--cs-text-primary, #fafafa)',
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
    'btn-primary': '0 1px 3px rgba(99,102,241,0.3)',
    'btn-primary-hover': '0 4px 12px rgba(99,102,241,0.4)',
    'btn-danger': '0 1px 3px rgba(225,29,72,0.3)',
    'btn-danger-hover': '0 4px 12px rgba(225,29,72,0.4)',
    'btn-success': '0 1px 3px rgba(5,150,105,0.3)',
    'btn-success-hover': '0 4px 12px rgba(5,150,105,0.4)',
    'cs-card': '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(113,113,122,0.06)',
    'cs-card-hover': '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(113,113,122,0.1)',
    'cs-card-selected': '0 0 0 2px rgba(99,102,241,0.5), 0 4px 16px rgba(0,0,0,0.3)',
    modal: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(113,113,122,0.08)',
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
