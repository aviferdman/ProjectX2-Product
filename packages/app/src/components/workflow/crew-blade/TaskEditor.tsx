import React, { useState, useCallback } from 'react';
import type { AgentNode, TaskNode } from '../../../types/workflow.js';

interface TaskEditorProps {
  task?: TaskNode;
  agents: AgentNode[];
  tasks: TaskNode[];
  onSave: (
    task: Omit<TaskNode, 'id' | 'status'> | ({ id: string } & Partial<Omit<TaskNode, 'id'>>),
  ) => void;
  onCancel: () => void;
  onDelete?: (taskId: string) => void;
}

export function TaskEditor({ task, agents, tasks, onSave, onCancel, onDelete }: TaskEditorProps) {
  const [description, setDescription] = useState(task?.description ?? '');
  const [agentId, setAgentId] = useState(task?.agentId ?? '');
  const [dependencies, setDependencies] = useState<string[]>(task?.dependencies ?? []);
  const [expectedOutput, setExpectedOutput] = useState(task?.expectedOutput ?? '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const otherTasks = tasks.filter((t) => t.id !== task?.id);

  const toggleDependency = useCallback((depId: string) => {
    setDependencies((prev) =>
      prev.includes(depId) ? prev.filter((d) => d !== depId) : [...prev, depId],
    );
  }, []);

  const handleSave = useCallback(() => {
    if (!description.trim()) return;
    if (task) {
      onSave({ id: task.id, description, agentId, dependencies, expectedOutput });
    } else {
      onSave({ description, agentId, dependencies, expectedOutput });
    }
  }, [task, description, agentId, dependencies, expectedOutput, onSave]);

  const handleDelete = useCallback(() => {
    if (task && onDelete) {
      onDelete(task.id);
    }
  }, [task, onDelete]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--cs-text-primary)]">
          {task ? 'Edit Task' : 'New Task'}
        </h3>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--cs-text-secondary)]">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this task should accomplish..."
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] focus-ring transition-colors resize-none"
        />
      </div>

      {/* Assigned Agent */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--cs-text-secondary)]">
          Assigned Agent
        </label>
        <select
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] focus-ring transition-colors"
        >
          <option value="">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.role}
            </option>
          ))}
        </select>
      </div>

      {/* Dependencies */}
      {otherTasks.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--cs-text-secondary)]">
            Dependencies
          </label>
          <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
            {otherTasks.map((t) => (
              <label
                key={t.id}
                className="flex items-start gap-2.5 p-2 rounded-md bg-[var(--cs-surface-app)]/50 border border-[var(--cs-border-subtle)] cursor-pointer hover:bg-white/5 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={dependencies.includes(t.id)}
                  onChange={() => toggleDependency(t.id)}
                  className="mt-0.5 rounded border-[var(--cs-border-subtle)] bg-[var(--cs-surface-app)] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <span className="text-xs text-[var(--cs-text-secondary)] line-clamp-2">
                  {t.description}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Expected Output */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--cs-text-secondary)]">
          Expected Output
        </label>
        <textarea
          value={expectedOutput}
          onChange={(e) => setExpectedOutput(e.target.value)}
          placeholder="What output should this task produce?"
          rows={2}
          className="w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] focus-ring transition-colors resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-[var(--cs-border-subtle)]">
        <button
          onClick={handleSave}
          disabled={!description.trim()}
          className="flex-1 px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {task ? 'Save' : 'Add Task'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 text-sm font-medium rounded-md text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        {task && onDelete && (
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
