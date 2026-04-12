import { clsx } from 'clsx';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type LiveRegionPoliteness = 'polite' | 'assertive' | 'off';

export interface LiveRegionProps extends HTMLAttributes<HTMLDivElement> {
  /** The politeness level for the live region (default: 'polite') */
  politeness?: LiveRegionPoliteness;
  /** Whether the entire region should be re-read on changes (default: true) */
  atomic?: boolean;
  /** Whether the region is visually hidden (default: true) */
  visuallyHidden?: boolean;
  /** Content to announce */
  children?: ReactNode;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * Declarative ARIA live region. Renders a `<div>` with the appropriate
 * `aria-live` and `role` attributes. Content changes are announced by
 * assistive technology.
 *
 * Set `visuallyHidden={false}` to render a visible status region.
 */
export const LiveRegion = forwardRef<HTMLDivElement, LiveRegionProps>(
  (
    { politeness = 'polite', atomic = true, visuallyHidden = true, className, children, ...rest },
    ref,
  ) => {
    const role = politeness === 'assertive' ? 'alert' : 'status';

    return (
      <div
        ref={ref}
        aria-live={politeness}
        aria-atomic={atomic}
        role={role}
        className={clsx(visuallyHidden && 'sr-only', className)}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

LiveRegion.displayName = 'LiveRegion';
