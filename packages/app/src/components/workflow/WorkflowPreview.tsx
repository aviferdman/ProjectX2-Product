/**
 * WorkflowPreview — Visual representation of the agent workflow.
 * Shows agents as nodes with task connections in a graph, list, or timeline view.
 */
import React, { useMemo } from 'react';
import type { WorkflowState, AgentNode, TaskNode } from '../../types/workflow.js';

interface WorkflowPreviewProps {
  workflow: WorkflowState | null;
  viewMode: 'graph' | 'list' | 'timeline';
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  isGenerating: boolean;
}

export function WorkflowPreview({
  workflow,
  viewMode,
  selectedNodeId,
  onSelectNode,
  isGenerating,
}: WorkflowPreviewProps): React.JSX.Element {
  if (isGenerating && !workflow) {
    return <GeneratingState />;
  }

  if (!workflow) {
    return <EmptyState />;
  }

  return (
    <div className="h-full flex flex-col">
      {viewMode === 'graph' && (
        <GraphView
          workflow={workflow}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
        />
      )}
      {viewMode === 'list' && (
        <ListView
          workflow={workflow}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
        />
      )}
      {viewMode === 'timeline' && (
        <TimelineView
          workflow={workflow}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Graph View — Visual node graph                                      */
/* ------------------------------------------------------------------ */
function GraphView({
  workflow,
  selectedNodeId,
  onSelectNode,
}: {
  workflow: WorkflowState;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}): React.JSX.Element {
  // Calculate task positions based on dependency layers
  const taskLayers = useMemo(() => {
    const layers: TaskNode[][] = [];
    const placed = new Set<string>();
    const tasks = workflow.tasks;

    while (placed.size < tasks.length) {
      const layer: TaskNode[] = [];
      for (const task of tasks) {
        if (placed.has(task.id)) continue;
        if (task.dependencies.every((d) => placed.has(d))) {
          layer.push(task);
        }
      }
      if (layer.length === 0) break; // Avoid infinite loop
      for (const t of layer) placed.add(t.id);
      layers.push(layer);
    }
    return layers;
  }, [workflow.tasks]);

  return (
    <div className="h-full relative overflow-auto bg-[#020617]" onClick={() => onSelectNode(null)}>
      {/* Dot grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.07) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Agents Row */}
      <div className="relative px-8 pt-8 pb-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-5 h-5 rounded bg-violet-500/20 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgb(167 139 250)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agent Team</h3>
          <span className="text-xs text-slate-600">({workflow.agents.length})</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {workflow.agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={selectedNodeId === agent.id}
              tasksCount={workflow.tasks.filter((t) => t.agentId === agent.id).length}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onSelectNode(agent.id);
              }}
            />
          ))}
        </div>
      </div>

      {/* Tasks Flow */}
      <div className="relative px-8 pt-4 pb-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-5 h-5 rounded bg-cyan-500/20 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgb(34 211 238)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Pipeline</h3>
          <span className="text-xs text-slate-600">({workflow.tasks.length} tasks)</span>
        </div>

        <div className="space-y-4">
          {taskLayers.map((layer, layerIdx) => (
            <div key={layerIdx} className="flex flex-col gap-3">
              {/* Layer connector */}
              {layerIdx > 0 && (
                <div className="flex justify-center py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-px h-6 bg-gradient-to-b from-violet-500/30 to-violet-500/10" />
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgb(139 92 246)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <polyline points="19 12 12 19 5 12" />
                    </svg>
                    <div className="w-px h-6 bg-gradient-to-b from-violet-500/30 to-violet-500/10" />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {layer.map((task) => {
                  const agent = workflow.agents.find((a) => a.id === task.agentId);
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      agent={agent}
                      isSelected={selectedNodeId === task.id}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onSelectNode(task.id);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Node Details Panel */}
      {selectedNodeId && (
        <DetailsPanel
          workflow={workflow}
          nodeId={selectedNodeId}
          onClose={() => onSelectNode(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* List View                                                           */
/* ------------------------------------------------------------------ */
function ListView({
  workflow,
  selectedNodeId,
  onSelectNode,
}: {
  workflow: WorkflowState;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}): React.JSX.Element {
  return (
    <div className="h-full overflow-auto bg-[#020617] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Agents Section */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Agents</h3>
          <div className="space-y-2">
            {workflow.agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => onSelectNode(agent.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  selectedNodeId === agent.id
                    ? 'border-violet-500/40 bg-violet-500/10'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: `${agent.color}30`, border: `1px solid ${agent.color}40` }}
                  >
                    {agent.role.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{agent.role}</p>
                    <p className="text-xs text-slate-500 truncate">{agent.goal}</p>
                  </div>
                  <StatusPill status={agent.status} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Section */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Tasks</h3>
          <div className="space-y-2">
            {workflow.tasks.map((task, idx) => {
              const agent = workflow.agents.find((a) => a.id === task.agentId);
              return (
                <button
                  key={task.id}
                  onClick={() => onSelectNode(task.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    selectedNodeId === task.id
                      ? 'border-violet-500/40 bg-violet-500/10'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-xs font-mono text-slate-500 flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{task.description}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {agent && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{ backgroundColor: `${agent.color}20`, color: agent.color }}
                          >
                            {agent.role}
                          </span>
                        )}
                        {task.dependencies.length > 0 && (
                          <span className="text-[10px] text-slate-600">
                            depends on: {task.dependencies.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <TaskStatusPill status={task.status} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Timeline View                                                       */
/* ------------------------------------------------------------------ */
function TimelineView({
  workflow,
  selectedNodeId,
  onSelectNode,
}: {
  workflow: WorkflowState;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}): React.JSX.Element {
  return (
    <div className="h-full overflow-auto bg-[#020617] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Agent lanes */}
        <div className="space-y-1">
          {workflow.agents.map((agent) => {
            const agentTasks = workflow.tasks.filter((t) => t.agentId === agent.id);
            return (
              <div key={agent.id} className="flex items-stretch gap-3 min-h-[60px]">
                {/* Agent label */}
                <div className="w-40 flex-shrink-0 flex items-center px-3 py-2 rounded-l-lg border-r-2" style={{ borderColor: agent.color }}>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{agent.role}</p>
                    <p className="text-[10px] text-slate-500">{agentTasks.length} tasks</p>
                  </div>
                </div>
                {/* Task blocks */}
                <div className="flex-1 flex items-center gap-2 py-1.5 overflow-x-auto">
                  {agentTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onSelectNode(task.id)}
                      className={`flex-shrink-0 px-3 py-2 rounded-lg border text-xs transition-all ${
                        selectedNodeId === task.id
                          ? 'border-violet-500/40 bg-violet-500/10 text-white'
                          : 'border-white/5 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white'
                      }`}
                      style={{
                        minWidth: '120px',
                        borderLeftWidth: '3px',
                        borderLeftColor:
                          task.status === 'completed'
                            ? '#10b981'
                            : task.status === 'running'
                              ? '#f59e0b'
                              : agent.color,
                      }}
                    >
                      <p className="truncate max-w-[200px]">{task.description}</p>
                    </button>
                  ))}
                  {agentTasks.length === 0 && (
                    <span className="text-xs text-slate-600 italic">No tasks assigned</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Agent Card                                                          */
/* ------------------------------------------------------------------ */
function AgentCard({
  agent,
  isSelected,
  tasksCount,
  onClick,
}: {
  agent: AgentNode;
  isSelected: boolean;
  tasksCount: number;
  onClick: (e: React.MouseEvent) => void;
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl p-4 border transition-all duration-200 ${
        isSelected
          ? 'border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-500/10'
          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: `${agent.color}25`, border: `1.5px solid ${agent.color}40` }}
        >
          {agent.role.split(' ').map((w) => w[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{agent.role}</p>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{agent.goal}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-slate-500">{tasksCount} tasks</span>
            <span className="text-[10px] text-slate-600">·</span>
            <span className="text-[10px] text-slate-500">{agent.tools.length} tools</span>
            <div className="flex-1" />
            <StatusPill status={agent.status} />
          </div>
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Task Card                                                           */
/* ------------------------------------------------------------------ */
function TaskCard({
  task,
  agent,
  isSelected,
  onClick,
}: {
  task: TaskNode;
  agent: AgentNode | undefined;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[260px] max-w-md text-left rounded-xl p-4 border transition-all duration-200 ${
        isSelected
          ? 'border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-500/10'
          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
          <TaskStatusIcon status={task.status} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white line-clamp-2">{task.description}</p>
          <div className="flex items-center gap-2 mt-2">
            {agent && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ backgroundColor: `${agent.color}20`, color: agent.color }}
              >
                {agent.role}
              </span>
            )}
            <TaskStatusPill status={task.status} />
          </div>
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Details Panel — Slide-in for selected nodes                         */
/* ------------------------------------------------------------------ */
function DetailsPanel({
  workflow,
  nodeId,
  onClose,
}: {
  workflow: WorkflowState;
  nodeId: string;
  onClose: () => void;
}): React.JSX.Element {
  const agent = workflow.agents.find((a) => a.id === nodeId);
  const task = workflow.tasks.find((t) => t.id === nodeId);

  return (
    <div className="fixed right-0 top-[49px] bottom-0 w-80 bg-[#0f172a] border-l border-white/5 shadow-2xl z-20 overflow-y-auto animate-slideInRight">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white">Details</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {agent && (
          <>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Role</label>
              <p className="text-sm text-white mt-1">{agent.role}</p>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Goal</label>
              <p className="text-sm text-slate-300 mt-1">{agent.goal}</p>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Backstory</label>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{agent.backstory}</p>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tools</label>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {agent.tools.map((tool) => (
                  <span key={tool} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-slate-400 border border-white/5">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Assigned Tasks</label>
              <div className="space-y-1 mt-1.5">
                {workflow.tasks
                  .filter((t) => t.agentId === agent.id)
                  .map((t) => (
                    <div key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                      <TaskStatusIcon status={t.status} />
                      <span className="text-xs text-slate-300 truncate">{t.description}</span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {task && (
          <>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Description</label>
              <p className="text-sm text-white mt-1">{task.description}</p>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Assigned Agent</label>
              {(() => {
                const a = workflow.agents.find((ag) => ag.id === task.agentId);
                return a ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: `${a.color}30` }}
                    >
                      {a.role.charAt(0)}
                    </div>
                    <span className="text-sm text-slate-300">{a.role}</span>
                  </div>
                ) : null;
              })()}
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Expected Output</label>
              <p className="text-xs text-slate-400 mt-1">{task.expectedOutput}</p>
            </div>
            {task.dependencies.length > 0 && (
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Dependencies</label>
                <div className="space-y-1 mt-1.5">
                  {task.dependencies.map((depId) => {
                    const dep = workflow.tasks.find((t) => t.id === depId);
                    return dep ? (
                      <div key={depId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                        <TaskStatusIcon status={dep.status} />
                        <span className="text-xs text-slate-300 truncate">{dep.description}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</label>
              <div className="mt-1.5">
                <TaskStatusPill status={task.status} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */
function GeneratingState(): React.JSX.Element {
  return (
    <div className="h-full flex items-center justify-center bg-[#020617]">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 animate-pulse" />
          <div className="absolute inset-1 rounded-xl bg-[#020617] flex items-center justify-center">
            <svg className="animate-spin h-6 w-6 text-violet-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Assembling your agent team...</h3>
        <p className="text-sm text-slate-400">Analyzing your requirements and creating the optimal workflow</p>
        <div className="mt-6 flex items-center justify-center gap-1">
          {['Identifying roles', 'Mapping tasks', 'Setting dependencies'].map((step, i) => (
            <span key={step} className="px-2.5 py-1 rounded-full bg-white/5 text-[10px] text-slate-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>
              {step}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState(): React.JSX.Element {
  return (
    <div className="h-full flex items-center justify-center bg-[#020617]">
      <div className="text-center max-w-sm px-4">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-slate-300 mb-1">No workflow yet</h3>
        <p className="text-xs text-slate-500">Describe your initiative in the chat to generate a workflow</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared micro-components                                             */
/* ------------------------------------------------------------------ */
function StatusPill({ status }: { status: AgentNode['status'] }): React.JSX.Element {
  const styles: Record<AgentNode['status'], string> = {
    idle: 'bg-slate-500/20 text-slate-400',
    working: 'bg-amber-500/20 text-amber-400 animate-pulse',
    error: 'bg-rose-500/20 text-rose-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function TaskStatusPill({ status }: { status: TaskNode['status'] }): React.JSX.Element {
  const styles: Record<TaskNode['status'], string> = {
    pending: 'bg-slate-500/20 text-slate-400',
    running: 'bg-amber-500/20 text-amber-400 animate-pulse',
    completed: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-rose-500/20 text-rose-400',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function TaskStatusIcon({ status }: { status: TaskNode['status'] }): React.JSX.Element {
  if (status === 'completed') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (status === 'running') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="animate-spin">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="4" />
        <path className="opacity-75" fill="#f59e0b" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    );
  }
  if (status === 'failed') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
