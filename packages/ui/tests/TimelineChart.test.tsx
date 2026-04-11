/**
 * Tests for the TimelineChart and its sub-components.
 * TASK-143: Implement timeline chart (time axis, agent lanes, event blocks)
 *
 * Tests cover:
 * - Rendering of the chart container
 * - Agent lane rendering with labels and color dots
 * - Event blocks (duration events) and event markers (point events)
 * - Time axis tick generation and formatting
 * - Playhead rendering
 * - Event selection callbacks
 * - Type exports
 * - Design token constants
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import {
  TimelineChart,
  type TimelineChartProps,
  TimeAxis,
  AgentLane,
  EventBlock,
  EventMarker,
  Playhead,
  TIMELINE_SIZING,
  EVENT_STYLES,
  isPointEvent,
  type TimelineEvent,
  type TimelineAgent,
  type TimelineEventType,
  type LogLevel,
  type TimelineViewport,
  type TickScale,
} from '../src/components/timeline/index.js';

/* ------------------------------------------------------------------ */
/* Test data                                                           */
/* ------------------------------------------------------------------ */

const testAgents: TimelineAgent[] = [
  { id: 'agent-1', name: 'Analyst', color: '#f59e0b' },
  { id: 'agent-2', name: 'Writer', color: '#10b981' },
  { id: 'agent-3', name: 'Reviewer', color: '#818cf8' },
];

const testEvents: TimelineEvent[] = [
  {
    id: 'e1',
    agentId: 'agent-1',
    type: 'llm-call',
    startMs: 1000,
    endMs: 3000,
    label: 'GPT-4o inference',
  },
  {
    id: 'e2',
    agentId: 'agent-1',
    type: 'tool-use',
    startMs: 3500,
    endMs: 4500,
    label: 'Search tool',
  },
  {
    id: 'e3',
    agentId: 'agent-2',
    type: 'task-start',
    startMs: 2000,
    label: 'Writing task begins',
  },
  {
    id: 'e4',
    agentId: 'agent-2',
    type: 'message',
    startMs: 4000,
    endMs: 5000,
    label: 'Agent message',
  },
  {
    id: 'e5',
    agentId: 'agent-3',
    type: 'error',
    startMs: 5500,
    endMs: 6000,
    label: 'Connection refused',
  },
  {
    id: 'e6',
    agentId: 'agent-3',
    type: 'task-complete',
    startMs: 7000,
    label: 'Review complete',
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
    // Fire immediately with a mock entry
    this.callback(
      [{ contentRect: { width: 800, height: 400 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.clearAllMocks();
  (globalThis as any).ResizeObserver = MockResizeObserver;
});

/* ------------------------------------------------------------------ */
/* Helper                                                              */
/* ------------------------------------------------------------------ */
function renderChart(props: Partial<TimelineChartProps> = {}) {
  const defaultProps: TimelineChartProps = {
    agents: testAgents,
    events: testEvents,
    ...props,
  };
  return render(<TimelineChart {...defaultProps} />);
}

/* ================================================================== */
/* TimelineChart — container                                           */
/* ================================================================== */
describe('TimelineChart', () => {
  it('renders the chart container with correct testid', () => {
    renderChart();
    expect(screen.getByTestId('timeline-chart')).toBeInTheDocument();
  });

  it('applies the cs-timeline class', () => {
    renderChart();
    const chart = screen.getByTestId('timeline-chart');
    expect(chart.className).toContain('cs-timeline');
  });

  it('merges custom className', () => {
    renderChart({ className: 'my-timeline' });
    const chart = screen.getByTestId('timeline-chart');
    expect(chart.className).toContain('my-timeline');
  });

  it('has accessible region role and label', () => {
    renderChart();
    const chart = screen.getByTestId('timeline-chart');
    expect(chart.getAttribute('role')).toBe('region');
    expect(chart.getAttribute('aria-label')).toBe('Debugging timeline chart');
  });

  it('renders the SVG content area', () => {
    renderChart();
    expect(screen.getByTestId('timeline-svg')).toBeInTheDocument();
  });

  it('renders with empty events', () => {
    renderChart({ events: [] });
    expect(screen.getByTestId('timeline-chart')).toBeInTheDocument();
  });

  it('renders with empty agents', () => {
    renderChart({ agents: [], events: [] });
    expect(screen.getByTestId('timeline-chart')).toBeInTheDocument();
  });
});

/* ================================================================== */
/* Agent lane labels                                                   */
/* ================================================================== */
describe('Agent lane labels', () => {
  it('renders a label for each agent', () => {
    renderChart();
    expect(screen.getByTestId('timeline-lane-labels')).toBeInTheDocument();
    for (const agent of testAgents) {
      expect(screen.getByTestId(`lane-label-${agent.id}`)).toBeInTheDocument();
    }
  });

  it('displays agent names', () => {
    renderChart();
    expect(screen.getByText('Analyst')).toBeInTheDocument();
    expect(screen.getByText('Writer')).toBeInTheDocument();
    expect(screen.getByText('Reviewer')).toBeInTheDocument();
  });

  it('renders agent color dots', () => {
    renderChart();
    const label = screen.getByTestId('lane-label-agent-1');
    const dot = label.querySelector('.rounded-full');
    expect(dot).toBeTruthy();
    expect((dot as HTMLElement).style.backgroundColor).toBe('rgb(245, 158, 11)');
  });
});

/* ================================================================== */
/* Agent lanes (SVG)                                                   */
/* ================================================================== */
describe('Agent lanes', () => {
  it('renders a lane for each agent', () => {
    renderChart();
    for (const agent of testAgents) {
      expect(screen.getByTestId(`agent-lane-${agent.id}`)).toBeInTheDocument();
    }
  });
});

/* ================================================================== */
/* Event blocks (duration events)                                      */
/* ================================================================== */
describe('Event blocks', () => {
  it('renders event blocks for duration events', () => {
    renderChart();
    // e1, e2, e4, e5 are duration events
    expect(screen.getByTestId('event-block-e1')).toBeInTheDocument();
    expect(screen.getByTestId('event-block-e2')).toBeInTheDocument();
    expect(screen.getByTestId('event-block-e4')).toBeInTheDocument();
    expect(screen.getByTestId('event-block-e5')).toBeInTheDocument();
  });

  it('has accessible aria-label on event blocks', () => {
    renderChart();
    const block = screen.getByTestId('event-block-e1');
    const label = block.getAttribute('aria-label');
    expect(label).toContain('LLM Call');
    expect(label).toContain('GPT-4o inference');
  });

  it('applies correct CSS class for event type', () => {
    renderChart();
    const block = screen.getByTestId('event-block-e1');
    expect(block.classList.contains('cs-event-llm-call')).toBe(true);
  });

  it('fires onEventSelect when clicked', () => {
    const onEventSelect = vi.fn();
    renderChart({ onEventSelect });
    const block = screen.getByTestId('event-block-e1');
    fireEvent.click(block);
    expect(onEventSelect).toHaveBeenCalledWith('e1');
  });

  it('does not fire onEventSelect in readOnly mode', () => {
    const onEventSelect = vi.fn();
    renderChart({ onEventSelect, readOnly: true });
    const block = screen.getByTestId('event-block-e1');
    fireEvent.click(block);
    // The click propagates up to the background handler which checks readOnly
    expect(onEventSelect).not.toHaveBeenCalled();
  });

  it('shows selection ring when event is selected', () => {
    renderChart({ selectedEventId: 'e1' });
    const block = screen.getByTestId('event-block-e1');
    // Selection ring = extra rect with stroke
    const rects = block.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThanOrEqual(2); // glow + block
  });

  it('does not show selection ring for unselected events', () => {
    renderChart({ selectedEventId: 'e1' });
    const block = screen.getByTestId('event-block-e2');
    const rects = block.querySelectorAll('rect');
    expect(rects.length).toBe(1); // just the block
  });
});

/* ================================================================== */
/* Event markers (point events)                                        */
/* ================================================================== */
describe('Event markers', () => {
  it('renders markers for task-start and task-complete events', () => {
    renderChart();
    expect(screen.getByTestId('event-marker-e3')).toBeInTheDocument(); // task-start
    expect(screen.getByTestId('event-marker-e6')).toBeInTheDocument(); // task-complete
  });

  it('has accessible aria-label on markers', () => {
    renderChart();
    const marker = screen.getByTestId('event-marker-e3');
    const label = marker.getAttribute('aria-label');
    expect(label).toContain('Task Start');
    expect(label).toContain('Writing task begins');
  });

  it('fires onEventSelect when marker is clicked', () => {
    const onEventSelect = vi.fn();
    renderChart({ onEventSelect });
    const marker = screen.getByTestId('event-marker-e3');
    fireEvent.click(marker);
    expect(onEventSelect).toHaveBeenCalledWith('e3');
  });
});

/* ================================================================== */
/* Time axis                                                           */
/* ================================================================== */
describe('Time axis', () => {
  it('renders the time axis', () => {
    renderChart();
    expect(screen.getByTestId('timeline-axis')).toBeInTheDocument();
  });
});

/* ================================================================== */
/* Playhead                                                            */
/* ================================================================== */
describe('Playhead', () => {
  it('does not render playhead when playheadMs is undefined', () => {
    renderChart({ playheadMs: undefined });
    expect(screen.queryByTestId('timeline-playhead')).toBeNull();
  });

  it('renders playhead when playheadMs is provided', () => {
    renderChart({ playheadMs: 3000 });
    expect(screen.getByTestId('timeline-playhead')).toBeInTheDocument();
  });

  it('playhead has slider role for accessibility', () => {
    renderChart({ playheadMs: 3000 });
    const playhead = screen.getByTestId('timeline-playhead');
    expect(playhead.getAttribute('role')).toBe('slider');
    expect(playhead.getAttribute('aria-label')).toBe('Timeline playhead');
  });
});

/* ================================================================== */
/* Design token constants                                              */
/* ================================================================== */
describe('TIMELINE_SIZING', () => {
  it('matches design spec values', () => {
    expect(TIMELINE_SIZING.axisHeight).toBe(32);
    expect(TIMELINE_SIZING.laneHeight).toBe(48);
    expect(TIMELINE_SIZING.laneLabelWidth).toBe(160);
    expect(TIMELINE_SIZING.eventHeight).toBe(28);
    expect(TIMELINE_SIZING.eventMinWidth).toBe(8);
    expect(TIMELINE_SIZING.eventMarkerSize).toBe(12);
    expect(TIMELINE_SIZING.eventBorderRadius).toBe(4);
    expect(TIMELINE_SIZING.eventBorderWidth).toBe(1.5);
    expect(TIMELINE_SIZING.playheadWidth).toBe(2);
    expect(TIMELINE_SIZING.playheadHandleSize).toBe(12);
  });
});

describe('EVENT_STYLES', () => {
  it('defines styles for all six event types', () => {
    const expectedTypes = [
      'llm-call',
      'tool-use',
      'task-start',
      'task-complete',
      'error',
      'message',
    ];
    for (const type of expectedTypes) {
      const style = EVENT_STYLES[type as keyof typeof EVENT_STYLES];
      expect(style).toBeDefined();
      expect(style.bg).toBeTruthy();
      expect(style.border).toBeTruthy();
      expect(style.icon).toBeTruthy();
      expect(style.iconColor).toBeTruthy();
      expect(style.label).toBeTruthy();
    }
  });
});

describe('isPointEvent', () => {
  it('returns true for task-start and task-complete', () => {
    expect(isPointEvent('task-start')).toBe(true);
    expect(isPointEvent('task-complete')).toBe(true);
  });

  it('returns false for duration events', () => {
    expect(isPointEvent('llm-call')).toBe(false);
    expect(isPointEvent('tool-use')).toBe(false);
    expect(isPointEvent('error')).toBe(false);
    expect(isPointEvent('message')).toBe(false);
  });
});

/* ================================================================== */
/* Type exports (compile-time check)                                   */
/* ================================================================== */
describe('Type exports', () => {
  it('exports all timeline event types', () => {
    const types: TimelineEventType[] = [
      'llm-call',
      'tool-use',
      'task-start',
      'task-complete',
      'error',
      'message',
    ];
    expect(types).toHaveLength(6);
  });

  it('exports all log levels', () => {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    expect(levels).toHaveLength(4);
  });

  it('exports TimelineViewport type', () => {
    const vp: TimelineViewport = { startMs: 0, endMs: 10_000 };
    expect(vp.startMs).toBeDefined();
    expect(vp.endMs).toBeDefined();
  });

  it('exports TickScale type', () => {
    const scales: TickScale[] = ['sub-second', 'seconds', 'minutes', 'hours'];
    expect(scales).toHaveLength(4);
  });
});

/* ================================================================== */
/* Live event rendering                                                */
/* ================================================================== */
describe('Live events', () => {
  it('renders pulsing indicator for live events', () => {
    const liveEvents: TimelineEvent[] = [
      {
        id: 'live-1',
        agentId: 'agent-1',
        type: 'llm-call',
        startMs: 1000,
        endMs: 3000,
        label: 'Live LLM call',
        isLive: true,
      },
    ];
    renderChart({ events: liveEvents });
    const block = screen.getByTestId('event-block-live-1');
    // Live events have a pulsing rect element with animate-pulse class
    const pulseRect = block.querySelector('.animate-pulse');
    expect(pulseRect).toBeTruthy();
  });
});
