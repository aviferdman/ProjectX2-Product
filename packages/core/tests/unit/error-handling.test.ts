import { describe, it, expect } from 'vitest';

import {
  // Base & codes
  CrewspaceError,
  ErrorCode,
  // Utilities
  AggregateCrewspaceError,
  formatErrorForLog,
  getErrorChain,
  hasErrorCode,
  isCrewspaceError,
  normalizeError,
  // Domain errors
  AgentConfigError,
  AgentExecutionError,
  CrewConfigError,
  CrewExecutionError,
  EngineConfigError,
  EngineExecutionError,
  LLMAuthenticationError,
  LLMContextLengthError,
  LLMProviderError,
  LLMRateLimitError,
  LLMStreamError,
  TaskConfigError,
  TaskExecutionError,
  TaskTimeoutError,
  CircularDependencyError,
  ToolConfigError,
  ToolNotFoundError,
  ToolExecutionError,
  ToolPermissionError,
  ToolTimeoutError,
  ToolCompositionError,
  ToolInputValidationError,
  MemoryConfigError,
  MemoryOperationError,
  MemoryQueryError,
} from '../../src/errors/index.js';

// ---------------------------------------------------------------------------
// CrewspaceError base class
// ---------------------------------------------------------------------------

describe('CrewspaceError', () => {
  // We need a concrete subclass since CrewspaceError is abstract
  class TestError extends CrewspaceError {
    constructor(
      message: string,
      code: ErrorCode,
      options?: { cause?: Error; isRetryable?: boolean },
    ) {
      super(message, code, options);
      this.name = 'TestError';
    }
  }

  it('should set code, message, and defaults', () => {
    const err = new TestError('boom', ErrorCode.UNKNOWN);
    expect(err.message).toBe('boom');
    expect(err.code).toBe(ErrorCode.UNKNOWN);
    expect(err.isRetryable).toBe(false);
    expect(err.cause).toBeUndefined();
    expect(err.timestamp).toBeDefined();
  });

  it('should accept cause and isRetryable options', () => {
    const cause = new Error('root');
    const err = new TestError('wrapped', ErrorCode.AGENT_EXECUTION, { cause, isRetryable: true });
    expect(err.cause).toBe(cause);
    expect(err.isRetryable).toBe(true);
  });

  it('should produce a valid ISO timestamp', () => {
    const err = new TestError('test', ErrorCode.UNKNOWN);
    expect(new Date(err.timestamp).toISOString()).toBe(err.timestamp);
  });

  it('should be an instance of Error', () => {
    const err = new TestError('test', ErrorCode.UNKNOWN);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(CrewspaceError);
  });

  describe('isCrewspaceError (static)', () => {
    it('should return true for CrewspaceError instances', () => {
      expect(CrewspaceError.isCrewspaceError(new TestError('x', ErrorCode.UNKNOWN))).toBe(true);
    });

    it('should return false for plain errors', () => {
      expect(CrewspaceError.isCrewspaceError(new Error('x'))).toBe(false);
    });

    it('should return false for non-errors', () => {
      expect(CrewspaceError.isCrewspaceError('string')).toBe(false);
      expect(CrewspaceError.isCrewspaceError(null)).toBe(false);
      expect(CrewspaceError.isCrewspaceError(undefined)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize basic fields', () => {
      const err = new TestError('test', ErrorCode.UNKNOWN);
      const json = err.toJSON();
      expect(json.name).toBe('TestError');
      expect(json.message).toBe('test');
      expect(json.code).toBe(ErrorCode.UNKNOWN);
      expect(json.isRetryable).toBe(false);
      expect(json.timestamp).toBe(err.timestamp);
      expect(json.cause).toBeUndefined();
      expect(json.details).toEqual({});
    });

    it('should serialize CrewspaceError cause recursively', () => {
      const inner = new TestError('inner', ErrorCode.AGENT_CONFIG);
      const outer = new TestError('outer', ErrorCode.AGENT_EXECUTION, { cause: inner });
      const json = outer.toJSON();
      expect(json.cause).toBeDefined();
      expect((json.cause as { code: string }).code).toBe(ErrorCode.AGENT_CONFIG);
    });

    it('should serialize plain Error cause with message only', () => {
      const cause = new Error('plain');
      const err = new TestError('wrapped', ErrorCode.UNKNOWN, { cause });
      const json = err.toJSON();
      expect(json.cause).toEqual({ message: 'plain' });
    });
  });
});

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

describe('normalizeError', () => {
  it('should return Error instances as-is', () => {
    const err = new Error('test');
    expect(normalizeError(err)).toBe(err);
  });

  it('should wrap strings in Error', () => {
    const err = normalizeError('oops');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('oops');
  });

  it('should wrap numbers in Error', () => {
    const err = normalizeError(42);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('42');
  });

  it('should wrap null in Error', () => {
    const err = normalizeError(null);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('null');
  });

  it('should return CrewspaceError subclasses as-is', () => {
    const err = new AgentConfigError('bad config');
    expect(normalizeError(err)).toBe(err);
  });
});

describe('getErrorChain', () => {
  it('should return single-element chain for errors with no cause', () => {
    const err = new Error('standalone');
    expect(getErrorChain(err)).toEqual([err]);
  });

  it('should walk the full cause chain', () => {
    const root = new Error('root');
    const mid = new AgentExecutionError('a1', 'mid', root);
    const top = new CrewExecutionError('c1', 'top', undefined, mid);
    const chain = getErrorChain(top);
    expect(chain).toHaveLength(3);
    expect(chain[0]).toBe(top);
    expect(chain[1]).toBe(mid);
    expect(chain[2]).toBe(root);
  });

  it('should not infinite-loop on circular causes', () => {
    const a = new Error('a');
    const b = new Error('b');
    // Manually create a circular cause chain
    (a as { cause: Error }).cause = b;
    (b as { cause: Error }).cause = a;
    const chain = getErrorChain(a);
    expect(chain).toHaveLength(2);
  });
});

describe('isCrewspaceError', () => {
  it('should return true for framework errors', () => {
    expect(isCrewspaceError(new AgentConfigError('x'))).toBe(true);
    expect(isCrewspaceError(new LLMProviderError('openai', 'fail'))).toBe(true);
  });

  it('should return false for plain errors', () => {
    expect(isCrewspaceError(new Error('x'))).toBe(false);
  });
});

describe('hasErrorCode', () => {
  it('should match correct error code', () => {
    const err = new AgentConfigError('bad');
    expect(hasErrorCode(err, ErrorCode.AGENT_CONFIG)).toBe(true);
  });

  it('should reject wrong error code', () => {
    const err = new AgentConfigError('bad');
    expect(hasErrorCode(err, ErrorCode.CREW_CONFIG)).toBe(false);
  });

  it('should return false for non-CrewspaceErrors', () => {
    expect(hasErrorCode(new Error('x'), ErrorCode.UNKNOWN)).toBe(false);
  });
});

describe('formatErrorForLog', () => {
  it('should format CrewspaceError with code and retryable', () => {
    const err = new LLMRateLimitError('openai', 'too many requests', 5000);
    const fmt = formatErrorForLog(err);
    expect(fmt.name).toBe('LLMRateLimitError');
    expect(fmt.code).toBe(ErrorCode.LLM_RATE_LIMIT);
    expect(fmt.isRetryable).toBe(true);
    expect(fmt.causeChain).toHaveLength(1);
  });

  it('should format plain Error without code', () => {
    const err = new Error('plain');
    const fmt = formatErrorForLog(err);
    expect(fmt.code).toBeUndefined();
    expect(fmt.isRetryable).toBeUndefined();
  });

  it('should include full cause chain', () => {
    const root = new Error('root');
    const wrapper = new AgentExecutionError('a1', 'wrapper', root);
    const fmt = formatErrorForLog(wrapper);
    expect(fmt.causeChain).toHaveLength(2);
    expect(fmt.causeChain[1]).toBe('root');
  });
});

describe('AggregateCrewspaceError', () => {
  it('should collect multiple errors', () => {
    const errors = [new Error('a'), new AgentConfigError('b')];
    const agg = new AggregateCrewspaceError('Parallel failed', errors);
    expect(agg.errors).toHaveLength(2);
    expect(agg.message).toContain('2 errors');
    expect(agg.name).toBe('AggregateCrewspaceError');
    expect(agg.code).toBe(ErrorCode.UNKNOWN);
  });

  it('should use singular "error" for single error', () => {
    const agg = new AggregateCrewspaceError('Failed', [new Error('one')]);
    expect(agg.message).toContain('1 error)');
  });

  it('should serialize to JSON with nested error details', () => {
    const inner = new AgentConfigError('bad config', 'a1');
    const agg = new AggregateCrewspaceError('Failed', [inner, new Error('plain')]);
    const json = agg.toJSON();
    expect(json.details['errorCount']).toBe(2);
    const errors = json.details['errors'] as unknown[];
    expect(errors).toHaveLength(2);
  });

  it('should be an instance of CrewspaceError', () => {
    const agg = new AggregateCrewspaceError('x', []);
    expect(agg).toBeInstanceOf(CrewspaceError);
    expect(agg).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// Domain error classes — instanceof hierarchy & error codes
// ---------------------------------------------------------------------------

describe('Agent errors', () => {
  it('AgentConfigError should have AGENT_CONFIG code', () => {
    const err = new AgentConfigError('bad', 'a1');
    expect(err.code).toBe(ErrorCode.AGENT_CONFIG);
    expect(err).toBeInstanceOf(CrewspaceError);
    expect(err).toBeInstanceOf(Error);
    expect(err.agentId).toBe('a1');
  });

  it('AgentExecutionError should have AGENT_EXECUTION code', () => {
    const cause = new Error('root');
    const err = new AgentExecutionError('a1', 'failed', cause);
    expect(err.code).toBe(ErrorCode.AGENT_EXECUTION);
    expect(err.cause).toBe(cause);
    expect(err.agentId).toBe('a1');
    expect(err).toBeInstanceOf(CrewspaceError);
  });

  it('AgentExecutionError toJSON includes agentId in details', () => {
    const err = new AgentExecutionError('a1', 'failed');
    const json = err.toJSON();
    expect(json.details['agentId']).toBe('a1');
  });
});

describe('Crew errors', () => {
  it('CrewConfigError should have CREW_CONFIG code', () => {
    const err = new CrewConfigError('bad', 'c1');
    expect(err.code).toBe(ErrorCode.CREW_CONFIG);
    expect(err.crewId).toBe('c1');
    expect(err).toBeInstanceOf(CrewspaceError);
  });

  it('CrewExecutionError should have CREW_EXECUTION code', () => {
    const err = new CrewExecutionError('c1', 'boom', 't1');
    expect(err.code).toBe(ErrorCode.CREW_EXECUTION);
    expect(err.crewId).toBe('c1');
    expect(err.taskId).toBe('t1');
  });
});

describe('Engine errors', () => {
  it('EngineConfigError should have ENGINE_CONFIG code', () => {
    const err = new EngineConfigError('bad', 'e1');
    expect(err.code).toBe(ErrorCode.ENGINE_CONFIG);
    expect(err.engineId).toBe('e1');
  });

  it('EngineExecutionError should have ENGINE_EXECUTION code', () => {
    const err = new EngineExecutionError('e1', 'boom', 't1');
    expect(err.code).toBe(ErrorCode.ENGINE_EXECUTION);
    expect(err.engineId).toBe('e1');
    expect(err.taskId).toBe('t1');
  });
});

describe('LLM errors', () => {
  it('LLMProviderError should have LLM_PROVIDER code and retryable for 5xx', () => {
    const err = new LLMProviderError('openai', 'server error', 500);
    expect(err.code).toBe(ErrorCode.LLM_PROVIDER);
    expect(err.isRetryable).toBe(true);
    expect(err.provider).toBe('openai');
    expect(err.statusCode).toBe(500);
    expect(err).toBeInstanceOf(CrewspaceError);
  });

  it('LLMProviderError should not be retryable for 4xx (non-429)', () => {
    const err = new LLMProviderError('openai', 'bad request', 400);
    expect(err.isRetryable).toBe(false);
  });

  it('LLMRateLimitError should have LLM_RATE_LIMIT code and be retryable', () => {
    const err = new LLMRateLimitError('openai', 'too many', 5000);
    expect(err.code).toBe(ErrorCode.LLM_RATE_LIMIT);
    expect(err.isRetryable).toBe(true);
    expect(err.retryAfterMs).toBe(5000);
    expect(err.statusCode).toBe(429);
    expect(err).toBeInstanceOf(LLMProviderError);
    expect(err).toBeInstanceOf(CrewspaceError);
  });

  it('LLMAuthenticationError should have LLM_AUTHENTICATION code and not be retryable', () => {
    const err = new LLMAuthenticationError('openai', 'bad key');
    expect(err.code).toBe(ErrorCode.LLM_AUTHENTICATION);
    expect(err.isRetryable).toBe(false);
    expect(err.statusCode).toBe(401);
  });

  it('LLMContextLengthError should have LLM_CONTEXT_LENGTH code', () => {
    const err = new LLMContextLengthError('openai', 'too long', 10000, 8192);
    expect(err.code).toBe(ErrorCode.LLM_CONTEXT_LENGTH);
    expect(err.isRetryable).toBe(false);
    expect(err.requestTokens).toBe(10000);
    expect(err.maxTokens).toBe(8192);
  });

  it('LLMStreamError should have LLM_STREAM code and be retryable', () => {
    const err = new LLMStreamError('openai', 'stream broke', 5, 'partial');
    expect(err.code).toBe(ErrorCode.LLM_STREAM);
    expect(err.isRetryable).toBe(true);
    expect(err.chunksReceived).toBe(5);
    expect(err.partialContent).toBe('partial');
  });

  it('LLMProviderError toJSON includes provider and statusCode', () => {
    const err = new LLMProviderError('anthropic', 'timeout', 503);
    const json = err.toJSON();
    expect(json.details['provider']).toBe('anthropic');
    expect(json.details['statusCode']).toBe(503);
  });
});

describe('Task errors', () => {
  it('TaskConfigError should have TASK_CONFIG code', () => {
    const err = new TaskConfigError('bad', 't1');
    expect(err.code).toBe(ErrorCode.TASK_CONFIG);
    expect(err.taskId).toBe('t1');
    expect(err).toBeInstanceOf(CrewspaceError);
  });

  it('TaskExecutionError should have TASK_EXECUTION code', () => {
    const err = new TaskExecutionError('t1', 'failed', 'a1');
    expect(err.code).toBe(ErrorCode.TASK_EXECUTION);
    expect(err.taskId).toBe('t1');
    expect(err.agentId).toBe('a1');
  });

  it('TaskTimeoutError should have TASK_TIMEOUT code and be retryable', () => {
    const err = new TaskTimeoutError('t1', 5000);
    expect(err.code).toBe(ErrorCode.TASK_TIMEOUT);
    expect(err.isRetryable).toBe(true);
    expect(err.timeoutMs).toBe(5000);
    expect(err).toBeInstanceOf(TaskExecutionError);
    expect(err).toBeInstanceOf(CrewspaceError);
  });

  it('CircularDependencyError should have TASK_CIRCULAR_DEPENDENCY code', () => {
    const err = new CircularDependencyError([{ path: ['a', 'b', 'a'] }]);
    expect(err.code).toBe(ErrorCode.TASK_CIRCULAR_DEPENDENCY);
    expect(err.involvedTaskIds).toEqual(['a', 'b']);
    expect(err).toBeInstanceOf(TaskConfigError);
    expect(err).toBeInstanceOf(CrewspaceError);
  });
});

describe('Tool errors', () => {
  it('ToolConfigError should have TOOL_CONFIG code', () => {
    const err = new ToolConfigError('bad', 'search');
    expect(err.code).toBe(ErrorCode.TOOL_CONFIG);
    expect(err.toolName).toBe('search');
    expect(err).toBeInstanceOf(CrewspaceError);
  });

  it('ToolNotFoundError should have TOOL_NOT_FOUND code', () => {
    const err = new ToolNotFoundError('missing');
    expect(err.code).toBe(ErrorCode.TOOL_NOT_FOUND);
    expect(err.toolName).toBe('missing');
  });

  it('ToolExecutionError should have TOOL_EXECUTION code', () => {
    const cause = new Error('root');
    const err = new ToolExecutionError('search', 'boom', cause);
    expect(err.code).toBe(ErrorCode.TOOL_EXECUTION);
    expect(err.cause).toBe(cause);
  });

  it('ToolPermissionError should have TOOL_PERMISSION code', () => {
    const err = new ToolPermissionError(
      'search',
      ['read', 'write'] as never[],
      ['write'] as never[],
    );
    expect(err.code).toBe(ErrorCode.TOOL_PERMISSION);
  });

  it('ToolTimeoutError should have TOOL_TIMEOUT code and be retryable', () => {
    const err = new ToolTimeoutError('search', 3000);
    expect(err.code).toBe(ErrorCode.TOOL_TIMEOUT);
    expect(err.isRetryable).toBe(true);
    expect(err.timeoutMs).toBe(3000);
  });

  it('ToolCompositionError should have TOOL_COMPOSITION code', () => {
    const err = new ToolCompositionError('pipe', 'too deep', 5, 3);
    expect(err.code).toBe(ErrorCode.TOOL_COMPOSITION);
    expect(err.depth).toBe(5);
    expect(err.maxDepth).toBe(3);
    expect(err).toBeInstanceOf(ToolExecutionError);
  });

  it('ToolInputValidationError should have TOOL_INPUT_VALIDATION code', () => {
    const err = new ToolInputValidationError('search', [
      { path: 'query', message: 'required', code: 'invalid_type' },
    ]);
    expect(err.code).toBe(ErrorCode.TOOL_INPUT_VALIDATION);
    expect(err.issues).toHaveLength(1);
    expect(err).toBeInstanceOf(ToolExecutionError);
  });
});

describe('Memory errors', () => {
  it('MemoryConfigError should have MEMORY_CONFIG code', () => {
    const err = new MemoryConfigError('bad', 'sqlite');
    expect(err.code).toBe(ErrorCode.MEMORY_CONFIG);
    expect(err.provider).toBe('sqlite');
    expect(err).toBeInstanceOf(CrewspaceError);
  });

  it('MemoryOperationError should have MEMORY_OPERATION code', () => {
    const err = new MemoryOperationError('sqlite', 'write', 'disk full');
    expect(err.code).toBe(ErrorCode.MEMORY_OPERATION);
    expect(err.operation).toBe('write');
  });

  it('MemoryQueryError should have MEMORY_QUERY code', () => {
    const err = new MemoryQueryError('sqlite', 'bad SQL');
    expect(err.code).toBe(ErrorCode.MEMORY_QUERY);
    expect(err.provider).toBe('sqlite');
  });
});

// ---------------------------------------------------------------------------
// Backward compatibility — messages match original format
// ---------------------------------------------------------------------------

describe('Backward compatibility — message format', () => {
  it('AgentConfigError with agentId', () => {
    expect(new AgentConfigError('Invalid config', 'my-agent').message).toBe(
      'Agent "my-agent": Invalid config',
    );
  });

  it('AgentConfigError without agentId', () => {
    expect(new AgentConfigError('Something wrong').message).toBe('Something wrong');
  });

  it('AgentExecutionError', () => {
    expect(new AgentExecutionError('a1', 'LLM failed').message).toBe(
      'Agent "a1" execution failed: LLM failed',
    );
  });

  it('CrewConfigError with crewId', () => {
    expect(new CrewConfigError('bad', 'c1').message).toBe('Crew "c1": bad');
  });

  it('CrewExecutionError with taskId', () => {
    expect(new CrewExecutionError('c1', 'boom', 't1').message).toBe(
      'Crew "c1" (task "t1") execution failed: boom',
    );
  });

  it('TaskTimeoutError', () => {
    const err = new TaskTimeoutError('my-task', 30000);
    expect(err.message).toContain('30000ms');
  });

  it('TaskTimeoutError with agent', () => {
    const err = new TaskTimeoutError('my-task', 5000, 'agent-1');
    expect(err.message).toContain('agent "agent-1"');
  });

  it('ToolNotFoundError', () => {
    expect(new ToolNotFoundError('foo').message).toBe('Tool "foo" is not registered');
  });

  it('LLMProviderError', () => {
    expect(new LLMProviderError('openai', 'bad').message).toBe('LLM provider "openai": bad');
  });
});
