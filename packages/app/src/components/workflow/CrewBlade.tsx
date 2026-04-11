import React, { useState, useCallback } from 'react';
import type { AgentNode, TaskNode } from '../../types/workflow.js';
import { AgentList } from './crew-blade/AgentList.js';
import { TaskList } from './crew-blade/TaskList.js';

interface CrewBladeProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AgentNode[];
  tasks: TaskNode[];
  selectedNodeId: string | null;
  onAgentAdd: (agent: Omit<AgentNode, 'id' | 'status' | 'position'> & { id?: string }) => void;
  onAgentUpdate: (agentId: string, updates: Partial<Omit<AgentNode, 'id'>>) => void;
  onAgentDelete: (agentId: string) => void;
  onTaskAdd: (task: Omit<TaskNode, 'id' | 'status'>) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Omit<TaskNode, 'id'>>) => void;
  onTaskDelete: (taskId: string) => void;
  onNodeSelect: (nodeId: string | null) => void;
}

type Tab = 'agents' | 'tasks';

export function CrewBlade({
  isOpen,
  onClose,
  agents,
  tasks,
  selectedNodeId,
  onAgentAdd,
  onAgentUpdate,
  onAgentDelete,
  onTaskAdd,
  onTaskUpdate,
  onTaskDelete,
  onNodeSelect,
}: CrewBladeProps) {
  const [activeTab, setActiveTab] = useState<Tab>('agents');

  const selectedAgentId = agents.find((a) => a.id === selectedNodeId) ? selectedNodeId : null;
  const selectedTaskId = tasks.find((t) => t.id === selectedNodeId) ? selectedNodeId : null;

  const handleAgentSelect = useCallback(
    (agentId: string | null) => {
      onNodeSelect(agentId);
      if (agentId) setActiveTab('agents');
    },
    [onNodeSelect],
  );

  const handleTaskSelect = useCallback(
    (taskId: string | null) => {
      onNodeSelect(taskId);
      if (taskId) setActiveTab('tasks');
    },
    [onNodeSelect],
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-[400px] max-w-full z-50 flex flex-col glass border-l border-[var(--cs-border-subtle)] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--cs-border-subtle)]">
          <h2 className="text-base font-semibold text-[var(--cs-text-primary)]">Crew</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-primary)] hover:bg-white/5 transition-colors"
            aria-label="Close panel"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-[var(--cs-border-subtle)]">
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === 'agents'
                ? 'text-violet-400'
                : 'text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)]'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              Agents
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === 'agents'
                  ? 'bg-violet-600/20 text-violet-400'
                  : 'bg-white/5 text-[var(--cs-text-tertiary)]'
              }`}>
                {agents.length}
              </span>
            </span>
            {activeTab === 'agents' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === 'tasks'
                ? 'text-violet-400'
                : 'text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)]'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              Tasks
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === 'tasks'
                  ? 'bg-violet-600/20 text-violet-400'
                  : 'bg-white/5 text-[var(--cs-text-tertiary)]'
              }`}>
                {tasks.length}
              </span>
            </span>
            {activeTab === 'tasks' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'agents' ? (
            <AgentList
              agents={agents}
              selectedAgentId={selectedAgentId}
              onSelect={handleAgentSelect}
              onAdd={onAgentAdd}
              onUpdate={onAgentUpdate}
              onDelete={onAgentDelete}
            />
          ) : (
            <TaskList
              tasks={tasks}
              agents={agents}
              selectedTaskId={selectedTaskId}
              onSelect={handleTaskSelect}
              onAdd={onTaskAdd}
              onUpdate={onTaskUpdate}
              onDelete={onTaskDelete}
            />
          )}
        </div>
      </div>
    </>
  );
}
