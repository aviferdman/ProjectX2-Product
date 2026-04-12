import React, { useState } from 'react';
import type { AgentNode, TaskNode } from '../../../types/workflow.js';
import { TaskEditor } from './TaskEditor.js';

interface TaskListProps {
  tasks: TaskNode[];
  agents: AgentNode[];
  selectedTaskId: string | null;
  onSelect: (taskId: string | null) => void;
  onAdd: (task: Omit<TaskNode, 'id' | 'status'>) => void;
  onUpdate: (taskId: string, updates: Partial<Omit<TaskNode, 'id'>>) => void;
  onDelete: (taskId: string) => void;
}

const STATUS_STYLES: Record<TaskNode['status'], { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Pending' },
  running: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Running' },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Completed' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Failed' },
};

export function TaskList({
  tasks,
  agents,
  selectedTaskId,
  onSelect,
  onAdd,
  onUpdate,
  onDelete,
}: TaskListProps) {
  const [isAdding, setIsAdding] = useState(false);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const getAgent = (agentId: string) => agents.find((a) => a.id === agentId);

  const handleSave = (
    data: Omit<TaskNode, 'id' | 'status'> | ({ id: string } & Partial<Omit<TaskNode, 'id'>>),
  ) => {
    if ('id' in data) {
      const { id, ...updates } = data;
      onUpdate(id, updates);
    } else {
      onAdd(data);
    }
    onSelect(null);
    setIsAdding(false);
  };

  const handleCancel = () => {
    onSelect(null);
    setIsAdding(false);
  };

  const handleDelete = (taskId: string) => {
    onDelete(taskId);
    onSelect(null);
  };

  if (selectedTask) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin">
        <TaskEditor
          task={selectedTask}
          agents={agents}
          tasks={tasks}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={handleDelete}
        />
      </div>
    );
  }

  if (isAdding) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin">
        <TaskEditor agents={agents} tasks={tasks} onSave={handleSave} onCancel={handleCancel} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
        {tasks.length === 0 ? (
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
                <rect x="3" y="3" width="14" height="14" rx="2" />
                <path d="M7 10l2 2 4-4" />
              </svg>
            </div>
            <p className="text-sm text-[var(--cs-text-tertiary)]">No tasks yet</p>
            <p className="text-xs text-[var(--cs-text-tertiary)] mt-1">
              Add your first task to get started
            </p>
          </div>
        ) : (
          tasks.map((task) => {
            const status = STATUS_STYLES[task.status];
            const agent = getAgent(task.agentId);
            return (
              <button
                key={task.id}
                onClick={() => onSelect(task.id)}
                className="w-full text-left p-3 rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-app)]/50 hover:bg-white/5 transition-all group"
              >
                <div className="space-y-2">
                  <p className="text-sm text-[var(--cs-text-primary)] line-clamp-2">
                    {task.description}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {agent ? (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: agent.color }}
                          />
                          <span className="text-xs text-[var(--cs-text-tertiary)] truncate">
                            {agent.role}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--cs-text-tertiary)] italic">
                          Unassigned
                        </span>
                      )}

                      {task.dependencies.length > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-white/5 text-[var(--cs-text-tertiary)] shrink-0">
                          {task.dependencies.length} dep{task.dependencies.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-1.5 py-0.5 text-[10px] rounded shrink-0 ${status.bg} ${status.text}`}
                    >
                      {status.label}
                    </span>
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
          Add Task
        </button>
      </div>
    </div>
  );
}
