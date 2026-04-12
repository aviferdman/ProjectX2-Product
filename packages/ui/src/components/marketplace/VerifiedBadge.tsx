import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface VerifiedBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const VerifiedBadge = forwardRef<HTMLSpanElement, VerifiedBadgeProps>(function VerifiedBadge(
  { className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={clsx(
        'inline-flex items-center gap-1 rounded-sm border px-1.5',
        'text-[10px] font-semibold uppercase tracking-wider',
        'h-5',
        'bg-emerald-500/10 text-emerald-400 border-emerald-400/30',
        className,
      )}
      {...props}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      Verified
    </span>
  );
});
