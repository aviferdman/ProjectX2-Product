/**
 * Tests for memory export/import utilities.
 */

import { describe, expect, it, beforeEach } from 'vitest';

import {
  exportMemory,
  exportToJson,
  importMemory,
  parseExportJson,
  MEMORY_EXPORT_VERSION,
  MAX_EXPORT_ENTRIES,
} from '../../../src/memory/memory-export.js';
import type { MemoryExportData } from '../../../src/memory/memory-export.js';
import { ShortTermMemory } from '../../../src/memory/short-term-memory.js';
import { MemoryManager } from '../../../src/memory/memory-manager.js';
import { createMemoryEntry } from '../../../src/memory/memory-manager.js';
import { MemoryNamespace, MemoryRole } from '../../../src/types/memory.js';
import type { MemoryEntry } from '../../../src/types/memory.js';
import { MemoryOperationError } from '../../../src/errors/memory-errors.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<MemoryEntry> = {}): MemoryEntry {
  return {
    id: overrides.id ?? `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    content: overrides.content ?? 'Hello world',
    role: overrides.role ?? MemoryRole.USER,
    namespace: overrides.namespace ?? MemoryNamespace.AGENT,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    ...(overrides.metadata !== undefined && { metadata: overrides.metadata }),
  };
}

async function seedMemory(memory: ShortTermMemory, count: number): Promise<MemoryEntry[]> {
  const entries: MemoryEntry[] = [];
  for (let i = 0; i < count; i++) {
    const entry = makeEntry({
      id: `seed-${i}`,
      content: `Message ${i}`,
      role: i % 2 === 0 ? MemoryRole.USER : MemoryRole.ASSISTANT,
    });
    await memory.add(entry);
    entries.push(entry);
  }
  return entries;
}

// ---------------------------------------------------------------------------
// exportMemory
// ---------------------------------------------------------------------------

describe('exportMemory', () => {
  let memory: ShortTermMemory;

  beforeEach(() => {
    memory = new ShortTermMemory();
  });

  it('exports an empty provider', async () => {
    const data = await exportMemory(memory);

    expect(data.version).toBe(MEMORY_EXPORT_VERSION);
    expect(data.providerName).toBe('short-term');
    expect(data.entries).toHaveLength(0);
    expect(data.totalEntries).toBe(0);
    expect(data.exportedAt).toBeTruthy();
  });

  it('exports all entries from a provider', async () => {
    const seeded = await seedMemory(memory, 5);
    const data = await exportMemory(memory);

    expect(data.entries).toHaveLength(5);
    expect(data.totalEntries).toBe(5);

    // Entries should contain all seeded ids
    const exportedIds = data.entries.map((e) => e.id);
    for (const entry of seeded) {
      expect(exportedIds).toContain(entry.id);
    }
  });

  it('exports entries filtered by namespace', async () => {
    await memory.add(makeEntry({ id: 'a1', namespace: MemoryNamespace.AGENT }));
    await memory.add(makeEntry({ id: 'c1', namespace: MemoryNamespace.CREW }));
    await memory.add(makeEntry({ id: 'g1', namespace: MemoryNamespace.GLOBAL }));

    const data = await exportMemory(memory, { namespace: MemoryNamespace.CREW });

    expect(data.entries).toHaveLength(1);
    expect(data.entries[0]!.id).toBe('c1');
    expect(data.totalEntries).toBe(1);
  });

  it('respects the limit option', async () => {
    await seedMemory(memory, 10);
    const data = await exportMemory(memory, { limit: 3 });

    expect(data.entries).toHaveLength(3);
    expect(data.totalEntries).toBe(10);
  });

  it('includes metadata in exported entries', async () => {
    await memory.add(makeEntry({ id: 'meta-1', metadata: { agentId: 'agent-42', priority: 1 } }));
    const data = await exportMemory(memory);

    expect(data.entries[0]!.metadata).toEqual({ agentId: 'agent-42', priority: 1 });
  });

  it('produces a valid ISO-8601 exportedAt timestamp', async () => {
    const data = await exportMemory(memory);
    const parsed = new Date(data.exportedAt);
    expect(parsed.getTime()).not.toBeNaN();
  });

  it('works with MemoryManager', async () => {
    const provider = new ShortTermMemory();
    const manager = new MemoryManager({ providers: [provider] });

    const entry = createMemoryEntry('Test content', MemoryRole.USER);
    await manager.add(entry);

    const data = await exportMemory(manager);
    expect(data.providerName).toBe('manager');
    expect(data.entries).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// importMemory
// ---------------------------------------------------------------------------

describe('importMemory', () => {
  let memory: ShortTermMemory;

  beforeEach(() => {
    memory = new ShortTermMemory();
  });

  it('imports entries into an empty provider', async () => {
    const exportData: MemoryExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      providerName: 'short-term',
      entries: [
        makeEntry({ id: 'imp-1', content: 'Imported message 1' }),
        makeEntry({ id: 'imp-2', content: 'Imported message 2' }),
      ],
      totalEntries: 2,
    };

    const result = await importMemory(memory, exportData);

    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);

    const count = await memory.count();
    expect(count).toBe(2);
  });

  it('skips duplicate entries by default', async () => {
    await memory.add(makeEntry({ id: 'existing-1', content: 'Original' }));

    const exportData: MemoryExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      providerName: 'short-term',
      entries: [
        makeEntry({ id: 'existing-1', content: 'Duplicate' }),
        makeEntry({ id: 'new-1', content: 'New entry' }),
      ],
      totalEntries: 2,
    };

    const result = await importMemory(memory, exportData);

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.errors).toHaveLength(0);

    // Original content should be preserved
    const original = await memory.get('existing-1');
    expect(original!.content).toBe('Original');
  });

  it('reports errors for duplicates when skipDuplicates is false', async () => {
    await memory.add(makeEntry({ id: 'existing-2', content: 'Original' }));

    const exportData: MemoryExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      providerName: 'short-term',
      entries: [makeEntry({ id: 'existing-2', content: 'Duplicate' })],
      totalEntries: 1,
    };

    const result = await importMemory(memory, exportData, { skipDuplicates: false });

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.entryId).toBe('existing-2');
  });

  it('clears provider before importing when clearFirst is true', async () => {
    await memory.add(makeEntry({ id: 'old-1', content: 'Old entry' }));

    const exportData: MemoryExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      providerName: 'short-term',
      entries: [makeEntry({ id: 'new-1', content: 'New entry' })],
      totalEntries: 1,
    };

    const result = await importMemory(memory, exportData, { clearFirst: true });

    expect(result.imported).toBe(1);
    const count = await memory.count();
    expect(count).toBe(1);

    // Old entry should be gone
    const old = await memory.get('old-1');
    expect(old).toBeUndefined();
  });

  it('skips invalid entries and reports errors', async () => {
    const exportData: MemoryExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      providerName: 'short-term',
      entries: [
        makeEntry({ id: 'valid-1' }),
        // Invalid: missing content
        {
          id: 'bad-1',
          content: '',
          role: MemoryRole.USER,
          namespace: MemoryNamespace.AGENT,
          createdAt: new Date().toISOString(),
        } as MemoryEntry,
        makeEntry({ id: 'valid-2' }),
      ],
      totalEntries: 3,
    };

    const result = await importMemory(memory, exportData);

    expect(result.imported).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.entryId).toBe('bad-1');
  });

  it('throws on invalid export data structure', async () => {
    await expect(importMemory(memory, null)).rejects.toThrow(MemoryOperationError);
    await expect(importMemory(memory, {})).rejects.toThrow(MemoryOperationError);
    await expect(importMemory(memory, 'not json')).rejects.toThrow(MemoryOperationError);
    await expect(importMemory(memory, { version: 1 })).rejects.toThrow(MemoryOperationError);
  });

  it('throws on unsupported version', async () => {
    const futureExport = {
      version: 999,
      exportedAt: new Date().toISOString(),
      providerName: 'short-term',
      entries: [],
      totalEntries: 0,
    };

    await expect(importMemory(memory, futureExport)).rejects.toThrow(/Unsupported export version/);
  });

  it('preserves entry metadata during import', async () => {
    const exportData: MemoryExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      providerName: 'short-term',
      entries: [
        makeEntry({
          id: 'meta-imp-1',
          metadata: { taskId: 'task-1', score: 0.95, active: true },
        }),
      ],
      totalEntries: 1,
    };

    await importMemory(memory, exportData);
    const entry = await memory.get('meta-imp-1');

    expect(entry!.metadata).toEqual({ taskId: 'task-1', score: 0.95, active: true });
  });
});

// ---------------------------------------------------------------------------
// Round-trip: export → import
// ---------------------------------------------------------------------------

describe('export → import round-trip', () => {
  it('preserves all entries through export and import', async () => {
    const source = new ShortTermMemory();
    await seedMemory(source, 10);

    const exported = await exportMemory(source);
    const target = new ShortTermMemory();
    const result = await importMemory(target, exported);

    expect(result.imported).toBe(10);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);

    const targetCount = await target.count();
    expect(targetCount).toBe(10);

    // Verify each entry matches
    for (const entry of exported.entries) {
      const found = await target.get(entry.id);
      expect(found).toBeDefined();
      expect(found!.content).toBe(entry.content);
      expect(found!.role).toBe(entry.role);
      expect(found!.namespace).toBe(entry.namespace);
    }
  });

  it('round-trips through JSON serialization', async () => {
    const source = new ShortTermMemory();
    await source.add(
      makeEntry({ id: 'rt-1', content: 'Round-trip test', metadata: { key: 'value' } }),
    );

    const exported = await exportMemory(source);
    const json = exportToJson(exported);
    const parsed = parseExportJson(json);

    const target = new ShortTermMemory();
    const result = await importMemory(target, parsed);

    expect(result.imported).toBe(1);
    const entry = await target.get('rt-1');
    expect(entry!.content).toBe('Round-trip test');
    expect(entry!.metadata).toEqual({ key: 'value' });
  });

  it('round-trips with namespace filtering', async () => {
    const source = new ShortTermMemory();
    await source.add(makeEntry({ id: 'a1', namespace: MemoryNamespace.AGENT }));
    await source.add(makeEntry({ id: 'c1', namespace: MemoryNamespace.CREW }));
    await source.add(makeEntry({ id: 'g1', namespace: MemoryNamespace.GLOBAL }));

    const exported = await exportMemory(source, { namespace: MemoryNamespace.CREW });
    const target = new ShortTermMemory();
    await importMemory(target, exported);

    expect(await target.count()).toBe(1);
    expect(await target.get('c1')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// exportToJson / parseExportJson
// ---------------------------------------------------------------------------

describe('exportToJson', () => {
  it('produces valid JSON', async () => {
    const memory = new ShortTermMemory();
    await memory.add(makeEntry({ id: 'json-1' }));
    const data = await exportMemory(memory);
    const json = exportToJson(data);

    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(MEMORY_EXPORT_VERSION);
    expect(parsed.entries).toHaveLength(1);
  });

  it('is human-readable (pretty-printed)', async () => {
    const memory = new ShortTermMemory();
    const data = await exportMemory(memory);
    const json = exportToJson(data);

    // Pretty-printed JSON has newlines
    expect(json).toContain('\n');
  });
});

describe('parseExportJson', () => {
  it('parses valid export JSON', () => {
    const valid: MemoryExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      providerName: 'test',
      entries: [],
      totalEntries: 0,
    };
    const json = JSON.stringify(valid);
    const parsed = parseExportJson(json);

    expect(parsed.version).toBe(1);
    expect(parsed.providerName).toBe('test');
  });

  it('throws on invalid JSON syntax', () => {
    expect(() => parseExportJson('{not valid')).toThrow(MemoryOperationError);
    expect(() => parseExportJson('{not valid')).toThrow(/Failed to parse JSON/);
  });

  it('throws on malformed export structure', () => {
    expect(() => parseExportJson('{}')).toThrow(MemoryOperationError);
    expect(() => parseExportJson('{}')).toThrow(/Invalid export data/);
  });

  it('throws on missing required fields', () => {
    const partial = JSON.stringify({ version: 1, exportedAt: 'now' });
    expect(() => parseExportJson(partial)).toThrow(MemoryOperationError);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('handles entries with special characters in content', async () => {
    const memory = new ShortTermMemory();
    const specialContent = 'Line 1\nLine 2\tTabbed "quoted" \\escaped\\ emoji 🚀';
    await memory.add(makeEntry({ id: 'special-1', content: specialContent }));

    const exported = await exportMemory(memory);
    const json = exportToJson(exported);
    const parsed = parseExportJson(json);

    const target = new ShortTermMemory();
    await importMemory(target, parsed);

    const entry = await target.get('special-1');
    expect(entry!.content).toBe(specialContent);
  });

  it('handles import of entries with all MemoryRole values', async () => {
    const entries = Object.values(MemoryRole).map((role, i) =>
      makeEntry({ id: `role-${i}`, role }),
    );
    const exportData: MemoryExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      providerName: 'test',
      entries,
      totalEntries: entries.length,
    };

    const memory = new ShortTermMemory();
    const result = await importMemory(memory, exportData);

    expect(result.imported).toBe(Object.values(MemoryRole).length);
    expect(result.errors).toHaveLength(0);
  });

  it('handles import of entries with all MemoryNamespace values', async () => {
    const entries = Object.values(MemoryNamespace).map((ns, i) =>
      makeEntry({ id: `ns-${i}`, namespace: ns }),
    );
    const exportData: MemoryExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      providerName: 'test',
      entries,
      totalEntries: entries.length,
    };

    const memory = new ShortTermMemory();
    const result = await importMemory(memory, exportData);

    expect(result.imported).toBe(Object.values(MemoryNamespace).length);
    expect(result.errors).toHaveLength(0);
  });

  it('MAX_EXPORT_ENTRIES constant is defined', () => {
    expect(MAX_EXPORT_ENTRIES).toBeGreaterThan(0);
  });

  it('MEMORY_EXPORT_VERSION constant is defined', () => {
    expect(MEMORY_EXPORT_VERSION).toBe(1);
  });
});
