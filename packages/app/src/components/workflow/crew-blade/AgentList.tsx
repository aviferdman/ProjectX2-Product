import React, { useState } from 'react';
import type { AgentNode } from '../../../types/workflow.js';
import { AgentEditor } from './AgentEditor.js';

interface AgentListProps {
  agents: AgentNode[];
  selectedAgentId: string | null;
  onSelect: (agentId: string | null) => void;
  onAdd: (agent: Omit<AgentNode, 'id' | 'status' | 'position'> & { id?: string }) => void;
  onUpdate: (agentId: string, updates: Partial<Omit<AgentNode, 'id'>>) => void;
  onDelete: (agentId: string) => void;
}

const STATUS_STYLES: Record<AgentNode['status'], { dot: string; label: string }> = {
  idle: { dot: 'bg-gray-400', label: 'Idle' },
  working: { dot: 'bg-amber-400 animate-flicker', label: 'Working' },
  error: { dot: 'bg-red-400', label: 'Error' },
  completed: { dot: 'bg-emerald-400', label: 'Completed' },
};

export function AgentList({
  agents,
  selectedAgentId,
  onSelect,
  onAdd,
  onUpdate,
  onDelete,
}: AgentListProps) {
  const [isAdding, setIsAdding] = useState(false);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  const handleSave = (
    data:
      | (Omit<AgentNode, 'id' | 'status' | 'position'> & { id?: string })
      | ({ id: string } & Partial<Omit<AgentNode, 'id'>>),
  ) => {
    if ('id' in data && data.id && agents.some((a) => a.id === data.id)) {
      // Editing an existing agent
      const { id, ...updates } = data;
      onUpdate(id, updates);
    } else {
      // Adding a new agent (with optional hardcoded ID)
      onAdd(data as Omit<AgentNode, 'id' | 'status' | 'position'> & { id?: string });
    }
    onSelect(null);
    setIsAdding(false);
  };

  const handleCancel = () => {
    onSelect(null);
    setIsAdding(false);
  };

  const handleDelete = (agentId: string) => {
    onDelete(agentId);
    onSelect(null);
  };

  const existingAgentIds = agents.map((a) => a.id);

  if (selectedAgent) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin">
        <AgentEditor
          agent={selectedAgent}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={handleDelete}
          existingAgentIds={existingAgentIds}
        />
      </div>
    );
  }

  if (isAdding) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin">
        <AgentEditor
          onSave={handleSave}
          onCancel={handleCancel}
          existingAgentIds={existingAgentIds}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-10 h-10 rounded-full bg-indigo-600/10 flex items-center justify-center mb-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-indigo-400"
              >
                <circle cx="10" cy="7" r="3" />
                <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" />
              </svg>
            </div>
            <p className="text-sm text-[var(--cs-text-tertiary)]">No agents yet</p>
            <p className="text-xs text-[var(--cs-text-tertiary)] mt-1">
              Add your first agent to get started
            </p>
          </div>
        ) : (
          agents.map((agent) => {
            const status = STATUS_STYLES[agent.status];
            return (
              <button
                key={agent.id}
                onClick={() => onSelect(agent.id)}
                className="w-full text-left p-3 rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-app)]/50 hover:bg-white/5 transition-all group"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                    style={{ backgroundColor: agent.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[var(--cs-text-primary)] truncate">
                        {agent.role}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        <span className="text-[10px] text-[var(--cs-text-tertiary)]">
                          {status.label}
                        </span>
                      </div>
                    </div>
                    {agent.goal && (
                      <p className="text-xs text-[var(--cs-text-tertiary)] mt-1 truncate">
                        {agent.goal}
                      </p>
                    )}
                    {agent.tools.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {agent.tools.map((tool) => (
                          <span
                            key={tool}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-white/5 text-[var(--cs-text-tertiary)]"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Add button */}
      <div className="p-3 border-t border-[var(--cs-border-subtle)]">
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-dashed border-[var(--cs-border-subtle)] text-[var(--cs-text-secondary)] hover:text-indigo-400 hover:border-indigo-500/40 hover:bg-indigo-600/5 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M7 1v12M1 7h12" />
          </svg>
          Add Agent
        </button>
      </div>
    </div>
  );
}
