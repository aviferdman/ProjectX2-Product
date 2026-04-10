/**
 * WorkflowPreview — Visual representation of the agent workflow.
 * Shows agents as nodes with task connections in a graph, list, or timeline view.
 */
import React, { useMemo } from 'react';
import type { WorkflowState, AgentNode, TaskNode, DiscussionEdge, DiscussionMessageUI } from '../../types/workflow.js';

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
/* Graph View — Canvas-style node graph with agent connections         */
/* ------------------------------------------------------------------ */

/** Compute agent node positions in a force-directed-style layout. */
function useAgentPositions(agents: AgentNode[]) {
  return useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    const count = agents.length;
    if (count === 0) return positions;

    // Arrange agents in a circle for balanced layout
    const centerX = 450;
    const centerY = 300;
    const radius = Math.max(180, count * 55);

    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      positions.set(agents[i]!.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
    return positions;
  }, [agents]);
}

/** Compute which agents are connected by task dependencies. */
function useTaskDependencyEdges(workflow: WorkflowState) {
  return useMemo(() => {
    const edges: Array<{ from: string; to: string; taskId: string }> = [];
    for (const task of workflow.tasks) {
      if (task.dependencies.length === 0) continue;
      for (const depId of task.dependencies) {
        const depTask = workflow.tasks.find((t) => t.id === depId);
        if (depTask && depTask.agentId !== task.agentId) {
          edges.push({ from: depTask.agentId, to: task.agentId, taskId: task.id });
        }
      }
    }
    return edges;
  }, [workflow.tasks]);
}

function GraphView({
  workflow,
  selectedNodeId,
  onSelectNode,
}: {
  workflow: WorkflowState;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}): React.JSX.Element {
  const agentPositions = useAgentPositions(workflow.agents);
  const depEdges = useTaskDependencyEdges(workflow);
  const discussionEdges = workflow.discussionEdges ?? [];
  const NODE_RADIUS = 54;

  return (
    <div className="h-full relative overflow-auto bg-[var(--cs-surface-app)]" onClick={() => onSelectNode(null)}>
      {/* Dot grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.07) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* SVG layer for edges/arrows */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: 900, minHeight: 600 }}>
        <defs>
          {/* Arrow marker for dependency edges */}
          <marker id="arrow-dep" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 3.5 L 0 7 z" fill="rgba(139,92,246,0.5)" />
          </marker>
          {/* Arrow marker for discussion edges */}
          <marker id="arrow-disc" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 3.5 L 0 7 z" fill="rgba(34,211,238,0.6)" />
          </marker>
          <marker id="arrow-disc-active" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 3.5 L 0 7 z" fill="rgba(34,211,238,1)" />
          </marker>
        </defs>

        {/* Dependency edges (dashed violet lines) */}
        {depEdges.map((edge, i) => {
          const from = agentPositions.get(edge.from);
          const to = agentPositions.get(edge.to);
          if (!from || !to) return null;
          const { x1, y1, x2, y2 } = clipLineToCircle(from.x, from.y, to.x, to.y, NODE_RADIUS);
          return (
            <g key={`dep-${i}`}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(139,92,246,0.25)"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                markerEnd="url(#arrow-dep)"
              />
            </g>
          );
        })}

        {/* Discussion edges (solid cyan lines with animation) */}
        {discussionEdges.map((edge) => {
          const from = agentPositions.get(edge.fromAgentId);
          const to = agentPositions.get(edge.toAgentId);
          if (!from || !to) return null;
          const isActive = edge.status === 'active';
          const isConverged = edge.status === 'converged';
          const { x1, y1, x2, y2 } = clipLineToCircle(from.x, from.y, to.x, to.y, NODE_RADIUS);
          // Offset slightly from dependency lines
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const offsetX = (-dy / len) * 12;
          const offsetY = (dx / len) * 12;

          return (
            <g key={edge.id}>
              {/* Discussion connection line (curved) */}
              <path
                d={`M ${x1} ${y1} Q ${midX + offsetX} ${midY + offsetY} ${x2} ${y2}`}
                fill="none"
                stroke={isConverged ? 'rgba(16,185,129,0.6)' : isActive ? 'rgba(34,211,238,0.8)' : 'rgba(34,211,238,0.2)'}
                strokeWidth={isActive ? 2.5 : 1.5}
                markerEnd={isActive ? 'url(#arrow-disc-active)' : 'url(#arrow-disc)'}
              />

              {/* Animated message dot flowing along edge when active */}
              {isActive && (
                <circle r="4" fill="#22d3ee" opacity="0.9">
                  <animateMotion
                    dur="1.5s"
                    repeatCount="indefinite"
                    path={`M ${x1} ${y1} Q ${midX + offsetX} ${midY + offsetY} ${x2} ${y2}`}
                  />
                </circle>
              )}

              {/* Discussion badge at midpoint */}
              {(edge.messages.length > 0 || isActive) && (
                <g transform={`translate(${midX + offsetX}, ${midY + offsetY})`}>
                  <rect x="-14" y="-10" width="28" height="20" rx="10"
                    fill={isConverged ? 'rgba(16,185,129,0.2)' : isActive ? 'rgba(34,211,238,0.15)' : 'rgba(34,211,238,0.1)'}
                    stroke={isConverged ? 'rgba(16,185,129,0.4)' : isActive ? 'rgba(34,211,238,0.4)' : 'rgba(34,211,238,0.2)'}
                    strokeWidth="1"
                  />
                  <text textAnchor="middle" dy="4" fontSize="9" fontWeight="600"
                    fill={isConverged ? '#10b981' : '#22d3ee'}
                  >
                    {isConverged ? '✓' : `${edge.messages.length}`}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Agent nodes */}
      <div className="relative" style={{ minWidth: 900, minHeight: 600 }}>
        {workflow.agents.map((agent) => {
          const pos = agentPositions.get(agent.id);
          if (!pos) return null;
          const agentTasks = workflow.tasks.filter((t) => t.agentId === agent.id);
          const hasActiveDiscussion = discussionEdges.some(
            (e) => (e.fromAgentId === agent.id || e.toAgentId === agent.id) && e.status === 'active',
          );

          return (
            <div
              key={agent.id}
              className="absolute"
              style={{ left: pos.x - NODE_RADIUS, top: pos.y - NODE_RADIUS }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onSelectNode(agent.id); }}
                className={`relative w-[108px] h-[108px] rounded-full border-2 transition-all duration-300 flex flex-col items-center justify-center focus-ring ${
                  selectedNodeId === agent.id
                    ? 'border-violet-500 bg-violet-500/15 shadow-lg shadow-violet-500/20 scale-110'
                    : hasActiveDiscussion
                      ? 'border-cyan-400/60 bg-cyan-500/10 shadow-md shadow-cyan-500/10'
                      : 'border-[var(--cs-border-subtle)] bg-[var(--cs-surface-card)]/80 hover:border-[var(--cs-border-default)] hover:bg-[var(--cs-surface-card)] hover:scale-105'
                }`}
                style={{
                  borderColor: selectedNodeId === agent.id ? undefined : hasActiveDiscussion ? undefined : `${agent.color}40`,
                  background: selectedNodeId === agent.id ? undefined : `radial-gradient(circle at 30% 30%, ${agent.color}15, ${agent.color}05)`,
                }}
              >
                {/* Agent initial badge */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold mb-1"
                  style={{ backgroundColor: `${agent.color}40`, border: `2px solid ${agent.color}60` }}
                >
                  {agent.role.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                </div>
                <span className="text-[10px] font-semibold text-[var(--cs-text-primary)] text-center leading-tight px-2 truncate max-w-[96px]">
                  {agent.role}
                </span>
                <span className="text-[8px] text-[var(--cs-text-tertiary)] mt-0.5">
                  {agentTasks.length} tasks
                </span>

                {/* Status indicator ring */}
                {agent.status === 'working' && (
                  <div className="absolute inset-0 rounded-full border-2 border-amber-400/50 animate-ping" style={{ animationDuration: '2s' }} />
                )}
                {hasActiveDiscussion && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center animate-pulse">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                )}
                {agent.status === 'completed' && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/90 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          );
        })}

        {/* Task badges along the agent nodes */}
        {workflow.agents.map((agent) => {
          const pos = agentPositions.get(agent.id);
          if (!pos) return null;
          const agentTasks = workflow.tasks.filter((t) => t.agentId === agent.id);
          return agentTasks.map((task, tidx) => {
            const taskAngle = (tidx - (agentTasks.length - 1) / 2) * 0.4;
            const tx = pos.x + (NODE_RADIUS + 24) * Math.cos(taskAngle - Math.PI / 4);
            const ty = pos.y + (NODE_RADIUS + 24) * Math.sin(taskAngle - Math.PI / 4);
            return (
              <button
                key={task.id}
                onClick={(e) => { e.stopPropagation(); onSelectNode(task.id); }}
                className={`absolute px-2 py-1 rounded-lg border text-[9px] max-w-[130px] truncate transition-all hover:scale-105 focus-ring ${
                  selectedNodeId === task.id
                    ? 'border-violet-500/50 bg-violet-500/15 text-violet-300'
                    : task.status === 'completed'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : task.status === 'running'
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 animate-pulse'
                        : 'border-[var(--cs-border-subtle)] bg-[var(--cs-surface-card)]/60 text-[var(--cs-text-secondary)]'
                }`}
                style={{ left: tx - 50, top: ty - 8 }}
                title={task.description}
              >
                {task.discussion && <span className="mr-1">💬</span>}
                {task.description.slice(0, 20)}{task.description.length > 20 ? '…' : ''}
              </button>
            );
          });
        })}
      </div>

      {/* Live discussion messages overlay */}
      {discussionEdges.some((e) => e.status === 'active' && e.messages.length > 0) && (
        <div className="absolute bottom-4 right-4 w-72 max-h-60 overflow-y-auto rounded-xl border border-cyan-500/20 bg-[var(--cs-surface-panel)]/95 backdrop-blur-sm shadow-xl scrollbar-thin">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-cyan-500/10">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold text-cyan-300">Live Discussion</span>
          </div>
          <div className="p-2 space-y-1.5">
            {discussionEdges
              .filter((e) => e.status === 'active')
              .flatMap((e) => e.messages)
              .slice(-8)
              .map((msg) => {
                const agent = workflow.agents.find((a) => a.id === msg.fromAgentId);
                return (
                  <div key={msg.id} className="flex items-start gap-2 animate-fadeInUp">
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white mt-0.5"
                      style={{ backgroundColor: agent?.color ?? '#6366f1' }}
                    >
                      {agent?.role.charAt(0) ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold" style={{ color: agent?.color ?? '#a78bfa' }}>
                          {agent?.role ?? msg.fromAgentId}
                        </span>
                        <span className={`text-[8px] px-1 py-0.5 rounded font-medium ${
                          msg.type === 'agreement' ? 'bg-emerald-500/20 text-emerald-400'
                            : msg.type === 'disagreement' ? 'bg-rose-500/20 text-rose-400'
                            : msg.type === 'revision' ? 'bg-amber-500/20 text-amber-400'
                            : msg.type === 'question' ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {msg.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--cs-text-secondary)] leading-relaxed line-clamp-2 mt-0.5">
                        {msg.content.replace(/^\[(?:AGREE|DISAGREE|REVISE|QUESTION|PROPOSAL)\]\s*/i, '').slice(0, 120)}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 flex items-center gap-4 px-3 py-2 rounded-lg bg-[var(--cs-surface-panel)]/80 backdrop-blur-sm border border-[var(--cs-border-subtle)]">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-px border-t-2 border-dashed border-violet-500/40" />
          <span className="text-[9px] text-[var(--cs-text-tertiary)]">Dependency</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-px border-t-2 border-cyan-400/60" />
          <span className="text-[9px] text-[var(--cs-text-tertiary)]">Discussion</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[9px] text-[var(--cs-text-tertiary)]">Active</span>
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

/** Clip a line from two circle centers so it starts/ends at circle edges. */
function clipLineToCircle(
  cx1: number, cy1: number, cx2: number, cy2: number, radius: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = cx2 - cx1;
  const dy = cy2 - cy1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / len;
  const ny = dy / len;
  return {
    x1: cx1 + nx * radius,
    y1: cy1 + ny * radius,
    x2: cx2 - nx * radius,
    y2: cy2 - ny * radius,
  };
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
    <div className="h-full overflow-auto bg-[var(--cs-surface-app)] p-6 scrollbar-thin">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Agents Section */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wider mb-3">Agents</h3>
          <div className="space-y-2 stagger-children">
            {workflow.agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => onSelectNode(agent.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all card-hover focus-ring ${
                  selectedNodeId === agent.id
                    ? 'border-violet-500/40 bg-violet-500/10'
                    : 'border-[var(--cs-border-subtle)] bg-[var(--cs-surface-card)]/10 hover:bg-[var(--cs-surface-card)]/30 hover:border-[var(--cs-border-default)]'
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
                    <p className="text-sm font-medium text-[var(--cs-text-primary)] truncate">{agent.role}</p>
                    <p className="text-xs text-[var(--cs-text-tertiary)] truncate">{agent.goal}</p>
                  </div>
                  <StatusPill status={agent.status} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Section */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wider mb-3">Tasks</h3>
          <div className="space-y-2 stagger-children">
            {workflow.tasks.map((task, idx) => {
              const agent = workflow.agents.find((a) => a.id === task.agentId);
              return (
                <button
                  key={task.id}
                  onClick={() => onSelectNode(task.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all card-hover focus-ring ${
                    selectedNodeId === task.id
                      ? 'border-violet-500/40 bg-violet-500/10'
                      : 'border-[var(--cs-border-subtle)] bg-[var(--cs-surface-card)]/10 hover:bg-[var(--cs-surface-card)]/30 hover:border-[var(--cs-border-default)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-md bg-[var(--cs-surface-card)]/20 flex items-center justify-center text-xs font-mono text-[var(--cs-text-tertiary)] flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--cs-text-primary)]">{task.description}</p>
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
                          <span className="text-[10px] text-[var(--cs-text-tertiary)]">
                            depends on: {task.dependencies.join(', ')}
                          </span>
                        )}
                      </div>
                      {/* Show task output in list view */}
                      {task.output && (
                        <div className="mt-2 px-2.5 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 animate-fadeIn">
                          <div className="flex items-center gap-1.5 mb-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Result</span>
                          </div>
                          <p className="text-[11px] text-[var(--cs-text-secondary)] leading-relaxed line-clamp-3">{task.output}</p>
                        </div>
                      )}
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
    <div className="h-full overflow-auto bg-[var(--cs-surface-app)] p-6">
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
                    <p className="text-xs font-semibold text-[var(--cs-text-primary)] truncate">{agent.role}</p>
                    <p className="text-[10px] text-[var(--cs-text-tertiary)]">{agentTasks.length} tasks</p>
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
                          : 'border-[var(--cs-border-subtle)] bg-[var(--cs-surface-card)]/20 text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface-card)]/30 hover:text-[var(--cs-text-primary)]'
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
                    <span className="text-xs text-[var(--cs-text-tertiary)] italic">No tasks assigned</span>
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
          : 'border-[var(--cs-border-subtle)] bg-[var(--cs-surface-card)]/10 hover:bg-[var(--cs-surface-card)]/30 hover:border-[var(--cs-border-default)]'
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
          <p className="text-sm font-semibold text-[var(--cs-text-primary)] truncate">{agent.role}</p>
          <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5 line-clamp-2">{agent.goal}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-[var(--cs-text-tertiary)]">{tasksCount} tasks</span>
            <span className="text-[10px] text-[var(--cs-text-tertiary)]">·</span>
            <span className="text-[10px] text-[var(--cs-text-tertiary)]">{agent.tools.length} tools</span>
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
      className={`flex-1 min-w-[260px] max-w-md text-left rounded-xl p-4 border transition-all duration-200 card-hover focus-ring ${
        isSelected
          ? 'border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-500/10'
          : 'border-[var(--cs-border-subtle)] bg-[var(--cs-surface-card)]/10 hover:bg-[var(--cs-surface-card)]/30 hover:border-[var(--cs-border-default)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--cs-surface-card)]/20 flex items-center justify-center flex-shrink-0">
          <TaskStatusIcon status={task.status} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--cs-text-primary)] line-clamp-2">{task.description}</p>
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
          {/* Show output preview when task is completed */}
          {task.output && (
            <div className="mt-2 px-2 py-1.5 rounded-md bg-emerald-500/5 border border-emerald-500/10 animate-fadeIn">
              <p className="text-[10px] text-emerald-400/80 line-clamp-2 leading-relaxed">{task.output}</p>
            </div>
          )}
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
    <div className="fixed right-0 top-[49px] bottom-0 w-80 bg-[var(--cs-surface-panel)] border-l border-[var(--cs-border-subtle)] shadow-2xl z-20 overflow-y-auto animate-slideInRight scrollbar-thin">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--cs-border-subtle)]">
        <h3 className="text-sm font-semibold text-[var(--cs-text-primary)]">Details</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[var(--cs-surface-card)]/20 text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors"
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
              <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Role</label>
              <p className="text-sm text-[var(--cs-text-primary)] mt-1">{agent.role}</p>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Goal</label>
              <p className="text-sm text-[var(--cs-text-secondary)] mt-1">{agent.goal}</p>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Backstory</label>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-1 leading-relaxed">{agent.backstory}</p>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Tools</label>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {agent.tools.map((tool) => (
                  <span key={tool} className="px-2 py-0.5 rounded-md bg-[var(--cs-surface-card)]/20 text-[10px] text-[var(--cs-text-secondary)] border border-[var(--cs-border-subtle)]">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Assigned Tasks</label>
              <div className="space-y-1 mt-1.5">
                {workflow.tasks
                  .filter((t) => t.agentId === agent.id)
                  .map((t) => (
                    <div key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--cs-surface-card)]/10 border border-[var(--cs-border-subtle)]">
                      <TaskStatusIcon status={t.status} />
                      <span className="text-xs text-[var(--cs-text-secondary)] truncate">{t.description}</span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {task && (
          <>
            <div>
              <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Description</label>
              <p className="text-sm text-[var(--cs-text-primary)] mt-1">{task.description}</p>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Assigned Agent</label>
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
                    <span className="text-sm text-[var(--cs-text-secondary)]">{a.role}</span>
                  </div>
                ) : null;
              })()}
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Expected Output</label>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-1">{task.expectedOutput}</p>
            </div>
            {task.dependencies.length > 0 && (
              <div>
                <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Dependencies</label>
                <div className="space-y-1 mt-1.5">
                  {task.dependencies.map((depId) => {
                    const dep = workflow.tasks.find((t) => t.id === depId);
                    return dep ? (
                      <div key={depId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--cs-surface-card)]/10 border border-[var(--cs-border-subtle)]">
                        <TaskStatusIcon status={dep.status} />
                        <span className="text-xs text-[var(--cs-text-secondary)] truncate">{dep.description}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            <div>
              <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Status</label>
              <div className="mt-1.5">
                <TaskStatusPill status={task.status} />
              </div>
            </div>
            {/* Task Output / Result */}
            {task.output && (
              <div className="animate-fadeInUp">
                <label className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Result
                </label>
                <div className="mt-1.5 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                  <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-wrap">{task.output}</p>
                </div>
              </div>
            )}
            {task.status === 'running' && !task.output && (
              <div className="animate-fadeIn">
                <label className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="animate-spin h-2.5 w-2.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  In Progress
                </label>
                <div className="mt-1.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                  <p className="text-xs text-[var(--cs-text-secondary)] animate-pulse">Agent is working on this task...</p>
                </div>
              </div>
            )}
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
    <div className="h-full flex items-center justify-center bg-[var(--cs-surface-app)]">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 animate-pulse" />
          <div className="absolute inset-1 rounded-xl bg-[var(--cs-surface-app)] flex items-center justify-center">
            <svg className="animate-spin h-6 w-6 text-violet-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-[var(--cs-text-primary)] mb-2">Assembling your agent team...</h3>
        <p className="text-sm text-[var(--cs-text-secondary)]">Analyzing your requirements and creating the optimal workflow</p>
        <div className="mt-6 flex items-center justify-center gap-1">
          {['Identifying roles', 'Mapping tasks', 'Setting dependencies'].map((step, i) => (
            <span key={step} className="px-2.5 py-1 rounded-full bg-[var(--cs-surface-card)]/20 text-[10px] text-[var(--cs-text-tertiary)] animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>
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
    <div className="h-full flex items-center justify-center bg-[var(--cs-surface-app)]">
      <div className="text-center max-w-sm px-4">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--cs-surface-card)]/20 border border-[var(--cs-border-default)] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--cs-text-tertiary)]">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-[var(--cs-text-secondary)] mb-1">No workflow yet</h3>
        <p className="text-xs text-[var(--cs-text-tertiary)]">Describe your initiative in the chat to generate a workflow</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared micro-components                                             */
/* ------------------------------------------------------------------ */
function StatusPill({ status }: { status: AgentNode['status'] }): React.JSX.Element {
  const styles: Record<AgentNode['status'], string> = {
    idle: 'bg-slate-500/20 text-[var(--cs-text-secondary)]',
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
    pending: 'bg-slate-500/20 text-[var(--cs-text-secondary)]',
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
