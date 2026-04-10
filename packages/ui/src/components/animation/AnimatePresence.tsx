/**
 * TASK-173: AnimatePresence component
 *
 * Conditionally mounts/unmounts children with enter/exit animations.
 * Similar in concept to Framer Motion's AnimatePresence but using
 * the Crewspace animation system.
 */

import { type ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import type { AnimationVariant, AnimationPhase } from './constants.js';
import { VARIANT_DURATION, VARIANT_EASING, ENTER_KEYFRAMES } from './constants.js';

export interface AnimatePresenceProps {
  /** Whether the content should be visible. */
  show: boolean;
  /** Animation variant. Default: 'fade'. */
  variant?: AnimationVariant;
  /** Duration in ms. Default: variant-dependent. */
  duration?: number;
  /** Content to animate. */
  children: ReactNode;
  /** Called after enter animation completes. */
  onEntered?: () => void;
  /** Called after exit animation completes and the element is unmounted. */
  onExited?: () => void;
}

export function AnimatePresence({
  show,
  variant = 'fade',
  duration: durationProp,
  children,
  onEntered,
  onExited,
}: AnimatePresenceProps) {
  const dur = durationProp ?? VARIANT_DURATION[variant];
  const easing = VARIANT_EASING[variant];
  const keyframes = ENTER_KEYFRAMES[variant];

  const [phase, setPhase] = useState<AnimationPhase>(show ? 'entering' : 'exited');
  const [mounted, setMounted] = useState(show);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clear();
    if (show) {
      setMounted(true);
      setPhase('entering');
      timerRef.current = setTimeout(() => {
        setPhase('entered');
        onEntered?.();
      }, dur);
    } else {
      if (!mounted) return;
      setPhase('exiting');
      timerRef.current = setTimeout(() => {
        setPhase('exited');
        setMounted(false);
        onExited?.();
      }, dur);
    }
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!mounted) return null;

  const fromStyle = keyframes.from as React.CSSProperties;
  const toStyle = keyframes.to as React.CSSProperties;

  const transitionValue = Object.keys({ ...fromStyle, ...toStyle })
    .map((p) => `${p} ${dur}ms ${easing}`)
    .join(', ');

  const currentStyle: React.CSSProperties =
    phase === 'entering' || phase === 'entered'
      ? { ...toStyle, transition: transitionValue }
      : { ...fromStyle, transition: transitionValue };

  return (
    <div
      className="cs-animate-presence"
      data-phase={phase}
      style={{
        ...currentStyle,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

AnimatePresence.displayName = 'AnimatePresence';
