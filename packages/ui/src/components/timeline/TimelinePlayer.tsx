/**
 * TimelinePlayer — Integrated playback container for the debugging timeline.
 * TASK-146: Implement timeline playback and step-through
 *
 * Combines TimelineChart, PlaybackControls, and useTimelinePlayback hook
 * into a single component with keyboard shortcuts for a complete playback
 * experience.
 *
 * Keyboard shortcuts:
 * - Space: play/pause toggle
 * - ArrowRight: step to next event
 * - ArrowLeft: step to previous event
 * - Home: jump to start
 * - End: jump to end
 */
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { clsx } from 'clsx';
import { TimelineChart } from './TimelineChart.js';
import { PlaybackControls } from './PlaybackControls.js';
import type { TimelineAgent, TimelineEvent, PlaybackSpeed } from './types.js';
import { useTimelinePlayback } from '../../hooks/useTimelinePlayback.js';
import type { UseTimelinePlaybackOptions } from '../../hooks/useTimelinePlayback.js';

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

export interface TimelinePlayerProps {
  /** Agents to display as swimlanes. */
  agents: TimelineAgent[];
  /** Events to render in the timeline. */
  events: TimelineEvent[];
  /** Initial playback speed (default: 1). */
  initialSpeed?: PlaybackSpeed;
  /** Callback when an event is selected. */
  onEventSelect?: (eventId: string | null) => void;
  /** Callback when the playhead position changes. */
  onPlayheadChange?: (ms: number) => void;
  /** Callback when playback reaches the end. */
  onPlaybackComplete?: () => void;
  /** Whether controls are disabled. */
  disabled?: boolean;
  /** Read-only mode: disables all interaction. */
  readOnly?: boolean;
  /** Enable keyboard shortcuts (default: true). */
  enableKeyboardShortcuts?: boolean;
  /** Optional className for the root element. */
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const TimelinePlayer: React.FC<TimelinePlayerProps> = ({
  agents,
  events,
  initialSpeed,
  onEventSelect,
  onPlayheadChange,
  onPlaybackComplete,
  disabled = false,
  readOnly = false,
  enableKeyboardShortcuts = true,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const hookOptions: UseTimelinePlaybackOptions = useMemo(
    () => ({
      initialSpeed,
      onPlayheadChange,
      onPlaybackComplete,
    }),
    [initialSpeed, onPlayheadChange, onPlaybackComplete],
  );

  const { state, play, pause, stepForward, stepBackward, jumpToStart, jumpToEnd, seek, setSpeed } =
    useTimelinePlayback(events, hookOptions);

  // Determine which event is currently active for highlighting
  const currentEventId = useMemo(() => {
    if (state.currentEventIndex < 0) return null;
    // Build sorted timestamps and find the matching event
    const sortedEvents = [...events].sort((a, b) => a.startMs - b.startMs);
    // Collect unique timestamps in order
    const timestamps = new Set<number>();
    for (const e of events) {
      timestamps.add(e.startMs);
      if (e.endMs != null) timestamps.add(e.endMs);
    }
    const sortedTimestamps = Array.from(timestamps).sort((a, b) => a - b);
    const currentTimestamp = sortedTimestamps[state.currentEventIndex];
    if (currentTimestamp == null) return null;

    // Find the event at this timestamp
    const matchingEvent = sortedEvents.find(
      (e) => e.startMs === currentTimestamp || e.endMs === currentTimestamp,
    );
    return matchingEvent?.id ?? null;
  }, [events, state.currentEventIndex]);

  // Selected event state (separate from playback-driven highlighting)
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);

  // When stepping, auto-select the current event
  const displayedSelectedId = currentEventId ?? selectedEventId;

  const handleEventSelect = useCallback(
    (eventId: string | null) => {
      setSelectedEventId(eventId);
      onEventSelect?.(eventId);
    },
    [onEventSelect],
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts || disabled || readOnly) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when focus is within the player
      if (
        !containerRef.current?.contains(document.activeElement) &&
        document.activeElement !== containerRef.current
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (state.status === 'playing') {
            pause();
          } else {
            play();
          }
          break;
        case 'ArrowRight':
          // Only handle when not focused on the scrubber (which has its own handlers)
          if (!(e.target instanceof HTMLElement) || e.target.getAttribute('role') !== 'slider') {
            e.preventDefault();
            stepForward();
          }
          break;
        case 'ArrowLeft':
          if (!(e.target instanceof HTMLElement) || e.target.getAttribute('role') !== 'slider') {
            e.preventDefault();
            stepBackward();
          }
          break;
        case 'Home':
          e.preventDefault();
          jumpToStart();
          break;
        case 'End':
          e.preventDefault();
          jumpToEnd();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    enableKeyboardShortcuts,
    disabled,
    readOnly,
    state.status,
    play,
    pause,
    stepForward,
    stepBackward,
    jumpToStart,
    jumpToEnd,
  ]);

  return (
    <div
      ref={containerRef}
      data-testid="timeline-player"
      className={clsx('cs-timeline-player flex flex-col gap-2', className)}
      tabIndex={0}
      role="region"
      aria-label="Timeline playback player"
    >
      {/* Timeline chart with synced playhead */}
      <TimelineChart
        agents={agents}
        events={events}
        playheadMs={state.currentMs}
        selectedEventId={displayedSelectedId}
        onEventSelect={handleEventSelect}
        onPlayheadChange={seek}
        readOnly={readOnly}
      />

      {/* Playback transport controls */}
      <PlaybackControls
        status={state.status}
        currentMs={state.currentMs}
        speed={state.speed}
        startMs={state.startMs}
        endMs={state.endMs}
        onPlay={play}
        onPause={pause}
        onStepForward={stepForward}
        onStepBackward={stepBackward}
        onJumpToStart={jumpToStart}
        onJumpToEnd={jumpToEnd}
        onSpeedChange={setSpeed}
        onSeek={seek}
        disabled={disabled || readOnly}
      />
    </div>
  );
};

TimelinePlayer.displayName = 'TimelinePlayer';
