/**
 * Task types — standalone task configuration, lifecycle, and I/O.
 *
 * A {@link TaskConfig} is the full configuration for a standalone task that
 * can be created, assigned to an agent, and executed independently or as
 * part of a {@link Crew} workflow.
 *
 * @packageDocumentation
 */

import type { TokenUsage } from './llm.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Priority level for task scheduling and ordering. */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/** Lifecycle status of a standalone task. */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Configuration for creating a standalone {@link Task}.
 *
 * Unlike {@link import('./crew.js').CrewTask}, a `TaskConfig` represents a
 * fully self-describing, reusable task definition with optional execution
 * parameters (timeout, retries, priority).
 *
 * @example
 * ```typescript
 * const config: TaskConfig = {
 *   id: 'research',
 *   description: 'Find the latest AI papers on multi-agent systems',
 *   expectedOutput: 'A list of 5 papers with titles, authors, and summaries',
 *   agentId: 'researcher',
 *   priority: TaskPriority.HIGH,
 *   timeout: 30000,
 *   retries: 2,
 * };
 * ```
 */
export interface TaskConfig {
  /** Unique identifier for this task (alphanumeric, dashes, underscores). */
  readonly id: string;

  /** Description of what the assigned agent should accomplish. */
  readonly description: string;

  /** Optional description of the expected output format. */
  readonly expectedOutput?: string;

  /**
   * ID of the agent that should execute this task.
   * Can be omitted at construction and assigned later via {@link Task.assignAgent}.
   */
  readonly agentId?: string;

  /** Optional static context data passed to the agent. */
  readonly context?: Readonly<Record<string, unknown>>;

  /** IDs of tasks whose results should be injected as context. */
  readonly dependencies?: readonly string[];

  /** Maximum execution time in milliseconds. `undefined` means no limit. */
  readonly timeout?: number;

  /** Number of retry attempts on failure (default: 0 — no retries). */
  readonly retries?: number;

  /** Scheduling priority (default: {@link TaskPriority.MEDIUM}). */
  readonly priority?: TaskPriority;

  /** Arbitrary user-defined metadata attached to the task. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Input / Output (unchanged from original — used by Agent.execute)
// ---------------------------------------------------------------------------

/** Input to an agent's execute method. */
export interface TaskInput {
  /** Description of what the agent should accomplish. */
  readonly description: string;

  /** Optional description of the expected output format. */
  readonly expectedOutput?: string;

  /** Optional context from prior task results or external data. */
  readonly context?: Readonly<Record<string, unknown>>;
}

/** Result returned after an agent completes a task. */
export interface TaskResult {
  /** The agent's text output. */
  readonly output: string;

  /** ID of the agent that produced this result. */
  readonly agentId: string;

  /** Execution duration in milliseconds. */
  readonly duration: number;

  /** Token usage from the LLM call, if available. */
  readonly tokenUsage?: TokenUsage;

  /** Arbitrary metadata attached by the agent or execution engine. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Map of task event names to their listener signatures. */
export interface TaskEventMap {
  /** Emitted when the task starts execution. */
  'task:start': (taskId: string, agentId: string) => void;

  /** Emitted when the task completes successfully. */
  'task:complete': (taskId: string, result: TaskResult) => void;

  /** Emitted when the task fails. */
  'task:error': (taskId: string, error: Error) => void;

  /** Emitted when a retry attempt begins. */
  'task:retry': (taskId: string, attempt: number, maxRetries: number) => void;

  /** Emitted when the task exceeds its timeout. */
  'task:timeout': (taskId: string, timeoutMs: number) => void;

  /** Emitted when the task status changes. */
  'task:status-changed': (taskId: string, status: TaskStatus) => void;
}
