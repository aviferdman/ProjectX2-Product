/**
 * WorkflowDiagram — TASK-160
 *
 * Read-only SVG workflow diagram that visualizes agents and tasks as
 * connected nodes. Used inside the TemplatePreviewModal.
 */
import React, { forwardRef, useMemo } from 'react';
import { clsx } from 'clsx';

/* ------------------------------------------------------------------ */
/* Public types                                                        */
/* ------------------------------------------------------------------ */

export interface WorkflowDiagramNode {
  id: string;
  label: string;
  type: 'agent' | 'task';
}

export interface WorkflowDiagramEdge {
  from: string;
  to: string;
}

export interface WorkflowDiagramProps
  extends Omit<React.SVGAttributes<SVGSVGElement>, 'children'> {
  nodes: WorkflowDiagramNode[];
  edges: WorkflowDiagramEdge[];
}

/* ------------------------------------------------------------------ */
/* Layout constants                                                    */
/* ------------------------------------------------------------------ */

const NODE_W = 140;
const NODE_H = 44;
const GAP_X = 60;
const GAP_Y = 28;
const PAD_X = 24;
const PAD_Y = 24;
const RADIUS = 8;

/* ------------------------------------------------------------------ */
/* Colour palette per node type                                        */
/* ------------------------------------------------------------------ */

const NODE_STYLES: Record<
  WorkflowDiagramNode['type'],
  { fill: string; stroke: string; textFill: string }
> = {
  agent: { fill: '#312e81', stroke: '#6366f1', textFill: '#c7d2fe' },
  task: { fill: '#1e3a5f', stroke: '#38bdf8', textFill: '#bae6fd' },
};

/* ------------------------------------------------------------------ */
/* Internal layout helpers                                             */
/* ------------------------------------------------------------------ */

interface PositionedNode extends WorkflowDiagramNode {
  x: number;
  y: number;
}

function layoutNodes(
  nodes: WorkflowDiagramNode[],
  edges: WorkflowDiagramEdge[],
): { positioned: PositionedNode[]; width: number; height: number } {
  if (nodes.length === 0) {
    return { positioned: [], width: PAD_X * 2, height: PAD_Y * 2 };
  }

  // Separate agents and tasks into columns for a simple left-to-right layout.
  // Agents with outgoing edges go in the first column, tasks in the second.
  const hasOutgoing = new Set(edges.map((e) => e.from));
  const hasIncoming = new Set(edges.map((e) => e.to));

  // Bucket: column 0 = source-only or agent, column 1 = rest
  const col0: WorkflowDiagramNode[] = [];
  const col1: WorkflowDiagramNode[] = [];

  for (const node of nodes) {
    if (
      node.type === 'agent' ||
      (hasOutgoing.has(node.id) && !hasIncoming.has(node.id))
    ) {
      col0.push(node);
    } else {
      col1.push(node);
    }
  }

  // If everything ended up in col0, just arrange in a single column
  if (col1.length === 0 && col0.length > 0) {
    const positioned: PositionedNode[] = col0.map((n, i) => ({
      ...n,
      x: PAD_X,
      y: PAD_Y + i * (NODE_H + GAP_Y),
    }));
    return {
      positioned,
      width: PAD_X * 2 + NODE_W,
      height: PAD_Y * 2 + col0.length * NODE_H + (col0.length - 1) * GAP_Y,
    };
  }

  const maxRows = Math.max(col0.length, col1.length, 1);

  const position = (col: WorkflowDiagramNode[], colIndex: number): PositionedNode[] => {
    const colOffset = PAD_X + colIndex * (NODE_W + GAP_X);
    const verticalOffset =
      PAD_Y + ((maxRows - col.length) * (NODE_H + GAP_Y)) / 2;
    return col.map((n, i) => ({
      ...n,
      x: colOffset,
      y: verticalOffset + i * (NODE_H + GAP_Y),
    }));
  };

  const positioned = [...position(col0, 0), ...position(col1, 1)];
  const cols = col1.length > 0 ? 2 : 1;
  const width = PAD_X * 2 + cols * NODE_W + (cols - 1) * GAP_X;
  const height = PAD_Y * 2 + maxRows * NODE_H + (maxRows - 1) * GAP_Y;

  return { positioned, width, height };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const WorkflowDiagram = forwardRef<SVGSVGElement, WorkflowDiagramProps>(
  function WorkflowDiagram({ nodes, edges, className, ...props }, ref) {
    const { positioned, width, height } = useMemo(
      () => layoutNodes(nodes, edges),
      [nodes, edges],
    );

    const posMap = useMemo(() => {
      const m = new Map<string, PositionedNode>();
      for (const n of positioned) m.set(n.id, n);
      return m;
    }, [positioned]);

    if (nodes.length === 0) {
      return (
        <div
          className={clsx(
            'flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 p-8',
            className,
          )}
          role="img"
          aria-label="Empty workflow diagram"
        >
          <span className="text-sm text-slate-500">No workflow steps defined</span>
        </div>
      );
    }

    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${width} ${height}`}
        className={clsx('w-full', className)}
        role="img"
        aria-label="Workflow diagram"
        {...props}
      >
        {/* Edges */}
        {edges.map((edge) => {
          const from = posMap.get(edge.from);
          const to = posMap.get(edge.to);
          if (!from || !to) return null;

          const x1 = from.x + NODE_W;
          const y1 = from.y + NODE_H / 2;
          const x2 = to.x;
          const y2 = to.y + NODE_H / 2;
          const cx = (x1 + x2) / 2;

          return (
            <path
              key={`${edge.from}-${edge.to}`}
              d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
              fill="none"
              stroke="#475569"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
              data-testid={`edge-${edge.from}-${edge.to}`}
            />
          );
        })}

        {/* Arrow marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#475569" />
          </marker>
        </defs>

        {/* Nodes */}
        {positioned.map((node) => {
          const style = NODE_STYLES[node.type];
          return (
            <g key={node.id} data-testid={`node-${node.id}`}>
              <rect
                x={node.x}
                y={node.y}
                width={NODE_W}
                height={NODE_H}
                rx={RADIUS}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth="1.5"
              />
              <text
                x={node.x + NODE_W / 2}
                y={node.y + NODE_H / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill={style.textFill}
                fontSize="12"
                fontWeight="500"
              >
                {node.label.length > 16
                  ? `${node.label.slice(0, 15)}…`
                  : node.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  },
);
