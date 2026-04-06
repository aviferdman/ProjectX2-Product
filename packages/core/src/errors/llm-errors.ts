/**
 * Custom error classes for LLM provider operations.
 *
 * Provides a typed error hierarchy for handling provider-specific failures
 * such as rate limits, authentication errors, context length violations,
 * and streaming errors.
 *
 * @packageDocumentation
 */

/**
 * Base error for all LLM provider failures.
 *
 * @example
 * ```typescript
 * try {
 *   await provider.generateText(messages);
 * } catch (error) {
 *   if (error instanceof LLMProviderError) {
 *     console.error(`Provider "${error.provider}" failed: ${error.message}`);
 *   }
 * }
 * ```
 */
export class LLMProviderError extends Error {
  /** Name of the provider that raised the error (e.g. "openai"). */
  public readonly provider: string;

  /** HTTP status code from the upstream API, if applicable. */
  public readonly statusCode: number | undefined;

  public override readonly cause: Error | undefined;

  constructor(provider: string, message: string, statusCode?: number, cause?: Error) {
    super(`LLM provider "${provider}": ${message}`);
    this.name = 'LLMProviderError';
    this.provider = provider;
    this.statusCode = statusCode;
    this.cause = cause;
  }
}

/**
 * Thrown when the provider returns a rate-limit error (HTTP 429).
 *
 * Includes `retryAfterMs` so callers can implement exponential backoff.
 */
export class LLMRateLimitError extends LLMProviderError {
  /** Suggested wait time before retrying, in milliseconds. */
  public readonly retryAfterMs: number | undefined;

  constructor(provider: string, message: string, retryAfterMs?: number, cause?: Error) {
    super(provider, message, 429, cause);
    this.name = 'LLMRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Thrown when authentication fails (invalid or missing API key).
 */
export class LLMAuthenticationError extends LLMProviderError {
  constructor(provider: string, message: string, cause?: Error) {
    super(provider, message, 401, cause);
    this.name = 'LLMAuthenticationError';
  }
}

/**
 * Thrown when the request exceeds the model's context window.
 */
export class LLMContextLengthError extends LLMProviderError {
  /** Number of tokens in the request that exceeded the limit. */
  public readonly requestTokens: number | undefined;

  /** Maximum tokens the model supports. */
  public readonly maxTokens: number | undefined;

  constructor(
    provider: string,
    message: string,
    requestTokens?: number,
    maxTokens?: number,
    cause?: Error,
  ) {
    super(provider, message, 400, cause);
    this.name = 'LLMContextLengthError';
    this.requestTokens = requestTokens;
    this.maxTokens = maxTokens;
  }
}

/**
 * Thrown when a streaming response fails mid-stream.
 */
export class LLMStreamError extends LLMProviderError {
  /** Number of chunks successfully received before the error. */
  public readonly chunksReceived: number;

  /** Partial content accumulated before the failure. */
  public readonly partialContent: string;

  constructor(
    provider: string,
    message: string,
    chunksReceived: number,
    partialContent: string,
    cause?: Error,
  ) {
    super(provider, message, undefined, cause);
    this.name = 'LLMStreamError';
    this.chunksReceived = chunksReceived;
    this.partialContent = partialContent;
  }
}
