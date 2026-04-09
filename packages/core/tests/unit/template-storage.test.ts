/**
 * Tests for the template storage API (CRUD operations).
 */
import { describe, it, expect, beforeEach } from 'vitest';

import {
  InMemoryTemplateStorage,
  _resetTemplateIdCounter,
} from '../../src/template/index.js';
import { TemplateNotFoundError, TemplateValidationError } from '../../src/template/index.js';
import type {
  CreateTemplateInput,
  StoredTemplate,
} from '../../src/template/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInput(overrides?: Partial<CreateTemplateInput>): CreateTemplateInput {
  return {
    name: 'Test Template',
    category: 'research',
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

describe('InMemoryTemplateStorage', () => {
  let storage: InMemoryTemplateStorage;

  beforeEach(() => {
    storage = new InMemoryTemplateStorage();
    _resetTemplateIdCounter();
  });

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('creates a template with generated id and timestamps', async () => {
      const input = makeInput();
      const result = await storage.create(input);

      expect(result.id).toMatch(/^tmpl_/);
      expect(result.name).toBe('Test Template');
      expect(result.category).toBe('research');
      expect(result.status).toBe('draft');
      expect(result.version).toBe(1);
      expect(result.agents).toHaveLength(2);
      expect(result.tasks).toHaveLength(2);
      expect(result.createdAt).toBeTruthy();
      expect(result.updatedAt).toBe(result.createdAt);
    });

    it('trims the template name', async () => {
      const result = await storage.create(makeInput({ name: '  Padded Name  ' }));
      expect(result.name).toBe('Padded Name');
    });

    it('stores optional description, tags, metadata, and author', async () => {
      const result = await storage.create(
        makeInput({
          description: 'My research template',
          tags: ['ai', 'papers'],
          metadata: { difficulty: 'beginner' },
          author: 'Crewspace Team',
        }),
      );

      expect(result.description).toBe('My research template');
      expect(result.tags).toEqual(['ai', 'papers']);
      expect(result.metadata).toEqual({ difficulty: 'beginner' });
      expect(result.author).toBe('Crewspace Team');
    });

    it('increments storage size', async () => {
      expect(storage.size).toBe(0);
      await storage.create(makeInput());
      expect(storage.size).toBe(1);
      await storage.create(makeInput({ name: 'Second' }));
      expect(storage.size).toBe(2);
    });

    it('assigns unique ids to each template', async () => {
      const t1 = await storage.create(makeInput({ name: 'First' }));
      const t2 = await storage.create(makeInput({ name: 'Second' }));
      expect(t1.id).not.toBe(t2.id);
    });

    // Validation — name
    it('rejects empty name', async () => {
      await expect(storage.create(makeInput({ name: '' }))).rejects.toThrow(
        TemplateValidationError,
      );
      await expect(storage.create(makeInput({ name: '   ' }))).rejects.toThrow(
        TemplateValidationError,
      );
    });

    it('rejects name over 200 characters', async () => {
      await expect(storage.create(makeInput({ name: 'x'.repeat(201) }))).rejects.toThrow(
        TemplateValidationError,
      );
    });

    // Validation — category
    it('rejects invalid category', async () => {
      await expect(
        storage.create(makeInput({ category: 'invalid' as any })),
      ).rejects.toThrow(TemplateValidationError);
    });

    it('accepts all valid categories', async () => {
      const categories = [
        'research',
        'content',
        'coding',
        'data-analysis',
        'automation',
        'customer-support',
        'other',
      ] as const;

      for (const category of categories) {
        const result = await storage.create(makeInput({ name: `Cat-${category}`, category }));
        expect(result.category).toBe(category);
      }
    });

    // Validation — agents
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

    // Validation — tasks
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
  });

  // -------------------------------------------------------------------------
  // GET
  // -------------------------------------------------------------------------

  describe('get', () => {
    it('retrieves a template by id', async () => {
      const created = await storage.create(makeInput());
      const found = await storage.get(created.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe('Test Template');
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
    let t1: StoredTemplate;
    let t2: StoredTemplate;
    let t3: StoredTemplate;

    beforeEach(async () => {
      t1 = await storage.create(
        makeInput({ name: 'Alpha Research', category: 'research', tags: ['ai'] }),
      );
      t2 = await storage.create(
        makeInput({ name: 'Beta Content', category: 'content', tags: ['ai', 'writing'] }),
      );
      t3 = await storage.create(
        makeInput({ name: 'Gamma Coding', category: 'coding', tags: ['automation'] }),
      );

      // Publish t2
      await storage.update(t2.id, { status: 'published' });
      // Archive t3
      await storage.update(t3.id, { status: 'archived' });
    });

    it('lists all templates with default options', async () => {
      const result = await storage.list();
      expect(result.total).toBe(3);
      expect(result.templates).toHaveLength(3);
    });

    it('filters by status', async () => {
      const drafts = await storage.list({ status: 'draft' });
      expect(drafts.total).toBe(1);
      expect(drafts.templates[0].name).toBe('Alpha Research');

      const published = await storage.list({ status: 'published' });
      expect(published.total).toBe(1);
      expect(published.templates[0].name).toBe('Beta Content');
    });

    it('filters by category', async () => {
      const research = await storage.list({ category: 'research' });
      expect(research.total).toBe(1);
      expect(research.templates[0].name).toBe('Alpha Research');

      const content = await storage.list({ category: 'content' });
      expect(content.total).toBe(1);
      expect(content.templates[0].name).toBe('Beta Content');
    });

    it('filters by tag', async () => {
      const ai = await storage.list({ tag: 'ai' });
      expect(ai.total).toBe(2);

      const writing = await storage.list({ tag: 'writing' });
      expect(writing.total).toBe(1);
      expect(writing.templates[0].name).toBe('Beta Content');
    });

    it('searches by name (case-insensitive)', async () => {
      const result = await storage.list({ search: 'alpha' });
      expect(result.total).toBe(1);
      expect(result.templates[0].name).toBe('Alpha Research');

      const result2 = await storage.list({ search: 'CONTENT' });
      expect(result2.total).toBe(1);
      expect(result2.templates[0].name).toBe('Beta Content');
    });

    it('combines multiple filters', async () => {
      const result = await storage.list({ status: 'draft', tag: 'ai' });
      expect(result.total).toBe(1);
      expect(result.templates[0].name).toBe('Alpha Research');
    });

    it('paginates with limit and offset', async () => {
      const page1 = await storage.list({ limit: 2, offset: 0 });
      expect(page1.templates).toHaveLength(2);
      expect(page1.total).toBe(3);

      const page2 = await storage.list({ limit: 2, offset: 2 });
      expect(page2.templates).toHaveLength(1);
      expect(page2.total).toBe(3);
    });

    it('sorts by name ascending', async () => {
      const result = await storage.list({ sortBy: 'name', sortOrder: 'asc' });
      const names = result.templates.map((t) => t.name);
      expect(names).toEqual(['Alpha Research', 'Beta Content', 'Gamma Coding']);
    });

    it('sorts by name descending', async () => {
      const result = await storage.list({ sortBy: 'name', sortOrder: 'desc' });
      const names = result.templates.map((t) => t.name);
      expect(names).toEqual(['Gamma Coding', 'Beta Content', 'Alpha Research']);
    });

    it('returns empty result when no templates match', async () => {
      const result = await storage.list({ tag: 'nonexistent' });
      expect(result.total).toBe(0);
      expect(result.templates).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  describe('update', () => {
    let created: StoredTemplate;

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
      expect(updated.updatedAt).toBeTruthy();
      expect(updated.createdAt).toBe(created.createdAt);
    });

    it('updates status', async () => {
      const updated = await storage.update(created.id, { status: 'published' });
      expect(updated.status).toBe('published');
    });

    it('updates category', async () => {
      const updated = await storage.update(created.id, { category: 'coding' });
      expect(updated.category).toBe('coding');
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

    it('updates tags, metadata, and author', async () => {
      const updated = await storage.update(created.id, {
        tags: ['new-tag'],
        metadata: { key: 'value' },
        author: 'New Author',
      });

      expect(updated.tags).toEqual(['new-tag']);
      expect(updated.metadata).toEqual({ key: 'value' });
      expect(updated.author).toBe('New Author');
    });

    it('preserves fields not included in update', async () => {
      const updated = await storage.update(created.id, { name: 'New Name' });
      expect(updated.description).toBe('Original');
      expect(updated.category).toBe('research');
      expect(updated.agents).toEqual(created.agents);
      expect(updated.tasks).toEqual(created.tasks);
    });

    it('increments version on each update', async () => {
      await storage.update(created.id, { name: 'V2' });
      const v3 = await storage.update(created.id, { name: 'V3' });
      expect(v3.version).toBe(3);
    });

    it('throws TemplateNotFoundError for unknown id', async () => {
      await expect(storage.update('nonexistent', { name: 'X' })).rejects.toThrow(
        TemplateNotFoundError,
      );
    });

    it('validates update input', async () => {
      await expect(storage.update(created.id, { name: '' })).rejects.toThrow(
        TemplateValidationError,
      );

      await expect(
        storage.update(created.id, { status: 'invalid' as any }),
      ).rejects.toThrow(TemplateValidationError);

      await expect(
        storage.update(created.id, { category: 'invalid' as any }),
      ).rejects.toThrow(TemplateValidationError);
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
    it('deletes an existing template', async () => {
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
    it('removes all templates', async () => {
      await storage.create(makeInput({ name: 'T1' }));
      await storage.create(makeInput({ name: 'T2' }));
      expect(storage.size).toBe(2);

      storage.clear();
      expect(storage.size).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Error type checks
  // -------------------------------------------------------------------------

  describe('error types', () => {
    it('TemplateNotFoundError has correct properties', () => {
      const err = new TemplateNotFoundError('tmpl_123');
      expect(err.name).toBe('TemplateNotFoundError');
      expect(err.templateId).toBe('tmpl_123');
      expect(err.message).toContain('tmpl_123');
      expect(err.toJSON().details).toEqual({ templateId: 'tmpl_123' });
    });

    it('TemplateValidationError has correct properties', () => {
      const err = new TemplateValidationError('bad input');
      expect(err.name).toBe('TemplateValidationError');
      expect(err.message).toBe('bad input');
    });
  });
});
