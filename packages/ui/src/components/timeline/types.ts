/**
 * Timeline type definitions for the Crewspace debugging timeline.
 * TASK-143: Implement timeline chart (time axis, agent lanes, event blocks)
 */

/** Event types rendered in the timeline chart. */
export type TimelineEventType =
  | 'llm-call'
  | 'tool-use'
  | 'task-start'
  | 'task-complete'
  | 'error'
  | 'message';

/** Log levels for the log viewer. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** A single event displayed in an agent's swimlane. */
export interface TimelineEvent {
  /** Unique identifier for this event. */
  id: string;
  /** Which agent produced this event. */
  agentId: string;
  /** The category of event. */
  type: TimelineEventType;
  /** Start time in milliseconds relative to workflow start. */
  startMs: number;
  /**
   * End time in milliseconds relative to workflow start.
   * Omit for point events (task-start, task-complete).
   */
  endMs?: number;
  /** Short label shown inside the event block. */
  label: string;
  /** Optional detailed description (shown in tooltip). */
  description?: string;
  /** Associated log level. */
  logLevel?: LogLevel;
  /** Whether this event is still in progress (live run). */
  isLive?: boolean;
}

/** Describes an agent lane in the timeline. */
export interface TimelineAgent {
  /** Unique agent identifier (matches TimelineEvent.agentId). */
  id: string;
  /** Display name shown in the lane label. */
  name: string;
  /** CSS color for the agent's color dot (matches canvas node). */
  color: string;
}

/** Configuration for the timeline's visible time window. */
export interface TimelineViewport {
  /** Left edge of the visible window in ms. */
  startMs: number;
  /** Right edge of the visible window in ms. */
  endMs: number;
}

/** Zoom level presets for tick density. */
export type TickScale = 'sub-second' | 'seconds' | 'minutes' | 'hours';

/** Props for the main TimelineChart component. */
export interface TimelineChartProps {
  /** Agents to display as swimlanes. */
  agents: TimelineAgent[];
  /** Events to render in the timeline. */
  events: TimelineEvent[];
  /** Current playhead position in ms. */
  playheadMs?: number;
  /** ID of the currently selected event. */
  selectedEventId?: string | null;
  /** Callback when an event is clicked. */
  onEventSelect?: (eventId: string | null) => void;
  /** Callback when the playhead position changes (scrub/click). */
  onPlayheadChange?: (ms: number) => void;
  /** Optional className for the root element. */
  className?: string;
  /** Read-only mode: disables interaction. */
  readOnly?: boolean;
}

/** Props for the TimeAxis sub-component. */
export interface TimeAxisProps {
  /** Total width available for the axis (px). */
  width: number;
  /** Viewport start ms. */
  startMs: number;
  /** Viewport end ms. */
  endMs: number;
  /** Playhead position in ms. */
  playheadMs?: number;
  /** Callback for clicking on the axis to move playhead. */
  onAxisClick?: ((ms: number) => void) | undefined;
}

/** Props for the AgentLane sub-component. */
export interface AgentLaneProps {
  agent: TimelineAgent;
  events: TimelineEvent[];
  /** Index of the lane (for alternating bg). */
  index: number;
  /** Total timeline width in px (content area, excluding label). */
  timelineWidth: number;
  /** Viewport. */
  startMs: number;
  endMs: number;
  /** Currently selected event id. */
  selectedEventId?: string | null;
  /** Event click handler. */
  onEventSelect?: ((eventId: string | null) => void) | undefined;
}

/** Props for the EventBlock sub-component. */
export interface EventBlockProps {
  event: TimelineEvent;
  /** Left position in px. */
  x: number;
  /** Width in px. */
  width: number;
  /** Whether this event is selected. */
  isSelected?: boolean;
  /** Click handler. */
  onClick?: ((eventId: string) => void) | undefined;
}

/** Props for the EventMarker sub-component (point events). */
export interface EventMarkerProps {
  event: TimelineEvent;
  /** Center X position in px. */
  cx: number;
  /** Whether this marker is selected. */
  isSelected?: boolean;
  /** Click handler. */
  onClick?: ((eventId: string) => void) | undefined;
}

/** Props for the Playhead sub-component. */
export interface PlayheadProps {
  /** X position in px. */
  x: number;
  /** Height of the playhead line. */
  height: number;
  /** Whether playback is active (enables pulse animation). */
  isPlaying?: boolean;
}

/* ------------------------------------------------------------------ */
/* Log Viewer types (TASK-144)                                         */
/* ------------------------------------------------------------------ */

/** A single log entry displayed in the log viewer. */
export interface LogEntry {
  /** Unique identifier. */
  id: string;
  /** Timestamp in milliseconds relative to workflow start. */
  timestampMs: number;
  /** Log severity level. */
  level: LogLevel;
  /** Agent that produced this log. */
  agentId: string;
  /** Agent display name. */
  agentName?: string;
  /** The log message content. */
  message: string;
  /** Optional structured data (JSON) attached to the entry. */
  data?: Record<string, unknown>;
  /** Optional associated event ID (links to timeline). */
  eventId?: string;
  /** Optional task identifier for filtering by task. */
  taskId?: string;
  /** Optional task display name. */
  taskName?: string;
}

/** Props for the LogViewer component. */
export interface LogViewerProps {
  /** Log entries to display. */
  entries: LogEntry[];
  /** Currently selected log entry ID. */
  selectedEntryId?: string | null;
  /** Callback when a log entry is clicked. */
  onEntrySelect?: (entryId: string | null) => void;
  /** Search query string for highlighting matches in messages. */
  searchQuery?: string;
  /** Whether to auto-scroll to the latest entry. */
  autoScroll?: boolean;
  /** Optional className for the root element. */
  className?: string;
  /** Maximum height of the log viewer panel. */
  maxHeight?: number | string;
}

/** Props for the LogRow sub-component. */
export interface LogRowProps {
  /** The log entry to render. */
  entry: LogEntry;
  /** Row index for alternating backgrounds. */
  index: number;
  /** Whether this row is selected. */
  isSelected?: boolean;
  /** Click handler. */
  onClick?: (entryId: string) => void;
  /** Search query for highlighting. */
  searchQuery?: string;
}

/* ------------------------------------------------------------------ */
/* Log Filters types (TASK-145)                                        */
/* ------------------------------------------------------------------ */

/** Structured filters for the log viewer. */
export interface LogFilters {
  /** Free-text search across message and agent name. */
  searchQuery: string;
  /** Agent IDs to include. Empty array means "all agents". */
  agentIds: string[];
  /** Task IDs to include. Empty array means "all tasks". */
  taskIds: string[];
  /** Log levels to include. Empty array means "all levels". */
  levels: LogLevel[];
}

/** Option for a filter dropdown / chip list. */
export interface FilterOption {
  /** Unique identifier for the option. */
  id: string;
  /** Display label. */
  label: string;
}

/** Props for the LogFilterBar component. */
export interface LogFilterBarProps {
  /** Current filter state. */
  filters: LogFilters;
  /** Callback when filters change. */
  onFiltersChange: (filters: LogFilters) => void;
  /** Available agents for the agent filter dropdown. */
  agents: FilterOption[];
  /** Available tasks for the task filter dropdown. */
  tasks: FilterOption[];
  /** Optional className for the root element. */
  className?: string;
}
