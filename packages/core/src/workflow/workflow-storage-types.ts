/**
 * Types for the workflow storage API.
 *
 * A stored workflow represents a serializable crew configuration that can
 * be created, listed, updated, and deleted through the dashboard UI.
 *
 * @packageDocumentation
 */

import type { CrewTask } from '../types/crew.js';

// ---------------------------------------------------------------------------
// Workflow status
// ---------------------------------------------------------------------------

/** Lifecycle status of a stored workflow. */
export type WorkflowStatus = 'draft' | 'active' | 'archived';

// ---------------------------------------------------------------------------
// Agent definition (serializable subset of AgentConfig)
// ---------------------------------------------------------------------------

/** Serializable agent definition stored within a workflow. */
export interface StoredAgentDefinition {
  /** Unique identifier for the agent within the workflow. */
  readonly id: string;

  /** The agent's role description. */
  readonly role: string;

  /** What the agent aims to achieve. */
  readonly goal: string;

  /** Optional background context for the agent. */
  readonly backstory?: string;

  /** IDs of tools assigned to the agent. */
  readonly toolIds?: readonly string[];

  /** LLM provider configuration key (e.g. 'openai:gpt-4o'). */
  readonly llmProvider?: string;
}

// ---------------------------------------------------------------------------
// Stored workflow
// ---------------------------------------------------------------------------

/** A stored workflow definition. */
export interface StoredWorkflow {
  /** Unique identifier. */
  readonly id: string;

  /** Human-readable name. */
  readonly name: string;

  /** Optional description of the workflow's purpose. */
  readonly description?: string;

  /** Current lifecycle status. */
  readonly status: WorkflowStatus;

  /** Agent definitions in the workflow. */
  readonly agents: readonly StoredAgentDefinition[];

  /** Task definitions in the workflow. */
  readonly tasks: readonly CrewTask[];

  /** Optional tags for filtering and categorization. */
  readonly tags?: readonly string[];

  /** Optional user-defined metadata. */
  readonly metadata?: Readonly<Record<string, unknown>>;

  /** ISO-8601 timestamp when the workflow was created. */
  readonly createdAt: string;

  /** ISO-8601 timestamp when the workflow was last updated. */
  readonly updatedAt: string;

  /** Version number, incremented on each update. */
  readonly version: number;
}

// ---------------------------------------------------------------------------
// Create / Update DTOs
// ---------------------------------------------------------------------------

/** Input for creating a new workflow. */
export interface CreateWorkflowInput {
  /** Human-readable name. */
  readonly name: string;

  /** Optional description. */
  readonly description?: string;

  /** Agent definitions. */
  readonly agents: readonly StoredAgentDefinition[];

  /** Task definitions. */
  readonly tasks: readonly CrewTask[];

  /** Optional tags. */
  readonly tags?: readonly string[];

  /** Optional metadata. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Input for updating an existing workflow. All fields are optional. */
export interface UpdateWorkflowInput {
  /** Updated name. */
  readonly name?: string;

  /** Updated description. */
  readonly description?: string;

  /** Updated status. */
  readonly status?: WorkflowStatus;

  /** Updated agent definitions. */
  readonly agents?: readonly StoredAgentDefinition[];

  /** Updated task definitions. */
  readonly tasks?: readonly CrewTask[];

  /** Updated tags. */
  readonly tags?: readonly string[];

  /** Updated metadata. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// List / Query options
// ---------------------------------------------------------------------------

/** Options for listing workflows. */
export interface ListWorkflowsOptions {
  /** Filter by status. */
  readonly status?: WorkflowStatus;

  /** Filter by tag (workflow must have at least one matching tag). */
  readonly tag?: string;

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
export interface ListWorkflowsResult {
  /** The workflows matching the query. */
  readonly workflows: readonly StoredWorkflow[];

  /** Total number of workflows matching the filter (before pagination). */
  readonly total: number;
}

// ---------------------------------------------------------------------------
// Storage provider interface
// ---------------------------------------------------------------------------

/** Abstract storage provider for workflows. */
export interface WorkflowStorageProvider {
  /** Create a new workflow and return it with generated id and timestamps. */
  create(input: CreateWorkflowInput): Promise<StoredWorkflow>;

  /** Retrieve a workflow by ID. Returns undefined if not found. */
  get(id: string): Promise<StoredWorkflow | undefined>;

  /** List workflows with optional filtering and pagination. */
  list(options?: ListWorkflowsOptions): Promise<ListWorkflowsResult>;

  /** Update an existing workflow. Returns the updated workflow. */
  update(id: string, input: UpdateWorkflowInput): Promise<StoredWorkflow>;

  /** Delete a workflow by ID. Returns true if it existed and was deleted. */
  delete(id: string): Promise<boolean>;
}
