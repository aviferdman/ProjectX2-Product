/**
 * Tests for RetentionPolicyManager.
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';

import { RetentionPolicyManager } from '../../../src/memory/retention-policy-manager.js';
import { ShortTermMemory } from '../../../src/memory/short-term-memory.js';
import { MemoryNamespace, MemoryRole } from '../../../src/types/memory.js';
import type { MemoryEntry } from '../../../src/types/memory.js';
import { MemoryConfigError } from '../../../src/errors/memory-errors.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _idCounter = 0;

function makeEntry(overrides: Partial<MemoryEntry> = {}): MemoryEntry {
  _idCounter++;
  return {
    id: overrides.id ?? `test-${_idCounter}`,
    content: overrides.content ?? 'Hello world',
    role: overrides.role ?? MemoryRole.USER,
    namespace: overrides.namespace ?? MemoryNamespace.AGENT,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    ...(overrides.metadata !== undefined && { metadata: overrides.metadata }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RetentionPolicyManager', () => {
  let memory: ShortTermMemory;

  beforeEach(() => {
    _idCounter = 0;
    // Use unlimited retention on the memory itself — we want the manager to control eviction
    memory = new ShortTermMemory({ retention: { maxEntries: 0 } });
  });

  // -----------------------------------------------------------------------
  // Construction
  // -----------------------------------------------------------------------

  describe('constructor', () => {
    it('creates with no config', () => {
      const manager = new RetentionPolicyManager();
      expect(manager.defaultPolicy).toEqual({});
    });

    it('creates with default policy', () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxEntries: 100, maxAge: 60_000 },
      });
      expect(manager.defaultPolicy).toEqual({ maxEntries: 100, maxAge: 60_000 });
    });

    it('creates with namespace policies', () => {
      const manager = new RetentionPolicyManager({
        namespacePolicies: [
          { namespace: MemoryNamespace.AGENT, policy: { maxEntries: 50 } },
          { namespace: MemoryNamespace.CREW, policy: { maxAge: 30_000 } },
        ],
      });
      expect(manager.namespacePolicies.size).toBe(2);
      expect(manager.namespacePolicies.get(MemoryNamespace.AGENT)).toEqual({ maxEntries: 50 });
      expect(manager.namespacePolicies.get(MemoryNamespace.CREW)).toEqual({ maxAge: 30_000 });
    });

    it('throws on invalid default maxEntries', () => {
      expect(() => new RetentionPolicyManager({ defaultPolicy: { maxEntries: -1 } })).toThrow(
        MemoryConfigError,
      );
    });

    it('throws on non-integer default maxEntries', () => {
      expect(() => new RetentionPolicyManager({ defaultPolicy: { maxEntries: 1.5 } })).toThrow(
        MemoryConfigError,
      );
    });

    it('throws on invalid default maxAge', () => {
      expect(() => new RetentionPolicyManager({ defaultPolicy: { maxAge: -100 } })).toThrow(
        MemoryConfigError,
      );
    });

    it('throws on invalid namespace policy maxEntries', () => {
      expect(
        () =>
          new RetentionPolicyManager({
            namespacePolicies: [{ namespace: MemoryNamespace.AGENT, policy: { maxEntries: -5 } }],
          }),
      ).toThrow(MemoryConfigError);
    });

    it('throws on duplicate namespace policies', () => {
      expect(
        () =>
          new RetentionPolicyManager({
            namespacePolicies: [
              { namespace: MemoryNamespace.AGENT, policy: { maxEntries: 10 } },
              { namespace: MemoryNamespace.AGENT, policy: { maxEntries: 20 } },
            ],
          }),
      ).toThrow(MemoryConfigError);
      expect(
        () =>
          new RetentionPolicyManager({
            namespacePolicies: [
              { namespace: MemoryNamespace.AGENT, policy: { maxEntries: 10 } },
              { namespace: MemoryNamespace.AGENT, policy: { maxEntries: 20 } },
            ],
          }),
      ).toThrow('Duplicate namespace policy');
    });
  });

  // -----------------------------------------------------------------------
  // getPolicyForNamespace()
  // -----------------------------------------------------------------------

  describe('getPolicyForNamespace()', () => {
    it('returns namespace-specific policy when available', () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxEntries: 100 },
        namespacePolicies: [{ namespace: MemoryNamespace.AGENT, policy: { maxEntries: 50 } }],
      });
      expect(manager.getPolicyForNamespace(MemoryNamespace.AGENT)).toEqual({ maxEntries: 50 });
    });

    it('falls back to default when no namespace policy exists', () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxEntries: 100 },
        namespacePolicies: [{ namespace: MemoryNamespace.AGENT, policy: { maxEntries: 50 } }],
      });
      expect(manager.getPolicyForNamespace(MemoryNamespace.CREW)).toEqual({ maxEntries: 100 });
    });

    it('returns empty policy when no default and no namespace policy', () => {
      const manager = new RetentionPolicyManager();
      expect(manager.getPolicyForNamespace(MemoryNamespace.AGENT)).toEqual({});
    });
  });

  // -----------------------------------------------------------------------
  // evaluate() — dry-run
  // -----------------------------------------------------------------------

  describe('evaluate()', () => {
    it('returns zero evictable for empty provider', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxEntries: 10 },
      });

      const result = await manager.evaluate(memory);
      expect(result.totalEvictable).toBe(0);
      expect(result.countEvictable).toBe(0);
      expect(result.timeEvictable).toBe(0);
    });

    it('reports count-based evictable entries', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxEntries: 3 },
      });

      for (let i = 0; i < 5; i++) {
        await memory.add(makeEntry({ createdAt: `2024-01-0${i + 1}T00:00:00Z` }));
      }

      const result = await manager.evaluate(memory);
      expect(result.countEvictable).toBe(2);
      expect(result.totalEvictable).toBe(2);
    });

    it('reports time-based evictable entries', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxAge: 60_000 },
      });

      const now = Date.now();
      // 2 expired entries
      await memory.add(makeEntry({ createdAt: new Date(now - 120_000).toISOString() }));
      await memory.add(makeEntry({ createdAt: new Date(now - 90_000).toISOString() }));
      // 1 fresh entry
      await memory.add(makeEntry({ createdAt: new Date(now - 10_000).toISOString() }));

      const result = await manager.evaluate(memory, now);
      expect(result.timeEvictable).toBe(2);
    });

    it('reports per-namespace breakdown', async () => {
      const manager = new RetentionPolicyManager({
        namespacePolicies: [
          { namespace: MemoryNamespace.AGENT, policy: { maxEntries: 2 } },
          { namespace: MemoryNamespace.CREW, policy: { maxEntries: 1 } },
        ],
      });

      // 3 agent entries (1 over limit)
      for (let i = 0; i < 3; i++) {
        await memory.add(
          makeEntry({ namespace: MemoryNamespace.AGENT, createdAt: `2024-01-0${i + 1}T00:00:00Z` }),
        );
      }
      // 3 crew entries (2 over limit)
      for (let i = 0; i < 3; i++) {
        await memory.add(
          makeEntry({ namespace: MemoryNamespace.CREW, createdAt: `2024-01-0${i + 1}T00:00:00Z` }),
        );
      }

      const result = await manager.evaluate(memory);
      const agentBD = result.namespaceBreakdown.find((b) => b.namespace === MemoryNamespace.AGENT);
      const crewBD = result.namespaceBreakdown.find((b) => b.namespace === MemoryNamespace.CREW);

      expect(agentBD?.countEvictable).toBe(1);
      expect(crewBD?.countEvictable).toBe(2);
    });

    it('does not modify the provider', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxEntries: 2 },
      });

      for (let i = 0; i < 5; i++) {
        await memory.add(makeEntry());
      }

      await manager.evaluate(memory);
      expect(await memory.count()).toBe(5);
    });
  });

  // -----------------------------------------------------------------------
  // enforce() — count-based
  // -----------------------------------------------------------------------

  describe('enforce() — count-based', () => {
    it('evicts oldest entries when maxEntries is exceeded (global)', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxEntries: 3 },
      });

      for (let i = 1; i <= 5; i++) {
        await memory.add(makeEntry({ id: `e${i}`, createdAt: `2024-01-0${i}T00:00:00Z` }));
      }

      const result = await manager.enforce(memory);
      expect(result.totalEvicted).toBe(2);
      expect(await memory.count()).toBe(3);

      // Oldest entries should be evicted
      expect(await memory.get('e1')).toBeUndefined();
      expect(await memory.get('e2')).toBeUndefined();
      expect(await memory.get('e3')).toBeDefined();
      expect(await memory.get('e4')).toBeDefined();
      expect(await memory.get('e5')).toBeDefined();
    });

    it('evicts per-namespace when namespace policies are set', async () => {
      const manager = new RetentionPolicyManager({
        namespacePolicies: [{ namespace: MemoryNamespace.AGENT, policy: { maxEntries: 2 } }],
      });

      // Add 4 agent entries
      for (let i = 1; i <= 4; i++) {
        await memory.add(
          makeEntry({
            id: `a${i}`,
            namespace: MemoryNamespace.AGENT,
            createdAt: `2024-01-0${i}T00:00:00Z`,
          }),
        );
      }

      // Add 2 crew entries (should NOT be affected)
      for (let i = 1; i <= 2; i++) {
        await memory.add(
          makeEntry({
            id: `c${i}`,
            namespace: MemoryNamespace.CREW,
            createdAt: `2024-01-0${i}T00:00:00Z`,
          }),
        );
      }

      const result = await manager.enforce(memory);
      expect(result.totalEvicted).toBe(2);

      // Agent oldest evicted
      expect(await memory.get('a1')).toBeUndefined();
      expect(await memory.get('a2')).toBeUndefined();
      expect(await memory.get('a3')).toBeDefined();
      expect(await memory.get('a4')).toBeDefined();

      // Crew entries untouched
      expect(await memory.get('c1')).toBeDefined();
      expect(await memory.get('c2')).toBeDefined();
    });

    it('does nothing when entries are within limit', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxEntries: 10 },
      });

      for (let i = 0; i < 3; i++) {
        await memory.add(makeEntry());
      }

      const result = await manager.enforce(memory);
      expect(result.totalEvicted).toBe(0);
      expect(await memory.count()).toBe(3);
    });

    it('reports correct namespace breakdown', async () => {
      const manager = new RetentionPolicyManager({
        namespacePolicies: [
          { namespace: MemoryNamespace.AGENT, policy: { maxEntries: 1 } },
          { namespace: MemoryNamespace.CREW, policy: { maxEntries: 1 } },
        ],
      });

      for (let i = 0; i < 3; i++) {
        await memory.add(makeEntry({ namespace: MemoryNamespace.AGENT }));
      }
      for (let i = 0; i < 2; i++) {
        await memory.add(makeEntry({ namespace: MemoryNamespace.CREW }));
      }

      const result = await manager.enforce(memory);
      const agentBD = result.namespaceBreakdown.find((b) => b.namespace === MemoryNamespace.AGENT);
      const crewBD = result.namespaceBreakdown.find((b) => b.namespace === MemoryNamespace.CREW);

      expect(agentBD?.evicted).toBe(2);
      expect(crewBD?.evicted).toBe(1);
      expect(result.totalEvicted).toBe(3);
    });
  });

  // -----------------------------------------------------------------------
  // enforce() — time-based
  // -----------------------------------------------------------------------

  describe('enforce() — time-based', () => {
    it('evicts entries older than maxAge (global)', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxAge: 60_000 },
      });

      const now = Date.now();
      await memory.add(makeEntry({ id: 'old1', createdAt: new Date(now - 120_000).toISOString() }));
      await memory.add(makeEntry({ id: 'old2', createdAt: new Date(now - 90_000).toISOString() }));
      await memory.add(
        makeEntry({ id: 'fresh1', createdAt: new Date(now - 10_000).toISOString() }),
      );

      const result = await manager.enforce(memory, now);
      expect(result.totalEvicted).toBe(2);
      expect(await memory.get('old1')).toBeUndefined();
      expect(await memory.get('old2')).toBeUndefined();
      expect(await memory.get('fresh1')).toBeDefined();
    });

    it('evicts expired entries per-namespace', async () => {
      const manager = new RetentionPolicyManager({
        namespacePolicies: [{ namespace: MemoryNamespace.AGENT, policy: { maxAge: 60_000 } }],
      });

      const now = Date.now();
      // Old agent entry — should be evicted
      await memory.add(
        makeEntry({
          id: 'old-agent',
          namespace: MemoryNamespace.AGENT,
          createdAt: new Date(now - 120_000).toISOString(),
        }),
      );
      // Old crew entry — should NOT be evicted (no crew policy)
      await memory.add(
        makeEntry({
          id: 'old-crew',
          namespace: MemoryNamespace.CREW,
          createdAt: new Date(now - 120_000).toISOString(),
        }),
      );

      const result = await manager.enforce(memory, now);
      expect(result.totalEvicted).toBe(1);
      expect(await memory.get('old-agent')).toBeUndefined();
      expect(await memory.get('old-crew')).toBeDefined();
    });

    it('does nothing when all entries are within maxAge', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxAge: 60_000 },
      });

      const now = Date.now();
      await memory.add(makeEntry({ createdAt: new Date(now - 10_000).toISOString() }));
      await memory.add(makeEntry({ createdAt: new Date(now - 5_000).toISOString() }));

      const result = await manager.enforce(memory, now);
      expect(result.totalEvicted).toBe(0);
      expect(await memory.count()).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // enforce() — combined policies
  // -----------------------------------------------------------------------

  describe('enforce() — combined time + count', () => {
    it('applies both time and count eviction', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxEntries: 3, maxAge: 60_000 },
      });

      const now = Date.now();
      // 2 expired entries
      await memory.add(makeEntry({ id: 'exp1', createdAt: new Date(now - 120_000).toISOString() }));
      await memory.add(makeEntry({ id: 'exp2', createdAt: new Date(now - 90_000).toISOString() }));
      // 4 fresh entries (after time eviction, 4 remain, but maxEntries=3 so 1 more goes)
      await memory.add(makeEntry({ id: 'f1', createdAt: new Date(now - 40_000).toISOString() }));
      await memory.add(makeEntry({ id: 'f2', createdAt: new Date(now - 30_000).toISOString() }));
      await memory.add(makeEntry({ id: 'f3', createdAt: new Date(now - 20_000).toISOString() }));
      await memory.add(makeEntry({ id: 'f4', createdAt: new Date(now - 10_000).toISOString() }));

      const result = await manager.enforce(memory, now);
      // 2 expired + 1 excess = 3 evicted
      expect(result.totalEvicted).toBe(3);
      expect(await memory.count()).toBe(3);

      // Expired ones gone
      expect(await memory.get('exp1')).toBeUndefined();
      expect(await memory.get('exp2')).toBeUndefined();
      // Oldest fresh one gone
      expect(await memory.get('f1')).toBeUndefined();
      // Newest 3 remain
      expect(await memory.get('f2')).toBeDefined();
      expect(await memory.get('f3')).toBeDefined();
      expect(await memory.get('f4')).toBeDefined();
    });

    it('combines namespace and global policies', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxEntries: 10 },
        namespacePolicies: [{ namespace: MemoryNamespace.AGENT, policy: { maxEntries: 2 } }],
      });

      // 5 agent entries, limit 2 → evict 3
      for (let i = 1; i <= 5; i++) {
        await memory.add(
          makeEntry({
            id: `a${i}`,
            namespace: MemoryNamespace.AGENT,
            createdAt: `2024-01-0${i}T00:00:00Z`,
          }),
        );
      }

      const result = await manager.enforce(memory);
      // 3 evicted from agent namespace, 0 from global (2 remaining < 10)
      expect(result.totalEvicted).toBe(3);
      expect(await memory.count()).toBe(2);
      expect(await memory.get('a4')).toBeDefined();
      expect(await memory.get('a5')).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // Events
  // -----------------------------------------------------------------------

  describe('events', () => {
    it('emits memory:evict when entries are evicted', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxEntries: 1 },
      });

      const evicted: MemoryEntry[][] = [];
      manager.on('memory:evict', (entries) => evicted.push([...entries]));

      await memory.add(makeEntry({ id: 'ev1', createdAt: '2024-01-01T00:00:00Z' }));
      await memory.add(makeEntry({ id: 'ev2', createdAt: '2024-01-02T00:00:00Z' }));
      await memory.add(makeEntry({ id: 'ev3', createdAt: '2024-01-03T00:00:00Z' }));

      await manager.enforce(memory);

      expect(evicted.length).toBeGreaterThan(0);
      const allEvicted = evicted.flat();
      expect(allEvicted.some((e) => e.id === 'ev1')).toBe(true);
      expect(allEvicted.some((e) => e.id === 'ev2')).toBe(true);
    });

    it('supports off() to remove listeners', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxEntries: 1 },
      });

      const evicted: MemoryEntry[][] = [];
      const listener = (entries: readonly MemoryEntry[]) => evicted.push([...entries]);

      manager.on('memory:evict', listener);

      await memory.add(makeEntry({ id: 'off1', createdAt: '2024-01-01T00:00:00Z' }));
      await memory.add(makeEntry({ id: 'off2', createdAt: '2024-01-02T00:00:00Z' }));

      await manager.enforce(memory);
      const countAfterFirst = evicted.length;

      manager.off('memory:evict', listener);

      // Re-add and enforce again
      await memory.add(makeEntry({ id: 'off3', createdAt: '2024-01-01T00:00:00Z' }));
      await manager.enforce(memory);

      // Listener should not have been called again
      expect(evicted.length).toBe(countAfterFirst);
    });

    it('does not emit when nothing is evicted', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxEntries: 10 },
      });

      const evicted: MemoryEntry[][] = [];
      manager.on('memory:evict', (entries) => evicted.push([...entries]));

      await memory.add(makeEntry());
      await manager.enforce(memory);

      expect(evicted).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles empty provider gracefully', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxEntries: 5, maxAge: 60_000 },
      });

      const result = await manager.enforce(memory);
      expect(result.totalEvicted).toBe(0);
    });

    it('handles maxEntries = 0 as unlimited', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxEntries: 0 },
      });

      for (let i = 0; i < 10; i++) {
        await memory.add(makeEntry());
      }

      const result = await manager.enforce(memory);
      expect(result.totalEvicted).toBe(0);
      expect(await memory.count()).toBe(10);
    });

    it('handles maxAge = 0 as unlimited', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxAge: 0 },
      });

      const now = Date.now();
      await memory.add(makeEntry({ createdAt: new Date(now - 999_999_999).toISOString() }));

      const result = await manager.enforce(memory, now);
      expect(result.totalEvicted).toBe(0);
      expect(await memory.count()).toBe(1);
    });

    it('handles no policies configured (no-op)', async () => {
      const manager = new RetentionPolicyManager();

      for (let i = 0; i < 5; i++) {
        await memory.add(makeEntry());
      }

      const result = await manager.enforce(memory);
      expect(result.totalEvicted).toBe(0);
      expect(await memory.count()).toBe(5);
    });

    it('enforce is idempotent on second call', async () => {
      const manager = new RetentionPolicyManager({
        defaultPolicy: { maxEntries: 2 },
      });

      for (let i = 1; i <= 5; i++) {
        await memory.add(makeEntry({ id: `idem${i}`, createdAt: `2024-01-0${i}T00:00:00Z` }));
      }

      const first = await manager.enforce(memory);
      expect(first.totalEvicted).toBe(3);
      expect(await memory.count()).toBe(2);

      const second = await manager.enforce(memory);
      expect(second.totalEvicted).toBe(0);
      expect(await memory.count()).toBe(2);
    });

    it('works with multiple namespace policies and no default', async () => {
      const manager = new RetentionPolicyManager({
        namespacePolicies: [
          { namespace: MemoryNamespace.AGENT, policy: { maxEntries: 1 } },
          { namespace: MemoryNamespace.CREW, policy: { maxEntries: 1 } },
        ],
      });

      await memory.add(
        makeEntry({
          id: 'a1',
          namespace: MemoryNamespace.AGENT,
          createdAt: '2024-01-01T00:00:00Z',
        }),
      );
      await memory.add(
        makeEntry({
          id: 'a2',
          namespace: MemoryNamespace.AGENT,
          createdAt: '2024-01-02T00:00:00Z',
        }),
      );
      await memory.add(
        makeEntry({ id: 'c1', namespace: MemoryNamespace.CREW, createdAt: '2024-01-01T00:00:00Z' }),
      );
      await memory.add(
        makeEntry({ id: 'c2', namespace: MemoryNamespace.CREW, createdAt: '2024-01-02T00:00:00Z' }),
      );
      await memory.add(
        makeEntry({
          id: 'g1',
          namespace: MemoryNamespace.GLOBAL,
          createdAt: '2024-01-01T00:00:00Z',
        }),
      );

      const result = await manager.enforce(memory);
      expect(result.totalEvicted).toBe(2); // 1 from agent, 1 from crew

      expect(await memory.get('a1')).toBeUndefined();
      expect(await memory.get('a2')).toBeDefined();
      expect(await memory.get('c1')).toBeUndefined();
      expect(await memory.get('c2')).toBeDefined();
      expect(await memory.get('g1')).toBeDefined(); // GLOBAL unaffected
    });
  });
});
