import { type HTMLAttributes, type ReactNode, forwardRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { useFocusTrap, type UseFocusTrapOptions } from '../../hooks/useFocusTrap.js';

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

export interface FocusScopeProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether the focus trap is active (default: true) */
  trapped?: boolean;
  /** Return focus to previously focused element on unmount (default: true) */
  returnFocusOnDeactivate?: boolean;
  /** Auto-focus first focusable child on mount (default: true) */
  autoFocus?: boolean;
  /** Children to render inside the focus scope */
  children?: ReactNode;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * Wrapper component that traps keyboard focus within its children.
 * Useful for modals, dialogs, drawers, and any overlay that should
 * prevent tabbing out to the page behind.
 *
 * Uses the `useFocusTrap` hook internally and exposes a simpler
 * component API.
 */
export const FocusScope = forwardRef<HTMLDivElement, FocusScopeProps>(
  (
    {
      trapped = true,
      returnFocusOnDeactivate = true,
      autoFocus = true,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const trapOptions: UseFocusTrapOptions = {
      enabled: trapped,
      returnFocusOnDeactivate,
      autoFocus,
    };

    const { containerRef } = useFocusTrap(trapOptions);

    // Sync the forwarded ref with the internal container ref
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(containerRef.current);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLElement | null>).current = containerRef.current;
      }
    }, [ref, containerRef]);

    return (
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className={clsx(className)}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

FocusScope.displayName = 'FocusScope';
