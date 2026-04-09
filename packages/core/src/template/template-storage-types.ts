/**
 * Types for the template storage API.
 *
 * A stored template represents a reusable workflow configuration that can
 * be browsed, previewed, and instantiated (copied to a user's account)
 * through the template library UI.
 *
 * @packageDocumentation
 */

import type { CrewTask } from '../types/crew.js';
import type { StoredAgentDefinition } from '../workflow/workflow-storage-types.js';

// ---------------------------------------------------------------------------
// Template status
// ---------------------------------------------------------------------------

/** Lifecycle status of a stored template. */
export type TemplateStatus = 'draft' | 'published' | 'archived';

// ---------------------------------------------------------------------------
// Template category
// ---------------------------------------------------------------------------

/** Pre-defined categories for organizing templates. */
export type TemplateCategory =
  | 'research'
  | 'content'
  | 'coding'
  | 'data-analysis'
  | 'automation'
  | 'customer-support'
  | 'other';

// ---------------------------------------------------------------------------
// Stored template
// ---------------------------------------------------------------------------

/** A stored template definition. */
export interface StoredTemplate {
  /** Unique identifier. */
  readonly id: string;

  /** Human-readable name. */
  readonly name: string;

  /** Description of the template's purpose and use case. */
  readonly description?: string;

  /** Category for organizing in the template library. */
  readonly category: TemplateCategory;

  /** Current lifecycle status. */
  readonly status: TemplateStatus;

  /** Agent definitions in the template. */
  readonly agents: readonly StoredAgentDefinition[];

  /** Task definitions in the template. */
  readonly tasks: readonly CrewTask[];

  /** Optional tags for filtering and search. */
  readonly tags?: readonly string[];

  /** Optional user-defined metadata. */
  readonly metadata?: Readonly<Record<string, unknown>>;

  /** Author or source of the template. */
  readonly author?: string;

  /** ISO-8601 timestamp when the template was created. */
  readonly createdAt: string;

  /** ISO-8601 timestamp when the template was last updated. */
  readonly updatedAt: string;

  /** Version number, incremented on each update. */
  readonly version: number;
}

// ---------------------------------------------------------------------------
// Create / Update DTOs
// ---------------------------------------------------------------------------

/** Input for creating a new template. */
export interface CreateTemplateInput {
  /** Human-readable name. */
  readonly name: string;

  /** Optional description. */
  readonly description?: string;

  /** Category for organizing templates. */
  readonly category: TemplateCategory;

  /** Agent definitions. */
  readonly agents: readonly StoredAgentDefinition[];

  /** Task definitions. */
  readonly tasks: readonly CrewTask[];

  /** Optional tags. */
  readonly tags?: readonly string[];

  /** Optional metadata. */
  readonly metadata?: Readonly<Record<string, unknown>>;

  /** Optional author. */
  readonly author?: string;
}

/** Input for updating an existing template. All fields are optional. */
export interface UpdateTemplateInput {
  /** Updated name. */
  readonly name?: string;

  /** Updated description. */
  readonly description?: string;

  /** Updated status. */
  readonly status?: TemplateStatus;

  /** Updated category. */
  readonly category?: TemplateCategory;

  /** Updated agent definitions. */
  readonly agents?: readonly StoredAgentDefinition[];

  /** Updated task definitions. */
  readonly tasks?: readonly CrewTask[];

  /** Updated tags. */
  readonly tags?: readonly string[];

  /** Updated metadata. */
  readonly metadata?: Readonly<Record<string, unknown>>;

  /** Updated author. */
  readonly author?: string;
}

// ---------------------------------------------------------------------------
// List / Query options
// ---------------------------------------------------------------------------

/** Options for listing templates. */
export interface ListTemplatesOptions {
  /** Filter by status. */
  readonly status?: TemplateStatus;

  /** Filter by category. */
  readonly category?: TemplateCategory;

  /** Filter by tag (template must have at least one matching tag). */
  readonly tag?: string;

  /** Search by name (case-insensitive substring match). */
  readonly search?: string;

  /** Maximum number of results (default: 50). */
  readonly limit?: number;

  /** Offset for pagination (default: 0). */
  readonly offset?: number;

  /** Sort field (default: 'updatedAt'). */
  readonly sortBy?: 'name' | 'createdAt' | 'updatedAt';

  /** Sort direction (default: 'desc'). */
  readonly sortOrder?: 'asc' | 'desc';
}

/** Result of a list operation. */
export interface ListTemplatesResult {
  /** The templates matching the query. */
  readonly templates: readonly StoredTemplate[];

  /** Total number of templates matching the filter (before pagination). */
  readonly total: number;
}

// ---------------------------------------------------------------------------
// Storage provider interface
// ---------------------------------------------------------------------------

/** Abstract storage provider for templates. */
export interface TemplateStorageProvider {
  /** Create a new template and return it with generated id and timestamps. */
  create(input: CreateTemplateInput): Promise<StoredTemplate>;

  /** Retrieve a template by ID. Returns undefined if not found. */
  get(id: string): Promise<StoredTemplate | undefined>;

  /** List templates with optional filtering, search, and pagination. */
  list(options?: ListTemplatesOptions): Promise<ListTemplatesResult>;

  /** Update an existing template. Returns the updated template. */
  update(id: string, input: UpdateTemplateInput): Promise<StoredTemplate>;

  /** Delete a template by ID. Returns true if it existed and was deleted. */
  delete(id: string): Promise<boolean>;
}
