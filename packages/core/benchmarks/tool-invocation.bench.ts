/**
 * Tool invocation benchmarks.
 *
 * Measures ToolExecutor.execute performance with varying tool configurations.
 * Budget: <50ms per invocation.
 */

import { describe, it, expect } from 'vitest';

import { PermissionManager, ALLOW_ALL_POLICY } from '../src/tool/permission-manager.js';
import { ToolExecutor } from '../src/tool/tool-executor.js';
import { ToolRegistry } from '../src/tool/tool-registry.js';
import { createTool } from '../src/tool/create-tool.js';
import { z } from 'zod';
import {
  PERFORMANCE_BUDGETS,
  createMockTool,
  measurePerformance,
  formatResult,
} from './helpers.js';

describe('Tool Invocation Benchmarks', () => {
  describe('ToolExecutor.execute', () => {
    it('should execute a simple tool within budget', async () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const tool = createMockTool('simple-bench');

      const result = await measurePerformance(
        'Tool execute (simple, no validation)',
        async () => {
          await executor.execute(tool, { data: 'test' });
        },
        { iterations: 5000, budget: PERFORMANCE_BUDGETS.toolInvocation },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });

    it('should execute a tool with Zod validation within budget', async () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const tool = createTool({
        name: 'validated-bench',
        description: 'A tool with Zod input validation',
        inputZodSchema: z.object({
          query: z.string().min(1),
          limit: z.number().int().positive().optional(),
        }),
        execute: async (input) => ({ result: input }),
      });

      const result = await measurePerformance(
        'Tool execute (with Zod validation)',
        async () => {
          await executor.execute(tool, { query: 'benchmark test', limit: 10 });
        },
        { iterations: 5000, budget: PERFORMANCE_BUDGETS.toolInvocation },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });

    it('should execute a tool with complex schema within budget', async () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const tool = createTool({
        name: 'complex-bench',
        description: 'A tool with complex Zod schema',
        inputZodSchema: z.object({
          name: z.string().min(1).max(100),
          tags: z.array(z.string()).max(10).optional(),
          config: z
            .object({
              enabled: z.boolean(),
              threshold: z.number().min(0).max(1),
              mode: z.enum(['fast', 'balanced', 'thorough']),
            })
            .optional(),
        }),
        execute: async (input) => ({ processed: input }),
      });

      const result = await measurePerformance(
        'Tool execute (complex schema validation)',
        async () => {
          await executor.execute(tool, {
            name: 'benchmark',
            tags: ['perf', 'test'],
            config: { enabled: true, threshold: 0.5, mode: 'fast' },
          });
        },
        { iterations: 5000, budget: PERFORMANCE_BUDGETS.toolInvocation },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });

    it('should execute tool with registry lookup within budget', async () => {
      const registry = new ToolRegistry();
      for (let i = 0; i < 20; i++) {
        registry.register(createMockTool(`registry-tool-${String(i)}`));
      }

      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY), {
        registry,
      });
      const tool = createMockTool('target-tool');
      registry.register(tool);

      const result = await measurePerformance(
        'Tool execute (with registry, 21 tools)',
        async () => {
          await executor.execute(tool, { data: 'test' });
        },
        { iterations: 5000, budget: PERFORMANCE_BUDGETS.toolInvocation },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });
  });

  describe('ToolExecutor construction', () => {
    it('should create executor within budget', async () => {
      const result = await measurePerformance(
        'ToolExecutor construction',
        () => {
          const pm = new PermissionManager(ALLOW_ALL_POLICY);
          new ToolExecutor(pm);
        },
        { iterations: 10000, budget: PERFORMANCE_BUDGETS.toolInvocation },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });
  });

  describe('ToolRegistry operations', () => {
    it('should register tools within budget', async () => {
      let counter = 0;
      const result = await measurePerformance(
        'ToolRegistry.register (to 1000 tools)',
        () => {
          const registry = new ToolRegistry();
          for (let i = 0; i < 100; i++) {
            registry.register(createMockTool(`tool-${String(counter++)}`));
          }
        },
        { iterations: 500, budget: PERFORMANCE_BUDGETS.toolInvocation },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });

    it('should look up tools by name within budget', async () => {
      const registry = new ToolRegistry();
      for (let i = 0; i < 100; i++) {
        registry.register(createMockTool(`tool-${String(i)}`));
      }

      const result = await measurePerformance(
        'ToolRegistry.get (100 tools)',
        () => {
          registry.get('tool-50');
        },
        { iterations: 10000, budget: PERFORMANCE_BUDGETS.toolInvocation },
      );

      console.log(formatResult(result));
      expect(result.withinBudget).toBe(true);
    });
  });
});
