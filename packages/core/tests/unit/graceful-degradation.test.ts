import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  DefaultFailureClassifier,
  FailureSeverity,
  GracefulDegradationHandler,
} from '../../src/errors/graceful-degradation.js';
import type {
  DegradationRecord,
  DegradedResult,
  FailureClassifier,
  FailureContext,
  GracefulDegradationConfig,
} from '../../src/errors/graceful-degradation.js';
import { ErrorCode } from '../../src/errors/base.js';
import { ToolExecutionError, ToolTimeoutError } from '../../src/errors/tool-errors.js';
import { TaskConfigError, TaskExecutionError } from '../../src/errors/task-errors.js';
import {
  LLMAuthenticationError,
  LLMRateLimitError,
  LLMStreamError,
} from '../../src/errors/llm-errors.js';
import { MemoryQueryError } from '../../src/errors/memory-errors.js';
import { AgentConfigError } from '../../src/errors/agent-errors.js';
import { EngineConfigError } from '../../src/errors/engine-errors.js';
import { CrewConfigError } from '../../src/errors/crew-errors.js';

// ---------------------------------------------------------------------------
// DefaultFailureClassifier
// ---------------------------------------------------------------------------

describe('DefaultFailureClassifier', () => {
  const classifier = new DefaultFailureClassifier();

  describe('critical errors', () => {
    it('should classify config errors as critical', () => {
      expect(classifier.classify(new TaskConfigError('bad config', 'task-1'))).toBe(
        FailureSeverity.CRITICAL,
      );
      expect(classifier.classify(new AgentConfigError('bad agent'))).toBe(
        FailureSeverity.CRITICAL,
      );
      expect(classifier.classify(new EngineConfigError('bad engine'))).toBe(
        FailureSeverity.CRITICAL,
      );
      expect(classifier.classify(new CrewConfigError('bad crew'))).toBe(
        FailureSeverity.CRITICAL,
      );
    });

    it('should classify authentication errors as critical', () => {
      expect(
        classifier.classify(new LLMAuthenticationError('openai', 'Invalid API key')),
      ).toBe(FailureSeverity.CRITICAL);
    });

    it('should classify unknown non-Crewspace errors as critical', () => {
      expect(classifier.classify(new Error('random error'))).toBe(FailureSeverity.CRITICAL);
      expect(classifier.classify(new TypeError('type error'))).toBe(FailureSeverity.CRITICAL);
    });
  });

  describe('non-critical errors', () => {
    it('should classify tool execution errors as non-critical', () => {
      expect(
        classifier.classify(new ToolExecutionError('search', 'API down')),
      ).toBe(FailureSeverity.NON_CRITICAL);
    });

    it('should classify tool timeout errors as non-critical', () => {
      expect(classifier.classify(new ToolTimeoutError('fetch', 5000))).toBe(
        FailureSeverity.NON_CRITICAL,
      );
    });

    it('should classify LLM rate limit errors as non-critical', () => {
      expect(
        classifier.classify(new LLMRateLimitError('openai', 'Too many requests', 1000)),
      ).toBe(FailureSeverity.NON_CRITICAL);
    });

    it('should classify LLM stream errors as non-critical', () => {
      expect(
        classifier.classify(new LLMStreamError('openai', 'Stream interrupted', 5, 'partial')),
      ).toBe(FailureSeverity.NON_CRITICAL);
    });

    it('should classify memory query errors as non-critical', () => {
      expect(classifier.classify(new MemoryQueryError('query failed'))).toBe(
        FailureSeverity.NON_CRITICAL,
      );
    });
  });
});

// ---------------------------------------------------------------------------
// GracefulDegradationHandler
// ---------------------------------------------------------------------------

describe('GracefulDegradationHandler', () => {
  let handler: GracefulDegradationHandler;

  beforeEach(() => {
    handler = new GracefulDegradationHandler();
  });

  describe('constructor', () => {
    it('should create with default configuration', () => {
      expect(handler.degradationCount).toBe(0);
      expect(handler.history).toEqual([]);
    });

    it('should accept custom configuration', () => {
      const customClassifier: FailureClassifier = {
        classify: () => FailureSeverity.NON_CRITICAL,
      };
      const custom = new GracefulDegradationHandler({
        classifier: customClassifier,
        maxHistorySize: 5,
        verbose: true,
      });
      expect(custom.degradationCount).toBe(0);
    });
  });

  describe('execute', () => {
    it('should return the value on success', async () => {
      const result = await handler.execute(() => 'hello', {
        fallback: 'default',
      });
      expect(result).toEqual({ value: 'hello', degraded: false });
    });

    it('should return the value from async operations', async () => {
      const result = await handler.execute(async () => 42, {
        fallback: 0,
      });
      expect(result).toEqual({ value: 42, degraded: false });
    });

    it('should degrade with static fallback on non-critical failure', async () => {
      const error = new ToolExecutionError('search', 'API timeout');
      const result = await handler.execute(
        () => {
          throw error;
        },
        { fallback: 'fallback value' },
      );

      expect(result.degraded).toBe(true);
      expect(result.value).toBe('fallback value');
      expect(result.error).toBe(error);
    });

    it('should degrade with dynamic fallback provider', async () => {
      const error = new ToolExecutionError('search', 'failed');
      const result = await handler.execute(
        () => {
          throw error;
        },
        {
          fallback: (err) => `Recovered from: ${err.message}`,
        },
      );

      expect(result.degraded).toBe(true);
      expect(result.value).toContain('Recovered from:');
    });

    it('should degrade with async fallback provider', async () => {
      const error = new ToolTimeoutError('fetch', 5000);
      const result = await handler.execute<string>(
        () => {
          throw error;
        },
        {
          fallback: async () => 'async fallback',
        },
      );

      expect(result.degraded).toBe(true);
      expect(result.value).toBe('async fallback');
    });

    it('should re-throw critical errors', async () => {
      const error = new TaskConfigError('Invalid config', 'task-1');
      await expect(
        handler.execute(
          () => {
            throw error;
          },
          { fallback: 'default' },
        ),
      ).rejects.toThrow(error);
    });

    it('should re-throw non-Crewspace errors as critical', async () => {
      const error = new TypeError('cannot read property');
      await expect(
        handler.execute(
          () => {
            throw error;
          },
          { fallback: 'default' },
        ),
      ).rejects.toThrow(error);
    });

    it('should handle non-Error thrown values', async () => {
      await expect(
        handler.execute(
          () => {
            throw 'string error'; // eslint-disable-line no-throw-literal
          },
          { fallback: 'default' },
        ),
      ).rejects.toThrow('string error');
    });

    it('should pass context to fallback provider', async () => {
      const context: FailureContext = {
        operationId: 'fetch-data',
        operationType: 'tool',
        metadata: { retries: 3 },
      };

      let receivedContext: FailureContext | undefined;
      const result = await handler.execute<string>(
        () => {
          throw new ToolExecutionError('fetch', 'failed');
        },
        {
          fallback: (_err, ctx) => {
            receivedContext = ctx;
            return 'fallback';
          },
          context,
        },
      );

      expect(result.degraded).toBe(true);
      expect(receivedContext).toBe(context);
    });
  });

  describe('executeOptional', () => {
    it('should return the value on success', async () => {
      const result = await handler.executeOptional(() => 'value');
      expect(result.value).toBe('value');
      expect(result.degraded).toBe(false);
    });

    it('should return undefined on non-critical failure', async () => {
      const result = await handler.executeOptional(() => {
        throw new ToolExecutionError('search', 'failed');
      });
      expect(result.value).toBeUndefined();
      expect(result.degraded).toBe(true);
    });

    it('should re-throw critical errors', async () => {
      await expect(
        handler.executeOptional(() => {
          throw new AgentConfigError('bad config');
        }),
      ).rejects.toThrow(AgentConfigError);
    });
  });

  describe('history tracking', () => {
    it('should track degradation records', async () => {
      await handler.execute(
        () => {
          throw new ToolExecutionError('tool-1', 'error 1');
        },
        { fallback: 'fb1', context: { operationId: 'op-1' } },
      );

      await handler.execute(
        () => {
          throw new ToolTimeoutError('tool-2', 5000);
        },
        { fallback: 'fb2', context: { operationId: 'op-2' } },
      );

      expect(handler.degradationCount).toBe(2);
      expect(handler.history).toHaveLength(2);
      expect(handler.history[0]!.context?.operationId).toBe('op-1');
      expect(handler.history[1]!.context?.operationId).toBe('op-2');
      expect(handler.history[0]!.fallbackUsed).toBe(true);
      expect(handler.history[0]!.severity).toBe(FailureSeverity.NON_CRITICAL);
      expect(handler.history[0]!.timestamp).toBeTruthy();
    });

    it('should not track successful operations', async () => {
      await handler.execute(() => 'ok', { fallback: 'default' });
      expect(handler.degradationCount).toBe(0);
    });

    it('should not track critical failures', async () => {
      try {
        await handler.execute(
          () => {
            throw new TaskConfigError('bad');
          },
          { fallback: 'default' },
        );
      } catch {
        // expected
      }
      expect(handler.degradationCount).toBe(0);
    });

    it('should respect maxHistorySize', async () => {
      const smallHandler = new GracefulDegradationHandler({ maxHistorySize: 3 });

      for (let i = 0; i < 5; i++) {
        await smallHandler.execute(
          () => {
            throw new ToolExecutionError('tool', `error ${String(i)}`);
          },
          { fallback: 'fb', context: { operationId: `op-${String(i)}` } },
        );
      }

      expect(smallHandler.degradationCount).toBe(3);
      // Should keep the 3 most recent
      expect(smallHandler.history[0]!.context?.operationId).toBe('op-2');
      expect(smallHandler.history[2]!.context?.operationId).toBe('op-4');
    });

    it('should clear history', async () => {
      await handler.execute(
        () => {
          throw new ToolExecutionError('tool', 'error');
        },
        { fallback: 'fb' },
      );
      expect(handler.degradationCount).toBe(1);

      handler.clearHistory();
      expect(handler.degradationCount).toBe(0);
      expect(handler.history).toEqual([]);
    });
  });

  describe('events', () => {
    it('should emit degradation:success on successful operations', async () => {
      const listener = vi.fn();
      handler.on('degradation:success', listener);

      await handler.execute(() => 'ok', {
        fallback: 'default',
        context: { operationId: 'my-op' },
      });

      expect(listener).toHaveBeenCalledWith('my-op');
    });

    it('should emit degradation:fallback on non-critical failures', async () => {
      const listener = vi.fn();
      handler.on('degradation:fallback', listener);

      const error = new ToolExecutionError('tool', 'failed');
      await handler.execute(
        () => {
          throw error;
        },
        { fallback: 'fb', context: { operationId: 'op-1' } },
      );

      expect(listener).toHaveBeenCalledTimes(1);
      const record: DegradationRecord = listener.mock.calls[0]![0];
      expect(record.error).toBe(error);
      expect(record.severity).toBe(FailureSeverity.NON_CRITICAL);
      expect(record.context?.operationId).toBe('op-1');
      expect(record.fallbackUsed).toBe(true);
    });

    it('should emit degradation:critical on critical failures', async () => {
      const listener = vi.fn();
      handler.on('degradation:critical', listener);

      const error = new TaskConfigError('bad config');
      try {
        await handler.execute(
          () => {
            throw error;
          },
          { fallback: 'default' },
        );
      } catch {
        // expected
      }

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(error, undefined);
    });

    it('should support off to unsubscribe', async () => {
      const listener = vi.fn();
      handler.on('degradation:success', listener);
      handler.off('degradation:success', listener);

      await handler.execute(() => 'ok', { fallback: 'default' });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('classify', () => {
    it('should expose classifier directly', () => {
      expect(handler.classify(new ToolExecutionError('t', 'e'))).toBe(
        FailureSeverity.NON_CRITICAL,
      );
      expect(handler.classify(new TaskConfigError('bad'))).toBe(FailureSeverity.CRITICAL);
    });
  });

  describe('custom classifier', () => {
    it('should use a custom classifier', async () => {
      const customClassifier: FailureClassifier = {
        classify: (_error, context) => {
          // Classify based on operation type
          if (context?.operationType === 'optional') {
            return FailureSeverity.NON_CRITICAL;
          }
          return FailureSeverity.CRITICAL;
        },
      };

      const customHandler = new GracefulDegradationHandler({
        classifier: customClassifier,
      });

      // Same error, different context => different classification
      const error = new Error('something failed');

      const result = await customHandler.execute(
        () => {
          throw error;
        },
        {
          fallback: 'fallback',
          context: { operationType: 'optional' },
        },
      );
      expect(result.degraded).toBe(true);

      await expect(
        customHandler.execute(
          () => {
            throw error;
          },
          {
            fallback: 'fallback',
            context: { operationType: 'required' },
          },
        ),
      ).rejects.toThrow(error);
    });
  });

  describe('verbose mode', () => {
    it('should log to console.warn when verbose is true', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const verboseHandler = new GracefulDegradationHandler({ verbose: true });

      await verboseHandler.execute(
        () => {
          throw new ToolExecutionError('search', 'timeout');
        },
        {
          fallback: 'default',
          context: { operationId: 'my-search' },
        },
      );

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]![0]).toContain('[GracefulDegradation]');
      expect(warnSpy.mock.calls[0]![0]).toContain('my-search');
      warnSpy.mockRestore();
    });

    it('should not log when verbose is false', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await handler.execute(
        () => {
          throw new ToolExecutionError('search', 'timeout');
        },
        { fallback: 'default' },
      );

      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});

// ---------------------------------------------------------------------------
// FailureSeverity enum
// ---------------------------------------------------------------------------

describe('FailureSeverity', () => {
  it('should have expected values', () => {
    expect(FailureSeverity.CRITICAL).toBe('critical');
    expect(FailureSeverity.NON_CRITICAL).toBe('non-critical');
  });
});

// ---------------------------------------------------------------------------
// Integration-like tests
// ---------------------------------------------------------------------------

describe('GracefulDegradationHandler integration', () => {
  it('should handle a pipeline of operations with mixed failures', async () => {
    const handler = new GracefulDegradationHandler();
    const results: DegradedResult<string>[] = [];

    // Step 1: succeeds
    results.push(
      await handler.execute(async () => 'data from step 1', {
        fallback: 'no data',
        context: { operationId: 'step-1', operationType: 'task' },
      }),
    );

    // Step 2: non-critical failure (tool timeout)
    results.push(
      await handler.execute<string>(
        async () => {
          throw new ToolTimeoutError('enrichment-tool', 3000);
        },
        {
          fallback: 'enrichment unavailable',
          context: { operationId: 'step-2', operationType: 'tool' },
        },
      ),
    );

    // Step 3: succeeds with data from step 1
    results.push(
      await handler.execute(async () => `processed: ${results[0]!.value}`, {
        fallback: 'processing failed',
        context: { operationId: 'step-3', operationType: 'task' },
      }),
    );

    expect(results[0]!.degraded).toBe(false);
    expect(results[0]!.value).toBe('data from step 1');

    expect(results[1]!.degraded).toBe(true);
    expect(results[1]!.value).toBe('enrichment unavailable');

    expect(results[2]!.degraded).toBe(false);
    expect(results[2]!.value).toBe('processed: data from step 1');

    expect(handler.degradationCount).toBe(1);
  });

  it('should halt on critical failure even after successful degradations', async () => {
    const handler = new GracefulDegradationHandler();

    // Succeeds
    await handler.execute(
      () => {
        throw new ToolExecutionError('tool', 'error');
      },
      { fallback: 'fb' },
    );
    expect(handler.degradationCount).toBe(1);

    // Critical failure should halt
    await expect(
      handler.execute(
        () => {
          throw new LLMAuthenticationError('openai', 'Bad API key');
        },
        { fallback: 'fb' },
      ),
    ).rejects.toThrow(LLMAuthenticationError);

    // History should only contain the non-critical one
    expect(handler.degradationCount).toBe(1);
  });

  it('should work with the exports from the errors index', async () => {
    // Verify the module is importable from the errors barrel
    const {
      GracefulDegradationHandler: Handler,
      DefaultFailureClassifier: Classifier,
      FailureSeverity: Severity,
    } = await import('../../src/errors/index.js');

    const h = new Handler();
    const c = new Classifier();

    expect(c.classify(new ToolExecutionError('t', 'e'))).toBe(Severity.NON_CRITICAL);
    expect(h.degradationCount).toBe(0);
  });
});
