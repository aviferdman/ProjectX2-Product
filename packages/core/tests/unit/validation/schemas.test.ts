import { describe, it, expect } from 'vitest';

import {
  AgentConfigSchema,
  TaskConfigSchema,
  CrewTaskSchema,
  CrewConfigSchema,
  ExecutionEngineConfigSchema,
  LLMRequestOptionsSchema,
} from '../../../src/validation/schemas.js';
import { TaskPriority } from '../../../src/types/task.js';
import { ExecutionStrategy } from '../../../src/engine/types.js';
import type { Tool } from '../../../src/types/tool.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createValidAgentConfig() {
  return {
    id: 'researcher',
    role: 'Senior Analyst',
    goal: 'Find relevant data',
  };
}

function createMockTool(name = 'mockTool'): Tool {
  return {
    name,
    description: `Mock tool ${name}`,
    execute: async () => 'result',
  };
}

function createMockAgent(id = 'agent-1') {
  return { id, execute: async () => ({ output: '', agentId: id, duration: 0 }) };
}

function createValidTaskConfig() {
  return {
    id: 'task-1',
    description: 'Analyze market data',
  };
}

function createValidCrewTask() {
  return {
    id: 'crew-task-1',
    description: 'Research competitors',
    agentId: 'researcher',
  };
}

function createValidCrewConfig() {
  return {
    id: 'crew-1',
    agents: [createMockAgent()],
    tasks: [{ id: 'task-1', description: 'Do work', agentId: 'agent-1' }],
  };
}

function createValidEngineConfig() {
  return { id: 'engine-1' };
}

// ---------------------------------------------------------------------------
// AgentConfigSchema
// ---------------------------------------------------------------------------

describe('AgentConfigSchema', () => {
  it('should accept valid minimal config', () => {
    const result = AgentConfigSchema.safeParse(createValidAgentConfig());
    expect(result.success).toBe(true);
  });

  it('should accept valid full config', () => {
    const config = {
      ...createValidAgentConfig(),
      backstory: 'Expert with 10 years experience',
      tools: [createMockTool()],
      maxIterations: 20,
      verbose: true,
    };
    const result = AgentConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  describe('id validation', () => {
    it('should reject empty id', () => {
      const result = AgentConfigSchema.safeParse({ ...createValidAgentConfig(), id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject id with spaces', () => {
      const result = AgentConfigSchema.safeParse({ ...createValidAgentConfig(), id: 'my agent' });
      expect(result.success).toBe(false);
    });

    it('should reject id with special characters', () => {
      const result = AgentConfigSchema.safeParse({ ...createValidAgentConfig(), id: 'agent@1' });
      expect(result.success).toBe(false);
    });

    it('should accept id with dashes and underscores', () => {
      const result = AgentConfigSchema.safeParse({
        ...createValidAgentConfig(),
        id: 'my-agent_01',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing id', () => {
      const { id: _id, ...noId } = createValidAgentConfig();
      const result = AgentConfigSchema.safeParse(noId);
      expect(result.success).toBe(false);
    });
  });

  describe('role validation', () => {
    it('should reject empty role', () => {
      const result = AgentConfigSchema.safeParse({ ...createValidAgentConfig(), role: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing role', () => {
      const { role: _role, ...noRole } = createValidAgentConfig();
      const result = AgentConfigSchema.safeParse(noRole);
      expect(result.success).toBe(false);
    });
  });

  describe('goal validation', () => {
    it('should reject empty goal', () => {
      const result = AgentConfigSchema.safeParse({ ...createValidAgentConfig(), goal: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing goal', () => {
      const { goal: _goal, ...noGoal } = createValidAgentConfig();
      const result = AgentConfigSchema.safeParse(noGoal);
      expect(result.success).toBe(false);
    });
  });

  describe('maxIterations validation', () => {
    it('should reject zero', () => {
      const result = AgentConfigSchema.safeParse({
        ...createValidAgentConfig(),
        maxIterations: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative', () => {
      const result = AgentConfigSchema.safeParse({
        ...createValidAgentConfig(),
        maxIterations: -5,
      });
      expect(result.success).toBe(false);
    });

    it('should reject above upper bound (100)', () => {
      const result = AgentConfigSchema.safeParse({
        ...createValidAgentConfig(),
        maxIterations: 101,
      });
      expect(result.success).toBe(false);
    });

    it('should accept exactly 100', () => {
      const result = AgentConfigSchema.safeParse({
        ...createValidAgentConfig(),
        maxIterations: 100,
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-integer', () => {
      const result = AgentConfigSchema.safeParse({
        ...createValidAgentConfig(),
        maxIterations: 5.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('tools validation', () => {
    it('should reject tool without name', () => {
      const result = AgentConfigSchema.safeParse({
        ...createValidAgentConfig(),
        tools: [{ execute: async () => 'x' }],
      });
      expect(result.success).toBe(false);
    });

    it('should reject tool without execute', () => {
      const result = AgentConfigSchema.safeParse({
        ...createValidAgentConfig(),
        tools: [{ name: 'tool1' }],
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty tools array', () => {
      const result = AgentConfigSchema.safeParse({
        ...createValidAgentConfig(),
        tools: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('optional fields', () => {
    it('should accept undefined backstory', () => {
      const result = AgentConfigSchema.safeParse(createValidAgentConfig());
      expect(result.success).toBe(true);
    });

    it('should accept undefined verbose', () => {
      const result = AgentConfigSchema.safeParse(createValidAgentConfig());
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean verbose', () => {
      const result = AgentConfigSchema.safeParse({
        ...createValidAgentConfig(),
        verbose: 'yes',
      });
      expect(result.success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// TaskConfigSchema
// ---------------------------------------------------------------------------

describe('TaskConfigSchema', () => {
  it('should accept valid minimal config', () => {
    const result = TaskConfigSchema.safeParse(createValidTaskConfig());
    expect(result.success).toBe(true);
  });

  it('should accept valid full config', () => {
    const config = {
      ...createValidTaskConfig(),
      expectedOutput: 'A report',
      agentId: 'agent-1',
      context: { key: 'value' },
      dependencies: ['task-0'],
      timeout: 30_000,
      retries: 3,
      priority: TaskPriority.HIGH,
      metadata: { source: 'test' },
    };
    const result = TaskConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  describe('id validation', () => {
    it('should reject empty id', () => {
      const result = TaskConfigSchema.safeParse({ ...createValidTaskConfig(), id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject id with special chars', () => {
      const result = TaskConfigSchema.safeParse({ ...createValidTaskConfig(), id: 'task#1' });
      expect(result.success).toBe(false);
    });
  });

  describe('description validation', () => {
    it('should reject empty description', () => {
      const result = TaskConfigSchema.safeParse({
        ...createValidTaskConfig(),
        description: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('agentId validation', () => {
    it('should reject empty agentId', () => {
      const result = TaskConfigSchema.safeParse({
        ...createValidTaskConfig(),
        agentId: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject agentId with special chars', () => {
      const result = TaskConfigSchema.safeParse({
        ...createValidTaskConfig(),
        agentId: 'agent@1',
      });
      expect(result.success).toBe(false);
    });

    it('should accept omitted agentId', () => {
      const result = TaskConfigSchema.safeParse(createValidTaskConfig());
      expect(result.success).toBe(true);
    });
  });

  describe('timeout validation', () => {
    it('should reject zero timeout', () => {
      const result = TaskConfigSchema.safeParse({
        ...createValidTaskConfig(),
        timeout: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative timeout', () => {
      const result = TaskConfigSchema.safeParse({
        ...createValidTaskConfig(),
        timeout: -100,
      });
      expect(result.success).toBe(false);
    });

    it('should reject timeout exceeding 600000ms', () => {
      const result = TaskConfigSchema.safeParse({
        ...createValidTaskConfig(),
        timeout: 600_001,
      });
      expect(result.success).toBe(false);
    });

    it('should accept exactly 600000ms', () => {
      const result = TaskConfigSchema.safeParse({
        ...createValidTaskConfig(),
        timeout: 600_000,
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-integer timeout', () => {
      const result = TaskConfigSchema.safeParse({
        ...createValidTaskConfig(),
        timeout: 1000.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('retries validation', () => {
    it('should accept zero retries', () => {
      const result = TaskConfigSchema.safeParse({
        ...createValidTaskConfig(),
        retries: 0,
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative retries', () => {
      const result = TaskConfigSchema.safeParse({
        ...createValidTaskConfig(),
        retries: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject retries exceeding 10', () => {
      const result = TaskConfigSchema.safeParse({
        ...createValidTaskConfig(),
        retries: 11,
      });
      expect(result.success).toBe(false);
    });

    it('should accept exactly 10 retries', () => {
      const result = TaskConfigSchema.safeParse({
        ...createValidTaskConfig(),
        retries: 10,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('priority validation', () => {
    it('should accept valid priority enum values', () => {
      for (const p of [
        TaskPriority.LOW,
        TaskPriority.MEDIUM,
        TaskPriority.HIGH,
        TaskPriority.CRITICAL,
      ]) {
        const result = TaskConfigSchema.safeParse({ ...createValidTaskConfig(), priority: p });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid priority string', () => {
      const result = TaskConfigSchema.safeParse({
        ...createValidTaskConfig(),
        priority: 'urgent',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('dependencies validation', () => {
    it('should reject empty strings in dependencies', () => {
      const result = TaskConfigSchema.safeParse({
        ...createValidTaskConfig(),
        dependencies: ['task-0', ''],
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty dependencies array', () => {
      const result = TaskConfigSchema.safeParse({
        ...createValidTaskConfig(),
        dependencies: [],
      });
      expect(result.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// CrewTaskSchema
// ---------------------------------------------------------------------------

describe('CrewTaskSchema', () => {
  it('should accept valid minimal crew task', () => {
    const result = CrewTaskSchema.safeParse(createValidCrewTask());
    expect(result.success).toBe(true);
  });

  it('should accept full crew task', () => {
    const config = {
      ...createValidCrewTask(),
      expectedOutput: 'Report',
      context: { data: [1, 2, 3] },
      dependencies: ['other-task'],
    };
    const result = CrewTaskSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should reject missing agentId', () => {
    const { agentId: _agentId, ...noAgent } = createValidCrewTask();
    const result = CrewTaskSchema.safeParse(noAgent);
    expect(result.success).toBe(false);
  });

  it('should reject empty agentId', () => {
    const result = CrewTaskSchema.safeParse({ ...createValidCrewTask(), agentId: '' });
    expect(result.success).toBe(false);
  });

  it('should reject empty id', () => {
    const result = CrewTaskSchema.safeParse({ ...createValidCrewTask(), id: '' });
    expect(result.success).toBe(false);
  });

  it('should reject id with invalid characters', () => {
    const result = CrewTaskSchema.safeParse({ ...createValidCrewTask(), id: 'task 1!' });
    expect(result.success).toBe(false);
  });

  it('should reject empty description', () => {
    const result = CrewTaskSchema.safeParse({ ...createValidCrewTask(), description: '' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CrewConfigSchema
// ---------------------------------------------------------------------------

describe('CrewConfigSchema', () => {
  it('should accept valid minimal config', () => {
    const result = CrewConfigSchema.safeParse(createValidCrewConfig());
    expect(result.success).toBe(true);
  });

  it('should accept config with name and verbose', () => {
    const config = {
      ...createValidCrewConfig(),
      name: 'Research Crew',
      verbose: true,
    };
    const result = CrewConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should reject empty id', () => {
    const result = CrewConfigSchema.safeParse({ ...createValidCrewConfig(), id: '' });
    expect(result.success).toBe(false);
  });

  it('should reject id with special characters', () => {
    const result = CrewConfigSchema.safeParse({ ...createValidCrewConfig(), id: 'crew@1' });
    expect(result.success).toBe(false);
  });

  it('should reject empty agents array', () => {
    const result = CrewConfigSchema.safeParse({ ...createValidCrewConfig(), agents: [] });
    expect(result.success).toBe(false);
  });

  it('should reject empty tasks array', () => {
    const result = CrewConfigSchema.safeParse({ ...createValidCrewConfig(), tasks: [] });
    expect(result.success).toBe(false);
  });

  it('should reject agent without id', () => {
    const result = CrewConfigSchema.safeParse({
      ...createValidCrewConfig(),
      agents: [{ execute: async () => ({}) }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject agent without execute method', () => {
    const result = CrewConfigSchema.safeParse({
      ...createValidCrewConfig(),
      agents: [{ id: 'agent-1' }],
    });
    expect(result.success).toBe(false);
  });

  it('should validate nested task schemas', () => {
    const result = CrewConfigSchema.safeParse({
      ...createValidCrewConfig(),
      tasks: [{ id: '', description: 'test', agentId: 'a' }],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ExecutionEngineConfigSchema
// ---------------------------------------------------------------------------

describe('ExecutionEngineConfigSchema', () => {
  it('should accept valid minimal config', () => {
    const result = ExecutionEngineConfigSchema.safeParse(createValidEngineConfig());
    expect(result.success).toBe(true);
  });

  it('should accept valid full config', () => {
    const config = {
      id: 'engine-1',
      strategy: ExecutionStrategy.PARALLEL,
      maxConcurrency: 10,
      globalTimeout: 60_000,
      taskErrorPolicy: 'continue' as const,
      verbose: true,
    };
    const result = ExecutionEngineConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  describe('id validation', () => {
    it('should reject empty id', () => {
      const result = ExecutionEngineConfigSchema.safeParse({ id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject id with special chars', () => {
      const result = ExecutionEngineConfigSchema.safeParse({ id: 'engine!1' });
      expect(result.success).toBe(false);
    });
  });

  describe('strategy validation', () => {
    it('should accept sequential strategy', () => {
      const result = ExecutionEngineConfigSchema.safeParse({
        ...createValidEngineConfig(),
        strategy: ExecutionStrategy.SEQUENTIAL,
      });
      expect(result.success).toBe(true);
    });

    it('should accept parallel strategy', () => {
      const result = ExecutionEngineConfigSchema.safeParse({
        ...createValidEngineConfig(),
        strategy: ExecutionStrategy.PARALLEL,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid strategy', () => {
      const result = ExecutionEngineConfigSchema.safeParse({
        ...createValidEngineConfig(),
        strategy: 'random',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('maxConcurrency validation', () => {
    it('should reject zero', () => {
      const result = ExecutionEngineConfigSchema.safeParse({
        ...createValidEngineConfig(),
        maxConcurrency: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject above upper bound (100)', () => {
      const result = ExecutionEngineConfigSchema.safeParse({
        ...createValidEngineConfig(),
        maxConcurrency: 101,
      });
      expect(result.success).toBe(false);
    });

    it('should accept exactly 100', () => {
      const result = ExecutionEngineConfigSchema.safeParse({
        ...createValidEngineConfig(),
        maxConcurrency: 100,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('globalTimeout validation', () => {
    it('should reject zero', () => {
      const result = ExecutionEngineConfigSchema.safeParse({
        ...createValidEngineConfig(),
        globalTimeout: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject above 3600000ms', () => {
      const result = ExecutionEngineConfigSchema.safeParse({
        ...createValidEngineConfig(),
        globalTimeout: 3_600_001,
      });
      expect(result.success).toBe(false);
    });

    it('should accept exactly 3600000ms', () => {
      const result = ExecutionEngineConfigSchema.safeParse({
        ...createValidEngineConfig(),
        globalTimeout: 3_600_000,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('taskErrorPolicy validation', () => {
    it('should accept fail-fast', () => {
      const result = ExecutionEngineConfigSchema.safeParse({
        ...createValidEngineConfig(),
        taskErrorPolicy: 'fail-fast',
      });
      expect(result.success).toBe(true);
    });

    it('should accept continue', () => {
      const result = ExecutionEngineConfigSchema.safeParse({
        ...createValidEngineConfig(),
        taskErrorPolicy: 'continue',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid policy', () => {
      const result = ExecutionEngineConfigSchema.safeParse({
        ...createValidEngineConfig(),
        taskErrorPolicy: 'ignore',
      });
      expect(result.success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// LLMRequestOptionsSchema
// ---------------------------------------------------------------------------

describe('LLMRequestOptionsSchema', () => {
  it('should accept empty object', () => {
    const result = LLMRequestOptionsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept valid full options', () => {
    const result = LLMRequestOptionsSchema.safeParse({
      temperature: 0.7,
      maxTokens: 4096,
      stopSequences: ['END', 'STOP'],
    });
    expect(result.success).toBe(true);
  });

  describe('temperature validation', () => {
    it('should accept 0', () => {
      const result = LLMRequestOptionsSchema.safeParse({ temperature: 0 });
      expect(result.success).toBe(true);
    });

    it('should accept 2', () => {
      const result = LLMRequestOptionsSchema.safeParse({ temperature: 2 });
      expect(result.success).toBe(true);
    });

    it('should reject below 0', () => {
      const result = LLMRequestOptionsSchema.safeParse({ temperature: -0.1 });
      expect(result.success).toBe(false);
    });

    it('should reject above 2', () => {
      const result = LLMRequestOptionsSchema.safeParse({ temperature: 2.1 });
      expect(result.success).toBe(false);
    });
  });

  describe('maxTokens validation', () => {
    it('should reject zero', () => {
      const result = LLMRequestOptionsSchema.safeParse({ maxTokens: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject negative', () => {
      const result = LLMRequestOptionsSchema.safeParse({ maxTokens: -100 });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer', () => {
      const result = LLMRequestOptionsSchema.safeParse({ maxTokens: 100.5 });
      expect(result.success).toBe(false);
    });

    it('should accept positive integer', () => {
      const result = LLMRequestOptionsSchema.safeParse({ maxTokens: 8192 });
      expect(result.success).toBe(true);
    });
  });

  describe('stopSequences validation', () => {
    it('should accept empty array', () => {
      const result = LLMRequestOptionsSchema.safeParse({ stopSequences: [] });
      expect(result.success).toBe(true);
    });

    it('should reject non-string elements', () => {
      const result = LLMRequestOptionsSchema.safeParse({ stopSequences: [123] });
      expect(result.success).toBe(false);
    });
  });
});
