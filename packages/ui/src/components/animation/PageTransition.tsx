/**
 * TASK-173: PageTransition component
 *
 * Wraps page content with an enter animation. Intended to be placed
 * at the top level of each route/page to provide a consistent
 * page-level transition.
 */

import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef, useState, useEffect } from 'react';
import { DURATION, EASING } from './constants.js';
import type { PageTransitionVariant } from './constants.js';

export interface PageTransitionProps extends HTMLAttributes<HTMLDivElement> {
  /** Transition variant. Default: 'fade'. */
  variant?: PageTransitionVariant;
  /** Duration in ms. Default: variant-dependent. */
  duration?: number;
  /** Delay in ms. Default: 0. */
  delay?: number;
}

const VARIANT_CONFIG: Record<
  PageTransitionVariant,
  { fromStyle: React.CSSProperties; duration: number; easing: string }
> = {
  fade: {
    fromStyle: { opacity: 0 },
    duration: DURATION.slow,
    easing: EASING.default,
  },
  slideUp: {
    fromStyle: { opacity: 0, transform: 'translateY(16px)' },
    duration: DURATION.page,
    easing: EASING.out,
  },
  slideLeft: {
    fromStyle: { opacity: 0, transform: 'translateX(24px)' },
    duration: DURATION.slow,
    easing: EASING.out,
  },
  slideRight: {
    fromStyle: { opacity: 0, transform: 'translateX(-24px)' },
    duration: DURATION.slow,
    easing: EASING.out,
  },
};

const ENTERED_STYLE: React.CSSProperties = {
  opacity: 1,
  transform: 'translate(0, 0)',
};

export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  (
    { variant = 'fade', duration: durationProp, delay = 0, className, style, children, ...rest },
    ref,
  ) => {
    const config = VARIANT_CONFIG[variant];
    const dur = durationProp ?? config.duration;
    const [entered, setEntered] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setEntered(true), delay);
      return () => clearTimeout(timer);
    }, [delay]);

    const transitionProps = Object.keys(config.fromStyle)
      .map((p) => `${p} ${dur}ms ${config.easing}`)
      .join(', ');

    return (
      <div
        ref={ref}
        className={clsx('cs-page-transition', className)}
        data-variant={variant}
        data-entered={entered}
        style={{
          ...(entered ? ENTERED_STYLE : config.fromStyle),
          transition: transitionProps,
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

PageTransition.displayName = 'PageTransition';
