/**
 * Fluent builder for constructing memory queries.
 *
 * Provides a chainable API for building complex memory search and
 * query operations against any {@link MemoryProvider}.
 *
 * @example
 * ```typescript
 * import { MemorySearchBuilder, ShortTermMemory, MemoryNamespace, MemoryRole } from '@crewspace/core';
 *
 * const memory = new ShortTermMemory();
 * const results = await new MemorySearchBuilder(memory)
 *   .inNamespace(MemoryNamespace.AGENT)
 *   .withRole(MemoryRole.USER)
 *   .after('2024-01-01T00:00:00Z')
 *   .limit(10)
 *   .ascending()
 *   .execute();
 * ```
 *
 * @packageDocumentation
 */

import { MemoryQueryError } from '../errors/memory-errors.js';
import type {
  MemoryProvider,
  MemoryQueryOptions,
  MemoryQueryResult,
  MemorySortOrder,
} from '../types/memory.js';
import { MemoryNamespace, MemoryRole } from '../types/memory.js';

/**
 * Fluent builder for constructing and executing memory queries.
 *
 * Each setter returns `this` for method chaining. Call {@link execute}
 * to run a filter query or {@link search} to run a text search.
 */
export class MemorySearchBuilder {
  private readonly _provider: MemoryProvider;
  private _namespace?: MemoryNamespace;
  private _role: MemoryRole | undefined;
  private _roles: readonly MemoryRole[] | undefined;
  private _after?: string;
  private _before?: string;
  private _metadata?: Readonly<Record<string, string | number | boolean>>;
  private _limit?: number;
  private _offset?: number;
  private _sortOrder?: MemorySortOrder;

  constructor(provider: MemoryProvider) {
    this._provider = provider;
  }

  /** Filter results to a specific namespace. */
  inNamespace(namespace: MemoryNamespace): this {
    this._namespace = namespace;
    return this;
  }

  /** Filter results to a single role. */
  withRole(role: MemoryRole): this {
    this._role = role;
    this._roles = undefined;
    return this;
  }

  /** Filter results to any of the specified roles. */
  withRoles(roles: readonly MemoryRole[]): this {
    this._roles = roles;
    this._role = undefined;
    return this;
  }

  /** Only include entries created after this ISO-8601 timestamp. */
  after(timestamp: string): this {
    this._after = timestamp;
    return this;
  }

  /** Only include entries created before this ISO-8601 timestamp. */
  before(timestamp: string): this {
    this._before = timestamp;
    return this;
  }

  /** Filter by metadata key-value pairs (all must match). */
  withMetadata(metadata: Readonly<Record<string, string | number | boolean>>): this {
    this._metadata = metadata;
    return this;
  }

  /** Maximum number of entries to return. */
  limit(n: number): this {
    this._limit = n;
    return this;
  }

  /** Number of entries to skip (for pagination). */
  offset(n: number): this {
    this._offset = n;
    return this;
  }

  /** Sort results oldest-first. */
  ascending(): this {
    this._sortOrder = 'asc';
    return this;
  }

  /** Sort results newest-first (default). */
  descending(): this {
    this._sortOrder = 'desc';
    return this;
  }

  /** Build the {@link MemoryQueryOptions} from current builder state. */
  build(): MemoryQueryOptions {
    const options: Record<string, unknown> = {};

    if (this._namespace !== undefined) options['namespace'] = this._namespace;
    if (this._roles !== undefined) options['roles'] = this._roles;
    else if (this._role !== undefined) options['role'] = this._role;
    if (this._after !== undefined) options['after'] = this._after;
    if (this._before !== undefined) options['before'] = this._before;
    if (this._metadata !== undefined) options['metadata'] = this._metadata;
    if (this._limit !== undefined) options['limit'] = this._limit;
    if (this._offset !== undefined) options['offset'] = this._offset;
    if (this._sortOrder !== undefined) options['sortOrder'] = this._sortOrder;

    return options as MemoryQueryOptions;
  }

  /** Execute the query against the provider. */
  async execute(): Promise<MemoryQueryResult> {
    try {
      return await this._provider.query(this.build());
    } catch (err) {
      if (err instanceof MemoryQueryError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new MemoryQueryError(this._provider.name, message);
    }
  }

  /** Execute a full-text search with the current filters applied. */
  async search(text: string): Promise<MemoryQueryResult> {
    try {
      return await this._provider.search(text, this.build());
    } catch (err) {
      if (err instanceof MemoryQueryError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new MemoryQueryError(this._provider.name, message);
    }
  }
}
