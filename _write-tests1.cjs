const fs = require('fs');
const path = require('path');

function writeFile(relPath, content) {
  const fullPath = path.resolve(relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log('wrote:', relPath, '(' + content.length + ' bytes)');
}

// ---- memory-errors.test.ts ----
writeFile('packages/core/tests/unit/memory/memory-errors.test.ts', `/**
 * Tests for memory error classes.
 */

import { describe, expect, it } from 'vitest';

import {
  MemoryConfigError,
  MemoryOperationError,
  MemoryQueryError,
} from '../../../src/errors/memory-errors.js';

describe('MemoryConfigError', () => {
  it('formats message without provider', () => {
    const err = new MemoryConfigError('bad config');
    expect(err.message).toBe('bad config');
    expect(err.name).toBe('MemoryConfigError');
    expect(err.provider).toBeUndefined();
  });

  it('formats message with provider', () => {
    const err = new MemoryConfigError('bad config', 'sqlite');
    expect(err.message).toBe('Memory provider "sqlite": bad config');
    expect(err.provider).toBe('sqlite');
  });

  it('is an instance of Error', () => {
    expect(new MemoryConfigError('x')).toBeInstanceOf(Error);
  });
});

describe('MemoryOperationError', () => {
  it('formats message correctly', () => {
    const err = new MemoryOperationError('short-term', 'add', 'duplicate id');
    expect(err.message).toBe('Memory "short-term" add failed: duplicate id');
    expect(err.name).toBe('MemoryOperationError');
    expect(err.provider).toBe('short-term');
    expect(err.operation).toBe('add');
    expect(err.cause).toBeUndefined();
  });

  it('includes cause when provided', () => {
    const cause = new Error('root cause');
    const err = new MemoryOperationError('sqlite', 'query', 'failed', cause);
    expect(err.cause).toBe(cause);
  });

  it('is an instance of Error', () => {
    expect(new MemoryOperationError('p', 'op', 'm')).toBeInstanceOf(Error);
  });
});

describe('MemoryQueryError', () => {
  it('formats message correctly', () => {
    const err = new MemoryQueryError('short-term', 'invalid filter');
    expect(err.message).toBe('Memory "short-term" query error: invalid filter');
    expect(err.name).toBe('MemoryQueryError');
    expect(err.provider).toBe('short-term');
  });

  it('is an instance of Error', () => {
    expect(new MemoryQueryError('p', 'm')).toBeInstanceOf(Error);
  });
});
`);

// ---- memory-types.test.ts ----
writeFile('packages/core/tests/unit/memory/memory-types.test.ts', `/**
 * Tests for memory types — ensures enums and interfaces are exported correctly.
 */

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

describe('Type contracts (compile-time verification)', () => {
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

  it('MemoryQueryOptions satisfies the interface', () => {
    const opts: MemoryQueryOptions = {
      namespace: MemoryNamespace.GLOBAL,
      limit: 10,
      after: '2024-01-01T00:00:00Z',
      before: '2024-12-31T23:59:59Z',
      metadata: { tag: 'test' },
    };
    expect(opts.limit).toBe(10);
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
`);

console.log('done with error and type tests');