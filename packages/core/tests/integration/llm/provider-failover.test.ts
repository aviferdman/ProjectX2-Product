/**
 * Provider failover integration tests.
 *
 * Tests cross-provider switching strategies using the registry and retry
 * infrastructure. Validates that when one provider fails, the system can
 * seamlessly use an alternative provider.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OpenAIProvider, createOpenAIProvider } from '../../../src/llm/providers/openai-provider.js';
import {
  AnthropicProvider,
  createAnthropicProvider,
} from '../../../src/llm/providers/anthropic-provider.js';
import { LLMProviderRegistry } from '../../../src/llm/provider-registry.js';
import { createRetryProvider } from '../../../src/llm/retry-provider.js';
import {
  createUsageTrackingProvider,
  UsageTrackingProvider,
} from '../../../src/llm/usage-tracking-provider.js';
import { TokenUsageTracker } from '../../../src/llm/usage-tracker.js';
import {
  LLMProviderError,
  LLMRateLimitError,
  LLMAuthenticationError,
} from '../../../src/errors/llm-errors.js';
import type {
  LLMMessage,
  LLMProvider,
  LLMProviderConfig,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamResponse,
  StreamingLLMProvider,
} from '../../../src/types/llm.js';
import { LLMRole } from '../../../src/types/llm.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OPENAI_KEY = 'sk-test-failover-openai';
const ANTHROPIC_KEY = 'sk-ant-test-failover-anthropic';

const USER_MESSAGES: LLMMessage[] = [{ role: LLMRole.USER, content: 'Hello!' }];

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function openaiJsonResponse(content: string, tokens = 15): Response {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: tokens - 10, total_tokens: tokens },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function anthropicJsonResponse(content: string, tokens = 20): Response {
  const inputTokens = Math.floor(tokens * 0.6);
  const outputTokens = tokens - inputTokens;
  return new Response(
    JSON.stringify({
      content: [{ type: 'text', text: content }],
      stop_reason: 'end_turn',
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: { message, type: 'error' } }), {
    status,
    statusText: 'Error',
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// FallbackProvider — a simple provider wrapper that tries multiple providers
// ---------------------------------------------------------------------------

/**
 * A multi-provider failover wrapper.
 *
 * Tries each provider in order. If one fails with a retryable error,
 * falls through to the next. Non-retryable errors (auth) propagate immediately.
 */
class FallbackProvider implements LLMProvider {
  readonly name = 'fallback';
  private readonly _providers: LLMProvider[];

  constructor(providers: LLMProvider[]) {
    if (providers.length === 0) {
      throw new Error('FallbackProvider requires at least one provider');
    }
    this._providers = providers;
  }

  async generateText(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions,
  ): Promise<LLMResponse> {
    let lastError: Error | undefined;

    for (const provider of this._providers) {
      try {
        return await provider.generateText(messages, options);
      } catch (error) {
        if (error instanceof LLMAuthenticationError) {
          throw error;
        }
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw lastError ?? new Error('All providers failed');
  }
}

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Manual failover: OpenAI → Anthropic', () => {
  it('should fall back to Anthropic when OpenAI returns 500', async () => {
    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const anthropic = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    const fallback = new FallbackProvider([openai, anthropic]);

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(errorResponse(500, 'OpenAI is down'))
      .mockResolvedValueOnce(anthropicJsonResponse('Anthropic rescued!'));

    const response = await fallback.generateText(USER_MESSAGES);
    expect(response.content).toBe('Anthropic rescued!');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('should fall back to Anthropic when OpenAI returns 429', async () => {
    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const anthropic = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    const fallback = new FallbackProvider([openai, anthropic]);

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(errorResponse(429, 'Rate limited'))
      .mockResolvedValueOnce(anthropicJsonResponse('Fallback from rate limit'));

    const response = await fallback.generateText(USER_MESSAGES);
    expect(response.content).toBe('Fallback from rate limit');
  });

  it('should NOT fall back on authentication errors', async () => {
    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const anthropic = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    const fallback = new FallbackProvider([openai, anthropic]);

    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      errorResponse(401, 'Invalid API key'),
    );

    await expect(fallback.generateText(USER_MESSAGES)).rejects.toThrow(
      LLMAuthenticationError,
    );
    // Should not call Anthropic at all
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('should fail when all providers return errors', async () => {
    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const anthropic = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    const fallback = new FallbackProvider([openai, anthropic]);

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(errorResponse(500, 'OpenAI down'))
      .mockResolvedValueOnce(errorResponse(503, 'Anthropic overloaded'));

    await expect(fallback.generateText(USER_MESSAGES)).rejects.toThrow(LLMProviderError);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});

describe('Failover with retry: retry each provider before falling back', () => {
  it('should retry OpenAI then fall back to Anthropic', async () => {
    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const anthropic = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    const openaiRetry = createRetryProvider(openai, {
      maxRetries: 1,
      baseDelayMs: 1,
      jitter: 0,
    });
    const anthropicRetry = createRetryProvider(anthropic, {
      maxRetries: 1,
      baseDelayMs: 1,
      jitter: 0,
    });

    const fallback = new FallbackProvider([openaiRetry, anthropicRetry]);

    globalThis.fetch = vi.fn()
      // OpenAI: 2 failures (initial + 1 retry)
      .mockResolvedValueOnce(errorResponse(500, 'Down'))
      .mockResolvedValueOnce(errorResponse(500, 'Still down'))
      // Anthropic: succeeds on first try
      .mockResolvedValueOnce(anthropicJsonResponse('Recovered via Anthropic'));

    const response = await fallback.generateText(USER_MESSAGES);
    expect(response.content).toBe('Recovered via Anthropic');
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);

    expect(openaiRetry.stats.exhaustedFailures).toBe(1);
    expect(anthropicRetry.stats.immediateSuccesses).toBe(1);
  });
});

describe('Failover with usage tracking', () => {
  it('should track usage only from the successful fallback provider', async () => {
    const tracker = new TokenUsageTracker();

    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const anthropic = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    const { provider: openaiTracked } = createUsageTrackingProvider(openai, { tracker });
    const { provider: anthropicTracked } = createUsageTrackingProvider(anthropic, { tracker });

    const fallback = new FallbackProvider([openaiTracked, anthropicTracked]);

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(errorResponse(500, 'OpenAI down'))
      .mockResolvedValueOnce(anthropicJsonResponse('Fallback', 25));

    const response = await fallback.generateText(USER_MESSAGES);
    expect(response.content).toBe('Fallback');

    // Only Anthropic should have recorded usage
    const report = tracker.getReport();
    expect(report.totals.requests).toBe(1);
    expect(report.totals.totalTokens).toBe(25);
  });
});

describe('Registry-based provider creation with failover', () => {
  it('should create providers from registry and fail over between them', async () => {
    const registry = new LLMProviderRegistry();
    registry.register('openai', createOpenAIProvider);
    registry.register('anthropic', createAnthropicProvider);

    const openai = registry.create({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const anthropic = registry.create({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    const fallback = new FallbackProvider([openai, anthropic]);

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(errorResponse(503, 'Overloaded'))
      .mockResolvedValueOnce(anthropicJsonResponse('Registry fallback'));

    const response = await fallback.generateText(USER_MESSAGES);
    expect(response.content).toBe('Registry fallback');
  });

  it('should dynamically add and use providers at runtime', async () => {
    const registry = new LLMProviderRegistry();
    registry.register('openai', createOpenAIProvider);

    // Initially only OpenAI is available
    const openai = registry.create({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      openaiJsonResponse('OpenAI only'),
    );
    const r1 = await openai.generateText(USER_MESSAGES);
    expect(r1.content).toBe('OpenAI only');

    // Add Anthropic at runtime
    registry.override('anthropic', createAnthropicProvider);
    const anthropic = registry.create({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      anthropicJsonResponse('Anthropic added'),
    );
    const r2 = await anthropic.generateText(USER_MESSAGES);
    expect(r2.content).toBe('Anthropic added');
  });
});

describe('Circuit breaker failover', () => {
  it('should route to fallback when primary circuit breaker opens', async () => {
    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    const anthropic = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    const openaiRetry = createRetryProvider(openai, {
      maxRetries: 0,
      circuitBreaker: { failureThreshold: 2, cooldownMs: 5000 },
    });

    const fallback = new FallbackProvider([openaiRetry, anthropic]);

    // Fail OpenAI twice to open circuit
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(errorResponse(500, 'Down'))
      .mockResolvedValueOnce(anthropicJsonResponse('Fallback after 1st'))
      .mockResolvedValueOnce(errorResponse(500, 'Still down'))
      .mockResolvedValueOnce(anthropicJsonResponse('Fallback after 2nd'));

    await fallback.generateText(USER_MESSAGES);
    await fallback.generateText(USER_MESSAGES);

    // Circuit should now be open — next request skips OpenAI entirely
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      anthropicJsonResponse('Direct to Anthropic'),
    );

    const response = await fallback.generateText(USER_MESSAGES);
    expect(response.content).toBe('Direct to Anthropic');

    // fetch called only once — OpenAI was skipped due to open circuit
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(openaiRetry.stats.circuitBreakerRejections).toBeGreaterThanOrEqual(1);
  });
});

describe('Multiple model failover within same provider', () => {
  it('should try gpt-4o then gpt-4o-mini when primary model rate limits', async () => {
    const gpt4o = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const gpt4oMini = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o-mini',
      apiKey: OPENAI_KEY,
    });

    const fallback = new FallbackProvider([gpt4o, gpt4oMini]);

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(errorResponse(429, 'Rate limited'))
      .mockResolvedValueOnce(openaiJsonResponse('Mini to the rescue'));

    globalThis.fetch = fetchMock;

    const response = await fallback.generateText(USER_MESSAGES);
    expect(response.content).toBe('Mini to the rescue');

    // Verify second call used gpt-4o-mini model
    const secondBody = JSON.parse(
      (fetchMock.mock.calls[1] as [string, RequestInit])[1].body as string,
    );
    expect(secondBody.model).toBe('gpt-4o-mini');
  });
});

describe('Network failure failover', () => {
  it('should fall back on network error (no HTTP response)', async () => {
    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const anthropic = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    const fallback = new FallbackProvider([openai, anthropic]);

    globalThis.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND api.openai.com'))
      .mockResolvedValueOnce(anthropicJsonResponse('Network fallback'));

    const response = await fallback.generateText(USER_MESSAGES);
    expect(response.content).toBe('Network fallback');
  });

  it('should fail when both providers have network errors', async () => {
    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const anthropic = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    const fallback = new FallbackProvider([openai, anthropic]);

    globalThis.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('ENOTFOUND'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await expect(fallback.generateText(USER_MESSAGES)).rejects.toThrow(LLMProviderError);
  });
});

describe('Provider factory error handling', () => {
  it('should handle factory that throws during instantiation', () => {
    const registry = new LLMProviderRegistry();
    registry.register('broken', () => {
      throw new Error('Factory exploded');
    });

    expect(() =>
      registry.create({ provider: 'broken', modelId: 'model', apiKey: 'key' }),
    ).toThrow('Factory exploded');
  });

  it('should handle provider that throws synchronously from constructor', () => {
    expect(
      () =>
        new OpenAIProvider({
          provider: 'openai',
          modelId: 'gpt-4o',
          apiKey: '', // Empty API key
        }),
    ).toThrow(LLMAuthenticationError);
  });

  it('should handle Anthropic provider with missing API key', () => {
    const originalEnv = process.env['ANTHROPIC_API_KEY'];
    delete process.env['ANTHROPIC_API_KEY'];

    try {
      expect(
        () =>
          new AnthropicProvider({
            provider: 'anthropic',
            modelId: 'claude-3-5-sonnet-20241022',
          }),
      ).toThrow(LLMAuthenticationError);
    } finally {
      if (originalEnv !== undefined) {
        process.env['ANTHROPIC_API_KEY'] = originalEnv;
      }
    }
  });
});
