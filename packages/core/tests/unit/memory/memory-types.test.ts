import { describe, expect, it } from 'vitest';

import { MemoryNamespace, MemoryRole } from '../../../src/types/memory.js';
import type {
  MemoryConfig,
  MemoryEntry,
  MemoryMetadata,
  MemoryQueryOptions,
  MemoryQueryResult,
  MemoryRetentionPolicy,
} from '../../../src/types/memory.js';

describe('MemoryNamespace enum', () => {
  it('has AGENT, CREW, GLOBAL values', () => {
    expect(MemoryNamespace.AGENT).toBe('agent');
    expect(MemoryNamespace.CREW).toBe('crew');
    expect(MemoryNamespace.GLOBAL).toBe('global');
  });
});

describe('MemoryRole enum', () => {
  it('has USER, ASSISTANT, SYSTEM, TOOL values', () => {
    expect(MemoryRole.USER).toBe('user');
    expect(MemoryRole.ASSISTANT).toBe('assistant');
    expect(MemoryRole.SYSTEM).toBe('system');
    expect(MemoryRole.TOOL).toBe('tool');
  });
});

describe('Type contracts', () => {
  it('MemoryEntry satisfies the interface', () => {
    const entry: MemoryEntry = {
      id: 'test',
      content: 'hello',
      role: MemoryRole.USER,
      namespace: MemoryNamespace.AGENT,
      createdAt: new Date().toISOString(),
    };
    expect(entry.id).toBe('test');
  });

  it('MemoryEntry with metadata', () => {
    const metadata: MemoryMetadata = { agentId: 'a1', score: 0.95, important: true };
    const entry: MemoryEntry = {
      id: 'test2',
      content: 'data',
      role: MemoryRole.ASSISTANT,
      namespace: MemoryNamespace.CREW,
      createdAt: new Date().toISOString(),
      metadata,
    };
    expect(entry.metadata?.agentId).toBe('a1');
  });

  it('MemoryConfig satisfies the interface', () => {
    const config: MemoryConfig = {
      defaultNamespace: MemoryNamespace.CREW,
      retention: { maxEntries: 100, maxAge: 3600_000 },
    };
    expect(config.retention?.maxEntries).toBe(100);
  });

  it('MemoryRetentionPolicy satisfies the interface', () => {
    const policy: MemoryRetentionPolicy = { maxEntries: 50, maxAge: 0 };
    expect(policy.maxEntries).toBe(50);
  });

  it('MemoryQueryResult satisfies the interface', () => {
    const result: MemoryQueryResult = { entries: [], total: 0 };
    expect(result.total).toBe(0);
  });
});