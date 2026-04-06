import { describe, expect, it } from 'vitest';

import { CircuitBreaker, CircuitState } from '../../../src/llm/circuit-breaker.js';

// ---------------------------------------------------------------------------
// Helper: controllable clock
// ---------------------------------------------------------------------------

function createClock(startMs = 0) {
  let now = startMs;
  return {
    now: () => now,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe('CircuitBreaker', () => {
  describe('constructor', () => {
    it('should start in CLOSED state', () => {
      const cb = new CircuitBreaker();

      expect(cb.state).toBe(CircuitState.CLOSED);
    });

    it('should use default config when none provided', () => {
      const cb = new CircuitBreaker();
      const snap = cb.snapshot();

      expect(snap.state).toBe(CircuitState.CLOSED);
      expect(snap.consecutiveFailures).toBe(0);
      expect(snap.totalFailures).toBe(0);
      expect(snap.totalSuccesses).toBe(0);
      expect(snap.lastFailureTime).toBeUndefined();
    });

    it('should accept custom config', () => {
      const cb = new CircuitBreaker({ failureThreshold: 10, cooldownMs: 5_000 });

      // Record 5 failures — still under threshold of 10
      for (let i = 0; i < 5; i++) cb.recordFailure();

      expect(cb.state).toBe(CircuitState.CLOSED);
    });

    it('should throw on failureThreshold < 1', () => {
      expect(() => new CircuitBreaker({ failureThreshold: 0 })).toThrow(
        'failureThreshold must be >= 1',
      );
    });

    it('should throw on negative cooldownMs', () => {
      expect(() => new CircuitBreaker({ cooldownMs: -1 })).toThrow('cooldownMs must be >= 0');
    });

    it('should allow cooldownMs of 0', () => {
      expect(() => new CircuitBreaker({ cooldownMs: 0 })).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // CLOSED state behavior
  // -------------------------------------------------------------------------

  describe('CLOSED state', () => {
    it('should allow requests', () => {
      const cb = new CircuitBreaker();

      expect(cb.isAllowed()).toBe(true);
    });

    it('should remain CLOSED after successes', () => {
      const cb = new CircuitBreaker();

      cb.recordSuccess();
      cb.recordSuccess();
      cb.recordSuccess();

      expect(cb.state).toBe(CircuitState.CLOSED);
      expect(cb.snapshot().totalSuccesses).toBe(3);
    });

    it('should remain CLOSED when failures are below threshold', () => {
      const cb = new CircuitBreaker({ failureThreshold: 5 });

      for (let i = 0; i < 4; i++) cb.recordFailure();

      expect(cb.state).toBe(CircuitState.CLOSED);
      expect(cb.snapshot().consecutiveFailures).toBe(4);
    });

    it('should transition to OPEN when failures reach threshold', () => {
      const cb = new CircuitBreaker({ failureThreshold: 3 });

      cb.recordFailure();
      cb.recordFailure();
      expect(cb.state).toBe(CircuitState.CLOSED);

      cb.recordFailure();
      expect(cb.state).toBe(CircuitState.OPEN);
    });

    it('should reset consecutive failures on success', () => {
      const cb = new CircuitBreaker({ failureThreshold: 5 });

      cb.recordFailure();
      cb.recordFailure();
      cb.recordFailure();
      cb.recordSuccess(); // resets consecutive count

      expect(cb.state).toBe(CircuitState.CLOSED);
      expect(cb.snapshot().consecutiveFailures).toBe(0);

      // Need 5 more consecutive failures to open
      for (let i = 0; i < 4; i++) cb.recordFailure();
      expect(cb.state).toBe(CircuitState.CLOSED);
    });
  });

  // -------------------------------------------------------------------------
  // OPEN state behavior
  // -------------------------------------------------------------------------

  describe('OPEN state', () => {
    it('should reject requests', () => {
      const cb = new CircuitBreaker({ failureThreshold: 2 });
      cb.recordFailure();
      cb.recordFailure();

      expect(cb.state).toBe(CircuitState.OPEN);
      expect(cb.isAllowed()).toBe(false);
    });

    it('should transition to HALF_OPEN after cooldown', () => {
      const clock = createClock(1000);
      const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 5_000 }, clock.now);

      cb.recordFailure();
      cb.recordFailure();
      expect(cb.state).toBe(CircuitState.OPEN);

      clock.advance(4_999);
      expect(cb.state).toBe(CircuitState.OPEN);

      clock.advance(1);
      expect(cb.state).toBe(CircuitState.HALF_OPEN);
    });

    it('should not transition before cooldown expires', () => {
      const clock = createClock(0);
      const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 10_000 }, clock.now);

      cb.recordFailure();
      expect(cb.state).toBe(CircuitState.OPEN);

      clock.advance(9_999);
      expect(cb.state).toBe(CircuitState.OPEN);
      expect(cb.isAllowed()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // HALF_OPEN state behavior
  // -------------------------------------------------------------------------

  describe('HALF_OPEN state', () => {
    it('should allow one test request', () => {
      const clock = createClock(0);
      const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1_000 }, clock.now);

      cb.recordFailure();
      clock.advance(1_000);

      expect(cb.state).toBe(CircuitState.HALF_OPEN);
      expect(cb.isAllowed()).toBe(true);
    });

    it('should close on success', () => {
      const clock = createClock(0);
      const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1_000 }, clock.now);

      cb.recordFailure();
      clock.advance(1_000);
      expect(cb.state).toBe(CircuitState.HALF_OPEN);

      cb.recordSuccess();
      expect(cb.state).toBe(CircuitState.CLOSED);
    });

    it('should reopen on failure', () => {
      const clock = createClock(0);
      const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1_000 }, clock.now);

      cb.recordFailure();
      cb.recordFailure();
      clock.advance(1_000);
      expect(cb.state).toBe(CircuitState.HALF_OPEN);

      cb.recordFailure();
      expect(cb.state).toBe(CircuitState.OPEN);
    });

    it('should immediately reopen on failure (single failure in HALF_OPEN)', () => {
      const clock = createClock(0);
      const cb = new CircuitBreaker({ failureThreshold: 5, cooldownMs: 500 }, clock.now);

      // Open the circuit
      for (let i = 0; i < 5; i++) cb.recordFailure();
      expect(cb.state).toBe(CircuitState.OPEN);

      // Wait for cooldown
      clock.advance(500);
      expect(cb.state).toBe(CircuitState.HALF_OPEN);

      // Single failure reopens immediately
      cb.recordFailure();
      expect(cb.state).toBe(CircuitState.OPEN);
    });
  });

  // -------------------------------------------------------------------------
  // State change callback
  // -------------------------------------------------------------------------

  describe('onStateChange callback', () => {
    it('should fire on CLOSED → OPEN transition', () => {
      const transitions: Array<[CircuitState, CircuitState]> = [];
      const cb = new CircuitBreaker(
        {
          failureThreshold: 2,
          onStateChange: (from, to) => transitions.push([from, to]),
        },
      );

      cb.recordFailure();
      cb.recordFailure();

      expect(transitions).toEqual([[CircuitState.CLOSED, CircuitState.OPEN]]);
    });

    it('should fire on OPEN → HALF_OPEN → CLOSED transitions', () => {
      const clock = createClock(0);
      const transitions: Array<[CircuitState, CircuitState]> = [];
      const cb = new CircuitBreaker(
        {
          failureThreshold: 1,
          cooldownMs: 100,
          onStateChange: (from, to) => transitions.push([from, to]),
        },
        clock.now,
      );

      cb.recordFailure(); // CLOSED → OPEN
      clock.advance(100);
      cb.isAllowed(); // triggers OPEN → HALF_OPEN evaluation
      cb.recordSuccess(); // HALF_OPEN → CLOSED

      expect(transitions).toEqual([
        [CircuitState.CLOSED, CircuitState.OPEN],
        [CircuitState.OPEN, CircuitState.HALF_OPEN],
        [CircuitState.HALF_OPEN, CircuitState.CLOSED],
      ]);
    });

    it('should fire on HALF_OPEN → OPEN transition (reopen)', () => {
      const clock = createClock(0);
      const transitions: Array<[CircuitState, CircuitState]> = [];
      const cb = new CircuitBreaker(
        {
          failureThreshold: 1,
          cooldownMs: 100,
          onStateChange: (from, to) => transitions.push([from, to]),
        },
        clock.now,
      );

      cb.recordFailure(); // CLOSED → OPEN
      clock.advance(100);
      cb.isAllowed(); // OPEN → HALF_OPEN
      cb.recordFailure(); // HALF_OPEN → OPEN

      expect(transitions).toEqual([
        [CircuitState.CLOSED, CircuitState.OPEN],
        [CircuitState.OPEN, CircuitState.HALF_OPEN],
        [CircuitState.HALF_OPEN, CircuitState.OPEN],
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // reset()
  // -------------------------------------------------------------------------

  describe('reset()', () => {
    it('should reset from OPEN to CLOSED', () => {
      const cb = new CircuitBreaker({ failureThreshold: 1 });
      cb.recordFailure();
      expect(cb.state).toBe(CircuitState.OPEN);

      cb.reset();
      expect(cb.state).toBe(CircuitState.CLOSED);
      expect(cb.isAllowed()).toBe(true);
    });

    it('should clear consecutive failures but preserve totals', () => {
      const cb = new CircuitBreaker({ failureThreshold: 3 });
      cb.recordFailure();
      cb.recordFailure();
      cb.recordSuccess();

      cb.reset();
      const snap = cb.snapshot();

      expect(snap.consecutiveFailures).toBe(0);
      expect(snap.totalFailures).toBe(2);
      expect(snap.totalSuccesses).toBe(1);
    });

    it('should be idempotent when already CLOSED', () => {
      const transitions: Array<[CircuitState, CircuitState]> = [];
      const cb = new CircuitBreaker({
        onStateChange: (from, to) => transitions.push([from, to]),
      });

      cb.reset();

      expect(cb.state).toBe(CircuitState.CLOSED);
      expect(transitions).toEqual([]); // no transition fired
    });
  });

  // -------------------------------------------------------------------------
  // snapshot()
  // -------------------------------------------------------------------------

  describe('snapshot()', () => {
    it('should return accurate statistics', () => {
      const clock = createClock(1000);
      const cb = new CircuitBreaker({ failureThreshold: 5 }, clock.now);

      cb.recordSuccess();
      cb.recordSuccess();
      clock.advance(100);
      cb.recordFailure();
      cb.recordSuccess();
      cb.recordFailure();
      clock.advance(50);
      cb.recordFailure();

      const snap = cb.snapshot();

      expect(snap.state).toBe(CircuitState.CLOSED);
      expect(snap.totalSuccesses).toBe(3);
      expect(snap.totalFailures).toBe(3);
      expect(snap.consecutiveFailures).toBe(2);
      expect(snap.lastFailureTime).toBe(1150);
    });

    it('should track lastFailureTime correctly', () => {
      const clock = createClock(0);
      const cb = new CircuitBreaker({}, clock.now);

      expect(cb.snapshot().lastFailureTime).toBeUndefined();

      clock.advance(5000);
      cb.recordFailure();
      expect(cb.snapshot().lastFailureTime).toBe(5000);

      clock.advance(3000);
      cb.recordFailure();
      expect(cb.snapshot().lastFailureTime).toBe(8000);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle failureThreshold of 1', () => {
      const cb = new CircuitBreaker({ failureThreshold: 1 });

      cb.recordFailure();
      expect(cb.state).toBe(CircuitState.OPEN);
    });

    it('should handle cooldownMs of 0 (immediate transition to HALF_OPEN)', () => {
      const clock = createClock(0);
      const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 0 }, clock.now);

      cb.recordFailure();

      // With 0ms cooldown, accessing state immediately transitions to HALF_OPEN
      expect(cb.state).toBe(CircuitState.HALF_OPEN);
      expect(cb.isAllowed()).toBe(true);
    });

    it('should handle rapid success/failure alternation', () => {
      const cb = new CircuitBreaker({ failureThreshold: 3 });

      cb.recordFailure();
      cb.recordSuccess();
      cb.recordFailure();
      cb.recordSuccess();
      cb.recordFailure();
      cb.recordFailure();

      // Only 2 consecutive failures — still CLOSED
      expect(cb.state).toBe(CircuitState.CLOSED);
      expect(cb.snapshot().consecutiveFailures).toBe(2);
      expect(cb.snapshot().totalFailures).toBe(4);
    });

    it('should handle full cycle: CLOSED → OPEN → HALF_OPEN → CLOSED', () => {
      const clock = createClock(0);
      const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1000 }, clock.now);

      // CLOSED → OPEN
      cb.recordFailure();
      cb.recordFailure();
      expect(cb.state).toBe(CircuitState.OPEN);
      expect(cb.isAllowed()).toBe(false);

      // OPEN → HALF_OPEN
      clock.advance(1000);
      expect(cb.state).toBe(CircuitState.HALF_OPEN);
      expect(cb.isAllowed()).toBe(true);

      // HALF_OPEN → CLOSED
      cb.recordSuccess();
      expect(cb.state).toBe(CircuitState.CLOSED);
      expect(cb.isAllowed()).toBe(true);
      expect(cb.snapshot().consecutiveFailures).toBe(0);
    });

    it('should handle multiple reopen cycles', () => {
      const clock = createClock(0);
      const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 100 }, clock.now);

      // Cycle 1: CLOSED → OPEN → HALF_OPEN → OPEN
      cb.recordFailure();
      clock.advance(100);
      cb.recordFailure(); // fails in HALF_OPEN
      expect(cb.state).toBe(CircuitState.OPEN);

      // Cycle 2: OPEN → HALF_OPEN → CLOSED
      clock.advance(100);
      expect(cb.state).toBe(CircuitState.HALF_OPEN);
      cb.recordSuccess();
      expect(cb.state).toBe(CircuitState.CLOSED);
    });
  });
});
