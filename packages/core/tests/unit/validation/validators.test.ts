import { describe, it, expect } from 'vitest';

import {
  validateAgentConfig,
  safeValidateAgentConfig,
  validateTaskConfig,
  safeValidateTaskConfig,
  validateCrewTask,
  safeValidateCrewTask,
  validateCrewConfig,
  safeValidateCrewConfig,
  validateEngineConfig,
  safeValidateEngineConfig,
  validateLLMRequestOptions,
  safeValidateLLMRequestOptions,
  ValidationError,
} from '../../../src/validation/validators.js';
import { ExecutionStrategy } from '../../../src/engine/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validAgentConfig() {
  return { id: 'agent-1', role: 'Analyst', goal: 'Analyze data' };
}

function validTaskConfig() {
  return { id: 'task-1', description: 'Do work' };
}

function validCrewTask() {
  return { id: 'ct-1', description: 'Research', agentId: 'agent-1' };
}

function mockAgent(id = 'agent-1') {
  return { id, execute: async () => ({ output: '', agentId: id, duration: 0 }) };
}

function validCrewConfig() {
  return {
    id: 'crew-1',
    agents: [mockAgent()],
    tasks: [{ id: 'task-1', description: 'Do work', agentId: 'agent-1' }],
  };
}

function validEngineConfig() {
  return { id: 'engine-1' };
}

// ---------------------------------------------------------------------------
// ValidationError
// ---------------------------------------------------------------------------

describe('ValidationError', () => {
  it('should be an instance of Error', () => {
    const err = new ValidationError('test', []);
    expect(err).toBeInstanceOf(Error);
  });

  it('should have name "ValidationError"', () => {
    const err = new ValidationError('test', []);
    expect(err.name).toBe('ValidationError');
  });

  it('should store issues', () => {
    const issues = [{ path: 'id', message: 'required', code: 'invalid_type' }];
    const err = new ValidationError('test', issues);
    expect(err.issues).toEqual(issues);
  });

  it('should have correct message', () => {
    const err = new ValidationError('something went wrong', []);
    expect(err.message).toBe('something went wrong');
  });

  describe('fromZodError', () => {
    it('should convert ZodError to ValidationError with structured issues', () => {
      // Trigger a real ZodError via safeValidate, then verify the mapping
      const result = safeValidateAgentConfig({ id: '', role: '', goal: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.issues.length).toBeGreaterThan(0);
        expect(result.error.issues[0]).toHaveProperty('path');
        expect(result.error.issues[0]).toHaveProperty('message');
        expect(result.error.issues[0]).toHaveProperty('code');
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Agent validators
// ---------------------------------------------------------------------------

describe('validateAgentConfig', () => {
  it('should return validated config on valid input', () => {
    const config = validAgentConfig();
    const result = validateAgentConfig(config);
    expect(result).toEqual(config);
  });

  it('should throw ValidationError on invalid input', () => {
    expect(() => validateAgentConfig({})).toThrow(ValidationError);
  });

  it('should throw with structured issues', () => {
    try {
      validateAgentConfig({ id: '' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const validationErr = err as ValidationError;
      expect(validationErr.issues.length).toBeGreaterThan(0);
    }
  });
});

describe('safeValidateAgentConfig', () => {
  it('should return success result on valid input', () => {
    const result = safeValidateAgentConfig(validAgentConfig());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validAgentConfig());
      expect(result.error).toBeUndefined();
    }
  });

  it('should return failure result on invalid input', () => {
    const result = safeValidateAgentConfig({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(ValidationError);
    }
  });

  it('should never throw', () => {
    expect(() => safeValidateAgentConfig(null)).not.toThrow();
    expect(() => safeValidateAgentConfig(undefined)).not.toThrow();
    expect(() => safeValidateAgentConfig(42)).not.toThrow();
    expect(() => safeValidateAgentConfig('string')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Task validators
// ---------------------------------------------------------------------------

describe('validateTaskConfig', () => {
  it('should return validated config on valid input', () => {
    const config = validTaskConfig();
    const result = validateTaskConfig(config);
    expect(result).toEqual(config);
  });

  it('should throw ValidationError on invalid input', () => {
    expect(() => validateTaskConfig({})).toThrow(ValidationError);
  });

  it('should throw for missing description', () => {
    expect(() => validateTaskConfig({ id: 'task-1' })).toThrow(ValidationError);
  });
});

describe('safeValidateTaskConfig', () => {
  it('should return success on valid input', () => {
    const result = safeValidateTaskConfig(validTaskConfig());
    expect(result.success).toBe(true);
  });

  it('should return failure on invalid input', () => {
    const result = safeValidateTaskConfig({ id: '' });
    expect(result.success).toBe(false);
  });

  it('should never throw', () => {
    expect(() => safeValidateTaskConfig(null)).not.toThrow();
    expect(() => safeValidateTaskConfig(undefined)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// CrewTask validators
// ---------------------------------------------------------------------------

describe('validateCrewTask', () => {
  it('should return validated crew task on valid input', () => {
    const task = validCrewTask();
    const result = validateCrewTask(task);
    expect(result).toEqual(task);
  });

  it('should throw ValidationError on missing agentId', () => {
    expect(() => validateCrewTask({ id: 'ct-1', description: 'test' })).toThrow(ValidationError);
  });
});

describe('safeValidateCrewTask', () => {
  it('should return success on valid input', () => {
    const result = safeValidateCrewTask(validCrewTask());
    expect(result.success).toBe(true);
  });

  it('should return failure on invalid input', () => {
    const result = safeValidateCrewTask({});
    expect(result.success).toBe(false);
  });

  it('should never throw', () => {
    expect(() => safeValidateCrewTask(null)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// CrewConfig validators
// ---------------------------------------------------------------------------

describe('validateCrewConfig', () => {
  it('should return validated config on valid input', () => {
    const config = validCrewConfig();
    const result = validateCrewConfig(config);
    expect(result.id).toBe('crew-1');
  });

  it('should throw ValidationError on empty agents', () => {
    expect(() =>
      validateCrewConfig({ id: 'crew-1', agents: [], tasks: [validCrewTask()] }),
    ).toThrow(ValidationError);
  });

  it('should throw ValidationError on empty tasks', () => {
    expect(() =>
      validateCrewConfig({ id: 'crew-1', agents: [mockAgent()], tasks: [] }),
    ).toThrow(ValidationError);
  });
});

describe('safeValidateCrewConfig', () => {
  it('should return success on valid input', () => {
    const result = safeValidateCrewConfig(validCrewConfig());
    expect(result.success).toBe(true);
  });

  it('should return failure on invalid input', () => {
    const result = safeValidateCrewConfig({ id: '' });
    expect(result.success).toBe(false);
  });

  it('should never throw', () => {
    expect(() => safeValidateCrewConfig(null)).not.toThrow();
    expect(() => safeValidateCrewConfig(123)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// ExecutionEngine validators
// ---------------------------------------------------------------------------

describe('validateEngineConfig', () => {
  it('should return validated config on valid input', () => {
    const config = validEngineConfig();
    const result = validateEngineConfig(config);
    expect(result).toEqual(config);
  });

  it('should accept full config', () => {
    const config = {
      id: 'engine-1',
      strategy: ExecutionStrategy.PARALLEL,
      maxConcurrency: 5,
      globalTimeout: 120_000,
      taskErrorPolicy: 'fail-fast' as const,
      verbose: false,
    };
    const result = validateEngineConfig(config);
    expect(result.strategy).toBe(ExecutionStrategy.PARALLEL);
  });

  it('should throw ValidationError on invalid input', () => {
    expect(() => validateEngineConfig({})).toThrow(ValidationError);
  });
});

describe('safeValidateEngineConfig', () => {
  it('should return success on valid input', () => {
    const result = safeValidateEngineConfig(validEngineConfig());
    expect(result.success).toBe(true);
  });

  it('should return failure on invalid input', () => {
    const result = safeValidateEngineConfig({ id: '' });
    expect(result.success).toBe(false);
  });

  it('should never throw', () => {
    expect(() => safeValidateEngineConfig(null)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// LLMRequestOptions validators
// ---------------------------------------------------------------------------

describe('validateLLMRequestOptions', () => {
  it('should return validated options on valid input', () => {
    const opts = { temperature: 0.5, maxTokens: 2048 };
    const result = validateLLMRequestOptions(opts);
    expect(result).toEqual(opts);
  });

  it('should accept empty object', () => {
    const result = validateLLMRequestOptions({});
    expect(result).toEqual({});
  });

  it('should throw ValidationError on invalid temperature', () => {
    expect(() => validateLLMRequestOptions({ temperature: 3 })).toThrow(ValidationError);
  });
});

describe('safeValidateLLMRequestOptions', () => {
  it('should return success on valid input', () => {
    const result = safeValidateLLMRequestOptions({ temperature: 1.0 });
    expect(result.success).toBe(true);
  });

  it('should return failure on invalid input', () => {
    const result = safeValidateLLMRequestOptions({ maxTokens: -1 });
    expect(result.success).toBe(false);
  });

  it('should never throw', () => {
    expect(() => safeValidateLLMRequestOptions(null)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: type discrimination
// ---------------------------------------------------------------------------

describe('ValidationResult discrimination', () => {
  it('should narrow to success with data', () => {
    const result = safeValidateAgentConfig(validAgentConfig());
    if (result.success) {
      // TypeScript should infer result.data is AgentConfig
      expect(result.data.id).toBe('agent-1');
      expect(result.error).toBeUndefined();
    } else {
      expect.fail('expected success');
    }
  });

  it('should narrow to failure with error', () => {
    const result = safeValidateAgentConfig({});
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.data).toBeUndefined();
    } else {
      expect.fail('expected failure');
    }
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should handle null input gracefully in safe validators', () => {
    expect(safeValidateAgentConfig(null).success).toBe(false);
    expect(safeValidateTaskConfig(null).success).toBe(false);
    expect(safeValidateCrewTask(null).success).toBe(false);
    expect(safeValidateCrewConfig(null).success).toBe(false);
    expect(safeValidateEngineConfig(null).success).toBe(false);
    expect(safeValidateLLMRequestOptions(null).success).toBe(false);
  });

  it('should handle undefined input gracefully in safe validators', () => {
    expect(safeValidateAgentConfig(undefined).success).toBe(false);
    expect(safeValidateTaskConfig(undefined).success).toBe(false);
    expect(safeValidateCrewTask(undefined).success).toBe(false);
    expect(safeValidateCrewConfig(undefined).success).toBe(false);
    expect(safeValidateEngineConfig(undefined).success).toBe(false);
    expect(safeValidateLLMRequestOptions(undefined).success).toBe(false);
  });

  it('should throw ValidationError (not ZodError) from throwing validators', () => {
    try {
      validateAgentConfig(null);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err).not.toHaveProperty('format'); // ZodError has .format(), ValidationError doesn't
    }
  });

  it('should include field paths in ValidationError issues', () => {
    const result = safeValidateAgentConfig({ id: 123, role: true, goal: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path);
      expect(paths).toContain('id');
      expect(paths).toContain('role');
      expect(paths).toContain('goal');
    }
  });

  it('should report nested paths for crew config', () => {
    const result = safeValidateCrewConfig({
      id: 'crew-1',
      agents: [mockAgent()],
      tasks: [{ id: '', description: '', agentId: '' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path);
      // Should reference tasks.0.id or tasks.0.description
      expect(paths.some((p) => p.startsWith('tasks.0'))).toBe(true);
    }
  });
});
