/**
 * TASK-173: useAnimation hook
 *
 * Manages animation lifecycle (enter / exit) with support for
 * reduced-motion preferences. Returns style objects and phase state
 * so components can animate declaratively.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AnimationPhase, AnimationVariant } from '../components/animation/constants.js';
import {
  ENTER_KEYFRAMES,
  VARIANT_DURATION,
  VARIANT_EASING,
} from '../components/animation/constants.js';

export interface UseAnimationOptions {
  /** Whether the element should be visible (triggers enter/exit). */
  show: boolean;
  /** The animation variant to use. Default: 'fade'. */
  variant?: AnimationVariant;
  /** Override duration in ms. */
  duration?: number;
  /** Delay before the animation starts in ms. Default: 0. */
  delay?: number;
  /** Called when the enter animation finishes. */
  onEntered?: () => void;
  /** Called when the exit animation finishes. */
  onExited?: () => void;
}

export interface UseAnimationResult {
  /** Current animation phase. */
  phase: AnimationPhase;
  /** Style object to spread onto the target element. */
  style: React.CSSProperties;
  /** Whether the element should be mounted in the DOM. */
  shouldMount: boolean;
}

/**
 * Detects whether the user has requested reduced motion via OS settings.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useAnimation(options: UseAnimationOptions): UseAnimationResult {
  const { show, variant = 'fade', duration: durationOverride, delay = 0, onEntered, onExited } = options;

  const resolvedDuration = prefersReducedMotion() ? 0 : (durationOverride ?? VARIANT_DURATION[variant]);
  const easing = VARIANT_EASING[variant];
  const keyframes = ENTER_KEYFRAMES[variant];

  const [phase, setPhase] = useState<AnimationPhase>(show ? 'entered' : 'exited');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimer();

    if (show) {
      setPhase('entering');
      timeoutRef.current = setTimeout(() => {
        setPhase('entered');
        onEntered?.();
      }, resolvedDuration + delay);
    } else {
      if (phase === 'exited' || phase === 'idle') return;
      setPhase('exiting');
      timeoutRef.current = setTimeout(() => {
        setPhase('exited');
        onExited?.();
      }, resolvedDuration);
    }

    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const shouldMount = phase !== 'exited';

  const style: React.CSSProperties = (() => {
    if (resolvedDuration === 0) {
      return show ? { ...toCss(keyframes.to) } : { ...toCss(keyframes.from) };
    }

    switch (phase) {
      case 'entering':
        return {
          ...toCss(keyframes.to),
          transition: buildTransition(keyframes.to, resolvedDuration, easing),
          transitionDelay: delay ? `${delay}ms` : undefined,
          // Start from the "from" state immediately, then transition "to"
          ...toCss(keyframes.from),
          // Force re-apply "to" styles after mount by using animation
          animation: `none`,
        };
      case 'entered':
        return { ...toCss(keyframes.to) };
      case 'exiting':
        return {
          ...toCss(keyframes.from),
          transition: buildTransition(keyframes.from, resolvedDuration, easing),
        };
      case 'exited':
      case 'idle':
      default:
        return { ...toCss(keyframes.from) };
    }
  })();

  return { phase, style, shouldMount };
}

function toCss(obj: Record<string, string>): React.CSSProperties {
  return obj as unknown as React.CSSProperties;
}

function buildTransition(target: Record<string, string>, duration: number, easing: string): string {
  const props = Object.keys(target);
  return props.map((p) => `${p} ${duration}ms ${easing}`).join(', ');
}
