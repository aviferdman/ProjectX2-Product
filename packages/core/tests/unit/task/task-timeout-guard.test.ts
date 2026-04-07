/**
 * Unit tests for TaskTimeoutGuard.
 *
 * Tests cover:
 * - TaskTimeoutGuard: execute(), abort, dispose, events, active tracking
 * - withTimeoutGuard(): standalone convenience utility
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

import { TaskTimeoutError } from '../../../src/errors/index.js';
import {
  TaskTimeoutGuard,
  withTimeoutGuard,
} from '../../../src/task/task-timeout-guard.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve after `ms` milliseconds, checking abort signal. */
function abortableDelay<T>(ms: number, value: T): (signal: AbortSignal) => Promise<T> {
  return (signal: AbortSignal) =>
    new Promise<T>((resolve, reject) => {
      if (signal.aborted) {
        reject(signal.reason instanceof Error ? signal.reason : new Error('Aborted'));
        return;
      }

      const timer = setTimeout(() => resolve(value), ms);

      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(signal.reason instanceof Error ? signal.reason : new Error('Aborted'));
        },
        { once: true },
      );
    });
}

/** Immediately resolving function. */
function immediate<T>(value: T): (signal: AbortSignal) => Promise<T> {
  return async (_signal: AbortSignal) => value;
}

/** Immediately rejecting function. */
function failing(message: string): (signal: AbortSignal) => Promise<never> {
  return async (_signal: AbortSignal) => {
    throw new Error(message);
  };
}

// ---------------------------------------------------------------------------
// Tests: TaskTimeoutGuard constructor
// ---------------------------------------------------------------------------

describe('TaskTimeoutGuard', () => {
  let guard: TaskTimeoutGuard;

  afterEach(() => {
    guard?.dispose();
  });

  describe('constructor', () => {
    it('should use default config when none provided', () => {
      guard = new TaskTimeoutGuard();
      expect(guard.defaultTimeoutMs).toBe(0);
      expect(guard.maxTimeoutMs).toBe(600_000);
      expect(guard.activeCount).toBe(0);
      expect(guard.isDisposed).toBe(false);
    });

    it('should accept custom config', () => {
      guard = new TaskTimeoutGuard({
        defaultTimeoutMs: 5_000,
        maxTimeoutMs: 60_000,
      });
      expect(guard.defaultTimeoutMs).toBe(5_000);
      expect(guard.maxTimeoutMs).toBe(60_000);
    });
  });

  // -------------------------------------------------------------------------
  // execute() — basic behavior
  // -------------------------------------------------------------------------

  describe('execute()', () => {
    it('should return result when function completes within timeout', async () => {
      guard = new TaskTimeoutGuard();
      const result = await guard.execute(immediate('hello'), 1_000, 'test-1');
      expect(result).toBe('hello');
    });

    it('should throw TaskTimeoutError when function exceeds timeout', async () => {
      guard = new TaskTimeoutGuard();
      await expect(
        guard.execute(abortableDelay(500, 'late'), 50, 'slow-task'),
      ).rejects.toThrow(TaskTimeoutError);
    });

    it('should include taskId and timeoutMs in TaskTimeoutError', async () => {
      guard = new TaskTimeoutGuard();
      try {
        await guard.execute(abortableDelay(500, 'x'), 50, 'my-task');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TaskTimeoutError);
        const err = error as TaskTimeoutError;
        expect(err.taskId).toBe('my-task');
        expect(err.timeoutMs).toBe(50);
      }
    });

    it('should abort the signal when timeout fires', async () => {
      guard = new TaskTimeoutGuard();
      let signalAborted = false;

      const fn = (signal: AbortSignal) =>
        new Promise<string>((resolve) => {
          const timer = setTimeout(() => resolve('done'), 500);
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            signalAborted = true;
          });
        });

      await expect(guard.execute(fn, 50, 'abort-test')).rejects.toThrow(TaskTimeoutError);

      // Give the abort handler a tick to fire
      await new Promise((r) => setTimeout(r, 10));
      expect(signalAborted).toBe(true);
    });

    it('should pass through non-timeout errors', async () => {
      guard = new TaskTimeoutGuard();
      await expect(
        guard.execute(failing('boom'), 5_000, 'err-task'),
      ).rejects.toThrow('boom');
    });

    it('should use defaultTimeoutMs when timeoutMs is not provided', async () => {
      guard = new TaskTimeoutGuard({ defaultTimeoutMs: 50 });
      await expect(
        guard.execute(abortableDelay(500, 'x'), undefined, 'default-timeout'),
      ).rejects.toThrow(TaskTimeoutError);
    });

    it('should run without timeout when effectiveTimeout is 0', async () => {
      guard = new TaskTimeoutGuard();
      const result = await guard.execute(immediate('no-timeout'), 0, 'zero');
      expect(result).toBe('no-timeout');
    });

    it('should auto-generate taskId when not provided', async () => {
      guard = new TaskTimeoutGuard();
      const result = await guard.execute(immediate('auto'), 1_000);
      expect(result).toBe('auto');
    });

    it('should throw when timeout exceeds maxTimeoutMs', async () => {
      guard = new TaskTimeoutGuard({ maxTimeoutMs: 1_000 });
      await expect(
        guard.execute(immediate('x'), 5_000, 'over-max'),
      ).rejects.toThrow(/exceeds maximum/);
    });

    it('should throw when guard is disposed', async () => {
      guard = new TaskTimeoutGuard();
      guard.dispose();
      await expect(
        guard.execute(immediate('x'), 1_000, 'after-dispose'),
      ).rejects.toThrow('TaskTimeoutGuard has been disposed');
    });

    it('should handle non-Error throw from function', async () => {
      guard = new TaskTimeoutGuard();
      const fn = async (_signal: AbortSignal) => {
        throw 'string-error'; // eslint-disable-line no-throw-literal
      };
      await expect(guard.execute(fn, 1_000, 'non-error')).rejects.toThrow('string-error');
    });
  });

  // -------------------------------------------------------------------------
  // Active guard tracking
  // -------------------------------------------------------------------------

  describe('active guard tracking', () => {
    it('should track active guards during execution', async () => {
      guard = new TaskTimeoutGuard();
      let activeCountDuring = 0;
      let activeGuardsDuring: ReturnType<typeof guard.getActiveGuards> = [];

      const fn = async (signal: AbortSignal) => {
        activeCountDuring = guard.activeCount;
        activeGuardsDuring = guard.getActiveGuards();
        return 'tracked';
      };

      await guard.execute(fn, 5_000, 'tracked-task');

      expect(activeCountDuring).toBe(1);
      expect(activeGuardsDuring).toHaveLength(1);
      expect(activeGuardsDuring[0]?.taskId).toBe('tracked-task');
      expect(activeGuardsDuring[0]?.timeoutMs).toBe(5_000);
      expect(activeGuardsDuring[0]?.elapsedMs).toBeGreaterThanOrEqual(0);

      // After completion, should be cleared
      expect(guard.activeCount).toBe(0);
    });

    it('should clear active guard on error', async () => {
      guard = new TaskTimeoutGuard();
      try {
        await guard.execute(failing('oops'), 5_000, 'err-guard');
      } catch {
        // expected
      }
      expect(guard.activeCount).toBe(0);
    });

    it('should clear active guard on timeout', async () => {
      guard = new TaskTimeoutGuard();
      try {
        await guard.execute(abortableDelay(500, 'x'), 50, 'timeout-guard');
      } catch {
        // expected
      }
      expect(guard.activeCount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // abort() / abortAll()
  // -------------------------------------------------------------------------

  describe('abort()', () => {
    it('should abort a specific active guard', async () => {
      guard = new TaskTimeoutGuard();
      let abortedBySignal = false;

      const fn = (signal: AbortSignal) =>
        new Promise<string>((resolve, reject) => {
          const timer = setTimeout(() => resolve('done'), 5_000);
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            abortedBySignal = true;
            reject(new Error('Aborted'));
          });
        });

      const promise = guard.execute(fn, 10_000, 'abort-me');

      // Let the function start
      await new Promise((r) => setTimeout(r, 10));

      expect(guard.activeCount).toBe(1);
      const aborted = guard.abort('abort-me', 'manual abort');
      expect(aborted).toBe(true);

      await expect(promise).rejects.toThrow();
      expect(abortedBySignal).toBe(true);
      expect(guard.activeCount).toBe(0);
    });

    it('should return false for unknown taskId', () => {
      guard = new TaskTimeoutGuard();
      expect(guard.abort('nonexistent')).toBe(false);
    });
  });

  describe('abortAll()', () => {
    it('should abort all active guards', async () => {
      guard = new TaskTimeoutGuard();
      const abortedSignals: boolean[] = [];

      const makeFn = (index: number) => (signal: AbortSignal) =>
        new Promise<string>((resolve, reject) => {
          const timer = setTimeout(() => resolve(`done-${String(index)}`), 5_000);
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            abortedSignals[index] = true;
            reject(new Error('Aborted'));
          });
        });

      const p1 = guard.execute(makeFn(0), 10_000, 'task-a');
      const p2 = guard.execute(makeFn(1), 10_000, 'task-b');

      await new Promise((r) => setTimeout(r, 10));
      expect(guard.activeCount).toBe(2);

      const count = guard.abortAll('shutdown');
      expect(count).toBe(2);
      expect(guard.activeCount).toBe(0);

      await expect(p1).rejects.toThrow();
      await expect(p2).rejects.toThrow();
      expect(abortedSignals[0]).toBe(true);
      expect(abortedSignals[1]).toBe(true);
    });

    it('should return 0 when no guards are active', () => {
      guard = new TaskTimeoutGuard();
      expect(guard.abortAll()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // dispose()
  // -------------------------------------------------------------------------

  describe('dispose()', () => {
    it('should prevent new executions after disposal', async () => {
      guard = new TaskTimeoutGuard();
      guard.dispose();
      expect(guard.isDisposed).toBe(true);
      await expect(guard.execute(immediate('x'), 100)).rejects.toThrow(/disposed/);
    });

    it('should be idempotent', () => {
      guard = new TaskTimeoutGuard();
      guard.dispose();
      guard.dispose(); // should not throw
      expect(guard.isDisposed).toBe(true);
    });

    it('should abort active guards on dispose', async () => {
      guard = new TaskTimeoutGuard();
      let aborted = false;

      const fn = (signal: AbortSignal) =>
        new Promise<string>((resolve, reject) => {
          const timer = setTimeout(() => resolve('done'), 5_000);
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            aborted = true;
            reject(new Error('Disposed'));
          });
        });

      const promise = guard.execute(fn, 10_000, 'dispose-task');
      await new Promise((r) => setTimeout(r, 10));

      guard.dispose();

      await expect(promise).rejects.toThrow();
      expect(aborted).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  describe('events', () => {
    it('should emit timeout:started and timeout:completed on success', async () => {
      guard = new TaskTimeoutGuard();
      const started = vi.fn();
      const completed = vi.fn();

      guard.on('timeout:started', started);
      guard.on('timeout:completed', completed);

      await guard.execute(immediate('ok'), 1_000, 'event-task');

      expect(started).toHaveBeenCalledWith('event-task', 1_000);
      expect(completed).toHaveBeenCalledWith('event-task', expect.any(Number));
    });

    it('should emit timeout:expired on timeout', async () => {
      guard = new TaskTimeoutGuard();
      const expired = vi.fn();
      guard.on('timeout:expired', expired);

      await expect(
        guard.execute(abortableDelay(500, 'x'), 50, 'expire-task'),
      ).rejects.toThrow(TaskTimeoutError);

      expect(expired).toHaveBeenCalledWith('expire-task', 50);
    });

    it('should emit timeout:error on non-timeout error', async () => {
      guard = new TaskTimeoutGuard();
      const errorHandler = vi.fn();
      guard.on('timeout:error', errorHandler);

      await expect(
        guard.execute(failing('oops'), 1_000, 'error-event-task'),
      ).rejects.toThrow('oops');

      expect(errorHandler).toHaveBeenCalledWith('error-event-task', expect.any(Error));
    });

    it('should emit timeout:aborted when manually aborted', async () => {
      guard = new TaskTimeoutGuard();
      const abortHandler = vi.fn();
      guard.on('timeout:aborted', abortHandler);

      const fn = (signal: AbortSignal) =>
        new Promise<string>((resolve, reject) => {
          const timer = setTimeout(() => resolve('done'), 5_000);
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new Error('Aborted'));
          });
        });

      const promise = guard.execute(fn, 10_000, 'manual-abort');
      await new Promise((r) => setTimeout(r, 10));
      guard.abort('manual-abort', 'user cancelled');

      await expect(promise).rejects.toThrow();
      expect(abortHandler).toHaveBeenCalledWith('manual-abort', 'user cancelled');
    });

    it('should support on/off/once event methods', async () => {
      guard = new TaskTimeoutGuard();
      const handler = vi.fn();

      guard.on('timeout:started', handler);
      await guard.execute(immediate('a'), 100, 'ev-1');
      expect(handler).toHaveBeenCalledTimes(1);

      guard.off('timeout:started', handler);
      await guard.execute(immediate('b'), 100, 'ev-2');
      expect(handler).toHaveBeenCalledTimes(1); // not called again

      const onceHandler = vi.fn();
      guard.once('timeout:started', onceHandler);
      await guard.execute(immediate('c'), 100, 'ev-3');
      await guard.execute(immediate('d'), 100, 'ev-4');
      expect(onceHandler).toHaveBeenCalledTimes(1); // only once
    });
  });

  // -------------------------------------------------------------------------
  // Concurrent executions
  // -------------------------------------------------------------------------

  describe('concurrent executions', () => {
    it('should handle multiple concurrent guarded tasks', async () => {
      guard = new TaskTimeoutGuard();

      const [r1, r2, r3] = await Promise.all([
        guard.execute(immediate('a'), 1_000, 'concurrent-1'),
        guard.execute(immediate('b'), 1_000, 'concurrent-2'),
        guard.execute(immediate('c'), 1_000, 'concurrent-3'),
      ]);

      expect(r1).toBe('a');
      expect(r2).toBe('b');
      expect(r3).toBe('c');
      expect(guard.activeCount).toBe(0);
    });

    it('should independently timeout concurrent tasks', async () => {
      guard = new TaskTimeoutGuard();

      const results = await Promise.allSettled([
        guard.execute(immediate('fast'), 1_000, 'fast-task'),
        guard.execute(abortableDelay(500, 'slow'), 50, 'slow-task'),
      ]);

      expect(results[0]?.status).toBe('fulfilled');
      expect(results[1]?.status).toBe('rejected');
    });
  });
});

// ---------------------------------------------------------------------------
// withTimeoutGuard (standalone)
// ---------------------------------------------------------------------------

describe('withTimeoutGuard', () => {
  it('should return result when function completes within timeout', async () => {
    const result = await withTimeoutGuard(immediate('standalone'), 1_000, 'wt-1');
    expect(result).toBe('standalone');
  });

  it('should throw TaskTimeoutError when function exceeds timeout', async () => {
    await expect(
      withTimeoutGuard(abortableDelay(500, 'x'), 50, 'wt-slow'),
    ).rejects.toThrow(TaskTimeoutError);
  });

  it('should pass through errors from function', async () => {
    await expect(
      withTimeoutGuard(failing('standalone-err'), 1_000, 'wt-err'),
    ).rejects.toThrow('standalone-err');
  });

  it('should abort the signal on timeout', async () => {
    let wasAborted = false;

    const fn = (signal: AbortSignal) =>
      new Promise<string>((resolve) => {
        const timer = setTimeout(() => resolve('done'), 5_000);
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          wasAborted = true;
        });
      });

    await expect(withTimeoutGuard(fn, 50, 'wt-abort')).rejects.toThrow(TaskTimeoutError);
    await new Promise((r) => setTimeout(r, 10));
    expect(wasAborted).toBe(true);
  });

  it('should work without taskId', async () => {
    const result = await withTimeoutGuard(immediate('no-id'), 1_000);
    expect(result).toBe('no-id');
  });
});
