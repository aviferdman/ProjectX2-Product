/**
 * useTimelinePlayback — React hook for timeline playback and step-through.
 * TASK-146: Implement timeline playback and step-through
 *
 * Manages play/pause, speed control, step-forward/backward through events,
 * and auto-advance of the playhead using requestAnimationFrame.
 */
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  TimelineEvent,
  PlaybackSpeed,
  PlaybackStatus,
  PlaybackState,
} from '../components/timeline/types.js';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

export const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.25, 0.5, 1, 2, 4];

const DEFAULT_SPEED: PlaybackSpeed = 1;

/* ------------------------------------------------------------------ */
/* Options / result types                                              */
/* ------------------------------------------------------------------ */

export interface UseTimelinePlaybackOptions {
  /** Initial speed multiplier. */
  initialSpeed?: PlaybackSpeed;
  /** Callback fired whenever the playhead position changes. */
  onPlayheadChange?: (ms: number) => void;
  /** Callback fired when playback reaches the end. */
  onPlaybackComplete?: () => void;
}

export interface UseTimelinePlaybackResult {
  /** Full playback state. */
  state: PlaybackState;
  /** Start playing. */
  play: () => void;
  /** Pause playback. */
  pause: () => void;
  /** Toggle play/pause. */
  togglePlayPause: () => void;
  /** Step to the next event. */
  stepForward: () => void;
  /** Step to the previous event. */
  stepBackward: () => void;
  /** Jump to the timeline start. */
  jumpToStart: () => void;
  /** Jump to the timeline end. */
  jumpToEnd: () => void;
  /** Seek to an arbitrary ms position. */
  seek: (ms: number) => void;
  /** Set playback speed. */
  setSpeed: (speed: PlaybackSpeed) => void;
  /** Reset to initial state. */
  reset: () => void;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Compute sorted unique event timestamps for stepping. */
function getSortedEventTimestamps(events: TimelineEvent[]): number[] {
  const set = new Set<number>();
  for (const e of events) {
    set.add(e.startMs);
    if (e.endMs !== undefined) set.add(e.endMs);
  }
  return Array.from(set).sort((a, b) => a - b);
}

/** Derive timeline bounds from events (with padding). */
function computeBounds(events: TimelineEvent[]): { startMs: number; endMs: number } {
  if (events.length === 0) return { startMs: 0, endMs: 10_000 };

  let min = Infinity;
  let max = -Infinity;
  for (const e of events) {
    if (e.startMs < min) min = e.startMs;
    const end = e.endMs ?? e.startMs;
    if (end > max) max = end;
  }
  return { startMs: min, endMs: max };
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useTimelinePlayback(
  events: TimelineEvent[],
  options: UseTimelinePlaybackOptions = {},
): UseTimelinePlaybackResult {
  const { initialSpeed = DEFAULT_SPEED, onPlayheadChange, onPlaybackComplete } = options;

  // Sorted event timestamps for stepping
  const timestamps = useMemo(() => getSortedEventTimestamps(events), [events]);
  const bounds = useMemo(() => computeBounds(events), [events]);

  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [currentMs, setCurrentMs] = useState(bounds.startMs);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(initialSpeed);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);

  // Refs for animation frame
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);

  // Keep refs in sync for the animation callback
  const statusRef = useRef(status);
  statusRef.current = status;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const currentMsRef = useRef(currentMs);
  currentMsRef.current = currentMs;
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;

  // Callback refs to avoid stale closures
  const onPlayheadChangeRef = useRef(onPlayheadChange);
  onPlayheadChangeRef.current = onPlayheadChange;
  const onPlaybackCompleteRef = useRef(onPlaybackComplete);
  onPlaybackCompleteRef.current = onPlaybackComplete;

  // Update currentEventIndex when currentMs changes
  useEffect(() => {
    if (timestamps.length === 0) {
      setCurrentEventIndex(-1);
      return;
    }
    // Find the last timestamp <= currentMs
    let idx = -1;
    for (let i = 0; i < timestamps.length; i++) {
      if (timestamps[i]! <= currentMs) idx = i;
      else break;
    }
    setCurrentEventIndex(idx);
  }, [currentMs, timestamps]);

  // Notify parent when playhead changes
  useEffect(() => {
    onPlayheadChangeRef.current?.(currentMs);
  }, [currentMs]);

  // Animation loop
  const tick = useCallback((now: number) => {
    if (statusRef.current !== 'playing') {
      lastFrameTimeRef.current = null;
      return;
    }

    if (lastFrameTimeRef.current === null) {
      lastFrameTimeRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const deltaReal = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;

    const deltaSimulated = deltaReal * speedRef.current;
    const nextMs = currentMsRef.current + deltaSimulated;

    if (nextMs >= boundsRef.current.endMs) {
      setCurrentMs(boundsRef.current.endMs);
      setStatus('paused');
      onPlaybackCompleteRef.current?.();
      return;
    }

    setCurrentMs(nextMs);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Start/stop animation on status change
  useEffect(() => {
    if (status === 'playing') {
      lastFrameTimeRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastFrameTimeRef.current = null;
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [status, tick]);

  // Update bounds when events change
  useEffect(() => {
    if (status === 'idle') {
      setCurrentMs(bounds.startMs);
    }
  }, [bounds.startMs, status]);

  /* ---------------------------------------------------------------- */
  /* Actions                                                           */
  /* ---------------------------------------------------------------- */

  const play = useCallback(() => {
    // If at end, restart from beginning
    if (currentMsRef.current >= boundsRef.current.endMs) {
      setCurrentMs(boundsRef.current.startMs);
    }
    setStatus('playing');
  }, []);

  const pause = useCallback(() => {
    setStatus('paused');
  }, []);

  const togglePlayPause = useCallback(() => {
    if (statusRef.current === 'playing') {
      setStatus('paused');
    } else {
      // If at end, restart
      if (currentMsRef.current >= boundsRef.current.endMs) {
        setCurrentMs(boundsRef.current.startMs);
      }
      setStatus('playing');
    }
  }, []);

  const stepForward = useCallback(() => {
    if (timestamps.length === 0) return;
    setStatus('paused');

    // Find next timestamp after current
    const current = currentMsRef.current;
    for (const ts of timestamps) {
      if (ts > current) {
        setCurrentMs(ts);
        return;
      }
    }
    // Already at or past last timestamp — go to end
    setCurrentMs(boundsRef.current.endMs);
  }, [timestamps]);

  const stepBackward = useCallback(() => {
    if (timestamps.length === 0) return;
    setStatus('paused');

    const current = currentMsRef.current;
    // Find previous timestamp before current
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (timestamps[i]! < current) {
        setCurrentMs(timestamps[i]!);
        return;
      }
    }
    // Already at or before first timestamp — go to start
    setCurrentMs(boundsRef.current.startMs);
  }, [timestamps]);

  const jumpToStart = useCallback(() => {
    setStatus('paused');
    setCurrentMs(boundsRef.current.startMs);
  }, []);

  const jumpToEnd = useCallback(() => {
    setStatus('paused');
    setCurrentMs(boundsRef.current.endMs);
  }, []);

  const seek = useCallback((ms: number) => {
    const clamped = Math.max(boundsRef.current.startMs, Math.min(ms, boundsRef.current.endMs));
    setCurrentMs(clamped);
  }, []);

  const setSpeed = useCallback((s: PlaybackSpeed) => {
    setSpeedState(s);
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setCurrentMs(boundsRef.current.startMs);
    setSpeedState(initialSpeed);
    setCurrentEventIndex(-1);
  }, [initialSpeed]);

  /* ---------------------------------------------------------------- */
  /* Return                                                            */
  /* ---------------------------------------------------------------- */

  const state: PlaybackState = {
    status,
    currentMs,
    speed,
    startMs: bounds.startMs,
    endMs: bounds.endMs,
    currentEventIndex,
  };

  return {
    state,
    play,
    pause,
    togglePlayPause,
    stepForward,
    stepBackward,
    jumpToStart,
    jumpToEnd,
    seek,
    setSpeed,
    reset,
  };
}
