/**
 * QA validation tests for TASK-014: Agent class implementation
 *
 * These tests validate:
 * - Agent class correctness beyond unit tests
 * - Edge cases and integration scenarios
 * - TypeScript type safety and public API contract
 * - Event emission and lifecycle management
 * - Error handling robustness
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Agent } from '../../src/agent/agent.js';
import { AgentConfigError, AgentExecutionError } from '../../src/errors/index.js';
import { AgentStatus } from '../../src/types/agent.js';
import { LLMRole } from '../../src/types/llm.js';
import type {
  LLMProvider,
  LLMResponse,
  LLMMessage,
  Tool,
  TaskInput,
  AgentConfig,
} from '../../src/types/index.js';

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function createMockLLMProvider(options?: {
  shouldFail?: boolean;
  response?: Partial<LLMResponse>;
  delay?: number;
}): LLMProvider {
  const { shouldFail = false, response = {}, delay = 0 } = options ?? {};

  return {
    name: 'qa-mock-provider',
    generateText: vi.fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>(async () => {
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
      if (shouldFail) throw new Error('Mock LLM provider failure');

      return {
        content: response.content ?? 'QA mock response',
        tokenUsage: response.tokenUsage ?? {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
        finishReason: response.finishReason ?? 'stop',
      };
    }),
  };
}

function createMockTool(options?: {
  name?: string;
  shouldFail?: boolean;
  delay?: number;
  result?: unknown;
}): Tool {
  const { name = 'qa-tool', shouldFail = false, delay = 0, result = 'tool executed' } = options ?? {};

  return {
    name,
    description: `QA tool: ${name}`,
    execute: vi.fn<(input: unknown) => Promise<unknown>>(async () => {
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
      if (shouldFail) throw new Error(`Tool ${name} execution failed`);
      return result;
    }),
  };
}

// ---------------------------------------------------------------------------
// QA Test Suites
// ---------------------------------------------------------------------------

describe('TASK-014 QA: Agent Class Implementation', () => {
  describe('Agent ID Validation (Security & Naming)', () => {
    it('should accept valid alphanumeric IDs', () => {
      expect(() => new Agent({ id: 'agent123', role: 'Test', goal: 'Test' })).not.toThrow();
      expect(() => new Agent({ id: 'agent-123', role: 'Test', goal: 'Test' })).not.toThrow();
      expect(() => new Agent({ id: 'agent_123', role: 'Test', goal: 'Test' })).not.toThrow();
      expect(() => new Agent({ id: 'AGENT_TEST_001', role: 'Test', goal: 'Test' })).not.toThrow();
    });

    it('should reject IDs with invalid characters', () => {
      expect(() => new Agent({ id: 'agent@123', role: 'Test', goal: 'Test' })).toThrow(
        AgentConfigError,
      );
      expect(() => new Agent({ id: 'agent#123', role: 'Test', goal: 'Test' })).toThrow(
        AgentConfigError,
      );
      expect(() => new Agent({ id: 'agent.123', role: 'Test', goal: 'Test' })).toThrow(
        AgentConfigError,
      );
      expect(() => new Agent({ id: 'agent 123', role: 'Test', goal: 'Test' })).toThrow(
        AgentConfigError,
      );
    });

    it('should reject empty or whitespace-only IDs', () => {
      expect(() => new Agent({ id: '', role: 'Test', goal: 'Test' })).toThrow(AgentConfigError);
      expect(() => new Agent({ id: '   ', role: 'Test', goal: 'Test' })).toThrow(AgentConfigError);
    });
  });

  describe('Tool Management', () => {
    it('should handle multiple tools with unique names', () => {
      const tool1 = createMockTool({ name: 'search' });
      const tool2 = createMockTool({ name: 'analyze' });
      const tool3 = createMockTool({ name: 'report' });

      const agent = new Agent({
        id: 'multi-tool-agent',
        role: 'Analyst',
        goal: 'Analyze data',
        tools: [tool1, tool2, tool3],
      });

      expect(agent.tools.size).toBe(3);
      expect(agent.tools.get('search')).toBe(tool1);
      expect(agent.tools.get('analyze')).toBe(tool2);
      expect(agent.tools.get('report')).toBe(tool3);
    });

    it('should handle tools being added via addTool', () => {
      const agent = new Agent({ id: 'test', role: 'Test', goal: 'Test' });
      const tool = createMockTool({ name: 'new-tool' });

      agent.addTool(tool);

      expect(agent.tools.size).toBe(1);
      expect(agent.tools.get('new-tool')).toBe(tool);
    });

    it('should handle tools being removed via removeTool', () => {
      const tool = createMockTool({ name: 'removable' });
      const agent = new Agent({ id: 'test', role: 'Test', goal: 'Test', tools: [tool] });

      expect(agent.tools.size).toBe(1);

      agent.removeTool('removable');

      expect(agent.tools.size).toBe(0);
      expect(agent.tools.get('removable')).toBeUndefined();
    });

    it('should not fail when removing non-existent tool', () => {
      const agent = new Agent({ id: 'test', role: 'Test', goal: 'Test' });

      expect(() => agent.removeTool('non-existent')).not.toThrow();
    });
  });

  describe('LLM Provider Management', () => {
    it('should allow setting LLM provider after construction', () => {
      const agent = new Agent({ id: 'test', role: 'Test', goal: 'Test' });
      expect(agent.llmProvider).toBeUndefined();

      const provider = createMockLLMProvider();
      agent.setLLMProvider(provider);

      expect(agent.llmProvider).toBe(provider);
    });

    it('should allow replacing existing LLM provider', () => {
      const provider1 = createMockLLMProvider();
      const provider2 = createMockLLMProvider();

      const agent = new Agent({ id: 'test', role: 'Test', goal: 'Test', llmProvider: provider1 });
      expect(agent.llmProvider).toBe(provider1);

      agent.setLLMProvider(provider2);
      expect(agent.llmProvider).toBe(provider2);
    });
  });

  describe('Status Management', () => {
    it('should initialize with IDLE status', () => {
      const agent = new Agent({ id: 'test', role: 'Test', goal: 'Test' });
      expect(agent.status).toBe(AgentStatus.IDLE);
    });

    it('should transition to EXECUTING during execution', async () => {
      const provider = createMockLLMProvider();
      const agent = new Agent({ id: 'test', role: 'Test', goal: 'Test', llmProvider: provider });

      let statusDuringExecution: AgentStatus | undefined;

      agent.on('agent:llm:start', () => {
        statusDuringExecution = agent.status;
      });

      await agent.execute({ description: 'Test task' });

      expect(statusDuringExecution).toBe(AgentStatus.EXECUTING);
      expect(agent.status).toBe(AgentStatus.IDLE); // Should return to IDLE after completion
    });

    it('should transition to ERROR on execution failure', async () => {
      const provider = createMockLLMProvider({ shouldFail: true });
      const agent = new Agent({ id: 'test', role: 'Test', goal: 'Test', llmProvider: provider });

      await expect(agent.execute({ description: 'Test task' })).rejects.toThrow();
      expect(agent.status).toBe(AgentStatus.ERROR);
    });
  });

  describe('Event Emission', () => {
    it('should emit agent:start and agent:complete events on successful execution', async () => {
      const provider = createMockLLMProvider();
      const agent = new Agent({ id: 'event-test', role: 'Test', goal: 'Test', llmProvider: provider });

      const startListener = vi.fn();
      const completeListener = vi.fn();

      agent.on('agent:start', startListener);
      agent.on('agent:complete', completeListener);

      await agent.execute({ description: 'Test task' });

      expect(startListener).toHaveBeenCalledOnce();
      expect(startListener).toHaveBeenCalledWith('event-test', { description: 'Test task' });
      expect(completeListener).toHaveBeenCalledOnce();
      expect(completeListener).toHaveBeenCalledWith('event-test', expect.any(Object));
    });

    it('should emit agent:error event on execution failure', async () => {
      const provider = createMockLLMProvider({ shouldFail: true });
      const agent = new Agent({ id: 'error-test', role: 'Test', goal: 'Test', llmProvider: provider });

      const errorListener = vi.fn();
      agent.on('agent:error', errorListener);

      await expect(agent.execute({ description: 'Test task' })).rejects.toThrow();

      expect(errorListener).toHaveBeenCalledOnce();
      expect(errorListener).toHaveBeenCalledWith('error-test', expect.any(Error));
    });

    it('should emit agent:status-changed events on status transitions', async () => {
      const provider = createMockLLMProvider();
      const agent = new Agent({ id: 'status-test', role: 'Test', goal: 'Test', llmProvider: provider });

      const statusChanges: AgentStatus[] = [];
      agent.on('agent:status-changed', (agentId, status) => {
        statusChanges.push(status);
      });

      await agent.execute({ description: 'Test task' });

      expect(statusChanges).toContain(AgentStatus.EXECUTING);
      expect(statusChanges).toContain(AgentStatus.IDLE);
    });

    it('should emit LLM lifecycle events', async () => {
      const provider = createMockLLMProvider();
      const agent = new Agent({ id: 'llm-test', role: 'Test', goal: 'Test', llmProvider: provider });

      const llmStartListener = vi.fn();
      const llmCompleteListener = vi.fn();

      agent.on('agent:llm:start', llmStartListener);
      agent.on('agent:llm:complete', llmCompleteListener);

      await agent.execute({ description: 'Test task' });

      expect(llmStartListener).toHaveBeenCalledWith('llm-test');
      expect(llmCompleteListener).toHaveBeenCalledWith('llm-test', expect.any(Object));
    });
  });

  describe('Error Handling', () => {
    it('should throw AgentConfigError for invalid configuration', () => {
      expect(() => new Agent({ id: '', role: 'Test', goal: 'Test' })).toThrow(AgentConfigError);
      expect(() => new Agent({ id: 'test', role: '', goal: 'Test' })).toThrow(AgentConfigError);
      expect(() => new Agent({ id: 'test', role: 'Test', goal: '' })).toThrow(AgentConfigError);
    });

    it('should throw AgentExecutionError when executing without LLM provider', async () => {
      const agent = new Agent({ id: 'test', role: 'Test', goal: 'Test' });

      await expect(agent.execute({ description: 'Test' })).rejects.toThrow(AgentExecutionError);
    });

    it('should propagate LLM provider errors as AgentExecutionError', async () => {
      const provider = createMockLLMProvider({ shouldFail: true });
      const agent = new Agent({ id: 'test', role: 'Test', goal: 'Test', llmProvider: provider });

      await expect(agent.execute({ description: 'Test' })).rejects.toThrow(AgentExecutionError);
    });
  });

  describe('Max Iterations', () => {
    it('should respect default maxIterations of 10', () => {
      const agent = new Agent({ id: 'test', role: 'Test', goal: 'Test' });
      expect(agent.maxIterations).toBe(10);
    });

    it('should accept custom maxIterations', () => {
      const agent = new Agent({ id: 'test', role: 'Test', goal: 'Test', maxIterations: 20 });
      expect(agent.maxIterations).toBe(20);
    });

    it('should reject maxIterations exceeding 100', () => {
      expect(() => new Agent({ id: 'test', role: 'Test', goal: 'Test', maxIterations: 101 })).toThrow(
        AgentConfigError,
      );
    });

    it('should reject non-positive maxIterations', () => {
      expect(() => new Agent({ id: 'test', role: 'Test', goal: 'Test', maxIterations: 0 })).toThrow(
        AgentConfigError,
      );
      expect(() => new Agent({ id: 'test', role: 'Test', goal: 'Test', maxIterations: -1 })).toThrow(
        AgentConfigError,
      );
    });
  });

  describe('TypeScript Type Safety (Compile-time)', () => {
    it('should enforce readonly config properties', () => {
      const agent = new Agent({ id: 'test', role: 'Test', goal: 'Test' });

      // These should be readonly and cause TypeScript errors if uncommented:
      // agent.id = 'new-id'; // TS2540: Cannot assign to 'id' because it is a read-only property
      // agent.role = 'new-role'; // TS2540
      // agent.goal = 'new-goal'; // TS2540
      // agent.maxIterations = 5; // TS2540

      expect(agent.id).toBe('test');
      expect(agent.role).toBe('Test');
      expect(agent.goal).toBe('Test');
    });
  });

  describe('Public API Contract', () => {
    it('should expose required public properties', () => {
      const agent = new Agent({ id: 'api-test', role: 'Tester', goal: 'Test API' });

      // Public properties that should be accessible
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('role');
      expect(agent).toHaveProperty('goal');
      expect(agent).toHaveProperty('backstory');
      expect(agent).toHaveProperty('maxIterations');
      expect(agent).toHaveProperty('verbose');
      expect(agent).toHaveProperty('status');
      expect(agent).toHaveProperty('tools');
      expect(agent).toHaveProperty('llmProvider');
    });

    it('should expose required public methods', () => {
      const agent = new Agent({ id: 'api-test', role: 'Tester', goal: 'Test API' });

      expect(agent).toHaveProperty('setLLMProvider');
      expect(agent).toHaveProperty('addTool');
      expect(agent).toHaveProperty('removeTool');
      expect(agent).toHaveProperty('execute');
      expect(agent).toHaveProperty('on'); // EventEmitter method
      expect(agent).toHaveProperty('off'); // EventEmitter method
      // Note: 'emit' is intentionally not exposed in the public API
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complex multi-tool execution scenarios', async () => {
      const tool1 = createMockTool({ name: 'fetch-data', result: { data: [1, 2, 3] } });
      const tool2 = createMockTool({ name: 'analyze', result: { mean: 2 } });
      const provider = createMockLLMProvider();

      const agent = new Agent({
        id: 'analyst',
        role: 'Data Analyst',
        goal: 'Analyze dataset',
        tools: [tool1, tool2],
        llmProvider: provider,
      });

      const result = await agent.execute({ description: 'Analyze the data' });

      expect(result).toBeDefined();
      expect(result.output).toBe('QA mock response');
    });

    it('should handle rapid sequential executions', async () => {
      const provider = createMockLLMProvider();
      const agent = new Agent({ id: 'test', role: 'Test', goal: 'Test', llmProvider: provider });

      const results = await Promise.all([
        agent.execute({ description: 'Task 1' }),
        agent.execute({ description: 'Task 2' }),
        agent.execute({ description: 'Task 3' }),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.output).toBe('QA mock response');
      });
    });
  });
});
