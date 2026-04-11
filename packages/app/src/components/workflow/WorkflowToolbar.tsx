/**
 * WorkflowToolbar — Top bar for the workflow editor.
 * Controls: back, title, view mode toggle, run/stop, status.
 */
import React from 'react';
import type { WorkflowState } from '../../types/workflow.js';

interface WorkflowToolbarProps {
  workflow: WorkflowState | null;
  viewMode: 'graph' | 'list' | 'timeline';
  onViewModeChange: (mode: 'graph' | 'list' | 'timeline') => void;
  onRun: () => void;
  onBack: () => void;
  onSettings: () => void;
  isGenerating: boolean;
  onToggleCrewBlade?: () => void;
  isCrewBladeOpen?: boolean;
  onSaveAsCrew?: () => void;
}

export function WorkflowToolbar({
  workflow,
  viewMode,
  onViewModeChange,
  onRun,
  onBack,
  onSettings,
  isGenerating,
  onToggleCrewBlade,
  isCrewBladeOpen,
  onSaveAsCrew,
}: WorkflowToolbarProps): React.JSX.Element {
  return (
    <header className="flex items-center gap-3 px-4 py-2.5 glass border-b border-[var(--cs-border-subtle)] flex-shrink-0 z-10">
      {/* Back */}
      <button
        onClick={onBack}
        className="p-1.5 rounded-lg hover:bg-[var(--cs-surface-card)] text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors"
        title="Back to home"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-[var(--cs-text-primary)] hidden sm:inline">CrewSpace</span>
      </div>

      <div className="w-px h-5 bg-[var(--cs-border-default)] hidden sm:block" />

      {/* Workflow Name */}
      <div className="flex-1 min-w-0">
        {workflow ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--cs-text-secondary)] truncate max-w-[300px]">
              {workflow.description.length > 60
                ? workflow.description.slice(0, 60) + '...'
                : workflow.description}
            </span>
            <WorkflowStatusBadge status={workflow.status} />
          </div>
        ) : isGenerating ? (
          <span className="text-sm text-[var(--cs-text-tertiary)] animate-pulse">Generating workflow...</span>
        ) : (
          <span className="text-sm text-[var(--cs-text-tertiary)]">New workflow</span>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="hidden md:flex items-center bg-[var(--cs-surface-card)] rounded-lg p-0.5 border border-[var(--cs-border-subtle)]">
        <ViewModeButton
          active={viewMode === 'graph'}
          onClick={() => onViewModeChange('graph')}
          label="Graph"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          }
        />
        <ViewModeButton
          active={viewMode === 'list'}
          onClick={() => onViewModeChange('list')}
          label="Results"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
        />
      </div>

      <div className="w-px h-5 bg-[var(--cs-border-default)]" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Settings */}
        <button
          onClick={onSettings}
          className="p-2 rounded-lg hover:bg-[var(--cs-surface-card)] text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring"
          title="LLM Settings"
          aria-label="LLM Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Crew Blade Toggle */}
        {onToggleCrewBlade && (
          <button
            onClick={onToggleCrewBlade}
            className={`p-2 rounded-lg transition-colors focus-ring ${
              isCrewBladeOpen
                ? 'bg-violet-500/15 text-violet-400'
                : 'hover:bg-[var(--cs-surface-card)] text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)]'
            }`}
            title={isCrewBladeOpen ? 'Close Crew panel' : 'Open Crew panel'}
            aria-label="Toggle Crew panel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </button>
        )}

        {/* Save as Crew */}
        {onSaveAsCrew && (
          <button
            onClick={onSaveAsCrew}
            disabled={!workflow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors focus-ring"
            title="Save workflow as a crew"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save Crew
          </button>
        )}

        {/* Share */}
        <button
          className="p-2 rounded-lg hover:bg-[var(--cs-surface-card)] text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors"
          title="Share workflow"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>

        {/* Save */}
        <button
          className="p-2 rounded-lg hover:bg-[var(--cs-surface-card)] text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors"
          title="Save workflow"
          disabled={!workflow}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        </button>

        {/* Run */}
        <button
          onClick={onRun}
          disabled={!workflow || workflow.status === 'running' || isGenerating}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/30 disabled:cursor-not-allowed text-white text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 focus-ring"
        >
          {workflow?.status === 'running' ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Running
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Run
            </>
          )}
        </button>
      </div>
    </header>
  );
}

function ViewModeButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
        active
          ? 'bg-violet-500/15 text-violet-700 shadow-sm'
          : 'text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-primary)]'
      }`}
      title={label}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function WorkflowStatusBadge({ status }: { status: WorkflowState['status'] }): React.JSX.Element {
  const styles: Record<WorkflowState['status'], string> = {
    draft: 'bg-slate-500/20 text-[var(--cs-text-secondary)] border-slate-500/20',
    running: 'bg-amber-500/20 text-amber-400 border-amber-500/20 animate-pulse',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
    failed: 'bg-rose-500/20 text-rose-400 border-rose-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${styles[status]}`}>
      {status}
    </span>
  );
}
