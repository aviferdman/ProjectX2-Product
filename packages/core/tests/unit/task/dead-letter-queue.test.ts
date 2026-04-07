/**
 * Unit tests for the DeadLetterQueue module.
 *
 * Tests cover:
 * - Construction and configuration
 * - Enqueue, remove, drain operations
 * - Overflow policies (drop-oldest, reject)
 * - Retry logic (success and failure)
 * - Query methods (get, has, filter, oldest, newest, entries, taskIds)
 * - Event emission for all lifecycle events
 * - Serialization via toJSON()
 * - Edge cases (duplicate enqueue, retry non-existent, empty DLQ)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Task } from '../../../src/task/task.js';
import {
  DeadLetterQueue,
  DEFAULT_DLQ_MAX_SIZE,
} from '../../../src/task/dead-letter-queue.js';
import type {
  DeadLetterEntry,
  DeadLetterQueueEventMap,
} from '../../../src/task/dead-letter-queue.js';
import type { TaskRunner } from '../../../src/task/parallel-executor.js';
import type { TaskResult } from '../../../src/types/task.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(id: string, description?: string): Task {
  return new Task({
    id,
    description: description ?? `Task ${id}`,
  });
}

function makeResult(taskId: string, output?: string): TaskResult {
  return { output: output ?? `result-${taskId}`, agentId: 'test-agent', duration: 10 };
}

function successRunner(): TaskRunner {
  return async (task) => makeResult(task.id);
}

function failingRunner(msg: string): TaskRunner {
  return async () => {
    throw new Error(msg);
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeadLetterQueue', () => {
  let dlq: DeadLetterQueue;

  beforeEach(() => {
    dlq = new DeadLetterQueue();
  });

  // -----------------------------------------------------------------------
  // Construction
  // -----------------------------------------------------------------------

  describe('construction', () => {
    it('uses default config when none provided', () => {
      expect(dlq.maxSize).toBe(DEFAULT_DLQ_MAX_SIZE);
      expect(dlq.overflowPolicy).toBe('drop-oldest');
      expect(dlq.size).toBe(0);
      expect(dlq.isEmpty).toBe(true);
      expect(dlq.isFull).toBe(false);
    });

    it('accepts custom config', () => {
      const custom = new DeadLetterQueue({ maxSize: 5, overflowPolicy: 'reject' });
      expect(custom.maxSize).toBe(5);
      expect(custom.overflowPolicy).toBe('reject');
    });

    it('throws if maxSize < 1', () => {
      expect(() => new DeadLetterQueue({ maxSize: 0 })).toThrow(
        'DeadLetterQueue maxSize must be at least 1',
      );
    });
  });

  // -----------------------------------------------------------------------
  // Enqueue
  // -----------------------------------------------------------------------

  describe('enqueue', () => {
    it('adds a task to the queue', () => {
      const task = makeTask('t1');
      const error = new Error('boom');
      const result = dlq.enqueue(task, error, { attempts: 3 });

      expect(result).toBe(true);
      expect(dlq.size).toBe(1);
      expect(dlq.isEmpty).toBe(false);
      expect(dlq.has('t1')).toBe(true);
    });

    it('stores entry details correctly', () => {
      const task = makeTask('t1');
      const error = new Error('task failed');
      const ctx: Record<string, TaskResult> = { dep1: makeResult('dep1') };
      const meta = { source: 'test' };

      dlq.enqueue(task, error, { attempts: 2, context: ctx, metadata: meta });

      const entry = dlq.get('t1');
      expect(entry).toBeDefined();
      expect(entry!.task.id).toBe('t1');
      expect(entry!.error.message).toBe('task failed');
      expect(entry!.attempts).toBe(2);
      expect(entry!.context).toEqual(ctx);
      expect(entry!.metadata).toEqual(meta);
      expect(entry!.enqueuedAt).toBeTruthy();
    });

    it('defaults attempts to 1 when not provided', () => {
      dlq.enqueue(makeTask('t1'), new Error('fail'));
      expect(dlq.get('t1')!.attempts).toBe(1);
    });

    it('updates an existing entry for the same task ID', () => {
      const task = makeTask('t1');
      dlq.enqueue(task, new Error('first'));
      dlq.enqueue(task, new Error('second'), { attempts: 5 });

      expect(dlq.size).toBe(1);
      expect(dlq.get('t1')!.error.message).toBe('second');
      expect(dlq.get('t1')!.attempts).toBe(5);
    });

    it('emits dlq:enqueued event', () => {
      const listener = vi.fn<Parameters<DeadLetterQueueEventMap['dlq:enqueued']>>();
      dlq.on('dlq:enqueued', listener);

      const task = makeTask('t1');
      dlq.enqueue(task, new Error('boom'));

      expect(listener).toHaveBeenCalledOnce();
      const entry = listener.mock.calls[0]![0];
      expect(entry.task.id).toBe('t1');
    });
  });

  // -----------------------------------------------------------------------
  // Overflow policies
  // -----------------------------------------------------------------------

  describe('overflow: drop-oldest', () => {
    it('drops oldest entry when full', () => {
      const small = new DeadLetterQueue({ maxSize: 2, overflowPolicy: 'drop-oldest' });

      small.enqueue(makeTask('t1'), new Error('e1'));
      small.enqueue(makeTask('t2'), new Error('e2'));
      expect(small.size).toBe(2);
      expect(small.isFull).toBe(true);

      const result = small.enqueue(makeTask('t3'), new Error('e3'));
      expect(result).toBe(true);
      expect(small.size).toBe(2);
      expect(small.has('t1')).toBe(false);
      expect(small.has('t2')).toBe(true);
      expect(small.has('t3')).toBe(true);
    });

    it('emits dlq:overflow and dlq:discarded for dropped entry', () => {
      const small = new DeadLetterQueue({ maxSize: 1 });
      const overflowFn = vi.fn<Parameters<DeadLetterQueueEventMap['dlq:overflow']>>();
      const discardFn = vi.fn<Parameters<DeadLetterQueueEventMap['dlq:discarded']>>();
      small.on('dlq:overflow', overflowFn);
      small.on('dlq:discarded', discardFn);

      small.enqueue(makeTask('t1'), new Error('e1'));
      small.enqueue(makeTask('t2'), new Error('e2'));

      expect(overflowFn).toHaveBeenCalledWith('t1');
      expect(discardFn).toHaveBeenCalledWith('t1', 'overflow');
    });
  });

  describe('overflow: reject', () => {
    it('rejects new entry when full', () => {
      const small = new DeadLetterQueue({ maxSize: 1, overflowPolicy: 'reject' });

      small.enqueue(makeTask('t1'), new Error('e1'));
      const result = small.enqueue(makeTask('t2'), new Error('e2'));

      expect(result).toBe(false);
      expect(small.size).toBe(1);
      expect(small.has('t1')).toBe(true);
      expect(small.has('t2')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Remove and Drain
  // -----------------------------------------------------------------------

  describe('remove', () => {
    it('removes an existing entry', () => {
      dlq.enqueue(makeTask('t1'), new Error('e'));
      expect(dlq.remove('t1')).toBe(true);
      expect(dlq.size).toBe(0);
      expect(dlq.has('t1')).toBe(false);
    });

    it('returns false for non-existent entry', () => {
      expect(dlq.remove('nonexistent')).toBe(false);
    });

    it('emits dlq:discarded with reason "manual"', () => {
      const listener = vi.fn<Parameters<DeadLetterQueueEventMap['dlq:discarded']>>();
      dlq.on('dlq:discarded', listener);

      dlq.enqueue(makeTask('t1'), new Error('e'));
      dlq.remove('t1');

      expect(listener).toHaveBeenCalledWith('t1', 'manual');
    });
  });

  describe('drain', () => {
    it('removes all entries and returns count', () => {
      dlq.enqueue(makeTask('t1'), new Error('e1'));
      dlq.enqueue(makeTask('t2'), new Error('e2'));
      dlq.enqueue(makeTask('t3'), new Error('e3'));

      const count = dlq.drain();
      expect(count).toBe(3);
      expect(dlq.size).toBe(0);
      expect(dlq.isEmpty).toBe(true);
    });

    it('returns 0 when empty', () => {
      expect(dlq.drain()).toBe(0);
    });

    it('emits dlq:drained event', () => {
      const listener = vi.fn<Parameters<DeadLetterQueueEventMap['dlq:drained']>>();
      dlq.on('dlq:drained', listener);

      dlq.enqueue(makeTask('t1'), new Error('e'));
      dlq.drain();

      expect(listener).toHaveBeenCalledWith(1);
    });
  });

  // -----------------------------------------------------------------------
  // Retry
  // -----------------------------------------------------------------------

  describe('retry', () => {
    it('succeeds and removes entry from DLQ', async () => {
      const task = makeTask('t1');
      dlq.enqueue(task, new Error('original failure'), { attempts: 2 });

      const result = await dlq.retry('t1', successRunner());

      expect(result.output).toBe('result-t1');
      expect(dlq.has('t1')).toBe(false);
      expect(dlq.size).toBe(0);
    });

    it('emits dlq:retry and dlq:retry:success on success', async () => {
      const retryFn = vi.fn<Parameters<DeadLetterQueueEventMap['dlq:retry']>>();
      const successFn = vi.fn<Parameters<DeadLetterQueueEventMap['dlq:retry:success']>>();
      dlq.on('dlq:retry', retryFn);
      dlq.on('dlq:retry:success', successFn);

      dlq.enqueue(makeTask('t1'), new Error('e'), { attempts: 2 });
      await dlq.retry('t1', successRunner());

      expect(retryFn).toHaveBeenCalledWith('t1', 3);
      expect(successFn).toHaveBeenCalledWith('t1', expect.objectContaining({ output: 'result-t1' }));
    });

    it('fails and updates entry with new error', async () => {
      const task = makeTask('t1');
      dlq.enqueue(task, new Error('original'), { attempts: 1 });

      await expect(dlq.retry('t1', failingRunner('retry failed'))).rejects.toThrow('retry failed');

      expect(dlq.has('t1')).toBe(true);
      const entry = dlq.get('t1')!;
      expect(entry.error.message).toBe('retry failed');
      expect(entry.attempts).toBe(2);
    });

    it('emits dlq:retry and dlq:retry:failure on failure', async () => {
      const retryFn = vi.fn<Parameters<DeadLetterQueueEventMap['dlq:retry']>>();
      const failFn = vi.fn<Parameters<DeadLetterQueueEventMap['dlq:retry:failure']>>();
      dlq.on('dlq:retry', retryFn);
      dlq.on('dlq:retry:failure', failFn);

      dlq.enqueue(makeTask('t1'), new Error('e'), { attempts: 1 });
      await expect(dlq.retry('t1', failingRunner('retry boom'))).rejects.toThrow();

      expect(retryFn).toHaveBeenCalledWith('t1', 2);
      expect(failFn).toHaveBeenCalledWith('t1', expect.objectContaining({ message: 'retry boom' }));
    });

    it('throws when task not found in DLQ', async () => {
      await expect(dlq.retry('nonexistent', successRunner())).rejects.toThrow(
        'Task "nonexistent" not found in dead letter queue',
      );
    });

    it('uses entry context when no override provided', async () => {
      const ctx = { dep: makeResult('dep') };
      const capturedContext = vi.fn<[Task, Readonly<Record<string, TaskResult>>], Promise<TaskResult>>();
      capturedContext.mockResolvedValue(makeResult('t1'));

      dlq.enqueue(makeTask('t1'), new Error('e'), { context: ctx });
      await dlq.retry('t1', capturedContext as unknown as TaskRunner);

      expect(capturedContext).toHaveBeenCalledWith(expect.anything(), ctx);
    });

    it('uses override context when provided', async () => {
      const entryCtx = { dep: makeResult('dep') };
      const overrideCtx = { override: makeResult('override') };
      const capturedContext = vi.fn<[Task, Readonly<Record<string, TaskResult>>], Promise<TaskResult>>();
      capturedContext.mockResolvedValue(makeResult('t1'));

      dlq.enqueue(makeTask('t1'), new Error('e'), { context: entryCtx });
      await dlq.retry('t1', capturedContext as unknown as TaskRunner, overrideCtx);

      expect(capturedContext).toHaveBeenCalledWith(expect.anything(), overrideCtx);
    });

    it('handles non-Error throws from runner', async () => {
      const badRunner: TaskRunner = async () => {
        throw 'string error';  // eslint-disable-line no-throw-literal
      };

      dlq.enqueue(makeTask('t1'), new Error('original'));
      await expect(dlq.retry('t1', badRunner)).rejects.toThrow('string error');

      const entry = dlq.get('t1')!;
      expect(entry.error).toBeInstanceOf(Error);
      expect(entry.error.message).toBe('string error');
    });
  });

  // -----------------------------------------------------------------------
  // Query methods
  // -----------------------------------------------------------------------

  describe('query methods', () => {
    beforeEach(() => {
      dlq.enqueue(makeTask('t1', 'First task'), new Error('e1'), { attempts: 1 });
      dlq.enqueue(makeTask('t2', 'Second task'), new Error('e2'), { attempts: 3 });
      dlq.enqueue(makeTask('t3', 'Third task'), new Error('e3'), { attempts: 2 });
    });

    it('entries() returns all entries in insertion order', () => {
      const entries = dlq.entries();
      expect(entries).toHaveLength(3);
      expect(entries[0]!.task.id).toBe('t1');
      expect(entries[1]!.task.id).toBe('t2');
      expect(entries[2]!.task.id).toBe('t3');
    });

    it('taskIds() returns IDs in insertion order', () => {
      expect(dlq.taskIds()).toEqual(['t1', 't2', 't3']);
    });

    it('filter() returns matching entries', () => {
      const highAttempt = dlq.filter((e) => e.attempts >= 2);
      expect(highAttempt).toHaveLength(2);
      expect(highAttempt.map((e) => e.task.id)).toEqual(['t2', 't3']);
    });

    it('oldest() returns the first inserted entry', () => {
      expect(dlq.oldest()!.task.id).toBe('t1');
    });

    it('newest() returns the last inserted entry', () => {
      expect(dlq.newest()!.task.id).toBe('t3');
    });

    it('oldest() and newest() return undefined when empty', () => {
      const empty = new DeadLetterQueue();
      expect(empty.oldest()).toBeUndefined();
      expect(empty.newest()).toBeUndefined();
    });

    it('get() returns undefined for non-existent task', () => {
      expect(dlq.get('nonexistent')).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Serialization
  // -----------------------------------------------------------------------

  describe('toJSON', () => {
    it('serializes entries to plain objects', () => {
      dlq.enqueue(makeTask('t1', 'First'), new Error('fail1'), {
        attempts: 2,
        metadata: { source: 'test' },
      });
      dlq.enqueue(makeTask('t2', 'Second'), new Error('fail2'));

      const json = dlq.toJSON();
      expect(json).toHaveLength(2);

      expect(json[0]).toEqual(expect.objectContaining({
        taskId: 't1',
        description: 'First',
        error: 'fail1',
        attempts: 2,
        metadata: { source: 'test' },
      }));
      expect(json[0]!.enqueuedAt).toBeTruthy();

      expect(json[1]).toEqual(expect.objectContaining({
        taskId: 't2',
        description: 'Second',
        error: 'fail2',
        attempts: 1,
      }));
      expect(json[1]!.metadata).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Event system
  // -----------------------------------------------------------------------

  describe('event system', () => {
    it('supports on/off for listeners', () => {
      const listener = vi.fn();
      dlq.on('dlq:enqueued', listener);
      dlq.enqueue(makeTask('t1'), new Error('e'));
      expect(listener).toHaveBeenCalledOnce();

      dlq.off('dlq:enqueued', listener);
      dlq.enqueue(makeTask('t2'), new Error('e'));
      expect(listener).toHaveBeenCalledOnce(); // not called again
    });

    it('supports once for listeners', () => {
      const listener = vi.fn();
      dlq.once('dlq:enqueued', listener);

      dlq.enqueue(makeTask('t1'), new Error('e'));
      dlq.enqueue(makeTask('t2'), new Error('e'));

      expect(listener).toHaveBeenCalledOnce();
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  describe('edge cases', () => {
    it('enqueuing same task at capacity does not overflow', () => {
      const small = new DeadLetterQueue({ maxSize: 1, overflowPolicy: 'reject' });

      small.enqueue(makeTask('t1'), new Error('first'));
      // Re-enqueue the same ID — should update, not be rejected
      const result = small.enqueue(makeTask('t1'), new Error('updated'));

      expect(result).toBe(true);
      expect(small.size).toBe(1);
      expect(small.get('t1')!.error.message).toBe('updated');
    });

    it('drain followed by enqueue works correctly', () => {
      dlq.enqueue(makeTask('t1'), new Error('e'));
      dlq.drain();
      dlq.enqueue(makeTask('t2'), new Error('e'));

      expect(dlq.size).toBe(1);
      expect(dlq.has('t2')).toBe(true);
      expect(dlq.taskIds()).toEqual(['t2']);
    });

    it('insertion order is maintained after removals', () => {
      dlq.enqueue(makeTask('t1'), new Error('e'));
      dlq.enqueue(makeTask('t2'), new Error('e'));
      dlq.enqueue(makeTask('t3'), new Error('e'));

      dlq.remove('t2');
      expect(dlq.taskIds()).toEqual(['t1', 't3']);
      expect(dlq.oldest()!.task.id).toBe('t1');
      expect(dlq.newest()!.task.id).toBe('t3');
    });
  });
});
