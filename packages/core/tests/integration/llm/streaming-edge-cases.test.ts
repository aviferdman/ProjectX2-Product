/**
 * Streaming edge-case integration tests for LLM providers.
 *
 * Tests Unicode/multibyte handling, abort/cancellation, incomplete streams,
 * chunked delivery boundaries, and concurrent streams.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OpenAIProvider } from '../../../src/llm/providers/openai-provider.js';
import { AnthropicProvider } from '../../../src/llm/providers/anthropic-provider.js';
import { LLMProviderError } from '../../../src/errors/llm-errors.js';
import type { LLMMessage, LLMStreamChunk } from '../../../src/types/llm.js';
import { LLMRole } from '../../../src/types/llm.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OPENAI_KEY = 'sk-test-streaming-key';
const ANTHROPIC_KEY = 'sk-ant-test-streaming-key';
const USER_MSG: LLMMessage[] = [{ role: LLMRole.USER, content: 'Test' }];

// ---------------------------------------------------------------------------
// OpenAI SSE helpers
// ---------------------------------------------------------------------------

function openaiSSEChunk(content: string, finishReason: string | null = null): string {
  return `data: ${JSON.stringify({
    choices: [{ delta: { content }, finish_reason: finishReason }],
  })}\n\n`;
}

function openaiSSEFinalChunk(
  promptTokens: number,
  completionTokens: number,
  finishReason = 'stop',
): string {
  return `data: ${JSON.stringify({
    choices: [{ delta: { content: '' }, finish_reason: finishReason }],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  })}\n\n`;
}

// ---------------------------------------------------------------------------
// Anthropic SSE helpers
// ---------------------------------------------------------------------------

function anthropicSSEEvent(eventType: string, data: Record<string, unknown>): string {
  return `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
}

function anthropicStreamSSE(
  textChunks: string[],
  opts?: { inputTokens?: number; outputTokens?: number },
): string {
  const inputTokens = opts?.inputTokens ?? 10;
  const outputTokens = opts?.outputTokens ?? 5;

  let sse = '';
  sse += anthropicSSEEvent('message_start', {
    type: 'message_start',
    message: { usage: { input_tokens: inputTokens, output_tokens: 0 } },
  });
  sse += anthropicSSEEvent('content_block_start', {
    type: 'content_block_start',
    index: 0,
    content_block: { type: 'text', text: '' },
  });

  for (const chunk of textChunks) {
    sse += anthropicSSEEvent('content_block_delta', {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'text_delta', text: chunk },
    });
  }

  sse += anthropicSSEEvent('content_block_stop', {
    type: 'content_block_stop',
    index: 0,
  });
  sse += anthropicSSEEvent('message_delta', {
    type: 'message_delta',
    delta: { stop_reason: 'end_turn' },
    usage: { output_tokens: outputTokens },
  });
  sse += anthropicSSEEvent('message_stop', { type: 'message_stop' });

  return sse;
}

// ---------------------------------------------------------------------------
// Stream response factory
// ---------------------------------------------------------------------------

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

function makeDelayedStreamResponse(chunks: string[], delayMs: number): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, delayMs));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
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
// Unicode & multibyte
// ---------------------------------------------------------------------------

describe('Unicode and multibyte character handling', () => {
  it('should handle emoji in OpenAI streaming response', async () => {
    const provider = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    const sseText =
      openaiSSEChunk('Hello 🌍') + openaiSSEChunk(' 🎉🎊') + openaiSSEFinalChunk(10, 3);
    const done = 'data: [DONE]\n\n';

    globalThis.fetch = vi.fn().mockResolvedValueOnce(makeStreamResponse(sseText + done));

    const stream = await provider.generateStream(USER_MSG);
    const response = await stream.toResponse();
    expect(response.content).toBe('Hello 🌍 🎉🎊');
  });

  it('should handle emoji in Anthropic streaming response', async () => {
    const provider = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    const sseText = anthropicStreamSSE(['Hello 🌍', ' 🎉🎊']);
    globalThis.fetch = vi.fn().mockResolvedValueOnce(makeStreamResponse(sseText));

    const stream = await provider.generateStream(USER_MSG);
    const response = await stream.toResponse();
    expect(response.content).toBe('Hello 🌍 🎉🎊');
  });

  it('should handle CJK characters in OpenAI streaming', async () => {
    const provider = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    const sseText =
      openaiSSEChunk('你好') +
      openaiSSEChunk('世界') +
      openaiSSEChunk('！') +
      openaiSSEFinalChunk(10, 3);

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeStreamResponse(sseText + 'data: [DONE]\n\n'));

    const stream = await provider.generateStream(USER_MSG);
    const response = await stream.toResponse();
    expect(response.content).toBe('你好世界！');
  });

  it('should handle mixed scripts (Arabic + Latin) in Anthropic streaming', async () => {
    const provider = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    const sseText = anthropicStreamSSE(['مرحبا', ' Hello', ' مرحبا']);
    globalThis.fetch = vi.fn().mockResolvedValueOnce(makeStreamResponse(sseText));

    const stream = await provider.generateStream(USER_MSG);
    const response = await stream.toResponse();
    expect(response.content).toBe('مرحبا Hello مرحبا');
  });

  it('should handle emoji split across chunk boundaries in OpenAI', async () => {
    const provider = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    const sseText = openaiSSEChunk('🚀') + openaiSSEFinalChunk(10, 1);
    const full = sseText + 'data: [DONE]\n\n';

    // Use very small chunks to split multibyte at boundary
    globalThis.fetch = vi.fn().mockResolvedValueOnce(makeChunkedStreamResponse(full, 3));

    const stream = await provider.generateStream(USER_MSG);
    const response = await stream.toResponse();
    expect(response.content).toBe('🚀');
  });
});

// ---------------------------------------------------------------------------
// Abort / cancellation
// ---------------------------------------------------------------------------

describe('AbortSignal cancellation', () => {
  it('should abort OpenAI text generation with AbortSignal', async () => {
    const provider = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    const controller = new AbortController();
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    globalThis.fetch = vi.fn().mockRejectedValueOnce(abortError);

    controller.abort();

    await expect(provider.generateText(USER_MSG, { signal: controller.signal })).rejects.toThrow(
      LLMProviderError,
    );
  });

  it('should abort Anthropic text generation with AbortSignal', async () => {
    const provider = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    const abortError = new DOMException('The operation was aborted', 'AbortError');
    globalThis.fetch = vi.fn().mockRejectedValueOnce(abortError);

    const controller = new AbortController();
    controller.abort();

    await expect(provider.generateText(USER_MSG, { signal: controller.signal })).rejects.toThrow(
      /aborted/i,
    );
  });

  it('should pass AbortSignal to fetch for OpenAI streaming', async () => {
    const provider = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    const controller = new AbortController();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeStreamResponse(
          openaiSSEChunk('Hello') + openaiSSEFinalChunk(10, 1) + 'data: [DONE]\n\n',
        ),
      );
    globalThis.fetch = fetchMock;

    await provider.generateStream(USER_MSG, { signal: controller.signal });

    const fetchCall = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(fetchCall[1].signal).toBe(controller.signal);
  });
});

// ---------------------------------------------------------------------------
// Empty and edge-case responses
// ---------------------------------------------------------------------------

describe('Empty and edge-case stream responses', () => {
  it('should handle OpenAI stream with empty content chunks', async () => {
    const provider = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    const sseText =
      openaiSSEChunk('') +
      openaiSSEChunk('Hello') +
      openaiSSEChunk('') +
      openaiSSEFinalChunk(10, 1) +
      'data: [DONE]\n\n';

    globalThis.fetch = vi.fn().mockResolvedValueOnce(makeStreamResponse(sseText));

    const stream = await provider.generateStream(USER_MSG);
    const response = await stream.toResponse();
    expect(response.content).toBe('Hello');
  });

  it('should handle Anthropic stream with only message_start and message_stop', async () => {
    const provider = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    // Stream with no text content — only structural events
    let sse = '';
    sse += anthropicSSEEvent('message_start', {
      type: 'message_start',
      message: { usage: { input_tokens: 5, output_tokens: 0 } },
    });
    sse += anthropicSSEEvent('message_delta', {
      type: 'message_delta',
      delta: { stop_reason: 'end_turn' },
      usage: { output_tokens: 0 },
    });
    sse += anthropicSSEEvent('message_stop', { type: 'message_stop' });

    globalThis.fetch = vi.fn().mockResolvedValueOnce(makeStreamResponse(sse));

    const stream = await provider.generateStream(USER_MSG);
    const chunks: LLMStreamChunk[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    // Should get the message_delta chunk with finishReason
    const finalChunk = chunks.find((c) => c.finishReason !== undefined);
    expect(finalChunk).toBeDefined();
    expect(finalChunk!.finishReason).toBe('stop');
  });

  it('should handle OpenAI SSE with comment lines interspersed', async () => {
    const provider = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    const sseText =
      ': keepalive\n\n' +
      openaiSSEChunk('A') +
      ': another comment\n\n' +
      openaiSSEChunk('B') +
      openaiSSEFinalChunk(10, 2) +
      'data: [DONE]\n\n';

    globalThis.fetch = vi.fn().mockResolvedValueOnce(makeStreamResponse(sseText));

    const stream = await provider.generateStream(USER_MSG);
    const response = await stream.toResponse();
    expect(response.content).toBe('AB');
  });

  it('should skip malformed JSON in OpenAI SSE without crashing', async () => {
    const provider = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    const sseText =
      openaiSSEChunk('Good') +
      'data: {malformed json}\n\n' +
      openaiSSEChunk(' data') +
      openaiSSEFinalChunk(10, 2) +
      'data: [DONE]\n\n';

    globalThis.fetch = vi.fn().mockResolvedValueOnce(makeStreamResponse(sseText));

    const stream = await provider.generateStream(USER_MSG);
    const response = await stream.toResponse();
    expect(response.content).toBe('Good data');
  });
});

// ---------------------------------------------------------------------------
// Delayed chunk delivery
// ---------------------------------------------------------------------------

describe('Delayed and chunked delivery', () => {
  it('should handle OpenAI stream with delayed chunks arriving one at a time', async () => {
    const provider = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    const chunks = [
      openaiSSEChunk('Slow'),
      openaiSSEChunk(' response'),
      openaiSSEFinalChunk(10, 2),
      'data: [DONE]\n\n',
    ];

    globalThis.fetch = vi.fn().mockResolvedValueOnce(makeDelayedStreamResponse(chunks, 10));

    const stream = await provider.generateStream(USER_MSG);
    const response = await stream.toResponse();
    expect(response.content).toBe('Slow response');
  });

  it('should handle byte-level splitting of SSE events', async () => {
    const provider = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    const sseText =
      openaiSSEChunk('X') + openaiSSEChunk('Y') + openaiSSEFinalChunk(5, 2) + 'data: [DONE]\n\n';

    // 1-byte chunks — every byte boundary
    globalThis.fetch = vi.fn().mockResolvedValueOnce(makeChunkedStreamResponse(sseText, 1));

    const stream = await provider.generateStream(USER_MSG);
    const response = await stream.toResponse();
    expect(response.content).toBe('XY');
  });
});

// ---------------------------------------------------------------------------
// No-body stream
// ---------------------------------------------------------------------------

describe('Stream with no body', () => {
  it('should throw when consuming OpenAI stream with no body', async () => {
    const provider = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    // Construct a Response with null body
    const resp = new Response(null, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    });
    globalThis.fetch = vi.fn().mockResolvedValueOnce(resp);

    // The stream object is created successfully, but consuming it throws
    const stream = await provider.generateStream(USER_MSG);
    await expect(stream.toResponse()).rejects.toThrow(/no body/i);
  });
});

// ---------------------------------------------------------------------------
// Concurrent streams
// ---------------------------------------------------------------------------

describe('Concurrent streaming from multiple providers', () => {
  it('should handle concurrent OpenAI and Anthropic streams', async () => {
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

    const openaiSSE =
      openaiSSEChunk('OpenAI') +
      openaiSSEChunk(' stream') +
      openaiSSEFinalChunk(10, 2) +
      'data: [DONE]\n\n';

    const anthropicSSE = anthropicStreamSSE(['Anthropic', ' stream']);

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeStreamResponse(openaiSSE))
      .mockResolvedValueOnce(makeStreamResponse(anthropicSSE));

    const [openaiStream, anthropicStream] = await Promise.all([
      openai.generateStream(USER_MSG),
      anthropic.generateStream(USER_MSG),
    ]);

    const [openaiResp, anthropicResp] = await Promise.all([
      openaiStream.toResponse(),
      anthropicStream.toResponse(),
    ]);

    expect(openaiResp.content).toBe('OpenAI stream');
    expect(anthropicResp.content).toBe('Anthropic stream');
  });

  it('should handle concurrent text + streaming requests to same provider', async () => {
    const provider = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    const textResponse = {
      choices: [{ message: { content: 'Text response' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    };

    const streamSSE =
      openaiSSEChunk('Stream') +
      openaiSSEChunk(' response') +
      openaiSSEFinalChunk(10, 2) +
      'data: [DONE]\n\n';

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(textResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(makeStreamResponse(streamSSE));

    const [textResp, stream] = await Promise.all([
      provider.generateText(USER_MSG),
      provider.generateStream(USER_MSG),
    ]);

    const streamResp = await stream.toResponse();

    expect(textResp.content).toBe('Text response');
    expect(streamResp.content).toBe('Stream response');
  });
});

// ---------------------------------------------------------------------------
// Long streaming response
// ---------------------------------------------------------------------------

describe('High-volume streaming', () => {
  it('should handle OpenAI stream with 500 chunks', async () => {
    const provider = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    let sseText = '';
    for (let i = 0; i < 500; i++) {
      sseText += openaiSSEChunk(`word${String(i)} `);
    }
    sseText += openaiSSEFinalChunk(100, 500);
    sseText += 'data: [DONE]\n\n';

    globalThis.fetch = vi.fn().mockResolvedValueOnce(makeStreamResponse(sseText));

    const stream = await provider.generateStream(USER_MSG);
    const response = await stream.toResponse();

    const words = response.content.trim().split(' ');
    expect(words.length).toBe(500);
    expect(words[0]).toBe('word0');
    expect(words[499]).toBe('word499');
    expect(response.tokenUsage.completionTokens).toBe(500);
  });
});
