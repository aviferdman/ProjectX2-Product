import { describe, it, expect, vi } from 'vitest';

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
  // Graceful degradation
  DefaultFailureClassifier,
  FailureSeverity,
  GracefulDegradationHandler,
} from '../../src/errors/index.js';

// ==========================================================================
// 1. Cross-component error propagation
// ==========================================================================

describe('Cross-component error propagation', () => {
  it('should preserve cause chain: Tool → Task → Agent → Crew', () => {
    const toolErr = new ToolExecutionError('search', 'network timeout');
    const taskErr = new TaskExecutionError('t1', 'tool failed', 'agent-1', toolErr);
    const agentErr = new AgentExecutionError('agent-1', 'task failed', taskErr);
    const crewErr = new CrewExecutionError('crew-1', 'agent failed', 't1', agentErr);

    const chain = getErrorChain(crewErr);
    expect(chain).toHaveLength(4);
    expect(chain[0]).toBe(crewErr);
    expect(chain[1]).toBe(agentErr);
    expect(chain[2]).toBe(taskErr);
    expect(chain[3]).toBe(toolErr);
  });

  it('should preserve error codes through the chain', () => {
    const toolErr = new ToolTimeoutError('search', 5000);
    const taskErr = new TaskExecutionError('t1', 'tool timed out', 'a1', toolErr);
    const crewErr = new CrewExecutionError('c1', 'task failed', 't1', taskErr);

    const chain = getErrorChain(crewErr);
    expect(hasErrorCode(chain[0]!, ErrorCode.CREW_EXECUTION)).toBe(true);
    expect(hasErrorCode(chain[1]!, ErrorCode.TASK_EXECUTION)).toBe(true);
    expect(hasErrorCode(chain[2]!, ErrorCode.TOOL_TIMEOUT)).toBe(true);
  });

  it('should preserve domain-specific details through JSON serialization', () => {
    const toolErr = new ToolTimeoutError('search', 3000);
    const taskErr = new TaskExecutionError('t1', 'tool timeout', 'agent-1', toolErr);
    const json = taskErr.toJSON();

    expect(json.details['taskId']).toBe('t1');
    expect(json.details['agentId']).toBe('agent-1');
    expect(json.cause).toBeDefined();
    const causeDet = json.cause as { code: string; details: Record<string, unknown> };
    expect(causeDet.code).toBe(ErrorCode.TOOL_TIMEOUT);
    expect(causeDet.details['toolName']).toBe('search');
    expect(causeDet.details['timeoutMs']).toBe(3000);
  });

  it('should preserve context through Engine → Task → Tool chain', () => {
    const toolErr = new ToolExecutionError('web-search', 'rate limited');
    const taskErr = new TaskExecutionError('research-task', 'tool failed', 'analyst', toolErr);
    const engineErr = new EngineExecutionError(
      'main-engine',
      'task failed',
      'research-task',
      taskErr,
    );

    const chain = getErrorChain(engineErr);
    expect(chain).toHaveLength(3);

    const fmt = formatErrorForLog(engineErr);
    expect(fmt.causeChain).toHaveLength(3);
    expect(fmt.causeChain[0]).toContain('main-engine');
    expect(fmt.causeChain[1]).toContain('research-task');
    expect(fmt.causeChain[2]).toContain('web-search');
  });

  it('should maintain retryability info from deepest cause', () => {
    const retryable = new LLMRateLimitError('openai', 'too many requests', 2000);
    const taskErr = new TaskExecutionError('t1', 'llm rate limited', 'a1', retryable);

    expect(taskErr.isRetryable).toBe(false); // task itself is not marked retryable
    const chain = getErrorChain(taskErr);
    const rootCause = chain[chain.length - 1]!;
    expect(isCrewspaceError(rootCause)).toBe(true);
    expect((rootCause as CrewspaceError).isRetryable).toBe(true);
  });
});

// ==========================================================================
// 2. Error classification and retryability
// ==========================================================================

describe('Error classification and retryability', () => {
  const classifier = new DefaultFailureClassifier();

  describe('retryability across error types', () => {
    it('should mark LLMProviderError with 5xx as retryable', () => {
      expect(new LLMProviderError('p', 'fail', 500).isRetryable).toBe(true);
      expect(new LLMProviderError('p', 'fail', 502).isRetryable).toBe(true);
      expect(new LLMProviderError('p', 'fail', 503).isRetryable).toBe(true);
    });

    it('should mark LLMProviderError with 429 as retryable', () => {
      expect(new LLMProviderError('p', 'fail', 429).isRetryable).toBe(true);
    });

    it('should mark LLMProviderError with 4xx (non-429) as NOT retryable', () => {
      expect(new LLMProviderError('p', 'fail', 400).isRetryable).toBe(false);
      expect(new LLMProviderError('p', 'fail', 403).isRetryable).toBe(false);
      expect(new LLMProviderError('p', 'fail', 404).isRetryable).toBe(false);
    });

    it('should mark LLMProviderError without statusCode as NOT retryable', () => {
      expect(new LLMProviderError('p', 'fail').isRetryable).toBe(false);
    });

    it('should mark LLMAuthenticationError as NOT retryable regardless', () => {
      const err = new LLMAuthenticationError('p', 'bad key');
      expect(err.isRetryable).toBe(false);
    });

    it('should mark LLMContextLengthError as NOT retryable', () => {
      const err = new LLMContextLengthError('p', 'too long', 10000, 8192);
      expect(err.isRetryable).toBe(false);
    });

    it('should mark LLMStreamError as retryable', () => {
      const err = new LLMStreamError('p', 'broken', 3, 'partial');
      expect(err.isRetryable).toBe(true);
    });

    it('should mark ToolTimeoutError as retryable', () => {
      expect(new ToolTimeoutError('search', 1000).isRetryable).toBe(true);
    });

    it('should mark TaskTimeoutError as retryable', () => {
      expect(new TaskTimeoutError('t1', 5000).isRetryable).toBe(true);
    });

    it('should mark config errors as NOT retryable', () => {
      expect(new AgentConfigError('bad').isRetryable).toBe(false);
      expect(new CrewConfigError('bad').isRetryable).toBe(false);
      expect(new TaskConfigError('bad').isRetryable).toBe(false);
      expect(new ToolConfigError('bad').isRetryable).toBe(false);
      expect(new MemoryConfigError('bad').isRetryable).toBe(false);
      expect(new EngineConfigError('bad').isRetryable).toBe(false);
    });
  });

  describe('DefaultFailureClassifier — severity rules', () => {
    it('should classify all config errors as CRITICAL', () => {
      expect(classifier.classify(new AgentConfigError('bad'))).toBe(FailureSeverity.CRITICAL);
      expect(classifier.classify(new CrewConfigError('bad'))).toBe(FailureSeverity.CRITICAL);
      expect(classifier.classify(new EngineConfigError('bad'))).toBe(FailureSeverity.CRITICAL);
      expect(classifier.classify(new TaskConfigError('bad'))).toBe(FailureSeverity.CRITICAL);
      expect(classifier.classify(new ToolConfigError('bad'))).toBe(FailureSeverity.CRITICAL);
      expect(classifier.classify(new MemoryConfigError('bad'))).toBe(FailureSeverity.CRITICAL);
    });

    it('should classify LLMAuthenticationError as CRITICAL', () => {
      expect(classifier.classify(new LLMAuthenticationError('p', 'bad key'))).toBe(
        FailureSeverity.CRITICAL,
      );
    });

    it('should classify CircularDependencyError as CRITICAL', () => {
      const err = new CircularDependencyError([{ path: ['a', 'b', 'a'] }]);
      expect(classifier.classify(err)).toBe(FailureSeverity.CRITICAL);
    });

    it('should classify tool execution errors as NON_CRITICAL', () => {
      expect(classifier.classify(new ToolExecutionError('s', 'fail'))).toBe(
        FailureSeverity.NON_CRITICAL,
      );
      expect(classifier.classify(new ToolTimeoutError('s', 5000))).toBe(
        FailureSeverity.NON_CRITICAL,
      );
      expect(classifier.classify(new ToolCompositionError('s', 'deep', 5, 3))).toBe(
        FailureSeverity.NON_CRITICAL,
      );
      expect(
        classifier.classify(
          new ToolInputValidationError('s', [
            { path: 'q', message: 'required', code: 'invalid_type' },
          ]),
        ),
      ).toBe(FailureSeverity.NON_CRITICAL);
    });

    it('should classify LLM transient errors as NON_CRITICAL', () => {
      expect(classifier.classify(new LLMRateLimitError('p', 'rate'))).toBe(
        FailureSeverity.NON_CRITICAL,
      );
      expect(classifier.classify(new LLMStreamError('p', 'broke', 0, ''))).toBe(
        FailureSeverity.NON_CRITICAL,
      );
      expect(classifier.classify(new LLMContextLengthError('p', 'long'))).toBe(
        FailureSeverity.NON_CRITICAL,
      );
    });

    it('should classify memory operation/query errors as NON_CRITICAL', () => {
      expect(classifier.classify(new MemoryOperationError('p', 'read', 'fail'))).toBe(
        FailureSeverity.NON_CRITICAL,
      );
      expect(classifier.classify(new MemoryQueryError('p', 'bad query'))).toBe(
        FailureSeverity.NON_CRITICAL,
      );
    });

    it('should classify retryable errors not in explicit lists as NON_CRITICAL', () => {
      const err = new TaskTimeoutError('t1', 5000);
      expect(err.isRetryable).toBe(true);
      expect(classifier.classify(err)).toBe(FailureSeverity.NON_CRITICAL);
    });

    it('should classify non-retryable CrewspaceErrors not in lists as CRITICAL', () => {
      expect(classifier.classify(new AgentExecutionError('a1', 'fail'))).toBe(
        FailureSeverity.CRITICAL,
      );
      expect(classifier.classify(new CrewExecutionError('c1', 'fail'))).toBe(
        FailureSeverity.CRITICAL,
      );
    });

    it('should classify plain Error as CRITICAL (fail-safe)', () => {
      expect(classifier.classify(new Error('unknown'))).toBe(FailureSeverity.CRITICAL);
    });

    it('should classify TypeError/RangeError as CRITICAL', () => {
      expect(classifier.classify(new TypeError('bad type'))).toBe(FailureSeverity.CRITICAL);
      expect(classifier.classify(new RangeError('out of range'))).toBe(FailureSeverity.CRITICAL);
    });
  });
});

// ==========================================================================
// 3. Graceful degradation error scenarios
// ==========================================================================

describe('Graceful degradation error scenarios', () => {
  it('should re-throw critical errors and not apply fallback', async () => {
    const handler = new GracefulDegradationHandler();
    const configErr = new AgentConfigError('missing role');

    await expect(
      handler.execute(
        () => {
          throw configErr;
        },
        { fallback: 'default' },
      ),
    ).rejects.toThrow(configErr);

    expect(handler.degradationCount).toBe(0);
  });

  it('should degrade on non-critical error and return fallback', async () => {
    const handler = new GracefulDegradationHandler();
    const toolErr = new ToolExecutionError('search', 'network error');

    const result = await handler.execute(
      () => {
        throw toolErr;
      },
      {
        fallback: 'cached-result',
      },
    );

    expect(result.degraded).toBe(true);
    expect(result.value).toBe('cached-result');
    expect(result.error).toBe(toolErr);
    expect(handler.degradationCount).toBe(1);
  });

  it('should support dynamic fallback providers', async () => {
    const handler = new GracefulDegradationHandler();
    const toolErr = new ToolTimeoutError('web-fetch', 5000);

    const result = await handler.execute(
      () => {
        throw toolErr;
      },
      {
        fallback: (err) => `Fallback: ${err.message}`,
      },
    );

    expect(result.degraded).toBe(true);
    expect(result.value).toContain('web-fetch');
  });

  it('should support async fallback providers', async () => {
    const handler = new GracefulDegradationHandler();

    const result = await handler.execute(
      () => {
        throw new ToolExecutionError('db', 'connection lost');
      },
      {
        fallback: async () => {
          return 'async-fallback-value';
        },
      },
    );

    expect(result.degraded).toBe(true);
    expect(result.value).toBe('async-fallback-value');
  });

  it('should pass context to dynamic fallback', async () => {
    const handler = new GracefulDegradationHandler();
    const ctx = { operationId: 'fetch-data', operationType: 'tool', metadata: { attempt: 1 } };

    const result = await handler.execute(
      () => {
        throw new ToolExecutionError('fetch', 'error');
      },
      {
        fallback: (_err, context) => `op:${context?.operationId}`,
        context: ctx,
      },
    );

    expect(result.value).toBe('op:fetch-data');
  });

  it('should emit degradation:fallback event on non-critical failure', async () => {
    const handler = new GracefulDegradationHandler();
    const listener = vi.fn();
    handler.on('degradation:fallback', listener);

    await handler.execute(
      () => {
        throw new ToolExecutionError('search', 'fail');
      },
      { fallback: 'default' },
    );

    expect(listener).toHaveBeenCalledOnce();
    const record = listener.mock.calls[0]![0];
    expect(record.fallbackUsed).toBe(true);
    expect(record.severity).toBe(FailureSeverity.NON_CRITICAL);
  });

  it('should emit degradation:critical event before re-throwing', async () => {
    const handler = new GracefulDegradationHandler();
    const listener = vi.fn();
    handler.on('degradation:critical', listener);

    const authErr = new LLMAuthenticationError('openai', 'invalid key');
    await expect(
      handler.execute(
        () => {
          throw authErr;
        },
        { fallback: 'default' },
      ),
    ).rejects.toThrow();

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0]![0]).toBe(authErr);
  });

  it('should emit degradation:success event on successful operation', async () => {
    const handler = new GracefulDegradationHandler();
    const listener = vi.fn();
    handler.on('degradation:success', listener);

    await handler.execute(() => 'ok', {
      fallback: 'default',
      context: { operationId: 'test-op' },
    });

    expect(listener).toHaveBeenCalledWith('test-op');
  });

  it('should handle non-Error thrown values via normalizeError', async () => {
    const handler = new GracefulDegradationHandler();

    // Plain string thrown — normalizeError wraps it; plain Error → CRITICAL
    await expect(
      handler.execute(
        () => {
          throw 'string error';
        },
        { fallback: 'default' },
      ),
    ).rejects.toThrow();
  });

  it('should evict oldest history when maxHistorySize is exceeded', async () => {
    const handler = new GracefulDegradationHandler({ maxHistorySize: 3 });

    for (let i = 0; i < 5; i++) {
      await handler.execute(
        () => {
          throw new ToolExecutionError('tool', `error-${i}`);
        },
        { fallback: 'default', context: { operationId: `op-${i}` } },
      );
    }

    expect(handler.degradationCount).toBe(3);
    const history = handler.history;
    expect(history[0]!.context?.operationId).toBe('op-2');
    expect(history[2]!.context?.operationId).toBe('op-4');
  });

  it('should support custom classifier', async () => {
    const handler = new GracefulDegradationHandler({
      classifier: {
        classify: () => FailureSeverity.NON_CRITICAL,
      },
    });

    // Even auth errors become non-critical with custom classifier
    const result = await handler.execute(
      () => {
        throw new LLMAuthenticationError('p', 'bad key');
      },
      { fallback: 'override' },
    );

    expect(result.degraded).toBe(true);
    expect(result.value).toBe('override');
  });

  it('should handle executeOptional with non-critical errors', async () => {
    const handler = new GracefulDegradationHandler();

    const result = await handler.executeOptional(() => {
      throw new ToolExecutionError('search', 'fail');
    });

    expect(result.degraded).toBe(true);
    expect(result.value).toBeUndefined();
  });

  it('should handle executeOptional with critical errors', async () => {
    const handler = new GracefulDegradationHandler();

    await expect(
      handler.executeOptional(() => {
        throw new AgentConfigError('bad config');
      }),
    ).rejects.toThrow(AgentConfigError);
  });

  it('should clearHistory', async () => {
    const handler = new GracefulDegradationHandler();

    await handler.execute(
      () => {
        throw new ToolExecutionError('t', 'err');
      },
      { fallback: 'x' },
    );
    expect(handler.degradationCount).toBe(1);

    handler.clearHistory();
    expect(handler.degradationCount).toBe(0);
    expect(handler.history).toHaveLength(0);
  });

  it('should classify errors directly without executing', () => {
    const handler = new GracefulDegradationHandler();
    expect(handler.classify(new ToolTimeoutError('s', 1000))).toBe(FailureSeverity.NON_CRITICAL);
    expect(handler.classify(new AgentConfigError('bad'))).toBe(FailureSeverity.CRITICAL);
  });

  it('should handle multiple sequential degradations with different error types', async () => {
    const handler = new GracefulDegradationHandler();

    const r1 = await handler.execute(
      () => {
        throw new ToolExecutionError('t1', 'fail');
      },
      { fallback: 'fallback-1' },
    );
    const r2 = await handler.execute(
      () => {
        throw new ToolTimeoutError('t2', 3000);
      },
      { fallback: 'fallback-2' },
    );
    const r3 = await handler.execute(
      () => {
        throw new LLMRateLimitError('openai', 'rate limit', 5000);
      },
      { fallback: 'fallback-3' },
    );

    expect(r1.degraded).toBe(true);
    expect(r2.degraded).toBe(true);
    expect(r3.degraded).toBe(true);
    expect(handler.degradationCount).toBe(3);

    // Verify history has all three
    expect(handler.history[0]!.error).toBeInstanceOf(ToolExecutionError);
    expect(handler.history[1]!.error).toBeInstanceOf(ToolTimeoutError);
    expect(handler.history[2]!.error).toBeInstanceOf(LLMRateLimitError);
  });

  it('should log to console.warn in verbose mode', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handler = new GracefulDegradationHandler({ verbose: true });

    await handler.execute(
      () => {
        throw new ToolExecutionError('search', 'timeout');
      },
      { fallback: 'default', context: { operationId: 'my-op' } },
    );

    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0]![0]).toContain('my-op');
    warnSpy.mockRestore();
  });
});

// ==========================================================================
// 4. Error wrapping and unwrapping edge cases
// ==========================================================================

describe('Error wrapping and unwrapping edge cases', () => {
  it('should handle deeply nested cause chains', () => {
    let current: Error = new Error('root');
    const depth = 50;
    for (let i = 0; i < depth; i++) {
      current = new TaskExecutionError(`task-${i}`, `level-${i}`, undefined, current);
    }

    const chain = getErrorChain(current);
    expect(chain).toHaveLength(depth + 1);
    expect(chain[0]!.message).toContain('task-49');
    expect(chain[depth]!.message).toBe('root');
  });

  it('should stop at non-Error causes', () => {
    const err = new Error('top');
    (err as { cause: unknown }).cause = 'not an error';
    const chain = getErrorChain(err);
    expect(chain).toHaveLength(1);
  });

  it('should handle circular cause chain of length 3', () => {
    const a = new Error('a');
    const b = new Error('b');
    const c = new Error('c');
    (a as { cause: Error }).cause = b;
    (b as { cause: Error }).cause = c;
    (c as { cause: Error }).cause = a;

    const chain = getErrorChain(a);
    expect(chain).toHaveLength(3);
    expect(chain[0]).toBe(a);
    expect(chain[1]).toBe(b);
    expect(chain[2]).toBe(c);
  });

  it('normalizeError should handle objects', () => {
    const err = normalizeError({ code: 42, msg: 'fail' });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain('object');
  });

  it('normalizeError should handle undefined', () => {
    const err = normalizeError(undefined);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('undefined');
  });

  it('normalizeError should handle boolean', () => {
    const err = normalizeError(false);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('false');
  });

  it('normalizeError should handle symbols via String()', () => {
    const sym = Symbol('test');
    const err = normalizeError(sym);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain('Symbol');
  });

  it('should preserve CrewspaceError subclass through normalizeError', () => {
    const original = new LLMRateLimitError('openai', 'limit', 1000);
    const normalized = normalizeError(original);
    expect(normalized).toBe(original);
    expect(isCrewspaceError(normalized)).toBe(true);
  });
});

// ==========================================================================
// 5. AggregateCrewspaceError scenarios
// ==========================================================================

describe('AggregateCrewspaceError scenarios', () => {
  it('should handle empty errors array', () => {
    const agg = new AggregateCrewspaceError('No errors', []);
    expect(agg.errors).toHaveLength(0);
    expect(agg.message).toContain('0 errors');
    expect(agg.code).toBe(ErrorCode.UNKNOWN);
  });

  it('should handle mixed error types', () => {
    const errors: Error[] = [
      new LLMRateLimitError('openai', 'rate limit'),
      new ToolTimeoutError('search', 5000),
      new Error('plain error'),
      new TaskExecutionError('t1', 'failed'),
    ];
    const agg = new AggregateCrewspaceError('Multi-task failure', errors);

    expect(agg.errors).toHaveLength(4);
    expect(agg.message).toContain('4 errors');

    const json = agg.toJSON();
    const details = json.details['errors'] as Array<{ code?: string; name?: string }>;
    expect(details[0]!.code).toBe(ErrorCode.LLM_RATE_LIMIT);
    expect(details[1]!.code).toBe(ErrorCode.TOOL_TIMEOUT);
    expect(details[2]!.name).toBe('Error');
    expect(details[3]!.code).toBe(ErrorCode.TASK_EXECUTION);
  });

  it('should be instanceof CrewspaceError and Error', () => {
    const agg = new AggregateCrewspaceError('test', [new Error('a')]);
    expect(agg).toBeInstanceOf(Error);
    expect(agg).toBeInstanceOf(CrewspaceError);
    expect(isCrewspaceError(agg)).toBe(true);
  });

  it('should format aggregate errors for logging', () => {
    const errors = [
      new ToolExecutionError('search', 'timeout'),
      new LLMProviderError('openai', 'server error', 500),
    ];
    const agg = new AggregateCrewspaceError('Parallel failure', errors);
    const fmt = formatErrorForLog(agg);

    expect(fmt.name).toBe('AggregateCrewspaceError');
    expect(fmt.code).toBe(ErrorCode.UNKNOWN);
    expect(fmt.message).toContain('2 errors');
  });
});

// ==========================================================================
// 6. Error serialization edge cases
// ==========================================================================

describe('Error serialization (toJSON)', () => {
  it('should serialize ToolCompositionError with depth details', () => {
    const err = new ToolCompositionError('pipeline', 'max depth exceeded', 10, 5);
    const json = err.toJSON();

    expect(json.name).toBe('ToolCompositionError');
    expect(json.code).toBe(ErrorCode.TOOL_COMPOSITION);
    expect(json.details['depth']).toBe(10);
    expect(json.details['maxDepth']).toBe(5);
    expect(json.details['toolName']).toBe('pipeline');
  });

  it('should serialize ToolInputValidationError with issues', () => {
    const issues = [
      { path: 'query', message: 'Required', code: 'invalid_type' },
      { path: 'options.limit', message: 'Must be positive', code: 'too_small' },
    ];
    const err = new ToolInputValidationError('search', issues);
    const json = err.toJSON();

    expect(json.details['issues']).toHaveLength(2);
    const serializedIssues = json.details['issues'] as Array<{ path: string; message: string }>;
    expect(serializedIssues[0]!.path).toBe('query');
    expect(serializedIssues[1]!.path).toBe('options.limit');
  });

  it('should serialize ToolPermissionError with permission details', () => {
    const err = new ToolPermissionError(
      'file-write',
      ['read', 'write', 'execute'] as never[],
      ['write', 'execute'] as never[],
    );
    const json = err.toJSON();

    expect(json.details['toolName']).toBe('file-write');
    expect(json.details['requiredPermissions']).toEqual(['read', 'write', 'execute']);
    expect(json.details['deniedPermissions']).toEqual(['write', 'execute']);
  });

  it('should serialize LLMStreamError with partial content details', () => {
    const err = new LLMStreamError('anthropic', 'connection reset', 15, 'Here is the partial re');
    const json = err.toJSON();

    expect(json.details['chunksReceived']).toBe(15);
    expect(json.details['partialContent']).toBe('Here is the partial re');
    expect(json.details['provider']).toBe('anthropic');
  });

  it('should serialize LLMContextLengthError with token details', () => {
    const err = new LLMContextLengthError('openai', 'too long', 128000, 32768);
    const json = err.toJSON();

    expect(json.details['requestTokens']).toBe(128000);
    expect(json.details['maxTokens']).toBe(32768);
  });

  it('should serialize CircularDependencyError with cycle details', () => {
    const cycles = [{ path: ['a', 'b', 'c', 'a'] }, { path: ['d', 'e', 'd'] }];
    const err = new CircularDependencyError(cycles);
    const json = err.toJSON();

    expect(json.details['cycles']).toEqual([
      ['a', 'b', 'c', 'a'],
      ['d', 'e', 'd'],
    ]);
    expect(json.details['involvedTaskIds']).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('should serialize MemoryOperationError with operation detail', () => {
    const cause = new Error('ENOSPC');
    const err = new MemoryOperationError('sqlite', 'write', 'disk full', cause);
    const json = err.toJSON();

    expect(json.details['provider']).toBe('sqlite');
    expect(json.details['operation']).toBe('write');
    expect(json.cause).toEqual({ message: 'ENOSPC' });
  });

  it('should serialize nested CrewspaceError causes recursively', () => {
    const inner = new ToolTimeoutError('search', 3000);
    const mid = new TaskExecutionError('t1', 'tool timed out', 'a1', inner);
    const outer = new CrewExecutionError('c1', 'task failed', 't1', mid);
    const json = outer.toJSON();

    expect(json.cause).toBeDefined();
    const midJson = json.cause as { code: string; cause: { code: string } };
    expect(midJson.code).toBe(ErrorCode.TASK_EXECUTION);
    expect(midJson.cause.code).toBe(ErrorCode.TOOL_TIMEOUT);
  });
});

// ==========================================================================
// 7. Concurrent error handling scenarios
// ==========================================================================

describe('Concurrent error handling scenarios', () => {
  it('should handle multiple parallel degradations correctly', async () => {
    const handler = new GracefulDegradationHandler();
    const events: string[] = [];
    handler.on('degradation:fallback', (record) => {
      events.push(record.context?.operationId ?? 'unknown');
    });

    const promises = Array.from({ length: 10 }, (_, i) =>
      handler.execute(
        () => {
          throw new ToolExecutionError(`tool-${i}`, 'fail');
        },
        { fallback: `fallback-${i}`, context: { operationId: `op-${i}` } },
      ),
    );

    const results = await Promise.all(promises);
    expect(results).toHaveLength(10);
    results.forEach((r, i) => {
      expect(r.degraded).toBe(true);
      expect(r.value).toBe(`fallback-${i}`);
    });
    expect(events).toHaveLength(10);
    expect(handler.degradationCount).toBe(10);
  });

  it('should handle mixed success and failure in parallel', async () => {
    const handler = new GracefulDegradationHandler();

    const results = await Promise.allSettled([
      handler.execute(() => 'success-1', { fallback: 'fb-1' }),
      handler.execute(
        () => {
          throw new ToolExecutionError('t', 'fail');
        },
        { fallback: 'fb-2' },
      ),
      handler.execute(() => 'success-3', { fallback: 'fb-3' }),
      handler.execute(
        () => {
          throw new AgentConfigError('critical!');
        },
        { fallback: 'fb-4' },
      ),
    ]);

    // First: success
    expect(results[0]!.status).toBe('fulfilled');
    expect((results[0] as PromiseFulfilledResult<{ value: string }>).value.value).toBe('success-1');

    // Second: degraded (non-critical)
    expect(results[1]!.status).toBe('fulfilled');
    expect((results[1] as PromiseFulfilledResult<{ degraded: boolean }>).value.degraded).toBe(true);

    // Third: success
    expect(results[2]!.status).toBe('fulfilled');

    // Fourth: rejected (critical)
    expect(results[3]!.status).toBe('rejected');

    expect(handler.degradationCount).toBe(1);
  });

  it('should aggregate errors from parallel operations', async () => {
    const operations = [
      Promise.reject(new ToolExecutionError('search', 'timeout')),
      Promise.resolve('ok'),
      Promise.reject(new LLMRateLimitError('openai', 'rate limit', 2000)),
      Promise.resolve('also ok'),
      Promise.reject(new TaskTimeoutError('t1', 5000)),
    ];

    const results = await Promise.allSettled(operations);
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => r.reason as Error);

    const agg = new AggregateCrewspaceError('Batch failed', errors);
    expect(agg.errors).toHaveLength(3);

    // Verify all errors are classifiable
    for (const err of agg.errors) {
      expect(isCrewspaceError(err)).toBe(true);
    }
  });
});

// ==========================================================================
// 8. Error hierarchy and instanceof checks
// ==========================================================================

describe('Error hierarchy and instanceof checks', () => {
  it('LLMRateLimitError should be instanceof LLMProviderError', () => {
    const err = new LLMRateLimitError('openai', 'rate limit');
    expect(err).toBeInstanceOf(LLMRateLimitError);
    expect(err).toBeInstanceOf(LLMProviderError);
    expect(err).toBeInstanceOf(CrewspaceError);
    expect(err).toBeInstanceOf(Error);
  });

  it('LLMAuthenticationError should be instanceof LLMProviderError', () => {
    const err = new LLMAuthenticationError('openai', 'bad key');
    expect(err).toBeInstanceOf(LLMAuthenticationError);
    expect(err).toBeInstanceOf(LLMProviderError);
    expect(err).toBeInstanceOf(CrewspaceError);
    expect(err).toBeInstanceOf(Error);
  });

  it('LLMContextLengthError should be instanceof LLMProviderError', () => {
    const err = new LLMContextLengthError('openai', 'too long');
    expect(err).toBeInstanceOf(LLMContextLengthError);
    expect(err).toBeInstanceOf(LLMProviderError);
  });

  it('LLMStreamError should be instanceof LLMProviderError', () => {
    const err = new LLMStreamError('openai', 'broken', 0, '');
    expect(err).toBeInstanceOf(LLMStreamError);
    expect(err).toBeInstanceOf(LLMProviderError);
  });

  it('ToolCompositionError should be instanceof ToolExecutionError', () => {
    const err = new ToolCompositionError('pipe', 'deep', 5, 3);
    expect(err).toBeInstanceOf(ToolCompositionError);
    expect(err).toBeInstanceOf(ToolExecutionError);
    expect(err).toBeInstanceOf(CrewspaceError);
  });

  it('ToolInputValidationError should be instanceof ToolExecutionError', () => {
    const err = new ToolInputValidationError('search', []);
    expect(err).toBeInstanceOf(ToolInputValidationError);
    expect(err).toBeInstanceOf(ToolExecutionError);
  });

  it('CircularDependencyError should be instanceof TaskConfigError', () => {
    const err = new CircularDependencyError([{ path: ['a', 'b', 'a'] }]);
    expect(err).toBeInstanceOf(CircularDependencyError);
    expect(err).toBeInstanceOf(TaskConfigError);
    expect(err).toBeInstanceOf(CrewspaceError);
  });

  it('TaskTimeoutError should be instanceof TaskExecutionError', () => {
    const err = new TaskTimeoutError('t1', 5000);
    expect(err).toBeInstanceOf(TaskTimeoutError);
    expect(err).toBeInstanceOf(TaskExecutionError);
    expect(err).toBeInstanceOf(CrewspaceError);
  });
});

// ==========================================================================
// 9. Error message formatting
// ==========================================================================

describe('Error message formatting', () => {
  it('ToolExecutionError should include tool name', () => {
    const err = new ToolExecutionError('web-search', 'DNS resolution failed');
    expect(err.message).toBe('Tool "web-search" execution failed: DNS resolution failed');
  });

  it('ToolNotFoundError should include tool name', () => {
    const err = new ToolNotFoundError('nonexistent-tool');
    expect(err.message).toBe('Tool "nonexistent-tool" is not registered');
  });

  it('ToolPermissionError should list denied permissions', () => {
    const err = new ToolPermissionError('file', ['read', 'write'] as never[], ['write'] as never[]);
    expect(err.message).toContain('write');
  });

  it('ToolTimeoutError should include timeout value', () => {
    const err = new ToolTimeoutError('slow-tool', 30000);
    expect(err.message).toContain('30000ms');
  });

  it('ToolCompositionError should include tool name', () => {
    const err = new ToolCompositionError('nested-tool', 'max depth exceeded', 6, 5);
    expect(err.message).toContain('nested-tool');
    expect(err.message).toContain('max depth exceeded');
  });

  it('ToolInputValidationError should include field summaries', () => {
    const err = new ToolInputValidationError('api-tool', [
      { path: 'url', message: 'Invalid URL', code: 'custom' },
      { path: '', message: 'Missing required field', code: 'invalid_type' },
    ]);
    expect(err.message).toContain('url: Invalid URL');
    expect(err.message).toContain('Missing required field');
  });

  it('LLMProviderError should include provider name', () => {
    const err = new LLMProviderError('anthropic', 'service unavailable', 503);
    expect(err.message).toContain('anthropic');
  });

  it('LLMRateLimitError should extend provider message', () => {
    const err = new LLMRateLimitError('openai', 'too many requests');
    expect(err.message).toContain('openai');
    expect(err.message).toContain('too many requests');
  });

  it('CircularDependencyError with single cycle', () => {
    const err = new CircularDependencyError([{ path: ['a', 'b', 'c', 'a'] }]);
    expect(err.message).toContain('a \u2192 b \u2192 c \u2192 a');
  });

  it('CircularDependencyError with multiple cycles', () => {
    const err = new CircularDependencyError([{ path: ['a', 'b', 'a'] }, { path: ['c', 'd', 'c'] }]);
    expect(err.message).toContain('a \u2192 b \u2192 a');
    expect(err.message).toContain('c \u2192 d \u2192 c');
  });

  it('MemoryOperationError should include provider and operation', () => {
    const err = new MemoryOperationError('redis', 'read', 'connection refused');
    expect(err.message).toBe('Memory "redis" read failed: connection refused');
  });

  it('MemoryQueryError should include provider', () => {
    const err = new MemoryQueryError('elasticsearch', 'invalid filter');
    expect(err.message).toContain('elasticsearch');
  });

  it('CrewExecutionError with taskId context', () => {
    const err = new CrewExecutionError('research-crew', 'analysis failed', 'data-task');
    expect(err.message).toContain('research-crew');
    expect(err.message).toContain('data-task');
  });

  it('CrewExecutionError without taskId', () => {
    const err = new CrewExecutionError('crew-1', 'general failure');
    expect(err.message).toBe('Crew "crew-1" execution failed: general failure');
    expect(err.taskId).toBeUndefined();
  });

  it('EngineExecutionError with taskId', () => {
    const err = new EngineExecutionError('engine-1', 'crashed', 'task-42');
    expect(err.message).toContain('engine-1');
    expect(err.message).toContain('task-42');
  });
});

// ==========================================================================
// 10. hasErrorCode edge cases
// ==========================================================================

describe('hasErrorCode edge cases', () => {
  it('should return false for null', () => {
    expect(hasErrorCode(null, ErrorCode.UNKNOWN)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(hasErrorCode(undefined, ErrorCode.UNKNOWN)).toBe(false);
  });

  it('should return false for numbers', () => {
    expect(hasErrorCode(42, ErrorCode.UNKNOWN)).toBe(false);
  });

  it('should return false for strings', () => {
    expect(hasErrorCode('error', ErrorCode.UNKNOWN)).toBe(false);
  });

  it('should return false for objects that look like errors but are not', () => {
    expect(
      hasErrorCode({ code: ErrorCode.AGENT_CONFIG, message: 'test' }, ErrorCode.AGENT_CONFIG),
    ).toBe(false);
  });

  it('should match ToolCompositionError with TOOL_COMPOSITION code', () => {
    const err = new ToolCompositionError('t', 'deep', 5, 3);
    expect(hasErrorCode(err, ErrorCode.TOOL_COMPOSITION)).toBe(true);
    expect(hasErrorCode(err, ErrorCode.TOOL_EXECUTION)).toBe(false);
  });

  it('should match LLMRateLimitError with LLM_RATE_LIMIT code (not LLM_PROVIDER)', () => {
    const err = new LLMRateLimitError('p', 'limit');
    expect(hasErrorCode(err, ErrorCode.LLM_RATE_LIMIT)).toBe(true);
    expect(hasErrorCode(err, ErrorCode.LLM_PROVIDER)).toBe(false);
  });
});

// ==========================================================================
// 11. formatErrorForLog edge cases
// ==========================================================================

describe('formatErrorForLog edge cases', () => {
  it('should handle error without stack trace', () => {
    const err = new Error('test');
    err.stack = undefined;
    const fmt = formatErrorForLog(err);
    expect(fmt.stack).toBeUndefined();
  });

  it('should handle CrewspaceError with cause chain of mixed types', () => {
    const plain = new Error('plain root');
    const crewErr = new AgentExecutionError('a1', 'mid-level', plain);
    const topErr = new CrewExecutionError('c1', 'top-level', 't1', crewErr);

    const fmt = formatErrorForLog(topErr);
    expect(fmt.code).toBe(ErrorCode.CREW_EXECUTION);
    expect(fmt.causeChain).toHaveLength(3);
    expect(fmt.causeChain[2]).toBe('plain root');
  });

  it('should format ToolInputValidationError for log', () => {
    const err = new ToolInputValidationError('api', [
      { path: 'body.name', message: 'Required', code: 'invalid_type' },
    ]);
    const fmt = formatErrorForLog(err);
    expect(fmt.code).toBe(ErrorCode.TOOL_INPUT_VALIDATION);
    expect(fmt.isRetryable).toBe(false);
    expect(fmt.message).toContain('body.name: Required');
  });

  it('should format LLMStreamError with partial content info', () => {
    const err = new LLMStreamError('openai', 'connection dropped', 42, 'Partial output...');
    const fmt = formatErrorForLog(err);
    expect(fmt.code).toBe(ErrorCode.LLM_STREAM);
    expect(fmt.isRetryable).toBe(true);
    expect(fmt.name).toBe('LLMStreamError');
  });
});

// ==========================================================================
// 12. Error timestamp behavior
// ==========================================================================

describe('Error timestamp behavior', () => {
  it('should produce unique timestamps for distinct errors', async () => {
    const err1 = new AgentConfigError('first');
    await new Promise((r) => setTimeout(r, 5));
    const err2 = new AgentConfigError('second');

    // Both should be valid ISO timestamps
    expect(new Date(err1.timestamp).toISOString()).toBe(err1.timestamp);
    expect(new Date(err2.timestamp).toISOString()).toBe(err2.timestamp);

    // Timestamps should be different (or at least valid)
    const t1 = new Date(err1.timestamp).getTime();
    const t2 = new Date(err2.timestamp).getTime();
    expect(t2).toBeGreaterThanOrEqual(t1);
  });

  it('should include timestamp in toJSON output', () => {
    const err = new ToolTimeoutError('search', 3000);
    const json = err.toJSON();
    expect(json.timestamp).toBe(err.timestamp);
    expect(new Date(json.timestamp).toISOString()).toBe(json.timestamp);
  });
});

// ==========================================================================
// 13. Graceful degradation with cascading operations
// ==========================================================================

describe('Graceful degradation cascading operations', () => {
  it('should handle pipeline where early stage degrades but later stages succeed', async () => {
    const handler = new GracefulDegradationHandler();

    // Stage 1: tool fails, uses fallback
    const stage1 = await handler.execute(
      () => {
        throw new ToolExecutionError('web-search', 'timeout');
      },
      { fallback: 'cached search results', context: { operationId: 'stage-1' } },
    );

    // Stage 2: uses stage1 result (which is fallback), succeeds
    const stage2 = await handler.execute(() => `Analyzed: ${stage1.value}`, {
      fallback: 'analysis unavailable',
      context: { operationId: 'stage-2' },
    });

    expect(stage1.degraded).toBe(true);
    expect(stage2.degraded).toBe(false);
    expect(stage2.value).toBe('Analyzed: cached search results');
    expect(handler.degradationCount).toBe(1);
  });

  it('should handle pipeline where critical error stops all subsequent stages', async () => {
    const handler = new GracefulDegradationHandler();
    const results: string[] = [];

    try {
      // Stage 1: succeeds
      const r1 = await handler.execute(() => 'stage-1-result', { fallback: 'fb1' });
      results.push(r1.value);

      // Stage 2: critical error - should stop pipeline
      await handler.execute(
        () => {
          throw new LLMAuthenticationError('openai', 'invalid key');
        },
        { fallback: 'fb2' },
      );
      results.push('should-not-reach');
    } catch {
      results.push('pipeline-stopped');
    }

    expect(results).toEqual(['stage-1-result', 'pipeline-stopped']);
    expect(handler.degradationCount).toBe(0);
  });

  it('should handle pipeline with multiple non-critical degradations', async () => {
    const handler = new GracefulDegradationHandler();

    const stages = await Promise.all([
      handler.execute(
        () => {
          throw new ToolTimeoutError('search', 5000);
        },
        { fallback: 'cached', context: { operationId: 'search' } },
      ),
      handler.execute(
        () => {
          throw new MemoryQueryError('redis', 'connection refused');
        },
        { fallback: [], context: { operationId: 'memory' } },
      ),
      handler.execute(
        () => {
          throw new LLMRateLimitError('openai', 'limit', 2000);
        },
        { fallback: 'default summary', context: { operationId: 'summarize' } },
      ),
    ]);

    expect(stages.every((s) => s.degraded)).toBe(true);
    expect(handler.degradationCount).toBe(3);
    expect(handler.history.map((h) => h.context?.operationId)).toEqual([
      'search',
      'memory',
      'summarize',
    ]);
  });
});

// ==========================================================================
// 14. Error detail preservation
// ==========================================================================

describe('Error detail preservation', () => {
  it('AgentConfigError preserves optional agentId', () => {
    const withId = new AgentConfigError('bad', 'my-agent');
    const withoutId = new AgentConfigError('bad');

    expect(withId.agentId).toBe('my-agent');
    expect(withId.toJSON().details['agentId']).toBe('my-agent');
    expect(withoutId.agentId).toBeUndefined();
    expect(withoutId.toJSON().details['agentId']).toBeUndefined();
  });

  it('TaskConfigError preserves optional taskId', () => {
    const withId = new TaskConfigError('bad', 'task-1');
    const withoutId = new TaskConfigError('bad');

    expect(withId.taskId).toBe('task-1');
    expect(withoutId.taskId).toBeUndefined();
  });

  it('ToolConfigError preserves optional toolName', () => {
    const withName = new ToolConfigError('bad', 'search');
    const withoutName = new ToolConfigError('bad');

    expect(withName.toolName).toBe('search');
    expect(withoutName.toolName).toBeUndefined();
  });

  it('CrewConfigError preserves optional crewId', () => {
    const withId = new CrewConfigError('bad', 'crew-1');
    const withoutId = new CrewConfigError('bad');

    expect(withId.crewId).toBe('crew-1');
    expect(withoutId.crewId).toBeUndefined();
  });

  it('EngineConfigError preserves optional engineId', () => {
    const withId = new EngineConfigError('bad', 'engine-1');
    const withoutId = new EngineConfigError('bad');

    expect(withId.engineId).toBe('engine-1');
    expect(withoutId.engineId).toBeUndefined();
  });

  it('MemoryConfigError preserves optional provider', () => {
    const withProvider = new MemoryConfigError('bad', 'redis');
    const withoutProvider = new MemoryConfigError('bad');

    expect(withProvider.provider).toBe('redis');
    expect(withoutProvider.provider).toBeUndefined();
  });

  it('LLMProviderError preserves optional statusCode', () => {
    const withCode = new LLMProviderError('openai', 'fail', 500);
    const withoutCode = new LLMProviderError('openai', 'fail');

    expect(withCode.statusCode).toBe(500);
    expect(withoutCode.statusCode).toBeUndefined();
  });

  it('LLMRateLimitError preserves optional retryAfterMs', () => {
    const withRetry = new LLMRateLimitError('openai', 'limit', 5000);
    const withoutRetry = new LLMRateLimitError('openai', 'limit');

    expect(withRetry.retryAfterMs).toBe(5000);
    expect(withoutRetry.retryAfterMs).toBeUndefined();
  });

  it('LLMContextLengthError preserves optional token counts', () => {
    const full = new LLMContextLengthError('openai', 'too long', 128000, 32768);
    const minimal = new LLMContextLengthError('openai', 'too long');

    expect(full.requestTokens).toBe(128000);
    expect(full.maxTokens).toBe(32768);
    expect(minimal.requestTokens).toBeUndefined();
    expect(minimal.maxTokens).toBeUndefined();
  });

  it('ToolNotFoundError preserves toolName', () => {
    const err = new ToolNotFoundError('missing-tool');
    expect(err.toolName).toBe('missing-tool');
    expect(err.toJSON().details['toolName']).toBe('missing-tool');
  });

  it('CrewExecutionError preserves optional taskId', () => {
    const withTask = new CrewExecutionError('c1', 'fail', 't1');
    const withoutTask = new CrewExecutionError('c1', 'fail');

    expect(withTask.taskId).toBe('t1');
    expect(withoutTask.taskId).toBeUndefined();
  });

  it('EngineExecutionError preserves optional taskId', () => {
    const withTask = new EngineExecutionError('e1', 'fail', 't1');
    const withoutTask = new EngineExecutionError('e1', 'fail');

    expect(withTask.taskId).toBe('t1');
    expect(withoutTask.taskId).toBeUndefined();
  });
});

// ==========================================================================
// 15. Graceful degradation event listener edge cases
// ==========================================================================

describe('Graceful degradation event listener management', () => {
  it('should support unsubscribing from events', async () => {
    const handler = new GracefulDegradationHandler();
    const listener = vi.fn();
    handler.on('degradation:fallback', listener);
    handler.off('degradation:fallback', listener);

    await handler.execute(
      () => {
        throw new ToolExecutionError('t', 'err');
      },
      { fallback: 'default' },
    );

    expect(listener).not.toHaveBeenCalled();
  });

  it('should support multiple event listeners', async () => {
    const handler = new GracefulDegradationHandler();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    handler.on('degradation:fallback', listener1);
    handler.on('degradation:fallback', listener2);

    await handler.execute(
      () => {
        throw new ToolExecutionError('t', 'err');
      },
      { fallback: 'default' },
    );

    expect(listener1).toHaveBeenCalledOnce();
    expect(listener2).toHaveBeenCalledOnce();
  });

  it('should allow chaining on() calls', () => {
    const handler = new GracefulDegradationHandler();
    const result = handler
      .on('degradation:fallback', () => {})
      .on('degradation:critical', () => {})
      .on('degradation:success', () => {});

    expect(result).toBe(handler);
  });

  it('should receive correct event data in listeners', async () => {
    const handler = new GracefulDegradationHandler();
    let receivedRecord: unknown = null;

    handler.on('degradation:fallback', (record) => {
      receivedRecord = record;
    });

    const ctx = { operationId: 'test-op', operationType: 'tool' };
    await handler.execute(
      () => {
        throw new ToolTimeoutError('search', 5000);
      },
      { fallback: 'default', context: ctx },
    );

    expect(receivedRecord).not.toBeNull();
    const record = receivedRecord as {
      error: Error;
      severity: string;
      context: { operationId: string };
      timestamp: string;
      fallbackUsed: boolean;
    };
    expect(record.error).toBeInstanceOf(ToolTimeoutError);
    expect(record.severity).toBe(FailureSeverity.NON_CRITICAL);
    expect(record.context.operationId).toBe('test-op');
    expect(record.timestamp).toBeDefined();
    expect(record.fallbackUsed).toBe(true);
  });
});
