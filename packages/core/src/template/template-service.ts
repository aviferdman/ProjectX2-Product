/**
 * Template library service.
 *
 * Wraps a {@link TemplateStorageProvider} and a {@link WorkflowStorageProvider}
 * to provide high-level template library operations: browsing published
 * templates, instantiating them into user workflows, tracking popularity,
 * and managing featured templates.
 *
 * @packageDocumentation
 */

import { TemplateNotFoundError, TemplateValidationError } from './template-errors.js';
import type { TemplateStorageProvider, StoredTemplate } from './template-storage-types.js';
import type { WorkflowStorageProvider } from '../workflow/workflow-storage-types.js';
import type {
  BrowseTemplatesOptions,
  BrowseTemplatesResult,
  FeaturedTemplate,
  InstantiateTemplateOptions,
  TemplateInstantiationResult,
  TemplateLibraryServiceConfig,
  TemplatePopularityStats,
  TemplateWithStats,
} from './template-service-types.js';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_BROWSE_LIMIT = 20;
const DEFAULT_MAX_FEATURED = 10;

// ---------------------------------------------------------------------------
// TemplateLibraryService
// ---------------------------------------------------------------------------

/**
 * Service that provides template library functionality on top of raw storage.
 *
 * Key capabilities:
 * - **Browse** published templates with search, filtering, and popularity-based sorting
 * - **Instantiate** a template into a new user workflow (copy agents + tasks)
 * - **Track popularity** via use counts
 * - **Manage featured templates** for editorial promotion in the UI
 * - **Duplicate** a template into a new draft template
 *
 * @example
 * ```typescript
 * const service = new TemplateLibraryService({
 *   templateStorage: new InMemoryTemplateStorage(),
 *   workflowStorage: new InMemoryWorkflowStorage(),
 * });
 *
 * // Browse published templates
 * const { templates } = await service.browse({ category: 'research' });
 *
 * // Instantiate a template into a workflow
 * const result = await service.instantiate('tmpl_123', {
 *   workflowName: 'My Research Pipeline',
 * });
 * ```
 */
export class TemplateLibraryService {
  private readonly _templateStorage: TemplateStorageProvider;
  private readonly _workflowStorage: WorkflowStorageProvider;
  private readonly _maxFeaturedTemplates: number;

  /** Use-count tracking: templateId → count */
  private readonly _useCounts = new Map<string, number>();

  /** Last-used tracking: templateId → ISO timestamp */
  private readonly _lastUsedAt = new Map<string, string>();

  /** Featured templates: templateId → { displayOrder, featuredReason } */
  private readonly _featured = new Map<string, { displayOrder: number; featuredReason?: string }>();

  constructor(
    templateStorage: TemplateStorageProvider,
    workflowStorage: WorkflowStorageProvider,
    config?: TemplateLibraryServiceConfig,
  ) {
    this._templateStorage = templateStorage;
    this._workflowStorage = workflowStorage;
    this._maxFeaturedTemplates = config?.maxFeaturedTemplates ?? DEFAULT_MAX_FEATURED;
  }

  /** Get the underlying template storage provider. */
  get templateStorage(): TemplateStorageProvider {
    return this._templateStorage;
  }

  /** Get the underlying workflow storage provider. */
  get workflowStorage(): WorkflowStorageProvider {
    return this._workflowStorage;
  }

  // -------------------------------------------------------------------------
  // Browse
  // -------------------------------------------------------------------------

  /**
   * Browse published templates with optional filtering, search, and sorting.
   *
   * Only templates with status `published` are returned. Results can be
   * sorted by popularity (use count), newest (creation date), or name.
   */
  async browse(options?: BrowseTemplatesOptions): Promise<BrowseTemplatesResult> {
    const limit = options?.limit ?? DEFAULT_BROWSE_LIMIT;
    const offset = options?.offset ?? 0;
    const sortBy = options?.sortBy ?? 'popular';

    // Fetch all published templates with optional category/tag/search filters
    const listResult = await this._templateStorage.list({
      status: 'published' as const,
      ...(options?.category !== undefined ? { category: options.category } : {}),
      ...(options?.tag !== undefined ? { tag: options.tag } : {}),
      ...(options?.search !== undefined ? { search: options.search } : {}),
      limit: 10000,
      offset: 0,
    });

    let enriched: TemplateWithStats[] = listResult.templates.map((template) => ({
      template,
      stats: this._getStats(template.id),
    }));

    // Sort
    enriched = this._sortTemplates(enriched, sortBy);

    const total = enriched.length;

    // Paginate
    enriched = enriched.slice(offset, offset + limit);

    return { templates: enriched, total };
  }

  // -------------------------------------------------------------------------
  // Instantiate
  // -------------------------------------------------------------------------

  /**
   * Instantiate a published template into a new user workflow.
   *
   * Copies the template's agents and tasks into a new workflow in the
   * workflow storage. Only published templates can be instantiated.
   *
   * @throws TemplateNotFoundError if the template doesn't exist
   * @throws TemplateValidationError if the template is not published
   */
  async instantiate(
    templateId: string,
    options?: InstantiateTemplateOptions,
  ): Promise<TemplateInstantiationResult> {
    const template = await this._templateStorage.get(templateId);
    if (!template) {
      throw new TemplateNotFoundError(templateId);
    }

    if (template.status !== 'published') {
      throw new TemplateValidationError(
        `Template "${templateId}" cannot be instantiated: status is "${template.status}", expected "published"`,
      );
    }

    const workflowName = options?.workflowName ?? template.name;
    const now = new Date().toISOString();

    const description = options?.workflowDescription ?? template.description;
    const tags = options?.workflowTags ?? template.tags;

    // Create a new workflow from the template
    const workflow = await this._workflowStorage.create({
      name: workflowName,
      ...(description !== undefined ? { description } : {}),
      agents: [...template.agents],
      tasks: [...template.tasks],
      ...(tags !== undefined ? { tags: [...tags] } : {}),
      metadata: {
        ...(options?.workflowMetadata ?? {}),
        _sourceTemplateId: templateId,
        _sourceTemplateName: template.name,
        _instantiatedAt: now,
      },
    });

    // Track usage
    this._incrementUseCount(templateId, now);

    return {
      workflowId: workflow.id,
      templateId,
      workflowName: workflow.name,
      instantiatedAt: now,
    };
  }

  // -------------------------------------------------------------------------
  // Popularity
  // -------------------------------------------------------------------------

  /**
   * Get popularity stats for a single template.
   */
  getPopularityStats(templateId: string): TemplatePopularityStats {
    return this._getStats(templateId);
  }

  /**
   * Get the top N most popular templates.
   *
   * Only considers published templates. Returns them sorted by use count
   * (descending), then by last used time (most recent first).
   */
  async getPopularTemplates(limit = 10): Promise<readonly TemplateWithStats[]> {
    const listResult = await this._templateStorage.list({
      status: 'published',
      limit: 10000,
      offset: 0,
    });

    let enriched: TemplateWithStats[] = listResult.templates.map((template) => ({
      template,
      stats: this._getStats(template.id),
    }));

    enriched = this._sortTemplates(enriched, 'popular');

    return enriched.slice(0, limit);
  }

  // -------------------------------------------------------------------------
  // Featured templates
  // -------------------------------------------------------------------------

  /**
   * Set a template as featured with a display order and optional reason.
   *
   * @throws TemplateNotFoundError if the template doesn't exist
   * @throws TemplateValidationError if max featured limit is reached (and template isn't already featured)
   */
  async setFeatured(
    templateId: string,
    displayOrder: number,
    featuredReason?: string,
  ): Promise<FeaturedTemplate> {
    const template = await this._templateStorage.get(templateId);
    if (!template) {
      throw new TemplateNotFoundError(templateId);
    }

    // Check limit (only if not already featured)
    if (!this._featured.has(templateId) && this._featured.size >= this._maxFeaturedTemplates) {
      throw new TemplateValidationError(
        `Cannot feature template: maximum of ${this._maxFeaturedTemplates} featured templates reached`,
      );
    }

    const meta = { displayOrder, ...(featuredReason !== undefined ? { featuredReason } : {}) };
    this._featured.set(templateId, meta);

    const result: FeaturedTemplate = { template, displayOrder };
    if (featuredReason !== undefined) {
      return { ...result, featuredReason };
    }
    return result;
  }

  /**
   * Remove a template from the featured list.
   *
   * @returns true if the template was featured and has been removed
   */
  removeFeatured(templateId: string): boolean {
    return this._featured.delete(templateId);
  }

  /**
   * Get all featured templates, sorted by display order (ascending).
   *
   * Automatically removes featured entries whose templates no longer exist
   * or are no longer published.
   */
  async getFeaturedTemplates(): Promise<readonly FeaturedTemplate[]> {
    const results: FeaturedTemplate[] = [];
    const toRemove: string[] = [];

    for (const [templateId, meta] of this._featured) {
      const template = await this._templateStorage.get(templateId);
      if (!template || template.status !== 'published') {
        toRemove.push(templateId);
        continue;
      }
      const entry: FeaturedTemplate = { template, displayOrder: meta.displayOrder };
      if (meta.featuredReason !== undefined) {
        results.push({ ...entry, featuredReason: meta.featuredReason });
      } else {
        results.push(entry);
      }
    }

    // Clean up stale entries
    for (const id of toRemove) {
      this._featured.delete(id);
    }

    // Sort by display order ascending
    results.sort((a, b) => a.displayOrder - b.displayOrder);

    return results;
  }

  /**
   * Check whether a template is currently featured.
   */
  isFeatured(templateId: string): boolean {
    return this._featured.has(templateId);
  }

  // -------------------------------------------------------------------------
  // Duplicate
  // -------------------------------------------------------------------------

  /**
   * Duplicate a template, creating a new draft template with the same
   * agents, tasks, and metadata.
   *
   * @throws TemplateNotFoundError if the source template doesn't exist
   */
  async duplicate(
    templateId: string,
    newName?: string,
  ): Promise<StoredTemplate> {
    const source = await this._templateStorage.get(templateId);
    if (!source) {
      throw new TemplateNotFoundError(templateId);
    }

    // Build creation input, only including optional fields when defined
    const duplicated = await this._templateStorage.create({
      name: newName ?? `${source.name} (Copy)`,
      category: source.category,
      agents: [...source.agents],
      tasks: [...source.tasks],
      ...(source.description !== undefined ? { description: source.description } : {}),
      ...(source.tags !== undefined ? { tags: [...source.tags] } : {}),
      ...(source.author !== undefined ? { author: source.author } : {}),
      metadata: {
        ...(source.metadata ?? {}),
        _duplicatedFrom: templateId,
      },
    });

    return duplicated;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _getStats(templateId: string): TemplatePopularityStats {
    const lastUsedAt = this._lastUsedAt.get(templateId);
    const base: TemplatePopularityStats = {
      templateId,
      useCount: this._useCounts.get(templateId) ?? 0,
    };
    if (lastUsedAt !== undefined) {
      return { ...base, lastUsedAt };
    }
    return base;
  }

  private _incrementUseCount(templateId: string, timestamp: string): void {
    const current = this._useCounts.get(templateId) ?? 0;
    this._useCounts.set(templateId, current + 1);
    this._lastUsedAt.set(templateId, timestamp);
  }

  private _sortTemplates(
    templates: TemplateWithStats[],
    sortBy: 'popular' | 'newest' | 'name',
  ): TemplateWithStats[] {
    return [...templates].sort((a, b) => {
      switch (sortBy) {
        case 'popular': {
          const countDiff = b.stats.useCount - a.stats.useCount;
          if (countDiff !== 0) return countDiff;
          // Tie-break: most recently used first, then newest first
          if (b.stats.lastUsedAt && a.stats.lastUsedAt) {
            return b.stats.lastUsedAt.localeCompare(a.stats.lastUsedAt);
          }
          if (b.stats.lastUsedAt) return 1;
          if (a.stats.lastUsedAt) return -1;
          return b.template.createdAt.localeCompare(a.template.createdAt);
        }
        case 'newest':
          return b.template.createdAt.localeCompare(a.template.createdAt);
        case 'name':
          return a.template.name.localeCompare(b.template.name);
        default:
          return 0;
      }
    });
  }
}
