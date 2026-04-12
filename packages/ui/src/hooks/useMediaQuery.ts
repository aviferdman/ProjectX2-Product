import { useState, useEffect, useCallback } from 'react';

/**
 * Low-level hook that tracks a CSS media query match.
 * Returns `true` when the query matches, `false` otherwise.
 *
 * Falls back to `false` during SSR (no `window`).
 */
export function useMediaQuery(query: string): boolean {
  const getMatch = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  }, [query]);

  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent): void => {
      setMatches(e.matches);
    };
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
