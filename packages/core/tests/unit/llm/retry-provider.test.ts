import { describe, expect, it, vi } from 'vitest';

import {
  LLMAuthenticationError,
  LLMProviderError,
  LLMRateLimitError,
} from '../../../src/errors/llm-errors.js';
import { CircuitState } from '../../../src/llm/circuit-breaker.js';
import { createRetryProvider, RetryLLMProvider } from '../../../src/llm/retry-provider.js';
import type {
  LLMMessage,
  LLMProvider,
  LLMResponse,
  LLMStreamChunk,
  LLMStreamResponse,
  StreamingLLMProvider,
} from '../../../src/types/llm.js';
import { LLMRole } from '../../../src/types/llm.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const validMessages: LLMMessage[] = [{ role: LLMRole.USER, content: 'Hello' }];

const successResponse: LLMResponse = {
  content: 'Hi there!',
  finishReason: 'stop',
  tokenUsage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
};

// ---------------------------------------------------------------------------
// Mock provider factories
// ---------------------------------------------------------------------------

function createMockProvider(overrides?: Partial<LLMProvider>): LLMProvider {
  return {
    name: 'mock',
    generateText: vi.fn().mockResolvedValue(successResponse),
    ...overrides,
  };
}

function createMockProviderWithModelId(
  modelId: string,
  overrides?: Partial<LLMProvider>,
): LLMProvider & { modelId: string } {
  return {
    name: 'mock',
    modelId,
    generateText: vi.fn().mockResolvedValue(successResponse),
    ...overrides,
  };
}

function createMockStreamingProvider(
  overrides?: Partial<StreamingLLMProvider>,
): StreamingLLMProvider {
  const mockStream: LLMStreamResponse = {
    async *[Symbol.asyncIterator](): AsyncIterator<LLMStreamChunk> {
      yield { content: 'streamed ' };
      yield {
        content: 'response',
        finishReason: 'stop',
        tokenUsage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
      };
    },
    async toResponse(): Promise<LLMResponse> {
      return {
        content: 'streamed response',
        finishReason: 'stop',
        tokenUsage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
      };
    },
  };

  return {
    name: 'mock-streaming',
    generateText: vi.fn().mockResolvedValue(successResponse),
    generateStream: vi.fn().mockResolvedValue(mockStream),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RetryLLMProvider', () => {
  describe('constructor', () => {
    it('should use inner provider name', () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner);

      expect(retry.name).toBe('mock');
    });

    it('should use default retry config when no options provided', () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner);

      expect(retry.retryConfig.maxRetries).toBe(3);
      expect(retry.retryConfig.baseDelayMs).toBe(1_000);
      expect(retry.retryConfig.maxDelayMs).toBe(60_000);
      expect(retry.retryConfig.backoffMultiplier).toBe(2);
      expect(retry.retryConfig.jitter).toBe(1);
    });

    it('should accept custom retry options', () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 5,
        baseDelayMs: 200,
        maxDelayMs: 10_000,
        backoffMultiplier: 3,
        jitter: 0.5,
      });

      expect(retry.retryConfig.maxRetries).toBe(5);
      expect(retry.retryConfig.baseDelayMs).toBe(200);
      expect(retry.retryConfig.maxDelayMs).toBe(10_000);
      expect(retry.retryConfig.backoffMultiplier).toBe(3);
      expect(retry.retryConfig.jitter).toBe(0.5);
    });

    it('should accept maxRetries of 0 (no retries)', () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner, { maxRetries: 0 });

      expect(retry.retryConfig.maxRetries).toBe(0);
    });
  });

  describe('innerProvider', () => {
    it('should expose the wrapped inner provider', () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner);

      expect(retry.innerProvider).toBe(inner);
    });
  });

  describe('modelId', () => {
    it('should return modelId from inner provider when available', () => {
      const inner = createMockProviderWithModelId('gpt-4o');
      const retry = new RetryLLMProvider(inner);

      expect(retry.modelId).toBe('gpt-4o');
    });

    it('should return undefined when inner provider has no modelId', () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner);

      expect(retry.modelId).toBeUndefined();
    });
  });

  describe('generateText', () => {
    it('should delegate to inner provider on success', async () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner);

      const result = await retry.generateText(validMessages);

      expect(result).toEqual(successResponse);
      expect(inner.generateText).toHaveBeenCalledWith(validMessages, undefined);
    });

    it('should pass options through to inner provider', async () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner);
      const options = { temperature: 0.5, maxTokens: 100 };

      await retry.generateText(validMessages, options);

      expect(inner.generateText).toHaveBeenCalledWith(validMessages, options);
    });

    it('should retry on rate-limit error and succeed', async () => {
      const generateText = vi
        .fn()
        .mockRejectedValueOnce(new LLMRateLimitError('mock', 'Rate limited'))
        .mockResolvedValue(successResponse);

      const inner = createMockProvider({ generateText });
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 3,
        baseDelayMs: 1,
        jitter: 0,
      });

      const result = await retry.generateText(validMessages);

      expect(result).toEqual(successResponse);
      expect(generateText).toHaveBeenCalledTimes(2);
    });

    it('should retry on server 500 error and succeed', async () => {
      const generateText = vi
        .fn()
        .mockRejectedValueOnce(new LLMProviderError('mock', 'Server error', 500))
        .mockResolvedValue(successResponse);

      const inner = createMockProvider({ generateText });
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 3,
        baseDelayMs: 1,
        jitter: 0,
      });

      const result = await retry.generateText(validMessages);

      expect(result).toEqual(successResponse);
      expect(generateText).toHaveBeenCalledTimes(2);
    });

    it('should not retry on authentication error', async () => {
      const generateText = vi
        .fn()
        .mockRejectedValue(new LLMAuthenticationError('mock', 'Invalid key'));

      const inner = createMockProvider({ generateText });
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 3,
        baseDelayMs: 1,
        jitter: 0,
      });

      await expect(retry.generateText(validMessages)).rejects.toThrow(LLMAuthenticationError);
      expect(generateText).toHaveBeenCalledTimes(1);
    });

    it('should exhaust retries and throw last error', async () => {
      const generateText = vi.fn().mockRejectedValue(new LLMRateLimitError('mock', 'Rate limited'));

      const inner = createMockProvider({ generateText });
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 2,
        baseDelayMs: 1,
        jitter: 0,
      });

      await expect(retry.generateText(validMessages)).rejects.toThrow(LLMRateLimitError);
      // 1 initial + 2 retries = 3
      expect(generateText).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback with context', async () => {
      const onRetry = vi.fn();
      const generateText = vi
        .fn()
        .mockRejectedValueOnce(new LLMRateLimitError('mock', 'Rate limited'))
        .mockResolvedValue(successResponse);

      const inner = createMockProvider({ generateText });
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 3,
        baseDelayMs: 1,
        jitter: 0,
        onRetry,
      });

      await retry.generateText(validMessages);

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry.mock.calls[0]![0]).toMatchObject({
        attempt: 1,
        maxRetries: 3,
      });
    });
  });

  describe('generateStream', () => {
    it('should delegate to inner streaming provider on success', async () => {
      const inner = createMockStreamingProvider();
      const retry = new RetryLLMProvider(inner);

      const stream = await retry.generateStream(validMessages);
      const response = await stream.toResponse();

      expect(response.content).toBe('streamed response');
      expect(inner.generateStream).toHaveBeenCalledWith(validMessages, undefined);
    });

    it('should throw when inner provider does not support streaming', async () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner);

      await expect(retry.generateStream(validMessages)).rejects.toThrow(
        /does not support streaming/,
      );
    });

    it('should retry streaming on rate-limit error and succeed', async () => {
      const mockStream: LLMStreamResponse = {
        async *[Symbol.asyncIterator]() {
          yield { content: 'ok' };
        },
        async toResponse() {
          return successResponse;
        },
      };

      const generateStream = vi
        .fn()
        .mockRejectedValueOnce(new LLMRateLimitError('mock', 'Rate limited'))
        .mockResolvedValue(mockStream);

      const inner = createMockStreamingProvider({ generateStream });
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 3,
        baseDelayMs: 1,
        jitter: 0,
      });

      const stream = await retry.generateStream(validMessages);
      const response = await stream.toResponse();

      expect(response).toEqual(successResponse);
      expect(generateStream).toHaveBeenCalledTimes(2);
    });

    it('should retry streaming on server 503 error', async () => {
      const mockStream: LLMStreamResponse = {
        async *[Symbol.asyncIterator]() {
          yield { content: 'ok' };
        },
        async toResponse() {
          return successResponse;
        },
      };

      const generateStream = vi
        .fn()
        .mockRejectedValueOnce(new LLMProviderError('mock', 'Unavailable', 503))
        .mockResolvedValue(mockStream);

      const inner = createMockStreamingProvider({ generateStream });
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 3,
        baseDelayMs: 1,
        jitter: 0,
      });

      const stream = await retry.generateStream(validMessages);
      const response = await stream.toResponse();

      expect(response).toEqual(successResponse);
      expect(generateStream).toHaveBeenCalledTimes(2);
    });

    it('should not retry streaming on auth error', async () => {
      const generateStream = vi
        .fn()
        .mockRejectedValue(new LLMAuthenticationError('mock', 'Bad key'));

      const inner = createMockStreamingProvider({ generateStream });
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 3,
        baseDelayMs: 1,
        jitter: 0,
      });

      await expect(retry.generateStream(validMessages)).rejects.toThrow(LLMAuthenticationError);
      expect(generateStream).toHaveBeenCalledTimes(1);
    });
  });

  describe('retryConfig', () => {
    it('should expose readonly retry config', () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 5,
        baseDelayMs: 500,
      });

      const config = retry.retryConfig;

      expect(config.maxRetries).toBe(5);
      expect(config.baseDelayMs).toBe(500);
    });
  });

  // -------------------------------------------------------------------------
  // Retry statistics
  // -------------------------------------------------------------------------

  describe('stats', () => {
    it('should start with zero stats', () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner);

      expect(retry.stats).toEqual({
        totalRequests: 0,
        immediateSuccesses: 0,
        retriedSuccesses: 0,
        exhaustedFailures: 0,
        totalRetryAttempts: 0,
        circuitBreakerRejections: 0,
      });
    });

    it('should track immediate successes', async () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner);

      await retry.generateText(validMessages);
      await retry.generateText(validMessages);

      expect(retry.stats.totalRequests).toBe(2);
      expect(retry.stats.immediateSuccesses).toBe(2);
      expect(retry.stats.totalRetryAttempts).toBe(0);
    });

    it('should track retried successes', async () => {
      const generateText = vi
        .fn()
        .mockRejectedValueOnce(new LLMRateLimitError('mock', 'Rate limited'))
        .mockResolvedValue(successResponse);

      const inner = createMockProvider({ generateText });
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 3,
        baseDelayMs: 1,
        jitter: 0,
      });

      await retry.generateText(validMessages);

      expect(retry.stats.totalRequests).toBe(1);
      expect(retry.stats.immediateSuccesses).toBe(0);
      expect(retry.stats.retriedSuccesses).toBe(1);
      expect(retry.stats.totalRetryAttempts).toBe(1);
    });

    it('should track exhausted failures', async () => {
      const generateText = vi.fn().mockRejectedValue(new LLMRateLimitError('mock', 'Rate limited'));

      const inner = createMockProvider({ generateText });
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 2,
        baseDelayMs: 1,
        jitter: 0,
      });

      await retry.generateText(validMessages).catch(() => {});

      expect(retry.stats.totalRequests).toBe(1);
      expect(retry.stats.exhaustedFailures).toBe(1);
      expect(retry.stats.totalRetryAttempts).toBe(2);
    });

    it('should track non-retryable failures without retry attempts', async () => {
      const generateText = vi.fn().mockRejectedValue(new LLMAuthenticationError('mock', 'Bad key'));

      const inner = createMockProvider({ generateText });
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 3,
        baseDelayMs: 1,
        jitter: 0,
      });

      await retry.generateText(validMessages).catch(() => {});

      expect(retry.stats.totalRequests).toBe(1);
      expect(retry.stats.exhaustedFailures).toBe(1);
      expect(retry.stats.totalRetryAttempts).toBe(0);
    });

    it('should accumulate stats across multiple calls', async () => {
      let callCount = 0;
      const generateText = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(successResponse);
        if (callCount === 2) return Promise.reject(new LLMRateLimitError('mock', 'Rate limited'));
        return Promise.resolve(successResponse);
      });

      const inner = createMockProvider({ generateText });
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 3,
        baseDelayMs: 1,
        jitter: 0,
      });

      await retry.generateText(validMessages); // immediate success
      await retry.generateText(validMessages); // retry then success

      expect(retry.stats.totalRequests).toBe(2);
      expect(retry.stats.immediateSuccesses).toBe(1);
      expect(retry.stats.retriedSuccesses).toBe(1);
      expect(retry.stats.totalRetryAttempts).toBe(1);
    });

    it('should return a snapshot (not a reference)', async () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner);

      const snap1 = retry.stats;
      await retry.generateText(validMessages);
      const snap2 = retry.stats;

      expect(snap1.totalRequests).toBe(0);
      expect(snap2.totalRequests).toBe(1);
    });

    it('should reset stats', async () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner);

      await retry.generateText(validMessages);
      expect(retry.stats.totalRequests).toBe(1);

      retry.resetStats();
      expect(retry.stats).toEqual({
        totalRequests: 0,
        immediateSuccesses: 0,
        retriedSuccesses: 0,
        exhaustedFailures: 0,
        totalRetryAttempts: 0,
        circuitBreakerRejections: 0,
      });
    });
  });

  // -------------------------------------------------------------------------
  // Circuit breaker integration
  // -------------------------------------------------------------------------

  describe('circuit breaker integration', () => {
    it('should not create circuit breaker by default', () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner);

      expect(retry.circuitBreaker).toBeUndefined();
    });

    it('should create circuit breaker when configured', () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner, {
        circuitBreaker: { failureThreshold: 3, cooldownMs: 5_000 },
      });

      expect(retry.circuitBreaker).toBeDefined();
      expect(retry.circuitBreaker!.state).toBe(CircuitState.CLOSED);
    });

    it('should reject requests when circuit is open', async () => {
      const generateText = vi.fn().mockRejectedValue(new LLMRateLimitError('mock', 'Rate limited'));

      const inner = createMockProvider({ generateText });
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 0,
        circuitBreaker: { failureThreshold: 2 },
      });

      // Trigger 2 failures to open the circuit
      await retry.generateText(validMessages).catch(() => {});
      await retry.generateText(validMessages).catch(() => {});

      expect(retry.circuitBreaker!.state).toBe(CircuitState.OPEN);

      // Next request should be rejected by circuit breaker
      await expect(retry.generateText(validMessages)).rejects.toThrow(/Circuit breaker is open/);

      expect(retry.stats.circuitBreakerRejections).toBe(1);
    });

    it('should record success in circuit breaker', async () => {
      const inner = createMockProvider();
      const retry = new RetryLLMProvider(inner, {
        circuitBreaker: { failureThreshold: 5 },
      });

      await retry.generateText(validMessages);

      expect(retry.circuitBreaker!.snapshot().totalSuccesses).toBe(1);
    });

    it('should record failure in circuit breaker only for retryable errors', async () => {
      const generateText = vi.fn().mockRejectedValue(new LLMAuthenticationError('mock', 'Bad key'));

      const inner = createMockProvider({ generateText });
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 0,
        circuitBreaker: { failureThreshold: 1 },
      });

      await retry.generateText(validMessages).catch(() => {});

      // Auth errors should NOT open the circuit
      expect(retry.circuitBreaker!.state).toBe(CircuitState.CLOSED);
      expect(retry.circuitBreaker!.snapshot().totalFailures).toBe(0);
    });

    it('should track circuit breaker rejections in stats', async () => {
      const generateText = vi.fn().mockRejectedValue(new LLMRateLimitError('mock', 'Rate limited'));

      const inner = createMockProvider({ generateText });
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 0,
        circuitBreaker: { failureThreshold: 1 },
      });

      await retry.generateText(validMessages).catch(() => {}); // opens circuit
      await retry.generateText(validMessages).catch(() => {}); // rejected by breaker
      await retry.generateText(validMessages).catch(() => {}); // rejected by breaker

      expect(retry.stats.circuitBreakerRejections).toBe(2);
      expect(retry.stats.totalRequests).toBe(3);
    });

    it('should reject stream requests when circuit is open', async () => {
      const generateStream = vi
        .fn()
        .mockRejectedValue(new LLMRateLimitError('mock', 'Rate limited'));

      const inner = createMockStreamingProvider({ generateStream });
      const retry = new RetryLLMProvider(inner, {
        maxRetries: 0,
        circuitBreaker: { failureThreshold: 1 },
      });

      await retry.generateStream(validMessages).catch(() => {}); // opens circuit

      await expect(retry.generateStream(validMessages)).rejects.toThrow(/Circuit breaker is open/);
    });
  });
});

// ---------------------------------------------------------------------------
// createRetryProvider factory
// ---------------------------------------------------------------------------

describe('createRetryProvider', () => {
  it('should create a RetryLLMProvider', () => {
    const inner = createMockProvider();
    const retry = createRetryProvider(inner);

    expect(retry).toBeInstanceOf(RetryLLMProvider);
    expect(retry.name).toBe('mock');
  });

  it('should pass options through', () => {
    const inner = createMockProvider();
    const retry = createRetryProvider(inner, {
      maxRetries: 7,
      baseDelayMs: 200,
      circuitBreaker: { failureThreshold: 10 },
    });

    expect(retry.retryConfig.maxRetries).toBe(7);
    expect(retry.retryConfig.baseDelayMs).toBe(200);
    expect(retry.circuitBreaker).toBeDefined();
  });

  it('should work with default options', async () => {
    const inner = createMockProvider();
    const retry = createRetryProvider(inner);

    const result = await retry.generateText(validMessages);

    expect(result).toEqual(successResponse);
  });
});
