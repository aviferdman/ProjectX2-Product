/**
 * Types for the Canvas State API.
 *
 * Defines the data model for persisting visual canvas layouts — node
 * positions, edges, viewport, and version history — so the dashboard
 * can save, load, and undo/redo canvas state.
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Node types (mirrors UI canvas node categories)
// ---------------------------------------------------------------------------

/** The node categories supported by the canvas. */
export type CanvasNodeKind = 'agent' | 'task' | 'tool' | 'llm';

/** Runtime display status of a canvas node. */
export type CanvasNodeStatus = 'idle' | 'running' | 'success' | 'error' | 'disabled';

// ---------------------------------------------------------------------------
// Position & viewport
// ---------------------------------------------------------------------------

/** 2-D position of a node on the canvas. */
export interface CanvasPosition {
  readonly x: number;
  readonly y: number;
}

/** Viewport state describing the user's view of the canvas. */
export interface CanvasViewport {
  /** Horizontal scroll position. */
  readonly x: number;
  /** Vertical scroll position. */
  readonly y: number;
  /** Current zoom level (e.g. 0.1–2.0). */
  readonly zoom: number;
}

// ---------------------------------------------------------------------------
// Canvas node
// ---------------------------------------------------------------------------

/** A single node stored in the canvas state. */
export interface CanvasNode {
  /** Unique node identifier. */
  readonly id: string;
  /** Node category. */
  readonly kind: CanvasNodeKind;
  /** Display label. */
  readonly label: string;
  /** Optional description. */
  readonly description?: string;
  /** Canvas coordinates. */
  readonly position: CanvasPosition;
  /** Display status. */
  readonly status?: CanvasNodeStatus;
  /** Width in pixels (optional, for custom sizing). */
  readonly width?: number;
  /** Height in pixels (optional, for custom sizing). */
  readonly height?: number;
  /** Optional user-defined metadata. */
  readonly data?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Canvas edge
// ---------------------------------------------------------------------------

/** Visual variant for an edge. */
export type CanvasEdgeVariant = 'default' | 'active' | 'dataFlow' | 'error';

/** A connection between two nodes. */
export interface CanvasEdge {
  /** Unique edge identifier. */
  readonly id: string;
  /** Source node ID. */
  readonly source: string;
  /** Target node ID. */
  readonly target: string;
  /** Optional source handle/port. */
  readonly sourceHandle?: string;
  /** Optional target handle/port. */
  readonly targetHandle?: string;
  /** Visual variant. */
  readonly variant?: CanvasEdgeVariant;
  /** Optional label. */
  readonly label?: string;
  /** Whether the edge should animate. */
  readonly animated?: boolean;
}

// ---------------------------------------------------------------------------
// Canvas snapshot (a single point-in-time state)
// ---------------------------------------------------------------------------

/** A full snapshot of canvas state at a given version. */
export interface CanvasSnapshot {
  /** Nodes on the canvas. */
  readonly nodes: readonly CanvasNode[];
  /** Edges connecting the nodes. */
  readonly edges: readonly CanvasEdge[];
  /** Current viewport. */
  readonly viewport: CanvasViewport;
}

// ---------------------------------------------------------------------------
// Stored canvas state (persisted record)
// ---------------------------------------------------------------------------

/** A persisted canvas state record tied to a workflow. */
export interface StoredCanvasState {
  /** Unique canvas state identifier. */
  readonly id: string;
  /** The workflow this canvas belongs to. */
  readonly workflowId: string;
  /** Human-readable name. */
  readonly name: string;
  /** Current snapshot. */
  readonly snapshot: CanvasSnapshot;
  /** Version number, incremented on each save. */
  readonly version: number;
  /** ISO-8601 timestamp when the canvas state was created. */
  readonly createdAt: string;
  /** ISO-8601 timestamp of the last update. */
  readonly updatedAt: string;
  /** Optional user-defined metadata. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Create / Update DTOs
// ---------------------------------------------------------------------------

/** Input for creating a new canvas state. */
export interface CreateCanvasStateInput {
  /** The workflow this canvas belongs to. */
  readonly workflowId: string;
  /** Human-readable name. */
  readonly name: string;
  /** Initial snapshot. */
  readonly snapshot: CanvasSnapshot;
  /** Optional metadata. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Input for updating an existing canvas state. */
export interface UpdateCanvasStateInput {
  /** Updated name. */
  readonly name?: string;
  /** Updated snapshot (triggers version increment). */
  readonly snapshot?: CanvasSnapshot;
  /** Updated metadata. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// List / Query options
// ---------------------------------------------------------------------------

/** Options for listing canvas states. */
export interface ListCanvasStatesOptions {
  /** Filter by workflow ID. */
  readonly workflowId?: string;
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
export interface ListCanvasStatesResult {
  /** The canvas states matching the query. */
  readonly states: readonly StoredCanvasState[];
  /** Total number matching the filter (before pagination). */
  readonly total: number;
}

// ---------------------------------------------------------------------------
// Storage provider interface
// ---------------------------------------------------------------------------

/** Abstract storage provider for canvas state. */
export interface CanvasStateStorageProvider {
  /** Create a new canvas state and return it with generated id and timestamps. */
  create(input: CreateCanvasStateInput): Promise<StoredCanvasState>;

  /** Retrieve a canvas state by ID. Returns undefined if not found. */
  get(id: string): Promise<StoredCanvasState | undefined>;

  /** List canvas states with optional filtering and pagination. */
  list(options?: ListCanvasStatesOptions): Promise<ListCanvasStatesResult>;

  /** Update an existing canvas state. Returns the updated record. */
  update(id: string, input: UpdateCanvasStateInput): Promise<StoredCanvasState>;

  /** Delete a canvas state by ID. Returns true if it existed and was deleted. */
  delete(id: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// History entry (for undo/redo)
// ---------------------------------------------------------------------------

/** A history entry capturing a snapshot at a specific version. */
export interface CanvasHistoryEntry {
  /** The version number this entry corresponds to. */
  readonly version: number;
  /** The snapshot at this version. */
  readonly snapshot: CanvasSnapshot;
  /** ISO-8601 timestamp of when this version was saved. */
  readonly timestamp: string;
}
