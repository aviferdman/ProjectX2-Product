/**
 * EventMarker — Renders a point event (task-start, task-complete) as a circle marker.
 * TASK-143: Implement timeline chart
 */
import React, { useCallback } from 'react';
import { TIMELINE_SIZING, EVENT_STYLES, SELECTION } from './constants.js';
import type { EventMarkerProps, TimelineEventType } from './types.js';

export const EventMarker: React.FC<EventMarkerProps> = ({
  event,
  cx,
  isSelected = false,
  onClick,
}) => {
  const style = EVENT_STYLES[event.type as TimelineEventType] ?? EVENT_STYLES['task-start'];
  const cy = TIMELINE_SIZING.laneHeight / 2;
  const r = TIMELINE_SIZING.eventMarkerSize / 2;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick?.(event.id);
    },
    [event.id, onClick],
  );

  const ariaLabel = `${style.label}: ${event.label} at ${formatPointTime(event.startMs)}`;

  return (
    <g
      data-testid={`event-marker-${event.id}`}
      className={`cs-event-${event.type}`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      {/* Selection ring */}
      {isSelected && (
        <circle
          cx={cx}
          cy={cy}
          r={r + SELECTION.ringWidth + 2}
          fill={SELECTION.glowColor}
          stroke={SELECTION.ringColor}
          strokeWidth={SELECTION.ringWidth}
        />
      )}

      {/* Marker circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={style.bg}
        stroke={style.border}
        strokeWidth={TIMELINE_SIZING.eventBorderWidth}
      />

      {/* Icon */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={style.iconColor}
        fontSize={8}
        fontWeight={600}
      >
        {style.icon}
      </text>
    </g>
  );
};

EventMarker.displayName = 'EventMarker';

function formatPointTime(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  const frac = ms % 1000;
  return `${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(frac).padStart(3, '0')}`;
}
