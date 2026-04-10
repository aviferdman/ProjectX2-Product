/**
 * Core Crew class — orchestrates multiple agents to execute task workflows.
 *
 * A Crew binds a set of agents to a sequence of tasks, executing them in
 * dependency order. Each task is routed to its assigned agent, and prior
 * task results are injected as context for downstream tasks.
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'eventemitter3';
import { z, ZodError } from 'zod';

import type { Agent } from '../agent/agent.js';
import { DiscussionManager } from '../discussion/discussion-manager.js';
import { CrewConfigError, CrewExecutionError } from '../errors/crew-errors.js';
import type { CrewConfig, CrewEventMap, CrewRunResult, CrewTask } from '../types/crew.js';
import { CrewStatus } from '../types/crew.js';
import { ConvergenceStrategy } from '../types/discussion.js';
import type { DiscussionResult } from '../types/discussion.js';
import type { TaskResult } from '../types/task.js';

// ---------------------------------------------------------------------------
// Zod schemas for runtime validation
// ---------------------------------------------------------------------------

const CREW_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

const CrewTaskSchema = z.object({
  id: z
    .string()
    .min(1, 'Task id must not be empty')
    .regex(CREW_ID_PATTERN, 'Task id must be alphanumeric (dashes and underscores allowed)'),
  description: z.string().min(1, 'Task description must not be empty'),
  expectedOutput: z.string().optional(),
  agentId: z.string().min(1, 'Task agentId must not be empty'),
  context: z.record(z.unknown()).optional(),
  dependencies: z.array(z.string()).optional(),
  discussion: z
    .object({
      participantIds: z.array(z.string()).min(2, 'Discussion requires at least 2 participants'),
      maxRounds: z.number().int().positive().max(20),
      convergenceStrategy: z.nativeEnum(ConvergenceStrategy),
      topic: z.string().optional(),
      stabilityThreshold: z.number().int().positive().optional(),
    })
    .optional(),
});

const CrewConfigSchema = z.object({
  id: z
    .string()
    .min(1, 'Crew id must not be empty')
    .regex(CREW_ID_PATTERN, 'Crew id must be alphanumeric (dashes and underscores allowed)'),
  name: z.string().optional(),
  agents: z
    .array(
      z.custom<Agent>(
        (val) => typeof val === 'object' && val !== null && 'id' in val && 'execute' in val,
      ),
    )
    .min(1, 'Crew must have at least one agent'),
  tasks: z.array(CrewTaskSchema).min(1, 'Crew must have at least one task'),
  verbose: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Crew class
// ---------------------------------------------------------------------------

/**
 * A crew of agents that collaborate on a workflow of tasks.
 *
 * @example
 * ```typescript
 * const crew = new Crew({
 *   id: 'research-crew',
 *   agents: [researcher, writer],
 *   tasks: [
 *     { id: 'research', description: 'Find papers', agentId: 'researcher' },
 *     { id: 'write', description: 'Write article', agentId: 'writer', dependencies: ['research'] },
 *   ],
 * });
 *
 * const result = await crew.run();
 * console.log(result.taskResults.get('write')?.output);
 * ```
 */
export class Crew {
  /** Unique identifier. */
  public readonly id: string;

  /** Display name. */
  public readonly name: string;

  /** Whether verbose logging is enabled. */
  public readonly verbose: boolean;

  private readonly _agents: ReadonlyMap<string, Agent>;
  private readonly _tasks: readonly CrewTask[];
  private readonly _emitter: EventEmitter<CrewEventMap>;
  private _status: CrewStatus;

  constructor(config: CrewConfig) {
    try {
      const parsed = CrewConfigSchema.parse(config);

      this.id = parsed.id;
      this.name = parsed.name ?? parsed.id;
      this.verbose = parsed.verbose ?? false;

      // Build an agent lookup map
      const agentMap = new Map<string, Agent>();
      for (const agent of parsed.agents) {
        if (agentMap.has(agent.id)) {
          throw new CrewConfigError(`Duplicate agent id "${agent.id}"`, parsed.id);
        }
        agentMap.set(agent.id, agent);
      }
      this._agents = agentMap;

      // Validate tasks reference existing agents and have unique IDs
      const taskIds = new Set<string>();
      for (const task of parsed.tasks) {
        if (taskIds.has(task.id)) {
          throw new CrewConfigError(`Duplicate task id "${task.id}"`, parsed.id);
        }
        taskIds.add(task.id);

        if (!agentMap.has(task.agentId)) {
          throw new CrewConfigError(
            `Task "${task.id}" references unknown agent "${task.agentId}"`,
            parsed.id,
          );
        }
      }

      // Validate dependency references
      for (const task of parsed.tasks) {
        if (task.dependencies) {
          for (const depId of task.dependencies) {
            if (!taskIds.has(depId)) {
              throw new CrewConfigError(
                `Task "${task.id}" depends on unknown task "${depId}"`,
                parsed.id,
              );
            }
            if (depId === task.id) {
              throw new CrewConfigError(`Task "${task.id}" cannot depend on itself`, parsed.id);
            }
          }
        }
      }

      // Normalize tasks to satisfy exactOptionalPropertyTypes
      const normalizedTasks: CrewTask[] = parsed.tasks.map((t) => {
        const task: CrewTask = {
          id: t.id,
          description: t.description,
          agentId: t.agentId,
          ...(t.expectedOutput !== undefined ? { expectedOutput: t.expectedOutput } : {}),
          ...(t.context !== undefined ? { context: t.context } : {}),
          ...(t.dependencies !== undefined ? { dependencies: t.dependencies } : {}),
          ...(t.discussion !== undefined ? { discussion: t.discussion } : {}),
        };
        return task;
      });

      // Detect circular dependencies
      this._detectCycles(normalizedTasks, parsed.id);

      this._tasks = normalizedTasks;
      this._emitter = new EventEmitter<CrewEventMap>();
      this._status = CrewStatus.IDLE;
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => e.message).join('; ');
        throw new CrewConfigError(messages, typeof config.id === 'string' ? config.id : undefined);
      }
      if (error instanceof CrewConfigError) {
        throw error;
      }
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // Read-only accessors
  // -------------------------------------------------------------------------

  /** Current lifecycle status. */
  get status(): CrewStatus {
    return this._status;
  }

  /** Read-only view of registered agents. */
  get agents(): ReadonlyMap<string, Agent> {
    return this._agents;
  }

  /** Read-only ordered list of tasks. */
  get tasks(): readonly CrewTask[] {
    return this._tasks;
  }

  // -------------------------------------------------------------------------
  // Event system (type-safe delegation to EventEmitter)
  // -------------------------------------------------------------------------

  /**
   * Subscribe to a crew lifecycle event.
   *
   * @param event    - Event name
   * @param listener - Callback
   */
  on<E extends keyof CrewEventMap>(event: E, listener: CrewEventMap[E]): this {
    this._emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Unsubscribe from a crew lifecycle event.
   *
   * @param event    - Event name
   * @param listener - Callback to remove
   */
  off<E extends keyof CrewEventMap>(event: E, listener: CrewEventMap[E]): this {
    this._emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Subscribe to a crew lifecycle event (fires once).
   *
   * @param event    - Event name
   * @param listener - Callback
   */
  once<E extends keyof CrewEventMap>(event: E, listener: CrewEventMap[E]): this {
    this._emitter.once(event, listener as (...args: unknown[]) => void);
    return this;
  }

  // -------------------------------------------------------------------------
  // Execution
  // -------------------------------------------------------------------------

  /**
   * Execute the crew workflow.
   *
   * Tasks are executed in dependency order. Each task's assigned agent
   * receives the task description along with any context from prior tasks.
   *
   * @returns The aggregated results of all tasks
   * @throws {CrewExecutionError} If any task fails or the crew is already running
   */
  async run(): Promise<CrewRunResult> {
    if (this._status === CrewStatus.RUNNING) {
      throw new CrewExecutionError(this.id, 'Crew is already running');
    }

    this._setStatus(CrewStatus.RUNNING);
    this._emit('crew:start', this.id);

    const startTime = Date.now();
    const taskResults = new Map<string, TaskResult>();

    try {
      const executionOrder = this._topologicalSort();

      for (const task of executionOrder) {
        const agent = this._agents.get(task.agentId);
        if (!agent) {
          throw new CrewExecutionError(this.id, `Agent "${task.agentId}" not found`, task.id);
        }

        // Run pre-task discussion if configured
        let discussionResult: DiscussionResult | undefined;
        if (task.discussion) {
          discussionResult = await this._runTaskDiscussion(task, taskResults);
        }

        this._emit('crew:task:start', this.id, task.id, task.agentId);

        try {
          const taskInput = this._buildTaskInput(task, taskResults, discussionResult);
          const result = await agent.execute(taskInput);
          taskResults.set(task.id, result);
          this._emit('crew:task:complete', this.id, task.id, result);
        } catch (error) {
          const wrappedError = error instanceof Error ? error : new Error(String(error));
          this._emit('crew:task:error', this.id, task.id, wrappedError);
          throw new CrewExecutionError(this.id, wrappedError.message, task.id, wrappedError);
        }
      }

      const runResult: CrewRunResult = {
        crewId: this.id,
        taskResults,
        duration: Date.now() - startTime,
        success: true,
      };

      this._setStatus(CrewStatus.COMPLETED);
      this._emit('crew:complete', this.id, runResult);

      return runResult;
    } catch (error) {
      this._setStatus(CrewStatus.ERROR);

      const wrappedError = error instanceof Error ? error : new Error(String(error));
      this._emit('crew:error', this.id, wrappedError);

      if (error instanceof CrewExecutionError) {
        throw error;
      }

      throw new CrewExecutionError(this.id, wrappedError.message, undefined, wrappedError);
    }
  }

  /**
   * Reset the crew status to IDLE so it can be run again.
   *
   * @throws {CrewExecutionError} If the crew is currently running
   */
  reset(): void {
    if (this._status === CrewStatus.RUNNING) {
      throw new CrewExecutionError(this.id, 'Cannot reset while running');
    }
    this._setStatus(CrewStatus.IDLE);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Build a TaskInput for an agent, injecting dependency results as context.
   */
  private _buildTaskInput(
    task: CrewTask,
    completedResults: ReadonlyMap<string, TaskResult>,
    discussionResult?: DiscussionResult,
  ): { description: string; expectedOutput?: string; context?: Record<string, unknown> } {
    const context: Record<string, unknown> = { ...task.context };

    if (task.dependencies) {
      const dependencyOutputs: Record<string, string> = {};
      for (const depId of task.dependencies) {
        const depResult = completedResults.get(depId);
        if (depResult) {
          dependencyOutputs[depId] = depResult.output;
        }
      }
      if (Object.keys(dependencyOutputs).length > 0) {
        context['dependencyResults'] = dependencyOutputs;
      }
    }

    // Inject discussion result if a pre-task discussion was held
    if (discussionResult) {
      context['discussionResult'] = {
        status: discussionResult.status,
        finalOutput: discussionResult.finalOutput,
        totalMessages: discussionResult.totalMessages,
        convergenceRound: discussionResult.convergenceRound,
        rounds: discussionResult.rounds.map((r) => ({
          roundNumber: r.roundNumber,
          messages: r.messages.map((m) => ({
            from: m.fromAgentId,
            to: m.toAgentId,
            type: m.type,
            content: m.content,
          })),
        })),
      };
    }

    const input: {
      description: string;
      expectedOutput?: string;
      context?: Record<string, unknown>;
    } = {
      description: task.description,
    };

    if (task.expectedOutput !== undefined) {
      input.expectedOutput = task.expectedOutput;
    }

    if (Object.keys(context).length > 0) {
      input.context = context;
    }

    return input;
  }

  /**
   * Run a collaborative discussion between agents before executing a task.
   */
  private async _runTaskDiscussion(
    task: CrewTask,
    completedResults: ReadonlyMap<string, TaskResult>,
  ): Promise<DiscussionResult> {
    const disc = task.discussion!;
    const discussionId = `${this.id}-disc-${task.id}`;

    // Build initial context from dependency results
    let initialContext = '';
    if (task.dependencies) {
      const depOutputs: string[] = [];
      for (const depId of task.dependencies) {
        const depResult = completedResults.get(depId);
        if (depResult) {
          depOutputs.push(`[${depId}]: ${depResult.output}`);
        }
      }
      if (depOutputs.length > 0) {
        initialContext = `Previous task results:\n${depOutputs.join('\n\n')}`;
      }
    }

    const manager = new DiscussionManager(this._agents);

    // Forward discussion events as crew events
    manager.on('discussion:start', (dId, participantIds) => {
      this._emit('crew:discussion:start', this.id, dId, participantIds);
    });
    manager.on('discussion:message', (dId, message) => {
      this._emit('crew:discussion:message', this.id, dId, message);
    });
    manager.on('discussion:complete', (dId, result) => {
      this._emit('crew:discussion:complete', this.id, dId, result);
    });

    return manager.runDiscussion({
      id: discussionId,
      participantIds: disc.participantIds,
      topic: disc.topic ?? task.description,
      initialContext: initialContext || undefined,
      maxRounds: disc.maxRounds,
      convergenceStrategy: disc.convergenceStrategy,
      stabilityThreshold: disc.stabilityThreshold,
    });
  }

  /**
   * Topological sort of tasks based on dependency graph.
   * Returns tasks in a valid execution order.
   */
  private _topologicalSort(): CrewTask[] {
    const taskMap = new Map<string, CrewTask>();
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const task of this._tasks) {
      taskMap.set(task.id, task);
      inDegree.set(task.id, 0);
      adjacency.set(task.id, []);
    }

    for (const task of this._tasks) {
      if (task.dependencies) {
        for (const depId of task.dependencies) {
          const adj = adjacency.get(depId);
          if (adj) {
            adj.push(task.id);
          }
          inDegree.set(task.id, (inDegree.get(task.id) ?? 0) + 1);
        }
      }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    for (const [taskId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(taskId);
      }
    }

    const sorted: CrewTask[] = [];
    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined) break;

      const task = taskMap.get(current);
      if (task) {
        sorted.push(task);
      }

      const neighbors = adjacency.get(current) ?? [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    return sorted;
  }

  /**
   * Detect circular dependencies in the task graph at construction time.
   * @throws {CrewConfigError} If a cycle is detected
   */
  private _detectCycles(tasks: readonly CrewTask[], crewId: string): void {
    const adjacency = new Map<string, string[]>();
    for (const task of tasks) {
      adjacency.set(task.id, []);
    }
    for (const task of tasks) {
      if (task.dependencies) {
        for (const depId of task.dependencies) {
          adjacency.get(depId)?.push(task.id);
        }
      }
    }

    const WHITE = 0;
    const GRAY = 1;
    const BLACK = 2;
    const color = new Map<string, number>();

    for (const task of tasks) {
      color.set(task.id, WHITE);
    }

    const dfs = (nodeId: string): boolean => {
      color.set(nodeId, GRAY);
      for (const neighbor of adjacency.get(nodeId) ?? []) {
        const neighborColor = color.get(neighbor);
        if (neighborColor === GRAY) {
          return true; // cycle detected
        }
        if (neighborColor === WHITE && dfs(neighbor)) {
          return true;
        }
      }
      color.set(nodeId, BLACK);
      return false;
    };

    for (const task of tasks) {
      if (color.get(task.id) === WHITE && dfs(task.id)) {
        throw new CrewConfigError('Circular dependency detected in task graph', crewId);
      }
    }
  }

  private _setStatus(status: CrewStatus): void {
    this._status = status;
    this._emit('crew:status-changed', this.id, status);
  }

  /** Type-safe event emission helper. */
  private _emit<E extends keyof CrewEventMap>(
    event: E,
    ...args: Parameters<CrewEventMap[E]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._emitter.emit as (event: string, ...args: any[]) => boolean)(event, ...args);
  }
}
