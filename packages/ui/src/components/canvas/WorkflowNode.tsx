/**
 * Custom node component for the Crewspace workflow canvas.
 * TASK-135: Implement React Flow canvas
 * TASK-136: Implement node rendering (agents, tasks, custom styles)
 *
 * Acts as a router: delegates to the appropriate specialized node
 * component (AgentNode, TaskNode, ToolNode, LLMNode) based on
 * nodeType, falling back to a generic NodeShell.
 */
import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from './types.js';
import { NodeShell } from './NodeShell.js';
import { AgentNode } from './AgentNode.js';
import { TaskNode } from './TaskNode.js';
import { ToolNode } from './ToolNode.js';
import { LLMNode } from './LLMNode.js';

/* ------------------------------------------------------------------ */
/* Route to specialized components when type-specific meta is present  */
/* ------------------------------------------------------------------ */
function WorkflowNodeComponent(props: NodeProps) {
  const nodeData = props.data as unknown as WorkflowNodeData;
  const nodeType = nodeData.nodeType ?? 'task';

  switch (nodeType) {
    case 'agent':
      return <AgentNode {...props} />;
    case 'task':
      return <TaskNode {...props} />;
    case 'tool':
      return <ToolNode {...props} />;
    case 'llm':
      return <LLMNode {...props} />;
    default:
      return (
        <NodeShell
          nodeType={nodeType}
          label={nodeData.label}
          status={nodeData.status}
          selected={props.selected}
          icon={nodeData.icon}
          description={nodeData.description}
          styleOverrides={nodeData.styleOverrides}
        />
      );
  }
}

export const WorkflowNode = memo(WorkflowNodeComponent);
WorkflowNode.displayName = 'WorkflowNode';
