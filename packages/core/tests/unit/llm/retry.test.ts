import { describe, expect, it, vi } from 'vitest';

import {
  LLMAuthenticationError,
  LLMContextLengthError,
  LLMProviderError,
  LLMRateLimitError,
} from '../../../src/errors/llm-errors.js';
import {
  buildRetryConfig,
  calculateDelay,
  isRetryableError,
  withRetry,
} from '../../../src/llm/retry.js';
import type { RetryConfig, RetryContext } from '../../../src/llm/retry.js';

// ---------------------------------------------------------------------------
// Helper: no-op sleep (instant, no timers)
// ---------------------------------------------------------------------------

const instantSleep = async (_ms: number, _signal?: AbortSignal): Promise<void> => {};

// ---------------------------------------------------------------------------
// Helper: fixed random for deterministic tests
// ---------------------------------------------------------------------------

const fixedRandom = (value: number) => () => value;

// ---------------------------------------------------------------------------
// buildRetryConfig
// ---------------------------------------------------------------------------

describe('buildRetryConfig', () => {
  it('should use maxRetries from first argument when no overrides', () => {
    const config = buildRetryConfig(5);

    expect(config.maxRetries).toBe(5);
    expect(config.baseDelayMs).toBe(1_000);
    expect(config.maxDelayMs).toBe(60_000);
    expect(config.backoffMultiplier).toBe(2);
    expect(config.jitter).toBe(1);
  });

  it('should allow partial overrides', () => {
    const config = buildRetryConfig(3, { baseDelayMs: 500, jitter: 0 });

    expect(config.maxRetries).toBe(3);
    expect(config.baseDelayMs).toBe(500);
    expect(config.maxDelayMs).toBe(60_000);
    expect(config.backoffMultiplier).toBe(2);
    expect(config.jitter).toBe(0);
  });

  it('should override maxRetries from overrides', () => {
    const config = buildRetryConfig(3, { maxRetries: 10 });

    expect(config.maxRetries).toBe(10);
  });

  it('should accept zero jitter', () => {
    const config = buildRetryConfig(3, { jitter: 0 });

    expect(config.jitter).toBe(0);
  });

  it('should accept zero maxRetries (no retries)', () => {
    const config = buildRetryConfig(0);

    expect(config.maxRetries).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// isRetryableError
// ---------------------------------------------------------------------------

describe('isRetryableError', () => {
  it('should return true for LLMRateLimitError', () => {
    const error = new LLMRateLimitError('openai', 'Rate limited', 5000);
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return true for LLMRateLimitError without retryAfterMs', () => {
    const error = new LLMRateLimitError('openai', 'Rate limited');
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return true for server error 500', () => {
    const error = new LLMProviderError('openai', 'Internal error', 500);
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return true for server error 502', () => {
    const error = new LLMProviderError('openai', 'Bad gateway', 502);
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return true for server error 503', () => {
    const error = new LLMProviderError('openai', 'Service unavailable', 503);
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return false for LLMAuthenticationError', () => {
    const error = new LLMAuthenticationError('openai', 'Invalid key');
    expect(isRetryableError(error)).toBe(false);
  });

  it('should return false for LLMContextLengthError', () => {
    const error = new LLMContextLengthError('openai', 'Too long', 10000, 8000);
    expect(isRetryableError(error)).toBe(false);
  });

  it('should return false for generic LLMProviderError with 400 status', () => {
    const error = new LLMProviderError('openai', 'Bad request', 400);
    expect(isRetryableError(error)).toBe(false);
  });

  it('should return false for generic LLMProviderError with 404 status', () => {
    const error = new LLMProviderError('openai', 'Not found', 404);
    expect(isRetryableError(error)).toBe(false);
  });

  it('should return false for generic LLMProviderError with no status code', () => {
    const error = new LLMProviderError('openai', 'Unknown error');
    expect(isRetryableError(error)).toBe(false);
  });

  it('should return false for non-LLM errors', () => {
    expect(isRetryableError(new Error('generic'))).toBe(false);
    expect(isRetryableError(new TypeError('type error'))).toBe(false);
  });

  it('should return false for non-Error values', () => {
    expect(isRetryableError('string error')).toBe(false);
    expect(isRetryableError(null)).toBe(false);
    expect(isRetryableError(undefined)).toBe(false);
    expect(isRetryableError(42)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// calculateDelay
// ---------------------------------------------------------------------------

describe('calculateDelay', () => {
  const baseConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1_000,
    maxDelayMs: 60_000,
    backoffMultiplier: 2,
    jitter: 0, // deterministic for testing
  };

  it('should return baseDelayMs for attempt 0 with no jitter', () => {
    const delay = calculateDelay(0, baseConfig);

    expect(delay).toBe(1_000);
  });

  it('should double delay for each subsequent attempt', () => {
    expect(calculateDelay(0, baseConfig)).toBe(1_000);
    expect(calculateDelay(1, baseConfig)).toBe(2_000);
    expect(calculateDelay(2, baseConfig)).toBe(4_000);
    expect(calculateDelay(3, baseConfig)).toBe(8_000);
  });

  it('should cap delay at maxDelayMs', () => {
    const config: RetryConfig = { ...baseConfig, maxDelayMs: 5_000 };

    expect(calculateDelay(0, config)).toBe(1_000);
    expect(calculateDelay(1, config)).toBe(2_000);
    expect(calculateDelay(2, config)).toBe(4_000);
    expect(calculateDelay(3, config)).toBe(5_000); // capped
    expect(calculateDelay(4, config)).toBe(5_000); // still capped
  });

  it('should apply full jitter when jitter=1 and random=0', () => {
    const config: RetryConfig = { ...baseConfig, jitter: 1 };
    const delay = calculateDelay(0, config, undefined, fixedRandom(0));

    expect(delay).toBe(0); // (1-1)*1000 + 1*1000*0 = 0
  });

  it('should apply full jitter when jitter=1 and random=1', () => {
    const config: RetryConfig = { ...baseConfig, jitter: 1 };
    const delay = calculateDelay(0, config, undefined, fixedRandom(1));

    expect(delay).toBe(1_000); // (1-1)*1000 + 1*1000*1 = 1000
  });

  it('should apply half jitter when jitter=0.5 and random=0.5', () => {
    const config: RetryConfig = { ...baseConfig, jitter: 0.5 };
    const delay = calculateDelay(0, config, undefined, fixedRandom(0.5));

    // (1-0.5)*1000 + 0.5*1000*0.5 = 500 + 250 = 750
    expect(delay).toBe(750);
  });

  it('should respect retryAfterMs from LLMRateLimitError when larger', () => {
    const error = new LLMRateLimitError('openai', 'Rate limited', 10_000);
    const delay = calculateDelay(0, baseConfig, error);

    expect(delay).toBe(10_000); // retryAfterMs > backoff delay (1000)
  });

  it('should use backoff delay when larger than retryAfterMs', () => {
    const error = new LLMRateLimitError('openai', 'Rate limited', 500);
    const delay = calculateDelay(1, baseConfig, error);

    expect(delay).toBe(2_000); // backoff (2000) > retryAfterMs (500)
  });

  it('should ignore retryAfterMs when undefined', () => {
    const error = new LLMRateLimitError('openai', 'Rate limited');
    const delay = calculateDelay(0, baseConfig, error);

    expect(delay).toBe(1_000);
  });

  it('should ignore retryAfterMs for non-rate-limit errors', () => {
    const error = new LLMProviderError('openai', 'Server error', 500);
    const delay = calculateDelay(0, baseConfig, error);

    expect(delay).toBe(1_000);
  });

  it('should handle custom backoff multiplier', () => {
    const config: RetryConfig = { ...baseConfig, backoffMultiplier: 3 };

    expect(calculateDelay(0, config)).toBe(1_000); // 1000 * 3^0
    expect(calculateDelay(1, config)).toBe(3_000); // 1000 * 3^1
    expect(calculateDelay(2, config)).toBe(9_000); // 1000 * 3^2
  });

  it('should handle custom base delay', () => {
    const config: RetryConfig = { ...baseConfig, baseDelayMs: 500 };

    expect(calculateDelay(0, config)).toBe(500);
    expect(calculateDelay(1, config)).toBe(1_000);
    expect(calculateDelay(2, config)).toBe(2_000);
  });

  it('should return rounded integer', () => {
    const config: RetryConfig = { ...baseConfig, jitter: 1 };
    const delay = calculateDelay(0, config, undefined, fixedRandom(0.33));

    expect(Number.isInteger(delay)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// withRetry
// ---------------------------------------------------------------------------

describe('withRetry', () => {
  const defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 100,
    maxDelayMs: 10_000,
    backoffMultiplier: 2,
    jitter: 0,
  };

  it('should return result on first attempt success', async () => {
    const operation = vi.fn().mockResolvedValue('success');

    const result = await withRetry(operation, defaultConfig, { sleep: instantSleep });

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on rate-limit error and succeed', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new LLMRateLimitError('openai', 'Rate limited'))
      .mockResolvedValue('success after retry');

    const result = await withRetry(operation, defaultConfig, { sleep: instantSleep });

    expect(result).toBe('success after retry');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should retry on server 500 error and succeed', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new LLMProviderError('openai', 'Server error', 500))
      .mockResolvedValue('recovered');

    const result = await withRetry(operation, defaultConfig, { sleep: instantSleep });

    expect(result).toBe('recovered');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should retry on server 502 error', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new LLMProviderError('openai', 'Bad gateway', 502))
      .mockResolvedValue('recovered');

    const result = await withRetry(operation, defaultConfig, { sleep: instantSleep });

    expect(result).toBe('recovered');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should retry on server 503 error', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new LLMProviderError('openai', 'Unavailable', 503))
      .mockResolvedValue('recovered');

    const result = await withRetry(operation, defaultConfig, { sleep: instantSleep });

    expect(result).toBe('recovered');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should throw immediately on auth error (non-retryable)', async () => {
    const operation = vi
      .fn()
      .mockRejectedValue(new LLMAuthenticationError('openai', 'Invalid key'));

    await expect(withRetry(operation, defaultConfig, { sleep: instantSleep })).rejects.toThrow(
      LLMAuthenticationError,
    );
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should throw immediately on context length error (non-retryable)', async () => {
    const operation = vi.fn().mockRejectedValue(new LLMContextLengthError('openai', 'Too long'));

    await expect(withRetry(operation, defaultConfig, { sleep: instantSleep })).rejects.toThrow(
      LLMContextLengthError,
    );
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should throw immediately on 400 client error (non-retryable)', async () => {
    const operation = vi.fn().mockRejectedValue(new LLMProviderError('openai', 'Bad request', 400));

    await expect(withRetry(operation, defaultConfig, { sleep: instantSleep })).rejects.toThrow(
      LLMProviderError,
    );
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should throw immediately on non-LLM error (non-retryable)', async () => {
    const operation = vi.fn().mockRejectedValue(new TypeError('programming bug'));

    await expect(withRetry(operation, defaultConfig, { sleep: instantSleep })).rejects.toThrow(
      TypeError,
    );
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should exhaust all retries and throw the last error', async () => {
    const errors = [
      new LLMRateLimitError('openai', 'Rate limited 1'),
      new LLMRateLimitError('openai', 'Rate limited 2'),
      new LLMRateLimitError('openai', 'Rate limited 3'),
      new LLMRateLimitError('openai', 'Rate limited 4 — final'),
    ];

    const operation = vi.fn();
    errors.forEach((err) => operation.mockRejectedValueOnce(err));

    await expect(withRetry(operation, defaultConfig, { sleep: instantSleep })).rejects.toThrow(
      'Rate limited 4 — final',
    );

    // 1 initial + 3 retries = 4 total attempts
    expect(operation).toHaveBeenCalledTimes(4);
  });

  it('should succeed on the last retry attempt', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new LLMRateLimitError('openai', 'Rate limited 1'))
      .mockRejectedValueOnce(new LLMRateLimitError('openai', 'Rate limited 2'))
      .mockRejectedValueOnce(new LLMRateLimitError('openai', 'Rate limited 3'))
      .mockResolvedValue('finally!');

    const result = await withRetry(operation, defaultConfig, { sleep: instantSleep });

    expect(result).toBe('finally!');
    expect(operation).toHaveBeenCalledTimes(4);
  });

  it('should call onRetry callback before each retry', async () => {
    const onRetry = vi.fn();
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new LLMRateLimitError('openai', 'Rate limited'))
      .mockRejectedValueOnce(new LLMProviderError('openai', 'Server error', 500))
      .mockResolvedValue('ok');

    await withRetry(operation, defaultConfig, { sleep: instantSleep, onRetry });

    expect(onRetry).toHaveBeenCalledTimes(2);

    const firstCall = onRetry.mock.calls[0]![0] as RetryContext;
    expect(firstCall.attempt).toBe(1);
    expect(firstCall.maxRetries).toBe(3);
    expect(firstCall.error).toBeInstanceOf(LLMRateLimitError);
    expect(firstCall.delayMs).toBeGreaterThanOrEqual(0);

    const secondCall = onRetry.mock.calls[1]![0] as RetryContext;
    expect(secondCall.attempt).toBe(2);
    expect(secondCall.error).toBeInstanceOf(LLMProviderError);
  });

  it('should not call onRetry when operation succeeds on first attempt', async () => {
    const onRetry = vi.fn();
    const operation = vi.fn().mockResolvedValue('ok');

    await withRetry(operation, defaultConfig, { sleep: instantSleep, onRetry });

    expect(onRetry).not.toHaveBeenCalled();
  });

  it('should pass increasing delays to sleep', async () => {
    const sleepFn = vi.fn().mockResolvedValue(undefined);
    const config: RetryConfig = { ...defaultConfig, jitter: 0 };

    const operation = vi
      .fn()
      .mockRejectedValueOnce(new LLMRateLimitError('openai', 'Rate limited'))
      .mockRejectedValueOnce(new LLMRateLimitError('openai', 'Rate limited'))
      .mockResolvedValue('ok');

    await withRetry(operation, config, { sleep: sleepFn });

    expect(sleepFn).toHaveBeenCalledTimes(2);
    // First retry: 100 * 2^0 = 100
    expect(sleepFn.mock.calls[0]![0]).toBe(100);
    // Second retry: 100 * 2^1 = 200
    expect(sleepFn.mock.calls[1]![0]).toBe(200);
  });

  it('should not retry when maxRetries is 0', async () => {
    const config: RetryConfig = { ...defaultConfig, maxRetries: 0 };
    const operation = vi.fn().mockRejectedValue(new LLMRateLimitError('openai', 'Rate limited'));

    await expect(withRetry(operation, config, { sleep: instantSleep })).rejects.toThrow(
      LLMRateLimitError,
    );

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry with different retryable error types', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new LLMRateLimitError('openai', 'Rate limited'))
      .mockRejectedValueOnce(new LLMProviderError('openai', 'Server down', 503))
      .mockRejectedValueOnce(new LLMProviderError('openai', 'Gateway error', 502))
      .mockResolvedValue('success');

    const result = await withRetry(operation, defaultConfig, { sleep: instantSleep });

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(4);
  });

  it('should stop retrying when a non-retryable error occurs mid-retry', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new LLMRateLimitError('openai', 'Rate limited'))
      .mockRejectedValueOnce(new LLMAuthenticationError('openai', 'Key revoked'));

    await expect(withRetry(operation, defaultConfig, { sleep: instantSleep })).rejects.toThrow(
      LLMAuthenticationError,
    );

    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should use injectable random for delay calculation', async () => {
    const sleepFn = vi.fn().mockResolvedValue(undefined);
    const config: RetryConfig = { ...defaultConfig, jitter: 1 };

    const operation = vi
      .fn()
      .mockRejectedValueOnce(new LLMRateLimitError('openai', 'Rate limited'))
      .mockResolvedValue('ok');

    await withRetry(operation, config, {
      sleep: sleepFn,
      random: fixedRandom(0.5),
    });

    // With jitter=1, random=0.5: (1-1)*100 + 1*100*0.5 = 50
    expect(sleepFn.mock.calls[0]![0]).toBe(50);
  });

  it('should handle non-Error thrown values', async () => {
    const operation = vi.fn().mockRejectedValue('string error');

    await expect(withRetry(operation, defaultConfig, { sleep: instantSleep })).rejects.toThrow(
      'string error',
    );

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should pass signal to sleep function', async () => {
    const controller = new AbortController();
    const sleepFn = vi.fn().mockResolvedValue(undefined);

    const operation = vi
      .fn()
      .mockRejectedValueOnce(new LLMRateLimitError('openai', 'Rate limited'))
      .mockResolvedValue('ok');

    await withRetry(operation, defaultConfig, {
      sleep: sleepFn,
      signal: controller.signal,
    });

    expect(sleepFn.mock.calls[0]![1]).toBe(controller.signal);
  });

  it('should respect retryAfterMs from rate-limit error in delay', async () => {
    const sleepFn = vi.fn().mockResolvedValue(undefined);
    const config: RetryConfig = { ...defaultConfig, jitter: 0 };

    const operation = vi
      .fn()
      .mockRejectedValueOnce(new LLMRateLimitError('openai', 'Rate limited', 5_000))
      .mockResolvedValue('ok');

    await withRetry(operation, config, { sleep: sleepFn });

    // retryAfterMs (5000) > base delay (100), so 5000 wins
    expect(sleepFn.mock.calls[0]![0]).toBe(5_000);
  });
});

// ---------------------------------------------------------------------------
// Integration: withRetry + calculateDelay consistency
// ---------------------------------------------------------------------------

describe('withRetry + calculateDelay integration', () => {
  it('should use exponential backoff pattern across retries', async () => {
    const sleepDelays: number[] = [];
    const sleepFn = async (ms: number): Promise<void> => {
      sleepDelays.push(ms);
    };

    const config: RetryConfig = {
      maxRetries: 4,
      baseDelayMs: 100,
      maxDelayMs: 10_000,
      backoffMultiplier: 2,
      jitter: 0,
    };

    const operation = vi
      .fn()
      .mockRejectedValueOnce(new LLMRateLimitError('test', 'retry 1'))
      .mockRejectedValueOnce(new LLMProviderError('test', 'retry 2', 500))
      .mockRejectedValueOnce(new LLMProviderError('test', 'retry 3', 502))
      .mockRejectedValueOnce(new LLMProviderError('test', 'retry 4', 503))
      .mockResolvedValue('done');

    const result = await withRetry(operation, config, { sleep: sleepFn });

    expect(result).toBe('done');
    expect(sleepDelays).toEqual([100, 200, 400, 800]);
  });

  it('should cap delays at maxDelayMs across retries', async () => {
    const sleepDelays: number[] = [];
    const sleepFn = async (ms: number): Promise<void> => {
      sleepDelays.push(ms);
    };

    const config: RetryConfig = {
      maxRetries: 5,
      baseDelayMs: 1_000,
      maxDelayMs: 3_000,
      backoffMultiplier: 2,
      jitter: 0,
    };

    const operation = vi
      .fn()
      .mockRejectedValueOnce(new LLMRateLimitError('test', '1'))
      .mockRejectedValueOnce(new LLMRateLimitError('test', '2'))
      .mockRejectedValueOnce(new LLMRateLimitError('test', '3'))
      .mockRejectedValueOnce(new LLMRateLimitError('test', '4'))
      .mockResolvedValue('done');

    await withRetry(operation, config, { sleep: sleepFn });

    expect(sleepDelays).toEqual([
      1_000, // 1000 * 2^0
      2_000, // 1000 * 2^1
      3_000, // capped at 3000 (would be 4000)
      3_000, // still capped
    ]);
  });
});
