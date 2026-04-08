/**
 * Tests for the WorkflowCanvas and its sub-components.
 * TASK-135: Implement React Flow canvas
 *
 * React Flow requires browser APIs (ResizeObserver, DOM measurements) that
 * jsdom doesn't provide. We mock @xyflow/react at the module level and test
 * our component logic, prop-passing, and type exports directly.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

/* ------------------------------------------------------------------ */
/* Mock @xyflow/react                                                  */
/* ------------------------------------------------------------------ */
const mockOnNodesChange = vi.fn();
const mockOnEdgesChange = vi.fn();
const mockScreenToFlowPosition = vi.fn().mockReturnValue({ x: 100, y: 200 });

vi.mock('@xyflow/react', () => {
  const actual = {
    Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
    BackgroundVariant: { Dots: 'dots', Lines: 'lines', Cross: 'cross' },
  };

  return {
    ...actual,
    ReactFlow: ({ children, nodes, edges, ...props }: any) => (
      <div data-testid="mock-react-flow" data-node-count={nodes?.length ?? 0} data-edge-count={edges?.length ?? 0} data-snap-to-grid={props.snapToGrid} data-min-zoom={props.minZoom} data-max-zoom={props.maxZoom} data-nodes-draggable={props.nodesDraggable}>
        {/* Render custom nodes to test WorkflowNode */}
        {nodes?.map((node: any) => {
          const NodeComponent = props.nodeTypes?.[node.type];
          return NodeComponent ? (
            <div key={node.id} data-testid={`node-wrapper-${node.id}`}>
              <NodeComponent id={node.id} data={node.data} selected={node.selected} />
            </div>
          ) : null;
        })}
        {children}
      </div>
    ),
    ReactFlowProvider: ({ children }: any) => <div data-testid="rf-provider">{children}</div>,
    useNodesState: (initial: any) => [initial, vi.fn(), mockOnNodesChange],
    useEdgesState: (initial: any) => [initial, vi.fn(), mockOnEdgesChange],
    useReactFlow: () => ({ screenToFlowPosition: mockScreenToFlowPosition }),
    addEdge: (edge: any, edges: any[]) => [...edges, edge],
    Handle: ({ type, position }: any) => <div data-testid={`handle-${type}-${position}`} />,
    BaseEdge: ({ id, path }: any) => <path data-testid={`edge-${id}`} d={path} />,
    getSmoothStepPath: () => ['M0 0 L100 100', 50, 50],
    EdgeLabelRenderer: ({ children }: any) => <div>{children}</div>,
    Background: ({ variant, gap, size }: any) => (
      <div data-testid="mock-background" data-variant={variant} data-gap={gap} data-size={size} />
    ),
    Controls: ({ className }: any) => <div data-testid="mock-controls" className={className} />,
    MiniMap: ({ className, nodeColor }: any) => (
      <div data-testid="mock-minimap" className={className} />
    ),
  };
});

/* ------------------------------------------------------------------ */
/* Import components AFTER mock                                        */
/* ------------------------------------------------------------------ */
import {
  WorkflowCanvas,
  type WorkflowCanvasProps,
} from '../src/components/canvas/WorkflowCanvas.js';
import {
  Z_INDEX,
  CANVAS_CONFIG,
  type WorkflowNodeData,
  type CanvasNodeType,
  type NodeStatus,
  type EdgeVariant,
} from '../src/components/canvas/types.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
interface TestNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: WorkflowNodeData;
  selected?: boolean;
}

interface TestEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data: { variant: string };
}

function makeNode(
  id: string,
  nodeType: CanvasNodeType = 'agent',
  overrides: Partial<TestNode> = {},
): TestNode {
  return {
    id,
    type: 'workflow',
    position: { x: 0, y: 0 },
    data: {
      label: `${nodeType}-${id}`,
      nodeType,
      status: 'idle',
    },
    ...overrides,
  };
}

function makeEdge(id: string, source: string, target: string): TestEdge {
  return {
    id,
    source,
    target,
    type: 'workflow',
    data: { variant: 'default' },
  };
}

function renderCanvas(props: Partial<WorkflowCanvasProps> = {}) {
  return render(
    <div style={{ width: 800, height: 600 }}>
      <WorkflowCanvas {...(props as any)} />
    </div>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

/* ------------------------------------------------------------------ */
/* Canvas rendering                                                    */
/* ------------------------------------------------------------------ */
describe('WorkflowCanvas', () => {
  it('renders the canvas root with correct testid', () => {
    renderCanvas();
    expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
  });

  it('applies the cs-canvas class', () => {
    renderCanvas();
    const canvas = screen.getByTestId('workflow-canvas');
    expect(canvas.className).toContain('cs-canvas');
  });

  it('merges custom className', () => {
    renderCanvas({ className: 'my-custom' });
    const canvas = screen.getByTestId('workflow-canvas');
    expect(canvas.className).toContain('my-custom');
  });

  it('passes nodes to ReactFlow', () => {
    const nodes = [makeNode('a1', 'agent'), makeNode('t1', 'task')];
    renderCanvas({ initialNodes: nodes as any });
    const rf = screen.getByTestId('mock-react-flow');
    expect(rf.getAttribute('data-node-count')).toBe('2');
  });

  it('passes edges to ReactFlow', () => {
    const nodes = [makeNode('s', 'agent'), makeNode('t', 'task')];
    const edges = [makeEdge('e1', 's', 't')];
    renderCanvas({ initialNodes: nodes as any, initialEdges: edges as any });
    const rf = screen.getByTestId('mock-react-flow');
    expect(rf.getAttribute('data-edge-count')).toBe('1');
  });

  it('enables snap-to-grid', () => {
    renderCanvas();
    const rf = screen.getByTestId('mock-react-flow');
    expect(rf.getAttribute('data-snap-to-grid')).toBe('true');
  });

  it('sets min/max zoom from config', () => {
    renderCanvas();
    const rf = screen.getByTestId('mock-react-flow');
    expect(rf.getAttribute('data-min-zoom')).toBe('0.1');
    expect(rf.getAttribute('data-max-zoom')).toBe('2');
  });

  it('disables dragging in readOnly mode', () => {
    renderCanvas({ readOnly: true });
    const rf = screen.getByTestId('mock-react-flow');
    expect(rf.getAttribute('data-nodes-draggable')).toBe('false');
  });
});

/* ------------------------------------------------------------------ */
/* Node rendering                                                      */
/* ------------------------------------------------------------------ */
describe('WorkflowNode', () => {
  it('renders all four node types with correct testids', () => {
    const nodes = [
      makeNode('n1', 'agent'),
      makeNode('n2', 'task'),
      makeNode('n3', 'tool'),
      makeNode('n4', 'llm'),
    ];
    renderCanvas({ initialNodes: nodes as any });
    expect(screen.getByTestId('workflow-node-agent')).toBeInTheDocument();
    expect(screen.getByTestId('workflow-node-task')).toBeInTheDocument();
    expect(screen.getByTestId('workflow-node-tool')).toBeInTheDocument();
    expect(screen.getByTestId('workflow-node-llm')).toBeInTheDocument();
  });

  it('displays the node label', () => {
    const nodes = [makeNode('a1', 'agent')];
    renderCanvas({ initialNodes: nodes as any });
    expect(screen.getByText('agent-a1')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    const nodes = [
      makeNode('d1', 'agent', {
        data: {
          label: 'Desc Node',
          nodeType: 'agent',
          description: 'A helpful agent',
          status: 'idle',
        },
      }),
    ];
    renderCanvas({ initialNodes: nodes as any });
    expect(screen.getByText('A helpful agent')).toBeInTheDocument();
  });

  it('hides description area when not provided', () => {
    const nodes = [makeNode('nd', 'task')];
    renderCanvas({ initialNodes: nodes as any });
    const node = screen.getByTestId('workflow-node-task');
    // Only header, no body paragraph
    expect(node.querySelectorAll('.px-3.py-2').length).toBe(0);
  });

  it('shows status badge for running nodes', () => {
    const nodes = [
      makeNode('r1', 'task', {
        data: { label: 'Runner', nodeType: 'task', status: 'running' },
      }),
    ];
    renderCanvas({ initialNodes: nodes as any });
    expect(screen.getByText('running')).toBeInTheDocument();
  });

  it('shows status badge for error nodes', () => {
    const nodes = [
      makeNode('e1', 'tool', {
        data: { label: 'Errored', nodeType: 'tool', status: 'error' },
      }),
    ];
    renderCanvas({ initialNodes: nodes as any });
    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('hides status badge for idle nodes', () => {
    const nodes = [makeNode('idle1', 'agent')];
    renderCanvas({ initialNodes: nodes as any });
    const node = screen.getByTestId('workflow-node-agent');
    expect(node.querySelector('[class*="uppercase"]')).toBeNull();
  });

  it('renders connection handles (source and target)', () => {
    const nodes = [makeNode('h1', 'agent')];
    renderCanvas({ initialNodes: nodes as any });
    expect(screen.getByTestId('handle-target-top')).toBeInTheDocument();
    expect(screen.getByTestId('handle-source-bottom')).toBeInTheDocument();
  });

  it('has accessible aria-label on the node', () => {
    const nodes = [makeNode('a11y', 'agent')];
    renderCanvas({ initialNodes: nodes as any });
    const node = screen.getByTestId('workflow-node-agent');
    expect(node.getAttribute('aria-label')).toBe('Agent node: agent-a11y');
  });
});

/* ------------------------------------------------------------------ */
/* Background, controls, minimap                                       */
/* ------------------------------------------------------------------ */
describe('Canvas sub-components', () => {
  it('renders background by default', () => {
    renderCanvas();
    expect(screen.getByTestId('mock-background')).toBeInTheDocument();
  });

  it('background uses design token grid size', () => {
    renderCanvas();
    const bg = screen.getByTestId('mock-background');
    expect(bg.getAttribute('data-gap')).toBe('20');
    expect(bg.getAttribute('data-variant')).toBe('dots');
  });

  it('renders controls by default', () => {
    renderCanvas();
    expect(screen.getByTestId('mock-controls')).toBeInTheDocument();
  });

  it('hides controls when showControls=false', () => {
    renderCanvas({ showControls: false });
    expect(screen.queryByTestId('mock-controls')).toBeNull();
  });

  it('renders minimap by default', () => {
    renderCanvas();
    expect(screen.getByTestId('mock-minimap')).toBeInTheDocument();
  });

  it('hides minimap when showMinimap=false', () => {
    renderCanvas({ showMinimap: false });
    expect(screen.queryByTestId('mock-minimap')).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Design token constants                                              */
/* ------------------------------------------------------------------ */
describe('CANVAS_CONFIG', () => {
  it('has expected viewport constraints from design tokens', () => {
    expect(CANVAS_CONFIG.minZoom).toBe(0.1);
    expect(CANVAS_CONFIG.maxZoom).toBe(2.0);
    expect(CANVAS_CONFIG.defaultZoom).toBe(1.0);
    expect(CANVAS_CONFIG.snapGrid).toEqual([10, 10]);
    expect(CANVAS_CONFIG.gridSize).toBe(20);
  });
});

describe('Z_INDEX stacking context', () => {
  it('defines monotonically increasing z-index hierarchy', () => {
    expect(Z_INDEX.canvas).toBeLessThan(Z_INDEX.edge);
    expect(Z_INDEX.edge).toBeLessThan(Z_INDEX.node);
    expect(Z_INDEX.node).toBeLessThan(Z_INDEX.nodeSelected);
    expect(Z_INDEX.nodeSelected).toBeLessThan(Z_INDEX.toolbar);
    expect(Z_INDEX.toolbar).toBeLessThan(Z_INDEX.overlay);
    expect(Z_INDEX.overlay).toBeLessThan(Z_INDEX.modal);
  });

  it('has sidebar and properties at same level as toolbar', () => {
    expect(Z_INDEX.sidebar).toBe(Z_INDEX.toolbar);
    expect(Z_INDEX.properties).toBe(Z_INDEX.toolbar);
  });
});

/* ------------------------------------------------------------------ */
/* Type exports (compile-time check)                                   */
/* ------------------------------------------------------------------ */
describe('Type exports', () => {
  it('exports all expected canvas node types', () => {
    const types: CanvasNodeType[] = ['agent', 'task', 'tool', 'llm'];
    expect(types).toHaveLength(4);
  });

  it('exports all expected node statuses', () => {
    const statuses: NodeStatus[] = ['idle', 'running', 'success', 'error', 'disabled'];
    expect(statuses).toHaveLength(5);
  });

  it('exports all expected edge variants', () => {
    const variants: EdgeVariant[] = ['default', 'active', 'dataFlow', 'error'];
    expect(variants).toHaveLength(4);
  });
});
