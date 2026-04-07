/**
 * TaskTimeoutGuard — abort-aware timeout protection for runaway tasks.
 *
 * Unlike the basic timeout in {@link TaskExecutionWrapper}, the guard uses
 * `AbortController` to signal cancellation to the running operation so it
 * can cooperatively terminate instead of continuing to consume resources
 * after the promise has been rejected.
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'eventemitter3';

import { TaskTimeoutError } from '../errors/index.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default maximum timeout allowed (10 minutes). */
const DEFAULT_MAX_TIMEOUT_MS = 600_000;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Configuration for a {@link TaskTimeoutGuard}.
 *
 * @example
 * ```typescript
 * const guard = new TaskTimeoutGuard({
 *   defaultTimeoutMs: 30_000,
 *   maxTimeoutMs: 300_000,
 * });
 * ```
 */
export interface TaskTimeoutGuardConfig {
  /**
   * Fallback timeout (ms) when none is specified per-call.
   * Set to 0 for no default timeout. Default: 0.
   */
  readonly defaultTimeoutMs?: number;

  /**
   * Upper bound on allowed timeout values.
   * Prevents accidentally setting unreasonable timeouts.
   * Default: 600 000 (10 minutes).
   */
  readonly maxTimeoutMs?: number;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Map of guard event names to their listener signatures. */
export interface TaskTimeoutGuardEventMap {
  /** Emitted when a guarded execution starts. */
  'timeout:started': (taskId: string, timeoutMs: number) => void;

  /** Emitted when a guarded execution completes within the timeout. */
  'timeout:completed': (taskId: string, durationMs: number) => void;

  /** Emitted when a guarded execution exceeds its timeout. */
  'timeout:expired': (taskId: string, timeoutMs: number) => void;

  /** Emitted when a guarded execution is manually aborted. */
  'timeout:aborted': (taskId: string, reason: string) => void;

  /** Emitted when a guarded execution fails with a non-timeout error. */
  'timeout:error': (taskId: string, error: Error) => void;
}

// ---------------------------------------------------------------------------
// Active guard info (read-only snapshot)
// ---------------------------------------------------------------------------

/** Read-only snapshot of a currently active guarded operation. */
export interface ActiveGuardInfo {
  /** The task ID being guarded. */
  readonly taskId: string;

  /** Configured timeout in milliseconds. */
  readonly timeoutMs: number;

  /** Unix timestamp (ms) when the guard started. */
  readonly startedAt: number;

  /** Elapsed time since the guard started, in milliseconds. */
  readonly elapsedMs: number;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface GuardEntry {
  taskId: string;
  timeoutMs: number;
  startedAt: number;
  timer: ReturnType<typeof setTimeout> | null;
  abortController: AbortController;
}

// ---------------------------------------------------------------------------
// TaskTimeoutGuard
// ---------------------------------------------------------------------------

/**
 * Abort-aware timeout guard for protecting against runaway tasks.
 *
 * Wraps async operations with a timeout and provides an {@link AbortSignal}
 * so the underlying work can cooperatively stop when the timeout fires
 * (or when {@link abort}/{@link abortAll} is called manually).
 *
 * @example
 * ```typescript
 * const guard = new TaskTimeoutGuard({ defaultTimeoutMs: 5_000 });
 *
 * guard.on('timeout:expired', (id, ms) => {
 *   console.warn(`Task ${id} timed out after ${ms}ms`);
 * });
 *
 * const result = await guard.execute(
 *   async (signal) => {
 *     // signal.aborted will become true if timeout fires
 *     const res = await fetch(url, { signal });
 *     return res.text();
 *   },
 *   10_000,
 *   'fetch-data',
 * );
 * ```
 */
export class TaskTimeoutGuard {
  /** Default timeout applied when none is specified per-call. */
  public readonly defaultTimeoutMs: number;

  /** Maximum allowed timeout value. */
  public readonly maxTimeoutMs: number;

  private readonly _emitter: EventEmitter<TaskTimeoutGuardEventMap>;
  private readonly _activeGuards: Map<string, GuardEntry>;
  private _disposed: boolean;
  private _guardCounter: number;

  constructor(config?: TaskTimeoutGuardConfig) {
    this.defaultTimeoutMs = config?.defaultTimeoutMs ?? 0;
    this.maxTimeoutMs = config?.maxTimeoutMs ?? DEFAULT_MAX_TIMEOUT_MS;
    this._emitter = new EventEmitter<TaskTimeoutGuardEventMap>();
    this._activeGuards = new Map<string, GuardEntry>();
    this._disposed = false;
    this._guardCounter = 0;
  }

  // -----------------------------------------------------------------------
  // Read-only accessors
  // -----------------------------------------------------------------------

  /** Number of currently active guarded operations. */
  get activeCount(): number {
    return this._activeGuards.size;
  }

  /** Whether this guard has been disposed. */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Snapshot of all currently active guarded operations.
   *
   * @returns Array of {@link ActiveGuardInfo} objects
   */
  getActiveGuards(): ActiveGuardInfo[] {
    const now = Date.now();
    const guards: ActiveGuardInfo[] = [];
    for (const entry of this._activeGuards.values()) {
      guards.push({
        taskId: entry.taskId,
        timeoutMs: entry.timeoutMs,
        startedAt: entry.startedAt,
        elapsedMs: now - entry.startedAt,
      });
    }
    return guards;
  }

  // -----------------------------------------------------------------------
  // Core execution
  // -----------------------------------------------------------------------

  /**
   * Execute an async function with timeout protection and abort signal.
   *
   * The supplied function receives an {@link AbortSignal} that is aborted
   * when the timeout fires (or when {@link abort}/{@link abortAll} is called).
   * Cooperative tasks should check `signal.aborted` or listen for the
   * `'abort'` event to terminate early.
   *
   * @param fn        - Async function to execute; receives an AbortSignal
   * @param timeoutMs - Timeout in ms (overrides {@link defaultTimeoutMs}); 0 means no timeout
   * @param taskId    - Optional identifier for this execution (auto-generated if omitted)
   * @returns The value returned by `fn`
   * @throws {TaskTimeoutError} If execution exceeds the timeout
   * @throws {Error} If the guard has been disposed
   * @throws {Error} If `timeoutMs` exceeds {@link maxTimeoutMs}
   */
  async execute<T>(
    fn: (signal: AbortSignal) => Promise<T>,
    timeoutMs?: number,
    taskId?: string,
  ): Promise<T> {
    if (this._disposed) {
      throw new Error('TaskTimeoutGuard has been disposed');
    }

    const effectiveTimeout = timeoutMs ?? this.defaultTimeoutMs;
    const resolvedTaskId = taskId ?? `guard-${String(++this._guardCounter)}`;

    if (effectiveTimeout > this.maxTimeoutMs) {
      throw new Error(
        `Timeout ${String(effectiveTimeout)}ms exceeds maximum allowed ${String(this.maxTimeoutMs)}ms`,
      );
    }

    // No timeout — run directly with a non-abortable signal
    if (effectiveTimeout <= 0) {
      return fn(new AbortController().signal);
    }

    const abortController = new AbortController();
    const entry: GuardEntry = {
      taskId: resolvedTaskId,
      timeoutMs: effectiveTimeout,
      startedAt: Date.now(),
      timer: null,
      abortController,
    };

    this._activeGuards.set(resolvedTaskId, entry);
    this._emit('timeout:started', resolvedTaskId, effectiveTimeout);

    return new Promise<T>((resolve, reject) => {
      let settled = false;

      entry.timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          // Abort the signal so cooperative tasks can stop work
          abortController.abort(new TaskTimeoutError(resolvedTaskId, effectiveTimeout));
          this._activeGuards.delete(resolvedTaskId);
          this._emit('timeout:expired', resolvedTaskId, effectiveTimeout);
          reject(new TaskTimeoutError(resolvedTaskId, effectiveTimeout));
        }
      }, effectiveTimeout);

      fn(abortController.signal)
        .then((result) => {
          if (!settled) {
            settled = true;
            if (entry.timer !== null) clearTimeout(entry.timer);
            const duration = Date.now() - entry.startedAt;
            this._activeGuards.delete(resolvedTaskId);
            this._emit('timeout:completed', resolvedTaskId, duration);
            resolve(result);
          }
        })
        .catch((error: unknown) => {
          if (!settled) {
            settled = true;
            if (entry.timer !== null) clearTimeout(entry.timer);
            this._activeGuards.delete(resolvedTaskId);
            const wrappedError = error instanceof Error ? error : new Error(String(error));
            this._emit('timeout:error', resolvedTaskId, wrappedError);
            reject(wrappedError);
          }
        });
    });
  }

  // -----------------------------------------------------------------------
  // Abort controls
  // -----------------------------------------------------------------------

  /**
   * Abort all active guarded operations.
   *
   * Clears all timers and fires the abort signal on each active guard.
   *
   * @param reason - Human-readable reason for the abort
   * @returns Number of guards that were aborted
   */
  abortAll(reason?: string): number {
    const count = this._activeGuards.size;
    const abortReason = reason ?? 'All guards aborted';

    for (const [taskId, entry] of this._activeGuards) {
      if (entry.timer !== null) clearTimeout(entry.timer);
      entry.abortController.abort(new Error(abortReason));
      this._emit('timeout:aborted', taskId, abortReason);
    }

    this._activeGuards.clear();
    return count;
  }

  /**
   * Abort a specific active guard by task ID.
   *
   * @param taskId - ID of the guard to abort
   * @param reason - Human-readable reason for the abort
   * @returns `true` if the guard was found and aborted, `false` otherwise
   */
  abort(taskId: string, reason?: string): boolean {
    const entry = this._activeGuards.get(taskId);
    if (!entry) return false;

    if (entry.timer !== null) clearTimeout(entry.timer);
    const abortReason = reason ?? `Guard for "${taskId}" aborted`;
    entry.abortController.abort(new Error(abortReason));
    this._activeGuards.delete(taskId);
    this._emit('timeout:aborted', taskId, abortReason);
    return true;
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /**
   * Dispose the guard, aborting all active operations.
   *
   * After disposal, no new operations can be started via {@link execute}.
   */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.abortAll('TaskTimeoutGuard disposed');
    this._emitter.removeAllListeners();
  }

  // -----------------------------------------------------------------------
  // Event system (type-safe delegation)
  // -----------------------------------------------------------------------

  /** Subscribe to a guard event. */
  on<E extends keyof TaskTimeoutGuardEventMap>(
    event: E,
    listener: TaskTimeoutGuardEventMap[E],
  ): this {
    this._emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /** Unsubscribe from a guard event. */
  off<E extends keyof TaskTimeoutGuardEventMap>(
    event: E,
    listener: TaskTimeoutGuardEventMap[E],
  ): this {
    this._emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /** Subscribe to a guard event (fires once). */
  once<E extends keyof TaskTimeoutGuardEventMap>(
    event: E,
    listener: TaskTimeoutGuardEventMap[E],
  ): this {
    this._emitter.once(event, listener as (...args: unknown[]) => void);
    return this;
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  private _emit<E extends keyof TaskTimeoutGuardEventMap>(
    event: E,
    ...args: Parameters<TaskTimeoutGuardEventMap[E]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._emitter.emit as (event: string, ...args: any[]) => boolean)(event, ...args);
  }
}

// ---------------------------------------------------------------------------
// Standalone utility
// ---------------------------------------------------------------------------

/**
 * Execute an async function with one-shot timeout protection.
 *
 * Convenience wrapper around {@link TaskTimeoutGuard} for single-use
 * scenarios where you don't need to track or abort multiple operations.
 *
 * @param fn        - Async function to execute; receives an AbortSignal
 * @param timeoutMs - Timeout in milliseconds
 * @param taskId    - Optional identifier for the operation
 * @returns The value returned by `fn`
 * @throws {TaskTimeoutError} If execution exceeds the timeout
 *
 * @example
 * ```typescript
 * const data = await withTimeoutGuard(
 *   async (signal) => fetchData(url, { signal }),
 *   5_000,
 *   'fetch-data',
 * );
 * ```
 */
export async function withTimeoutGuard<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  taskId?: string,
): Promise<T> {
  const guard = new TaskTimeoutGuard({ defaultTimeoutMs: timeoutMs });
  try {
    return await guard.execute(fn, timeoutMs, taskId);
  } finally {
    guard.dispose();
  }
}
