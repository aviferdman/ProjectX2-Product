/**
 * Memory usage tracking for the Crewspace framework.
 *
 * Captures heap and RSS snapshots before/after operations to measure
 * memory consumption. Provides utilities for detecting memory leaks
 * and tracking allocation patterns.
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A point-in-time memory snapshot (bytes). */
export interface MemorySnapshot {
  /** Resident Set Size — total memory allocated to the process. */
  readonly rss: number;
  /** Total size of the V8 heap. */
  readonly heapTotal: number;
  /** Heap space actually in use. */
  readonly heapUsed: number;
  /** Memory used by C++ objects bound to JS (Buffers, etc.). */
  readonly external: number;
  /** Memory allocated for ArrayBuffers and SharedArrayBuffers. */
  readonly arrayBuffers: number;
  /** High-resolution timestamp when the snapshot was taken. */
  readonly timestamp: number;
}

/** The result of measuring memory across an operation. */
export interface MemoryMeasurement {
  /** Label identifying the operation. */
  readonly label: string;
  /** Snapshot taken before the operation. */
  readonly before: MemorySnapshot;
  /** Snapshot taken after the operation. */
  readonly after: MemorySnapshot;
  /** Delta in bytes for each category. */
  readonly delta: MemoryDelta;
  /** Wall-clock duration of the operation (ms). */
  readonly durationMs: number;
}

/** Byte-level deltas between two memory snapshots. */
export interface MemoryDelta {
  readonly rss: number;
  readonly heapTotal: number;
  readonly heapUsed: number;
  readonly external: number;
  readonly arrayBuffers: number;
}

/** Statistical summary of multiple memory measurements. */
export interface MemorySummary {
  /** Number of measurements. */
  readonly count: number;
  /** Average heap-used delta (bytes). */
  readonly avgHeapUsedDelta: number;
  /** Peak heap-used delta across all measurements (bytes). */
  readonly peakHeapUsedDelta: number;
  /** Average RSS delta (bytes). */
  readonly avgRssDelta: number;
  /** Peak RSS delta (bytes). */
  readonly peakRssDelta: number;
  /** Average external delta (bytes). */
  readonly avgExternalDelta: number;
  /** Sum of all heap-used deltas (bytes). */
  readonly totalHeapUsedDelta: number;
  /** Measurements that increased heap beyond a threshold. */
  readonly leakSuspects: number;
}

/** Configuration for MemoryTracker. */
export interface MemoryTrackerConfig {
  /** Maximum measurements to retain (default: 1000). */
  readonly maxMeasurements?: number;
  /** Heap-used delta threshold (bytes) to flag as a leak suspect (default: 1 MB). */
  readonly leakThresholdBytes?: number;
  /** Whether to force GC before snapshots if `global.gc` is available (default: false). */
  readonly forceGC?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_MAX_MEASUREMENTS = 1000;
export const DEFAULT_LEAK_THRESHOLD_BYTES = 1_048_576; // 1 MB

// ---------------------------------------------------------------------------
// Snapshot helper
// ---------------------------------------------------------------------------

/**
 * Capture a memory snapshot from the current process.
 *
 * Falls back to zero values if `process.memoryUsage` is unavailable
 * (e.g. in browser-like environments).
 */
export function captureMemorySnapshot(): MemorySnapshot {
  try {
    const mem = process.memoryUsage();
    return {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
      timestamp: performance.now(),
    };
  } catch {
    return {
      rss: 0,
      heapTotal: 0,
      heapUsed: 0,
      external: 0,
      arrayBuffers: 0,
      timestamp: performance.now(),
    };
  }
}

/** Compute the delta between two snapshots. */
export function computeMemoryDelta(before: MemorySnapshot, after: MemorySnapshot): MemoryDelta {
  return {
    rss: after.rss - before.rss,
    heapTotal: after.heapTotal - before.heapTotal,
    heapUsed: after.heapUsed - before.heapUsed,
    external: after.external - before.external,
    arrayBuffers: after.arrayBuffers - before.arrayBuffers,
  };
}

/** Format bytes into a human-readable string. */
export function formatBytes(bytes: number): string {
  const abs = Math.abs(bytes);
  const sign = bytes < 0 ? '-' : '';
  if (abs < 1024) return `${sign}${String(abs)}B`;
  if (abs < 1_048_576) return `${sign}${(abs / 1024).toFixed(1)}KB`;
  if (abs < 1_073_741_824) return `${sign}${(abs / 1_048_576).toFixed(2)}MB`;
  return `${sign}${(abs / 1_073_741_824).toFixed(2)}GB`;
}

// ---------------------------------------------------------------------------
// MemoryTracker
// ---------------------------------------------------------------------------

/**
 * Tracks memory usage across operations.
 *
 * @example
 * ```typescript
 * const tracker = new MemoryTracker();
 *
 * const measurement = await tracker.measure('agent-init', () => {
 *   return new Agent({ id: 'a', role: 'r', goal: 'g' });
 * });
 * console.log(formatBytes(measurement.delta.heapUsed));
 *
 * const summary = tracker.getSummary();
 * console.log(`Avg heap delta: ${formatBytes(summary.avgHeapUsedDelta)}`);
 * ```
 */
export class MemoryTracker {
  private readonly _measurements: MemoryMeasurement[] = [];
  private readonly _maxMeasurements: number;
  private readonly _leakThresholdBytes: number;
  private readonly _forceGC: boolean;

  constructor(config?: MemoryTrackerConfig) {
    this._maxMeasurements = config?.maxMeasurements ?? DEFAULT_MAX_MEASUREMENTS;
    this._leakThresholdBytes = config?.leakThresholdBytes ?? DEFAULT_LEAK_THRESHOLD_BYTES;
    this._forceGC = config?.forceGC ?? false;
  }

  /** Number of recorded measurements. */
  get measurementCount(): number {
    return this._measurements.length;
  }

  /**
   * Measure memory consumed by a synchronous or asynchronous operation.
   *
   * @param label - Human-readable label for the measurement
   * @param fn - The operation to measure
   * @returns The measurement result and the operation's return value
   */
  async measure<T>(label: string, fn: () => T | Promise<T>): Promise<MemoryMeasurement & { result: T }> {
    this._tryGC();

    const before = captureMemorySnapshot();
    const result = await fn();
    const after = captureMemorySnapshot();

    const delta = computeMemoryDelta(before, after);
    const durationMs = after.timestamp - before.timestamp;

    const measurement: MemoryMeasurement = { label, before, after, delta, durationMs };
    this._record(measurement);

    return { ...measurement, result };
  }

  /**
   * Measure memory consumed by a synchronous operation.
   *
   * @param label - Human-readable label for the measurement
   * @param fn - The synchronous operation to measure
   * @returns The measurement result and the operation's return value
   */
  measureSync<T>(label: string, fn: () => T): MemoryMeasurement & { result: T } {
    this._tryGC();

    const before = captureMemorySnapshot();
    const result = fn();
    const after = captureMemorySnapshot();

    const delta = computeMemoryDelta(before, after);
    const durationMs = after.timestamp - before.timestamp;

    const measurement: MemoryMeasurement = { label, before, after, delta, durationMs };
    this._record(measurement);

    return { ...measurement, result };
  }

  /** Get all recorded measurements (shallow copy). */
  getMeasurements(): readonly MemoryMeasurement[] {
    return [...this._measurements];
  }

  /** Get measurements by label. */
  getMeasurementsByLabel(label: string): readonly MemoryMeasurement[] {
    return this._measurements.filter((m) => m.label === label);
  }

  /** Compute aggregate statistics across all measurements. */
  getSummary(): MemorySummary {
    return computeMemorySummary(this._measurements, this._leakThresholdBytes);
  }

  /** Clear all recorded measurements. */
  reset(): void {
    this._measurements.length = 0;
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private _record(measurement: MemoryMeasurement): void {
    this._measurements.push(measurement);
    if (this._measurements.length > this._maxMeasurements) {
      this._measurements.splice(0, this._measurements.length - this._maxMeasurements);
    }
  }

  private _tryGC(): void {
    if (this._forceGC && typeof globalThis !== 'undefined' && typeof (globalThis as Record<string, unknown>).gc === 'function') {
      (globalThis as Record<string, unknown> & { gc: () => void }).gc();
    }
  }
}

// ---------------------------------------------------------------------------
// Summary computation
// ---------------------------------------------------------------------------

export function computeMemorySummary(
  measurements: readonly MemoryMeasurement[],
  leakThresholdBytes: number = DEFAULT_LEAK_THRESHOLD_BYTES,
): MemorySummary {
  if (measurements.length === 0) {
    return {
      count: 0,
      avgHeapUsedDelta: 0,
      peakHeapUsedDelta: 0,
      avgRssDelta: 0,
      peakRssDelta: 0,
      avgExternalDelta: 0,
      totalHeapUsedDelta: 0,
      leakSuspects: 0,
    };
  }

  let totalHeapUsedDelta = 0;
  let peakHeapUsedDelta = 0;
  let totalRssDelta = 0;
  let peakRssDelta = 0;
  let totalExternalDelta = 0;
  let leakSuspects = 0;

  for (const m of measurements) {
    totalHeapUsedDelta += m.delta.heapUsed;
    totalRssDelta += m.delta.rss;
    totalExternalDelta += m.delta.external;

    if (m.delta.heapUsed > peakHeapUsedDelta) {
      peakHeapUsedDelta = m.delta.heapUsed;
    }
    if (m.delta.rss > peakRssDelta) {
      peakRssDelta = m.delta.rss;
    }
    if (m.delta.heapUsed > leakThresholdBytes) {
      leakSuspects++;
    }
  }

  return {
    count: measurements.length,
    avgHeapUsedDelta: totalHeapUsedDelta / measurements.length,
    peakHeapUsedDelta,
    avgRssDelta: totalRssDelta / measurements.length,
    peakRssDelta,
    avgExternalDelta: totalExternalDelta / measurements.length,
    totalHeapUsedDelta,
    leakSuspects,
  };
}
