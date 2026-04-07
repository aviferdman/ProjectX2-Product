/**
 * Namespaced memory manager — high-level orchestrator for namespace-scoped memory.
 *
 * Creates and manages {@link ScopedMemory} instances for agents, crews, and
 * global access, all backed by a shared {@link MemoryProvider}. Instances
 * are cached so repeated calls with the same owner ID return the same view.
 *
 * @example
 * ```typescript
 * import { NamespacedMemoryManager, ShortTermMemory } from '@crewspace/core';
 *
 * const backing = new ShortTermMemory();
 * const nsm = new NamespacedMemoryManager({ provider: backing });
 *
 * const agentMem = nsm.forAgent('analyst');   // AGENT scope
 * const crewMem  = nsm.forCrew('research');   // CREW scope
 * const globalMem = nsm.global();             // GLOBAL scope
 *
 * // Agent can see own entries + crew + global
 * // Crew can see own entries + global
 * // Global can only see global entries
 * ```
 *
 * @packageDocumentation
 */

import { MemoryConfigError } from '../errors/memory-errors.js';
import type { MemoryProvider } from '../types/memory.js';
import { MemoryNamespace } from '../types/memory.js';
import { ScopedMemory } from './scoped-memory.js';
import type { ScopedMemoryConfig } from './scoped-memory.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Configuration for creating a {@link NamespacedMemoryManager}. */
export interface NamespacedMemoryManagerConfig {
  /** The shared backing memory provider. */
  readonly provider: MemoryProvider;
  /**
   * Optional custom readable-namespace mappings.
   * Passed through to each {@link ScopedMemory} instance.
   */
  readonly readableNamespaces?: Partial<
    Record<MemoryNamespace, readonly MemoryNamespace[]>
  >;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Owner ID used for the global namespace (since there's no single "owner"). */
export const GLOBAL_OWNER_ID = '__global__';

// ---------------------------------------------------------------------------
// NamespacedMemoryManager
// ---------------------------------------------------------------------------

/**
 * Orchestrates namespace-scoped memory views over a shared provider.
 *
 * Provides factory methods to create per-agent, per-crew, and global
 * {@link ScopedMemory} instances. Instances are cached by owner ID
 * so the same agent/crew always receives the same scoped view.
 */
export class NamespacedMemoryManager {
  private readonly _provider: MemoryProvider;
  private readonly _readableNamespaces?: Partial<
    Record<MemoryNamespace, readonly MemoryNamespace[]>
  >;
  private readonly _agentScopes: Map<string, ScopedMemory> = new Map();
  private readonly _crewScopes: Map<string, ScopedMemory> = new Map();
  private _globalScope: ScopedMemory | undefined;

  constructor(config: NamespacedMemoryManagerConfig) {
    if (!config.provider) {
      throw new MemoryConfigError(
        'NamespacedMemoryManager requires a provider',
      );
    }
    this._provider = config.provider;
    this._readableNamespaces = config.readableNamespaces;
  }

  /** The underlying shared memory provider. */
  get provider(): MemoryProvider {
    return this._provider;
  }

  /**
   * Get (or create) an AGENT-scoped memory view for the given agent ID.
   *
   * Agent scope can read from: AGENT (own entries only) + CREW + GLOBAL.
   *
   * @param agentId - Unique agent identifier
   * @returns A {@link ScopedMemory} bound to the AGENT namespace
   */
  forAgent(agentId: string): ScopedMemory {
    this._validateOwnerId(agentId, 'agentId');

    let scoped = this._agentScopes.get(agentId);
    if (!scoped) {
      scoped = this._createScoped(MemoryNamespace.AGENT, agentId);
      this._agentScopes.set(agentId, scoped);
    }
    return scoped;
  }

  /**
   * Get (or create) a CREW-scoped memory view for the given crew ID.
   *
   * Crew scope can read from: CREW (own entries only) + GLOBAL.
   *
   * @param crewId - Unique crew identifier
   * @returns A {@link ScopedMemory} bound to the CREW namespace
   */
  forCrew(crewId: string): ScopedMemory {
    this._validateOwnerId(crewId, 'crewId');

    let scoped = this._crewScopes.get(crewId);
    if (!scoped) {
      scoped = this._createScoped(MemoryNamespace.CREW, crewId);
      this._crewScopes.set(crewId, scoped);
    }
    return scoped;
  }

  /**
   * Get (or create) the GLOBAL-scoped memory view.
   *
   * Global scope can only read from: GLOBAL.
   *
   * @returns A {@link ScopedMemory} bound to the GLOBAL namespace
   */
  global(): ScopedMemory {
    if (!this._globalScope) {
      this._globalScope = this._createScoped(
        MemoryNamespace.GLOBAL,
        GLOBAL_OWNER_ID,
      );
    }
    return this._globalScope;
  }

  /**
   * Check if a scoped view exists for a given agent ID.
   */
  hasAgent(agentId: string): boolean {
    return this._agentScopes.has(agentId);
  }

  /**
   * Check if a scoped view exists for a given crew ID.
   */
  hasCrew(crewId: string): boolean {
    return this._crewScopes.has(crewId);
  }

  /**
   * Remove the cached scoped view for an agent.
   *
   * @returns `true` if the view existed and was removed
   */
  removeAgent(agentId: string): boolean {
    return this._agentScopes.delete(agentId);
  }

  /**
   * Remove the cached scoped view for a crew.
   *
   * @returns `true` if the view existed and was removed
   */
  removeCrew(crewId: string): boolean {
    return this._crewScopes.delete(crewId);
  }

  /**
   * Return a snapshot of all registered agent IDs.
   */
  get agentIds(): readonly string[] {
    return [...this._agentScopes.keys()];
  }

  /**
   * Return a snapshot of all registered crew IDs.
   */
  get crewIds(): readonly string[] {
    return [...this._crewScopes.keys()];
  }

  /**
   * Clear all cached scoped views. The backing provider is not cleared.
   */
  reset(): void {
    this._agentScopes.clear();
    this._crewScopes.clear();
    this._globalScope = undefined;
  }

  /**
   * Clear all entries in the backing provider and reset cached views.
   *
   * @returns Total number of entries removed from the backing provider
   */
  async clearAll(): Promise<number> {
    const count = await this._provider.clear();
    this.reset();
    return count;
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private _createScoped(
    namespace: MemoryNamespace,
    ownerId: string,
  ): ScopedMemory {
    const config: ScopedMemoryConfig = {
      provider: this._provider,
      namespace,
      ownerId,
      ...(this._readableNamespaces?.[namespace] !== undefined
        ? { readableNamespaces: this._readableNamespaces[namespace] }
        : {}),
    };
    return new ScopedMemory(config);
  }

  private _validateOwnerId(id: string, label: string): void {
    if (!id || typeof id !== 'string') {
      throw new MemoryConfigError(
        `${label} must be a non-empty string`,
      );
    }
  }
}
