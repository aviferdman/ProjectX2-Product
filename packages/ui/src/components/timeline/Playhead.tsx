/**
 * Playhead — Vertical line indicating current playback position.
 * TASK-143: Implement timeline chart
 */
import React from 'react';
import { TIMELINE_SIZING, PLAYHEAD } from './constants.js';
import type { PlayheadProps } from './types.js';

export const Playhead: React.FC<PlayheadProps> = ({ x, height, isPlaying = false }) => {
  const handleSize = TIMELINE_SIZING.playheadHandleSize;

  return (
    <g
      data-testid="timeline-playhead"
      className="cs-timeline-playhead"
      role="slider"
      aria-label="Timeline playhead"
      aria-valuenow={Math.round(x)}
    >
      {/* Vertical line */}
      <line
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke={PLAYHEAD.color}
        strokeWidth={TIMELINE_SIZING.playheadWidth}
        style={isPlaying ? { filter: `drop-shadow(0 0 6px ${PLAYHEAD.glowColor})` } : undefined}
      />

      {/* Inverted triangle handle at the top */}
      <polygon
        points={`${x - handleSize / 2},0 ${x + handleSize / 2},0 ${x},${handleSize}`}
        fill={PLAYHEAD.color}
        style={isPlaying ? { filter: `drop-shadow(0 0 4px ${PLAYHEAD.glowColor})` } : undefined}
      />
    </g>
  );
};

Playhead.displayName = 'Playhead';
