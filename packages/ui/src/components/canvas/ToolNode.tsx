/**
 * ToolNode — Specialized canvas node for tool entities.
 * TASK-136: Implement node rendering (agents, tasks, custom styles)
 *
 * Displays tool-specific metadata: parameters, execution count, avg duration.
 */
import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from './types.js';
import { NodeShell } from './NodeShell.js';

function ToolNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  const meta = nodeData.toolMeta;

  return (
    <NodeShell
      nodeType="tool"
      label={nodeData.label}
      status={nodeData.status}
      selected={selected}
      icon={nodeData.icon}
      description={nodeData.description}
      styleOverrides={nodeData.styleOverrides}
      footer={
        meta ? (
          <div className="flex items-center gap-3 w-full" data-testid="tool-footer-stats">
            {meta.executionCount != null && (
              <span>
                <span className="text-text-tertiary">Runs:</span>{' '}
                <span className="text-text-secondary">{meta.executionCount}</span>
              </span>
            )}
            {meta.avgDuration && (
              <span>
                <span className="text-text-tertiary">Avg:</span>{' '}
                <span className="text-text-secondary">{meta.avgDuration}</span>
              </span>
            )}
          </div>
        ) : undefined
      }
    >
      {meta?.parameters && meta.parameters.length > 0 && (
        <div className="space-y-1 text-node-body" data-testid="tool-parameters">
          <span className="text-text-tertiary text-[10px]">Parameters:</span>
          <div className="space-y-0.5">
            {meta.parameters.map((param) => (
              <div key={param.name} className="flex items-center gap-1.5">
                <span className="text-text-secondary font-mono text-[10px]">{param.name}</span>
                <span className="text-text-tertiary text-[10px]">: {param.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </NodeShell>
  );
}

export const ToolNode = memo(ToolNodeComponent);
ToolNode.displayName = 'ToolNode';
