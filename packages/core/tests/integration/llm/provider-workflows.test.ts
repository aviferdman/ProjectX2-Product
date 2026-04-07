/**
 * End-to-end provider workflow tests.
 *
 * Tests real provider instances (OpenAI, Anthropic) composed with
 * retry, circuit breaker, and usage tracking decorators. Verifies
 * complete request lifecycles with mocked HTTP responses.
 *
 * TASK-027: Final validation for Epic 3 LLM Provider Abstraction.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OpenAIProvider } from '../../../src/llm/providers/openai-provider.js';
import { AnthropicProvider } from '../../../src/llm/providers/anthropic-provider.js';
import { RetryLLMProvider, createRetryProvider } from '../../../src/llm/retry-provider.js';
import {
  UsageTrackingProvider,
  createUsageTrackingProvider,
} from '../../../src/llm/usage-tracking-provider.js';
import { TokenUsageTracker } from '../../../src/llm/usage-tracker.js';
import { LLMProviderRegistry } from '../../../src/llm/provider-registry.js';
import { createOpenAIProvider } from '../../../src/llm/providers/openai-provider.js';
import { createAnthropicProvider } from '../../../src/llm/providers/anthropic-provider.js';
import {
  LLMProviderError,
  LLMRateLimitError,
  LLMAuthenticationError,
} from '../../../src/errors/llm-errors.js';
import type { LLMResponse, LLMStreamChunk } from '../../../src/types/llm.js';
import {
  openaiConfig,
  anthropicConfig,
  openaiChatResponse,
  anthropicMessageResponse,
  openaiSSEStream,
  anthropicStreamEvents,
  anthropicSSEText,
  openaiErrorResponse,
  anthropicErrorResponse,
  jsonResponse,
  sseResponse,
  SIMPLE_USER_MESSAGE,
} from './helpers/mock-api-responses.js';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let originalFetch: typeof globalThis.fetch;
let originalOpenAIEnv: string | undefined;
let originalAnthropicEnv: string | undefined;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  originalOpenAIEnv = process.env['OPENAI_API_KEY'];
  originalAnthropicEnv = process.env['ANTHROPIC_API_KEY'];
  delete process.env['OPENAI_API_KEY'];
  delete process.env['ANTHROPIC_API_KEY'];
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalOpenAIEnv !== undefined) process.env['OPENAI_API_KEY'] = originalOpenAIEnv;
  else delete process.env['OPENAI_API_KEY'];
  if (originalAnthropicEnv !== undefined) process.env['ANTHROPIC_API_KEY'] = originalAnthropicEnv;
  else delete process.env['ANTHROPIC_API_KEY'];
  vi.restoreAllMocks();
});

// ===========================================================================
// 1. OpenAI Provider + Retry + Usage Tracking (full stack)
// ===========================================================================

describe('OpenAI full stack: Retry + UsageTracking + Provider', () => {
  it('should track usage on successful first attempt', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          openaiChatResponse({ content: 'Hello!', promptTokens: 10, completionTokens: 5 }),
        ),
      );

    const openai = new OpenAIProvider(openaiConfig());
    const { provider: tracked, tracker } = createUsageTrackingProvider(openai, {
      modelId: 'gpt-4o',
    });
    const retry = createRetryProvider(tracked, { maxRetries: 3, jitter: 0, baseDelayMs: 10 });

    const result = await retry.generateText(SIMPLE_USER_MESSAGE);

    expect(result.content).toBe('Hello!');
    expect(result.tokenUsage.totalTokens).toBe(15);
    expect(tracker.getRecords()).toHaveLength(1);
    expect(tracker.getRecords()[0]!.tokenUsage.totalTokens).toBe(15);
    expect(retry.stats.totalRequests).toBe(1);
    expect(retry.stats.immediateSuccesses).toBe(1);
  });

  it('should retry on rate limit then track usage on success', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(openaiErrorResponse({ message: 'Rate limited' }), 429, {
          'retry-after': '0.01',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          openaiChatResponse({ content: 'Retry worked', promptTokens: 10, completionTokens: 5 }),
        ),
      );
    globalThis.fetch = fetchMock;

    const openai = new OpenAIProvider(openaiConfig());
    const { provider: tracked, tracker } = createUsageTrackingProvider(openai, {
      modelId: 'gpt-4o',
    });
    const retry = createRetryProvider(tracked, {
      maxRetries: 3,
      jitter: 0,
      baseDelayMs: 10,
      maxDelayMs: 50,
    });

    const result = await retry.generateText(SIMPLE_USER_MESSAGE);

    expect(result.content).toBe('Retry worked');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(tracker.getRecords()).toHaveLength(1);
    expect(retry.stats.retriedSuccesses).toBe(1);
    expect(retry.stats.totalRetryAttempts).toBe(1);
  });

  it('should not track usage when all retries are exhausted', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(openaiErrorResponse({ message: 'Server error' }), 500));

    const openai = new OpenAIProvider(openaiConfig());
    const { provider: tracked, tracker } = createUsageTrackingProvider(openai, {
      modelId: 'gpt-4o',
    });
    const retry = createRetryProvider(tracked, {
      maxRetries: 2,
      jitter: 0,
      baseDelayMs: 10,
      maxDelayMs: 20,
    });

    await expect(retry.generateText(SIMPLE_USER_MESSAGE)).rejects.toThrow(LLMProviderError);
    expect(tracker.getRecords()).toHaveLength(0);
    expect(retry.stats.exhaustedFailures).toBe(1);
  });

  it('should not retry authentication errors', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(openaiErrorResponse({ message: 'Invalid key' }), 401));
    globalThis.fetch = fetchMock;

    const openai = new OpenAIProvider(openaiConfig());
    const { provider: tracked, tracker } = createUsageTrackingProvider(openai, {
      modelId: 'gpt-4o',
    });
    const retry = createRetryProvider(tracked, { maxRetries: 3, jitter: 0, baseDelayMs: 10 });

    await expect(retry.generateText(SIMPLE_USER_MESSAGE)).rejects.toThrow(LLMAuthenticationError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(tracker.getRecords()).toHaveLength(0);
  });

  it('should track usage for streamed responses via toResponse()', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      sseResponse(
        openaiSSEStream([
          { content: 'Hello' },
          { content: ' world' },
          {
            content: '',
            finishReason: 'stop',
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          },
        ]),
      ),
    );

    const openai = new OpenAIProvider(openaiConfig());
    const { provider: tracked, tracker } = createUsageTrackingProvider(openai, {
      modelId: 'gpt-4o',
    });
    const retry = createRetryProvider(tracked, { maxRetries: 2, jitter: 0, baseDelayMs: 10 });

    const stream = await retry.generateStream(SIMPLE_USER_MESSAGE);
    const result = await stream.toResponse();

    expect(result.content).toBe('Hello world');
    expect(result.tokenUsage.totalTokens).toBe(15);
    expect(tracker.getRecords()).toHaveLength(1);
    expect(tracker.getRecords()[0]!.streaming).toBe(true);
  });

  it('should track usage for streamed responses via async iteration', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      sseResponse(
        openaiSSEStream([
          { content: 'chunk1' },
          { content: 'chunk2' },
          {
            content: '',
            finishReason: 'stop',
            usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 },
          },
        ]),
      ),
    );

    const openai = new OpenAIProvider(openaiConfig());
    const { provider: tracked, tracker } = createUsageTrackingProvider(openai, {
      modelId: 'gpt-4o',
    });

    const stream = await tracked.generateStream(SIMPLE_USER_MESSAGE);
    const chunks: LLMStreamChunk[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);
    expect(tracker.getRecords()).toHaveLength(1);
    expect(tracker.getRecords()[0]!.tokenUsage.totalTokens).toBe(7);
  });
});

// ===========================================================================
// 2. Anthropic Provider + Retry + Usage Tracking (full stack)
// ===========================================================================

describe('Anthropic full stack: Retry + UsageTracking + Provider', () => {
  it('should track usage on successful first attempt', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          anthropicMessageResponse({ content: 'Hello!', inputTokens: 10, outputTokens: 5 }),
        ),
      );

    const anthropic = new AnthropicProvider(anthropicConfig());
    const { provider: tracked, tracker } = createUsageTrackingProvider(anthropic, {
      modelId: 'claude-3-5-sonnet-20241022',
    });
    const retry = createRetryProvider(tracked, { maxRetries: 3, jitter: 0, baseDelayMs: 10 });

    const result = await retry.generateText(SIMPLE_USER_MESSAGE);

    expect(result.content).toBe('Hello!');
    expect(result.tokenUsage.totalTokens).toBe(15);
    expect(tracker.getRecords()).toHaveLength(1);
    expect(retry.stats.immediateSuccesses).toBe(1);
  });

  it('should retry on 500 server error then succeed', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(anthropicErrorResponse({ message: 'Server error' }), 500))
      .mockResolvedValueOnce(
        jsonResponse(
          anthropicMessageResponse({ content: 'Back online', inputTokens: 8, outputTokens: 4 }),
        ),
      );
    globalThis.fetch = fetchMock;

    const anthropic = new AnthropicProvider(anthropicConfig());
    const { provider: tracked, tracker } = createUsageTrackingProvider(anthropic, {
      modelId: 'claude-3-5-sonnet-20241022',
    });
    const retry = createRetryProvider(tracked, {
      maxRetries: 3,
      jitter: 0,
      baseDelayMs: 10,
      maxDelayMs: 50,
    });

    const result = await retry.generateText(SIMPLE_USER_MESSAGE);

    expect(result.content).toBe('Back online');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(tracker.getRecords()).toHaveLength(1);
    expect(retry.stats.retriedSuccesses).toBe(1);
  });

  it('should track streaming usage from Anthropic provider', async () => {
    const events = anthropicStreamEvents(['Hello', ' from ', 'Anthropic'], {
      inputTokens: 12,
      outputTokens: 6,
    });
    globalThis.fetch = vi.fn().mockResolvedValue(sseResponse(anthropicSSEText(events)));

    const anthropic = new AnthropicProvider(anthropicConfig());
    const { provider: tracked, tracker } = createUsageTrackingProvider(anthropic, {
      modelId: 'claude-3-5-sonnet-20241022',
    });
    const retry = createRetryProvider(tracked, { maxRetries: 2, jitter: 0, baseDelayMs: 10 });

    const stream = await retry.generateStream(SIMPLE_USER_MESSAGE);
    const result = await stream.toResponse();

    expect(result.content).toBe('Hello from Anthropic');
    expect(result.tokenUsage.totalTokens).toBe(18);
    expect(tracker.getRecords()).toHaveLength(1);
    expect(tracker.getRecords()[0]!.streaming).toBe(true);
  });
});

// ===========================================================================
// 3. Circuit Breaker + Retry + Provider
// ===========================================================================

describe('Circuit Breaker integration with real providers', () => {
  it('should open circuit after consecutive OpenAI failures', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(openaiErrorResponse({ message: 'Server error' }), 500));

    const openai = new OpenAIProvider(openaiConfig());
    const retry = createRetryProvider(openai, {
      maxRetries: 0,
      circuitBreaker: { failureThreshold: 3, cooldownMs: 60000 },
    });

    for (let i = 0; i < 3; i++) {
      await expect(retry.generateText(SIMPLE_USER_MESSAGE)).rejects.toThrow();
    }

    await expect(retry.generateText(SIMPLE_USER_MESSAGE)).rejects.toThrow(/circuit breaker/i);
    expect(retry.stats.circuitBreakerRejections).toBeGreaterThan(0);
  });

  it('should track stats correctly with circuit breaker and retry combined', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(openaiErrorResponse({ message: 'Error' }), 500))
      .mockResolvedValueOnce(jsonResponse(openaiChatResponse({ content: 'ok' })));
    globalThis.fetch = fetchMock;

    const openai = new OpenAIProvider(openaiConfig());
    const retry = createRetryProvider(openai, {
      maxRetries: 3,
      jitter: 0,
      baseDelayMs: 10,
      maxDelayMs: 20,
      circuitBreaker: { failureThreshold: 5, cooldownMs: 60000 },
    });

    const result = await retry.generateText(SIMPLE_USER_MESSAGE);
    expect(result.content).toBe('ok');
    expect(retry.stats.totalRequests).toBe(1);
    expect(retry.stats.retriedSuccesses).toBe(1);
    expect(retry.stats.totalRetryAttempts).toBe(1);
  });
});

// ===========================================================================
// 4. Shared tracker across multiple providers
// ===========================================================================

describe('Shared UsageTracker across OpenAI and Anthropic', () => {
  it('should aggregate usage from both providers in a single tracker', async () => {
    const sharedTracker = new TokenUsageTracker();

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          openaiChatResponse({ content: 'OpenAI', promptTokens: 20, completionTokens: 10 }),
        ),
      );
    const openaiTracked = new UsageTrackingProvider(new OpenAIProvider(openaiConfig()), {
      modelId: 'gpt-4o',
      tracker: sharedTracker,
    });
    await openaiTracked.generateText(SIMPLE_USER_MESSAGE);

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          anthropicMessageResponse({ content: 'Anthropic', inputTokens: 15, outputTokens: 8 }),
        ),
      );
    const anthropicTracked = new UsageTrackingProvider(new AnthropicProvider(anthropicConfig()), {
      modelId: 'claude-3-5-sonnet-20241022',
      tracker: sharedTracker,
    });
    await anthropicTracked.generateText(SIMPLE_USER_MESSAGE);

    expect(sharedTracker.getRecords()).toHaveLength(2);
    const totals = sharedTracker.getTotalTokens();
    expect(totals.promptTokens).toBe(35);
    expect(totals.completionTokens).toBe(18);
    expect(totals.totalTokens).toBe(53);
  });

  it('should separate records by provider in shared tracker report', async () => {
    const sharedTracker = new TokenUsageTracker();

    // Each call needs its own Response (body is consumed)
    globalThis.fetch = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          jsonResponse(openaiChatResponse({ content: 'Hi', promptTokens: 5, completionTokens: 2 })),
        ),
      );
    const openai = new UsageTrackingProvider(new OpenAIProvider(openaiConfig()), {
      modelId: 'gpt-4o',
      tracker: sharedTracker,
    });
    await openai.generateText(SIMPLE_USER_MESSAGE);
    await openai.generateText(SIMPLE_USER_MESSAGE);

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(anthropicMessageResponse({ content: 'Hi', inputTokens: 10, outputTokens: 3 })),
      );
    const anthropic = new UsageTrackingProvider(new AnthropicProvider(anthropicConfig()), {
      modelId: 'claude-3-5-sonnet-20241022',
      tracker: sharedTracker,
    });
    await anthropic.generateText(SIMPLE_USER_MESSAGE);

    expect(sharedTracker.getRecords()).toHaveLength(3);
    expect(sharedTracker.getRecords().filter((r) => r.provider === 'openai')).toHaveLength(2);
    expect(sharedTracker.getRecords().filter((r) => r.provider === 'anthropic')).toHaveLength(1);
  });

  it('should track streaming and non-streaming usage together', async () => {
    const sharedTracker = new TokenUsageTracker();

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          openaiChatResponse({ content: 'text', promptTokens: 10, completionTokens: 5 }),
        ),
      );
    const openaiTracked = new UsageTrackingProvider(new OpenAIProvider(openaiConfig()), {
      modelId: 'gpt-4o',
      tracker: sharedTracker,
    });
    await openaiTracked.generateText(SIMPLE_USER_MESSAGE);

    globalThis.fetch = vi.fn().mockResolvedValue(
      sseResponse(
        openaiSSEStream([
          { content: 'stream' },
          {
            content: '',
            finishReason: 'stop',
            usage: { prompt_tokens: 8, completion_tokens: 3, total_tokens: 11 },
          },
        ]),
      ),
    );
    await (await openaiTracked.generateStream(SIMPLE_USER_MESSAGE)).toResponse();

    expect(sharedTracker.getRecords()).toHaveLength(2);
    expect(sharedTracker.getRecords()[0]!.streaming).toBe(false);
    expect(sharedTracker.getRecords()[1]!.streaming).toBe(true);
    expect(sharedTracker.getTotalTokens().totalTokens).toBe(26);
  });
});

// ===========================================================================
// 5. Provider Registry + Composition
// ===========================================================================

describe('Provider Registry integration', () => {
  it('should create OpenAI provider from registry and compose with retry', async () => {
    const registry = new LLMProviderRegistry();
    registry.register('openai', createOpenAIProvider);

    const openai = registry.create(openaiConfig());
    const retry = createRetryProvider(openai, { maxRetries: 1, jitter: 0, baseDelayMs: 10 });

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(openaiChatResponse({ content: 'From registry' })));
    const result = await retry.generateText(SIMPLE_USER_MESSAGE);
    expect(result.content).toBe('From registry');
  });

  it('should create Anthropic provider from registry and compose with tracking', async () => {
    const registry = new LLMProviderRegistry();
    registry.register('anthropic', createAnthropicProvider);

    const anthropic = registry.create(anthropicConfig());
    const { provider: tracked, tracker } = createUsageTrackingProvider(anthropic, {
      modelId: 'claude-3-5-sonnet-20241022',
    });

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          anthropicMessageResponse({ content: 'From registry', inputTokens: 5, outputTokens: 3 }),
        ),
      );
    const result = await tracked.generateText(SIMPLE_USER_MESSAGE);
    expect(result.content).toBe('From registry');
    expect(tracker.getRecords()).toHaveLength(1);
  });

  it('should compose full stack: Registry + Retry + Tracking + Provider', async () => {
    const registry = new LLMProviderRegistry();
    registry.register('openai', createOpenAIProvider);

    const openai = registry.create(openaiConfig());
    const { provider: tracked, tracker } = createUsageTrackingProvider(openai, {
      modelId: 'gpt-4o',
    });
    const retry = createRetryProvider(tracked, {
      maxRetries: 2,
      jitter: 0,
      baseDelayMs: 10,
      circuitBreaker: { failureThreshold: 5, cooldownMs: 60000 },
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(openaiErrorResponse({ message: 'Error' }), 500))
      .mockResolvedValueOnce(
        jsonResponse(
          openaiChatResponse({ content: 'Success', promptTokens: 10, completionTokens: 5 }),
        ),
      );
    globalThis.fetch = fetchMock;

    const result = await retry.generateText(SIMPLE_USER_MESSAGE);
    expect(result.content).toBe('Success');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(tracker.getRecords()).toHaveLength(1);
    expect(retry.stats.retriedSuccesses).toBe(1);
  });
});

// ===========================================================================
// 6. Retry callback verification with real providers
// ===========================================================================

describe('Retry callback integration', () => {
  it('should invoke onRetry callback with correct context for rate limit', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(openaiErrorResponse({ message: 'Rate limited' }), 429, {
          'retry-after': '0.01',
        }),
      )
      .mockResolvedValueOnce(jsonResponse(openaiChatResponse({ content: 'ok' })));
    globalThis.fetch = fetchMock;

    const retryCallback = vi.fn();
    const openai = new OpenAIProvider(openaiConfig());
    const retry = new RetryLLMProvider(openai, {
      maxRetries: 3,
      jitter: 0,
      baseDelayMs: 10,
      onRetry: retryCallback,
    });

    await retry.generateText(SIMPLE_USER_MESSAGE);

    expect(retryCallback).toHaveBeenCalledTimes(1);
    const ctx = retryCallback.mock.calls[0]![0] as { attempt: number; error: Error };
    expect(ctx.attempt).toBe(1);
    expect(ctx.error).toBeInstanceOf(LLMRateLimitError);
  });

  it('should invoke onRetry for each retry attempt during multiple server errors', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(openaiErrorResponse({ message: 'Error 1' }), 500))
      .mockResolvedValueOnce(jsonResponse(openaiErrorResponse({ message: 'Error 2' }), 502))
      .mockResolvedValueOnce(jsonResponse(openaiChatResponse({ content: 'Finally' })));
    globalThis.fetch = fetchMock;

    const retryCallback = vi.fn();
    const openai = new OpenAIProvider(openaiConfig());
    const retry = new RetryLLMProvider(openai, {
      maxRetries: 3,
      jitter: 0,
      baseDelayMs: 10,
      maxDelayMs: 20,
      onRetry: retryCallback,
    });

    const result = await retry.generateText(SIMPLE_USER_MESSAGE);
    expect(result.content).toBe('Finally');
    expect(retryCallback).toHaveBeenCalledTimes(2);
  });
});

// ===========================================================================
// 7. Multi-provider failover pattern
// ===========================================================================

describe('Multi-provider failover pattern', () => {
  it('should fall back from OpenAI to Anthropic on persistent failure', async () => {
    const openai = new OpenAIProvider(openaiConfig());
    const anthropic = new AnthropicProvider(anthropicConfig());

    // OpenAI fails
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(openaiErrorResponse({ message: 'Server error' }), 500));
    let result: LLMResponse | undefined;
    try {
      const openaiRetry = createRetryProvider(openai, {
        maxRetries: 1,
        jitter: 0,
        baseDelayMs: 10,
        maxDelayMs: 20,
      });
      result = await openaiRetry.generateText(SIMPLE_USER_MESSAGE);
    } catch {
      // Fall back to Anthropic
      globalThis.fetch = vi.fn().mockResolvedValue(
        jsonResponse(
          anthropicMessageResponse({
            content: 'Fallback response',
            inputTokens: 10,
            outputTokens: 5,
          }),
        ),
      );
      result = await anthropic.generateText(SIMPLE_USER_MESSAGE);
    }

    expect(result).toBeDefined();
    expect(result!.content).toBe('Fallback response');
  });

  it('should track usage across failover in shared tracker', async () => {
    const sharedTracker = new TokenUsageTracker();

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(openaiErrorResponse({ message: 'Server error' }), 500));
    const openai = new OpenAIProvider(openaiConfig());
    const openaiTracked = new UsageTrackingProvider(openai, {
      modelId: 'gpt-4o',
      tracker: sharedTracker,
    });
    const openaiRetry = createRetryProvider(openaiTracked, { maxRetries: 0 });

    let result: LLMResponse;
    try {
      result = await openaiRetry.generateText(SIMPLE_USER_MESSAGE);
    } catch {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          jsonResponse(
            anthropicMessageResponse({ content: 'Fallback', inputTokens: 10, outputTokens: 5 }),
          ),
        );
      const anthropic = new AnthropicProvider(anthropicConfig());
      const anthropicTracked = new UsageTrackingProvider(anthropic, {
        modelId: 'claude-3-5-sonnet-20241022',
        tracker: sharedTracker,
      });
      result = await anthropicTracked.generateText(SIMPLE_USER_MESSAGE);
    }

    expect(result.content).toBe('Fallback');
    expect(sharedTracker.getRecords()).toHaveLength(1);
    expect(sharedTracker.getRecords()[0]!.provider).toBe('anthropic');
  });
});

// ===========================================================================
// 8. Multiple sequential requests
// ===========================================================================

describe('Multiple sequential requests', () => {
  it('should handle 10 sequential text requests from OpenAI', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve(
        jsonResponse(
          openaiChatResponse({
            content: `Response ${callCount}`,
            promptTokens: 10,
            completionTokens: callCount,
          }),
        ),
      );
    });

    const openai = new OpenAIProvider(openaiConfig());
    const { provider: tracked, tracker } = createUsageTrackingProvider(openai, {
      modelId: 'gpt-4o',
    });

    const results: LLMResponse[] = [];
    for (let i = 0; i < 10; i++) {
      results.push(await tracked.generateText(SIMPLE_USER_MESSAGE));
    }

    expect(results).toHaveLength(10);
    expect(results[0]!.content).toBe('Response 1');
    expect(results[9]!.content).toBe('Response 10');
    expect(tracker.getRecords()).toHaveLength(10);
    expect(tracker.getTotalTokens().promptTokens).toBe(100);
    expect(tracker.getTotalTokens().completionTokens).toBe(55);
  });

  it('should handle alternating text and stream requests', async () => {
    const openai = new OpenAIProvider(openaiConfig());
    const { provider: tracked, tracker } = createUsageTrackingProvider(openai, {
      modelId: 'gpt-4o',
    });

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          openaiChatResponse({ content: 'text1', promptTokens: 5, completionTokens: 2 }),
        ),
      );
    await tracked.generateText(SIMPLE_USER_MESSAGE);

    globalThis.fetch = vi.fn().mockResolvedValue(
      sseResponse(
        openaiSSEStream([
          { content: 'stream1' },
          {
            content: '',
            finishReason: 'stop',
            usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
          },
        ]),
      ),
    );
    await (await tracked.generateStream(SIMPLE_USER_MESSAGE)).toResponse();

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          openaiChatResponse({ content: 'text2', promptTokens: 5, completionTokens: 2 }),
        ),
      );
    await tracked.generateText(SIMPLE_USER_MESSAGE);

    expect(tracker.getRecords()).toHaveLength(3);
    expect(tracker.getRecords()[0]!.streaming).toBe(false);
    expect(tracker.getRecords()[1]!.streaming).toBe(true);
    expect(tracker.getRecords()[2]!.streaming).toBe(false);
  });
});

// ===========================================================================
// 9. Error propagation through composition layers
// ===========================================================================

describe('Error propagation through composition layers', () => {
  it('should preserve error type through Retry + Tracking + Provider stack', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(openaiErrorResponse({ message: 'Invalid key' }), 401));

    const openai = new OpenAIProvider(openaiConfig());
    const { provider: tracked } = createUsageTrackingProvider(openai, { modelId: 'gpt-4o' });
    const retry = createRetryProvider(tracked, { maxRetries: 2, jitter: 0, baseDelayMs: 10 });

    const error = await retry.generateText(SIMPLE_USER_MESSAGE).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LLMAuthenticationError);
    expect((error as LLMAuthenticationError).provider).toBe('openai');
  });

  it('should preserve RateLimitError metadata through composition', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(openaiErrorResponse({ message: 'Rate limit' }), 429, { 'retry-after': '30' }),
      );

    const openai = new OpenAIProvider(openaiConfig());
    const { provider: tracked } = createUsageTrackingProvider(openai, { modelId: 'gpt-4o' });
    const retry = createRetryProvider(tracked, { maxRetries: 0 });

    const error = await retry
      .generateText(SIMPLE_USER_MESSAGE)
      .catch((e: unknown) => e as LLMRateLimitError);
    expect(error).toBeInstanceOf(LLMRateLimitError);
    expect((error as LLMRateLimitError).retryAfterMs).toBe(30000);
  });

  it('should propagate network errors through all layers', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

    const openai = new OpenAIProvider(openaiConfig());
    const { provider: tracked } = createUsageTrackingProvider(openai, { modelId: 'gpt-4o' });
    const retry = createRetryProvider(tracked, {
      maxRetries: 1,
      jitter: 0,
      baseDelayMs: 10,
      maxDelayMs: 20,
    });

    const error = await retry
      .generateText(SIMPLE_USER_MESSAGE)
      .catch((e: unknown) => e as LLMProviderError);
    expect(error).toBeInstanceOf(LLMProviderError);
    expect((error as LLMProviderError).message).toContain('Network error');
  });
});
