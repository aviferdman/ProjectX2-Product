/**
 * TASK-173: FadeIn animation component
 *
 * Fades children into view when mounted using CSS transitions.
 */

import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef, useState, useEffect } from 'react';
import { DURATION, EASING } from './constants.js';

export interface FadeInProps extends HTMLAttributes<HTMLDivElement> {
  /** Duration in ms. Default: 300. */
  duration?: number;
  /** Delay in ms. Default: 0. */
  delay?: number;
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ duration = DURATION.slow, delay = 0, className, style, children, ...rest }, ref) => {
    const [entered, setEntered] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setEntered(true), delay);
      return () => clearTimeout(timer);
    }, [delay]);

    return (
      <div
        ref={ref}
        className={clsx('cs-anim-fade-in', className)}
        style={{
          opacity: entered ? 1 : 0,
          transition: `opacity ${duration}ms ${EASING.default}`,
          willChange: 'opacity',
          ...style,
        }}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

FadeIn.displayName = 'FadeIn';
