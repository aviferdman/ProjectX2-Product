/**
 * Core Task class — a standalone, reusable unit of work in Crewspace.
 *
 * A Task wraps a {@link TaskConfig} with lifecycle management, event
 * emission, and runtime validation. Tasks can be executed independently
 * or composed into {@link Crew} workflows via {@link Task.toCrewTask}.
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'eventemitter3';
import { z, ZodError } from 'zod';

import { TaskConfigError } from '../errors/index.js';
import type { CrewTask } from '../types/crew.js';
import type {
  RetryPolicy,
  TaskConfig,
  TaskEventMap,
  TaskInput,
  TaskResult,
} from '../types/task.js';
import { TaskPriority, TaskStatus } from '../types/task.js';

// ---------------------------------------------------------------------------
// Zod schema for runtime validation of TaskConfig
// ---------------------------------------------------------------------------

const TASK_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_RETRIES_UPPER_BOUND = 10;
const MAX_TIMEOUT_MS = 600_000; // 10 minutes

const RetryPolicySchema = z
  .object({
    baseDelayMs: z.number().int().positive('baseDelayMs must be positive').optional(),
    maxDelayMs: z.number().int().positive('maxDelayMs must be positive').optional(),
    backoffMultiplier: z.number().positive('backoffMultiplier must be positive').optional(),
    jitter: z.number().min(0, 'jitter must be ≥ 0').max(1, 'jitter must be ≤ 1').optional(),
    isRetryable: z
      .custom<
        (error: Error) => boolean
      >((val) => val === undefined || typeof val === 'function', 'isRetryable must be a function')
      .optional(),
  })
  .strict()
  .optional();

const TaskConfigSchema = z.object({
  id: z
    .string()
    .min(1, 'Task id must not be empty')
    .regex(TASK_ID_PATTERN, 'Task id must be alphanumeric (dashes and underscores allowed)'),
  description: z.string().min(1, 'Task description must not be empty'),
  expectedOutput: z.string().optional(),
  agentId: z
    .string()
    .min(1, 'Task agentId must not be empty')
    .regex(TASK_ID_PATTERN, 'Task agentId must be alphanumeric (dashes and underscores allowed)')
    .optional(),
  context: z.record(z.unknown()).optional(),
  dependencies: z.array(z.string().min(1)).optional(),
  timeout: z
    .number()
    .int()
    .positive('Task timeout must be positive')
    .max(MAX_TIMEOUT_MS, `Task timeout must be ≤ ${String(MAX_TIMEOUT_MS)}ms`)
    .optional(),
  retries: z
    .number()
    .int()
    .min(0, 'Task retries must be non-negative')
    .max(MAX_RETRIES_UPPER_BOUND, `Task retries must be ≤ ${String(MAX_RETRIES_UPPER_BOUND)}`)
    .optional(),
  retryPolicy: RetryPolicySchema,
  priority: z.nativeEnum(TaskPriority).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Task class
// ---------------------------------------------------------------------------

/**
 * A standalone, reusable task with lifecycle management and event emission.
 *
 * @example
 * ```typescript
 * const task = new Task({
 *   id: 'research',
 *   description: 'Find the latest AI papers on multi-agent systems',
 *   expectedOutput: 'A list of 5 papers with summaries',
 *   priority: TaskPriority.HIGH,
 *   timeout: 30000,
 *   retries: 2,
 * });
 *
 * task.assignAgent('researcher');
 * const input = task.toTaskInput();
 * const crewTask = task.toCrewTask();
 * ```
 */
export class Task {
  /** Unique identifier. */
  public readonly id: string;

  /** Task description. */
  public readonly description: string;

  /** Expected output format description. */
  public readonly expectedOutput: string;

  /** Maximum execution time in milliseconds, or 0 for no limit. */
  public readonly timeout: number;

  /** Maximum retry attempts on failure. */
  public readonly retries: number;

  /** Per-task retry policy overrides, or `undefined` if using wrapper defaults. */
  public readonly retryPolicy: Readonly<RetryPolicy> | undefined;

  /** Scheduling priority. */
  public readonly priority: TaskPriority;

  private readonly _context: Readonly<Record<string, unknown>>;
  private readonly _dependencies: readonly string[];
  private readonly _metadata: Readonly<Record<string, unknown>>;
  private readonly _emitter: EventEmitter<TaskEventMap>;
  private _agentId: string | undefined;
  private _status: TaskStatus;
  private _result: TaskResult | undefined;
  private _error: Error | undefined;

  constructor(config: TaskConfig) {
    try {
      const parsed = TaskConfigSchema.parse(config);

      this.id = parsed.id;
      this.description = parsed.description;
      this.expectedOutput = parsed.expectedOutput ?? '';
      this.timeout = parsed.timeout ?? 0;
      this.retries = parsed.retries ?? 0;
      this.retryPolicy = parsed.retryPolicy
        ? ({ ...parsed.retryPolicy } as Readonly<RetryPolicy>)
        : undefined;
      this.priority = parsed.priority ?? TaskPriority.MEDIUM;

      this._agentId = parsed.agentId;
      this._context = parsed.context ? { ...parsed.context } : {};
      this._dependencies = parsed.dependencies ? [...parsed.dependencies] : [];
      this._metadata = parsed.metadata ? { ...parsed.metadata } : {};
      this._emitter = new EventEmitter<TaskEventMap>();
      this._status = TaskStatus.PENDING;
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => e.message).join('; ');
        throw new TaskConfigError(messages, typeof config.id === 'string' ? config.id : undefined);
      }
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // Read-only accessors
  // -------------------------------------------------------------------------

  /** Current lifecycle status. */
  get status(): TaskStatus {
    return this._status;
  }

  /** ID of the assigned agent, or `undefined` if unassigned. */
  get agentId(): string | undefined {
    return this._agentId;
  }

  /** Read-only context data. */
  get context(): Readonly<Record<string, unknown>> {
    return this._context;
  }

  /** Read-only dependency IDs. */
  get dependencies(): readonly string[] {
    return this._dependencies;
  }

  /** Read-only metadata. */
  get metadata(): Readonly<Record<string, unknown>> {
    return this._metadata;
  }

  /** The task result, available after completion. */
  get result(): TaskResult | undefined {
    return this._result;
  }

  /** The error, available after failure. */
  get error(): Error | undefined {
    return this._error;
  }

  /** Whether the task has been assigned to an agent. */
  get isAssigned(): boolean {
    return this._agentId !== undefined;
  }

  // -------------------------------------------------------------------------
  // Agent assignment
  // -------------------------------------------------------------------------

  /**
   * Assign or reassign this task to an agent.
   *
   * @param agentId - The ID of the agent to assign
   * @throws {TaskConfigError} If the task is currently running
   */
  assignAgent(agentId: string): void {
    if (this._status === TaskStatus.RUNNING) {
      throw new TaskConfigError('Cannot reassign agent while task is running', this.id);
    }

    const result = z
      .string()
      .min(1, 'Agent id must not be empty')
      .regex(TASK_ID_PATTERN, 'Agent id must be alphanumeric (dashes and underscores allowed)')
      .safeParse(agentId);

    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message).join('; ');
      throw new TaskConfigError(messages, this.id);
    }

    this._agentId = agentId;
  }

  // -------------------------------------------------------------------------
  // Status management
  // -------------------------------------------------------------------------

  /**
   * Transition the task to a new status.
   * Validates legal transitions and emits a status-changed event.
   *
   * @param status - The new status
   * @throws {TaskConfigError} If the transition is not allowed
   */
  setStatus(status: TaskStatus): void {
    if (!this._isValidTransition(this._status, status)) {
      throw new TaskConfigError(
        `Invalid status transition from "${this._status}" to "${status}"`,
        this.id,
      );
    }
    this._status = status;
    this._emit('task:status-changed', this.id, status);
  }

  /**
   * Mark the task as completed with a result.
   *
   * @param result - The execution result
   * @throws {TaskConfigError} If the task is not in RUNNING status
   */
  complete(result: TaskResult): void {
    if (this._status !== TaskStatus.RUNNING) {
      throw new TaskConfigError(
        `Cannot complete task in "${this._status}" status (must be "running")`,
        this.id,
      );
    }
    this._result = result;
    this.setStatus(TaskStatus.COMPLETED);
    this._emit('task:complete', this.id, result);
  }

  /**
   * Mark the task as failed with an error.
   *
   * @param error - The error that caused failure
   * @throws {TaskConfigError} If the task is not in RUNNING status
   */
  fail(error: Error): void {
    if (this._status !== TaskStatus.RUNNING) {
      throw new TaskConfigError(
        `Cannot fail task in "${this._status}" status (must be "running")`,
        this.id,
      );
    }
    this._error = error;
    this.setStatus(TaskStatus.FAILED);
    this._emit('task:error', this.id, error);
  }

  /**
   * Cancel the task. Can be called from PENDING or RUNNING states.
   *
   * @throws {TaskConfigError} If the task is in a terminal state
   */
  cancel(): void {
    if (this._status === TaskStatus.COMPLETED || this._status === TaskStatus.CANCELLED) {
      throw new TaskConfigError(`Cannot cancel task in "${this._status}" status`, this.id);
    }
    this.setStatus(TaskStatus.CANCELLED);
  }

  /**
   * Reset the task to PENDING status for re-execution.
   *
   * @throws {TaskConfigError} If the task is currently running
   */
  reset(): void {
    if (this._status === TaskStatus.RUNNING) {
      throw new TaskConfigError('Cannot reset task while running', this.id);
    }
    this._result = undefined;
    this._error = undefined;
    this._status = TaskStatus.PENDING;
    this._emit('task:status-changed', this.id, TaskStatus.PENDING);
  }

  // -------------------------------------------------------------------------
  // Event system (type-safe delegation to EventEmitter)
  // -------------------------------------------------------------------------

  /**
   * Subscribe to a task lifecycle event.
   *
   * @param event    - Event name
   * @param listener - Callback
   */
  on<E extends keyof TaskEventMap>(event: E, listener: TaskEventMap[E]): this {
    this._emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Unsubscribe from a task lifecycle event.
   *
   * @param event    - Event name
   * @param listener - Callback to remove
   */
  off<E extends keyof TaskEventMap>(event: E, listener: TaskEventMap[E]): this {
    this._emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Subscribe to a task lifecycle event (fires once).
   *
   * @param event    - Event name
   * @param listener - Callback
   */
  once<E extends keyof TaskEventMap>(event: E, listener: TaskEventMap[E]): this {
    this._emitter.once(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Emit a task lifecycle event.
   *
   * Primarily used by execution infrastructure (e.g., {@link TaskExecutionWrapper})
   * to signal retry and timeout events.
   *
   * @param event - Event name
   * @param args  - Event arguments
   */
  emit<E extends keyof TaskEventMap>(event: E, ...args: Parameters<TaskEventMap[E]>): void {
    this._emit(event, ...args);
  }

  // -------------------------------------------------------------------------
  // Conversion helpers
  // -------------------------------------------------------------------------

  /**
   * Convert to a {@link TaskInput} suitable for {@link Agent.execute}.
   *
   * @returns A TaskInput derived from this task's config
   */
  toTaskInput(): TaskInput {
    const input: TaskInput = {
      description: this.description,
      ...(this.expectedOutput ? { expectedOutput: this.expectedOutput } : {}),
      ...(Object.keys(this._context).length > 0 ? { context: this._context } : {}),
    };
    return input;
  }

  /**
   * Convert to a {@link CrewTask} for use in a {@link Crew} workflow.
   *
   * @returns A CrewTask derived from this task's config
   * @throws {TaskConfigError} If no agent is assigned
   */
  toCrewTask(): CrewTask {
    if (!this._agentId) {
      throw new TaskConfigError('Cannot convert to CrewTask without an assigned agent', this.id);
    }

    const crewTask: CrewTask = {
      id: this.id,
      description: this.description,
      agentId: this._agentId,
      ...(this.expectedOutput ? { expectedOutput: this.expectedOutput } : {}),
      ...(Object.keys(this._context).length > 0 ? { context: this._context } : {}),
      ...(this._dependencies.length > 0 ? { dependencies: this._dependencies } : {}),
    };

    return crewTask;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /** Check whether a status transition is valid. */
  private _isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
    const VALID_TRANSITIONS: ReadonlyMap<TaskStatus, readonly TaskStatus[]> = new Map([
      [TaskStatus.PENDING, [TaskStatus.RUNNING, TaskStatus.CANCELLED]],
      [TaskStatus.RUNNING, [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]],
      [TaskStatus.COMPLETED, [TaskStatus.PENDING]], // allow reset
      [TaskStatus.FAILED, [TaskStatus.PENDING, TaskStatus.CANCELLED]], // allow reset or cancel
      [TaskStatus.CANCELLED, [TaskStatus.PENDING]], // allow reset
    ]);

    return VALID_TRANSITIONS.get(from)?.includes(to) ?? false;
  }

  /** Type-safe event emission helper. */
  private _emit<E extends keyof TaskEventMap>(
    event: E,
    ...args: Parameters<TaskEventMap[E]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._emitter.emit as (event: string, ...args: any[]) => boolean)(event, ...args);
  }
}
