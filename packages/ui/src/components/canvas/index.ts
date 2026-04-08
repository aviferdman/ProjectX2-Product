/**
 * Canvas barrel export.
 * TASK-135: Implement React Flow canvas
 */
export { WorkflowCanvas, type WorkflowCanvasProps } from './WorkflowCanvas.js';
export { WorkflowNode } from './WorkflowNode.js';
export { WorkflowEdge } from './WorkflowEdge.js';
export { CanvasBackground, type CanvasBackgroundProps } from './CanvasBackground.js';
export { CanvasControls, type CanvasControlsProps } from './CanvasControls.js';
export { CanvasMinimap, type CanvasMinimapProps } from './CanvasMinimap.js';
export {
  type CanvasNodeType,
  type NodeStatus,
  type WorkflowNodeData,
  type EdgeVariant,
  type WorkflowEdgeData,
  type BaseNodeProps,
  Z_INDEX,
  CANVAS_CONFIG,
} from './types.js';
