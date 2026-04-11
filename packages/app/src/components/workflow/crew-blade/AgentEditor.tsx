import React, { useState, useCallback } from 'react';
import type { AgentNode } from '../../../types/workflow.js';
import { ALL_HARDCODED_AGENTS, BUSINESS_PRODUCT_AGENTS, RESEARCH_ANALYSIS_AGENTS } from '../../../data/hardcoded-agents.js';
import type { HardcodedAgent } from '../../../data/hardcoded-agents.js';

interface AgentEditorProps {
  agent?: AgentNode;
  /** When editing, view-only detail of the selected agent. When adding, show catalog picker. */
  onSave: (agent: Omit<AgentNode, 'id' | 'status' | 'position'> | { id: string } & Partial<Omit<AgentNode, 'id'>>) => void;
  onCancel: () => void;
  onDelete?: (agentId: string) => void;
  /** IDs of agents already in the workflow (to disable in picker). */
  existingAgentIds?: string[];
}

const AGENT_COLORS = [
  '#7c3aed',
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#ec4899',
  '#06b6d4',
  '#8b5cf6',
];

type CategoryFilter = 'all' | 'business-product' | 'research-analysis';

export function AgentEditor({ agent, onSave, onCancel, onDelete, existingAgentIds = [] }: AgentEditorProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');

  const isEditing = !!agent;

  // When adding a new agent, show the catalog picker
  const filteredAgents = (() => {
    let list: readonly HardcodedAgent[];
    switch (categoryFilter) {
      case 'business-product':
        list = BUSINESS_PRODUCT_AGENTS;
        break;
      case 'research-analysis':
        list = RESEARCH_ANALYSIS_AGENTS;
        break;
      default:
        list = ALL_HARDCODED_AGENTS;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.role.toLowerCase().includes(q) ||
          a.subtitle.toLowerCase().includes(q) ||
          a.goal.toLowerCase().includes(q),
      );
    }
    return list;
  })();

  const handlePickAgent = useCallback(
    (def: HardcodedAgent) => {
      const colorIndex = existingAgentIds.length;
      onSave({
        id: def.id,
        role: def.role,
        goal: def.goal,
        backstory: def.backstory,
        tools: [...def.tools],
        color: AGENT_COLORS[colorIndex % AGENT_COLORS.length] ?? '#7c3aed',
      });
    },
    [onSave, existingAgentIds],
  );

  const handleDelete = useCallback(() => {
    if (agent && onDelete) {
      onDelete(agent.id);
    }
  }, [agent, onDelete]);

  // ---------- View / Edit mode: show agent details (read-only) ----------
  if (isEditing && agent) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--cs-text-primary)]">
            Agent Details
          </h3>
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Role</label>
          <div className="w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)]">
            {agent.role}
          </div>
        </div>

        {/* Goal */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Goal</label>
          <div className="w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] whitespace-pre-wrap">
            {agent.goal}
          </div>
        </div>

        {/* Backstory */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Backstory</label>
          <div className="w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] whitespace-pre-wrap">
            {agent.backstory}
          </div>
        </div>

        {/* Tools */}
        {agent.tools.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Tools</label>
            <div className="flex flex-wrap gap-1.5">
              {agent.tools.map((tool) => (
                <span
                  key={tool}
                  className="px-2.5 py-1 text-xs rounded-md bg-violet-600/20 border border-violet-500/40 text-violet-300"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Color indicator */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Color</label>
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: agent.color }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--cs-border-subtle)]">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 text-sm font-medium rounded-md text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] hover:bg-white/5 transition-colors"
          >
            Back
          </button>
          {onDelete && (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDelete}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-md text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)] transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 text-sm font-medium rounded-md text-red-400 hover:bg-red-600/10 transition-colors"
                >
                  Remove
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ---------- Add mode: catalog picker ----------
  return (
    <div className="p-4 space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--cs-text-primary)]">
          Select Agent
        </h3>
        <button
          onClick={onCancel}
          className="text-xs text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)] transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search agents..."
        className="w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] focus-ring transition-colors"
      />

      {/* Category filter */}
      <div className="flex gap-1.5">
        {(['all', 'business-product', 'research-analysis'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
              categoryFilter === cat
                ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                : 'bg-[var(--cs-surface-app)] border-[var(--cs-border-subtle)] text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)]'
            }`}
          >
            {cat === 'all' ? 'All' : cat === 'business-product' ? 'Business & Product' : 'Research & Analysis'}
          </button>
        ))}
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
        {filteredAgents.map((def) => {
          const alreadyAdded = existingAgentIds.includes(def.id);
          return (
            <button
              key={def.id}
              onClick={() => !alreadyAdded && handlePickAgent(def)}
              disabled={alreadyAdded}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                alreadyAdded
                  ? 'opacity-40 cursor-not-allowed border-[var(--cs-border-subtle)] bg-[var(--cs-surface-app)]/30'
                  : 'border-[var(--cs-border-subtle)] bg-[var(--cs-surface-app)]/50 hover:bg-white/5 hover:border-violet-500/30'
              }`}
            >
              <div className="flex items-start gap-2">
                <div
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{
                    backgroundColor: def.category === 'business-product' ? '#f59e0b' : '#06b6d4',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--cs-text-primary)]">
                      {def.role}
                    </span>
                    {alreadyAdded && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[var(--cs-text-tertiary)]">
                        Added
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--cs-text-tertiary)] mt-0.5">
                    {def.subtitle}
                  </p>
                  <p className="text-xs text-[var(--cs-text-tertiary)] mt-1 line-clamp-2">
                    {def.goal}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
        {filteredAgents.length === 0 && (
          <p className="text-xs text-[var(--cs-text-tertiary)] text-center py-4">
            No agents match your search.
          </p>
        )}
      </div>
    </div>
  );
}
