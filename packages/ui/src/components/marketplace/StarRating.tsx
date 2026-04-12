import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface StarRatingProps extends React.HTMLAttributes<HTMLSpanElement> {
  rating: number;
}

export const StarRating = forwardRef<HTMLSpanElement, StarRatingProps>(function StarRating(
  { rating, className, ...props },
  ref,
) {
  const clamped = Math.max(0, Math.min(5, rating));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <span
      ref={ref}
      role="img"
      aria-label={`${clamped.toFixed(1)} out of 5 stars`}
      className={clsx('inline-flex items-center gap-0.5', className)}
      {...props}
    >
      {Array.from({ length: full }, (_, i) => (
        <svg
          key={`full-${i}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-amber-400"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      {hasHalf && (
        <svg
          key="half"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          className="text-amber-400"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="half-star">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="url(#half-star)"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      )}
      {Array.from({ length: empty }, (_, i) => (
        <svg
          key={`empty-${i}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-slate-600"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-[var(--cs-text-secondary,#a1a1aa)]">
        {clamped.toFixed(1)}
      </span>
    </span>
  );
});
