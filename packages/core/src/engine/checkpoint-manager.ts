/**
 * Checkpoint manager — high-level API for creating and resuming engine checkpoints.
 *
 * The {@link CheckpointManager} bridges the {@link ExecutionEngine} and the
 * {@link CheckpointStore}, providing methods to snapshot engine state during
 * or after a run and to build a {@link ResumePlan} for resuming a partially
 * completed run.
 *
 * @packageDocumentation
 */

import type { Task } from '../task/task.js';
import type { TaskResult } from '../types/task.js';
import { TaskStatus } from '../types/task.js';

import type { CheckpointStoreConfig } from './checkpoint-types.js';
import type {
  CheckpointData,
  CheckpointStatus,
  CheckpointTaskState,
  ResumePlan,
} from './checkpoint-types.js';
import { CheckpointStore } from './checkpoint-store.js';
import type { ExecutionEngine } from './execution-engine.js';
import type { EngineRunResult } from './types.js';
import { EngineStatus } from './types.js';

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

let _counter = 0;

function generateCheckpointId(engineId: string): string {
  const ts = Date.now().toString(36);
  const seq = (++_counter).toString(36);
  return `cp-${engineId}-${ts}-${seq}`;
}

// ---------------------------------------------------------------------------
// CheckpointManager
// ---------------------------------------------------------------------------

/**
 * High-level API for engine checkpoint/resume workflows.
 *
 * @example
 * ```typescript
 * const manager = new CheckpointManager({ dbPath: ':memory:' });
 *
 * // After a run completes (or fails):
 * const cp = manager.createCheckpoint(engine);
 *
 * // Later, build a resume plan:
 * const plan = manager.buildResumePlan(cp.id);
 * // plan.completedTaskIds — tasks to skip
 * // plan.pendingTaskIds   — tasks to run
 * // plan.completedResults — pre-populated context
 *
 * manager.close();
 * ```
 */
export class CheckpointManager {
  private readonly _store: CheckpointStore;

  constructor(config?: CheckpointStoreConfig) {
    this._store = new CheckpointStore(config);
  }

  /** The underlying store. */
  get store(): CheckpointStore {
    return this._store;
  }

  // -----------------------------------------------------------------------
  // Create checkpoints
  // -----------------------------------------------------------------------

  /**
   * Create a checkpoint from the current engine state.
   *
   * Captures task statuses, results, errors, and the engine's configuration.
   * The engine does **not** need to be idle — you can checkpoint a running engine
   * (e.g. from an event listener).
   *
   * @param engine   - The execution engine to snapshot
   * @param metadata - Optional user-defined metadata to attach
   * @returns The persisted checkpoint data
   */
  createCheckpoint(engine: ExecutionEngine, metadata?: Record<string, unknown>): CheckpointData {
    const tasks: CheckpointTaskState[] = [];

    for (const [, task] of engine.tasks) {
      tasks.push(snapshotTask(task));
    }

    const checkpoint: CheckpointData = {
      id: generateCheckpointId(engine.id),
      engineId: engine.id,
      engineStatus: engine.status,
      strategy: engine.strategy,
      taskErrorPolicy: engine.taskErrorPolicy,
      createdAt: new Date().toISOString(),
      tasks,
      status: engineStatusToCheckpointStatus(engine.status),
      metadata,
    };

    this._store.save(checkpoint);
    return checkpoint;
  }

  /**
   * Create a checkpoint from an {@link EngineRunResult}.
   *
   * Useful when you want to persist the outcome of a run without needing to
   * access the live engine (e.g. in a post-run callback).
   *
   * @param engine - The engine that produced the result
   * @param result - The run result
   * @param metadata - Optional metadata
   */
  createCheckpointFromResult(
    engine: ExecutionEngine,
    result: EngineRunResult,
    metadata?: Record<string, unknown>,
  ): CheckpointData {
    const tasks: CheckpointTaskState[] = [];

    for (const [, task] of engine.tasks) {
      const taskResult = result.taskResults.get(task.id);
      const taskError = result.failedTasks.get(task.id);

      let status: string;
      if (taskResult) {
        status = TaskStatus.COMPLETED;
      } else if (taskError) {
        status = TaskStatus.FAILED;
      } else {
        status = task.status;
      }

      tasks.push({
        taskId: task.id,
        status,
        agentId: task.agentId,
        dependencies: task.dependencies,
        result: taskResult,
        errorMessage: taskError?.message,
      });
    }

    const checkpoint: CheckpointData = {
      id: generateCheckpointId(engine.id),
      engineId: engine.id,
      engineStatus: engine.status,
      strategy: result.strategy,
      taskErrorPolicy: engine.taskErrorPolicy,
      createdAt: new Date().toISOString(),
      tasks,
      status: result.success ? 'completed' : 'failed',
      metadata,
    };

    this._store.save(checkpoint);
    return checkpoint;
  }

  // -----------------------------------------------------------------------
  // Resume from checkpoints
  // -----------------------------------------------------------------------

  /**
   * Build a resume plan from a checkpoint.
   *
   * The plan identifies which tasks already completed (and their results)
   * and which still need to run. The caller can use this to configure
   * a new engine run that skips completed work.
   *
   * @param checkpointId - The checkpoint to resume from
   * @returns A resume plan, or undefined if the checkpoint doesn't exist
   */
  buildResumePlan(checkpointId: string): ResumePlan | undefined {
    const checkpoint = this._store.get(checkpointId);
    if (!checkpoint) {
      return undefined;
    }

    const completedTaskIds: string[] = [];
    const pendingTaskIds: string[] = [];
    const failedTaskIds: string[] = [];
    const completedResults = new Map<string, TaskResult>();

    for (const task of checkpoint.tasks) {
      if (task.status === TaskStatus.COMPLETED && task.result) {
        completedTaskIds.push(task.taskId);
        completedResults.set(task.taskId, task.result);
      } else if (task.status === TaskStatus.FAILED) {
        failedTaskIds.push(task.taskId);
        pendingTaskIds.push(task.taskId);
      } else {
        pendingTaskIds.push(task.taskId);
      }
    }

    // Mark the checkpoint as resumed
    this._store.updateStatus(checkpointId, 'resumed');

    return {
      checkpointId,
      completedTaskIds,
      pendingTaskIds,
      failedTaskIds,
      completedResults,
    };
  }

  /**
   * Build a resume plan from the latest checkpoint for an engine.
   *
   * @param engineId - The engine whose latest checkpoint to use
   * @returns A resume plan, or undefined if no checkpoints exist
   */
  buildResumePlanFromLatest(engineId: string): ResumePlan | undefined {
    const checkpoint = this._store.getLatest(engineId);
    if (!checkpoint) {
      return undefined;
    }
    return this.buildResumePlan(checkpoint.id);
  }

  // -----------------------------------------------------------------------
  // Delegation to store
  // -----------------------------------------------------------------------

  /** Retrieve a checkpoint by ID. */
  getCheckpoint(checkpointId: string): CheckpointData | undefined {
    return this._store.get(checkpointId);
  }

  /** Get the latest checkpoint for an engine. */
  getLatestCheckpoint(engineId: string): CheckpointData | undefined {
    return this._store.getLatest(engineId);
  }

  /** List checkpoints for an engine. */
  listCheckpoints(engineId: string, limit?: number): readonly CheckpointData[] {
    return this._store.list(engineId, limit);
  }

  /** Delete a checkpoint. */
  deleteCheckpoint(checkpointId: string): boolean {
    return this._store.delete(checkpointId);
  }

  /** Delete all checkpoints for an engine. */
  deleteAllCheckpoints(engineId: string): number {
    return this._store.deleteAll(engineId);
  }

  /** Close the underlying store. */
  close(): void {
    this._store.close();
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function snapshotTask(task: Task): CheckpointTaskState {
  return {
    taskId: task.id,
    status: task.status,
    agentId: task.agentId,
    dependencies: task.dependencies,
    result: task.result,
    errorMessage: task.error?.message,
  };
}

function engineStatusToCheckpointStatus(status: EngineStatus): CheckpointStatus {
  switch (status) {
    case EngineStatus.COMPLETED:
      return 'completed';
    case EngineStatus.ERROR:
      return 'failed';
    case EngineStatus.CANCELLED:
      return 'cancelled';
    default:
      return 'active';
  }
}
