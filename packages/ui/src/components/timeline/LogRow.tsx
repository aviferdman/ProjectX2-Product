/**
 * LogRow — Individual log entry row for the log viewer.
 * TASK-144: Implement log viewer (display, format, syntax highlighting)
 *
 * Renders a single log entry with:
 * - Formatted timestamp
 * - Color-coded log level badge
 * - Agent name
 * - Message with optional search highlighting and syntax coloring
 */
import React, { useCallback, useMemo } from 'react';
import { clsx } from 'clsx';
import { LOG_SIZING, LOG_LEVEL_STYLES, LOG_COLORS, SYNTAX_COLORS } from './constants.js';
import type { LogRowProps } from './types.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Format ms timestamp to mm:ss.SSS */
export function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor(ms % 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

/** Detect if a string looks like JSON */
function isJsonLike(str: string): boolean {
  const trimmed = str.trim();
  return (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
         (trimmed.startsWith('[') && trimmed.endsWith(']'));
}

/** Tokenize a JSON string for syntax highlighting. */
export interface SyntaxToken {
  text: string;
  type: 'string' | 'number' | 'boolean' | 'null' | 'key' | 'punctuation' | 'default';
}

export function tokenizeJson(input: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  // Regex to match JSON tokens
  const regex =
    /("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b|(true|false)\b|(null)\b|([{}[\]:,])|(\s+)|([^\s"{}[\]:,]+)/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(input)) !== null) {
    if (match[1] !== undefined) {
      // Key (string followed by colon)
      tokens.push({ text: match[1], type: 'key' });
      // Find and add the colon
      const colonMatch = input.slice(regex.lastIndex - match[0].length + match[1].length).match(/^\s*:/);
      if (colonMatch) {
        // The colon is captured in the original match
      }
    } else if (match[2] !== undefined) {
      tokens.push({ text: match[2], type: 'string' });
    } else if (match[3] !== undefined) {
      tokens.push({ text: match[3], type: 'number' });
    } else if (match[4] !== undefined) {
      tokens.push({ text: match[4], type: 'boolean' });
    } else if (match[5] !== undefined) {
      tokens.push({ text: match[5], type: 'null' });
    } else if (match[6] !== undefined) {
      tokens.push({ text: match[6], type: 'punctuation' });
    } else {
      tokens.push({ text: match[0], type: 'default' });
    }
  }

  return tokens;
}

/** Split text into segments for search highlighting. */
export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

export function highlightSearch(text: string, query: string): HighlightSegment[] {
  if (!query || query.length === 0) {
    return [{ text, isMatch: false }];
  }

  const segments: HighlightSegment[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let lastIndex = 0;

  let index = lowerText.indexOf(lowerQuery, lastIndex);
  while (index !== -1) {
    if (index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, index), isMatch: false });
    }
    segments.push({ text: text.slice(index, index + query.length), isMatch: true });
    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isMatch: false });
  }

  return segments.length > 0 ? segments : [{ text, isMatch: false }];
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const LogRow: React.FC<LogRowProps> = ({
  entry,
  index,
  isSelected = false,
  onClick,
  searchQuery,
}) => {
  const levelStyle = LOG_LEVEL_STYLES[entry.level];

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick?.(entry.id);
    },
    [entry.id, onClick],
  );

  // Determine row background
  const rowBg = isSelected
    ? LOG_COLORS.rowBgSelected
    : index % 2 === 1
      ? LOG_COLORS.rowBgAlt
      : LOG_COLORS.rowBg;

  // Render message with syntax highlighting for JSON
  const renderedMessage = useMemo(() => {
    const messageText = entry.message;

    // Check for inline JSON
    if (isJsonLike(messageText)) {
      const tokens = tokenizeJson(messageText);
      return (
        <span className="font-mono" data-testid={`log-message-syntax-${entry.id}`}>
          {tokens.map((token, i) => (
            <span key={i} style={{ color: SYNTAX_COLORS[token.type] }}>
              {searchQuery ? renderWithHighlight(token.text, searchQuery) : token.text}
            </span>
          ))}
        </span>
      );
    }

    // Plain text with search highlighting
    if (searchQuery) {
      return renderWithHighlight(messageText, searchQuery);
    }

    return messageText;
  }, [entry.message, entry.id, searchQuery]);

  return (
    <div
      data-testid={`log-row-${entry.id}`}
      className={clsx(
        'cs-log-viewer flex items-center cursor-pointer transition-colors',
        `cs-log-level-${entry.level}`,
        isSelected && 'cs-log-row-selected',
      )}
      style={{
        height: LOG_SIZING.rowHeight,
        background: rowBg,
        borderBottom: `1px solid ${LOG_COLORS.rowBorder}`,
      }}
      onClick={handleClick}
      role="row"
      aria-selected={isSelected}
      aria-label={`${levelStyle.label} log from ${entry.agentName ?? entry.agentId}: ${entry.message}`}
    >
      {/* Timestamp */}
      <span
        className="flex-shrink-0 px-2 font-mono"
        data-testid={`log-timestamp-${entry.id}`}
        style={{
          width: LOG_SIZING.timestampWidth,
          fontSize: 11,
          color: LOG_COLORS.timestamp,
          lineHeight: `${LOG_SIZING.rowHeight}px`,
        }}
      >
        {formatTimestamp(entry.timestampMs)}
      </span>

      {/* Level badge */}
      <span
        className="flex-shrink-0 flex items-center justify-center rounded px-1.5"
        data-testid={`log-level-${entry.id}`}
        style={{
          width: LOG_SIZING.levelWidth,
          height: 20,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.05em',
          color: levelStyle.color,
          background: levelStyle.bg,
        }}
      >
        {levelStyle.label}
      </span>

      {/* Agent name */}
      <span
        className="flex-shrink-0 truncate px-2"
        data-testid={`log-agent-${entry.id}`}
        style={{
          width: LOG_SIZING.agentWidth,
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--cs-text-secondary, #94a3b8)',
          lineHeight: `${LOG_SIZING.rowHeight}px`,
        }}
      >
        {entry.agentName ?? entry.agentId}
      </span>

      {/* Message */}
      <span
        className="flex-1 truncate px-2"
        data-testid={`log-message-${entry.id}`}
        style={{
          fontSize: 12,
          color: 'var(--cs-text-secondary, #cbd5e1)',
          lineHeight: `${LOG_SIZING.rowHeight}px`,
        }}
      >
        {renderedMessage}
      </span>
    </div>
  );
};

LogRow.displayName = 'LogRow';

/* ------------------------------------------------------------------ */
/* Inline search highlight renderer                                    */
/* ------------------------------------------------------------------ */

function renderWithHighlight(text: string, query: string): React.ReactNode {
  const segments = highlightSearch(text, query);
  if (segments.length === 1 && !segments[0]!.isMatch) {
    return text;
  }

  return (
    <>
      {segments.map((seg, i) =>
        seg.isMatch ? (
          <mark
            key={i}
            style={{
              background: LOG_COLORS.searchHighlight,
              color: 'inherit',
              borderRadius: 2,
              padding: '0 1px',
            }}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}
