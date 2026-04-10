/**
 * LogFilterBar — Filter toolbar for the log viewer.
 * TASK-145: Implement filters and search (agent, task, log level)
 *
 * Provides:
 * - Search input for free-text filtering
 * - Log level toggle chips (debug, info, warn, error)
 * - Agent multi-select chips
 * - Task multi-select chips
 * - Clear-all button when filters are active
 */
import React, { useCallback } from 'react';
import { clsx } from 'clsx';
import { LOG_LEVEL_STYLES, LOG_COLORS } from './constants.js';
import type { LogFilterBarProps, LogLevel, LogFilters } from './types.js';

const ALL_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

/** A small toggle chip used for levels, agents, tasks. */
const FilterChip: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  color?: string;
  testId?: string;
}> = ({ label, isActive, onClick, color, testId }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={isActive}
    data-testid={testId}
    onClick={onClick}
    className={clsx(
      'h-7 rounded-full border px-3 text-[11px] font-medium transition-colors',
      'select-none cursor-pointer',
    )}
    style={{
      borderColor: isActive ? (color ?? '#8b5cf6') : 'rgba(51,65,85,0.5)',
      background: isActive ? `${color ?? '#8b5cf6'}20` : 'transparent',
      color: isActive ? (color ?? '#c4b5fd') : '#64748b',
    }}
  >
    {label}
  </button>
);

/* ------------------------------------------------------------------ */
/* LogFilterBar                                                        */
/* ------------------------------------------------------------------ */

export const LogFilterBar: React.FC<LogFilterBarProps> = ({
  filters,
  onFiltersChange,
  agents,
  tasks,
  className,
}) => {
  const hasActiveFilters =
    filters.searchQuery.length > 0 ||
    filters.agentIds.length > 0 ||
    filters.taskIds.length > 0 ||
    filters.levels.length > 0;

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({ ...filters, searchQuery: e.target.value });
    },
    [filters, onFiltersChange],
  );

  const handleToggleLevel = useCallback(
    (level: LogLevel) => {
      const next = filters.levels.includes(level)
        ? filters.levels.filter((l) => l !== level)
        : [...filters.levels, level];
      onFiltersChange({ ...filters, levels: next });
    },
    [filters, onFiltersChange],
  );

  const handleToggleAgent = useCallback(
    (agentId: string) => {
      const next = filters.agentIds.includes(agentId)
        ? filters.agentIds.filter((id) => id !== agentId)
        : [...filters.agentIds, agentId];
      onFiltersChange({ ...filters, agentIds: next });
    },
    [filters, onFiltersChange],
  );

  const handleToggleTask = useCallback(
    (taskId: string) => {
      const next = filters.taskIds.includes(taskId)
        ? filters.taskIds.filter((id) => id !== taskId)
        : [...filters.taskIds, taskId];
      onFiltersChange({ ...filters, taskIds: next });
    },
    [filters, onFiltersChange],
  );

  const handleClearAll = useCallback(() => {
    onFiltersChange({ searchQuery: '', agentIds: [], taskIds: [], levels: [] });
  }, [onFiltersChange]);

  return (
    <div
      data-testid="log-filter-bar"
      className={clsx('cs-log-filter-bar flex flex-wrap items-center gap-2 px-3 py-2', className)}
      style={{
        background: LOG_COLORS.headerBg,
        borderBottom: `1px solid rgba(51,65,85,0.3)`,
      }}
      role="toolbar"
      aria-label="Log filters"
    >
      {/* Search input */}
      <div className="relative flex-shrink-0" style={{ minWidth: 180 }}>
        <svg
          className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="#64748b"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="5" />
          <path d="M11 11l3 3" />
        </svg>
        <input
          data-testid="log-filter-search"
          type="search"
          value={filters.searchQuery}
          onChange={handleSearchChange}
          placeholder="Search logs…"
          aria-label="Search logs"
          className={clsx(
            'h-7 w-full rounded pl-7 pr-2 text-xs',
            'border outline-none transition-colors',
          )}
          style={{
            background: 'rgba(15,23,42,0.6)',
            borderColor: 'rgba(51,65,85,0.5)',
            color: '#e2e8f0',
          }}
        />
      </div>

      {/* Separator */}
      <div
        className="h-5 flex-shrink-0"
        style={{ width: 1, background: 'rgba(51,65,85,0.5)' }}
        aria-hidden="true"
      />

      {/* Log level chips */}
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label="Filter by log level"
        data-testid="log-filter-levels"
      >
        {ALL_LEVELS.map((level) => (
          <FilterChip
            key={level}
            label={LOG_LEVEL_STYLES[level].label}
            isActive={filters.levels.includes(level)}
            onClick={() => handleToggleLevel(level)}
            color={LOG_LEVEL_STYLES[level].color}
            testId={`log-filter-level-${level}`}
          />
        ))}
      </div>

      {/* Agent chips (only shown when agents are provided) */}
      {agents.length > 0 && (
        <>
          <div
            className="h-5 flex-shrink-0"
            style={{ width: 1, background: 'rgba(51,65,85,0.5)' }}
            aria-hidden="true"
          />
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label="Filter by agent"
            data-testid="log-filter-agents"
          >
            {agents.map((agent) => (
              <FilterChip
                key={agent.id}
                label={agent.label}
                isActive={filters.agentIds.includes(agent.id)}
                onClick={() => handleToggleAgent(agent.id)}
                testId={`log-filter-agent-${agent.id}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Task chips (only shown when tasks are provided) */}
      {tasks.length > 0 && (
        <>
          <div
            className="h-5 flex-shrink-0"
            style={{ width: 1, background: 'rgba(51,65,85,0.5)' }}
            aria-hidden="true"
          />
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label="Filter by task"
            data-testid="log-filter-tasks"
          >
            {tasks.map((task) => (
              <FilterChip
                key={task.id}
                label={task.label}
                isActive={filters.taskIds.includes(task.id)}
                onClick={() => handleToggleTask(task.id)}
                testId={`log-filter-task-${task.id}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Clear all button */}
      {hasActiveFilters && (
        <button
          type="button"
          data-testid="log-filter-clear"
          onClick={handleClearAll}
          className="ml-auto h-6 rounded border px-2 text-[10px] font-medium transition-colors cursor-pointer"
          style={{
            borderColor: 'rgba(51,65,85,0.5)',
            color: '#94a3b8',
            background: 'transparent',
          }}
          aria-label="Clear all filters"
        >
          Clear filters
        </button>
      )}
    </div>
  );
};

LogFilterBar.displayName = 'LogFilterBar';
