/**
 * Agent configuration and status types.
 *
 * @packageDocumentation
 */

import type { LLMProvider } from './llm.js';
import type { LLMResponse } from './llm.js';
import type { TaskInput, TaskResult } from './task.js';
import type { Tool } from './tool.js';

/** Lifecycle status of an agent. */
export enum AgentStatus {
  IDLE = 'idle',
  EXECUTING = 'executing',
  ERROR = 'error',
}

/**
 * Configuration for creating an {@link Agent}.
 *
 * @example
 * ```typescript
 * const config: AgentConfig = {
 *   id: 'researcher',
 *   role: 'Senior Research Analyst',
 *   goal: 'Find and summarize the latest AI papers',
 *   backstory: 'Expert in machine learning with 10 years of experience',
 *   tools: [webSearch, readFile],
 *   maxIterations: 5,
 * };
 * ```
 */
export interface AgentConfig {
  /** Unique identifier for this agent. */
  readonly id: string;

  /** The agent's role description (e.g. "Senior Research Analyst"). */
  readonly role: string;

  /** The agent's primary goal or objective. */
  readonly goal: string;

  /** Optional backstory providing context for the agent's persona. */
  readonly backstory?: string;

  /** Tools the agent can use during execution. */
  readonly tools?: readonly Tool[];

  /** LLM provider for text generation. Can be set later via {@link Agent.setLLMProvider}. */
  readonly llmProvider?: LLMProvider;

  /** Maximum LLM iterations per task execution (default: 10). */
  readonly maxIterations?: number;

  /** Enable verbose logging of agent actions (default: false). */
  readonly verbose?: boolean;
}

/** Map of agent event names to their listener signatures. */
export interface AgentEventMap {
  'agent:start': (agentId: string, taskInput: TaskInput) => void;
  'agent:complete': (agentId: string, result: TaskResult) => void;
  'agent:error': (agentId: string, error: Error) => void;
  'agent:llm:start': (agentId: string) => void;
  'agent:llm:complete': (agentId: string, response: LLMResponse) => void;
  'agent:tool:start': (agentId: string, toolName: string) => void;
  'agent:tool:complete': (agentId: string, toolName: string, result: unknown) => void;
  'agent:status-changed': (agentId: string, status: AgentStatus) => void;
}
