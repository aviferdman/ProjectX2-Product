/**
 * Tests for TASK-093: Memory and Learning Example
 *
 * Validates the memory and learning example file, its documentation,
 * and that all demonstrated memory patterns work end-to-end.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Agent } from '../../src/agent/agent.js';
import {
  ShortTermMemory,
  MemoryManager,
  ScopedMemory,
  MemorySearchBuilder,
  createMemoryEntry,
} from '../../src/memory/index.js';
import { MemoryNamespace, MemoryRole } from '../../src/types/memory.js';
import { LLMRole } from '../../src/types/llm.js';
import type { LLMProvider, LLMResponse, LLMMessage, MemoryEntry } from '../../src/types/index.js';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = dirname(currentFilename);
const PROJECT_ROOT = join(currentDirname, '../../../..');
const EXAMPLES_DIR = join(PROJECT_ROOT, 'examples');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockProvider(): LLMProvider {
  return {
    name: 'mock-memory-provider',
    generateText: vi
      .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
      .mockImplementation(async (messages) => {
        return {
          content: 'Mock response with memory context',
          tokenUsage: {
            promptTokens: messages.length * 20,
            completionTokens: 30,
            totalTokens: messages.length * 20 + 30,
          },
          finishReason: 'stop',
        };
      }),
  };
}

// ---------------------------------------------------------------------------
// Example file validation
// ---------------------------------------------------------------------------

describe('TASK-093: Memory and Learning — Example File', () => {
  const examplePath = join(EXAMPLES_DIR, 'memory-and-learning.ts');
  let content: string;

  it('should exist at examples/memory-and-learning.ts', () => {
    expect(existsSync(examplePath)).toBe(true);
    content = readFileSync(examplePath, 'utf-8');
  });

  it('should include a file header comment', () => {
    expect(content).toMatch(/^\/\*\*/);
  });

  it('should import ShortTermMemory from @crewspace/core', () => {
    expect(content).toContain('ShortTermMemory');
  });

  it('should import MemoryManager from @crewspace/core', () => {
    expect(content).toContain('MemoryManager');
  });

  it('should import ScopedMemory from @crewspace/core', () => {
    expect(content).toContain('ScopedMemory');
  });

  it('should import MemorySearchBuilder from @crewspace/core', () => {
    expect(content).toContain('MemorySearchBuilder');
  });

  it('should import createMemoryEntry from @crewspace/core', () => {
    expect(content).toContain('createMemoryEntry');
  });

  it('should import MemoryNamespace and MemoryRole', () => {
    expect(content).toContain('MemoryNamespace');
    expect(content).toContain('MemoryRole');
  });

  it('should import Agent from @crewspace/core', () => {
    expect(content).toContain('Agent');
    expect(content).toContain("from '@crewspace/core'");
  });

  it('should demonstrate retention policies', () => {
    expect(content).toContain('maxEntries');
    expect(content).toContain('retention');
  });

  it('should demonstrate memory events', () => {
    expect(content).toContain("'memory:add'");
    expect(content).toContain("'memory:evict'");
  });

  it('should demonstrate namespace scoping', () => {
    expect(content).toContain('MemoryNamespace.AGENT');
    expect(content).toContain('MemoryNamespace.CREW');
    expect(content).toContain('MemoryNamespace.GLOBAL');
  });

  it('should use MemorySearchBuilder fluent API', () => {
    expect(content).toContain('new MemorySearchBuilder');
    expect(content).toMatch(/\.withRole\(/);
    expect(content).toMatch(/\.ascending\(\)/);
    expect(content).toMatch(/\.limit\(/);
    expect(content).toMatch(/\.execute\(\)/);
  });

  it('should include usage instructions in header', () => {
    expect(content).toContain('npx tsx examples/memory-and-learning.ts');
  });

  it('should mention mock provider replacement', () => {
    expect(content).toMatch(/[Rr]eplace.*real provider|[Mm]ock.*provider/);
  });

  it('should create an Agent with memory integration', () => {
    expect(content).toContain('new Agent');
    expect(content).toMatch(/role:.*[Mm]emory|[Ll]earning/);
  });

  it('should demonstrate memory search', () => {
    expect(content).toContain('.search(');
  });

  it('should demonstrate memory query', () => {
    expect(content).toContain('.query(');
  });
});

// ---------------------------------------------------------------------------
// Functional validation — ShortTermMemory with retention
// ---------------------------------------------------------------------------

describe('TASK-093: Memory and Learning — ShortTermMemory Retention', () => {
  let memory: ShortTermMemory;

  beforeEach(() => {
    memory = new ShortTermMemory({
      defaultNamespace: MemoryNamespace.AGENT,
      retention: { maxEntries: 3 },
    });
  });

  it('should store entries up to the max limit', async () => {
    await memory.add(createMemoryEntry('Entry 1', MemoryRole.USER, MemoryNamespace.AGENT));
    await memory.add(createMemoryEntry('Entry 2', MemoryRole.USER, MemoryNamespace.AGENT));
    await memory.add(createMemoryEntry('Entry 3', MemoryRole.USER, MemoryNamespace.AGENT));

    expect(await memory.count()).toBe(3);
  });

  it('should evict oldest entries when maxEntries is exceeded', async () => {
    const e1 = await memory.add(
      createMemoryEntry('First entry', MemoryRole.USER, MemoryNamespace.AGENT),
    );
    await memory.add(createMemoryEntry('Second entry', MemoryRole.USER, MemoryNamespace.AGENT));
    await memory.add(createMemoryEntry('Third entry', MemoryRole.USER, MemoryNamespace.AGENT));

    // Adding a 4th should evict the first
    await memory.add(createMemoryEntry('Fourth entry', MemoryRole.USER, MemoryNamespace.AGENT));

    expect(await memory.count()).toBe(3);
    expect(await memory.get(e1.id)).toBeUndefined();
  });

  it('should emit evict events on overflow', async () => {
    const evictedEntries: MemoryEntry[] = [];
    memory.on('memory:evict', (entries) => {
      evictedEntries.push(...entries);
    });

    await memory.add(createMemoryEntry('A', MemoryRole.USER, MemoryNamespace.AGENT));
    await memory.add(createMemoryEntry('B', MemoryRole.USER, MemoryNamespace.AGENT));
    await memory.add(createMemoryEntry('C', MemoryRole.USER, MemoryNamespace.AGENT));
    await memory.add(createMemoryEntry('D', MemoryRole.USER, MemoryNamespace.AGENT));

    expect(evictedEntries).toHaveLength(1);
    expect(evictedEntries[0].content).toBe('A');
  });

  it('should emit add events for each entry', async () => {
    const addedIds: string[] = [];
    memory.on('memory:add', (entry) => {
      addedIds.push(entry.id);
    });

    const e1 = await memory.add(createMemoryEntry('Test', MemoryRole.USER, MemoryNamespace.AGENT));
    expect(addedIds).toContain(e1.id);
  });

  it('should search entries by text', async () => {
    await memory.add(
      createMemoryEntry('TypeScript is great', MemoryRole.USER, MemoryNamespace.AGENT),
    );
    await memory.add(
      createMemoryEntry('JavaScript runs everywhere', MemoryRole.USER, MemoryNamespace.AGENT),
    );
    await memory.add(
      createMemoryEntry(
        'TypeScript compiles to JavaScript',
        MemoryRole.ASSISTANT,
        MemoryNamespace.AGENT,
      ),
    );

    const result = await memory.search('TypeScript');
    expect(result.total).toBe(2);
  });

  it('should delete entries by id', async () => {
    const entry = await memory.add(
      createMemoryEntry('To delete', MemoryRole.USER, MemoryNamespace.AGENT),
    );
    expect(await memory.count()).toBe(1);

    const deleted = await memory.delete(entry.id);
    expect(deleted).toBe(true);
    expect(await memory.count()).toBe(0);
  });

  it('should clear all entries', async () => {
    await memory.add(createMemoryEntry('One', MemoryRole.USER, MemoryNamespace.AGENT));
    await memory.add(createMemoryEntry('Two', MemoryRole.USER, MemoryNamespace.AGENT));
    expect(await memory.count()).toBe(2);

    const cleared = await memory.clear();
    expect(cleared).toBe(2);
    expect(await memory.count()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Functional validation — MemorySearchBuilder
// ---------------------------------------------------------------------------

describe('TASK-093: Memory and Learning — MemorySearchBuilder', () => {
  let memory: ShortTermMemory;

  beforeEach(async () => {
    memory = new ShortTermMemory({
      retention: { maxEntries: 100 },
    });

    await memory.add(
      createMemoryEntry('User asked about React', MemoryRole.USER, MemoryNamespace.AGENT, {
        topic: 'frontend',
      }),
    );
    await memory.add(
      createMemoryEntry('Explained React hooks', MemoryRole.ASSISTANT, MemoryNamespace.AGENT, {
        topic: 'frontend',
      }),
    );
    await memory.add(
      createMemoryEntry('User asked about databases', MemoryRole.USER, MemoryNamespace.AGENT, {
        topic: 'backend',
      }),
    );
    await memory.add(
      createMemoryEntry('Explained SQL joins', MemoryRole.ASSISTANT, MemoryNamespace.AGENT, {
        topic: 'backend',
      }),
    );
    await memory.add(
      createMemoryEntry('System initialization complete', MemoryRole.SYSTEM, MemoryNamespace.AGENT),
    );
  });

  it('should filter by role using withRole', async () => {
    const result = await new MemorySearchBuilder(memory).withRole(MemoryRole.USER).execute();

    expect(result.total).toBe(2);
    for (const entry of result.entries) {
      expect(entry.role).toBe(MemoryRole.USER);
    }
  });

  it('should filter by multiple roles using withRoles', async () => {
    const result = await new MemorySearchBuilder(memory)
      .withRoles([MemoryRole.USER, MemoryRole.ASSISTANT])
      .execute();

    expect(result.total).toBe(4);
  });

  it('should sort ascending (oldest first)', async () => {
    const result = await new MemorySearchBuilder(memory).ascending().limit(5).execute();

    expect(result.entries.length).toBe(5);
    // First entry should be the oldest
    const timestamps = result.entries.map((e) => new Date(e.createdAt).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }
  });

  it('should sort descending (newest first) by default', async () => {
    const result = await new MemorySearchBuilder(memory).limit(5).execute();

    const timestamps = result.entries.map((e) => new Date(e.createdAt).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeLessThanOrEqual(timestamps[i - 1]);
    }
  });

  it('should limit results', async () => {
    const result = await new MemorySearchBuilder(memory).limit(2).execute();

    expect(result.entries).toHaveLength(2);
    expect(result.total).toBe(5);
  });

  it('should filter by metadata', async () => {
    const result = await new MemorySearchBuilder(memory)
      .withMetadata({ topic: 'frontend' })
      .execute();

    expect(result.total).toBe(2);
    for (const entry of result.entries) {
      expect(entry.metadata?.topic).toBe('frontend');
    }
  });

  it('should perform text search with filters', async () => {
    const result = await new MemorySearchBuilder(memory)
      .withRole(MemoryRole.ASSISTANT)
      .search('React');

    expect(result.total).toBe(1);
    expect(result.entries[0].content).toContain('React hooks');
  });

  it('should build query options', () => {
    const options = new MemorySearchBuilder(memory)
      .inNamespace(MemoryNamespace.AGENT)
      .withRole(MemoryRole.USER)
      .limit(10)
      .offset(5)
      .ascending()
      .build();

    expect(options.namespace).toBe(MemoryNamespace.AGENT);
    expect(options.role).toBe(MemoryRole.USER);
    expect(options.limit).toBe(10);
    expect(options.offset).toBe(5);
    expect(options.sortOrder).toBe('asc');
  });
});

// ---------------------------------------------------------------------------
// Functional validation — ScopedMemory
// ---------------------------------------------------------------------------

describe('TASK-093: Memory and Learning — ScopedMemory', () => {
  let sharedStore: ShortTermMemory;
  let agentAMemory: ScopedMemory;
  let agentBMemory: ScopedMemory;
  let crewMemory: ScopedMemory;

  beforeEach(() => {
    sharedStore = new ShortTermMemory({
      retention: { maxEntries: 100 },
    });

    agentAMemory = new ScopedMemory({
      provider: sharedStore,
      namespace: MemoryNamespace.AGENT,
      ownerId: 'agent-a',
    });

    agentBMemory = new ScopedMemory({
      provider: sharedStore,
      namespace: MemoryNamespace.AGENT,
      ownerId: 'agent-b',
    });

    crewMemory = new ScopedMemory({
      provider: sharedStore,
      namespace: MemoryNamespace.CREW,
      ownerId: 'test-crew',
    });
  });

  it('should isolate entries between agents', async () => {
    await agentAMemory.add(
      createMemoryEntry('Agent A private data', MemoryRole.ASSISTANT, MemoryNamespace.AGENT),
    );
    await agentBMemory.add(
      createMemoryEntry('Agent B private data', MemoryRole.ASSISTANT, MemoryNamespace.AGENT),
    );

    const agentAResults = await agentAMemory.query();
    const agentBResults = await agentBMemory.query();

    // Each agent sees only its own entries (plus any crew/global)
    const agentAContents = agentAResults.entries.map((e) => e.content);
    const agentBContents = agentBResults.entries.map((e) => e.content);

    expect(agentAContents).toContain('Agent A private data');
    expect(agentAContents).not.toContain('Agent B private data');
    expect(agentBContents).toContain('Agent B private data');
    expect(agentBContents).not.toContain('Agent A private data');
  });

  it('should make crew entries visible to agents', async () => {
    await crewMemory.add(
      createMemoryEntry('Shared crew knowledge', MemoryRole.SYSTEM, MemoryNamespace.CREW),
    );

    const agentAResults = await agentAMemory.query();
    const agentAContents = agentAResults.entries.map((e) => e.content);

    expect(agentAContents).toContain('Shared crew knowledge');
  });

  it('should not make agent entries visible to crew scope', async () => {
    await agentAMemory.add(
      createMemoryEntry('Agent-only data', MemoryRole.ASSISTANT, MemoryNamespace.AGENT),
    );

    const crewResults = await crewMemory.query();
    const crewContents = crewResults.entries.map((e) => e.content);

    expect(crewContents).not.toContain('Agent-only data');
  });

  it('should allow agents to search only their own entries', async () => {
    await agentAMemory.add(
      createMemoryEntry('Security finding by Agent A', MemoryRole.ASSISTANT, MemoryNamespace.AGENT),
    );
    await agentBMemory.add(
      createMemoryEntry('Security finding by Agent B', MemoryRole.ASSISTANT, MemoryNamespace.AGENT),
    );

    const searchA = await agentAMemory.search('Security');
    const searchB = await agentBMemory.search('Security');

    expect(searchA.total).toBe(1);
    expect(searchA.entries[0].content).toContain('Agent A');

    expect(searchB.total).toBe(1);
    expect(searchB.entries[0].content).toContain('Agent B');
  });

  it('should tag entries with ownerId metadata', async () => {
    const entry = await agentAMemory.add(
      createMemoryEntry('Tagged entry', MemoryRole.USER, MemoryNamespace.AGENT),
    );

    expect(entry.metadata?.ownerId).toBe('agent-a');
  });

  it('should prevent deleting entries owned by another scope', async () => {
    const entry = await agentAMemory.add(
      createMemoryEntry('Agent A entry', MemoryRole.USER, MemoryNamespace.AGENT),
    );

    await expect(agentBMemory.delete(entry.id)).rejects.toThrow(/not owned/);
  });
});

// ---------------------------------------------------------------------------
// Functional validation — MemoryManager
// ---------------------------------------------------------------------------

describe('TASK-093: Memory and Learning — MemoryManager', () => {
  let primary: ShortTermMemory;
  let manager: MemoryManager;

  beforeEach(() => {
    primary = new ShortTermMemory({
      retention: { maxEntries: 50 },
    });

    const backup = new ShortTermMemory({
      retention: { maxEntries: 100 },
    });
    Object.defineProperty(backup, 'name', { value: 'backup' });

    manager = new MemoryManager({
      providers: [primary, backup],
    });
  });

  it('should replicate entries to all providers', async () => {
    const entry = createMemoryEntry('Replicated data', MemoryRole.SYSTEM, MemoryNamespace.GLOBAL);
    await manager.add(entry);

    // Manager count is from primary
    expect(await manager.count()).toBe(1);
    // Can retrieve by ID from manager
    const retrieved = await manager.get(entry.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.content).toBe('Replicated data');
  });

  it('should search entries via the primary provider', async () => {
    await manager.add(
      createMemoryEntry('Learning about Docker', MemoryRole.USER, MemoryNamespace.AGENT),
    );
    await manager.add(
      createMemoryEntry(
        'Docker containers are lightweight',
        MemoryRole.ASSISTANT,
        MemoryNamespace.AGENT,
      ),
    );

    const result = await manager.search('Docker');
    expect(result.total).toBe(2);
  });

  it('should emit memory:add events', async () => {
    const addedEntries: MemoryEntry[] = [];
    manager.on('memory:add', (entry) => {
      addedEntries.push(entry);
    });

    await manager.add(createMemoryEntry('Event test', MemoryRole.USER, MemoryNamespace.AGENT));

    expect(addedEntries).toHaveLength(1);
    expect(addedEntries[0].content).toBe('Event test');
  });

  it('should delete entries across all providers', async () => {
    const entry = createMemoryEntry('To delete', MemoryRole.USER, MemoryNamespace.AGENT);
    await manager.add(entry);

    const deleted = await manager.delete(entry.id);
    expect(deleted).toBe(true);
    expect(await manager.get(entry.id)).toBeUndefined();
  });

  it('should clear entries across all providers', async () => {
    await manager.add(createMemoryEntry('Entry 1', MemoryRole.USER, MemoryNamespace.AGENT));
    await manager.add(createMemoryEntry('Entry 2', MemoryRole.USER, MemoryNamespace.AGENT));

    const cleared = await manager.clear();
    expect(cleared).toBeGreaterThanOrEqual(2);
    expect(await manager.count()).toBe(0);
  });

  it('should throw on duplicate provider names', () => {
    const dup1 = new ShortTermMemory();
    const dup2 = new ShortTermMemory();
    // Both have name='short-term' by default

    expect(() => new MemoryManager({ providers: [dup1, dup2] })).toThrow(/[Dd]uplicate/);
  });
});

// ---------------------------------------------------------------------------
// Functional validation — Agent with Memory Integration
// ---------------------------------------------------------------------------

describe('TASK-093: Memory and Learning — Agent with Memory', () => {
  let agentMemory: ShortTermMemory;
  let agent: Agent;

  beforeEach(() => {
    agentMemory = new ShortTermMemory({
      retention: { maxEntries: 20 },
    });

    agent = new Agent({
      id: 'memory-agent',
      role: 'Memory-Enhanced Assistant',
      goal: 'Remember and recall context',
      backstory: 'An assistant with memory capabilities.',
      llmProvider: createMockProvider(),
    });
  });

  it('should store interactions in memory alongside agent execution', async () => {
    const userMsg = 'Tell me about TypeScript generics';

    // Store user message in memory
    await agentMemory.add(
      createMemoryEntry(userMsg, MemoryRole.USER, MemoryNamespace.AGENT, { type: 'interaction' }),
    );

    // Execute agent
    const result = await agent.execute({
      description: userMsg,
      context: { memoryEnabled: true },
    });

    // Store response in memory
    await agentMemory.add(
      createMemoryEntry(result.output, MemoryRole.ASSISTANT, MemoryNamespace.AGENT, {
        type: 'interaction',
      }),
    );

    expect(await agentMemory.count()).toBe(2);
    const searchResult = await agentMemory.search('TypeScript');
    expect(searchResult.total).toBeGreaterThanOrEqual(1);
  });

  it('should recall past interactions via memory search', async () => {
    // Populate memory with past interactions
    await agentMemory.add(
      createMemoryEntry('User asked about REST APIs', MemoryRole.USER, MemoryNamespace.AGENT),
    );
    await agentMemory.add(
      createMemoryEntry(
        'Explained REST API design patterns',
        MemoryRole.ASSISTANT,
        MemoryNamespace.AGENT,
      ),
    );
    await agentMemory.add(
      createMemoryEntry('User asked about GraphQL', MemoryRole.USER, MemoryNamespace.AGENT),
    );

    // Search for API-related memories
    const apiMemories = await agentMemory.search('API');
    expect(apiMemories.total).toBe(2);
  });

  it('should support multiple conversation turns stored in memory', async () => {
    const turns = [
      { role: MemoryRole.USER, content: 'What is Docker?' },
      { role: MemoryRole.ASSISTANT, content: 'Docker is a containerization platform' },
      { role: MemoryRole.USER, content: 'How do I create a Dockerfile?' },
      { role: MemoryRole.ASSISTANT, content: 'Start with a FROM instruction' },
    ];

    for (const turn of turns) {
      await agentMemory.add(createMemoryEntry(turn.content, turn.role, MemoryNamespace.AGENT));
    }

    expect(await agentMemory.count()).toBe(4);

    // Query only user messages
    const userMessages = await new MemorySearchBuilder(agentMemory)
      .withRole(MemoryRole.USER)
      .execute();

    expect(userMessages.total).toBe(2);
  });

  it('should handle memory with agent lifecycle events', async () => {
    const events: string[] = [];

    agent.on('agent:start', () => events.push('start'));
    agent.on('agent:complete', () => events.push('complete'));

    agentMemory.on('memory:add', () => events.push('memory:add'));

    // Store and execute
    await agentMemory.add(
      createMemoryEntry('Pre-execution context', MemoryRole.SYSTEM, MemoryNamespace.AGENT),
    );

    await agent.execute({
      description: 'Use memory context',
      context: { memoryEnabled: true },
    });

    expect(events).toContain('memory:add');
    expect(events).toContain('start');
    expect(events).toContain('complete');
  });
});

// ---------------------------------------------------------------------------
// Functional validation — createMemoryEntry helper
// ---------------------------------------------------------------------------

describe('TASK-093: Memory and Learning — createMemoryEntry', () => {
  it('should create an entry with auto-generated id', () => {
    const entry = createMemoryEntry('Test content', MemoryRole.USER);
    expect(entry.id).toMatch(/^mem_/);
    expect(entry.content).toBe('Test content');
    expect(entry.role).toBe(MemoryRole.USER);
  });

  it('should default to AGENT namespace', () => {
    const entry = createMemoryEntry('Content', MemoryRole.USER);
    expect(entry.namespace).toBe(MemoryNamespace.AGENT);
  });

  it('should accept a custom namespace', () => {
    const entry = createMemoryEntry('Content', MemoryRole.SYSTEM, MemoryNamespace.GLOBAL);
    expect(entry.namespace).toBe(MemoryNamespace.GLOBAL);
  });

  it('should attach metadata when provided', () => {
    const entry = createMemoryEntry('Content', MemoryRole.USER, MemoryNamespace.AGENT, {
      topic: 'testing',
      priority: 1,
      important: true,
    });

    expect(entry.metadata?.topic).toBe('testing');
    expect(entry.metadata?.priority).toBe(1);
    expect(entry.metadata?.important).toBe(true);
  });

  it('should set createdAt as ISO timestamp', () => {
    const before = new Date().toISOString();
    const entry = createMemoryEntry('Content', MemoryRole.USER);
    const after = new Date().toISOString();

    expect(entry.createdAt).toBeDefined();
    expect(entry.createdAt >= before).toBe(true);
    expect(entry.createdAt <= after).toBe(true);
  });

  it('should produce unique ids for different entries', () => {
    const entry1 = createMemoryEntry('Content 1', MemoryRole.USER);
    const entry2 = createMemoryEntry('Content 2', MemoryRole.USER);
    expect(entry1.id).not.toBe(entry2.id);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('TASK-093: Memory and Learning — Edge Cases', () => {
  it('should handle empty search query', async () => {
    const memory = new ShortTermMemory();
    await memory.add(createMemoryEntry('Something', MemoryRole.USER, MemoryNamespace.AGENT));

    const result = await memory.search('');
    expect(result.total).toBe(0);
  });

  it('should handle search with no matches', async () => {
    const memory = new ShortTermMemory();
    await memory.add(createMemoryEntry('Hello world', MemoryRole.USER, MemoryNamespace.AGENT));

    const result = await memory.search('nonexistent');
    expect(result.total).toBe(0);
  });

  it('should handle clearing empty memory', async () => {
    const memory = new ShortTermMemory();
    const cleared = await memory.clear();
    expect(cleared).toBe(0);
  });

  it('should handle deleting non-existent entry', async () => {
    const memory = new ShortTermMemory();
    const deleted = await memory.delete('non-existent-id');
    expect(deleted).toBe(false);
  });

  it('should handle MemoryManager with no providers', () => {
    const manager = new MemoryManager();

    expect(manager.providers).toHaveLength(0);
  });

  it('should reject duplicate entry ids in memory', async () => {
    const memory = new ShortTermMemory();
    const entry = createMemoryEntry('Test', MemoryRole.USER, MemoryNamespace.AGENT);
    await memory.add(entry);

    await expect(memory.add(entry)).rejects.toThrow(/already exists/);
  });

  it('should handle retention policy with maxEntries=1', async () => {
    const memory = new ShortTermMemory({
      retention: { maxEntries: 1 },
    });

    await memory.add(createMemoryEntry('First', MemoryRole.USER, MemoryNamespace.AGENT));
    await memory.add(createMemoryEntry('Second', MemoryRole.USER, MemoryNamespace.AGENT));

    expect(await memory.count()).toBe(1);
    const result = await memory.query();
    expect(result.entries[0].content).toBe('Second');
  });

  it('should handle ScopedMemory with custom readable namespaces', () => {
    const store = new ShortTermMemory();
    const scoped = new ScopedMemory({
      provider: store,
      namespace: MemoryNamespace.AGENT,
      ownerId: 'test',
      readableNamespaces: [MemoryNamespace.AGENT],
    });

    expect(scoped.readableNamespaces).toEqual([MemoryNamespace.AGENT]);
  });
});
