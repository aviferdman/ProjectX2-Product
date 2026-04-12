/**
 * Unit tests for CanvasStateService (undo/redo history management).
 *
 * Validates save, undo, redo, history initialization, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryCanvasStateStorage,
  _resetCanvasIdCounter,
} from '../../src/canvas/canvas-state-storage.js';
import { CanvasStateService } from '../../src/canvas/canvas-state-service.js';
import {
  CanvasNotFoundError,
  CanvasHistoryEmptyError,
} from '../../src/canvas/canvas-state-errors.js';
import type {
  CanvasSnapshot,
  CreateCanvasStateInput,
} from '../../src/canvas/canvas-state-types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSnapshot(label = 'Agent', x = 100, y = 200): CanvasSnapshot {
  return {
    nodes: [{ id: 'n1', kind: 'agent' as const, label, position: { x, y } }],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1.0 },
  };
}

async function createCanvas(
  storage: InMemoryCanvasStateStorage,
  name = 'Test Canvas',
): Promise<string> {
  const state = await storage.create({
    workflowId: 'wf_test',
    name,
    snapshot: makeSnapshot(),
  });
  return state.id;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CanvasStateService', () => {
  let storage: InMemoryCanvasStateStorage;
  let service: CanvasStateService;

  beforeEach(() => {
    _resetCanvasIdCounter();
    storage = new InMemoryCanvasStateStorage();
    service = new CanvasStateService({ storage });
  });

  // -----------------------------------------------------------------------
  // save
  // -----------------------------------------------------------------------

  describe('save', () => {
    it('should save a new snapshot and increment version', async () => {
      const id = await createCanvas(storage);
      await service.initializeHistory(id);

      const snapshot2 = makeSnapshot('Updated', 200, 300);
      const updated = await service.save(id, snapshot2);

      expect(updated.version).toBe(2);
      expect(updated.snapshot.nodes[0].label).toBe('Updated');
    });

    it('should throw CanvasNotFoundError for unknown canvas', async () => {
      await expect(service.save('nonexistent', makeSnapshot())).rejects.toThrow(
        CanvasNotFoundError,
      );
    });

    it('should clear redo history on save', async () => {
      const id = await createCanvas(storage);
      await service.initializeHistory(id);

      // Save two snapshots
      await service.save(id, makeSnapshot('V2', 200, 200));
      await service.save(id, makeSnapshot('V3', 300, 300));

      // Undo once → cursor at V2
      await service.undo(id);
      expect(service.canRedo(id)).toBe(true);

      // Save new snapshot → clears redo
      await service.save(id, makeSnapshot('V4', 400, 400));
      expect(service.canRedo(id)).toBe(false);
    });

    it('should initialize history on first save if not initialized', async () => {
      const id = await createCanvas(storage);

      // Save directly without initializeHistory
      const updated = await service.save(id, makeSnapshot('V2', 200, 200));
      expect(updated.version).toBe(2);

      // History should exist
      const hist = service.getHistory(id);
      expect(hist).toBeDefined();
      expect(hist!.entries.length).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // undo
  // -----------------------------------------------------------------------

  describe('undo', () => {
    it('should restore previous snapshot', async () => {
      const id = await createCanvas(storage);
      await service.initializeHistory(id);

      await service.save(id, makeSnapshot('V2', 200, 200));
      const undone = await service.undo(id);

      expect(undone.snapshot.nodes[0].label).toBe('Agent');
      expect(undone.snapshot.nodes[0].position.x).toBe(100);
    });

    it('should throw CanvasHistoryEmptyError when no undo available', async () => {
      const id = await createCanvas(storage);
      await service.initializeHistory(id);

      await expect(service.undo(id)).rejects.toThrow(CanvasHistoryEmptyError);
    });

    it('should throw for unknown canvas', async () => {
      await expect(service.undo('nonexistent')).rejects.toThrow(CanvasHistoryEmptyError);
    });

    it('should allow multiple undos', async () => {
      const id = await createCanvas(storage);
      await service.initializeHistory(id);

      await service.save(id, makeSnapshot('V2', 200, 200));
      await service.save(id, makeSnapshot('V3', 300, 300));

      // Undo to V2
      const undo1 = await service.undo(id);
      expect(undo1.snapshot.nodes[0].label).toBe('V2');

      // Undo to V1
      const undo2 = await service.undo(id);
      expect(undo2.snapshot.nodes[0].label).toBe('Agent');

      // No more undo available
      expect(service.canUndo(id)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // redo
  // -----------------------------------------------------------------------

  describe('redo', () => {
    it('should restore next snapshot after undo', async () => {
      const id = await createCanvas(storage);
      await service.initializeHistory(id);

      await service.save(id, makeSnapshot('V2', 200, 200));
      await service.undo(id);

      const redone = await service.redo(id);
      expect(redone.snapshot.nodes[0].label).toBe('V2');
    });

    it('should throw CanvasHistoryEmptyError when no redo available', async () => {
      const id = await createCanvas(storage);
      await service.initializeHistory(id);

      await expect(service.redo(id)).rejects.toThrow(CanvasHistoryEmptyError);
    });

    it('should allow multiple redos', async () => {
      const id = await createCanvas(storage);
      await service.initializeHistory(id);

      await service.save(id, makeSnapshot('V2', 200, 200));
      await service.save(id, makeSnapshot('V3', 300, 300));

      // Undo twice
      await service.undo(id);
      await service.undo(id);

      // Redo twice
      const redo1 = await service.redo(id);
      expect(redo1.snapshot.nodes[0].label).toBe('V2');

      const redo2 = await service.redo(id);
      expect(redo2.snapshot.nodes[0].label).toBe('V3');

      expect(service.canRedo(id)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // canUndo / canRedo
  // -----------------------------------------------------------------------

  describe('canUndo / canRedo', () => {
    it('canUndo returns false for uninitialized canvas', () => {
      expect(service.canUndo('unknown')).toBe(false);
    });

    it('canRedo returns false for uninitialized canvas', () => {
      expect(service.canRedo('unknown')).toBe(false);
    });

    it('canUndo returns false at initial state', async () => {
      const id = await createCanvas(storage);
      await service.initializeHistory(id);
      expect(service.canUndo(id)).toBe(false);
    });

    it('canUndo returns true after save', async () => {
      const id = await createCanvas(storage);
      await service.initializeHistory(id);
      await service.save(id, makeSnapshot('V2'));
      expect(service.canUndo(id)).toBe(true);
    });

    it('canRedo returns true after undo', async () => {
      const id = await createCanvas(storage);
      await service.initializeHistory(id);
      await service.save(id, makeSnapshot('V2'));
      await service.undo(id);
      expect(service.canRedo(id)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // getHistory
  // -----------------------------------------------------------------------

  describe('getHistory', () => {
    it('should return undefined for unknown canvas', () => {
      expect(service.getHistory('unknown')).toBeUndefined();
    });

    it('should return history with correct cursor', async () => {
      const id = await createCanvas(storage);
      await service.initializeHistory(id);
      await service.save(id, makeSnapshot('V2'));
      await service.save(id, makeSnapshot('V3'));

      const hist = service.getHistory(id);
      expect(hist).toBeDefined();
      expect(hist!.entries).toHaveLength(3);
      expect(hist!.cursor).toBe(2);
    });

    it('should reflect cursor after undo', async () => {
      const id = await createCanvas(storage);
      await service.initializeHistory(id);
      await service.save(id, makeSnapshot('V2'));
      await service.undo(id);

      const hist = service.getHistory(id);
      expect(hist!.cursor).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // clearHistory
  // -----------------------------------------------------------------------

  describe('clearHistory', () => {
    it('should remove history for a canvas', async () => {
      const id = await createCanvas(storage);
      await service.initializeHistory(id);
      await service.save(id, makeSnapshot('V2'));

      service.clearHistory(id);
      expect(service.getHistory(id)).toBeUndefined();
      expect(service.canUndo(id)).toBe(false);
    });

    it('should not throw for unknown canvas', () => {
      expect(() => service.clearHistory('unknown')).not.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // initializeHistory
  // -----------------------------------------------------------------------

  describe('initializeHistory', () => {
    it('should create initial history entry', async () => {
      const id = await createCanvas(storage);
      await service.initializeHistory(id);

      const hist = service.getHistory(id);
      expect(hist).toBeDefined();
      expect(hist!.entries).toHaveLength(1);
      expect(hist!.cursor).toBe(0);
    });

    it('should throw for unknown canvas', async () => {
      await expect(service.initializeHistory('nonexistent')).rejects.toThrow(CanvasNotFoundError);
    });

    it('should not duplicate history if already initialized', async () => {
      const id = await createCanvas(storage);
      await service.initializeHistory(id);
      await service.initializeHistory(id); // Call again

      const hist = service.getHistory(id);
      expect(hist!.entries).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // maxHistorySize
  // -----------------------------------------------------------------------

  describe('maxHistorySize', () => {
    it('should enforce max history limit', async () => {
      const smallService = new CanvasStateService({
        storage,
        maxHistorySize: 3,
      });

      const id = await createCanvas(storage);
      await smallService.initializeHistory(id);

      // Save 5 snapshots (initial + 5 = 6 entries, capped at 3)
      for (let i = 2; i <= 6; i++) {
        await smallService.save(id, makeSnapshot(`V${i}`, i * 100, i * 100));
      }

      const hist = smallService.getHistory(id);
      expect(hist!.entries).toHaveLength(3);
      // Should keep the most recent 3 entries
      expect(hist!.entries[0].snapshot.nodes[0].label).toBe('V4');
      expect(hist!.entries[2].snapshot.nodes[0].label).toBe('V6');
    });
  });

  // -----------------------------------------------------------------------
  // storage getter
  // -----------------------------------------------------------------------

  describe('storage getter', () => {
    it('should return the underlying storage provider', () => {
      expect(service.storage).toBe(storage);
    });
  });
});
