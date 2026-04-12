/**
 * Custom edge component for the Crewspace workflow canvas.
 * TASK-135: Implement React Flow canvas
 *
 * Renders smoothstep edges with variant-driven colors and optional
 * animated dash patterns for active data-flow visualization.
 */
import { memo } from 'react';
import { BaseEdge, getSmoothStepPath, type EdgeProps, EdgeLabelRenderer } from '@xyflow/react';
import { clsx } from 'clsx';
import type { WorkflowEdgeData } from './types.js';

const variantColors: Record<string, string> = {
  default: 'var(--edge-default, #52525b)',
  active: 'var(--edge-active, #818cf8)',
  dataFlow: 'var(--edge-data-flow, #22d3ee)',
  error: 'var(--edge-error, #f87171)',
};

function WorkflowEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps) {
  const edgeData = (data ?? {}) as WorkflowEdgeData;
  const variant = edgeData.variant ?? 'default';
  const isAnimated = edgeData.animated ?? (variant === 'dataFlow' || variant === 'active');

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const strokeColor = variantColors[variant] ?? variantColors['default'];

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        {...(markerEnd ? { markerEnd } : {})}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: isAnimated ? '5 5' : undefined,
          animation: isAnimated ? 'cs-edge-flow 1s linear infinite' : undefined,
          transition: 'stroke-width 150ms ease-out',
        }}
      />

      {edgeData.label && (
        <EdgeLabelRenderer>
          <div
            className={clsx(
              'absolute px-1.5 py-0.5 rounded text-[10px] font-medium',
              'bg-surface-panel/90 text-text-secondary border border-border-subtle',
              'pointer-events-none',
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {edgeData.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const WorkflowEdge = memo(WorkflowEdgeComponent);
WorkflowEdge.displayName = 'WorkflowEdge';
