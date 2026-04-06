/**
 * In-memory (short-term) memory provider.
 *
 * Stores conversation history and context in a simple `Map`, with
 * optional retention policies (max entries, max age). Entries are
 * evicted oldest-first when limits are exceeded.
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'eventemitter3';

import { MemoryConfigError, MemoryOperationError } from '../errors/memory-errors.js';
import type {
  MemoryConfig,
  MemoryEntry,
  MemoryEventMap,
  MemoryMetadata,
  MemoryProvider,
  MemoryQueryOptions,
  MemoryQueryResult,
  MemoryRetentionPolicy,
} from '../types/memory.js';
import { MemoryNamespace } from '../types/memory.js';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_MAX_ENTRIES = 1000;
const DEFAULT_QUERY_LIMIT = 50;
const MAX_QUERY_LIMIT = 500;

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateRetentionPolicy(policy: MemoryRetentionPolicy): void {
  if (policy.maxEntries !== undefined) {
    if (!Number.isInteger(policy.maxEntries) || policy.maxEntries < 0) {
      throw new MemoryConfigError('retention.maxEntries must be a non-negative integer');
    }
  }
  if (policy.maxAge !== undefined) {
    if (!Number.isFinite(policy.maxAge) || policy.maxAge < 0) {
      throw new MemoryConfigError('retention.maxAge must be a non-negative number');
    }
  }
}

function validateEntry(entry: MemoryEntry): void {
  if (!entry.id || typeof entry.id !== 'string') {
    throw new MemoryOperationError('short-term', 'add', 'entry.id must be a non-empty string');
  }
  if (!entry.content || typeof entry.content !== 'string') {
    throw new MemoryOperationError(
      'short-term',
      'add',
      'entry.content must be a non-empty string',
    );
  }
  if (!entry.role || typeof entry.role !== 'string') {
    throw new MemoryOperationError('short-term', 'add', 'entry.role must be a non-empty string');
  }
  if (!entry.namespace || typeof entry.namespace !== 'string') {
    throw new MemoryOperationError(
      'short-term',
      'add',
      'entry.namespace must be a non-empty string',
    );
  }
  if (!entry.createdAt || typeof entry.createdAt !== 'string') {
    throw new MemoryOperationError(
      'short-term',
      'add',
      'entry.createdAt must be a non-empty string',
    );
  }
}

function matchesMetadata(
  entryMeta: MemoryMetadata | undefined,
  filterMeta: Readonly<Record<string, string | number | boolean>>,
): boolean {
  if (!entryMeta) return false;
  for (const [key, value] of Object.entries(filterMeta)) {
    if (entryMeta[key] !== value) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// ShortTermMemory
// ---------------------------------------------------------------------------

/**
 * In-memory implementation of {@link MemoryProvider}.
 *
 * Best suited for short-lived conversation context within a single
 * agent run. Data is lost when the process exits.
 *
 * @example
 * ```typescript
 * import { ShortTermMemory, MemoryNamespace, MemoryRole } from '@crewspace/core';
 *
 * const memory = new ShortTermMemory({
 *   retention: { maxEntries: 100 },
 * });
 *
 * await memory.add({
 *   id: crypto.randomUUID(),
 *   content: 'What is the weather today?',
 *   role: MemoryRole.USER,
 *   namespace: MemoryNamespace.AGENT,
 *   createdAt: new Date().toISOString(),
 * });
 *
 * const recent = await memory.query({ limit: 10 });
 * ```
 */
export class ShortTermMemory implements MemoryProvider {
  public readonly name = 'short-term';

  private readonly _store: Map<string, MemoryEntry> = new Map();
  private readonly _insertionOrder: string[] = [];
  private readonly _defaultNamespace: MemoryNamespace;
  private readonly _maxEntries: number;
  private readonly _maxAge: number;
  private readonly _emitter: EventEmitter<MemoryEventMap>;

  constructor(config?: MemoryConfig) {
    this._emitter = new EventEmitter<MemoryEventMap>();
    this._defaultNamespace = config?.defaultNamespace ?? MemoryNamespace.AGENT;

    const retention = config?.retention;
    if (retention) {
      validateRetentionPolicy(retention);
    }

    this._maxEntries = retention?.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this._maxAge = retention?.maxAge ?? 0;
  }

  // -----------------------------------------------------------------------
  // Event system
  // -----------------------------------------------------------------------

  /** Subscribe to a memory lifecycle event. */
  on<E extends keyof MemoryEventMap>(event: E, listener: MemoryEventMap[E]): this {
    this._emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /** Unsubscribe from a memory lifecycle event. */
  off<E extends keyof MemoryEventMap>(event: E, listener: MemoryEventMap[E]): this {
    this._emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  // -----------------------------------------------------------------------
  // MemoryProvider implementation
  // -----------------------------------------------------------------------

  async add(entry: MemoryEntry): Promise<MemoryEntry> {
    validateEntry(entry);

    if (this._store.has(entry.id)) {
      throw new MemoryOperationError(
        this.name,
        'add',
        `Entry with id "${entry.id}" already exists`,
      );
    }

    // Apply age-based eviction before inserting
    if (this._maxAge > 0) {
      this._evictExpired();
    }

    // Apply count-based eviction
    if (this._maxEntries > 0 && this._store.size >= this._maxEntries) {
      this._evictOldest(this._store.size - this._maxEntries + 1);
    }

    const stored = Object.freeze({ ...entry });
    this._store.set(stored.id, stored);
    this._insertionOrder.push(stored.id);

    this._emit('memory:add', stored);
    return stored;
  }

  async get(id: string): Promise<MemoryEntry | undefined> {
    return this._store.get(id);
  }

  async query(options?: MemoryQueryOptions): Promise<MemoryQueryResult> {
    const limit = Math.min(options?.limit ?? DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT);
    const entries = this._filter(options);
    return {
      entries: entries.slice(0, limit),
      total: entries.length,
    };
  }

  async search(text: string, options?: MemoryQueryOptions): Promise<MemoryQueryResult> {
    if (!text || typeof text !== 'string') {
      return { entries: [], total: 0 };
    }

    const lower = text.toLowerCase();
    const limit = Math.min(options?.limit ?? DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT);

    const filtered = this._filter(options).filter((e) =>
      e.content.toLowerCase().includes(lower),
    );

    return {
      entries: filtered.slice(0, limit),
      total: filtered.length,
    };
  }

  async delete(id: string): Promise<boolean> {
    const existed = this._store.delete(id);
    if (existed) {
      const idx = this._insertionOrder.indexOf(id);
      if (idx !== -1) {
        this._insertionOrder.splice(idx, 1);
      }
      this._emit('memory:delete', id);
    }
    return existed;
  }

  async clear(namespace?: MemoryNamespace): Promise<number> {
    if (namespace === undefined) {
      const count = this._store.size;
      this._store.clear();
      this._insertionOrder.length = 0;
      this._emit('memory:clear', undefined, count);
      return count;
    }

    const toRemove: string[] = [];
    for (const [id, entry] of this._store) {
      if (entry.namespace === namespace) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this._store.delete(id);
      const idx = this._insertionOrder.indexOf(id);
      if (idx !== -1) {
        this._insertionOrder.splice(idx, 1);
      }
    }

    this._emit('memory:clear', namespace, toRemove.length);
    return toRemove.length;
  }

  async count(namespace?: MemoryNamespace): Promise<number> {
    if (namespace === undefined) return this._store.size;
    let c = 0;
    for (const entry of this._store.values()) {
      if (entry.namespace === namespace) c++;
    }
    return c;
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /**
   * Return entries matching the given query options, sorted newest-first.
   */
  private _filter(options?: MemoryQueryOptions): MemoryEntry[] {
    let entries = Array.from(this._store.values());

    if (options?.namespace) {
      entries = entries.filter((e) => e.namespace === options.namespace);
    }

    if (options?.after) {
      const afterMs = new Date(options.after).getTime();
      entries = entries.filter((e) => new Date(e.createdAt).getTime() > afterMs);
    }

    if (options?.before) {
      const beforeMs = new Date(options.before).getTime();
      entries = entries.filter((e) => new Date(e.createdAt).getTime() < beforeMs);
    }

    if (options?.metadata) {
      const meta = options.metadata;
      entries = entries.filter((e) => matchesMetadata(e.metadata, meta));
    }

    // Sort newest-first
    entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return entries;
  }

  /** Evict the N oldest entries (by insertion order). */
  private _evictOldest(count: number): void {
    const evicted: MemoryEntry[] = [];
    for (let i = 0; i < count && this._insertionOrder.length > 0; i++) {
      const id = this._insertionOrder.shift()!;
      const entry = this._store.get(id);
      if (entry) {
        evicted.push(entry);
        this._store.delete(id);
      }
    }
    if (evicted.length > 0) {
      this._emit('memory:evict', evicted);
    }
  }

  /** Remove entries older than `_maxAge` milliseconds. */
  private _evictExpired(): void {
    const cutoff = Date.now() - this._maxAge;
    const evicted: MemoryEntry[] = [];

    for (const [id, entry] of this._store) {
      if (new Date(entry.createdAt).getTime() < cutoff) {
        evicted.push(entry);
        this._store.delete(id);
        const idx = this._insertionOrder.indexOf(id);
        if (idx !== -1) {
          this._insertionOrder.splice(idx, 1);
        }
      }
    }

    if (evicted.length > 0) {
      this._emit('memory:evict', evicted);
    }
  }

  /** Type-safe event emission helper. */
  private _emit<E extends keyof MemoryEventMap>(
    event: E,
    ...args: Parameters<MemoryEventMap[E]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._emitter.emit as (event: string, ...args: any[]) => boolean)(event, ...args);
  }
}