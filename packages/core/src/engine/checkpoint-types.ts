/**
 * Types for the checkpoint/resume system.
 *
 * Checkpoints capture execution engine state so that partially-completed
 * runs can be persisted and later resumed from the last successful task.
 *
 * @packageDocumentation
 */

import type { TaskResult } from '../types/task.js';
import type { ExecutionStrategy, TaskErrorPolicy } from './types.js';
import type { EngineStatus } from './types.js';

// ---------------------------------------------------------------------------
// Checkpoint status
// ---------------------------------------------------------------------------

/** Status of a checkpoint. */
export type CheckpointStatus = 'active' | 'completed' | 'failed' | 'cancelled' | 'resumed';

// ---------------------------------------------------------------------------
// Serialized task state
// ---------------------------------------------------------------------------

/** Serialized snapshot of a single task within a checkpoint. */
export interface CheckpointTaskState {
  /** Task ID. */
  readonly taskId: string;

  /** Task status at checkpoint time (e.g. 'completed', 'pending', 'failed'). */
  readonly status: string;

  /** Agent ID assigned to the task. */
  readonly agentId: string | undefined;

  /** IDs of tasks this task depends on. */
  readonly dependencies: readonly string[];

  /** The task result if the task completed successfully, or undefined. */
  readonly result: TaskResult | undefined;

  /** Error message if the task failed, or undefined. */
  readonly errorMessage: string | undefined;
}

// ---------------------------------------------------------------------------
// Checkpoint data
// ---------------------------------------------------------------------------

/** Full checkpoint snapshot of an engine run. */
export interface CheckpointData {
  /** Unique checkpoint ID. */
  readonly id: string;

  /** Engine ID that produced this checkpoint. */
  readonly engineId: string;

  /** Engine status at checkpoint time. */
  readonly engineStatus: EngineStatus;

  /** Execution strategy used. */
  readonly strategy: ExecutionStrategy;

  /** Task error policy used. */
  readonly taskErrorPolicy: TaskErrorPolicy;

  /** ISO-8601 timestamp when the checkpoint was created. */
  readonly createdAt: string;

  /** Per-task state snapshots. */
  readonly tasks: readonly CheckpointTaskState[];

  /** Checkpoint lifecycle status. */
  readonly status: CheckpointStatus;

  /** Optional user-defined metadata. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Resume plan
// ---------------------------------------------------------------------------

/** A plan describing which tasks to skip and which to execute on resume. */
export interface ResumePlan {
  /** Checkpoint the plan was derived from. */
  readonly checkpointId: string;

  /** Tasks that completed in the previous run (skip on resume). */
  readonly completedTaskIds: readonly string[];

  /** Tasks that need to be (re-)executed. */
  readonly pendingTaskIds: readonly string[];

  /** Tasks that failed in the previous run. */
  readonly failedTaskIds: readonly string[];

  /** Pre-loaded results for completed tasks (used as dependency context). */
  readonly completedResults: ReadonlyMap<string, TaskResult>;
}

// ---------------------------------------------------------------------------
// Checkpoint store configuration
// ---------------------------------------------------------------------------

/** Configuration for the SQLite-backed checkpoint store. */
export interface CheckpointStoreConfig {
  /** Path to the SQLite database file. Use `:memory:` for in-memory. Default: `:memory:`. */
  readonly dbPath?: string;

  /** Enable WAL mode for better concurrent read performance. Default: true. */
  readonly walMode?: boolean;
}
