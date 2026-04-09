/**
 * Canvas state service with undo/redo history management.
 *
 * Wraps a {@link CanvasStateStorageProvider} and maintains a per-canvas
 * version history, enabling undo, redo, and history browsing. Designed
 * to support the dashboard canvas state management (TASK-138).
 *
 * @packageDocumentation
 */

import { CanvasHistoryEmptyError, CanvasNotFoundError } from './canvas-state-errors.js';
import type {
  CanvasHistoryEntry,
  CanvasSnapshot,
  CanvasStateStorageProvider,
  StoredCanvasState,
} from './canvas-state-types.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Configuration for the canvas state service. */
export interface CanvasStateServiceConfig {
  /** The underlying storage provider. */
  readonly storage: CanvasStateStorageProvider;
  /** Maximum number of undo history entries per canvas (default: 50). */
  readonly maxHistorySize?: number;
}

// ---------------------------------------------------------------------------
// CanvasStateService
// ---------------------------------------------------------------------------

/**
 * Service that manages canvas state with undo/redo support.
 *
 * For each canvas, the service maintains a stack of snapshot history
 * entries and a cursor pointing to the current position. Saving a new
 * snapshot pushes onto the undo stack and clears the redo stack.
 *
 * @example
 * ```typescript
 * const service = new CanvasStateService({
 *   storage: new InMemoryCanvasStateStorage(),
 * });
 *
 * // Save a snapshot
 * const state = await service.save('canvas-id', updatedSnapshot);
 *
 * // Undo the last change
 * const undone = await service.undo('canvas-id');
 *
 * // Redo
 * const redone = await service.redo('canvas-id');
 * ```
 */
export class CanvasStateService {
  private readonly _storage: CanvasStateStorageProvider;
  private readonly _maxHistorySize: number;

  /**
   * History stacks per canvas ID.
   * Each entry contains the ordered history and a cursor index.
   */
  private readonly _history = new Map<
    string,
    { entries: CanvasHistoryEntry[]; cursor: number }
  >();

  constructor(config: CanvasStateServiceConfig) {
    this._storage = config.storage;
    this._maxHistorySize = config.maxHistorySize ?? 50;
  }

  /** Get the underlying storage provider. */
  get storage(): CanvasStateStorageProvider {
    return this._storage;
  }

  /**
   * Save a new snapshot for a canvas, pushing it onto the undo stack.
   * Clears any redo history beyond the current cursor.
   */
  async save(canvasId: string, snapshot: CanvasSnapshot): Promise<StoredCanvasState> {
    const existing = await this._storage.get(canvasId);
    if (!existing) {
      throw new CanvasNotFoundError(canvasId);
    }

    // Update storage
    const updated = await this._storage.update(canvasId, { snapshot });

    // Update history
    const hist = this._getOrCreateHistory(canvasId, existing);

    // Trim any future entries beyond cursor (redo gets cleared)
    hist.entries = hist.entries.slice(0, hist.cursor + 1);

    // Push new entry
    hist.entries.push({
      version: updated.version,
      snapshot: {
        nodes: [...updated.snapshot.nodes],
        edges: [...updated.snapshot.edges],
        viewport: { ...updated.snapshot.viewport },
      },
      timestamp: updated.updatedAt,
    });

    // Enforce max history size
    if (hist.entries.length > this._maxHistorySize) {
      const excess = hist.entries.length - this._maxHistorySize;
      hist.entries = hist.entries.slice(excess);
    }

    hist.cursor = hist.entries.length - 1;

    return updated;
  }

  /**
   * Undo the last change by moving the cursor back one entry.
   * Returns the restored canvas state.
   */
  async undo(canvasId: string): Promise<StoredCanvasState> {
    const hist = this._history.get(canvasId);
    if (!hist || hist.cursor <= 0) {
      throw new CanvasHistoryEmptyError(canvasId, 'undo');
    }

    hist.cursor -= 1;
    const entry = hist.entries[hist.cursor]!;

    // Apply the snapshot to storage
    const restored = await this._storage.update(canvasId, {
      snapshot: entry.snapshot,
    });

    return restored;
  }

  /**
   * Redo a previously undone change by moving the cursor forward.
   * Returns the restored canvas state.
   */
  async redo(canvasId: string): Promise<StoredCanvasState> {
    const hist = this._history.get(canvasId);
    if (!hist || hist.cursor >= hist.entries.length - 1) {
      throw new CanvasHistoryEmptyError(canvasId, 'redo');
    }

    hist.cursor += 1;
    const entry = hist.entries[hist.cursor]!;

    // Apply the snapshot to storage
    const restored = await this._storage.update(canvasId, {
      snapshot: entry.snapshot,
    });

    return restored;
  }

  /** Check whether undo is available for a canvas. */
  canUndo(canvasId: string): boolean {
    const hist = this._history.get(canvasId);
    return !!hist && hist.cursor > 0;
  }

  /** Check whether redo is available for a canvas. */
  canRedo(canvasId: string): boolean {
    const hist = this._history.get(canvasId);
    return !!hist && hist.cursor < hist.entries.length - 1;
  }

  /**
   * Get the full undo/redo history for a canvas.
   * Returns entries and the current cursor position.
   */
  getHistory(canvasId: string): { entries: readonly CanvasHistoryEntry[]; cursor: number } | undefined {
    const hist = this._history.get(canvasId);
    if (!hist) return undefined;
    return { entries: [...hist.entries], cursor: hist.cursor };
  }

  /** Clear undo/redo history for a canvas. */
  clearHistory(canvasId: string): void {
    this._history.delete(canvasId);
  }

  /**
   * Initialize history for a canvas from its current stored state.
   * Call this when first opening a canvas in the editor.
   */
  async initializeHistory(canvasId: string): Promise<void> {
    const existing = await this._storage.get(canvasId);
    if (!existing) {
      throw new CanvasNotFoundError(canvasId);
    }
    this._getOrCreateHistory(canvasId, existing);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _getOrCreateHistory(
    canvasId: string,
    current: StoredCanvasState,
  ): { entries: CanvasHistoryEntry[]; cursor: number } {
    let hist = this._history.get(canvasId);
    if (!hist) {
      hist = {
        entries: [
          {
            version: current.version,
            snapshot: {
              nodes: [...current.snapshot.nodes],
              edges: [...current.snapshot.edges],
              viewport: { ...current.snapshot.viewport },
            },
            timestamp: current.updatedAt,
          },
        ],
        cursor: 0,
      };
      this._history.set(canvasId, hist);
    }
    return hist;
  }
}
