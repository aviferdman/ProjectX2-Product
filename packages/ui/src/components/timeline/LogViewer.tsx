/**
 * LogViewer — Structured log viewer for the Crewspace debugging timeline.
 * TASK-144: Implement log viewer (display, format, syntax highlighting)
 *
 * Renders a scrollable list of log entries with:
 * - Column header (timestamp, level, agent, message)
 * - Color-coded log levels
 * - Formatted timestamps
 * - Syntax highlighting for JSON payloads
 * - Search term highlighting
 * - Row selection
 * - Auto-scroll to latest entry
 */
import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';
import { LOG_SIZING, LOG_COLORS } from './constants.js';
import { LogRow } from './LogRow.js';
import type { LogViewerProps, LogEntry } from './types.js';

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const LogViewer: React.FC<LogViewerProps> = ({
  entries,
  selectedEntryId = null,
  onEntrySelect,
  searchQuery,
  autoScroll = true,
  className,
  maxHeight = 400,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevEntryCount = useRef(entries.length);

  // Auto-scroll when new entries arrive
  useEffect(() => {
    if (!autoScroll) return;
    if (entries.length > prevEntryCount.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevEntryCount.current = entries.length;
  }, [entries.length, autoScroll]);

  // Filter entries by search query (match in message or agent name)
  const filteredEntries = useMemo(() => {
    if (!searchQuery || searchQuery.length === 0) return entries;
    const lower = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        e.message.toLowerCase().includes(lower) ||
        (e.agentName ?? e.agentId).toLowerCase().includes(lower),
    );
  }, [entries, searchQuery]);

  const handleEntryClick = useCallback(
    (entryId: string) => {
      onEntrySelect?.(entryId === selectedEntryId ? null : entryId);
    },
    [onEntrySelect, selectedEntryId],
  );

  const handleBackgroundClick = useCallback(() => {
    onEntrySelect?.(null);
  }, [onEntrySelect]);

  // Entry count badge
  const matchCount =
    searchQuery && searchQuery.length > 0
      ? `${filteredEntries.length} / ${entries.length}`
      : `${entries.length}`;

  return (
    <div
      data-testid="log-viewer"
      className={clsx('cs-log-viewer flex flex-col overflow-hidden rounded', className)}
      style={{
        background: LOG_COLORS.background,
        maxHeight,
      }}
      role="log"
      aria-label="Log viewer"
      aria-live="polite"
    >
      {/* Header */}
      <div
        data-testid="log-viewer-header"
        className="flex items-center flex-shrink-0"
        style={{
          height: LOG_SIZING.headerHeight,
          background: LOG_COLORS.headerBg,
          borderBottom: `1px solid ${LOG_COLORS.rowBorder}`,
        }}
      >
        <span
          className="flex-shrink-0 px-2"
          style={{
            width: LOG_SIZING.timestampWidth,
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--cs-text-tertiary, #52525b)',
          }}
        >
          Time
        </span>
        <span
          className="flex-shrink-0"
          style={{
            width: LOG_SIZING.levelWidth,
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--cs-text-tertiary, #52525b)',
          }}
        >
          Level
        </span>
        <span
          className="flex-shrink-0 px-2"
          style={{
            width: LOG_SIZING.agentWidth,
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--cs-text-tertiary, #52525b)',
          }}
        >
          Agent
        </span>
        <span
          className="flex-1 px-2"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--cs-text-tertiary, #52525b)',
          }}
        >
          Message
        </span>
        <span
          data-testid="log-viewer-count"
          className="flex-shrink-0 px-3"
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--cs-text-tertiary, #52525b)',
          }}
        >
          {matchCount}
        </span>
      </div>

      {/* Log rows */}
      <div
        ref={scrollRef}
        data-testid="log-viewer-body"
        className="flex-1 overflow-y-auto"
        onClick={handleBackgroundClick}
        style={{ scrollBehavior: 'smooth' }}
      >
        {filteredEntries.length === 0 ? (
          <div
            data-testid="log-viewer-empty"
            className="flex items-center justify-center"
            style={{
              height: 120,
              color: 'var(--cs-text-tertiary, #52525b)',
              fontSize: 13,
            }}
          >
            {searchQuery ? 'No matching log entries' : 'No log entries'}
          </div>
        ) : (
          filteredEntries.map((entry, i) => (
            <LogRow
              key={entry.id}
              entry={entry}
              index={i}
              isSelected={entry.id === selectedEntryId}
              onClick={handleEntryClick}
              searchQuery={searchQuery}
            />
          ))
        )}
      </div>
    </div>
  );
};

LogViewer.displayName = 'LogViewer';
