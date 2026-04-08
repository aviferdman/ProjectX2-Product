/**
 * Tests for the workflow storage API (CRUD operations).
 */
import { describe, it, expect, beforeEach } from 'vitest';

import {
  InMemoryWorkflowStorage,
  _resetIdCounter,
} from '../../src/workflow/index.js';
import { WorkflowNotFoundError, WorkflowValidationError } from '../../src/workflow/index.js';
import type {
  CreateWorkflowInput,
  StoredWorkflow,
} from '../../src/workflow/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInput(overrides?: Partial<CreateWorkflowInput>): CreateWorkflowInput {
  return {
    name: 'Test Workflow',
    agents: [
      { id: 'agent-1', role: 'Researcher', goal: 'Find information' },
      { id: 'agent-2', role: 'Writer', goal: 'Write summaries' },
    ],
    tasks: [
      { id: 'task-1', description: 'Search for papers', agentId: 'agent-1' },
      {
        id: 'task-2',
        description: 'Summarize findings',
        agentId: 'agent-2',
        dependencies: ['task-1'],
      },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('InMemoryWorkflowStorage', () => {
  let storage: InMemoryWorkflowStorage;

  beforeEach(() => {
    storage = new InMemoryWorkflowStorage();
    _resetIdCounter();
  });

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('creates a workflow with generated id and timestamps', async () => {
      const input = makeInput();
      const result = await storage.create(input);

      expect(result.id).toMatch(/^wf_/);
      expect(result.name).toBe('Test Workflow');
      expect(result.status).toBe('draft');
      expect(result.version).toBe(1);
      expect(result.agents).toHaveLength(2);
      expect(result.tasks).toHaveLength(2);
      expect(result.createdAt).toBeTruthy();
      expect(result.updatedAt).toBe(result.createdAt);
    });

    it('trims the workflow name', async () => {
      const result = await storage.create(makeInput({ name: '  Padded Name  ' }));
      expect(result.name).toBe('Padded Name');
    });

    it('stores optional description, tags, and metadata', async () => {
      const result = await storage.create(
        makeInput({
          description: 'My pipeline',
          tags: ['research', 'ai'],
          metadata: { owner: 'test-user' },
        }),
      );

      expect(result.description).toBe('My pipeline');
      expect(result.tags).toEqual(['research', 'ai']);
      expect(result.metadata).toEqual({ owner: 'test-user' });
    });

    it('increments storage size', async () => {
      expect(storage.size).toBe(0);
      await storage.create(makeInput());
      expect(storage.size).toBe(1);
      await storage.create(makeInput({ name: 'Second' }));
      expect(storage.size).toBe(2);
    });

    // Validation
    it('rejects empty name', async () => {
      await expect(storage.create(makeInput({ name: '' }))).rejects.toThrow(
        WorkflowValidationError,
      );
      await expect(storage.create(makeInput({ name: '   ' }))).rejects.toThrow(
        WorkflowValidationError,
      );
    });

    it('rejects name over 200 characters', async () => {
      await expect(storage.create(makeInput({ name: 'x'.repeat(201) }))).rejects.toThrow(
        WorkflowValidationError,
      );
    });

    it('rejects duplicate agent ids', async () => {
      await expect(
        storage.create(
          makeInput({
            agents: [
              { id: 'dup', role: 'R', goal: 'G' },
              { id: 'dup', role: 'R2', goal: 'G2' },
            ],
            tasks: [{ id: 't', description: 'd', agentId: 'dup' }],
          }),
        ),
      ).rejects.toThrow(/Duplicate agent id/);
    });

    it('rejects duplicate task ids', async () => {
      await expect(
        storage.create(
          makeInput({
            agents: [{ id: 'a', role: 'R', goal: 'G' }],
            tasks: [
              { id: 'dup', description: 'd1', agentId: 'a' },
              { id: 'dup', description: 'd2', agentId: 'a' },
            ],
          }),
        ),
      ).rejects.toThrow(/Duplicate task id/);
    });

    it('rejects task referencing unknown agent', async () => {
      await expect(
        storage.create(
          makeInput({
            agents: [{ id: 'a', role: 'R', goal: 'G' }],
            tasks: [{ id: 't', description: 'd', agentId: 'nonexistent' }],
          }),
        ),
      ).rejects.toThrow(/unknown agent/);
    });

    it('rejects task referencing unknown dependency', async () => {
      await expect(
        storage.create(
          makeInput({
            agents: [{ id: 'a', role: 'R', goal: 'G' }],
            tasks: [{ id: 't', description: 'd', agentId: 'a', dependencies: ['missing'] }],
          }),
        ),
      ).rejects.toThrow(/unknown task/);
    });

    it('rejects task depending on itself', async () => {
      await expect(
        storage.create(
          makeInput({
            agents: [{ id: 'a', role: 'R', goal: 'G' }],
            tasks: [{ id: 't', description: 'd', agentId: 'a', dependencies: ['t'] }],
          }),
        ),
      ).rejects.toThrow(/cannot depend on itself/);
    });

    it('rejects agent with empty role or goal', async () => {
      await expect(
        storage.create(
          makeInput({
            agents: [{ id: 'a', role: '', goal: 'G' }],
            tasks: [{ id: 't', description: 'd', agentId: 'a' }],
          }),
        ),
      ).rejects.toThrow(/non-empty role/);

      await expect(
        storage.create(
          makeInput({
            agents: [{ id: 'a', role: 'R', goal: '' }],
            tasks: [{ id: 't', description: 'd', agentId: 'a' }],
          }),
        ),
      ).rejects.toThrow(/non-empty goal/);
    });
  });

  // -------------------------------------------------------------------------
  // GET
  // -------------------------------------------------------------------------

  describe('get', () => {
    it('retrieves a workflow by id', async () => {
      const created = await storage.create(makeInput());
      const found = await storage.get(created.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe('Test Workflow');
    });

    it('returns undefined for unknown id', async () => {
      const result = await storage.get('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // LIST
  // -------------------------------------------------------------------------

  describe('list', () => {
    let wf1: StoredWorkflow;
    let wf2: StoredWorkflow;
    let wf3: StoredWorkflow;

    beforeEach(async () => {
      wf1 = await storage.create(makeInput({ name: 'Alpha', tags: ['research'] }));
      wf2 = await storage.create(makeInput({ name: 'Beta', tags: ['research', 'ai'] }));
      wf3 = await storage.create(makeInput({ name: 'Gamma', tags: ['production'] }));

      // Activate wf2
      await storage.update(wf2.id, { status: 'active' });
      // Archive wf3
      await storage.update(wf3.id, { status: 'archived' });
    });

    it('lists all workflows with default options', async () => {
      const result = await storage.list();
      expect(result.total).toBe(3);
      expect(result.workflows).toHaveLength(3);
    });

    it('filters by status', async () => {
      const drafts = await storage.list({ status: 'draft' });
      expect(drafts.total).toBe(1);
      expect(drafts.workflows[0].name).toBe('Alpha');

      const active = await storage.list({ status: 'active' });
      expect(active.total).toBe(1);
      expect(active.workflows[0].name).toBe('Beta');
    });

    it('filters by tag', async () => {
      const research = await storage.list({ tag: 'research' });
      expect(research.total).toBe(2);

      const ai = await storage.list({ tag: 'ai' });
      expect(ai.total).toBe(1);
      expect(ai.workflows[0].name).toBe('Beta');
    });

    it('combines status and tag filters', async () => {
      const result = await storage.list({ status: 'draft', tag: 'research' });
      expect(result.total).toBe(1);
      expect(result.workflows[0].name).toBe('Alpha');
    });

    it('paginates with limit and offset', async () => {
      const page1 = await storage.list({ limit: 2, offset: 0 });
      expect(page1.workflows).toHaveLength(2);
      expect(page1.total).toBe(3);

      const page2 = await storage.list({ limit: 2, offset: 2 });
      expect(page2.workflows).toHaveLength(1);
      expect(page2.total).toBe(3);
    });

    it('sorts by name ascending', async () => {
      const result = await storage.list({ sortBy: 'name', sortOrder: 'asc' });
      const names = result.workflows.map((w) => w.name);
      expect(names).toEqual(['Alpha', 'Beta', 'Gamma']);
    });

    it('sorts by name descending', async () => {
      const result = await storage.list({ sortBy: 'name', sortOrder: 'desc' });
      const names = result.workflows.map((w) => w.name);
      expect(names).toEqual(['Gamma', 'Beta', 'Alpha']);
    });

    it('returns empty result when no workflows match', async () => {
      const result = await storage.list({ tag: 'nonexistent' });
      expect(result.total).toBe(0);
      expect(result.workflows).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  describe('update', () => {
    let created: StoredWorkflow;

    beforeEach(async () => {
      created = await storage.create(makeInput({ description: 'Original' }));
    });

    it('updates name and description', async () => {
      const updated = await storage.update(created.id, {
        name: 'Updated Name',
        description: 'Updated desc',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated desc');
      expect(updated.version).toBe(2);
      // updatedAt is refreshed (may equal createdAt if same ms, so just check it's set)
      expect(updated.updatedAt).toBeTruthy();
      expect(updated.createdAt).toBe(created.createdAt);
    });

    it('updates status', async () => {
      const updated = await storage.update(created.id, { status: 'active' });
      expect(updated.status).toBe('active');
    });

    it('updates agents and tasks together', async () => {
      const updated = await storage.update(created.id, {
        agents: [{ id: 'new-agent', role: 'Coder', goal: 'Write code' }],
        tasks: [{ id: 'new-task', description: 'Code it', agentId: 'new-agent' }],
      });

      expect(updated.agents).toHaveLength(1);
      expect(updated.agents[0].id).toBe('new-agent');
      expect(updated.tasks).toHaveLength(1);
    });

    it('updates tags and metadata', async () => {
      const updated = await storage.update(created.id, {
        tags: ['new-tag'],
        metadata: { key: 'value' },
      });

      expect(updated.tags).toEqual(['new-tag']);
      expect(updated.metadata).toEqual({ key: 'value' });
    });

    it('preserves fields not included in update', async () => {
      const updated = await storage.update(created.id, { name: 'New Name' });
      expect(updated.description).toBe('Original');
      expect(updated.agents).toEqual(created.agents);
      expect(updated.tasks).toEqual(created.tasks);
    });

    it('increments version on each update', async () => {
      await storage.update(created.id, { name: 'V2' });
      const v3 = await storage.update(created.id, { name: 'V3' });
      expect(v3.version).toBe(3);
    });

    it('throws WorkflowNotFoundError for unknown id', async () => {
      await expect(storage.update('nonexistent', { name: 'X' })).rejects.toThrow(
        WorkflowNotFoundError,
      );
    });

    it('validates update input', async () => {
      await expect(storage.update(created.id, { name: '' })).rejects.toThrow(
        WorkflowValidationError,
      );

      await expect(
        storage.update(created.id, { status: 'invalid' as any }),
      ).rejects.toThrow(WorkflowValidationError);
    });

    it('cross-validates agents and tasks on update', async () => {
      await expect(
        storage.update(created.id, {
          tasks: [{ id: 't', description: 'd', agentId: 'nonexistent' }],
        }),
      ).rejects.toThrow(/unknown agent/);
    });
  });

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  describe('delete', () => {
    it('deletes an existing workflow', async () => {
      const created = await storage.create(makeInput());
      expect(storage.size).toBe(1);

      const deleted = await storage.delete(created.id);
      expect(deleted).toBe(true);
      expect(storage.size).toBe(0);

      const found = await storage.get(created.id);
      expect(found).toBeUndefined();
    });

    it('returns false for unknown id', async () => {
      const result = await storage.delete('nonexistent');
      expect(result).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // CLEAR
  // -------------------------------------------------------------------------

  describe('clear', () => {
    it('removes all workflows', async () => {
      await storage.create(makeInput({ name: 'W1' }));
      await storage.create(makeInput({ name: 'W2' }));
      expect(storage.size).toBe(2);

      storage.clear();
      expect(storage.size).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Error type checks
  // -------------------------------------------------------------------------

  describe('error types', () => {
    it('WorkflowNotFoundError has correct properties', () => {
      const err = new WorkflowNotFoundError('wf_123');
      expect(err.name).toBe('WorkflowNotFoundError');
      expect(err.workflowId).toBe('wf_123');
      expect(err.message).toContain('wf_123');
      expect(err.toJSON().details).toEqual({ workflowId: 'wf_123' });
    });

    it('WorkflowValidationError has correct properties', () => {
      const err = new WorkflowValidationError('bad input');
      expect(err.name).toBe('WorkflowValidationError');
      expect(err.message).toBe('bad input');
    });
  });
});
