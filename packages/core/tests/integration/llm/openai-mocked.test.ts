import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  OpenAIProvider,
  createOpenAIProvider,
} from '../../../src/llm/providers/openai-provider.js';
import {
  LLMAuthenticationError,
  LLMContextLengthError,
  LLMProviderError,
  LLMRateLimitError,
} from '../../../src/errors/llm-errors.js';
import type { LLMProviderConfig, LLMStreamChunk } from '../../../src/types/llm.js';
import { LLMRole } from '../../../src/types/llm.js';

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const TEST_API_KEY = 'sk-test-key-1234567890abcdef';
const TEST_MODEL = 'gpt-4o';

function makeConfig(overrides?: Partial<LLMProviderConfig>): LLMProviderConfig {
  return { provider: 'openai', modelId: TEST_MODEL, apiKey: TEST_API_KEY, ...overrides };
}

function makeJsonResponse(body: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
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

function makeChunkedStreamResponse(sseText: string, chunkSize: number): Response {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(sseText);
  const stream = new ReadableStream({
    start(controller) {
      for (let i = 0; i < bytes.length; i += chunkSize) {
        controller.enqueue(bytes.slice(i, i + chunkSize));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
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

function makeAsyncReadableStream(
  deliverChunks: (controller: ReadableStreamDefaultController) => Promise<void>,
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      await deliverChunks(controller);
      controller.close();
    },
  });
}

const SIMPLE_MESSAGES = [{ role: LLMRole.USER as const, content: 'Hello' }];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OpenAIProvider — integration (mocked HTTP)', () => {
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
  // 1. Streaming SSE Edge Cases
  // -------------------------------------------------------------------------

  describe('streaming SSE edge cases', () => {
    it('should handle SSE data arriving in many small ReadableStream chunks', async () => {
      const sseText = makeSSELines([
        { content: 'The ' },
        { content: 'quick ' },
        { content: 'brown ' },
        {
          content: 'fox',
          finish_reason: 'stop',
          usage: { prompt_tokens: 4, completion_tokens: 4, total_tokens: 8 },
        },
      ]);
      globalThis.fetch = vi.fn().mockResolvedValue(makeChunkedStreamResponse(sseText, 10));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('The quick brown fox');
      expect(response.finishReason).toBe('stop');
      expect(response.tokenUsage.totalTokens).toBe(8);
    });

    it('should reassemble an SSE data line split exactly at the JSON boundary', async () => {
      const encoder = new TextEncoder();
      const jsonPayload = JSON.stringify({
        choices: [{ delta: { content: 'Split' }, finish_reason: 'stop', index: 0 }],
        usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 },
      });
      const fullLine = `data: ${jsonPayload}\n\ndata: [DONE]\n\n`;
      const splitAt = 6 + Math.floor(jsonPayload.length / 2);

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(fullLine.slice(0, splitAt)));
          controller.enqueue(encoder.encode(fullLine.slice(splitAt)));
          controller.close();
        },
      });
      globalThis.fetch = vi.fn().mockResolvedValue(new Response(stream, { status: 200 }));

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.generateStream(SIMPLE_MESSAGES);
      const resp = await result.toResponse();

      expect(resp.content).toBe('Split');
      expect(resp.tokenUsage.totalTokens).toBe(3);
    });

    it('should skip SSE comment lines interspersed with data', async () => {
      const jsonChunk = (c: string, fin: string | null = null) =>
        JSON.stringify({
          choices: [{ delta: { content: c }, finish_reason: fin, index: 0 }],
          usage: null,
        });

      const sseText = [
        `: keep-alive\n`,
        `data: ${jsonChunk('A')}\n\n`,
        `: another comment\n`,
        `: yet another comment\n`,
        `data: ${jsonChunk('B', 'stop')}\n\n`,
        `data: [DONE]\n\n`,
      ].join('');

      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('AB');
    });

    it('should treat empty lines as event delimiters without emitting chunks', async () => {
      const jsonChunk = JSON.stringify({
        choices: [{ delta: { content: 'X' }, finish_reason: 'stop', index: 0 }],
        usage: null,
      });
      const sseText = `\n\n\ndata: ${jsonChunk}\n\n\n\ndata: [DONE]\n\n`;

      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const chunks: LLMStreamChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0]!.content).toBe('X');
    });

    it('should skip malformed JSON in SSE data and continue with valid chunks', async () => {
      const goodChunk = JSON.stringify({
        choices: [{ delta: { content: 'Valid' }, finish_reason: 'stop', index: 0 }],
        usage: null,
      });

      const sseText = [
        `data: not-valid-json\n\n`,
        `data: {"incomplete\n\n`,
        `data: ${goodChunk}\n\n`,
        `data: [DONE]\n\n`,
      ].join('');

      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('Valid');
    });

    it('should throw LLMProviderError when streaming response has no body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);

      await expect(stream.toResponse()).rejects.toThrow(LLMProviderError);
      await expect(
        (async () => {
          globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
          const s = await provider.generateStream(SIMPLE_MESSAGES);
          return s.toResponse();
        })(),
      ).rejects.toThrow(/no body/i);
    });

    it('should handle unicode and multibyte content (emoji) in stream chunks', async () => {
      const sseText = makeSSELines([
        { content: '你好 ' },
        { content: '🌍🚀 ' },
        { content: 'café ñ', finish_reason: 'stop' },
      ]);
      globalThis.fetch = vi.fn().mockResolvedValue(makeChunkedStreamResponse(sseText, 15));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('你好 🌍🚀 café ñ');
    });

    it('should handle CJK characters delivered in tiny chunks', async () => {
      const sseText = makeSSELines([
        {
          content: '日本語テスト',
          finish_reason: 'stop',
          usage: { prompt_tokens: 1, completion_tokens: 6, total_tokens: 7 },
        },
      ]);
      globalThis.fetch = vi.fn().mockResolvedValue(makeChunkedStreamResponse(sseText, 5));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('日本語テスト');
      expect(response.tokenUsage.completionTokens).toBe(6);
    });

    it('should use the last finish_reason when multiple chunks carry it', async () => {
      const sseText = makeSSELines([
        { content: 'A', finish_reason: 'length' },
        { content: 'B', finish_reason: 'stop' },
      ]);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.finishReason).toBe('stop');
    });

    it('should capture usage data sent only in the final chunk', async () => {
      const chunks = [
        { content: 'Hello' },
        { content: ' there' },
        {
          content: '',
          finish_reason: 'stop' as const,
          usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 },
        },
      ];
      const sseText = makeSSELines(chunks);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('Hello there');
      expect(response.tokenUsage).toEqual({
        promptTokens: 12,
        completionTokens: 8,
        totalTokens: 20,
      });
    });

    it('should handle usage in a separate chunk after all content chunks', async () => {
      const sseText = [
        `data: ${JSON.stringify({
          choices: [{ delta: { content: 'Done' }, finish_reason: 'stop', index: 0 }],
          usage: null,
        })}\n\n`,
        `data: ${JSON.stringify({
          choices: [],
          usage: { prompt_tokens: 5, completion_tokens: 1, total_tokens: 6 },
        })}\n\n`,
        `data: [DONE]\n\n`,
      ].join('');

      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('Done');
      expect(response.tokenUsage.totalTokens).toBe(6);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Network Error Handling
  // -------------------------------------------------------------------------

  describe('network error handling', () => {
    it('should throw LLMProviderError with abort message when AbortSignal is pre-aborted', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      const controller = new AbortController();
      controller.abort();

      const provider = new OpenAIProvider(makeConfig());
      await expect(
        provider.generateText(SIMPLE_MESSAGES, { signal: controller.signal }),
      ).rejects.toThrow(/aborted/i);
    });

    it('should throw LLMProviderError when abort occurs during streaming read', async () => {
      const controller = new AbortController();
      const encoder = new TextEncoder();

      const stream = makeAsyncReadableStream(async (ctrl) => {
        ctrl.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              choices: [{ delta: { content: 'partial' }, finish_reason: null, index: 0 }],
              usage: null,
            })}\n\n`,
          ),
        );
        controller.abort();
        throw new DOMException('The operation was aborted', 'AbortError');
      });

      globalThis.fetch = vi.fn().mockResolvedValue(new Response(stream, { status: 200 }));

      const provider = new OpenAIProvider(makeConfig());
      const streamResp = await provider.generateStream(SIMPLE_MESSAGES, {
        signal: controller.signal,
      });

      await expect(streamResp.toResponse()).rejects.toThrow();
    });

    it('should throw LLMProviderError wrapping TypeError on DNS/network failure', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

      const provider = new OpenAIProvider(makeConfig());
      try {
        await provider.generateText(SIMPLE_MESSAGES);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMProviderError);
        const err = error as LLMProviderError;
        expect(err.message).toContain('Network error');
        expect(err.cause).toBeInstanceOf(TypeError);
      }
    });

    it('should throw LLMProviderError wrapping TypeError on connection refused', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const provider = new OpenAIProvider(makeConfig());
      await expect(provider.generateText(SIMPLE_MESSAGES)).rejects.toThrow(LLMProviderError);
    });

    it('should propagate abort error during generateStream fetch phase', async () => {
      const abortError = new DOMException('signal is aborted', 'AbortError');
      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      const provider = new OpenAIProvider(makeConfig());
      await expect(provider.generateStream(SIMPLE_MESSAGES)).rejects.toThrow(/aborted/i);
    });
  });

  // -------------------------------------------------------------------------
  // 3. HTTP Error Edge Cases
  // -------------------------------------------------------------------------

  describe('HTTP error edge cases', () => {
    it('should fallback to HTTP status message when error body is non-JSON', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
        }),
      );

      const provider = new OpenAIProvider(makeConfig());
      try {
        await provider.generateText(SIMPLE_MESSAGES);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMProviderError);
        const err = error as LLMProviderError;
        expect(err.message).toContain('500');
        expect(err.message).toContain('Internal Server Error');
      }
    });

    it('should use statusText when response body is empty on 500', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(new Response('', { status: 500, statusText: 'Server Down' }));

      const provider = new OpenAIProvider(makeConfig());
      try {
        await provider.generateText(SIMPLE_MESSAGES);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMProviderError);
        expect((error as LLMProviderError).statusCode).toBe(500);
      }
    });

    it('should throw LLMProviderError with status 403 on Forbidden', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          {
            error: {
              message: 'You do not have access to this resource',
              type: 'permission_error',
            },
          },
          403,
        ),
      );

      const provider = new OpenAIProvider(makeConfig());
      try {
        await provider.generateText(SIMPLE_MESSAGES);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMProviderError);
        expect(error).not.toBeInstanceOf(LLMAuthenticationError);
        expect((error as LLMProviderError).statusCode).toBe(403);
        expect((error as LLMProviderError).message).toContain('Access denied');
      }
    });

    it('should throw LLMProviderError with status 404 on Not Found', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse(
            { error: { message: 'The model gpt-5 does not exist', type: 'invalid_request_error' } },
            404,
          ),
        );

      const provider = new OpenAIProvider(makeConfig());
      try {
        await provider.generateText(SIMPLE_MESSAGES);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMProviderError);
        expect((error as LLMProviderError).statusCode).toBe(404);
        expect((error as LLMProviderError).message).toContain('not found');
      }
    });

    it('should throw generic LLMProviderError for non-standard status codes like 418', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse({ error: { message: "I'm a teapot" } }, 418));

      const provider = new OpenAIProvider(makeConfig());
      try {
        await provider.generateText(SIMPLE_MESSAGES);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMProviderError);
        expect(error).not.toBeInstanceOf(LLMAuthenticationError);
        expect(error).not.toBeInstanceOf(LLMRateLimitError);
        expect(error).not.toBeInstanceOf(LLMContextLengthError);
        expect((error as LLMProviderError).statusCode).toBe(418);
      }
    });

    it('should throw LLMProviderError for status 422 Unprocessable Entity', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse({ error: { message: 'Unprocessable' } }, 422));

      const provider = new OpenAIProvider(makeConfig());
      try {
        await provider.generateText(SIMPLE_MESSAGES);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMProviderError);
        expect((error as LLMProviderError).statusCode).toBe(422);
      }
    });

    it('should parse maxTokens and requestTokens from context length error message', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          {
            error: {
              message:
                "This model's maximum context length is 8192 tokens. However, you requested 12500 tokens (10500 in the messages, 2000 in the completion).",
              type: 'invalid_request_error',
            },
          },
          400,
        ),
      );

      const provider = new OpenAIProvider(makeConfig());
      try {
        await provider.generateText(SIMPLE_MESSAGES);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMContextLengthError);
        const ctxError = error as LLMContextLengthError;
        expect(ctxError.maxTokens).toBe(8192);
        expect(ctxError.requestTokens).toBe(12500);
        expect(ctxError.statusCode).toBe(400);
      }
    });

    it('should throw LLMContextLengthError without token counts when message only says too many tokens', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          {
            error: {
              message: 'Request has too many tokens.',
              type: 'invalid_request_error',
            },
          },
          400,
        ),
      );

      const provider = new OpenAIProvider(makeConfig());
      try {
        await provider.generateText(SIMPLE_MESSAGES);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMContextLengthError);
        const ctxError = error as LLMContextLengthError;
        expect(ctxError.maxTokens).toBeUndefined();
        expect(ctxError.requestTokens).toBeUndefined();
      }
    });

    it('should throw LLMAuthenticationError on 401 with JSON error body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          {
            error: {
              message: 'Invalid API key provided: sk-test*****def.',
              type: 'invalid_api_key',
            },
          },
          401,
        ),
      );

      const provider = new OpenAIProvider(makeConfig());
      try {
        await provider.generateText(SIMPLE_MESSAGES);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMAuthenticationError);
        expect((error as LLMAuthenticationError).statusCode).toBe(401);
        expect((error as LLMAuthenticationError).message).toContain('Authentication failed');
      }
    });

    it('should throw LLMRateLimitError with retryAfterMs parsed from retry-after header', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({ error: { message: 'Rate limit exceeded' } }, 429, {
          'retry-after': '3.0',
        }),
      );

      const provider = new OpenAIProvider(makeConfig());
      try {
        await provider.generateText(SIMPLE_MESSAGES);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMRateLimitError);
        expect((error as LLMRateLimitError).retryAfterMs).toBe(3000);
      }
    });

    it('should handle error responses during streaming (non-200 on initial fetch)', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse({ error: { message: 'Rate limited' } }, 429));

      const provider = new OpenAIProvider(makeConfig());
      await expect(provider.generateStream(SIMPLE_MESSAGES)).rejects.toThrow(LLMRateLimitError);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Request Building Verification
  // -------------------------------------------------------------------------

  describe('request building verification', () => {
    it('should include temperature in the request body when specified', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      await provider.generateText(SIMPLE_MESSAGES, { temperature: 0.9 });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['temperature']).toBe(0.9);
    });

    it('should not include temperature when not specified', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      await provider.generateText(SIMPLE_MESSAGES);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['temperature']).toBeUndefined();
    });

    it('should map maxTokens to max_tokens in request body', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      await provider.generateText(SIMPLE_MESSAGES, { maxTokens: 4096 });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['max_tokens']).toBe(4096);
      expect(body['maxTokens']).toBeUndefined();
    });

    it('should map stopSequences to stop in request body', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      await provider.generateText(SIMPLE_MESSAGES, { stopSequences: ['STOP', '###', '\n\n'] });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['stop']).toEqual(['STOP', '###', '\n\n']);
    });

    it('should not include stop field when stopSequences is an empty array', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      await provider.generateText(SIMPLE_MESSAGES, { stopSequences: [] });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['stop']).toBeUndefined();
    });

    it('should use custom baseUrl for API endpoint construction', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(
        makeConfig({ baseUrl: 'https://proxy.example.com/openai/v1' }),
      );
      await provider.generateText(SIMPLE_MESSAGES);

      const url = (fetchMock.mock.calls[0] as [string, RequestInit])[0];
      expect(url).toBe('https://proxy.example.com/openai/v1/chat/completions');
    });

    it('should forward AbortSignal to the underlying fetch call', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const controller = new AbortController();
      const provider = new OpenAIProvider(makeConfig());
      await provider.generateText(SIMPLE_MESSAGES, { signal: controller.signal });

      const init = (fetchMock.mock.calls[0] as [string, RequestInit])[1];
      expect(init.signal).toBe(controller.signal);
    });

    it('should include stream and stream_options in streaming request body', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(
          makeStreamResponse(makeSSELines([{ content: 'ok', finish_reason: 'stop' }])),
        );
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      await stream.toResponse();

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['stream']).toBe(true);
      expect(body['stream_options']).toEqual({ include_usage: true });
    });

    it('should not include stream fields in non-streaming request', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      await provider.generateText(SIMPLE_MESSAGES);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['stream']).toBeUndefined();
      expect(body['stream_options']).toBeUndefined();
    });

    it('should pass name field from messages when present', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.USER, content: 'Hi' },
        { role: LLMRole.TOOL, content: 'result', name: 'search_tool' },
      ]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      const messages = body['messages'] as Array<{ role: string; content: string; name?: string }>;
      expect(messages[0]!['name']).toBeUndefined();
      expect(messages[1]!['name']).toBe('search_tool');
    });

    it('should use correct model ID in request body', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OpenAIProvider(makeConfig({ modelId: 'gpt-4o-mini' }));
      await provider.generateText(SIMPLE_MESSAGES);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['model']).toBe('gpt-4o-mini');
    });
  });

  // -------------------------------------------------------------------------
  // 5. Response Parsing Edge Cases
  // -------------------------------------------------------------------------

  describe('response parsing edge cases', () => {
    it('should return empty string when response content is null', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({
          choices: [{ message: { content: null, role: 'assistant' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
        }),
      );

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.generateText(SIMPLE_MESSAGES);

      expect(result.content).toBe('');
    });

    it('should throw when response has empty choices array', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({
          choices: [],
          usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
        }),
      );

      const provider = new OpenAIProvider(makeConfig());
      await expect(provider.generateText(SIMPLE_MESSAGES)).rejects.toThrow(/no choices/i);
    });

    it('should default token usage to zeros when usage is missing', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({
          choices: [{ message: { content: 'response' }, finish_reason: 'stop' }],
        }),
      );

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.generateText(SIMPLE_MESSAGES);

      expect(result.tokenUsage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });

    it('should handle finish_reason of stop', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeChatResponse('ok', 'stop')));

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.generateText(SIMPLE_MESSAGES);

      expect(result.finishReason).toBe('stop');
    });

    it('should handle finish_reason of length', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeChatResponse('truncated output', 'length')));

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.generateText(SIMPLE_MESSAGES);

      expect(result.finishReason).toBe('length');
    });

    it('should handle finish_reason of content_filter', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeChatResponse('', 'content_filter')));

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.generateText(SIMPLE_MESSAGES);

      expect(result.finishReason).toBe('content_filter');
      expect(result.content).toBe('');
    });

    it('should handle null finish_reason by defaulting to unknown', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({
          choices: [{ message: { content: 'ok' }, finish_reason: null }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
      );

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.generateText(SIMPLE_MESSAGES);

      expect(result.finishReason).toBe('unknown');
    });
  });

  // -------------------------------------------------------------------------
  // 6. Chunked Stream Delivery
  // -------------------------------------------------------------------------

  describe('chunked stream delivery', () => {
    it('should produce correct output when SSE text is delivered in 10-byte chunks', async () => {
      const sseText = makeSSELines([
        { content: 'Hello, ' },
        { content: 'world! ' },
        {
          content: 'How are you?',
          finish_reason: 'stop',
          usage: { prompt_tokens: 3, completion_tokens: 5, total_tokens: 8 },
        },
      ]);
      globalThis.fetch = vi.fn().mockResolvedValue(makeChunkedStreamResponse(sseText, 10));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('Hello, world! How are you?');
      expect(response.finishReason).toBe('stop');
      expect(response.tokenUsage.totalTokens).toBe(8);
    });

    it('should produce correct output when SSE text is delivered in 1-byte chunks', async () => {
      const sseText = makeSSELines([
        {
          content: 'AB',
          finish_reason: 'stop',
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        },
      ]);
      globalThis.fetch = vi.fn().mockResolvedValue(makeChunkedStreamResponse(sseText, 1));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('AB');
    });

    it('should produce correct output when entire SSE is one giant chunk', async () => {
      const sseText = makeSSELines([
        { content: 'One ' },
        { content: 'big ' },
        { content: 'chunk', finish_reason: 'stop' },
      ]);
      globalThis.fetch = vi.fn().mockResolvedValue(makeChunkedStreamResponse(sseText, 100_000));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('One big chunk');
    });

    it('should handle chunks split mid-SSE-keyword (data: split between reads)', async () => {
      const encoder = new TextEncoder();
      const jsonPayload = JSON.stringify({
        choices: [{ delta: { content: 'Mid-split' }, finish_reason: 'stop', index: 0 }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      });

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('dat'));
          controller.enqueue(encoder.encode(`a: ${jsonPayload}\n\nda`));
          controller.enqueue(encoder.encode('ta: [DONE]\n\n'));
          controller.close();
        },
      });

      globalThis.fetch = vi.fn().mockResolvedValue(new Response(stream, { status: 200 }));

      const provider = new OpenAIProvider(makeConfig());
      const result = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await result.toResponse();

      expect(response.content).toBe('Mid-split');
    });

    it('should handle many small content chunks delivered in small byte-level increments', async () => {
      const contentChunks = Array.from({ length: 20 }, (_, i) => ({
        content: `w${String(i)} `,
        ...(i === 19 ? { finish_reason: 'stop' as const } : {}),
      }));
      const sseText = makeSSELines(contentChunks);
      globalThis.fetch = vi.fn().mockResolvedValue(makeChunkedStreamResponse(sseText, 12));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      const expectedContent = contentChunks.map((c) => c.content).join('');
      expect(response.content).toBe(expectedContent);
    });

    it('should collect all chunks via iteration and match toResponse content', async () => {
      const sseText = makeSSELines([
        { content: 'Part1 ' },
        { content: 'Part2 ' },
        {
          content: 'Part3',
          finish_reason: 'stop',
          usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
        },
      ]);

      globalThis.fetch = vi.fn().mockResolvedValue(makeChunkedStreamResponse(sseText, 20));

      const provider = new OpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const chunks: LLMStreamChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const content = chunks.map((c) => c.content).join('');
      expect(content).toBe('Part1 Part2 Part3');
      expect(chunks.length).toBeGreaterThanOrEqual(3);

      const lastChunk = chunks[chunks.length - 1]!;
      expect(lastChunk.finishReason).toBe('stop');
    });
  });

  // -------------------------------------------------------------------------
  // 7. Factory function integration
  // -------------------------------------------------------------------------

  describe('createOpenAIProvider factory', () => {
    it('should create a functional provider that can make requests', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeChatResponse('factory ok')));

      const provider = createOpenAIProvider(makeConfig());
      const result = await provider.generateText(SIMPLE_MESSAGES);

      expect(result.content).toBe('factory ok');
    });

    it('should create a provider that supports streaming', async () => {
      const sseText = makeSSELines([{ content: 'stream ok', finish_reason: 'stop' }]);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = createOpenAIProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('stream ok');
    });
  });
});
