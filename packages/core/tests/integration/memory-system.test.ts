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

describe('TASK-053: Memory System Integration Tests', () => {
  describe('MemoryManager + ShortTermMemory end-to-end', () => {
    let manager: MemoryManager;
    let provider: ShortTermMemory;

    beforeEach(() => {
      provider = new ShortTermMemory();
      manager = new MemoryManager({ providers: [provider] });
    });

    it('writes to provider and reads back via manager', async () => {
      const entry = makeEntry({ content: 'shared data' });
      await manager.add(entry);
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
    });

    it('clears all providers', async () => {
      await manager.add(makeEntry());
      await manager.add(makeEntry());
      expect(await manager.clear()).toBeGreaterThanOrEqual(2);
      expect(await provider.count()).toBe(0);
    });

    it('emits events for operations', async () => {
      const events: string[] = [];
      manager.on('memory:add', () => events.push('add'));
      manager.on('memory:delete', () => events.push('delete'));
      manager.on('memory:clear', () => events.push('clear'));
      const entry = makeEntry();
      await manager.add(entry);
      await manager.delete(entry.id);
      await manager.add(makeEntry());
      await manager.clear();
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
    });

    it('search across scopes returns correct results', async () => {
      await agentA.add(makeEntry({ id: 'sa1', content: 'hello from agent-a' }));
      await crewScope.add(makeEntry({ id: 'sc1', content: 'hello from crew' }));
      await globalScope.add(makeEntry({ id: 'sg1', content: 'hello from global' }));
      expect((await agentA.search('hello')).entries).toHaveLength(3);
      expect((await crewScope.search('hello')).entries).toHaveLength(2);
      expect((await globalScope.search('hello')).entries).toHaveLength(1);
    });
  });

  describe('MemorySearchBuilder with ShortTermMemory', () => {
    let memory: ShortTermMemory;

    beforeEach(async () => {
      memory = new ShortTermMemory();
      const now = Date.now();
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
    });
  });

  describe('Export/Import round-trip', () => {
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
    });
  });

  describe('createMemoryEntry helper', () => {
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
    });
  });

  describe('generateMemoryId uniqueness', () => {
    it('generates 1000 unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) ids.add(generateMemoryId());
      expect(ids.size).toBe(1000);
    });
  });

  describe('Retention policy integration', () => {
    it('evicts oldest entries when maxEntries exceeded', async () => {
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
    });
  });

  describe('ScopedMemory pagination across namespaces', () => {
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
