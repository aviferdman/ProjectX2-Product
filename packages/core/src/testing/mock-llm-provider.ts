/**
 * Mock LLM provider factories for testing agent workflows.
 *
 * Provides configurable mock implementations of {@link LLMProvider} and
 * {@link StreamingLLMProvider} that work with Vitest's spy/mock system.
 *
 * @packageDocumentation
 */

import { vi } from 'vitest';

import type {
  LLMMessage,
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamChunk,
  LLMStreamResponse,
  StreamingLLMProvider,
  TokenUsage,
} from '../types/llm.js';

// ---------------------------------------------------------------------------
// Default token usage
// ---------------------------------------------------------------------------

/** Default token usage returned by mock providers. */
export const DEFAULT_MOCK_TOKEN_USAGE: TokenUsage = {
  promptTokens: 10,
  completionTokens: 20,
  totalTokens: 30,
};

// ---------------------------------------------------------------------------
// Mock LLM provider options
// ---------------------------------------------------------------------------

/** Options for configuring a mock LLM provider. */
export interface MockLLMProviderOptions {
  /** Provider name (default: `"mock-provider"`). */
  readonly name?: string;

  /** Static response content (default: `"Mock LLM response"`). */
  readonly content?: string;

  /** Token usage to return (default: {@link DEFAULT_MOCK_TOKEN_USAGE}). */
  readonly tokenUsage?: TokenUsage;

  /** Finish reason string (default: `"stop"`). */
  readonly finishReason?: string;

  /** Artificial delay in milliseconds before resolving (default: `0`). */
  readonly delayMs?: number;

  /** If provided, `generateText` will reject with this error. */
  readonly error?: Error;

  /**
   * Dynamic response handler called with each `generateText` invocation.
   * When set, overrides the static `content`/`tokenUsage`/`finishReason` options.
   */
  readonly handler?: (
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions,
  ) => LLMResponse | Promise<LLMResponse>;
}

// ---------------------------------------------------------------------------
// createMockLLMProvider
// ---------------------------------------------------------------------------

/**
 * Create a mock {@link LLMProvider} for testing.
 *
 * The returned provider's `generateText` is a Vitest spy that resolves
 * with the configured response. Every call can be inspected with
 * `vi.fn()` assertions (`.toHaveBeenCalledWith(...)`, etc.).
 *
 * @example
 * ```typescript
 * const provider = createMockLLMProvider({ content: 'Hello!' });
 * const agent = new Agent({ id: 'a', role: 'R', goal: 'G', llmProvider: provider });
 * const result = await agent.execute({ description: 'Say hi' });
 * expect(result.output).toBe('Hello!');
 * expect(provider.generateText).toHaveBeenCalledOnce();
 * ```
 */
export function createMockLLMProvider(options: MockLLMProviderOptions = {}): LLMProvider & {
  generateText: ReturnType<typeof vi.fn>;
} {
  const {
    name = 'mock-provider',
    content = 'Mock LLM response',
    tokenUsage = DEFAULT_MOCK_TOKEN_USAGE,
    finishReason = 'stop',
    delayMs = 0,
    error,
    handler,
  } = options;

  const generateText = vi
    .fn<(messages: readonly LLMMessage[], options?: LLMRequestOptions) => Promise<LLMResponse>>()
    .mockImplementation(async (msgs, opts) => {
      if (delayMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }

      if (error) {
        throw error;
      }

      if (handler) {
        return handler(msgs, opts);
      }

      return { content, tokenUsage, finishReason };
    });

  return { name, generateText };
}

// ---------------------------------------------------------------------------
// createSequenceMockLLMProvider
// ---------------------------------------------------------------------------

/**
 * Create a mock LLM provider that returns different responses on successive calls.
 *
 * Useful for testing multi-step workflows where each agent invocation
 * should produce a different output.
 *
 * @example
 * ```typescript
 * const provider = createSequenceMockLLMProvider([
 *   'First research results',
 *   'Refined analysis',
 *   'Final summary',
 * ]);
 * ```
 */
export function createSequenceMockLLMProvider(
  responses: readonly string[],
  options: Omit<MockLLMProviderOptions, 'content' | 'handler' | 'error'> = {},
): LLMProvider & { generateText: ReturnType<typeof vi.fn> } {
  let callIndex = 0;

  return createMockLLMProvider({
    ...options,
    handler: () => {
      const content = responses[callIndex] ?? responses[responses.length - 1] ?? 'Mock response';
      callIndex++;
      return {
        content,
        tokenUsage: options.tokenUsage ?? DEFAULT_MOCK_TOKEN_USAGE,
        finishReason: options.finishReason ?? 'stop',
      };
    },
  });
}

// ---------------------------------------------------------------------------
// createTrackingMockLLMProvider
// ---------------------------------------------------------------------------

/**
 * Create a mock provider that pushes its ID into a shared tracker array
 * on each call, enabling execution-order assertions.
 *
 * @example
 * ```typescript
 * const order: string[] = [];
 * const p1 = createTrackingMockLLMProvider('agent-1', order);
 * const p2 = createTrackingMockLLMProvider('agent-2', order);
 * // ... run workflow ...
 * expect(order).toEqual(['agent-1', 'agent-2']);
 * ```
 */
export function createTrackingMockLLMProvider(
  id: string,
  tracker: string[],
  options: Omit<MockLLMProviderOptions, 'handler'> = {},
): LLMProvider & { generateText: ReturnType<typeof vi.fn> } {
  return createMockLLMProvider({
    name: `mock-${id}`,
    ...options,
    handler: async () => {
      tracker.push(id);
      if (options.delayMs && options.delayMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, options.delayMs));
      }
      return {
        content: options.content ?? `output-${id}`,
        tokenUsage: options.tokenUsage ?? DEFAULT_MOCK_TOKEN_USAGE,
        finishReason: options.finishReason ?? 'stop',
      };
    },
  });
}

// ---------------------------------------------------------------------------
// createCapturingMockLLMProvider
// ---------------------------------------------------------------------------

/**
 * Create a mock provider that captures the messages it receives into a shared map.
 *
 * Useful for asserting that task context, dependency results, and system
 * prompts are correctly composed and forwarded to the LLM.
 *
 * @example
 * ```typescript
 * const captured = new Map<string, readonly LLMMessage[]>();
 * const provider = createCapturingMockLLMProvider('research', captured);
 * // ... run workflow ...
 * expect(captured.get('research')?.[0].content).toContain('Your goal:');
 * ```
 */
export function createCapturingMockLLMProvider(
  id: string,
  capturedMessages: Map<string, readonly LLMMessage[]>,
  options: Omit<MockLLMProviderOptions, 'handler'> = {},
): LLMProvider & { generateText: ReturnType<typeof vi.fn> } {
  return createMockLLMProvider({
    name: `mock-${id}`,
    ...options,
    handler: async (messages) => {
      capturedMessages.set(id, [...messages]);
      return {
        content: options.content ?? `output-${id}`,
        tokenUsage: options.tokenUsage ?? DEFAULT_MOCK_TOKEN_USAGE,
        finishReason: options.finishReason ?? 'stop',
      };
    },
  });
}

// ---------------------------------------------------------------------------
// createMockStreamingProvider
// ---------------------------------------------------------------------------

/** Options for the mock streaming LLM provider. */
export interface MockStreamingProviderOptions extends MockLLMProviderOptions {
  /** Content to split into streaming chunks (overrides `content`). */
  readonly streamContent?: string;

  /** Number of chunks to split the content into (default: 3). */
  readonly chunkCount?: number;
}

/**
 * Create a mock {@link StreamingLLMProvider} for testing streaming workflows.
 *
 * @example
 * ```typescript
 * const provider = createMockStreamingProvider({
 *   streamContent: 'Hello World!',
 *   chunkCount: 3,
 * });
 * const stream = await provider.generateStream(messages);
 * const response = await stream.toResponse();
 * expect(response.content).toBe('Hello World!');
 * ```
 */
export function createMockStreamingProvider(
  options: MockStreamingProviderOptions = {},
): StreamingLLMProvider & {
  generateText: ReturnType<typeof vi.fn>;
  generateStream: ReturnType<typeof vi.fn>;
} {
  const {
    streamContent,
    chunkCount = 3,
    tokenUsage = DEFAULT_MOCK_TOKEN_USAGE,
    finishReason = 'stop',
  } = options;

  const base = createMockLLMProvider(options);
  const fullContent = streamContent ?? options.content ?? 'Mock LLM response';

  const generateStream = vi.fn().mockImplementation(async () => {
    const chunks: LLMStreamChunk[] = [];
    const chunkSize = Math.ceil(fullContent.length / chunkCount);

    for (let i = 0; i < chunkCount; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, fullContent.length);
      const isLast = i === chunkCount - 1;

      chunks.push({
        content: fullContent.slice(start, end),
        ...(isLast ? { finishReason, tokenUsage } : {}),
      });
    }

    let consumed = false;

    const streamResponse: LLMStreamResponse = {
      async *[Symbol.asyncIterator]() {
        if (consumed) {
          throw new Error('Stream already consumed');
        }
        consumed = true;
        for (const chunk of chunks) {
          yield chunk;
        }
      },

      async toResponse(): Promise<LLMResponse> {
        let content = '';
        let lastFinishReason = 'stop';
        let lastTokenUsage: TokenUsage = tokenUsage;

        for await (const chunk of this) {
          content += chunk.content;
          if (chunk.finishReason) lastFinishReason = chunk.finishReason;
          if (chunk.tokenUsage) lastTokenUsage = chunk.tokenUsage;
        }

        return { content, finishReason: lastFinishReason, tokenUsage: lastTokenUsage };
      },
    };

    return streamResponse;
  });

  return {
    ...base,
    generateStream,
  };
}
