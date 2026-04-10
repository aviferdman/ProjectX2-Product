/**
 * Crewspace Animation Tailwind Theme Extension
 * TASK-173: Provides animation utility classes via Tailwind config.
 */

export const animationTheme = {
  keyframes: {
    'cs-fade-in': {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    'cs-fade-out': {
      from: { opacity: '1' },
      to: { opacity: '0' },
    },
    'cs-slide-up-in': {
      from: { opacity: '0', transform: 'translateY(16px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    'cs-slide-down-in': {
      from: { opacity: '0', transform: 'translateY(-16px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    'cs-slide-left-in': {
      from: { opacity: '0', transform: 'translateX(24px)' },
      to: { opacity: '1', transform: 'translateX(0)' },
    },
    'cs-slide-right-in': {
      from: { opacity: '0', transform: 'translateX(-24px)' },
      to: { opacity: '1', transform: 'translateX(0)' },
    },
    'cs-scale-in': {
      from: { opacity: '0', transform: 'scale(0.92)' },
      to: { opacity: '1', transform: 'scale(1)' },
    },
    'cs-spring-in': {
      from: { opacity: '0', transform: 'scale(0.85)' },
      to: { opacity: '1', transform: 'scale(1)' },
    },
    'cs-skeleton': {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    'cs-pulse-loading': {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.4' },
    },
    'cs-shimmer': {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(100%)' },
    },
  },
  animation: {
    'cs-fade-in': 'cs-fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) both',
    'cs-fade-out': 'cs-fade-out 300ms cubic-bezier(0.4, 0, 0.2, 1) both',
    'cs-slide-up': 'cs-slide-up-in 350ms cubic-bezier(0, 0, 0.2, 1) both',
    'cs-slide-down': 'cs-slide-down-in 350ms cubic-bezier(0, 0, 0.2, 1) both',
    'cs-slide-left': 'cs-slide-left-in 300ms cubic-bezier(0, 0, 0.2, 1) both',
    'cs-slide-right': 'cs-slide-right-in 300ms cubic-bezier(0, 0, 0.2, 1) both',
    'cs-scale-in': 'cs-scale-in 250ms cubic-bezier(0, 0, 0.2, 1) both',
    'cs-spring-in': 'cs-spring-in 250ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
    'cs-skeleton': 'cs-skeleton 1.5s ease-in-out infinite',
    'cs-pulse-loading': 'cs-pulse-loading 1.5s ease-in-out infinite',
    'cs-shimmer': 'cs-shimmer 2s linear infinite',
  },
  transitionDuration: {
    instant: '50ms',
    fast: '100ms',
    normal: '150ms',
    moderate: '200ms',
    slow: '300ms',
    enter: '250ms',
    page: '350ms',
  },
  transitionTimingFunction: {
    'cs-default': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'cs-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'cs-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'cs-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'cs-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;
