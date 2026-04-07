/**
 * TaskExecutionWrapper — adds timeout enforcement and retry logic to task execution.
 *
 * Wraps a {@link TaskRunner} to automatically:
 * - Abort execution if a task's configured {@link Task.timeout} is exceeded
 * - Retry failed executions up to the task's configured {@link Task.retries}
 * - Apply exponential backoff between retry attempts
 * - Emit `task:retry` and `task:timeout` events on the Task instance
 *
 * @packageDocumentation
 */

import { TaskExecutionError, TaskTimeoutError } from '../errors/index.js';
import type { TaskResult } from '../types/task.js';
import type { DeadLetterQueue } from './dead-letter-queue.js';
import type { Task } from './task.js';
import type { TaskRunner } from './parallel-executor.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default base delay (ms) between retry attempts. */
const DEFAULT_BASE_DELAY_MS = 1_000;

/** Default maximum delay cap (ms) between retry attempts. */
const DEFAULT_MAX_DELAY_MS = 30_000;

/** Default backoff multiplier applied after each retry. */
const DEFAULT_BACKOFF_MULTIPLIER = 2;

/** Default jitter factor (0 = deterministic, 1 = full jitter). */
const DEFAULT_JITTER = 1;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Configuration for a {@link TaskExecutionWrapper}.
 *
 * All fields are optional — sensible defaults are provided.
 *
 * @example
 * ```typescript
 * const wrapper = new TaskExecutionWrapper({
 *   defaultTimeoutMs: 30_000,
 *   defaultRetries: 2,
 *   retryBaseDelayMs: 500,
 * });
 * ```
 */
export interface TaskExecutionWrapperConfig {
  /**
   * Fallback timeout (ms) used when a task does not specify its own.
   * Set to 0 for no default timeout. Default: 0.
   */
  readonly defaultTimeoutMs?: number;

  /**
   * Fallback retry count used when a task does not specify its own.
   * Default: 0 (no retries).
   */
  readonly defaultRetries?: number;

  /** Base delay (ms) before the first retry (default: 1000). */
  readonly retryBaseDelayMs?: number;

  /** Maximum delay cap (ms) between retries (default: 30000). */
  readonly retryMaxDelayMs?: number;

  /** Multiplier applied to delay after each attempt (default: 2). */
  readonly retryBackoffMultiplier?: number;

  /**
   * Jitter factor between 0 and 1 (default: 1).
   * 0 = deterministic delays, 1 = full randomised jitter.
   */
  readonly retryJitter?: number;

  /**
   * Optional predicate to determine whether a given error is retryable.
   * By default, all errors are retryable.
   */
  readonly isRetryable?: (error: Error) => boolean;

  /**
   * Injectable sleep function (for testing). Defaults to real `setTimeout`.
   */
  readonly sleep?: (ms: number) => Promise<void>;

  /**
   * Injectable random function (for testing). Defaults to `Math.random`.
   */
  readonly random?: () => number;

  /**
   * Optional dead-letter queue instance.
   *
   * When provided, tasks that exhaust all retries are automatically
   * enqueued into this DLQ before the final error is thrown.
   */
  readonly deadLetterQueue?: DeadLetterQueue;
}

// ---------------------------------------------------------------------------
// Retry statistics
// ---------------------------------------------------------------------------

/** Statistics from a task execution that may have involved retries. */
export interface TaskRetryStats {
  /** The task ID. */
  readonly taskId: string;

  /** Total number of attempts (1 = no retries). */
  readonly attempts: number;

  /** Whether the task ultimately succeeded. */
  readonly success: boolean;

  /** Whether the task was timed out on any attempt. */
  readonly timedOut: boolean;

  /** Total duration across all attempts in milliseconds. */
  readonly totalDurationMs: number;
}

// ---------------------------------------------------------------------------
// TaskExecutionWrapper
// ---------------------------------------------------------------------------

/**
 * Wraps a {@link TaskRunner} with timeout enforcement and configurable retry
 * logic using exponential backoff.
 *
 * Reads `task.timeout` and `task.retries` from each {@link Task} instance to
 * determine per-task behavior. Falls back to the wrapper's default config
 * when a task does not specify values.
 *
 * @example
 * ```typescript
 * const wrapper = new TaskExecutionWrapper({
 *   defaultTimeoutMs: 60_000,
 *   defaultRetries: 3,
 * });
 *
 * const enhancedRunner = wrapper.wrap(originalRunner);
 * const result = await enhancedRunner(task, context);
 * ```
 */
export class TaskExecutionWrapper {
  /** Default timeout in milliseconds. */
  public readonly defaultTimeoutMs: number;

  /** Default retry count. */
  public readonly defaultRetries: number;

  /** Base delay between retries in milliseconds. */
  public readonly retryBaseDelayMs: number;

  /** Maximum delay cap between retries in milliseconds. */
  public readonly retryMaxDelayMs: number;

  /** Backoff multiplier. */
  public readonly retryBackoffMultiplier: number;

  /** Jitter factor (0–1). */
  public readonly retryJitter: number;

  private readonly _isRetryable: (error: Error) => boolean;
  private readonly _sleep: (ms: number) => Promise<void>;
  private readonly _random: () => number;
  private readonly _dlq: DeadLetterQueue | undefined;

  constructor(config?: TaskExecutionWrapperConfig) {
    this.defaultTimeoutMs = config?.defaultTimeoutMs ?? 0;
    this.defaultRetries = config?.defaultRetries ?? 0;
    this.retryBaseDelayMs = config?.retryBaseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    this.retryMaxDelayMs = config?.retryMaxDelayMs ?? DEFAULT_MAX_DELAY_MS;
    this.retryBackoffMultiplier = config?.retryBackoffMultiplier ?? DEFAULT_BACKOFF_MULTIPLIER;
    this.retryJitter = config?.retryJitter ?? DEFAULT_JITTER;
    this._isRetryable = config?.isRetryable ?? (() => true);
    this._sleep = config?.sleep ?? defaultSleep;
    this._random = config?.random ?? Math.random;
    this._dlq = config?.deadLetterQueue;
  }

  /**
   * Wrap a {@link TaskRunner} with timeout and retry behavior.
   *
   * The returned runner:
   * 1. Starts a timeout timer (if configured) for each attempt.
   * 2. Runs the original runner.
   * 3. On failure, retries up to `task.retries` times with exponential backoff.
   * 4. Emits `task:retry` and `task:timeout` events on the Task instance.
   *
   * @param runner - The original task runner to wrap
   * @returns A new TaskRunner with timeout + retry semantics
   */
  wrap(runner: TaskRunner): TaskRunner {
    return async (
      task: Task,
      context: Readonly<Record<string, TaskResult>>,
    ): Promise<TaskResult> => {
      const timeoutMs = task.timeout || this.defaultTimeoutMs;
      const maxRetries = task.retries || this.defaultRetries;

      // Resolve per-task retry policy with fallback to wrapper defaults
      const policy = task.retryPolicy;
      const baseDelayMs = policy?.baseDelayMs ?? this.retryBaseDelayMs;
      const maxDelayMs = policy?.maxDelayMs ?? this.retryMaxDelayMs;
      const backoffMultiplier = policy?.backoffMultiplier ?? this.retryBackoffMultiplier;
      const jitter = policy?.jitter ?? this.retryJitter;
      const isRetryable = policy?.isRetryable ?? this._isRetryable;

      let lastError: Error | undefined;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        // Wait before retry (not on first attempt)
        if (attempt > 0) {
          const delayMs = this._calculateDelayWith(
            attempt - 1,
            baseDelayMs,
            maxDelayMs,
            backoffMultiplier,
            jitter,
          );
          task.emit('task:retry', task.id, attempt, maxRetries);
          await this._sleep(delayMs);
        }

        try {
          const result = await this._executeWithTimeout(runner, task, context, timeoutMs);
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Timeout errors on the last attempt are thrown immediately
          if (lastError instanceof TaskTimeoutError && attempt >= maxRetries) {
            this._enqueueToDLQ(task, lastError, attempt + 1, context);
            throw lastError;
          }

          // Non-retryable errors are thrown immediately
          if (!isRetryable(lastError)) {
            this._enqueueToDLQ(task, lastError, attempt + 1, context);
            throw lastError;
          }

          // Out of retries — throw
          if (attempt >= maxRetries) {
            this._enqueueToDLQ(task, lastError, attempt + 1, context);
            throw new TaskExecutionError(
              task.id,
              `Failed after ${String(attempt + 1)} attempt(s): ${lastError.message}`,
              task.agentId,
              lastError,
            );
          }
        }
      }

      // Unreachable in practice, but TypeScript needs this
      /* istanbul ignore next */
      throw lastError ?? new TaskExecutionError(task.id, 'Unknown error');
    };
  }

  /**
   * Calculate the retry delay using exponential backoff with jitter.
   *
   * @param attempt - Zero-based retry attempt index
   * @returns Delay in milliseconds
   */
  calculateDelay(attempt: number): number {
    return this._calculateDelay(attempt);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _calculateDelay(attempt: number): number {
    return this._calculateDelayWith(
      attempt,
      this.retryBaseDelayMs,
      this.retryMaxDelayMs,
      this.retryBackoffMultiplier,
      this.retryJitter,
    );
  }

  private _calculateDelayWith(
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number,
    backoffMultiplier: number,
    jitter: number,
  ): number {
    const exponentialDelay = baseDelayMs * Math.pow(backoffMultiplier, attempt);
    const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

    const deterministicPart = cappedDelay * (1 - jitter);
    const randomPart = cappedDelay * jitter * this._random();
    return Math.round(deterministicPart + randomPart);
  }

  /** Enqueue a task into the DLQ if one is configured. */
  private _enqueueToDLQ(
    task: Task,
    error: Error,
    attempts: number,
    context: Readonly<Record<string, TaskResult>>,
  ): void {
    if (this._dlq) {
      this._dlq.enqueue(task, error, { attempts, context });
    }
  }

  private async _executeWithTimeout(
    runner: TaskRunner,
    task: Task,
    context: Readonly<Record<string, TaskResult>>,
    timeoutMs: number,
  ): Promise<TaskResult> {
    if (timeoutMs <= 0) {
      return runner(task, context);
    }

    return new Promise<TaskResult>((resolve, reject) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          const error = new TaskTimeoutError(task.id, timeoutMs, task.agentId);
          task.emit('task:timeout', task.id, timeoutMs);
          reject(error);
        }
      }, timeoutMs);

      runner(task, context)
        .then((result) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(result);
          }
        })
        .catch((error: unknown) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        });
    });
  }
}

// ---------------------------------------------------------------------------
// Standalone helper functions
// ---------------------------------------------------------------------------

/**
 * Execute a task runner with timeout enforcement.
 *
 * @param runner    - The task runner
 * @param task      - The task to execute
 * @param context   - Dependency results context
 * @param timeoutMs - Timeout in ms (0 = no timeout)
 * @returns The task result
 * @throws {TaskTimeoutError} If execution exceeds the timeout
 */
export async function executeWithTimeout(
  runner: TaskRunner,
  task: Task,
  context: Readonly<Record<string, TaskResult>>,
  timeoutMs: number,
): Promise<TaskResult> {
  if (timeoutMs <= 0) {
    return runner(task, context);
  }

  return new Promise<TaskResult>((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        const error = new TaskTimeoutError(task.id, timeoutMs, task.agentId);
        task.emit('task:timeout', task.id, timeoutMs);
        reject(error);
      }
    }, timeoutMs);

    runner(task, context)
      .then((result) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(result);
        }
      })
      .catch((error: unknown) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });
  });
}

/**
 * Execute a task runner with retry logic (exponential backoff).
 *
 * @param runner     - The task runner
 * @param task       - The task to execute
 * @param context    - Dependency results context
 * @param maxRetries - Maximum retry count
 * @param options    - Retry behavior configuration
 * @returns The task result
 * @throws {TaskExecutionError} If all attempts fail
 */
export async function executeWithRetry(
  runner: TaskRunner,
  task: Task,
  context: Readonly<Record<string, TaskResult>>,
  maxRetries: number,
  options?: {
    readonly baseDelayMs?: number;
    readonly maxDelayMs?: number;
    readonly backoffMultiplier?: number;
    readonly jitter?: number;
    readonly isRetryable?: (error: Error) => boolean;
    readonly sleep?: (ms: number) => Promise<void>;
    readonly random?: () => number;
  },
): Promise<TaskResult> {
  const baseDelayMs = options?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelayMs = options?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const backoffMultiplier = options?.backoffMultiplier ?? DEFAULT_BACKOFF_MULTIPLIER;
  const jitter = options?.jitter ?? DEFAULT_JITTER;
  const isRetryable = options?.isRetryable ?? (() => true);
  const sleepFn = options?.sleep ?? defaultSleep;
  const randomFn = options?.random ?? Math.random;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = calculateTaskRetryDelay(
        attempt - 1,
        baseDelayMs,
        maxDelayMs,
        backoffMultiplier,
        jitter,
        randomFn,
      );
      task.emit('task:retry', task.id, attempt, maxRetries);
      await sleepFn(delay);
    }

    try {
      return await runner(task, context);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isRetryable(lastError)) {
        throw lastError;
      }

      if (attempt >= maxRetries) {
        throw new TaskExecutionError(
          task.id,
          `Failed after ${String(attempt + 1)} attempt(s): ${lastError.message}`,
          task.agentId,
          lastError,
        );
      }
    }
  }

  /* istanbul ignore next */
  throw lastError ?? new TaskExecutionError(task.id, 'Unknown error');
}

/**
 * Calculate delay for a retry attempt using exponential backoff with jitter.
 *
 * @param attempt           - Zero-based retry attempt index
 * @param baseDelayMs       - Base delay in ms
 * @param maxDelayMs        - Maximum delay cap in ms
 * @param backoffMultiplier - Multiplier per attempt
 * @param jitter            - Jitter factor (0–1)
 * @param random            - Random number generator
 * @returns Delay in milliseconds
 */
export function calculateTaskRetryDelay(
  attempt: number,
  baseDelayMs: number = DEFAULT_BASE_DELAY_MS,
  maxDelayMs: number = DEFAULT_MAX_DELAY_MS,
  backoffMultiplier: number = DEFAULT_BACKOFF_MULTIPLIER,
  jitter: number = DEFAULT_JITTER,
  random: () => number = Math.random,
): number {
  const exponentialDelay = baseDelayMs * Math.pow(backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

  const deterministicPart = cappedDelay * (1 - jitter);
  const randomPart = cappedDelay * jitter * random();
  return Math.round(deterministicPart + randomPart);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function defaultSleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
