/**
 * Tests for the LogViewer and LogRow components.
 * TASK-144: Implement log viewer (display, format, syntax highlighting)
 *
 * Tests cover:
 * - LogViewer rendering (container, header, rows, empty state)
 * - LogRow rendering (timestamp, level badge, agent name, message)
 * - Log level color coding
 * - Syntax highlighting for JSON messages
 * - Search term highlighting and filtering
 * - Row selection
 * - Auto-scroll behavior
 * - Helper functions (formatTimestamp, tokenizeJson, highlightSearch)
 * - Design token constants
 * - Type exports
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import {
  LogViewer,
  type LogViewerProps,
  LogRow,
  type LogRowProps,
  type LogEntry,
  type LogLevel,
  formatTimestamp,
  tokenizeJson,
  highlightSearch,
  LOG_SIZING,
  LOG_LEVEL_STYLES,
  LOG_COLORS,
  SYNTAX_COLORS,
} from '../src/components/timeline/index.js';

/* ------------------------------------------------------------------ */
/* Test data                                                           */
/* ------------------------------------------------------------------ */

const testEntries: LogEntry[] = [
  {
    id: 'log-1',
    timestampMs: 1234,
    level: 'info',
    agentId: 'agent-1',
    agentName: 'Analyst',
    message: 'Starting analysis task',
  },
  {
    id: 'log-2',
    timestampMs: 2567,
    level: 'debug',
    agentId: 'agent-1',
    agentName: 'Analyst',
    message: 'Fetching data from API',
  },
  {
    id: 'log-3',
    timestampMs: 5890,
    level: 'warn',
    agentId: 'agent-2',
    agentName: 'Writer',
    message: 'Rate limit approaching',
  },
  {
    id: 'log-4',
    timestampMs: 8100,
    level: 'error',
    agentId: 'agent-3',
    agentName: 'Reviewer',
    message: 'Connection refused: timeout after 30s',
  },
  {
    id: 'log-5',
    timestampMs: 12500,
    level: 'info',
    agentId: 'agent-1',
    agentName: 'Analyst',
    message: '{"status": "ok", "count": 42, "success": true, "data": null}',
  },
];

/* ------------------------------------------------------------------ */
/* Helper                                                              */
/* ------------------------------------------------------------------ */

function renderViewer(props: Partial<LogViewerProps> = {}) {
  const defaultProps: LogViewerProps = {
    entries: testEntries,
    ...props,
  };
  return render(<LogViewer {...defaultProps} />);
}

function renderRow(props: Partial<LogRowProps> = {}) {
  const defaultProps: LogRowProps = {
    entry: testEntries[0]!,
    index: 0,
    ...props,
  };
  return render(<LogRow {...defaultProps} />);
}

/* ================================================================== */
/* formatTimestamp                                                      */
/* ================================================================== */
describe('formatTimestamp', () => {
  it('formats 0ms as 00:00.000', () => {
    expect(formatTimestamp(0)).toBe('00:00.000');
  });

  it('formats sub-second values', () => {
    expect(formatTimestamp(123)).toBe('00:00.123');
  });

  it('formats seconds', () => {
    expect(formatTimestamp(5000)).toBe('00:05.000');
  });

  it('formats minutes and seconds', () => {
    expect(formatTimestamp(65_500)).toBe('01:05.500');
  });

  it('formats multi-minute values', () => {
    expect(formatTimestamp(125_432)).toBe('02:05.432');
  });

  it('pads digits correctly', () => {
    expect(formatTimestamp(1234)).toBe('00:01.234');
  });
});

/* ================================================================== */
/* tokenizeJson                                                        */
/* ================================================================== */
describe('tokenizeJson', () => {
  it('tokenizes a simple JSON object', () => {
    const tokens = tokenizeJson('{"key": "value"}');
    const types = tokens.map((t) => t.type);
    expect(types).toContain('key');
    expect(types).toContain('string');
    expect(types).toContain('punctuation');
  });

  it('identifies number tokens', () => {
    const tokens = tokenizeJson('{"count": 42}');
    const numberToken = tokens.find((t) => t.type === 'number');
    expect(numberToken).toBeDefined();
    expect(numberToken!.text).toBe('42');
  });

  it('identifies boolean tokens', () => {
    const tokens = tokenizeJson('{"active": true}');
    const boolToken = tokens.find((t) => t.type === 'boolean');
    expect(boolToken).toBeDefined();
    expect(boolToken!.text).toBe('true');
  });

  it('identifies null tokens', () => {
    const tokens = tokenizeJson('{"data": null}');
    const nullToken = tokens.find((t) => t.type === 'null');
    expect(nullToken).toBeDefined();
    expect(nullToken!.text).toBe('null');
  });

  it('returns empty array for empty string', () => {
    expect(tokenizeJson('')).toEqual([]);
  });
});

/* ================================================================== */
/* highlightSearch                                                     */
/* ================================================================== */
describe('highlightSearch', () => {
  it('returns single segment when no query', () => {
    const result = highlightSearch('hello world', '');
    expect(result).toEqual([{ text: 'hello world', isMatch: false }]);
  });

  it('highlights matching substring', () => {
    const result = highlightSearch('hello world', 'world');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ text: 'hello ', isMatch: false });
    expect(result[1]).toEqual({ text: 'world', isMatch: true });
  });

  it('highlights case-insensitive matches', () => {
    const result = highlightSearch('Hello World', 'hello');
    expect(result).toHaveLength(2);
    expect(result[0]!.isMatch).toBe(true);
    expect(result[0]!.text).toBe('Hello');
  });

  it('highlights multiple occurrences', () => {
    const result = highlightSearch('foo bar foo', 'foo');
    const matches = result.filter((s) => s.isMatch);
    expect(matches).toHaveLength(2);
  });

  it('returns original text when no match found', () => {
    const result = highlightSearch('hello', 'xyz');
    expect(result).toEqual([{ text: 'hello', isMatch: false }]);
  });
});

/* ================================================================== */
/* LogViewer — container                                               */
/* ================================================================== */
describe('LogViewer', () => {
  it('renders the container with correct testid', () => {
    renderViewer();
    expect(screen.getByTestId('log-viewer')).toBeInTheDocument();
  });

  it('applies the cs-log-viewer class', () => {
    renderViewer();
    const viewer = screen.getByTestId('log-viewer');
    expect(viewer.className).toContain('cs-log-viewer');
  });

  it('merges custom className', () => {
    renderViewer({ className: 'my-log' });
    const viewer = screen.getByTestId('log-viewer');
    expect(viewer.className).toContain('my-log');
  });

  it('has accessible role and label', () => {
    renderViewer();
    const viewer = screen.getByTestId('log-viewer');
    expect(viewer.getAttribute('role')).toBe('log');
    expect(viewer.getAttribute('aria-label')).toBe('Log viewer');
  });

  it('renders the header row', () => {
    renderViewer();
    expect(screen.getByTestId('log-viewer-header')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('shows entry count', () => {
    renderViewer();
    expect(screen.getByTestId('log-viewer-count').textContent).toBe('5');
  });

  it('renders all log rows', () => {
    renderViewer();
    for (const entry of testEntries) {
      expect(screen.getByTestId(`log-row-${entry.id}`)).toBeInTheDocument();
    }
  });

  it('renders empty state when no entries', () => {
    renderViewer({ entries: [] });
    expect(screen.getByTestId('log-viewer-empty')).toBeInTheDocument();
    expect(screen.getByText('No log entries')).toBeInTheDocument();
  });

  it('renders empty state with search message when searching', () => {
    renderViewer({ entries: [], searchQuery: 'xyz' });
    expect(screen.getByText('No matching log entries')).toBeInTheDocument();
  });
});

/* ================================================================== */
/* LogViewer — search filtering                                        */
/* ================================================================== */
describe('LogViewer search filtering', () => {
  it('filters entries by search query in message', () => {
    renderViewer({ searchQuery: 'Connection' });
    // Only log-4 matches "Connection"
    expect(screen.getByTestId('log-row-log-4')).toBeInTheDocument();
    expect(screen.queryByTestId('log-row-log-1')).toBeNull();
  });

  it('filters entries by agent name', () => {
    renderViewer({ searchQuery: 'Writer' });
    expect(screen.getByTestId('log-row-log-3')).toBeInTheDocument();
    expect(screen.queryByTestId('log-row-log-1')).toBeNull();
  });

  it('shows filtered count', () => {
    renderViewer({ searchQuery: 'Analyst' });
    // 3 entries from Analyst out of 5 total
    expect(screen.getByTestId('log-viewer-count').textContent).toBe('3 / 5');
  });

  it('is case-insensitive', () => {
    renderViewer({ searchQuery: 'starting' });
    expect(screen.getByTestId('log-row-log-1')).toBeInTheDocument();
  });
});

/* ================================================================== */
/* LogViewer — selection                                               */
/* ================================================================== */
describe('LogViewer selection', () => {
  it('highlights selected row', () => {
    renderViewer({ selectedEntryId: 'log-1' });
    const row = screen.getByTestId('log-row-log-1');
    expect(row.getAttribute('aria-selected')).toBe('true');
  });

  it('fires onEntrySelect when row is clicked', () => {
    const onEntrySelect = vi.fn();
    renderViewer({ onEntrySelect });
    fireEvent.click(screen.getByTestId('log-row-log-2'));
    expect(onEntrySelect).toHaveBeenCalledWith('log-2');
  });

  it('deselects when clicking the same row', () => {
    const onEntrySelect = vi.fn();
    renderViewer({ onEntrySelect, selectedEntryId: 'log-1' });
    fireEvent.click(screen.getByTestId('log-row-log-1'));
    expect(onEntrySelect).toHaveBeenCalledWith(null);
  });
});

/* ================================================================== */
/* LogRow — rendering                                                  */
/* ================================================================== */
describe('LogRow', () => {
  it('renders with correct testid', () => {
    renderRow();
    expect(screen.getByTestId('log-row-log-1')).toBeInTheDocument();
  });

  it('displays formatted timestamp', () => {
    renderRow();
    const ts = screen.getByTestId('log-timestamp-log-1');
    expect(ts.textContent).toBe('00:01.234');
  });

  it('displays level badge', () => {
    renderRow();
    const badge = screen.getByTestId('log-level-log-1');
    expect(badge.textContent).toBe('INFO');
  });

  it('displays agent name', () => {
    renderRow();
    const agent = screen.getByTestId('log-agent-log-1');
    expect(agent.textContent).toBe('Analyst');
  });

  it('falls back to agentId when agentName is missing', () => {
    const entry: LogEntry = {
      id: 'log-noname',
      timestampMs: 100,
      level: 'info',
      agentId: 'agent-x',
      message: 'test',
    };
    renderRow({ entry });
    expect(screen.getByTestId('log-agent-log-noname').textContent).toBe('agent-x');
  });

  it('displays message text', () => {
    renderRow();
    const msg = screen.getByTestId('log-message-log-1');
    expect(msg.textContent).toContain('Starting analysis task');
  });

  it('has accessible role and aria-label', () => {
    renderRow();
    const row = screen.getByTestId('log-row-log-1');
    expect(row.getAttribute('role')).toBe('row');
    expect(row.getAttribute('aria-label')).toContain('INFO');
    expect(row.getAttribute('aria-label')).toContain('Analyst');
  });

  it('fires onClick when clicked', () => {
    const onClick = vi.fn();
    renderRow({ onClick });
    fireEvent.click(screen.getByTestId('log-row-log-1'));
    expect(onClick).toHaveBeenCalledWith('log-1');
  });
});

/* ================================================================== */
/* LogRow — log level styles                                           */
/* ================================================================== */
describe('LogRow log levels', () => {
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const expectedLabels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

  levels.forEach((level, i) => {
    it(`renders ${level} level badge correctly`, () => {
      const entry: LogEntry = {
        id: `log-${level}`,
        timestampMs: 1000,
        level,
        agentId: 'agent-1',
        agentName: 'Test',
        message: `${level} message`,
      };
      renderRow({ entry });
      const badge = screen.getByTestId(`log-level-log-${level}`);
      expect(badge.textContent).toBe(expectedLabels[i]);
    });
  });

  it('applies cs-log-level-* class', () => {
    const entry: LogEntry = {
      id: 'log-err',
      timestampMs: 1000,
      level: 'error',
      agentId: 'agent-1',
      message: 'fail',
    };
    renderRow({ entry });
    const row = screen.getByTestId('log-row-log-err');
    expect(row.className).toContain('cs-log-level-error');
  });
});

/* ================================================================== */
/* LogRow — syntax highlighting (JSON messages)                        */
/* ================================================================== */
describe('LogRow syntax highlighting', () => {
  it('renders syntax-highlighted JSON messages', () => {
    const entry = testEntries[4]!; // JSON entry
    renderRow({ entry });
    expect(screen.getByTestId(`log-message-syntax-${entry.id}`)).toBeInTheDocument();
  });

  it('renders font-mono class for JSON messages', () => {
    const entry = testEntries[4]!;
    renderRow({ entry });
    const syntaxEl = screen.getByTestId(`log-message-syntax-${entry.id}`);
    expect(syntaxEl.className).toContain('font-mono');
  });

  it('does not render syntax highlighting for plain text', () => {
    renderRow(); // log-1 has plain text
    expect(screen.queryByTestId('log-message-syntax-log-1')).toBeNull();
  });
});

/* ================================================================== */
/* LogRow — search highlighting                                        */
/* ================================================================== */
describe('LogRow search highlighting', () => {
  it('renders highlight marks for matching text', () => {
    renderRow({ searchQuery: 'analysis' });
    const msg = screen.getByTestId('log-message-log-1');
    const marks = msg.querySelectorAll('mark');
    expect(marks.length).toBeGreaterThanOrEqual(1);
    expect(marks[0]!.textContent).toBe('analysis');
  });

  it('does not render marks when no query', () => {
    renderRow({ searchQuery: '' });
    const msg = screen.getByTestId('log-message-log-1');
    const marks = msg.querySelectorAll('mark');
    expect(marks).toHaveLength(0);
  });
});

/* ================================================================== */
/* Design token constants                                              */
/* ================================================================== */
describe('LOG_SIZING', () => {
  it('matches design spec values', () => {
    expect(LOG_SIZING.rowHeight).toBe(32);
    expect(LOG_SIZING.timestampWidth).toBe(100);
    expect(LOG_SIZING.levelWidth).toBe(56);
    expect(LOG_SIZING.agentWidth).toBe(120);
    expect(LOG_SIZING.headerHeight).toBe(40);
  });
});

describe('LOG_LEVEL_STYLES', () => {
  it('defines styles for all four log levels', () => {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    for (const level of levels) {
      const style = LOG_LEVEL_STYLES[level];
      expect(style).toBeDefined();
      expect(style.color).toBeTruthy();
      expect(style.bg).toBeTruthy();
      expect(style.label).toBeTruthy();
    }
  });
});

describe('LOG_COLORS', () => {
  it('defines all required color tokens', () => {
    expect(LOG_COLORS.background).toBeTruthy();
    expect(LOG_COLORS.headerBg).toBeTruthy();
    expect(LOG_COLORS.rowBgAlt).toBeTruthy();
    expect(LOG_COLORS.rowBgHover).toBeTruthy();
    expect(LOG_COLORS.rowBgSelected).toBeTruthy();
    expect(LOG_COLORS.rowBorder).toBeTruthy();
    expect(LOG_COLORS.timestamp).toBeTruthy();
    expect(LOG_COLORS.searchHighlight).toBeTruthy();
    expect(LOG_COLORS.searchHighlightActive).toBeTruthy();
  });
});

describe('SYNTAX_COLORS', () => {
  it('defines colors for all token types', () => {
    expect(SYNTAX_COLORS.string).toBeTruthy();
    expect(SYNTAX_COLORS.number).toBeTruthy();
    expect(SYNTAX_COLORS.boolean).toBeTruthy();
    expect(SYNTAX_COLORS.null).toBeTruthy();
    expect(SYNTAX_COLORS.key).toBeTruthy();
    expect(SYNTAX_COLORS.punctuation).toBeTruthy();
    expect(SYNTAX_COLORS.default).toBeTruthy();
  });
});

/* ================================================================== */
/* Type exports (compile-time check)                                   */
/* ================================================================== */
describe('LogViewer type exports', () => {
  it('exports LogEntry type', () => {
    const entry: LogEntry = {
      id: 'test',
      timestampMs: 0,
      level: 'info',
      agentId: 'a1',
      message: 'msg',
    };
    expect(entry.id).toBeDefined();
  });

  it('LogEntry supports optional fields', () => {
    const entry: LogEntry = {
      id: 'test',
      timestampMs: 0,
      level: 'info',
      agentId: 'a1',
      message: 'msg',
      agentName: 'Agent',
      data: { key: 'val' },
      eventId: 'e1',
    };
    expect(entry.agentName).toBe('Agent');
    expect(entry.data).toEqual({ key: 'val' });
    expect(entry.eventId).toBe('e1');
  });
});
