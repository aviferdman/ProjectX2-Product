/**
 * Unit tests for DeadLetterQueue integration with TaskExecutionWrapper.
 *
 * Tests cover:
 * - DLQ auto-enqueue after retry exhaustion
 * - DLQ enqueue on non-retryable error
 * - DLQ enqueue on timeout (last attempt)
 * - DLQ not populated on success
 * - DLQ not used when not configured
 * - DLQ entry contains correct attempt count and context
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Task } from '../../../src/task/task.js';
import { TaskExecutionWrapper } from '../../../src/task/task-execution-wrapper.js';
import { DeadLetterQueue } from '../../../src/task/dead-letter-queue.js';
import { TaskExecutionError } from '../../../src/errors/index.js';
import type { TaskRunner } from '../../../src/task/parallel-executor.js';
import type { TaskResult } from '../../../src/types/task.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(
  id: string,
  opts: { timeout?: number; retries?: number; agentId?: string } = {},
): Task {
  return new Task({
    id,
    description: `Task ${id}`,
    timeout: opts.timeout,
    retries: opts.retries,
    agentId: opts.agentId,
  });
}

function makeResult(taskId: string, output = `result-${taskId}`): TaskResult {
  return { output, agentId: 'test-agent', duration: 10 };
}

function immediateRunner(): TaskRunner {
  return async (task) => makeResult(task.id);
}

function failingRunner(errorMsg: string): TaskRunner {
  return async (task) => {
    throw new Error(`${errorMsg}: ${task.id}`);
  };
}

function failThenSucceedRunner(failCount: number): TaskRunner {
  let calls = 0;
  return async (task) => {
    calls++;
    if (calls <= failCount) {
      throw new Error(`Attempt ${String(calls)} failed for ${task.id}`);
    }
    return makeResult(task.id, `success-on-attempt-${String(calls)}`);
  };
}

const noopSleep = async (): Promise<void> => {};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TaskExecutionWrapper — DeadLetterQueue integration', () => {
  let dlq: DeadLetterQueue;
  let wrapper: TaskExecutionWrapper;

  beforeEach(() => {
    dlq = new DeadLetterQueue();
    wrapper = new TaskExecutionWrapper({
      defaultRetries: 2,
      retryJitter: 0,
      sleep: noopSleep,
      random: () => 0.5,
      deadLetterQueue: dlq,
    });
  });

  describe('auto-enqueue on retry exhaustion', () => {
    it('should enqueue task into DLQ after all retries are exhausted', async () => {
      const task = makeTask('t1', { retries: 2 });
      const runner = wrapper.wrap(failingRunner('boom'));

      await expect(runner(task, {})).rejects.toThrow(TaskExecutionError);

      expect(dlq.size).toBe(1);
      expect(dlq.has('t1')).toBe(true);

      const entry = dlq.get('t1')!;
      expect(entry.task.id).toBe('t1');
      expect(entry.attempts).toBe(3); // 1 initial + 2 retries
      expect(entry.error.message).toContain('boom');
    });

    it('should enqueue task with no retries configured', async () => {
      const noRetryWrapper = new TaskExecutionWrapper({
        defaultRetries: 0,
        sleep: noopSleep,
        deadLetterQueue: dlq,
      });

      const task = makeTask('t1');
      const runner = noRetryWrapper.wrap(failingRunner('instant fail'));

      await expect(runner(task, {})).rejects.toThrow(TaskExecutionError);

      expect(dlq.size).toBe(1);
      expect(dlq.get('t1')!.attempts).toBe(1);
    });

    it('should include context in DLQ entry', async () => {
      const task = makeTask('t1', { retries: 1 });
      const ctx: Record<string, TaskResult> = {
        dep1: makeResult('dep1', 'dependency output'),
      };

      const runner = wrapper.wrap(failingRunner('ctx fail'));
      await expect(runner(task, ctx)).rejects.toThrow();

      const entry = dlq.get('t1')!;
      expect(entry.context).toBeDefined();
      expect(entry.context!['dep1']).toEqual(ctx['dep1']);
    });
  });

  describe('non-retryable errors', () => {
    it('should enqueue to DLQ on non-retryable error', async () => {
      const nonRetryWrapper = new TaskExecutionWrapper({
        defaultRetries: 3,
        sleep: noopSleep,
        isRetryable: () => false,
        deadLetterQueue: dlq,
      });

      const task = makeTask('t1', { retries: 3 });
      const runner = nonRetryWrapper.wrap(failingRunner('non-retryable'));

      await expect(runner(task, {})).rejects.toThrow('non-retryable');

      expect(dlq.size).toBe(1);
      expect(dlq.get('t1')!.attempts).toBe(1); // Only 1 attempt before non-retryable
    });
  });

  describe('timeout on last attempt', () => {
    it('should enqueue to DLQ when last attempt times out', async () => {
      const timeoutWrapper = new TaskExecutionWrapper({
        defaultTimeoutMs: 10,
        defaultRetries: 0,
        sleep: noopSleep,
        deadLetterQueue: dlq,
      });

      const slowRunner: TaskRunner = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return makeResult('t1');
      };

      const task = makeTask('t1', { timeout: 10 });
      const runner = timeoutWrapper.wrap(slowRunner);

      await expect(runner(task, {})).rejects.toThrow();

      expect(dlq.size).toBe(1);
      expect(dlq.has('t1')).toBe(true);
    });
  });

  describe('successful execution', () => {
    it('should not enqueue to DLQ when task succeeds', async () => {
      const task = makeTask('t1', { retries: 2 });
      const runner = wrapper.wrap(immediateRunner());

      const result = await runner(task, {});

      expect(result.output).toBe('result-t1');
      expect(dlq.size).toBe(0);
    });

    it('should not enqueue to DLQ when task succeeds after retries', async () => {
      const task = makeTask('t1', { retries: 2 });
      const runner = wrapper.wrap(failThenSucceedRunner(1));

      const result = await runner(task, {});

      expect(result.output).toContain('success-on-attempt');
      expect(dlq.size).toBe(0);
    });
  });

  describe('no DLQ configured', () => {
    it('should not throw when DLQ is not configured', async () => {
      const noDlqWrapper = new TaskExecutionWrapper({
        defaultRetries: 1,
        sleep: noopSleep,
      });

      const task = makeTask('t1', { retries: 1 });
      const runner = noDlqWrapper.wrap(failingRunner('no dlq'));

      await expect(runner(task, {})).rejects.toThrow(TaskExecutionError);
      // No DLQ to check — just verifying no error from missing DLQ
    });
  });

  describe('DLQ entry details', () => {
    it('should use task retries + 1 as attempt count', async () => {
      const task = makeTask('t1', { retries: 3 });
      const customWrapper = new TaskExecutionWrapper({
        defaultRetries: 0,
        sleep: noopSleep,
        retryJitter: 0,
        deadLetterQueue: dlq,
      });

      const runner = customWrapper.wrap(failingRunner('test'));
      await expect(runner(task, {})).rejects.toThrow();

      // Task has retries: 3, so 4 attempts total
      expect(dlq.get('t1')!.attempts).toBe(4);
    });

    it('should store the final error in the DLQ entry', async () => {
      let callCount = 0;
      const escalatingRunner: TaskRunner = async () => {
        callCount++;
        throw new Error(`error-${String(callCount)}`);
      };

      const task = makeTask('t1', { retries: 2 });
      const runner = wrapper.wrap(escalatingRunner);

      await expect(runner(task, {})).rejects.toThrow();

      const entry = dlq.get('t1')!;
      // The DLQ should capture the last error seen
      expect(entry.error.message).toContain('error-3');
    });
  });
});
