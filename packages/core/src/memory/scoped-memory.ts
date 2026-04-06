/**
 * Scoped memory — namespace-aware wrapper around any MemoryProvider.
 *
 * Provides automatic namespace scoping with visibility rules:
 * - **AGENT** scope: writes to AGENT namespace, reads from AGENT + CREW + GLOBAL
 * - **CREW** scope: writes to CREW namespace, reads from CREW + GLOBAL
 * - **GLOBAL** scope: writes to GLOBAL, reads from GLOBAL only
 *
 * Entries are automatically tagged with owner metadata (agentId / crewId)
 * so multiple agents or crews can share the same underlying provider
 * while maintaining logical isolation.
 *
 * @packageDocumentation
 */

import { MemoryConfigError, MemoryOperationError } from '../errors/memory-errors.js';
import type {
  MemoryEntry,
  MemoryProvider,
  MemoryQueryOptions,
  MemoryQueryResult,
} from '../types/memory.js';
import { MemoryNamespace } from '../types/memory.js';

// ---------------------------------------------------------------------------
// Namespace visibility hierarchy
// ---------------------------------------------------------------------------

/**
 * Default readable namespaces for each scope level.
 * The hierarchy flows: AGENT → CREW → GLOBAL.
 */
const DEFAULT_READABLE_NAMESPACES: Readonly<Record<MemoryNamespace, readonly MemoryNamespace[]>> = {
  [MemoryNamespace.AGENT]: [MemoryNamespace.AGENT, MemoryNamespace.CREW, MemoryNamespace.GLOBAL],
  [MemoryNamespace.CREW]: [MemoryNamespace.CREW, MemoryNamespace.GLOBAL],
  [MemoryNamespace.GLOBAL]: [MemoryNamespace.GLOBAL],
};

export { DEFAULT_READABLE_NAMESPACES };

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Configuration for creating a ScopedMemory instance. */
export interface ScopedMemoryConfig {
  /** The underlying memory provider to delegate to. */
  readonly provider: MemoryProvider;
  /** The namespace scope for writes. */
  readonly namespace: MemoryNamespace;
  /** Owner identifier (e.g. agent ID or crew ID) for entry tagging. */
  readonly ownerId: string;
  /**
   * Which namespaces this scope can read from.
   * Defaults to the standard hierarchy for the configured namespace.
   */
  readonly readableNamespaces?: readonly MemoryNamespace[];
}

// ---------------------------------------------------------------------------
// ScopedMemory
// ---------------------------------------------------------------------------

/**
 * Namespace-aware memory wrapper.
 *
 * Writes are automatically tagged with the configured namespace and owner
 * metadata. Reads span all readable namespaces in the hierarchy. Within
 * the owned namespace, only entries belonging to this owner are visible.
 */
export class ScopedMemory implements MemoryProvider {
  public readonly name: string;

  private readonly _provider: MemoryProvider;
  private readonly _namespace: MemoryNamespace;
  private readonly _ownerId: string;
  private readonly _readableNamespaces: readonly MemoryNamespace[];

  constructor(config: ScopedMemoryConfig) {
    if (!config.provider) {
      throw new MemoryConfigError('ScopedMemory requires a provider');
    }
    if (!config.ownerId || typeof config.ownerId !== 'string') {
      throw new MemoryConfigError('ScopedMemory requires a non-empty ownerId string');
    }
    if (!config.namespace) {
      throw new MemoryConfigError('ScopedMemory requires a namespace');
    }

    this._provider = config.provider;
    this._namespace = config.namespace;
    this._ownerId = config.ownerId;
    this._readableNamespaces =
      config.readableNamespaces ?? DEFAULT_READABLE_NAMESPACES[this._namespace];

    this.name = `scoped:${this._namespace}:${this._ownerId}`;
  }

  /** The namespace this scope writes to. */
  get namespace(): MemoryNamespace {
    return this._namespace;
  }

  /** The owner identifier for this scope. */
  get ownerId(): string {
    return this._ownerId;
  }

  /** The namespaces this scope can read from. */
  get readableNamespaces(): readonly MemoryNamespace[] {
    return this._readableNamespaces;
  }

  /** The underlying provider. */
  get provider(): MemoryProvider {
    return this._provider;
  }

  /**
   * Add an entry to this scope's namespace.
   *
   * The entry is automatically tagged with the scope namespace and owner
   * metadata (`ownerId`). If the entry already specifies a different
   * namespace, it is overridden to the scope's namespace.
   */
  async add(entry: MemoryEntry): Promise<MemoryEntry> {
    const scoped: MemoryEntry = {
      ...entry,
      namespace: this._namespace,
      metadata: {
        ...entry.metadata,
        ownerId: this._ownerId,
      },
    };
    return this._provider.add(scoped);
  }

  /**
   * Retrieve an entry by ID, only if it's in a readable namespace.
   *
   * For entries in the owned namespace, additionally checks that the
   * entry belongs to this owner.
   */
  async get(id: string): Promise<MemoryEntry | undefined> {
    const entry = await this._provider.get(id);
    if (!entry) return undefined;
    if (!this._isVisible(entry)) return undefined;
    return entry;
  }

  /**
   * Query entries across all readable namespaces.
   *
   * If `options.namespace` is specified, it must be one of the readable
   * namespaces — otherwise an empty result is returned.
   */
  async query(options?: MemoryQueryOptions): Promise<MemoryQueryResult> {
    if (options?.namespace) {
      if (!this._readableNamespaces.includes(options.namespace)) {
        return { entries: [], total: 0 };
      }
      const result = await this._provider.query(options);
      return this._filterResult(result);
    }

    // Query each readable namespace and merge results
    return this._queryAcrossNamespaces(options);
  }

  /**
   * Search entries across all readable namespaces.
   *
   * Same visibility rules as {@link query}.
   */
  async search(text: string, options?: MemoryQueryOptions): Promise<MemoryQueryResult> {
    if (options?.namespace) {
      if (!this._readableNamespaces.includes(options.namespace)) {
        return { entries: [], total: 0 };
      }
      const result = await this._provider.search(text, options);
      return this._filterResult(result);
    }

    return this._searchAcrossNamespaces(text, options);
  }

  /**
   * Delete an entry by ID, only if it belongs to this scope's namespace
   * and owner.
   */
  async delete(id: string): Promise<boolean> {
    const entry = await this._provider.get(id);
    if (!entry) return false;
    if (!this._isOwned(entry)) {
      throw new MemoryOperationError(
        this.name,
        'delete',
        `Cannot delete entry "${id}" — not owned by this scope`,
      );
    }
    return this._provider.delete(id);
  }

  /**
   * Clear entries within a namespace.
   *
   * When called without a namespace argument, clears only the owned
   * namespace (not parent namespaces). When a namespace is specified,
   * it must match the owned namespace.
   */
  async clear(namespace?: MemoryNamespace): Promise<number> {
    const target = namespace ?? this._namespace;
    if (target !== this._namespace) {
      throw new MemoryOperationError(
        this.name,
        'clear',
        `Cannot clear namespace "${target}" — this scope only owns "${this._namespace}"`,
      );
    }
    return this._provider.clear(target);
  }

  /**
   * Count entries visible to this scope, optionally scoped to a namespace.
   */
  async count(namespace?: MemoryNamespace): Promise<number> {
    if (namespace) {
      if (!this._readableNamespaces.includes(namespace)) {
        return 0;
      }
      return this._provider.count(namespace);
    }

    let total = 0;
    for (const ns of this._readableNamespaces) {
      total += await this._provider.count(ns);
    }
    return total;
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /** Check if an entry is in a readable namespace and passes owner checks. */
  private _isVisible(entry: MemoryEntry): boolean {
    if (!this._readableNamespaces.includes(entry.namespace)) {
      return false;
    }
    // For the owned namespace, filter to entries from this owner
    if (entry.namespace === this._namespace) {
      return this._isOwned(entry);
    }
    // Parent namespaces (CREW, GLOBAL) are fully visible
    return true;
  }

  /** Check if an entry belongs to this owner. */
  private _isOwned(entry: MemoryEntry): boolean {
    return entry.namespace === this._namespace &&
      entry.metadata?.ownerId === this._ownerId;
  }

  /** Filter a query result to only include visible entries. */
  private _filterResult(result: MemoryQueryResult): MemoryQueryResult {
    const visible = result.entries.filter((e) => this._isVisible(e));
    return { entries: visible, total: visible.length };
  }


  /** Query across all readable namespaces and merge results. */
  private async _queryAcrossNamespaces(
    options?: MemoryQueryOptions,
  ): Promise<MemoryQueryResult> {
    const allEntries: MemoryEntry[] = [];

    for (const ns of this._readableNamespaces) {
      const result = await this._provider.query({
        ...options,
        namespace: ns,
        // Remove limit/offset — we handle pagination after merge
        limit: undefined,
        offset: undefined,
      });
      for (const entry of result.entries) {
        if (this._isVisible(entry)) {
          allEntries.push(entry);
        }
      }
    }

    // Sort by createdAt (default: newest first)
    const sortOrder = options?.sortOrder ?? 'desc';
    allEntries.sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? diff : -diff;
    });

    // Apply pagination
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    const paginated = allEntries.slice(offset, offset + limit);

    return { entries: paginated, total: allEntries.length };
  }

  /** Search across all readable namespaces and merge results. */
  private async _searchAcrossNamespaces(
    text: string,
    options?: MemoryQueryOptions,
  ): Promise<MemoryQueryResult> {
    const allEntries: MemoryEntry[] = [];

    for (const ns of this._readableNamespaces) {
      const result = await this._provider.search(text, {
        ...options,
        namespace: ns,
        limit: undefined,
        offset: undefined,
      });
      for (const entry of result.entries) {
        if (this._isVisible(entry)) {
          allEntries.push(entry);
        }
      }
    }

    const sortOrder = options?.sortOrder ?? 'desc';
    allEntries.sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? diff : -diff;
    });

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    const paginated = allEntries.slice(offset, offset + limit);

    return { entries: paginated, total: allEntries.length };
  }
}
