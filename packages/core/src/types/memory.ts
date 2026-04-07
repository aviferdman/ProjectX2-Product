/**
 * Memory system types for the Crewspace framework.
 *
 * Defines the contracts for short-term (in-memory) and long-term
 * (persistent) memory providers, along with shared data structures.
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Scope / namespace for memory entries. */
export enum MemoryNamespace {
  /** Memory scoped to a single agent. */
  AGENT = 'agent',
  /** Memory shared across agents in a crew. */
  CREW = 'crew',
  /** Memory accessible to all crews and agents. */
  GLOBAL = 'global',
}

/** Role of a message in a conversation turn. */
export enum MemoryRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  TOOL = 'tool',
}

// ---------------------------------------------------------------------------
// Core data types
// ---------------------------------------------------------------------------

/** Metadata key-value pairs attached to a memory entry. */
export type MemoryMetadata = Readonly<Record<string, string | number | boolean>>;

/**
 * A single memory entry stored by a {@link MemoryProvider}.
 *
 * Entries are immutable once created — updates produce a new entry.
 */
export interface MemoryEntry {
  /** Unique identifier (UUID v4 recommended). */
  readonly id: string;
  /** The textual content of this memory. */
  readonly content: string;
  /** Role of the author (user, assistant, etc.). */
  readonly role: MemoryRole;
  /** Namespace scope of this entry. */
  readonly namespace: MemoryNamespace;
  /** ISO-8601 timestamp of when this entry was created. */
  readonly createdAt: string;
  /** Optional key-value metadata (agent id, task id, tags, etc.). */
  readonly metadata?: MemoryMetadata;
}

/** Sort direction for query results. */
export type MemorySortOrder = 'asc' | 'desc';

/**
 * Options for querying / searching memory.
 */
export interface MemoryQueryOptions {
  /** Filter to a specific namespace. */
  readonly namespace?: MemoryNamespace;
  /** Maximum number of entries to return. */
  readonly limit?: number | undefined;
  /** Return entries created after this ISO-8601 timestamp. */
  readonly after?: string;
  /** Return entries created before this ISO-8601 timestamp. */
  readonly before?: string;
  /** Filter entries whose metadata matches all specified key-value pairs. */
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
  /** Filter to a specific role. */
  readonly role?: MemoryRole;
  /** Filter to any of the specified roles. Takes precedence over `role` if both are set. */
  readonly roles?: readonly MemoryRole[];
  /** Number of entries to skip (for pagination). */
  readonly offset?: number | undefined;
  /** Sort direction by creation timestamp. Default: `'desc'` (newest first). */
  readonly sortOrder?: MemorySortOrder;
}

/**
 * Result of a search or query operation.
 */
export interface MemoryQueryResult {
  /** The matched entries (ordered newest-first). */
  readonly entries: readonly MemoryEntry[];
  /** Total number of entries matching the query (may exceed `entries.length`). */
  readonly total: number;
}

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

/**
 * Contract for all memory storage backends.
 *
 * Implementations must be safe for concurrent calls within a single
 * Node.js event loop (no shared mutable state across `await` points
 * without guarding).
 */
export interface MemoryProvider {
  /** Human-readable name of the provider (e.g. "short-term", "sqlite"). */
  readonly name: string;

  /**
   * Store a new entry.
   *
   * @param entry - The entry to persist
   * @returns The stored entry (may have normalised fields)
   */
  add(entry: MemoryEntry): Promise<MemoryEntry>;

  /**
   * Retrieve a single entry by its id.
   *
   * @param id - Entry id
   * @returns The entry, or `undefined` if not found
   */
  get(id: string): Promise<MemoryEntry | undefined>;

  /**
   * Query entries matching the given options.
   *
   * @param options - Filter / pagination options
   * @returns Matching entries with total count
   */
  query(options?: MemoryQueryOptions): Promise<MemoryQueryResult>;

  /**
   * Search entries by a text query string.
   *
   * The search strategy is implementation-defined (substring, full-text,
   * semantic embedding, etc.).
   *
   * @param text    - The search text
   * @param options - Additional filters
   * @returns Matching entries with total count
   */
  search(text: string, options?: MemoryQueryOptions): Promise<MemoryQueryResult>;

  /**
   * Delete a single entry by id.
   *
   * @param id - Entry id
   * @returns `true` if the entry was found and deleted
   */
  delete(id: string): Promise<boolean>;

  /**
   * Remove all entries, optionally scoped to a namespace.
   *
   * @param namespace - When provided, only entries in this namespace are removed
   * @returns Number of entries removed
   */
  clear(namespace?: MemoryNamespace): Promise<number>;

  /**
   * Count stored entries, optionally scoped to a namespace.
   *
   * @param namespace - When provided, count only entries in this namespace
   */
  count(namespace?: MemoryNamespace): Promise<number>;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Retention policy — controls automatic eviction of old entries. */
export interface MemoryRetentionPolicy {
  /** Maximum number of entries to keep (0 = unlimited). */
  readonly maxEntries?: number;
  /** Maximum age in milliseconds (0 = unlimited). */
  readonly maxAge?: number;
}

/**
 * Configuration for creating a memory provider or manager.
 */
export interface MemoryConfig {
  /** Default namespace for entries that don't specify one. */
  readonly defaultNamespace?: MemoryNamespace;
  /** Retention policy applied on write (evicts oldest entries when exceeded). */
  readonly retention?: MemoryRetentionPolicy;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Map of memory event names to their listener signatures. */
export interface MemoryEventMap {
  'memory:add': (entry: MemoryEntry) => void;
  'memory:delete': (id: string) => void;
  'memory:clear': (namespace: MemoryNamespace | undefined, count: number) => void;
  'memory:evict': (entries: readonly MemoryEntry[]) => void;
}
