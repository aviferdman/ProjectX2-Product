import { useCallback, useEffect, useRef } from 'react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type AriaPoliteness = 'polite' | 'assertive';

export interface UseAriaAnnouncerOptions {
  /** Default politeness level (default: 'polite') */
  politeness?: AriaPoliteness;
}

export interface UseAriaAnnouncerResult {
  /** Announce a message to screen readers */
  announce: (message: string, politeness?: AriaPoliteness) => void;
  /** Clear the current announcement */
  clear: () => void;
}

/* ------------------------------------------------------------------ */
/* Singleton live-region manager                                       */
/* ------------------------------------------------------------------ */

const LIVE_REGION_ID_PREFIX = 'crewspace-aria-live';

function getOrCreateRegion(politeness: AriaPoliteness): HTMLElement {
  const id = `${LIVE_REGION_ID_PREFIX}-${politeness}`;
  let region = document.getElementById(id);
  if (!region) {
    region = document.createElement('div');
    region.id = id;
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status');
    Object.assign(region.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0,0,0,0)',
      whiteSpace: 'nowrap',
      border: '0',
    });
    document.body.appendChild(region);
  }
  return region;
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useAriaAnnouncer(options: UseAriaAnnouncerOptions = {}): UseAriaAnnouncerResult {
  const { politeness: defaultPoliteness = 'polite' } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback(
    (message: string, politeness?: AriaPoliteness) => {
      const level = politeness ?? defaultPoliteness;
      const region = getOrCreateRegion(level);

      // Clear first so re-announcing same message triggers screen readers
      region.textContent = '';

      // Use rAF + microtask to ensure SR picks up the change
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        region.textContent = message;
      }, 50);
    },
    [defaultPoliteness],
  );

  const clear = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const polite = document.getElementById(`${LIVE_REGION_ID_PREFIX}-polite`);
    const assertive = document.getElementById(`${LIVE_REGION_ID_PREFIX}-assertive`);
    if (polite) polite.textContent = '';
    if (assertive) assertive.textContent = '';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { announce, clear };
}
