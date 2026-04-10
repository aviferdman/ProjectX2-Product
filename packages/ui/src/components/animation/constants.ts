/**
 * TASK-173: Animation constants and types
 *
 * Shared constants for the Crewspace animation system.
 * All timing values align with the design tokens defined in
 * src/design/tokens/animations.json and visual-polish.json.
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Animation variant for enter/exit transitions */
export type AnimationVariant = 'fade' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'spring';

/** Current phase of an animation lifecycle */
export type AnimationPhase = 'idle' | 'entering' | 'entered' | 'exiting' | 'exited';

/** Page-level transition preset */
export type PageTransitionVariant = 'fade' | 'slideUp' | 'slideLeft' | 'slideRight';

/** Loading animation preset */
export type LoadingVariant = 'skeleton' | 'shimmer' | 'pulse';

/* ------------------------------------------------------------------ */
/* Duration constants (ms)                                             */
/* ------------------------------------------------------------------ */

export const DURATION = {
  instant: 50,
  fast: 100,
  normal: 150,
  moderate: 200,
  slow: 300,
  enter: 250,
  exit: 200,
  page: 350,
} as const;

/* ------------------------------------------------------------------ */
/* Easing constants                                                    */
/* ------------------------------------------------------------------ */

export const EASING = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

/* ------------------------------------------------------------------ */
/* Stagger defaults                                                    */
/* ------------------------------------------------------------------ */

export const STAGGER = {
  delay: 40,
  maxDelay: 500,
  maxItems: 12,
} as const;

/* ------------------------------------------------------------------ */
/* Animation style maps                                                */
/* ------------------------------------------------------------------ */

export interface AnimationKeyframe {
  from: Record<string, string>;
  to: Record<string, string>;
}

export const ENTER_KEYFRAMES: Record<AnimationVariant, AnimationKeyframe> = {
  fade: {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
  slideUp: {
    from: { opacity: '0', transform: 'translateY(16px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
  slideDown: {
    from: { opacity: '0', transform: 'translateY(-16px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
  slideLeft: {
    from: { opacity: '0', transform: 'translateX(24px)' },
    to: { opacity: '1', transform: 'translateX(0)' },
  },
  slideRight: {
    from: { opacity: '0', transform: 'translateX(-24px)' },
    to: { opacity: '1', transform: 'translateX(0)' },
  },
  scale: {
    from: { opacity: '0', transform: 'scale(0.92)' },
    to: { opacity: '1', transform: 'scale(1)' },
  },
  spring: {
    from: { opacity: '0', transform: 'scale(0.85)' },
    to: { opacity: '1', transform: 'scale(1)' },
  },
};

export const VARIANT_EASING: Record<AnimationVariant, string> = {
  fade: EASING.default,
  slideUp: EASING.out,
  slideDown: EASING.out,
  slideLeft: EASING.out,
  slideRight: EASING.out,
  scale: EASING.out,
  spring: EASING.spring,
};

export const VARIANT_DURATION: Record<AnimationVariant, number> = {
  fade: DURATION.slow,
  slideUp: DURATION.page,
  slideDown: DURATION.page,
  slideLeft: DURATION.slow,
  slideRight: DURATION.slow,
  scale: DURATION.enter,
  spring: DURATION.enter,
};
