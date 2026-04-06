/**
 * Memory manager — coordinates one or more {@link MemoryProvider}s.
 *
<<<<<<< HEAD
 * Provides a unified API for storing and retrieving entries across
 * multiple backends (e.g. short-term in-memory + long-term SQLite).
 * Entries are written to all registered providers; reads are served
 * by the first provider that returns a result (priority order).
 *
=======
>>>>>>> agent/developer/development-developer-c66
 * @packageDocumentation
 */

import { EventEmitter } from 'eventemitter3';

import { MemoryConfigError, MemoryOperationError } from '../errors/memory-errors.js';
import type {
  MemoryConfig,
  MemoryEntry,
  MemoryEventMap,
  MemoryProvider,
  MemoryQueryOptions,
  MemoryQueryResult,
} from '../types/memory.js';
import { MemoryNamespace, MemoryRole } from '../types/memory.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _counter = 0;

/** Generate a simple unique id (not cryptographically secure). */
export function generateMemoryId(): string {
  _counter++;
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `mem_${timestamp}_${random}_${String(_counter)}`;
}

/**
 * Convenience factory to create a fully-populated {@link MemoryEntry}.
<<<<<<< HEAD
 *
 * @param content   - The text content
 * @param role      - Author role
 * @param namespace - Namespace scope
 * @param metadata  - Optional metadata
 * @returns A frozen entry with an auto-generated id and timestamp
=======
>>>>>>> agent/developer/development-developer-c66
 */
export function createMemoryEntry(
  content: string,
  role: MemoryRole,
  namespace: MemoryNamespace = MemoryNamespace.AGENT,
  metadata?: MemoryEntry['metadata'],
): MemoryEntry {
  return Object.freeze({
    id: generateMemoryId(),
    content,
    role,
    namespace,
    createdAt: new Date().toISOString(),
    ...(metadata !== undefined && { metadata }),
  });
}

// ---------------------------------------------------------------------------
// MemoryManager
// ---------------------------------------------------------------------------

/**
 * Configuration for {@link MemoryManager}.
 */
export interface MemoryManagerConfig extends MemoryConfig {
<<<<<<< HEAD
  /**
   * Memory providers in priority order. The first provider is treated
   * as the "primary" — it is used for reads when multiple providers
   * contain the same entry.
   */
=======
>>>>>>> agent/developer/development-developer-c66
  readonly providers?: readonly MemoryProvider[];
}

/**
 * Coordinates multiple memory providers behind a single interface.
<<<<<<< HEAD
 *
=======
>>>>>>> agent/developer/development-developer-c66
 * Writes fan out to all providers; reads use the first match.
 */
export class MemoryManager implements MemoryProvider {
  public readonly name = 'manager';

  private readonly _providers: MemoryProvider[];
  private readonly _defaultNamespace: MemoryNamespace;
  private readonly _emitter: EventEmitter<MemoryEventMap>;

  constructor(config?: MemoryManagerConfig) {
    this._emitter = new EventEmitter<MemoryEventMap>();
    this._defaultNamespace = config?.defaultNamespace ?? MemoryNamespace.AGENT;
    this._providers = config?.providers ? [...config.providers] : [];

<<<<<<< HEAD
    // Validate uniqueness of provider names
=======
>>>>>>> agent/developer/development-developer-c66
    const names = new Set<string>();
    for (const p of this._providers) {
      if (names.has(p.name)) {
        throw new MemoryConfigError(
          `Duplicate provider name "${p.name}"`,
          'manager',
        );
      }
      names.add(p.name);
    }
  }

<<<<<<< HEAD
  /** The default namespace used when entries don't specify one. */
=======
>>>>>>> agent/developer/development-developer-c66
  get defaultNamespace(): MemoryNamespace {
    return this._defaultNamespace;
  }

<<<<<<< HEAD
  /** The registered providers (read-only snapshot). */
=======
>>>>>>> agent/developer/development-developer-c66
  get providers(): readonly MemoryProvider[] {
    return [...this._providers];
  }

<<<<<<< HEAD
  // -----------------------------------------------------------------------
  // Provider management
  // -----------------------------------------------------------------------

  /**
   * Register a new memory provider.
   *
   * @param provider - Provider to add
   * @throws {MemoryConfigError} If a provider with the same name is already registered
   */
=======
>>>>>>> agent/developer/development-developer-c66
  addProvider(provider: MemoryProvider): void {
    if (this._providers.some((p) => p.name === provider.name)) {
      throw new MemoryConfigError(
        `Provider "${provider.name}" is already registered`,
        'manager',
      );
    }
    this._providers.push(provider);
  }

<<<<<<< HEAD
  /**
   * Remove a provider by name.
   *
   * @param name - Provider name
   * @returns true if the provider was found and removed
   */
=======
>>>>>>> agent/developer/development-developer-c66
  removeProvider(name: string): boolean {
    const idx = this._providers.findIndex((p) => p.name === name);
    if (idx === -1) return false;
    this._providers.splice(idx, 1);
    return true;
  }

<<<<<<< HEAD
  /**
   * Get a provider by name.
   *
   * @param name - Provider name
   * @returns The provider, or undefined if not found
   */
=======
>>>>>>> agent/developer/development-developer-c66
  getProvider(name: string): MemoryProvider | undefined {
    return this._providers.find((p) => p.name === name);
  }

<<<<<<< HEAD
  // -----------------------------------------------------------------------
  // Event system
  // -----------------------------------------------------------------------

  /** Subscribe to a memory lifecycle event. */
=======
>>>>>>> agent/developer/development-developer-c66
  on<E extends keyof MemoryEventMap>(event: E, listener: MemoryEventMap[E]): this {
    this._emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

<<<<<<< HEAD
  /** Unsubscribe from a memory lifecycle event. */
=======
>>>>>>> agent/developer/development-developer-c66
  off<E extends keyof MemoryEventMap>(event: E, listener: MemoryEventMap[E]): this {
    this._emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

<<<<<<< HEAD
  // -----------------------------------------------------------------------
  // MemoryProvider implementation (fan-out writes, first-match reads)
  // -----------------------------------------------------------------------

=======
>>>>>>> agent/developer/development-developer-c66
  async add(entry: MemoryEntry): Promise<MemoryEntry> {
    this._ensureProviders('add');

    let stored: MemoryEntry = entry;
    const errors: Error[] = [];

    for (const provider of this._providers) {
      try {
        stored = await provider.add(entry);
      } catch (err) {
        errors.push(err instanceof Error ? err : new Error(String(err)));
      }
    }

    if (errors.length === this._providers.length) {
      throw new MemoryOperationError(
        this.name,
        'add',
        `All providers failed: ${errors.map((e) => e.message).join('; ')}`,
      );
    }

    this._emit('memory:add', stored);
    return stored;
  }

  async get(id: string): Promise<MemoryEntry | undefined> {
    for (const provider of this._providers) {
      const entry = await provider.get(id);
      if (entry) return entry;
    }
    return undefined;
  }

  async query(options?: MemoryQueryOptions): Promise<MemoryQueryResult> {
    if (this._providers.length === 0) {
      return { entries: [], total: 0 };
    }
<<<<<<< HEAD
    // Use the primary (first) provider for reads
=======
>>>>>>> agent/developer/development-developer-c66
    return this._providers[0].query(options);
  }

  async search(text: string, options?: MemoryQueryOptions): Promise<MemoryQueryResult> {
    if (this._providers.length === 0) {
      return { entries: [], total: 0 };
    }
    return this._providers[0].search(text, options);
  }

  async delete(id: string): Promise<boolean> {
    let deleted = false;
    for (const provider of this._providers) {
      const result = await provider.delete(id);
      if (result) deleted = true;
    }
    if (deleted) {
      this._emit('memory:delete', id);
    }
    return deleted;
  }

  async clear(namespace?: MemoryNamespace): Promise<number> {
    let total = 0;
    for (const provider of this._providers) {
      total += await provider.clear(namespace);
    }
    this._emit('memory:clear', namespace, total);
    return total;
  }

  async count(namespace?: MemoryNamespace): Promise<number> {
    if (this._providers.length === 0) return 0;
    return this._providers[0].count(namespace);
  }

<<<<<<< HEAD
  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

=======
>>>>>>> agent/developer/development-developer-c66
  private _ensureProviders(operation: string): void {
    if (this._providers.length === 0) {
      throw new MemoryOperationError(
        this.name,
        operation,
        'No memory providers registered. Call addProvider() first.',
      );
    }
  }

<<<<<<< HEAD
  /** Type-safe event emission helper. */
=======
>>>>>>> agent/developer/development-developer-c66
  private _emit<E extends keyof MemoryEventMap>(
    event: E,
    ...args: Parameters<MemoryEventMap[E]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._emitter.emit as (event: string, ...args: any[]) => boolean)(event, ...args);
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> agent/developer/development-developer-c66
