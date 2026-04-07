/**
 * Core ExecutionEngine — orchestrates task execution with strategies,
 * retries, timeouts, cancellation, and middleware hooks.
 *
 * The engine takes a set of {@link Task} objects and {@link Agent} instances,
 * resolves the dependency graph, and executes tasks using the configured
 * strategy (sequential or parallel). It provides a rich event system and
 * middleware hooks for cross-cutting concerns like logging and metrics.
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'eventemitter3';
import { z, ZodError } from 'zod';

import type { Agent } from '../agent/agent.js';
import { EngineConfigError, EngineExecutionError } from '../errors/engine-errors.js';
import { TaskTimeoutError } from '../errors/task-errors.js';
import { DeadLetterQueue } from '../task/dead-letter-queue.js';
import type { DeadLetterQueueConfig } from '../task/dead-letter-queue.js';
import type { Task } from '../task/task.js';
import { TaskContextManager } from '../task/task-context-manager.js';
import type { TaskInput, TaskResult } from '../types/task.js';
import { TaskStatus } from '../types/task.js';
import type {
  AfterTaskHook,
  BeforeTaskHook,
  EngineEventMap,
  EngineRunResult,
  ExecutionEngineConfig,
  OnTaskErrorHook,
  TaskErrorPolicy,
} from './types.js';
import { EngineStatus, ExecutionStrategy } from './types.js';

// ---------------------------------------------------------------------------
// Zod schema for runtime validation
// ---------------------------------------------------------------------------

const ENGINE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_CONCURRENCY_UPPER_BOUND = 100;
const MAX_GLOBAL_TIMEOUT_MS = 3_600_000; // 1 hour

const ExecutionEngineConfigSchema = z.object({
  id: z
    .string()
    .min(1, 'Engine id must not be empty')
    .regex(ENGINE_ID_PATTERN, 'Engine id must be alphanumeric (dashes and underscores allowed)'),
  strategy: z.nativeEnum(ExecutionStrategy).optional(),
  maxConcurrency: z
    .number()
    .int()
    .positive('maxConcurrency must be positive')
    .max(
      MAX_CONCURRENCY_UPPER_BOUND,
      `maxConcurrency must be ≤ ${String(MAX_CONCURRENCY_UPPER_BOUND)}`,
    )
    .optional(),
  globalTimeout: z
    .number()
    .int()
    .positive('globalTimeout must be positive')
    .max(MAX_GLOBAL_TIMEOUT_MS, `globalTimeout must be ≤ ${String(MAX_GLOBAL_TIMEOUT_MS)}ms`)
    .optional(),
  taskErrorPolicy: z.enum(['fail-fast', 'continue']).optional(),
  verbose: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const BASE_RETRY_DELAY_MS = 100;
const MAX_RETRY_DELAY_MS = 5_000;

/**
 * Compute exponential backoff delay with jitter.
 * delay = min(base * 2^attempt + jitter, maxDelay)
 */
function computeRetryDelay(attempt: number): number {
  const exponential = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * BASE_RETRY_DELAY_MS;
  return Math.min(exponential + jitter, MAX_RETRY_DELAY_MS);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ---------------------------------------------------------------------------
// ExecutionEngine class
// ---------------------------------------------------------------------------

/**
 * An execution engine that orchestrates task workflows.
 *
 * @example
 * ```typescript
 * const engine = new ExecutionEngine({
 *   id: 'my-engine',
 *   strategy: ExecutionStrategy.PARALLEL,
 *   maxConcurrency: 3,
 *   taskErrorPolicy: 'continue',
 * });
 *
 * engine.addAgent(researcher);
 * engine.addAgent(writer);
 * engine.addTask(researchTask);
 * engine.addTask(writeTask);
 *
 * engine.on('engine:task:complete', (id, taskId, result) => {
 *   console.log(`Task ${taskId} done: ${result.output}`);
 * });
 *
 * const result = await engine.run();
 * ```
 */
export class ExecutionEngine {
  /** Unique identifier. */
  public readonly id: string;

  /** Execution strategy. */
  public readonly strategy: ExecutionStrategy;

  /** Maximum concurrent tasks for parallel strategy. */
  public readonly maxConcurrency: number;

  /** Overall timeout for the entire run in ms, or 0 for no limit. */
  public readonly globalTimeout: number;

  /** Error handling policy. */
  public readonly taskErrorPolicy: TaskErrorPolicy;

  /** Whether verbose logging is enabled. */
  public readonly verbose: boolean;

  private readonly _agents: Map<string, Agent>;
  private readonly _tasks: Map<string, Task>;
  private readonly _emitter: EventEmitter<EngineEventMap>;
  private readonly _beforeHooks: BeforeTaskHook[];
  private readonly _afterHooks: AfterTaskHook[];
  private readonly _errorHooks: OnTaskErrorHook[];
  private readonly _contextManager: TaskContextManager;
  private readonly _dlq: DeadLetterQueue | undefined;
  private _status: EngineStatus;
  private _cancelled: boolean;

  constructor(config: ExecutionEngineConfig) {
    try {
      const parsed = ExecutionEngineConfigSchema.parse(config);

      this.id = parsed.id;
      this.strategy = parsed.strategy ?? ExecutionStrategy.SEQUENTIAL;
      this.maxConcurrency = parsed.maxConcurrency ?? Infinity;
      this.globalTimeout = parsed.globalTimeout ?? 0;
      this.taskErrorPolicy = parsed.taskErrorPolicy ?? 'fail-fast';
      this.verbose = parsed.verbose ?? false;

      this._agents = new Map<string, Agent>();
      this._tasks = new Map<string, Task>();
      this._emitter = new EventEmitter<EngineEventMap>();
      this._beforeHooks = [];
      this._afterHooks = [];
      this._errorHooks = [];
      this._contextManager = new TaskContextManager(config.contextManager);
      this._dlq = this._createDLQ(config.deadLetterQueue);
      this._status = EngineStatus.IDLE;
      this._cancelled = false;
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => e.message).join('; ');
        throw new EngineConfigError(
          messages,
          typeof config.id === 'string' ? config.id : undefined,
        );
      }
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // Read-only accessors
  // -------------------------------------------------------------------------

  /** Current lifecycle status. */
  get status(): EngineStatus {
    return this._status;
  }

  /** Read-only view of registered tasks. */
  get tasks(): ReadonlyMap<string, Task> {
    return this._tasks;
  }

  /** Read-only view of registered agents. */
  get agents(): ReadonlyMap<string, Agent> {
    return this._agents;
  }

  /** The context manager used for dependency result propagation. */
  get contextManager(): TaskContextManager {
    return this._contextManager;
  }

  /**
   * The dead letter queue, or `undefined` if DLQ is not enabled.
   *
   * Tasks that exhaust all retries are automatically enqueued here
   * when DLQ is configured via {@link ExecutionEngineConfig.deadLetterQueue}.
   */
  get deadLetterQueue(): DeadLetterQueue | undefined {
    return this._dlq;
  }

  // -------------------------------------------------------------------------
  // Task & agent management
  // -------------------------------------------------------------------------

  /**
   * Register a task for execution.
   *
   * @param task - The task to add
   * @throws {EngineConfigError} If a task with the same ID already exists or engine is running
   */
  addTask(task: Task): this {
    if (this._status === EngineStatus.RUNNING) {
      throw new EngineConfigError('Cannot add tasks while engine is running', this.id);
    }
    if (this._tasks.has(task.id)) {
      throw new EngineConfigError(`Task "${task.id}" is already registered`, this.id);
    }
    this._tasks.set(task.id, task);
    return this;
  }

  /**
   * Register an agent for task execution.
   *
   * @param agent - The agent to add
   * @throws {EngineConfigError} If an agent with the same ID already exists or engine is running
   */
  addAgent(agent: Agent): this {
    if (this._status === EngineStatus.RUNNING) {
      throw new EngineConfigError('Cannot add agents while engine is running', this.id);
    }
    if (this._agents.has(agent.id)) {
      throw new EngineConfigError(`Agent "${agent.id}" is already registered`, this.id);
    }
    this._agents.set(agent.id, agent);
    return this;
  }

  /**
   * Remove a task by ID.
   *
   * @param taskId - Task ID to remove
   * @throws {EngineConfigError} If the engine is running
   */
  removeTask(taskId: string): boolean {
    if (this._status === EngineStatus.RUNNING) {
      throw new EngineConfigError('Cannot remove tasks while engine is running', this.id);
    }
    return this._tasks.delete(taskId);
  }

  /**
   * Remove an agent by ID.
   *
   * @param agentId - Agent ID to remove
   * @throws {EngineConfigError} If the engine is running
   */
  removeAgent(agentId: string): boolean {
    if (this._status === EngineStatus.RUNNING) {
      throw new EngineConfigError('Cannot remove agents while engine is running', this.id);
    }
    return this._agents.delete(agentId);
  }

  // -------------------------------------------------------------------------
  // Middleware hooks
  // -------------------------------------------------------------------------

  /**
   * Register a hook to run before each task execution.
   *
   * @param hook - Async or sync callback
   */
  beforeTask(hook: BeforeTaskHook): this {
    this._beforeHooks.push(hook);
    return this;
  }

  /**
   * Register a hook to run after each successful task execution.
   *
   * @param hook - Async or sync callback
   */
  afterTask(hook: AfterTaskHook): this {
    this._afterHooks.push(hook);
    return this;
  }

  /**
   * Register a hook to run when a task encounters an error.
   *
   * @param hook - Async or sync callback
   */
  onTaskError(hook: OnTaskErrorHook): this {
    this._errorHooks.push(hook);
    return this;
  }

  // -------------------------------------------------------------------------
  // Event system (type-safe delegation to EventEmitter)
  // -------------------------------------------------------------------------

  /**
   * Subscribe to an engine lifecycle event.
   *
   * @param event    - Event name
   * @param listener - Callback
   */
  on<E extends keyof EngineEventMap>(event: E, listener: EngineEventMap[E]): this {
    this._emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Unsubscribe from an engine lifecycle event.
   *
   * @param event    - Event name
   * @param listener - Callback to remove
   */
  off<E extends keyof EngineEventMap>(event: E, listener: EngineEventMap[E]): this {
    this._emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Subscribe to an engine lifecycle event (fires once).
   *
   * @param event    - Event name
   * @param listener - Callback
   */
  once<E extends keyof EngineEventMap>(event: E, listener: EngineEventMap[E]): this {
    this._emitter.once(event, listener as (...args: unknown[]) => void);
    return this;
  }

  // -------------------------------------------------------------------------
  // Execution
  // -------------------------------------------------------------------------

  /**
   * Execute the registered tasks using the configured strategy.
   *
   * @returns The aggregated results of all tasks
   * @throws {EngineExecutionError} If the engine is already running or validation fails
   */
  async run(): Promise<EngineRunResult> {
    if (this._status === EngineStatus.RUNNING) {
      throw new EngineExecutionError(this.id, 'Engine is already running');
    }

    this._validateBeforeRun();
    this._cancelled = false;
    this._contextManager.clear();
    this._setStatus(EngineStatus.RUNNING);
    this._emit('engine:start', this.id);

    const startTime = Date.now();
    const taskResults = new Map<string, TaskResult>();
    const failedTasks = new Map<string, Error>();

    try {
      const runPromise =
        this.strategy === ExecutionStrategy.PARALLEL
          ? this._runParallel(taskResults, failedTasks)
          : this._runSequential(taskResults, failedTasks);

      if (this.globalTimeout > 0) {
        await this._withGlobalTimeout(runPromise);
      } else {
        await runPromise;
      }

      // _cancelled may be set during async execution (e.g., by cancel() called from event handlers)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (this._cancelled) {
        this._setStatus(EngineStatus.CANCELLED);
        this._emit('engine:cancelled', this.id);
        const cancelResult: EngineRunResult = {
          ...this._buildResult(taskResults, failedTasks, startTime),
          success: false,
        };
        return cancelResult;
      }

      const hasFailures = failedTasks.size > 0;
      this._setStatus(hasFailures ? EngineStatus.ERROR : EngineStatus.COMPLETED);

      const result = this._buildResult(taskResults, failedTasks, startTime);

      if (hasFailures) {
        this._emit(
          'engine:error',
          this.id,
          new EngineExecutionError(this.id, `${String(failedTasks.size)} task(s) failed`),
        );
      }

      this._emit('engine:complete', this.id, result);
      return result;
    } catch (error) {
      this._setStatus(EngineStatus.ERROR);
      const wrappedError = error instanceof Error ? error : new Error(String(error));
      this._emit('engine:error', this.id, wrappedError);

      if (error instanceof EngineExecutionError) {
        throw error;
      }
      throw new EngineExecutionError(this.id, wrappedError.message, undefined, wrappedError);
    }
  }

  /**
   * Cancel a running engine execution.
   * Tasks currently executing will complete, but no new tasks will start.
   */
  cancel(): void {
    if (this._status !== EngineStatus.RUNNING) {
      return;
    }
    this._cancelled = true;
  }

  /**
   * Reset the engine to IDLE so it can be run again.
   * Clears registered tasks and agents. Retains hooks and config.
   *
   * @throws {EngineConfigError} If the engine is currently running
   */
  reset(): void {
    if (this._status === EngineStatus.RUNNING) {
      throw new EngineConfigError('Cannot reset while engine is running', this.id);
    }
    this._tasks.clear();
    this._agents.clear();
    this._contextManager.clear();
    this._cancelled = false;
    this._setStatus(EngineStatus.IDLE);
  }

  // -------------------------------------------------------------------------
  // Sequential execution
  // -------------------------------------------------------------------------

  private async _runSequential(
    taskResults: Map<string, TaskResult>,
    failedTasks: Map<string, Error>,
  ): Promise<void> {
    const executionOrder = this._topologicalSort();

    for (const task of executionOrder) {
      if (this._cancelled) {
        return;
      }

      if (this._hasDependencyFailure(task, failedTasks)) {
        const depError = new EngineExecutionError(
          this.id,
          'Skipped due to failed dependency',
          task.id,
        );
        failedTasks.set(task.id, depError);
        this._emit('engine:task:error', this.id, task.id, depError);
        continue;
      }

      try {
        const result = await this._executeTask(task, taskResults);
        taskResults.set(task.id, result);
      } catch (error) {
        // _cancelled may be set during async task execution
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this._cancelled) {
          return;
        }

        const wrappedError = error instanceof Error ? error : new Error(String(error));
        failedTasks.set(task.id, wrappedError);

        if (this.taskErrorPolicy === 'fail-fast') {
          throw new EngineExecutionError(this.id, wrappedError.message, task.id, wrappedError);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Parallel execution
  // -------------------------------------------------------------------------

  private async _runParallel(
    taskResults: Map<string, TaskResult>,
    failedTasks: Map<string, Error>,
  ): Promise<void> {
    const { inDegree, adjacency, taskMap } = this._buildDependencyGraph();

    // Find initial ready tasks (in-degree = 0)
    const readyQueue: string[] = [];
    for (const [taskId, degree] of inDegree) {
      if (degree === 0) {
        readyQueue.push(taskId);
      }
    }

    let activeTasks = 0;
    let completedCount = 0;
    const totalTasks = this._tasks.size;

    // Use a promise-based concurrency loop
    return new Promise<void>((resolve, reject) => {
      let resolved = false;

      const checkCompletion = (): void => {
        if (resolved) return;
        if (completedCount >= totalTasks || (this._cancelled && activeTasks === 0)) {
          resolved = true;
          resolve();
        }
      };

      const scheduleReady = (): void => {
        while (
          readyQueue.length > 0 &&
          activeTasks < this.maxConcurrency &&
          !this._cancelled &&
          !resolved
        ) {
          const taskId = readyQueue.shift();
          if (!taskId) continue;
          const task = taskMap.get(taskId);
          if (!task) continue;

          if (this._hasDependencyFailure(task, failedTasks)) {
            const depError = new EngineExecutionError(
              this.id,
              'Skipped due to failed dependency',
              task.id,
            );
            failedTasks.set(task.id, depError);
            this._emit('engine:task:error', this.id, task.id, depError);
            completedCount++;
            this._unlockDependents(taskId, adjacency, inDegree, readyQueue);
            checkCompletion();
            continue;
          }

          activeTasks++;

          this._executeTask(task, taskResults)
            .then((result) => {
              taskResults.set(task.id, result);
              activeTasks--;
              completedCount++;
              this._unlockDependents(taskId, adjacency, inDegree, readyQueue);
              scheduleReady();
              checkCompletion();
            })
            .catch((error: unknown) => {
              const wrappedError = error instanceof Error ? error : new Error(String(error));
              failedTasks.set(task.id, wrappedError);
              activeTasks--;
              completedCount++;

              if (this.taskErrorPolicy === 'fail-fast' && !resolved) {
                resolved = true;
                reject(
                  new EngineExecutionError(this.id, wrappedError.message, task.id, wrappedError),
                );
                return;
              }

              this._unlockDependents(taskId, adjacency, inDegree, readyQueue);
              scheduleReady();
              checkCompletion();
            });
        }

        // If nothing is running and nothing is ready, we're done
        if (activeTasks === 0 && readyQueue.length === 0 && !resolved) {
          resolved = true;
          resolve();
        }
      };

      scheduleReady();
    });
  }

  // -------------------------------------------------------------------------
  // Single task execution (with retries & timeout)
  // -------------------------------------------------------------------------

  private async _executeTask(
    task: Task,
    _completedResults: ReadonlyMap<string, TaskResult>,
  ): Promise<TaskResult> {
    const agentId = task.agentId;
    if (!agentId) {
      throw new EngineExecutionError(this.id, 'Task has no assigned agent', task.id);
    }

    const agent = this._agents.get(agentId);
    if (!agent) {
      throw new EngineExecutionError(this.id, `Agent "${agentId}" not found`, task.id);
    }

    // Run before-hooks
    await this._runBeforeHooks(task, agent);

    this._emit('engine:task:start', this.id, task.id, agentId);
    task.setStatus(TaskStatus.RUNNING);

    const maxAttempts = task.retries + 1;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (this._cancelled) {
        task.cancel();
        throw new EngineExecutionError(this.id, 'Cancelled', task.id);
      }

      if (attempt > 0) {
        this._emit('engine:task:retry', this.id, task.id, attempt, task.retries);
        await delay(computeRetryDelay(attempt - 1));
      }

      try {
        const taskInput = this._contextManager.buildTaskInput(task);
        let result: TaskResult;

        if (task.timeout > 0) {
          result = await this._withTaskTimeout(agent, taskInput, task);
        } else {
          result = await agent.execute(taskInput);
        }

        // Store result in context manager for downstream dependents
        this._contextManager.setResult(task.id, result);

        task.complete(result);
        this._emit('engine:task:complete', this.id, task.id, result);

        // Run after-hooks
        await this._runAfterHooks(task, agent, result);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on timeout or cancellation
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (error instanceof TaskTimeoutError || this._cancelled) {
          break;
        }
      }
    }

    // All attempts exhausted — task failed
    const finalError = lastError ?? new Error('Unknown error');
    task.fail(finalError);
    this._emit('engine:task:error', this.id, task.id, finalError);

    // Auto-enqueue into dead letter queue if configured
    if (this._dlq) {
      const attempts = task.retries + 1;
      const context = Object.fromEntries(
        [..._completedResults.entries()],
      );
      this._dlq.enqueue(task, finalError, { attempts, context });
      this._emit('engine:task:dead-lettered', this.id, task.id, finalError, attempts);
    }

    // Run error hooks
    await this._runErrorHooks(task, finalError);

    throw new EngineExecutionError(this.id, finalError.message, task.id, finalError);
  }

  // -------------------------------------------------------------------------
  // Timeout handling
  // -------------------------------------------------------------------------

  private async _withTaskTimeout(
    agent: Agent,
    taskInput: TaskInput,
    task: Task,
  ): Promise<TaskResult> {
    return new Promise<TaskResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        const timeoutError = new TaskTimeoutError(task.id, task.timeout, task.agentId);
        this._emit('engine:task:timeout', this.id, task.id, task.timeout);
        reject(timeoutError);
      }, task.timeout);

      agent
        .execute(taskInput)
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error: unknown) => {
          clearTimeout(timer);
          reject(error instanceof Error ? error : new Error(String(error)));
        });
    });
  }

  private async _withGlobalTimeout(runPromise: Promise<void>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this._cancelled = true;
        reject(
          new EngineExecutionError(
            this.id,
            `Global timeout exceeded (${String(this.globalTimeout)}ms)`,
          ),
        );
      }, this.globalTimeout);

      runPromise
        .then(() => {
          clearTimeout(timer);
          resolve();
        })
        .catch((error: unknown) => {
          clearTimeout(timer);
          reject(error instanceof Error ? error : new Error(String(error)));
        });
    });
  }

  // -------------------------------------------------------------------------
  // Hook execution
  // -------------------------------------------------------------------------

  private async _runBeforeHooks(task: Task, agent: Agent): Promise<void> {
    for (const hook of this._beforeHooks) {
      await hook(task, agent);
    }
  }

  private async _runAfterHooks(task: Task, agent: Agent, result: TaskResult): Promise<void> {
    for (const hook of this._afterHooks) {
      await hook(task, agent, result);
    }
  }

  private async _runErrorHooks(task: Task, error: Error): Promise<void> {
    for (const hook of this._errorHooks) {
      await hook(task, error);
    }
  }

  // -------------------------------------------------------------------------
  // Dependency graph helpers
  // -------------------------------------------------------------------------

  private _buildDependencyGraph(): {
    inDegree: Map<string, number>;
    adjacency: Map<string, string[]>;
    taskMap: Map<string, Task>;
  } {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();
    const taskMap = new Map<string, Task>();

    for (const [taskId, task] of this._tasks) {
      taskMap.set(taskId, task);
      inDegree.set(taskId, 0);
      adjacency.set(taskId, []);
    }

    for (const [, task] of this._tasks) {
      for (const depId of task.dependencies) {
        const depAdj = adjacency.get(depId);
        if (depAdj) {
          depAdj.push(task.id);
          inDegree.set(task.id, (inDegree.get(task.id) ?? 0) + 1);
        }
      }
    }

    return { inDegree, adjacency, taskMap };
  }

  /** Topological sort using Kahn's algorithm. */
  private _topologicalSort(): Task[] {
    const { inDegree, adjacency, taskMap } = this._buildDependencyGraph();

    const queue: string[] = [];
    for (const [taskId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(taskId);
      }
    }

    const sorted: Task[] = [];
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;

      const task = taskMap.get(current);
      if (task) {
        sorted.push(task);
      }

      for (const neighbor of adjacency.get(current) ?? []) {
        const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    return sorted;
  }

  /** Decrement in-degree for dependents and enqueue those that become ready. */
  private _unlockDependents(
    completedTaskId: string,
    adjacency: Map<string, string[]>,
    inDegree: Map<string, number>,
    readyQueue: string[],
  ): void {
    for (const neighbor of adjacency.get(completedTaskId) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        readyQueue.push(neighbor);
      }
    }
  }

  /** Check if any dependency of a task has failed. */
  private _hasDependencyFailure(task: Task, failedTasks: ReadonlyMap<string, Error>): boolean {
    for (const depId of task.dependencies) {
      if (failedTasks.has(depId)) {
        return true;
      }
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  /** Validate engine state before running. */
  private _validateBeforeRun(): void {
    if (this._tasks.size === 0) {
      throw new EngineConfigError('Engine has no tasks to execute', this.id);
    }
    if (this._agents.size === 0) {
      throw new EngineConfigError('Engine has no agents registered', this.id);
    }

    // Validate all tasks have assigned agents that exist
    for (const [, task] of this._tasks) {
      if (!task.agentId) {
        throw new EngineConfigError(`Task "${task.id}" has no assigned agent`, this.id);
      }
      if (!this._agents.has(task.agentId)) {
        throw new EngineConfigError(
          `Task "${task.id}" references unknown agent "${task.agentId}"`,
          this.id,
        );
      }
    }

    // Validate dependency references
    for (const [, task] of this._tasks) {
      for (const depId of task.dependencies) {
        if (!this._tasks.has(depId)) {
          throw new EngineConfigError(
            `Task "${task.id}" depends on unknown task "${depId}"`,
            this.id,
          );
        }
        if (depId === task.id) {
          throw new EngineConfigError(`Task "${task.id}" cannot depend on itself`, this.id);
        }
      }
    }

    // Detect circular dependencies
    this._detectCycles();
  }

  /** Detect circular dependencies in the task graph. */
  private _detectCycles(): void {
    const WHITE = 0;
    const GRAY = 1;
    const BLACK = 2;
    const color = new Map<string, number>();

    const adjacency = new Map<string, string[]>();
    for (const [taskId] of this._tasks) {
      color.set(taskId, WHITE);
      adjacency.set(taskId, []);
    }

    for (const [, task] of this._tasks) {
      for (const depId of task.dependencies) {
        const depAdj = adjacency.get(depId);
        if (depAdj) {
          depAdj.push(task.id);
        }
      }
    }

    const dfs = (nodeId: string): boolean => {
      color.set(nodeId, GRAY);
      for (const neighbor of adjacency.get(nodeId) ?? []) {
        const neighborColor = color.get(neighbor);
        if (neighborColor === GRAY) {
          return true;
        }
        if (neighborColor === WHITE && dfs(neighbor)) {
          return true;
        }
      }
      color.set(nodeId, BLACK);
      return false;
    };

    for (const [taskId] of this._tasks) {
      if (color.get(taskId) === WHITE && dfs(taskId)) {
        throw new EngineConfigError('Circular dependency detected in task graph', this.id);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  private _buildResult(
    taskResults: Map<string, TaskResult>,
    failedTasks: Map<string, Error>,
    startTime: number,
  ): EngineRunResult {
    return {
      engineId: this.id,
      taskResults,
      failedTasks,
      duration: Date.now() - startTime,
      success: failedTasks.size === 0,
      strategy: this.strategy,
    };
  }

  private _setStatus(status: EngineStatus): void {
    this._status = status;
    this._emit('engine:status-changed', this.id, status);
  }

  /** Create a DLQ from the config option (boolean or config object). */
  private _createDLQ(
    option: DeadLetterQueueConfig | boolean | undefined,
  ): DeadLetterQueue | undefined {
    if (!option) return undefined;
    if (option === true) return new DeadLetterQueue();
    return new DeadLetterQueue(option);
  }

  /** Type-safe event emission helper. */
  private _emit<E extends keyof EngineEventMap>(
    event: E,
    ...args: Parameters<EngineEventMap[E]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._emitter.emit as (event: string, ...args: any[]) => boolean)(event, ...args);
  }
}
