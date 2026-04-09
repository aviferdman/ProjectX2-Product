/**
 * PlaybackControls — Transport bar for timeline playback and step-through.
 * TASK-146: Implement timeline playback and step-through
 *
 * Renders play/pause, step forward/backward, jump-to-start/end, speed
 * selector, time display, and a scrubber progress bar.
 */
import React, { useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import { PLAYHEAD } from './constants.js';
import type { PlaybackControlsProps, PlaybackSpeed } from './types.js';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const SPEED_OPTIONS: PlaybackSpeed[] = [0.25, 0.5, 1, 2, 4];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Format ms as mm:ss.ms */
export function formatPlaybackTime(ms: number): string {
  const totalSeconds = Math.max(0, ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.floor((totalSeconds % 1) * 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${millis}`;
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

const IconButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  label: string;
  testId: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, label, testId, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    data-testid={testId}
    aria-label={label}
    className={clsx(
      'inline-flex items-center justify-center rounded',
      'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
      disabled
        ? 'opacity-40 cursor-not-allowed'
        : 'hover:bg-white/10 active:bg-white/20 cursor-pointer',
    )}
    style={{
      width: 32,
      height: 32,
      color: 'var(--cs-text-secondary, #cbd5e1)',
      fontSize: 14,
    }}
  >
    {children}
  </button>
);

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  status,
  currentMs,
  speed,
  startMs,
  endMs,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onJumpToStart,
  onJumpToEnd,
  onSpeedChange,
  onSeek,
  disabled = false,
  className,
}) => {
  const scrubberRef = useRef<HTMLDivElement>(null);

  const duration = Math.max(1, endMs - startMs);
  const progress = Math.max(0, Math.min(1, (currentMs - startMs) / duration));

  const isPlaying = status === 'playing';

  // Handle play/pause toggle
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [isPlaying, onPlay, onPause]);

  // Handle speed cycling
  const handleSpeedChange = useCallback(() => {
    const idx = SPEED_OPTIONS.indexOf(speed);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length]!;
    onSpeedChange(next);
  }, [speed, onSpeedChange]);

  // Handle scrubber click
  const handleScrubberClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      const rect = scrubberRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(startMs + ratio * duration);
    },
    [disabled, startMs, duration, onSeek],
  );

  // Keyboard support on scrubber
  const handleScrubberKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      const step = duration * 0.01; // 1% of duration
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onSeek(Math.min(currentMs + step, endMs));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSeek(Math.max(currentMs - step, startMs));
      }
    },
    [disabled, currentMs, startMs, endMs, duration, onSeek],
  );

  return (
    <div
      data-testid="playback-controls"
      className={clsx(
        'cs-playback-controls flex items-center gap-2',
        className,
      )}
      style={{
        padding: '8px 12px',
        background: 'var(--cs-surface-card, #1e293b)',
        borderRadius: 8,
        border: '1px solid var(--cs-border-subtle, rgba(51,65,85,0.5))',
      }}
      role="toolbar"
      aria-label="Timeline playback controls"
    >
      {/* Jump to start */}
      <IconButton
        onClick={onJumpToStart}
        disabled={disabled}
        label="Jump to start"
        testId="playback-jump-start"
      >
        ⏮
      </IconButton>

      {/* Step backward */}
      <IconButton
        onClick={onStepBackward}
        disabled={disabled}
        label="Step to previous event"
        testId="playback-step-backward"
      >
        ⏪
      </IconButton>

      {/* Play / Pause */}
      <button
        type="button"
        onClick={handlePlayPause}
        disabled={disabled}
        data-testid="playback-play-pause"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className={clsx(
          'inline-flex items-center justify-center rounded-full',
          'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
          disabled
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:brightness-110 active:brightness-90 cursor-pointer',
        )}
        style={{
          width: 36,
          height: 36,
          background: PLAYHEAD.color,
          color: '#fff',
          fontSize: 16,
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Step forward */}
      <IconButton
        onClick={onStepForward}
        disabled={disabled}
        label="Step to next event"
        testId="playback-step-forward"
      >
        ⏩
      </IconButton>

      {/* Jump to end */}
      <IconButton
        onClick={onJumpToEnd}
        disabled={disabled}
        label="Jump to end"
        testId="playback-jump-end"
      >
        ⏭
      </IconButton>

      {/* Scrubber / progress bar */}
      <div
        ref={scrubberRef}
        data-testid="playback-scrubber"
        className="flex-1 mx-2 relative cursor-pointer"
        style={{ height: 24 }}
        onClick={handleScrubberClick}
        onKeyDown={handleScrubberKeyDown}
        role="slider"
        aria-label="Playback position"
        aria-valuenow={Math.round(currentMs)}
        aria-valuemin={startMs}
        aria-valuemax={endMs}
        tabIndex={disabled ? -1 : 0}
      >
        {/* Track background */}
        <div
          className="absolute top-1/2 left-0 right-0 rounded-full"
          style={{
            height: 4,
            transform: 'translateY(-50%)',
            background: 'var(--cs-border-subtle, rgba(51,65,85,0.5))',
          }}
        />
        {/* Track fill */}
        <div
          data-testid="playback-scrubber-fill"
          className="absolute top-1/2 left-0 rounded-full"
          style={{
            height: 4,
            transform: 'translateY(-50%)',
            width: `${progress * 100}%`,
            background: PLAYHEAD.color,
            transition: isPlaying ? 'none' : 'width 0.1s ease',
          }}
        />
        {/* Thumb */}
        <div
          data-testid="playback-scrubber-thumb"
          className="absolute top-1/2 rounded-full"
          style={{
            width: 12,
            height: 12,
            transform: 'translate(-50%, -50%)',
            left: `${progress * 100}%`,
            background: PLAYHEAD.color,
            boxShadow: `0 0 4px ${PLAYHEAD.glowColor}`,
            transition: isPlaying ? 'none' : 'left 0.1s ease',
          }}
        />
      </div>

      {/* Time display */}
      <span
        data-testid="playback-time"
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12,
          color: 'var(--cs-text-secondary, #94a3b8)',
          minWidth: 100,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {formatPlaybackTime(currentMs - startMs)} / {formatPlaybackTime(endMs - startMs)}
      </span>

      {/* Speed control */}
      <button
        type="button"
        onClick={handleSpeedChange}
        disabled={disabled}
        data-testid="playback-speed"
        aria-label={`Playback speed: ${speed}x. Click to change.`}
        className={clsx(
          'inline-flex items-center justify-center rounded px-2',
          'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
          disabled
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:bg-white/10 cursor-pointer',
        )}
        style={{
          height: 28,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12,
          fontWeight: 600,
          color: speed === 1 ? 'var(--cs-text-secondary, #94a3b8)' : PLAYHEAD.color,
          border: `1px solid ${speed === 1 ? 'var(--cs-border-subtle, rgba(51,65,85,0.5))' : PLAYHEAD.color}`,
          borderRadius: 4,
        }}
      >
        {speed}×
      </button>
    </div>
  );
};

PlaybackControls.displayName = 'PlaybackControls';
