import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { memoize, memoizeAsync } from '../../src/cache/memoize.js';

describe('memoize', () => {
  it('caches the result of a function call', () => {
    const fn = vi.fn((n: number) => n * 2);
    const memo = memoize(fn);

    expect(memo(5)).toBe(10);
    expect(memo(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('distinguishes different arguments', () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const memo = memoize(fn);

    expect(memo(1, 2)).toBe(3);
    expect(memo(3, 4)).toBe(7);
    expect(memo(1, 2)).toBe(3);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('uses a custom key resolver', () => {
    const fn = vi.fn((obj: { id: number }) => obj.id * 10);
    const memo = memoize(fn, {
      keyResolver: (obj: unknown) => String((obj as { id: number }).id),
    });

    expect(memo({ id: 1 })).toBe(10);
    expect(memo({ id: 1 })).toBe(10); // same key, cached
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('respects maxSize and evicts oldest entries', () => {
    const fn = vi.fn((n: number) => n);
    const memo = memoize(fn, { maxSize: 2 });

    memo(1);
    memo(2);
    memo(3); // evicts cached result for 1

    memo(1); // recomputed
    expect(fn).toHaveBeenCalledTimes(4);
  });

  describe('with TTL', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('expires cached results after TTL', () => {
      const fn = vi.fn((n: number) => n * 3);
      const memo = memoize(fn, { ttl: 500 });

      expect(memo(2)).toBe(6);
      expect(memo(2)).toBe(6);
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(600);
      expect(memo(2)).toBe(6); // recomputed
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  it('exposes cache stats', () => {
    const fn = vi.fn((n: number) => n);
    const memo = memoize(fn);
    memo(1);
    memo(1);
    memo(2);

    const stats = memo.cache.stats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(2);
  });

  it('clears the cache', () => {
    const fn = vi.fn((n: number) => n);
    const memo = memoize(fn);
    memo(1);
    memo.clear();
    memo(1);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('memoizeAsync', () => {
  it('caches the result of an async function', async () => {
    const fn = vi.fn(async (n: number) => n * 2);
    const memo = memoizeAsync(fn);

    expect(await memo(5)).toBe(10);
    expect(await memo(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent calls with the same key', async () => {
    let resolvePromise!: (val: number) => void;
    const fn = vi.fn(
      () =>
        new Promise<number>((resolve) => {
          resolvePromise = resolve;
        }),
    );
    const memo = memoizeAsync(fn);

    const p1 = memo(1);
    const p2 = memo(1);

    resolvePromise(42);
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe(42);
    expect(r2).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not cache rejected promises', async () => {
    let callCount = 0;
    const fn = vi.fn(async () => {
      callCount++;
      if (callCount === 1) throw new Error('fail');
      return 'ok';
    });
    const memo = memoizeAsync(fn);

    await expect(memo()).rejects.toThrow('fail');
    expect(await memo()).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('clears the cache and inflight promises', async () => {
    const fn = vi.fn(async (n: number) => n);
    const memo = memoizeAsync(fn);

    await memo(1);
    memo.clear();
    await memo(1);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
