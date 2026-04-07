/**
 * Custom error classes for LLM provider operations.
 *
 * Provides a typed error hierarchy for handling provider-specific failures
 * such as rate limits, authentication errors, context length violations,
 * and streaming errors.
 *
 * @packageDocumentation
 */

import { CrewspaceError, ErrorCode } from './base.js';

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
export class LLMProviderError extends CrewspaceError {
  /** Name of the provider that raised the error (e.g. "openai"). */
  public readonly provider: string;

  /** HTTP status code from the upstream API, if applicable. */
  public readonly statusCode: number | undefined;

  constructor(provider: string, message: string, statusCode?: number, cause?: Error) {
    const retryable = statusCode !== undefined && (statusCode >= 500 || statusCode === 429);
    super(`LLM provider "${provider}": ${message}`, ErrorCode.LLM_PROVIDER, {
      cause,
      isRetryable: retryable,
    });
    this.name = 'LLMProviderError';
    this.provider = provider;
    this.statusCode = statusCode;
  }

  protected override getDetails(): Record<string, unknown> {
    return { provider: this.provider, statusCode: this.statusCode };
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
    // Override code for more specific classification
    (this as { code: ErrorCode }).code = ErrorCode.LLM_RATE_LIMIT;
  }

  protected override getDetails(): Record<string, unknown> {
    return { ...super.getDetails(), retryAfterMs: this.retryAfterMs };
  }
}

/**
 * Thrown when authentication fails (invalid or missing API key).
 */
export class LLMAuthenticationError extends LLMProviderError {
  constructor(provider: string, message: string, cause?: Error) {
    super(provider, message, 401, cause);
    this.name = 'LLMAuthenticationError';
    (this as { code: ErrorCode }).code = ErrorCode.LLM_AUTHENTICATION;
    // Auth errors are never retryable
    (this as { isRetryable: boolean }).isRetryable = false;
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
    (this as { code: ErrorCode }).code = ErrorCode.LLM_CONTEXT_LENGTH;
    // Context length errors are not retryable without modifying the request
    (this as { isRetryable: boolean }).isRetryable = false;
  }

  protected override getDetails(): Record<string, unknown> {
    return {
      ...super.getDetails(),
      requestTokens: this.requestTokens,
      maxTokens: this.maxTokens,
    };
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
    (this as { code: ErrorCode }).code = ErrorCode.LLM_STREAM;
    // Stream errors may be retried (transient network issues)
    (this as { isRetryable: boolean }).isRetryable = true;
  }

  protected override getDetails(): Record<string, unknown> {
    return {
      ...super.getDetails(),
      chunksReceived: this.chunksReceived,
      partialContent: this.partialContent,
    };
  }
}
