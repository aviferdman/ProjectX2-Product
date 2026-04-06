/**
 * Integration tests for the memory system.
 *
 * Tests end-to-end workflows across multiple memory components:
 * MemoryManager, ShortTermMemory, ScopedMemory, MemorySearchBuilder,
 * and export/import functionality working together.
 */

import { describe, expect, it, beforeEach } from 'vitest';

import {
  MemoryManager,
  ShortTermMemory,
  ScopedMemory,
  MemorySearchBuilder,
  createMemoryEntry,
  generateMemoryId,
  exportMemory,
  importMemory,
  exportToJson,
  parseExportJson,
} from '../../src/memory/index.js';
import { MemoryNamespace, MemoryRole } from '../../src/types/memory.js';
import type { MemoryEntry, MemoryProvider } from '../../src/types/memory.js';

<<<<<<< HEAD
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

=======
>>>>>>> agent/developer/development-developer-c8
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

<<<<<<< HEAD
// ---------------------------------------------------------------------------
// Integration Tests
// ---------------------------------------------------------------------------

describe('TASK-053: Memory System Integration Tests', () => {
  describe('MemoryManager + ShortTermMemory end-to-end', () => {
    let manager: MemoryManager;
    let provider1: ShortTermMemory;

    beforeEach(() => {
      provider1 = new ShortTermMemory();
      manager = new MemoryManager({ providers: [provider1] });
=======
describe('TASK-053: Memory System Integration Tests', () => {
  describe('MemoryManager + ShortTermMemory end-to-end', () => {
    let manager: MemoryManager;
    let provider: ShortTermMemory;

    beforeEach(() => {
      provider = new ShortTermMemory();
      manager = new MemoryManager({ providers: [provider] });
>>>>>>> agent/developer/development-developer-c8
    });

    it('writes to provider and reads back via manager', async () => {
      const entry = makeEntry({ content: 'shared data' });
      await manager.add(entry);
<<<<<<< HEAD

      const fromP1 = await provider1.get(entry.id);
      expect(fromP1).toBeDefined();
      expect(fromP1!.content).toBe('shared data');

      const fromManager = await manager.get(entry.id);
      expect(fromManager).toBeDefined();
      expect(fromManager!.content).toBe('shared data');
    });

    it('queries and searches via primary provider', async () => {
      const e1 = makeEntry({ content: 'hello world' });
      const e2 = makeEntry({ content: 'goodbye world' });
      await manager.add(e1);
      await manager.add(e2);

      const queryResult = await manager.query({ namespace: MemoryNamespace.AGENT });
      expect(queryResult.entries).toHaveLength(2);

      const searchResult = await manager.search('hello');
      expect(searchResult.entries.length).toBeGreaterThanOrEqual(1);
      expect(searchResult.entries.some((e) => e.content === 'hello world')).toBe(true);
    });

    it('deletes from all providers', async () => {
      const entry = makeEntry();
      await manager.add(entry);

      const deleted = await manager.delete(entry.id);
      expect(deleted).toBe(true);
      expect(await provider1.get(entry.id)).toBeUndefined();
=======
      const fromP = await provider.get(entry.id);
      expect(fromP).toBeDefined();
      expect(fromP!.content).toBe('shared data');
      const fromM = await manager.get(entry.id);
      expect(fromM).toBeDefined();
    });

    it('queries and searches via primary provider', async () => {
      await manager.add(makeEntry({ content: 'hello world' }));
      await manager.add(makeEntry({ content: 'goodbye world' }));
      const qr = await manager.query({ namespace: MemoryNamespace.AGENT });
      expect(qr.entries).toHaveLength(2);
      const sr = await manager.search('hello');
      expect(sr.entries.some((e) => e.content === 'hello world')).toBe(true);
    });

    it('deletes from providers', async () => {
      const entry = makeEntry();
      await manager.add(entry);
      expect(await manager.delete(entry.id)).toBe(true);
      expect(await provider.get(entry.id)).toBeUndefined();
>>>>>>> agent/developer/development-developer-c8
    });

    it('clears all providers', async () => {
      await manager.add(makeEntry());
      await manager.add(makeEntry());
<<<<<<< HEAD

      const cleared = await manager.clear();
      expect(cleared).toBeGreaterThanOrEqual(2);
      expect(await provider1.count()).toBe(0);
    });

    it('emits events for add, delete, clear operations', async () => {
=======
      expect(await manager.clear()).toBeGreaterThanOrEqual(2);
      expect(await provider.count()).toBe(0);
    });

    it('emits events for operations', async () => {
>>>>>>> agent/developer/development-developer-c8
      const events: string[] = [];
      manager.on('memory:add', () => events.push('add'));
      manager.on('memory:delete', () => events.push('delete'));
      manager.on('memory:clear', () => events.push('clear'));
<<<<<<< HEAD

=======
>>>>>>> agent/developer/development-developer-c8
      const entry = makeEntry();
      await manager.add(entry);
      await manager.delete(entry.id);
      await manager.add(makeEntry());
      await manager.clear();
<<<<<<< HEAD

=======
>>>>>>> agent/developer/development-developer-c8
      expect(events).toEqual(['add', 'delete', 'add', 'clear']);
    });
  });

  describe('ScopedMemory multi-agent isolation', () => {
    let provider: ShortTermMemory;
    let agentA: ScopedMemory;
    let agentB: ScopedMemory;
    let crewScope: ScopedMemory;
    let globalScope: ScopedMemory;

    beforeEach(() => {
      provider = new ShortTermMemory();
<<<<<<< HEAD
      agentA = new ScopedMemory({
        provider, namespace: MemoryNamespace.AGENT, ownerId: 'agent-a',
      });
      agentB = new ScopedMemory({
        provider, namespace: MemoryNamespace.AGENT, ownerId: 'agent-b',
      });
      crewScope = new ScopedMemory({
        provider, namespace: MemoryNamespace.CREW, ownerId: 'crew-1',
      });
      globalScope = new ScopedMemory({
        provider, namespace: MemoryNamespace.GLOBAL, ownerId: 'system',
      });
    });

    it('agents can write and read their own entries', async () => {
      const entryA = makeEntry({ content: 'agent-a thought' });
      const entryB = makeEntry({ content: 'agent-b thought' });
      await agentA.add(entryA);
      await agentB.add(entryB);

      expect(await agentA.get(entryA.id)).toBeDefined();
      expect(await agentB.get(entryB.id)).toBeDefined();
    });

    it('agents cannot see each others AGENT-scoped entries', async () => {
      const entryA = makeEntry({ content: 'private to A' });
      await agentA.add(entryA);
      expect(await agentB.get(entryA.id)).toBeUndefined();
    });

    it('agents can see CREW-scoped entries', async () => {
      const crewEntry = makeEntry({ content: 'shared crew data' });
      await crewScope.add(crewEntry);

      const fromA = await agentA.get(crewEntry.id);
      const fromB = await agentB.get(crewEntry.id);
      expect(fromA).toBeDefined();
      expect(fromB).toBeDefined();
      expect(fromA!.content).toBe('shared crew data');
    });

    it('agents can see GLOBAL-scoped entries', async () => {
      const globalEntry = makeEntry({ content: 'global config' });
      await globalScope.add(globalEntry);

      const fromA = await agentA.get(globalEntry.id);
      expect(fromA).toBeDefined();
      expect(fromA!.content).toBe('global config');
    });

    it('crew scope cannot see AGENT-scoped entries', async () => {
      const agentEntry = makeEntry({ content: 'agent private' });
      await agentA.add(agentEntry);
      expect(await crewScope.get(agentEntry.id)).toBeUndefined();
    });

    it('query across scopes returns correct visibility', async () => {
      await agentA.add(makeEntry({ id: 'a1', content: 'agent-a data' }));
      await agentB.add(makeEntry({ id: 'b1', content: 'agent-b data' }));
      await crewScope.add(makeEntry({ id: 'c1', content: 'crew data' }));
      await globalScope.add(makeEntry({ id: 'g1', content: 'global data' }));

      const agentAQuery = await agentA.query();
      const agentBQuery = await agentB.query();
      const crewQuery = await crewScope.query();
      const globalQuery = await globalScope.query();

      // Agent A sees own AGENT + all CREW + all GLOBAL = 3
      expect(agentAQuery.entries).toHaveLength(3);
      // Agent B sees own AGENT + all CREW + all GLOBAL = 3
      expect(agentBQuery.entries).toHaveLength(3);
      // Crew sees CREW + GLOBAL = 2
      expect(crewQuery.entries).toHaveLength(2);
      // Global sees GLOBAL only = 1
      expect(globalQuery.entries).toHaveLength(1);
=======
      agentA = new ScopedMemory({ provider, namespace: MemoryNamespace.AGENT, ownerId: 'agent-a' });
      agentB = new ScopedMemory({ provider, namespace: MemoryNamespace.AGENT, ownerId: 'agent-b' });
      crewScope = new ScopedMemory({ provider, namespace: MemoryNamespace.CREW, ownerId: 'crew-1' });
      globalScope = new ScopedMemory({ provider, namespace: MemoryNamespace.GLOBAL, ownerId: 'system' });
    });

    it('agents can write and read their own entries', async () => {
      const eA = makeEntry({ content: 'agent-a thought' });
      const eB = makeEntry({ content: 'agent-b thought' });
      await agentA.add(eA);
      await agentB.add(eB);
      expect(await agentA.get(eA.id)).toBeDefined();
      expect(await agentB.get(eB.id)).toBeDefined();
    });

    it('agents cannot see each others AGENT-scoped entries', async () => {
      const eA = makeEntry({ content: 'private' });
      await agentA.add(eA);
      expect(await agentB.get(eA.id)).toBeUndefined();
    });

    it('agents can see CREW-scoped entries', async () => {
      const ce = makeEntry({ content: 'crew data' });
      await crewScope.add(ce);
      expect((await agentA.get(ce.id))!.content).toBe('crew data');
      expect(await agentB.get(ce.id)).toBeDefined();
    });

    it('agents can see GLOBAL-scoped entries', async () => {
      const ge = makeEntry({ content: 'global config' });
      await globalScope.add(ge);
      expect((await agentA.get(ge.id))!.content).toBe('global config');
    });

    it('crew scope cannot see AGENT-scoped entries', async () => {
      const ae = makeEntry({ content: 'agent private' });
      await agentA.add(ae);
      expect(await crewScope.get(ae.id)).toBeUndefined();
    });

    it('query across scopes returns correct visibility', async () => {
      await agentA.add(makeEntry({ id: 'a1' }));
      await agentB.add(makeEntry({ id: 'b1' }));
      await crewScope.add(makeEntry({ id: 'c1' }));
      await globalScope.add(makeEntry({ id: 'g1' }));
      expect((await agentA.query()).entries).toHaveLength(3);
      expect((await agentB.query()).entries).toHaveLength(3);
      expect((await crewScope.query()).entries).toHaveLength(2);
      expect((await globalScope.query()).entries).toHaveLength(1);
>>>>>>> agent/developer/development-developer-c8
    });

    it('search across scopes returns correct results', async () => {
      await agentA.add(makeEntry({ id: 'sa1', content: 'hello from agent-a' }));
      await crewScope.add(makeEntry({ id: 'sc1', content: 'hello from crew' }));
      await globalScope.add(makeEntry({ id: 'sg1', content: 'hello from global' }));
<<<<<<< HEAD

      const agentSearch = await agentA.search('hello');
      expect(agentSearch.entries).toHaveLength(3);

      const crewSearch = await crewScope.search('hello');
      expect(crewSearch.entries).toHaveLength(2);

      const globalSearch = await globalScope.search('hello');
      expect(globalSearch.entries).toHaveLength(1);
=======
      expect((await agentA.search('hello')).entries).toHaveLength(3);
      expect((await crewScope.search('hello')).entries).toHaveLength(2);
      expect((await globalScope.search('hello')).entries).toHaveLength(1);
>>>>>>> agent/developer/development-developer-c8
    });
  });

  describe('MemorySearchBuilder with ShortTermMemory', () => {
    let memory: ShortTermMemory;

    beforeEach(async () => {
      memory = new ShortTermMemory();
      const now = Date.now();
<<<<<<< HEAD

      await memory.add(makeEntry({
        id: 'e1', content: 'user question about TypeScript',
        role: MemoryRole.USER, namespace: MemoryNamespace.AGENT,
        createdAt: new Date(now - 3000).toISOString(),
      }));
      await memory.add(makeEntry({
        id: 'e2', content: 'assistant response about TypeScript generics',
        role: MemoryRole.ASSISTANT, namespace: MemoryNamespace.AGENT,
        createdAt: new Date(now - 2000).toISOString(),
      }));
      await memory.add(makeEntry({
        id: 'e3', content: 'system instruction for task',
        role: MemoryRole.SYSTEM, namespace: MemoryNamespace.CREW,
        createdAt: new Date(now - 1000).toISOString(),
      }));
      await memory.add(makeEntry({
        id: 'e4', content: 'tool result from file read',
        role: MemoryRole.TOOL, namespace: MemoryNamespace.GLOBAL,
        createdAt: new Date(now).toISOString(),
      }));
    });

    it('chains namespace + role + limit filters', async () => {
      const result = await new MemorySearchBuilder(memory)
        .inNamespace(MemoryNamespace.AGENT)
        .withRole(MemoryRole.USER)
        .limit(10)
        .execute();

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].content).toContain('user question');
    });

    it('chains search with ascending sort', async () => {
      const result = await new MemorySearchBuilder(memory)
        .inNamespace(MemoryNamespace.AGENT)
        .ascending()
        .search('TypeScript');

      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].id).toBe('e1');
      expect(result.entries[1].id).toBe('e2');
    });

    it('withRoles filters to multiple roles', async () => {
      const result = await new MemorySearchBuilder(memory)
        .withRoles([MemoryRole.USER, MemoryRole.ASSISTANT])
        .execute();
      expect(result.entries).toHaveLength(2);
    });

    it('offset + limit for pagination', async () => {
      const page1 = await new MemorySearchBuilder(memory)
        .limit(2).offset(0).descending().execute();
      const page2 = await new MemorySearchBuilder(memory)
        .limit(2).offset(2).descending().execute();

      expect(page1.entries).toHaveLength(2);
      expect(page2.entries).toHaveLength(2);
      const allIds = [...page1.entries, ...page2.entries].map((e) => e.id);
      expect(new Set(allIds).size).toBe(4);
=======
      await memory.add(makeEntry({ id: 'e1', content: 'user question about TypeScript', role: MemoryRole.USER, namespace: MemoryNamespace.AGENT, createdAt: new Date(now - 3000).toISOString() }));
      await memory.add(makeEntry({ id: 'e2', content: 'assistant response about TypeScript generics', role: MemoryRole.ASSISTANT, namespace: MemoryNamespace.AGENT, createdAt: new Date(now - 2000).toISOString() }));
      await memory.add(makeEntry({ id: 'e3', content: 'system instruction', role: MemoryRole.SYSTEM, namespace: MemoryNamespace.CREW, createdAt: new Date(now - 1000).toISOString() }));
      await memory.add(makeEntry({ id: 'e4', content: 'tool result', role: MemoryRole.TOOL, namespace: MemoryNamespace.GLOBAL, createdAt: new Date(now).toISOString() }));
    });

    it('chains namespace + role + limit', async () => {
      const r = await new MemorySearchBuilder(memory).inNamespace(MemoryNamespace.AGENT).withRole(MemoryRole.USER).limit(10).execute();
      expect(r.entries).toHaveLength(1);
    });

    it('chains search with ascending sort', async () => {
      const r = await new MemorySearchBuilder(memory).inNamespace(MemoryNamespace.AGENT).ascending().search('TypeScript');
      expect(r.entries).toHaveLength(2);
      expect(r.entries[0].id).toBe('e1');
    });

    it('withRoles filters to multiple roles', async () => {
      const r = await new MemorySearchBuilder(memory).withRoles([MemoryRole.USER, MemoryRole.ASSISTANT]).execute();
      expect(r.entries).toHaveLength(2);
    });

    it('offset + limit for pagination', async () => {
      const p1 = await new MemorySearchBuilder(memory).limit(2).offset(0).execute();
      const p2 = await new MemorySearchBuilder(memory).limit(2).offset(2).execute();
      expect(p1.entries).toHaveLength(2);
      expect(p2.entries).toHaveLength(2);
      const ids = [...p1.entries, ...p2.entries].map((e) => e.id);
      expect(new Set(ids).size).toBe(4);
>>>>>>> agent/developer/development-developer-c8
    });
  });

  describe('Export/Import round-trip', () => {
<<<<<<< HEAD
    it('exports from one provider and imports into another', async () => {
      const source = new ShortTermMemory();
      const target = new ShortTermMemory();

      await source.add(makeEntry({ id: 'x1', content: 'entry one' }));
      await source.add(makeEntry({ id: 'x2', content: 'entry two' }));
      await source.add(makeEntry({ id: 'x3', content: 'entry three', namespace: MemoryNamespace.CREW }));

      const exported = await exportMemory(source);
      expect(exported.entries).toHaveLength(3);

      const result = await importMemory(target, exported);
      expect(result.imported).toBe(3);
      expect(result.skipped).toBe(0);
      expect(await target.count()).toBe(3);
    });

    it('exports with namespace filter', async () => {
      const source = new ShortTermMemory();
      await source.add(makeEntry({ id: 'n1', namespace: MemoryNamespace.AGENT, content: 'agent' }));
      await source.add(makeEntry({ id: 'n2', namespace: MemoryNamespace.CREW, content: 'crew' }));

      const exported = await exportMemory(source, { namespace: MemoryNamespace.AGENT });
      expect(exported.entries).toHaveLength(1);
      expect(exported.entries[0].content).toBe('agent');
    });

    it('round-trips through JSON serialization', async () => {
      const source = new ShortTermMemory();
      await source.add(makeEntry({
        id: 'j1', content: 'json round-trip',
        metadata: { key: 'value', num: 42, flag: true },
      }));

      const exported = await exportMemory(source);
      const json = exportToJson(exported);
      const parsed = parseExportJson(json);

      const target = new ShortTermMemory();
      const result = await importMemory(target, parsed);
      expect(result.imported).toBe(1);

      const entry = await target.get('j1');
      expect(entry).toBeDefined();
      expect(entry!.metadata).toEqual({ key: 'value', num: 42, flag: true });
    });

    it('skips duplicates during import by default', async () => {
      const provider = new ShortTermMemory();
      await provider.add(makeEntry({ id: 'dup1', content: 'original' }));

      const exportData = await exportMemory(provider);
      const result = await importMemory(provider, exportData);
      expect(result.skipped).toBe(1);
      expect(result.imported).toBe(0);
    });

    it('clearFirst removes existing entries before import', async () => {
      const provider = new ShortTermMemory();
      await provider.add(makeEntry({ id: 'old1', content: 'old entry' }));

      const source = new ShortTermMemory();
      await source.add(makeEntry({ id: 'new1', content: 'new entry' }));
      const exportData = await exportMemory(source);

      const result = await importMemory(provider, exportData, { clearFirst: true });
      expect(result.imported).toBe(1);
      expect(await provider.count()).toBe(1);
      expect(await provider.get('old1')).toBeUndefined();
      expect(await provider.get('new1')).toBeDefined();
    });
  });

  describe('ScopedMemory + MemoryManager combined workflow', () => {
    it('scoped memory wraps a managed provider', async () => {
      const provider = new ShortTermMemory();
      const manager = new MemoryManager({ providers: [provider] });

      const scopedAgent = new ScopedMemory({
        provider: manager, namespace: MemoryNamespace.AGENT, ownerId: 'my-agent',
      });

      const entry = makeEntry({ content: 'scoped via manager' });
      await scopedAgent.add(entry);

      const found = await scopedAgent.get(entry.id);
      expect(found).toBeDefined();
      expect(found!.namespace).toBe(MemoryNamespace.AGENT);
      expect(found!.metadata?.ownerId).toBe('my-agent');

      const raw = await provider.get(entry.id);
      expect(raw).toBeDefined();
=======
    it('exports and imports between providers', async () => {
      const source = new ShortTermMemory();
      const target = new ShortTermMemory();
      await source.add(makeEntry({ id: 'x1' }));
      await source.add(makeEntry({ id: 'x2' }));
      const exp = await exportMemory(source);
      const res = await importMemory(target, exp);
      expect(res.imported).toBe(2);
      expect(await target.count()).toBe(2);
    });

    it('exports with namespace filter', async () => {
      const s = new ShortTermMemory();
      await s.add(makeEntry({ id: 'n1', namespace: MemoryNamespace.AGENT }));
      await s.add(makeEntry({ id: 'n2', namespace: MemoryNamespace.CREW }));
      const exp = await exportMemory(s, { namespace: MemoryNamespace.AGENT });
      expect(exp.entries).toHaveLength(1);
    });

    it('round-trips through JSON', async () => {
      const s = new ShortTermMemory();
      await s.add(makeEntry({ id: 'j1', metadata: { key: 'val', num: 42 } }));
      const exp = await exportMemory(s);
      const json = exportToJson(exp);
      const parsed = parseExportJson(json);
      const t = new ShortTermMemory();
      expect((await importMemory(t, parsed)).imported).toBe(1);
      expect((await t.get('j1'))!.metadata).toEqual({ key: 'val', num: 42 });
    });

    it('skips duplicates by default', async () => {
      const p = new ShortTermMemory();
      await p.add(makeEntry({ id: 'dup1' }));
      const exp = await exportMemory(p);
      expect((await importMemory(p, exp)).skipped).toBe(1);
    });

    it('clearFirst removes existing entries', async () => {
      const p = new ShortTermMemory();
      await p.add(makeEntry({ id: 'old1' }));
      const s = new ShortTermMemory();
      await s.add(makeEntry({ id: 'new1' }));
      const exp = await exportMemory(s);
      await importMemory(p, exp, { clearFirst: true });
      expect(await p.get('old1')).toBeUndefined();
      expect(await p.get('new1')).toBeDefined();
    });
  });

  describe('ScopedMemory + MemoryManager combined', () => {
    it('scoped memory wraps a managed provider', async () => {
      const provider = new ShortTermMemory();
      const manager = new MemoryManager({ providers: [provider] });
      const scoped = new ScopedMemory({ provider: manager, namespace: MemoryNamespace.AGENT, ownerId: 'my-agent' });
      const entry = makeEntry({ content: 'scoped via manager' });
      await scoped.add(entry);
      const found = await scoped.get(entry.id);
      expect(found).toBeDefined();
      expect(found!.metadata?.ownerId).toBe('my-agent');
      expect(await provider.get(entry.id)).toBeDefined();
>>>>>>> agent/developer/development-developer-c8
    });
  });

  describe('createMemoryEntry helper', () => {
<<<<<<< HEAD
    it('creates entry with all fields populated', () => {
      const entry = createMemoryEntry('hello', MemoryRole.USER);
      expect(entry.id).toMatch(/^mem_/);
      expect(entry.content).toBe('hello');
      expect(entry.role).toBe(MemoryRole.USER);
      expect(entry.namespace).toBe(MemoryNamespace.AGENT);
      expect(Object.isFrozen(entry)).toBe(true);
    });

    it('creates entry with custom namespace and metadata', () => {
      const entry = createMemoryEntry('hello', MemoryRole.SYSTEM, MemoryNamespace.GLOBAL, { source: 'test' });
      expect(entry.namespace).toBe(MemoryNamespace.GLOBAL);
      expect(entry.metadata).toEqual({ source: 'test' });
=======
    it('creates entry with defaults', () => {
      const e = createMemoryEntry('hello', MemoryRole.USER);
      expect(e.id).toMatch(/^mem_/);
      expect(e.content).toBe('hello');
      expect(Object.isFrozen(e)).toBe(true);
    });

    it('creates entry with custom namespace and metadata', () => {
      const e = createMemoryEntry('hi', MemoryRole.SYSTEM, MemoryNamespace.GLOBAL, { src: 'test' });
      expect(e.namespace).toBe(MemoryNamespace.GLOBAL);
      expect(e.metadata).toEqual({ src: 'test' });
>>>>>>> agent/developer/development-developer-c8
    });
  });

  describe('generateMemoryId uniqueness', () => {
<<<<<<< HEAD
    it('generates unique IDs under rapid successive calls', () => {
=======
    it('generates 1000 unique IDs', () => {
>>>>>>> agent/developer/development-developer-c8
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) ids.add(generateMemoryId());
      expect(ids.size).toBe(1000);
    });
  });

  describe('Retention policy integration', () => {
    it('evicts oldest entries when maxEntries exceeded', async () => {
<<<<<<< HEAD
      const memory = new ShortTermMemory({ retention: { maxEntries: 3 } });
      const evicted: MemoryEntry[][] = [];
      memory.on('memory:evict', (entries) => evicted.push(entries));

      for (let i = 0; i < 5; i++) {
        await memory.add(makeEntry({
          id: `r${i}`, content: `entry-${i}`,
          createdAt: new Date(Date.now() + i * 100).toISOString(),
        }));
      }

      expect(await memory.count()).toBe(3);
      expect(evicted.length).toBeGreaterThan(0);
      expect(await memory.get('r0')).toBeUndefined();
      expect(await memory.get('r1')).toBeUndefined();
      expect(await memory.get('r4')).toBeDefined();
    });

    it('evicts expired entries based on maxAge', async () => {
      const memory = new ShortTermMemory({ retention: { maxAge: 100 } });

      await memory.add(makeEntry({
        id: 'old', content: 'old entry',
        createdAt: new Date(Date.now() - 200).toISOString(),
      }));
      await memory.add(makeEntry({ id: 'new', content: 'new entry' }));

      expect(await memory.get('old')).toBeUndefined();
      expect(await memory.get('new')).toBeDefined();
=======
      const m = new ShortTermMemory({ retention: { maxEntries: 3 } });
      for (let i = 0; i < 5; i++) {
        await m.add(makeEntry({ id: \, createdAt: new Date(Date.now() + i * 100).toISOString() }));
      }
      expect(await m.count()).toBe(3);
      expect(await m.get('r0')).toBeUndefined();
      expect(await m.get('r4')).toBeDefined();
    });

    it('evicts expired entries based on maxAge', async () => {
      const m = new ShortTermMemory({ retention: { maxAge: 100 } });
      await m.add(makeEntry({ id: 'old', createdAt: new Date(Date.now() - 200).toISOString() }));
      await m.add(makeEntry({ id: 'new' }));
      expect(await m.get('old')).toBeUndefined();
      expect(await m.get('new')).toBeDefined();
>>>>>>> agent/developer/development-developer-c8
    });
  });

  describe('ScopedMemory pagination across namespaces', () => {
<<<<<<< HEAD
    it('paginates merged results from multiple namespaces', async () => {
      const provider = new ShortTermMemory();
      const scope = new ScopedMemory({
        provider, namespace: MemoryNamespace.AGENT, ownerId: 'test-agent',
      });

      const now = Date.now();
      for (let i = 0; i < 5; i++) {
        await scope.add(makeEntry({
          id: `a${i}`, content: `agent-${i}`,
          createdAt: new Date(now + i * 100).toISOString(),
        }));
      }

      const crewScope = new ScopedMemory({
        provider, namespace: MemoryNamespace.CREW, ownerId: 'crew-1',
      });
      for (let i = 0; i < 3; i++) {
        await crewScope.add(makeEntry({
          id: `c${i}`, content: `crew-${i}`,
          createdAt: new Date(now + (i + 5) * 100).toISOString(),
        }));
      }

      const all = await scope.query();
      expect(all.total).toBe(8);

      const page1 = await scope.query({ limit: 3, offset: 0 });
      const page2 = await scope.query({ limit: 3, offset: 3 });
      const page3 = await scope.query({ limit: 3, offset: 6 });

      expect(page1.entries).toHaveLength(3);
      expect(page2.entries).toHaveLength(3);
      expect(page3.entries).toHaveLength(2);

      const allIds = [...page1.entries, ...page2.entries, ...page3.entries].map((e) => e.id);
      expect(new Set(allIds).size).toBe(8);
    });
  });
});
=======
    it('paginates merged results', async () => {
      const provider = new ShortTermMemory();
      const scope = new ScopedMemory({ provider, namespace: MemoryNamespace.AGENT, ownerId: 'test' });
      const now = Date.now();
      for (let i = 0; i < 5; i++) {
        await scope.add(makeEntry({ id: \\, createdAt: new Date(now + i * 100).toISOString() }));
      }
      const crew = new ScopedMemory({ provider, namespace: MemoryNamespace.CREW, ownerId: 'crew' });
      for (let i = 0; i < 3; i++) {
        await crew.add(makeEntry({ id: \c\, createdAt: new Date(now + (i + 5) * 100).toISOString() }));
      }
      expect((await scope.query()).total).toBe(8);
      const p1 = await scope.query({ limit: 3, offset: 0 });
      const p2 = await scope.query({ limit: 3, offset: 3 });
      const p3 = await scope.query({ limit: 3, offset: 6 });
      expect(p1.entries).toHaveLength(3);
      expect(p2.entries).toHaveLength(3);
      expect(p3.entries).toHaveLength(2);
    });
  });
});
>>>>>>> agent/developer/development-developer-c8
