/**
 * TimeAxis — Horizontal time axis with labels and tick marks.
 * TASK-143: Implement timeline chart
 */
import React from 'react';
import { TIMELINE_SIZING, GRID } from './constants.js';
import type { TimeAxisProps } from './types.js';

/* ------------------------------------------------------------------ */
/* Tick generation                                                     */
/* ------------------------------------------------------------------ */

interface Tick {
  ms: number;
  label: string;
  isMajor: boolean;
}

function pickInterval(durationMs: number, widthPx: number): { major: number; minor: number } {
  const pxPerMs = widthPx / durationMs;
  // Target ~80-120px between major ticks
  const targetMajorPx = 100;
  const targetMajorMs = targetMajorPx / pxPerMs;

  const candidates = [
    { major: 100, minor: 20 },       // 100ms
    { major: 500, minor: 100 },      // 500ms
    { major: 1_000, minor: 200 },    // 1s
    { major: 5_000, minor: 1_000 },  // 5s
    { major: 30_000, minor: 5_000 }, // 30s
    { major: 60_000, minor: 10_000 },// 1min
    { major: 300_000, minor: 60_000 }, // 5min
    { major: 3_600_000, minor: 600_000 }, // 1h
  ];

  let best = candidates[candidates.length - 1]!;
  for (const c of candidates) {
    if (c.major >= targetMajorMs * 0.5) {
      best = c;
      break;
    }
  }
  return best;
}

function formatTickLabel(ms: number): string {
  const totalSec = Math.floor(ms / 1_000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (ms < 1_000) return `${ms}ms`;
  if (minutes < 60) {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${String(mins).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function generateTicks(startMs: number, endMs: number, widthPx: number): Tick[] {
  const duration = endMs - startMs;
  if (duration <= 0 || widthPx <= 0) return [];

  const { major, minor } = pickInterval(duration, widthPx);
  const ticks: Tick[] = [];

  const firstMinor = Math.ceil(startMs / minor) * minor;
  for (let ms = firstMinor; ms <= endMs; ms += minor) {
    const isMajor = ms % major === 0;
    ticks.push({
      ms,
      label: isMajor ? formatTickLabel(ms) : '',
      isMajor,
    });
  }
  return ticks;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const TimeAxis: React.FC<TimeAxisProps> = ({
  width,
  startMs,
  endMs,
  onAxisClick,
}) => {
  const duration = endMs - startMs;
  const ticks = generateTicks(startMs, endMs, width);

  const msToX = (ms: number) => ((ms - startMs) / duration) * width;

  const handleClick = (e: React.MouseEvent<SVGGElement>) => {
    if (!onAxisClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ms = startMs + (x / width) * duration;
    onAxisClick(Math.round(Math.max(startMs, Math.min(endMs, ms))));
  };

  return (
    <g
      data-testid="timeline-axis"
      className="cs-timeline-axis"
      onClick={handleClick}
      style={{ cursor: onAxisClick ? 'pointer' : 'default' }}
    >
      {/* Axis background */}
      <rect
        x={0}
        y={0}
        width={width}
        height={TIMELINE_SIZING.axisHeight}
        fill="var(--cs-surface-panel, #0f172a)"
      />

      {/* Axis baseline */}
      <line
        x1={0}
        y1={TIMELINE_SIZING.axisHeight}
        x2={width}
        y2={TIMELINE_SIZING.axisHeight}
        stroke={GRID.axisLineColor}
        strokeWidth={1}
      />

      {/* Ticks and labels */}
      {ticks.map((tick, i) => {
        const x = msToX(tick.ms);
        const tickH = tick.isMajor ? 8 : 4;
        return (
          <g key={i}>
            <line
              x1={x}
              y1={TIMELINE_SIZING.axisHeight - tickH}
              x2={x}
              y2={TIMELINE_SIZING.axisHeight}
              stroke={GRID.axisTickColor}
              strokeWidth={1}
            />
            {tick.isMajor && tick.label && (
              <text
                x={x}
                y={TIMELINE_SIZING.axisHeight - tickH - 4}
                textAnchor="middle"
                fill="var(--cs-text-tertiary, #64748b)"
                fontSize={11}
                fontWeight={400}
                fontFamily="Inter, sans-serif"
              >
                {tick.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};

TimeAxis.displayName = 'TimeAxis';

// Export tick generation utilities for testing
export { generateTicks, formatTickLabel };
