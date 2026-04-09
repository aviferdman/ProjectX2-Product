/**
 * Pure utility for filtering log entries.
 * TASK-145: Implement filters and search (agent, task, log level)
 */
import type { LogEntry, LogFilters } from './types.js';

/** Default (empty) filters — shows all entries. */
export const DEFAULT_LOG_FILTERS: LogFilters = {
  searchQuery: '',
  agentIds: [],
  taskIds: [],
  levels: [],
};

/**
 * Filter log entries based on structured filters.
 *
 * Matching rules:
 * - searchQuery: case-insensitive substring match in message or agentName/agentId
 * - agentIds: entry's agentId must be in the set (empty = all)
 * - taskIds: entry's taskId must be in the set (empty = all)
 * - levels: entry's level must be in the set (empty = all)
 *
 * All active filters are combined with AND logic.
 */
export function filterLogEntries(entries: LogEntry[], filters: LogFilters): LogEntry[] {
  const { searchQuery, agentIds, taskIds, levels } = filters;

  const hasSearch = searchQuery.length > 0;
  const hasAgentFilter = agentIds.length > 0;
  const hasTaskFilter = taskIds.length > 0;
  const hasLevelFilter = levels.length > 0;

  // Fast path: no filters active
  if (!hasSearch && !hasAgentFilter && !hasTaskFilter && !hasLevelFilter) {
    return entries;
  }

  const lowerSearch = hasSearch ? searchQuery.toLowerCase() : '';
  const agentSet = hasAgentFilter ? new Set(agentIds) : null;
  const taskSet = hasTaskFilter ? new Set(taskIds) : null;
  const levelSet = hasLevelFilter ? new Set(levels) : null;

  return entries.filter((entry) => {
    // Level filter
    if (levelSet && !levelSet.has(entry.level)) return false;

    // Agent filter
    if (agentSet && !agentSet.has(entry.agentId)) return false;

    // Task filter
    if (taskSet) {
      if (!entry.taskId || !taskSet.has(entry.taskId)) return false;
    }

    // Text search
    if (hasSearch) {
      const name = (entry.agentName ?? entry.agentId).toLowerCase();
      const msg = entry.message.toLowerCase();
      const task = (entry.taskName ?? '').toLowerCase();
      if (!msg.includes(lowerSearch) && !name.includes(lowerSearch) && !task.includes(lowerSearch)) {
        return false;
      }
    }

    return true;
  });
}
