/**
 * TASK-173: Shimmer loading effect
 *
 * A full-width shimmer overlay intended to wrap a placeholder container.
 * Shows a sweeping light gradient animation to indicate loading.
 */

import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';

export interface ShimmerProps extends HTMLAttributes<HTMLDivElement> {
  /** Width (CSS value). Default: '100%'. */
  width?: string | number;
  /** Height (CSS value). Default: '100%'. */
  height?: string | number;
  /** Whether to animate. Default: true. */
  animate?: boolean;
}

const toUnit = (v: string | number): string => (typeof v === 'number' ? `${v}px` : v);

export const Shimmer = forwardRef<HTMLDivElement, ShimmerProps>(
  ({ width = '100%', height = '100%', animate = true, className, style, children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('cs-shimmer', className)}
        role="status"
        aria-label="Loading"
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: toUnit(width),
          height: toUnit(height),
          background: 'rgba(148, 163, 184, 0.06)',
          borderRadius: '4px',
          ...style,
        }}
        {...rest}
      >
        {children}
        {animate && (
          <div
            className="cs-shimmer__sweep"
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(113,113,122,0.12) 50%, transparent 100%)',
              animation: 'cs-loading-shimmer 2s linear infinite',
            }}
          />
        )}
        <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          Loading...
        </span>
      </div>
    );
  },
);

Shimmer.displayName = 'Shimmer';
