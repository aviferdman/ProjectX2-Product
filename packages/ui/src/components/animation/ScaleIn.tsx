/**
 * TASK-173: ScaleIn animation component
 *
 * Scales children into view, optionally with a spring easing.
 */

import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef, useState, useEffect } from 'react';
import { DURATION, EASING } from './constants.js';

export interface ScaleInProps extends HTMLAttributes<HTMLDivElement> {
  /** Starting scale. Default: 0.92. */
  from?: number;
  /** Use spring easing. Default: false. */
  spring?: boolean;
  /** Duration in ms. Default: 250. */
  duration?: number;
  /** Delay in ms. Default: 0. */
  delay?: number;
}

export const ScaleIn = forwardRef<HTMLDivElement, ScaleInProps>(
  (
    {
      from = 0.92,
      spring: useSpring = false,
      duration = DURATION.enter,
      delay = 0,
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) => {
    const [entered, setEntered] = useState(false);
    const easing = useSpring ? EASING.spring : EASING.out;

    useEffect(() => {
      const timer = setTimeout(() => setEntered(true), delay);
      return () => clearTimeout(timer);
    }, [delay]);

    return (
      <div
        ref={ref}
        className={clsx('cs-anim-scale-in', className)}
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'scale(1)' : `scale(${from})`,
          transition: `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`,
          willChange: 'opacity, transform',
          ...style,
        }}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

ScaleIn.displayName = 'ScaleIn';
