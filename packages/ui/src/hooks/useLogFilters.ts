/**
 * useLogFilters — React hook for managing log filter state.
 * TASK-145: Implement filters and search (agent, task, log level)
 */
import { useState, useMemo, useCallback } from 'react';
import type { LogEntry, LogFilters, LogLevel, FilterOption } from '../components/timeline/types.js';
import { filterLogEntries, DEFAULT_LOG_FILTERS } from '../components/timeline/filterLogEntries.js';

export interface UseLogFiltersOptions {
  /** Initial filter state. */
  initialFilters?: Partial<LogFilters>;
}

export interface UseLogFiltersResult {
  /** Current filter state. */
  filters: LogFilters;
  /** Filtered entries. */
  filteredEntries: LogEntry[];
  /** Total entry count (pre-filter). */
  totalCount: number;
  /** Filtered entry count. */
  filteredCount: number;
  /** Whether any filter is active. */
  isFiltered: boolean;
  /** Available agent options (derived from entries). */
  agentOptions: FilterOption[];
  /** Available task options (derived from entries). */
  taskOptions: FilterOption[];
  /** Set the entire filters object. */
  setFilters: (filters: LogFilters) => void;
  /** Update the search query. */
  setSearchQuery: (query: string) => void;
  /** Toggle an agent ID in the filter. */
  toggleAgent: (agentId: string) => void;
  /** Toggle a task ID in the filter. */
  toggleTask: (taskId: string) => void;
  /** Toggle a log level in the filter. */
  toggleLevel: (level: LogLevel) => void;
  /** Reset all filters. */
  resetFilters: () => void;
}

/**
 * Hook that manages structured log filters and returns filtered entries.
 *
 * Derives available agent/task options from the full entry list so the UI
 * can render dynamic filter dropdowns.
 */
export function useLogFilters(
  entries: LogEntry[],
  options: UseLogFiltersOptions = {},
): UseLogFiltersResult {
  const [filters, setFilters] = useState<LogFilters>({
    ...DEFAULT_LOG_FILTERS,
    ...options.initialFilters,
  });

  // Derive available agent options from entries
  const agentOptions = useMemo<FilterOption[]>(() => {
    const seen = new Map<string, string>();
    for (const entry of entries) {
      if (!seen.has(entry.agentId)) {
        seen.set(entry.agentId, entry.agentName ?? entry.agentId);
      }
    }
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
  }, [entries]);

  // Derive available task options from entries
  const taskOptions = useMemo<FilterOption[]>(() => {
    const seen = new Map<string, string>();
    for (const entry of entries) {
      if (entry.taskId && !seen.has(entry.taskId)) {
        seen.set(entry.taskId, entry.taskName ?? entry.taskId);
      }
    }
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
  }, [entries]);

  const filteredEntries = useMemo(() => filterLogEntries(entries, filters), [entries, filters]);

  const isFiltered =
    filters.searchQuery.length > 0 ||
    filters.agentIds.length > 0 ||
    filters.taskIds.length > 0 ||
    filters.levels.length > 0;

  const setSearchQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const toggleAgent = useCallback((agentId: string) => {
    setFilters((prev) => ({
      ...prev,
      agentIds: prev.agentIds.includes(agentId)
        ? prev.agentIds.filter((id) => id !== agentId)
        : [...prev.agentIds, agentId],
    }));
  }, []);

  const toggleTask = useCallback((taskId: string) => {
    setFilters((prev) => ({
      ...prev,
      taskIds: prev.taskIds.includes(taskId)
        ? prev.taskIds.filter((id) => id !== taskId)
        : [...prev.taskIds, taskId],
    }));
  }, []);

  const toggleLevel = useCallback((level: LogLevel) => {
    setFilters((prev) => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter((l) => l !== level)
        : [...prev.levels, level],
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_LOG_FILTERS });
  }, []);

  return {
    filters,
    filteredEntries,
    totalCount: entries.length,
    filteredCount: filteredEntries.length,
    isFiltered,
    agentOptions,
    taskOptions,
    setFilters,
    setSearchQuery,
    toggleAgent,
    toggleTask,
    toggleLevel,
    resetFilters,
  };
}
