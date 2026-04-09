/**
 * Memoization utilities for caching expensive function results.
 *
 * @packageDocumentation
 */

import { LRUCache } from './lru-cache.js';

/** Configuration for the memoize wrapper. */
export interface MemoizeConfig {
  /** Maximum number of results to cache. Default: 100. */
  maxSize?: number;
  /** TTL in milliseconds for cached results. 0 means no expiry. Default: 0. */
  ttl?: number;
  /** Custom key resolver. Receives the same arguments as the memoized function. */
  keyResolver?: (...args: unknown[]) => string;
}

/** Default maximum size for memoized result caches. */
export const DEFAULT_MEMOIZE_MAX_SIZE = 100;

/**
 * Wraps a function with LRU-backed memoization.
 *
 * By default, the cache key is derived from `JSON.stringify(args)`.
 * Use `keyResolver` for custom key logic (e.g., when arguments contain
 * non-serializable objects).
 *
 * @example
 * ```ts
 * const expensiveFn = (n: number) => { ... };
 * const memoized = memoize(expensiveFn, { maxSize: 50, ttl: 60_000 });
 * memoized(42); // computed
 * memoized(42); // cached
 * memoized.cache.stats(); // { hits: 1, misses: 1, ... }
 * memoized.clear(); // flush cache
 * ```
 */
export function memoize<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  config: MemoizeConfig = {},
): MemoizedFunction<TArgs, TReturn> {
  const { maxSize = DEFAULT_MEMOIZE_MAX_SIZE, ttl = 0, keyResolver } = config;

  const cache = new LRUCache<TReturn>({ maxSize, defaultTTL: ttl });

  const resolveKey = keyResolver ?? ((...args: unknown[]) => JSON.stringify(args));

  const memoized = (...args: TArgs): TReturn => {
    const key = resolveKey(...args);
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };

  memoized.cache = cache;
  memoized.clear = () => cache.clear();

  return memoized as MemoizedFunction<TArgs, TReturn>;
}

/** A memoized function with cache access and clear method. */
export interface MemoizedFunction<TArgs extends unknown[], TReturn> {
  (...args: TArgs): TReturn;
  /** Direct access to the underlying LRU cache. */
  cache: LRUCache<TReturn>;
  /** Clear all cached results. */
  clear: () => void;
}

/**
 * Wraps an async function with LRU-backed memoization.
 *
 * Deduplicates concurrent calls with the same key — only one in-flight
 * promise is created per unique key.
 *
 * @example
 * ```ts
 * const fetchUser = memoizeAsync(
 *   async (id: string) => api.getUser(id),
 *   { maxSize: 200, ttl: 30_000 },
 * );
 * ```
 */
export function memoizeAsync<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  config: MemoizeConfig = {},
): MemoizedAsyncFunction<TArgs, TReturn> {
  const { maxSize = DEFAULT_MEMOIZE_MAX_SIZE, ttl = 0, keyResolver } = config;

  const cache = new LRUCache<TReturn>({ maxSize, defaultTTL: ttl });
  const inflight = new Map<string, Promise<TReturn>>();

  const resolveKey = keyResolver ?? ((...args: unknown[]) => JSON.stringify(args));

  const memoized = async (...args: TArgs): Promise<TReturn> => {
    const key = resolveKey(...args);
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Deduplicate concurrent calls
    const existing = inflight.get(key);
    if (existing) {
      return existing;
    }

    const promise = fn(...args).then(
      (result) => {
        cache.set(key, result);
        inflight.delete(key);
        return result;
      },
      (err) => {
        inflight.delete(key);
        throw err;
      },
    );

    inflight.set(key, promise);
    return promise;
  };

  memoized.cache = cache;
  memoized.clear = () => {
    cache.clear();
    inflight.clear();
  };

  return memoized as MemoizedAsyncFunction<TArgs, TReturn>;
}

/** A memoized async function with cache access and clear method. */
export interface MemoizedAsyncFunction<TArgs extends unknown[], TReturn> {
  (...args: TArgs): Promise<TReturn>;
  cache: LRUCache<TReturn>;
  clear: () => void;
}
