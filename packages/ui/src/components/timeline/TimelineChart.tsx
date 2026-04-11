/**
 * TimelineChart — Main container for the debugging timeline swimlane chart.
 * TASK-143: Implement timeline chart (time axis, agent lanes, event blocks)
 *
 * Renders a horizontal swimlane chart with:
 * - Time axis with auto-scaled tick marks
 * - Agent lanes with event blocks and point markers
 * - Playhead for current position
 * - Vertical grid lines at major ticks
 * - Click-to-select events, click axis to move playhead
 */
import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { TIMELINE_SIZING, GRID, LANE } from './constants.js';
import { TimeAxis } from './TimeAxis.js';
import { AgentLane } from './AgentLane.js';
import { Playhead } from './Playhead.js';
import type { TimelineChartProps, TimelineEvent, TimelineViewport } from './types.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Compute the viewport from event data (with 5% padding). */
function computeViewport(events: TimelineEvent[]): TimelineViewport {
  if (events.length === 0) return { startMs: 0, endMs: 10_000 };

  let min = Infinity;
  let max = -Infinity;
  for (const e of events) {
    if (e.startMs < min) min = e.startMs;
    const end = e.endMs ?? e.startMs;
    if (end > max) max = end;
  }

  const range = max - min || 1_000;
  const padding = range * 0.05;
  return {
    startMs: Math.max(0, Math.floor(min - padding)),
    endMs: Math.ceil(max + padding),
  };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const TimelineChart: React.FC<TimelineChartProps> = ({
  agents,
  events,
  playheadMs,
  selectedEventId = null,
  onEventSelect,
  onPlayheadChange,
  className,
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // Observe container width for responsive sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute viewport from events
  const viewport = useMemo(() => computeViewport(events), [events]);

  // Group events by agent
  const eventsByAgent = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const agent of agents) {
      map.set(agent.id, []);
    }
    for (const event of events) {
      const list = map.get(event.agentId);
      if (list) list.push(event);
    }
    return map;
  }, [agents, events]);

  // SVG dimensions
  const timelineContentWidth = Math.max(0, containerWidth - TIMELINE_SIZING.laneLabelWidth);
  const chartHeight =
    TIMELINE_SIZING.axisHeight + agents.length * TIMELINE_SIZING.laneHeight;

  // Playhead position
  const playheadX = useMemo(() => {
    if (playheadMs == null) return null;
    const duration = viewport.endMs - viewport.startMs;
    if (duration <= 0) return null;
    return ((playheadMs - viewport.startMs) / duration) * timelineContentWidth;
  }, [playheadMs, viewport, timelineContentWidth]);

  // Axis click → move playhead
  const handleAxisClick = useCallback(
    (ms: number) => {
      if (readOnly) return;
      onPlayheadChange?.(ms);
    },
    [readOnly, onPlayheadChange],
  );

  // Event selection
  const handleEventSelect = useCallback(
    (eventId: string | null) => {
      if (readOnly) return;
      onEventSelect?.(eventId);
    },
    [readOnly, onEventSelect],
  );

  // Deselect when clicking empty space
  const handleBackgroundClick = useCallback(() => {
    if (readOnly) return;
    onEventSelect?.(null);
  }, [readOnly, onEventSelect]);

  // Grid lines (full height, at major ticks)
  const gridLines = useMemo(() => {
    const duration = viewport.endMs - viewport.startMs;
    if (duration <= 0 || timelineContentWidth <= 0) return [];

    // Match the TimeAxis major tick logic
    const pxPerMs = timelineContentWidth / duration;
    const targetMs = 100 / pxPerMs;

    const candidates = [100, 500, 1_000, 5_000, 30_000, 60_000, 300_000, 3_600_000];
    let major = candidates[candidates.length - 1]!;
    for (const c of candidates) {
      if (c >= targetMs * 0.5) {
        major = c;
        break;
      }
    }

    const lines: number[] = [];
    const first = Math.ceil(viewport.startMs / major) * major;
    for (let ms = first; ms <= viewport.endMs; ms += major) {
      lines.push(((ms - viewport.startMs) / duration) * timelineContentWidth);
    }
    return lines;
  }, [viewport, timelineContentWidth]);

  return (
    <div
      ref={containerRef}
      data-testid="timeline-chart"
      className={clsx('cs-timeline relative overflow-hidden', className)}
      style={{ minHeight: chartHeight }}
      role="region"
      aria-label="Debugging timeline chart"
    >
      <div className="flex" style={{ minHeight: chartHeight }}>
        {/* Agent lane labels (sticky left column) */}
        <div
          className="flex-shrink-0 z-10"
          style={{ width: TIMELINE_SIZING.laneLabelWidth }}
          data-testid="timeline-lane-labels"
        >
          {/* Axis placeholder */}
          <div
            className="flex items-center justify-center"
            style={{
              height: TIMELINE_SIZING.axisHeight,
              background: 'var(--cs-surface-panel, #111113)',
              borderBottom: `1px solid ${GRID.axisLineColor}`,
              borderRight: `1px solid ${LANE.borderColor}`,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--cs-text-tertiary, #52525b)',
              }}
            >
              Agents
            </span>
          </div>

          {/* Lane labels */}
          {agents.map((agent, i) => (
            <div
              key={agent.id}
              data-testid={`lane-label-${agent.id}`}
              className="flex items-center gap-2 px-3"
              style={{
                height: TIMELINE_SIZING.laneHeight,
                background: 'var(--cs-surface-panel, #111113)',
                borderBottom: `1px solid ${LANE.borderColor}`,
                borderRight: `1px solid ${LANE.borderColor}`,
              }}
            >
              {/* Agent color dot */}
              <span
                className="flex-shrink-0 rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: agent.color,
                }}
                aria-hidden="true"
              />
              {/* Agent name */}
              <span
                className="truncate"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--cs-text-secondary, #a1a1aa)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {agent.name}
              </span>
            </div>
          ))}
        </div>

        {/* Timeline content area (SVG) */}
        <div className="flex-1 overflow-x-auto" onClick={handleBackgroundClick}>
          <svg
            width={timelineContentWidth}
            height={chartHeight}
            data-testid="timeline-svg"
            style={{ display: 'block' }}
          >
            {/* Time axis */}
            <TimeAxis
              width={timelineContentWidth}
              startMs={viewport.startMs}
              endMs={viewport.endMs}
              onAxisClick={readOnly ? undefined : handleAxisClick}
            />

            {/* Lanes area */}
            <g transform={`translate(0, ${TIMELINE_SIZING.axisHeight})`}>
              {/* Vertical grid lines */}
              {gridLines.map((x, i) => (
                <line
                  key={i}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={agents.length * TIMELINE_SIZING.laneHeight}
                  stroke={GRID.lineColor}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              ))}

              {/* Agent lanes */}
              {agents.map((agent, i) => (
                <AgentLane
                  key={agent.id}
                  agent={agent}
                  events={eventsByAgent.get(agent.id) ?? []}
                  index={i}
                  timelineWidth={timelineContentWidth}
                  startMs={viewport.startMs}
                  endMs={viewport.endMs}
                  selectedEventId={selectedEventId}
                  onEventSelect={handleEventSelect}
                />
              ))}
            </g>

            {/* Playhead (full height, above lanes) */}
            {playheadX != null && (
              <Playhead
                x={playheadX}
                height={chartHeight}
                isPlaying={events.some((e) => e.isLive)}
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

TimelineChart.displayName = 'TimelineChart';
