/**
 * Types for the workflow execution API.
 *
 * Defines the data model for executing stored workflows, tracking execution
 * state, and streaming execution events to clients.
 *
 * @packageDocumentation
 */

import type { ExecutionStrategy } from '../engine/types.js';
import type { TaskResult } from '../types/task.js';

// ---------------------------------------------------------------------------
// Execution status
// ---------------------------------------------------------------------------

/** Lifecycle status of a workflow execution run. */
export type WorkflowExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

// ---------------------------------------------------------------------------
// Execution config
// ---------------------------------------------------------------------------

/** Configuration options for executing a workflow. */
export interface WorkflowExecutionOptions {
  /** Account ID for usage tracking. Required when usage tracking is enabled. */
  readonly accountId?: string;

  /** Execution strategy override (default: sequential). */
  readonly strategy?: ExecutionStrategy;

  /** Maximum concurrent tasks for parallel strategy (default: Infinity). */
  readonly maxConcurrency?: number;

  /** Overall timeout for the entire run in ms (default: no limit). */
  readonly timeout?: number;

  /** Enable verbose logging (default: false). */
  readonly verbose?: boolean;

  /** Optional metadata to attach to the execution record. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Task execution result
// ---------------------------------------------------------------------------

/** Result of a single task within a workflow execution. */
export interface WorkflowTaskResult {
  /** Task ID. */
  readonly taskId: string;

  /** Agent ID that executed the task. */
  readonly agentId: string;

  /** Task output. */
  readonly output: string;

  /** Duration of this task in milliseconds. */
  readonly durationMs: number;

  /** Whether the task completed successfully. */
  readonly success: boolean;

  /** Error message if the task failed. */
  readonly error?: string;
}

// ---------------------------------------------------------------------------
// Execution result
// ---------------------------------------------------------------------------

/** Full result of a workflow execution. */
export interface WorkflowExecutionResult {
  /** Unique execution run ID. */
  readonly runId: string;

  /** ID of the workflow that was executed. */
  readonly workflowId: string;

  /** Final execution status. */
  readonly status: WorkflowExecutionStatus;

  /** Individual task results. */
  readonly taskResults: readonly WorkflowTaskResult[];

  /** Total execution duration in milliseconds. */
  readonly durationMs: number;

  /** ISO-8601 timestamp when execution started. */
  readonly startedAt: string;

  /** ISO-8601 timestamp when execution finished. */
  readonly finishedAt: string;

  /** Whether all tasks completed successfully. */
  readonly success: boolean;

  /** Top-level error message if execution failed. */
  readonly error?: string;

  /** Execution strategy used. */
  readonly strategy: ExecutionStrategy;

  /** Optional metadata. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Execution events
// ---------------------------------------------------------------------------

/** Events emitted during workflow execution. */
export interface WorkflowExecutionEventMap {
  /** Emitted when a workflow execution starts. */
  'execution:start': (runId: string, workflowId: string) => void;

  /** Emitted when a workflow execution completes. */
  'execution:complete': (runId: string, result: WorkflowExecutionResult) => void;

  /** Emitted when a workflow execution fails. */
  'execution:error': (runId: string, error: Error) => void;

  /** Emitted when a workflow execution is cancelled. */
  'execution:cancelled': (runId: string) => void;

  /** Emitted when a task within the workflow starts. */
  'execution:task:start': (runId: string, taskId: string, agentId: string) => void;

  /** Emitted when a task within the workflow completes. */
  'execution:task:complete': (runId: string, taskId: string, result: TaskResult) => void;

  /** Emitted when a task within the workflow fails. */
  'execution:task:error': (runId: string, taskId: string, error: Error) => void;
}
