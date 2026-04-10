/**
 * TASK-173: PulseLoader component
 *
 * Animated loading indicator with pulsing dots.
 */

import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';

export interface PulseLoaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of dots. Default: 3. */
  dots?: number;
  /** Dot size in pixels. Default: 8. */
  size?: number;
  /** Color (CSS value). Default: current text color. */
  color?: string;
}

export const PulseLoader = forwardRef<HTMLDivElement, PulseLoaderProps>(
  ({ dots = 3, size = 8, color, className, style, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('cs-pulse-loader', className)}
        role="status"
        aria-label="Loading"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: `${size * 0.75}px`,
          ...style,
        }}
        {...rest}
      >
        {Array.from({ length: dots }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              backgroundColor: color ?? 'currentColor',
              opacity: 0.3,
              animation: `cs-loading-dots 1.4s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
        <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          Loading...
        </span>
      </div>
    );
  },
);

PulseLoader.displayName = 'PulseLoader';
