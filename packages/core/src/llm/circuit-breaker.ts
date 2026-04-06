/**
 * Circuit breaker for LLM provider operations.
 *
 * Prevents cascading failures by tracking consecutive errors and
 * short-circuiting requests when a provider is consistently failing.
 *
 * States:
 * - **CLOSED** — Normal operation; all requests pass through.
 * - **OPEN** — Provider is failing; requests are rejected immediately.
 * - **HALF_OPEN** — After cooldown, one test request is allowed through.
 *   If it succeeds, the circuit closes. If it fails, it reopens.
 *
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   cooldownMs: 30_000,
 * });
 *
 * if (!breaker.isAllowed()) {
 *   throw new Error('Circuit open — provider is unavailable');
 * }
 *
 * try {
 *   const result = await provider.generateText(messages);
 *   breaker.recordSuccess();
 *   return result;
 * } catch (error) {
 *   breaker.recordFailure();
 *   throw error;
 * }
 * ```
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The three states of a circuit breaker. */
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Configuration for {@link CircuitBreaker}.
 */
export interface CircuitBreakerConfig {
  /**
   * Number of consecutive failures before the circuit opens (default: 5).
   * Must be >= 1.
   */
  readonly failureThreshold: number;

  /**
   * Duration in ms the circuit stays open before transitioning to half-open (default: 30000).
   * Must be >= 0.
   */
  readonly cooldownMs: number;

  /**
   * Optional callback invoked whenever the circuit state changes.
   * Use for logging or metrics.
   */
  readonly onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

/**
 * Read-only snapshot of circuit breaker statistics.
 */
export interface CircuitBreakerSnapshot {
  readonly state: CircuitState;
  readonly consecutiveFailures: number;
  readonly totalFailures: number;
  readonly totalSuccesses: number;
  readonly lastFailureTime: number | undefined;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_COOLDOWN_MS = 30_000;

// ---------------------------------------------------------------------------
// CircuitBreaker
// ---------------------------------------------------------------------------

/**
 * Implements the circuit breaker pattern for protecting against cascading
 * failures when calling LLM providers.
 *
 * Thread-safe for single-threaded Node.js environments (no concurrent
 * mutation concerns in the event loop).
 */
export class CircuitBreaker {
  private _state: CircuitState = CircuitState.CLOSED;
  private _consecutiveFailures = 0;
  private _totalFailures = 0;
  private _totalSuccesses = 0;
  private _lastFailureTime: number | undefined;

  private readonly _failureThreshold: number;
  private readonly _cooldownMs: number;
  private readonly _onStateChange: ((from: CircuitState, to: CircuitState) => void) | undefined;
  private readonly _now: () => number;

  constructor(
    config?: Partial<CircuitBreakerConfig>,
    /** Injectable clock for testing (default: Date.now). */
    now?: () => number,
  ) {
    this._failureThreshold = config?.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
    this._cooldownMs = config?.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    this._onStateChange = config?.onStateChange;
    this._now = now ?? Date.now;

    if (this._failureThreshold < 1) {
      throw new Error('failureThreshold must be >= 1');
    }
    if (this._cooldownMs < 0) {
      throw new Error('cooldownMs must be >= 0');
    }
  }

  /** Current circuit state. */
  get state(): CircuitState {
    this._evaluateState();
    return this._state;
  }

  /**
   * Check whether a request is allowed through the circuit.
   *
   * - CLOSED → always allowed
   * - HALF_OPEN → allowed (one test request)
   * - OPEN → blocked (unless cooldown has elapsed, transitioning to HALF_OPEN)
   */
  isAllowed(): boolean {
    this._evaluateState();

    if (this._state === CircuitState.CLOSED) {
      return true;
    }

    if (this._state === CircuitState.HALF_OPEN) {
      return true;
    }

    // OPEN
    return false;
  }

  /**
   * Record a successful operation. Resets the circuit to CLOSED.
   */
  recordSuccess(): void {
    this._totalSuccesses++;
    this._consecutiveFailures = 0;

    if (this._state !== CircuitState.CLOSED) {
      this._transition(CircuitState.CLOSED);
    }
  }

  /**
   * Record a failed operation. May transition the circuit to OPEN.
   */
  recordFailure(): void {
    this._totalFailures++;
    this._consecutiveFailures++;
    this._lastFailureTime = this._now();

    if (this._state === CircuitState.HALF_OPEN) {
      this._transition(CircuitState.OPEN);
      return;
    }

    if (
      this._state === CircuitState.CLOSED &&
      this._consecutiveFailures >= this._failureThreshold
    ) {
      this._transition(CircuitState.OPEN);
    }
  }

  /**
   * Manually reset the circuit to CLOSED state.
   * Clears consecutive failure count but preserves lifetime totals.
   */
  reset(): void {
    this._consecutiveFailures = 0;
    if (this._state !== CircuitState.CLOSED) {
      this._transition(CircuitState.CLOSED);
    }
  }

  /** Get a read-only snapshot of current statistics. */
  snapshot(): CircuitBreakerSnapshot {
    this._evaluateState();
    return {
      state: this._state,
      consecutiveFailures: this._consecutiveFailures,
      totalFailures: this._totalFailures,
      totalSuccesses: this._totalSuccesses,
      lastFailureTime: this._lastFailureTime,
    };
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  /**
   * Evaluate whether the circuit should transition from OPEN → HALF_OPEN
   * based on elapsed cooldown time.
   */
  private _evaluateState(): void {
    if (this._state !== CircuitState.OPEN) {
      return;
    }

    if (this._lastFailureTime === undefined) {
      return;
    }

    const elapsed = this._now() - this._lastFailureTime;
    if (elapsed >= this._cooldownMs) {
      this._transition(CircuitState.HALF_OPEN);
    }
  }

  private _transition(to: CircuitState): void {
    const from = this._state;
    this._state = to;
    this._onStateChange?.(from, to);
  }
}
