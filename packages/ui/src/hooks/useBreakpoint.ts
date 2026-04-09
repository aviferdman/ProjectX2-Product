import { useMemo } from 'react';
import { useMediaQuery } from './useMediaQuery.js';

/** Design-system breakpoints from TASK-169 responsive tokens */
export const BREAKPOINTS = {
  xs: 375,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

const ORDERED: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];

export interface BreakpointState {
  /** Current active breakpoint name */
  current: Breakpoint;
  /** True when viewport ≥ xs (375px) */
  isXs: boolean;
  /** True when viewport ≥ sm (640px) */
  isSm: boolean;
  /** True when viewport ≥ md (768px) — tablet portrait */
  isMd: boolean;
  /** True when viewport ≥ lg (1024px) — tablet landscape / laptop */
  isLg: boolean;
  /** True when viewport ≥ xl (1280px) — desktop */
  isXl: boolean;
  /** True when viewport ≥ 2xl (1536px) — large desktop */
  is2xl: boolean;
  /** Convenience: true when below md (< 768px) */
  isMobile: boolean;
  /** Convenience: true when md ≤ viewport < lg */
  isTablet: boolean;
  /** Convenience: true when viewport ≥ lg */
  isDesktop: boolean;
}

/**
 * Returns the current breakpoint and boolean flags for each tier.
 * Listens to `matchMedia` for real-time updates on resize.
 */
export function useBreakpoint(): BreakpointState {
  const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`);
  const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
  const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);
  const is2xl = useMediaQuery(`(min-width: ${BREAKPOINTS['2xl']}px)`);

  return useMemo(() => {
    const flags = { xs: true, sm: isSm, md: isMd, lg: isLg, xl: isXl, '2xl': is2xl };
    let current: Breakpoint = 'xs';
    for (const bp of ORDERED) {
      if (flags[bp]) {
        current = bp;
        break;
      }
    }

    return {
      current,
      isXs: true,
      isSm,
      isMd,
      isLg,
      isXl,
      is2xl,
      isMobile: !isMd,
      isTablet: isMd && !isLg,
      isDesktop: isLg,
    };
  }, [isSm, isMd, isLg, isXl, is2xl]);
}
