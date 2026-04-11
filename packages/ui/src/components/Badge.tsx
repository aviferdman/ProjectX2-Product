import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';

/* ------------------------------------------------------------------ */
/* Variant style map                                                   */
/* ------------------------------------------------------------------ */
const variantStyles = {
  default: 'bg-surface-elevated text-slate-300 border-slate-600',
  brand: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50',
  success: 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50',
  warning: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
  error: 'bg-rose-900/30 text-rose-300 border-rose-700/50',
  info: 'bg-sky-900/30 text-sky-300 border-sky-700/50',
} as const;

export type BadgeVariant = keyof typeof variantStyles;

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className, children, ...rest }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center rounded-full border px-2 py-0.5',
          'text-node-badge font-semibold uppercase tracking-wider',
          variantStyles[variant],
          className,
        )}
        {...rest}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';
