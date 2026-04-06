import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  LLMAuthenticationError,
  LLMContextLengthError,
  LLMProviderError,
  LLMRateLimitError,
} from '../../../src/errors/llm-errors.js';
import {
  OpenAIProvider,
  createOpenAIProvider,
} from '../../../src/llm/providers/openai-provider.js';
import type { LLMProviderConfig, LLMStreamChunk } from '../../../src/types/llm.js';
import { LLMRole } from '../../../src/types/llm.js';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const TEST_API_KEY = 'sk-test-key-1234567890abcdef';
const TEST_MODEL = 'gpt-4o';

function makeConfig(overrides?: Partial<LLMProviderConfig>): LLMProviderConfig {
  return {
    provider: 'openai',
    modelId: TEST_MODEL,
    apiKey: TEST_API_KEY,
    ...overrides,
  };
}

function makeChatResponse(
  content: string,
  finishReason = 'stop',
  usage = { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
) {
  return {
    choices: [
      {
        message: { content, role: 'assistant' },
        finish_reason: finishReason,
        index: 0,
      },
    ],
    usage,
    model: TEST_MODEL,
  };
}

function makeSSELines(
  chunks: Array<{
    content?: string;
    finish_reason?: string | null;
    usage?: Record<string, number> | null;
  }>,
): string {
  const lines: string[] = [];
  for (const chunk of chunks) {
    const data = {
      choices: [
        {
          delta: { content: chunk.content ?? '' },
          finish_reason: chunk.finish_reason ?? null,
          index: 0,
        },
      ],
      usage: chunk.usage ?? null,
    };
    lines.push(`data: ${JSON.stringify(data)}\n\n`);
  }
  lines.push('data: [DONE]\n\n');
  return lines.join('');
}

function makeStreamResponse(sseText: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sseText));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

function makeJsonResponse(body: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OpenAIProvider', () => {
  let originalFetch: typeof globalThis.fetch;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    originalEnv = process.env['OPENAI_API_KEY'];
    delete process.env['OPENAI_API_KEY'];
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalEnv !== undefined) {
      process.env['OPENAI_API_KEY'] = originalEnv;
    } else {
      delete process.env['OPENAI_API_KEY'];
    }
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Construction
  // -------------------------------------------------------------------------

  describe('constructor', () => {
    it('should create provider with valid config', () => {
      const provider = new OpenAIProvider(makeConfig());
      expect(provider.name).toBe('openai');
      expect(provider.modelId).toBe(TEST_MODEL);
    });

    it('should use default maxRetries and timeout', () => {
      const provider = new OpenAIProvider(makeConfig());
      expect(provider.maxRetries).toBe(3);
      expect(provider.timeout).toBe(30_000);
    });

    it('should accept custom maxRetries and timeout', () => {
      const provider = new OpenAIProvider(makeConfig({ maxRetries: 5, timeout: 60_000 }));
      expect(provider.maxRetries).toBe(5);
      expect(provider.timeout).toBe(60_000);
    });

    it('should throw LLMAuthenticationError when API key is missing', () => {
      expect(() => new OpenAIProvider({ provider: 'openai', modelId: TEST_MODEL })).toThrow(
        LLMAuthenticationError,
      );
    });

    it('should throw LLMAuthenticationError when API key is empty', () => {
      expect(() => new OpenAIProvider(makeConfig({ apiKey: '' }))).toThrow(LLMAuthenticationError);
    });

    it('should throw LLMAuthenticationError when API key is whitespace', () => {
      expect(() => new OpenAIProvider(makeConfig({ apiKey: '   ' }))).toThrow(
        LLMAuthenticationError,
      );
    });

    it('should read API key from OPENAI_API_KEY env var when not in config', () => {
      process.env['OPENAI_API_KEY'] = 'sk-env-key';
      const provider = new OpenAIProvider({ provider: 'openai', modelId: TEST_MODEL });
      expect(provider.name).toBe('openai');
    });

    it('should prefer config API key over env var', () => {
      process.env['OPENAI_API_KEY'] = 'sk-env-key';
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig({ apiKey: 'sk-config-key' }));
      void provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      // Verify the config key is used in the Authorization header
      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = callArgs[1].headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer sk-config-key');
    });

    it('should use custom baseUrl when provided', () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(
        makeConfig({ baseUrl: 'https://custom-api.example.com/v1' }),
      );
      void provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(callArgs[0]).toBe('https://custom-api.example.com/v1/chat/completions');
    });

    it('should use default OpenAI base URL when none provided', () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      void provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(callArgs[0]).toBe('https://api.openai.com/v1/chat/completions');
    });

    it('should set provider name to openai regardless of config.provider', () => {
      const provider = new OpenAIProvider(makeConfig({ provider: 'something-else' }));
      expect(provider.name).toBe('openai');
    });
  });

  // -------------------------------------------------------------------------
  // generateText
  // -------------------------------------------------------------------------

  describe('generateText', () => {
    it('should send correct request to Chat Completions API', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeChatResponse('Hello world')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.SYSTEM, content: 'You are helpful.' },
        { role: LLMRole.USER, content: 'Say hello' },
      ]);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.openai.com/v1/chat/completions');
      expect(init.method).toBe('POST');

      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(body['model']).toBe(TEST_MODEL);
      expect(body['messages']).toEqual([
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Say hello' },
      ]);
      expect(body['stream']).toBeUndefined();
    });

    it('should return correct LLMResponse from API', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          makeChatResponse('Hello!', 'stop', {
            prompt_tokens: 20,
            completion_tokens: 3,
            total_tokens: 23,
          }),
        ),
      );

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'Hi' }]);

      expect(result.content).toBe('Hello!');
      expect(result.finishReason).toBe('stop');
      expect(result.tokenUsage).toEqual({
        promptTokens: 20,
        completionTokens: 3,
        totalTokens: 23,
      });
    });

    it('should pass temperature option', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], { temperature: 0.5 });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['temperature']).toBe(0.5);
    });

    it('should pass maxTokens as max_tokens', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], { maxTokens: 256 });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['max_tokens']).toBe(256);
    });

    it('should pass stopSequences as stop', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], {
        stopSequences: ['END', '###'],
      });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['stop']).toEqual(['END', '###']);
    });

    it('should not include stop when stopSequences is empty', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], { stopSequences: [] });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['stop']).toBeUndefined();
    });

    it('should map all LLMRole values correctly', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.SYSTEM, content: 'system msg' },
        { role: LLMRole.USER, content: 'user msg' },
        { role: LLMRole.ASSISTANT, content: 'assistant msg' },
        { role: LLMRole.TOOL, content: 'tool msg', name: 'myTool' },
      ]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      const messages = body['messages'] as Array<{ role: string; content: string; name?: string }>;

      expect(messages[0]).toEqual({ role: 'system', content: 'system msg' });
      expect(messages[1]).toEqual({ role: 'user', content: 'user msg' });
      expect(messages[2]).toEqual({ role: 'assistant', content: 'assistant msg' });
      expect(messages[3]).toEqual({ role: 'tool', content: 'tool msg', name: 'myTool' });
    });

    it('should handle null content in response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({
          choices: [{ message: { content: null }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
        }),
      );

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      expect(result.content).toBe('');
    });

    it('should handle missing usage in response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({
          choices: [{ message: { content: 'hi' }, finish_reason: 'stop' }],
        }),
      );

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      expect(result.tokenUsage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });

    it('should throw when response has no choices', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({
          choices: [],
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        }),
      );

      const provider = new OpenAIProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow('no choices');
    });

    it('should send Authorization header with Bearer token', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const headers = (fetchMock.mock.calls[0] as [string, RequestInit])[1].headers as Record<
        string,
        string
      >;
      expect(headers['Authorization']).toBe(`Bearer ${TEST_API_KEY}`);
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should merge default options with per-call options', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(
        makeConfig({ defaultOptions: { temperature: 0.7, maxTokens: 1024 } }),
      );
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], { temperature: 0.3 });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['temperature']).toBe(0.3);
      expect(body['max_tokens']).toBe(1024);
    });

    it('should validate messages (inherited from BaseLLMProvider)', async () => {
      const provider = new OpenAIProvider(makeConfig());
      await expect(provider.generateText([])).rejects.toThrow('Messages array must not be empty');
    });

    it('should reject messages without USER or SYSTEM role', async () => {
      const provider = new OpenAIProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.ASSISTANT, content: 'test' }]),
      ).rejects.toThrow('at least one USER or SYSTEM message');
    });
  });

  // -------------------------------------------------------------------------
  // generateStream
  // -------------------------------------------------------------------------

  describe('generateStream', () => {
    it('should return a stream response that can be iterated', async () => {
      const sseText = makeSSELines([
        { content: 'Hello' },
        { content: ' world' },
        {
          content: '!',
          finish_reason: 'stop',
          usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
        },
      ]);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);

      const chunks: LLMStreamChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThanOrEqual(3);
      const content = chunks.map((c) => c.content).join('');
      expect(content).toBe('Hello world!');
    });

    it('should collect stream into response via toResponse()', async () => {
      const sseText = makeSSELines([
        { content: 'Hello' },
        { content: ' world' },
        {
          content: '!',
          finish_reason: 'stop',
          usage: { prompt_tokens: 10, completion_tokens: 3, total_tokens: 13 },
        },
      ]);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);

      const response = await stream.toResponse();
      expect(response.content).toBe('Hello world!');
      expect(response.finishReason).toBe('stop');
      expect(response.tokenUsage).toEqual({
        promptTokens: 10,
        completionTokens: 3,
        totalTokens: 13,
      });
    });

    it('should set stream=true and stream_options in request body', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(
          makeStreamResponse(makeSSELines([{ content: 'ok', finish_reason: 'stop' }])),
        );
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);
      await stream.toResponse();

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['stream']).toBe(true);
      expect(body['stream_options']).toEqual({ include_usage: true });
    });

    it('should handle empty content chunks', async () => {
      const sseText = makeSSELines([
        { content: '' },
        { content: 'Hello' },
        { content: '', finish_reason: 'stop' },
      ]);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);
      const response = await stream.toResponse();
      expect(response.content).toBe('Hello');
    });

    it('should throw when streaming response has no body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);

      await expect(stream.toResponse()).rejects.toThrow('no body');
    });

    it('should handle SSE comments (lines starting with :)', async () => {
      const encoder = new TextEncoder();
      const sseLines = `: this is a comment\ndata: ${JSON.stringify({
        choices: [{ delta: { content: 'Hi' }, finish_reason: 'stop', index: 0 }],
        usage: null,
      })}\n\ndata: [DONE]\n\n`;

      const readableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(sseLines));
          controller.close();
        },
      });

      globalThis.fetch = vi.fn().mockResolvedValue(new Response(readableStream, { status: 200 }));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);
      const response = await stream.toResponse();
      expect(response.content).toBe('Hi');
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('should throw LLMAuthenticationError on 401', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse(
            { error: { message: 'Incorrect API key', type: 'invalid_request_error' } },
            401,
          ),
        );

      const provider = new OpenAIProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(LLMAuthenticationError);
    });

    it('should throw LLMRateLimitError on 429', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse(
            { error: { message: 'Rate limit exceeded', type: 'rate_limit_error' } },
            429,
            { 'retry-after': '2.5' },
          ),
        );

      const provider = new OpenAIProvider(makeConfig());
      try {
        await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMRateLimitError);
        const rlError = error as LLMRateLimitError;
        expect(rlError.retryAfterMs).toBe(2500);
      }
    });

    it('should handle 429 without retry-after header', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse({ error: { message: 'Rate limit exceeded' } }, 429));

      const provider = new OpenAIProvider(makeConfig());
      try {
        await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMRateLimitError);
        const rlError = error as LLMRateLimitError;
        expect(rlError.retryAfterMs).toBeUndefined();
      }
    });

    it('should throw LLMContextLengthError on context overflow', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          {
            error: {
              message:
                "This model's maximum context length is 128000 tokens. However, you requested 130000 tokens.",
              type: 'invalid_request_error',
            },
          },
          400,
        ),
      );

      const provider = new OpenAIProvider(makeConfig());
      try {
        await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMContextLengthError);
        const ctxError = error as LLMContextLengthError;
        expect(ctxError.maxTokens).toBe(128000);
        expect(ctxError.requestTokens).toBe(130000);
      }
    });

    it('should throw LLMContextLengthError on too many tokens error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          {
            error: {
              message: 'Request too large: too many tokens in the request.',
              type: 'invalid_request_error',
            },
          },
          400,
        ),
      );

      const provider = new OpenAIProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(LLMContextLengthError);
    });

    it('should throw LLMProviderError on generic 400', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse(
            { error: { message: 'Invalid parameter', type: 'invalid_request_error' } },
            400,
          ),
        );

      const provider = new OpenAIProvider(makeConfig());
      try {
        await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMProviderError);
        expect(error).not.toBeInstanceOf(LLMContextLengthError);
      }
    });

    it('should throw LLMProviderError on 403', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse({ error: { message: 'Access denied' } }, 403));

      const provider = new OpenAIProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(LLMProviderError);
    });

    it('should throw LLMProviderError on 404', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse({ error: { message: 'Model not found' } }, 404));

      const provider = new OpenAIProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow('not found');
    });

    it('should throw LLMProviderError on 500 server error', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse({ error: { message: 'Internal server error' } }, 500));

      const provider = new OpenAIProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow('server error');
    });

    it('should throw LLMProviderError on 502 gateway error', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse({ error: { message: 'Bad gateway' } }, 502));

      const provider = new OpenAIProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow('server error');
    });

    it('should throw LLMProviderError on 503 service unavailable', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse({ error: { message: 'Service temporarily unavailable' } }, 503),
        );

      const provider = new OpenAIProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow('server error');
    });

    it('should handle error response with invalid JSON body', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          new Response('not json', { status: 500, statusText: 'Internal Server Error' }),
        );

      const provider = new OpenAIProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(LLMProviderError);
    });

    it('should throw LLMProviderError on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const provider = new OpenAIProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow('Network error');
    });

    it('should throw LLMProviderError on abort', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      const provider = new OpenAIProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow('aborted');
    });

    it('should handle non-Error thrown values during fetch', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue('string error');

      const provider = new OpenAIProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(LLMProviderError);
    });

    it('should handle unknown status codes', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse({ error: { message: 'Some weird error' } }, 418));

      const provider = new OpenAIProvider(makeConfig());
      try {
        await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMProviderError);
        expect((error as LLMProviderError).statusCode).toBe(418);
      }
    });
  });

  // -------------------------------------------------------------------------
  // AbortSignal support
  // -------------------------------------------------------------------------

  describe('AbortSignal support', () => {
    it('should pass AbortSignal to fetch', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const controller = new AbortController();
      const provider = new OpenAIProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], {
        signal: controller.signal,
      });

      const callInit = (fetchMock.mock.calls[0] as [string, RequestInit])[1];
      expect(callInit.signal).toBe(controller.signal);
    });
  });

  // -------------------------------------------------------------------------
  // createOpenAIProvider factory
  // -------------------------------------------------------------------------

  describe('createOpenAIProvider', () => {
    it('should create an OpenAIProvider instance', () => {
      const provider = createOpenAIProvider(makeConfig());
      expect(provider).toBeInstanceOf(OpenAIProvider);
      expect(provider.name).toBe('openai');
    });

    it('should pass config to OpenAIProvider constructor', () => {
      const provider = createOpenAIProvider(makeConfig({ modelId: 'gpt-4o-mini', maxRetries: 5 }));
      expect(provider.modelId).toBe('gpt-4o-mini');
      expect(provider.maxRetries).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  // Integration with provider registry
  // -------------------------------------------------------------------------

  describe('registry integration', () => {
    it('should work with LLMProviderRegistry', async () => {
      const { LLMProviderRegistry } = await import('../../../src/llm/provider-registry.js');

      const registry = new LLMProviderRegistry();
      registry.register('openai', createOpenAIProvider);

      const provider = registry.create(makeConfig());
      expect(provider).toBeInstanceOf(OpenAIProvider);
      expect(provider.name).toBe('openai');
    });
  });

  // -------------------------------------------------------------------------
  // Streaming edge cases
  // -------------------------------------------------------------------------

  describe('streaming edge cases', () => {
    it('should handle chunked SSE delivery (split across reads)', async () => {
      const encoder = new TextEncoder();
      const chunk1Text = `data: ${JSON.stringify({
        choices: [{ delta: { content: 'Hel' }, finish_reason: null, index: 0 }],
        usage: null,
      })}\n\n`;
      const chunk2Text = `data: ${JSON.stringify({
        choices: [{ delta: { content: 'lo' }, finish_reason: 'stop', index: 0 }],
        usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 },
      })}\n\ndata: [DONE]\n\n`;

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(chunk1Text));
          controller.enqueue(encoder.encode(chunk2Text));
          controller.close();
        },
      });

      globalThis.fetch = vi.fn().mockResolvedValue(new Response(stream, { status: 200 }));

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);
      const response = await result.toResponse();
      expect(response.content).toBe('Hello');
    });

    it('should handle SSE line split across multiple reads', async () => {
      const encoder = new TextEncoder();
      const dataLine = `data: ${JSON.stringify({
        choices: [{ delta: { content: 'OK' }, finish_reason: 'stop', index: 0 }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      })}`;
      const half1 = dataLine.slice(0, Math.floor(dataLine.length / 2));
      const half2 = dataLine.slice(Math.floor(dataLine.length / 2));

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(half1));
          controller.enqueue(encoder.encode(half2 + '\n\ndata: [DONE]\n\n'));
          controller.close();
        },
      });

      globalThis.fetch = vi.fn().mockResolvedValue(new Response(stream, { status: 200 }));

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);
      const response = await result.toResponse();
      expect(response.content).toBe('OK');
    });

    it('should skip malformed JSON in SSE data', async () => {
      const encoder = new TextEncoder();
      const sseText = [
        `data: {invalid json}\n\n`,
        `data: ${JSON.stringify({
          choices: [{ delta: { content: 'Good' }, finish_reason: 'stop', index: 0 }],
          usage: null,
        })}\n\n`,
        `data: [DONE]\n\n`,
      ].join('');

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(sseText));
              controller.close();
            },
          }),
          { status: 200 },
        ),
      );

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);
      const response = await stream.toResponse();
      expect(response.content).toBe('Good');
    });

    it('should handle usage data on a separate chunk after finish_reason', async () => {
      const sseText = makeSSELines([{ content: 'data' }, { content: '', finish_reason: 'stop' }]);
      // Inject a usage-only chunk before [DONE]
      const modified = sseText.replace(
        'data: [DONE]',
        `data: ${JSON.stringify({
          choices: [],
          usage: { prompt_tokens: 8, completion_tokens: 1, total_tokens: 9 },
        })}\n\ndata: [DONE]`,
      );

      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(modified));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);
      const response = await stream.toResponse();
      expect(response.content).toBe('data');
      expect(response.tokenUsage.totalTokens).toBe(9);
    });
  });
});
