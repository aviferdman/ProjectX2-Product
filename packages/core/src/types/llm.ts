/**
 * LLM provider interfaces for dependency injection.
 *
 * Agents are LLM-agnostic — any provider implementing {@link LLMProvider}
 * can be injected at runtime (OpenAI, Anthropic, Ollama, etc.).
 *
 * @packageDocumentation
 */

/** Role of a message participant in a conversation. */
export enum LLMRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

/** A single message in an LLM conversation. */
export interface LLMMessage {
  readonly role: LLMRole;
  readonly content: string;
}

/** Options for an LLM generation request. */
export interface LLMRequestOptions {
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly stopSequences?: readonly string[];
}

/** Token usage statistics from an LLM call. */
export interface TokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

/** Response from an LLM generation call. */
export interface LLMResponse {
  readonly content: string;
  readonly tokenUsage: TokenUsage;
  readonly finishReason: string;
}

/**
 * Abstract LLM provider interface.
 *
 * Implement this interface to integrate any LLM backend with Crewspace agents.
 */
export interface LLMProvider {
  /** Human-readable provider name (e.g. "openai", "anthropic"). */
  readonly name: string;

  /**
   * Generate a text completion from a conversation.
   *
   * @param messages - Ordered conversation messages
   * @param options  - Generation parameters
   * @returns The LLM response with content and usage metadata
   */
  generateText(messages: readonly LLMMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;
}
