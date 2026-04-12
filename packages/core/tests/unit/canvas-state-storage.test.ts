/**
 * Unit tests for InMemoryCanvasStateStorage.
 *
 * Validates CRUD operations, validation, filtering, pagination,
 * and sorting for the canvas state storage layer.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryCanvasStateStorage,
  _resetCanvasIdCounter,
} from '../../src/canvas/canvas-state-storage.js';
import {
  CanvasNotFoundError,
  CanvasValidationError,
} from '../../src/canvas/canvas-state-errors.js';
import type {
  CreateCanvasStateInput,
  CanvasSnapshot,
} from '../../src/canvas/canvas-state-types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSnapshot(overrides?: Partial<CanvasSnapshot>): CanvasSnapshot {
  return {
    nodes: overrides?.nodes ?? [
      { id: 'n1', kind: 'agent', label: 'Researcher', position: { x: 100, y: 200 } },
      { id: 'n2', kind: 'task', label: 'Search', position: { x: 300, y: 200 } },
    ],
    edges: overrides?.edges ?? [{ id: 'e1', source: 'n1', target: 'n2' }],
    viewport: overrides?.viewport ?? { x: 0, y: 0, zoom: 1.0 },
  };
}

function makeCreateInput(overrides?: Partial<CreateCanvasStateInput>): CreateCanvasStateInput {
  return {
    workflowId: overrides?.workflowId ?? 'wf_test_123',
    name: overrides?.name ?? 'Test Canvas',
    snapshot: overrides?.snapshot ?? makeSnapshot(),
    metadata: overrides?.metadata,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('InMemoryCanvasStateStorage', () => {
  let storage: InMemoryCanvasStateStorage;

  beforeEach(() => {
    _resetCanvasIdCounter();
    storage = new InMemoryCanvasStateStorage();
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------

  describe('create', () => {
    it('should create a canvas state with generated id', async () => {
      const input = makeCreateInput();
      const result = await storage.create(input);

      expect(result.id).toMatch(/^cs_/);
      expect(result.workflowId).toBe('wf_test_123');
      expect(result.name).toBe('Test Canvas');
      expect(result.version).toBe(1);
      expect(result.snapshot.nodes).toHaveLength(2);
      expect(result.snapshot.edges).toHaveLength(1);
      expect(result.snapshot.viewport.zoom).toBe(1.0);
      expect(result.createdAt).toBeTruthy();
      expect(result.updatedAt).toBeTruthy();
      expect(storage.size).toBe(1);
    });

    it('should trim whitespace from name', async () => {
      const result = await storage.create(makeCreateInput({ name: '  My Canvas  ' }));
      expect(result.name).toBe('My Canvas');
    });

    it('should store metadata', async () => {
      const result = await storage.create(makeCreateInput({ metadata: { author: 'test-user' } }));
      expect(result.metadata).toEqual({ author: 'test-user' });
    });

    it('should reject empty name', async () => {
      await expect(storage.create(makeCreateInput({ name: '' }))).rejects.toThrow(
        CanvasValidationError,
      );
    });

    it('should reject missing workflowId', async () => {
      await expect(storage.create(makeCreateInput({ workflowId: '' }))).rejects.toThrow(
        CanvasValidationError,
      );
    });

    it('should reject name over 200 chars', async () => {
      await expect(storage.create(makeCreateInput({ name: 'a'.repeat(201) }))).rejects.toThrow(
        CanvasValidationError,
      );
    });

    it('should reject duplicate node ids', async () => {
      const snapshot = makeSnapshot({
        nodes: [
          { id: 'dup', kind: 'agent', label: 'A', position: { x: 0, y: 0 } },
          { id: 'dup', kind: 'task', label: 'B', position: { x: 100, y: 0 } },
        ],
        edges: [],
      });
      await expect(storage.create(makeCreateInput({ snapshot }))).rejects.toThrow(
        /Duplicate node id/,
      );
    });

    it('should reject edges referencing unknown nodes', async () => {
      const snapshot = makeSnapshot({
        nodes: [{ id: 'n1', kind: 'agent', label: 'A', position: { x: 0, y: 0 } }],
        edges: [{ id: 'e1', source: 'n1', target: 'unknown' }],
      });
      await expect(storage.create(makeCreateInput({ snapshot }))).rejects.toThrow(
        /unknown target node/,
      );
    });

    it('should reject self-referencing edges', async () => {
      const snapshot = makeSnapshot({
        nodes: [{ id: 'n1', kind: 'agent', label: 'A', position: { x: 0, y: 0 } }],
        edges: [{ id: 'e1', source: 'n1', target: 'n1' }],
      });
      await expect(storage.create(makeCreateInput({ snapshot }))).rejects.toThrow(
        /cannot connect a node to itself/,
      );
    });

    it('should reject non-positive zoom', async () => {
      const snapshot = makeSnapshot({
        viewport: { x: 0, y: 0, zoom: 0 },
      });
      await expect(storage.create(makeCreateInput({ snapshot }))).rejects.toThrow(
        /zoom must be positive/,
      );
    });

    it('should reject nodes without position', async () => {
      const snapshot = makeSnapshot({
        nodes: [{ id: 'n1', kind: 'agent', label: 'A', position: undefined as any }],
        edges: [],
      });
      await expect(storage.create(makeCreateInput({ snapshot }))).rejects.toThrow(/position/);
    });

    it('should reject nodes without label', async () => {
      const snapshot = makeSnapshot({
        nodes: [{ id: 'n1', kind: 'agent', label: '', position: { x: 0, y: 0 } }],
        edges: [],
      });
      await expect(storage.create(makeCreateInput({ snapshot }))).rejects.toThrow(
        /non-empty label/,
      );
    });
  });

  // -----------------------------------------------------------------------
  // get
  // -----------------------------------------------------------------------

  describe('get', () => {
    it('should return a canvas state by ID', async () => {
      const created = await storage.create(makeCreateInput());
      const found = await storage.get(created.id);
      expect(found).toEqual(created);
    });

    it('should return undefined for unknown ID', async () => {
      const found = await storage.get('nonexistent');
      expect(found).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // list
  // -----------------------------------------------------------------------

  describe('list', () => {
    it('should list all canvas states', async () => {
      await storage.create(makeCreateInput({ name: 'Canvas A' }));
      await storage.create(makeCreateInput({ name: 'Canvas B' }));

      const result = await storage.list();
      expect(result.total).toBe(2);
      expect(result.states).toHaveLength(2);
    });

    it('should filter by workflowId', async () => {
      await storage.create(makeCreateInput({ workflowId: 'wf_1' }));
      await storage.create(makeCreateInput({ workflowId: 'wf_2' }));
      await storage.create(makeCreateInput({ workflowId: 'wf_1' }));

      const result = await storage.list({ workflowId: 'wf_1' });
      expect(result.total).toBe(2);
      expect(result.states.every((s) => s.workflowId === 'wf_1')).toBe(true);
    });

    it('should paginate results', async () => {
      for (let i = 0; i < 5; i++) {
        await storage.create(makeCreateInput({ name: `Canvas ${i}` }));
      }

      const page1 = await storage.list({ limit: 2, offset: 0 });
      expect(page1.states).toHaveLength(2);
      expect(page1.total).toBe(5);

      const page2 = await storage.list({ limit: 2, offset: 2 });
      expect(page2.states).toHaveLength(2);

      const page3 = await storage.list({ limit: 2, offset: 4 });
      expect(page3.states).toHaveLength(1);
    });

    it('should sort by name ascending', async () => {
      await storage.create(makeCreateInput({ name: 'Zebra' }));
      await storage.create(makeCreateInput({ name: 'Alpha' }));
      await storage.create(makeCreateInput({ name: 'Middle' }));

      const result = await storage.list({ sortBy: 'name', sortOrder: 'asc' });
      const names = result.states.map((s) => s.name);
      expect(names).toEqual(['Alpha', 'Middle', 'Zebra']);
    });

    it('should default to sort by updatedAt desc', async () => {
      await storage.create(makeCreateInput({ name: 'First' }));
      // Small delay to ensure different timestamps
      await new Promise((r) => setTimeout(r, 5));
      await storage.create(makeCreateInput({ name: 'Second' }));

      const result = await storage.list();
      expect(result.states[0].name).toBe('Second');
      expect(result.states[1].name).toBe('First');
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------

  describe('update', () => {
    it('should update name without changing version', async () => {
      const created = await storage.create(makeCreateInput());
      const updated = await storage.update(created.id, { name: 'Renamed' });

      expect(updated.name).toBe('Renamed');
      expect(updated.version).toBe(1); // No snapshot change → version unchanged
    });

    it('should increment version when snapshot changes', async () => {
      const created = await storage.create(makeCreateInput());
      const newSnapshot = makeSnapshot({
        nodes: [{ id: 'n1', kind: 'agent', label: 'Updated Agent', position: { x: 50, y: 50 } }],
        edges: [],
        viewport: { x: 10, y: 20, zoom: 1.5 },
      });
      const updated = await storage.update(created.id, { snapshot: newSnapshot });

      expect(updated.version).toBe(2);
      expect(updated.snapshot.nodes[0].label).toBe('Updated Agent');
      expect(updated.snapshot.viewport.zoom).toBe(1.5);
    });

    it('should update metadata', async () => {
      const created = await storage.create(makeCreateInput());
      const updated = await storage.update(created.id, {
        metadata: { editedBy: 'user-1' },
      });
      expect(updated.metadata).toEqual({ editedBy: 'user-1' });
    });

    it('should throw CanvasNotFoundError for unknown ID', async () => {
      await expect(storage.update('nonexistent', { name: 'Fail' })).rejects.toThrow(
        CanvasNotFoundError,
      );
    });

    it('should reject empty name on update', async () => {
      const created = await storage.create(makeCreateInput());
      await expect(storage.update(created.id, { name: '   ' })).rejects.toThrow(
        CanvasValidationError,
      );
    });

    it('should update updatedAt timestamp', async () => {
      const created = await storage.create(makeCreateInput());
      // Small delay to ensure different timestamp
      await new Promise((r) => setTimeout(r, 5));
      const updated = await storage.update(created.id, { name: 'New Name' });
      expect(updated.updatedAt >= created.updatedAt).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------

  describe('delete', () => {
    it('should delete an existing canvas state', async () => {
      const created = await storage.create(makeCreateInput());
      const deleted = await storage.delete(created.id);
      expect(deleted).toBe(true);
      expect(storage.size).toBe(0);
    });

    it('should return false for unknown ID', async () => {
      const deleted = await storage.delete('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // clear
  // -----------------------------------------------------------------------

  describe('clear', () => {
    it('should remove all states', async () => {
      await storage.create(makeCreateInput({ name: 'A' }));
      await storage.create(makeCreateInput({ name: 'B' }));
      expect(storage.size).toBe(2);

      storage.clear();
      expect(storage.size).toBe(0);
    });
  });
});
