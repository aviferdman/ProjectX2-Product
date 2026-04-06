/**
 * Token-bucket rate limiter for web tools.
 *
 * Prevents abuse by limiting the number of requests that can be made
 * within a given time window. Uses a token-bucket algorithm: tokens
 * are added at a steady rate (one per `intervalMs / maxTokens`) and
 * each request consumes one token. When no tokens are available the
 * request is rejected immediately.
 *
 * @packageDocumentation
 */

import { ToolExecutionError } from '../../errors/tool-errors.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Configuration for the rate limiter. */
export interface RateLimiterConfig {
  /** Maximum number of requests allowed in the time window. Must be >= 1. */
  readonly maxRequests: number;
  /** Time window in milliseconds. Must be > 0. */
  readonly windowMs: number;
}

/** Default rate-limit configuration: 30 requests per 60 seconds. */
export const DEFAULT_RATE_LIMIT: Readonly<RateLimiterConfig> = {
  maxRequests: 30,
  windowMs: 60_000,
};

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

/** Thrown when a web tool call is rejected due to rate limiting. */
export class ToolRateLimitError extends ToolExecutionError {
  public readonly retryAfterMs: number;

  constructor(toolName: string, retryAfterMs: number) {
    super(
      toolName,
      `Rate limit exceeded. Try again in ${String(Math.ceil(retryAfterMs))}ms`,
    );
    this.name = 'ToolRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

// ---------------------------------------------------------------------------
// RateLimiter
// ---------------------------------------------------------------------------

/**
 * A simple token-bucket rate limiter.
 *
 * Tokens refill at a steady rate. Each call to {@link consume} removes
 * one token. If no tokens are available the call throws a
 * {@link ToolRateLimitError}.
 *
 * The implementation is intentionally synchronous (no timers) so it can
 * be embedded in hot paths without allocating resources.
 */
export class RateLimiter {
  private readonly _maxTokens: number;
  private readonly _refillRatePerMs: number;
  private _tokens: number;
  private _lastRefillTime: number;

  constructor(config: RateLimiterConfig) {
    if (!Number.isFinite(config.maxRequests) || config.maxRequests < 1) {
      throw new Error('RateLimiter: maxRequests must be >= 1');
    }
    if (!Number.isFinite(config.windowMs) || config.windowMs <= 0) {
      throw new Error('RateLimiter: windowMs must be > 0');
    }

    this._maxTokens = config.maxRequests;
    this._refillRatePerMs = config.maxRequests / config.windowMs;
    this._tokens = config.maxRequests;
    this._lastRefillTime = Date.now();
  }

  /** Number of tokens currently available (after refill). */
  get availableTokens(): number {
    this._refill();
    return this._tokens;
  }

  /**
   * Consume one token. Throws {@link ToolRateLimitError} if no tokens
   * are available.
   *
   * @param toolName - The tool name used in the error message.
   */
  consume(toolName: string): void {
    this._refill();

    if (this._tokens < 1) {
      const msPerToken = 1 / this._refillRatePerMs;
      const deficit = 1 - this._tokens;
      const retryAfterMs = deficit * msPerToken;
      throw new ToolRateLimitError(toolName, retryAfterMs);
    }

    this._tokens -= 1;
  }

  /** Reset the limiter to full capacity. */
  reset(): void {
    this._tokens = this._maxTokens;
    this._lastRefillTime = Date.now();
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private _refill(): void {
    const now = Date.now();
    const elapsed = now - this._lastRefillTime;

    if (elapsed <= 0) return;

    this._tokens = Math.min(
      this._maxTokens,
      this._tokens + elapsed * this._refillRatePerMs,
    );
    this._lastRefillTime = now;
  }
}
