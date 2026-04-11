/**
 * WorkflowPreview — Visual representation of the agent workflow.
 * Shows agents as nodes with task connections in a graph, list, or timeline view.
 */
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { WorkflowState, AgentNode, TaskNode, DiscussionEdge, DiscussionMessageUI } from '../../types/workflow.js';
import { AgentAvatar } from '../AgentAvatar.js';

interface WorkflowPreviewProps {
  workflow: WorkflowState | null;
  viewMode: 'graph' | 'list' | 'timeline';
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  isGenerating: boolean;
  onWorkflowChange?: (workflow: WorkflowState) => void;
}

export function WorkflowPreview({
  workflow,
  viewMode,
  selectedNodeId,
  onSelectNode,
  isGenerating,
  onWorkflowChange,
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
          onWorkflowChange={onWorkflowChange}
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
/* Graph View — n8n-style horizontal workflow graph                     */
/* ------------------------------------------------------------------ */

/** Card dimensions for task nodes */
const CARD_W = 220;
const DISC_CARD_W = 280;
const CARD_H = 72;
const DISC_CARD_H = 88;
const CARD_GAP_X = 80;
const CARD_GAP_Y = 24;
const PADDING_LEFT = 60;
const PADDING_TOP = 60;

/** Topological sort + column assignment for left-to-right layout */
function useNodeLayout(workflow: WorkflowState) {
  return useMemo(() => {
    const tasks = workflow.tasks;
    if (tasks.length === 0) return { positions: new Map<string, { x: number; y: number; col: number; row: number }>(), columns: 0, maxRow: 0 };

    // Build dependency graph
    const inDegree = new Map<string, number>();
    const depGraph = new Map<string, string[]>();
    const revGraph = new Map<string, string[]>();
    for (const t of tasks) {
      inDegree.set(t.id, 0);
      depGraph.set(t.id, []);
      revGraph.set(t.id, []);
    }
    for (const t of tasks) {
      for (const d of t.dependencies) {
        if (depGraph.has(d)) {
          depGraph.get(d)!.push(t.id);
          revGraph.get(t.id)!.push(d);
          inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
        }
      }
    }

    // Assign columns via longest path (for left-to-right depth)
    const col = new Map<string, number>();
    const queue: string[] = [];
    for (const t of tasks) {
      if ((inDegree.get(t.id) ?? 0) === 0) {
        queue.push(t.id);
        col.set(t.id, 0);
      }
    }
    let maxCol = 0;
    while (queue.length > 0) {
      const tid = queue.shift()!;
      const c = col.get(tid) ?? 0;
      for (const next of (depGraph.get(tid) ?? [])) {
        const nc = Math.max(col.get(next) ?? 0, c + 1);
        col.set(next, nc);
        maxCol = Math.max(maxCol, nc);
        const deg = (inDegree.get(next) ?? 1) - 1;
        inDegree.set(next, deg);
        if (deg <= 0) queue.push(next);
      }
    }
    // Assign unvisited nodes (cycles) to column 0
    for (const t of tasks) {
      if (!col.has(t.id)) col.set(t.id, 0);
    }

    // Group by column, sort within column by agent
    const byCol = new Map<number, TaskNode[]>();
    for (const t of tasks) {
      const c = col.get(t.id) ?? 0;
      if (!byCol.has(c)) byCol.set(c, []);
      byCol.get(c)!.push(t);
    }

    // Pre-compute the max card width per column so we can stagger X offsets
    const colMaxW = new Map<number, number>();
    for (const [c, colTasks] of byCol) {
      let mw = CARD_W;
      for (const t of colTasks) {
        if (t.discussion) mw = Math.max(mw, DISC_CARD_W);
      }
      colMaxW.set(c, mw);
    }
    // Compute cumulative X offset per column
    const colX = new Map<number, number>();
    let runningX = PADDING_LEFT;
    for (let c = 0; c <= maxCol; c++) {
      colX.set(c, runningX);
      runningX += (colMaxW.get(c) ?? CARD_W) + CARD_GAP_X;
    }

    const positions = new Map<string, { x: number; y: number; col: number; row: number }>();
    let globalMaxRow = 0;
    for (const [c, colTasks] of byCol) {
      // Sort by agent id for visual grouping
      colTasks.sort((a, b) => a.agentId.localeCompare(b.agentId));
      let rowY = PADDING_TOP;
      colTasks.forEach((t, row) => {
        const h = t.discussion ? DISC_CARD_H : CARD_H;
        positions.set(t.id, {
          x: colX.get(c) ?? PADDING_LEFT,
          y: rowY,
          col: c,
          row,
        });
        rowY += h + CARD_GAP_Y;
        globalMaxRow = Math.max(globalMaxRow, row);
      });
    }

    return { positions, columns: maxCol + 1, maxRow: globalMaxRow };
  }, [workflow.tasks]);
}

/** Build n8n-style cubic bezier path between two points (horizontal S-curve) */
function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.abs(x2 - x1);
  const cp = Math.max(dx * 0.5, 50);
  return `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;
}

function GraphView({
  workflow,
  selectedNodeId,
  onSelectNode,
  onWorkflowChange,
}: {
  workflow: WorkflowState;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onWorkflowChange?: ((workflow: WorkflowState) => void) | undefined;
}): React.JSX.Element {
  const { positions, columns, maxRow } = useNodeLayout(workflow);
  const containerRef = useRef<HTMLDivElement>(null);

  // Draggable positions override
  const [dragOffsets, setDragOffsets] = useState<Map<string, { dx: number; dy: number }>>(new Map());
  const [dragging, setDragging] = useState<{ taskId: string; startX: number; startY: number; origDx: number; origDy: number } | null>(null);

  // Reset offsets when tasks change structure
  const taskKey = workflow.tasks.map(t => t.id).join(',');
  const prevTaskKey = useRef(taskKey);
  useEffect(() => {
    if (prevTaskKey.current !== taskKey) {
      setDragOffsets(new Map());
      prevTaskKey.current = taskKey;
    }
  }, [taskKey]);

  const getPos = useCallback((taskId: string) => {
    const base = positions.get(taskId);
    if (!base) return null;
    const off = dragOffsets.get(taskId);
    return {
      x: base.x + (off?.dx ?? 0),
      y: base.y + (off?.dy ?? 0),
    };
  }, [positions, dragOffsets]);

  // ── Drag handlers ──
  const handleNodePointerDown = useCallback((e: React.PointerEvent, taskId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const off = dragOffsets.get(taskId);
    setDragging({
      taskId,
      startX: e.clientX,
      startY: e.clientY,
      origDx: off?.dx ?? 0,
      origDy: off?.dy ?? 0,
    });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [dragOffsets]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = dragging.origDx + (e.clientX - dragging.startX);
    const dy = dragging.origDy + (e.clientY - dragging.startY);
    setDragOffsets(prev => {
      const next = new Map(prev);
      next.set(dragging.taskId, { dx, dy });
      return next;
    });
  }, [dragging]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  // ── Connection drawing ──
  const [drawingConn, setDrawingConn] = useState<{ fromTaskId: string; mouseX: number; mouseY: number } | null>(null);

  const handlePortDown = useCallback((e: React.PointerEvent, taskId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setDrawingConn({
      fromTaskId: taskId,
      mouseX: e.clientX - rect.left + container.scrollLeft,
      mouseY: e.clientY - rect.top + container.scrollTop,
    });
  }, []);

  const handleConnMove = useCallback((e: React.PointerEvent) => {
    if (!drawingConn) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setDrawingConn(prev => prev ? {
      ...prev,
      mouseX: e.clientX - rect.left + container.scrollLeft,
      mouseY: e.clientY - rect.top + container.scrollTop,
    } : null);
  }, [drawingConn]);

  const handleConnUp = useCallback((e: React.PointerEvent) => {
    if (!drawingConn || !onWorkflowChange) { setDrawingConn(null); return; }
    // Hit-test: find which task card the cursor landed on
    const container = containerRef.current;
    if (!container) { setDrawingConn(null); return; }
    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left + container.scrollLeft;
    const my = e.clientY - rect.top + container.scrollTop;
    for (const task of workflow.tasks) {
      if (task.id === drawingConn.fromTaskId) continue;
      const pos = getPos(task.id);
      if (!pos) continue;
      const tw = task.discussion ? DISC_CARD_W : CARD_W;
      const th = task.discussion ? DISC_CARD_H : CARD_H;
      if (mx >= pos.x && mx <= pos.x + tw && my >= pos.y && my <= pos.y + th) {
        // Add dependency: target task depends on source
        if (!task.dependencies.includes(drawingConn.fromTaskId)) {
          onWorkflowChange({
            ...workflow,
            tasks: workflow.tasks.map(t =>
              t.id === task.id ? { ...t, dependencies: [...t.dependencies, drawingConn.fromTaskId] } : t
            ),
          });
        }
        setDrawingConn(null);
        return;
      }
    }
    setDrawingConn(null);
  }, [drawingConn, workflow, onWorkflowChange, getPos]);

  // ── Context menu ──
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number;
    type: 'canvas' | 'task' | 'edge';
    taskId?: string;
    edgeKey?: string; // "fromId:toId"
  } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('contextmenu', close);
    return () => { window.removeEventListener('click', close); window.removeEventListener('contextmenu', close); };
  }, [contextMenu]);

  // ── Mutation helpers ──
  const AGENT_COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#6366f1', '#ec4899', '#14b8a6'];

  const addAgent = useCallback(() => {
    if (!onWorkflowChange) return;
    const id = `agent-${Date.now()}`;
    const idx = workflow.agents.length;
    const color = AGENT_COLORS[idx % AGENT_COLORS.length] ?? '#8b5cf6';
    const newAgent: AgentNode = {
      id, role: `Agent ${idx + 1}`, goal: 'New agent', backstory: '', tools: [],
      status: 'idle', color, position: { x: 0, y: 0 },
    };
    onWorkflowChange({ ...workflow, agents: [...workflow.agents, newAgent] });
    onSelectNode(id);
  }, [workflow, onWorkflowChange, onSelectNode, AGENT_COLORS]);

  const addTask = useCallback((agentId: string) => {
    if (!onWorkflowChange) return;
    const id = `task-${Date.now()}`;
    const newTask: TaskNode = {
      id, description: 'New task', agentId, dependencies: [], expectedOutput: '', status: 'pending',
    };
    onWorkflowChange({ ...workflow, tasks: [...workflow.tasks, newTask] });
    onSelectNode(id);
  }, [workflow, onWorkflowChange, onSelectNode]);

  const removeTask = useCallback((taskId: string) => {
    if (!onWorkflowChange) return;
    onWorkflowChange({
      ...workflow,
      tasks: workflow.tasks.filter(t => t.id !== taskId).map(t => ({
        ...t, dependencies: t.dependencies.filter(d => d !== taskId),
      })),
    });
    if (selectedNodeId === taskId) onSelectNode(null);
  }, [workflow, onWorkflowChange, selectedNodeId, onSelectNode]);

  const removeAgent = useCallback((agentId: string) => {
    if (!onWorkflowChange) return;
    onWorkflowChange({
      ...workflow,
      agents: workflow.agents.filter(a => a.id !== agentId),
      tasks: workflow.tasks.map(t => t.agentId === agentId ? { ...t, agentId: '' } : t),
      discussionEdges: (workflow.discussionEdges ?? []).filter(e => e.fromAgentId !== agentId && e.toAgentId !== agentId),
    });
    if (selectedNodeId === agentId) onSelectNode(null);
  }, [workflow, onWorkflowChange, selectedNodeId, onSelectNode]);

  const removeDep = useCallback((taskId: string, depId: string) => {
    if (!onWorkflowChange) return;
    onWorkflowChange({
      ...workflow,
      tasks: workflow.tasks.map(t =>
        t.id === taskId ? { ...t, dependencies: t.dependencies.filter(d => d !== depId) } : t
      ),
    });
  }, [workflow, onWorkflowChange]);

  // Canvas bounds
  const bounds = useMemo(() => {
    let w = 900; let h = 600;
    for (const task of workflow.tasks) {
      const pos = getPos(task.id);
      const cw = task.discussion ? DISC_CARD_W : CARD_W;
      const ch = task.discussion ? DISC_CARD_H : CARD_H;
      if (pos) { w = Math.max(w, pos.x + cw + 100); h = Math.max(h, pos.y + ch + 100); }
    }
    return { width: w, height: h };
  }, [workflow.tasks, getPos]);

  // Build dependency edges (task → task)
  const depEdges = useMemo(() => {
    const edges: Array<{ from: string; to: string }> = [];
    for (const t of workflow.tasks) {
      for (const d of t.dependencies) {
        if (workflow.tasks.some(tt => tt.id === d)) {
          edges.push({ from: d, to: t.id });
        }
      }
    }
    return edges;
  }, [workflow.tasks]);

  return (
    <div
      className="h-full relative overflow-auto bg-[var(--cs-surface-app)]"
      onClick={() => { onSelectNode(null); setContextMenu(null); }}
      onPointerMove={(e) => { handlePointerMove(e); handleConnMove(e); }}
      onPointerUp={(e) => { handlePointerUp(); handleConnUp(e); }}
      onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'canvas' }); }}
    >
      {/* Dot grid background (n8n style) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.08) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* SVG connections layer */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ minWidth: bounds.width, minHeight: bounds.height, overflow: 'visible' }}
      >
        <defs>
          <marker id="n8n-arrow" viewBox="0 0 10 8" refX="9" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 4 L 0 8 z" fill="rgba(148,163,184,0.5)" />
          </marker>
          <marker id="n8n-arrow-hover" viewBox="0 0 10 8" refX="9" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 4 L 0 8 z" fill="#f43f5e" />
          </marker>
          <marker id="n8n-arrow-draw" viewBox="0 0 10 8" refX="9" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 4 L 0 8 z" fill="rgba(139,92,246,0.7)" />
          </marker>
          <marker id="n8n-arrow-active" viewBox="0 0 10 8" refX="9" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 4 L 0 8 z" fill="#22d3ee" />
          </marker>
        </defs>

        {/* Dependency bezier curves */}
        {depEdges.map((edge, i) => {
          const fromPos = getPos(edge.from);
          const toPos = getPos(edge.to);
          if (!fromPos || !toPos) return null;
          const fromTask = workflow.tasks.find(t => t.id === edge.from);
          const toTask = workflow.tasks.find(t => t.id === edge.to);
          const fromW = fromTask?.discussion ? DISC_CARD_W : CARD_W;
          const fromH = fromTask?.discussion ? DISC_CARD_H : CARD_H;
          const toH = toTask?.discussion ? DISC_CARD_H : CARD_H;
          // Ports: right side of from → left side of to
          const x1 = fromPos.x + fromW;
          const y1 = fromPos.y + fromH / 2;
          const x2 = toPos.x;
          const y2 = toPos.y + toH / 2;
          const path = bezierPath(x1, y1, x2, y2);
          return (
            <g key={`dep-${i}`} className="pointer-events-auto group/edge cursor-pointer"
              onClick={(e) => { e.stopPropagation(); removeDep(edge.to, edge.from); }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'edge', edgeKey: `${edge.from}:${edge.to}` }); }}
            >
              {/* Wide transparent hit area */}
              <path d={path} fill="none" stroke="transparent" strokeWidth="14" />
              {/* Visible bezier */}
              <path
                d={path}
                fill="none"
                stroke="rgba(148,163,184,0.25)"
                strokeWidth="2"
                markerEnd="url(#n8n-arrow)"
                className="group-hover/edge:stroke-rose-400/60 transition-colors"
              />
              {/* Delete badge on hover */}
              <g className="opacity-0 group-hover/edge:opacity-100 transition-opacity" transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
                <circle r="10" fill="rgba(244,63,94,0.9)" />
                <text textAnchor="middle" dy="4" fontSize="12" fill="white" fontWeight="700">×</text>
              </g>
            </g>
          );
        })}

        {/* Connection being drawn */}
        {drawingConn && (() => {
          const fromPos = getPos(drawingConn.fromTaskId);
          if (!fromPos) return null;
          const drawFromTask = workflow.tasks.find(t => t.id === drawingConn.fromTaskId);
          const drawFromW = drawFromTask?.discussion ? DISC_CARD_W : CARD_W;
          const drawFromH = drawFromTask?.discussion ? DISC_CARD_H : CARD_H;
          const x1 = fromPos.x + drawFromW;
          const y1 = fromPos.y + drawFromH / 2;
          const path = bezierPath(x1, y1, drawingConn.mouseX, drawingConn.mouseY);
          return (
            <path
              d={path}
              fill="none"
              stroke="rgba(139,92,246,0.6)"
              strokeWidth="2"
              strokeDasharray="8 4"
              markerEnd="url(#n8n-arrow-draw)"
              className="pointer-events-none"
            />
          );
        })()}
      </svg>

      {/* Drawing tooltip */}
      {drawingConn && (
        <div
          className="fixed z-50 px-2 py-1 rounded-md bg-violet-600/90 text-[10px] text-white font-medium pointer-events-none whitespace-nowrap shadow-lg"
          style={{
            left: drawingConn.mouseX + (containerRef.current?.getBoundingClientRect().left ?? 0) - (containerRef.current?.scrollLeft ?? 0) + 14,
            top: drawingConn.mouseY + (containerRef.current?.getBoundingClientRect().top ?? 0) - (containerRef.current?.scrollTop ?? 0) - 10,
          }}
        >
          Drop on a task to connect
        </div>
      )}

      {/* Task card nodes */}
      <div
        ref={containerRef}
        className="relative"
        style={{ minWidth: bounds.width, minHeight: bounds.height }}
      >
        {workflow.tasks.map((task) => {
          const pos = getPos(task.id);
          if (!pos) return null;
          const agent = workflow.agents.find(a => a.id === task.agentId);
          const color = agent?.color ?? '#64748b';
          const isSelected = selectedNodeId === task.id;
          const isDragging = dragging?.taskId === task.id;
          const isDiscussion = !!task.discussion;
          const discEdges = isDiscussion ? (workflow.discussionEdges ?? []).filter(e => e.taskId === task.id) : [];
          const discStatus = discEdges.length > 0 ? discEdges[0]!.status : 'idle';
          const discRounds = discEdges.length > 0 ? Math.max(...discEdges.map(e => e.messages.length > 0 ? e.messages[e.messages.length - 1]!.round : 0)) : 0;
          const discParticipants = isDiscussion ? (task.discussion!.participantIds.map(pid => workflow.agents.find(a => a.id === pid)).filter(Boolean) as AgentNode[]) : [];
          const cardW = isDiscussion ? DISC_CARD_W : CARD_W;
          const cardH = isDiscussion ? DISC_CARD_H : CARD_H;

          return (
            <div
              key={task.id}
              className="absolute group/card"
              style={{
                left: pos.x,
                top: pos.y,
                width: cardW,
                height: cardH,
                zIndex: isDragging ? 50 : isSelected ? 40 : 10,
              }}
            >
              {/* Input port (left) */}
              <div
                className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full border-2 border-[rgba(148,163,184,0.3)] bg-[var(--cs-surface-app)] z-20 opacity-0 group-hover/card:opacity-100 transition-opacity hover:!border-violet-400 hover:!bg-violet-400/20 hover:!scale-150 cursor-pointer"
                title="Input"
              />

              {/* Output port (right) — drag to connect */}
              <div
                className="absolute -right-[5px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full border-2 border-[rgba(148,163,184,0.3)] bg-[var(--cs-surface-app)] z-20 opacity-0 group-hover/card:opacity-100 transition-opacity hover:!border-violet-400 hover:!bg-violet-500 hover:!scale-150 cursor-crosshair"
                onPointerDown={(e) => handlePortDown(e, task.id)}
                title="Drag to connect"
              />

              {/* Drop target highlight */}
              {drawingConn && drawingConn.fromTaskId !== task.id && (
                <div className="absolute -inset-1 rounded-xl border-2 border-dashed border-violet-400/50 bg-violet-500/5 z-5 pointer-events-none animate-pulse" />
              )}

              {/* The card — discussion variant or regular */}
              {isDiscussion ? (
                <div
                  className={`w-full h-full rounded-xl border-2 transition-all duration-150 flex flex-col select-none ${
                    isSelected
                      ? 'border-cyan-400 bg-[var(--cs-surface-card)] shadow-lg shadow-cyan-400/20 ring-1 ring-cyan-400/30'
                      : discStatus === 'active'
                        ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/[0.06] to-violet-500/[0.04] hover:border-cyan-400/60 hover:shadow-md hover:shadow-cyan-500/10'
                        : discStatus === 'converged'
                          ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/[0.05] to-cyan-500/[0.03] hover:border-emerald-400/50 hover:shadow-md'
                          : 'border-[var(--cs-border-subtle)] bg-gradient-to-br from-cyan-500/[0.03] to-[var(--cs-surface-card)]/80 hover:border-[var(--cs-border-default)] hover:shadow-md hover:shadow-black/10'
                  } ${isDragging ? 'shadow-xl scale-[1.02] ring-2 ring-cyan-400/20' : ''}`}
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                  onPointerDown={(e) => handleNodePointerDown(e, task.id)}
                  onClick={(e) => { e.stopPropagation(); if (!dragging) onSelectNode(task.id); }}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'task', taskId: task.id }); }}
                >
                  {/* Top row: chat icon + description + status */}
                  <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-1">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        discStatus === 'active' ? 'bg-cyan-500/15 border border-cyan-400/30' : discStatus === 'converged' ? 'bg-emerald-500/15 border border-emerald-400/30' : 'bg-cyan-500/10 border border-cyan-500/20'
                      }`}
                    >
                      {discStatus === 'converged' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={discStatus === 'active' ? '#22d3ee' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[var(--cs-text-primary)] leading-tight line-clamp-1">
                        {task.discussion!.topic ?? task.description.slice(0, 45) + (task.description.length > 45 ? '…' : '')}
                      </p>
                    </div>
                    {/* Round badge */}
                    <div className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      discStatus === 'converged' ? 'bg-emerald-500/20 text-emerald-400'
                        : discStatus === 'active' ? 'bg-cyan-500/20 text-cyan-300 animate-pulse'
                        : discStatus === 'max-rounds' ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {discStatus === 'converged' ? '✓' : discStatus === 'active' ? `⟳ ${discRounds}` : discRounds > 0 ? `${discRounds}r` : '—'}
                    </div>
                  </div>
                  {/* Bottom row: participant avatars + strategy */}
                  <div className="flex items-center gap-1.5 px-3 pb-2">
                    <div className="flex -space-x-1.5">
                      {discParticipants.slice(0, 4).map((a) => (
                        <div
                          key={a.id}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white border border-[var(--cs-surface-card)]"
                          style={{ backgroundColor: a.color }}
                          title={a.role}
                        >
                          <AgentAvatar id={a.id} size={12} fallback={a.role} />
                        </div>
                      ))}
                    </div>
                    <span className="text-[9px] text-[var(--cs-text-tertiary)] truncate">
                      {discParticipants.map(a => a.role).join(' + ')}
                    </span>
                    <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400/80 font-medium flex-shrink-0">
                      {task.discussion!.convergenceStrategy}
                    </span>
                  </div>
                  {/* Active discussion pulse bar */}
                  {discStatus === 'active' && (
                    <div className="h-[2px] w-full bg-gradient-to-r from-cyan-500/0 via-cyan-400/60 to-cyan-500/0 animate-pulse" />
                  )}
                </div>
              ) : (
                <div
                  className={`w-full h-full rounded-xl border transition-all duration-150 flex items-center gap-3 px-3 select-none ${
                    isSelected
                      ? 'border-violet-500 bg-[var(--cs-surface-card)] shadow-lg shadow-violet-500/20 ring-1 ring-violet-500/30'
                      : 'border-[var(--cs-border-subtle)] bg-[var(--cs-surface-card)]/80 hover:border-[var(--cs-border-default)] hover:shadow-md hover:shadow-black/10'
                  } ${isDragging ? 'shadow-xl scale-[1.02] ring-2 ring-violet-500/20' : ''}`}
                  style={{ borderLeftWidth: 3, borderLeftColor: color, cursor: isDragging ? 'grabbing' : 'grab' }}
                  onPointerDown={(e) => handleNodePointerDown(e, task.id)}
                  onClick={(e) => { e.stopPropagation(); if (!dragging) onSelectNode(task.id); }}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'task', taskId: task.id }); }}
                >
                  {/* Icon / agent avatar */}
                  <div className="relative w-9 h-9 flex-shrink-0">
                    {agent ? (
                      <>
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: agent.color }}
                        >
                          <AgentAvatar id={agent.id} size={18} fallback={agent.role} />
                        </div>
                        {task.status !== 'pending' && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] flex items-center justify-center">
                            {task.status === 'completed' ? (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : task.status === 'running' ? (
                              <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="4" /><path className="opacity-75" fill="#f59e0b" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            ) : (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${color}15`, border: `1.5px solid ${color}30` }}
                      >
                        {task.status === 'completed' ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : task.status === 'running' ? (
                          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke={color} strokeWidth="4" /><path className="opacity-75" fill={color} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0 py-1">
                    <p className="text-[11px] font-semibold text-[var(--cs-text-primary)] leading-tight line-clamp-2">
                      {task.description.length > 50 ? task.description.slice(0, 50) + '…' : task.description}
                    </p>
                    {agent && (
                      <p className="text-[10px] mt-0.5 font-medium truncate" style={{ color }}>
                        {agent.role}
                      </p>
                    )}
                  </div>

                  {/* Status dot */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.status === 'completed' ? 'bg-emerald-400'
                      : task.status === 'running' ? 'bg-amber-400 animate-pulse'
                      : task.status === 'failed' ? 'bg-rose-400'
                      : 'bg-slate-500/40'
                  }`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Minimap / summary badge */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--cs-surface-panel)]/80 backdrop-blur-sm border border-[var(--cs-border-subtle)]">
        <span className="text-[10px] text-[var(--cs-text-tertiary)]">
          {workflow.agents.length} agents
        </span>
        <span className="text-[8px] text-[var(--cs-border-default)]">/</span>
        <span className="text-[10px] text-[var(--cs-text-tertiary)]">
          {workflow.tasks.length} tasks
        </span>
        <span className="text-[8px] text-[var(--cs-border-default)]">/</span>
        <span className="text-[10px] text-[var(--cs-text-tertiary)]">
          {depEdges.length} connections
        </span>
      </div>

      {/* Hint strip */}
      <div className="absolute bottom-4 right-4 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[var(--cs-surface-panel)]/60 backdrop-blur-sm border border-[var(--cs-border-subtle)]">
        <span className="text-[9px] text-[var(--cs-text-tertiary)]"><span className="text-violet-400">Drag</span> cards to move</span>
        <span className="text-[8px] text-[var(--cs-border-default)]">|</span>
        <span className="text-[9px] text-[var(--cs-text-tertiary)]"><span className="text-violet-400">Drag port</span> to connect</span>
        <span className="text-[8px] text-[var(--cs-border-default)]">|</span>
        <span className="text-[9px] text-[var(--cs-text-tertiary)]"><span className="text-rose-400">Click edge</span> to remove</span>
        <span className="text-[8px] text-[var(--cs-border-default)]">|</span>
        <span className="text-[9px] text-[var(--cs-text-tertiary)]"><span className="text-violet-400">Right-click</span> for menu</span>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[180px] rounded-xl border border-[var(--cs-border-default)] bg-[var(--cs-surface-panel)] shadow-2xl overflow-hidden animate-fadeIn"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'canvas' && (
            <>
              {workflow.agents.length > 0 && workflow.agents.map(a => (
                <ContextMenuItem
                  key={a.id}
                  label={`Add task to ${a.role}`}
                  icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>}
                  onClick={() => { addTask(a.id); setContextMenu(null); }}
                />
              ))}
            </>
          )}
          {contextMenu.type === 'task' && contextMenu.taskId && (() => {
            const task = workflow.tasks.find(t => t.id === contextMenu.taskId);
            const agent = task ? workflow.agents.find(a => a.id === task.agentId) : null;
            return (
              <>
                <div className="px-3 py-1.5 text-[10px] text-[var(--cs-text-tertiary)] uppercase tracking-wider font-medium border-b border-[var(--cs-border-subtle)]">
                  {task?.description.slice(0, 30) ?? 'Task'}
                </div>
                {workflow.agents.filter(a => a.id !== task?.agentId).map(a => (
                  <ContextMenuItem
                    key={a.id}
                    label={`Move to ${a.role}`}
                    icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 10 20 15 15 20" /><path d="M4 4v7a4 4 0 004 4h12" /></svg>}
                    onClick={() => {
                      if (onWorkflowChange && task) {
                        onWorkflowChange({ ...workflow, tasks: workflow.tasks.map(t => t.id === task.id ? { ...t, agentId: a.id } : t) });
                      }
                      setContextMenu(null);
                    }}
                  />
                ))}
                <div className="border-t border-[var(--cs-border-subtle)]" />
                <ContextMenuItem
                  label="Delete task"
                  icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>}
                  danger
                  onClick={() => { removeTask(contextMenu.taskId!); setContextMenu(null); }}
                />
              </>
            );
          })()}
          {contextMenu.type === 'edge' && contextMenu.edgeKey && (() => {
            const [from, to] = contextMenu.edgeKey.split(':');
            return (
              <ContextMenuItem
                label="Remove connection"
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
                danger
                onClick={() => { if (from && to) removeDep(to, from); setContextMenu(null); }}
              />
            );
          })()}
        </div>
      )}

      {/* Details panel */}
      {selectedNodeId && !contextMenu && (
        <DetailsPanel
          workflow={workflow}
          nodeId={selectedNodeId}
          onClose={() => onSelectNode(null)}
          onWorkflowChange={onWorkflowChange}
        />
      )}
    </div>
  );
}

/** Context menu item */
function ContextMenuItem({ label, icon, onClick, danger }: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
        danger
          ? 'text-rose-400 hover:bg-rose-500/10'
          : 'text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface-card)]/30 hover:text-[var(--cs-text-primary)]'
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
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
  const completedCount = workflow.tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = workflow.tasks.length;
  const hasResults = workflow.tasks.some((t) => t.output);

  return (
    <div className="h-full overflow-auto bg-[var(--cs-surface-app)] p-6 scrollbar-thin">
      <div className="max-w-3xl mx-auto">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[var(--cs-text-primary)]">Results</h2>
            <p className="text-xs text-[var(--cs-text-tertiary)] mt-0.5">
              {completedCount} of {totalTasks} tasks completed
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-1.5 rounded-full bg-[var(--cs-surface-card)] overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-[var(--cs-text-tertiary)] tabular-nums">
              {totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0}%
            </span>
          </div>
        </div>

        {!hasResults && workflow.status !== 'running' ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--cs-surface-card)]/20 border border-[var(--cs-border-default)] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--cs-text-tertiary)]">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="text-sm text-[var(--cs-text-secondary)]">No results yet</p>
            <p className="text-xs text-[var(--cs-text-tertiary)] mt-1">Run the workflow to see task outputs here</p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {workflow.tasks.map((task, idx) => {
              const agent = workflow.agents.find((a) => a.id === task.agentId);
              return (
                <div
                  key={task.id}
                  className={`rounded-xl border transition-all ${
                    task.status === 'completed'
                      ? 'border-emerald-500/15 bg-emerald-500/[0.02]'
                      : task.status === 'running'
                        ? 'border-amber-500/20 bg-amber-500/[0.02]'
                        : task.status === 'failed'
                          ? 'border-rose-500/15 bg-rose-500/[0.02]'
                          : 'border-[var(--cs-border-subtle)] bg-white/[0.01]'
                  }`}
                >
                  {/* Task header */}
                  <div className="flex items-start gap-3 px-4 py-3">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono flex-shrink-0 mt-0.5 ${
                      task.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : task.status === 'running'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-[var(--cs-surface-card)]/20 text-[var(--cs-text-tertiary)]'
                    }`}>
                      {task.status === 'completed' ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : task.status === 'running' ? (
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      ) : (
                        idx + 1
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--cs-text-primary)] leading-relaxed">{task.description}</p>
                      <div className="flex items-center gap-2 mt-1.5">
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

                  {/* Task output */}
                  {task.output && (
                    <div className="px-4 pb-3 pt-0">
                      <div className="rounded-lg bg-[var(--cs-surface-card)]/30 border border-[var(--cs-border-subtle)] p-3">
                        <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-wrap">{task.output}</p>
                      </div>
                    </div>
                  )}

                  {/* Running state */}
                  {task.status === 'running' && !task.output && (
                    <div className="px-4 pb-3 pt-0">
                      <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3">
                        <p className="text-xs text-amber-400/80 animate-pulse">
                          {agent?.role ?? 'Agent'} is working on this task…
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
        <div className="relative w-8 h-8 flex-shrink-0">
          {agent ? (
            <>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: agent.color }}
              >
                <AgentAvatar id={agent.id} size={18} fallback={agent.role} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] flex items-center justify-center scale-[0.7] origin-bottom-right">
                <TaskStatusIcon status={task.status} />
              </div>
            </>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[var(--cs-surface-card)]/20 flex items-center justify-center">
              <TaskStatusIcon status={task.status} />
            </div>
          )}
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
  onWorkflowChange,
}: {
  workflow: WorkflowState;
  nodeId: string;
  onClose: () => void;
  onWorkflowChange?: ((workflow: WorkflowState) => void) | undefined;
}): React.JSX.Element {
  const agent = workflow.agents.find((a) => a.id === nodeId);
  const task = workflow.tasks.find((t) => t.id === nodeId);
  const canEdit = !!onWorkflowChange;

  // ── Agent field updater ──
  const updateAgent = useCallback((patch: Partial<AgentNode>) => {
    if (!onWorkflowChange || !agent) return;
    onWorkflowChange({
      ...workflow,
      agents: workflow.agents.map((a) => (a.id === agent.id ? { ...a, ...patch } : a)),
    });
  }, [onWorkflowChange, workflow, agent]);

  // ── Task field updater ──
  const updateTask = useCallback((patch: Partial<TaskNode>) => {
    if (!onWorkflowChange || !task) return;
    const updatedTasks = workflow.tasks.map((t) => (t.id === task.id ? { ...t, ...patch } : t));
    // If discussion participantIds changed, rebuild discussion edges for this task
    if (patch.discussion?.participantIds) {
      const newParticipants = patch.discussion.participantIds;
      const otherEdges = (workflow.discussionEdges ?? []).filter(e => e.taskId !== task.id);
      const newEdges: typeof workflow.discussionEdges = [];
      for (let i = 0; i < newParticipants.length; i++) {
        for (let j = i + 1; j < newParticipants.length; j++) {
          newEdges.push({
            id: `edge-${task.id}-${newParticipants[i]}-${newParticipants[j]}`,
            fromAgentId: newParticipants[i]!,
            toAgentId: newParticipants[j]!,
            taskId: task.id,
            status: 'idle',
            messages: [],
          });
        }
      }
      onWorkflowChange({ ...workflow, tasks: updatedTasks, discussionEdges: [...otherEdges, ...newEdges] });
    } else {
      onWorkflowChange({ ...workflow, tasks: updatedTasks });
    }
  }, [onWorkflowChange, workflow, task]);

  const inputClass = 'w-full bg-[var(--cs-surface-card)]/20 border border-[var(--cs-border-subtle)] rounded-lg px-2.5 py-1.5 text-sm text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors';
  const textareaClass = inputClass + ' resize-none';

  return (
    <div className="fixed right-0 top-[49px] bottom-0 w-80 bg-[var(--cs-surface-panel)] border-l border-[var(--cs-border-subtle)] shadow-2xl z-20 overflow-y-auto animate-slideInRight scrollbar-thin" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--cs-border-subtle)]">
        <h3 className="text-sm font-semibold text-[var(--cs-text-primary)]">{agent ? 'Edit Agent' : task ? 'Edit Task' : 'Details'}</h3>
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
              {canEdit ? (
                <input
                  className={inputClass + ' mt-1'}
                  value={agent.role}
                  onChange={(e) => updateAgent({ role: e.target.value })}
                  placeholder="e.g. Research Analyst"
                />
              ) : (
                <p className="text-sm text-[var(--cs-text-primary)] mt-1">{agent.role}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Goal</label>
              {canEdit ? (
                <textarea
                  className={textareaClass + ' mt-1'}
                  rows={2}
                  value={agent.goal}
                  onChange={(e) => updateAgent({ goal: e.target.value })}
                  placeholder="What should this agent accomplish?"
                />
              ) : (
                <p className="text-sm text-[var(--cs-text-secondary)] mt-1">{agent.goal}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Backstory</label>
              {canEdit ? (
                <textarea
                  className={textareaClass + ' mt-1 text-xs'}
                  rows={3}
                  value={agent.backstory}
                  onChange={(e) => updateAgent({ backstory: e.target.value })}
                  placeholder="Describe this agent's expertise and background..."
                />
              ) : (
                <p className="text-xs text-[var(--cs-text-secondary)] mt-1 leading-relaxed">{agent.backstory}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Tools</label>
              {canEdit ? (
                <input
                  className={inputClass + ' mt-1 text-xs'}
                  value={agent.tools.join(', ')}
                  onChange={(e) => updateAgent({ tools: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  placeholder="web-search, file-read, code-exec (comma-separated)"
                />
              ) : (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {agent.tools.map((tool) => (
                    <span key={tool} className="px-2 py-0.5 rounded-md bg-[var(--cs-surface-card)]/20 text-[10px] text-[var(--cs-text-secondary)] border border-[var(--cs-border-subtle)]">
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Color</label>
              <div className="flex gap-1.5 mt-1.5">
                {['#8b5cf6', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#6366f1', '#ec4899', '#14b8a6'].map((c) => (
                  <button
                    key={c}
                    onClick={() => canEdit && updateAgent({ color: c })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      agent.color === c ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
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
                      <span className="text-xs text-[var(--cs-text-secondary)] line-clamp-2 flex-1">{t.description}</span>
                      {canEdit && (
                        <button
                          onClick={() => onWorkflowChange({
                            ...workflow,
                            tasks: workflow.tasks.map((wt) => wt.id === t.id ? { ...wt, agentId: '' } : wt),
                          })}
                          className="p-0.5 rounded hover:bg-rose-500/20 text-[var(--cs-text-tertiary)] hover:text-rose-400 transition-colors flex-shrink-0"
                          title="Unassign task"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      )}
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
              {canEdit ? (
                <textarea
                  className={textareaClass + ' mt-1'}
                  rows={3}
                  value={task.description}
                  onChange={(e) => updateTask({ description: e.target.value })}
                  placeholder="Describe what this task should accomplish..."
                />
              ) : (
                <p className="text-sm text-[var(--cs-text-primary)] mt-1">{task.description}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Assigned Agent</label>
              {canEdit ? (
                <select
                  className={inputClass + ' mt-1'}
                  value={task.agentId}
                  onChange={(e) => updateTask({ agentId: e.target.value })}
                >
                  <option value="">— Unassigned —</option>
                  {workflow.agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.role}</option>
                  ))}
                </select>
              ) : (
                (() => {
                  const a = workflow.agents.find((ag) => ag.id === task.agentId);
                  return a ? (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white"
                        style={{ backgroundColor: `${a.color}30` }}
                      >
                        <AgentAvatar id={a.id} size={14} fallback={a.role} />
                      </div>
                      <span className="text-sm text-[var(--cs-text-secondary)]">{a.role}</span>
                    </div>
                  ) : null;
                })()
              )}
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Expected Output</label>
              {canEdit ? (
                <textarea
                  className={textareaClass + ' mt-1 text-xs'}
                  rows={2}
                  value={task.expectedOutput}
                  onChange={(e) => updateTask({ expectedOutput: e.target.value })}
                  placeholder="What output should the agent produce?"
                />
              ) : (
                <p className="text-xs text-[var(--cs-text-secondary)] mt-1">{task.expectedOutput}</p>
              )}
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
                        <span className="text-xs text-[var(--cs-text-secondary)] line-clamp-2 flex-1">{dep.description}</span>
                        {canEdit && (
                          <button
                            onClick={() => updateTask({ dependencies: task.dependencies.filter((d) => d !== depId) })}
                            className="p-0.5 rounded hover:bg-rose-500/20 text-[var(--cs-text-tertiary)] hover:text-rose-400 transition-colors flex-shrink-0"
                            title="Remove dependency"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </button>
                        )}
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

            {/* ── Discussion configuration & conversation thread ── */}
            {task.discussion && (() => {
              const discEdges = (workflow.discussionEdges ?? []).filter(e => e.taskId === task.id);
              const allMessages = discEdges.flatMap(e => e.messages).sort((a, b) => a.timestamp - b.timestamp);
              const discStatus = discEdges.length > 0 ? discEdges[0]!.status : 'idle';
              const participants = task.discussion.participantIds.map(pid => workflow.agents.find(a => a.id === pid)).filter(Boolean) as AgentNode[];
              return (
                <>
                  {/* Discussion header */}
                  <div className="border-t border-cyan-500/15 pt-3 mt-1">
                    <label className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Discussion
                      <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                        discStatus === 'converged' ? 'bg-emerald-500/20 text-emerald-400'
                          : discStatus === 'active' ? 'bg-cyan-500/20 text-cyan-300'
                          : discStatus === 'max-rounds' ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-500/15 text-slate-400'
                      }`}>
                        {discStatus}
                      </span>
                    </label>
                  </div>

                  {/* Participants */}
                  <div>
                    <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">
                      Participants ({participants.length})
                    </label>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {participants.map(a => (
                        <div key={a.id} className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-[var(--cs-surface-card)]/15 border border-[var(--cs-border-subtle)] group/chip">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: a.color }}>
                            <AgentAvatar id={a.id} size={10} fallback={a.role} />
                          </div>
                          <span className="text-[10px] text-[var(--cs-text-secondary)]">{a.role}</span>
                          {canEdit && participants.length > 2 && (
                            <button
                              className="ml-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[var(--cs-text-tertiary)] hover:text-rose-400 hover:bg-rose-500/15 transition-colors opacity-0 group-hover/chip:opacity-100"
                              title={`Remove ${a.role} from discussion`}
                              onClick={() => {
                                const newIds = task.discussion!.participantIds.filter(pid => pid !== a.id);
                                updateTask({ discussion: { ...task.discussion!, participantIds: newIds } });
                              }}
                            >
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add participant dropdown */}
                    {canEdit && (() => {
                      const available = workflow.agents.filter(a => !task.discussion!.participantIds.includes(a.id));
                      if (available.length === 0) return null;
                      return (
                        <select
                          className="mt-2 w-full bg-[var(--cs-surface-card)]/20 border border-dashed border-cyan-500/30 rounded-lg px-2 py-1.5 text-[10px] text-cyan-400 cursor-pointer hover:border-cyan-400/50 hover:bg-cyan-500/5 transition-colors focus:outline-none focus:border-cyan-400"
                          value=""
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const newIds = [...task.discussion!.participantIds, e.target.value];
                            updateTask({ discussion: { ...task.discussion!, participantIds: newIds } });
                            e.target.value = '';
                          }}
                        >
                          <option value="">+ Add participant…</option>
                          {available.map(a => (
                            <option key={a.id} value={a.id}>{a.role}</option>
                          ))}
                        </select>
                      );
                    })()}

                    {canEdit && participants.length <= 2 && (
                      <p className="text-[9px] text-amber-400/60 mt-1">Minimum 2 participants required</p>
                    )}
                  </div>

                  {/* Settings row */}
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Strategy</label>
                      {canEdit ? (
                        <select
                          className={inputClass + ' mt-1 text-xs'}
                          value={task.discussion.convergenceStrategy}
                          onChange={(e) => updateTask({ discussion: { ...task.discussion!, convergenceStrategy: e.target.value as 'unanimous' | 'majority' | 'llm-judge' | 'stable-output' } })}
                        >
                          <option value="unanimous">Unanimous</option>
                          <option value="majority">Majority</option>
                          <option value="llm-judge">LLM Judge</option>
                          <option value="stable-output">Stable Output</option>
                        </select>
                      ) : (
                        <p className="text-xs text-[var(--cs-text-secondary)] mt-1">{task.discussion.convergenceStrategy}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Max Rounds</label>
                      {canEdit ? (
                        <input
                          type="number"
                          min={1}
                          max={20}
                          className={inputClass + ' mt-1 text-xs w-16'}
                          value={task.discussion.maxRounds}
                          onChange={(e) => updateTask({ discussion: { ...task.discussion!, maxRounds: Math.max(1, parseInt(e.target.value) || 3) } })}
                        />
                      ) : (
                        <p className="text-xs text-[var(--cs-text-secondary)] mt-1">{task.discussion.maxRounds}</p>
                      )}
                    </div>
                  </div>

                  {/* Conversation thread */}
                  {allMessages.length > 0 && (
                    <div>
                      <label className="text-[10px] font-semibold text-[var(--cs-text-tertiary)] uppercase tracking-wider">Conversation ({allMessages.length} messages)</label>
                      <div className="mt-1.5 space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin pr-1">
                        {allMessages.map(msg => {
                          const msgAgent = workflow.agents.find(a => a.id === msg.fromAgentId);
                          const typeColors: Record<string, string> = {
                            proposal: 'bg-violet-500/15 text-violet-400',
                            feedback: 'bg-blue-500/15 text-blue-400',
                            revision: 'bg-amber-500/15 text-amber-400',
                            agreement: 'bg-emerald-500/15 text-emerald-400',
                            disagreement: 'bg-rose-500/15 text-rose-400',
                            question: 'bg-sky-500/15 text-sky-400',
                            answer: 'bg-indigo-500/15 text-indigo-400',
                          };
                          return (
                            <div key={msg.id} className="rounded-lg bg-[var(--cs-surface-card)]/10 border border-[var(--cs-border-subtle)] p-2">
                              <div className="flex items-center gap-1.5 mb-1">
                                <div
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-white flex-shrink-0"
                                  style={{ backgroundColor: msgAgent?.color ?? '#6366f1' }}
                                >
                                  <AgentAvatar id={msgAgent?.id ?? ''} size={10} fallback={msgAgent?.role} />
                                </div>
                                <span className="text-[10px] font-semibold" style={{ color: msgAgent?.color ?? '#a78bfa' }}>
                                  {msgAgent?.role ?? msg.fromAgentId}
                                </span>
                                <span className={`text-[8px] px-1 py-0.5 rounded font-medium ${typeColors[msg.type] ?? 'bg-slate-500/15 text-slate-400'}`}>
                                  {msg.type}
                                </span>
                                <span className="text-[8px] text-[var(--cs-text-tertiary)] ml-auto">R{msg.round}</span>
                              </div>
                              <p className="text-[10px] text-[var(--cs-text-secondary)] leading-relaxed">
                                {msg.content.replace(/^\[(?:AGREE|DISAGREE|REVISE|QUESTION|PROPOSAL)\]\s*/i, '').slice(0, 200)}
                                {msg.content.length > 200 ? '…' : ''}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty discussion state */}
                  {allMessages.length === 0 && discStatus === 'idle' && (
                    <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/10 p-3 text-center">
                      <p className="text-[10px] text-cyan-400/60">Discussion will start when this task is executed</p>
                    </div>
                  )}
                </>
              );
            })()}
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
