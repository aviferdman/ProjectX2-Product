/**
 * Error Handling Scenarios — cross-component integration tests for error flows.
 *
 * Validates that errors propagate correctly between:
 * - TaskExecutionWrapper (retry/timeout) → DeadLetterQueue
 * - GracefulDegradationHandler → error classification
 * - Error chain preservation across layers
 * - ParallelExecutor error policies with typed errors
 * - TaskTimeoutGuard cooperative cancellation
 *
 * @packageDocumentation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Task } from '../../src/task/task.js';
import { TaskExecutionWrapper, executeWithRetry, executeWithTimeout } from '../../src/task/task-execution-wrapper.js';
import { DeadLetterQueue } from '../../src/task/dead-letter-queue.js';
import { TaskTimeoutGuard, withTimeoutGuard } from '../../src/task/task-timeout-guard.js';
import { ParallelExecutor } from '../../src/task/parallel-executor.js';
import type { TaskRunner } from '../../src/task/parallel-executor.js';
import {
  GracefulDegradationHandler,
  DefaultFailureClassifier,
  FailureSeverity,
} from '../../src/errors/graceful-degradation.js';
import {
  CrewspaceError,
  ErrorCode,
  TaskExecutionError,
  TaskTimeoutError,
  TaskConfigError,
  ToolExecutionError,
  ToolTimeoutError,
  LLMRateLimitError,
  LLMAuthenticationError,
  LLMStreamError,
  LLMContextLengthError,
  AgentConfigError,
  AgentExecutionError,
  MemoryQueryError,
  AggregateCrewspaceError,
  normalizeError,
  getErrorChain,
  formatErrorForLog,
  isCrewspaceError,
  hasErrorCode,
} from '../../src/errors/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTask(overrides: Partial<{ id: string; description: string; retries: number; timeout: number }> = {}): Task {
  return new Task({
    id: overrides.id ?? 'test-task',
    description: overrides.description ?? 'Test task',
    ...(overrides.retries !== undefined ? { retries: overrides.retries } : {}),
    ...(overrides.timeout !== undefined && overrides.timeout > 0 ? { timeout: overrides.timeout } : {}),
  });
}

const noopSleep = async () => {};

// ---------------------------------------------------------------------------
// 1. Retry Exhaustion → Dead Letter Queue Integration
// ---------------------------------------------------------------------------

describe('Retry exhaustion → DLQ integration', () => {
  let dlq: DeadLetterQueue;

  beforeEach(() => {
    dlq = new DeadLetterQueue({ maxSize: 10 });
  });

  it('should enqueue a task to DLQ after retry exhaustion', async () => {
    const task = createTask({ id: 'flaky-task', retries: 2 });
    const error = new Error('persistent failure');

    const runner: TaskRunner = vi.fn().mockRejectedValue(error);

    const wrapper = new TaskExecutionWrapper({
      defaultRetries: 2,
      sleep: noopSleep,
      random: () => 0.5,
    });

    const wrappedRunner = wrapper.wrap(runner);

    let caughtError: Error | undefined;
    try {
      await wrappedRunner(task, {});
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError).toBeInstanceOf(TaskExecutionError);

    // Enqueue to DLQ after retry exhaustion
    const enqueued = dlq.enqueue(task, caughtError!, { attempts: 3 });
    expect(enqueued).toBe(true);
    expect(dlq.size).toBe(1);

    const entry = dlq.get('flaky-task');
    expect(entry).toBeDefined();
    expect(entry!.attempts).toBe(3);
    expect(entry!.error.message).toContain('Failed after 3 attempt(s)');
  });

  it('should preserve the original cause through retry → DLQ chain', async () => {
    const rootCause = new LLMRateLimitError('openai', 'Rate limited', 5000);
    const task = createTask({ id: 'rate-limited-task' });
    const runner: TaskRunner = vi.fn().mockRejectedValue(rootCause);

    const wrapper = new TaskExecutionWrapper({
      defaultRetries: 1,
      sleep: noopSleep,
      random: () => 0.5,
    });

    let exhaustionError: Error | undefined;
    try {
      await wrapper.wrap(runner)(task, {});
    } catch (err) {
      exhaustionError = err as Error;
    }

    expect(exhaustionError).toBeInstanceOf(TaskExecutionError);
    expect((exhaustionError as TaskExecutionError).cause).toBe(rootCause);

    dlq.enqueue(task, exhaustionError!, { attempts: 2 });
    const entry = dlq.get('rate-limited-task');

    // The full error chain is preserved in the DLQ entry
    const chain = getErrorChain(entry!.error);
    expect(chain).toHaveLength(2);
    expect(chain[0]).toBeInstanceOf(TaskExecutionError);
    expect(chain[1]).toBeInstanceOf(LLMRateLimitError);
  });

  it('should successfully retry a DLQ entry after transient failure resolves', async () => {
    const task = createTask({ id: 'recoverable-task' });
    const error = new ToolTimeoutError('search', 5000);

    dlq.enqueue(task, error, { attempts: 3 });

    const successRunner: TaskRunner = vi.fn().mockResolvedValue({
      output: 'recovered result',
    });

    const result = await dlq.retry('recoverable-task', successRunner);
    expect(result).toEqual({ output: 'recovered result' });
    expect(dlq.has('recoverable-task')).toBe(false);
  });

  it('should update DLQ entry when retry from DLQ also fails', async () => {
    const task = createTask({ id: 'stubborn-task' });
    const originalError = new Error('original failure');

    dlq.enqueue(task, originalError, { attempts: 3 });

    const retryError = new Error('still failing');
    const failingRunner: TaskRunner = vi.fn().mockRejectedValue(retryError);

    await expect(dlq.retry('stubborn-task', failingRunner)).rejects.toThrow('still failing');

    const entry = dlq.get('stubborn-task');
    expect(entry!.attempts).toBe(4);
    expect(entry!.error.message).toBe('still failing');
  });

  it('should emit events through the full retry → DLQ lifecycle', async () => {
    const task = createTask({ id: 'monitored-task', retries: 1 });
    const error = new Error('fail');
    const runner: TaskRunner = vi.fn().mockRejectedValue(error);

    const retryEvents: string[] = [];
    task.on('task:retry', () => retryEvents.push('retry'));

    const wrapper = new TaskExecutionWrapper({
      defaultRetries: 1,
      sleep: noopSleep,
      random: () => 0.5,
    });

    let exhaustionError: Error | undefined;
    try {
      await wrapper.wrap(runner)(task, {});
    } catch (err) {
      exhaustionError = err as Error;
    }

    expect(retryEvents).toHaveLength(1);

    const dlqEvents: string[] = [];
    dlq.on('dlq:enqueued', () => dlqEvents.push('enqueued'));
    dlq.on('dlq:retry', () => dlqEvents.push('retry'));
    dlq.on('dlq:retry:failure', () => dlqEvents.push('retry:failure'));

    dlq.enqueue(task, exhaustionError!, { attempts: 2 });
    expect(dlqEvents).toContain('enqueued');

    await expect(dlq.retry('monitored-task', runner)).rejects.toThrow();
    expect(dlqEvents).toContain('retry');
    expect(dlqEvents).toContain('retry:failure');
  });
});

// ---------------------------------------------------------------------------
// 2. Timeout → Retry Interaction
// ---------------------------------------------------------------------------

describe('Timeout → retry interaction', () => {
  it('should retry after a timeout on first attempt and eventually succeed', async () => {
    const task = createTask({ id: 'timeout-then-ok', timeout: 50, retries: 2 });
    let attempt = 0;

    const runner: TaskRunner = vi.fn().mockImplementation(async () => {
      attempt++;
      if (attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { output: 'too late' };
      }
      return { output: 'success on retry' };
    });

    const wrapper = new TaskExecutionWrapper({
      sleep: noopSleep,
      random: () => 0.5,
    });

    const result = await wrapper.wrap(runner)(task, {});
    expect(result).toEqual({ output: 'success on retry' });
    expect(runner).toHaveBeenCalledTimes(2);
  });

  it('should throw TaskTimeoutError when all retries also timeout', async () => {
    const task = createTask({ id: 'always-slow', timeout: 30, retries: 1 });

    const runner: TaskRunner = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return { output: 'never' };
    });

    const wrapper = new TaskExecutionWrapper({
      sleep: noopSleep,
      random: () => 0.5,
    });

    await expect(wrapper.wrap(runner)(task, {})).rejects.toThrow(TaskTimeoutError);
    expect(runner).toHaveBeenCalledTimes(2);
  });

  it('should emit both timeout and retry events', async () => {
    const task = createTask({ id: 'event-task', timeout: 30, retries: 1 });
    let attempt = 0;

    const runner: TaskRunner = vi.fn().mockImplementation(async () => {
      attempt++;
      if (attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { output: 'too late' };
      }
      return { output: 'ok' };
    });

    const timeoutEvents: number[] = [];
    const retryEvents: number[] = [];
    task.on('task:timeout', (_id, ms) => timeoutEvents.push(ms));
    task.on('task:retry', (_id, attemptNum) => retryEvents.push(attemptNum));

    const wrapper = new TaskExecutionWrapper({
      sleep: noopSleep,
      random: () => 0.5,
    });

    await wrapper.wrap(runner)(task, {});

    expect(timeoutEvents).toHaveLength(1);
    expect(timeoutEvents[0]).toBe(30);
    expect(retryEvents).toHaveLength(1);
    expect(retryEvents[0]).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 3. Non-retryable Error Detection
// ---------------------------------------------------------------------------

describe('Non-retryable error detection across components', () => {
  it('should not retry LLMAuthenticationError (non-retryable)', async () => {
    const task = createTask({ id: 'auth-fail' });
    const authError = new LLMAuthenticationError('openai', 'Invalid API key');

    const runner: TaskRunner = vi.fn().mockRejectedValue(authError);

    const wrapper = new TaskExecutionWrapper({
      defaultRetries: 3,
      sleep: noopSleep,
      random: () => 0.5,
      isRetryable: (err) => {
        if (err instanceof CrewspaceError) return err.isRetryable;
        return false;
      },
    });

    await expect(wrapper.wrap(runner)(task, {})).rejects.toThrow(LLMAuthenticationError);
    expect(runner).toHaveBeenCalledTimes(1);
  });

  it('should retry LLMRateLimitError (retryable) but not TaskConfigError', async () => {
    const rateLimitError = new LLMRateLimitError('openai', 'Rate limited', 1000);
    const configError = new TaskConfigError('Invalid config', 'bad-task');

    expect(rateLimitError.isRetryable).toBe(true);
    expect(configError.isRetryable).toBe(false);

    const classifier = new DefaultFailureClassifier();
    expect(classifier.classify(rateLimitError)).toBe(FailureSeverity.NON_CRITICAL);
    expect(classifier.classify(configError)).toBe(FailureSeverity.CRITICAL);
  });

  it('should classify all error types consistently', () => {
    const classifier = new DefaultFailureClassifier();

    const retryableErrors = [
      new LLMRateLimitError('openai', 'rate limited', 1000),
      new LLMStreamError('openai', 'stream broke', 5, 'partial'),
      new ToolExecutionError('search', 'API down'),
      new ToolTimeoutError('search', 3000),
      new TaskTimeoutError('task-1', 5000),
      new MemoryQueryError('bad query'),
    ];

    const nonRetryableErrors = [
      new LLMAuthenticationError('openai', 'bad key'),
      new TaskConfigError('bad config'),
      new AgentConfigError('bad agent config'),
    ];

    for (const err of retryableErrors) {
      expect(classifier.classify(err)).toBe(FailureSeverity.NON_CRITICAL);
    }

    for (const err of nonRetryableErrors) {
      expect(classifier.classify(err)).toBe(FailureSeverity.CRITICAL);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Graceful Degradation with Retry and DLQ
// ---------------------------------------------------------------------------

describe('Graceful degradation with error handling components', () => {
  let handler: GracefulDegradationHandler;

  beforeEach(() => {
    handler = new GracefulDegradationHandler();
  });

  it('should degrade on tool errors but throw on config errors', async () => {
    const toolResult = await handler.execute(
      () => { throw new ToolExecutionError('search', 'API timeout'); },
      { fallback: 'cached results' },
    );
    expect(toolResult.degraded).toBe(true);
    expect(toolResult.value).toBe('cached results');

    await expect(
      handler.execute(
        () => { throw new TaskConfigError('Invalid config'); },
        { fallback: 'default' },
      ),
    ).rejects.toThrow(TaskConfigError);
  });

  it('should degrade on LLM rate limit errors with dynamic fallback', async () => {
    const result = await handler.execute<string>(
      () => { throw new LLMRateLimitError('openai', 'Too many requests', 5000); },
      {
        fallback: (err) => {
          const rateLimitErr = err as LLMRateLimitError;
          return `Rate limited, retry after ${String(rateLimitErr.retryAfterMs)}ms`;
        },
      },
    );

    expect(result.degraded).toBe(true);
    expect(result.value).toContain('5000ms');
  });

  it('should track degradation history across multiple failures', async () => {
    const errors = [
      new ToolExecutionError('search', 'error 1'),
      new ToolTimeoutError('fetch', 3000),
      new LLMStreamError('openai', 'stream broke', 5, 'partial'),
    ];

    for (const err of errors) {
      await handler.execute(
        () => { throw err; },
        {
          fallback: 'default',
          context: { operationId: err.message },
        },
      );
    }

    expect(handler.degradationCount).toBe(3);
    expect(handler.history).toHaveLength(3);
    expect(handler.history[0]!.severity).toBe(FailureSeverity.NON_CRITICAL);
  });

  it('should preserve degradation count when critical errors are thrown', async () => {
    await handler.execute(
      () => { throw new ToolExecutionError('tool', 'error'); },
      { fallback: 'fb' },
    );
    expect(handler.degradationCount).toBe(1);

    try {
      await handler.execute(
        () => { throw new LLMAuthenticationError('openai', 'Bad key'); },
        { fallback: 'fb' },
      );
    } catch {
      // expected
    }

    // Critical error should not be tracked in degradation history
    expect(handler.degradationCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 5. Error Chain Preservation Across Layers
// ---------------------------------------------------------------------------

describe('Error chain preservation', () => {
  it('should preserve cause chain through wrapper → execution error', async () => {
    const rootCause = new LLMStreamError('anthropic', 'connection reset', 3, 'partial data');
    const agentError = new AgentExecutionError('researcher', 'LLM failed', rootCause);

    const task = createTask({ id: 'chained-error-task' });
    const runner: TaskRunner = vi.fn().mockRejectedValue(agentError);

    const wrapper = new TaskExecutionWrapper({
      defaultRetries: 1,
      sleep: noopSleep,
      random: () => 0.5,
    });

    try {
      await wrapper.wrap(runner)(task, {});
    } catch (err) {
      const error = err as TaskExecutionError;
      expect(error).toBeInstanceOf(TaskExecutionError);

      const chain = getErrorChain(error);
      expect(chain).toHaveLength(3);
      expect(chain[0]).toBeInstanceOf(TaskExecutionError);
      expect(chain[1]).toBeInstanceOf(AgentExecutionError);
      expect(chain[2]).toBeInstanceOf(LLMStreamError);
    }
  });

  it('should serialize deeply nested error chains to JSON', () => {
    const root = new LLMContextLengthError('openai', 'too long', 10000, 8192);
    const agent = new AgentExecutionError('analyst', 'LLM context exceeded', root);
    const task = new TaskExecutionError('analyze', 'Agent failed', 'analyst', agent);

    const json = task.toJSON();
    expect(json.name).toBe('TaskExecutionError');
    expect(json.cause).toBeDefined();

    const agentJson = json.cause as { name: string; cause?: { name: string } };
    expect(agentJson.name).toBe('AgentExecutionError');
    expect(agentJson.cause).toBeDefined();
    expect(agentJson.cause!.name).toBe('LLMContextLengthError');
  });

  it('should format deep error chains for logging', () => {
    const root = new ToolTimeoutError('web-search', 5000);
    const exec = new TaskExecutionError('research', 'Tool failed', 'researcher', root);

    const formatted = formatErrorForLog(exec);
    expect(formatted.causeChain).toHaveLength(2);
    expect(formatted.causeChain[0]).toContain('research');
    expect(formatted.causeChain[1]).toContain('web-search');
    expect(formatted.code).toBe(ErrorCode.TASK_EXECUTION);
    expect(formatted.isRetryable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. TaskTimeoutGuard Cooperative Cancellation
// ---------------------------------------------------------------------------

describe('TaskTimeoutGuard cooperative cancellation', () => {
  it('should abort signal when timeout fires', async () => {
    const guard = new TaskTimeoutGuard({ defaultTimeoutMs: 50 });
    let signalAborted = false;

    try {
      await guard.execute(async (signal) => {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, 500);
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            signalAborted = true;
            reject(new Error('Aborted'));
          });
        });
        return 'never';
      }, 50, 'cooperative-task');
    } catch (err) {
      expect(err).toBeInstanceOf(TaskTimeoutError);
    }

    // Give microtask queue time to process
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(signalAborted).toBe(true);

    guard.dispose();
  });

  it('should manually abort a specific task by ID', async () => {
    const guard = new TaskTimeoutGuard({ defaultTimeoutMs: 5000 });
    const events: string[] = [];
    guard.on('timeout:aborted', (taskId) => events.push(`aborted:${taskId}`));

    const taskPromise = guard.execute(async (signal) => {
      return new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => resolve('done'), 3000);
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('Manual abort'));
        });
      });
    }, 5000, 'abortable-task');

    // Abort after a short delay
    await new Promise((resolve) => setTimeout(resolve, 20));
    const aborted = guard.abort('abortable-task', 'User cancelled');
    expect(aborted).toBe(true);

    await expect(taskPromise).rejects.toThrow();
    expect(events).toContain('aborted:abortable-task');

    guard.dispose();
  });

  it('should handle multiple concurrent guarded tasks independently', async () => {
    const guard = new TaskTimeoutGuard({ maxTimeoutMs: 10000 });
    const results: string[] = [];

    const fast = guard.execute(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 'fast';
    }, 5000, 'fast-task');

    const slow = guard.execute(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 'slow';
    }, 5000, 'slow-task');

    const [fastResult, slowResult] = await Promise.all([fast, slow]);
    results.push(fastResult, slowResult);

    expect(results).toContain('fast');
    expect(results).toContain('slow');
    expect(guard.activeCount).toBe(0);

    guard.dispose();
  });

  it('should reject execution after disposal', async () => {
    const guard = new TaskTimeoutGuard();
    guard.dispose();

    await expect(
      guard.execute(async () => 'value', 1000, 'disposed-task'),
    ).rejects.toThrow('disposed');
  });

  it('withTimeoutGuard should throw TaskTimeoutError on timeout', async () => {
    await expect(
      withTimeoutGuard(
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return 'too slow';
        },
        30,
        'one-shot-task',
      ),
    ).rejects.toThrow(TaskTimeoutError);
  });
});

// ---------------------------------------------------------------------------
// 7. Parallel Executor Error Policies with Typed Errors
// ---------------------------------------------------------------------------

describe('Parallel executor error policies with typed errors', () => {
  it('should stop on first TaskExecutionError with fail-fast policy', async () => {
    const tasks = [
      createTask({ id: 'task-a' }),
      createTask({ id: 'task-b' }),
    ];

    const error = new TaskExecutionError('task-a', 'LLM failed');
    const runner: TaskRunner = vi.fn().mockImplementation(async (task: Task) => {
      if (task.id === 'task-a') throw error;
      return { output: `result-${task.id}` };
    });

    const executor = new ParallelExecutor({
      maxConcurrency: 1,
      errorPolicy: 'fail-fast',
    });

    await expect(executor.execute(tasks, runner)).rejects.toThrow(TaskExecutionError);
  });

  it('should continue after errors with continue policy and report all failures', async () => {
    const tasks = [
      createTask({ id: 'ok-task' }),
      createTask({ id: 'fail-task-1' }),
      createTask({ id: 'fail-task-2' }),
    ];

    const runner: TaskRunner = vi.fn().mockImplementation(async (task: Task) => {
      if (task.id === 'fail-task-1') throw new ToolTimeoutError('search', 3000);
      if (task.id === 'fail-task-2') throw new LLMRateLimitError('openai', 'limited', 1000);
      return { output: 'ok' };
    });

    const executor = new ParallelExecutor({
      maxConcurrency: 10,
      errorPolicy: 'continue',
    });

    const result = await executor.execute(tasks, runner);
    expect(result.success).toBe(false);
    expect(result.errors.size).toBe(2);
    expect(result.results.has('ok-task')).toBe(true);
    expect(result.errors.has('fail-task-1')).toBe(true);
    expect(result.errors.has('fail-task-2')).toBe(true);
  });

  it('should skip dependent tasks when dependency fails in continue mode', async () => {
    const parentTask = createTask({ id: 'parent' });
    const childTask = new Task({
      id: 'child',
      description: 'Depends on parent',
      dependencies: ['parent'],
    });

    const runner: TaskRunner = vi.fn().mockImplementation(async (task: Task) => {
      if (task.id === 'parent') throw new Error('parent failed');
      return { output: 'child done' };
    });

    const skippedTasks: string[] = [];
    const executor = new ParallelExecutor({
      maxConcurrency: 10,
      errorPolicy: 'continue',
    });
    executor.on('task:skipped', (taskId) => skippedTasks.push(taskId));

    const result = await executor.execute([parentTask, childTask], runner);
    expect(result.success).toBe(false);
    expect(skippedTasks).toContain('child');
    expect(result.errors.has('parent')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8. AggregateError Scenarios
// ---------------------------------------------------------------------------

describe('AggregateCrewspaceError scenarios', () => {
  it('should aggregate multiple typed errors from parallel failures', () => {
    const errors: Error[] = [
      new ToolTimeoutError('search', 5000),
      new LLMRateLimitError('openai', 'Rate limited', 2000),
      new TaskExecutionError('task-1', 'Failed'),
    ];

    const aggregate = new AggregateCrewspaceError('Parallel execution failed', errors);

    expect(aggregate.errors).toHaveLength(3);
    expect(aggregate.message).toContain('3 errors');
    expect(aggregate.code).toBe(ErrorCode.UNKNOWN);
    expect(aggregate).toBeInstanceOf(CrewspaceError);

    const json = aggregate.toJSON();
    expect(json.details['errorCount']).toBe(3);
    const serializedErrors = json.details['errors'] as unknown[];
    expect(serializedErrors).toHaveLength(3);
  });

  it('should correctly identify retryable vs non-retryable errors in aggregate', () => {
    const errors: Error[] = [
      new LLMRateLimitError('openai', 'limited', 1000),
      new LLMAuthenticationError('openai', 'bad key'),
      new ToolTimeoutError('search', 3000),
    ];

    const aggregate = new AggregateCrewspaceError('Mixed failures', errors);
    const retryableCount = aggregate.errors.filter(
      (e) => e instanceof CrewspaceError && e.isRetryable,
    ).length;
    const nonRetryableCount = aggregate.errors.filter(
      (e) => e instanceof CrewspaceError && !e.isRetryable,
    ).length;

    expect(retryableCount).toBe(2);
    expect(nonRetryableCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 9. Error Normalization and Type Guards
// ---------------------------------------------------------------------------

describe('Error normalization in error handling flows', () => {
  it('should normalize non-Error throws to Error instances', () => {
    const cases: [unknown, string][] = [
      ['string error', 'string error'],
      [42, '42'],
      [null, 'null'],
      [undefined, 'undefined'],
      [{ custom: 'object' }, '[object Object]'],
    ];

    for (const [input, expectedMessage] of cases) {
      const normalized = normalizeError(input);
      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe(expectedMessage);
    }
  });

  it('should preserve CrewspaceError subclasses through normalization', () => {
    const errors = [
      new TaskExecutionError('t1', 'failed'),
      new LLMRateLimitError('openai', 'limited', 1000),
      new ToolExecutionError('search', 'error'),
    ];

    for (const err of errors) {
      const normalized = normalizeError(err);
      expect(normalized).toBe(err);
      expect(isCrewspaceError(normalized)).toBe(true);
    }
  });

  it('should correctly identify error codes with type guards', () => {
    const taskErr = new TaskExecutionError('t1', 'failed');
    const toolErr = new ToolTimeoutError('search', 3000);
    const llmErr = new LLMRateLimitError('openai', 'limited', 1000);

    expect(hasErrorCode(taskErr, ErrorCode.TASK_EXECUTION)).toBe(true);
    expect(hasErrorCode(taskErr, ErrorCode.TOOL_TIMEOUT)).toBe(false);

    expect(hasErrorCode(toolErr, ErrorCode.TOOL_TIMEOUT)).toBe(true);
    expect(hasErrorCode(llmErr, ErrorCode.LLM_RATE_LIMIT)).toBe(true);

    // Plain Error has no error code
    expect(hasErrorCode(new Error('plain'), ErrorCode.UNKNOWN)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 10. DLQ Overflow During Error Storm
// ---------------------------------------------------------------------------

describe('DLQ overflow during error storm', () => {
  it('should drop oldest entries when drop-oldest policy is active', () => {
    const dlq = new DeadLetterQueue({ maxSize: 3, overflowPolicy: 'drop-oldest' });
    const overflowEvents: string[] = [];
    dlq.on('dlq:overflow', (taskId) => overflowEvents.push(taskId));

    for (let i = 0; i < 5; i++) {
      const task = createTask({ id: `task-${String(i)}` });
      dlq.enqueue(task, new Error(`Error ${String(i)}`));
    }

    expect(dlq.size).toBe(3);
    expect(dlq.has('task-0')).toBe(false);
    expect(dlq.has('task-1')).toBe(false);
    expect(dlq.has('task-2')).toBe(true);
    expect(dlq.has('task-3')).toBe(true);
    expect(dlq.has('task-4')).toBe(true);
    expect(overflowEvents).toEqual(['task-0', 'task-1']);
  });

  it('should reject new entries when reject policy is active', () => {
    const dlq = new DeadLetterQueue({ maxSize: 2, overflowPolicy: 'reject' });

    const task1 = createTask({ id: 'task-1' });
    const task2 = createTask({ id: 'task-2' });
    const task3 = createTask({ id: 'task-3' });

    expect(dlq.enqueue(task1, new Error('e1'))).toBe(true);
    expect(dlq.enqueue(task2, new Error('e2'))).toBe(true);
    expect(dlq.enqueue(task3, new Error('e3'))).toBe(false);

    expect(dlq.size).toBe(2);
    expect(dlq.has('task-3')).toBe(false);
  });

  it('should handle enqueue-drain-enqueue cycles', () => {
    const dlq = new DeadLetterQueue({ maxSize: 2 });

    dlq.enqueue(createTask({ id: 'a' }), new Error('e1'));
    dlq.enqueue(createTask({ id: 'b' }), new Error('e2'));
    expect(dlq.size).toBe(2);

    const drained = dlq.drain();
    expect(drained).toBe(2);
    expect(dlq.isEmpty).toBe(true);

    dlq.enqueue(createTask({ id: 'c' }), new Error('e3'));
    expect(dlq.size).toBe(1);
    expect(dlq.has('c')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 11. Standalone executeWithTimeout / executeWithRetry
// ---------------------------------------------------------------------------

describe('Standalone executeWithTimeout', () => {
  it('should throw TaskTimeoutError with correct details when timed out', async () => {
    const task = createTask({ id: 'standalone-timeout' });
    const runner: TaskRunner = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return { output: 'too late' };
    });

    try {
      await executeWithTimeout(runner, task, {}, 30);
      expect.unreachable('Should have thrown');
    } catch (err) {
      const error = err as TaskTimeoutError;
      expect(error).toBeInstanceOf(TaskTimeoutError);
      expect(error.taskId).toBe('standalone-timeout');
      expect(error.timeoutMs).toBe(30);
      expect(error.isRetryable).toBe(true);
    }
  });

  it('should pass through runner errors without timeout wrapping', async () => {
    const task = createTask({ id: 'runner-error-task' });
    const llmError = new LLMAuthenticationError('openai', 'Invalid key');
    const runner: TaskRunner = vi.fn().mockRejectedValue(llmError);

    try {
      await executeWithTimeout(runner, task, {}, 5000);
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBe(llmError);
      expect(err).toBeInstanceOf(LLMAuthenticationError);
    }
  });

  it('should skip timeout when timeoutMs is 0', async () => {
    const task = createTask({ id: 'no-timeout-task' });
    const runner: TaskRunner = vi.fn().mockResolvedValue({ output: 'done' });

    const result = await executeWithTimeout(runner, task, {}, 0);
    expect(result).toEqual({ output: 'done' });
  });
});

describe('Standalone executeWithRetry', () => {
  it('should retry and succeed after transient failure', async () => {
    const task = createTask({ id: 'retry-ok' });
    let calls = 0;

    const runner: TaskRunner = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls < 3) throw new Error('transient');
      return { output: 'success' };
    });

    const result = await executeWithRetry(runner, task, {}, 3, {
      sleep: noopSleep,
      random: () => 0.5,
    });

    expect(result).toEqual({ output: 'success' });
    expect(calls).toBe(3);
  });

  it('should throw TaskExecutionError after exhausting all retries', async () => {
    const task = createTask({ id: 'always-fail' });
    const runner: TaskRunner = vi.fn().mockRejectedValue(new Error('persistent'));

    try {
      await executeWithRetry(runner, task, {}, 2, {
        sleep: noopSleep,
        random: () => 0.5,
      });
      expect.unreachable('Should have thrown');
    } catch (err) {
      const error = err as TaskExecutionError;
      expect(error).toBeInstanceOf(TaskExecutionError);
      expect(error.message).toContain('Failed after 3 attempt(s)');
      expect(error.taskId).toBe('always-fail');
    }
  });

  it('should immediately throw non-retryable errors without retrying', async () => {
    const task = createTask({ id: 'non-retryable' });
    const configError = new TaskConfigError('Invalid configuration');
    const runner: TaskRunner = vi.fn().mockRejectedValue(configError);

    await expect(
      executeWithRetry(runner, task, {}, 3, {
        sleep: noopSleep,
        random: () => 0.5,
        isRetryable: (err) => {
          if (err instanceof CrewspaceError) return err.isRetryable;
          return true;
        },
      }),
    ).rejects.toThrow(TaskConfigError);

    expect(runner).toHaveBeenCalledTimes(1);
  });

  it('should emit task:retry events for each retry attempt', async () => {
    const task = createTask({ id: 'retry-events' });
    const retryAttempts: number[] = [];
    task.on('task:retry', (_id, attempt) => retryAttempts.push(attempt));

    let calls = 0;
    const runner: TaskRunner = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls < 3) throw new Error('transient');
      return { output: 'ok' };
    });

    await executeWithRetry(runner, task, {}, 3, {
      sleep: noopSleep,
      random: () => 0.5,
    });

    expect(retryAttempts).toEqual([1, 2]);
  });
});

// ---------------------------------------------------------------------------
// 12. Error Details Preservation in toJSON
// ---------------------------------------------------------------------------

describe('Error details preservation in toJSON', () => {
  it('should include domain-specific details in serialized errors', () => {
    const errors: [CrewspaceError, Record<string, unknown>][] = [
      [
        new TaskExecutionError('task-1', 'failed', 'agent-1'),
        { taskId: 'task-1', agentId: 'agent-1' },
      ],
      [
        new ToolTimeoutError('search', 5000),
        { toolName: 'search', timeoutMs: 5000 },
      ],
      [
        new LLMRateLimitError('openai', 'limited', 2000),
        { provider: 'openai', statusCode: 429, retryAfterMs: 2000 },
      ],
      [
        new LLMContextLengthError('openai', 'too long', 10000, 8192),
        { provider: 'openai', statusCode: 400, requestTokens: 10000, maxTokens: 8192 },
      ],
    ];

    for (const [error, expectedDetails] of errors) {
      const json = error.toJSON();
      for (const [key, value] of Object.entries(expectedDetails)) {
        expect(json.details[key]).toBe(value);
      }
    }
  });

  it('should produce valid ISO timestamps in all error types', () => {
    const errors = [
      new TaskExecutionError('t1', 'failed'),
      new ToolExecutionError('tool', 'error'),
      new LLMRateLimitError('openai', 'limited', 1000),
      new AgentExecutionError('agent', 'failed'),
    ];

    for (const err of errors) {
      const parsed = new Date(err.timestamp);
      expect(parsed.toISOString()).toBe(err.timestamp);
    }
  });
});

// ---------------------------------------------------------------------------
// 13. Per-task Retry Policy with Different Error Types
// ---------------------------------------------------------------------------

describe('Per-task retry policy with error classification', () => {
  it('should use per-task isRetryable to skip retries on fatal errors', async () => {
    const task = new Task({
      id: 'selective-retry',
      description: 'Only retry transient errors',
      retries: 3,
      retryPolicy: {
        baseDelayMs: 100,
        isRetryable: (err: Error) => {
          // Only retry rate limit errors, not auth errors
          return err instanceof LLMRateLimitError;
        },
      },
    });

    const authError = new LLMAuthenticationError('openai', 'Bad key');
    const runner: TaskRunner = vi.fn().mockRejectedValue(authError);

    const wrapper = new TaskExecutionWrapper({
      sleep: noopSleep,
      random: () => 0.5,
    });

    await expect(wrapper.wrap(runner)(task, {})).rejects.toThrow(LLMAuthenticationError);
    expect(runner).toHaveBeenCalledTimes(1);
  });

  it('should retry with per-task policy when error is classified as retryable', async () => {
    const task = new Task({
      id: 'retryable-task',
      description: 'Retry rate limit errors',
      retries: 2,
      retryPolicy: {
        baseDelayMs: 10,
        backoffMultiplier: 2,
        jitter: 0,
        isRetryable: (err: Error) => err instanceof LLMRateLimitError,
      },
    });

    let calls = 0;
    const runner: TaskRunner = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls < 3) throw new LLMRateLimitError('openai', 'Rate limited', 1000);
      return { output: 'success' };
    });

    const wrapper = new TaskExecutionWrapper({
      sleep: noopSleep,
      random: () => 0.5,
    });

    const result = await wrapper.wrap(runner)(task, {});
    expect(result).toEqual({ output: 'success' });
    expect(calls).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 14. DLQ Serialization and Inspection
// ---------------------------------------------------------------------------

describe('DLQ serialization for inspection', () => {
  it('should serialize entries with error messages and metadata', () => {
    const dlq = new DeadLetterQueue({ maxSize: 10 });
    const task = createTask({ id: 'serializable-task', description: 'Important task' });
    const error = new TaskExecutionError('serializable-task', 'All retries exhausted');

    dlq.enqueue(task, error, {
      attempts: 3,
      metadata: { region: 'us-east-1', priority: 'high' },
    });

    const json = dlq.toJSON();
    expect(json).toHaveLength(1);
    expect(json[0]!.taskId).toBe('serializable-task');
    expect(json[0]!.error).toContain('All retries exhausted');
    expect(json[0]!.attempts).toBe(3);
    expect(json[0]!.metadata).toEqual({ region: 'us-east-1', priority: 'high' });
  });

  it('should filter DLQ entries by error type', () => {
    const dlq = new DeadLetterQueue({ maxSize: 10 });

    const timeoutTask = createTask({ id: 'timeout-task' });
    const authTask = createTask({ id: 'auth-task' });
    const genericTask = createTask({ id: 'generic-task' });

    dlq.enqueue(timeoutTask, new TaskTimeoutError('timeout-task', 5000));
    dlq.enqueue(authTask, new LLMAuthenticationError('openai', 'Bad key'));
    dlq.enqueue(genericTask, new Error('generic'));

    const timeoutEntries = dlq.filter(
      (entry) => entry.error instanceof TaskTimeoutError,
    );
    expect(timeoutEntries).toHaveLength(1);
    expect(timeoutEntries[0]!.task.id).toBe('timeout-task');

    const retryableEntries = dlq.filter(
      (entry) => entry.error instanceof CrewspaceError && entry.error.isRetryable,
    );
    expect(retryableEntries).toHaveLength(1);
  });
});
