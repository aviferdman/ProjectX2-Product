/**
 * Types for the template library service.
 *
 * Extends the base template storage types with service-level concepts:
 * instantiation (copy template → workflow), popularity tracking, and
 * featured template support.
 *
 * @packageDocumentation
 */

import type { StoredTemplate, TemplateCategory } from './template-storage-types.js';

// ---------------------------------------------------------------------------
// Instantiation result
// ---------------------------------------------------------------------------

/** Result of instantiating a template into a user workflow. */
export interface TemplateInstantiationResult {
  /** The ID of the newly created workflow. */
  readonly workflowId: string;

  /** The template that was instantiated. */
  readonly templateId: string;

  /** The name assigned to the new workflow. */
  readonly workflowName: string;

  /** ISO-8601 timestamp of the instantiation. */
  readonly instantiatedAt: string;
}

// ---------------------------------------------------------------------------
// Instantiation options
// ---------------------------------------------------------------------------

/** Options for customizing template instantiation. */
export interface InstantiateTemplateOptions {
  /** Custom name for the new workflow. If omitted, uses template name. */
  readonly workflowName?: string;

  /** Optional description for the new workflow. */
  readonly workflowDescription?: string;

  /** Optional tags for the new workflow. */
  readonly workflowTags?: readonly string[];

  /** Optional metadata for the new workflow. */
  readonly workflowMetadata?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Popularity stats
// ---------------------------------------------------------------------------

/** Popularity statistics for a single template. */
export interface TemplatePopularityStats {
  /** Template ID. */
  readonly templateId: string;

  /** Total number of times this template has been instantiated. */
  readonly useCount: number;

  /** ISO-8601 timestamp of the last instantiation, or undefined if never used. */
  readonly lastUsedAt?: string;
}

// ---------------------------------------------------------------------------
// Featured template
// ---------------------------------------------------------------------------

/** A template with additional display metadata for the featured section. */
export interface FeaturedTemplate {
  /** The underlying template. */
  readonly template: StoredTemplate;

  /** Display order (lower = higher priority). */
  readonly displayOrder: number;

  /** Optional short reason why this template is featured. */
  readonly featuredReason?: string;
}

// ---------------------------------------------------------------------------
// Template with stats (enriched view)
// ---------------------------------------------------------------------------

/** A template enriched with popularity stats for display. */
export interface TemplateWithStats {
  /** The underlying template. */
  readonly template: StoredTemplate;

  /** Popularity statistics. */
  readonly stats: TemplatePopularityStats;
}

// ---------------------------------------------------------------------------
// Browse options
// ---------------------------------------------------------------------------

/** Options for browsing the template library. */
export interface BrowseTemplatesOptions {
  /** Filter by category. */
  readonly category?: TemplateCategory;

  /** Filter by tag (template must have at least one matching tag). */
  readonly tag?: string;

  /** Search by name (case-insensitive substring match). */
  readonly search?: string;

  /** Sort field (default: 'popular'). */
  readonly sortBy?: 'popular' | 'newest' | 'name';

  /** Maximum number of results (default: 20). */
  readonly limit?: number;

  /** Offset for pagination (default: 0). */
  readonly offset?: number;
}

/** Result of browsing the template library. */
export interface BrowseTemplatesResult {
  /** Templates with their stats. */
  readonly templates: readonly TemplateWithStats[];

  /** Total number of matching templates (before pagination). */
  readonly total: number;
}

// ---------------------------------------------------------------------------
// Service configuration
// ---------------------------------------------------------------------------

/** Configuration for the template library service. */
export interface TemplateLibraryServiceConfig {
  /** Maximum number of featured templates (default: 10). */
  readonly maxFeaturedTemplates?: number;
}
