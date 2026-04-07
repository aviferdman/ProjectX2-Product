/**
 * Retention policy manager — configurable eviction for memory providers.
 *
 * Supports global and per-namespace retention policies with both
 * time-based (maxAge) and count-based (maxEntries) eviction strategies.
 * Can be applied on-demand or evaluated in dry-run mode.
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'eventemitter3';

import { MemoryConfigError } from '../errors/memory-errors.js';
import type {
  MemoryEntry,
  MemoryEventMap,
  MemoryNamespace,
  MemoryProvider,
  MemoryRetentionPolicy,
} from '../types/memory.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-namespace retention policy override. */
export interface NamespaceRetentionPolicy {
  /** The namespace this policy applies to. */
  readonly namespace: MemoryNamespace;
  /** Retention rules for this namespace. */
  readonly policy: MemoryRetentionPolicy;
}

/** Configuration for the RetentionPolicyManager. */
export interface RetentionPolicyManagerConfig {
  /** Global default retention policy. Applied to any namespace without a specific override. */
  readonly defaultPolicy?: MemoryRetentionPolicy;
  /** Per-namespace retention policy overrides. */
  readonly namespacePolicies?: readonly NamespaceRetentionPolicy[];
}

/** Result of evaluating (dry-run) retention policies against a provider. */
export interface RetentionEvaluationResult {
  /** Total entries that would be evicted. */
  readonly totalEvictable: number;
  /** Entries evictable due to count-based policy. */
  readonly countEvictable: number;
  /** Entries evictable due to time-based policy. */
  readonly timeEvictable: number;
  /** Breakdown per namespace. */
  readonly namespaceBreakdown: readonly NamespaceEvictionBreakdown[];
}

/** Per-namespace eviction breakdown in a dry-run evaluation. */
export interface NamespaceEvictionBreakdown {
  /** The namespace evaluated. */
  readonly namespace: MemoryNamespace | 'all';
  /** Number of entries evictable by count policy. */
  readonly countEvictable: number;
  /** Number of entries evictable by time policy. */
  readonly timeEvictable: number;
  /** The retention policy applied. */
  readonly policy: MemoryRetentionPolicy;
}

/** Result of applying retention policies. */
export interface RetentionEnforcementResult {
  /** Total entries evicted. */
  readonly totalEvicted: number;
  /** Entries evicted from each namespace. */
  readonly namespaceBreakdown: readonly NamespaceEvictionCount[];
}

/** Per-namespace eviction count after enforcement. */
export interface NamespaceEvictionCount {
  /** The namespace entries were evicted from. */
  readonly namespace: MemoryNamespace | 'all';
  /** Number of entries evicted. */
  readonly evicted: number;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validatePolicy(policy: MemoryRetentionPolicy, label: string): void {
  if (policy.maxEntries !== undefined) {
    if (!Number.isInteger(policy.maxEntries) || policy.maxEntries < 0) {
      throw new MemoryConfigError(`${label}.maxEntries must be a non-negative integer`);
    }
  }
  if (policy.maxAge !== undefined) {
    if (!Number.isFinite(policy.maxAge) || policy.maxAge < 0) {
      throw new MemoryConfigError(`${label}.maxAge must be a non-negative number`);
    }
  }
}

// ---------------------------------------------------------------------------
// RetentionPolicyManager
// ---------------------------------------------------------------------------

/**
 * Manages configurable retention policies for memory providers.
 *
 * Supports a global default policy plus per-namespace overrides.
 * Both time-based (`maxAge`) and count-based (`maxEntries`) eviction
 * strategies are supported and can be combined.
 *
 * @example
 * ```typescript
 * import { RetentionPolicyManager, ShortTermMemory, MemoryNamespace } from '@crewspace/core';
 *
 * const manager = new RetentionPolicyManager({
 *   defaultPolicy: { maxEntries: 100, maxAge: 3600_000 },
 *   namespacePolicies: [
 *     { namespace: MemoryNamespace.AGENT, policy: { maxEntries: 50 } },
 *   ],
 * });
 *
 * const memory = new ShortTermMemory();
 * // ... add entries ...
 *
 * // Dry-run: see what would be evicted
 * const evaluation = await manager.evaluate(memory);
 *
 * // Enforce: actually evict entries
 * const result = await manager.enforce(memory);
 * ```
 */
export class RetentionPolicyManager {
  private readonly _defaultPolicy: MemoryRetentionPolicy;
  private readonly _namespacePolicies: ReadonlyMap<MemoryNamespace, MemoryRetentionPolicy>;
  private readonly _emitter: EventEmitter<Pick<MemoryEventMap, 'memory:evict'>>;

  constructor(config?: RetentionPolicyManagerConfig) {
    this._emitter = new EventEmitter();

    // Validate and store the default policy
    const defaultPolicy = config?.defaultPolicy ?? {};
    validatePolicy(defaultPolicy, 'defaultPolicy');
    this._defaultPolicy = defaultPolicy;

    // Validate and store namespace-specific policies
    const nsMap = new Map<MemoryNamespace, MemoryRetentionPolicy>();
    if (config?.namespacePolicies) {
      const seen = new Set<MemoryNamespace>();
      for (const nsp of config.namespacePolicies) {
        if (seen.has(nsp.namespace)) {
          throw new MemoryConfigError(`Duplicate namespace policy for "${nsp.namespace}"`);
        }
        seen.add(nsp.namespace);
        validatePolicy(nsp.policy, `namespacePolicies[${nsp.namespace}]`);
        nsMap.set(nsp.namespace, nsp.policy);
      }
    }
    this._namespacePolicies = nsMap;
  }

  /** The global default retention policy. */
  get defaultPolicy(): MemoryRetentionPolicy {
    return this._defaultPolicy;
  }

  /** Read-only map of namespace-specific policies. */
  get namespacePolicies(): ReadonlyMap<MemoryNamespace, MemoryRetentionPolicy> {
    return this._namespacePolicies;
  }

  /**
   * Get the effective retention policy for a namespace.
   * Returns the namespace-specific policy if one exists, otherwise the default.
   */
  getPolicyForNamespace(namespace: MemoryNamespace): MemoryRetentionPolicy {
    return this._namespacePolicies.get(namespace) ?? this._defaultPolicy;
  }

  /** Subscribe to eviction events. */
  on<E extends keyof Pick<MemoryEventMap, 'memory:evict'>>(
    event: E,
    listener: MemoryEventMap[E],
  ): this {
    this._emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /** Unsubscribe from eviction events. */
  off<E extends keyof Pick<MemoryEventMap, 'memory:evict'>>(
    event: E,
    listener: MemoryEventMap[E],
  ): this {
    this._emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Evaluate (dry-run) retention policies against a provider.
   *
   * Returns information about which entries would be evicted without
   * actually removing anything.
   *
   * @param provider - The memory provider to evaluate
   * @param now - Optional current time (ms since epoch) for testing
   */
  async evaluate(provider: MemoryProvider, now?: number): Promise<RetentionEvaluationResult> {
    const currentTime = now ?? Date.now();
    const namespaceBreakdown: NamespaceEvictionBreakdown[] = [];
    let totalCountEvictable = 0;
    let totalTimeEvictable = 0;

    if (this._namespacePolicies.size > 0) {
      // Evaluate per-namespace policies
      for (const [namespace, policy] of this._namespacePolicies) {
        const breakdown = await this._evaluateNamespace(provider, namespace, policy, currentTime);
        namespaceBreakdown.push(breakdown);
        totalCountEvictable += breakdown.countEvictable;
        totalTimeEvictable += breakdown.timeEvictable;
      }
    }

    // Evaluate default policy for entries not covered by namespace policies
    if (this._defaultPolicy.maxEntries || this._defaultPolicy.maxAge) {
      const breakdown = await this._evaluateGlobal(provider, currentTime);
      namespaceBreakdown.push(breakdown);
      totalCountEvictable += breakdown.countEvictable;
      totalTimeEvictable += breakdown.timeEvictable;
    }

    // Total evictable is the union — entries evictable by time are likely also
    // in the count-evictable set if both are configured. We report both
    // separately but use the max for total since they overlap.
    const totalEvictable = await this._countUniqueEvictable(provider, currentTime);

    return {
      totalEvictable,
      countEvictable: totalCountEvictable,
      timeEvictable: totalTimeEvictable,
      namespaceBreakdown,
    };
  }

  /**
   * Enforce retention policies by evicting entries from the provider.
   *
   * Applies time-based eviction first, then count-based eviction.
   *
   * @param provider - The memory provider to enforce policies on
   * @param now - Optional current time (ms since epoch) for testing
   */
  async enforce(provider: MemoryProvider, now?: number): Promise<RetentionEnforcementResult> {
    const currentTime = now ?? Date.now();
    const nsBreakdown: NamespaceEvictionCount[] = [];
    let totalEvicted = 0;

    if (this._namespacePolicies.size > 0) {
      // Enforce per-namespace policies
      for (const [namespace, policy] of this._namespacePolicies) {
        const evicted = await this._enforceNamespace(provider, namespace, policy, currentTime);
        nsBreakdown.push({ namespace, evicted });
        totalEvicted += evicted;
      }
    }

    // Enforce default policy globally (for entries not covered by namespace-specific policies)
    if (this._defaultPolicy.maxEntries || this._defaultPolicy.maxAge) {
      const evicted = await this._enforceGlobal(provider, currentTime);
      nsBreakdown.push({ namespace: 'all', evicted });
      totalEvicted += evicted;
    }

    return { totalEvicted, namespaceBreakdown: nsBreakdown };
  }

  // -----------------------------------------------------------------------
  // Private: evaluation helpers
  // -----------------------------------------------------------------------

  private async _evaluateNamespace(
    provider: MemoryProvider,
    namespace: MemoryNamespace,
    policy: MemoryRetentionPolicy,
    now: number,
  ): Promise<NamespaceEvictionBreakdown> {
    let countEvictable = 0;
    let timeEvictable = 0;

    const nsCount = await provider.count(namespace);

    if (policy.maxEntries && policy.maxEntries > 0 && nsCount > policy.maxEntries) {
      countEvictable = nsCount - policy.maxEntries;
    }

    if (policy.maxAge && policy.maxAge > 0) {
      const cutoff = new Date(now - policy.maxAge).toISOString();
      const result = await provider.query({
        namespace,
        before: cutoff,
        limit: 500,
        sortOrder: 'asc',
      });
      timeEvictable = result.total;
    }

    return { namespace, countEvictable, timeEvictable, policy };
  }

  private async _evaluateGlobal(
    provider: MemoryProvider,
    now: number,
  ): Promise<NamespaceEvictionBreakdown> {
    let countEvictable = 0;
    let timeEvictable = 0;

    const totalCount = await provider.count();

    if (
      this._defaultPolicy.maxEntries &&
      this._defaultPolicy.maxEntries > 0 &&
      totalCount > this._defaultPolicy.maxEntries
    ) {
      countEvictable = totalCount - this._defaultPolicy.maxEntries;
    }

    if (this._defaultPolicy.maxAge && this._defaultPolicy.maxAge > 0) {
      const cutoff = new Date(now - this._defaultPolicy.maxAge).toISOString();
      const result = await provider.query({
        before: cutoff,
        limit: 500,
        sortOrder: 'asc',
      });
      timeEvictable = result.total;
    }

    return {
      namespace: 'all',
      countEvictable,
      timeEvictable,
      policy: this._defaultPolicy,
    };
  }

  private async _countUniqueEvictable(provider: MemoryProvider, now: number): Promise<number> {
    const evictableIds = new Set<string>();

    // Collect evictable from namespace policies
    for (const [namespace, policy] of this._namespacePolicies) {
      const ids = await this._collectEvictableIds(provider, policy, now, namespace);
      for (const id of ids) evictableIds.add(id);
    }

    // Collect evictable from global default policy
    if (this._defaultPolicy.maxEntries || this._defaultPolicy.maxAge) {
      const ids = await this._collectEvictableIds(provider, this._defaultPolicy, now);
      for (const id of ids) evictableIds.add(id);
    }

    return evictableIds.size;
  }

  private async _collectEvictableIds(
    provider: MemoryProvider,
    policy: MemoryRetentionPolicy,
    now: number,
    namespace?: MemoryNamespace,
  ): Promise<string[]> {
    const ids: string[] = [];

    // Time-based evictable
    if (policy.maxAge && policy.maxAge > 0) {
      const cutoff = new Date(now - policy.maxAge).toISOString();
      const result = await provider.query({
        ...(namespace ? { namespace } : {}),
        before: cutoff,
        limit: 500,
        sortOrder: 'asc',
      });
      for (const entry of result.entries) ids.push(entry.id);
    }

    // Count-based evictable
    if (policy.maxEntries && policy.maxEntries > 0) {
      const count = namespace ? await provider.count(namespace) : await provider.count();
      if (count > policy.maxEntries) {
        const excess = count - policy.maxEntries;
        const result = await provider.query({
          ...(namespace ? { namespace } : {}),
          limit: excess,
          sortOrder: 'asc',
        });
        for (const entry of result.entries) ids.push(entry.id);
      }
    }

    return ids;
  }

  // -----------------------------------------------------------------------
  // Private: enforcement helpers
  // -----------------------------------------------------------------------

  private async _enforceNamespace(
    provider: MemoryProvider,
    namespace: MemoryNamespace,
    policy: MemoryRetentionPolicy,
    now: number,
  ): Promise<number> {
    let totalEvicted = 0;

    // Time-based eviction first
    if (policy.maxAge && policy.maxAge > 0) {
      totalEvicted += await this._evictExpired(provider, policy.maxAge, now, namespace);
    }

    // Count-based eviction
    if (policy.maxEntries && policy.maxEntries > 0) {
      totalEvicted += await this._evictExcess(provider, policy.maxEntries, namespace);
    }

    return totalEvicted;
  }

  private async _enforceGlobal(provider: MemoryProvider, now: number): Promise<number> {
    let totalEvicted = 0;

    // Time-based eviction first
    if (this._defaultPolicy.maxAge && this._defaultPolicy.maxAge > 0) {
      totalEvicted += await this._evictExpired(provider, this._defaultPolicy.maxAge, now);
    }

    // Count-based eviction
    if (this._defaultPolicy.maxEntries && this._defaultPolicy.maxEntries > 0) {
      totalEvicted += await this._evictExcess(provider, this._defaultPolicy.maxEntries);
    }

    return totalEvicted;
  }

  private async _evictExpired(
    provider: MemoryProvider,
    maxAge: number,
    now: number,
    namespace?: MemoryNamespace,
  ): Promise<number> {
    const cutoff = new Date(now - maxAge).toISOString();
    const result = await provider.query({
      ...(namespace ? { namespace } : {}),
      before: cutoff,
      limit: 500,
      sortOrder: 'asc',
    });

    const evicted: MemoryEntry[] = [];

    for (const entry of result.entries) {
      const deleted = await provider.delete(entry.id);
      if (deleted) {
        evicted.push(entry);
      }
    }

    if (evicted.length > 0) {
      this._emit('memory:evict', evicted);
    }

    return evicted.length;
  }

  private async _evictExcess(
    provider: MemoryProvider,
    maxEntries: number,
    namespace?: MemoryNamespace,
  ): Promise<number> {
    const currentCount = namespace ? await provider.count(namespace) : await provider.count();

    if (currentCount <= maxEntries) return 0;

    const excess = currentCount - maxEntries;
    const result = await provider.query({
      ...(namespace ? { namespace } : {}),
      limit: excess,
      sortOrder: 'asc',
    });

    const evicted: MemoryEntry[] = [];

    for (const entry of result.entries) {
      const deleted = await provider.delete(entry.id);
      if (deleted) {
        evicted.push(entry);
      }
    }

    if (evicted.length > 0) {
      this._emit('memory:evict', evicted);
    }

    return evicted.length;
  }

  private _emit<E extends keyof MemoryEventMap>(
    event: E,
    ...args: Parameters<MemoryEventMap[E]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._emitter.emit as (event: string, ...args: any[]) => boolean)(event, ...args);
  }
}
