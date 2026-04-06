/**
 * Execution engine types — configuration, events, and results.
 *
 * The execution engine orchestrates Task objects against Agent instances,
 * supporting sequential and parallel strategies, retries, timeouts,
 * cancellation, and middleware hooks.
 *
 * @packageDocumentation
 */

import type { Agent } from '../agent/agent.js';
import type { Task } from '../task/task.js';
import type { TaskResult } from '../types/task.js';

import type { TaskContextManagerConfig } from '../task/task-context-manager.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Execution strategy for the engine. */
export enum ExecutionStrategy {
  /** Execute tasks one at a time in dependency order. */
  SEQUENTIAL = 'sequential',
  /** Execute independent tasks concurrently, respecting dependencies. */
  PARALLEL = 'parallel',
}

/** Lifecycle status of the execution engine. */
export enum EngineStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled',
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Error handling policy when a task fails. */
export type TaskErrorPolicy = 'fail-fast' | 'continue';

/**
 * Configuration for creating an {@link ExecutionEngine}.
 *
 * @example
 * ```typescript
 * const config: ExecutionEngineConfig = {
 *   id: 'my-engine',
 *   strategy: ExecutionStrategy.PARALLEL,
 *   maxConcurrency: 5,
 *   taskErrorPolicy: 'continue',
 * };
 * ```
 */
export interface ExecutionEngineConfig {
  /** Unique identifier for this engine instance. */
  readonly id: string;

  /** Execution strategy (default: {@link ExecutionStrategy.SEQUENTIAL}). */
  readonly strategy?: ExecutionStrategy;

  /** Max concurrent tasks for parallel strategy (default: Infinity). */
  readonly maxConcurrency?: number;

  /** Overall timeout for the entire run in ms (default: no limit). */
  readonly globalTimeout?: number;

  /** How to handle task errors (default: 'fail-fast'). */
  readonly taskErrorPolicy?: TaskErrorPolicy;

  /** Enable verbose logging of engine operations (default: false). */
  readonly verbose?: boolean;

  /** Configuration for the task context manager (default: shallow-merge, output-only). */
  readonly contextManager?: TaskContextManagerConfig;
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

/** Result of a complete engine run. */
export interface EngineRunResult {
  /** ID of the engine that produced this result. */
  readonly engineId: string;

  /** Results for successfully completed tasks, keyed by task ID. */
  readonly taskResults: ReadonlyMap<string, TaskResult>;

  /** Errors for failed tasks, keyed by task ID. */
  readonly failedTasks: ReadonlyMap<string, Error>;

  /** Total execution duration in milliseconds. */
  readonly duration: number;

  /** Whether all tasks completed successfully. */
  readonly success: boolean;

  /** The strategy used for this run. */
  readonly strategy: ExecutionStrategy;
}

// ---------------------------------------------------------------------------
// Hooks / Middleware
// ---------------------------------------------------------------------------

/** Called before a task is executed by its agent. */
export type BeforeTaskHook = (task: Task, agent: Agent) => Promise<void> | void;

/** Called after a task completes successfully. */
export type AfterTaskHook = (task: Task, agent: Agent, result: TaskResult) => Promise<void> | void;

/** Called when a task encounters an error. */
export type OnTaskErrorHook = (task: Task, error: Error) => Promise<void> | void;

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Map of engine event names to their listener signatures. */
export interface EngineEventMap {
  /** Emitted when the engine starts execution. */
  'engine:start': (engineId: string) => void;

  /** Emitted when the engine completes all tasks. */
  'engine:complete': (engineId: string, result: EngineRunResult) => void;

  /** Emitted when the engine encounters a fatal error. */
  'engine:error': (engineId: string, error: Error) => void;

  /** Emitted when the engine run is cancelled. */
  'engine:cancelled': (engineId: string) => void;

  /** Emitted when a task starts execution. */
  'engine:task:start': (engineId: string, taskId: string, agentId: string) => void;

  /** Emitted when a task completes successfully. */
  'engine:task:complete': (engineId: string, taskId: string, result: TaskResult) => void;

  /** Emitted when a task fails. */
  'engine:task:error': (engineId: string, taskId: string, error: Error) => void;

  /** Emitted when a task retry begins. */
  'engine:task:retry': (
    engineId: string,
    taskId: string,
    attempt: number,
    maxRetries: number,
  ) => void;

  /** Emitted when a task exceeds its timeout. */
  'engine:task:timeout': (engineId: string, taskId: string, timeoutMs: number) => void;

  /** Emitted when the engine status changes. */
  'engine:status-changed': (engineId: string, status: EngineStatus) => void;
}
