/**
 * In-memory workflow storage implementation.
 *
 * Provides a {@link WorkflowStorageProvider} backed by an in-memory Map.
 * Useful for development, testing, and short-lived sessions. Data does not
 * persist across process restarts.
 *
 * @packageDocumentation
 */

import { WorkflowNotFoundError, WorkflowValidationError } from './workflow-errors.js';
import type {
  CreateWorkflowInput,
  ListWorkflowsOptions,
  ListWorkflowsResult,
  StoredWorkflow,
  UpdateWorkflowInput,
  WorkflowStorageProvider,
} from './workflow-storage-types.js';

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

let _counter = 0;

/** Generate a unique workflow ID. */
function generateWorkflowId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  _counter += 1;
  return `wf_${timestamp}_${random}_${String(_counter)}`;
}

/** Reset the internal counter (for testing only). */
export function _resetIdCounter(): void {
  _counter = 0;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_STATUSES = new Set(['draft', 'active', 'archived']);

function validateCreateInput(input: CreateWorkflowInput): void {
  if (!input.name || input.name.trim().length === 0) {
    throw new WorkflowValidationError('Workflow name is required');
  }

  if (input.name.trim().length > 200) {
    throw new WorkflowValidationError('Workflow name must be 200 characters or fewer');
  }

  if (!Array.isArray(input.agents)) {
    throw new WorkflowValidationError('Agents must be an array');
  }

  if (!Array.isArray(input.tasks)) {
    throw new WorkflowValidationError('Tasks must be an array');
  }

  // Validate agent definitions
  const agentIds = new Set<string>();
  for (const agent of input.agents) {
    if (!agent.id || agent.id.trim().length === 0) {
      throw new WorkflowValidationError('Each agent must have a non-empty id');
    }
    if (!agent.role || agent.role.trim().length === 0) {
      throw new WorkflowValidationError(`Agent "${agent.id}" must have a non-empty role`);
    }
    if (!agent.goal || agent.goal.trim().length === 0) {
      throw new WorkflowValidationError(`Agent "${agent.id}" must have a non-empty goal`);
    }
    if (agentIds.has(agent.id)) {
      throw new WorkflowValidationError(`Duplicate agent id: "${agent.id}"`);
    }
    agentIds.add(agent.id);
  }

  // Validate tasks reference valid agents
  const taskIds = new Set<string>();
  for (const task of input.tasks) {
    if (!task.id || task.id.trim().length === 0) {
      throw new WorkflowValidationError('Each task must have a non-empty id');
    }
    if (taskIds.has(task.id)) {
      throw new WorkflowValidationError(`Duplicate task id: "${task.id}"`);
    }
    taskIds.add(task.id);

    if (!task.agentId || task.agentId.trim().length === 0) {
      throw new WorkflowValidationError(`Task "${task.id}" must have a non-empty agentId`);
    }
    if (!agentIds.has(task.agentId)) {
      throw new WorkflowValidationError(
        `Task "${task.id}" references unknown agent "${task.agentId}"`,
      );
    }
  }

  // Validate task dependencies reference valid tasks
  for (const task of input.tasks) {
    if (task.dependencies) {
      for (const dep of task.dependencies) {
        if (!taskIds.has(dep)) {
          throw new WorkflowValidationError(`Task "${task.id}" depends on unknown task "${dep}"`);
        }
        if (dep === task.id) {
          throw new WorkflowValidationError(`Task "${task.id}" cannot depend on itself`);
        }
      }
    }
  }
}

function validateUpdateInput(input: UpdateWorkflowInput): void {
  if (input.name !== undefined) {
    if (input.name.trim().length === 0) {
      throw new WorkflowValidationError('Workflow name cannot be empty');
    }
    if (input.name.trim().length > 200) {
      throw new WorkflowValidationError('Workflow name must be 200 characters or fewer');
    }
  }

  if (input.status !== undefined && !VALID_STATUSES.has(input.status)) {
    throw new WorkflowValidationError(
      `Invalid status "${input.status}". Must be one of: draft, active, archived`,
    );
  }

  if (input.agents !== undefined && !Array.isArray(input.agents)) {
    throw new WorkflowValidationError('Agents must be an array');
  }

  if (input.tasks !== undefined && !Array.isArray(input.tasks)) {
    throw new WorkflowValidationError('Tasks must be an array');
  }
}

// ---------------------------------------------------------------------------
// InMemoryWorkflowStorage
// ---------------------------------------------------------------------------

/**
 * In-memory implementation of {@link WorkflowStorageProvider}.
 *
 * @example
 * ```typescript
 * const storage = new InMemoryWorkflowStorage();
 *
 * const workflow = await storage.create({
 *   name: 'Research Pipeline',
 *   agents: [{ id: 'researcher', role: 'Researcher', goal: 'Find papers' }],
 *   tasks: [{ id: 'search', description: 'Search for papers', agentId: 'researcher' }],
 * });
 *
 * const found = await storage.get(workflow.id);
 * ```
 */
export class InMemoryWorkflowStorage implements WorkflowStorageProvider {
  private readonly _store = new Map<string, StoredWorkflow>();

  /** Number of workflows currently stored. */
  get size(): number {
    return this._store.size;
  }

  async create(input: CreateWorkflowInput): Promise<StoredWorkflow> {
    validateCreateInput(input);

    const now = new Date().toISOString();
    const workflow: StoredWorkflow = {
      id: generateWorkflowId(),
      name: input.name.trim(),
      description: input.description?.trim(),
      status: 'draft',
      agents: [...input.agents],
      tasks: [...input.tasks],
      tags: input.tags ? [...input.tags] : undefined,
      metadata: input.metadata ? { ...input.metadata } : undefined,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    this._store.set(workflow.id, workflow);
    return workflow;
  }

  async get(id: string): Promise<StoredWorkflow | undefined> {
    return this._store.get(id);
  }

  async list(options?: ListWorkflowsOptions): Promise<ListWorkflowsResult> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const sortBy = options?.sortBy ?? 'updatedAt';
    const sortOrder = options?.sortOrder ?? 'desc';

    let workflows = Array.from(this._store.values());

    // Apply filters
    if (options?.status) {
      workflows = workflows.filter((w) => w.status === options.status);
    }
    if (options?.tag) {
      const tag = options.tag;
      workflows = workflows.filter((w) => w.tags?.includes(tag));
    }

    const total = workflows.length;

    // Sort
    workflows.sort((a, b) => {
      let cmp: number;
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortBy === 'createdAt') {
        cmp = a.createdAt.localeCompare(b.createdAt);
      } else {
        cmp = a.updatedAt.localeCompare(b.updatedAt);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    // Paginate
    workflows = workflows.slice(offset, offset + limit);

    return { workflows, total };
  }

  async update(id: string, input: UpdateWorkflowInput): Promise<StoredWorkflow> {
    const existing = this._store.get(id);
    if (!existing) {
      throw new WorkflowNotFoundError(id);
    }

    validateUpdateInput(input);

    // If agents or tasks are being replaced, cross-validate them
    const newAgents = input.agents ?? existing.agents;
    const newTasks = input.tasks ?? existing.tasks;
    if (input.agents !== undefined || input.tasks !== undefined) {
      validateCreateInput({
        name: input.name ?? existing.name,
        agents: newAgents,
        tasks: newTasks,
      });
    }

    const updated: StoredWorkflow = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      description:
        input.description !== undefined ? input.description?.trim() : existing.description,
      status: input.status ?? existing.status,
      agents: input.agents !== undefined ? [...input.agents] : existing.agents,
      tasks: input.tasks !== undefined ? [...input.tasks] : existing.tasks,
      tags: input.tags !== undefined ? [...input.tags] : existing.tags,
      metadata: input.metadata !== undefined ? { ...input.metadata } : existing.metadata,
      updatedAt: new Date().toISOString(),
      version: existing.version + 1,
    };

    this._store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this._store.delete(id);
  }

  /** Remove all stored workflows. Primarily for testing. */
  clear(): void {
    this._store.clear();
  }
}
