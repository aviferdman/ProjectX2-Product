/**
 * WorkflowCanvas — Main canvas component for the Crewspace visual editor.
 * TASK-135: Implement React Flow canvas (drag-and-drop, pan, zoom)
 *
 * Provides:
 * - React Flow canvas with dotted-grid background
 * - Custom node types (agent, task, tool, llm) with design-token styling
 * - Custom smoothstep edge type with animated data flow
 * - Pan, zoom, drag-and-drop, multi-select, snap-to-grid
 * - Minimap and zoom controls
 * - Drop handler for adding new nodes from external drag sources
 */
import {
  useCallback,
  useMemo,
  type DragEvent,
} from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  type OnConnect,
  type ReactFlowProps,
  type NodeChange,
  type EdgeChange,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { clsx } from 'clsx';

import { WorkflowNode } from './WorkflowNode.js';
import { WorkflowEdge } from './WorkflowEdge.js';
import { CanvasBackground } from './CanvasBackground.js';
import { CanvasControls } from './CanvasControls.js';
import { CanvasMinimap } from './CanvasMinimap.js';
import { CANVAS_CONFIG, Z_INDEX, type CanvasNodeType, type WorkflowNodeData } from './types.js';

/* ------------------------------------------------------------------ */
/* Custom node / edge type registrations                               */
/* ------------------------------------------------------------------ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, any> = { workflow: WorkflowNode };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const edgeTypes: Record<string, any> = { workflow: WorkflowEdge };

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
export interface WorkflowCanvasProps {
  /** Initial nodes to render. */
  initialNodes?: Node[];
  /** Initial edges to render. */
  initialEdges?: Edge[];
  /** Callback when nodes change (add, remove, position). */
  onNodesChange?: ReactFlowProps['onNodesChange'];
  /** Callback when edges change (add, remove). */
  onEdgesChange?: ReactFlowProps['onEdgesChange'];
  /** Callback when a new connection is made. */
  onConnect?: OnConnect;
  /** Callback when a node is dropped from an external drag source. */
  onDropNode?: (nodeType: CanvasNodeType, position: { x: number; y: number }) => void;
  /** Show minimap overlay. */
  showMinimap?: boolean;
  /** Show zoom / fit-view controls. */
  showControls?: boolean;
  /** Additional class names on the root container. */
  className?: string;
  /** Read-only mode (no editing). */
  readOnly?: boolean;
}

/* ------------------------------------------------------------------ */
/* Inner component (must be inside ReactFlowProvider)                   */
/* ------------------------------------------------------------------ */
function WorkflowCanvasInner({
  initialNodes = [],
  initialEdges = [],
  onNodesChange: externalOnNodesChange,
  onEdgesChange: externalOnEdgesChange,
  onConnect: externalOnConnect,
  onDropNode,
  showMinimap = true,
  showControls = true,
  className,
  readOnly = false,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  /* Merge external change handlers */
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      externalOnNodesChange?.(changes);
    },
    [onNodesChange, externalOnNodesChange],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      externalOnEdgesChange?.(changes);
    },
    [onEdgesChange, externalOnEdgesChange],
  );

  /* Connect handler — creates workflow-typed edges */
  const handleConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}`,
        type: 'workflow',
        data: { variant: 'default' },
      } as Edge;
      setEdges((eds) => addEdge(edge, eds));
      externalOnConnect?.(connection);
    },
    [setEdges, externalOnConnect],
  );

  /* Drag & drop — accept external nodes */
  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const rawType = event.dataTransfer.getData('application/crewspace-node-type');
      if (!rawType) return;

      const nodeType = rawType as CanvasNodeType;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (onDropNode) {
        onDropNode(nodeType, position);
        return;
      }

      /* Default: create a new node */
      const id = `${nodeType}-${Date.now()}`;
      const newNode: Node = {
        id,
        type: 'workflow',
        position,
        data: {
          label: `New ${nodeType}`,
          nodeType,
          status: 'idle',
        } satisfies WorkflowNodeData,
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, onDropNode, setNodes],
  );

  /* Default edge options */
  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'workflow' as const,
      data: { variant: 'default' },
    }),
    [],
  );

  return (
    <div
      className={clsx('cs-canvas relative w-full h-full', className)}
      style={{ background: 'var(--canvas-bg, #0c0c14)', zIndex: Z_INDEX.canvas }}
      data-testid="workflow-canvas"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        snapToGrid
        snapGrid={CANVAS_CONFIG.snapGrid}
        minZoom={CANVAS_CONFIG.minZoom}
        maxZoom={CANVAS_CONFIG.maxZoom}
        defaultViewport={{ x: 0, y: 0, zoom: CANVAS_CONFIG.defaultZoom }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        panOnScroll
        selectionOnDrag
        proOptions={{ hideAttribution: true }}
      >
        <CanvasBackground />
        {showControls && <CanvasControls />}
        {showMinimap && <CanvasMinimap />}
      </ReactFlow>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Public component (wraps with provider)                              */
/* ------------------------------------------------------------------ */
export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

WorkflowCanvas.displayName = 'WorkflowCanvas';
