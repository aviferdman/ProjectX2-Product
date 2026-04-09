/**
 * AgentLane — A single agent swimlane containing event blocks/markers.
 * TASK-143: Implement timeline chart
 */
import React, { useCallback } from 'react';
import { TIMELINE_SIZING, LANE, GRID, isPointEvent } from './constants.js';
import { EventBlock } from './EventBlock.js';
import { EventMarker } from './EventMarker.js';
import type { AgentLaneProps } from './types.js';

export const AgentLane: React.FC<AgentLaneProps> = ({
  agent,
  events,
  index,
  timelineWidth,
  startMs,
  endMs,
  selectedEventId,
  onEventSelect,
}) => {
  const duration = endMs - startMs;
  const bg = index % 2 === 0 ? LANE.bg : LANE.bgAlt;
  const yOffset = index * TIMELINE_SIZING.laneHeight;

  const msToX = (ms: number) => {
    if (duration <= 0) return 0;
    return ((ms - startMs) / duration) * timelineWidth;
  };

  // Narrow the type for child components that expect (string) => void
  const handleEventClick = useCallback(
    (eventId: string) => {
      onEventSelect?.(eventId);
    },
    [onEventSelect],
  );

  return (
    <g data-testid={`agent-lane-${agent.id}`} transform={`translate(0, ${yOffset})`}>
      {/* Lane background */}
      <rect
        x={0}
        y={0}
        width={timelineWidth}
        height={TIMELINE_SIZING.laneHeight}
        fill={bg}
      />

      {/* Bottom border */}
      <line
        x1={0}
        y1={TIMELINE_SIZING.laneHeight}
        x2={timelineWidth}
        y2={TIMELINE_SIZING.laneHeight}
        stroke={LANE.borderColor}
        strokeWidth={1}
        opacity={0.5}
      />

      {/* Grid lines at major ticks */}
      {/* (Grid lines are rendered in the parent for full-height coverage) */}

      {/* Event blocks and markers */}
      {events.map((event) => {
        if (isPointEvent(event.type)) {
          return (
            <EventMarker
              key={event.id}
              event={event}
              cx={msToX(event.startMs)}
              isSelected={event.id === selectedEventId}
              onClick={onEventSelect ? handleEventClick : undefined}
            />
          );
        }

        const x = msToX(event.startMs);
        const xEnd = msToX(event.endMs ?? event.startMs + 100);
        const width = xEnd - x;

        return (
          <EventBlock
            key={event.id}
            event={event}
            x={x}
            width={width}
            isSelected={event.id === selectedEventId}
            onClick={onEventSelect ? handleEventClick : undefined}
          />
        );
      })}
    </g>
  );
};

AgentLane.displayName = 'AgentLane';
