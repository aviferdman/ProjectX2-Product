/**
 * TASK-173: StaggerList animation component
 *
 * Renders a list of children with staggered enter animations.
 * Each child gets an incremental delay based on its index.
 */

import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef, useState, useEffect, Children } from 'react';
import { DURATION, EASING, STAGGER } from './constants.js';

export interface StaggerListProps extends HTMLAttributes<HTMLDivElement> {
  /** Delay between each child in ms. Default: 40. */
  staggerDelay?: number;
  /** Max total stagger time before all remaining items appear instantly. Default: 500. */
  maxDelay?: number;
  /** Duration of each child's enter animation. Default: 250. */
  duration?: number;
  /** Distance for the slide animation. Default: 12. */
  distance?: number;
}

export const StaggerList = forwardRef<HTMLDivElement, StaggerListProps>(
  (
    {
      staggerDelay = STAGGER.delay,
      maxDelay = STAGGER.maxDelay,
      duration = DURATION.enter,
      distance = 12,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const [entered, setEntered] = useState(false);
    const items = Children.toArray(children);

    useEffect(() => {
      // Trigger enter on mount
      const frame = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(frame);
    }, []);

    return (
      <div ref={ref} className={clsx('cs-stagger-list', className)} {...rest}>
        {items.map((child, index) => {
          const itemDelay = Math.min(index * staggerDelay, maxDelay);
          return (
            <div
              key={index}
              className="cs-stagger-item"
              style={{
                opacity: entered ? 1 : 0,
                transform: entered ? 'translateY(0)' : `translateY(${distance}px)`,
                transition: `opacity ${duration}ms ${EASING.out} ${itemDelay}ms, transform ${duration}ms ${EASING.out} ${itemDelay}ms`,
                willChange: 'opacity, transform',
              }}
            >
              {child}
            </div>
          );
        })}
      </div>
    );
  },
);

StaggerList.displayName = 'StaggerList';
