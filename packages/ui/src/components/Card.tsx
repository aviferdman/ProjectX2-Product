import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Add a subtle hover effect */
  hoverable?: boolean;
  /** Add visual padding preset (default = md) */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable = false, padding = 'md', className, children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-lg border border-slate-700 bg-surface-card shadow-node',
          'transition-shadow duration-200',
          hoverable && 'hover:shadow-node-hover hover:border-slate-600 cursor-pointer',
          paddingStyles[padding],
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

/* ------------------------------------------------------------------ */
/* CardHeader                                                          */
/* ------------------------------------------------------------------ */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'flex items-center gap-2 pb-3 border-b border-slate-700',
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

CardHeader.displayName = 'CardHeader';

/* ------------------------------------------------------------------ */
/* CardBody                                                            */
/* ------------------------------------------------------------------ */
export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, ...rest }, ref) => {
    return (
      <div ref={ref} className={clsx('pt-3', className)} {...rest}>
        {children}
      </div>
    );
  },
);

CardBody.displayName = 'CardBody';
