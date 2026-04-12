/**
 * Tests for timeline playback: useTimelinePlayback hook and PlaybackControls component.
 * TASK-146: Implement timeline playback and step-through
 *
 * Tests cover:
 * - useTimelinePlayback hook: play/pause, speed, step forward/backward, seek, reset
 * - PlaybackControls component: rendering, button interactions, scrubber, accessibility
 * - formatPlaybackTime utility
 * - Type exports
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderHook, act as hookAct } from '@testing-library/react';
import React from 'react';

import {
  PlaybackControls,
  formatPlaybackTime,
  type PlaybackControlsProps,
  type PlaybackSpeed,
  type PlaybackStatus,
  type PlaybackState,
  type TimelineEvent,
} from '../src/components/timeline/index.js';

import {
  useTimelinePlayback,
  PLAYBACK_SPEEDS,
  type UseTimelinePlaybackOptions,
} from '../src/hooks/useTimelinePlayback.js';

/* ------------------------------------------------------------------ */
/* Test data                                                           */
/* ------------------------------------------------------------------ */

const testEvents: TimelineEvent[] = [
  {
    id: 'e1',
    agentId: 'agent-1',
    type: 'task-start',
    startMs: 1000,
    label: 'Task begins',
  },
  {
    id: 'e2',
    agentId: 'agent-1',
    type: 'llm-call',
    startMs: 2000,
    endMs: 4000,
    label: 'LLM Call',
  },
  {
    id: 'e3',
    agentId: 'agent-2',
    type: 'tool-use',
    startMs: 3000,
    endMs: 5000,
    label: 'Tool Use',
  },
  {
    id: 'e4',
    agentId: 'agent-1',
    type: 'task-complete',
    startMs: 6000,
    label: 'Task complete',
  },
];

/* ------------------------------------------------------------------ */
/* Mock RAF for hook tests                                             */
/* ------------------------------------------------------------------ */
let rafCallbacks: ((time: number) => void)[] = [];
let rafId = 0;

beforeEach(() => {
  rafCallbacks = [];
  rafId = 0;
  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
    rafCallbacks.push(cb);
    return ++rafId;
  });
  vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {
    // Clear pending callbacks
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Flush one animation frame at the given timestamp. */
function flushRAF(time: number) {
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  for (const cb of cbs) cb(time);
}

/* ------------------------------------------------------------------ */
/* formatPlaybackTime                                                  */
/* ------------------------------------------------------------------ */
describe('formatPlaybackTime', () => {
  it('formats 0 ms', () => {
    expect(formatPlaybackTime(0)).toBe('00:00.0');
  });

  it('formats sub-second values', () => {
    expect(formatPlaybackTime(500)).toBe('00:00.5');
  });

  it('formats seconds', () => {
    expect(formatPlaybackTime(5000)).toBe('00:05.0');
  });

  it('formats minutes and seconds', () => {
    expect(formatPlaybackTime(125_500)).toBe('02:05.5');
  });

  it('handles negative values gracefully', () => {
    expect(formatPlaybackTime(-1000)).toBe('00:00.0');
  });
});

/* ================================================================== */
/* useTimelinePlayback hook                                            */
/* ================================================================== */
describe('useTimelinePlayback', () => {
  it('returns idle state initially', () => {
    const { result } = renderHook(() => useTimelinePlayback(testEvents));
    expect(result.current.state.status).toBe('idle');
    expect(result.current.state.speed).toBe(1);
    expect(result.current.state.startMs).toBe(1000);
    expect(result.current.state.endMs).toBe(6000);
  });

  it('computes correct bounds from events', () => {
    const { result } = renderHook(() => useTimelinePlayback(testEvents));
    expect(result.current.state.startMs).toBe(1000);
    expect(result.current.state.endMs).toBe(6000);
  });

  it('uses default bounds for empty events', () => {
    const { result } = renderHook(() => useTimelinePlayback([]));
    expect(result.current.state.startMs).toBe(0);
    expect(result.current.state.endMs).toBe(10_000);
  });

  it('sets status to playing on play()', () => {
    const { result } = renderHook(() => useTimelinePlayback(testEvents));
    hookAct(() => result.current.play());
    expect(result.current.state.status).toBe('playing');
  });

  it('sets status to paused on pause()', () => {
    const { result } = renderHook(() => useTimelinePlayback(testEvents));
    hookAct(() => result.current.play());
    hookAct(() => result.current.pause());
    expect(result.current.state.status).toBe('paused');
  });

  it('togglePlayPause toggles between playing and paused', () => {
    const { result } = renderHook(() => useTimelinePlayback(testEvents));
    hookAct(() => result.current.togglePlayPause());
    expect(result.current.state.status).toBe('playing');
    hookAct(() => result.current.togglePlayPause());
    expect(result.current.state.status).toBe('paused');
  });

  it('accepts initial speed option', () => {
    const { result } = renderHook(() => useTimelinePlayback(testEvents, { initialSpeed: 2 }));
    expect(result.current.state.speed).toBe(2);
  });

  it('setSpeed changes speed', () => {
    const { result } = renderHook(() => useTimelinePlayback(testEvents));
    hookAct(() => result.current.setSpeed(4));
    expect(result.current.state.speed).toBe(4);
  });

  /* -------------------------------------------------------------- */
  /* Stepping                                                        */
  /* -------------------------------------------------------------- */
  describe('step-through', () => {
    it('stepForward moves to the next event timestamp', () => {
      const { result } = renderHook(() => useTimelinePlayback(testEvents));
      // Initial position is at startMs (1000)
      expect(result.current.state.currentMs).toBe(1000);

      hookAct(() => result.current.stepForward());
      expect(result.current.state.currentMs).toBe(2000);

      hookAct(() => result.current.stepForward());
      expect(result.current.state.currentMs).toBe(3000);
    });

    it('stepForward pauses playback', () => {
      const { result } = renderHook(() => useTimelinePlayback(testEvents));
      hookAct(() => result.current.play());
      hookAct(() => result.current.stepForward());
      expect(result.current.state.status).toBe('paused');
    });

    it('stepBackward moves to the previous event timestamp', () => {
      const { result } = renderHook(() => useTimelinePlayback(testEvents));
      // Move to the end first
      hookAct(() => result.current.jumpToEnd());
      expect(result.current.state.currentMs).toBe(6000);

      hookAct(() => result.current.stepBackward());
      expect(result.current.state.currentMs).toBe(5000);

      hookAct(() => result.current.stepBackward());
      expect(result.current.state.currentMs).toBe(4000);
    });

    it('stepBackward at start stays at start', () => {
      const { result } = renderHook(() => useTimelinePlayback(testEvents));
      hookAct(() => result.current.stepBackward());
      expect(result.current.state.currentMs).toBe(1000);
    });

    it('stepForward at end goes to endMs', () => {
      const { result } = renderHook(() => useTimelinePlayback(testEvents));
      hookAct(() => result.current.jumpToEnd());
      hookAct(() => result.current.stepForward());
      expect(result.current.state.currentMs).toBe(6000);
    });

    it('stepForward does nothing with empty events', () => {
      const { result } = renderHook(() => useTimelinePlayback([]));
      const initialMs = result.current.state.currentMs;
      hookAct(() => result.current.stepForward());
      expect(result.current.state.currentMs).toBe(initialMs);
    });
  });

  /* -------------------------------------------------------------- */
  /* Seek                                                            */
  /* -------------------------------------------------------------- */
  describe('seek', () => {
    it('seek moves to specific position', () => {
      const { result } = renderHook(() => useTimelinePlayback(testEvents));
      hookAct(() => result.current.seek(3500));
      expect(result.current.state.currentMs).toBe(3500);
    });

    it('seek clamps to bounds', () => {
      const { result } = renderHook(() => useTimelinePlayback(testEvents));
      hookAct(() => result.current.seek(-500));
      expect(result.current.state.currentMs).toBe(1000);

      hookAct(() => result.current.seek(999_999));
      expect(result.current.state.currentMs).toBe(6000);
    });
  });

  /* -------------------------------------------------------------- */
  /* Jump                                                            */
  /* -------------------------------------------------------------- */
  describe('jump', () => {
    it('jumpToStart moves to startMs', () => {
      const { result } = renderHook(() => useTimelinePlayback(testEvents));
      hookAct(() => result.current.seek(4000));
      hookAct(() => result.current.jumpToStart());
      expect(result.current.state.currentMs).toBe(1000);
    });

    it('jumpToEnd moves to endMs', () => {
      const { result } = renderHook(() => useTimelinePlayback(testEvents));
      hookAct(() => result.current.jumpToEnd());
      expect(result.current.state.currentMs).toBe(6000);
    });

    it('jumpToStart pauses playback', () => {
      const { result } = renderHook(() => useTimelinePlayback(testEvents));
      hookAct(() => result.current.play());
      hookAct(() => result.current.jumpToStart());
      expect(result.current.state.status).toBe('paused');
    });
  });

  /* -------------------------------------------------------------- */
  /* Reset                                                           */
  /* -------------------------------------------------------------- */
  describe('reset', () => {
    it('resets to initial state', () => {
      const { result } = renderHook(() => useTimelinePlayback(testEvents, { initialSpeed: 2 }));
      hookAct(() => result.current.play());
      hookAct(() => result.current.seek(4000));
      hookAct(() => result.current.setSpeed(4));

      hookAct(() => result.current.reset());
      expect(result.current.state.status).toBe('idle');
      expect(result.current.state.currentMs).toBe(1000);
      expect(result.current.state.speed).toBe(2);
    });
  });

  /* -------------------------------------------------------------- */
  /* Callbacks                                                       */
  /* -------------------------------------------------------------- */
  describe('callbacks', () => {
    it('calls onPlayheadChange when position changes', () => {
      const onPlayheadChange = vi.fn();
      const { result } = renderHook(() => useTimelinePlayback(testEvents, { onPlayheadChange }));
      hookAct(() => result.current.seek(3000));
      expect(onPlayheadChange).toHaveBeenCalledWith(3000);
    });
  });

  /* -------------------------------------------------------------- */
  /* Playback animation                                              */
  /* -------------------------------------------------------------- */
  describe('playback animation', () => {
    it('advances playhead during play via requestAnimationFrame', () => {
      const { result } = renderHook(() => useTimelinePlayback(testEvents));
      hookAct(() => result.current.play());

      // First frame (initialization)
      hookAct(() => flushRAF(0));
      // Second frame (100ms later at 1x speed → +100ms)
      hookAct(() => flushRAF(100));

      expect(result.current.state.currentMs).toBeGreaterThan(1000);
    });

    it('pauses when reaching the end', () => {
      const onPlaybackComplete = vi.fn();
      const { result } = renderHook(() => useTimelinePlayback(testEvents, { onPlaybackComplete }));

      hookAct(() => result.current.play());
      // First frame init
      hookAct(() => flushRAF(0));
      // Jump far ahead
      hookAct(() => flushRAF(10_000));

      expect(result.current.state.status).toBe('paused');
      expect(result.current.state.currentMs).toBe(6000);
      expect(onPlaybackComplete).toHaveBeenCalled();
    });

    it('play from end restarts from beginning', () => {
      const { result } = renderHook(() => useTimelinePlayback(testEvents));
      hookAct(() => result.current.jumpToEnd());
      expect(result.current.state.currentMs).toBe(6000);

      hookAct(() => result.current.play());
      expect(result.current.state.currentMs).toBe(1000);
      expect(result.current.state.status).toBe('playing');
    });
  });

  /* -------------------------------------------------------------- */
  /* PLAYBACK_SPEEDS constant                                        */
  /* -------------------------------------------------------------- */
  it('exports PLAYBACK_SPEEDS constant', () => {
    expect(PLAYBACK_SPEEDS).toEqual([0.25, 0.5, 1, 2, 4]);
  });
});

/* ================================================================== */
/* PlaybackControls component                                          */
/* ================================================================== */
describe('PlaybackControls', () => {
  const defaultProps: PlaybackControlsProps = {
    status: 'idle',
    currentMs: 1000,
    speed: 1,
    startMs: 0,
    endMs: 10000,
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onStepForward: vi.fn(),
    onStepBackward: vi.fn(),
    onJumpToStart: vi.fn(),
    onJumpToEnd: vi.fn(),
    onSpeedChange: vi.fn(),
    onSeek: vi.fn(),
  };

  function renderControls(overrides: Partial<PlaybackControlsProps> = {}) {
    const props = { ...defaultProps, ...overrides };
    return render(<PlaybackControls {...props} />);
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* -------------------------------------------------------------- */
  /* Rendering                                                       */
  /* -------------------------------------------------------------- */
  it('renders the controls container', () => {
    renderControls();
    expect(screen.getByTestId('playback-controls')).toBeInTheDocument();
  });

  it('has toolbar role for accessibility', () => {
    renderControls();
    const controls = screen.getByTestId('playback-controls');
    expect(controls.getAttribute('role')).toBe('toolbar');
    expect(controls.getAttribute('aria-label')).toBe('Timeline playback controls');
  });

  it('applies custom className', () => {
    renderControls({ className: 'my-controls' });
    const controls = screen.getByTestId('playback-controls');
    expect(controls.className).toContain('my-controls');
  });

  /* -------------------------------------------------------------- */
  /* Play / Pause button                                             */
  /* -------------------------------------------------------------- */
  it('shows play button when not playing', () => {
    renderControls({ status: 'paused' });
    const btn = screen.getByTestId('playback-play-pause');
    expect(btn.getAttribute('aria-label')).toBe('Play');
  });

  it('shows pause button when playing', () => {
    renderControls({ status: 'playing' });
    const btn = screen.getByTestId('playback-play-pause');
    expect(btn.getAttribute('aria-label')).toBe('Pause');
  });

  it('calls onPlay when play button is clicked', () => {
    const onPlay = vi.fn();
    renderControls({ status: 'paused', onPlay });
    fireEvent.click(screen.getByTestId('playback-play-pause'));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('calls onPause when pause button is clicked', () => {
    const onPause = vi.fn();
    renderControls({ status: 'playing', onPause });
    fireEvent.click(screen.getByTestId('playback-play-pause'));
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  /* -------------------------------------------------------------- */
  /* Step buttons                                                    */
  /* -------------------------------------------------------------- */
  it('calls onStepForward when step forward is clicked', () => {
    const onStepForward = vi.fn();
    renderControls({ onStepForward });
    fireEvent.click(screen.getByTestId('playback-step-forward'));
    expect(onStepForward).toHaveBeenCalledTimes(1);
  });

  it('calls onStepBackward when step backward is clicked', () => {
    const onStepBackward = vi.fn();
    renderControls({ onStepBackward });
    fireEvent.click(screen.getByTestId('playback-step-backward'));
    expect(onStepBackward).toHaveBeenCalledTimes(1);
  });

  /* -------------------------------------------------------------- */
  /* Jump buttons                                                    */
  /* -------------------------------------------------------------- */
  it('calls onJumpToStart when jump-to-start is clicked', () => {
    const onJumpToStart = vi.fn();
    renderControls({ onJumpToStart });
    fireEvent.click(screen.getByTestId('playback-jump-start'));
    expect(onJumpToStart).toHaveBeenCalledTimes(1);
  });

  it('calls onJumpToEnd when jump-to-end is clicked', () => {
    const onJumpToEnd = vi.fn();
    renderControls({ onJumpToEnd });
    fireEvent.click(screen.getByTestId('playback-jump-end'));
    expect(onJumpToEnd).toHaveBeenCalledTimes(1);
  });

  /* -------------------------------------------------------------- */
  /* Speed control                                                   */
  /* -------------------------------------------------------------- */
  it('displays current speed', () => {
    renderControls({ speed: 2 });
    const speedBtn = screen.getByTestId('playback-speed');
    expect(speedBtn.textContent).toContain('2×');
  });

  it('cycles to next speed on click', () => {
    const onSpeedChange = vi.fn();
    renderControls({ speed: 1, onSpeedChange });
    fireEvent.click(screen.getByTestId('playback-speed'));
    expect(onSpeedChange).toHaveBeenCalledWith(2);
  });

  it('wraps around speed options', () => {
    const onSpeedChange = vi.fn();
    renderControls({ speed: 4, onSpeedChange });
    fireEvent.click(screen.getByTestId('playback-speed'));
    expect(onSpeedChange).toHaveBeenCalledWith(0.25);
  });

  /* -------------------------------------------------------------- */
  /* Time display                                                    */
  /* -------------------------------------------------------------- */
  it('displays formatted time', () => {
    renderControls({ currentMs: 5000, startMs: 0, endMs: 10000 });
    const time = screen.getByTestId('playback-time');
    expect(time.textContent).toContain('00:05.0');
    expect(time.textContent).toContain('00:10.0');
  });

  /* -------------------------------------------------------------- */
  /* Scrubber                                                        */
  /* -------------------------------------------------------------- */
  it('renders the scrubber with slider role', () => {
    renderControls();
    const scrubber = screen.getByTestId('playback-scrubber');
    expect(scrubber.getAttribute('role')).toBe('slider');
    expect(scrubber.getAttribute('aria-label')).toBe('Playback position');
  });

  it('calls onSeek when scrubber is clicked', () => {
    const onSeek = vi.fn();
    renderControls({ onSeek, startMs: 0, endMs: 10000 });
    const scrubber = screen.getByTestId('playback-scrubber');

    // Mock getBoundingClientRect
    vi.spyOn(scrubber, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      width: 200,
      top: 0,
      right: 200,
      bottom: 24,
      height: 24,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.click(scrubber, { clientX: 100 });
    expect(onSeek).toHaveBeenCalledWith(5000); // 50% of 10000
  });

  /* -------------------------------------------------------------- */
  /* Disabled state                                                  */
  /* -------------------------------------------------------------- */
  it('disables all buttons when disabled=true', () => {
    renderControls({ disabled: true });
    expect(screen.getByTestId('playback-play-pause')).toBeDisabled();
    expect(screen.getByTestId('playback-step-forward')).toBeDisabled();
    expect(screen.getByTestId('playback-step-backward')).toBeDisabled();
    expect(screen.getByTestId('playback-jump-start')).toBeDisabled();
    expect(screen.getByTestId('playback-jump-end')).toBeDisabled();
    expect(screen.getByTestId('playback-speed')).toBeDisabled();
  });

  it('does not call onSeek when scrubber is clicked and disabled', () => {
    const onSeek = vi.fn();
    renderControls({ disabled: true, onSeek });
    fireEvent.click(screen.getByTestId('playback-scrubber'));
    expect(onSeek).not.toHaveBeenCalled();
  });

  /* -------------------------------------------------------------- */
  /* Keyboard support                                                */
  /* -------------------------------------------------------------- */
  it('supports ArrowRight on scrubber to seek forward', () => {
    const onSeek = vi.fn();
    renderControls({ onSeek, currentMs: 5000, startMs: 0, endMs: 10000 });
    const scrubber = screen.getByTestId('playback-scrubber');
    fireEvent.keyDown(scrubber, { key: 'ArrowRight' });
    expect(onSeek).toHaveBeenCalled();
    const seekValue = onSeek.mock.calls[0][0];
    expect(seekValue).toBeGreaterThan(5000);
  });

  it('supports ArrowLeft on scrubber to seek backward', () => {
    const onSeek = vi.fn();
    renderControls({ onSeek, currentMs: 5000, startMs: 0, endMs: 10000 });
    const scrubber = screen.getByTestId('playback-scrubber');
    fireEvent.keyDown(scrubber, { key: 'ArrowLeft' });
    expect(onSeek).toHaveBeenCalled();
    const seekValue = onSeek.mock.calls[0][0];
    expect(seekValue).toBeLessThan(5000);
  });
});

/* ================================================================== */
/* Type exports (compile-time check)                                   */
/* ================================================================== */
describe('Playback type exports', () => {
  it('exports PlaybackSpeed type', () => {
    const speeds: PlaybackSpeed[] = [0.25, 0.5, 1, 2, 4];
    expect(speeds).toHaveLength(5);
  });

  it('exports PlaybackStatus type', () => {
    const statuses: PlaybackStatus[] = ['idle', 'playing', 'paused'];
    expect(statuses).toHaveLength(3);
  });

  it('exports PlaybackState type', () => {
    const state: PlaybackState = {
      status: 'idle',
      currentMs: 0,
      speed: 1,
      startMs: 0,
      endMs: 10000,
      currentEventIndex: -1,
    };
    expect(state.status).toBe('idle');
  });
});
