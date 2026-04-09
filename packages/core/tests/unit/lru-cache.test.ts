import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LRUCache } from '../../src/cache/lru-cache.js';

describe('LRUCache', () => {
  describe('constructor', () => {
    it('throws when maxSize is less than 1', () => {
      expect(() => new LRUCache({ maxSize: 0 })).toThrow('maxSize must be at least 1');
    });

    it('creates a cache with the given maxSize', () => {
      const cache = new LRUCache({ maxSize: 10 });
      expect(cache.size).toBe(0);
      expect(cache.stats().maxSize).toBe(10);
    });
  });

  describe('get / set', () => {
    it('stores and retrieves a value', () => {
      const cache = new LRUCache<string>({ maxSize: 5 });
      cache.set('a', 'hello');
      expect(cache.get('a')).toBe('hello');
    });

    it('returns undefined for missing keys', () => {
      const cache = new LRUCache<string>({ maxSize: 5 });
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('overwrites an existing key', () => {
      const cache = new LRUCache<number>({ maxSize: 5 });
      cache.set('x', 1);
      cache.set('x', 2);
      expect(cache.get('x')).toBe(2);
      expect(cache.size).toBe(1);
    });
  });

  describe('LRU eviction', () => {
    it('evicts the least recently used entry when over capacity', () => {
      const cache = new LRUCache<number>({ maxSize: 3 });
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4); // evicts 'a'
      expect(cache.has('a')).toBe(false);
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('promotes accessed entries so they are not evicted', () => {
      const cache = new LRUCache<number>({ maxSize: 3 });
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.get('a'); // promote 'a'
      cache.set('d', 4); // evicts 'b' (now the LRU)
      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });

    it('calls onEvict callback when evicting', () => {
      const evicted: Array<[string, number]> = [];
      const cache = new LRUCache<number>({
        maxSize: 2,
        onEvict: (key, value) => evicted.push([key, value as number]),
      });
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3); // evicts 'a'
      expect(evicted).toEqual([['a', 1]]);
    });
  });

  describe('TTL expiration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('expires entries after the default TTL', () => {
      const cache = new LRUCache<string>({ maxSize: 10, defaultTTL: 1000 });
      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');

      vi.advanceTimersByTime(1001);
      expect(cache.get('key')).toBeUndefined();
    });

    it('allows per-entry TTL override', () => {
      const cache = new LRUCache<string>({ maxSize: 10, defaultTTL: 5000 });
      cache.set('short', 'value', 500);
      cache.set('long', 'value');

      vi.advanceTimersByTime(600);
      expect(cache.get('short')).toBeUndefined();
      expect(cache.get('long')).toBe('value');
    });

    it('has() returns false for expired entries', () => {
      const cache = new LRUCache<string>({ maxSize: 10, defaultTTL: 100 });
      cache.set('key', 'val');
      vi.advanceTimersByTime(200);
      expect(cache.has('key')).toBe(false);
    });
  });

  describe('delete', () => {
    it('removes an entry and returns true', () => {
      const cache = new LRUCache<number>({ maxSize: 5 });
      cache.set('a', 1);
      expect(cache.delete('a')).toBe(true);
      expect(cache.get('a')).toBeUndefined();
    });

    it('returns false when key does not exist', () => {
      const cache = new LRUCache<number>({ maxSize: 5 });
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      const cache = new LRUCache<number>({ maxSize: 10 });
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.get('a')).toBeUndefined();
    });
  });

  describe('keys', () => {
    it('returns keys in MRU-first order', () => {
      const cache = new LRUCache<number>({ maxSize: 5 });
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.get('a'); // promote
      expect(cache.keys()).toEqual(['a', 'c', 'b']);
    });
  });

  describe('stats', () => {
    it('tracks hits, misses, and evictions', () => {
      const cache = new LRUCache<number>({ maxSize: 2 });
      cache.set('a', 1);
      cache.get('a'); // hit
      cache.get('b'); // miss
      cache.set('b', 2);
      cache.set('c', 3); // evict 'a'

      const s = cache.stats();
      expect(s.hits).toBe(1);
      expect(s.misses).toBe(1);
      expect(s.evictions).toBe(1);
      expect(s.hitRate).toBe(0.5);
      expect(s.size).toBe(2);
    });

    it('resets stats', () => {
      const cache = new LRUCache<number>({ maxSize: 2 });
      cache.set('a', 1);
      cache.get('a');
      cache.get('miss');
      cache.resetStats();
      const s = cache.stats();
      expect(s.hits).toBe(0);
      expect(s.misses).toBe(0);
      expect(s.evictions).toBe(0);
      expect(s.hitRate).toBe(0);
    });
  });

  describe('prune', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('removes all expired entries and returns count', () => {
      const cache = new LRUCache<string>({ maxSize: 10 });
      cache.set('a', 'v', 100);
      cache.set('b', 'v', 100);
      cache.set('c', 'v', 5000);

      vi.advanceTimersByTime(200);
      const pruned = cache.prune();
      expect(pruned).toBe(2);
      expect(cache.size).toBe(1);
      expect(cache.has('c')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('works with maxSize of 1', () => {
      const cache = new LRUCache<number>({ maxSize: 1 });
      cache.set('a', 1);
      cache.set('b', 2);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.size).toBe(1);
    });

    it('handles rapid set/get cycles', () => {
      const cache = new LRUCache<number>({ maxSize: 100 });
      for (let i = 0; i < 1000; i++) {
        cache.set(`key-${i}`, i);
      }
      expect(cache.size).toBe(100);
      // Most recent 100 should be present
      expect(cache.get('key-999')).toBe(999);
      expect(cache.get('key-900')).toBe(900);
      expect(cache.get('key-0')).toBeUndefined();
    });
  });
});
