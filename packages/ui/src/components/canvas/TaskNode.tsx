/**
 * TaskNode — Specialized canvas node for task entities.
 * TASK-136: Implement node rendering (agents, tasks, custom styles)
 *
 * Displays task-specific metadata: inputs, outputs, progress bar.
 */
import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from './types.js';
import { NodeShell } from './NodeShell.js';

function TaskNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  const meta = nodeData.taskMeta;

  return (
    <NodeShell
      nodeType="task"
      label={nodeData.label}
      status={nodeData.status}
      selected={selected}
      icon={nodeData.icon}
      description={nodeData.description}
      styleOverrides={nodeData.styleOverrides}
      footer={
        meta?.expectedOutput ? (
          <span data-testid="task-expected-output" className="truncate" title={meta.expectedOutput}>
            → {meta.expectedOutput}
          </span>
        ) : undefined
      }
    >
      {meta && (
        <div className="space-y-1.5 text-node-body">
          {/* Progress bar */}
          {meta.progress != null && (
            <div data-testid="task-progress">
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-text-tertiary">Progress</span>
                <span className="text-text-secondary">{Math.round(meta.progress)}%</span>
              </div>
              <div className="h-1 rounded-full bg-surface-elevated overflow-hidden">
                <div
                  className="h-full rounded-full bg-status-info transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, meta.progress))}%` }}
                  role="progressbar"
                  aria-valuenow={meta.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}

          {/* Inputs */}
          {meta.inputs && meta.inputs.length > 0 && (
            <div data-testid="task-inputs">
              <span className="text-text-tertiary text-[10px]">Inputs:</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {meta.inputs.map((input) => (
                  <span
                    key={input}
                    className="inline-block px-1.5 py-0.5 rounded bg-surface-elevated/50 text-text-secondary text-[10px]"
                  >
                    {input}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Outputs */}
          {meta.outputs && meta.outputs.length > 0 && (
            <div data-testid="task-outputs">
              <span className="text-text-tertiary text-[10px]">Outputs:</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {meta.outputs.map((output) => (
                  <span
                    key={output}
                    className="inline-block px-1.5 py-0.5 rounded bg-surface-elevated/50 text-text-secondary text-[10px]"
                  >
                    {output}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </NodeShell>
  );
}

export const TaskNode = memo(TaskNodeComponent);
TaskNode.displayName = 'TaskNode';
