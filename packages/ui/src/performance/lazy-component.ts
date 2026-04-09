/**
 * React lazy-loading utilities for Crewspace UI components.
 *
 * Provides a wrapper around React.lazy with retry logic, prefetching,
 * and loading/error state handling for code-split components.
 *
 * @packageDocumentation
 */

import React, { type ComponentType } from 'react';

/** Options for creating a lazy-loaded component. */
export interface LazyComponentOptions {
  /** Maximum retry attempts if the import fails. Default: 2. */
  retries?: number;
  /** Delay between retries in ms. Default: 1500. */
  retryDelay?: number;
  /** Preload the component immediately (without rendering). Default: false. */
  preload?: boolean;
}

/** Result from createLazyComponent including the component and helpers. */
export interface LazyComponentResult<P extends Record<string, unknown>> {
  /** The lazily-loaded React component (use with Suspense). */
  Component: React.LazyExoticComponent<ComponentType<P>>;
  /** Trigger prefetching of the component module. */
  prefetch: () => Promise<void>;
}

/**
 * Creates a lazy-loaded React component with retry support.
 *
 * This utility wraps `React.lazy` with automatic retry logic for
 * resilience against transient network failures during code splitting.
 *
 * @example
 * ```tsx
 * const { Component: HeavyChart, prefetch } = createLazyComponent(
 *   () => import('./HeavyChart'),
 *   { retries: 3, retryDelay: 2000 },
 * );
 *
 * // Prefetch on hover
 * <button onMouseEnter={prefetch}>Show Chart</button>
 *
 * // Render with Suspense
 * <Suspense fallback={<Spinner />}>
 *   <HeavyChart data={data} />
 * </Suspense>
 * ```
 */
export function createLazyComponent<P extends Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentOptions = {},
): LazyComponentResult<P> {
  const { retries = 2, retryDelay = 1500, preload = false } = options;

  const load = (): Promise<{ default: ComponentType<P> }> =>
    importWithRetry(importFn, retries, retryDelay);

  let prefetchPromise: Promise<void> | null = null;

  const Component = React.lazy(load);

  const prefetch = (): Promise<void> => {
    if (!prefetchPromise) {
      prefetchPromise = load().then(() => undefined);
    }
    return prefetchPromise;
  };

  if (preload) {
    prefetch();
  }

  return { Component, prefetch };
}

/**
 * Attempts to import a module with retries on failure.
 * Useful for resilient code-splitting in unstable network conditions.
 */
async function importWithRetry<T>(
  importFn: () => Promise<T>,
  retries: number,
  retryDelay: number,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await importFn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }
  throw lastError;
}

/** Default loading fallback props. */
export interface LoadingFallbackProps {
  /** Text to display while loading. Default: 'Loading…' */
  message?: string;
}

/**
 * Simple loading fallback component for use with Suspense boundaries.
 */
export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = 'Loading…',
}) => {
  return React.createElement(
    'div',
    {
      role: 'status',
      'aria-live': 'polite',
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        color: '#6b7280',
        fontSize: '0.875rem',
      },
    },
    message,
  );
};
LoadingFallback.displayName = 'LoadingFallback';
