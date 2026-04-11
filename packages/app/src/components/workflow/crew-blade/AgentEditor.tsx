import React, { useState, useCallback } from 'react';
import type { AgentNode } from '../../../types/workflow.js';

interface AgentEditorProps {
  agent?: AgentNode;
  onSave: (agent: Omit<AgentNode, 'id' | 'status' | 'position'> | { id: string } & Partial<Omit<AgentNode, 'id'>>) => void;
  onCancel: () => void;
  onDelete?: (agentId: string) => void;
}

const AVAILABLE_TOOLS = [
  'web-search',
  'document-reader',
  'document-writer',
  'code-executor',
  'web-scraper',
  'data-analyzer',
];

const DEFAULT_COLOR = '#7c3aed';

const COLOR_SWATCHES = [
  '#7c3aed',
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#ec4899',
  '#06b6d4',
  '#8b5cf6',
];

export function AgentEditor({ agent, onSave, onCancel, onDelete }: AgentEditorProps) {
  const [role, setRole] = useState(agent?.role ?? '');
  const [goal, setGoal] = useState(agent?.goal ?? '');
  const [backstory, setBackstory] = useState(agent?.backstory ?? '');
  const [tools, setTools] = useState<string[]>(agent?.tools ?? []);
  const [color, setColor] = useState<string>(agent?.color ?? DEFAULT_COLOR);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleTool = useCallback((tool: string) => {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    );
  }, []);

  const handleSave = useCallback(() => {
    if (!role.trim()) return;
    if (agent) {
      onSave({ id: agent.id, role, goal, backstory, tools, color });
    } else {
      onSave({ role, goal, backstory, tools, color });
    }
  }, [agent, role, goal, backstory, tools, color, onSave]);

  const handleDelete = useCallback(() => {
    if (agent && onDelete) {
      onDelete(agent.id);
    }
  }, [agent, onDelete]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--cs-text-primary)]">
          {agent ? 'Edit Agent' : 'New Agent'}
        </h3>
      </div>

      {/* Role */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--cs-text-secondary)]">
          Role <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Research Analyst"
          className="w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] focus-ring transition-colors"
        />
      </div>

      {/* Goal */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Goal</label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="What should this agent accomplish?"
          rows={2}
          className="w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] focus-ring transition-colors resize-none"
        />
      </div>

      {/* Backstory */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Backstory</label>
        <textarea
          value={backstory}
          onChange={(e) => setBackstory(e.target.value)}
          placeholder="Background context for this agent..."
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] focus-ring transition-colors resize-none"
        />
      </div>

      {/* Tools */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Tools</label>
        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_TOOLS.map((tool) => (
            <button
              key={tool}
              onClick={() => toggleTool(tool)}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                tools.includes(tool)
                  ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                  : 'bg-[var(--cs-surface-app)] border-[var(--cs-border-subtle)] text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)] hover:border-[var(--cs-text-tertiary)]'
              }`}
            >
              {tool}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Color</label>
        <div className="flex gap-2">
          {COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch}
              onClick={() => setColor(swatch)}
              className={`w-6 h-6 rounded-full transition-all ${
                color === swatch
                  ? 'ring-2 ring-offset-2 ring-offset-[var(--cs-surface-card)] ring-white/50 scale-110'
                  : 'hover:scale-110'
              }`}
              style={{ backgroundColor: swatch }}
              aria-label={`Select color ${swatch}`}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-[var(--cs-border-subtle)]">
        <button
          onClick={handleSave}
          disabled={!role.trim()}
          className="flex-1 px-3 py-2 text-sm font-medium rounded-md bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {agent ? 'Save' : 'Add Agent'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 text-sm font-medium rounded-md text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        {agent && onDelete && (
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
                Delete
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
