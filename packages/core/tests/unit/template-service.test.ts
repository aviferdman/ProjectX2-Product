/**
 * Unit tests for TemplateLibraryService.
 *
 * Validates browsing, instantiation, popularity tracking, featured
 * templates, and duplicate functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryTemplateStorage,
  _resetTemplateIdCounter,
} from '../../src/template/template-storage.js';
import { InMemoryWorkflowStorage, _resetIdCounter } from '../../src/workflow/workflow-storage.js';
import { TemplateLibraryService } from '../../src/template/template-service.js';
import {
  TemplateNotFoundError,
  TemplateValidationError,
} from '../../src/template/template-errors.js';
import type {
  CreateTemplateInput,
  StoredTemplate,
} from '../../src/template/template-storage-types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTemplateInput(overrides: Partial<CreateTemplateInput> = {}): CreateTemplateInput {
  return {
    name: overrides.name ?? 'Research Pipeline',
    description: overrides.description ?? 'A pipeline for research tasks',
    category: overrides.category ?? 'research',
    agents: overrides.agents ?? [
      { id: 'researcher', role: 'Researcher', goal: 'Find relevant papers' },
    ],
    tasks: overrides.tasks ?? [
      { id: 'search', description: 'Search for papers', agentId: 'researcher' },
    ],
    tags: overrides.tags ?? ['research', 'papers'],
    author: overrides.author ?? 'test-author',
    metadata: overrides.metadata,
  };
}

async function createPublishedTemplate(
  storage: InMemoryTemplateStorage,
  overrides: Partial<CreateTemplateInput> = {},
): Promise<StoredTemplate> {
  const template = await storage.create(makeTemplateInput(overrides));
  return storage.update(template.id, { status: 'published' });
}

async function createDraftTemplate(
  storage: InMemoryTemplateStorage,
  overrides: Partial<CreateTemplateInput> = {},
): Promise<StoredTemplate> {
  return storage.create(makeTemplateInput(overrides));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TemplateLibraryService', () => {
  let templateStorage: InMemoryTemplateStorage;
  let workflowStorage: InMemoryWorkflowStorage;
  let service: TemplateLibraryService;

  beforeEach(() => {
    _resetTemplateIdCounter();
    _resetIdCounter();
    templateStorage = new InMemoryTemplateStorage();
    workflowStorage = new InMemoryWorkflowStorage();
    service = new TemplateLibraryService(templateStorage, workflowStorage);
  });

  // -----------------------------------------------------------------------
  // Constructor & accessors
  // -----------------------------------------------------------------------

  describe('constructor', () => {
    it('exposes the underlying storage providers', () => {
      expect(service.templateStorage).toBe(templateStorage);
      expect(service.workflowStorage).toBe(workflowStorage);
    });
  });

  // -----------------------------------------------------------------------
  // Browse
  // -----------------------------------------------------------------------

  describe('browse', () => {
    it('returns only published templates', async () => {
      await createPublishedTemplate(templateStorage, { name: 'Published' });
      await createDraftTemplate(templateStorage, { name: 'Draft' });

      const result = await service.browse();

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0]!.template.name).toBe('Published');
      expect(result.total).toBe(1);
    });

    it('returns empty result when no published templates exist', async () => {
      await createDraftTemplate(templateStorage);

      const result = await service.browse();

      expect(result.templates).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('filters by category', async () => {
      await createPublishedTemplate(templateStorage, { name: 'Research', category: 'research' });
      await createPublishedTemplate(templateStorage, { name: 'Coding', category: 'coding' });

      const result = await service.browse({ category: 'research' });

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0]!.template.name).toBe('Research');
    });

    it('filters by tag', async () => {
      await createPublishedTemplate(templateStorage, { name: 'A', tags: ['ai', 'ml'] });
      await createPublishedTemplate(templateStorage, { name: 'B', tags: ['web'] });

      const result = await service.browse({ tag: 'ai' });

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0]!.template.name).toBe('A');
    });

    it('filters by search term', async () => {
      await createPublishedTemplate(templateStorage, { name: 'Data Analysis' });
      await createPublishedTemplate(templateStorage, { name: 'Code Review' });

      const result = await service.browse({ search: 'data' });

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0]!.template.name).toBe('Data Analysis');
    });

    it('sorts by popularity (default)', async () => {
      const t1 = await createPublishedTemplate(templateStorage, { name: 'Popular' });
      const t2 = await createPublishedTemplate(templateStorage, { name: 'Less Popular' });

      // Instantiate t1 twice, t2 once
      await service.instantiate(t1.id);
      await service.instantiate(t1.id);
      await service.instantiate(t2.id);

      const result = await service.browse();

      expect(result.templates[0]!.template.name).toBe('Popular');
      expect(result.templates[0]!.stats.useCount).toBe(2);
      expect(result.templates[1]!.template.name).toBe('Less Popular');
      expect(result.templates[1]!.stats.useCount).toBe(1);
    });

    it('sorts by newest', async () => {
      await createPublishedTemplate(templateStorage, { name: 'Older' });
      // small delay for different timestamps
      await new Promise((r) => setTimeout(r, 5));
      await createPublishedTemplate(templateStorage, { name: 'Newer' });

      const result = await service.browse({ sortBy: 'newest' });

      expect(result.templates[0]!.template.name).toBe('Newer');
      expect(result.templates[1]!.template.name).toBe('Older');
    });

    it('sorts by name', async () => {
      await createPublishedTemplate(templateStorage, { name: 'Zeta' });
      await createPublishedTemplate(templateStorage, { name: 'Alpha' });

      const result = await service.browse({ sortBy: 'name' });

      expect(result.templates[0]!.template.name).toBe('Alpha');
      expect(result.templates[1]!.template.name).toBe('Zeta');
    });

    it('paginates results', async () => {
      for (let i = 0; i < 5; i++) {
        await createPublishedTemplate(templateStorage, { name: `Template ${i}` });
      }

      const page1 = await service.browse({ limit: 2, offset: 0 });
      const page2 = await service.browse({ limit: 2, offset: 2 });

      expect(page1.templates).toHaveLength(2);
      expect(page1.total).toBe(5);
      expect(page2.templates).toHaveLength(2);
      expect(page2.total).toBe(5);
    });

    it('includes stats for each template', async () => {
      await createPublishedTemplate(templateStorage, { name: 'T1' });

      const result = await service.browse();

      expect(result.templates[0]!.stats).toEqual({
        templateId: result.templates[0]!.template.id,
        useCount: 0,
        lastUsedAt: undefined,
      });
    });
  });

  // -----------------------------------------------------------------------
  // Instantiate
  // -----------------------------------------------------------------------

  describe('instantiate', () => {
    it('creates a workflow from a published template', async () => {
      const template = await createPublishedTemplate(templateStorage, {
        name: 'Research Pipeline',
        description: 'Finds papers',
      });

      const result = await service.instantiate(template.id);

      expect(result.templateId).toBe(template.id);
      expect(result.workflowName).toBe('Research Pipeline');
      expect(result.workflowId).toBeDefined();
      expect(result.instantiatedAt).toBeDefined();

      // Verify workflow was created
      const workflow = await workflowStorage.get(result.workflowId);
      expect(workflow).toBeDefined();
      expect(workflow!.name).toBe('Research Pipeline');
      expect(workflow!.agents).toHaveLength(1);
      expect(workflow!.tasks).toHaveLength(1);
      expect(workflow!.metadata?._sourceTemplateId).toBe(template.id);
    });

    it('uses custom workflow name when provided', async () => {
      const template = await createPublishedTemplate(templateStorage);

      const result = await service.instantiate(template.id, {
        workflowName: 'My Custom Name',
      });

      expect(result.workflowName).toBe('My Custom Name');
      const workflow = await workflowStorage.get(result.workflowId);
      expect(workflow!.name).toBe('My Custom Name');
    });

    it('passes through custom options to the workflow', async () => {
      const template = await createPublishedTemplate(templateStorage);

      const result = await service.instantiate(template.id, {
        workflowDescription: 'Custom desc',
        workflowTags: ['custom-tag'],
        workflowMetadata: { env: 'staging' },
      });

      const workflow = await workflowStorage.get(result.workflowId);
      expect(workflow!.description).toBe('Custom desc');
      expect(workflow!.tags).toContain('custom-tag');
      expect(workflow!.metadata?.env).toBe('staging');
      expect(workflow!.metadata?._sourceTemplateId).toBe(template.id);
    });

    it('increments use count on instantiation', async () => {
      const template = await createPublishedTemplate(templateStorage);

      await service.instantiate(template.id);
      await service.instantiate(template.id);

      const stats = service.getPopularityStats(template.id);
      expect(stats.useCount).toBe(2);
      expect(stats.lastUsedAt).toBeDefined();
    });

    it('throws TemplateNotFoundError for nonexistent template', async () => {
      await expect(service.instantiate('nonexistent')).rejects.toThrow(TemplateNotFoundError);
    });

    it('throws TemplateValidationError for draft template', async () => {
      const draft = await createDraftTemplate(templateStorage);

      await expect(service.instantiate(draft.id)).rejects.toThrow(TemplateValidationError);
    });

    it('throws TemplateValidationError for archived template', async () => {
      const template = await createPublishedTemplate(templateStorage);
      await templateStorage.update(template.id, { status: 'archived' });

      await expect(service.instantiate(template.id)).rejects.toThrow(TemplateValidationError);
    });

    it('copies agents and tasks independently from the template', async () => {
      const agents = [
        { id: 'a1', role: 'Role A', goal: 'Goal A' },
        { id: 'a2', role: 'Role B', goal: 'Goal B' },
      ];
      const tasks = [
        { id: 't1', description: 'Task 1', agentId: 'a1' },
        {
          id: 't2',
          description: 'Task 2',
          agentId: 'a2',
          dependencies: ['t1'] as readonly string[],
        },
      ];

      const template = await createPublishedTemplate(templateStorage, {
        agents,
        tasks,
      });

      const result = await service.instantiate(template.id);
      const workflow = await workflowStorage.get(result.workflowId);

      expect(workflow!.agents).toHaveLength(2);
      expect(workflow!.tasks).toHaveLength(2);
      expect(workflow!.tasks[1]!.dependencies).toEqual(['t1']);
    });
  });

  // -----------------------------------------------------------------------
  // Popularity
  // -----------------------------------------------------------------------

  describe('getPopularityStats', () => {
    it('returns zero counts for unused template', async () => {
      const stats = service.getPopularityStats('tmpl_unused');

      expect(stats.templateId).toBe('tmpl_unused');
      expect(stats.useCount).toBe(0);
      expect(stats.lastUsedAt).toBeUndefined();
    });

    it('tracks multiple instantiations', async () => {
      const template = await createPublishedTemplate(templateStorage);

      await service.instantiate(template.id);
      await service.instantiate(template.id);
      await service.instantiate(template.id);

      const stats = service.getPopularityStats(template.id);
      expect(stats.useCount).toBe(3);
    });
  });

  describe('getPopularTemplates', () => {
    it('returns templates sorted by use count descending', async () => {
      const t1 = await createPublishedTemplate(templateStorage, { name: 'T1' });
      const t2 = await createPublishedTemplate(templateStorage, { name: 'T2' });
      const t3 = await createPublishedTemplate(templateStorage, { name: 'T3' });

      await service.instantiate(t2.id);
      await service.instantiate(t2.id);
      await service.instantiate(t2.id);
      await service.instantiate(t1.id);

      const popular = await service.getPopularTemplates(3);

      expect(popular).toHaveLength(3);
      expect(popular[0]!.template.name).toBe('T2');
      expect(popular[0]!.stats.useCount).toBe(3);
      expect(popular[1]!.template.name).toBe('T1');
      expect(popular[1]!.stats.useCount).toBe(1);
      expect(popular[2]!.template.name).toBe('T3');
      expect(popular[2]!.stats.useCount).toBe(0);
    });

    it('limits results', async () => {
      for (let i = 0; i < 5; i++) {
        await createPublishedTemplate(templateStorage, { name: `T${i}` });
      }

      const popular = await service.getPopularTemplates(2);

      expect(popular).toHaveLength(2);
    });

    it('excludes non-published templates', async () => {
      const published = await createPublishedTemplate(templateStorage, { name: 'Published' });
      await createDraftTemplate(templateStorage, { name: 'Draft' });

      await service.instantiate(published.id);

      const popular = await service.getPopularTemplates();

      expect(popular).toHaveLength(1);
      expect(popular[0]!.template.name).toBe('Published');
    });
  });

  // -----------------------------------------------------------------------
  // Featured templates
  // -----------------------------------------------------------------------

  describe('featured templates', () => {
    it('sets a template as featured', async () => {
      const template = await createPublishedTemplate(templateStorage);

      const featured = await service.setFeatured(template.id, 1, 'Great template');

      expect(featured.template.id).toBe(template.id);
      expect(featured.displayOrder).toBe(1);
      expect(featured.featuredReason).toBe('Great template');
    });

    it('checks if template is featured', async () => {
      const template = await createPublishedTemplate(templateStorage);

      expect(service.isFeatured(template.id)).toBe(false);

      await service.setFeatured(template.id, 1);

      expect(service.isFeatured(template.id)).toBe(true);
    });

    it('removes featured status', async () => {
      const template = await createPublishedTemplate(templateStorage);

      await service.setFeatured(template.id, 1);
      const removed = service.removeFeatured(template.id);

      expect(removed).toBe(true);
      expect(service.isFeatured(template.id)).toBe(false);
    });

    it('returns false when removing non-featured template', () => {
      const removed = service.removeFeatured('nonexistent');
      expect(removed).toBe(false);
    });

    it('gets featured templates sorted by display order', async () => {
      const t1 = await createPublishedTemplate(templateStorage, { name: 'Second' });
      const t2 = await createPublishedTemplate(templateStorage, { name: 'First' });
      const t3 = await createPublishedTemplate(templateStorage, { name: 'Third' });

      await service.setFeatured(t1.id, 2);
      await service.setFeatured(t2.id, 1);
      await service.setFeatured(t3.id, 3);

      const featured = await service.getFeaturedTemplates();

      expect(featured).toHaveLength(3);
      expect(featured[0]!.template.name).toBe('First');
      expect(featured[1]!.template.name).toBe('Second');
      expect(featured[2]!.template.name).toBe('Third');
    });

    it('auto-removes stale featured entries (deleted templates)', async () => {
      const template = await createPublishedTemplate(templateStorage);

      await service.setFeatured(template.id, 1);
      await templateStorage.delete(template.id);

      const featured = await service.getFeaturedTemplates();

      expect(featured).toHaveLength(0);
      expect(service.isFeatured(template.id)).toBe(false);
    });

    it('auto-removes stale featured entries (unpublished templates)', async () => {
      const template = await createPublishedTemplate(templateStorage);

      await service.setFeatured(template.id, 1);
      await templateStorage.update(template.id, { status: 'archived' });

      const featured = await service.getFeaturedTemplates();

      expect(featured).toHaveLength(0);
    });

    it('throws TemplateNotFoundError when featuring nonexistent template', async () => {
      await expect(service.setFeatured('nonexistent', 1)).rejects.toThrow(TemplateNotFoundError);
    });

    it('enforces max featured templates limit', async () => {
      const customService = new TemplateLibraryService(templateStorage, workflowStorage, {
        maxFeaturedTemplates: 2,
      });

      const t1 = await createPublishedTemplate(templateStorage, { name: 'T1' });
      const t2 = await createPublishedTemplate(templateStorage, { name: 'T2' });
      const t3 = await createPublishedTemplate(templateStorage, { name: 'T3' });

      await customService.setFeatured(t1.id, 1);
      await customService.setFeatured(t2.id, 2);

      await expect(customService.setFeatured(t3.id, 3)).rejects.toThrow(TemplateValidationError);
    });

    it('allows updating display order of already-featured template', async () => {
      const customService = new TemplateLibraryService(templateStorage, workflowStorage, {
        maxFeaturedTemplates: 1,
      });

      const template = await createPublishedTemplate(templateStorage);

      await customService.setFeatured(template.id, 1);
      // Should not throw — updating existing
      const updated = await customService.setFeatured(template.id, 5, 'Updated reason');

      expect(updated.displayOrder).toBe(5);
      expect(updated.featuredReason).toBe('Updated reason');
    });
  });

  // -----------------------------------------------------------------------
  // Duplicate
  // -----------------------------------------------------------------------

  describe('duplicate', () => {
    it('creates a draft copy of a template', async () => {
      const original = await createPublishedTemplate(templateStorage, {
        name: 'Original',
        description: 'Original desc',
        tags: ['tag1'],
        author: 'author1',
      });

      const copy = await service.duplicate(original.id);

      expect(copy.id).not.toBe(original.id);
      expect(copy.name).toBe('Original (Copy)');
      expect(copy.description).toBe('Original desc');
      expect(copy.category).toBe(original.category);
      expect(copy.status).toBe('draft');
      expect(copy.agents).toEqual(original.agents);
      expect(copy.tasks).toEqual(original.tasks);
      expect(copy.tags).toEqual(original.tags);
      expect(copy.author).toBe('author1');
      expect(copy.metadata?._duplicatedFrom).toBe(original.id);
    });

    it('uses custom name when provided', async () => {
      const original = await createPublishedTemplate(templateStorage, { name: 'Original' });

      const copy = await service.duplicate(original.id, 'My Fork');

      expect(copy.name).toBe('My Fork');
    });

    it('can duplicate draft templates too', async () => {
      const draft = await createDraftTemplate(templateStorage, { name: 'Draft' });

      const copy = await service.duplicate(draft.id);

      expect(copy.name).toBe('Draft (Copy)');
      expect(copy.status).toBe('draft');
    });

    it('throws TemplateNotFoundError for nonexistent template', async () => {
      await expect(service.duplicate('nonexistent')).rejects.toThrow(TemplateNotFoundError);
    });

    it('creates an independent copy (modifying copy does not affect original)', async () => {
      const original = await createPublishedTemplate(templateStorage);

      const copy = await service.duplicate(original.id);
      await templateStorage.update(copy.id, { name: 'Modified Copy' });

      const refetchedOriginal = await templateStorage.get(original.id);
      expect(refetchedOriginal!.name).toBe(original.name);
    });
  });

  // -----------------------------------------------------------------------
  // Integration: browse + instantiate + popularity
  // -----------------------------------------------------------------------

  describe('integration', () => {
    it('browse reflects updated popularity after instantiations', async () => {
      const t1 = await createPublishedTemplate(templateStorage, { name: 'Alpha' });
      const t2 = await createPublishedTemplate(templateStorage, { name: 'Beta' });

      // Initially sorted by popularity — both have 0 uses
      const before = await service.browse({ sortBy: 'popular' });
      expect(before.templates).toHaveLength(2);

      // Instantiate t2 once
      await service.instantiate(t2.id);

      const after = await service.browse({ sortBy: 'popular' });
      expect(after.templates[0]!.template.name).toBe('Beta');
      expect(after.templates[0]!.stats.useCount).toBe(1);
    });

    it('instantiated workflows are independent from templates', async () => {
      const template = await createPublishedTemplate(templateStorage, { name: 'Template' });

      const result = await service.instantiate(template.id);

      // Archive the template
      await templateStorage.update(template.id, { status: 'archived' });

      // Workflow should still be accessible
      const workflow = await workflowStorage.get(result.workflowId);
      expect(workflow).toBeDefined();
      expect(workflow!.name).toBe('Template');
    });

    it('multiple instantiations create independent workflows', async () => {
      const template = await createPublishedTemplate(templateStorage);

      const r1 = await service.instantiate(template.id, { workflowName: 'Instance 1' });
      const r2 = await service.instantiate(template.id, { workflowName: 'Instance 2' });

      expect(r1.workflowId).not.toBe(r2.workflowId);

      const w1 = await workflowStorage.get(r1.workflowId);
      const w2 = await workflowStorage.get(r2.workflowId);
      expect(w1!.name).toBe('Instance 1');
      expect(w2!.name).toBe('Instance 2');
    });

    it('featured + browse work together', async () => {
      const t1 = await createPublishedTemplate(templateStorage, { name: 'Featured' });
      await createPublishedTemplate(templateStorage, { name: 'Regular' });

      await service.setFeatured(t1.id, 1, 'Editor pick');

      const featured = await service.getFeaturedTemplates();
      expect(featured).toHaveLength(1);
      expect(featured[0]!.template.name).toBe('Featured');

      const browse = await service.browse();
      expect(browse.templates).toHaveLength(2);
    });
  });
});
