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
}

export function WorkflowToolbar({
  workflow,
  viewMode,
  onViewModeChange,
  onRun,
  onBack,
  onSettings,
  isGenerating,
}: WorkflowToolbarProps): React.JSX.Element {
  return (
    <header className="flex items-center gap-3 px-4 py-2.5 bg-[#0b1120] border-b border-white/5 flex-shrink-0 z-10">
      {/* Back */}
      <button
        onClick={onBack}
        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
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
        <span className="text-sm font-semibold text-white hidden sm:inline">CrewSpace</span>
      </div>

      <div className="w-px h-5 bg-white/10 hidden sm:block" />

      {/* Workflow Name */}
      <div className="flex-1 min-w-0">
        {workflow ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-300 truncate max-w-[300px]">
              {workflow.description.length > 60
                ? workflow.description.slice(0, 60) + '...'
                : workflow.description}
            </span>
            <WorkflowStatusBadge status={workflow.status} />
          </div>
        ) : isGenerating ? (
          <span className="text-sm text-slate-500 animate-pulse">Generating workflow...</span>
        ) : (
          <span className="text-sm text-slate-500">New workflow</span>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="hidden md:flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5">
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
          label="List"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          }
        />
        <ViewModeButton
          active={viewMode === 'timeline'}
          onClick={() => onViewModeChange('timeline')}
          label="Timeline"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
      </div>

      <div className="w-px h-5 bg-white/10" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Settings */}
        <button
          onClick={onSettings}
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          title="LLM Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Share */}
        <button
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
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
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
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
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/30 disabled:cursor-not-allowed text-white text-sm font-medium transition-all shadow-lg shadow-emerald-500/20"
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
          ? 'bg-white/10 text-white shadow-sm'
          : 'text-slate-500 hover:text-slate-300'
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
    draft: 'bg-slate-500/20 text-slate-400 border-slate-500/20',
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
