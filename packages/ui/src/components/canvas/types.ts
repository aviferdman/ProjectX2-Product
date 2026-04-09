/**
 * Canvas type definitions for the Crewspace workflow canvas.
 * TASK-135: Implement React Flow canvas
 * TASK-136: Implement node rendering (agents, tasks, custom styles)
 */

/** The four node categories supported by the canvas. */
export type CanvasNodeType = 'agent' | 'task' | 'tool' | 'llm';

/** Runtime status of a canvas node. */
export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'disabled';

/* ------------------------------------------------------------------ */
/* Type-specific node data                                             */
/* ------------------------------------------------------------------ */

/** Agent-specific data shown in agent nodes. */
export interface AgentNodeMeta {
  model?: string;
  tools?: string[];
  capabilities?: string[];
  maxIterations?: number;
}

/** Task-specific data shown in task nodes. */
export interface TaskNodeMeta {
  inputs?: string[];
  outputs?: string[];
  progress?: number;
  expectedOutput?: string;
}

/** Tool-specific data shown in tool nodes. */
export interface ToolNodeMeta {
  parameters?: Array<{ name: string; type: string }>;
  executionCount?: number;
  avgDuration?: string;
}

/** LLM-specific data shown in LLM provider nodes. */
export interface LLMNodeMeta {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tokenUsage?: { input: number; output: number };
}

/** Custom style overrides for a node. */
export interface NodeStyleOverrides {
  backgroundColor?: string;
  borderColor?: string;
  iconColor?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

/** Data payload attached to every workflow node. */
export interface WorkflowNodeData {
  label: string;
  description?: string;
  nodeType: CanvasNodeType;
  status?: NodeStatus;
  icon?: React.ReactNode;
  /** Type-specific metadata */
  agentMeta?: AgentNodeMeta;
  taskMeta?: TaskNodeMeta;
  toolMeta?: ToolNodeMeta;
  llmMeta?: LLMNodeMeta;
  /** Custom style overrides */
  styleOverrides?: NodeStyleOverrides;
}

/** Edge visual variants. */
export type EdgeVariant = 'default' | 'active' | 'dataFlow' | 'error';

/** Data payload attached to workflow edges. */
export interface WorkflowEdgeData {
  variant?: EdgeVariant;
  label?: string;
  animated?: boolean;
}

/** Props shared by all custom node components. */
export interface BaseNodeProps {
  id: string;
  data: WorkflowNodeData;
  selected?: boolean;
}

/** Z-index stacking context (addresses TASK-132 gap). */
export const Z_INDEX = {
  canvas: 0,
  edge: 1,
  node: 2,
  nodeSelected: 3,
  handle: 4,
  toolbar: 10,
  sidebar: 10,
  properties: 10,
  minimap: 5,
  overlay: 50,
  modal: 100,
} as const;

/** Canvas viewport configuration from design tokens. */
export const CANVAS_CONFIG = {
  minZoom: 0.1,
  maxZoom: 2.0,
  defaultZoom: 1.0,
  zoomStep: 0.1,
  snapGrid: [10, 10] as [number, number],
  gridSize: 20,
} as const;
