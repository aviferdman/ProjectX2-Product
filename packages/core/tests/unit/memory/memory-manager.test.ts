/**
 * Tests for MemoryManager.
 */

import { describe, expect, it, beforeEach } from 'vitest';

import {
  MemoryManager,
  createMemoryEntry,
  generateMemoryId,
} from '../../../src/memory/memory-manager.js';
import { ShortTermMemory } from '../../../src/memory/short-term-memory.js';
import { MemoryNamespace, MemoryRole } from '../../../src/types/memory.js';
import type { MemoryEntry, MemoryProvider } from '../../../src/types/memory.js';
import { MemoryConfigError, MemoryOperationError } from '../../../src/errors/memory-errors.js';

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MemoryManager', () => {
  let manager: MemoryManager;
  let provider: ShortTermMemory;

  beforeEach(() => {
    provider = new ShortTermMemory();
    manager = new MemoryManager({ providers: [provider] });
  });

  describe('constructor', () => {
    it('creates with default config', () => {
      const mgr = new MemoryManager();
      expect(mgr.name).toBe('manager');
      expect(mgr.providers).toHaveLength(0);
    });

    it('accepts providers', () => {
      expect(manager.providers).toHaveLength(1);
      expect(manager.providers[0]!.name).toBe('short-term');
    });

    it('sets default namespace', () => {
      const mgr = new MemoryManager({ defaultNamespace: MemoryNamespace.GLOBAL });
      expect(mgr.defaultNamespace).toBe(MemoryNamespace.GLOBAL);
    });

    it('throws on duplicate provider names', () => {
      const p1 = new ShortTermMemory();
      const p2 = new ShortTermMemory();
      expect(() => new MemoryManager({ providers: [p1, p2] })).toThrow(MemoryConfigError);
    });
  });

  describe('addProvider()', () => {
    it('adds a new provider', () => {
      const mgr = new MemoryManager();
      const p = new ShortTermMemory();
      mgr.addProvider(p);
      expect(mgr.providers).toHaveLength(1);
    });

    it('throws on duplicate name', () => {
      expect(() => manager.addProvider(new ShortTermMemory())).toThrow(MemoryConfigError);
    });
  });

  describe('removeProvider()', () => {
    it('removes a provider by name', () => {
      const removed = manager.removeProvider('short-term');
      expect(removed).toBe(true);
      expect(manager.providers).toHaveLength(0);
    });

    it('returns false for unknown name', () => {
      expect(manager.removeProvider('nonexistent')).toBe(false);
    });
  });

  describe('getProvider()', () => {
    it('finds a provider by name', () => {
      const p = manager.getProvider('short-term');
      expect(p).toBe(provider);
    });

    it('returns undefined for unknown name', () => {
      expect(manager.getProvider('sqlite')).toBeUndefined();
    });
  });

  describe('add()', () => {
    it('fans out writes to all providers', async () => {
      const secondProvider: MemoryProvider = {
        name: 'second',
        add: async (e) => e,
        get: async () => undefined,
        query: async () => ({ entries: [], total: 0 }),
        search: async () => ({ entries: [], total: 0 }),
        delete: async () => false,
        clear: async () => 0,
        count: async () => 0,
      };

      const mgr = new MemoryManager({ providers: [provider, secondProvider] });
      const entry = makeEntry({ id: 'fanout-1' });
      await mgr.add(entry);

      expect(await provider.get('fanout-1')).toBeDefined();
    });

    it('throws when no providers are registered', async () => {
      const emptyMgr = new MemoryManager();
      await expect(emptyMgr.add(makeEntry())).rejects.toThrow(MemoryOperationError);
    });

    it('throws when all providers fail', async () => {
      const failProvider: MemoryProvider = {
        name: 'fail',
        add: async () => { throw new Error('boom'); },
        get: async () => undefined,
        query: async () => ({ entries: [], total: 0 }),
        search: async () => ({ entries: [], total: 0 }),
        delete: async () => false,
        clear: async () => 0,
        count: async () => 0,
      };

      const mgr = new MemoryManager({ providers: [failProvider] });
      await expect(mgr.add(makeEntry())).rejects.toThrow(MemoryOperationError);
    });

    it('succeeds if at least one provider works', async () => {
      const failProvider: MemoryProvider = {
        name: 'fail',
        add: async () => { throw new Error('boom'); },
        get: async () => undefined,
        query: async () => ({ entries: [], total: 0 }),
        search: async () => ({ entries: [], total: 0 }),
        delete: async () => false,
        clear: async () => 0,
        count: async () => 0,
      };

      const mgr = new MemoryManager({ providers: [failProvider, provider] });
      const entry = makeEntry({ id: 'partial-ok' });
      const stored = await mgr.add(entry);
      expect(stored.id).toBe('partial-ok');
    });
  });

  describe('get()', () => {
    it('returns entry from first matching provider', async () => {
      await manager.add(makeEntry({ id: 'get-1', content: 'found' }));
      const entry = await manager.get('get-1');
      expect(entry?.content).toBe('found');
    });

    it('returns undefined when no provider has the entry', async () => {
      expect(await manager.get('missing')).toBeUndefined();
    });

    it('returns undefined when no providers registered', async () => {
      const mgr = new MemoryManager();
      expect(await mgr.get('x')).toBeUndefined();
    });
  });

  describe('query()', () => {
    it('queries primary provider', async () => {
      await manager.add(makeEntry({ id: 'q1' }));
      await manager.add(makeEntry({ id: 'q2' }));

      const result = await manager.query({ limit: 10 });
      expect(result.total).toBe(2);
    });

    it('returns empty for no providers', async () => {
      const mgr = new MemoryManager();
      const result = await mgr.query();
      expect(result.entries).toHaveLength(0);
    });
  });

  describe('search()', () => {
    it('searches via primary provider', async () => {
      await manager.add(makeEntry({ id: 'sr1', content: 'AI revolution' }));
      await manager.add(makeEntry({ id: 'sr2', content: 'cooking recipe' }));

      const result = await manager.search('revolution');
      expect(result.total).toBe(1);
    });

    it('returns empty for no providers', async () => {
      const mgr = new MemoryManager();
      const result = await mgr.search('anything');
      expect(result.entries).toHaveLength(0);
    });
  });

  describe('delete()', () => {
    it('deletes from all providers', async () => {
      await manager.add(makeEntry({ id: 'del-1' }));
      const deleted = await manager.delete('del-1');
      expect(deleted).toBe(true);
      expect(await provider.get('del-1')).toBeUndefined();
    });

    it('returns false when entry not found', async () => {
      expect(await manager.delete('no-such')).toBe(false);
    });
  });

  describe('clear()', () => {
    it('clears all providers', async () => {
      await manager.add(makeEntry({ id: 'clr-1' }));
      await manager.add(makeEntry({ id: 'clr-2' }));

      const count = await manager.clear();
      expect(count).toBe(2);
      expect(await provider.count()).toBe(0);
    });

    it('clears by namespace', async () => {
      await manager.add(makeEntry({ id: 'cns-1', namespace: MemoryNamespace.AGENT }));
      await manager.add(makeEntry({ id: 'cns-2', namespace: MemoryNamespace.CREW }));

      const count = await manager.clear(MemoryNamespace.AGENT);
      expect(count).toBe(1);
      expect(await provider.count()).toBe(1);
    });
  });

  describe('count()', () => {
    it('returns count from primary provider', async () => {
      await manager.add(makeEntry({ id: 'cnt-1' }));
      await manager.add(makeEntry({ id: 'cnt-2' }));
      expect(await manager.count()).toBe(2);
    });

    it('returns 0 for no providers', async () => {
      const mgr = new MemoryManager();
      expect(await mgr.count()).toBe(0);
    });
  });

  describe('events', () => {
    it('emits memory:add on successful add', async () => {
      const entries: MemoryEntry[] = [];
      manager.on('memory:add', (e) => entries.push(e));

      await manager.add(makeEntry({ id: 'evt-1' }));
      expect(entries).toHaveLength(1);
    });

    it('emits memory:delete on successful delete', async () => {
      const deleted: string[] = [];
      manager.on('memory:delete', (id) => deleted.push(id));

      await manager.add(makeEntry({ id: 'evt-d1' }));
      await manager.delete('evt-d1');
      expect(deleted).toEqual(['evt-d1']);
    });

    it('supports off()', async () => {
      const entries: MemoryEntry[] = [];
      const listener = (e: MemoryEntry) => entries.push(e);

      manager.on('memory:add', listener);
      await manager.add(makeEntry({ id: 'off-1' }));
      manager.off('memory:add', listener);
      await manager.add(makeEntry({ id: 'off-2' }));

      expect(entries).toHaveLength(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Utility function tests
// ---------------------------------------------------------------------------

describe('generateMemoryId()', () => {
  it('returns unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateMemoryId()));
    expect(ids.size).toBe(100);
  });

  it('starts with mem_ prefix', () => {
    expect(generateMemoryId()).toMatch(/^mem_/);
  });
});

describe('createMemoryEntry()', () => {
  it('creates a complete entry with defaults', () => {
    const entry = createMemoryEntry('Hello', MemoryRole.USER);
    expect(entry.content).toBe('Hello');
    expect(entry.role).toBe(MemoryRole.USER);
    expect(entry.namespace).toBe(MemoryNamespace.AGENT);
    expect(entry.id).toMatch(/^mem_/);
    expect(entry.createdAt).toBeTruthy();
    expect(Object.isFrozen(entry)).toBe(true);
  });

  it('accepts custom namespace and metadata', () => {
    const entry = createMemoryEntry(
      'Data',
      MemoryRole.ASSISTANT,
      MemoryNamespace.GLOBAL,
      { source: 'test' },
    );
    expect(entry.namespace).toBe(MemoryNamespace.GLOBAL);
    expect(entry.metadata).toEqual({ source: 'test' });
  });
});
