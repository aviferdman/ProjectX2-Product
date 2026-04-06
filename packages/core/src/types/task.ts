/**
 * Task input/output types for agent execution.
 *
 * @packageDocumentation
 */

import type { TokenUsage } from './llm.js';

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
