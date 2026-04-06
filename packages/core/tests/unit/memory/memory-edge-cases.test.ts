/**
 * Edge-case and branch-coverage tests for the memory system.
 *
 * Targets uncovered branches identified by coverage analysis:
 * - memory-export.ts: error path when provider.query() throws
 * - memory-manager.ts: non-Error thrown, defensive primary checks
 * - memory-search-builder.ts: non-Error throws in execute/search
 * - scoped-memory.ts: missing namespace config
 * - short-term-memory.ts: expiration edge cases
 */

import { describe, expect, it, vi } from 'vitest';

import { ShortTermMemory } from '../../../src/memory/short-term-memory.js';
import {
  MemoryManager,
  generateMemoryId,
} from '../../../src/memory/memory-manager.js';
import { MemorySearchBuilder } from '../../../src/memory/memory-search-builder.js';
import { ScopedMemory } from '../../../src/memory/scoped-memory.js';
import { exportMemory, importMemory, parseExportJson } from '../../../src/memory/memory-export.js';
import { MemoryNamespace, MemoryRole } from '../../../src/types/memory.js';
import type { MemoryEntry, MemoryProvider } from '../../../src/types/memory.js';
import {
  MemoryConfigError,
  MemoryOperationError,
  MemoryQueryError,
} from '../../../src/errors/memory-errors.js';

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

describe('TASK-053: Memory Edge Cases & Branch Coverage', () => {
  describe('exportMemory error handling', () => {
    it('throws MemoryOperationError when provider.query() fails', async () => {
      const failingProvider = createMockProvider('failing', {
        query: vi.fn(async () => { throw new Error('query exploded'); }),
        count: vi.fn(async () => 0),
      });
      await expect(exportMemory(failingProvider)).rejects.toThrow(MemoryOperationError);
      await expect(exportMemory(failingProvider)).rejects.toThrow('query exploded');
    });

    it('handles non-Error thrown by provider.query()', async () => {
      const failingProvider = createMockProvider('failing', {
        query: vi.fn(async () => { throw 'string error'; }),
        count: vi.fn(async () => 0),
      });
      await expect(exportMemory(failingProvider)).rejects.toThrow(MemoryOperationError);
    });
  });

  describe('MemoryManager add() error handling', () => {
    it('handles non-Error thrown by provider', async () => {
      const throwingProvider = createMockProvider('thrower', {
        add: vi.fn(async () => { throw 'not an error object'; }),
      });
      const manager = new MemoryManager({ providers: [throwingProvider] });
      await expect(manager.add(makeEntry())).rejects.toThrow(MemoryOperationError);
    });

    it('succeeds when first provider fails but second succeeds', async () => {
      const failProvider = createMockProvider('fail', {
        add: vi.fn(async () => { throw new Error('fail'); }),
      });
      const successProvider = new ShortTermMemory();
      const manager = new MemoryManager({ providers: [failProvider, successProvider] });
      const entry = makeEntry();
      const result = await manager.add(entry);
      expect(result).toBeDefined();
      expect(result.id).toBe(entry.id);
    });
  });

  describe('MemoryManager empty provider operations', () => {
    it('query returns empty when no providers', async () => {
      const manager = new MemoryManager();
      expect(await manager.query()).toEqual({ entries: [], total: 0 });
    });

    it('search returns empty when no providers', async () => {
      const manager = new MemoryManager();
      expect(await manager.search('test')).toEqual({ entries: [], total: 0 });
    });

    it('count returns 0 when no providers', async () => {
      expect(await new MemoryManager().count()).toBe(0);
    });

    it('get returns undefined with no providers', async () => {
      expect(await new MemoryManager().get('x')).toBeUndefined();
    });
  });

  describe('MemoryManager provider management', () => {
    it('removeProvider returns false for unknown', () => {
      expect(new MemoryManager().removeProvider('x')).toBe(false);
    });

    it('getProvider returns undefined for unknown', () => {
      expect(new MemoryManager().getProvider('x')).toBeUndefined();
    });

    it('providers getter returns a snapshot', () => {
      const manager = new MemoryManager({ providers: [new ShortTermMemory()] });
      expect(manager.providers).not.toBe(manager.providers);
      expect(manager.providers).toEqual(manager.providers);
    });
  });

  describe('MemorySearchBuilder error handling', () => {
    it('wraps non-Error thrown in execute()', async () => {
      const provider = createMockProvider('fail', {
        query: vi.fn(async () => { throw 'string error'; }),
      });
      await expect(new MemorySearchBuilder(provider).execute()).rejects.toThrow(MemoryQueryError);
    });

    it('wraps non-Error thrown in search()', async () => {
      const provider = createMockProvider('fail', {
        search: vi.fn(async () => { throw 42; }),
      });
      await expect(new MemorySearchBuilder(provider).search('test')).rejects.toThrow(MemoryQueryError);
    });

    it('passes through MemoryQueryError in execute()', async () => {
      const original = new MemoryQueryError('p', 'err');
      const provider = createMockProvider('fail', {
        query: vi.fn(async () => { throw original; }),
      });
      await expect(new MemorySearchBuilder(provider).execute()).rejects.toBe(original);
    });

    it('passes through MemoryQueryError in search()', async () => {
      const original = new MemoryQueryError('p', 'err');
      const provider = createMockProvider('fail', {
        search: vi.fn(async () => { throw original; }),
      });
      await expect(new MemorySearchBuilder(provider).search('t')).rejects.toBe(original);
    });
  });

  describe('ScopedMemory constructor validation', () => {
    it('throws when namespace is falsy', () => {
      expect(() => new ScopedMemory({
        provider: new ShortTermMemory(),
        namespace: '' as unknown as MemoryNamespace,
        ownerId: 'test',
      })).toThrow(MemoryConfigError);
    });

    it('throws when namespace is undefined', () => {
      expect(() => new ScopedMemory({
        provider: new ShortTermMemory(),
        namespace: undefined as unknown as MemoryNamespace,
        ownerId: 'test',
      })).toThrow(MemoryConfigError);
    });

    it('throws when ownerId is empty', () => {
      expect(() => new ScopedMemory({
        provider: new ShortTermMemory(),
        namespace: MemoryNamespace.AGENT,
        ownerId: '',
      })).toThrow(MemoryConfigError);
    });

    it('throws when provider is missing', () => {
      expect(() => new ScopedMemory({
        provider: undefined as unknown as MemoryProvider,
        namespace: MemoryNamespace.AGENT,
        ownerId: 'test',
      })).toThrow(MemoryConfigError);
    });
  });

  describe('ScopedMemory delete/clear edge cases', () => {
    it('throws when deleting entry owned by different scope', async () => {
      const provider = new ShortTermMemory();
      const scopeA = new ScopedMemory({ provider, namespace: MemoryNamespace.AGENT, ownerId: 'a' });
      const scopeB = new ScopedMemory({ provider, namespace: MemoryNamespace.AGENT, ownerId: 'b' });
      await scopeA.add(makeEntry({ id: 'owned-by-a' }));
      await expect(scopeB.delete('owned-by-a')).rejects.toThrow(MemoryOperationError);
    });

    it('returns false when deleting non-existent entry', async () => {
      const scope = new ScopedMemory({
        provider: new ShortTermMemory(), namespace: MemoryNamespace.AGENT, ownerId: 'test',
      });
      expect(await scope.delete('nonexistent')).toBe(false);
    });

    it('throws when clearing a non-owned namespace', async () => {
      const scope = new ScopedMemory({
        provider: new ShortTermMemory(), namespace: MemoryNamespace.AGENT, ownerId: 'test',
      });
      await expect(scope.clear(MemoryNamespace.CREW)).rejects.toThrow(MemoryOperationError);
    });
  });

  describe('ScopedMemory count edge cases', () => {
    it('returns 0 for non-readable namespace', async () => {
      const scope = new ScopedMemory({
        provider: new ShortTermMemory(), namespace: MemoryNamespace.GLOBAL, ownerId: 'sys',
      });
      expect(await scope.count(MemoryNamespace.AGENT)).toBe(0);
    });

    it('sums counts across all readable namespaces', async () => {
      const provider = new ShortTermMemory();
      await provider.add(makeEntry({ id: 'a1', namespace: MemoryNamespace.AGENT, metadata: { ownerId: 'ag1' } }));
      await provider.add(makeEntry({ id: 'c1', namespace: MemoryNamespace.CREW }));
      await provider.add(makeEntry({ id: 'g1', namespace: MemoryNamespace.GLOBAL }));
      const scope = new ScopedMemory({ provider, namespace: MemoryNamespace.AGENT, ownerId: 'ag1' });
      expect(await scope.count()).toBe(3);
    });
  });

  describe('ScopedMemory non-readable namespace queries', () => {
    it('query returns empty for non-readable namespace', async () => {
      const scope = new ScopedMemory({
        provider: new ShortTermMemory(), namespace: MemoryNamespace.GLOBAL, ownerId: 'sys',
      });
      expect(await scope.query({ namespace: MemoryNamespace.AGENT })).toEqual({ entries: [], total: 0 });
    });

    it('search returns empty for non-readable namespace', async () => {
      const scope = new ScopedMemory({
        provider: new ShortTermMemory(), namespace: MemoryNamespace.GLOBAL, ownerId: 'sys',
      });
      expect(await scope.search('x', { namespace: MemoryNamespace.AGENT })).toEqual({ entries: [], total: 0 });
    });
  });

  describe('ShortTermMemory retention edge cases', () => {
    it('evicts multiple expired entries at once', async () => {
      const memory = new ShortTermMemory({ retention: { maxAge: 50 } });
      const old = Date.now() - 200;
      await memory.add(makeEntry({ id: 'old1', createdAt: new Date(old).toISOString() }));
      await memory.add(makeEntry({ id: 'old2', createdAt: new Date(old + 10).toISOString() }));
      await memory.add(makeEntry({ id: 'new1' }));
      expect(await memory.get('old1')).toBeUndefined();
      expect(await memory.get('old2')).toBeUndefined();
      expect(await memory.get('new1')).toBeDefined();
    });

    it('handles maxEntries eviction', async () => {
      const memory = new ShortTermMemory({ retention: { maxEntries: 2 } });
      const evicted: MemoryEntry[][] = [];
      memory.on('memory:evict', (entries) => evicted.push(entries));
      await memory.add(makeEntry({ id: 'e1' }));
      await memory.add(makeEntry({ id: 'e2' }));
      await memory.add(makeEntry({ id: 'e3' }));
      expect(await memory.count()).toBe(2);
      expect(await memory.get('e1')).toBeUndefined();
      expect(evicted[0][0].id).toBe('e1');
    });
  });

  describe('ShortTermMemory constructor validation', () => {
    it('throws on negative maxEntries', () => {
      expect(() => new ShortTermMemory({ retention: { maxEntries: -1 } })).toThrow(MemoryConfigError);
    });

    it('throws on non-integer maxEntries', () => {
      expect(() => new ShortTermMemory({ retention: { maxEntries: 1.5 } })).toThrow(MemoryConfigError);
    });

    it('throws on negative maxAge', () => {
      expect(() => new ShortTermMemory({ retention: { maxAge: -1 } })).toThrow(MemoryConfigError);
    });
  });

  describe('ShortTermMemory search edge cases', () => {
    it('search is case-insensitive', async () => {
      const m = new ShortTermMemory();
      await m.add(makeEntry({ id: 's1', content: 'Hello World' }));
      expect((await m.search('hello')).entries).toHaveLength(1);
      expect((await m.search('HELLO')).entries).toHaveLength(1);
    });

    it('search returns empty for empty text', async () => {
      const m = new ShortTermMemory();
      await m.add(makeEntry({ id: 's1', content: 'hello' }));
      expect((await m.search('')).entries).toHaveLength(0);
    });
  });

  describe('ShortTermMemory add validation', () => {
    it('rejects entries missing id', async () => {
      const m = new ShortTermMemory();
      await expect(m.add({
        id: '', content: 'test', role: MemoryRole.USER,
        namespace: MemoryNamespace.AGENT, createdAt: new Date().toISOString(),
      })).rejects.toThrow();
    });

    it('rejects duplicate IDs', async () => {
      const m = new ShortTermMemory();
      await m.add(makeEntry({ id: 'dup' }));
      await expect(m.add(makeEntry({ id: 'dup' }))).rejects.toThrow();
    });
  });

  describe('parseExportJson edge cases', () => {
    it('throws on invalid JSON syntax', () => {
      expect(() => parseExportJson('not json')).toThrow(MemoryOperationError);
    });

    it('throws on missing required fields', () => {
      expect(() => parseExportJson(JSON.stringify({ version: 1 }))).toThrow(MemoryOperationError);
    });
  });

  describe('importMemory edge cases', () => {
    it('throws on unsupported export version', async () => {
      const provider = new ShortTermMemory();
      const data = {
        version: 999, exportedAt: new Date().toISOString(),
        providerName: 'test', entries: [], totalEntries: 0,
      };
      await expect(importMemory(provider, data)).rejects.toThrow(MemoryOperationError);
    });

    it('reports errors for malformed entries', async () => {
      const provider = new ShortTermMemory();
      const data = {
        version: 1, exportedAt: new Date().toISOString(),
        providerName: 'test', totalEntries: 3,
        entries: [
          makeEntry({ id: 'good1' }),
          { id: '', content: 'bad', role: 'user', namespace: 'agent', createdAt: '' } as unknown as MemoryEntry,
          makeEntry({ id: 'good2' }),
        ],
      };
      const result = await importMemory(provider, data);
      expect(result.imported).toBeGreaterThanOrEqual(1);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('MemoryManager event edge cases', () => {
    it('emits memory:clear with namespace', async () => {
      const manager = new MemoryManager({ providers: [new ShortTermMemory()] });
      await manager.add(makeEntry({ namespace: MemoryNamespace.AGENT }));
      await manager.add(makeEntry({ namespace: MemoryNamespace.CREW }));
      let clearedNs: MemoryNamespace | undefined;
      manager.on('memory:clear', (ns) => { clearedNs = ns; });
      await manager.clear(MemoryNamespace.AGENT);
      expect(clearedNs).toBe(MemoryNamespace.AGENT);
    });
  });

  describe('ShortTermMemory clear by namespace', () => {
    it('removes only entries in specified namespace', async () => {
      const m = new ShortTermMemory();
      await m.add(makeEntry({ id: 'a1', namespace: MemoryNamespace.AGENT }));
      await m.add(makeEntry({ id: 'c1', namespace: MemoryNamespace.CREW }));
      expect(await m.clear(MemoryNamespace.AGENT)).toBe(1);
      expect(await m.count()).toBe(1);
    });
  });

  describe('ShortTermMemory combined query filters', () => {
    it('applies role + namespace + time range', async () => {
      const m = new ShortTermMemory();
      const now = Date.now();
      await m.add(makeEntry({ id: 'q1', role: MemoryRole.USER, namespace: MemoryNamespace.AGENT, createdAt: new Date(now - 2000).toISOString() }));
      await m.add(makeEntry({ id: 'q2', role: MemoryRole.ASSISTANT, namespace: MemoryNamespace.AGENT, createdAt: new Date(now - 1000).toISOString() }));
      await m.add(makeEntry({ id: 'q3', role: MemoryRole.USER, namespace: MemoryNamespace.CREW, createdAt: new Date(now).toISOString() }));
      const result = await m.query({
        role: MemoryRole.USER, namespace: MemoryNamespace.AGENT,
        after: new Date(now - 3000).toISOString(), before: new Date(now + 1000).toISOString(),
      });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].id).toBe('q1');
    });

    it('applies roles filter with sort order', async () => {
      const m = new ShortTermMemory();
      const now = Date.now();
      await m.add(makeEntry({ id: 'r1', role: MemoryRole.USER, createdAt: new Date(now - 2000).toISOString() }));
      await m.add(makeEntry({ id: 'r2', role: MemoryRole.ASSISTANT, createdAt: new Date(now - 1000).toISOString() }));
      await m.add(makeEntry({ id: 'r3', role: MemoryRole.SYSTEM, createdAt: new Date(now).toISOString() }));
      const result = await m.query({ roles: [MemoryRole.USER, MemoryRole.SYSTEM], sortOrder: 'asc' });
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].id).toBe('r1');
    });
  });

  describe('ShortTermMemory metadata filtering', () => {
    it('returns no match when entry has no metadata', async () => {
      const m = new ShortTermMemory();
      await m.add(makeEntry({ id: 'm1' }));
      expect((await m.query({ metadata: { key: 'value' } })).entries).toHaveLength(0);
    });

    it('matches metadata with boolean values', async () => {
      const m = new ShortTermMemory();
      await m.add(makeEntry({ id: 'm2', metadata: { active: true } }));
      await m.add(makeEntry({ id: 'm3', metadata: { active: false } }));
      expect((await m.query({ metadata: { active: true } })).entries).toHaveLength(1);
    });
  });
});
