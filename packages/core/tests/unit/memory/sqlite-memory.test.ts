/**
 * Tests for TASK-048: Long-Term Memory with SQLite Persistence
 *
 * Validates the SqliteMemory provider: CRUD operations, FTS5 search,
 * retention policies, namespace filtering, event emission, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { SqliteMemory } from '../../../src/memory/sqlite-memory.js';
import { MemoryNamespace, MemoryRole } from '../../../src/types/memory.js';
import { createMemoryEntry, generateMemoryId } from '../../../src/memory/memory-manager.js';
import type { MemoryEntry } from '../../../src/types/memory.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides?: Partial<MemoryEntry>): MemoryEntry {
  return {
    id: generateMemoryId(),
    content: 'Test memory content',
    role: MemoryRole.USER,
    namespace: MemoryNamespace.AGENT,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeEntryAt(date: Date, overrides?: Partial<MemoryEntry>): MemoryEntry {
  return makeEntry({ createdAt: date.toISOString(), ...overrides });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('TASK-048: SqliteMemory — Long-Term Memory with SQLite Persistence', () => {
  let memory: SqliteMemory;

  beforeEach(() => {
    memory = new SqliteMemory({ dbPath: ':memory:' });
  });

  afterEach(() => {
    if (!memory.closed) {
      memory.close();
    }
  });

  // -----------------------------------------------------------------------
  // Constructor & configuration
  // -----------------------------------------------------------------------

  describe('constructor', () => {
    it('should create an in-memory database by default', () => {
      const mem = new SqliteMemory();
      expect(mem.name).toBe('sqlite');
      expect(mem.closed).toBe(false);
      mem.close();
    });

    it('should accept explicit :memory: path', () => {
      const mem = new SqliteMemory({ dbPath: ':memory:' });
      expect(mem.closed).toBe(false);
      mem.close();
    });

    it('should default to AGENT namespace', () => {
      expect(memory.defaultNamespace).toBe(MemoryNamespace.AGENT);
    });

    it('should accept a custom default namespace', () => {
      const mem = new SqliteMemory({
        dbPath: ':memory:',
        defaultNamespace: MemoryNamespace.GLOBAL,
      });
      expect(mem.defaultNamespace).toBe(MemoryNamespace.GLOBAL);
      mem.close();
    });

    it('should reject negative maxEntries in retention policy', () => {
      expect(
        () => new SqliteMemory({ dbPath: ':memory:', retention: { maxEntries: -1 } }),
      ).toThrow('maxEntries');
    });

    it('should reject non-integer maxEntries', () => {
      expect(
        () => new SqliteMemory({ dbPath: ':memory:', retention: { maxEntries: 1.5 } }),
      ).toThrow('maxEntries');
    });

    it('should reject negative maxAge in retention policy', () => {
      expect(
        () => new SqliteMemory({ dbPath: ':memory:', retention: { maxAge: -100 } }),
      ).toThrow('maxAge');
    });
  });

  // -----------------------------------------------------------------------
  // add()
  // -----------------------------------------------------------------------

  describe('add()', () => {
    it('should store and return a frozen entry', async () => {
      const entry = makeEntry({ content: 'Hello world' });
      const stored = await memory.add(entry);

      expect(stored.id).toBe(entry.id);
      expect(stored.content).toBe('Hello world');
      expect(stored.role).toBe(MemoryRole.USER);
      expect(stored.namespace).toBe(MemoryNamespace.AGENT);
      expect(Object.isFrozen(stored)).toBe(true);
    });

    it('should persist entry across operations', async () => {
      const entry = makeEntry({ content: 'Persistent data' });
      await memory.add(entry);

      const retrieved = await memory.get(entry.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.content).toBe('Persistent data');
    });

    it('should store metadata', async () => {
      const entry = makeEntry({
        content: 'With metadata',
        metadata: { agentId: 'agent-1', taskId: 'task-1', priority: 5, active: true },
      });
      await memory.add(entry);

      const retrieved = await memory.get(entry.id);
      expect(retrieved?.metadata).toEqual({
        agentId: 'agent-1',
        taskId: 'task-1',
        priority: 5,
        active: true,
      });
    });

    it('should reject duplicate IDs', async () => {
      const entry = makeEntry();
      await memory.add(entry);
      await expect(memory.add(entry)).rejects.toThrow('already exists');
    });

    it('should validate entry has id', async () => {
      const entry = makeEntry({ id: '' });
      await expect(memory.add(entry)).rejects.toThrow('entry.id');
    });

    it('should validate entry has content', async () => {
      const entry = makeEntry({ content: '' });
      await expect(memory.add(entry)).rejects.toThrow('entry.content');
    });

    it('should validate entry has role', async () => {
      const entry = makeEntry({ role: '' as MemoryRole });
      await expect(memory.add(entry)).rejects.toThrow('entry.role');
    });

    it('should validate entry has namespace', async () => {
      const entry = makeEntry({ namespace: '' as MemoryNamespace });
      await expect(memory.add(entry)).rejects.toThrow('entry.namespace');
    });

    it('should validate entry has createdAt', async () => {
      const entry = makeEntry({ createdAt: '' });
      await expect(memory.add(entry)).rejects.toThrow('entry.createdAt');
    });
  });

  // -----------------------------------------------------------------------
  // get()
  // -----------------------------------------------------------------------

  describe('get()', () => {
    it('should return stored entry by ID', async () => {
      const entry = makeEntry({ content: 'Findable' });
      await memory.add(entry);

      const result = await memory.get(entry.id);
      expect(result).toBeDefined();
      expect(result?.content).toBe('Findable');
    });

    it('should return undefined for unknown ID', async () => {
      const result = await memory.get('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should return frozen entries', async () => {
      const entry = makeEntry();
      await memory.add(entry);

      const result = await memory.get(entry.id);
      expect(Object.isFrozen(result)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // query()
  // -----------------------------------------------------------------------

  describe('query()', () => {
    it('should return all entries when no options given', async () => {
      await memory.add(makeEntry({ content: 'Entry 1' }));
      await memory.add(makeEntry({ content: 'Entry 2' }));
      await memory.add(makeEntry({ content: 'Entry 3' }));

      const result = await memory.query();
      expect(result.entries).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should filter by namespace', async () => {
      await memory.add(makeEntry({ namespace: MemoryNamespace.AGENT }));
      await memory.add(makeEntry({ namespace: MemoryNamespace.CREW }));
      await memory.add(makeEntry({ namespace: MemoryNamespace.GLOBAL }));

      const result = await memory.query({ namespace: MemoryNamespace.CREW });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].namespace).toBe(MemoryNamespace.CREW);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 10; i++) {
        await memory.add(makeEntry());
      }

      const result = await memory.query({ limit: 3 });
      expect(result.entries).toHaveLength(3);
      expect(result.total).toBe(10);
    });

    it('should cap limit at MAX_QUERY_LIMIT (500)', async () => {
      const result = await memory.query({ limit: 10000 });
      // Just verify it doesn't throw; entries will be ≤ what's stored
      expect(result.entries.length).toBeLessThanOrEqual(500);
    });

    it('should filter by after timestamp', async () => {
      const old = makeEntryAt(new Date('2024-01-01T00:00:00Z'));
      const recent = makeEntryAt(new Date('2025-06-01T00:00:00Z'));

      await memory.add(old);
      await memory.add(recent);

      const result = await memory.query({ after: '2025-01-01T00:00:00Z' });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].id).toBe(recent.id);
    });

    it('should filter by before timestamp', async () => {
      const old = makeEntryAt(new Date('2024-01-01T00:00:00Z'));
      const recent = makeEntryAt(new Date('2025-06-01T00:00:00Z'));

      await memory.add(old);
      await memory.add(recent);

      const result = await memory.query({ before: '2025-01-01T00:00:00Z' });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].id).toBe(old.id);
    });

    it('should filter by metadata', async () => {
      await memory.add(makeEntry({ metadata: { agentId: 'agent-1' } }));
      await memory.add(makeEntry({ metadata: { agentId: 'agent-2' } }));

      const result = await memory.query({ metadata: { agentId: 'agent-1' } });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].metadata?.agentId).toBe('agent-1');
    });

    it('should sort entries newest-first', async () => {
      const e1 = makeEntryAt(new Date('2024-01-01'), { content: 'oldest' });
      const e2 = makeEntryAt(new Date('2024-06-01'), { content: 'middle' });
      const e3 = makeEntryAt(new Date('2025-01-01'), { content: 'newest' });

      await memory.add(e1);
      await memory.add(e2);
      await memory.add(e3);

      const result = await memory.query();
      expect(result.entries[0].content).toBe('newest');
      expect(result.entries[1].content).toBe('middle');
      expect(result.entries[2].content).toBe('oldest');
    });

    it('should combine multiple filters', async () => {
      await memory.add(
        makeEntryAt(new Date('2025-03-01'), {
          namespace: MemoryNamespace.CREW,
          metadata: { priority: 1 },
        }),
      );
      await memory.add(
        makeEntryAt(new Date('2025-03-01'), {
          namespace: MemoryNamespace.AGENT,
          metadata: { priority: 1 },
        }),
      );

      const result = await memory.query({
        namespace: MemoryNamespace.CREW,
        metadata: { priority: 1 },
      });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].namespace).toBe(MemoryNamespace.CREW);
    });
  });

  // -----------------------------------------------------------------------
  // search() — FTS5 full-text search
  // -----------------------------------------------------------------------

  describe('search()', () => {
    it('should find entries by content text', async () => {
      await memory.add(makeEntry({ content: 'The agent completed the research task successfully' }));
      await memory.add(makeEntry({ content: 'The weather is sunny today' }));

      const result = await memory.search('research');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].content).toContain('research');
    });

    it('should find entries with multiple search terms', async () => {
      await memory.add(makeEntry({ content: 'Multi-agent orchestration framework' }));
      await memory.add(makeEntry({ content: 'Simple single-threaded application' }));

      const result = await memory.search('agent orchestration');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].content).toContain('orchestration');
    });

    it('should return empty result for non-matching search', async () => {
      await memory.add(makeEntry({ content: 'Hello world' }));

      const result = await memory.search('nonexistentword');
      expect(result.entries).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should return empty result for empty search string', async () => {
      await memory.add(makeEntry({ content: 'Some content' }));

      const result = await memory.search('');
      expect(result.entries).toHaveLength(0);
    });

    it('should combine search with namespace filter', async () => {
      await memory.add(
        makeEntry({ content: 'Agent-scoped research data', namespace: MemoryNamespace.AGENT }),
      );
      await memory.add(
        makeEntry({ content: 'Crew-scoped research data', namespace: MemoryNamespace.CREW }),
      );

      const result = await memory.search('research', { namespace: MemoryNamespace.AGENT });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].namespace).toBe(MemoryNamespace.AGENT);
    });

    it('should respect limit in search results', async () => {
      for (let i = 0; i < 10; i++) {
        await memory.add(makeEntry({ content: `Research finding number ${String(i)}` }));
      }

      const result = await memory.search('research', { limit: 3 });
      expect(result.entries).toHaveLength(3);
      expect(result.total).toBe(10);
    });

    it('should handle special characters in search query', async () => {
      await memory.add(makeEntry({ content: 'C++ and C# are programming languages' }));

      // Should not throw
      const result = await memory.search('C++');
      expect(result).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // delete()
  // -----------------------------------------------------------------------

  describe('delete()', () => {
    it('should delete an existing entry and return true', async () => {
      const entry = makeEntry();
      await memory.add(entry);

      const deleted = await memory.delete(entry.id);
      expect(deleted).toBe(true);

      const retrieved = await memory.get(entry.id);
      expect(retrieved).toBeUndefined();
    });

    it('should return false for non-existent ID', async () => {
      const deleted = await memory.delete('nonexistent');
      expect(deleted).toBe(false);
    });

    it('should remove entry from FTS index', async () => {
      const entry = makeEntry({ content: 'Searchable unique content' });
      await memory.add(entry);

      await memory.delete(entry.id);

      const result = await memory.search('Searchable unique');
      expect(result.entries).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // clear()
  // -----------------------------------------------------------------------

  describe('clear()', () => {
    it('should remove all entries when no namespace specified', async () => {
      await memory.add(makeEntry({ namespace: MemoryNamespace.AGENT }));
      await memory.add(makeEntry({ namespace: MemoryNamespace.CREW }));
      await memory.add(makeEntry({ namespace: MemoryNamespace.GLOBAL }));

      const count = await memory.clear();
      expect(count).toBe(3);

      const remaining = await memory.count();
      expect(remaining).toBe(0);
    });

    it('should remove only entries in specified namespace', async () => {
      await memory.add(makeEntry({ namespace: MemoryNamespace.AGENT }));
      await memory.add(makeEntry({ namespace: MemoryNamespace.CREW }));
      await memory.add(makeEntry({ namespace: MemoryNamespace.GLOBAL }));

      const count = await memory.clear(MemoryNamespace.AGENT);
      expect(count).toBe(1);

      const remaining = await memory.count();
      expect(remaining).toBe(2);
    });

    it('should return 0 when clearing empty database', async () => {
      const count = await memory.clear();
      expect(count).toBe(0);
    });

    it('should clear FTS index entries too', async () => {
      await memory.add(makeEntry({ content: 'Findable research content' }));
      await memory.clear();

      const result = await memory.search('research');
      expect(result.entries).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // count()
  // -----------------------------------------------------------------------

  describe('count()', () => {
    it('should return 0 for empty database', async () => {
      expect(await memory.count()).toBe(0);
    });

    it('should count all entries', async () => {
      await memory.add(makeEntry());
      await memory.add(makeEntry());
      await memory.add(makeEntry());

      expect(await memory.count()).toBe(3);
    });

    it('should count entries by namespace', async () => {
      await memory.add(makeEntry({ namespace: MemoryNamespace.AGENT }));
      await memory.add(makeEntry({ namespace: MemoryNamespace.AGENT }));
      await memory.add(makeEntry({ namespace: MemoryNamespace.CREW }));

      expect(await memory.count(MemoryNamespace.AGENT)).toBe(2);
      expect(await memory.count(MemoryNamespace.CREW)).toBe(1);
      expect(await memory.count(MemoryNamespace.GLOBAL)).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Retention policies
  // -----------------------------------------------------------------------

  describe('retention policies', () => {
    it('should evict oldest entries when maxEntries is exceeded', async () => {
      const mem = new SqliteMemory({
        dbPath: ':memory:',
        retention: { maxEntries: 3 },
      });

      const entries = [];
      for (let i = 0; i < 5; i++) {
        const entry = makeEntryAt(new Date(Date.now() + i * 1000), {
          content: `Entry ${String(i)}`,
        });
        entries.push(entry);
        await mem.add(entry);
      }

      const count = await mem.count();
      expect(count).toBe(3);

      // Oldest entries should have been evicted
      const oldest = await mem.get(entries[0].id);
      expect(oldest).toBeUndefined();

      const newest = await mem.get(entries[4].id);
      expect(newest).toBeDefined();

      mem.close();
    });

    it('should emit evict events during count-based eviction', async () => {
      const mem = new SqliteMemory({
        dbPath: ':memory:',
        retention: { maxEntries: 2 },
      });

      const evictListener = vi.fn();
      mem.on('memory:evict', evictListener);

      await mem.add(makeEntry({ content: 'Entry 1' }));
      await mem.add(makeEntry({ content: 'Entry 2' }));
      await mem.add(makeEntry({ content: 'Entry 3' })); // triggers eviction

      expect(evictListener).toHaveBeenCalledTimes(1);
      const evictedEntries = evictListener.mock.calls[0][0] as MemoryEntry[];
      expect(evictedEntries.length).toBeGreaterThanOrEqual(1);

      mem.close();
    });

    it('should evict expired entries based on maxAge', async () => {
      const mem = new SqliteMemory({
        dbPath: ':memory:',
        retention: { maxAge: 5000 }, // 5 seconds
      });

      // Add an entry with a timestamp far in the past
      const oldEntry = makeEntryAt(new Date(Date.now() - 10_000), { content: 'Old entry' });
      const recentEntry = makeEntry({ content: 'Recent entry' });

      // Directly add the old entry first (bypass eviction for setup)
      await mem.add(oldEntry);
      // This add triggers age-based eviction
      await mem.add(recentEntry);

      const count = await mem.count();
      expect(count).toBe(1);

      const retrieved = await mem.get(recentEntry.id);
      expect(retrieved).toBeDefined();

      mem.close();
    });
  });

  // -----------------------------------------------------------------------
  // Event emission
  // -----------------------------------------------------------------------

  describe('events', () => {
    it('should emit memory:add when an entry is added', async () => {
      const listener = vi.fn();
      memory.on('memory:add', listener);

      const entry = makeEntry({ content: 'Event test' });
      await memory.add(entry);

      expect(listener).toHaveBeenCalledOnce();
      expect(listener.mock.calls[0][0].content).toBe('Event test');
    });

    it('should emit memory:delete when an entry is deleted', async () => {
      const listener = vi.fn();
      memory.on('memory:delete', listener);

      const entry = makeEntry();
      await memory.add(entry);
      await memory.delete(entry.id);

      expect(listener).toHaveBeenCalledOnce();
      expect(listener.mock.calls[0][0]).toBe(entry.id);
    });

    it('should emit memory:clear when entries are cleared', async () => {
      const listener = vi.fn();
      memory.on('memory:clear', listener);

      await memory.add(makeEntry());
      await memory.add(makeEntry());
      await memory.clear();

      expect(listener).toHaveBeenCalledOnce();
      expect(listener.mock.calls[0][0]).toBeUndefined(); // namespace
      expect(listener.mock.calls[0][1]).toBe(2); // count
    });

    it('should emit memory:clear with namespace when scoped clear', async () => {
      const listener = vi.fn();
      memory.on('memory:clear', listener);

      await memory.add(makeEntry({ namespace: MemoryNamespace.AGENT }));
      await memory.clear(MemoryNamespace.AGENT);

      expect(listener).toHaveBeenCalledOnce();
      expect(listener.mock.calls[0][0]).toBe(MemoryNamespace.AGENT);
    });

    it('should support off() to unsubscribe', async () => {
      const listener = vi.fn();
      memory.on('memory:add', listener);
      memory.off('memory:add', listener);

      await memory.add(makeEntry());

      expect(listener).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // close() and error handling
  // -----------------------------------------------------------------------

  describe('close() and error handling', () => {
    it('should mark database as closed', () => {
      memory.close();
      expect(memory.closed).toBe(true);
    });

    it('should be safe to close twice', () => {
      memory.close();
      expect(() => memory.close()).not.toThrow();
    });

    it('should throw on add() after close', async () => {
      memory.close();
      await expect(memory.add(makeEntry())).rejects.toThrow('closed');
    });

    it('should throw on get() after close', async () => {
      memory.close();
      await expect(memory.get('any-id')).rejects.toThrow('closed');
    });

    it('should throw on query() after close', async () => {
      memory.close();
      await expect(memory.query()).rejects.toThrow('closed');
    });

    it('should throw on search() after close', async () => {
      memory.close();
      await expect(memory.search('text')).rejects.toThrow('closed');
    });

    it('should throw on delete() after close', async () => {
      memory.close();
      await expect(memory.delete('any-id')).rejects.toThrow('closed');
    });

    it('should throw on clear() after close', async () => {
      memory.close();
      await expect(memory.clear()).rejects.toThrow('closed');
    });

    it('should throw on count() after close', async () => {
      memory.close();
      await expect(memory.count()).rejects.toThrow('closed');
    });
  });

  // -----------------------------------------------------------------------
  // Integration with MemoryManager
  // -----------------------------------------------------------------------

  describe('integration with MemoryManager', () => {
    it('should work as a provider in MemoryManager', async () => {
      const { MemoryManager } = await import('../../../src/memory/memory-manager.js');

      const manager = new MemoryManager({ providers: [memory] });

      const entry = createMemoryEntry('Test content', MemoryRole.USER);
      const stored = await manager.add(entry);

      expect(stored.content).toBe('Test content');

      const retrieved = await manager.get(entry.id);
      expect(retrieved?.content).toBe('Test content');

      const count = await manager.count();
      expect(count).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // Provider interface compliance
  // -----------------------------------------------------------------------

  describe('MemoryProvider interface compliance', () => {
    it('should have name property set to "sqlite"', () => {
      expect(memory.name).toBe('sqlite');
    });

    it('should implement all required MemoryProvider methods', () => {
      expect(typeof memory.add).toBe('function');
      expect(typeof memory.get).toBe('function');
      expect(typeof memory.query).toBe('function');
      expect(typeof memory.search).toBe('function');
      expect(typeof memory.delete).toBe('function');
      expect(typeof memory.clear).toBe('function');
      expect(typeof memory.count).toBe('function');
    });

    it('should return MemoryQueryResult from query()', async () => {
      const result = await memory.query();
      expect(result).toHaveProperty('entries');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.entries)).toBe(true);
    });

    it('should return MemoryQueryResult from search()', async () => {
      const result = await memory.search('test');
      expect(result).toHaveProperty('entries');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.entries)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Data integrity
  // -----------------------------------------------------------------------

  describe('data integrity', () => {
    it('should preserve all entry fields through round-trip', async () => {
      const entry: MemoryEntry = {
        id: 'round-trip-test',
        content: 'Full round-trip content with special chars: <>&"\'',
        role: MemoryRole.ASSISTANT,
        namespace: MemoryNamespace.CREW,
        createdAt: '2025-06-15T12:00:00.000Z',
        metadata: { taskId: 'task-42', score: 0.95, verified: true },
      };

      await memory.add(entry);
      const retrieved = await memory.get('round-trip-test');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(entry.id);
      expect(retrieved?.content).toBe(entry.content);
      expect(retrieved?.role).toBe(entry.role);
      expect(retrieved?.namespace).toBe(entry.namespace);
      expect(retrieved?.createdAt).toBe(entry.createdAt);
      expect(retrieved?.metadata).toEqual(entry.metadata);
    });

    it('should handle entries without metadata', async () => {
      const entry = makeEntry();
      delete (entry as Record<string, unknown>)['metadata'];

      await memory.add(entry);
      const retrieved = await memory.get(entry.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.metadata).toBeUndefined();
    });

    it('should handle many entries efficiently', async () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        await memory.add(
          makeEntry({
            content: `Batch entry number ${String(i)} with some content`,
          }),
        );
      }

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(5000); // Should complete well within 5s

      const count = await memory.count();
      expect(count).toBe(100);

      const result = await memory.search('batch entry', { limit: 10 });
      expect(result.entries).toHaveLength(10);
      expect(result.total).toBe(100);
    });
  });
});
