const fs = require('fs');
const path = require('path');

function writeFile(relPath, content) {
  const fullPath = path.resolve(relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log('wrote:', relPath, '(' + content.length + ' bytes)');
}

// ---- short-term-memory.test.ts ----
writeFile('packages/core/tests/unit/memory/short-term-memory.test.ts', `/**
 * Tests for ShortTermMemory.
 */

import { describe, expect, it, beforeEach } from 'vitest';

import { ShortTermMemory } from '../../../src/memory/short-term-memory.js';
import { MemoryNamespace, MemoryRole } from '../../../src/types/memory.js';
import type { MemoryEntry } from '../../../src/types/memory.js';
import { MemoryConfigError, MemoryOperationError } from '../../../src/errors/memory-errors.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<MemoryEntry> = {}): MemoryEntry {
  return {
    id: overrides.id ?? \`test-\${Date.now()}-\${Math.random().toString(36).slice(2, 6)}\`,
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

describe('ShortTermMemory', () => {
  let memory: ShortTermMemory;

  beforeEach(() => {
    memory = new ShortTermMemory();
  });

  // -----------------------------------------------------------------------
  // Construction
  // -----------------------------------------------------------------------

  describe('constructor', () => {
    it('creates with default config', () => {
      const mem = new ShortTermMemory();
      expect(mem.name).toBe('short-term');
    });

    it('accepts retention config', () => {
      const mem = new ShortTermMemory({
        retention: { maxEntries: 5, maxAge: 60_000 },
      });
      expect(mem.name).toBe('short-term');
    });

    it('accepts custom default namespace', () => {
      const mem = new ShortTermMemory({
        defaultNamespace: MemoryNamespace.CREW,
      });
      expect(mem.name).toBe('short-term');
    });

    it('throws on invalid maxEntries', () => {
      expect(() => new ShortTermMemory({ retention: { maxEntries: -1 } }))
        .toThrow(MemoryConfigError);
    });

    it('throws on non-integer maxEntries', () => {
      expect(() => new ShortTermMemory({ retention: { maxEntries: 1.5 } }))
        .toThrow(MemoryConfigError);
    });

    it('throws on negative maxAge', () => {
      expect(() => new ShortTermMemory({ retention: { maxAge: -100 } }))
        .toThrow(MemoryConfigError);
    });
  });

  // -----------------------------------------------------------------------
  // add()
  // -----------------------------------------------------------------------

  describe('add()', () => {
    it('stores and returns a frozen entry', async () => {
      const entry = makeEntry({ id: 'e1', content: 'test content' });
      const stored = await memory.add(entry);

      expect(stored.id).toBe('e1');
      expect(stored.content).toBe('test content');
      expect(stored.role).toBe(MemoryRole.USER);
      expect(Object.isFrozen(stored)).toBe(true);
    });

    it('rejects duplicate ids', async () => {
      const entry = makeEntry({ id: 'dup' });
      await memory.add(entry);

      await expect(memory.add(makeEntry({ id: 'dup' }))).rejects.toThrow(
        MemoryOperationError,
      );
    });

    it('validates entry fields', async () => {
      await expect(
        memory.add({ ...makeEntry(), id: '' }),
      ).rejects.toThrow(MemoryOperationError);

      await expect(
        memory.add({ ...makeEntry(), content: '' }),
      ).rejects.toThrow(MemoryOperationError);
    });

    it('stores entries with metadata', async () => {
      const entry = makeEntry({
        id: 'meta-1',
        metadata: { agentId: 'researcher', taskId: 'task-1' },
      });
      const stored = await memory.add(entry);
      expect(stored.metadata).toEqual({ agentId: 'researcher', taskId: 'task-1' });
    });
  });

  // -----------------------------------------------------------------------
  // get()
  // -----------------------------------------------------------------------

  describe('get()', () => {
    it('returns stored entry by id', async () => {
      await memory.add(makeEntry({ id: 'g1', content: 'find me' }));
      const entry = await memory.get('g1');
      expect(entry?.content).toBe('find me');
    });

    it('returns undefined for missing id', async () => {
      const entry = await memory.get('nonexistent');
      expect(entry).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // query()
  // -----------------------------------------------------------------------

  describe('query()', () => {
    it('returns all entries sorted newest-first', async () => {
      const t1 = '2024-01-01T00:00:00Z';
      const t2 = '2024-01-02T00:00:00Z';
      const t3 = '2024-01-03T00:00:00Z';

      await memory.add(makeEntry({ id: 'q1', createdAt: t1 }));
      await memory.add(makeEntry({ id: 'q2', createdAt: t2 }));
      await memory.add(makeEntry({ id: 'q3', createdAt: t3 }));

      const result = await memory.query();
      expect(result.entries).toHaveLength(3);
      expect(result.entries[0].id).toBe('q3');
      expect(result.entries[1].id).toBe('q2');
      expect(result.entries[2].id).toBe('q1');
      expect(result.total).toBe(3);
    });

    it('filters by namespace', async () => {
      await memory.add(makeEntry({ id: 'n1', namespace: MemoryNamespace.AGENT }));
      await memory.add(makeEntry({ id: 'n2', namespace: MemoryNamespace.CREW }));
      await memory.add(makeEntry({ id: 'n3', namespace: MemoryNamespace.AGENT }));

      const result = await memory.query({ namespace: MemoryNamespace.AGENT });
      expect(result.total).toBe(2);
      expect(result.entries.every((e) => e.namespace === MemoryNamespace.AGENT)).toBe(true);
    });

    it('respects limit', async () => {
      for (let i = 0; i < 10; i++) {
        await memory.add(makeEntry({ id: \`lim-\${i}\` }));
      }

      const result = await memory.query({ limit: 3 });
      expect(result.entries).toHaveLength(3);
      expect(result.total).toBe(10);
    });

    it('filters by after timestamp', async () => {
      await memory.add(makeEntry({ id: 'a1', createdAt: '2024-01-01T00:00:00Z' }));
      await memory.add(makeEntry({ id: 'a2', createdAt: '2024-06-01T00:00:00Z' }));
      await memory.add(makeEntry({ id: 'a3', createdAt: '2024-12-01T00:00:00Z' }));

      const result = await memory.query({ after: '2024-03-01T00:00:00Z' });
      expect(result.total).toBe(2);
    });

    it('filters by before timestamp', async () => {
      await memory.add(makeEntry({ id: 'b1', createdAt: '2024-01-01T00:00:00Z' }));
      await memory.add(makeEntry({ id: 'b2', createdAt: '2024-06-01T00:00:00Z' }));
      await memory.add(makeEntry({ id: 'b3', createdAt: '2024-12-01T00:00:00Z' }));

      const result = await memory.query({ before: '2024-07-01T00:00:00Z' });
      expect(result.total).toBe(2);
    });

    it('filters by metadata', async () => {
      await memory.add(makeEntry({ id: 'm1', metadata: { agentId: 'a1' } }));
      await memory.add(makeEntry({ id: 'm2', metadata: { agentId: 'a2' } }));
      await memory.add(makeEntry({ id: 'm3', metadata: { agentId: 'a1' } }));

      const result = await memory.query({ metadata: { agentId: 'a1' } });
      expect(result.total).toBe(2);
    });

    it('returns empty result when no entries match', async () => {
      const result = await memory.query({ namespace: MemoryNamespace.GLOBAL });
      expect(result.entries).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // search()
  // -----------------------------------------------------------------------

  describe('search()', () => {
    it('finds entries by substring match (case-insensitive)', async () => {
      await memory.add(makeEntry({ id: 's1', content: 'The weather is sunny' }));
      await memory.add(makeEntry({ id: 's2', content: 'Stock prices are rising' }));
      await memory.add(makeEntry({ id: 's3', content: 'Sunny day for a walk' }));

      const result = await memory.search('sunny');
      expect(result.total).toBe(2);
      expect(result.entries.map((e) => e.id).sort()).toEqual(['s1', 's3']);
    });

    it('returns empty for no matches', async () => {
      await memory.add(makeEntry({ id: 'x1', content: 'Apples and oranges' }));
      const result = await memory.search('bananas');
      expect(result.total).toBe(0);
    });

    it('returns empty for empty search text', async () => {
      await memory.add(makeEntry({ id: 'x2', content: 'Something' }));
      const result = await memory.search('');
      expect(result.total).toBe(0);
    });

    it('combines search with query filters', async () => {
      await memory.add(makeEntry({
        id: 'sf1',
        content: 'Weather in New York',
        namespace: MemoryNamespace.AGENT,
      }));
      await memory.add(makeEntry({
        id: 'sf2',
        content: 'Weather in London',
        namespace: MemoryNamespace.CREW,
      }));

      const result = await memory.search('weather', { namespace: MemoryNamespace.AGENT });
      expect(result.total).toBe(1);
      expect(result.entries[0].id).toBe('sf1');
    });
  });

  // -----------------------------------------------------------------------
  // delete()
  // -----------------------------------------------------------------------

  describe('delete()', () => {
    it('removes an existing entry', async () => {
      await memory.add(makeEntry({ id: 'd1' }));
      const deleted = await memory.delete('d1');
      expect(deleted).toBe(true);
      expect(await memory.get('d1')).toBeUndefined();
    });

    it('returns false for missing entry', async () => {
      const deleted = await memory.delete('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // clear()
  // -----------------------------------------------------------------------

  describe('clear()', () => {
    it('removes all entries when no namespace specified', async () => {
      await memory.add(makeEntry({ id: 'c1', namespace: MemoryNamespace.AGENT }));
      await memory.add(makeEntry({ id: 'c2', namespace: MemoryNamespace.CREW }));

      const count = await memory.clear();
      expect(count).toBe(2);
      expect(await memory.count()).toBe(0);
    });

    it('removes only entries in the specified namespace', async () => {
      await memory.add(makeEntry({ id: 'cn1', namespace: MemoryNamespace.AGENT }));
      await memory.add(makeEntry({ id: 'cn2', namespace: MemoryNamespace.CREW }));
      await memory.add(makeEntry({ id: 'cn3', namespace: MemoryNamespace.AGENT }));

      const count = await memory.clear(MemoryNamespace.AGENT);
      expect(count).toBe(2);
      expect(await memory.count()).toBe(1);
      expect(await memory.get('cn2')).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // count()
  // -----------------------------------------------------------------------

  describe('count()', () => {
    it('returns 0 for empty memory', async () => {
      expect(await memory.count()).toBe(0);
    });

    it('counts all entries', async () => {
      await memory.add(makeEntry({ id: 'cnt1' }));
      await memory.add(makeEntry({ id: 'cnt2' }));
      expect(await memory.count()).toBe(2);
    });

    it('counts entries by namespace', async () => {
      await memory.add(makeEntry({ id: 'ns1', namespace: MemoryNamespace.AGENT }));
      await memory.add(makeEntry({ id: 'ns2', namespace: MemoryNamespace.CREW }));
      await memory.add(makeEntry({ id: 'ns3', namespace: MemoryNamespace.AGENT }));

      expect(await memory.count(MemoryNamespace.AGENT)).toBe(2);
      expect(await memory.count(MemoryNamespace.CREW)).toBe(1);
      expect(await memory.count(MemoryNamespace.GLOBAL)).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Retention policies
  // -----------------------------------------------------------------------

  describe('retention — maxEntries', () => {
    it('evicts oldest entries when maxEntries is exceeded', async () => {
      const mem = new ShortTermMemory({ retention: { maxEntries: 3 } });

      await mem.add(makeEntry({ id: 'r1', createdAt: '2024-01-01T00:00:00Z' }));
      await mem.add(makeEntry({ id: 'r2', createdAt: '2024-01-02T00:00:00Z' }));
      await mem.add(makeEntry({ id: 'r3', createdAt: '2024-01-03T00:00:00Z' }));
      // This should evict r1
      await mem.add(makeEntry({ id: 'r4', createdAt: '2024-01-04T00:00:00Z' }));

      expect(await mem.count()).toBe(3);
      expect(await mem.get('r1')).toBeUndefined();
      expect(await mem.get('r2')).toBeDefined();
      expect(await mem.get('r4')).toBeDefined();
    });

    it('emits evict event when entries are evicted', async () => {
      const mem = new ShortTermMemory({ retention: { maxEntries: 2 } });
      const evicted: MemoryEntry[][] = [];
      mem.on('memory:evict', (entries) => evicted.push([...entries]));

      await mem.add(makeEntry({ id: 'ev1' }));
      await mem.add(makeEntry({ id: 'ev2' }));
      await mem.add(makeEntry({ id: 'ev3' }));

      expect(evicted).toHaveLength(1);
      expect(evicted[0][0].id).toBe('ev1');
    });
  });

  describe('retention — maxAge', () => {
    it('evicts expired entries on add', async () => {
      const mem = new ShortTermMemory({ retention: { maxAge: 60_000 } });

      // Add an entry that's already old
      const oldTime = new Date(Date.now() - 120_000).toISOString();
      await mem.add(makeEntry({ id: 'old1', createdAt: oldTime }));

      // Add a new entry — should trigger eviction of old1
      await mem.add(makeEntry({ id: 'new1' }));

      expect(await mem.get('old1')).toBeUndefined();
      expect(await mem.get('new1')).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // Events
  // -----------------------------------------------------------------------

  describe('events', () => {
    it('emits memory:add on add', async () => {
      const added: MemoryEntry[] = [];
      memory.on('memory:add', (entry) => added.push(entry));

      await memory.add(makeEntry({ id: 'ea1' }));
      expect(added).toHaveLength(1);
      expect(added[0].id).toBe('ea1');
    });

    it('emits memory:delete on delete', async () => {
      const deleted: string[] = [];
      memory.on('memory:delete', (id) => deleted.push(id));

      await memory.add(makeEntry({ id: 'ed1' }));
      await memory.delete('ed1');
      expect(deleted).toEqual(['ed1']);
    });

    it('emits memory:clear on clear', async () => {
      const cleared: [unknown, number][] = [];
      memory.on('memory:clear', (ns, count) => cleared.push([ns, count]));

      await memory.add(makeEntry({ id: 'ec1' }));
      await memory.add(makeEntry({ id: 'ec2' }));
      await memory.clear();

      expect(cleared).toHaveLength(1);
      expect(cleared[0]).toEqual([undefined, 2]);
    });

    it('supports off() to remove listeners', async () => {
      const added: MemoryEntry[] = [];
      const listener = (entry: MemoryEntry) => added.push(entry);

      memory.on('memory:add', listener);
      await memory.add(makeEntry({ id: 'off1' }));
      memory.off('memory:add', listener);
      await memory.add(makeEntry({ id: 'off2' }));

      expect(added).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles maxEntries = 0 (unlimited)', async () => {
      const mem = new ShortTermMemory({ retention: { maxEntries: 0 } });
      for (let i = 0; i < 5; i++) {
        await mem.add(makeEntry({ id: \`unlim-\${i}\` }));
      }
      expect(await mem.count()).toBe(5);
    });

    it('query with all filters combined', async () => {
      await memory.add(makeEntry({
        id: 'combo1',
        namespace: MemoryNamespace.AGENT,
        createdAt: '2024-06-15T00:00:00Z',
        metadata: { tag: 'important' },
      }));
      await memory.add(makeEntry({
        id: 'combo2',
        namespace: MemoryNamespace.AGENT,
        createdAt: '2024-03-01T00:00:00Z',
        metadata: { tag: 'important' },
      }));
      await memory.add(makeEntry({
        id: 'combo3',
        namespace: MemoryNamespace.CREW,
        createdAt: '2024-06-15T00:00:00Z',
        metadata: { tag: 'important' },
      }));

      const result = await memory.query({
        namespace: MemoryNamespace.AGENT,
        after: '2024-05-01T00:00:00Z',
        metadata: { tag: 'important' },
        limit: 10,
      });

      expect(result.total).toBe(1);
      expect(result.entries[0].id).toBe('combo1');
    });
  });
});
`);

console.log('done');