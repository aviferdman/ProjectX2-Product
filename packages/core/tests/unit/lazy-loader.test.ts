import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LazyModule, LazyModuleRegistry } from '../../src/cache/lazy-loader.js';

describe('LazyModule', () => {
  it('starts in idle status', () => {
    const lazy = new LazyModule({ loader: async () => 'value' });
    expect(lazy.status).toBe('idle');
    expect(lazy.isLoaded).toBe(false);
    expect(lazy.peek()).toBeUndefined();
  });

  it('loads the module on first get()', async () => {
    const loader = vi.fn(async () => ({ data: 42 }));
    const lazy = new LazyModule({ loader });

    const result = await lazy.get();
    expect(result).toEqual({ data: 42 });
    expect(lazy.status).toBe('loaded');
    expect(lazy.isLoaded).toBe(true);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('returns cached instance on subsequent get() calls', async () => {
    const loader = vi.fn(async () => 'hello');
    const lazy = new LazyModule({ loader });

    await lazy.get();
    await lazy.get();
    await lazy.get();
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent get() calls', async () => {
    const loader = vi.fn(async () => 'value');
    const lazy = new LazyModule({ loader });

    const [r1, r2, r3] = await Promise.all([lazy.get(), lazy.get(), lazy.get()]);
    expect(r1).toBe('value');
    expect(r2).toBe('value');
    expect(r3).toBe('value');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('calls onLoad callback after successful load', async () => {
    const onLoad = vi.fn();
    const lazy = new LazyModule({ loader: async () => 'mod', onLoad });

    await lazy.get();
    expect(onLoad).toHaveBeenCalledWith('mod');
  });

  it('sets error status on failure and calls onError', async () => {
    const onError = vi.fn();
    const lazy = new LazyModule({
      loader: async () => {
        throw new Error('network');
      },
      onError,
    });

    await expect(lazy.get()).rejects.toThrow('network');
    expect(lazy.status).toBe('error');
    expect(lazy.error?.message).toBe('network');
    expect(onError).toHaveBeenCalled();
  });

  describe('retry', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('retries on failure up to the configured count', async () => {
      let attempt = 0;
      const loader = vi.fn(async () => {
        attempt++;
        if (attempt < 3) throw new Error(`fail-${attempt}`);
        return 'success';
      });

      const lazy = new LazyModule({
        loader,
        retries: 2,
        retryDelay: 100,
      });

      const promise = lazy.get();

      // Advance through retry delays
      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(100);

      const result = await promise;
      expect(result).toBe('success');
      expect(loader).toHaveBeenCalledTimes(3);
    });

    it('fails after exhausting all retries', async () => {
      vi.useRealTimers(); // use real timers for this specific test
      const loader = vi.fn(async () => {
        throw new Error('permanent');
      });

      const lazy = new LazyModule({
        loader,
        retries: 1,
        retryDelay: 1,
      });

      await expect(lazy.get()).rejects.toThrow('permanent');
      expect(loader).toHaveBeenCalledTimes(2); // initial + 1 retry
    });
  });

  it('peek() returns the module after loading', async () => {
    const lazy = new LazyModule({ loader: async () => 'data' });
    expect(lazy.peek()).toBeUndefined();
    await lazy.get();
    expect(lazy.peek()).toBe('data');
  });

  it('reset() allows re-loading', async () => {
    let callCount = 0;
    const loader = vi.fn(async () => {
      callCount++;
      return `v${callCount}`;
    });
    const lazy = new LazyModule({ loader });

    expect(await lazy.get()).toBe('v1');
    lazy.reset();
    expect(lazy.status).toBe('idle');
    expect(lazy.peek()).toBeUndefined();
    expect(await lazy.get()).toBe('v2');
    expect(loader).toHaveBeenCalledTimes(2);
  });
});

describe('LazyModuleRegistry', () => {
  it('registers and retrieves modules', async () => {
    const registry = new LazyModuleRegistry();
    registry.register('foo', { loader: async () => ({ value: 'bar' }) });

    const result = await registry.get<{ value: string }>('foo');
    expect(result.value).toBe('bar');
  });

  it('throws when getting an unregistered module', async () => {
    const registry = new LazyModuleRegistry();
    await expect(registry.get('nope')).rejects.toThrow('not registered');
  });

  it('reports module status', async () => {
    const registry = new LazyModuleRegistry();
    registry.register('m', { loader: async () => 'ok' });

    expect(registry.status('m')).toBe('idle');
    await registry.get('m');
    expect(registry.status('m')).toBe('loaded');
  });

  it('has() checks registration', () => {
    const registry = new LazyModuleRegistry();
    registry.register('x', { loader: async () => null });
    expect(registry.has('x')).toBe(true);
    expect(registry.has('y')).toBe(false);
  });

  it('names() lists all registered modules', () => {
    const registry = new LazyModuleRegistry();
    registry.register('a', { loader: async () => null });
    registry.register('b', { loader: async () => null });
    expect(registry.names()).toEqual(['a', 'b']);
  });

  it('reset() resets a specific module', async () => {
    const registry = new LazyModuleRegistry();
    const loader = vi.fn(async () => 'val');
    registry.register('m', { loader });

    await registry.get('m');
    registry.reset('m');
    expect(registry.status('m')).toBe('idle');
  });

  it('reset() without name resets all modules', async () => {
    const registry = new LazyModuleRegistry();
    registry.register('a', { loader: async () => 1 });
    registry.register('b', { loader: async () => 2 });

    await registry.get('a');
    await registry.get('b');
    registry.reset();
    expect(registry.status('a')).toBe('idle');
    expect(registry.status('b')).toBe('idle');
  });

  it('returns undefined status for unregistered module', () => {
    const registry = new LazyModuleRegistry();
    expect(registry.status('ghost')).toBeUndefined();
  });
});
