/**
 * TASK-173: Skeleton loading placeholder
 *
 * Renders a pulsing placeholder shape that indicates content is loading.
 * Supports text lines, circles (avatars), and rectangular blocks.
 */

import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';

export type SkeletonVariant = 'text' | 'circle' | 'rect';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Shape variant. Default: 'text'. */
  variant?: SkeletonVariant;
  /** Width (CSS value). Default: '100%' for text/rect, size for circle. */
  width?: string | number;
  /** Height (CSS value). Default: '1em' for text, width for circle. */
  height?: string | number;
  /** Number of text lines to render. Default: 1. Only applies to 'text'. */
  lines?: number;
  /** Whether to animate. Default: true. */
  animate?: boolean;
}

const toUnit = (v: string | number): string => (typeof v === 'number' ? `${v}px` : v);

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    { variant = 'text', width, height, lines = 1, animate = true, className, style, ...rest },
    ref,
  ) => {
    if (variant === 'text' && lines > 1) {
      return (
        <div
          ref={ref}
          className={clsx('cs-skeleton-group', className)}
          role="status"
          aria-label="Loading"
          {...rest}
        >
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={clsx('cs-skeleton cs-skeleton--text', animate && 'cs-anim-skeleton')}
              style={{
                width: i === lines - 1 ? '75%' : width ? toUnit(width) : '100%',
                height: height ? toUnit(height) : '1em',
                borderRadius: '4px',
                marginBottom: i < lines - 1 ? '8px' : undefined,
                background:
                  'linear-gradient(90deg, rgba(113,113,122,0.08) 25%, rgba(113,113,122,0.16) 50%, rgba(113,113,122,0.08) 75%)',
                backgroundSize: '200% 100%',
                animation: animate ? 'cs-loading-skeleton 1.5s ease-in-out infinite' : 'none',
                ...style,
              }}
              aria-hidden="true"
            />
          ))}
          <span
            className="sr-only"
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
              clip: 'rect(0,0,0,0)',
            }}
          >
            Loading...
          </span>
        </div>
      );
    }

    const isCircle = variant === 'circle';
    const w = width ? toUnit(width) : isCircle ? '40px' : '100%';
    const h = height ? toUnit(height) : isCircle ? w : '1em';

    return (
      <div
        ref={ref}
        className={clsx(
          'cs-skeleton',
          `cs-skeleton--${variant}`,
          animate && 'cs-anim-skeleton',
          className,
        )}
        role="status"
        aria-label="Loading"
        style={{
          width: w,
          height: h,
          borderRadius: isCircle ? '50%' : '4px',
          background:
            'linear-gradient(90deg, rgba(113,113,122,0.08) 25%, rgba(113,113,122,0.16) 50%, rgba(113,113,122,0.08) 75%)',
          backgroundSize: '200% 100%',
          animation: animate ? 'cs-loading-skeleton 1.5s ease-in-out infinite' : 'none',
          ...style,
        }}
        {...rest}
      >
        <span
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
          }}
        >
          Loading...
        </span>
      </div>
    );
  },
);

Skeleton.displayName = 'Skeleton';
