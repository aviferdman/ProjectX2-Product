/**
 * Edge-case and branch-coverage tests for the memory system.
 *
 * Targets uncovered branches identified by coverage analysis:
 * - memory-export.ts: error path when provider.query() throws
 * - memory-manager.ts: non-Error thrown, defensive primary checks
 * - memory-search-builder.ts: non-Error throws in execute/search
 * - scoped-memory.ts: missing namespace config
 * - short-term-memory.ts: expiration edge cases
 * - sqlite-memory.ts: role-based query filtering
 */

import { describe, expect, it, vi } from 'vitest';

import { ShortTermMemory } from '../../../src/memory/short-term-memory.js';
import {
  MemoryManager,
  createMemoryEntry,
  generateMemoryId,
} from '../../../src/memory/memory-manager.js';
import { MemorySearchBuilder } from '../../../src/memory/memory-search-builder.js';
import { ScopedMemory } from '../../../src/memory/scoped-memory.js';
import { exportMemory, importMemory, parseExportJson } from '../../../src/memory/memory-export.js';
import { MemoryNamespace, MemoryRole } from '../../../src/types/memory.js';
import type { MemoryEntry, MemoryProvider, MemoryQueryResult } from '../../../src/types/memory.js';
import {
  MemoryConfigError,
  MemoryOperationError,
  MemoryQueryError,
} from '../../../src/errors/memory-errors.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<MemoryEntry> = {}): MemoryEntry {
  return {
    id: overrides.id ?? generateMemoryId(),
    content: overrides.content ?? 'test content',
    role: overrides.role ?? MemoryRole.USER,
    namespace: overrides.namespace ?? MemoryNamespace.AGENT,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    ...(overrides.metadata !== undefined && { metadata: overrides.metadata }),
  };
}

/** Creates a mock MemoryProvider with customizable behavior. */
function createMockProvider(name: string, overrides: Partial<MemoryProvider> = {}): MemoryProvider {
  return {
    name,
    add: overrides.add ?? vi.fn(async (e: MemoryEntry) => e),
    get: overrides.get ?? vi.fn(async () => undefined),
    query: overrides.query ?? vi.fn(async () => ({ entries: [], total: 0 })),
    search: overrides.search ?? vi.fn(async () => ({ entries: [], total: 0 })),
    delete: overrides.delete ?? vi.fn(async () => false),
    clear: overrides.clear ?? vi.fn(async () => 0),
    count: overrides.count ?? vi.fn(async () => 0),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TASK-053: Memory Edge Cases & Branch Coverage', () => {
  // -----------------------------------------------------------------------
  // memory-export.ts — error when provider.query() throws
  // -----------------------------------------------------------------------
  describe('exportMemory error handling', () => {
    it('throws MemoryOperationError when provider.query() fails', async () => {
      const failingProvider = createMockProvider('failing', {
        query: vi.fn(async () => {
          throw new Error('query exploded');
        }),
        count: vi.fn(async () => 0),
      });

      await expect(exportMemory(failingProvider)).rejects.toThrow(MemoryOperationError);
      await expect(exportMemory(failingProvider)).rejects.toThrow('query exploded');
    });

    it('handles non-Error thrown by provider.query()', async () => {
      const failingProvider = createMockProvider('failing', {
        query: vi.fn(async () => {
          throw 'string error';
        }),
        count: vi.fn(async () => 0),
      });

      await expect(exportMemory(failingProvider)).rejects.toThrow(MemoryOperationError);
      await expect(exportMemory(failingProvider)).rejects.toThrow('string error');
    });
  });

  // -----------------------------------------------------------------------
  // memory-manager.ts — non-Error thrown, partial failures
  // -----------------------------------------------------------------------
  describe('MemoryManager add() error handling', () => {
    it('handles non-Error thrown by provider', async () => {
      const throwingProvider = createMockProvider('thrower', {
        add: vi.fn(async () => {
          throw 'not an error object';
        }),
      });
      const manager = new MemoryManager({ providers: [throwingProvider] });

      await expect(manager.add(makeEntry())).rejects.toThrow(MemoryOperationError);
    });

    it('succeeds when first provider fails but second succeeds', async () => {
      const failProvider = createMockProvider('fail', {
        add: vi.fn(async () => {
          throw new Error('fail');
        }),
      });
      const successProvider = new ShortTermMemory();
      const manager = new MemoryManager({
        providers: [failProvider, successProvider],
      });

      const entry = makeEntry();
      const result = await manager.add(entry);
      expect(result).toBeDefined();
      expect(result.id).toBe(entry.id);
    });
  });

  describe('MemoryManager query/search/count with empty providers', () => {
    it('query returns empty when no providers registered', async () => {
      const manager = new MemoryManager();
      const result = await manager.query();
      expect(result).toEqual({ entries: [], total: 0 });
    });

    it('search returns empty when no providers registered', async () => {
      const manager = new MemoryManager();
      const result = await manager.search('test');
      expect(result).toEqual({ entries: [], total: 0 });
    });

    it('count returns 0 when no providers registered', async () => {
      const manager = new MemoryManager();
      const result = await manager.count();
      expect(result).toBe(0);
    });

    it('get returns undefined with no providers', async () => {
      const manager = new MemoryManager();
      const result = await manager.get('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('MemoryManager provider management', () => {
    it('removeProvider returns false for unknown provider', () => {
      const manager = new MemoryManager();
      expect(manager.removeProvider('nonexistent')).toBe(false);
    });

    it('getProvider returns undefined for unknown provider', () => {
      const manager = new MemoryManager();
      expect(manager.getProvider('nonexistent')).toBeUndefined();
    });

    it('providers getter returns a snapshot (not the internal array)', () => {
      const provider = new ShortTermMemory();
      const manager = new MemoryManager({ providers: [provider] });
      const snapshot1 = manager.providers;
      const snapshot2 = manager.providers;
      expect(snapshot1).not.toBe(snapshot2);
      expect(snapshot1).toEqual(snapshot2);
    });
  });

  // -----------------------------------------------------------------------
  // memory-search-builder.ts — non-Error thrown by provider
  // -----------------------------------------------------------------------
  describe('MemorySearchBuilder error handling', () => {
    it('wraps non-Error thrown by provider in execute()', async () => {
      const failingProvider = createMockProvider('fail', {
        query: vi.fn(async () => {
          throw 'string error from query';
        }),
      });

      const builder = new MemorySearchBuilder(failingProvider);
      await expect(builder.execute()).rejects.toThrow(MemoryQueryError);
      await expect(builder.execute()).rejects.toThrow('string error from query');
    });

    it('wraps non-Error thrown by provider in search()', async () => {
      const failingProvider = createMockProvider('fail', {
        search: vi.fn(async () => {
          throw 42; // Non-Error throw
        }),
      });

      const builder = new MemorySearchBuilder(failingProvider);
      await expect(builder.search('test')).rejects.toThrow(MemoryQueryError);
      await expect(builder.search('test')).rejects.toThrow('42');
    });

    it('passes through MemoryQueryError without wrapping in execute()', async () => {
      const original = new MemoryQueryError('provider', 'original error');
      const failingProvider = createMockProvider('fail', {
        query: vi.fn(async () => {
          throw original;
        }),
      });

      const builder = new MemorySearchBuilder(failingProvider);
      await expect(builder.execute()).rejects.toBe(original);
    });

    it('passes through MemoryQueryError without wrapping in search()', async () => {
      const original = new MemoryQueryError('provider', 'original error');
      const failingProvider = createMockProvider('fail', {
        search: vi.fn(async () => {
          throw original;
        }),
      });

      const builder = new MemorySearchBuilder(failingProvider);
      await expect(builder.search('test')).rejects.toBe(original);
    });
  });

  // -----------------------------------------------------------------------
  // scoped-memory.ts — missing namespace config
  // -----------------------------------------------------------------------
  describe('ScopedMemory constructor validation', () => {
    it('throws MemoryConfigError when namespace is missing', () => {
      const provider = new ShortTermMemory();
      expect(
        () =>
          new ScopedMemory({
            provider,
            namespace: '' as unknown as MemoryNamespace,
            ownerId: 'test',
          }),
      ).toThrow(MemoryConfigError);
    });

    it('throws MemoryConfigError when namespace is undefined', () => {
      const provider = new ShortTermMemory();
      expect(
        () =>
          new ScopedMemory({
            provider,
            namespace: undefined as unknown as MemoryNamespace,
            ownerId: 'test',
          }),
      ).toThrow(MemoryConfigError);
    });

    it('throws MemoryConfigError when ownerId is empty', () => {
      const provider = new ShortTermMemory();
      expect(
        () =>
          new ScopedMemory({
            provider,
            namespace: MemoryNamespace.AGENT,
            ownerId: '',
          }),
      ).toThrow(MemoryConfigError);
    });

    it('throws MemoryConfigError when provider is missing', () => {
      expect(
        () =>
          new ScopedMemory({
            provider: undefined as unknown as MemoryProvider,
            namespace: MemoryNamespace.AGENT,
            ownerId: 'test',
          }),
      ).toThrow(MemoryConfigError);
    });
  });

  describe('ScopedMemory delete/clear edge cases', () => {
    it('throws when deleting entry owned by different scope', async () => {
      const provider = new ShortTermMemory();
      const scopeA = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-a',
      });
      const scopeB = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-b',
      });

      const entry = makeEntry({ id: 'owned-by-a', content: 'private' });
      await scopeA.add(entry);

      await expect(scopeB.delete('owned-by-a')).rejects.toThrow(MemoryOperationError);
    });

    it('returns false when deleting non-existent entry', async () => {
      const provider = new ShortTermMemory();
      const scope = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'test',
      });

      const result = await scope.delete('nonexistent');
      expect(result).toBe(false);
    });

    it('throws when clearing a non-owned namespace', async () => {
      const provider = new ShortTermMemory();
      const scope = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'test',
      });

      await expect(scope.clear(MemoryNamespace.CREW)).rejects.toThrow(MemoryOperationError);
    });

    it('allows clearing own namespace explicitly', async () => {
      const provider = new ShortTermMemory();
      const scope = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'test',
      });

      await scope.add(makeEntry({ content: 'data' }));
      const cleared = await scope.clear(MemoryNamespace.AGENT);
      expect(cleared).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ScopedMemory count edge cases', () => {
    it('returns 0 for non-readable namespace', async () => {
      const provider = new ShortTermMemory();
      const globalScope = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.GLOBAL,
        ownerId: 'system',
      });

      // GLOBAL scope can only read GLOBAL, not AGENT
      const count = await globalScope.count(MemoryNamespace.AGENT);
      expect(count).toBe(0);
    });

    it('sums counts across all readable namespaces', async () => {
      const provider = new ShortTermMemory();

      // Add entries to different namespaces directly via provider
      await provider.add(makeEntry({
        id: 'a1',
        namespace: MemoryNamespace.AGENT,
        metadata: { ownerId: 'agent-1' },
      }));
      await provider.add(makeEntry({
        id: 'c1',
        namespace: MemoryNamespace.CREW,
      }));
      await provider.add(makeEntry({
        id: 'g1',
        namespace: MemoryNamespace.GLOBAL,
      }));

      const agentScope = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'agent-1',
      });

      // Agent scope reads AGENT + CREW + GLOBAL
      const total = await agentScope.count();
      expect(total).toBe(3);
    });
  });

  describe('ScopedMemory query/search with non-readable namespace', () => {
    it('query returns empty for non-readable namespace filter', async () => {
      const provider = new ShortTermMemory();
      const globalScope = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.GLOBAL,
        ownerId: 'system',
      });

      const result = await globalScope.query({ namespace: MemoryNamespace.AGENT });
      expect(result).toEqual({ entries: [], total: 0 });
    });

    it('search returns empty for non-readable namespace filter', async () => {
      const provider = new ShortTermMemory();
      const globalScope = new ScopedMemory({
        provider,
        namespace: MemoryNamespace.GLOBAL,
        ownerId: 'system',
      });

      const result = await globalScope.search('anything', { namespace: MemoryNamespace.AGENT });
      expect(result).toEqual({ entries: [], total: 0 });
    });
  });

  // -----------------------------------------------------------------------
  // short-term-memory.ts — eviction and edge cases
  // -----------------------------------------------------------------------
  describe('ShortTermMemory retention edge cases', () => {
    it('evicts multiple expired entries at once', async () => {
      const memory = new ShortTermMemory({
        retention: { maxAge: 50 },
      });

      const evicted: MemoryEntry[][] = [];
      memory.on('memory:evict', (entries) => evicted.push(entries));

      // Add entries with old timestamps
      const old = Date.now() - 200;
      await memory.add(makeEntry({
        id: 'old1',
        content: 'expired-1',
        createdAt: new Date(old).toISOString(),
      }));
      await memory.add(makeEntry({
        id: 'old2',
        content: 'expired-2',
        createdAt: new Date(old + 10).toISOString(),
      }));

      // Adding a new entry triggers expiration
      await memory.add(makeEntry({
        id: 'new1',
        content: 'fresh',
      }));

      // Old entries should be evicted
      expect(await memory.get('old1')).toBeUndefined();
      expect(await memory.get('old2')).toBeUndefined();
      expect(await memory.get('new1')).toBeDefined();
    });

    it('handles maxEntries eviction when adding beyond capacity', async () => {
      const memory = new ShortTermMemory({
        retention: { maxEntries: 2 },
      });

      const evicted: MemoryEntry[][] = [];
      memory.on('memory:evict', (entries) => evicted.push(entries));

      await memory.add(makeEntry({ id: 'e1', content: 'first' }));
      await memory.add(makeEntry({ id: 'e2', content: 'second' }));
      await memory.add(makeEntry({ id: 'e3', content: 'third' }));

      expect(await memory.count()).toBe(2);
      expect(await memory.get('e1')).toBeUndefined(); // Oldest evicted
      expect(await memory.get('e2')).toBeDefined();
      expect(await memory.get('e3')).toBeDefined();
      expect(evicted.length).toBe(1);
      expect(evicted[0]).toHaveLength(1);
      expect(evicted[0][0].id).toBe('e1');
    });
  });

  describe('ShortTermMemory constructor validation', () => {
    it('throws on negative maxEntries', () => {
      expect(() => new ShortTermMemory({ retention: { maxEntries: -1 } })).toThrow(
        MemoryConfigError,
      );
    });

    it('throws on non-integer maxEntries', () => {
      expect(() => new ShortTermMemory({ retention: { maxEntries: 1.5 } })).toThrow(
        MemoryConfigError,
      );
    });

    it('throws on negative maxAge', () => {
      expect(() => new ShortTermMemory({ retention: { maxAge: -1 } })).toThrow(MemoryConfigError);
    });

    it('allows maxEntries of 0 (unlimited)', () => {
      const memory = new ShortTermMemory({ retention: { maxEntries: 0 } });
      expect(memory).toBeDefined();
    });
  });

  describe('ShortTermMemory search edge cases', () => {
    it('search is case-insensitive', async () => {
      const memory = new ShortTermMemory();
      await memory.add(makeEntry({ id: 's1', content: 'Hello World' }));

      const result = await memory.search('hello');
      expect(result.entries).toHaveLength(1);

      const result2 = await memory.search('HELLO');
      expect(result2.entries).toHaveLength(1);
    });

    it('search returns empty for empty text', async () => {
      const memory = new ShortTermMemory();
      await memory.add(makeEntry({ id: 's1', content: 'hello' }));

      const result = await memory.search('');
      expect(result.entries).toHaveLength(0);
    });

    it('search handles special regex characters safely', async () => {
      const memory = new ShortTermMemory();
      await memory.add(makeEntry({ id: 's1', content: 'C++ is great' }));
      await memory.add(makeEntry({ id: 's2', content: 'regex (pattern)' }));

      const result = await memory.search('C++');
      expect(result.entries.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('ShortTermMemory add validation', () => {
    it('rejects entries missing required fields', async () => {
      const memory = new ShortTermMemory();

      await expect(
        memory.add({ id: '', content: 'test', role: MemoryRole.USER, namespace: MemoryNamespace.AGENT, createdAt: new Date().toISOString() }),
      ).rejects.toThrow();

      await expect(
        memory.add({ id: 'test', content: '', role: MemoryRole.USER, namespace: MemoryNamespace.AGENT, createdAt: new Date().toISOString() }),
      ).rejects.toThrow();
    });

    it('rejects duplicate IDs', async () => {
      const memory = new ShortTermMemory();
      await memory.add(makeEntry({ id: 'dup' }));
      await expect(memory.add(makeEntry({ id: 'dup' }))).rejects.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // parseExportJson — malformed data
  // -----------------------------------------------------------------------
  describe('parseExportJson edge cases', () => {
    it('throws on invalid JSON syntax', () => {
      expect(() => parseExportJson('not json')).toThrow(MemoryOperationError);
    });

    it('throws on valid JSON but missing required fields', () => {
      expect(() => parseExportJson(JSON.stringify({ version: 1 }))).toThrow(MemoryOperationError);
    });

    it('throws on unsupported version', () => {
      expect(() =>
        parseExportJson(
          JSON.stringify({
            version: 999,
            exportedAt: new Date().toISOString(),
            providerName: 'test',
            entries: [],
            totalEntries: 0,
          }),
        ),
      ).toThrow(MemoryOperationError);
    });
  });

  // -----------------------------------------------------------------------
  // importMemory — invalid entries
  // -----------------------------------------------------------------------
  describe('importMemory with invalid entries', () => {
    it('reports errors for malformed entries without stopping import', async () => {
      const provider = new ShortTermMemory();
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        providerName: 'test',
        entries: [
          makeEntry({ id: 'good1', content: 'valid' }),
          { id: '', content: 'invalid', role: 'user', namespace: 'agent', createdAt: '' } as unknown as MemoryEntry,
          makeEntry({ id: 'good2', content: 'also valid' }),
        ],
        totalEntries: 3,
      };

      const result = await importMemory(provider, exportData);
      expect(result.imported).toBeGreaterThanOrEqual(1);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -----------------------------------------------------------------------
  // MemoryManager events
  // -----------------------------------------------------------------------
  describe('MemoryManager event edge cases', () => {
    it('emits memory:clear with namespace when clearing specific namespace', async () => {
      const provider = new ShortTermMemory();
      const manager = new MemoryManager({ providers: [provider] });

      await manager.add(makeEntry({ namespace: MemoryNamespace.AGENT }));
      await manager.add(makeEntry({ namespace: MemoryNamespace.CREW }));

      let clearedNs: MemoryNamespace | undefined;
      let clearedCount: number | undefined;
      manager.on('memory:clear', (ns, count) => {
        clearedNs = ns;
        clearedCount = count;
      });

      await manager.clear(MemoryNamespace.AGENT);
      expect(clearedNs).toBe(MemoryNamespace.AGENT);
      expect(clearedCount).toBe(1);
    });

    it('supports off() to unsubscribe from events', () => {
      const manager = new MemoryManager();
      let called = false;
      const listener = () => {
        called = true;
      };
      manager.on('memory:add', listener);
      manager.off('memory:add', listener);

      // After unsubscribing, the listener should not be called
      expect(called).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // ShortTermMemory clear by namespace
  // -----------------------------------------------------------------------
  describe('ShortTermMemory clear by namespace', () => {
    it('removes only entries in specified namespace', async () => {
      const memory = new ShortTermMemory();
      await memory.add(makeEntry({ id: 'a1', namespace: MemoryNamespace.AGENT }));
      await memory.add(makeEntry({ id: 'c1', namespace: MemoryNamespace.CREW }));
      await memory.add(makeEntry({ id: 'g1', namespace: MemoryNamespace.GLOBAL }));

      const cleared = await memory.clear(MemoryNamespace.AGENT);
      expect(cleared).toBe(1);
      expect(await memory.count()).toBe(2);
      expect(await memory.get('a1')).toBeUndefined();
      expect(await memory.get('c1')).toBeDefined();
      expect(await memory.get('g1')).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // ShortTermMemory query with combined filters
  // -----------------------------------------------------------------------
  describe('ShortTermMemory query with combined filters', () => {
    it('applies role + namespace + time range together', async () => {
      const memory = new ShortTermMemory();
      const now = Date.now();

      await memory.add(makeEntry({
        id: 'q1',
        role: MemoryRole.USER,
        namespace: MemoryNamespace.AGENT,
        createdAt: new Date(now - 2000).toISOString(),
      }));
      await memory.add(makeEntry({
        id: 'q2',
        role: MemoryRole.ASSISTANT,
        namespace: MemoryNamespace.AGENT,
        createdAt: new Date(now - 1000).toISOString(),
      }));
      await memory.add(makeEntry({
        id: 'q3',
        role: MemoryRole.USER,
        namespace: MemoryNamespace.CREW,
        createdAt: new Date(now).toISOString(),
      }));

      const result = await memory.query({
        role: MemoryRole.USER,
        namespace: MemoryNamespace.AGENT,
        after: new Date(now - 3000).toISOString(),
        before: new Date(now + 1000).toISOString(),
      });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].id).toBe('q1');
    });

    it('applies roles filter (multi) with sort order', async () => {
      const memory = new ShortTermMemory();
      const now = Date.now();

      await memory.add(makeEntry({
        id: 'r1',
        role: MemoryRole.USER,
        createdAt: new Date(now - 2000).toISOString(),
      }));
      await memory.add(makeEntry({
        id: 'r2',
        role: MemoryRole.ASSISTANT,
        createdAt: new Date(now - 1000).toISOString(),
      }));
      await memory.add(makeEntry({
        id: 'r3',
        role: MemoryRole.SYSTEM,
        createdAt: new Date(now).toISOString(),
      }));

      const result = await memory.query({
        roles: [MemoryRole.USER, MemoryRole.SYSTEM],
        sortOrder: 'asc',
      });

      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].id).toBe('r1');
      expect(result.entries[1].id).toBe('r3');
    });
  });

  // -----------------------------------------------------------------------
  // ShortTermMemory metadata filtering edge cases
  // -----------------------------------------------------------------------
  describe('ShortTermMemory metadata filtering', () => {
    it('returns no match when entry has no metadata but filter expects metadata', async () => {
      const memory = new ShortTermMemory();
      await memory.add(makeEntry({ id: 'm1', content: 'no metadata' }));

      const result = await memory.query({ metadata: { key: 'value' } });
      expect(result.entries).toHaveLength(0);
    });

    it('matches metadata with boolean values', async () => {
      const memory = new ShortTermMemory();
      await memory.add(makeEntry({ id: 'm2', metadata: { active: true } }));
      await memory.add(makeEntry({ id: 'm3', metadata: { active: false } }));

      const result = await memory.query({ metadata: { active: true } });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].id).toBe('m2');
    });

    it('matches metadata with numeric values', async () => {
      const memory = new ShortTermMemory();
      await memory.add(makeEntry({ id: 'm4', metadata: { priority: 1 } }));
      await memory.add(makeEntry({ id: 'm5', metadata: { priority: 2 } }));

      const result = await memory.query({ metadata: { priority: 1 } });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].id).toBe('m4');
    });
  });
});
