/**
 * Cache & performance utilities for the Crewspace framework.
 *
 * Provides LRU caching, memoization, and lazy loading primitives to
 * reduce bundle size impact and improve runtime performance.
 *
 * @packageDocumentation
 */

// LRU Cache
export { LRUCache } from './lru-cache.js';
export type { LRUCacheConfig, CacheStats } from './lru-cache.js';

// Memoization
export { memoize, memoizeAsync, DEFAULT_MEMOIZE_MAX_SIZE } from './memoize.js';
export type { MemoizeConfig, MemoizedFunction, MemoizedAsyncFunction } from './memoize.js';

// Lazy Loading
export { LazyModule, LazyModuleRegistry } from './lazy-loader.js';
export type { LazyModuleConfig, LazyModuleStatus } from './lazy-loader.js';
