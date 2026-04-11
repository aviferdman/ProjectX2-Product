import React from 'react';
import type { CrewDefinition } from '../../types/crew.js';

export interface CrewCardProps {
  crew: CrewDefinition;
  onClick: (crewId: string) => void;
  onDelete?: (crewId: string) => void;
}

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (weeks > 0) return `${weeks}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

const MAX_VISIBLE_AGENTS = 4;

export function CrewCard({ crew, onClick, onDelete }: CrewCardProps): React.JSX.Element {
  const visibleAgents = crew.agents.slice(0, MAX_VISIBLE_AGENTS);
  const extraCount = Math.max(0, crew.agents.length - MAX_VISIBLE_AGENTS);

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (onDelete) onDelete(crew.id);
  }

  return (
    <button
      type="button"
      onClick={() => onClick(crew.id)}
      className="group relative w-full text-left bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 focus-ring"
      style={{ borderTopColor: crew.color, borderTopWidth: '3px' }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ boxShadow: `inset 0 0 0 1px ${crew.color}44, 0 0 20px ${crew.color}11` }}
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-[var(--cs-text-primary)] truncate">
            {crew.name}
          </h3>
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="shrink-0 p-1 rounded-md text-[var(--cs-text-tertiary)] opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all"
              aria-label="Delete crew"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>

        <p className="text-xs text-[var(--cs-text-secondary)] line-clamp-2 mb-4 min-h-[2.5rem]">
          {crew.description || 'No description'}
        </p>

        {/* Agent avatars */}
        <div className="flex items-center mb-4">
          <div className="flex -space-x-2">
            {visibleAgents.map((agent, i) => (
              <div
                key={agent.id}
                className="w-7 h-7 rounded-full border-2 border-[var(--cs-surface-card)] flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: agent.color, zIndex: MAX_VISIBLE_AGENTS - i }}
                title={agent.role}
              >
                {agent.role.charAt(0).toUpperCase()}
              </div>
            ))}
            {extraCount > 0 && (
              <div className="w-7 h-7 rounded-full border-2 border-[var(--cs-surface-card)] bg-[var(--cs-surface-app)] flex items-center justify-center text-[10px] font-medium text-[var(--cs-text-tertiary)]">
                +{extraCount}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[var(--cs-text-tertiary)]">
          <span>
            {crew.agents.length} agent{crew.agents.length !== 1 ? 's' : ''} &middot; {crew.workflowIds.length} workflow{crew.workflowIds.length !== 1 ? 's' : ''}
          </span>
          <span>{relativeTime(crew.updatedAt)}</span>
        </div>
      </div>
    </button>
  );
}
