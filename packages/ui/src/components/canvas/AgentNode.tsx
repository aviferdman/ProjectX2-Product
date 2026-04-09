/**
 * AgentNode — Specialized canvas node for agent entities.
 * TASK-136: Implement node rendering (agents, tasks, custom styles)
 *
 * Displays agent-specific metadata: model, tools list, capabilities.
 */
import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from './types.js';
import { NodeShell } from './NodeShell.js';

function AgentNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  const meta = nodeData.agentMeta;

  return (
    <NodeShell
      nodeType="agent"
      label={nodeData.label}
      status={nodeData.status}
      selected={selected}
      icon={nodeData.icon}
      description={nodeData.description}
      styleOverrides={nodeData.styleOverrides}
      footer={
        meta?.capabilities && meta.capabilities.length > 0 ? (
          <span data-testid="agent-capabilities-count">
            {meta.capabilities.length} {meta.capabilities.length === 1 ? 'capability' : 'capabilities'}
          </span>
        ) : undefined
      }
    >
      {meta && (
        <div className="space-y-1.5 text-node-body">
          {meta.model && (
            <div className="flex items-center gap-1.5" data-testid="agent-model">
              <span className="text-text-tertiary">Model:</span>
              <span className="text-text-secondary font-mono text-[11px]">{meta.model}</span>
            </div>
          )}
          {meta.tools && meta.tools.length > 0 && (
            <div data-testid="agent-tools">
              <span className="text-text-tertiary">Tools:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {meta.tools.map((tool) => (
                  <span
                    key={tool}
                    className="inline-block px-1.5 py-0.5 rounded bg-surface-elevated/50 text-text-secondary text-[10px]"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}
          {meta.maxIterations != null && (
            <div className="flex items-center gap-1.5" data-testid="agent-iterations">
              <span className="text-text-tertiary">Max iter:</span>
              <span className="text-text-secondary">{meta.maxIterations}</span>
            </div>
          )}
        </div>
      )}
    </NodeShell>
  );
}

export const AgentNode = memo(AgentNodeComponent);
AgentNode.displayName = 'AgentNode';
