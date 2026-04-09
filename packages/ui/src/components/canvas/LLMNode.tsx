/**
 * LLMNode — Specialized canvas node for LLM provider entities.
 * TASK-136: Implement node rendering (agents, tasks, custom styles)
 *
 * Displays LLM-specific metadata: provider, model, temperature, token usage.
 */
import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from './types.js';
import { NodeShell } from './NodeShell.js';

function formatTokenCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function LLMNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  const meta = nodeData.llmMeta;

  return (
    <NodeShell
      nodeType="llm"
      label={nodeData.label}
      status={nodeData.status}
      selected={selected}
      icon={nodeData.icon}
      description={nodeData.description}
      styleOverrides={nodeData.styleOverrides}
      footer={
        meta?.tokenUsage ? (
          <div className="flex items-center gap-3 w-full" data-testid="llm-token-usage">
            <span>
              <span className="text-text-tertiary">In:</span>{' '}
              <span className="text-text-secondary">{formatTokenCount(meta.tokenUsage.input)}</span>
            </span>
            <span>
              <span className="text-text-tertiary">Out:</span>{' '}
              <span className="text-text-secondary">{formatTokenCount(meta.tokenUsage.output)}</span>
            </span>
          </div>
        ) : undefined
      }
    >
      {meta && (
        <div className="space-y-1.5 text-node-body">
          {meta.provider && (
            <div className="flex items-center gap-1.5" data-testid="llm-provider">
              <span className="text-text-tertiary">Provider:</span>
              <span className="text-text-secondary">{meta.provider}</span>
            </div>
          )}
          {meta.model && (
            <div className="flex items-center gap-1.5" data-testid="llm-model">
              <span className="text-text-tertiary">Model:</span>
              <span className="text-text-secondary font-mono text-[11px]">{meta.model}</span>
            </div>
          )}
          {meta.temperature != null && (
            <div className="flex items-center gap-1.5" data-testid="llm-temperature">
              <span className="text-text-tertiary">Temp:</span>
              <span className="text-text-secondary">{meta.temperature}</span>
            </div>
          )}
          {meta.maxTokens != null && (
            <div className="flex items-center gap-1.5" data-testid="llm-max-tokens">
              <span className="text-text-tertiary">Max tokens:</span>
              <span className="text-text-secondary">{formatTokenCount(meta.maxTokens)}</span>
            </div>
          )}
        </div>
      )}
    </NodeShell>
  );
}

export const LLMNode = memo(LLMNodeComponent);
LLMNode.displayName = 'LLMNode';
