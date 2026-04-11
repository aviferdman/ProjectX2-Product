/**
 * Minimap overlay for the canvas viewport.
 * TASK-135: Implement React Flow canvas
 */
import { MiniMap, type MiniMapProps } from '@xyflow/react';
import { clsx } from 'clsx';
import { Z_INDEX } from './types.js';
import type { WorkflowNodeData, CanvasNodeType } from './types.js';

const nodeColorMap: Record<CanvasNodeType, string> = {
  agent: '#6366f1',
  task: '#0891b2',
  tool: '#059669',
  llm: '#d97706',
};

function nodeColor(node: { data?: Record<string, unknown> }): string {
  const data = node.data as WorkflowNodeData | undefined;
  const nt = data?.nodeType ?? 'task';
  return nodeColorMap[nt] ?? '#52525b';
}

export type CanvasMinimapProps = Omit<MiniMapProps, 'className'> & {
  className?: string;
};

export function CanvasMinimap({ className, ...rest }: CanvasMinimapProps) {
  return (
    <MiniMap
      className={clsx('cs-canvas-minimap', className)}
      nodeColor={nodeColor}
      maskColor="rgba(15,23,42,0.9)"
      style={{
        zIndex: Z_INDEX.minimap,
        width: 200,
        height: 140,
        borderRadius: 8,
        opacity: 0.85,
      }}
      {...rest}
    />
  );
}

CanvasMinimap.displayName = 'CanvasMinimap';
