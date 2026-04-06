/**
 * Tests for ScopedMemory — namespace-aware memory wrapper.
 *
 * TASK-050: Implement memory namespaces (per-agent, per-crew, global)
 */

import { describe, expect, it, beforeEach } from 'vitest';

import { ScopedMemory, DEFAULT_READABLE_NAMESPACES } from '../../../src/memory/scoped-memory.js';
import { ShortTermMemory } from '../../../src/memory/short-term-memory.js';
import { createMemoryEntry } from '../../../src/memory/memory-manager.js';
import { MemoryNamespace, MemoryRole } from '../../../src/types/memory.js';
import type { MemoryEntry } from '../../../src/types/memory.js';
import { MemoryConfigError, MemoryOperationError } from '../../../src/errors/memory-errors.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Create an entry directly in the provider (bypassing scope). */
async function insertDirect(
  provider: ShortTermMemory,
  content: string,
  namespace: MemoryNamespace,
  ownerId: string,
): Promise<MemoryEntry> {
  const entry = createMemoryEntry(content, MemoryRole.USER, namespace, { ownerId });
  return provider.add(entry);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TASK-050: ScopedMemory — Memory Namespaces', () => {
  let provider: ShortTermMemory;

  beforeEach(() => {
    provider = new ShortTermMemory({ retention: { maxEntries: 10000 } });
  });

  // -------------------------------------------------------------------------
  // Construction & Configuration
  // -------------------------------------------------------------------------

  describe('constructor', () => {
    it('should create an agent-scoped memory', () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });
      expect(scoped.name).toBe('scoped:agent:agent-1');
      expect(scoped.namespace).toBe(MemoryNamespace.AGENT);
      expect(scoped.ownerId).toBe('agent-1');
    });

    it('should create a crew-scoped memory', () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.CREW,
        ownerId: 'crew-1',
      });
      expect(scoped.name).toBe('scoped:crew:crew-1');
      expect(scoped.namespace).toBe(MemoryNamespace.CREW);
    });

    it('should create a global-scoped memory', () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.GLOBAL,
        ownerId: 'system',
      });
      expect(scoped.name).toBe('scoped:global:system');
      expect(scoped.namespace).toBe(MemoryNamespace.GLOBAL);
    });

    it('should use default readable namespaces for AGENT scope', () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });
      expect(scoped.readableNamespaces).toEqual([
        MemoryNamespace.AGENT,
        MemoryNamespace.CREW,
        MemoryNamespace.GLOBAL,
      ]);
    });

    it('should use default readable namespaces for CREW scope', () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.CREW,
        ownerId: 'crew-1',
      });
      expect(scoped.readableNamespaces).toEqual([
        MemoryNamespace.CREW,
        MemoryNamespace.GLOBAL,
      ]);
    });

    it('should use default readable namespaces for GLOBAL scope', () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.GLOBAL,
        ownerId: 'system',
      });
      expect(scoped.readableNamespaces).toEqual([MemoryNamespace.GLOBAL]);
    });

    it('should accept custom readable namespaces', () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
        readableNamespaces: [MemoryNamespace.AGENT],
      });
      expect(scoped.readableNamespaces).toEqual([MemoryNamespace.AGENT]);
    });

    it('should expose the underlying provider', () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });
      expect(scoped.provider).toBe(provider);
    });

    it('should throw MemoryConfigError if ownerId is empty', () => {
      expect(
        () =>
          new ScopedMemory({
            provider,
            namespace: MemoryNamespace.AGENT,
            ownerId: '',
          }),
      ).toThrow(MemoryConfigError);
    });

    it('should throw MemoryConfigError if provider is missing', () => {
      expect(
        () =>
          new ScopedMemory({
            provider: undefined as never,
            namespace: MemoryNamespace.AGENT,
            ownerId: 'agent-1',
          }),
      ).toThrow(MemoryConfigError);
    });
  });

  // -------------------------------------------------------------------------
  // DEFAULT_READABLE_NAMESPACES
  // -------------------------------------------------------------------------

  describe('DEFAULT_READABLE_NAMESPACES', () => {
    it('should define AGENT hierarchy as AGENT → CREW → GLOBAL', () => {
      expect(DEFAULT_READABLE_NAMESPACES[MemoryNamespace.AGENT]).toEqual([
        MemoryNamespace.AGENT,
        MemoryNamespace.CREW,
        MemoryNamespace.GLOBAL,
      ]);
    });

    it('should define CREW hierarchy as CREW → GLOBAL', () => {
      expect(DEFAULT_READABLE_NAMESPACES[MemoryNamespace.CREW]).toEqual([
        MemoryNamespace.CREW,
        MemoryNamespace.GLOBAL,
      ]);
    });

    it('should define GLOBAL hierarchy as GLOBAL only', () => {
      expect(DEFAULT_READABLE_NAMESPACES[MemoryNamespace.GLOBAL]).toEqual([
        MemoryNamespace.GLOBAL,
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // add()
  // -------------------------------------------------------------------------

  describe('add()', () => {
    it('should tag entries with the scope namespace', async () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const entry = createMemoryEntry('hello', MemoryRole.USER, MemoryNamespace.GLOBAL);
      const stored = await scoped.add(entry);

      // Namespace should be overridden to AGENT
      expect(stored.namespace).toBe(MemoryNamespace.AGENT);
    });

    it('should tag entries with ownerId metadata', async () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const entry = createMemoryEntry('hello', MemoryRole.USER);
      const stored = await scoped.add(entry);

      expect(stored.metadata?.ownerId).toBe('agent-1');
    });

    it('should preserve existing metadata while adding ownerId', async () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.CREW,
        ownerId: 'crew-1',
      });

      const entry = createMemoryEntry('hello', MemoryRole.USER, MemoryNamespace.CREW, {
        taskId: 'task-42',
      });
      const stored = await scoped.add(entry);

      expect(stored.metadata?.taskId).toBe('task-42');
      expect(stored.metadata?.ownerId).toBe('crew-1');
    });

    it('should store entries in the underlying provider', async () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const entry = createMemoryEntry('test content', MemoryRole.USER);
      const stored = await scoped.add(entry);

      // Should be retrievable directly from the provider
      const direct = await provider.get(stored.id);
      expect(direct).toBeDefined();
      expect(direct!.content).toBe('test content');
      expect(direct!.namespace).toBe(MemoryNamespace.AGENT);
    });
  });

  // -------------------------------------------------------------------------
  // get()
  // -------------------------------------------------------------------------

  describe('get()', () => {
    it('should retrieve own entries', async () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const stored = await scoped.add(
        createMemoryEntry('my data', MemoryRole.USER),
      );
      const retrieved = await scoped.get(stored.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.content).toBe('my data');
    });

    it('should return undefined for non-existent entries', async () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const result = await scoped.get('non-existent');
      expect(result).toBeUndefined();
    });

    it('should return undefined for entries in non-readable namespaces', async () => {
      // Insert an AGENT entry directly
      const agentEntry = await insertDirect(provider, 'secret', MemoryNamespace.AGENT, 'agent-1');

      // GLOBAL scope cannot read AGENT namespace
      const globalScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.GLOBAL,
        ownerId: 'system',
      });

      const result = await globalScoped.get(agentEntry.id);
      expect(result).toBeUndefined();
    });

    it('should hide entries from other owners in the same namespace', async () => {
      // agent-1 writes to AGENT namespace
      const agent1 = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });
      const stored = await agent1.add(createMemoryEntry('agent-1 data', MemoryRole.USER));

      // agent-2 tries to read agent-1's entry
      const agent2 = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-2',
      });
      const result = await agent2.get(stored.id);

      expect(result).toBeUndefined();
    });

    it('should allow agent to see CREW entries', async () => {
      const crewEntry = await insertDirect(provider, 'crew data', MemoryNamespace.CREW, 'crew-1');

      const agentScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const result = await agentScoped.get(crewEntry.id);
      expect(result).toBeDefined();
      expect(result!.content).toBe('crew data');
    });

    it('should allow agent to see GLOBAL entries', async () => {
      const globalEntry = await insertDirect(
        provider,
        'global data',
        MemoryNamespace.GLOBAL,
        'system',
      );

      const agentScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const result = await agentScoped.get(globalEntry.id);
      expect(result).toBeDefined();
      expect(result!.content).toBe('global data');
    });

    it('should not allow crew to see AGENT entries', async () => {
      const agentEntry = await insertDirect(
        provider,
        'agent data',
        MemoryNamespace.AGENT,
        'agent-1',
      );

      const crewScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.CREW,
        ownerId: 'crew-1',
      });

      const result = await crewScoped.get(agentEntry.id);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // query()
  // -------------------------------------------------------------------------

  describe('query()', () => {
    it('should return entries across all readable namespaces', async () => {
      // Set up entries in all three namespaces
      await insertDirect(provider, 'agent data', MemoryNamespace.AGENT, 'agent-1');
      await delay(5);
      await insertDirect(provider, 'crew data', MemoryNamespace.CREW, 'crew-1');
      await delay(5);
      await insertDirect(provider, 'global data', MemoryNamespace.GLOBAL, 'system');

      const agentScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const result = await agentScoped.query();
      expect(result.total).toBe(3);
      expect(result.entries).toHaveLength(3);
    });

    it('should filter by namespace when specified', async () => {
      await insertDirect(provider, 'agent data', MemoryNamespace.AGENT, 'agent-1');
      await insertDirect(provider, 'crew data', MemoryNamespace.CREW, 'crew-1');
      await insertDirect(provider, 'global data', MemoryNamespace.GLOBAL, 'system');

      const agentScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const result = await agentScoped.query({ namespace: MemoryNamespace.CREW });
      expect(result.total).toBe(1);
      expect(result.entries[0]!.content).toBe('crew data');
    });

    it('should return empty for non-readable namespace filter', async () => {
      await insertDirect(provider, 'agent data', MemoryNamespace.AGENT, 'agent-1');

      const globalScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.GLOBAL,
        ownerId: 'system',
      });

      const result = await globalScoped.query({ namespace: MemoryNamespace.AGENT });
      expect(result.entries).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should only show own entries in the owned namespace', async () => {
      await insertDirect(provider, 'agent-1 data', MemoryNamespace.AGENT, 'agent-1');
      await insertDirect(provider, 'agent-2 data', MemoryNamespace.AGENT, 'agent-2');

      const agent1Scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const result = await agent1Scoped.query({ namespace: MemoryNamespace.AGENT });
      expect(result.total).toBe(1);
      expect(result.entries[0]!.content).toBe('agent-1 data');
    });

    it('should support pagination with offset and limit', async () => {
      // Create 5 entries with different timestamps
      for (let i = 0; i < 5; i++) {
        await insertDirect(provider, `entry-${i}`, MemoryNamespace.AGENT, 'agent-1');
        await delay(5);
      }

      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const page1 = await scoped.query({ limit: 2, offset: 0, sortOrder: 'asc' });
      expect(page1.entries).toHaveLength(2);
      expect(page1.total).toBe(5);
      expect(page1.entries[0]!.content).toBe('entry-0');

      const page2 = await scoped.query({ limit: 2, offset: 2, sortOrder: 'asc' });
      expect(page2.entries).toHaveLength(2);
      expect(page2.entries[0]!.content).toBe('entry-2');
    });

    it('should sort by createdAt descending by default', async () => {
      await insertDirect(provider, 'first', MemoryNamespace.AGENT, 'agent-1');
      await delay(10);
      await insertDirect(provider, 'second', MemoryNamespace.AGENT, 'agent-1');

      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const result = await scoped.query();
      expect(result.entries[0]!.content).toBe('second');
      expect(result.entries[1]!.content).toBe('first');
    });

    it('should support ascending sort order', async () => {
      await insertDirect(provider, 'first', MemoryNamespace.AGENT, 'agent-1');
      await delay(10);
      await insertDirect(provider, 'second', MemoryNamespace.AGENT, 'agent-1');

      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const result = await scoped.query({ sortOrder: 'asc' });
      expect(result.entries[0]!.content).toBe('first');
      expect(result.entries[1]!.content).toBe('second');
    });
  });

  // -------------------------------------------------------------------------
  // search()
  // -------------------------------------------------------------------------

  describe('search()', () => {
    it('should search across readable namespaces', async () => {
      await insertDirect(provider, 'agent hello world', MemoryNamespace.AGENT, 'agent-1');
      await insertDirect(provider, 'crew hello world', MemoryNamespace.CREW, 'crew-1');
      await insertDirect(provider, 'global hello world', MemoryNamespace.GLOBAL, 'system');

      const agentScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const result = await agentScoped.search('hello');
      expect(result.total).toBe(3);
    });

    it('should not return results from non-readable namespaces', async () => {
      await insertDirect(provider, 'agent secret', MemoryNamespace.AGENT, 'agent-1');
      await insertDirect(provider, 'global data', MemoryNamespace.GLOBAL, 'system');

      const globalScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.GLOBAL,
        ownerId: 'system',
      });

      const result = await globalScoped.search('secret');
      expect(result.total).toBe(0);
    });

    it('should filter by namespace when specified', async () => {
      await insertDirect(provider, 'crew hello', MemoryNamespace.CREW, 'crew-1');
      await insertDirect(provider, 'global hello', MemoryNamespace.GLOBAL, 'system');

      const crewScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.CREW,
        ownerId: 'crew-1',
      });

      const result = await crewScoped.search('hello', {
        namespace: MemoryNamespace.GLOBAL,
      });
      expect(result.total).toBe(1);
      expect(result.entries[0]!.content).toBe('global hello');
    });

    it('should return empty for searches in non-readable namespace', async () => {
      await insertDirect(provider, 'agent hello', MemoryNamespace.AGENT, 'agent-1');

      const crewScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.CREW,
        ownerId: 'crew-1',
      });

      const result = await crewScoped.search('hello', {
        namespace: MemoryNamespace.AGENT,
      });
      expect(result.total).toBe(0);
    });

    it('should enforce owner filtering in owned namespace during search', async () => {
      await insertDirect(provider, 'agent-1 hello', MemoryNamespace.AGENT, 'agent-1');
      await insertDirect(provider, 'agent-2 hello', MemoryNamespace.AGENT, 'agent-2');

      const agent1 = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const result = await agent1.search('hello');
      // Should only find agent-1's entry from AGENT namespace
      const agentEntries = result.entries.filter(
        (e) => e.namespace === MemoryNamespace.AGENT,
      );
      expect(agentEntries).toHaveLength(1);
      expect(agentEntries[0]!.metadata?.ownerId).toBe('agent-1');
    });
  });

  // -------------------------------------------------------------------------
  // delete()
  // -------------------------------------------------------------------------

  describe('delete()', () => {
    it('should delete own entries', async () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const stored = await scoped.add(createMemoryEntry('to delete', MemoryRole.USER));
      const result = await scoped.delete(stored.id);

      expect(result).toBe(true);
      expect(await provider.get(stored.id)).toBeUndefined();
    });

    it('should return false for non-existent entries', async () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const result = await scoped.delete('non-existent');
      expect(result).toBe(false);
    });

    it('should throw when trying to delete entries from another owner', async () => {
      const agent1 = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });
      const stored = await agent1.add(createMemoryEntry('agent-1 data', MemoryRole.USER));

      const agent2 = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-2',
      });

      await expect(agent2.delete(stored.id)).rejects.toThrow(MemoryOperationError);
    });

    it('should throw when trying to delete entries from parent namespace', async () => {
      const crewEntry = await insertDirect(provider, 'crew data', MemoryNamespace.CREW, 'crew-1');

      const agentScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      await expect(agentScoped.delete(crewEntry.id)).rejects.toThrow(MemoryOperationError);
    });
  });

  // -------------------------------------------------------------------------
  // clear()
  // -------------------------------------------------------------------------

  describe('clear()', () => {
    it('should clear entries in the owned namespace', async () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      await scoped.add(createMemoryEntry('entry 1', MemoryRole.USER));
      await scoped.add(createMemoryEntry('entry 2', MemoryRole.USER));

      const cleared = await scoped.clear();
      expect(cleared).toBeGreaterThanOrEqual(2);
    });

    it('should not clear entries in parent namespaces when called without args', async () => {
      await insertDirect(provider, 'crew data', MemoryNamespace.CREW, 'crew-1');
      await insertDirect(provider, 'global data', MemoryNamespace.GLOBAL, 'system');

      const agentScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });
      await agentScoped.add(createMemoryEntry('agent data', MemoryRole.USER));

      await agentScoped.clear();

      // Parent namespace entries should still exist
      const crewCount = await provider.count(MemoryNamespace.CREW);
      const globalCount = await provider.count(MemoryNamespace.GLOBAL);
      expect(crewCount).toBe(1);
      expect(globalCount).toBe(1);
    });

    it('should throw when trying to clear a different namespace', async () => {
      const agentScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      await expect(agentScoped.clear(MemoryNamespace.CREW)).rejects.toThrow(
        MemoryOperationError,
      );
    });

    it('should accept explicit owned namespace argument', async () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.CREW,
        ownerId: 'crew-1',
      });

      await scoped.add(createMemoryEntry('crew data', MemoryRole.USER));
      const cleared = await scoped.clear(MemoryNamespace.CREW);
      expect(cleared).toBeGreaterThanOrEqual(1);
    });
  });

  // -------------------------------------------------------------------------
  // count()
  // -------------------------------------------------------------------------

  describe('count()', () => {
    it('should count entries across all readable namespaces', async () => {
      await insertDirect(provider, 'agent data', MemoryNamespace.AGENT, 'agent-1');
      await insertDirect(provider, 'crew data', MemoryNamespace.CREW, 'crew-1');
      await insertDirect(provider, 'global data', MemoryNamespace.GLOBAL, 'system');

      const agentScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const total = await agentScoped.count();
      expect(total).toBe(3);
    });

    it('should count entries in a specific readable namespace', async () => {
      await insertDirect(provider, 'crew data 1', MemoryNamespace.CREW, 'crew-1');
      await insertDirect(provider, 'crew data 2', MemoryNamespace.CREW, 'crew-1');
      await insertDirect(provider, 'global data', MemoryNamespace.GLOBAL, 'system');

      const crewScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.CREW,
        ownerId: 'crew-1',
      });

      const crewCount = await crewScoped.count(MemoryNamespace.CREW);
      expect(crewCount).toBe(2);
    });

    it('should return 0 for non-readable namespace', async () => {
      await insertDirect(provider, 'agent data', MemoryNamespace.AGENT, 'agent-1');

      const globalScoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.GLOBAL,
        ownerId: 'system',
      });

      const count = await globalScoped.count(MemoryNamespace.AGENT);
      expect(count).toBe(0);
    });

    it('should count zero when no entries exist', async () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const count = await scoped.count();
      expect(count).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Multi-agent isolation
  // -------------------------------------------------------------------------

  describe('multi-agent isolation', () => {
    it('should isolate agent memories while sharing crew/global', async () => {
      // Shared provider
      const sharedProvider = new ShortTermMemory({
        retention: { maxEntries: 10000 },
      });

      // Two agents in the same crew
      const agent1 = new ScopedMemory({
        provider: sharedProvider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });
      const agent2 = new ScopedMemory({
        provider: sharedProvider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-2',
      });

      // Crew-level scope for shared data
      const crew = new ScopedMemory({
        provider: sharedProvider,
        namespace: MemoryNamespace.CREW,
        ownerId: 'crew-research',
      });

      // Each agent stores private data
      await agent1.add(createMemoryEntry('agent-1 private', MemoryRole.ASSISTANT));
      await agent2.add(createMemoryEntry('agent-2 private', MemoryRole.ASSISTANT));

      // Crew stores shared data
      await crew.add(createMemoryEntry('crew shared data', MemoryRole.SYSTEM));

      // Agent-1 can see its own + crew data
      const agent1Results = await agent1.query();
      const agent1Contents = agent1Results.entries.map((e) => e.content);
      expect(agent1Contents).toContain('agent-1 private');
      expect(agent1Contents).toContain('crew shared data');
      expect(agent1Contents).not.toContain('agent-2 private');

      // Agent-2 can see its own + crew data
      const agent2Results = await agent2.query();
      const agent2Contents = agent2Results.entries.map((e) => e.content);
      expect(agent2Contents).toContain('agent-2 private');
      expect(agent2Contents).toContain('crew shared data');
      expect(agent2Contents).not.toContain('agent-1 private');

      // Crew scope cannot see agent data
      const crewResults = await crew.query();
      const crewContents = crewResults.entries.map((e) => e.content);
      expect(crewContents).toContain('crew shared data');
      expect(crewContents).not.toContain('agent-1 private');
      expect(crewContents).not.toContain('agent-2 private');
    });

    it('should support a full three-level hierarchy', async () => {
      const sharedProvider = new ShortTermMemory({
        retention: { maxEntries: 10000 },
      });

      const agent = new ScopedMemory({
        provider: sharedProvider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });
      const crew = new ScopedMemory({
        provider: sharedProvider,
        namespace: MemoryNamespace.CREW,
        ownerId: 'crew-1',
      });
      const global = new ScopedMemory({
        provider: sharedProvider,
        namespace: MemoryNamespace.GLOBAL,
        ownerId: 'system',
      });

      await agent.add(createMemoryEntry('agent private', MemoryRole.USER));
      await crew.add(createMemoryEntry('crew shared', MemoryRole.SYSTEM));
      await global.add(createMemoryEntry('global config', MemoryRole.SYSTEM));

      // Agent sees all 3
      expect((await agent.query()).total).toBe(3);

      // Crew sees crew + global (2)
      expect((await crew.query()).total).toBe(2);

      // Global sees global only (1)
      expect((await global.query()).total).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // MemoryProvider interface compliance
  // -------------------------------------------------------------------------

  describe('MemoryProvider interface compliance', () => {
    it('should implement all required MemoryProvider methods', () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      expect(typeof scoped.add).toBe('function');
      expect(typeof scoped.get).toBe('function');
      expect(typeof scoped.query).toBe('function');
      expect(typeof scoped.search).toBe('function');
      expect(typeof scoped.delete).toBe('function');
      expect(typeof scoped.clear).toBe('function');
      expect(typeof scoped.count).toBe('function');
      expect(typeof scoped.name).toBe('string');
    });

    it('should be usable as a MemoryProvider', async () => {
      const scoped = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      const entry = createMemoryEntry('test', MemoryRole.USER);
      const stored = await scoped.add(entry);

      expect(stored.id).toBe(entry.id);
      expect(stored.content).toBe('test');

      const retrieved = await scoped.get(stored.id);
      expect(retrieved).toBeDefined();

      const queryResult = await scoped.query();
      expect(queryResult.total).toBeGreaterThanOrEqual(1);

      const searchResult = await scoped.search('test');
      expect(searchResult.total).toBeGreaterThanOrEqual(1);

      const count = await scoped.count();
      expect(count).toBeGreaterThanOrEqual(1);

      const deleted = await scoped.delete(stored.id);
      expect(deleted).toBe(true);
    });
  });
});
