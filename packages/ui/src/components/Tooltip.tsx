import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';

/* ------------------------------------------------------------------ */
/* Tooltip                                                             */
/* ------------------------------------------------------------------ */
export interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  /** Tooltip text content */
  label: string;
  /** Placement relative to the trigger */
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const placementStyles = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
} as const;

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ label, placement = 'top', className, children, ...rest }, ref) => {
    return (
      <div ref={ref} className={clsx('relative group inline-flex', className)} {...rest}>
        {children}
        <span
          role="tooltip"
          className={clsx(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-md',
            'bg-slate-800 px-2 py-1 text-xs text-slate-200 shadow-lg border border-slate-700',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
            placementStyles[placement],
          )}
        >
          {label}
        </span>
      </div>
    );
  },
);

Tooltip.displayName = 'Tooltip';
