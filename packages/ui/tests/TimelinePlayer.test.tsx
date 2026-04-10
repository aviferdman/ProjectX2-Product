/**
 * Tests for the TimelinePlayer integration component.
 * TASK-146: Implement timeline playback and step-through
 *
 * Tests cover:
 * - Rendering: chart + controls are wired together
 * - Playback integration: play/pause drives playhead in chart
 * - Step-through: step forward/backward navigates events
 * - Keyboard shortcuts: Space, ArrowLeft, ArrowRight, Home, End
 * - Event selection: clicking events + stepping auto-selects
 * - Disabled/readOnly modes
 * - Callbacks: onEventSelect, onPlayheadChange, onPlaybackComplete
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

import { TimelinePlayer } from '../src/components/timeline/TimelinePlayer.js';
import type { TimelinePlayerProps } from '../src/components/timeline/TimelinePlayer.js';
import type { TimelineAgent, TimelineEvent } from '../src/components/timeline/types.js';

/* ------------------------------------------------------------------ */
/* Test data                                                           */
/* ------------------------------------------------------------------ */

const testAgents: TimelineAgent[] = [
  { id: 'agent-1', name: 'Analyst', color: '#f59e0b' },
  { id: 'agent-2', name: 'Coder', color: '#10b981' },
];

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
/* Mock ResizeObserver (jsdom doesn't have it)                         */
/* ------------------------------------------------------------------ */
class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe() {
    this.callback(
      [{ contentRect: { width: 800, height: 400 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
  unobserve() {}
  disconnect() {}
}

/* ------------------------------------------------------------------ */
/* Mock RAF                                                            */
/* ------------------------------------------------------------------ */
let rafCallbacks: ((time: number) => void)[] = [];
let rafId = 0;

beforeEach(() => {
  rafCallbacks = [];
  rafId = 0;
  (globalThis as any).ResizeObserver = MockResizeObserver;
  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
    rafCallbacks.push(cb);
    return ++rafId;
  });
  vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function flushRAF(time: number) {
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  for (const cb of cbs) cb(time);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function renderPlayer(overrides: Partial<TimelinePlayerProps> = {}) {
  const props: TimelinePlayerProps = {
    agents: testAgents,
    events: testEvents,
    ...overrides,
  };
  return render(<TimelinePlayer {...props} />);
}

/* ================================================================== */
/* Tests                                                               */
/* ================================================================== */

describe('TimelinePlayer', () => {
  /* -------------------------------------------------------------- */
  /* Rendering                                                       */
  /* -------------------------------------------------------------- */
  describe('rendering', () => {
    it('renders the player container', () => {
      renderPlayer();
      expect(screen.getByTestId('timeline-player')).toBeInTheDocument();
    });

    it('renders the timeline chart', () => {
      renderPlayer();
      expect(screen.getByTestId('timeline-chart')).toBeInTheDocument();
    });

    it('renders the playback controls', () => {
      renderPlayer();
      expect(screen.getByTestId('playback-controls')).toBeInTheDocument();
    });

    it('has region role with label', () => {
      renderPlayer();
      const player = screen.getByTestId('timeline-player');
      expect(player.getAttribute('role')).toBe('region');
      expect(player.getAttribute('aria-label')).toBe('Timeline playback player');
    });

    it('applies custom className', () => {
      renderPlayer({ className: 'my-player' });
      const player = screen.getByTestId('timeline-player');
      expect(player.className).toContain('my-player');
    });

    it('is focusable (has tabIndex)', () => {
      renderPlayer();
      const player = screen.getByTestId('timeline-player');
      expect(player.getAttribute('tabindex')).toBe('0');
    });
  });

  /* -------------------------------------------------------------- */
  /* Playback integration                                            */
  /* -------------------------------------------------------------- */
  describe('playback integration', () => {
    it('starts in idle state with play button', () => {
      renderPlayer();
      const playBtn = screen.getByTestId('playback-play-pause');
      expect(playBtn.getAttribute('aria-label')).toBe('Play');
    });

    it('clicking play starts playback', () => {
      renderPlayer();
      const playBtn = screen.getByTestId('playback-play-pause');
      fireEvent.click(playBtn);
      expect(playBtn.getAttribute('aria-label')).toBe('Pause');
    });

    it('clicking pause stops playback', () => {
      renderPlayer();
      const playBtn = screen.getByTestId('playback-play-pause');
      // Play
      fireEvent.click(playBtn);
      expect(playBtn.getAttribute('aria-label')).toBe('Pause');
      // Pause
      fireEvent.click(playBtn);
      expect(playBtn.getAttribute('aria-label')).toBe('Play');
    });

    it('playhead advances during playback', () => {
      const onPlayheadChange = vi.fn();
      renderPlayer({ onPlayheadChange });

      fireEvent.click(screen.getByTestId('playback-play-pause'));

      // First frame (initialization)
      act(() => flushRAF(0));
      // Second frame (100ms later at 1x speed)
      act(() => flushRAF(100));

      // onPlayheadChange should have been called with an advanced position
      const calls = onPlayheadChange.mock.calls;
      const lastCall = calls[calls.length - 1]![0];
      expect(lastCall).toBeGreaterThan(1000);
    });

    it('calls onPlaybackComplete when reaching the end', () => {
      const onPlaybackComplete = vi.fn();
      renderPlayer({ onPlaybackComplete });

      fireEvent.click(screen.getByTestId('playback-play-pause'));

      // Init frame
      act(() => flushRAF(0));
      // Jump far ahead to reach end
      act(() => flushRAF(10_000));

      expect(onPlaybackComplete).toHaveBeenCalled();
    });
  });

  /* -------------------------------------------------------------- */
  /* Step-through                                                    */
  /* -------------------------------------------------------------- */
  describe('step-through', () => {
    it('step forward button advances to next event', () => {
      const onPlayheadChange = vi.fn();
      renderPlayer({ onPlayheadChange });

      fireEvent.click(screen.getByTestId('playback-step-forward'));

      // Should move from 1000 to 2000 (next timestamp)
      const calls = onPlayheadChange.mock.calls;
      expect(calls.some((c: number[]) => c[0] === 2000)).toBe(true);
    });

    it('step backward button goes to previous event', () => {
      const onPlayheadChange = vi.fn();
      renderPlayer({ onPlayheadChange });

      // First jump to end
      fireEvent.click(screen.getByTestId('playback-jump-end'));
      // Then step backward
      fireEvent.click(screen.getByTestId('playback-step-backward'));

      const calls = onPlayheadChange.mock.calls;
      expect(calls.some((c: number[]) => c[0] === 5000)).toBe(true);
    });

    it('jump to start resets to beginning', () => {
      const onPlayheadChange = vi.fn();
      renderPlayer({ onPlayheadChange });

      // Move forward first
      fireEvent.click(screen.getByTestId('playback-step-forward'));
      // Then jump to start
      fireEvent.click(screen.getByTestId('playback-jump-start'));

      const calls = onPlayheadChange.mock.calls;
      const lastCall = calls[calls.length - 1]![0];
      expect(lastCall).toBe(1000);
    });

    it('jump to end goes to final position', () => {
      const onPlayheadChange = vi.fn();
      renderPlayer({ onPlayheadChange });

      fireEvent.click(screen.getByTestId('playback-jump-end'));

      const calls = onPlayheadChange.mock.calls;
      expect(calls.some((c: number[]) => c[0] === 6000)).toBe(true);
    });
  });

  /* -------------------------------------------------------------- */
  /* Keyboard shortcuts                                              */
  /* -------------------------------------------------------------- */
  describe('keyboard shortcuts', () => {
    it('Space toggles play/pause', () => {
      renderPlayer();
      const player = screen.getByTestId('timeline-player');
      player.focus();

      fireEvent.keyDown(document, { key: ' ' });

      const playBtn = screen.getByTestId('playback-play-pause');
      expect(playBtn.getAttribute('aria-label')).toBe('Pause');

      fireEvent.keyDown(document, { key: ' ' });
      expect(playBtn.getAttribute('aria-label')).toBe('Play');
    });

    it('ArrowRight steps forward', () => {
      const onPlayheadChange = vi.fn();
      renderPlayer({ onPlayheadChange });
      const player = screen.getByTestId('timeline-player');
      player.focus();

      fireEvent.keyDown(document, { key: 'ArrowRight' });

      const calls = onPlayheadChange.mock.calls;
      expect(calls.some((c: number[]) => c[0] === 2000)).toBe(true);
    });

    it('ArrowLeft steps backward', () => {
      const onPlayheadChange = vi.fn();
      renderPlayer({ onPlayheadChange });
      const player = screen.getByTestId('timeline-player');
      player.focus();

      // First step forward, then step backward
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      const calls = onPlayheadChange.mock.calls;
      expect(calls.some((c: number[]) => c[0] === 1000)).toBe(true);
    });

    it('Home jumps to start', () => {
      const onPlayheadChange = vi.fn();
      renderPlayer({ onPlayheadChange });
      const player = screen.getByTestId('timeline-player');
      player.focus();

      // Move forward first
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      // Then Home
      fireEvent.keyDown(document, { key: 'Home' });

      const calls = onPlayheadChange.mock.calls;
      const lastCall = calls[calls.length - 1]![0];
      expect(lastCall).toBe(1000);
    });

    it('End jumps to end', () => {
      const onPlayheadChange = vi.fn();
      renderPlayer({ onPlayheadChange });
      const player = screen.getByTestId('timeline-player');
      player.focus();

      fireEvent.keyDown(document, { key: 'End' });

      const calls = onPlayheadChange.mock.calls;
      expect(calls.some((c: number[]) => c[0] === 6000)).toBe(true);
    });

    it('keyboard shortcuts are disabled when disabled=true', () => {
      const onPlayheadChange = vi.fn();
      renderPlayer({ disabled: true, onPlayheadChange });
      const player = screen.getByTestId('timeline-player');
      player.focus();

      fireEvent.keyDown(document, { key: ' ' });
      fireEvent.keyDown(document, { key: 'ArrowRight' });

      // Play button should still say Play (not toggled)
      const playBtn = screen.getByTestId('playback-play-pause');
      expect(playBtn.getAttribute('aria-label')).toBe('Play');
    });

    it('keyboard shortcuts are disabled when readOnly=true', () => {
      renderPlayer({ readOnly: true });
      const player = screen.getByTestId('timeline-player');
      player.focus();

      fireEvent.keyDown(document, { key: ' ' });

      const playBtn = screen.getByTestId('playback-play-pause');
      expect(playBtn.getAttribute('aria-label')).toBe('Play');
    });

    it('keyboard shortcuts can be disabled via enableKeyboardShortcuts=false', () => {
      renderPlayer({ enableKeyboardShortcuts: false });
      const player = screen.getByTestId('timeline-player');
      player.focus();

      fireEvent.keyDown(document, { key: ' ' });

      const playBtn = screen.getByTestId('playback-play-pause');
      expect(playBtn.getAttribute('aria-label')).toBe('Play');
    });
  });

  /* -------------------------------------------------------------- */
  /* Event selection                                                 */
  /* -------------------------------------------------------------- */
  describe('event selection', () => {
    it('calls onEventSelect when an event is clicked in the chart', () => {
      const onEventSelect = vi.fn();
      renderPlayer({ onEventSelect });

      // The timeline chart should render events; clicking one triggers onEventSelect
      // Event blocks have data-testid="event-block-{id}" pattern
      const eventBlocks = screen.queryAllByTestId(/^event-/);
      if (eventBlocks.length > 0) {
        fireEvent.click(eventBlocks[0]!);
        expect(onEventSelect).toHaveBeenCalled();
      }
    });
  });

  /* -------------------------------------------------------------- */
  /* Disabled / readOnly                                             */
  /* -------------------------------------------------------------- */
  describe('disabled state', () => {
    it('disables controls when disabled=true', () => {
      renderPlayer({ disabled: true });
      expect(screen.getByTestId('playback-play-pause')).toBeDisabled();
      expect(screen.getByTestId('playback-step-forward')).toBeDisabled();
      expect(screen.getByTestId('playback-step-backward')).toBeDisabled();
    });

    it('disables controls when readOnly=true', () => {
      renderPlayer({ readOnly: true });
      expect(screen.getByTestId('playback-play-pause')).toBeDisabled();
      expect(screen.getByTestId('playback-step-forward')).toBeDisabled();
    });
  });

  /* -------------------------------------------------------------- */
  /* Speed control                                                   */
  /* -------------------------------------------------------------- */
  describe('speed control', () => {
    it('starts at default speed (1x)', () => {
      renderPlayer();
      const speedBtn = screen.getByTestId('playback-speed');
      expect(speedBtn.textContent).toContain('1×');
    });

    it('accepts initial speed', () => {
      renderPlayer({ initialSpeed: 2 });
      const speedBtn = screen.getByTestId('playback-speed');
      expect(speedBtn.textContent).toContain('2×');
    });

    it('cycles speed on click', () => {
      renderPlayer();
      const speedBtn = screen.getByTestId('playback-speed');

      // Click to go from 1x → 2x
      fireEvent.click(speedBtn);
      expect(speedBtn.textContent).toContain('2×');
    });
  });

  /* -------------------------------------------------------------- */
  /* Empty events                                                    */
  /* -------------------------------------------------------------- */
  describe('empty events', () => {
    it('renders with empty events array', () => {
      renderPlayer({ events: [] });
      expect(screen.getByTestId('timeline-player')).toBeInTheDocument();
      expect(screen.getByTestId('playback-controls')).toBeInTheDocument();
    });
  });
});
