/**
 * Memory operations benchmarks.
 *
 * Measures add, get, query, and search performance on ShortTermMemory.
 * Budget: <50ms per operation.
 */

import { describe, it, expect } from 'vitest';

import { createMemoryEntry, ShortTermMemory } from '../src/memory/index.js';
import { MemoryNamespace, MemoryRole } from '../src/types/index.js';
import {
  PERFORMANCE_BUDGETS,
  populateMemory,
  measurePerformance,
  formatResult,
} from './helpers.js';

describe('Memory Operations Benchmarks', () => {
  describe('ShortTermMemory.add', () => {
    it('should add entries to empty memory within budget', async () => {
      const result = await measurePerformance(
        'Memory add (empty store)',
        async () => {
          const memory = new ShortTermMemory();
          const entry = createMemoryEntry(
            'Test content for benchmark',
            MemoryRole.ASSISTANT,
            MemoryNamespace.AGENT,
          );
          await memory.add(entry);
        },
        { iterations: 5000, budget: PERFORMANCE_BUDGETS.memoryAdd },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });

    it('should add entries to populated memory (100 entries) within budget', async () => {
      const memory = new ShortTermMemory();
      await populateMemory(memory, 100);

      let counter = 0;
      const result = await measurePerformance(
        'Memory add (100 existing entries)',
        async () => {
          counter++;
          const entry = createMemoryEntry(
            `New entry #${String(counter)}`,
            MemoryRole.USER,
            MemoryNamespace.AGENT,
          );
          await memory.add(entry);
        },
        { iterations: 2000, budget: PERFORMANCE_BUDGETS.memoryAdd },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });
  });

  describe('ShortTermMemory.get', () => {
    it('should retrieve entries by ID within budget', async () => {
      const memory = new ShortTermMemory();
      const ids = await populateMemory(memory, 500);
      const targetId = ids[Math.floor(ids.length / 2)]!;

      const result = await measurePerformance(
        'Memory get (500 entries, lookup by ID)',
        async () => {
          await memory.get(targetId);
        },
        { iterations: 10000, budget: PERFORMANCE_BUDGETS.memoryGet },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });

    it('should handle miss lookups within budget', async () => {
      const memory = new ShortTermMemory();
      await populateMemory(memory, 500);

      const result = await measurePerformance(
        'Memory get (miss, 500 entries)',
        async () => {
          await memory.get('nonexistent-id');
        },
        { iterations: 10000, budget: PERFORMANCE_BUDGETS.memoryGet },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });
  });

  describe('ShortTermMemory.query', () => {
    it('should query all entries within budget', async () => {
      const memory = new ShortTermMemory();
      await populateMemory(memory, 500);

      const result = await measurePerformance(
        'Memory query (500 entries, no filters)',
        async () => {
          await memory.query({ limit: 50 });
        },
        { iterations: 2000, budget: PERFORMANCE_BUDGETS.memoryQuery },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });

    it('should query with namespace filter within budget', async () => {
      const memory = new ShortTermMemory();
      await populateMemory(memory, 500);

      const result = await measurePerformance(
        'Memory query (500 entries, namespace filter)',
        async () => {
          await memory.query({
            namespace: MemoryNamespace.AGENT,
            limit: 50,
          });
        },
        { iterations: 2000, budget: PERFORMANCE_BUDGETS.memoryQuery },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });

    it('should query with metadata filter within budget', async () => {
      const memory = new ShortTermMemory();
      await populateMemory(memory, 500);

      const result = await measurePerformance(
        'Memory query (500 entries, metadata filter)',
        async () => {
          await memory.query({
            metadata: { source: 'benchmark' },
            limit: 50,
          });
        },
        { iterations: 2000, budget: PERFORMANCE_BUDGETS.memoryQuery },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });
  });

  describe('ShortTermMemory.search', () => {
    it('should search entries by text within budget', async () => {
      const memory = new ShortTermMemory();
      await populateMemory(memory, 500);

      const result = await measurePerformance(
        'Memory search (500 entries, text match)',
        async () => {
          await memory.search('benchmark', { limit: 50 });
        },
        { iterations: 2000, budget: PERFORMANCE_BUDGETS.memorySearch },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });

    it('should search with no matches within budget', async () => {
      const memory = new ShortTermMemory();
      await populateMemory(memory, 500);

      const result = await measurePerformance(
        'Memory search (500 entries, no matches)',
        async () => {
          await memory.search('xyznonexistent', { limit: 50 });
        },
        { iterations: 2000, budget: PERFORMANCE_BUDGETS.memorySearch },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });
  });

  describe('ShortTermMemory.count', () => {
    it('should count entries within budget', async () => {
      const memory = new ShortTermMemory();
      await populateMemory(memory, 500);

      const result = await measurePerformance(
        'Memory count (500 entries)',
        async () => {
          await memory.count();
        },
        { iterations: 10000, budget: PERFORMANCE_BUDGETS.memoryGet },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });
  });

  describe('ShortTermMemory.delete', () => {
    it('should delete entries within budget', async () => {
      const memory = new ShortTermMemory();
      const ids = await populateMemory(memory, 2000);
      let idx = 0;

      const result = await measurePerformance(
        'Memory delete (from 2000 entries)',
        async () => {
          if (idx < ids.length) {
            await memory.delete(ids[idx]!);
            idx++;
          }
        },
        { iterations: 1000, budget: PERFORMANCE_BUDGETS.memoryGet },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });
  });
});
