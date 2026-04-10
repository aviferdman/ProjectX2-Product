/**
 * TASK-173: SlideIn animation component
 *
 * Slides children into view from a given direction using CSS transitions.
 */

import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef, useState, useEffect } from 'react';
import { DURATION, EASING } from './constants.js';

export type SlideDirection = 'up' | 'down' | 'left' | 'right';

export interface SlideInProps extends HTMLAttributes<HTMLDivElement> {
  /** Direction to slide from. Default: 'up'. */
  direction?: SlideDirection;
  /** Distance in pixels. Default: 16 for up/down, 24 for left/right. */
  distance?: number;
  /** Duration in ms. Default: 350. */
  duration?: number;
  /** Delay in ms. Default: 0. */
  delay?: number;
}

const DEFAULT_DISTANCE: Record<SlideDirection, number> = {
  up: 16,
  down: 16,
  left: 24,
  right: 24,
};

const TRANSFORM_MAP: Record<SlideDirection, (d: number) => string> = {
  up: (d) => `translateY(${d}px)`,
  down: (d) => `translateY(${-d}px)`,
  left: (d) => `translateX(${d}px)`,
  right: (d) => `translateX(${-d}px)`,
};

export const SlideIn = forwardRef<HTMLDivElement, SlideInProps>(
  (
    {
      direction = 'up',
      distance,
      duration = DURATION.page,
      delay = 0,
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) => {
    const [entered, setEntered] = useState(false);
    const dist = distance ?? DEFAULT_DISTANCE[direction];
    const fromTransform = TRANSFORM_MAP[direction](dist);

    useEffect(() => {
      const timer = setTimeout(() => setEntered(true), delay);
      return () => clearTimeout(timer);
    }, [delay]);

    return (
      <div
        ref={ref}
        className={clsx('cs-anim-slide-in', className)}
        data-direction={direction}
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'translate(0, 0)' : fromTransform,
          transition: `opacity ${duration}ms ${EASING.out}, transform ${duration}ms ${EASING.out}`,
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

SlideIn.displayName = 'SlideIn';
