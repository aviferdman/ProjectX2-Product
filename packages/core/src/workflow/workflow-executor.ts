/**
 * Workflow execution service.
 *
 * Provides the {@link WorkflowExecutor} class that ties together workflow
 * storage, usage tracking, and crew execution into a single API. It loads a
 * stored workflow, enforces plan-based limits, constructs a Crew, executes
 * the tasks, and records the run outcome.
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'eventemitter3';

import type { Agent } from '../agent/agent.js';
import { Crew } from '../crew/crew.js';
import { ExecutionStrategy } from '../engine/types.js';
import type { TaskResult } from '../types/task.js';
import type { UsageTracker } from '../usage/usage-tracker.js';
import { WorkflowNotFoundError } from './workflow-errors.js';
import {
  WorkflowExecutionCancelledError,
  WorkflowExecutionFailedError,
  WorkflowExecutionTimeoutError,
  WorkflowNoAgentsError,
  WorkflowNotActiveError,
} from './workflow-execution-errors.js';
import type {
  WorkflowExecutionEventMap,
  WorkflowExecutionOptions,
  WorkflowExecutionResult,
  WorkflowTaskResult,
} from './workflow-execution-types.js';
import type { StoredWorkflow, WorkflowStorageProvider } from './workflow-storage-types.js';

// ---------------------------------------------------------------------------
// Agent resolver
// ---------------------------------------------------------------------------

/**
 * Resolves agent definitions from a stored workflow into live Agent instances.
 *
 * Implementations may create new agents on demand, look them up from a
 * registry, or return pre-configured agents with LLM providers attached.
 */
export type AgentResolver = (
  agentDefinitions: StoredWorkflow['agents'],
) => Agent[] | Promise<Agent[]>;

// ---------------------------------------------------------------------------
// Run ID generation
// ---------------------------------------------------------------------------

let _runCounter = 0;

function generateRunId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  _runCounter += 1;
  return `run_${timestamp}_${random}_${String(_runCounter)}`;
}

/** Reset the internal counter (for testing only). */
export function _resetRunCounter(): void {
  _runCounter = 0;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Configuration for the {@link WorkflowExecutor}. */
export interface WorkflowExecutorConfig {
  /** Storage provider for loading workflow definitions. */
  readonly storage: WorkflowStorageProvider;

  /**
   * Resolves stored agent definitions into live Agent instances.
   * Required for actually executing workflows.
   */
  readonly agentResolver: AgentResolver;

  /**
   * Optional usage tracker for enforcing plan limits and recording runs.
   * When omitted, workflows execute without usage tracking.
   */
  readonly usageTracker?: UsageTracker;

  /**
   * Whether to require workflow status to be 'active' before execution.
   * When false, draft workflows can also be executed.
   * Default: true.
   */
  readonly requireActive?: boolean;
}

// ---------------------------------------------------------------------------
// WorkflowExecutor
// ---------------------------------------------------------------------------

/**
 * Service for executing stored workflows.
 *
 * Orchestrates the full lifecycle: load workflow → check limits → resolve
 * agents → build crew → execute → record run → return result.
 *
 * Emits typed events for real-time monitoring of execution progress.
 *
 * @example
 * ```typescript
 * import {
 *   WorkflowExecutor,
 *   InMemoryWorkflowStorage,
 * } from '@crewspace/core';
 *
 * const executor = new WorkflowExecutor({
 *   storage: new InMemoryWorkflowStorage(),
 *   agentResolver: (defs) => defs.map(d => new Agent({ id: d.id, role: d.role, goal: d.goal })),
 * });
 *
 * const result = await executor.execute('wf_abc123');
 * console.log(result.success); // true
 * ```
 */
export class WorkflowExecutor {
  private readonly _storage: WorkflowStorageProvider;
  private readonly _agentResolver: AgentResolver;
  private readonly _usageTracker: UsageTracker | undefined;
  private readonly _requireActive: boolean;
  private readonly _emitter = new EventEmitter<WorkflowExecutionEventMap>();
  private readonly _activeRuns = new Map<string, { cancelled: boolean }>();

  constructor(config: WorkflowExecutorConfig) {
    this._storage = config.storage;
    this._agentResolver = config.agentResolver;
    this._usageTracker = config.usageTracker;
    this._requireActive = config.requireActive ?? true;
  }

  // -------------------------------------------------------------------------
  // Event system
  // -------------------------------------------------------------------------

  /** Subscribe to an execution event. */
  on<E extends keyof WorkflowExecutionEventMap>(
    event: E,
    listener: WorkflowExecutionEventMap[E],
  ): this {
    this._emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /** Unsubscribe from an execution event. */
  off<E extends keyof WorkflowExecutionEventMap>(
    event: E,
    listener: WorkflowExecutionEventMap[E],
  ): this {
    this._emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /** Subscribe to an execution event (fires once). */
  once<E extends keyof WorkflowExecutionEventMap>(
    event: E,
    listener: WorkflowExecutionEventMap[E],
  ): this {
    this._emitter.once(event, listener as (...args: unknown[]) => void);
    return this;
  }

  // -------------------------------------------------------------------------
  // Read-only state
  // -------------------------------------------------------------------------

  /** Number of currently active execution runs. */
  get activeRunCount(): number {
    return this._activeRuns.size;
  }

  /** IDs of currently active execution runs. */
  get activeRunIds(): readonly string[] {
    return Array.from(this._activeRuns.keys());
  }

  // -------------------------------------------------------------------------
  // Execution
  // -------------------------------------------------------------------------

  /**
   * Execute a stored workflow by ID.
   *
   * @param workflowId - ID of the workflow to execute
   * @param options    - Optional execution configuration
   * @returns The execution result with task outputs and timing
   *
   * @throws {WorkflowNotFoundError} If the workflow does not exist
   * @throws {WorkflowNotActiveError} If requireActive is true and workflow is not active
   * @throws {WorkflowNoAgentsError} If agent resolution produces no agents
   * @throws {WorkflowExecutionFailedError} If execution fails
   * @throws {WorkflowExecutionTimeoutError} If execution exceeds the timeout
   * @throws {WorkflowExecutionCancelledError} If execution is cancelled
   */
  async execute(
    workflowId: string,
    options?: WorkflowExecutionOptions,
  ): Promise<WorkflowExecutionResult> {
    const runId = generateRunId();
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    this._activeRuns.set(runId, { cancelled: false });

    try {
      // 1. Load workflow
      const workflow = await this._storage.get(workflowId);
      if (!workflow) {
        throw new WorkflowNotFoundError(workflowId);
      }

      // 2. Check workflow status
      if (this._requireActive && workflow.status !== 'active') {
        throw new WorkflowNotActiveError(workflowId, workflow.status);
      }

      // 3. Record run start (usage tracking)
      let usageRunId: string | undefined;
      if (this._usageTracker && options?.accountId) {
        const runInput: { accountId: string; workflowId: string; metadata?: Readonly<Record<string, unknown>> } = {
          accountId: options.accountId,
          workflowId,
        };
        if (options?.metadata !== undefined) {
          runInput.metadata = options.metadata;
        }
        const usageRun = await this._usageTracker.recordRun(runInput);
        usageRunId = usageRun.id;
      }

      // 4. Check cancellation
      if (this._activeRuns.get(runId)?.cancelled) {
        await this._completeUsageRun(usageRunId, 'cancelled');
        throw new WorkflowExecutionCancelledError(runId);
      }

      // 5. Resolve agents
      const agents = await this._agentResolver(workflow.agents);
      if (!agents || agents.length === 0) {
        await this._completeUsageRun(usageRunId, 'failed');
        throw new WorkflowNoAgentsError(workflowId);
      }

      // 6. Build and execute crew
      this._emit('execution:start', runId, workflowId);

      const strategy = options?.strategy ?? ExecutionStrategy.SEQUENTIAL;
      const result = await this._executeCrew(
        runId,
        workflow,
        agents,
        strategy,
        options?.timeout,
        options?.verbose,
      );

      // 7. Record run completion
      const finishedAt = new Date().toISOString();
      const durationMs = Date.now() - startTime;

      const executionResult: WorkflowExecutionResult = {
        runId,
        workflowId,
        status: result.success ? 'completed' : 'failed',
        taskResults: result.taskResults,
        durationMs,
        startedAt,
        finishedAt,
        success: result.success,
        strategy,
        ...(result.error !== undefined ? { error: result.error } : {}),
        ...(options?.metadata !== undefined ? { metadata: options.metadata } : {}),
      };

      await this._completeUsageRun(
        usageRunId,
        result.success ? 'completed' : 'failed',
      );

      this._emit('execution:complete', runId, executionResult);
      return executionResult;
    } catch (error) {
      // Handle known error types without double-wrapping
      if (
        error instanceof WorkflowNotFoundError ||
        error instanceof WorkflowNotActiveError ||
        error instanceof WorkflowNoAgentsError ||
        error instanceof WorkflowExecutionCancelledError ||
        error instanceof WorkflowExecutionTimeoutError
      ) {
        this._emit('execution:error', runId, error);
        throw error;
      }

      // Wrap unexpected errors
      const wrappedError = error instanceof Error ? error : new Error(String(error));
      const execError = new WorkflowExecutionFailedError(
        workflowId,
        runId,
        wrappedError.message,
        wrappedError,
      );
      this._emit('execution:error', runId, execError);
      throw execError;
    } finally {
      this._activeRuns.delete(runId);
    }
  }

  /**
   * Cancel a running workflow execution.
   *
   * @param runId - ID of the run to cancel
   * @returns true if the run was found and cancelled, false if not found
   */
  cancel(runId: string): boolean {
    const run = this._activeRuns.get(runId);
    if (!run) {
      return false;
    }
    run.cancelled = true;
    this._emit('execution:cancelled', runId);
    return true;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Execute the workflow as a Crew, optionally with a timeout.
   */
  private async _executeCrew(
    runId: string,
    workflow: StoredWorkflow,
    agents: Agent[],
    strategy: ExecutionStrategy,
    timeout?: number,
    verbose?: boolean,
  ): Promise<{ success: boolean; taskResults: WorkflowTaskResult[]; error?: string }> {
    const crewTasks = workflow.tasks.map((t) => ({
      id: t.id,
      description: t.description,
      agentId: t.agentId,
      ...(t.expectedOutput !== undefined ? { expectedOutput: t.expectedOutput } : {}),
      ...(t.context !== undefined ? { context: t.context } : {}),
      ...(t.dependencies !== undefined ? { dependencies: t.dependencies } : {}),
    }));
    const crew = new Crew({
      id: `exec_${runId}`,
      name: workflow.name,
      agents,
      tasks: crewTasks,
      ...(verbose !== undefined ? { verbose } : {}),
    });

    // Wire crew events to execution events
    crew.on('crew:task:start', (_crewId, taskId, agentId) => {
      this._emit('execution:task:start', runId, taskId, agentId);
    });

    crew.on('crew:task:complete', (_crewId, taskId, result) => {
      this._emit('execution:task:complete', runId, taskId, result);
    });

    crew.on('crew:task:error', (_crewId, taskId, error) => {
      this._emit('execution:task:error', runId, taskId, error);
    });

    // Execute with optional timeout
    const executionPromise = this._runCrew(crew, strategy);

    if (timeout && timeout > 0) {
      return this._withTimeout(executionPromise, runId, timeout);
    }

    return executionPromise;
  }

  /**
   * Run the crew and collect results.
   */
  private async _runCrew(
    crew: Crew,
    _strategy: ExecutionStrategy,
  ): Promise<{ success: boolean; taskResults: WorkflowTaskResult[]; error?: string }> {
    const taskTimings = new Map<string, number>();
    const taskResults: WorkflowTaskResult[] = [];

    // Track task start times
    crew.on('crew:task:start', (_crewId, taskId) => {
      taskTimings.set(taskId, Date.now());
    });

    try {
      const crewResult = await crew.run();

      // Build task results
      for (const task of crew.tasks) {
        const result: TaskResult | undefined = crewResult.taskResults.get(task.id);
        const startTime = taskTimings.get(task.id) ?? Date.now();
        taskResults.push({
          taskId: task.id,
          agentId: task.agentId,
          output: result?.output ?? '',
          durationMs: Date.now() - startTime,
          success: true,
        });
      }

      return { success: true, taskResults };
    } catch (error) {
      // Collect partial results for tasks that did complete
      for (const task of crew.tasks) {
        const startTime = taskTimings.get(task.id);
        if (startTime !== undefined && !taskResults.some((r) => r.taskId === task.id)) {
          taskResults.push({
            taskId: task.id,
            agentId: task.agentId,
            output: '',
            durationMs: Date.now() - startTime,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return {
        success: false,
        taskResults,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Wrap an execution promise with a timeout.
   */
  private async _withTimeout<T>(
    promise: Promise<T>,
    runId: string,
    timeoutMs: number,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new WorkflowExecutionTimeoutError(runId, timeoutMs));
      }, timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error: unknown) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Complete a usage tracking run if one was started.
   */
  private async _completeUsageRun(
    usageRunId: string | undefined,
    status: 'completed' | 'failed' | 'cancelled',
  ): Promise<void> {
    if (usageRunId && this._usageTracker) {
      try {
        await this._usageTracker.completeRun(usageRunId, { status });
      } catch {
        // Usage tracking failure should not break execution
      }
    }
  }

  /** Type-safe event emission helper. */
  private _emit<E extends keyof WorkflowExecutionEventMap>(
    event: E,
    ...args: Parameters<WorkflowExecutionEventMap[E]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._emitter.emit as (event: string, ...args: any[]) => boolean)(event, ...args);
  }
}
