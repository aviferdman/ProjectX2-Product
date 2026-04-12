/**
 * In-memory template storage implementation.
 *
 * Provides a {@link TemplateStorageProvider} backed by an in-memory Map.
 * Useful for development, testing, and short-lived sessions. Data does not
 * persist across process restarts.
 *
 * @packageDocumentation
 */

import { TemplateNotFoundError, TemplateValidationError } from './template-errors.js';
import type {
  CreateTemplateInput,
  ListTemplatesOptions,
  ListTemplatesResult,
  StoredTemplate,
  TemplateStorageProvider,
  UpdateTemplateInput,
} from './template-storage-types.js';

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

let _counter = 0;

/** Generate a unique template ID. */
function generateTemplateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  _counter += 1;
  return `tmpl_${timestamp}_${random}_${String(_counter)}`;
}

/** Reset the internal counter (for testing only). */
export function _resetTemplateIdCounter(): void {
  _counter = 0;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_STATUSES = new Set(['draft', 'published', 'archived']);

const VALID_CATEGORIES = new Set<string>([
  'research',
  'content',
  'coding',
  'data-analysis',
  'automation',
  'customer-support',
  'other',
]);

function validateCreateInput(input: CreateTemplateInput): void {
  if (!input.name || input.name.trim().length === 0) {
    throw new TemplateValidationError('Template name is required');
  }

  if (input.name.trim().length > 200) {
    throw new TemplateValidationError('Template name must be 200 characters or fewer');
  }

  if (!input.category || !VALID_CATEGORIES.has(input.category)) {
    throw new TemplateValidationError(
      `Invalid category "${input.category}". Must be one of: ${[...VALID_CATEGORIES].join(', ')}`,
    );
  }

  if (!Array.isArray(input.agents)) {
    throw new TemplateValidationError('Agents must be an array');
  }

  if (!Array.isArray(input.tasks)) {
    throw new TemplateValidationError('Tasks must be an array');
  }

  // Validate agent definitions
  const agentIds = new Set<string>();
  for (const agent of input.agents) {
    if (!agent.id || agent.id.trim().length === 0) {
      throw new TemplateValidationError('Each agent must have a non-empty id');
    }
    if (!agent.role || agent.role.trim().length === 0) {
      throw new TemplateValidationError(`Agent "${agent.id}" must have a non-empty role`);
    }
    if (!agent.goal || agent.goal.trim().length === 0) {
      throw new TemplateValidationError(`Agent "${agent.id}" must have a non-empty goal`);
    }
    if (agentIds.has(agent.id)) {
      throw new TemplateValidationError(`Duplicate agent id: "${agent.id}"`);
    }
    agentIds.add(agent.id);
  }

  // Validate tasks reference valid agents
  const taskIds = new Set<string>();
  for (const task of input.tasks) {
    if (!task.id || task.id.trim().length === 0) {
      throw new TemplateValidationError('Each task must have a non-empty id');
    }
    if (taskIds.has(task.id)) {
      throw new TemplateValidationError(`Duplicate task id: "${task.id}"`);
    }
    taskIds.add(task.id);

    if (!task.agentId || task.agentId.trim().length === 0) {
      throw new TemplateValidationError(`Task "${task.id}" must have a non-empty agentId`);
    }
    if (!agentIds.has(task.agentId)) {
      throw new TemplateValidationError(
        `Task "${task.id}" references unknown agent "${task.agentId}"`,
      );
    }
  }

  // Validate task dependencies reference valid tasks
  for (const task of input.tasks) {
    if (task.dependencies) {
      for (const dep of task.dependencies) {
        if (!taskIds.has(dep)) {
          throw new TemplateValidationError(`Task "${task.id}" depends on unknown task "${dep}"`);
        }
        if (dep === task.id) {
          throw new TemplateValidationError(`Task "${task.id}" cannot depend on itself`);
        }
      }
    }
  }
}

function validateUpdateInput(input: UpdateTemplateInput): void {
  if (input.name !== undefined) {
    if (input.name.trim().length === 0) {
      throw new TemplateValidationError('Template name cannot be empty');
    }
    if (input.name.trim().length > 200) {
      throw new TemplateValidationError('Template name must be 200 characters or fewer');
    }
  }

  if (input.status !== undefined && !VALID_STATUSES.has(input.status)) {
    throw new TemplateValidationError(
      `Invalid status "${input.status}". Must be one of: draft, published, archived`,
    );
  }

  if (input.category !== undefined && !VALID_CATEGORIES.has(input.category)) {
    throw new TemplateValidationError(
      `Invalid category "${input.category}". Must be one of: ${[...VALID_CATEGORIES].join(', ')}`,
    );
  }

  if (input.agents !== undefined && !Array.isArray(input.agents)) {
    throw new TemplateValidationError('Agents must be an array');
  }

  if (input.tasks !== undefined && !Array.isArray(input.tasks)) {
    throw new TemplateValidationError('Tasks must be an array');
  }
}

// ---------------------------------------------------------------------------
// InMemoryTemplateStorage
// ---------------------------------------------------------------------------

/**
 * In-memory implementation of {@link TemplateStorageProvider}.
 *
 * @example
 * ```typescript
 * const storage = new InMemoryTemplateStorage();
 *
 * const template = await storage.create({
 *   name: 'Research Pipeline',
 *   category: 'research',
 *   agents: [{ id: 'researcher', role: 'Researcher', goal: 'Find papers' }],
 *   tasks: [{ id: 'search', description: 'Search for papers', agentId: 'researcher' }],
 * });
 *
 * const found = await storage.get(template.id);
 * ```
 */
export class InMemoryTemplateStorage implements TemplateStorageProvider {
  private readonly _store = new Map<string, StoredTemplate>();

  /** Number of templates currently stored. */
  get size(): number {
    return this._store.size;
  }

  async create(input: CreateTemplateInput): Promise<StoredTemplate> {
    validateCreateInput(input);

    const now = new Date().toISOString();
    const template: StoredTemplate = {
      id: generateTemplateId(),
      name: input.name.trim(),
      description: input.description?.trim(),
      category: input.category,
      status: 'draft',
      agents: [...input.agents],
      tasks: [...input.tasks],
      tags: input.tags ? [...input.tags] : undefined,
      metadata: input.metadata ? { ...input.metadata } : undefined,
      author: input.author?.trim(),
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    this._store.set(template.id, template);
    return template;
  }

  async get(id: string): Promise<StoredTemplate | undefined> {
    return this._store.get(id);
  }

  async list(options?: ListTemplatesOptions): Promise<ListTemplatesResult> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const sortBy = options?.sortBy ?? 'updatedAt';
    const sortOrder = options?.sortOrder ?? 'desc';

    let templates = Array.from(this._store.values());

    // Apply filters
    if (options?.status) {
      templates = templates.filter((t) => t.status === options.status);
    }
    if (options?.category) {
      templates = templates.filter((t) => t.category === options.category);
    }
    if (options?.tag) {
      const tag = options.tag;
      templates = templates.filter((t) => t.tags?.includes(tag));
    }
    if (options?.search) {
      const search = options.search.toLowerCase();
      templates = templates.filter((t) => t.name.toLowerCase().includes(search));
    }

    const total = templates.length;

    // Sort
    templates.sort((a, b) => {
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
    templates = templates.slice(offset, offset + limit);

    return { templates, total };
  }

  async update(id: string, input: UpdateTemplateInput): Promise<StoredTemplate> {
    const existing = this._store.get(id);
    if (!existing) {
      throw new TemplateNotFoundError(id);
    }

    validateUpdateInput(input);

    // If agents or tasks are being replaced, cross-validate them
    const newAgents = input.agents ?? existing.agents;
    const newTasks = input.tasks ?? existing.tasks;
    if (input.agents !== undefined || input.tasks !== undefined) {
      validateCreateInput({
        name: input.name ?? existing.name,
        category: input.category ?? existing.category,
        agents: newAgents,
        tasks: newTasks,
      });
    }

    const updated: StoredTemplate = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      description:
        input.description !== undefined ? input.description?.trim() : existing.description,
      status: input.status ?? existing.status,
      category: input.category ?? existing.category,
      agents: input.agents !== undefined ? [...input.agents] : existing.agents,
      tasks: input.tasks !== undefined ? [...input.tasks] : existing.tasks,
      tags: input.tags !== undefined ? [...input.tags] : existing.tags,
      metadata: input.metadata !== undefined ? { ...input.metadata } : existing.metadata,
      author: input.author !== undefined ? input.author?.trim() : existing.author,
      updatedAt: new Date().toISOString(),
      version: existing.version + 1,
    };

    this._store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this._store.delete(id);
  }

  /** Remove all stored templates. Primarily for testing. */
  clear(): void {
    this._store.clear();
  }
}
