import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

export interface SkipLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  /** The id of the element to skip to (without #) */
  targetId: string;
  /** Link text (default: "Skip to main content") */
  label?: string;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * Renders a visually-hidden link that becomes visible on focus.
 * Screen-reader users and keyboard navigators can use it to jump
 * past repetitive navigation directly to the main content region.
 */
export const SkipLink = forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ targetId, label = 'Skip to main content', className, ...rest }, ref) => {
    return (
      <a
        ref={ref}
        href={`#${targetId}`}
        className={clsx(
          // Visually hidden by default, visible on focus
          'sr-only focus:not-sr-only',
          'fixed top-2 left-2 z-[9999]',
          'inline-block rounded-md px-4 py-2',
          'bg-brand-primary text-white text-sm font-medium',
          'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-surface-app',
          'transition-all duration-150',
          className,
        )}
        {...rest}
      >
        {label}
      </a>
    );
  },
);

SkipLink.displayName = 'SkipLink';
