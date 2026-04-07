/**
 * Tests for NamespacedMemoryManager — high-level namespace orchestrator.
 *
 * TASK-050: Implement memory namespaces (per-agent, per-crew, global)
 */

import { describe, expect, it, beforeEach } from 'vitest';

import {
  NamespacedMemoryManager,
  GLOBAL_OWNER_ID,
} from '../../../src/memory/namespaced-memory-manager.js';
import { ShortTermMemory } from '../../../src/memory/short-term-memory.js';
import { createMemoryEntry } from '../../../src/memory/memory-manager.js';
import { MemoryNamespace, MemoryRole } from '../../../src/types/memory.js';
import { MemoryConfigError, MemoryOperationError } from '../../../src/errors/memory-errors.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TASK-050: NamespacedMemoryManager', () => {
  let provider: ShortTermMemory;
  let nsm: NamespacedMemoryManager;

  beforeEach(() => {
    provider = new ShortTermMemory({ retention: { maxEntries: 10000 } });
    nsm = new NamespacedMemoryManager({ provider });
  });

  // -------------------------------------------------------------------------
  // Construction & Configuration
  // -------------------------------------------------------------------------

  describe('constructor', () => {
    it('should create with a valid provider', () => {
      expect(nsm.provider).toBe(provider);
    });

    it('should throw MemoryConfigError when provider is missing', () => {
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        () => new NamespacedMemoryManager({} as any),
      ).toThrow(MemoryConfigError);
    });
  });

  // -------------------------------------------------------------------------
  // forAgent — Agent-scoped memory
  // -------------------------------------------------------------------------

  describe('forAgent', () => {
    it('should return a ScopedMemory with AGENT namespace', () => {
      const mem = nsm.forAgent('agent-1');
      expect(mem.namespace).toBe(MemoryNamespace.AGENT);
      expect(mem.ownerId).toBe('agent-1');
      expect(mem.name).toBe('scoped:agent:agent-1');
    });

    it('should cache and return the same instance for the same agentId', () => {
      const mem1 = nsm.forAgent('agent-1');
      const mem2 = nsm.forAgent('agent-1');
      expect(mem1).toBe(mem2);
    });

    it('should return different instances for different agentIds', () => {
      const mem1 = nsm.forAgent('agent-1');
      const mem2 = nsm.forAgent('agent-2');
      expect(mem1).not.toBe(mem2);
    });

    it('should throw on empty agentId', () => {
      expect(() => nsm.forAgent('')).toThrow(MemoryConfigError);
    });

    it('should isolate writes between agents', async () => {
      const agent1 = nsm.forAgent('agent-1');
      const agent2 = nsm.forAgent('agent-2');

      const entry1 = createMemoryEntry('hello from agent-1', MemoryRole.USER);
      await agent1.add(entry1);

      await delay(5);

      const entry2 = createMemoryEntry('hello from agent-2', MemoryRole.USER);
      await agent2.add(entry2);

      // Each agent only sees its own AGENT entries
      const result1 = await agent1.query({ namespace: MemoryNamespace.AGENT });
      expect(result1.entries).toHaveLength(1);
      expect(result1.entries[0]!.content).toBe('hello from agent-1');

      const result2 = await agent2.query({ namespace: MemoryNamespace.AGENT });
      expect(result2.entries).toHaveLength(1);
      expect(result2.entries[0]!.content).toBe('hello from agent-2');
    });
  });

  // -------------------------------------------------------------------------
  // forCrew — Crew-scoped memory
  // -------------------------------------------------------------------------

  describe('forCrew', () => {
    it('should return a ScopedMemory with CREW namespace', () => {
      const mem = nsm.forCrew('crew-1');
      expect(mem.namespace).toBe(MemoryNamespace.CREW);
      expect(mem.ownerId).toBe('crew-1');
      expect(mem.name).toBe('scoped:crew:crew-1');
    });

    it('should cache and return the same instance for the same crewId', () => {
      const mem1 = nsm.forCrew('crew-1');
      const mem2 = nsm.forCrew('crew-1');
      expect(mem1).toBe(mem2);
    });

    it('should return different instances for different crewIds', () => {
      const mem1 = nsm.forCrew('crew-1');
      const mem2 = nsm.forCrew('crew-2');
      expect(mem1).not.toBe(mem2);
    });

    it('should throw on empty crewId', () => {
      expect(() => nsm.forCrew('')).toThrow(MemoryConfigError);
    });

    it('should isolate writes between crews', async () => {
      const crew1 = nsm.forCrew('crew-1');
      const crew2 = nsm.forCrew('crew-2');

      const entry1 = createMemoryEntry('crew-1 note', MemoryRole.ASSISTANT);
      await crew1.add(entry1);

      await delay(5);

      const entry2 = createMemoryEntry('crew-2 note', MemoryRole.ASSISTANT);
      await crew2.add(entry2);

      const result1 = await crew1.query({ namespace: MemoryNamespace.CREW });
      expect(result1.entries).toHaveLength(1);
      expect(result1.entries[0]!.content).toBe('crew-1 note');

      const result2 = await crew2.query({ namespace: MemoryNamespace.CREW });
      expect(result2.entries).toHaveLength(1);
      expect(result2.entries[0]!.content).toBe('crew-2 note');
    });
  });

  // -------------------------------------------------------------------------
  // global — Global-scoped memory
  // -------------------------------------------------------------------------

  describe('global', () => {
    it('should return a ScopedMemory with GLOBAL namespace', () => {
      const mem = nsm.global();
      expect(mem.namespace).toBe(MemoryNamespace.GLOBAL);
      expect(mem.ownerId).toBe(GLOBAL_OWNER_ID);
    });

    it('should cache and return the same instance on repeated calls', () => {
      const mem1 = nsm.global();
      const mem2 = nsm.global();
      expect(mem1).toBe(mem2);
    });
  });

  // -------------------------------------------------------------------------
  // Namespace visibility hierarchy
  // -------------------------------------------------------------------------

  describe('namespace hierarchy', () => {
    it('agent should see own entries + crew + global', async () => {
      const agent = nsm.forAgent('a1');
      const crew = nsm.forCrew('c1');
      const glob = nsm.global();

      // Add entries at each level
      const globalEntry = createMemoryEntry('global fact', MemoryRole.SYSTEM);
      await glob.add(globalEntry);
      await delay(5);

      const crewEntry = createMemoryEntry('crew shared', MemoryRole.ASSISTANT);
      await crew.add(crewEntry);
      await delay(5);

      const agentEntry = createMemoryEntry('agent private', MemoryRole.USER);
      await agent.add(agentEntry);

      // Agent should see all three (its own + crew + global)
      const result = await agent.query();
      expect(result.total).toBe(3);

      const contents = result.entries.map((e) => e.content);
      expect(contents).toContain('global fact');
      expect(contents).toContain('crew shared');
      expect(contents).toContain('agent private');
    });

    it('crew should see own entries + global but NOT agent entries', async () => {
      const agent = nsm.forAgent('a1');
      const crew = nsm.forCrew('c1');
      const glob = nsm.global();

      const globalEntry = createMemoryEntry('global fact', MemoryRole.SYSTEM);
      await glob.add(globalEntry);
      await delay(5);

      const crewEntry = createMemoryEntry('crew shared', MemoryRole.ASSISTANT);
      await crew.add(crewEntry);
      await delay(5);

      const agentEntry = createMemoryEntry('agent private', MemoryRole.USER);
      await agent.add(agentEntry);

      // Crew sees only crew + global
      const result = await crew.query();
      expect(result.total).toBe(2);

      const contents = result.entries.map((e) => e.content);
      expect(contents).toContain('global fact');
      expect(contents).toContain('crew shared');
      expect(contents).not.toContain('agent private');
    });

    it('global should see ONLY global entries', async () => {
      const agent = nsm.forAgent('a1');
      const crew = nsm.forCrew('c1');
      const glob = nsm.global();

      const globalEntry = createMemoryEntry('global fact', MemoryRole.SYSTEM);
      await glob.add(globalEntry);
      await delay(5);

      const crewEntry = createMemoryEntry('crew shared', MemoryRole.ASSISTANT);
      await crew.add(crewEntry);
      await delay(5);

      const agentEntry = createMemoryEntry('agent private', MemoryRole.USER);
      await agent.add(agentEntry);

      // Global sees only global
      const result = await glob.query();
      expect(result.total).toBe(1);
      expect(result.entries[0]!.content).toBe('global fact');
    });

    it('multiple agents on the same crew see shared crew entries', async () => {
      const agent1 = nsm.forAgent('a1');
      const agent2 = nsm.forAgent('a2');
      const crew = nsm.forCrew('team');

      const crewNote = createMemoryEntry('team strategy', MemoryRole.ASSISTANT);
      await crew.add(crewNote);

      // Both agents should see the crew entry
      const r1 = await agent1.query({ namespace: MemoryNamespace.CREW });
      const r2 = await agent2.query({ namespace: MemoryNamespace.CREW });

      expect(r1.entries).toHaveLength(1);
      expect(r1.entries[0]!.content).toBe('team strategy');
      expect(r2.entries).toHaveLength(1);
      expect(r2.entries[0]!.content).toBe('team strategy');
    });

    it('all scopes share the same backing provider', async () => {
      const agent = nsm.forAgent('a1');
      const crew = nsm.forCrew('c1');
      const glob = nsm.global();

      await agent.add(createMemoryEntry('a', MemoryRole.USER));
      await crew.add(createMemoryEntry('c', MemoryRole.USER));
      await glob.add(createMemoryEntry('g', MemoryRole.USER));

      // The backing provider has all 3 entries
      const total = await provider.count();
      expect(total).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // Search across namespaces
  // -------------------------------------------------------------------------

  describe('cross-namespace search', () => {
    it('agent search finds matching entries across visible namespaces', async () => {
      const agent = nsm.forAgent('a1');
      const crew = nsm.forCrew('c1');
      const glob = nsm.global();

      await glob.add(createMemoryEntry('AI research paper', MemoryRole.SYSTEM));
      await delay(5);
      await crew.add(createMemoryEntry('team research goals', MemoryRole.ASSISTANT));
      await delay(5);
      await agent.add(createMemoryEntry('my research notes', MemoryRole.USER));

      const result = await agent.search('research');
      expect(result.total).toBe(3);
    });

    it('crew search does NOT find agent entries', async () => {
      const agent = nsm.forAgent('a1');
      const crew = nsm.forCrew('c1');

      await crew.add(createMemoryEntry('crew research plan', MemoryRole.ASSISTANT));
      await delay(5);
      await agent.add(createMemoryEntry('agent research notes', MemoryRole.USER));

      const result = await crew.search('research');
      expect(result.total).toBe(1);
      expect(result.entries[0]!.content).toBe('crew research plan');
    });
  });

  // -------------------------------------------------------------------------
  // Delete scope isolation
  // -------------------------------------------------------------------------

  describe('delete isolation', () => {
    it('agent cannot delete crew entries', async () => {
      const agent = nsm.forAgent('a1');
      const crew = nsm.forCrew('c1');

      const crewEntry = createMemoryEntry('crew data', MemoryRole.ASSISTANT);
      const stored = await crew.add(crewEntry);

      await expect(agent.delete(stored.id)).rejects.toThrow(MemoryOperationError);
    });

    it('agent cannot delete global entries', async () => {
      const agent = nsm.forAgent('a1');
      const glob = nsm.global();

      const globalEntry = createMemoryEntry('global data', MemoryRole.SYSTEM);
      const stored = await glob.add(globalEntry);

      await expect(agent.delete(stored.id)).rejects.toThrow(MemoryOperationError);
    });

    it('agent can delete its own entries', async () => {
      const agent = nsm.forAgent('a1');
      const entry = createMemoryEntry('my note', MemoryRole.USER);
      const stored = await agent.add(entry);

      const deleted = await agent.delete(stored.id);
      expect(deleted).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // hasAgent / hasCrew / agentIds / crewIds
  // -------------------------------------------------------------------------

  describe('registry queries', () => {
    it('hasAgent returns false before first access', () => {
      expect(nsm.hasAgent('a1')).toBe(false);
    });

    it('hasAgent returns true after forAgent is called', () => {
      nsm.forAgent('a1');
      expect(nsm.hasAgent('a1')).toBe(true);
    });

    it('hasCrew returns false before first access', () => {
      expect(nsm.hasCrew('c1')).toBe(false);
    });

    it('hasCrew returns true after forCrew is called', () => {
      nsm.forCrew('c1');
      expect(nsm.hasCrew('c1')).toBe(true);
    });

    it('agentIds lists all registered agents', () => {
      nsm.forAgent('a1');
      nsm.forAgent('a2');
      nsm.forAgent('a3');
      expect(nsm.agentIds).toEqual(['a1', 'a2', 'a3']);
    });

    it('crewIds lists all registered crews', () => {
      nsm.forCrew('c1');
      nsm.forCrew('c2');
      expect(nsm.crewIds).toEqual(['c1', 'c2']);
    });
  });

  // -------------------------------------------------------------------------
  // removeAgent / removeCrew
  // -------------------------------------------------------------------------

  describe('removeAgent / removeCrew', () => {
    it('removeAgent returns true for existing agent', () => {
      nsm.forAgent('a1');
      expect(nsm.removeAgent('a1')).toBe(true);
      expect(nsm.hasAgent('a1')).toBe(false);
    });

    it('removeAgent returns false for non-existing agent', () => {
      expect(nsm.removeAgent('nonexistent')).toBe(false);
    });

    it('removeCrew returns true for existing crew', () => {
      nsm.forCrew('c1');
      expect(nsm.removeCrew('c1')).toBe(true);
      expect(nsm.hasCrew('c1')).toBe(false);
    });

    it('removeCrew returns false for non-existing crew', () => {
      expect(nsm.removeCrew('nonexistent')).toBe(false);
    });

    it('forAgent returns a new instance after removal', () => {
      const first = nsm.forAgent('a1');
      nsm.removeAgent('a1');
      const second = nsm.forAgent('a1');
      expect(first).not.toBe(second);
    });
  });

  // -------------------------------------------------------------------------
  // reset / clearAll
  // -------------------------------------------------------------------------

  describe('reset', () => {
    it('should clear all cached scoped views', () => {
      nsm.forAgent('a1');
      nsm.forAgent('a2');
      nsm.forCrew('c1');
      nsm.global();

      nsm.reset();

      expect(nsm.hasAgent('a1')).toBe(false);
      expect(nsm.hasAgent('a2')).toBe(false);
      expect(nsm.hasCrew('c1')).toBe(false);
      expect(nsm.agentIds).toEqual([]);
      expect(nsm.crewIds).toEqual([]);
    });

    it('reset should not clear the backing provider', async () => {
      const agent = nsm.forAgent('a1');
      await agent.add(createMemoryEntry('data', MemoryRole.USER));

      nsm.reset();

      expect(await provider.count()).toBe(1);
    });
  });

  describe('clearAll', () => {
    it('should clear the backing provider and reset views', async () => {
      const agent = nsm.forAgent('a1');
      const crew = nsm.forCrew('c1');
      const glob = nsm.global();

      await agent.add(createMemoryEntry('a', MemoryRole.USER));
      await crew.add(createMemoryEntry('c', MemoryRole.ASSISTANT));
      await glob.add(createMemoryEntry('g', MemoryRole.SYSTEM));

      const cleared = await nsm.clearAll();
      expect(cleared).toBe(3);
      expect(await provider.count()).toBe(0);
      expect(nsm.hasAgent('a1')).toBe(false);
      expect(nsm.hasCrew('c1')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Custom readable namespaces
  // -------------------------------------------------------------------------

  describe('custom readableNamespaces', () => {
    it('should propagate custom readable namespaces to scoped views', () => {
      const customNsm = new NamespacedMemoryManager({
        provider,
        readableNamespaces: {
          [MemoryNamespace.AGENT]: [MemoryNamespace.AGENT],
        },
      });

      const agent = customNsm.forAgent('a1');
      expect(agent.readableNamespaces).toEqual([MemoryNamespace.AGENT]);
    });

    it('agent with restricted visibility cannot see crew or global', async () => {
      const restrictedNsm = new NamespacedMemoryManager({
        provider,
        readableNamespaces: {
          [MemoryNamespace.AGENT]: [MemoryNamespace.AGENT],
        },
      });

      const glob = nsm.global();
      await glob.add(createMemoryEntry('global data', MemoryRole.SYSTEM));

      const agent = restrictedNsm.forAgent('a1');
      await agent.add(createMemoryEntry('agent data', MemoryRole.USER));

      const result = await agent.query();
      expect(result.total).toBe(1);
      expect(result.entries[0]!.content).toBe('agent data');
    });
  });

  // -------------------------------------------------------------------------
  // GLOBAL_OWNER_ID constant
  // -------------------------------------------------------------------------

  describe('GLOBAL_OWNER_ID', () => {
    it('should be a non-empty string constant', () => {
      expect(typeof GLOBAL_OWNER_ID).toBe('string');
      expect(GLOBAL_OWNER_ID.length).toBeGreaterThan(0);
    });

    it('should be used as the ownerId for global scope', () => {
      const glob = nsm.global();
      expect(glob.ownerId).toBe(GLOBAL_OWNER_ID);
    });
  });
});
