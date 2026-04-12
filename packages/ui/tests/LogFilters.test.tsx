/**
 * Tests for TASK-145: Implement filters and search (agent, task, log level)
 *
 * Covers:
 * - filterLogEntries utility (all filter combinations)
 * - LogFilterBar component (rendering, interactions, accessibility)
 * - useLogFilters hook (state management, derived options)
 * - Type exports
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

import {
  LogFilterBar,
  type LogFilterBarProps,
  type LogFilters,
  type LogEntry,
  type LogLevel,
  filterLogEntries,
  DEFAULT_LOG_FILTERS,
} from '../src/components/timeline/index.js';

import { useLogFilters } from '../src/hooks/useLogFilters.js';

/* ------------------------------------------------------------------ */
/* Test data                                                           */
/* ------------------------------------------------------------------ */

const testEntries: LogEntry[] = [
  {
    id: 'log-1',
    timestampMs: 1000,
    level: 'info',
    agentId: 'agent-1',
    agentName: 'Analyst',
    taskId: 'task-a',
    taskName: 'Analyze Data',
    message: 'Starting data analysis',
  },
  {
    id: 'log-2',
    timestampMs: 2000,
    level: 'debug',
    agentId: 'agent-1',
    agentName: 'Analyst',
    taskId: 'task-a',
    taskName: 'Analyze Data',
    message: 'Fetching dataset from API',
  },
  {
    id: 'log-3',
    timestampMs: 3000,
    level: 'warn',
    agentId: 'agent-2',
    agentName: 'Writer',
    taskId: 'task-b',
    taskName: 'Write Report',
    message: 'Rate limit approaching',
  },
  {
    id: 'log-4',
    timestampMs: 4000,
    level: 'error',
    agentId: 'agent-3',
    agentName: 'Reviewer',
    taskId: 'task-b',
    taskName: 'Write Report',
    message: 'Connection refused: timeout after 30s',
  },
  {
    id: 'log-5',
    timestampMs: 5000,
    level: 'info',
    agentId: 'agent-2',
    agentName: 'Writer',
    message: 'Report generation complete',
  },
];

/* ================================================================== */
/* filterLogEntries                                                    */
/* ================================================================== */

describe('filterLogEntries', () => {
  it('returns all entries when no filters are active', () => {
    const result = filterLogEntries(testEntries, DEFAULT_LOG_FILTERS);
    expect(result).toHaveLength(5);
    expect(result).toBe(testEntries); // same reference (fast path)
  });

  it('filters by search query in message', () => {
    const filters: LogFilters = { ...DEFAULT_LOG_FILTERS, searchQuery: 'Connection' };
    const result = filterLogEntries(testEntries, filters);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('log-4');
  });

  it('filters by search query in agent name', () => {
    const filters: LogFilters = { ...DEFAULT_LOG_FILTERS, searchQuery: 'Writer' };
    const result = filterLogEntries(testEntries, filters);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(['log-3', 'log-5']);
  });

  it('filters by search query in task name', () => {
    const filters: LogFilters = { ...DEFAULT_LOG_FILTERS, searchQuery: 'Write Report' };
    const result = filterLogEntries(testEntries, filters);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(['log-3', 'log-4']);
  });

  it('search is case-insensitive', () => {
    const filters: LogFilters = { ...DEFAULT_LOG_FILTERS, searchQuery: 'starting' };
    const result = filterLogEntries(testEntries, filters);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('log-1');
  });

  it('filters by single log level', () => {
    const filters: LogFilters = { ...DEFAULT_LOG_FILTERS, levels: ['error'] };
    const result = filterLogEntries(testEntries, filters);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('log-4');
  });

  it('filters by multiple log levels', () => {
    const filters: LogFilters = { ...DEFAULT_LOG_FILTERS, levels: ['info', 'warn'] };
    const result = filterLogEntries(testEntries, filters);
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.id)).toEqual(['log-1', 'log-3', 'log-5']);
  });

  it('filters by single agent', () => {
    const filters: LogFilters = { ...DEFAULT_LOG_FILTERS, agentIds: ['agent-2'] };
    const result = filterLogEntries(testEntries, filters);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(['log-3', 'log-5']);
  });

  it('filters by multiple agents', () => {
    const filters: LogFilters = { ...DEFAULT_LOG_FILTERS, agentIds: ['agent-1', 'agent-3'] };
    const result = filterLogEntries(testEntries, filters);
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.id)).toEqual(['log-1', 'log-2', 'log-4']);
  });

  it('filters by single task', () => {
    const filters: LogFilters = { ...DEFAULT_LOG_FILTERS, taskIds: ['task-a'] };
    const result = filterLogEntries(testEntries, filters);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(['log-1', 'log-2']);
  });

  it('filters by multiple tasks', () => {
    const filters: LogFilters = { ...DEFAULT_LOG_FILTERS, taskIds: ['task-a', 'task-b'] };
    const result = filterLogEntries(testEntries, filters);
    expect(result).toHaveLength(4);
    expect(result.map((e) => e.id)).toEqual(['log-1', 'log-2', 'log-3', 'log-4']);
  });

  it('task filter excludes entries without taskId', () => {
    const filters: LogFilters = { ...DEFAULT_LOG_FILTERS, taskIds: ['task-b'] };
    const result = filterLogEntries(testEntries, filters);
    // log-5 has no taskId, so it should be excluded
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(['log-3', 'log-4']);
  });

  it('combines level + agent filters (AND logic)', () => {
    const filters: LogFilters = {
      ...DEFAULT_LOG_FILTERS,
      levels: ['info'],
      agentIds: ['agent-2'],
    };
    const result = filterLogEntries(testEntries, filters);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('log-5');
  });

  it('combines search + level filters', () => {
    const filters: LogFilters = {
      ...DEFAULT_LOG_FILTERS,
      searchQuery: 'data',
      levels: ['debug'],
    };
    const result = filterLogEntries(testEntries, filters);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('log-2');
  });

  it('combines all filters together', () => {
    const filters: LogFilters = {
      searchQuery: 'Analyst',
      agentIds: ['agent-1'],
      taskIds: ['task-a'],
      levels: ['info', 'debug'],
    };
    const result = filterLogEntries(testEntries, filters);
    // Only log-1 and log-2 match agent-1 + task-a + levels + "Analyst" in agent name
    expect(result).toHaveLength(2);
  });

  it('returns empty when no entries match', () => {
    const filters: LogFilters = {
      ...DEFAULT_LOG_FILTERS,
      levels: ['error'],
      agentIds: ['agent-1'],
    };
    const result = filterLogEntries(testEntries, filters);
    expect(result).toHaveLength(0);
  });

  it('returns empty for empty entries array', () => {
    const result = filterLogEntries([], { ...DEFAULT_LOG_FILTERS, levels: ['info'] });
    expect(result).toHaveLength(0);
  });
});

/* ================================================================== */
/* DEFAULT_LOG_FILTERS                                                 */
/* ================================================================== */

describe('DEFAULT_LOG_FILTERS', () => {
  it('has empty search query', () => {
    expect(DEFAULT_LOG_FILTERS.searchQuery).toBe('');
  });

  it('has empty arrays for all filter dimensions', () => {
    expect(DEFAULT_LOG_FILTERS.agentIds).toEqual([]);
    expect(DEFAULT_LOG_FILTERS.taskIds).toEqual([]);
    expect(DEFAULT_LOG_FILTERS.levels).toEqual([]);
  });
});

/* ================================================================== */
/* LogFilterBar — rendering                                            */
/* ================================================================== */

function renderFilterBar(props: Partial<LogFilterBarProps> = {}) {
  const defaultProps: LogFilterBarProps = {
    filters: { ...DEFAULT_LOG_FILTERS },
    onFiltersChange: vi.fn(),
    agents: [
      { id: 'agent-1', label: 'Analyst' },
      { id: 'agent-2', label: 'Writer' },
    ],
    tasks: [
      { id: 'task-a', label: 'Analyze Data' },
      { id: 'task-b', label: 'Write Report' },
    ],
    ...props,
  };
  return render(<LogFilterBar {...defaultProps} />);
}

describe('LogFilterBar rendering', () => {
  it('renders the toolbar container', () => {
    renderFilterBar();
    expect(screen.getByTestId('log-filter-bar')).toBeInTheDocument();
  });

  it('has toolbar role and label', () => {
    renderFilterBar();
    const bar = screen.getByTestId('log-filter-bar');
    expect(bar.getAttribute('role')).toBe('toolbar');
    expect(bar.getAttribute('aria-label')).toBe('Log filters');
  });

  it('renders the search input', () => {
    renderFilterBar();
    expect(screen.getByTestId('log-filter-search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search logs…')).toBeInTheDocument();
  });

  it('renders all four log level chips', () => {
    renderFilterBar();
    expect(screen.getByTestId('log-filter-level-debug')).toBeInTheDocument();
    expect(screen.getByTestId('log-filter-level-info')).toBeInTheDocument();
    expect(screen.getByTestId('log-filter-level-warn')).toBeInTheDocument();
    expect(screen.getByTestId('log-filter-level-error')).toBeInTheDocument();
  });

  it('renders agent filter chips', () => {
    renderFilterBar();
    expect(screen.getByTestId('log-filter-agent-agent-1')).toBeInTheDocument();
    expect(screen.getByTestId('log-filter-agent-agent-2')).toBeInTheDocument();
  });

  it('renders task filter chips', () => {
    renderFilterBar();
    expect(screen.getByTestId('log-filter-task-task-a')).toBeInTheDocument();
    expect(screen.getByTestId('log-filter-task-task-b')).toBeInTheDocument();
  });

  it('hides agent section when no agents provided', () => {
    renderFilterBar({ agents: [] });
    expect(screen.queryByTestId('log-filter-agents')).toBeNull();
  });

  it('hides task section when no tasks provided', () => {
    renderFilterBar({ tasks: [] });
    expect(screen.queryByTestId('log-filter-tasks')).toBeNull();
  });

  it('does not show clear button when no filters active', () => {
    renderFilterBar();
    expect(screen.queryByTestId('log-filter-clear')).toBeNull();
  });

  it('shows clear button when search is active', () => {
    renderFilterBar({ filters: { ...DEFAULT_LOG_FILTERS, searchQuery: 'test' } });
    expect(screen.getByTestId('log-filter-clear')).toBeInTheDocument();
  });

  it('shows clear button when level filter is active', () => {
    renderFilterBar({ filters: { ...DEFAULT_LOG_FILTERS, levels: ['error'] } });
    expect(screen.getByTestId('log-filter-clear')).toBeInTheDocument();
  });

  it('merges custom className', () => {
    renderFilterBar({ className: 'my-filter' });
    const bar = screen.getByTestId('log-filter-bar');
    expect(bar.className).toContain('my-filter');
  });
});

/* ================================================================== */
/* LogFilterBar — interactions                                         */
/* ================================================================== */

describe('LogFilterBar interactions', () => {
  it('calls onFiltersChange when typing in search', () => {
    const onFiltersChange = vi.fn();
    renderFilterBar({ onFiltersChange });
    const input = screen.getByTestId('log-filter-search');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...DEFAULT_LOG_FILTERS,
      searchQuery: 'hello',
    });
  });

  it('toggles a log level on', () => {
    const onFiltersChange = vi.fn();
    renderFilterBar({ onFiltersChange });
    fireEvent.click(screen.getByTestId('log-filter-level-error'));
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...DEFAULT_LOG_FILTERS,
      levels: ['error'],
    });
  });

  it('toggles a log level off', () => {
    const onFiltersChange = vi.fn();
    const filters: LogFilters = { ...DEFAULT_LOG_FILTERS, levels: ['error', 'warn'] };
    renderFilterBar({ onFiltersChange, filters });
    fireEvent.click(screen.getByTestId('log-filter-level-error'));
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...filters,
      levels: ['warn'],
    });
  });

  it('toggles an agent on', () => {
    const onFiltersChange = vi.fn();
    renderFilterBar({ onFiltersChange });
    fireEvent.click(screen.getByTestId('log-filter-agent-agent-1'));
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...DEFAULT_LOG_FILTERS,
      agentIds: ['agent-1'],
    });
  });

  it('toggles an agent off', () => {
    const onFiltersChange = vi.fn();
    const filters: LogFilters = { ...DEFAULT_LOG_FILTERS, agentIds: ['agent-1', 'agent-2'] };
    renderFilterBar({ onFiltersChange, filters });
    fireEvent.click(screen.getByTestId('log-filter-agent-agent-1'));
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...filters,
      agentIds: ['agent-2'],
    });
  });

  it('toggles a task on', () => {
    const onFiltersChange = vi.fn();
    renderFilterBar({ onFiltersChange });
    fireEvent.click(screen.getByTestId('log-filter-task-task-a'));
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...DEFAULT_LOG_FILTERS,
      taskIds: ['task-a'],
    });
  });

  it('toggles a task off', () => {
    const onFiltersChange = vi.fn();
    const filters: LogFilters = { ...DEFAULT_LOG_FILTERS, taskIds: ['task-a'] };
    renderFilterBar({ onFiltersChange, filters });
    fireEvent.click(screen.getByTestId('log-filter-task-task-a'));
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...filters,
      taskIds: [],
    });
  });

  it('clears all filters', () => {
    const onFiltersChange = vi.fn();
    const filters: LogFilters = {
      searchQuery: 'test',
      agentIds: ['agent-1'],
      taskIds: ['task-a'],
      levels: ['error'],
    };
    renderFilterBar({ onFiltersChange, filters });
    fireEvent.click(screen.getByTestId('log-filter-clear'));
    expect(onFiltersChange).toHaveBeenCalledWith({
      searchQuery: '',
      agentIds: [],
      taskIds: [],
      levels: [],
    });
  });

  it('level chip has aria-checked when active', () => {
    const filters: LogFilters = { ...DEFAULT_LOG_FILTERS, levels: ['warn'] };
    renderFilterBar({ filters });
    expect(screen.getByTestId('log-filter-level-warn').getAttribute('aria-checked')).toBe('true');
    expect(screen.getByTestId('log-filter-level-info').getAttribute('aria-checked')).toBe('false');
  });

  it('agent chip has aria-checked when active', () => {
    const filters: LogFilters = { ...DEFAULT_LOG_FILTERS, agentIds: ['agent-2'] };
    renderFilterBar({ filters });
    expect(screen.getByTestId('log-filter-agent-agent-2').getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(screen.getByTestId('log-filter-agent-agent-1').getAttribute('aria-checked')).toBe(
      'false',
    );
  });
});

/* ================================================================== */
/* LogFilterBar — accessibility                                        */
/* ================================================================== */

describe('LogFilterBar accessibility', () => {
  it('search input has aria-label', () => {
    renderFilterBar();
    expect(screen.getByTestId('log-filter-search').getAttribute('aria-label')).toBe('Search logs');
  });

  it('level group has aria-label', () => {
    renderFilterBar();
    expect(screen.getByTestId('log-filter-levels').getAttribute('aria-label')).toBe(
      'Filter by log level',
    );
  });

  it('agent group has aria-label', () => {
    renderFilterBar();
    expect(screen.getByTestId('log-filter-agents').getAttribute('aria-label')).toBe(
      'Filter by agent',
    );
  });

  it('task group has aria-label', () => {
    renderFilterBar();
    expect(screen.getByTestId('log-filter-tasks').getAttribute('aria-label')).toBe(
      'Filter by task',
    );
  });

  it('clear button has aria-label', () => {
    renderFilterBar({ filters: { ...DEFAULT_LOG_FILTERS, levels: ['error'] } });
    expect(screen.getByTestId('log-filter-clear').getAttribute('aria-label')).toBe(
      'Clear all filters',
    );
  });
});

/* ================================================================== */
/* useLogFilters hook                                                  */
/* ================================================================== */

describe('useLogFilters', () => {
  it('returns all entries with default filters', () => {
    const { result } = renderHook(() => useLogFilters(testEntries));
    expect(result.current.filteredEntries).toHaveLength(5);
    expect(result.current.totalCount).toBe(5);
    expect(result.current.filteredCount).toBe(5);
    expect(result.current.isFiltered).toBe(false);
  });

  it('derives agent options from entries', () => {
    const { result } = renderHook(() => useLogFilters(testEntries));
    const ids = result.current.agentOptions.map((o) => o.id);
    expect(ids).toContain('agent-1');
    expect(ids).toContain('agent-2');
    expect(ids).toContain('agent-3');
  });

  it('agent options use agentName as label', () => {
    const { result } = renderHook(() => useLogFilters(testEntries));
    const analyst = result.current.agentOptions.find((o) => o.id === 'agent-1');
    expect(analyst!.label).toBe('Analyst');
  });

  it('derives task options from entries', () => {
    const { result } = renderHook(() => useLogFilters(testEntries));
    const ids = result.current.taskOptions.map((o) => o.id);
    expect(ids).toContain('task-a');
    expect(ids).toContain('task-b');
    expect(ids).toHaveLength(2); // log-5 has no taskId
  });

  it('task options use taskName as label', () => {
    const { result } = renderHook(() => useLogFilters(testEntries));
    const task = result.current.taskOptions.find((o) => o.id === 'task-a');
    expect(task!.label).toBe('Analyze Data');
  });

  it('setSearchQuery filters entries', () => {
    const { result } = renderHook(() => useLogFilters(testEntries));
    act(() => result.current.setSearchQuery('Connection'));
    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0]!.id).toBe('log-4');
    expect(result.current.isFiltered).toBe(true);
  });

  it('toggleLevel adds and removes levels', () => {
    const { result } = renderHook(() => useLogFilters(testEntries));
    act(() => result.current.toggleLevel('error'));
    expect(result.current.filters.levels).toEqual(['error']);
    expect(result.current.filteredEntries).toHaveLength(1);

    act(() => result.current.toggleLevel('warn'));
    expect(result.current.filters.levels).toEqual(['error', 'warn']);
    expect(result.current.filteredEntries).toHaveLength(2);

    act(() => result.current.toggleLevel('error'));
    expect(result.current.filters.levels).toEqual(['warn']);
    expect(result.current.filteredEntries).toHaveLength(1);
  });

  it('toggleAgent adds and removes agents', () => {
    const { result } = renderHook(() => useLogFilters(testEntries));
    act(() => result.current.toggleAgent('agent-1'));
    expect(result.current.filters.agentIds).toEqual(['agent-1']);
    expect(result.current.filteredEntries).toHaveLength(2);

    act(() => result.current.toggleAgent('agent-1'));
    expect(result.current.filters.agentIds).toEqual([]);
    expect(result.current.filteredEntries).toHaveLength(5);
  });

  it('toggleTask adds and removes tasks', () => {
    const { result } = renderHook(() => useLogFilters(testEntries));
    act(() => result.current.toggleTask('task-b'));
    expect(result.current.filters.taskIds).toEqual(['task-b']);
    expect(result.current.filteredEntries).toHaveLength(2);

    act(() => result.current.toggleTask('task-b'));
    expect(result.current.filters.taskIds).toEqual([]);
    expect(result.current.filteredEntries).toHaveLength(5);
  });

  it('resetFilters clears all filters', () => {
    const { result } = renderHook(() => useLogFilters(testEntries));
    act(() => {
      result.current.setSearchQuery('test');
      result.current.toggleLevel('error');
      result.current.toggleAgent('agent-1');
      result.current.toggleTask('task-a');
    });
    expect(result.current.isFiltered).toBe(true);

    act(() => result.current.resetFilters());
    expect(result.current.isFiltered).toBe(false);
    expect(result.current.filteredEntries).toHaveLength(5);
  });

  it('setFilters replaces the full filter state', () => {
    const { result } = renderHook(() => useLogFilters(testEntries));
    const newFilters: LogFilters = {
      searchQuery: 'analysis',
      agentIds: ['agent-1'],
      taskIds: [],
      levels: ['info'],
    };
    act(() => result.current.setFilters(newFilters));
    expect(result.current.filters).toEqual(newFilters);
    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0]!.id).toBe('log-1');
  });

  it('accepts initialFilters option', () => {
    const { result } = renderHook(() =>
      useLogFilters(testEntries, { initialFilters: { levels: ['warn'] } }),
    );
    expect(result.current.filters.levels).toEqual(['warn']);
    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.isFiltered).toBe(true);
  });

  it('filteredCount reflects current filter state', () => {
    const { result } = renderHook(() => useLogFilters(testEntries));
    expect(result.current.filteredCount).toBe(5);

    act(() => result.current.toggleLevel('error'));
    expect(result.current.filteredCount).toBe(1);
    expect(result.current.totalCount).toBe(5);
  });
});

/* ================================================================== */
/* Type exports (compile-time check)                                   */
/* ================================================================== */

describe('TASK-145 type exports', () => {
  it('LogFilters type is usable', () => {
    const filters: LogFilters = {
      searchQuery: '',
      agentIds: [],
      taskIds: [],
      levels: [],
    };
    expect(filters.searchQuery).toBe('');
  });

  it('LogEntry supports taskId and taskName', () => {
    const entry: LogEntry = {
      id: 'test',
      timestampMs: 0,
      level: 'info',
      agentId: 'a1',
      message: 'msg',
      taskId: 'task-1',
      taskName: 'My Task',
    };
    expect(entry.taskId).toBe('task-1');
    expect(entry.taskName).toBe('My Task');
  });
});
