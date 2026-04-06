/**
 * Crew configuration and status types.
 *
 * @packageDocumentation
 */

import type { TaskResult } from './task.js';

/** Lifecycle status of a crew. */
export enum CrewStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
}

/**
 * A task definition within a crew workflow.
 *
 * Each task is assigned to an agent and optionally depends on prior tasks
 * whose results are passed as context.
 *
 * @example
 * ```typescript
 * const task: CrewTask = {
 *   id: 'research',
 *   description: 'Find the latest AI papers',
 *   agentId: 'researcher',
 *   expectedOutput: 'A list of 5 papers with summaries',
 * };
 * ```
 */
export interface CrewTask {
  /** Unique identifier for this task within the crew. */
  readonly id: string;

  /** Description of what the assigned agent should accomplish. */
  readonly description: string;

  /** Optional description of the expected output format. */
  readonly expectedOutput?: string;

  /** ID of the agent that should execute this task. */
  readonly agentId: string;

  /** Optional static context data passed to the agent. */
  readonly context?: Readonly<Record<string, unknown>>;

  /** IDs of tasks whose results should be injected as context. */
  readonly dependencies?: readonly string[];
}

/**
 * Configuration for creating a {@link Crew}.
 *
 * @example
 * ```typescript
 * const config: CrewConfig = {
 *   id: 'research-crew',
 *   agents: [researcher, writer],
 *   tasks: [
 *     { id: 'research', description: 'Find papers', agentId: 'researcher' },
 *     { id: 'write', description: 'Write summary', agentId: 'writer', dependencies: ['research'] },
 *   ],
 * };
 * ```
 */
export interface CrewConfig {
  /** Unique identifier for this crew. */
  readonly id: string;

  /** Display name for the crew. */
  readonly name?: string;

  /** Agents available for task execution. */
  readonly agents: readonly import('../agent/agent.js').Agent[];

  /** Tasks to execute in the workflow. */
  readonly tasks: readonly CrewTask[];

  /** Enable verbose logging of crew operations (default: false). */
  readonly verbose?: boolean;
}

/** Result of a full crew run. */
export interface CrewRunResult {
  /** ID of the crew that produced this result. */
  readonly crewId: string;

  /** Ordered results for each completed task, keyed by task ID. */
  readonly taskResults: ReadonlyMap<string, TaskResult>;

  /** Total execution duration in milliseconds. */
  readonly duration: number;

  /** Whether all tasks completed successfully. */
  readonly success: boolean;
}

/** Map of crew event names to their listener signatures. */
export interface CrewEventMap {
  'crew:start': (crewId: string) => void;
  'crew:complete': (crewId: string, result: CrewRunResult) => void;
  'crew:error': (crewId: string, error: Error) => void;
  'crew:task:start': (crewId: string, taskId: string, agentId: string) => void;
  'crew:task:complete': (crewId: string, taskId: string, result: TaskResult) => void;
  'crew:task:error': (crewId: string, taskId: string, error: Error) => void;
  'crew:status-changed': (crewId: string, status: CrewStatus) => void;
}
