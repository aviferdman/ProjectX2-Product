import { useEffect, useRef, useCallback, type RefObject } from 'react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface UseFocusTrapOptions {
  /** Whether the focus trap is currently active */
  enabled?: boolean;
  /** Return focus to the previously focused element on deactivation (default: true) */
  returnFocusOnDeactivate?: boolean;
  /** Auto-focus the first focusable element on activation (default: true) */
  autoFocus?: boolean;
  /** Element to focus initially (overrides autoFocus to first focusable) */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export interface UseFocusTrapResult {
  /** Attach this ref to the container element */
  containerRef: RefObject<HTMLElement | null>;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
].join(',');

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      !el.hasAttribute('disabled') &&
      !el.hasAttribute('hidden') &&
      getComputedStyle(el).display !== 'none' &&
      getComputedStyle(el).visibility !== 'hidden',
  );
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useFocusTrap(options: UseFocusTrapOptions = {}): UseFocusTrapResult {
  const {
    enabled = true,
    returnFocusOnDeactivate = true,
    autoFocus = true,
    initialFocusRef,
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element when the trap activates
  useEffect(() => {
    if (enabled) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    }
  }, [enabled]);

  // Auto-focus on activation
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
      return;
    }

    if (autoFocus) {
      const focusable = getFocusableElements(containerRef.current);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        // If no focusable children, focus the container itself
        containerRef.current.setAttribute('tabindex', '-1');
        containerRef.current.focus();
      }
    }
  }, [enabled, autoFocus, initialFocusRef]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !containerRef.current || event.key !== 'Tab') return;

      const focusable = getFocusableElements(containerRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        // Shift+Tab: wrap from first to last
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        // Tab: wrap from last to first
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    [enabled],
  );

  // Register the keyboard handler
  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  // Return focus when trap is deactivated
  useEffect(() => {
    return () => {
      if (returnFocusOnDeactivate && previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [returnFocusOnDeactivate]);

  return { containerRef };
}
