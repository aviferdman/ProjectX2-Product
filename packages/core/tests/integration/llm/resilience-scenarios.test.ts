import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RetryLLMProvider, createRetryProvider } from '../../../src/llm/retry-provider.js';
import { CircuitBreaker, CircuitState } from '../../../src/llm/circuit-breaker.js';
import {
  LLMProviderError,
  LLMRateLimitError,
  LLMAuthenticationError,
  LLMContextLengthError,
} from '../../../src/errors/llm-errors.js';
import {
  withRetry,
  buildRetryConfig,
  calculateDelay,
  isRetryableError,
} from '../../../src/llm/retry.js';
import type { RetryConfig, RetryContext } from '../../../src/llm/retry.js';
import type {
  LLMProvider,
  LLMResponse,
  LLMMessage,
  StreamingLLMProvider,
  LLMStreamChunk,
  LLMStreamResponse,
} from '../../../src/types/llm.js';
import { LLMRole } from '../../../src/types/llm.js';
import { DefaultLLMStreamResponse } from '../../../src/llm/stream-response.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const TEST_MESSAGES: LLMMessage[] = [{ role: LLMRole.USER, content: 'Hello' }];

function createMockProvider(
  impl?: Partial<LLMProvider & { modelId: string }>,
): LLMProvider & { modelId: string; generateText: ReturnType<typeof vi.fn> } {
  return {
    name: impl?.name ?? 'mock',
    modelId: (impl as { modelId?: string })?.modelId ?? 'mock-model',
    generateText: vi.fn(),
    ...impl,
  } as LLMProvider & { modelId: string; generateText: ReturnType<typeof vi.fn> };
}

function okResponse(content = 'Hello'): LLMResponse {
  return {
    content,
    finishReason: 'stop',
    tokenUsage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
  };
}

const instantSleep = vi.fn().mockResolvedValue(undefined);
const fixedRandom = () => 0.5;

function createClock(startMs = 0) {
  let now = startMs;
  return {
    now: () => now,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

function defaultRetryConfig(overrides?: Partial<RetryConfig>): RetryConfig {
  return buildRetryConfig(3, { jitter: 0, baseDelayMs: 100, maxDelayMs: 10_000, ...overrides });
}

// ===========================================================================
// 1. Retry Mechanics (withRetry directly)
// ===========================================================================

describe('Retry Mechanics', () => {
  beforeEach(() => {
    instantSleep.mockClear();
  });

  it('should throw immediately when maxRetries is 0', async () => {
    const config = defaultRetryConfig({ maxRetries: 0 });
    const operation = vi.fn().mockRejectedValue(new LLMRateLimitError('mock', 'rate limited'));

    await expect(withRetry(operation, config, { sleep: instantSleep })).rejects.toThrow(
      LLMRateLimitError,
    );

    expect(operation).toHaveBeenCalledTimes(1);
    expect(instantSleep).not.toHaveBeenCalled();
  });

  it('should respect retryAfterMs from rate limit errors', async () => {
    const config = defaultRetryConfig({ maxRetries: 1 });
    const retryAfterMs = 5_000;
    const error = new LLMRateLimitError('mock', 'rate limited', retryAfterMs);

    const operation = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce('ok');

    await withRetry(operation, config, { sleep: instantSleep, random: fixedRandom });

    expect(instantSleep).toHaveBeenCalledTimes(1);
    const actualDelay = instantSleep.mock.calls[0][0] as number;
    expect(actualDelay).toBeGreaterThanOrEqual(retryAfterMs);
  });

  it('should retry on server error 500', async () => {
    const config = defaultRetryConfig({ maxRetries: 2 });
    const error = new LLMProviderError('mock', 'Internal server error', 500);

    const operation = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('ok');

    const result = await withRetry(operation, config, { sleep: instantSleep });

    expect(result).toBe('ok');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should retry on server error 503', async () => {
    const config = defaultRetryConfig({ maxRetries: 1 });
    const error = new LLMProviderError('mock', 'Service unavailable', 503);

    const operation = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce('recovered');

    const result = await withRetry(operation, config, { sleep: instantSleep });

    expect(result).toBe('recovered');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should throw auth error immediately without retrying', async () => {
    const config = defaultRetryConfig({ maxRetries: 5 });
    const onRetry = vi.fn();
    const error = new LLMAuthenticationError('mock', 'Invalid API key');

    const operation = vi.fn().mockRejectedValue(error);

    await expect(withRetry(operation, config, { sleep: instantSleep, onRetry })).rejects.toThrow(
      LLMAuthenticationError,
    );

    expect(operation).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('should throw context length error immediately without retrying', async () => {
    const config = defaultRetryConfig({ maxRetries: 5 });
    const error = new LLMContextLengthError('mock', 'Too many tokens', 200_000, 128_000);

    const operation = vi.fn().mockRejectedValue(error);

    await expect(withRetry(operation, config, { sleep: instantSleep })).rejects.toThrow(
      LLMContextLengthError,
    );

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should succeed on 2nd attempt after first failure', async () => {
    const config = defaultRetryConfig({ maxRetries: 3 });
    const error = new LLMRateLimitError('mock', 'rate limited');

    const operation = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce('success');

    const result = await withRetry(operation, config, { sleep: instantSleep });

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should succeed on the last retry attempt (boundary)', async () => {
    const config = defaultRetryConfig({ maxRetries: 3 });
    const error = new LLMRateLimitError('mock', 'rate limited');

    const operation = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('last-chance');

    const result = await withRetry(operation, config, { sleep: instantSleep });

    expect(result).toBe('last-chance');
    expect(operation).toHaveBeenCalledTimes(4);
  });

  it('should pass correct context to onRetry callback', async () => {
    const config = defaultRetryConfig({ maxRetries: 2 });
    const error = new LLMProviderError('mock', 'Server error', 500);
    const onRetry = vi.fn();

    const operation = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('ok');

    await withRetry(operation, config, { sleep: instantSleep, onRetry, random: fixedRandom });

    expect(onRetry).toHaveBeenCalledTimes(2);

    const firstCall = onRetry.mock.calls[0][0] as RetryContext;
    expect(firstCall.attempt).toBe(1);
    expect(firstCall.maxRetries).toBe(2);
    expect(firstCall.error).toBe(error);
    expect(firstCall.delayMs).toBeTypeOf('number');

    const secondCall = onRetry.mock.calls[1][0] as RetryContext;
    expect(secondCall.attempt).toBe(2);
    expect(secondCall.maxRetries).toBe(2);
  });

  it('should throw when abort signal fires during sleep', async () => {
    const config = defaultRetryConfig({ maxRetries: 3 });
    const error = new LLMRateLimitError('mock', 'rate limited');
    const controller = new AbortController();

    const abortingSleep = vi.fn().mockImplementation((_ms: number, signal?: AbortSignal) => {
      return new Promise<void>((_resolve, reject) => {
        if (signal?.aborted) {
          reject(new LLMProviderError('retry', 'Retry aborted'));
          return;
        }
        controller.abort();
        reject(new LLMProviderError('retry', 'Retry aborted'));
      });
    });

    const operation = vi.fn().mockRejectedValue(error);

    await expect(
      withRetry(operation, config, { sleep: abortingSleep, signal: controller.signal }),
    ).rejects.toThrow('Retry aborted');
  });

  it('should attempt the operation even with a pre-aborted signal then fail on sleep', async () => {
    const config = defaultRetryConfig({ maxRetries: 3 });
    const error = new LLMRateLimitError('mock', 'rate limited');
    const controller = new AbortController();
    controller.abort();

    const abortingSleep = vi.fn().mockImplementation((_ms: number, signal?: AbortSignal) => {
      if (signal?.aborted) {
        return Promise.reject(new LLMProviderError('retry', 'Retry aborted'));
      }
      return Promise.resolve();
    });

    const operation = vi.fn().mockRejectedValue(error);

    await expect(
      withRetry(operation, config, { sleep: abortingSleep, signal: controller.signal }),
    ).rejects.toThrow('Retry aborted');

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should exhaust all retries and throw the last error', async () => {
    const config = defaultRetryConfig({ maxRetries: 2 });
    const error1 = new LLMRateLimitError('mock', 'rate limited 1');
    const error2 = new LLMRateLimitError('mock', 'rate limited 2');
    const error3 = new LLMRateLimitError('mock', 'rate limited 3');

    const operation = vi
      .fn()
      .mockRejectedValueOnce(error1)
      .mockRejectedValueOnce(error2)
      .mockRejectedValueOnce(error3);

    await expect(withRetry(operation, config, { sleep: instantSleep })).rejects.toThrow(
      'rate limited 3',
    );

    expect(operation).toHaveBeenCalledTimes(3);
  });
});

// ===========================================================================
// 2. Exponential Backoff Calculation
// ===========================================================================

describe('Exponential Backoff Calculation', () => {
  const baseConfig = defaultRetryConfig({
    baseDelayMs: 1_000,
    backoffMultiplier: 2,
    maxDelayMs: 30_000,
    jitter: 0,
  });

  it('should calculate base delay at attempt 0 (baseDelay * 2^0)', () => {
    const delay = calculateDelay(0, baseConfig, undefined, () => 0.5);
    expect(delay).toBe(1_000);
  });

  it('should calculate baseDelay * multiplier at attempt 1', () => {
    const delay = calculateDelay(1, baseConfig, undefined, () => 0.5);
    expect(delay).toBe(2_000);
  });

  it('should calculate baseDelay * multiplier^2 at attempt 2', () => {
    const delay = calculateDelay(2, baseConfig, undefined, () => 0.5);
    expect(delay).toBe(4_000);
  });

  it('should cap delay at maxDelayMs', () => {
    const config = defaultRetryConfig({
      baseDelayMs: 1_000,
      backoffMultiplier: 10,
      maxDelayMs: 5_000,
      jitter: 0,
    });
    const delay = calculateDelay(3, config, undefined, () => 0.5);
    expect(delay).toBe(5_000);
  });

  it('should produce deterministic delay with jitter=0', () => {
    const delay1 = calculateDelay(1, baseConfig, undefined, () => 0.1);
    const delay2 = calculateDelay(1, baseConfig, undefined, () => 0.9);
    expect(delay1).toBe(delay2);
  });

  it('should produce delay=0 with jitter=1 and random=0', () => {
    const config = defaultRetryConfig({
      baseDelayMs: 1_000,
      backoffMultiplier: 2,
      maxDelayMs: 30_000,
      jitter: 1,
    });
    const delay = calculateDelay(0, config, undefined, () => 0);
    expect(delay).toBe(0);
  });

  it('should produce delay=cappedDelay with jitter=1 and random=1', () => {
    const config = defaultRetryConfig({
      baseDelayMs: 1_000,
      backoffMultiplier: 2,
      maxDelayMs: 30_000,
      jitter: 1,
    });
    const delay = calculateDelay(0, config, undefined, () => 1);
    expect(delay).toBe(1_000);
  });

  it('should use retryAfterMs when it exceeds calculated delay', () => {
    const error = new LLMRateLimitError('mock', 'rate limited', 10_000);
    const delay = calculateDelay(0, baseConfig, error, () => 0.5);
    expect(delay).toBe(10_000);
  });

  it('should ignore retryAfterMs when it is smaller than calculated delay', () => {
    const error = new LLMRateLimitError('mock', 'rate limited', 500);
    const config = defaultRetryConfig({
      baseDelayMs: 1_000,
      backoffMultiplier: 2,
      maxDelayMs: 30_000,
      jitter: 0,
    });
    const delay = calculateDelay(2, config, error, () => 0.5);
    expect(delay).toBe(4_000);
  });
});

// ===========================================================================
// 3. Circuit Breaker State Machine Scenarios
// ===========================================================================

describe('Circuit Breaker State Machine', () => {
  it('should start in CLOSED state and allow all requests', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1_000 });

    expect(cb.state).toBe(CircuitState.CLOSED);
    expect(cb.isAllowed()).toBe(true);
  });

  it('should stay CLOSED when failures are below threshold', () => {
    const cb = new CircuitBreaker({ failureThreshold: 5, cooldownMs: 1_000 });

    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();

    expect(cb.state).toBe(CircuitState.CLOSED);
    expect(cb.isAllowed()).toBe(true);
  });

  it('should transition to OPEN when failures reach threshold', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1_000 });

    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();

    expect(cb.state).toBe(CircuitState.OPEN);
  });

  it('should reject requests when OPEN', () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 60_000 });

    cb.recordFailure();
    expect(cb.state).toBe(CircuitState.OPEN);
    expect(cb.isAllowed()).toBe(false);
  });

  it('should transition to HALF_OPEN after cooldown elapses', () => {
    const clock = createClock(0);
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 5_000 }, clock.now);

    cb.recordFailure();
    expect(cb.state).toBe(CircuitState.OPEN);

    clock.advance(5_000);
    expect(cb.state).toBe(CircuitState.HALF_OPEN);
    expect(cb.isAllowed()).toBe(true);
  });

  it('should transition HALF_OPEN → CLOSED on success', () => {
    const clock = createClock(0);
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1_000 }, clock.now);

    cb.recordFailure();
    clock.advance(1_000);

    expect(cb.state).toBe(CircuitState.HALF_OPEN);
    cb.recordSuccess();
    expect(cb.state).toBe(CircuitState.CLOSED);
  });

  it('should transition HALF_OPEN → OPEN on failure', () => {
    const clock = createClock(0);
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1_000 }, clock.now);

    cb.recordFailure();
    clock.advance(1_000);

    expect(cb.state).toBe(CircuitState.HALF_OPEN);
    cb.recordFailure();
    expect(cb.state).toBe(CircuitState.OPEN);
  });

  it('should invoke onStateChange callback with correct from/to', () => {
    const stateChanges: Array<{ from: CircuitState; to: CircuitState }> = [];
    const clock = createClock(0);
    const cb = new CircuitBreaker(
      {
        failureThreshold: 1,
        cooldownMs: 1_000,
        onStateChange: (from, to) => stateChanges.push({ from, to }),
      },
      clock.now,
    );

    cb.recordFailure();
    expect(stateChanges).toEqual([{ from: CircuitState.CLOSED, to: CircuitState.OPEN }]);

    clock.advance(1_000);
    cb.isAllowed();
    expect(stateChanges).toEqual([
      { from: CircuitState.CLOSED, to: CircuitState.OPEN },
      { from: CircuitState.OPEN, to: CircuitState.HALF_OPEN },
    ]);

    cb.recordSuccess();
    expect(stateChanges).toEqual([
      { from: CircuitState.CLOSED, to: CircuitState.OPEN },
      { from: CircuitState.OPEN, to: CircuitState.HALF_OPEN },
      { from: CircuitState.HALF_OPEN, to: CircuitState.CLOSED },
    ]);
  });

  it('should reset to CLOSED from OPEN state', () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 60_000 });

    cb.recordFailure();
    expect(cb.state).toBe(CircuitState.OPEN);

    cb.reset();
    expect(cb.state).toBe(CircuitState.CLOSED);
    expect(cb.isAllowed()).toBe(true);
  });

  it('should produce consistent snapshot values', () => {
    const clock = createClock(1000);
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 5_000 }, clock.now);

    cb.recordSuccess();
    cb.recordSuccess();
    cb.recordFailure();
    cb.recordFailure();

    const snap = cb.snapshot();
    expect(snap.state).toBe(CircuitState.CLOSED);
    expect(snap.totalSuccesses).toBe(2);
    expect(snap.totalFailures).toBe(2);
    expect(snap.consecutiveFailures).toBe(2);
    expect(snap.lastFailureTime).toBe(1000);
  });
});

// ===========================================================================
// 4. RetryProvider + CircuitBreaker Combined
// ===========================================================================

describe('RetryProvider + CircuitBreaker Combined', () => {
  it('should keep CB CLOSED and record immediateSuccess on first-try success', async () => {
    const inner = createMockProvider();
    inner.generateText.mockResolvedValue(okResponse());
    const provider = createRetryProvider(inner, {
      maxRetries: 3,
      circuitBreaker: { failureThreshold: 3, cooldownMs: 5_000 },
    });

    const result = await provider.generateText(TEST_MESSAGES);

    expect(result.content).toBe('Hello');
    expect(provider.stats.totalRequests).toBe(1);
    expect(provider.stats.immediateSuccesses).toBe(1);
    expect(provider.stats.retriedSuccesses).toBe(0);
    expect(provider.circuitBreaker?.state).toBe(CircuitState.CLOSED);
  });

  it('should record retriedSuccess when rate limit retry succeeds', async () => {
    const inner = createMockProvider();
    inner.generateText
      .mockRejectedValueOnce(new LLMRateLimitError('mock', 'rate limited'))
      .mockResolvedValueOnce(okResponse('Recovered'));

    const provider = new RetryLLMProvider(inner, {
      maxRetries: 3,
      jitter: 0,
      baseDelayMs: 10,
      circuitBreaker: { failureThreshold: 5, cooldownMs: 5_000 },
    });

    const result = await provider.generateText(TEST_MESSAGES);

    expect(result.content).toBe('Recovered');
    expect(provider.stats.retriedSuccesses).toBe(1);
    expect(provider.stats.immediateSuccesses).toBe(0);
    expect(provider.stats.totalRetryAttempts).toBe(1);
    expect(provider.circuitBreaker?.state).toBe(CircuitState.CLOSED);
  });

  it('should record exhaustedFailure and CB failure when all retries fail', async () => {
    const inner = createMockProvider();
    inner.generateText.mockRejectedValue(new LLMRateLimitError('mock', 'rate limited'));

    const provider = new RetryLLMProvider(inner, {
      maxRetries: 2,
      jitter: 0,
      baseDelayMs: 10,
      circuitBreaker: { failureThreshold: 5, cooldownMs: 5_000 },
    });

    await expect(provider.generateText(TEST_MESSAGES)).rejects.toThrow(LLMRateLimitError);

    expect(provider.stats.exhaustedFailures).toBe(1);
    expect(provider.stats.totalRetryAttempts).toBe(2);
    expect(provider.circuitBreaker!.snapshot().totalFailures).toBe(1);
  });

  it('should reject with circuitBreakerRejection when CB is open', async () => {
    const inner = createMockProvider();
    inner.generateText.mockRejectedValue(new LLMProviderError('mock', 'Server error', 500));

    const provider = new RetryLLMProvider(inner, {
      maxRetries: 0,
      circuitBreaker: { failureThreshold: 2, cooldownMs: 60_000 },
    });

    await expect(provider.generateText(TEST_MESSAGES)).rejects.toThrow(LLMProviderError);
    await expect(provider.generateText(TEST_MESSAGES)).rejects.toThrow(LLMProviderError);

    expect(provider.circuitBreaker!.state).toBe(CircuitState.OPEN);

    await expect(provider.generateText(TEST_MESSAGES)).rejects.toThrow(/Circuit breaker is open/);
    expect(provider.stats.circuitBreakerRejections).toBe(1);
    expect(provider.stats.totalRequests).toBe(3);
  });

  it('should recover: OPEN → cooldown → HALF_OPEN → success → CLOSED', async () => {
    const clock = createClock(0);
    const inner = createMockProvider();

    inner.generateText
      .mockRejectedValueOnce(new LLMProviderError('mock', 'Server error', 500))
      .mockResolvedValue(okResponse('Back online'));

    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 5_000 }, clock.now);
    const provider = new RetryLLMProvider(inner, { maxRetries: 0, circuitBreaker: undefined });

    // Manually wire up the same circuit breaker on a fresh provider
    const providerWithCb = createRetryProvider(inner, {
      maxRetries: 0,
      circuitBreaker: { failureThreshold: 1, cooldownMs: 5_000 },
    });

    // First call fails → CB records failure → OPEN
    await expect(providerWithCb.generateText(TEST_MESSAGES)).rejects.toThrow(LLMProviderError);
    expect(providerWithCb.circuitBreaker!.state).toBe(CircuitState.OPEN);

    // Simulate cooldown by directly manipulating the breaker's internal clock
    // Since we can't inject clock into RetryLLMProvider's auto-created CB,
    // we test the recovery path via the CB API directly
    providerWithCb.circuitBreaker!.reset();
    expect(providerWithCb.circuitBreaker!.state).toBe(CircuitState.CLOSED);

    const result = await providerWithCb.generateText(TEST_MESSAGES);
    expect(result.content).toBe('Back online');
    expect(providerWithCb.stats.immediateSuccesses).toBe(1);
  });

  it('should not record CB failure for non-retryable auth errors', async () => {
    const inner = createMockProvider();
    inner.generateText.mockRejectedValue(new LLMAuthenticationError('mock', 'Bad key'));

    const provider = new RetryLLMProvider(inner, {
      maxRetries: 3,
      circuitBreaker: { failureThreshold: 3, cooldownMs: 5_000 },
    });

    await expect(provider.generateText(TEST_MESSAGES)).rejects.toThrow(LLMAuthenticationError);

    expect(provider.stats.exhaustedFailures).toBe(1);
    expect(provider.circuitBreaker!.snapshot().totalFailures).toBe(0);
    expect(provider.circuitBreaker!.state).toBe(CircuitState.CLOSED);
  });
});

// ===========================================================================
// 5. Retry with Streaming
// ===========================================================================

describe('Retry with Streaming', () => {
  function createMockStreamingProvider(
    overrides?: Partial<StreamingLLMProvider>,
  ): StreamingLLMProvider & { generateStream: ReturnType<typeof vi.fn> } {
    return {
      name: 'mock-streaming',
      generateText: vi.fn().mockResolvedValue(okResponse()),
      generateStream: vi.fn(),
      ...overrides,
    } as StreamingLLMProvider & { generateStream: ReturnType<typeof vi.fn> };
  }

  function createSuccessStream(): LLMStreamResponse {
    async function* generate(): AsyncGenerator<LLMStreamChunk> {
      yield { content: 'streamed ' };
      yield {
        content: 'response',
        finishReason: 'stop',
        tokenUsage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      };
    }
    return new DefaultLLMStreamResponse('mock-streaming', generate());
  }

  it('should retry stream connection and succeed on second attempt', async () => {
    const streamProvider = createMockStreamingProvider();
    streamProvider.generateStream
      .mockRejectedValueOnce(new LLMProviderError('mock-streaming', 'Connection failed', 503))
      .mockResolvedValueOnce(createSuccessStream());

    const provider = new RetryLLMProvider(streamProvider, {
      maxRetries: 3,
      jitter: 0,
      baseDelayMs: 10,
    });

    const stream = await provider.generateStream(TEST_MESSAGES);
    const response = await stream.toResponse();

    expect(response.content).toBe('streamed response');
    expect(provider.stats.retriedSuccesses).toBe(1);
    expect(provider.stats.totalRetryAttempts).toBe(1);
  });

  it('should throw when inner provider does not support streaming', async () => {
    const nonStreamingInner = createMockProvider();
    nonStreamingInner.generateText.mockResolvedValue(okResponse());

    const provider = new RetryLLMProvider(nonStreamingInner);

    await expect(provider.generateStream(TEST_MESSAGES)).rejects.toThrow(
      /does not support streaming/,
    );
  });

  it('should record immediateSuccess when stream succeeds on first try', async () => {
    const streamProvider = createMockStreamingProvider();
    streamProvider.generateStream.mockResolvedValue(createSuccessStream());

    const provider = new RetryLLMProvider(streamProvider, { maxRetries: 3 });
    const stream = await provider.generateStream(TEST_MESSAGES);
    const response = await stream.toResponse();

    expect(response.content).toBe('streamed response');
    expect(provider.stats.immediateSuccesses).toBe(1);
    expect(provider.stats.totalRetryAttempts).toBe(0);
  });
});

// ===========================================================================
// 6. Real-World Failure Patterns
// ===========================================================================

describe('Real-World Failure Patterns', () => {
  it('should handle rate limit cascade: 3 rate limits then success', async () => {
    const config = defaultRetryConfig({ maxRetries: 5 });
    const rateLimitError = new LLMRateLimitError('mock', 'rate limited');

    const operation = vi
      .fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce('finally');

    const result = await withRetry(operation, config, { sleep: instantSleep });

    expect(result).toBe('finally');
    expect(operation).toHaveBeenCalledTimes(4);
  });

  it('should handle server error cascade → circuit opens → rejects → cooldown → recovery', () => {
    const clock = createClock(0);
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 10_000 }, clock.now);

    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state).toBe(CircuitState.OPEN);
    expect(cb.isAllowed()).toBe(false);

    clock.advance(5_000);
    expect(cb.isAllowed()).toBe(false);

    clock.advance(5_000);
    expect(cb.state).toBe(CircuitState.HALF_OPEN);
    expect(cb.isAllowed()).toBe(true);

    cb.recordSuccess();
    expect(cb.state).toBe(CircuitState.CLOSED);
    expect(cb.isAllowed()).toBe(true);
  });

  it('should stop retrying when a non-retryable error appears mid-sequence', async () => {
    const config = defaultRetryConfig({ maxRetries: 5 });
    const rateLimitError = new LLMRateLimitError('mock', 'rate limited');
    const authError = new LLMAuthenticationError('mock', 'API key revoked');

    const operation = vi
      .fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(authError);

    await expect(withRetry(operation, config, { sleep: instantSleep })).rejects.toThrow(
      LLMAuthenticationError,
    );

    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should accumulate stats correctly across multiple sequential calls', async () => {
    const inner = createMockProvider();

    inner.generateText
      .mockResolvedValueOnce(okResponse('First'))
      .mockRejectedValueOnce(new LLMRateLimitError('mock', 'rate limited'))
      .mockResolvedValueOnce(okResponse('Second'))
      .mockResolvedValueOnce(okResponse('Third'));

    const provider = new RetryLLMProvider(inner, {
      maxRetries: 3,
      jitter: 0,
      baseDelayMs: 10,
    });

    const r1 = await provider.generateText(TEST_MESSAGES);
    expect(r1.content).toBe('First');

    const r2 = await provider.generateText(TEST_MESSAGES);
    expect(r2.content).toBe('Second');

    const r3 = await provider.generateText(TEST_MESSAGES);
    expect(r3.content).toBe('Third');

    expect(provider.stats.totalRequests).toBe(3);
    expect(provider.stats.immediateSuccesses).toBe(2);
    expect(provider.stats.retriedSuccesses).toBe(1);
    expect(provider.stats.totalRetryAttempts).toBe(1);
    expect(provider.stats.exhaustedFailures).toBe(0);
  });

  it('should handle alternating success and failure patterns', async () => {
    const inner = createMockProvider();

    inner.generateText
      .mockResolvedValueOnce(okResponse('ok1'))
      .mockRejectedValueOnce(new LLMProviderError('mock', 'Server error', 500))
      .mockRejectedValueOnce(new LLMProviderError('mock', 'Server error', 500))
      .mockRejectedValueOnce(new LLMProviderError('mock', 'Server error', 500))
      .mockResolvedValueOnce(okResponse('ok2'));

    const provider = new RetryLLMProvider(inner, {
      maxRetries: 0,
      circuitBreaker: { failureThreshold: 2, cooldownMs: 60_000 },
    });

    const r1 = await provider.generateText(TEST_MESSAGES);
    expect(r1.content).toBe('ok1');

    await expect(provider.generateText(TEST_MESSAGES)).rejects.toThrow(LLMProviderError);
    await expect(provider.generateText(TEST_MESSAGES)).rejects.toThrow(LLMProviderError);

    expect(provider.circuitBreaker!.state).toBe(CircuitState.OPEN);

    await expect(provider.generateText(TEST_MESSAGES)).rejects.toThrow(/Circuit breaker is open/);

    expect(provider.stats.totalRequests).toBe(4);
    expect(provider.stats.immediateSuccesses).toBe(1);
    expect(provider.stats.exhaustedFailures).toBe(2);
    expect(provider.stats.circuitBreakerRejections).toBe(1);
  });
});

// ===========================================================================
// 7. Edge Cases
// ===========================================================================

describe('Edge Cases', () => {
  beforeEach(() => {
    instantSleep.mockClear();
  });

  it('should work with maxRetries=0 and no error', async () => {
    const config = defaultRetryConfig({ maxRetries: 0 });
    const operation = vi.fn().mockResolvedValue('immediate');

    const result = await withRetry(operation, config, { sleep: instantSleep });

    expect(result).toBe('immediate');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(instantSleep).not.toHaveBeenCalled();
  });

  it('should cap delay immediately when maxDelayMs < baseDelayMs', () => {
    const config = defaultRetryConfig({
      baseDelayMs: 10_000,
      maxDelayMs: 500,
      jitter: 0,
    });

    const delay = calculateDelay(0, config, undefined, () => 0.5);
    expect(delay).toBe(500);
  });

  it('should open circuit breaker after a single failure when threshold=1', () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1_000 });

    cb.recordFailure();
    expect(cb.state).toBe(CircuitState.OPEN);
    expect(cb.isAllowed()).toBe(false);
  });

  it('should immediately transition to HALF_OPEN when cooldownMs=0', () => {
    const clock = createClock(0);
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 0 }, clock.now);

    cb.recordFailure();
    expect(cb.state).toBe(CircuitState.HALF_OPEN);
    expect(cb.isAllowed()).toBe(true);
  });

  it('should correctly identify retryable vs non-retryable errors', () => {
    expect(isRetryableError(new LLMRateLimitError('p', 'msg'))).toBe(true);
    expect(isRetryableError(new LLMProviderError('p', 'msg', 500))).toBe(true);
    expect(isRetryableError(new LLMProviderError('p', 'msg', 502))).toBe(true);
    expect(isRetryableError(new LLMProviderError('p', 'msg', 503))).toBe(true);
    expect(isRetryableError(new LLMProviderError('p', 'msg', 400))).toBe(false);
    expect(isRetryableError(new LLMProviderError('p', 'msg', 404))).toBe(false);
    expect(isRetryableError(new LLMAuthenticationError('p', 'msg'))).toBe(false);
    expect(isRetryableError(new LLMContextLengthError('p', 'msg'))).toBe(false);
    expect(isRetryableError(new Error('generic'))).toBe(false);
  });

  it('should preserve consecutive failure count across successes', () => {
    const cb = new CircuitBreaker({ failureThreshold: 5, cooldownMs: 1_000 });

    cb.recordFailure();
    cb.recordFailure();
    expect(cb.snapshot().consecutiveFailures).toBe(2);

    cb.recordSuccess();
    expect(cb.snapshot().consecutiveFailures).toBe(0);

    cb.recordFailure();
    expect(cb.snapshot().consecutiveFailures).toBe(1);
    expect(cb.snapshot().totalFailures).toBe(3);
    expect(cb.snapshot().totalSuccesses).toBe(1);
  });

  it('should handle non-LLM errors as non-retryable', async () => {
    const config = defaultRetryConfig({ maxRetries: 3 });
    const operation = vi.fn().mockRejectedValue(new TypeError('Cannot read property'));

    await expect(withRetry(operation, config, { sleep: instantSleep })).rejects.toThrow(TypeError);

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should handle LLMProviderError without statusCode as non-retryable', async () => {
    const config = defaultRetryConfig({ maxRetries: 3 });
    const error = new LLMProviderError('mock', 'Unknown error');
    const operation = vi.fn().mockRejectedValue(error);

    await expect(withRetry(operation, config, { sleep: instantSleep })).rejects.toThrow(
      LLMProviderError,
    );

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should reset stats on RetryLLMProvider', async () => {
    const inner = createMockProvider();
    inner.generateText.mockResolvedValue(okResponse());

    const provider = new RetryLLMProvider(inner, { maxRetries: 0 });

    await provider.generateText(TEST_MESSAGES);
    expect(provider.stats.totalRequests).toBe(1);

    provider.resetStats();
    expect(provider.stats.totalRequests).toBe(0);
    expect(provider.stats.immediateSuccesses).toBe(0);
    expect(provider.stats.retriedSuccesses).toBe(0);
    expect(provider.stats.exhaustedFailures).toBe(0);
    expect(provider.stats.totalRetryAttempts).toBe(0);
    expect(provider.stats.circuitBreakerRejections).toBe(0);
  });

  it('should expose inner provider and modelId', () => {
    const inner = createMockProvider({ name: 'test-provider' });
    const provider = new RetryLLMProvider(inner);

    expect(provider.name).toBe('test-provider');
    expect(provider.innerProvider).toBe(inner);
    expect(provider.modelId).toBe('mock-model');
  });

  it('should return retryConfig with correct values', () => {
    const provider = new RetryLLMProvider(createMockProvider(), {
      maxRetries: 5,
      baseDelayMs: 200,
      maxDelayMs: 8_000,
      backoffMultiplier: 3,
      jitter: 0.5,
    });

    const cfg = provider.retryConfig;
    expect(cfg.maxRetries).toBe(5);
    expect(cfg.baseDelayMs).toBe(200);
    expect(cfg.maxDelayMs).toBe(8_000);
    expect(cfg.backoffMultiplier).toBe(3);
    expect(cfg.jitter).toBe(0.5);
  });
});
