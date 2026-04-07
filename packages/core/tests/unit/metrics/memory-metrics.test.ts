/**
 * Tests for the memory metrics tracking module.
 *
 * Covers: MemoryTracker, captureMemorySnapshot, computeMemoryDelta,
 * computeMemorySummary, formatBytes, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  captureMemorySnapshot,
  computeMemoryDelta,
  computeMemorySummary,
  DEFAULT_LEAK_THRESHOLD_BYTES,
  DEFAULT_MAX_MEASUREMENTS,
  formatBytes,
  MemoryTracker,
} from '../../../src/metrics/index.js';

import type {
  MemoryDelta,
  MemoryMeasurement,
  MemorySnapshot,
  MemorySummary,
} from '../../../src/metrics/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSnapshot(overrides?: Partial<MemorySnapshot>): MemorySnapshot {
  return {
    rss: overrides?.rss ?? 100_000_000,
    heapTotal: overrides?.heapTotal ?? 80_000_000,
    heapUsed: overrides?.heapUsed ?? 50_000_000,
    external: overrides?.external ?? 5_000_000,
    arrayBuffers: overrides?.arrayBuffers ?? 1_000_000,
    timestamp: overrides?.timestamp ?? 1000,
  };
}

function makeMeasurement(overrides?: Partial<MemoryMeasurement>): MemoryMeasurement {
  const before = overrides?.before ?? makeSnapshot({ heapUsed: 50_000_000, timestamp: 1000 });
  const after = overrides?.after ?? makeSnapshot({ heapUsed: 52_000_000, timestamp: 1100 });
  return {
    label: overrides?.label ?? 'test-op',
    before,
    after,
    delta: overrides?.delta ?? computeMemoryDelta(before, after),
    durationMs: overrides?.durationMs ?? 100,
  };
}

// ---------------------------------------------------------------------------
// captureMemorySnapshot
// ---------------------------------------------------------------------------

describe('captureMemorySnapshot', () => {
  it('should return a snapshot with valid numeric fields', () => {
    const snap = captureMemorySnapshot();
    expect(snap.rss).toBeGreaterThan(0);
    expect(snap.heapTotal).toBeGreaterThan(0);
    expect(snap.heapUsed).toBeGreaterThan(0);
    expect(snap.external).toBeGreaterThanOrEqual(0);
    expect(snap.arrayBuffers).toBeGreaterThanOrEqual(0);
    expect(snap.timestamp).toBeGreaterThan(0);
  });

  it('should return heapUsed <= heapTotal', () => {
    const snap = captureMemorySnapshot();
    expect(snap.heapUsed).toBeLessThanOrEqual(snap.heapTotal);
  });

  it('should return heapTotal <= rss', () => {
    const snap = captureMemorySnapshot();
    expect(snap.heapTotal).toBeLessThanOrEqual(snap.rss);
  });
});

// ---------------------------------------------------------------------------
// computeMemoryDelta
// ---------------------------------------------------------------------------

describe('computeMemoryDelta', () => {
  it('should compute positive delta when memory grows', () => {
    const before = makeSnapshot({ heapUsed: 50_000_000, rss: 100_000_000 });
    const after = makeSnapshot({ heapUsed: 55_000_000, rss: 105_000_000 });
    const delta = computeMemoryDelta(before, after);

    expect(delta.heapUsed).toBe(5_000_000);
    expect(delta.rss).toBe(5_000_000);
  });

  it('should compute negative delta when memory shrinks', () => {
    const before = makeSnapshot({ heapUsed: 60_000_000 });
    const after = makeSnapshot({ heapUsed: 50_000_000 });
    const delta = computeMemoryDelta(before, after);

    expect(delta.heapUsed).toBe(-10_000_000);
  });

  it('should compute zero delta for identical snapshots', () => {
    const snap = makeSnapshot();
    const delta = computeMemoryDelta(snap, snap);

    expect(delta.heapUsed).toBe(0);
    expect(delta.rss).toBe(0);
    expect(delta.heapTotal).toBe(0);
    expect(delta.external).toBe(0);
    expect(delta.arrayBuffers).toBe(0);
  });

  it('should compute all delta fields independently', () => {
    const before = makeSnapshot({
      rss: 100, heapTotal: 80, heapUsed: 50, external: 10, arrayBuffers: 5,
    });
    const after = makeSnapshot({
      rss: 200, heapTotal: 90, heapUsed: 70, external: 15, arrayBuffers: 8,
    });
    const delta = computeMemoryDelta(before, after);

    expect(delta.rss).toBe(100);
    expect(delta.heapTotal).toBe(10);
    expect(delta.heapUsed).toBe(20);
    expect(delta.external).toBe(5);
    expect(delta.arrayBuffers).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// formatBytes
// ---------------------------------------------------------------------------

describe('formatBytes', () => {
  it('should format bytes', () => {
    expect(formatBytes(0)).toBe('0B');
    expect(formatBytes(512)).toBe('512B');
    expect(formatBytes(1023)).toBe('1023B');
  });

  it('should format kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0KB');
    expect(formatBytes(1536)).toBe('1.5KB');
    expect(formatBytes(10240)).toBe('10.0KB');
  });

  it('should format megabytes', () => {
    expect(formatBytes(1_048_576)).toBe('1.00MB');
    expect(formatBytes(5_242_880)).toBe('5.00MB');
  });

  it('should format gigabytes', () => {
    expect(formatBytes(1_073_741_824)).toBe('1.00GB');
  });

  it('should format negative values', () => {
    expect(formatBytes(-1024)).toBe('-1.0KB');
    expect(formatBytes(-1_048_576)).toBe('-1.00MB');
  });
});

// ---------------------------------------------------------------------------
// computeMemorySummary
// ---------------------------------------------------------------------------

describe('computeMemorySummary', () => {
  it('should return zeros for empty input', () => {
    const summary = computeMemorySummary([]);

    expect(summary.count).toBe(0);
    expect(summary.avgHeapUsedDelta).toBe(0);
    expect(summary.peakHeapUsedDelta).toBe(0);
    expect(summary.leakSuspects).toBe(0);
  });

  it('should compute correct summary for multiple measurements', () => {
    const m1 = makeMeasurement({
      delta: { rss: 1000, heapTotal: 500, heapUsed: 2000, external: 100, arrayBuffers: 50 },
    });
    const m2 = makeMeasurement({
      delta: { rss: 3000, heapTotal: 1500, heapUsed: 4000, external: 200, arrayBuffers: 100 },
    });
    const summary = computeMemorySummary([m1, m2]);

    expect(summary.count).toBe(2);
    expect(summary.avgHeapUsedDelta).toBe(3000);
    expect(summary.peakHeapUsedDelta).toBe(4000);
    expect(summary.avgRssDelta).toBe(2000);
    expect(summary.peakRssDelta).toBe(3000);
    expect(summary.totalHeapUsedDelta).toBe(6000);
  });

  it('should detect leak suspects above threshold', () => {
    const belowThreshold = makeMeasurement({
      delta: { rss: 0, heapTotal: 0, heapUsed: 500_000, external: 0, arrayBuffers: 0 },
    });
    const aboveThreshold = makeMeasurement({
      delta: { rss: 0, heapTotal: 0, heapUsed: 2_000_000, external: 0, arrayBuffers: 0 },
    });
    const summary = computeMemorySummary([belowThreshold, aboveThreshold]);

    expect(summary.leakSuspects).toBe(1);
  });

  it('should use custom leak threshold', () => {
    const m = makeMeasurement({
      delta: { rss: 0, heapTotal: 0, heapUsed: 500, external: 0, arrayBuffers: 0 },
    });
    const summary = computeMemorySummary([m], 100);

    expect(summary.leakSuspects).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// MemoryTracker
// ---------------------------------------------------------------------------

describe('MemoryTracker', () => {
  let tracker: MemoryTracker;

  beforeEach(() => {
    tracker = new MemoryTracker();
  });

  // -----------------------------------------------------------------------
  // Construction
  // -----------------------------------------------------------------------

  describe('constructor', () => {
    it('should create with default config', () => {
      expect(tracker.measurementCount).toBe(0);
    });

    it('should accept custom config', () => {
      const custom = new MemoryTracker({
        maxMeasurements: 100,
        leakThresholdBytes: 512,
        forceGC: false,
      });
      expect(custom.measurementCount).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // measure (async)
  // -----------------------------------------------------------------------

  describe('measure', () => {
    it('should measure a synchronous operation', async () => {
      const result = await tracker.measure('alloc', () => {
        return Array.from({ length: 1000 }, (_, i) => i);
      });

      expect(result.label).toBe('alloc');
      expect(result.before.heapUsed).toBeGreaterThan(0);
      expect(result.after.heapUsed).toBeGreaterThan(0);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.result).toHaveLength(1000);
    });

    it('should measure an async operation', async () => {
      const result = await tracker.measure('async-op', async () => {
        await new Promise((r) => setTimeout(r, 10));
        return 'done';
      });

      expect(result.label).toBe('async-op');
      expect(result.durationMs).toBeGreaterThanOrEqual(5);
      expect(result.result).toBe('done');
    });

    it('should increment measurement count', async () => {
      await tracker.measure('op1', () => {});
      await tracker.measure('op2', () => {});

      expect(tracker.measurementCount).toBe(2);
    });

    it('should record measurements in getMeasurements', async () => {
      await tracker.measure('op1', () => 'a');
      await tracker.measure('op2', () => 'b');

      const measurements = tracker.getMeasurements();
      expect(measurements).toHaveLength(2);
      expect(measurements[0]!.label).toBe('op1');
      expect(measurements[1]!.label).toBe('op2');
    });
  });

  // -----------------------------------------------------------------------
  // measureSync
  // -----------------------------------------------------------------------

  describe('measureSync', () => {
    it('should measure a synchronous operation', () => {
      const result = tracker.measureSync('sync-alloc', () => {
        return Array.from({ length: 500 }, (_, i) => i);
      });

      expect(result.label).toBe('sync-alloc');
      expect(result.result).toHaveLength(500);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should record the measurement', () => {
      tracker.measureSync('sync-op', () => 42);

      expect(tracker.measurementCount).toBe(1);
      const measurements = tracker.getMeasurements();
      expect(measurements[0]!.label).toBe('sync-op');
    });
  });

  // -----------------------------------------------------------------------
  // getMeasurementsByLabel
  // -----------------------------------------------------------------------

  describe('getMeasurementsByLabel', () => {
    it('should filter measurements by label', async () => {
      await tracker.measure('a', () => {});
      await tracker.measure('b', () => {});
      await tracker.measure('a', () => {});

      const matches = tracker.getMeasurementsByLabel('a');
      expect(matches).toHaveLength(2);
      expect(matches.every((m) => m.label === 'a')).toBe(true);
    });

    it('should return empty array for unknown label', () => {
      expect(tracker.getMeasurementsByLabel('unknown')).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Eviction
  // -----------------------------------------------------------------------

  describe('eviction', () => {
    it('should evict oldest measurements when maxMeasurements is exceeded', async () => {
      const small = new MemoryTracker({ maxMeasurements: 3 });

      await small.measure('op1', () => {});
      await small.measure('op2', () => {});
      await small.measure('op3', () => {});
      await small.measure('op4', () => {});

      expect(small.measurementCount).toBe(3);
      const labels = small.getMeasurements().map((m) => m.label);
      expect(labels).toEqual(['op2', 'op3', 'op4']);
    });
  });

  // -----------------------------------------------------------------------
  // getSummary
  // -----------------------------------------------------------------------

  describe('getSummary', () => {
    it('should return zeros for no measurements', () => {
      const summary = tracker.getSummary();
      expect(summary.count).toBe(0);
      expect(summary.avgHeapUsedDelta).toBe(0);
    });

    it('should return aggregate summary', async () => {
      await tracker.measure('op1', () => {});
      await tracker.measure('op2', () => {});

      const summary = tracker.getSummary();
      expect(summary.count).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // reset
  // -----------------------------------------------------------------------

  describe('reset', () => {
    it('should clear all measurements', async () => {
      await tracker.measure('op', () => {});
      expect(tracker.measurementCount).toBe(1);

      tracker.reset();
      expect(tracker.measurementCount).toBe(0);
      expect(tracker.getMeasurements()).toHaveLength(0);
    });
  });
});
