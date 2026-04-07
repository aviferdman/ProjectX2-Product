/**
 * DeadLetterQueue — captures tasks that have exhausted all retry attempts.
 *
 * When a task fails after all retries, it can be placed in the DLQ for later
 * inspection, manual retry, or cleanup. The DLQ provides:
 *
 * - Configurable capacity with overflow policies (drop-oldest or reject)
 * - Event emission for DLQ lifecycle (enqueue, retry, discard, drain)
 * - Query methods to inspect and filter entries
 * - Manual retry support with a user-supplied {@link TaskRunner}
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'eventemitter3';

import type { TaskResult } from '../types/task.js';
import type { Task } from './task.js';
import type { TaskRunner } from './parallel-executor.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default maximum number of entries the DLQ will hold. */
export const DEFAULT_DLQ_MAX_SIZE = 1_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Policy for handling new entries when the DLQ is at capacity. */
export type DLQOverflowPolicy = 'drop-oldest' | 'reject';

/**
 * Configuration for creating a {@link DeadLetterQueue}.
 *
 * @example
 * ```typescript
 * const dlq = new DeadLetterQueue({
 *   maxSize: 500,
 *   overflowPolicy: 'drop-oldest',
 * });
 * ```
 */
export interface DeadLetterQueueConfig {
  /** Maximum number of entries (default: {@link DEFAULT_DLQ_MAX_SIZE}). */
  readonly maxSize?: number;

  /** Overflow policy when full (default: 'drop-oldest'). */
  readonly overflowPolicy?: DLQOverflowPolicy;
}

/**
 * A single entry in the dead letter queue representing a failed task.
 */
export interface DeadLetterEntry {
  /** The failed task instance. */
  readonly task: Task;

  /** The error that caused the final failure. */
  readonly error: Error;

  /** ISO-8601 timestamp when the entry was added to the DLQ. */
  readonly enqueuedAt: string;

  /** Number of execution attempts before being dead-lettered. */
  readonly attempts: number;

  /** Optional original context that was available during execution. */
  readonly context?: Readonly<Record<string, TaskResult>>;

  /** Arbitrary metadata attached by the caller. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Options for enqueuing a task into the DLQ. */
export interface DeadLetterEnqueueOptions {
  /** Number of attempts already made (default: 1). */
  readonly attempts?: number;

  /** Optional dependency results context from the execution. */
  readonly context?: Readonly<Record<string, TaskResult>>;

  /** Arbitrary metadata to attach to the entry. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Map of DLQ event names to their listener signatures. */
export interface DeadLetterQueueEventMap {
  /** Emitted when a task is added to the DLQ. */
  'dlq:enqueued': (entry: DeadLetterEntry) => void;

  /** Emitted when a retry is attempted on a DLQ entry. */
  'dlq:retry': (taskId: string, attempt: number) => void;

  /** Emitted when a retry succeeds and the entry is removed. */
  'dlq:retry:success': (taskId: string, result: TaskResult) => void;

  /** Emitted when a retry fails and the entry remains. */
  'dlq:retry:failure': (taskId: string, error: Error) => void;

  /** Emitted when an entry is discarded (manually or by overflow). */
  'dlq:discarded': (taskId: string, reason: string) => void;

  /** Emitted when the DLQ is drained (all entries removed). */
  'dlq:drained': (count: number) => void;

  /** Emitted when an entry is dropped due to overflow. */
  'dlq:overflow': (droppedTaskId: string) => void;
}

// ---------------------------------------------------------------------------
// DeadLetterQueue
// ---------------------------------------------------------------------------

/**
 * Dead letter queue for tasks that have failed after all retry attempts.
 *
 * @example
 * ```typescript
 * const dlq = new DeadLetterQueue({ maxSize: 100 });
 *
 * dlq.on('dlq:enqueued', (entry) => {
 *   console.log(`Task ${entry.task.id} dead-lettered after ${entry.attempts} attempts`);
 * });
 *
 * dlq.enqueue(failedTask, new Error('All retries exhausted'), { attempts: 3 });
 *
 * // Later, retry a specific entry
 * const result = await dlq.retry(failedTask.id, myRunner);
 * ```
 */
export class DeadLetterQueue {
  /** Maximum entries the queue can hold. */
  public readonly maxSize: number;

  /** Overflow policy when full. */
  public readonly overflowPolicy: DLQOverflowPolicy;

  private readonly _entries: Map<string, DeadLetterEntry> = new Map();
  private readonly _insertionOrder: string[] = [];
  private readonly _emitter = new EventEmitter<DeadLetterQueueEventMap>();

  constructor(config?: DeadLetterQueueConfig) {
    this.maxSize = config?.maxSize ?? DEFAULT_DLQ_MAX_SIZE;
    this.overflowPolicy = config?.overflowPolicy ?? 'drop-oldest';

    if (this.maxSize < 1) {
      throw new Error('DeadLetterQueue maxSize must be at least 1');
    }
  }

  // -------------------------------------------------------------------------
  // Read-only accessors
  // -------------------------------------------------------------------------

  /** Number of entries currently in the queue. */
  get size(): number {
    return this._entries.size;
  }

  /** Whether the queue has reached its capacity. */
  get isFull(): boolean {
    return this._entries.size >= this.maxSize;
  }

  /** Whether the queue is empty. */
  get isEmpty(): boolean {
    return this._entries.size === 0;
  }

  // -------------------------------------------------------------------------
  // Core operations
  // -------------------------------------------------------------------------

  /**
   * Add a failed task to the dead letter queue.
   *
   * @param task    - The task that failed
   * @param error   - The error that caused the failure
   * @param options - Additional enqueue options
   * @returns `true` if the entry was added, `false` if rejected due to overflow policy
   */
  enqueue(task: Task, error: Error, options?: DeadLetterEnqueueOptions): boolean {
    // If the task is already in the DLQ, update it
    if (this._entries.has(task.id)) {
      this._removeFromInsertionOrder(task.id);
    }

    // Handle capacity overflow
    if (this._entries.size >= this.maxSize && !this._entries.has(task.id)) {
      if (this.overflowPolicy === 'reject') {
        return false;
      }

      // drop-oldest: remove the oldest entry
      const oldestId = this._insertionOrder[0];
      if (oldestId !== undefined) {
        this._entries.delete(oldestId);
        this._insertionOrder.shift();
        this._emit('dlq:overflow', oldestId);
        this._emit('dlq:discarded', oldestId, 'overflow');
      }
    }

    const entry: DeadLetterEntry = {
      task,
      error,
      enqueuedAt: new Date().toISOString(),
      attempts: options?.attempts ?? 1,
      context: options?.context,
      metadata: options?.metadata,
    };

    this._entries.set(task.id, entry);
    this._insertionOrder.push(task.id);
    this._emit('dlq:enqueued', entry);

    return true;
  }

  /**
   * Retry a dead-lettered task using the given runner.
   *
   * If the retry succeeds, the entry is removed from the DLQ.
   * If it fails, the entry remains with an updated error.
   *
   * @param taskId  - ID of the task to retry
   * @param runner  - The task runner to use for execution
   * @param context - Optional execution context
   * @returns The task result on success
   * @throws The error if the retry fails, or an Error if taskId not found
   */
  async retry(
    taskId: string,
    runner: TaskRunner,
    context?: Readonly<Record<string, TaskResult>>,
  ): Promise<TaskResult> {
    const entry = this._entries.get(taskId);
    if (!entry) {
      throw new Error(`Task "${taskId}" not found in dead letter queue`);
    }

    const execContext = context ?? entry.context ?? {};
    const newAttempt = entry.attempts + 1;

    this._emit('dlq:retry', taskId, newAttempt);

    try {
      const result = await runner(entry.task, execContext);
      this.remove(taskId);
      this._emit('dlq:retry:success', taskId, result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      // Update the entry with the new error and attempt count
      const updatedEntry: DeadLetterEntry = {
        ...entry,
        error,
        attempts: newAttempt,
      };
      this._entries.set(taskId, updatedEntry);

      this._emit('dlq:retry:failure', taskId, error);
      throw error;
    }
  }

  /**
   * Remove a specific entry from the DLQ.
   *
   * @param taskId - ID of the task to remove
   * @returns `true` if the entry existed and was removed
   */
  remove(taskId: string): boolean {
    const existed = this._entries.delete(taskId);
    if (existed) {
      this._removeFromInsertionOrder(taskId);
      this._emit('dlq:discarded', taskId, 'manual');
    }
    return existed;
  }

  /**
   * Remove all entries from the DLQ.
   *
   * @returns The number of entries that were removed
   */
  drain(): number {
    const count = this._entries.size;
    this._entries.clear();
    this._insertionOrder.length = 0;
    this._emit('dlq:drained', count);
    return count;
  }

  // -------------------------------------------------------------------------
  // Query methods
  // -------------------------------------------------------------------------

  /**
   * Get a specific entry by task ID.
   *
   * @param taskId - The task ID to look up
   * @returns The entry, or `undefined` if not found
   */
  get(taskId: string): DeadLetterEntry | undefined {
    return this._entries.get(taskId);
  }

  /**
   * Check whether a task is in the DLQ.
   *
   * @param taskId - The task ID to check
   */
  has(taskId: string): boolean {
    return this._entries.has(taskId);
  }

  /**
   * Get all entries in insertion order (oldest first).
   */
  entries(): DeadLetterEntry[] {
    return this._insertionOrder
      .map((id) => this._entries.get(id))
      .filter((entry): entry is DeadLetterEntry => entry !== undefined);
  }

  /**
   * Get all task IDs currently in the DLQ.
   */
  taskIds(): string[] {
    return [...this._insertionOrder];
  }

  /**
   * Get entries filtered by a predicate.
   *
   * @param predicate - Filter function
   */
  filter(predicate: (entry: DeadLetterEntry) => boolean): DeadLetterEntry[] {
    return this.entries().filter(predicate);
  }

  /**
   * Get the oldest entry in the DLQ.
   */
  oldest(): DeadLetterEntry | undefined {
    const oldestId = this._insertionOrder[0];
    return oldestId !== undefined ? this._entries.get(oldestId) : undefined;
  }

  /**
   * Get the newest entry in the DLQ.
   */
  newest(): DeadLetterEntry | undefined {
    const newestId = this._insertionOrder[this._insertionOrder.length - 1];
    return newestId !== undefined ? this._entries.get(newestId) : undefined;
  }

  // -------------------------------------------------------------------------
  // Event system
  // -------------------------------------------------------------------------

  on<E extends keyof DeadLetterQueueEventMap>(
    event: E,
    listener: DeadLetterQueueEventMap[E],
  ): this {
    this._emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  off<E extends keyof DeadLetterQueueEventMap>(
    event: E,
    listener: DeadLetterQueueEventMap[E],
  ): this {
    this._emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  once<E extends keyof DeadLetterQueueEventMap>(
    event: E,
    listener: DeadLetterQueueEventMap[E],
  ): this {
    this._emitter.once(event, listener as (...args: unknown[]) => void);
    return this;
  }

  // -------------------------------------------------------------------------
  // Serialization
  // -------------------------------------------------------------------------

  /**
   * Serialize the DLQ contents for inspection or persistence.
   *
   * Note: Task instances and Error objects are serialized to simplified forms.
   */
  toJSON(): ReadonlyArray<{
    taskId: string;
    description: string;
    error: string;
    enqueuedAt: string;
    attempts: number;
    metadata?: Readonly<Record<string, unknown>>;
  }> {
    return this.entries().map((entry) => ({
      taskId: entry.task.id,
      description: entry.task.description,
      error: entry.error.message,
      enqueuedAt: entry.enqueuedAt,
      attempts: entry.attempts,
      ...(entry.metadata ? { metadata: entry.metadata } : {}),
    }));
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _removeFromInsertionOrder(taskId: string): void {
    const idx = this._insertionOrder.indexOf(taskId);
    if (idx !== -1) {
      this._insertionOrder.splice(idx, 1);
    }
  }

  private _emit<E extends keyof DeadLetterQueueEventMap>(
    event: E,
    ...args: Parameters<DeadLetterQueueEventMap[E]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._emitter.emit as (event: string, ...args: any[]) => boolean)(event, ...args);
  }
}
