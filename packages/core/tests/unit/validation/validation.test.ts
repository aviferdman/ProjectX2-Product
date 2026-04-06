/**
 * Unit tests for the validation module.
 *
 * Tests cover:
 * - Zod schemas for all config types
 * - validate*() throwing functions
 * - safeValidate*() non-throwing functions
 * - ValidationError structure and issues array
 * - Edge cases and boundary values
 */

import { describe, expect, it } from 'vitest';

import {
  AgentConfigSchema,
  CrewConfigSchema,
  CrewTaskSchema,
  ExecutionEngineConfigSchema,
  LLMRequestOptionsSchema,
  TaskConfigSchema,
  safeValidateAgentConfig,
  safeValidateCrewConfig,
  safeValidateCrewTask,
  safeValidateEngineConfig,
  safeValidateLLMRequestOptions,
  safeValidateTaskConfig,
  validateAgentConfig,
  validateCrewConfig,
  validateCrewTask,
  validateEngineConfig,
  validateLLMRequestOptions,
  validateTaskConfig,
  ValidationError,
} from '../../../src/validation/index.js';
import { ExecutionStrategy } from '../../../src/engine/types.js';
import { TaskPriority } from '../../../src/types/task.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createMockAgent(id: string) {
  return {
    id,
    role: 'Test',
    goal: 'Test',
    execute: async () => ({ output: '', agentId: id, duration: 0 }),
  };
}

function createMockTool(name: string) {
  return {
    name,
    description: `Tool: ${name}`,
    execute: async () => 'result',
  };
}

// ---------------------------------------------------------------------------
// AgentConfig schemas
// ---------------------------------------------------------------------------

describe('AgentConfigSchema', () => {
  it('should validate a minimal valid config', () => {
    const result = AgentConfigSchema.safeParse({
      id: 'researcher',
      role: 'Research Analyst',
      goal: 'Find papers',
    });
    expect(result.success).toBe(true);
  });

  it('should validate a full config', () => {
    const result = AgentConfigSchema.safeParse({
      id: 'researcher',
      role: 'Research Analyst',
      goal: 'Find papers',
      backstory: 'Expert in ML',
      tools: [createMockTool('search')],
      maxIterations: 5,
      verbose: true,
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty id', () => {
    const result = AgentConfigSchema.safeParse({ id: '', role: 'R', goal: 'G' });
    expect(result.success).toBe(false);
  });

  it('should reject id with spaces', () => {
    const result = AgentConfigSchema.safeParse({ id: 'has spaces', role: 'R', goal: 'G' });
    expect(result.success).toBe(false);
  });

  it('should reject empty role', () => {
    const result = AgentConfigSchema.safeParse({ id: 'a', role: '', goal: 'G' });
    expect(result.success).toBe(false);
  });

  it('should reject empty goal', () => {
    const result = AgentConfigSchema.safeParse({ id: 'a', role: 'R', goal: '' });
    expect(result.success).toBe(false);
  });

  it('should reject maxIterations above 100', () => {
    const result = AgentConfigSchema.safeParse({
      id: 'a',
      role: 'R',
      goal: 'G',
      maxIterations: 101,
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-positive maxIterations', () => {
    const result = AgentConfigSchema.safeParse({ id: 'a', role: 'R', goal: 'G', maxIterations: 0 });
    expect(result.success).toBe(false);
  });

  it('should accept valid id patterns', () => {
    for (const id of ['agent-1', 'agent_1', 'Agent123', 'a']) {
      const result = AgentConfigSchema.safeParse({ id, role: 'R', goal: 'G' });
      expect(result.success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// TaskConfig schemas
// ---------------------------------------------------------------------------

describe('TaskConfigSchema', () => {
  it('should validate a minimal config', () => {
    const result = TaskConfigSchema.safeParse({
      id: 'task-1',
      description: 'Do something',
    });
    expect(result.success).toBe(true);
  });

  it('should validate a full config', () => {
    const result = TaskConfigSchema.safeParse({
      id: 'task-1',
      description: 'Do something',
      expectedOutput: 'A list',
      agentId: 'agent-1',
      context: { key: 'value' },
      dependencies: ['task-0'],
      timeout: 30000,
      retries: 3,
      priority: TaskPriority.HIGH,
      metadata: { custom: true },
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty id', () => {
    const result = TaskConfigSchema.safeParse({ id: '', description: 'D' });
    expect(result.success).toBe(false);
  });

  it('should reject empty description', () => {
    const result = TaskConfigSchema.safeParse({ id: 't', description: '' });
    expect(result.success).toBe(false);
  });

  it('should reject timeout above max', () => {
    const result = TaskConfigSchema.safeParse({ id: 't', description: 'D', timeout: 600_001 });
    expect(result.success).toBe(false);
  });

  it('should reject negative timeout', () => {
    const result = TaskConfigSchema.safeParse({ id: 't', description: 'D', timeout: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject retries above max', () => {
    const result = TaskConfigSchema.safeParse({ id: 't', description: 'D', retries: 11 });
    expect(result.success).toBe(false);
  });

  it('should reject negative retries', () => {
    const result = TaskConfigSchema.safeParse({ id: 't', description: 'D', retries: -1 });
    expect(result.success).toBe(false);
  });

  it('should accept zero retries', () => {
    const result = TaskConfigSchema.safeParse({ id: 't', description: 'D', retries: 0 });
    expect(result.success).toBe(true);
  });

  it('should reject invalid priority enum', () => {
    const result = TaskConfigSchema.safeParse({ id: 't', description: 'D', priority: 'urgent' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CrewTask schemas
// ---------------------------------------------------------------------------

describe('CrewTaskSchema', () => {
  it('should validate a minimal crew task', () => {
    const result = CrewTaskSchema.safeParse({
      id: 'ct-1',
      description: 'Do it',
      agentId: 'a1',
    });
    expect(result.success).toBe(true);
  });

  it('should validate a full crew task', () => {
    const result = CrewTaskSchema.safeParse({
      id: 'ct-1',
      description: 'Do it',
      expectedOutput: 'A report',
      agentId: 'a1',
      context: { data: [1, 2] },
      dependencies: ['ct-0'],
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty agentId', () => {
    const result = CrewTaskSchema.safeParse({ id: 'ct', description: 'D', agentId: '' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CrewConfig schemas
// ---------------------------------------------------------------------------

describe('CrewConfigSchema', () => {
  it('should validate a valid crew config', () => {
    const result = CrewConfigSchema.safeParse({
      id: 'crew-1',
      agents: [createMockAgent('a1')],
      tasks: [{ id: 't1', description: 'Task 1', agentId: 'a1' }],
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty agents array', () => {
    const result = CrewConfigSchema.safeParse({
      id: 'crew-1',
      agents: [],
      tasks: [{ id: 't1', description: 'Task 1', agentId: 'a1' }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty tasks array', () => {
    const result = CrewConfigSchema.safeParse({
      id: 'crew-1',
      agents: [createMockAgent('a1')],
      tasks: [],
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid crew id', () => {
    const result = CrewConfigSchema.safeParse({
      id: 'has spaces',
      agents: [createMockAgent('a1')],
      tasks: [{ id: 't1', description: 'D', agentId: 'a1' }],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ExecutionEngineConfig schemas
// ---------------------------------------------------------------------------

describe('ExecutionEngineConfigSchema', () => {
  it('should validate a minimal config', () => {
    const result = ExecutionEngineConfigSchema.safeParse({ id: 'engine-1' });
    expect(result.success).toBe(true);
  });

  it('should validate a full config', () => {
    const result = ExecutionEngineConfigSchema.safeParse({
      id: 'engine-1',
      strategy: ExecutionStrategy.PARALLEL,
      maxConcurrency: 5,
      globalTimeout: 60000,
      taskErrorPolicy: 'continue',
      verbose: true,
    });
    expect(result.success).toBe(true);
  });

  it('should reject maxConcurrency above 100', () => {
    const result = ExecutionEngineConfigSchema.safeParse({ id: 'e', maxConcurrency: 101 });
    expect(result.success).toBe(false);
  });

  it('should reject globalTimeout above 1 hour', () => {
    const result = ExecutionEngineConfigSchema.safeParse({ id: 'e', globalTimeout: 3_600_001 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid strategy', () => {
    const result = ExecutionEngineConfigSchema.safeParse({ id: 'e', strategy: 'round-robin' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid error policy', () => {
    const result = ExecutionEngineConfigSchema.safeParse({ id: 'e', taskErrorPolicy: 'ignore' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// LLMRequestOptions schemas
// ---------------------------------------------------------------------------

describe('LLMRequestOptionsSchema', () => {
  it('should validate empty options', () => {
    const result = LLMRequestOptionsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should validate full options', () => {
    const result = LLMRequestOptionsSchema.safeParse({
      temperature: 0.7,
      maxTokens: 4096,
      stopSequences: ['\n\n'],
    });
    expect(result.success).toBe(true);
  });

  it('should reject temperature above 2', () => {
    const result = LLMRequestOptionsSchema.safeParse({ temperature: 2.5 });
    expect(result.success).toBe(false);
  });

  it('should reject negative temperature', () => {
    const result = LLMRequestOptionsSchema.safeParse({ temperature: -0.1 });
    expect(result.success).toBe(false);
  });

  it('should reject non-positive maxTokens', () => {
    const result = LLMRequestOptionsSchema.safeParse({ maxTokens: 0 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validate*() throwing functions
// ---------------------------------------------------------------------------

describe('validateAgentConfig', () => {
  it('should return validated config on valid input', () => {
    const config = validateAgentConfig({ id: 'a1', role: 'R', goal: 'G' });
    expect(config.id).toBe('a1');
    expect(config.role).toBe('R');
    expect(config.goal).toBe('G');
  });

  it('should throw ValidationError on invalid input', () => {
    expect(() => validateAgentConfig({ id: '', role: 'R', goal: 'G' })).toThrow(ValidationError);
  });

  it('should throw with structured issues', () => {
    try {
      validateAgentConfig({ id: '', role: '', goal: '' });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const ve = error as ValidationError;
      expect(ve.issues.length).toBeGreaterThanOrEqual(3);
      expect(ve.issues.some((i) => i.path === 'id')).toBe(true);
      expect(ve.issues.some((i) => i.path === 'role')).toBe(true);
      expect(ve.issues.some((i) => i.path === 'goal')).toBe(true);
    }
  });
});

describe('validateTaskConfig', () => {
  it('should return validated config on valid input', () => {
    const config = validateTaskConfig({ id: 't1', description: 'Do stuff' });
    expect(config.id).toBe('t1');
  });

  it('should throw ValidationError on invalid input', () => {
    expect(() => validateTaskConfig({ id: '', description: '' })).toThrow(ValidationError);
  });
});

describe('validateCrewTask', () => {
  it('should return validated crew task on valid input', () => {
    const task = validateCrewTask({ id: 'ct1', description: 'D', agentId: 'a1' });
    expect(task.agentId).toBe('a1');
  });

  it('should throw ValidationError on missing agentId', () => {
    expect(() => validateCrewTask({ id: 'ct1', description: 'D' })).toThrow(ValidationError);
  });
});

describe('validateCrewConfig', () => {
  it('should return validated config on valid input', () => {
    const config = validateCrewConfig({
      id: 'crew-1',
      agents: [createMockAgent('a1')],
      tasks: [{ id: 't1', description: 'D', agentId: 'a1' }],
    });
    expect(config.id).toBe('crew-1');
  });

  it('should throw ValidationError on invalid input', () => {
    expect(() => validateCrewConfig({ id: '', agents: [], tasks: [] })).toThrow(ValidationError);
  });
});

describe('validateEngineConfig', () => {
  it('should return validated config on valid input', () => {
    const config = validateEngineConfig({ id: 'e1' });
    expect(config.id).toBe('e1');
  });

  it('should throw ValidationError on invalid input', () => {
    expect(() => validateEngineConfig({ id: '' })).toThrow(ValidationError);
  });
});

describe('validateLLMRequestOptions', () => {
  it('should return validated options on valid input', () => {
    const opts = validateLLMRequestOptions({ temperature: 0.5 });
    expect(opts.temperature).toBe(0.5);
  });

  it('should throw ValidationError on invalid input', () => {
    expect(() => validateLLMRequestOptions({ temperature: 5 })).toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// safeValidate*() non-throwing functions
// ---------------------------------------------------------------------------

describe('safeValidateAgentConfig', () => {
  it('should return success on valid input', () => {
    const result = safeValidateAgentConfig({ id: 'a1', role: 'R', goal: 'G' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('a1');
      expect(result.error).toBeUndefined();
    }
  });

  it('should return failure on invalid input', () => {
    const result = safeValidateAgentConfig({ id: '', role: 'R', goal: 'G' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('should never throw', () => {
    expect(() => safeValidateAgentConfig(null)).not.toThrow();
    expect(() => safeValidateAgentConfig(undefined)).not.toThrow();
    expect(() => safeValidateAgentConfig(42)).not.toThrow();
    expect(() => safeValidateAgentConfig('string')).not.toThrow();
  });
});

describe('safeValidateTaskConfig', () => {
  it('should return success on valid input', () => {
    const result = safeValidateTaskConfig({ id: 't1', description: 'D' });
    expect(result.success).toBe(true);
  });

  it('should return failure on invalid input', () => {
    const result = safeValidateTaskConfig({ id: '' });
    expect(result.success).toBe(false);
  });
});

describe('safeValidateCrewTask', () => {
  it('should return success on valid input', () => {
    const result = safeValidateCrewTask({ id: 'ct1', description: 'D', agentId: 'a1' });
    expect(result.success).toBe(true);
  });

  it('should return failure on invalid input', () => {
    const result = safeValidateCrewTask({ id: 'ct1' });
    expect(result.success).toBe(false);
  });
});

describe('safeValidateCrewConfig', () => {
  it('should return success on valid input', () => {
    const result = safeValidateCrewConfig({
      id: 'c1',
      agents: [createMockAgent('a1')],
      tasks: [{ id: 't1', description: 'D', agentId: 'a1' }],
    });
    expect(result.success).toBe(true);
  });

  it('should return failure on empty arrays', () => {
    const result = safeValidateCrewConfig({ id: 'c1', agents: [], tasks: [] });
    expect(result.success).toBe(false);
  });
});

describe('safeValidateEngineConfig', () => {
  it('should return success on valid input', () => {
    const result = safeValidateEngineConfig({ id: 'e1' });
    expect(result.success).toBe(true);
  });

  it('should return failure on invalid input', () => {
    const result = safeValidateEngineConfig({ id: '' });
    expect(result.success).toBe(false);
  });
});

describe('safeValidateLLMRequestOptions', () => {
  it('should return success on valid input', () => {
    const result = safeValidateLLMRequestOptions({ temperature: 1.0 });
    expect(result.success).toBe(true);
  });

  it('should return failure on invalid input', () => {
    const result = safeValidateLLMRequestOptions({ temperature: -5 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ValidationError
// ---------------------------------------------------------------------------

describe('ValidationError', () => {
  it('should have name "ValidationError"', () => {
    const err = new ValidationError('test', []);
    expect(err.name).toBe('ValidationError');
  });

  it('should be an instance of Error', () => {
    const err = new ValidationError('test', []);
    expect(err).toBeInstanceOf(Error);
  });

  it('should store issues array', () => {
    const issues = [
      { path: 'id', message: 'must not be empty', code: 'too_small' },
      { path: 'role', message: 'must not be empty', code: 'too_small' },
    ];
    const err = new ValidationError('Multiple errors', issues);
    expect(err.issues).toEqual(issues);
    expect(err.issues.length).toBe(2);
  });

  it('should format message with paths', () => {
    const result = safeValidateAgentConfig({ id: '', role: '', goal: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('id');
      expect(result.error.message).toContain('role');
      expect(result.error.message).toContain('goal');
    }
  });

  it('should have correct issue codes from Zod', () => {
    const result = safeValidateAgentConfig({ id: 123, role: true, goal: null });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((i) => i.code);
      expect(codes).toContain('invalid_type');
    }
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('should handle completely wrong input type for agent', () => {
    const result = safeValidateAgentConfig('not-an-object');
    expect(result.success).toBe(false);
  });

  it('should handle null input', () => {
    const result = safeValidateTaskConfig(null);
    expect(result.success).toBe(false);
  });

  it('should handle undefined input', () => {
    const result = safeValidateEngineConfig(undefined);
    expect(result.success).toBe(false);
  });

  it('should handle empty object', () => {
    const result = safeValidateAgentConfig({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('should strip unknown fields via schemas', () => {
    const result = AgentConfigSchema.safeParse({
      id: 'a1',
      role: 'R',
      goal: 'G',
      unknownField: 'should be stripped',
    });
    expect(result.success).toBe(true);
  });

  it('should accept boundary values for task timeout', () => {
    const result = TaskConfigSchema.safeParse({ id: 't', description: 'D', timeout: 600_000 });
    expect(result.success).toBe(true);
  });

  it('should accept boundary values for engine globalTimeout', () => {
    const result = ExecutionEngineConfigSchema.safeParse({ id: 'e', globalTimeout: 3_600_000 });
    expect(result.success).toBe(true);
  });

  it('should accept boundary values for maxConcurrency', () => {
    const result = ExecutionEngineConfigSchema.safeParse({ id: 'e', maxConcurrency: 100 });
    expect(result.success).toBe(true);
  });

  it('should accept boundary values for maxIterations', () => {
    const result = AgentConfigSchema.safeParse({
      id: 'a',
      role: 'R',
      goal: 'G',
      maxIterations: 100,
    });
    expect(result.success).toBe(true);
  });

  it('should accept boundary values for retries', () => {
    const result = TaskConfigSchema.safeParse({ id: 't', description: 'D', retries: 10 });
    expect(result.success).toBe(true);
  });
});
