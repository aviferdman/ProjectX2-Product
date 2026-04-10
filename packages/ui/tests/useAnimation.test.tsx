import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnimation } from '../src/hooks/useAnimation.js';

// The test setup.ts mocks matchMedia so that prefersReducedMotion returns true
// (because the mock returns matches=true for all queries). Override for animation tests.
const originalMatchMedia = window.matchMedia;

describe('useAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Override matchMedia to return false for reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string): MediaQueryList => {
        if (query.includes('prefers-reduced-motion')) {
          return {
            matches: false,
            media: query,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => true,
          } as unknown as MediaQueryList;
        }
        return originalMatchMedia(query);
      },
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
  });

  it('starts mounted when show is true', () => {
    const { result } = renderHook(() => useAnimation({ show: true }));
    expect(result.current.shouldMount).toBe(true);
  });

  it('starts in exited phase when show is false', () => {
    const { result } = renderHook(() => useAnimation({ show: false }));
    expect(result.current.phase).toBe('exited');
    expect(result.current.shouldMount).toBe(false);
  });

  it('transitions from entering to entered', () => {
    const onEntered = vi.fn();
    const { result } = renderHook(() =>
      useAnimation({ show: true, variant: 'fade', onEntered }),
    );

    expect(result.current.phase).toBe('entering');

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(result.current.phase).toBe('entered');
    expect(onEntered).toHaveBeenCalledOnce();
  });

  it('returns style object with opacity for fade variant', () => {
    const { result } = renderHook(() =>
      useAnimation({ show: true, variant: 'fade' }),
    );

    expect(result.current.style).toBeDefined();
    expect('opacity' in result.current.style).toBe(true);
  });

  it('returns style with transform for slideUp variant', () => {
    const { result } = renderHook(() =>
      useAnimation({ show: false, variant: 'slideUp' }),
    );

    expect(result.current.style).toBeDefined();
    expect('transform' in result.current.style).toBe(true);
  });

  it('respects duration override', () => {
    const onEntered = vi.fn();
    renderHook(() =>
      useAnimation({ show: true, variant: 'fade', duration: 500, onEntered }),
    );

    // At 300ms (default fade duration) should not have fired
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onEntered).not.toHaveBeenCalled();

    // At 510ms (past 500ms override) should have fired
    act(() => {
      vi.advanceTimersByTime(210);
    });
    expect(onEntered).toHaveBeenCalledOnce();
  });

  it('respects prefers-reduced-motion', () => {
    // Re-override to return true for reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string): MediaQueryList => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => true,
      } as unknown as MediaQueryList),
    });

    const onEntered = vi.fn();
    renderHook(() =>
      useAnimation({ show: true, variant: 'fade', onEntered }),
    );

    // With reduced motion, duration is 0 so callback fires immediately
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onEntered).toHaveBeenCalledOnce();
  });
});
