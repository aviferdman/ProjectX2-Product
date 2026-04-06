/**
 * Cross-provider behavioral comparison tests.
 *
 * Verifies that OpenAI and Anthropic providers produce consistent behavior
 * when handling equivalent operations — same content, same error types,
 * same streaming semantics.
 *
 * TASK-027: Final validation for Epic 3 LLM Provider Abstraction.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OpenAIProvider } from '../../../src/llm/providers/openai-provider.js';
import { AnthropicProvider } from '../../../src/llm/providers/anthropic-provider.js';
import {
  LLMAuthenticationError,
  LLMContextLengthError,
  LLMProviderError,
  LLMRateLimitError,
} from '../../../src/errors/llm-errors.js';
import type { LLMMessage, LLMStreamChunk } from '../../../src/types/llm.js';
import { LLMRole } from '../../../src/types/llm.js';
import {
  openaiConfig,
  anthropicConfig,
  openaiChatResponse,
  anthropicMessageResponse,
  openaiSSEStream,
  anthropicStreamEvents,
  anthropicSSEText,
  jsonResponse,
  sseResponse,
  chunkedSSEResponse,
  openaiErrorResponse,
  anthropicErrorResponse,
  SIMPLE_USER_MESSAGE,
  MULTI_TURN_MESSAGES,
  userMessage,
  systemMessage,
  toolMessage,
  textErrorResponse,
  htmlErrorResponse,
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

// ---------------------------------------------------------------------------
// 1. Consistent text generation behavior
// ---------------------------------------------------------------------------

describe('Cross-provider: text generation consistency', () => {
  it('should return content, finishReason, and tokenUsage with same structure from both providers', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          openaiChatResponse({ content: 'Hello world', promptTokens: 8, completionTokens: 3 }),
        ),
      );
    const openaiResult = await new OpenAIProvider(openaiConfig()).generateText(SIMPLE_USER_MESSAGE);

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          anthropicMessageResponse({ content: 'Hello world', inputTokens: 8, outputTokens: 3 }),
        ),
      );
    const anthropicResult = await new AnthropicProvider(anthropicConfig()).generateText(
      SIMPLE_USER_MESSAGE,
    );

    expect(openaiResult.content).toBe('Hello world');
    expect(anthropicResult.content).toBe('Hello world');
    expect(openaiResult.finishReason).toBe('stop');
    expect(anthropicResult.finishReason).toBe('stop');
    expect(openaiResult.tokenUsage).toEqual({
      promptTokens: 8,
      completionTokens: 3,
      totalTokens: 11,
    });
    expect(anthropicResult.tokenUsage).toEqual({
      promptTokens: 8,
      completionTokens: 3,
      totalTokens: 11,
    });
  });

  it('should handle empty content response from both providers', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(openaiChatResponse({ content: '' })));
    const openaiResult = await new OpenAIProvider(openaiConfig()).generateText(SIMPLE_USER_MESSAGE);

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(anthropicMessageResponse({ content: '' })));
    const anthropicResult = await new AnthropicProvider(anthropicConfig()).generateText(
      SIMPLE_USER_MESSAGE,
    );

    expect(openaiResult.content).toBe('');
    expect(anthropicResult.content).toBe('');
  });

  it('should handle multi-turn conversations through both providers', async () => {
    const messages: readonly LLMMessage[] = MULTI_TURN_MESSAGES;

    const fetchMockOpenAI = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          openaiChatResponse({ content: '3 + 3 = 6', promptTokens: 30, completionTokens: 5 }),
        ),
      );
    globalThis.fetch = fetchMockOpenAI;
    await new OpenAIProvider(openaiConfig()).generateText(messages);

    // Verify OpenAI sends all messages including system
    const openaiBody = JSON.parse(
      (fetchMockOpenAI.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as Record<string, unknown>;
    const openaiMsgs = openaiBody['messages'] as { role: string }[];
    expect(openaiMsgs).toHaveLength(4);
    expect(openaiMsgs[0]!.role).toBe('system');

    const fetchMockAnthropic = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          anthropicMessageResponse({ content: '3 + 3 = 6', inputTokens: 30, outputTokens: 5 }),
        ),
      );
    globalThis.fetch = fetchMockAnthropic;
    await new AnthropicProvider(anthropicConfig()).generateText(messages);

    // Verify Anthropic extracts system to top-level field
    const anthropicBody = JSON.parse(
      (fetchMockAnthropic.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as Record<string, unknown>;
    const anthropicMsgs = anthropicBody['messages'] as { role: string }[];
    expect(anthropicMsgs).toHaveLength(3);
    expect(anthropicBody['system']).toBe('You are a helpful assistant.');
  });

  it('should pass temperature and maxTokens to both providers', async () => {
    const fetchMockOpenAI = vi
      .fn()
      .mockResolvedValue(jsonResponse(openaiChatResponse({ content: 'response' })));
    globalThis.fetch = fetchMockOpenAI;
    await new OpenAIProvider(openaiConfig()).generateText(SIMPLE_USER_MESSAGE, {
      temperature: 0.7,
      maxTokens: 500,
    });

    const fetchMockAnthropic = vi
      .fn()
      .mockResolvedValue(jsonResponse(anthropicMessageResponse({ content: 'response' })));
    globalThis.fetch = fetchMockAnthropic;
    await new AnthropicProvider(anthropicConfig()).generateText(SIMPLE_USER_MESSAGE, {
      temperature: 0.7,
      maxTokens: 500,
    });

    const openaiBody = JSON.parse(
      (fetchMockOpenAI.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as Record<string, unknown>;
    expect(openaiBody['temperature']).toBe(0.7);
    expect(openaiBody['max_tokens']).toBe(500);

    const anthropicBody = JSON.parse(
      (fetchMockAnthropic.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as Record<string, unknown>;
    expect(anthropicBody['temperature']).toBe(0.7);
    expect(anthropicBody['max_tokens']).toBe(500);
  });

  it('should pass stop sequences using provider-specific field names', async () => {
    const fetchMockOpenAI = vi
      .fn()
      .mockResolvedValue(jsonResponse(openaiChatResponse({ content: 'response' })));
    globalThis.fetch = fetchMockOpenAI;
    await new OpenAIProvider(openaiConfig()).generateText(SIMPLE_USER_MESSAGE, {
      stopSequences: ['END', 'STOP'],
    });

    const fetchMockAnthropic = vi
      .fn()
      .mockResolvedValue(jsonResponse(anthropicMessageResponse({ content: 'response' })));
    globalThis.fetch = fetchMockAnthropic;
    await new AnthropicProvider(anthropicConfig()).generateText(SIMPLE_USER_MESSAGE, {
      stopSequences: ['END', 'STOP'],
    });

    const openaiBody = JSON.parse(
      (fetchMockOpenAI.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as Record<string, unknown>;
    expect(openaiBody['stop']).toEqual(['END', 'STOP']);

    const anthropicBody = JSON.parse(
      (fetchMockAnthropic.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as Record<string, unknown>;
    expect(anthropicBody['stop_sequences']).toEqual(['END', 'STOP']);
  });
});

// ---------------------------------------------------------------------------
// 2. Consistent error handling behavior
// ---------------------------------------------------------------------------

describe('Cross-provider: error handling consistency', () => {
  it('should throw LLMAuthenticationError for 401 from both providers', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(openaiErrorResponse({ message: 'Invalid API key' }), 401));
    await expect(
      new OpenAIProvider(openaiConfig()).generateText(SIMPLE_USER_MESSAGE),
    ).rejects.toThrow(LLMAuthenticationError);

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(anthropicErrorResponse({ message: 'Invalid API key' }), 401));
    await expect(
      new AnthropicProvider(anthropicConfig()).generateText(SIMPLE_USER_MESSAGE),
    ).rejects.toThrow(LLMAuthenticationError);
  });

  it('should throw LLMRateLimitError for 429 with retry-after from both providers', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(openaiErrorResponse({ message: 'Rate limited' }), 429, { 'retry-after': '5' }),
      );
    const openaiErr = await new OpenAIProvider(openaiConfig())
      .generateText(SIMPLE_USER_MESSAGE)
      .catch((e: unknown) => e as LLMRateLimitError);
    expect(openaiErr).toBeInstanceOf(LLMRateLimitError);
    expect((openaiErr as LLMRateLimitError).retryAfterMs).toBe(5000);

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(anthropicErrorResponse({ message: 'Rate limited' }), 429, {
          'retry-after': '10',
        }),
      );
    const anthropicErr = await new AnthropicProvider(anthropicConfig())
      .generateText(SIMPLE_USER_MESSAGE)
      .catch((e: unknown) => e as LLMRateLimitError);
    expect(anthropicErr).toBeInstanceOf(LLMRateLimitError);
    expect((anthropicErr as LLMRateLimitError).retryAfterMs).toBe(10000);
  });

  it('should throw LLMContextLengthError for 400 context overflow from both providers', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse(
        openaiErrorResponse({
          message:
            'This model maximum context length is 128000 tokens. However, you requested 130000 tokens.',
          type: 'invalid_request_error',
        }),
        400,
      ),
    );
    const openaiErr = await new OpenAIProvider(openaiConfig())
      .generateText(SIMPLE_USER_MESSAGE)
      .catch((e: unknown) => e as LLMContextLengthError);
    expect(openaiErr).toBeInstanceOf(LLMContextLengthError);
    expect((openaiErr as LLMContextLengthError).maxTokens).toBe(128000);

    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse(
        anthropicErrorResponse({
          message: 'context length exceeded: maximum token limit is 200000, you requested 210000',
          type: 'invalid_request_error',
        }),
        400,
      ),
    );
    const anthropicErr = await new AnthropicProvider(anthropicConfig())
      .generateText(SIMPLE_USER_MESSAGE)
      .catch((e: unknown) => e as LLMContextLengthError);
    expect(anthropicErr).toBeInstanceOf(LLMContextLengthError);
  });

  it('should throw LLMProviderError for 500/502/503 from both providers', async () => {
    for (const status of [500, 502, 503]) {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(jsonResponse(openaiErrorResponse({ message: 'Server error' }), status));
      await expect(
        new OpenAIProvider(openaiConfig()).generateText(SIMPLE_USER_MESSAGE),
      ).rejects.toThrow(LLMProviderError);

      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          jsonResponse(anthropicErrorResponse({ message: 'Server error' }), status),
        );
      await expect(
        new AnthropicProvider(anthropicConfig()).generateText(SIMPLE_USER_MESSAGE),
      ).rejects.toThrow(LLMProviderError);
    }
  });

  it('should handle non-JSON error responses from both providers', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(textErrorResponse('Service unavailable', 503));
    await expect(
      new OpenAIProvider(openaiConfig()).generateText(SIMPLE_USER_MESSAGE),
    ).rejects.toThrow(LLMProviderError);

    globalThis.fetch = vi.fn().mockResolvedValue(textErrorResponse('Service unavailable', 503));
    await expect(
      new AnthropicProvider(anthropicConfig()).generateText(SIMPLE_USER_MESSAGE),
    ).rejects.toThrow(LLMProviderError);
  });

  it('should handle HTML error responses (proxy errors) from both providers', async () => {
    const html = '<html><body><h1>502 Bad Gateway</h1></body></html>';
    globalThis.fetch = vi.fn().mockResolvedValue(htmlErrorResponse(html, 502));
    await expect(
      new OpenAIProvider(openaiConfig()).generateText(SIMPLE_USER_MESSAGE),
    ).rejects.toThrow(LLMProviderError);

    globalThis.fetch = vi.fn().mockResolvedValue(htmlErrorResponse(html, 502));
    await expect(
      new AnthropicProvider(anthropicConfig()).generateText(SIMPLE_USER_MESSAGE),
    ).rejects.toThrow(LLMProviderError);
  });

  it('should handle network errors from both providers', async () => {
    const networkError = new TypeError('fetch failed');
    globalThis.fetch = vi.fn().mockRejectedValue(networkError);
    await expect(
      new OpenAIProvider(openaiConfig()).generateText(SIMPLE_USER_MESSAGE),
    ).rejects.toThrow(LLMProviderError);
    await expect(
      new AnthropicProvider(anthropicConfig()).generateText(SIMPLE_USER_MESSAGE),
    ).rejects.toThrow(LLMProviderError);
  });

  it('should handle AbortError from both providers', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    globalThis.fetch = vi.fn().mockRejectedValue(abortError);

    const openaiErr = await new OpenAIProvider(openaiConfig())
      .generateText(SIMPLE_USER_MESSAGE)
      .catch((e: unknown) => e as LLMProviderError);
    expect(openaiErr).toBeInstanceOf(LLMProviderError);
    expect((openaiErr as LLMProviderError).message).toContain('aborted');

    const anthropicErr = await new AnthropicProvider(anthropicConfig())
      .generateText(SIMPLE_USER_MESSAGE)
      .catch((e: unknown) => e as LLMProviderError);
    expect(anthropicErr).toBeInstanceOf(LLMProviderError);
    expect((anthropicErr as LLMProviderError).message).toContain('aborted');
  });
});

// ---------------------------------------------------------------------------
// 3. Consistent streaming behavior
// ---------------------------------------------------------------------------

describe('Cross-provider: streaming consistency', () => {
  it('should produce identical final content from streaming for both providers', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        sseResponse(
          openaiSSEStream([
            { content: 'Hello ' },
            { content: 'world' },
            {
              content: '',
              finishReason: 'stop',
              usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 },
            },
          ]),
        ),
      );
    const openaiResult = await (
      await new OpenAIProvider(openaiConfig()).generateStream(SIMPLE_USER_MESSAGE)
    ).toResponse();

    const events = anthropicStreamEvents(['Hello ', 'world'], { inputTokens: 5, outputTokens: 2 });
    globalThis.fetch = vi.fn().mockResolvedValue(sseResponse(anthropicSSEText(events)));
    const anthropicResult = await (
      await new AnthropicProvider(anthropicConfig()).generateStream(SIMPLE_USER_MESSAGE)
    ).toResponse();

    expect(openaiResult.content).toBe('Hello world');
    expect(anthropicResult.content).toBe('Hello world');
    expect(openaiResult.finishReason).toBe('stop');
    expect(anthropicResult.finishReason).toBe('stop');
    expect(openaiResult.tokenUsage.totalTokens).toBe(7);
    expect(anthropicResult.tokenUsage.totalTokens).toBe(7);
  });

  it('should yield chunks incrementally from both providers', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        sseResponse(
          openaiSSEStream([
            { content: 'chunk1' },
            { content: 'chunk2' },
            { content: 'chunk3' },
            {
              content: '',
              finishReason: 'stop',
              usage: { prompt_tokens: 3, completion_tokens: 3, total_tokens: 6 },
            },
          ]),
        ),
      );
    const openaiChunks: LLMStreamChunk[] = [];
    for await (const chunk of await new OpenAIProvider(openaiConfig()).generateStream(
      SIMPLE_USER_MESSAGE,
    )) {
      openaiChunks.push(chunk);
    }

    const events = anthropicStreamEvents(['chunk1', 'chunk2', 'chunk3'], {
      inputTokens: 3,
      outputTokens: 3,
    });
    globalThis.fetch = vi.fn().mockResolvedValue(sseResponse(anthropicSSEText(events)));
    const anthropicChunks: LLMStreamChunk[] = [];
    for await (const chunk of await new AnthropicProvider(anthropicConfig()).generateStream(
      SIMPLE_USER_MESSAGE,
    )) {
      anthropicChunks.push(chunk);
    }

    const openaiContent = openaiChunks.filter((c) => c.content !== '');
    const anthropicContent = anthropicChunks.filter((c) => c.content !== '');
    expect(openaiContent.map((c) => c.content)).toEqual(['chunk1', 'chunk2', 'chunk3']);
    expect(anthropicContent.map((c) => c.content)).toEqual(['chunk1', 'chunk2', 'chunk3']);
  });

  it('should handle 5-byte chunked SSE delivery from both providers', async () => {
    const openaiSSE = openaiSSEStream([
      { content: 'Hello' },
      {
        content: '',
        finishReason: 'stop',
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      },
    ]);
    globalThis.fetch = vi.fn().mockResolvedValue(chunkedSSEResponse(openaiSSE, 5));
    const openaiResult = await (
      await new OpenAIProvider(openaiConfig()).generateStream(SIMPLE_USER_MESSAGE)
    ).toResponse();

    const anthropicSSE = anthropicSSEText(
      anthropicStreamEvents(['Hello'], { inputTokens: 1, outputTokens: 1 }),
    );
    globalThis.fetch = vi.fn().mockResolvedValue(chunkedSSEResponse(anthropicSSE, 5));
    const anthropicResult = await (
      await new AnthropicProvider(anthropicConfig()).generateStream(SIMPLE_USER_MESSAGE)
    ).toResponse();

    expect(openaiResult.content).toBe('Hello');
    expect(anthropicResult.content).toBe('Hello');
  });
});

// ---------------------------------------------------------------------------
// 4. Provider identity and configuration
// ---------------------------------------------------------------------------

describe('Cross-provider: identity and configuration', () => {
  it('should report correct provider names', () => {
    const openai = new OpenAIProvider(openaiConfig());
    const anthropic = new AnthropicProvider(anthropicConfig());
    expect(openai.name).toBe('openai');
    expect(anthropic.name).toBe('anthropic');
  });

  it('should reject empty API keys from both providers', () => {
    expect(() => new OpenAIProvider(openaiConfig({ apiKey: '' }))).toThrow(LLMAuthenticationError);
    expect(() => new AnthropicProvider(anthropicConfig({ apiKey: '' }))).toThrow(
      LLMAuthenticationError,
    );
  });

  it('should reject whitespace-only API keys from both providers', () => {
    expect(() => new OpenAIProvider(openaiConfig({ apiKey: '   ' }))).toThrow(
      LLMAuthenticationError,
    );
    expect(() => new AnthropicProvider(anthropicConfig({ apiKey: '   ' }))).toThrow(
      LLMAuthenticationError,
    );
  });

  it('should use correct auth header format for each provider', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(openaiChatResponse({ content: 'ok' })));
    globalThis.fetch = fetchMock;
    await new OpenAIProvider(openaiConfig()).generateText(SIMPLE_USER_MESSAGE);
    const openaiHeaders = (fetchMock.mock.calls[0] as [string, RequestInit])[1].headers as Record<
      string,
      string
    >;
    expect(openaiHeaders['Authorization']).toBe('Bearer sk-test-key-1234567890abcdef');

    const fetchMock2 = vi
      .fn()
      .mockResolvedValue(jsonResponse(anthropicMessageResponse({ content: 'ok' })));
    globalThis.fetch = fetchMock2;
    await new AnthropicProvider(anthropicConfig()).generateText(SIMPLE_USER_MESSAGE);
    const anthropicHeaders = (fetchMock2.mock.calls[0] as [string, RequestInit])[1]
      .headers as Record<string, string>;
    expect(anthropicHeaders['x-api-key']).toBe('sk-ant-test-key-1234567890abcdef');
    expect(anthropicHeaders['anthropic-version']).toBe('2023-06-01');
  });

  it('should use correct API endpoints for each provider', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(openaiChatResponse({ content: 'ok' })));
    globalThis.fetch = fetchMock;
    await new OpenAIProvider(openaiConfig()).generateText(SIMPLE_USER_MESSAGE);
    expect((fetchMock.mock.calls[0] as [string])[0]).toBe(
      'https://api.openai.com/v1/chat/completions',
    );

    const fetchMock2 = vi
      .fn()
      .mockResolvedValue(jsonResponse(anthropicMessageResponse({ content: 'ok' })));
    globalThis.fetch = fetchMock2;
    await new AnthropicProvider(anthropicConfig()).generateText(SIMPLE_USER_MESSAGE);
    expect((fetchMock2.mock.calls[0] as [string])[0]).toBe('https://api.anthropic.com/v1/messages');
  });

  it('should support custom base URLs for both providers', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(openaiChatResponse({ content: 'ok' })));
    globalThis.fetch = fetchMock;
    await new OpenAIProvider(
      openaiConfig({ baseUrl: 'https://openai-proxy.example.com/v1' }),
    ).generateText(SIMPLE_USER_MESSAGE);
    expect((fetchMock.mock.calls[0] as [string])[0]).toContain('openai-proxy.example.com');

    const fetchMock2 = vi
      .fn()
      .mockResolvedValue(jsonResponse(anthropicMessageResponse({ content: 'ok' })));
    globalThis.fetch = fetchMock2;
    await new AnthropicProvider(
      anthropicConfig({ baseUrl: 'https://anthropic-proxy.example.com' }),
    ).generateText(SIMPLE_USER_MESSAGE);
    expect((fetchMock2.mock.calls[0] as [string])[0]).toContain('anthropic-proxy.example.com');
  });
});

// ---------------------------------------------------------------------------
// 5. Provider-specific features
// ---------------------------------------------------------------------------

describe('Cross-provider: provider-specific features', () => {
  it('should handle Anthropic system message extraction', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(anthropicMessageResponse({ content: 'response' })));
    globalThis.fetch = fetchMock;
    await new AnthropicProvider(anthropicConfig()).generateText([
      systemMessage('You are helpful'),
      systemMessage('You are concise'),
      userMessage('Hi'),
    ]);
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as Record<string, unknown>;
    expect(body['system']).toBe('You are helpful\n\nYou are concise');
    expect((body['messages'] as unknown[]).length).toBe(1);
  });

  it('should handle OpenAI tool role mapping', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(openaiChatResponse({ content: '42' })));
    globalThis.fetch = fetchMock;
    await new OpenAIProvider(openaiConfig()).generateText([
      userMessage('Calc'),
      toolMessage('42', 'calc'),
    ]);
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as Record<string, unknown>;
    const msgs = body['messages'] as { role: string; name?: string }[];
    expect(msgs[1]!.role).toBe('tool');
    expect(msgs[1]!.name).toBe('calc');
  });

  it('should handle Anthropic tool role mapping to user', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(anthropicMessageResponse({ content: '42' })));
    globalThis.fetch = fetchMock;
    await new AnthropicProvider(anthropicConfig()).generateText([
      userMessage('Calc'),
      toolMessage('42', 'calc'),
    ]);
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as Record<string, unknown>;
    const msgs = body['messages'] as { role: string }[];
    expect(msgs[1]!.role).toBe('user');
  });

  it('should handle Anthropic 529 overloaded error', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          anthropicErrorResponse({ message: 'Overloaded', type: 'overloaded_error' }),
          529,
        ),
      );
    const err = await new AnthropicProvider(anthropicConfig())
      .generateText(SIMPLE_USER_MESSAGE)
      .catch((e: unknown) => e as LLMProviderError);
    expect(err).toBeInstanceOf(LLMProviderError);
    expect(err.statusCode).toBe(529);
  });

  it('should set Anthropic default max_tokens to 4096', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(anthropicMessageResponse({ content: 'ok' })));
    globalThis.fetch = fetchMock;
    await new AnthropicProvider(anthropicConfig()).generateText(SIMPLE_USER_MESSAGE);
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as Record<string, unknown>;
    expect(body['max_tokens']).toBe(4096);
  });

  it('should set OpenAI stream_options in streaming requests', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        sseResponse(
          openaiSSEStream([
            {
              content: 'Hi',
              finishReason: 'stop',
              usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
            },
          ]),
        ),
      );
    globalThis.fetch = fetchMock;
    await new OpenAIProvider(openaiConfig()).generateStream(SIMPLE_USER_MESSAGE);
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as Record<string, unknown>;
    expect(body['stream']).toBe(true);
    expect(body['stream_options']).toEqual({ include_usage: true });
  });
});

// ---------------------------------------------------------------------------
// 6. Finish reason normalization
// ---------------------------------------------------------------------------

describe('Cross-provider: finish reason normalization', () => {
  it('should normalize stop from OpenAI and end_turn from Anthropic to stop', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(openaiChatResponse({ finishReason: 'stop' })));
    expect(
      (await new OpenAIProvider(openaiConfig()).generateText(SIMPLE_USER_MESSAGE)).finishReason,
    ).toBe('stop');

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(anthropicMessageResponse({ stopReason: 'end_turn' })));
    expect(
      (await new AnthropicProvider(anthropicConfig()).generateText(SIMPLE_USER_MESSAGE))
        .finishReason,
    ).toBe('stop');
  });

  it('should normalize length from OpenAI and max_tokens from Anthropic to length', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(openaiChatResponse({ finishReason: 'length' })));
    expect(
      (await new OpenAIProvider(openaiConfig()).generateText(SIMPLE_USER_MESSAGE)).finishReason,
    ).toBe('length');

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(anthropicMessageResponse({ stopReason: 'max_tokens' })));
    expect(
      (await new AnthropicProvider(anthropicConfig()).generateText(SIMPLE_USER_MESSAGE))
        .finishReason,
    ).toBe('length');
  });

  it('should handle null finish reasons from both providers as unknown', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: 'ok' }, finish_reason: null }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }),
    );
    expect(
      (await new OpenAIProvider(openaiConfig()).generateText(SIMPLE_USER_MESSAGE)).finishReason,
    ).toBe('unknown');

    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        content: [{ type: 'text', text: 'ok' }],
        stop_reason: null,
        usage: { input_tokens: 1, output_tokens: 1 },
      }),
    );
    expect(
      (await new AnthropicProvider(anthropicConfig()).generateText(SIMPLE_USER_MESSAGE))
        .finishReason,
    ).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// 7. Realistic API response shapes
// ---------------------------------------------------------------------------

describe('Cross-provider: realistic API response shapes', () => {
  it('should handle OpenAI response with all standard fields', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        id: 'chatcmpl-ABC123xyz',
        object: 'chat.completion',
        created: 1711000000,
        model: 'gpt-4o-2024-11-20',
        choices: [
          {
            message: { content: 'Full response', role: 'assistant' },
            finish_reason: 'stop',
            index: 0,
            logprobs: null,
          },
        ],
        usage: {
          prompt_tokens: 25,
          completion_tokens: 10,
          total_tokens: 35,
          completion_tokens_details: { reasoning_tokens: 0 },
        },
        system_fingerprint: 'fp_abc123',
      }),
    );
    const result = await new OpenAIProvider(openaiConfig()).generateText(SIMPLE_USER_MESSAGE);
    expect(result.content).toBe('Full response');
    expect(result.tokenUsage).toEqual({ promptTokens: 25, completionTokens: 10, totalTokens: 35 });
  });

  it('should handle Anthropic response with cache token fields', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        id: 'msg_01ABC123xyz',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Full response' }],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 25,
          output_tokens: 10,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      }),
    );
    const result = await new AnthropicProvider(anthropicConfig()).generateText(SIMPLE_USER_MESSAGE);
    expect(result.content).toBe('Full response');
    expect(result.tokenUsage).toEqual({ promptTokens: 25, completionTokens: 10, totalTokens: 35 });
  });

  it('should handle Anthropic response with non-text content blocks', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        content: [{ type: 'tool_use', id: 'toolu_01', name: 'search', input: { query: 'test' } }],
        stop_reason: 'tool_use',
        usage: { input_tokens: 20, output_tokens: 15 },
      }),
    );
    const result = await new AnthropicProvider(anthropicConfig()).generateText(SIMPLE_USER_MESSAGE);
    expect(result.content).toBe('');
    expect(result.finishReason).toBe('tool_use');
  });

  it('should handle Anthropic response with mixed text and tool_use blocks', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        content: [
          { type: 'text', text: 'Let me search for that.' },
          { type: 'tool_use', id: 'toolu_01', name: 'search', input: { query: 'test' } },
        ],
        stop_reason: 'tool_use',
        usage: { input_tokens: 20, output_tokens: 25 },
      }),
    );
    const result = await new AnthropicProvider(anthropicConfig()).generateText(SIMPLE_USER_MESSAGE);
    expect(result.content).toBe('Let me search for that.');
  });
});

// ---------------------------------------------------------------------------
// 8. Streaming finish reason normalization
// ---------------------------------------------------------------------------

describe('Cross-provider: streaming finish reason normalization', () => {
  it('should normalize streaming stop from OpenAI', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        sseResponse(
          openaiSSEStream([
            {
              content: 'ok',
              finishReason: 'stop',
              usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
            },
          ]),
        ),
      );
    const result = await (
      await new OpenAIProvider(openaiConfig()).generateStream(SIMPLE_USER_MESSAGE)
    ).toResponse();
    expect(result.finishReason).toBe('stop');
  });

  it('should normalize streaming end_turn from Anthropic to stop', async () => {
    const events = anthropicStreamEvents(['ok'], {
      inputTokens: 1,
      outputTokens: 1,
      stopReason: 'end_turn',
    });
    globalThis.fetch = vi.fn().mockResolvedValue(sseResponse(anthropicSSEText(events)));
    const result = await (
      await new AnthropicProvider(anthropicConfig()).generateStream(SIMPLE_USER_MESSAGE)
    ).toResponse();
    expect(result.finishReason).toBe('stop');
  });

  it('should normalize streaming length from OpenAI', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        sseResponse(
          openaiSSEStream([
            {
              content: 'truncated',
              finishReason: 'length',
              usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
            },
          ]),
        ),
      );
    const result = await (
      await new OpenAIProvider(openaiConfig()).generateStream(SIMPLE_USER_MESSAGE)
    ).toResponse();
    expect(result.finishReason).toBe('length');
  });

  it('should normalize streaming max_tokens from Anthropic to length', async () => {
    const events = anthropicStreamEvents(['truncated'], {
      inputTokens: 1,
      outputTokens: 1,
      stopReason: 'max_tokens',
    });
    globalThis.fetch = vi.fn().mockResolvedValue(sseResponse(anthropicSSEText(events)));
    const result = await (
      await new AnthropicProvider(anthropicConfig()).generateStream(SIMPLE_USER_MESSAGE)
    ).toResponse();
    expect(result.finishReason).toBe('length');
  });
});
