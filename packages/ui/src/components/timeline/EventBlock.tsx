/**
 * EventBlock — Renders a duration event as a colored rounded rectangle.
 * TASK-143: Implement timeline chart
 */
import React, { useCallback } from 'react';
import { TIMELINE_SIZING, EVENT_STYLES, SELECTION } from './constants.js';
import type { EventBlockProps, TimelineEventType } from './types.js';

export const EventBlock: React.FC<EventBlockProps> = ({
  event,
  x,
  width,
  isSelected = false,
  onClick,
}) => {
  const style = EVENT_STYLES[event.type as TimelineEventType] ?? EVENT_STYLES['llm-call'];
  const displayWidth = Math.max(width, TIMELINE_SIZING.eventMinWidth);
  const y = (TIMELINE_SIZING.laneHeight - TIMELINE_SIZING.eventHeight) / 2;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick?.(event.id);
    },
    [event.id, onClick],
  );

  const ariaLabel = `${style.label}, ${event.label}, ${formatDuration(event.startMs, event.endMs)}`;

  return (
    <g
      data-testid={`event-block-${event.id}`}
      className={`cs-event-${event.type}`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      {/* Selection glow */}
      {isSelected && (
        <rect
          x={x - SELECTION.ringWidth}
          y={y - SELECTION.ringWidth}
          width={displayWidth + SELECTION.ringWidth * 2}
          height={TIMELINE_SIZING.eventHeight + SELECTION.ringWidth * 2}
          rx={TIMELINE_SIZING.eventBorderRadius + 1}
          fill={SELECTION.glowColor}
          stroke={SELECTION.ringColor}
          strokeWidth={SELECTION.ringWidth}
        />
      )}

      {/* Event block */}
      <rect
        x={x}
        y={y}
        width={displayWidth}
        height={TIMELINE_SIZING.eventHeight}
        rx={TIMELINE_SIZING.eventBorderRadius}
        fill={style.bg}
        stroke={style.border}
        strokeWidth={TIMELINE_SIZING.eventBorderWidth}
      />

      {/* Icon + label (only if wide enough) */}
      {displayWidth > 24 && (
        <text
          x={x + TIMELINE_SIZING.eventPadding.x + 2}
          y={y + TIMELINE_SIZING.eventHeight / 2}
          dominantBaseline="central"
          fill={style.iconColor}
          fontSize={11}
          fontWeight={500}
          fontFamily="Inter, sans-serif"
          clipPath={`inset(0 ${Math.max(0, displayWidth - 12)}px 0 0)`}
        >
          {style.icon}{' '}
          <tspan fill="var(--cs-text-primary, #e2e8f0)">
            {truncateLabel(event.label, displayWidth - 30)}
          </tspan>
        </text>
      )}

      {/* Pulsing right edge for live events */}
      {event.isLive && (
        <rect
          x={x + displayWidth - 3}
          y={y}
          width={3}
          height={TIMELINE_SIZING.eventHeight}
          rx={1}
          fill={style.border}
          opacity={0.8}
          className="animate-pulse"
        />
      )}
    </g>
  );
};

EventBlock.displayName = 'EventBlock';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDuration(startMs: number, endMs?: number): string {
  if (endMs == null) return `at ${formatMs(startMs)}`;
  const dur = endMs - startMs;
  return `${formatMs(startMs)} to ${formatMs(endMs)}, ${dur < 1000 ? `${dur}ms` : `${(dur / 1000).toFixed(1)}s`} duration`;
}

function formatMs(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  const frac = ms % 1000;
  return `${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(frac).padStart(3, '0')}`;
}

function truncateLabel(label: string, maxWidth: number): string {
  // Rough estimate: 6px per character at 11px font
  const maxChars = Math.max(1, Math.floor(maxWidth / 6));
  if (label.length <= maxChars) return label;
  return label.slice(0, maxChars - 1) + '…';
}
