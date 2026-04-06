/**
 * Centralized mock API response builders for LLM provider tests.
 *
 * Provides realistic response shapes matching actual OpenAI Chat Completions
 * and Anthropic Messages API responses, eliminating duplication across tests.
 *
 * @packageDocumentation
 */

import type { LLMMessage, LLMProviderConfig } from '../../../../src/types/llm.js';
import { LLMRole } from '../../../../src/types/llm.js';

// ---------------------------------------------------------------------------
// Common test constants
// ---------------------------------------------------------------------------

export const OPENAI_TEST_KEY = 'sk-test-key-1234567890abcdef';
export const ANTHROPIC_TEST_KEY = 'sk-ant-test-key-1234567890abcdef';
export const OPENAI_MODEL = 'gpt-4o';
export const ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022';

// ---------------------------------------------------------------------------
// Config builders
// ---------------------------------------------------------------------------

export function openaiConfig(overrides?: Partial<LLMProviderConfig>): LLMProviderConfig {
  return { provider: 'openai', modelId: OPENAI_MODEL, apiKey: OPENAI_TEST_KEY, ...overrides };
}

export function anthropicConfig(overrides?: Partial<LLMProviderConfig>): LLMProviderConfig {
  return {
    provider: 'anthropic',
    modelId: ANTHROPIC_MODEL,
    apiKey: ANTHROPIC_TEST_KEY,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Message builders
// ---------------------------------------------------------------------------

export function userMessage(content: string): LLMMessage {
  return { role: LLMRole.USER, content };
}

export function systemMessage(content: string): LLMMessage {
  return { role: LLMRole.SYSTEM, content };
}

export function assistantMessage(content: string): LLMMessage {
  return { role: LLMRole.ASSISTANT, content };
}

export function toolMessage(content: string, name: string): LLMMessage {
  return { role: LLMRole.TOOL, content, name };
}

export const SIMPLE_USER_MESSAGE: readonly LLMMessage[] = [userMessage('Hello')];

export const MULTI_TURN_MESSAGES: readonly LLMMessage[] = [
  systemMessage('You are a helpful assistant.'),
  userMessage('What is 2 + 2?'),
  assistantMessage('2 + 2 = 4'),
  userMessage('And 3 + 3?'),
];

// ---------------------------------------------------------------------------
// OpenAI response builders
// ---------------------------------------------------------------------------

export interface OpenAIChatResponseOptions {
  content?: string;
  finishReason?: string;
  promptTokens?: number;
  completionTokens?: number;
  model?: string;
  id?: string;
  systemFingerprint?: string;
}

export function openaiChatResponse(opts: OpenAIChatResponseOptions = {}): Record<string, unknown> {
  const promptTokens = opts.promptTokens ?? 10;
  const completionTokens = opts.completionTokens ?? 5;
  return {
    id: opts.id ?? 'chatcmpl-test123',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: opts.model ?? OPENAI_MODEL,
    choices: [
      {
        message: { content: opts.content ?? 'Hello! How can I help?', role: 'assistant' },
        finish_reason: opts.finishReason ?? 'stop',
        index: 0,
        logprobs: null,
      },
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
    system_fingerprint: opts.systemFingerprint ?? 'fp_test123',
  };
}

export interface OpenAIErrorResponseOptions {
  message?: string;
  type?: string;
  code?: string;
}

export function openaiErrorResponse(
  opts: OpenAIErrorResponseOptions = {},
): Record<string, unknown> {
  return {
    error: {
      message: opts.message ?? 'An error occurred',
      type: opts.type ?? 'server_error',
      code: opts.code ?? null,
    },
  };
}

export interface OpenAISSEChunkOptions {
  content?: string;
  finishReason?: string | null;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null;
}

export function openaiSSELine(opts: OpenAISSEChunkOptions): string {
  const data = {
    choices: [
      {
        delta: { content: opts.content ?? '' },
        finish_reason: opts.finishReason ?? null,
        index: 0,
      },
    ],
    usage: opts.usage ?? null,
  };
  return `data: ${JSON.stringify(data)}\n\n`;
}

export function openaiSSEStream(chunks: OpenAISSEChunkOptions[]): string {
  return chunks.map((c) => openaiSSELine(c)).join('') + 'data: [DONE]\n\n';
}

// ---------------------------------------------------------------------------
// Anthropic response builders
// ---------------------------------------------------------------------------

export interface AnthropicMessageResponseOptions {
  content?: string;
  stopReason?: string;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
  id?: string;
}

export function anthropicMessageResponse(
  opts: AnthropicMessageResponseOptions = {},
): Record<string, unknown> {
  const inputTokens = opts.inputTokens ?? 10;
  const outputTokens = opts.outputTokens ?? 5;
  return {
    id: opts.id ?? 'msg_test123',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: opts.content ?? 'Hello! How can I help?' }],
    model: opts.model ?? ANTHROPIC_MODEL,
    stop_reason: opts.stopReason ?? 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    },
  };
}

export function anthropicErrorResponse(
  opts: { message?: string; type?: string } = {},
): Record<string, unknown> {
  return {
    type: 'error',
    error: {
      type: opts.type ?? 'api_error',
      message: opts.message ?? 'An error occurred',
    },
  };
}

export interface AnthropicSSEEvent {
  event: string;
  data: Record<string, unknown>;
}

export function anthropicStreamEvents(
  textChunks: string[],
  options?: { inputTokens?: number; outputTokens?: number; stopReason?: string },
): AnthropicSSEEvent[] {
  const inputTokens = options?.inputTokens ?? 10;
  const outputTokens = options?.outputTokens ?? 5;
  const stopReason = options?.stopReason ?? 'end_turn';

  const events: AnthropicSSEEvent[] = [
    {
      event: 'message_start',
      data: {
        type: 'message_start',
        message: {
          id: 'msg_test123',
          type: 'message',
          role: 'assistant',
          usage: { input_tokens: inputTokens, output_tokens: 0 },
        },
      },
    },
    {
      event: 'content_block_start',
      data: { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    },
  ];

  for (const chunk of textChunks) {
    events.push({
      event: 'content_block_delta',
      data: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'text_delta', text: chunk },
      },
    });
  }

  events.push({
    event: 'content_block_stop',
    data: { type: 'content_block_stop', index: 0 },
  });

  events.push({
    event: 'message_delta',
    data: {
      type: 'message_delta',
      delta: { stop_reason: stopReason },
      usage: { output_tokens: outputTokens },
    },
  });

  events.push({
    event: 'message_stop',
    data: { type: 'message_stop' },
  });

  return events;
}

export function anthropicSSEText(events: AnthropicSSEEvent[]): string {
  const lines: string[] = [];
  for (const ev of events) {
    lines.push(`event: ${ev.event}`);
    lines.push(`data: ${JSON.stringify(ev.data)}`);
    lines.push('');
  }
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// HTTP response builders
// ---------------------------------------------------------------------------

export function jsonResponse(
  body: unknown,
  status = 200,
  headers?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function sseResponse(sseText: string): Response {
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

export function chunkedSSEResponse(sseText: string, chunkSize: number): Response {
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

export function textErrorResponse(text: string, status: number): Response {
  return new Response(text, {
    status,
    statusText: 'Error',
    headers: { 'Content-Type': 'text/plain' },
  });
}

export function htmlErrorResponse(html: string, status: number): Response {
  return new Response(html, {
    status,
    statusText: 'Error',
    headers: { 'Content-Type': 'text/html' },
  });
}
