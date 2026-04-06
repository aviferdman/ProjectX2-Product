/**
 * Tests for the memory search and query API enhancements.
 *
 * Covers:
 * - Enhanced MemoryQueryOptions (role, roles, offset, sortOrder)
 * - MemorySearchBuilder fluent API
 * - Integration with ShortTermMemory
 */

import { describe, expect, it, beforeEach } from 'vitest';

import { ShortTermMemory } from '../../../src/memory/short-term-memory.js';
import { MemorySearchBuilder } from '../../../src/memory/memory-search-builder.js';
import { MemoryNamespace, MemoryRole } from '../../../src/types/memory.js';
import type { MemoryEntry } from '../../../src/types/memory.js';
import { MemoryQueryError } from '../../../src/errors/memory-errors.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _seq = 0;

function makeEntry(overrides: Partial<MemoryEntry> = {}): MemoryEntry {
  _seq++;
  return {
    id: overrides.id ?? `test-${_seq}-${Math.random().toString(36).slice(2, 6)}`,
    content: overrides.content ?? 'Hello world',
    role: overrides.role ?? MemoryRole.USER,
    namespace: overrides.namespace ?? MemoryNamespace.AGENT,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    ...(overrides.metadata !== undefined && { metadata: overrides.metadata }),
  };
}

/** Seed memory with entries at known timestamps for deterministic ordering. */
async function seedEntries(memory: ShortTermMemory): Promise<MemoryEntry[]> {
  const base = new Date('2024-06-01T00:00:00Z');
  const entries: MemoryEntry[] = [];

  const configs = [
    { role: MemoryRole.USER, namespace: MemoryNamespace.AGENT, content: 'User message 1', minutes: 0 },
    { role: MemoryRole.ASSISTANT, namespace: MemoryNamespace.AGENT, content: 'Assistant reply 1', minutes: 1 },
    { role: MemoryRole.SYSTEM, namespace: MemoryNamespace.CREW, content: 'System prompt', minutes: 2 },
    { role: MemoryRole.USER, namespace: MemoryNamespace.AGENT, content: 'User message 2', minutes: 3 },
    { role: MemoryRole.TOOL, namespace: MemoryNamespace.GLOBAL, content: 'Tool result', minutes: 4 },
    { role: MemoryRole.ASSISTANT, namespace: MemoryNamespace.AGENT, content: 'Assistant reply 2', minutes: 5 },
    { role: MemoryRole.USER, namespace: MemoryNamespace.CREW, content: 'User message 3', minutes: 6 },
    { role: MemoryRole.SYSTEM, namespace: MemoryNamespace.GLOBAL, content: 'Global system note', minutes: 7 },
  ];

  for (const cfg of configs) {
    const ts = new Date(base.getTime() + cfg.minutes * 60_000);
    const entry = makeEntry({
      role: cfg.role,
      namespace: cfg.namespace,
      content: cfg.content,
      createdAt: ts.toISOString(),
    });
    entries.push(await memory.add(entry));
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Enhanced MemoryQueryOptions tests
// ---------------------------------------------------------------------------

describe('Enhanced MemoryQueryOptions', () => {
  let memory: ShortTermMemory;
  let seeded: MemoryEntry[];

  beforeEach(async () => {
    _seq = 0;
    memory = new ShortTermMemory({ retention: { maxEntries: 100 } });
    seeded = await seedEntries(memory);
  });

  // -----------------------------------------------------------------------
  // Role filtering
  // -----------------------------------------------------------------------

  describe('role filter', () => {
    it('filters by a single role', async () => {
      const result = await memory.query({ role: MemoryRole.USER });
      expect(result.total).toBe(3);
      expect(result.entries).toHaveLength(3);
      for (const entry of result.entries) {
        expect(entry.role).toBe(MemoryRole.USER);
      }
    });

    it('filters by assistant role', async () => {
      const result = await memory.query({ role: MemoryRole.ASSISTANT });
      expect(result.total).toBe(2);
      for (const entry of result.entries) {
        expect(entry.role).toBe(MemoryRole.ASSISTANT);
      }
    });

    it('filters by tool role', async () => {
      const result = await memory.query({ role: MemoryRole.TOOL });
      expect(result.total).toBe(1);
      expect(result.entries[0].role).toBe(MemoryRole.TOOL);
    });

    it('returns empty for role with no matches', async () => {
      // Clear and add only USER entries
      await memory.clear();
      await memory.add(makeEntry({ role: MemoryRole.USER, createdAt: new Date().toISOString() }));
      const result = await memory.query({ role: MemoryRole.TOOL });
      expect(result.total).toBe(0);
      expect(result.entries).toHaveLength(0);
    });
  });

  describe('roles filter (multiple)', () => {
    it('filters by multiple roles', async () => {
      const result = await memory.query({ roles: [MemoryRole.USER, MemoryRole.ASSISTANT] });
      expect(result.total).toBe(5); // 3 user + 2 assistant
      for (const entry of result.entries) {
        expect([MemoryRole.USER, MemoryRole.ASSISTANT]).toContain(entry.role);
      }
    });

    it('roles takes precedence over role', async () => {
      const result = await memory.query({
        role: MemoryRole.TOOL, // should be ignored
        roles: [MemoryRole.SYSTEM],
      });
      expect(result.total).toBe(2); // 2 system entries
      for (const entry of result.entries) {
        expect(entry.role).toBe(MemoryRole.SYSTEM);
      }
    });

    it('handles single-element roles array', async () => {
      const result = await memory.query({ roles: [MemoryRole.TOOL] });
      expect(result.total).toBe(1);
      expect(result.entries[0].role).toBe(MemoryRole.TOOL);
    });

    it('handles empty roles array (no filter applied)', async () => {
      const result = await memory.query({ roles: [] });
      expect(result.total).toBe(8); // all entries
    });
  });

  // -----------------------------------------------------------------------
  // Offset / pagination
  // -----------------------------------------------------------------------

  describe('offset', () => {
    it('skips entries with offset', async () => {
      const all = await memory.query({ limit: 100 });
      const withOffset = await memory.query({ limit: 100, offset: 3 });

      expect(withOffset.total).toBe(all.total); // total count unchanged
      expect(withOffset.entries).toHaveLength(all.total - 3);
      expect(withOffset.entries[0].id).toBe(all.entries[3].id);
    });

    it('offset 0 returns from the start', async () => {
      const noOffset = await memory.query({ limit: 100 });
      const zeroOffset = await memory.query({ limit: 100, offset: 0 });

      expect(zeroOffset.entries).toHaveLength(noOffset.entries.length);
      expect(zeroOffset.entries[0].id).toBe(noOffset.entries[0].id);
    });

    it('offset beyond total returns empty entries', async () => {
      const result = await memory.query({ offset: 100 });
      expect(result.total).toBe(8);
      expect(result.entries).toHaveLength(0);
    });

    it('offset + limit for pagination', async () => {
      const page1 = await memory.query({ limit: 3, offset: 0 });
      const page2 = await memory.query({ limit: 3, offset: 3 });
      const page3 = await memory.query({ limit: 3, offset: 6 });

      expect(page1.entries).toHaveLength(3);
      expect(page2.entries).toHaveLength(3);
      expect(page3.entries).toHaveLength(2); // only 2 remaining

      // All entries are unique (no overlap)
      const allIds = [...page1.entries, ...page2.entries, ...page3.entries].map(e => e.id);
      expect(new Set(allIds).size).toBe(8);
    });
  });

  // -----------------------------------------------------------------------
  // Sort order
  // -----------------------------------------------------------------------

  describe('sortOrder', () => {
    it('defaults to descending (newest first)', async () => {
      const result = await memory.query({ limit: 100 });
      for (let i = 1; i < result.entries.length; i++) {
        const prev = new Date(result.entries[i - 1].createdAt).getTime();
        const curr = new Date(result.entries[i].createdAt).getTime();
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });

    it('sorts ascending (oldest first)', async () => {
      const result = await memory.query({ limit: 100, sortOrder: 'asc' });
      for (let i = 1; i < result.entries.length; i++) {
        const prev = new Date(result.entries[i - 1].createdAt).getTime();
        const curr = new Date(result.entries[i].createdAt).getTime();
        expect(prev).toBeLessThanOrEqual(curr);
      }
      // First entry should be the oldest
      expect(result.entries[0].content).toBe('User message 1');
    });

    it('descending explicitly matches default', async () => {
      const defaultOrder = await memory.query({ limit: 100 });
      const descExplicit = await memory.query({ limit: 100, sortOrder: 'desc' });

      expect(descExplicit.entries.map(e => e.id)).toEqual(defaultOrder.entries.map(e => e.id));
    });
  });

  // -----------------------------------------------------------------------
  // Combined filters
  // -----------------------------------------------------------------------

  describe('combined filters', () => {
    it('role + namespace', async () => {
      const result = await memory.query({
        role: MemoryRole.USER,
        namespace: MemoryNamespace.AGENT,
      });
      expect(result.total).toBe(2);
      for (const entry of result.entries) {
        expect(entry.role).toBe(MemoryRole.USER);
        expect(entry.namespace).toBe(MemoryNamespace.AGENT);
      }
    });

    it('roles + sortOrder + limit + offset', async () => {
      const result = await memory.query({
        roles: [MemoryRole.USER, MemoryRole.ASSISTANT],
        sortOrder: 'asc',
        limit: 2,
        offset: 1,
      });
      expect(result.total).toBe(5);
      expect(result.entries).toHaveLength(2);
      // Sorted ascending, offset 1 skips the first user message
      expect(result.entries[0].content).toBe('Assistant reply 1');
      expect(result.entries[1].content).toBe('User message 2');
    });

    it('role + after + before', async () => {
      const result = await memory.query({
        role: MemoryRole.USER,
        after: '2024-06-01T00:01:30Z', // after minute 1.5
        before: '2024-06-01T00:06:30Z', // before minute 6.5
      });
      // Should match User message 2 (min 3) and User message 3 (min 6)
      expect(result.total).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // Search with new options
  // -----------------------------------------------------------------------

  describe('search with new options', () => {
    it('search with role filter', async () => {
      const result = await memory.search('message', { role: MemoryRole.USER });
      expect(result.total).toBe(3);
      for (const entry of result.entries) {
        expect(entry.role).toBe(MemoryRole.USER);
        expect(entry.content.toLowerCase()).toContain('message');
      }
    });

    it('search with offset', async () => {
      const all = await memory.search('message', { limit: 100 });
      const page2 = await memory.search('message', { limit: 100, offset: 1 });

      expect(page2.total).toBe(all.total);
      expect(page2.entries).toHaveLength(all.entries.length - 1);
    });

    it('search with ascending sort', async () => {
      const result = await memory.search('reply', { sortOrder: 'asc', limit: 100 });
      expect(result.total).toBe(2);
      expect(result.entries[0].content).toBe('Assistant reply 1');
      expect(result.entries[1].content).toBe('Assistant reply 2');
    });
  });
});

// ---------------------------------------------------------------------------
// MemorySearchBuilder tests
// ---------------------------------------------------------------------------

describe('MemorySearchBuilder', () => {
  let memory: ShortTermMemory;
  let seeded: MemoryEntry[];

  beforeEach(async () => {
    _seq = 0;
    memory = new ShortTermMemory({ retention: { maxEntries: 100 } });
    seeded = await seedEntries(memory);
  });

  describe('construction', () => {
    it('creates a builder for a provider', () => {
      const builder = new MemorySearchBuilder(memory);
      expect(builder).toBeInstanceOf(MemorySearchBuilder);
    });
  });

  describe('build()', () => {
    it('returns empty options by default', () => {
      const options = new MemorySearchBuilder(memory).build();
      expect(options).toEqual({});
    });

    it('builds options with all fields set', () => {
      const options = new MemorySearchBuilder(memory)
        .inNamespace(MemoryNamespace.AGENT)
        .withRole(MemoryRole.USER)
        .after('2024-01-01T00:00:00Z')
        .before('2024-12-31T23:59:59Z')
        .withMetadata({ tag: 'important' })
        .limit(10)
        .offset(5)
        .ascending()
        .build();

      expect(options).toEqual({
        namespace: MemoryNamespace.AGENT,
        role: MemoryRole.USER,
        after: '2024-01-01T00:00:00Z',
        before: '2024-12-31T23:59:59Z',
        metadata: { tag: 'important' },
        limit: 10,
        offset: 5,
        sortOrder: 'asc',
      });
    });

    it('withRoles clears single role', () => {
      const options = new MemorySearchBuilder(memory)
        .withRole(MemoryRole.USER)
        .withRoles([MemoryRole.ASSISTANT, MemoryRole.SYSTEM])
        .build();

      expect(options.roles).toEqual([MemoryRole.ASSISTANT, MemoryRole.SYSTEM]);
      expect(options.role).toBeUndefined();
    });

    it('withRole clears multi-roles', () => {
      const options = new MemorySearchBuilder(memory)
        .withRoles([MemoryRole.ASSISTANT, MemoryRole.SYSTEM])
        .withRole(MemoryRole.USER)
        .build();

      expect(options.role).toBe(MemoryRole.USER);
      expect(options.roles).toBeUndefined();
    });

    it('descending() sets sort order', () => {
      const options = new MemorySearchBuilder(memory)
        .ascending()
        .descending() // override
        .build();

      expect(options.sortOrder).toBe('desc');
    });
  });

  describe('execute()', () => {
    it('runs a basic query', async () => {
      const result = await new MemorySearchBuilder(memory).execute();
      expect(result.total).toBe(8);
    });

    it('filters by namespace', async () => {
      const result = await new MemorySearchBuilder(memory)
        .inNamespace(MemoryNamespace.AGENT)
        .execute();

      expect(result.total).toBe(4);
      for (const entry of result.entries) {
        expect(entry.namespace).toBe(MemoryNamespace.AGENT);
      }
    });

    it('filters by role', async () => {
      const result = await new MemorySearchBuilder(memory)
        .withRole(MemoryRole.ASSISTANT)
        .execute();

      expect(result.total).toBe(2);
      for (const entry of result.entries) {
        expect(entry.role).toBe(MemoryRole.ASSISTANT);
      }
    });

    it('filters by multiple roles', async () => {
      const result = await new MemorySearchBuilder(memory)
        .withRoles([MemoryRole.USER, MemoryRole.TOOL])
        .execute();

      expect(result.total).toBe(4); // 3 user + 1 tool
    });

    it('paginates with limit + offset', async () => {
      const page1 = await new MemorySearchBuilder(memory)
        .limit(3)
        .offset(0)
        .execute();

      const page2 = await new MemorySearchBuilder(memory)
        .limit(3)
        .offset(3)
        .execute();

      expect(page1.entries).toHaveLength(3);
      expect(page2.entries).toHaveLength(3);

      const allIds = [...page1.entries, ...page2.entries].map(e => e.id);
      expect(new Set(allIds).size).toBe(6); // no overlaps
    });

    it('sorts ascending', async () => {
      const result = await new MemorySearchBuilder(memory)
        .ascending()
        .limit(100)
        .execute();

      for (let i = 1; i < result.entries.length; i++) {
        const prev = new Date(result.entries[i - 1].createdAt).getTime();
        const curr = new Date(result.entries[i].createdAt).getTime();
        expect(prev).toBeLessThanOrEqual(curr);
      }
    });

    it('combines namespace + role + time range', async () => {
      const result = await new MemorySearchBuilder(memory)
        .inNamespace(MemoryNamespace.AGENT)
        .withRole(MemoryRole.USER)
        .after('2024-06-01T00:02:00Z')
        .execute();

      expect(result.total).toBe(1); // User message 2 (minute 3)
      expect(result.entries[0].content).toBe('User message 2');
    });
  });

  describe('search()', () => {
    it('searches by text', async () => {
      const result = await new MemorySearchBuilder(memory)
        .search('reply');

      expect(result.total).toBe(2);
      for (const entry of result.entries) {
        expect(entry.content.toLowerCase()).toContain('reply');
      }
    });

    it('searches with role filter', async () => {
      const result = await new MemorySearchBuilder(memory)
        .withRole(MemoryRole.ASSISTANT)
        .search('reply');

      expect(result.total).toBe(2);
    });

    it('searches with namespace filter', async () => {
      const result = await new MemorySearchBuilder(memory)
        .inNamespace(MemoryNamespace.AGENT)
        .search('message');

      expect(result.total).toBe(2); // User message 1, User message 2
    });

    it('searches with ascending sort', async () => {
      const result = await new MemorySearchBuilder(memory)
        .ascending()
        .limit(100)
        .search('reply');

      expect(result.entries[0].content).toBe('Assistant reply 1');
      expect(result.entries[1].content).toBe('Assistant reply 2');
    });

    it('searches with pagination', async () => {
      const all = await new MemorySearchBuilder(memory)
        .limit(100)
        .search('message');

      const page = await new MemorySearchBuilder(memory)
        .limit(1)
        .offset(1)
        .search('message');

      expect(page.total).toBe(all.total);
      expect(page.entries).toHaveLength(1);
      expect(page.entries[0].id).toBe(all.entries[1].id);
    });
  });

  describe('error handling', () => {
    it('wraps provider errors in MemoryQueryError on execute', async () => {
      // Create a mock provider that throws
      const badProvider = {
        name: 'bad',
        add: async () => { throw new Error('fail'); },
        get: async () => undefined,
        query: async () => { throw new Error('query failed'); },
        search: async () => { throw new Error('search failed'); },
        delete: async () => false,
        clear: async () => 0,
        count: async () => 0,
      };

      await expect(
        new MemorySearchBuilder(badProvider).execute()
      ).rejects.toThrow(MemoryQueryError);
    });

    it('wraps provider errors in MemoryQueryError on search', async () => {
      const badProvider = {
        name: 'bad',
        add: async () => { throw new Error('fail'); },
        get: async () => undefined,
        query: async () => { throw new Error('query failed'); },
        search: async () => { throw new Error('search failed'); },
        delete: async () => false,
        clear: async () => 0,
        count: async () => 0,
      };

      await expect(
        new MemorySearchBuilder(badProvider).search('test')
      ).rejects.toThrow(MemoryQueryError);
    });

    it('passes through MemoryQueryError without wrapping', async () => {
      const original = new MemoryQueryError('test', 'original error');
      const badProvider = {
        name: 'bad',
        add: async () => { throw new Error('fail'); },
        get: async () => undefined,
        query: async () => { throw original; },
        search: async () => { throw original; },
        delete: async () => false,
        clear: async () => 0,
        count: async () => 0,
      };

      try {
        await new MemorySearchBuilder(badProvider).execute();
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBe(original); // exact same instance
      }
    });
  });

  describe('chaining', () => {
    it('all methods return this for chaining', () => {
      const builder = new MemorySearchBuilder(memory);
      const result = builder
        .inNamespace(MemoryNamespace.AGENT)
        .withRole(MemoryRole.USER)
        .after('2024-01-01T00:00:00Z')
        .before('2024-12-31T23:59:59Z')
        .withMetadata({ key: 'value' })
        .limit(10)
        .offset(5)
        .ascending()
        .descending();

      expect(result).toBe(builder);
    });
  });
});
