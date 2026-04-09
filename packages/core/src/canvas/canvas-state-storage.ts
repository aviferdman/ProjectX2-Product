/**
 * In-memory canvas state storage implementation.
 *
 * Provides a {@link CanvasStateStorageProvider} backed by an in-memory Map.
 * Useful for development, testing, and short-lived sessions. Data does not
 * persist across process restarts.
 *
 * @packageDocumentation
 */

import { CanvasNotFoundError, CanvasValidationError } from './canvas-state-errors.js';
import type {
  CanvasStateStorageProvider,
  CreateCanvasStateInput,
  ListCanvasStatesOptions,
  ListCanvasStatesResult,
  StoredCanvasState,
  UpdateCanvasStateInput,
} from './canvas-state-types.js';

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

let _counter = 0;

/** Generate a unique canvas state ID. */
function generateCanvasId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  _counter += 1;
  return `cs_${timestamp}_${random}_${String(_counter)}`;
}

/** Reset the internal counter (for testing only). */
export function _resetCanvasIdCounter(): void {
  _counter = 0;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateSnapshot(input: CreateCanvasStateInput | UpdateCanvasStateInput, isCreate: boolean): void {
  if (isCreate) {
    const createInput = input as CreateCanvasStateInput;
    if (!createInput.workflowId || createInput.workflowId.trim().length === 0) {
      throw new CanvasValidationError('Workflow ID is required');
    }
    if (!createInput.name || createInput.name.trim().length === 0) {
      throw new CanvasValidationError('Canvas state name is required');
    }
    if (!createInput.snapshot) {
      throw new CanvasValidationError('Snapshot is required');
    }
  }

  // Name validation (if provided)
  if ('name' in input && input.name !== undefined) {
    if (input.name.trim().length === 0) {
      throw new CanvasValidationError('Canvas state name cannot be empty');
    }
    if (input.name.trim().length > 200) {
      throw new CanvasValidationError('Canvas state name must be 200 characters or fewer');
    }
  }

  // Snapshot validation (if provided)
  const snapshot = 'snapshot' in input ? input.snapshot : undefined;
  if (snapshot) {
    if (!Array.isArray(snapshot.nodes)) {
      throw new CanvasValidationError('Snapshot nodes must be an array');
    }
    if (!Array.isArray(snapshot.edges)) {
      throw new CanvasValidationError('Snapshot edges must be an array');
    }
    if (!snapshot.viewport || typeof snapshot.viewport.x !== 'number' || typeof snapshot.viewport.y !== 'number' || typeof snapshot.viewport.zoom !== 'number') {
      throw new CanvasValidationError('Snapshot viewport must have numeric x, y, and zoom');
    }
    if (snapshot.viewport.zoom <= 0) {
      throw new CanvasValidationError('Viewport zoom must be positive');
    }

    // Validate node IDs are unique
    const nodeIds = new Set<string>();
    for (const node of snapshot.nodes) {
      if (!node.id || node.id.trim().length === 0) {
        throw new CanvasValidationError('Each node must have a non-empty id');
      }
      if (!node.kind) {
        throw new CanvasValidationError(`Node "${node.id}" must have a kind`);
      }
      if (!node.label || node.label.trim().length === 0) {
        throw new CanvasValidationError(`Node "${node.id}" must have a non-empty label`);
      }
      if (typeof node.position?.x !== 'number' || typeof node.position?.y !== 'number') {
        throw new CanvasValidationError(`Node "${node.id}" must have a position with numeric x and y`);
      }
      if (nodeIds.has(node.id)) {
        throw new CanvasValidationError(`Duplicate node id: "${node.id}"`);
      }
      nodeIds.add(node.id);
    }

    // Validate edges reference existing nodes
    const edgeIds = new Set<string>();
    for (const edge of snapshot.edges) {
      if (!edge.id || edge.id.trim().length === 0) {
        throw new CanvasValidationError('Each edge must have a non-empty id');
      }
      if (edgeIds.has(edge.id)) {
        throw new CanvasValidationError(`Duplicate edge id: "${edge.id}"`);
      }
      edgeIds.add(edge.id);

      if (!edge.source || !nodeIds.has(edge.source)) {
        throw new CanvasValidationError(
          `Edge "${edge.id}" references unknown source node "${edge.source}"`,
        );
      }
      if (!edge.target || !nodeIds.has(edge.target)) {
        throw new CanvasValidationError(
          `Edge "${edge.id}" references unknown target node "${edge.target}"`,
        );
      }
      if (edge.source === edge.target) {
        throw new CanvasValidationError(
          `Edge "${edge.id}" cannot connect a node to itself`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// InMemoryCanvasStateStorage
// ---------------------------------------------------------------------------

/**
 * In-memory implementation of {@link CanvasStateStorageProvider}.
 *
 * @example
 * ```typescript
 * const storage = new InMemoryCanvasStateStorage();
 *
 * const state = await storage.create({
 *   workflowId: 'wf_123',
 *   name: 'Main Canvas',
 *   snapshot: {
 *     nodes: [{ id: 'n1', kind: 'agent', label: 'Researcher', position: { x: 100, y: 200 } }],
 *     edges: [],
 *     viewport: { x: 0, y: 0, zoom: 1.0 },
 *   },
 * });
 * ```
 */
export class InMemoryCanvasStateStorage implements CanvasStateStorageProvider {
  private readonly _store = new Map<string, StoredCanvasState>();

  /** Number of canvas states currently stored. */
  get size(): number {
    return this._store.size;
  }

  async create(input: CreateCanvasStateInput): Promise<StoredCanvasState> {
    validateSnapshot(input, true);

    const now = new Date().toISOString();
    const base: Omit<StoredCanvasState, 'metadata'> = {
      id: generateCanvasId(),
      workflowId: input.workflowId.trim(),
      name: input.name.trim(),
      snapshot: {
        nodes: [...input.snapshot.nodes],
        edges: [...input.snapshot.edges],
        viewport: { ...input.snapshot.viewport },
      },
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const state: StoredCanvasState = input.metadata
      ? { ...base, metadata: { ...input.metadata } }
      : base;

    this._store.set(state.id, state);
    return state;
  }

  async get(id: string): Promise<StoredCanvasState | undefined> {
    return this._store.get(id);
  }

  async list(options?: ListCanvasStatesOptions): Promise<ListCanvasStatesResult> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const sortBy = options?.sortBy ?? 'updatedAt';
    const sortOrder = options?.sortOrder ?? 'desc';

    let states = Array.from(this._store.values());

    // Filter by workflowId
    if (options?.workflowId) {
      states = states.filter((s) => s.workflowId === options.workflowId);
    }

    const total = states.length;

    // Sort
    states.sort((a, b) => {
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
    states = states.slice(offset, offset + limit);

    return { states, total };
  }

  async update(id: string, input: UpdateCanvasStateInput): Promise<StoredCanvasState> {
    const existing = this._store.get(id);
    if (!existing) {
      throw new CanvasNotFoundError(id);
    }

    validateSnapshot(input, false);

    const base: Omit<StoredCanvasState, 'metadata'> = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      snapshot: input.snapshot
        ? {
            nodes: [...input.snapshot.nodes],
            edges: [...input.snapshot.edges],
            viewport: { ...input.snapshot.viewport },
          }
        : existing.snapshot,
      updatedAt: new Date().toISOString(),
      version: input.snapshot ? existing.version + 1 : existing.version,
    };

    const resolvedMetadata = input.metadata !== undefined ? input.metadata : existing.metadata;
    const updated: StoredCanvasState = resolvedMetadata
      ? { ...base, metadata: resolvedMetadata }
      : base;

    this._store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this._store.delete(id);
  }

  /** Remove all stored canvas states. Primarily for testing. */
  clear(): void {
    this._store.clear();
  }
}
