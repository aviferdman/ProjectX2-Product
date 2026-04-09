/**
 * Tests for the useCanvasState hook.
 *
 * TASK-138: Canvas state management (save, load, undo/redo)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCanvasState, type CanvasStateManager } from '../src/hooks/useCanvasState.js';
import type { CanvasSnapshot, StoredCanvasState } from '@crewspace/core';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSnapshot(label = 'Agent', x = 100, y = 200): CanvasSnapshot {
  return {
    nodes: [{ id: 'n1', kind: 'agent', label, position: { x, y } }],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1.0 },
  };
}

function makeStoredState(
  id: string,
  snapshot: CanvasSnapshot,
  version = 1,
): StoredCanvasState {
  return {
    id,
    workflowId: 'wf_test',
    name: 'Test Canvas',
    snapshot,
    version,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

function createMockService(
  initialState?: StoredCanvasState,
): CanvasStateManager & {
  _canUndo: boolean;
  _canRedo: boolean;
  _historyEntries: Array<{ version: number; snapshot: CanvasSnapshot; timestamp: string }>;
  _historyCursor: number;
} {
  const state = initialState ?? makeStoredState('cs_1', makeSnapshot());
  let version = state.version;

  const mock = {
    _canUndo: false,
    _canRedo: false,
    _historyEntries: [
      { version: state.version, snapshot: state.snapshot, timestamp: state.updatedAt },
    ],
    _historyCursor: 0,

    save: vi.fn(async (_canvasId: string, snapshot: CanvasSnapshot) => {
      version += 1;
      const updated = makeStoredState('cs_1', snapshot, version);
      mock._historyEntries.push({
        version,
        snapshot,
        timestamp: updated.updatedAt,
      });
      mock._historyCursor = mock._historyEntries.length - 1;
      mock._canUndo = mock._historyCursor > 0;
      mock._canRedo = false;
      return updated;
    }),

    undo: vi.fn(async () => {
      mock._historyCursor -= 1;
      mock._canUndo = mock._historyCursor > 0;
      mock._canRedo = true;
      const entry = mock._historyEntries[mock._historyCursor]!;
      return makeStoredState('cs_1', entry.snapshot, entry.version);
    }),

    redo: vi.fn(async () => {
      mock._historyCursor += 1;
      mock._canRedo = mock._historyCursor < mock._historyEntries.length - 1;
      mock._canUndo = true;
      const entry = mock._historyEntries[mock._historyCursor]!;
      return makeStoredState('cs_1', entry.snapshot, entry.version);
    }),

    canUndo: vi.fn((_canvasId: string) => mock._canUndo),
    canRedo: vi.fn((_canvasId: string) => mock._canRedo),

    getHistory: vi.fn((_canvasId: string) => ({
      entries: [...mock._historyEntries],
      cursor: mock._historyCursor,
    })),

    initializeHistory: vi.fn(async () => {
      // no-op in mock
    }),

    storage: {
      get: vi.fn(async (_id: string) => state),
    },
  };

  return mock;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCanvasState', () => {
  let service: ReturnType<typeof createMockService>;

  beforeEach(() => {
    service = createMockService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------------

  describe('load', () => {
    it('should load canvas state on mount', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canvasState).not.toBeNull();
      expect(result.current.snapshot).not.toBeNull();
      expect(result.current.snapshot!.nodes[0]!.label).toBe('Agent');
      expect(service.storage.get).toHaveBeenCalledWith('cs_1');
      expect(service.initializeHistory).toHaveBeenCalledWith('cs_1');
    });

    it('should set canvasState to null if not found', async () => {
      service.storage.get = vi.fn(async () => undefined);

      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_missing', enableShortcuts: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canvasState).toBeNull();
      expect(result.current.snapshot).toBeNull();
    });

    it('should handle load errors', async () => {
      service.storage.get = vi.fn(async () => {
        throw new Error('Network error');
      });

      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error!.message).toBe('Network error');
    });

    it('should reload when canvasId changes', async () => {
      const { result, rerender } = renderHook(
        ({ canvasId }) =>
          useCanvasState({ service, canvasId, enableShortcuts: false }),
        { initialProps: { canvasId: 'cs_1' } },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(service.storage.get).toHaveBeenCalledWith('cs_1');

      rerender({ canvasId: 'cs_2' });

      await waitFor(() => {
        expect(service.storage.get).toHaveBeenCalledWith('cs_2');
      });
    });
  });

  // -----------------------------------------------------------------------
  // Save
  // -----------------------------------------------------------------------

  describe('save', () => {
    it('should save a snapshot and update state', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newSnapshot = makeSnapshot('Updated', 200, 300);

      await act(async () => {
        await result.current.save(newSnapshot);
      });

      expect(service.save).toHaveBeenCalledWith('cs_1', newSnapshot);
      expect(result.current.canvasState!.version).toBe(2);
      expect(result.current.isSaving).toBe(false);
    });

    it('should handle save errors', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Override save to throw
      service.save = vi.fn(async () => {
        throw new Error('Save failed');
      });

      await act(async () => {
        await result.current.save(makeSnapshot('V2'));
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error!.message).toBe('Save failed');
      expect(result.current.isSaving).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Undo / Redo
  // -----------------------------------------------------------------------

  describe('undo', () => {
    it('should undo and update state', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Save to make undo available
      await act(async () => {
        await result.current.save(makeSnapshot('V2', 200, 200));
      });

      expect(result.current.canUndo).toBe(true);

      await act(async () => {
        await result.current.undo();
      });

      expect(service.undo).toHaveBeenCalledWith('cs_1');
      expect(result.current.canvasState).not.toBeNull();
    });

    it('should not call service.undo when canUndo is false', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // canUndo is false initially
      expect(result.current.canUndo).toBe(false);

      await act(async () => {
        await result.current.undo();
      });

      expect(service.undo).not.toHaveBeenCalled();
    });

    it('should handle undo errors', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Force canUndo to true
      service._canUndo = true;

      // Override undo to throw
      service.undo = vi.fn(async () => {
        throw new Error('Undo failed');
      });

      await act(async () => {
        await result.current.undo();
      });

      expect(result.current.error!.message).toBe('Undo failed');
    });
  });

  describe('redo', () => {
    it('should redo and update state', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Save then undo to make redo available
      await act(async () => {
        await result.current.save(makeSnapshot('V2', 200, 200));
      });
      await act(async () => {
        await result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      await act(async () => {
        await result.current.redo();
      });

      expect(service.redo).toHaveBeenCalledWith('cs_1');
    });

    it('should not call service.redo when canRedo is false', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canRedo).toBe(false);

      await act(async () => {
        await result.current.redo();
      });

      expect(service.redo).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // canUndo / canRedo
  // -----------------------------------------------------------------------

  describe('canUndo / canRedo flags', () => {
    it('should reflect service state after save', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);

      await act(async () => {
        await result.current.save(makeSnapshot('V2'));
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should update after undo/redo cycle', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Save two snapshots
      await act(async () => {
        await result.current.save(makeSnapshot('V2'));
      });
      await act(async () => {
        await result.current.save(makeSnapshot('V3'));
      });

      expect(result.current.canUndo).toBe(true);

      // Undo
      await act(async () => {
        await result.current.undo();
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);

      // Undo again (back to initial)
      await act(async () => {
        await result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // History info
  // -----------------------------------------------------------------------

  describe('history info', () => {
    it('should track history size and cursor', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.historySize).toBe(1);
      expect(result.current.historyCursor).toBe(0);

      await act(async () => {
        await result.current.save(makeSnapshot('V2'));
      });

      expect(result.current.historySize).toBe(2);
      expect(result.current.historyCursor).toBe(1);

      await act(async () => {
        await result.current.undo();
      });

      expect(result.current.historyCursor).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // clearError
  // -----------------------------------------------------------------------

  describe('clearError', () => {
    it('should clear the error state', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Override save to throw
      service.save = vi.fn(async () => {
        throw new Error('Oops');
      });

      await act(async () => {
        await result.current.save(makeSnapshot('V2'));
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Keyboard shortcuts
  // -----------------------------------------------------------------------

  describe('keyboard shortcuts', () => {
    it('should call undo on Ctrl+Z', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: true }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Save to make undo available
      await act(async () => {
        await result.current.save(makeSnapshot('V2'));
      });

      expect(service.undo).not.toHaveBeenCalled();

      await act(async () => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'z',
            ctrlKey: true,
            shiftKey: false,
            bubbles: true,
          }),
        );
      });

      await waitFor(() => {
        expect(service.undo).toHaveBeenCalled();
      });
    });

    it('should call redo on Ctrl+Shift+Z', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: true }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Save then undo to make redo available
      await act(async () => {
        await result.current.save(makeSnapshot('V2'));
      });
      await act(async () => {
        await result.current.undo();
      });

      service.redo.mockClear();

      await act(async () => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'z',
            ctrlKey: true,
            shiftKey: true,
            bubbles: true,
          }),
        );
      });

      await waitFor(() => {
        expect(service.redo).toHaveBeenCalled();
      });
    });

    it('should call redo on Ctrl+Y', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: true }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Save then undo to make redo available
      await act(async () => {
        await result.current.save(makeSnapshot('V2'));
      });
      await act(async () => {
        await result.current.undo();
      });

      service.redo.mockClear();

      await act(async () => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'y',
            ctrlKey: true,
            bubbles: true,
          }),
        );
      });

      await waitFor(() => {
        expect(service.redo).toHaveBeenCalled();
      });
    });

    it('should not register shortcuts when enableShortcuts is false', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Save to make undo available
      await act(async () => {
        await result.current.save(makeSnapshot('V2'));
      });

      await act(async () => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'z',
            ctrlKey: true,
            bubbles: true,
          }),
        );
      });

      expect(service.undo).not.toHaveBeenCalled();
    });

    it('should ignore non-meta key presses', async () => {
      renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: true }),
      );

      await act(async () => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'z',
            ctrlKey: false,
            bubbles: true,
          }),
        );
      });

      expect(service.undo).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Auto-save
  // -----------------------------------------------------------------------

  describe('auto-save (markDirty)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce auto-save with markDirty', async () => {
      const { result } = renderHook(() =>
        useCanvasState({
          service,
          canvasId: 'cs_1',
          enableShortcuts: false,
          autoSaveMs: 500,
        }),
      );

      // Wait for initial load to complete
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Mark dirty multiple times quickly
      act(() => {
        result.current.markDirty(makeSnapshot('Dirty1'));
        result.current.markDirty(makeSnapshot('Dirty2'));
        result.current.markDirty(makeSnapshot('Dirty3'));
      });

      // Should not have saved yet
      expect(service.save).not.toHaveBeenCalled();

      // Advance timer past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // Should save only the last dirty snapshot
      expect(service.save).toHaveBeenCalledTimes(1);
      expect(service.save).toHaveBeenCalledWith('cs_1', makeSnapshot('Dirty3'));
    });

    it('should not auto-save when autoSaveMs is 0', async () => {
      const { result } = renderHook(() =>
        useCanvasState({
          service,
          canvasId: 'cs_1',
          enableShortcuts: false,
          autoSaveMs: 0,
        }),
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      act(() => {
        result.current.markDirty(makeSnapshot('Dirty'));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      expect(service.save).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Manual reload
  // -----------------------------------------------------------------------

  describe('manual reload', () => {
    it('should reload canvas state via load()', async () => {
      const { result } = renderHook(() =>
        useCanvasState({ service, canvasId: 'cs_1', enableShortcuts: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callsBefore = (service.storage.get as ReturnType<typeof vi.fn>).mock.calls.length;

      await act(async () => {
        await result.current.load();
      });

      const callsAfter = (service.storage.get as ReturnType<typeof vi.fn>).mock.calls.length;
      expect(callsAfter).toBe(callsBefore + 1);
    });
  });
});
