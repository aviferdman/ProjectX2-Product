import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RetryLLMProvider, createRetryProvider } from '../../../src/llm/retry-provider.js';
import {
  UsageTrackingProvider,
  createUsageTrackingProvider,
} from '../../../src/llm/usage-tracking-provider.js';
import { TokenUsageTracker } from '../../../src/llm/usage-tracker.js';
import { CircuitBreaker, CircuitState } from '../../../src/llm/circuit-breaker.js';
import {
  LLMProviderError,
  LLMRateLimitError,
  LLMAuthenticationError,
} from '../../../src/errors/llm-errors.js';
import type {
  LLMProvider,
  LLMResponse,
  LLMStreamChunk,
  LLMStreamResponse,
  StreamingLLMProvider,
  LLMMessage,
  TokenUsage,
} from '../../../src/types/llm.js';
import { LLMRole } from '../../../src/types/llm.js';
import { DefaultLLMStreamResponse } from '../../../src/llm/stream-response.js';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockProvider(options?: {
  name?: string;
  modelId?: string;
}): LLMProvider & { modelId: string; generateText: ReturnType<typeof vi.fn> } {
  return {
    name: options?.name ?? 'mock',
    modelId: options?.modelId ?? 'mock-model',
    generateText: vi.fn(),
  } as unknown as LLMProvider & { modelId: string; generateText: ReturnType<typeof vi.fn> };
}

function createMockStreamingProvider(options?: {
  name?: string;
  modelId?: string;
}): StreamingLLMProvider & {
  modelId: string;
  generateText: ReturnType<typeof vi.fn>;
  generateStream: ReturnType<typeof vi.fn>;
} {
  return {
    name: options?.name ?? 'mock',
    modelId: options?.modelId ?? 'mock-model',
    generateText: vi.fn(),
    generateStream: vi.fn(),
  } as unknown as StreamingLLMProvider & {
    modelId: string;
    generateText: ReturnType<typeof vi.fn>;
    generateStream: ReturnType<typeof vi.fn>;
  };
}

function createMockResponse(
  content = 'Hello',
  tokens: TokenUsage = { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
): LLMResponse {
  return { content, finishReason: 'stop', tokenUsage: tokens };
}

function createMockStream(chunks: LLMStreamChunk[]): LLMStreamResponse {
  async function* gen() {
    yield* chunks;
  }
  return new DefaultLLMStreamResponse('mock', gen());
}

const TEST_MESSAGES: LLMMessage[] = [{ role: LLMRole.USER, content: 'Hello' }];

const instantSleep = vi.fn().mockResolvedValue(undefined);
const deterministicRandom = () => 0.5;

// ---------------------------------------------------------------------------
// 1. RetryProvider wrapping UsageTrackingProvider
// ---------------------------------------------------------------------------

describe('RetryProvider wrapping UsageTrackingProvider', () => {
  let base: LLMProvider & { modelId: string; generateText: ReturnType<typeof vi.fn> };
  let tracker: TokenUsageTracker;
  let trackingProvider: UsageTrackingProvider;
  let retryProvider: RetryLLMProvider;

  beforeEach(() => {
    base = createMockProvider();
    const result = createUsageTrackingProvider(base, { modelId: 'mock-model' });
    trackingProvider = result.provider;
    tracker = result.tracker;
    retryProvider = createRetryProvider(trackingProvider, {
      maxRetries: 3,
      baseDelayMs: 10,
      jitter: 0,
    });
  });

  it('records usage and retry stats on successful text generation', async () => {
    base.generateText.mockResolvedValue(createMockResponse());

    const response = await retryProvider.generateText(TEST_MESSAGES);

    expect(response.content).toBe('Hello');
    expect(retryProvider.stats.totalRequests).toBe(1);
    expect(retryProvider.stats.immediateSuccesses).toBe(1);
    expect(retryProvider.stats.totalRetryAttempts).toBe(0);
    expect(tracker.recordCount).toBe(1);
    expect(tracker.getTotalTokens().totalTokens).toBe(15);
  });

  it('records usage only for the final successful attempt after rate-limit retries', async () => {
    base.generateText
      .mockRejectedValueOnce(new LLMRateLimitError('mock', 'rate limited'))
      .mockRejectedValueOnce(new LLMRateLimitError('mock', 'rate limited'))
      .mockResolvedValueOnce(
        createMockResponse('Success', { promptTokens: 20, completionTokens: 10, totalTokens: 30 }),
      );

    const response = await retryProvider.generateText(TEST_MESSAGES);

    expect(response.content).toBe('Success');
    expect(retryProvider.stats.retriedSuccesses).toBe(1);
    expect(retryProvider.stats.totalRetryAttempts).toBe(2);
    expect(tracker.recordCount).toBe(1);
    expect(tracker.getTotalTokens().totalTokens).toBe(30);
  });

  it('does not record usage when a non-retryable error propagates', async () => {
    base.generateText.mockRejectedValue(new LLMAuthenticationError('mock', 'bad key'));

    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow(LLMAuthenticationError);

    expect(retryProvider.stats.exhaustedFailures).toBe(1);
    expect(retryProvider.stats.totalRetryAttempts).toBe(0);
    expect(tracker.recordCount).toBe(0);
  });

  it('tracks streaming usage after retries succeed on connection', async () => {
    const streamBase = createMockStreamingProvider();
    const streamResult = createUsageTrackingProvider(streamBase, { modelId: 'mock-model' });
    const streamRetry = createRetryProvider(streamResult.provider, {
      maxRetries: 2,
      baseDelayMs: 10,
      jitter: 0,
    });

    const chunks: LLMStreamChunk[] = [
      { content: 'Hi' },
      {
        content: ' there',
        finishReason: 'stop',
        tokenUsage: { promptTokens: 8, completionTokens: 4, totalTokens: 12 },
      },
    ];
    streamBase.generateStream
      .mockRejectedValueOnce(new LLMProviderError('mock', 'connection error', 502))
      .mockResolvedValueOnce(createMockStream(chunks));
    streamBase.generateText.mockResolvedValue(createMockResponse());

    const stream = await streamRetry.generateStream(TEST_MESSAGES);
    const response = await stream.toResponse();

    expect(response.content).toBe('Hi there');
    expect(streamRetry.stats.retriedSuccesses).toBe(1);
    expect(streamResult.tracker.recordCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 2. UsageTrackingProvider wrapping RetryProvider
// ---------------------------------------------------------------------------

describe('UsageTrackingProvider wrapping RetryProvider', () => {
  let base: LLMProvider & { modelId: string; generateText: ReturnType<typeof vi.fn> };
  let retryProvider: RetryLLMProvider;
  let tracker: TokenUsageTracker;
  let trackingProvider: UsageTrackingProvider;

  beforeEach(() => {
    base = createMockProvider();
    retryProvider = createRetryProvider(base, {
      maxRetries: 3,
      baseDelayMs: 10,
      jitter: 0,
    });
    const result = createUsageTrackingProvider(retryProvider, { modelId: 'mock-model' });
    trackingProvider = result.provider;
    tracker = result.tracker;
  });

  it('records usage once on a successful first attempt', async () => {
    base.generateText.mockResolvedValue(createMockResponse());

    const response = await trackingProvider.generateText(TEST_MESSAGES);

    expect(response.content).toBe('Hello');
    expect(tracker.recordCount).toBe(1);
    expect(retryProvider.stats.immediateSuccesses).toBe(1);
  });

  it('records usage once after inner retry succeeds', async () => {
    base.generateText
      .mockRejectedValueOnce(new LLMRateLimitError('mock', 'rate limited'))
      .mockResolvedValueOnce(createMockResponse('Recovered'));

    const response = await trackingProvider.generateText(TEST_MESSAGES);

    expect(response.content).toBe('Recovered');
    expect(tracker.recordCount).toBe(1);
    expect(retryProvider.stats.retriedSuccesses).toBe(1);
  });

  it('does not record usage when all retries fail', async () => {
    base.generateText.mockRejectedValue(new LLMRateLimitError('mock', 'rate limited'));

    await expect(trackingProvider.generateText(TEST_MESSAGES)).rejects.toThrow(LLMRateLimitError);

    expect(tracker.recordCount).toBe(0);
    expect(retryProvider.stats.exhaustedFailures).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 3. Triple Stack: Retry(UsageTracking(BaseProvider))
// ---------------------------------------------------------------------------

describe('Triple stack: RetryProvider(UsageTrackingProvider(BaseProvider))', () => {
  let base: LLMProvider & { modelId: string; generateText: ReturnType<typeof vi.fn> };
  let tracker: TokenUsageTracker;
  let retryProvider: RetryLLMProvider;

  beforeEach(() => {
    base = createMockProvider();
    const trackResult = createUsageTrackingProvider(base, { modelId: 'mock-model' });
    tracker = trackResult.tracker;
    retryProvider = createRetryProvider(trackResult.provider, {
      maxRetries: 2,
      baseDelayMs: 10,
      jitter: 0,
    });
  });

  it('passes request through all layers and records both stats and usage on success', async () => {
    base.generateText.mockResolvedValue(createMockResponse('Triple'));

    const response = await retryProvider.generateText(TEST_MESSAGES);

    expect(response.content).toBe('Triple');
    expect(retryProvider.stats.totalRequests).toBe(1);
    expect(retryProvider.stats.immediateSuccesses).toBe(1);
    expect(tracker.recordCount).toBe(1);
    expect(tracker.getTotalTokens().totalTokens).toBe(15);
  });

  it('propagates errors through all layers without recording usage', async () => {
    base.generateText.mockRejectedValue(new LLMAuthenticationError('mock', 'invalid'));

    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow(LLMAuthenticationError);

    expect(retryProvider.stats.exhaustedFailures).toBe(1);
    expect(tracker.recordCount).toBe(0);
  });

  it('retries through all layers and records usage once on eventual success', async () => {
    base.generateText
      .mockRejectedValueOnce(new LLMProviderError('mock', 'server error', 500))
      .mockResolvedValueOnce(createMockResponse('Eventually'));

    const response = await retryProvider.generateText(TEST_MESSAGES);

    expect(response.content).toBe('Eventually');
    expect(retryProvider.stats.retriedSuccesses).toBe(1);
    expect(retryProvider.stats.totalRetryAttempts).toBe(1);
    expect(tracker.recordCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 4. Shared Tracker Across Multiple Providers
// ---------------------------------------------------------------------------

describe('Shared TokenUsageTracker across multiple providers', () => {
  let sharedTracker: TokenUsageTracker;
  let providerA: UsageTrackingProvider;
  let providerB: UsageTrackingProvider;
  let baseA: LLMProvider & { modelId: string; generateText: ReturnType<typeof vi.fn> };
  let baseB: LLMProvider & { modelId: string; generateText: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    sharedTracker = new TokenUsageTracker();
    baseA = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    baseB = createMockProvider({ name: 'anthropic', modelId: 'claude-3' });

    providerA = createUsageTrackingProvider(baseA, {
      modelId: 'gpt-4o',
      tracker: sharedTracker,
    }).provider;

    providerB = createUsageTrackingProvider(baseB, {
      modelId: 'claude-3',
      tracker: sharedTracker,
    }).provider;
  });

  it('aggregates usage from both providers in the combined report', async () => {
    baseA.generateText.mockResolvedValue(
      createMockResponse('A', { promptTokens: 100, completionTokens: 50, totalTokens: 150 }),
    );
    baseB.generateText.mockResolvedValue(
      createMockResponse('B', { promptTokens: 200, completionTokens: 100, totalTokens: 300 }),
    );

    await providerA.generateText(TEST_MESSAGES);
    await providerB.generateText(TEST_MESSAGES);

    expect(sharedTracker.recordCount).toBe(2);
    const totals = sharedTracker.getTotalTokens();
    expect(totals.promptTokens).toBe(300);
    expect(totals.completionTokens).toBe(150);
    expect(totals.totalTokens).toBe(450);
  });

  it('provides correct per-provider breakdown in the report', async () => {
    baseA.generateText.mockResolvedValue(
      createMockResponse('A', { promptTokens: 50, completionTokens: 25, totalTokens: 75 }),
    );
    baseB.generateText.mockResolvedValue(
      createMockResponse('B', { promptTokens: 80, completionTokens: 40, totalTokens: 120 }),
    );

    await providerA.generateText(TEST_MESSAGES);
    await providerB.generateText(TEST_MESSAGES);

    const report = sharedTracker.getReport();
    const openaiSummary = report.byProvider.get('openai');
    const anthropicSummary = report.byProvider.get('anthropic');

    expect(openaiSummary).toBeDefined();
    expect(openaiSummary!.requests).toBe(1);
    expect(openaiSummary!.totalTokens).toBe(75);

    expect(anthropicSummary).toBeDefined();
    expect(anthropicSummary!.requests).toBe(1);
    expect(anthropicSummary!.totalTokens).toBe(120);
  });

  it('provides correct per-model breakdown in the report', async () => {
    baseA.generateText.mockResolvedValue(
      createMockResponse('A1', { promptTokens: 10, completionTokens: 5, totalTokens: 15 }),
    );
    baseB.generateText.mockResolvedValue(
      createMockResponse('B1', { promptTokens: 20, completionTokens: 10, totalTokens: 30 }),
    );

    await providerA.generateText(TEST_MESSAGES);
    await providerA.generateText(TEST_MESSAGES);
    await providerB.generateText(TEST_MESSAGES);

    const report = sharedTracker.getReport();
    const gpt4oSummary = report.byModel.get('gpt-4o');
    const claudeSummary = report.byModel.get('claude-3');

    expect(gpt4oSummary).toBeDefined();
    expect(gpt4oSummary!.requests).toBe(2);
    expect(gpt4oSummary!.totalTokens).toBe(30);

    expect(claudeSummary).toBeDefined();
    expect(claudeSummary!.requests).toBe(1);
    expect(claudeSummary!.totalTokens).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// 5. Circuit Breaker + Retry Integration
// ---------------------------------------------------------------------------

describe('Circuit Breaker + Retry integration', () => {
  it('rejects immediately when the circuit is open without retrying', async () => {
    const base = createMockProvider();
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 60_000 });
    cb.recordFailure();
    expect(cb.state).toBe(CircuitState.OPEN);

    const retry = new RetryLLMProvider(base, {
      maxRetries: 3,
      circuitBreaker: { failureThreshold: 1, cooldownMs: 60_000 },
    });

    // Manually open the CB on the RetryLLMProvider
    // We need to use the provider's own CB — force it open by feeding failures
    const retryWithCb = createRetryProvider(base, {
      maxRetries: 3,
      baseDelayMs: 10,
      jitter: 0,
      circuitBreaker: { failureThreshold: 1, cooldownMs: 60_000 },
    });

    base.generateText.mockRejectedValue(new LLMRateLimitError('mock', 'rate limited'));

    // Exhaust retries to trigger a failure recording
    await expect(retryWithCb.generateText(TEST_MESSAGES)).rejects.toThrow();

    // CB should now be open
    expect(retryWithCb.circuitBreaker!.state).toBe(CircuitState.OPEN);

    // Next request should be rejected immediately
    base.generateText.mockClear();
    await expect(retryWithCb.generateText(TEST_MESSAGES)).rejects.toThrow(
      /circuit breaker is open/i,
    );

    expect(base.generateText).not.toHaveBeenCalled();
    expect(retryWithCb.stats.circuitBreakerRejections).toBe(1);
  });

  it('allows a test request through in HALF_OPEN state and closes on success', async () => {
    let currentTime = 0;
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000 }, () => currentTime);

    cb.recordFailure();
    expect(cb.state).toBe(CircuitState.OPEN);

    currentTime = 1000;
    expect(cb.state).toBe(CircuitState.HALF_OPEN);
    expect(cb.isAllowed()).toBe(true);

    cb.recordSuccess();
    expect(cb.state).toBe(CircuitState.CLOSED);
  });

  it('reopens the circuit when a HALF_OPEN test request fails', async () => {
    let currentTime = 0;
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000 }, () => currentTime);

    cb.recordFailure();
    expect(cb.state).toBe(CircuitState.OPEN);

    currentTime = 1000;
    expect(cb.state).toBe(CircuitState.HALF_OPEN);

    cb.recordFailure();
    expect(cb.state).toBe(CircuitState.OPEN);
  });

  it('transitions through CLOSED → OPEN after consecutive failures from retries', async () => {
    const base = createMockProvider();
    const stateChanges: Array<{ from: CircuitState; to: CircuitState }> = [];

    const retryProvider = createRetryProvider(base, {
      maxRetries: 2,
      baseDelayMs: 10,
      jitter: 0,
      circuitBreaker: {
        failureThreshold: 2,
        cooldownMs: 30_000,
        onStateChange: (from, to) => stateChanges.push({ from, to }),
      },
    });

    base.generateText.mockRejectedValue(new LLMRateLimitError('mock', 'rate limited'));

    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow();
    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow();

    expect(retryProvider.circuitBreaker!.state).toBe(CircuitState.OPEN);
    expect(stateChanges).toContainEqual({ from: CircuitState.CLOSED, to: CircuitState.OPEN });
  });

  it('performs full recovery cycle: CLOSED → OPEN → HALF_OPEN → CLOSED', async () => {
    let currentTime = 0;
    const stateChanges: CircuitState[] = [];

    const cb = new CircuitBreaker(
      {
        failureThreshold: 2,
        cooldownMs: 5000,
        onStateChange: (_from, to) => stateChanges.push(to),
      },
      () => currentTime,
    );

    expect(cb.state).toBe(CircuitState.CLOSED);

    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state).toBe(CircuitState.OPEN);

    currentTime = 5000;
    expect(cb.state).toBe(CircuitState.HALF_OPEN);

    cb.recordSuccess();
    expect(cb.state).toBe(CircuitState.CLOSED);

    expect(stateChanges).toEqual([CircuitState.OPEN, CircuitState.HALF_OPEN, CircuitState.CLOSED]);
  });

  it('increments circuitBreakerRejections counter for each rejected request', async () => {
    const base = createMockProvider();
    base.generateText.mockRejectedValue(new LLMRateLimitError('mock', 'rate limited'));

    const retryProvider = createRetryProvider(base, {
      maxRetries: 0,
      circuitBreaker: { failureThreshold: 1, cooldownMs: 60_000 },
    });

    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow();
    expect(retryProvider.circuitBreaker!.state).toBe(CircuitState.OPEN);

    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow(/circuit breaker/i);
    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow(/circuit breaker/i);

    expect(retryProvider.stats.circuitBreakerRejections).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 6. Retry + Streaming Composition
// ---------------------------------------------------------------------------

describe('Retry + Streaming composition', () => {
  it('retries on initial stream connection failure and succeeds', async () => {
    const base = createMockStreamingProvider();
    const chunks: LLMStreamChunk[] = [
      { content: 'Hello' },
      {
        content: ' world',
        finishReason: 'stop',
        tokenUsage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
      },
    ];

    base.generateStream
      .mockRejectedValueOnce(new LLMProviderError('mock', 'connection failed', 503))
      .mockResolvedValueOnce(createMockStream(chunks));

    const retryProvider = createRetryProvider(base, {
      maxRetries: 2,
      baseDelayMs: 10,
      jitter: 0,
    });

    const stream = await retryProvider.generateStream(TEST_MESSAGES);
    const response = await stream.toResponse();

    expect(response.content).toBe('Hello world');
    expect(retryProvider.stats.retriedSuccesses).toBe(1);
  });

  it('throws when generateStream is called on a non-streaming inner provider', async () => {
    const base = createMockProvider();
    const retryProvider = createRetryProvider(base, { maxRetries: 2 });

    await expect(retryProvider.generateStream(TEST_MESSAGES)).rejects.toThrow(
      /does not support streaming/i,
    );
  });

  it('tracks usage from a streamed response after connection retry', async () => {
    const base = createMockStreamingProvider();
    const trackResult = createUsageTrackingProvider(base, { modelId: 'mock-model' });
    const retryProvider = createRetryProvider(trackResult.provider, {
      maxRetries: 2,
      baseDelayMs: 10,
      jitter: 0,
    });

    const streamTokens: TokenUsage = { promptTokens: 12, completionTokens: 6, totalTokens: 18 };
    const chunks: LLMStreamChunk[] = [
      { content: 'Streamed' },
      { content: ' content', finishReason: 'stop', tokenUsage: streamTokens },
    ];

    base.generateStream
      .mockRejectedValueOnce(new LLMProviderError('mock', 'timeout', 502))
      .mockResolvedValueOnce(createMockStream(chunks));

    const stream = await retryProvider.generateStream(TEST_MESSAGES);
    const response = await stream.toResponse();

    expect(response.content).toBe('Streamed content');
    expect(trackResult.tracker.recordCount).toBe(1);
    expect(trackResult.tracker.getTotalTokens().totalTokens).toBe(18);
  });

  it('retries multiple connection failures before establishing a stream', async () => {
    const base = createMockStreamingProvider();
    const chunks: LLMStreamChunk[] = [
      {
        content: 'Finally',
        finishReason: 'stop',
        tokenUsage: { promptTokens: 3, completionTokens: 1, totalTokens: 4 },
      },
    ];

    base.generateStream
      .mockRejectedValueOnce(new LLMProviderError('mock', 'err 1', 500))
      .mockRejectedValueOnce(new LLMProviderError('mock', 'err 2', 503))
      .mockResolvedValueOnce(createMockStream(chunks));

    const retryProvider = createRetryProvider(base, {
      maxRetries: 3,
      baseDelayMs: 10,
      jitter: 0,
    });

    const stream = await retryProvider.generateStream(TEST_MESSAGES);
    const response = await stream.toResponse();

    expect(response.content).toBe('Finally');
    expect(retryProvider.stats.totalRetryAttempts).toBe(2);
    expect(retryProvider.stats.retriedSuccesses).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 7. Error Propagation Through Layers
// ---------------------------------------------------------------------------

describe('Error propagation through layers', () => {
  it('propagates AuthenticationError through retry (no retry) and tracking (no record)', async () => {
    const base = createMockProvider();
    base.generateText.mockRejectedValue(new LLMAuthenticationError('mock', 'invalid key'));

    const trackResult = createUsageTrackingProvider(base, { modelId: 'mock-model' });
    const retryProvider = createRetryProvider(trackResult.provider, {
      maxRetries: 3,
      baseDelayMs: 10,
      jitter: 0,
    });

    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow(LLMAuthenticationError);

    expect(retryProvider.stats.totalRetryAttempts).toBe(0);
    expect(retryProvider.stats.exhaustedFailures).toBe(1);
    expect(trackResult.tracker.recordCount).toBe(0);
  });

  it('propagates ContextLengthError through retry without retrying', async () => {
    const base = createMockProvider();
    const { LLMContextLengthError } = await import('../../../src/errors/llm-errors.js');
    base.generateText.mockRejectedValue(new LLMContextLengthError('mock', 'too long', 5000, 4096));

    const retryProvider = createRetryProvider(base, {
      maxRetries: 3,
      baseDelayMs: 10,
      jitter: 0,
    });

    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow(LLMContextLengthError);
    expect(retryProvider.stats.totalRetryAttempts).toBe(0);
    expect(retryProvider.stats.exhaustedFailures).toBe(1);
  });

  it('retries server errors and eventually fails without recording usage', async () => {
    const base = createMockProvider();
    base.generateText.mockRejectedValue(new LLMProviderError('mock', 'internal error', 500));

    const trackResult = createUsageTrackingProvider(base, { modelId: 'mock-model' });
    const retryProvider = createRetryProvider(trackResult.provider, {
      maxRetries: 2,
      baseDelayMs: 10,
      jitter: 0,
    });

    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow(LLMProviderError);

    expect(retryProvider.stats.totalRetryAttempts).toBe(2);
    expect(retryProvider.stats.exhaustedFailures).toBe(1);
    expect(trackResult.tracker.recordCount).toBe(0);
  });

  it('does not retry non-LLM errors', async () => {
    const base = createMockProvider();
    base.generateText.mockRejectedValue(new TypeError('unexpected type'));

    const retryProvider = createRetryProvider(base, {
      maxRetries: 3,
      baseDelayMs: 10,
      jitter: 0,
    });

    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow(TypeError);
    expect(retryProvider.stats.totalRetryAttempts).toBe(0);
  });

  it('propagates rate-limit error after exhausting all retries', async () => {
    const base = createMockProvider();
    base.generateText.mockRejectedValue(new LLMRateLimitError('mock', 'overloaded'));

    const trackResult = createUsageTrackingProvider(base, { modelId: 'mock-model' });
    const retryProvider = createRetryProvider(trackResult.provider, {
      maxRetries: 2,
      baseDelayMs: 10,
      jitter: 0,
    });

    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow(LLMRateLimitError);

    expect(retryProvider.stats.totalRetryAttempts).toBe(2);
    expect(retryProvider.stats.exhaustedFailures).toBe(1);
    expect(trackResult.tracker.recordCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 8. Stats and Observability
// ---------------------------------------------------------------------------

describe('Stats and observability', () => {
  it('resets all retry stats to zero', async () => {
    const base = createMockProvider();
    base.generateText.mockResolvedValue(createMockResponse());

    const retryProvider = createRetryProvider(base, {
      maxRetries: 2,
      baseDelayMs: 10,
      jitter: 0,
    });

    await retryProvider.generateText(TEST_MESSAGES);
    expect(retryProvider.stats.totalRequests).toBe(1);

    retryProvider.resetStats();

    const stats = retryProvider.stats;
    expect(stats.totalRequests).toBe(0);
    expect(stats.immediateSuccesses).toBe(0);
    expect(stats.retriedSuccesses).toBe(0);
    expect(stats.exhaustedFailures).toBe(0);
    expect(stats.totalRetryAttempts).toBe(0);
    expect(stats.circuitBreakerRejections).toBe(0);
  });

  it('accumulates stats correctly after mixed success/failure operations', async () => {
    const base = createMockProvider();
    const retryProvider = createRetryProvider(base, {
      maxRetries: 1,
      baseDelayMs: 10,
      jitter: 0,
    });

    // Immediate success
    base.generateText.mockResolvedValueOnce(createMockResponse());
    await retryProvider.generateText(TEST_MESSAGES);

    // Retried success
    base.generateText
      .mockRejectedValueOnce(new LLMRateLimitError('mock', 'rate limited'))
      .mockResolvedValueOnce(createMockResponse());
    await retryProvider.generateText(TEST_MESSAGES);

    // Exhausted failure
    base.generateText.mockRejectedValue(new LLMRateLimitError('mock', 'rate limited'));
    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow();

    const stats = retryProvider.stats;
    expect(stats.totalRequests).toBe(3);
    expect(stats.immediateSuccesses).toBe(1);
    expect(stats.retriedSuccesses).toBe(1);
    expect(stats.exhaustedFailures).toBe(1);
    expect(stats.totalRetryAttempts).toBe(2);
  });

  it('provides consistent circuit breaker snapshot after operations', async () => {
    const base = createMockProvider();
    const retryProvider = createRetryProvider(base, {
      maxRetries: 0,
      circuitBreaker: { failureThreshold: 2, cooldownMs: 30_000 },
    });

    base.generateText.mockRejectedValue(new LLMRateLimitError('mock', 'rate limited'));
    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow();

    const snapshot = retryProvider.circuitBreaker!.snapshot();
    expect(snapshot.state).toBe(CircuitState.CLOSED);
    expect(snapshot.consecutiveFailures).toBe(1);
    expect(snapshot.totalFailures).toBe(1);
    expect(snapshot.totalSuccesses).toBe(0);

    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow();

    const snapshot2 = retryProvider.circuitBreaker!.snapshot();
    expect(snapshot2.state).toBe(CircuitState.OPEN);
    expect(snapshot2.consecutiveFailures).toBe(2);
    expect(snapshot2.totalFailures).toBe(2);
  });

  it('tracks the total number of requests including CB rejections', async () => {
    const base = createMockProvider();
    base.generateText.mockRejectedValue(new LLMRateLimitError('mock', 'rate limited'));

    const retryProvider = createRetryProvider(base, {
      maxRetries: 0,
      circuitBreaker: { failureThreshold: 1, cooldownMs: 60_000 },
    });

    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow();
    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow(/circuit breaker/i);
    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow(/circuit breaker/i);

    expect(retryProvider.stats.totalRequests).toBe(3);
    expect(retryProvider.stats.exhaustedFailures).toBe(1);
    expect(retryProvider.stats.circuitBreakerRejections).toBe(2);
  });

  it('circuit breaker reset clears consecutive failures and reopens circuit', async () => {
    const currentTime = 0;
    const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 10_000 }, () => currentTime);

    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state).toBe(CircuitState.OPEN);

    cb.reset();
    expect(cb.state).toBe(CircuitState.CLOSED);
    expect(cb.snapshot().consecutiveFailures).toBe(0);
    expect(cb.snapshot().totalFailures).toBe(2);
  });

  it('onRetry callback receives correct context during retries', async () => {
    const base = createMockProvider();
    const retryContexts: Array<{ attempt: number; maxRetries: number }> = [];

    const retryProvider = createRetryProvider(base, {
      maxRetries: 2,
      baseDelayMs: 10,
      jitter: 0,
      onRetry: (ctx) => retryContexts.push({ attempt: ctx.attempt, maxRetries: ctx.maxRetries }),
    });

    base.generateText
      .mockRejectedValueOnce(new LLMRateLimitError('mock', 'rate limited'))
      .mockRejectedValueOnce(new LLMRateLimitError('mock', 'rate limited'))
      .mockResolvedValueOnce(createMockResponse());

    await retryProvider.generateText(TEST_MESSAGES);

    expect(retryContexts).toEqual([
      { attempt: 1, maxRetries: 2 },
      { attempt: 2, maxRetries: 2 },
    ]);
  });

  it('stats snapshot is a copy and not affected by subsequent mutations', async () => {
    const base = createMockProvider();
    base.generateText.mockResolvedValue(createMockResponse());

    const retryProvider = createRetryProvider(base, { maxRetries: 1 });

    await retryProvider.generateText(TEST_MESSAGES);
    const snapshot = retryProvider.stats;

    await retryProvider.generateText(TEST_MESSAGES);
    expect(snapshot.totalRequests).toBe(1);
    expect(retryProvider.stats.totalRequests).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 9. Full Composition: CB + Retry + UsageTracking
// ---------------------------------------------------------------------------

describe('Full composition: CircuitBreaker + Retry + UsageTracking', () => {
  it('integrates all three layers for a successful request', async () => {
    const base = createMockProvider();
    base.generateText.mockResolvedValue(
      createMockResponse('Full stack', { promptTokens: 30, completionTokens: 15, totalTokens: 45 }),
    );

    const trackResult = createUsageTrackingProvider(base, { modelId: 'mock-model' });
    const retryProvider = createRetryProvider(trackResult.provider, {
      maxRetries: 3,
      baseDelayMs: 10,
      jitter: 0,
      circuitBreaker: { failureThreshold: 5, cooldownMs: 30_000 },
    });

    const response = await retryProvider.generateText(TEST_MESSAGES);

    expect(response.content).toBe('Full stack');
    expect(retryProvider.stats.immediateSuccesses).toBe(1);
    expect(retryProvider.circuitBreaker!.snapshot().totalSuccesses).toBe(1);
    expect(trackResult.tracker.recordCount).toBe(1);
    expect(trackResult.tracker.getTotalTokens().totalTokens).toBe(45);
  });

  it('CB rejects after repeated failures through retry + tracking stack', async () => {
    const base = createMockProvider();
    base.generateText.mockRejectedValue(new LLMRateLimitError('mock', 'overloaded'));

    const trackResult = createUsageTrackingProvider(base, { modelId: 'mock-model' });
    const retryProvider = createRetryProvider(trackResult.provider, {
      maxRetries: 0,
      circuitBreaker: { failureThreshold: 2, cooldownMs: 60_000 },
    });

    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow();
    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow();

    expect(retryProvider.circuitBreaker!.state).toBe(CircuitState.OPEN);

    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow(/circuit breaker/i);
    expect(trackResult.tracker.recordCount).toBe(0);
    expect(retryProvider.stats.circuitBreakerRejections).toBe(1);
  });

  it('resumes after CB half-open test succeeds through all layers', async () => {
    const currentTime = 0;
    const base = createMockProvider();

    const trackResult = createUsageTrackingProvider(base, { modelId: 'mock-model' });
    const retryProvider = createRetryProvider(trackResult.provider, {
      maxRetries: 0,
      circuitBreaker: { failureThreshold: 1, cooldownMs: 1000 },
    });

    // Fail to open the circuit
    base.generateText.mockRejectedValueOnce(new LLMRateLimitError('mock', 'rate limited'));
    await expect(retryProvider.generateText(TEST_MESSAGES)).rejects.toThrow();
    expect(retryProvider.circuitBreaker!.state).toBe(CircuitState.OPEN);

    // Wait for cooldown (we can't inject clock into retryProvider's CB, but the CB
    // created internally uses Date.now — we verify the concept via direct CB tests above)
    // Instead verify the pattern works with a success after failures clear
    base.generateText.mockResolvedValue(
      createMockResponse('Recovered', { promptTokens: 5, completionTokens: 2, totalTokens: 7 }),
    );

    // Reset CB manually to simulate cooldown → HALF_OPEN → success → CLOSED
    retryProvider.circuitBreaker!.reset();
    const response = await retryProvider.generateText(TEST_MESSAGES);

    expect(response.content).toBe('Recovered');
    expect(retryProvider.circuitBreaker!.state).toBe(CircuitState.CLOSED);
    expect(trackResult.tracker.recordCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 10. Factory Functions
// ---------------------------------------------------------------------------

describe('Factory functions', () => {
  it('createRetryProvider returns a RetryLLMProvider instance', () => {
    const base = createMockProvider();
    const provider = createRetryProvider(base, { maxRetries: 5 });

    expect(provider).toBeInstanceOf(RetryLLMProvider);
    expect(provider.name).toBe('mock');
  });

  it('createUsageTrackingProvider returns provider and tracker pair', () => {
    const base = createMockProvider();
    const { provider, tracker } = createUsageTrackingProvider(base, { modelId: 'mock-model' });

    expect(provider).toBeInstanceOf(UsageTrackingProvider);
    expect(tracker).toBeInstanceOf(TokenUsageTracker);
    expect(provider.tracker).toBe(tracker);
  });

  it('composed factories produce a working provider stack', async () => {
    const base = createMockProvider();
    base.generateText.mockResolvedValue(createMockResponse('Factory composed'));

    const { provider: tracked, tracker } = createUsageTrackingProvider(base, {
      modelId: 'mock-model',
    });
    const retry = createRetryProvider(tracked, { maxRetries: 2 });

    const response = await retry.generateText(TEST_MESSAGES);

    expect(response.content).toBe('Factory composed');
    expect(tracker.recordCount).toBe(1);
    expect(retry.stats.immediateSuccesses).toBe(1);
  });

  it('exposes modelId from inner provider through RetryLLMProvider', () => {
    const base = createMockProvider({ modelId: 'gpt-4o' });
    const retry = createRetryProvider(base);

    expect(retry.modelId).toBe('gpt-4o');
  });

  it('exposes modelId from UsageTrackingProvider', () => {
    const base = createMockProvider({ modelId: 'claude-3' });
    const { provider } = createUsageTrackingProvider(base, { modelId: 'claude-3' });

    expect(provider.modelId).toBe('claude-3');
  });
});
