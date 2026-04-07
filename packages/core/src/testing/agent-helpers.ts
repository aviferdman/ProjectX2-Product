/**
 * Agent and Crew factory helpers for testing workflows.
 *
 * These helpers reduce boilerplate when setting up agents, tasks, and
 * crews in Vitest tests. They compose the mock providers from
 * {@link ./mock-llm-provider} with the core Agent, Task, and Crew classes.
 *
 * @packageDocumentation
 */

import { Agent } from '../agent/agent.js';
import { Crew } from '../crew/crew.js';
import { Task } from '../task/task.js';
import type { AgentConfig } from '../types/agent.js';
import type { CrewConfig, CrewTask } from '../types/crew.js';
import type { LLMProvider } from '../types/llm.js';
import type { TaskConfig } from '../types/task.js';
import { TaskPriority } from '../types/task.js';
import type { Tool } from '../types/tool.js';
import { createMockLLMProvider } from './mock-llm-provider.js';
import type { MockLLMProviderOptions } from './mock-llm-provider.js';

// ---------------------------------------------------------------------------
// createTestAgent
// ---------------------------------------------------------------------------

/** Options for creating a test agent. */
export interface TestAgentOptions {
  /** Agent ID (default: `"test-agent"`). */
  readonly id?: string;

  /** Agent role (default: `"Test Role"`). */
  readonly role?: string;

  /** Agent goal (default: `"Test Goal"`). */
  readonly goal?: string;

  /** Agent backstory. */
  readonly backstory?: string;

  /** Tools to register on the agent. */
  readonly tools?: readonly Tool[];

  /** Max LLM iterations (default: `10`). */
  readonly maxIterations?: number;

  /** An existing LLM provider. If omitted, a mock is created from `llmOptions`. */
  readonly llmProvider?: LLMProvider;

  /** Options forwarded to {@link createMockLLMProvider} when no `llmProvider` is given. */
  readonly llmOptions?: MockLLMProviderOptions;
}

/**
 * Create a pre-configured {@link Agent} for testing.
 *
 * By default, attaches a mock LLM provider that returns `"Mock LLM response"`.
 *
 * @example
 * ```typescript
 * const agent = createTestAgent({ id: 'researcher', llmOptions: { content: 'paper results' } });
 * const result = await agent.execute({ description: 'Find papers' });
 * expect(result.output).toBe('paper results');
 * ```
 */
export function createTestAgent(options: TestAgentOptions = {}): Agent {
  const {
    id = 'test-agent',
    role = 'Test Role',
    goal = 'Test Goal',
    backstory,
    tools,
    maxIterations,
    llmProvider,
    llmOptions,
  } = options;

  const provider = llmProvider ?? createMockLLMProvider(llmOptions);

  const config: AgentConfig = {
    id,
    role,
    goal,
    ...(backstory !== undefined ? { backstory } : {}),
    ...(tools !== undefined ? { tools } : {}),
    ...(maxIterations !== undefined ? { maxIterations } : {}),
    llmProvider: provider,
  };

  return new Agent(config);
}

// ---------------------------------------------------------------------------
// createTestTask
// ---------------------------------------------------------------------------

/** Options for creating a test task. */
export interface TestTaskOptions {
  /** Task ID (default: `"test-task"`). */
  readonly id?: string;

  /** Task description (default: auto-generated from ID). */
  readonly description?: string;

  /** Expected output format description. */
  readonly expectedOutput?: string;

  /** Agent ID to assign (default: `"test-agent"`). */
  readonly agentId?: string;

  /** Context data. */
  readonly context?: Record<string, unknown>;

  /** Dependency task IDs. */
  readonly dependencies?: string[];

  /** Timeout in milliseconds. */
  readonly timeout?: number;

  /** Number of retries on failure. */
  readonly retries?: number;

  /** Task priority. */
  readonly priority?: TaskPriority;

  /** Arbitrary metadata. */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Create a pre-configured {@link Task} for testing.
 *
 * @example
 * ```typescript
 * const task = createTestTask({ id: 'research', agentId: 'researcher' });
 * expect(task.id).toBe('research');
 * ```
 */
export function createTestTask(options: TestTaskOptions = {}): Task {
  const {
    id = 'test-task',
    description,
    expectedOutput,
    agentId = 'test-agent',
    context,
    dependencies,
    timeout,
    retries,
    priority,
    metadata,
  } = options;

  const config: TaskConfig = {
    id,
    description: description ?? `Task ${id} description`,
    agentId,
    ...(expectedOutput !== undefined ? { expectedOutput } : {}),
    ...(context !== undefined ? { context } : {}),
    ...(dependencies !== undefined ? { dependencies } : {}),
    ...(timeout !== undefined ? { timeout } : {}),
    ...(retries !== undefined ? { retries } : {}),
    ...(priority !== undefined ? { priority } : {}),
    ...(metadata !== undefined ? { metadata } : {}),
  };

  return new Task(config);
}

// ---------------------------------------------------------------------------
// createTestCrew
// ---------------------------------------------------------------------------

/** Options for creating a test crew. */
export interface TestCrewOptions {
  /** Crew ID (default: `"test-crew"`). */
  readonly id?: string;

  /** Display name for the crew. */
  readonly name?: string;

  /** Agents in the crew. If omitted, agents are auto-created from task `agentId`s. */
  readonly agents?: readonly Agent[];

  /** Tasks in the crew workflow. */
  readonly tasks: readonly CrewTask[];

  /** Default mock LLM options applied to auto-created agents. */
  readonly llmOptions?: MockLLMProviderOptions;

  /** Whether to enable verbose logging (default: `false`). */
  readonly verbose?: boolean;
}

/**
 * Create a pre-configured {@link Crew} for testing.
 *
 * When `agents` is omitted, agents are automatically created from the
 * unique `agentId` values found in `tasks`, each with a mock LLM provider.
 *
 * @example
 * ```typescript
 * const crew = createTestCrew({
 *   tasks: [
 *     { id: 'research', description: 'Find papers', agentId: 'researcher' },
 *     { id: 'write', description: 'Write article', agentId: 'writer', dependencies: ['research'] },
 *   ],
 * });
 * const result = await crew.run();
 * expect(result.success).toBe(true);
 * ```
 */
export function createTestCrew(options: TestCrewOptions): Crew {
  const { id = 'test-crew', name, tasks, agents, llmOptions, verbose = false } = options;

  let resolvedAgents: readonly Agent[];

  if (agents) {
    resolvedAgents = agents;
  } else {
    const agentIds = new Set(tasks.map((t) => t.agentId));
    resolvedAgents = Array.from(agentIds).map((agentId) =>
      createTestAgent({
        id: agentId,
        llmOptions: { content: `Output from ${agentId}`, ...llmOptions },
      }),
    );
  }

  const config: CrewConfig = {
    id,
    agents: resolvedAgents,
    tasks,
    ...(name !== undefined ? { name } : {}),
    verbose,
  };

  return new Crew(config);
}
