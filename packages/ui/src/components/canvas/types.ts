/**
 * Canvas type definitions for the Crewspace workflow canvas.
 * TASK-135: Implement React Flow canvas
 */

/** The four node categories supported by the canvas. */
export type CanvasNodeType = 'agent' | 'task' | 'tool' | 'llm';

/** Runtime status of a canvas node. */
export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'disabled';

/** Data payload attached to every workflow node. */
export interface WorkflowNodeData {
  label: string;
  description?: string;
  nodeType: CanvasNodeType;
  status?: NodeStatus;
  icon?: React.ReactNode;
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
