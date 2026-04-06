/**
 * Abstract base class for LLM providers.
 *
 * Implements common functionality shared by all providers:
 * - Default option merging
 * - Message validation
 * - Config storage
 *
 * Concrete providers (OpenAI, Anthropic, Ollama) extend this class
 * and implement the protected `_doGenerateText` / `_doGenerateStream`
 * template methods.
 *
 * @packageDocumentation
 */

import { LLMProviderError } from "../errors/llm-errors.js";
import type {
  LLMMessage,
  LLMProviderConfig,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamResponse,
  StreamingLLMProvider,
} from "../types/llm.js";
import { LLMRole } from "../types/llm.js";

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Abstract base class for LLM providers.
 *
 * Subclasses must implement `_doGenerateText()`. Streaming providers
 * should also override `_doGenerateStream()`.
 *
 * @example
 * ```typescript
 * class MyProvider extends BaseLLMProvider {
 *   protected async _doGenerateText(
 *     messages: readonly LLMMessage[],
 *     options: LLMRequestOptions,
 *   ): Promise<LLMResponse> {
 *     // Call your API here
 *   }
 * }
 * ```
 */
export abstract class BaseLLMProvider implements StreamingLLMProvider {
  public readonly name: string;
  public readonly modelId: string;
  public readonly maxRetries: number;
  public readonly timeout: number;

  protected readonly _config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    if (!config.provider || config.provider.trim().length === 0) {
      throw new LLMProviderError(
        config.provider || "unknown",
        "Provider name must not be empty",
      );
    }
    if (!config.modelId || config.modelId.trim().length === 0) {
      throw new LLMProviderError(config.provider, "Model ID must not be empty");
    }

    this._config = config;
    this.name = config.provider;
    this.modelId = config.modelId;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
  }

  async generateText(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions,
  ): Promise<LLMResponse> {
    this._validateMessages(messages);
    const merged = this._mergeOptions(options);
    return this._doGenerateText(messages, merged);
  }

  async generateStream(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions,
  ): Promise<LLMStreamResponse> {
    this._validateMessages(messages);
    const merged = this._mergeOptions(options);
    return this._doGenerateStream(messages, merged);
  }

  /**
   * Subclasses implement this to perform the actual text generation API call.
   *
   * @param messages - Validated conversation messages
   * @param options  - Merged generation options (defaults + overrides)
   */
  protected abstract _doGenerateText(
    messages: readonly LLMMessage[],
    options: LLMRequestOptions,
  ): Promise<LLMResponse>;

  /**
   * Subclasses override this to provide streaming support.
   *
   * Default implementation throws — providers that don't support streaming
   * will get a clear error message.
   *
   * @param _messages - Validated conversation messages
   * @param _options  - Merged generation options
   */
  protected _doGenerateStream(
    _messages: readonly LLMMessage[],
    _options: LLMRequestOptions,
  ): Promise<LLMStreamResponse> {
    throw new LLMProviderError(
      this.name,
      `Provider "${this.name}" does not support streaming. ` +
        "Override _doGenerateStream() to enable it.",
    );
  }

  /**
   * Merge per-call options with the provider's default options.
   * Per-call values take precedence.
   */
  protected _mergeOptions(options?: LLMRequestOptions): LLMRequestOptions {
    const defaults = this._config.defaultOptions;
    if (!defaults) {
      return options ?? {};
    }
    if (!options) {
      return defaults;
    }
    const merged: Record<string, unknown> = {};

    const temperature = options.temperature ?? defaults.temperature;
    if (temperature !== undefined) merged["temperature"] = temperature;

    const maxTokens = options.maxTokens ?? defaults.maxTokens;
    if (maxTokens !== undefined) merged["maxTokens"] = maxTokens;

    const stopSequences = options.stopSequences ?? defaults.stopSequences;
    if (stopSequences !== undefined) merged["stopSequences"] = stopSequences;

    const signal = options.signal ?? defaults.signal;
    if (signal !== undefined) merged["signal"] = signal;

    return merged as LLMRequestOptions;
  }

  /**
   * Validate that the message array is non-empty and contains at least
   * one user or system message.
   */
  protected _validateMessages(messages: readonly LLMMessage[]): void {
    if (messages.length === 0) {
      throw new LLMProviderError(this.name, "Messages array must not be empty");
    }

    const hasContent = messages.some(
      (m) => m.role === LLMRole.USER || m.role === LLMRole.SYSTEM,
    );

    if (!hasContent) {
      throw new LLMProviderError(
        this.name,
        "Messages must contain at least one USER or SYSTEM message",
      );
    }
  }
}
