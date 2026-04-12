/**
 * React hook for canvas state management (save, load, undo/redo).
 *
 * Bridges the core {@link CanvasStateService} to React components,
 * providing reactive state, keyboard shortcuts, and auto-save support.
 *
 * TASK-138: Implement canvas state management
 *
 * @packageDocumentation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CanvasSnapshot, StoredCanvasState, CanvasHistoryEntry } from '@crewspace/core';

// ---------------------------------------------------------------------------
// Service interface (avoids hard dependency on concrete class)
// ---------------------------------------------------------------------------

/**
 * Minimal interface the hook requires from a canvas state service.
 * Compatible with the core {@link CanvasStateService}.
 */
export interface CanvasStateManager {
  save(canvasId: string, snapshot: CanvasSnapshot): Promise<StoredCanvasState>;
  undo(canvasId: string): Promise<StoredCanvasState>;
  redo(canvasId: string): Promise<StoredCanvasState>;
  canUndo(canvasId: string): boolean;
  canRedo(canvasId: string): boolean;
  getHistory(
    canvasId: string,
  ): { entries: readonly CanvasHistoryEntry[]; cursor: number } | undefined;
  initializeHistory(canvasId: string): Promise<void>;
  readonly storage: {
    get(id: string): Promise<StoredCanvasState | undefined>;
  };
}

// ---------------------------------------------------------------------------
// Hook options & result
// ---------------------------------------------------------------------------

/** Options for the {@link useCanvasState} hook. */
export interface UseCanvasStateOptions {
  /** The canvas state service instance. */
  service: CanvasStateManager;
  /** The ID of the canvas to manage. */
  canvasId: string;
  /**
   * Enable keyboard shortcuts for undo/redo.
   * - Ctrl+Z / Cmd+Z → undo
   * - Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y → redo
   * @default true
   */
  enableShortcuts?: boolean;
  /**
   * Auto-save interval in milliseconds.
   * Set to 0 or omit to disable auto-save.
   * When enabled, the hook calls `onAutoSave` with a debounced delay.
   * @default 0
   */
  autoSaveMs?: number;
}

/** The return value of {@link useCanvasState}. */
export interface UseCanvasStateResult {
  /** The current stored canvas state, or null while loading. */
  canvasState: StoredCanvasState | null;
  /** The current snapshot, or null while loading. */
  snapshot: CanvasSnapshot | null;
  /** Whether the canvas is currently being loaded. */
  isLoading: boolean;
  /** Whether a save operation is in progress. */
  isSaving: boolean;
  /** The last error from any operation, or null. */
  error: Error | null;
  /** Whether undo is available. */
  canUndo: boolean;
  /** Whether redo is available. */
  canRedo: boolean;
  /** Number of entries in the history stack. */
  historySize: number;
  /** Current cursor position in the history stack. */
  historyCursor: number;

  /** Save a new snapshot, pushing it onto the undo stack. */
  save: (snapshot: CanvasSnapshot) => Promise<void>;
  /** Reload the canvas state from storage. */
  load: () => Promise<void>;
  /** Undo the last change. */
  undo: () => Promise<void>;
  /** Redo a previously undone change. */
  redo: () => Promise<void>;
  /** Clear the current error. */
  clearError: () => void;
  /**
   * Mark the current snapshot as dirty for auto-save.
   * Only effective when `autoSaveMs > 0`.
   */
  markDirty: (snapshot: CanvasSnapshot) => void;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

/**
 * React hook for managing canvas state with undo/redo and keyboard shortcuts.
 *
 * @example
 * ```tsx
 * const {
 *   snapshot, canvasState, isLoading, isSaving,
 *   save, load, undo, redo, canUndo, canRedo,
 * } = useCanvasState({
 *   service: canvasStateService,
 *   canvasId: 'cs_abc123',
 * });
 * ```
 */
export function useCanvasState(options: UseCanvasStateOptions): UseCanvasStateResult {
  const { service, canvasId, enableShortcuts = true, autoSaveMs = 0 } = options;

  // State
  const [canvasState, setCanvasState] = useState<StoredCanvasState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [historyInfo, setHistoryInfo] = useState<{ size: number; cursor: number }>({
    size: 0,
    cursor: 0,
  });

  // Refs for stable references in callbacks
  const serviceRef = useRef(service);
  serviceRef.current = service;
  const canvasIdRef = useRef(canvasId);
  canvasIdRef.current = canvasId;
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSnapshotRef = useRef<CanvasSnapshot | null>(null);
  const mountedRef = useRef(true);

  // ---------------------------------------------------------------------------
  // History sync helper
  // ---------------------------------------------------------------------------
  const syncHistory = useCallback(() => {
    const hist = serviceRef.current.getHistory(canvasIdRef.current);
    if (hist) {
      setHistoryInfo({ size: hist.entries.length, cursor: hist.cursor });
    } else {
      setHistoryInfo({ size: 0, cursor: 0 });
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const state = await serviceRef.current.storage.get(canvasIdRef.current);
      if (!mountedRef.current) return;
      if (state) {
        setCanvasState(state);
        await serviceRef.current.initializeHistory(canvasIdRef.current);
        syncHistory();
      } else {
        setCanvasState(null);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [syncHistory]);

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  const save = useCallback(
    async (snapshot: CanvasSnapshot) => {
      setIsSaving(true);
      setError(null);
      try {
        const updated = await serviceRef.current.save(canvasIdRef.current, snapshot);
        if (!mountedRef.current) return;
        setCanvasState(updated);
        syncHistory();
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (mountedRef.current) {
          setIsSaving(false);
        }
      }
    },
    [syncHistory],
  );

  // ---------------------------------------------------------------------------
  // Undo
  // ---------------------------------------------------------------------------
  const undo = useCallback(async () => {
    if (!serviceRef.current.canUndo(canvasIdRef.current)) return;
    setError(null);
    try {
      const restored = await serviceRef.current.undo(canvasIdRef.current);
      if (!mountedRef.current) return;
      setCanvasState(restored);
      syncHistory();
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [syncHistory]);

  // ---------------------------------------------------------------------------
  // Redo
  // ---------------------------------------------------------------------------
  const redo = useCallback(async () => {
    if (!serviceRef.current.canRedo(canvasIdRef.current)) return;
    setError(null);
    try {
      const restored = await serviceRef.current.redo(canvasIdRef.current);
      if (!mountedRef.current) return;
      setCanvasState(restored);
      syncHistory();
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [syncHistory]);

  // ---------------------------------------------------------------------------
  // clearError
  // ---------------------------------------------------------------------------
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ---------------------------------------------------------------------------
  // markDirty (auto-save support)
  // ---------------------------------------------------------------------------
  const markDirty = useCallback(
    (snapshot: CanvasSnapshot) => {
      pendingSnapshotRef.current = snapshot;

      if (autoSaveMs <= 0) return;

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        const pending = pendingSnapshotRef.current;
        if (pending && mountedRef.current) {
          pendingSnapshotRef.current = null;
          void save(pending);
        }
      }, autoSaveMs);
    },
    [autoSaveMs, save],
  );

  // ---------------------------------------------------------------------------
  // Load on mount / canvasId change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [canvasId, load]);

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!enableShortcuts) return;

    const handler = (event: KeyboardEvent): void => {
      const isMeta = event.metaKey || event.ctrlKey;
      if (!isMeta) return;

      // Ctrl+Z / Cmd+Z → undo (only when Shift is NOT pressed)
      if (event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        void undo();
        return;
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z → redo
      if (event.key === 'z' && event.shiftKey) {
        event.preventDefault();
        void redo();
        return;
      }
      if (event.key === 'Z' && event.shiftKey) {
        event.preventDefault();
        void redo();
        return;
      }

      // Ctrl+Y / Cmd+Y → redo (Windows convention)
      if (event.key === 'y') {
        event.preventDefault();
        void redo();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enableShortcuts, undo, redo]);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const canUndoValue = canvasState ? service.canUndo(canvasId) : false;
  const canRedoValue = canvasState ? service.canRedo(canvasId) : false;

  return {
    canvasState,
    snapshot: canvasState?.snapshot ?? null,
    isLoading,
    isSaving,
    error,
    canUndo: canUndoValue,
    canRedo: canRedoValue,
    historySize: historyInfo.size,
    historyCursor: historyInfo.cursor,
    save,
    load,
    undo,
    redo,
    clearError,
    markDirty,
  };
}
