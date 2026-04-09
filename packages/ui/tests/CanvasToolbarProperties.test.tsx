/**
 * Tests for CanvasToolbar and PropertiesPanel.
 * TASK-137: Implement toolbar and sidebar (add nodes, properties panel)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

/* ------------------------------------------------------------------ */
/* Mock @xyflow/react (required by NodeShell → Handle)                 */
/* ------------------------------------------------------------------ */
vi.mock('@xyflow/react', () => ({
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
  Handle: ({ type, position }: any) => <div data-testid={`handle-${type}-${position}`} />,
}));

/* ------------------------------------------------------------------ */
/* Imports (after mock)                                                */
/* ------------------------------------------------------------------ */
import {
  CanvasToolbar,
  type CanvasToolbarProps,
  DEFAULT_NODE_ENTRIES,
} from '../src/components/canvas/CanvasToolbar.js';
import {
  PropertiesPanel,
  type PropertiesPanelProps,
} from '../src/components/canvas/PropertiesPanel.js';
import type { WorkflowNodeData, CanvasNodeType } from '../src/components/canvas/types.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function renderToolbar(props: Partial<CanvasToolbarProps> = {}) {
  return render(<CanvasToolbar {...props} />);
}

function makeNodeData(overrides: Partial<WorkflowNodeData> = {}): WorkflowNodeData {
  return {
    label: 'Test Agent',
    nodeType: 'agent',
    status: 'idle',
    ...overrides,
  };
}

function renderPanel(props: Partial<PropertiesPanelProps> = {}) {
  const defaults: PropertiesPanelProps = {
    selectedNodeId: null,
    nodeData: null,
    ...props,
  };
  return render(<PropertiesPanel {...defaults} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

/* ================================================================== */
/*  CanvasToolbar                                                      */
/* ================================================================== */
describe('CanvasToolbar', () => {
  it('renders the toolbar root with correct testid', () => {
    renderToolbar();
    expect(screen.getByTestId('canvas-toolbar')).toBeInTheDocument();
  });

  it('has role="toolbar" and accessible label', () => {
    renderToolbar();
    const toolbar = screen.getByTestId('canvas-toolbar');
    expect(toolbar.getAttribute('role')).toBe('toolbar');
    expect(toolbar.getAttribute('aria-label')).toBe('Node palette');
  });

  it('renders all four default node entries', () => {
    renderToolbar();
    expect(screen.getByTestId('toolbar-item-agent')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar-item-task')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar-item-tool')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar-item-llm')).toBeInTheDocument();
  });

  it('renders the "Nodes" heading', () => {
    renderToolbar();
    expect(screen.getByText('Nodes')).toBeInTheDocument();
  });

  it('displays labels for each node type', () => {
    renderToolbar();
    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Tool')).toBeInTheDocument();
    expect(screen.getByText('LLM')).toBeInTheDocument();
  });

  it('calls onAddNode when an item is clicked', () => {
    const onAddNode = vi.fn();
    renderToolbar({ onAddNode });
    fireEvent.click(screen.getByTestId('toolbar-item-agent'));
    expect(onAddNode).toHaveBeenCalledWith('agent');
  });

  it('calls onAddNode with the correct type for each item', () => {
    const onAddNode = vi.fn();
    renderToolbar({ onAddNode });
    const types: CanvasNodeType[] = ['agent', 'task', 'tool', 'llm'];
    types.forEach((type) => {
      fireEvent.click(screen.getByTestId(`toolbar-item-${type}`));
    });
    expect(onAddNode).toHaveBeenCalledTimes(4);
    expect(onAddNode).toHaveBeenNthCalledWith(1, 'agent');
    expect(onAddNode).toHaveBeenNthCalledWith(2, 'task');
    expect(onAddNode).toHaveBeenNthCalledWith(3, 'tool');
    expect(onAddNode).toHaveBeenNthCalledWith(4, 'llm');
  });

  it('does not call onAddNode when disabled', () => {
    const onAddNode = vi.fn();
    renderToolbar({ onAddNode, disabled: true });
    fireEvent.click(screen.getByTestId('toolbar-item-agent'));
    expect(onAddNode).not.toHaveBeenCalled();
  });

  it('sets items as disabled when disabled prop is true', () => {
    renderToolbar({ disabled: true });
    const item = screen.getByTestId('toolbar-item-agent');
    expect(item).toBeDisabled();
  });

  it('items have aria-label for accessibility', () => {
    renderToolbar();
    const item = screen.getByTestId('toolbar-item-agent');
    expect(item.getAttribute('aria-label')).toBe('Add Agent node');
  });

  it('items have title with description', () => {
    renderToolbar();
    const item = screen.getByTestId('toolbar-item-agent');
    expect(item.getAttribute('title')).toBe('AI agent with role & goal');
  });

  it('items are draggable when not disabled', () => {
    renderToolbar();
    const item = screen.getByTestId('toolbar-item-agent');
    expect(item.getAttribute('draggable')).toBe('true');
  });

  it('items are not draggable when disabled', () => {
    renderToolbar({ disabled: true });
    const item = screen.getByTestId('toolbar-item-agent');
    expect(item.getAttribute('draggable')).toBe('false');
  });

  it('sets data transfer on drag start', () => {
    renderToolbar();
    const item = screen.getByTestId('toolbar-item-task');
    const setData = vi.fn();
    fireEvent.dragStart(item, {
      dataTransfer: { setData, effectAllowed: '' },
    });
    expect(setData).toHaveBeenCalledWith('application/crewspace-node-type', 'task');
  });

  it('accepts custom entries', () => {
    renderToolbar({
      entries: [{ type: 'agent', label: 'Custom Agent', description: 'My agent' }],
    });
    expect(screen.getByText('Custom Agent')).toBeInTheDocument();
    expect(screen.queryByTestId('toolbar-item-task')).toBeNull();
  });

  it('applies horizontal layout when position is top', () => {
    renderToolbar({ position: 'top' });
    const toolbar = screen.getByTestId('canvas-toolbar');
    expect(toolbar.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('applies vertical layout by default', () => {
    renderToolbar();
    const toolbar = screen.getByTestId('canvas-toolbar');
    expect(toolbar.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('merges custom className', () => {
    renderToolbar({ className: 'my-toolbar' });
    const toolbar = screen.getByTestId('canvas-toolbar');
    expect(toolbar.className).toContain('my-toolbar');
  });

  it('DEFAULT_NODE_ENTRIES has all four types', () => {
    expect(DEFAULT_NODE_ENTRIES).toHaveLength(4);
    const types = DEFAULT_NODE_ENTRIES.map((e) => e.type);
    expect(types).toEqual(['agent', 'task', 'tool', 'llm']);
  });
});

/* ================================================================== */
/*  PropertiesPanel                                                    */
/* ================================================================== */
describe('PropertiesPanel', () => {
  it('renders the panel root with correct testid', () => {
    renderPanel();
    expect(screen.getByTestId('properties-panel')).toBeInTheDocument();
  });

  it('has role="complementary" and accessible label', () => {
    renderPanel();
    const panel = screen.getByTestId('properties-panel');
    expect(panel.getAttribute('role')).toBe('complementary');
    expect(panel.getAttribute('aria-label')).toBe('Node properties');
  });

  it('shows "Properties" heading', () => {
    renderPanel();
    expect(screen.getByText('Properties')).toBeInTheDocument();
  });

  /* ---------------------------------------------------------------- */
  /* Empty state                                                       */
  /* ---------------------------------------------------------------- */
  describe('empty state', () => {
    it('shows empty state when no node is selected', () => {
      renderPanel();
      expect(screen.getByTestId('properties-empty')).toBeInTheDocument();
    });

    it('shows helpful instruction text', () => {
      renderPanel();
      expect(screen.getByText('Select a node to view its properties')).toBeInTheDocument();
    });

    it('does not show delete button when nothing is selected', () => {
      renderPanel({ onDeleteNode: vi.fn() });
      expect(screen.queryByTestId('properties-delete-btn')).toBeNull();
    });
  });

  /* ---------------------------------------------------------------- */
  /* Selected node — common fields                                     */
  /* ---------------------------------------------------------------- */
  describe('with selected node', () => {
    const nodeData = makeNodeData({
      label: 'My Agent',
      description: 'Does things',
      status: 'running',
    });

    it('shows node type indicator with icon', () => {
      renderPanel({ selectedNodeId: 'n1', nodeData });
      expect(screen.getByTestId('properties-node-type')).toBeInTheDocument();
      expect(screen.getByText('agent')).toBeInTheDocument();
    });

    it('displays the node ID', () => {
      renderPanel({ selectedNodeId: 'my-node-42', nodeData });
      expect(screen.getByText('my-node-42')).toBeInTheDocument();
    });

    it('shows label input with current value', () => {
      renderPanel({ selectedNodeId: 'n1', nodeData });
      const input = screen.getByTestId('property-label') as HTMLInputElement;
      expect(input.value).toBe('My Agent');
    });

    it('shows description textarea with current value', () => {
      renderPanel({ selectedNodeId: 'n1', nodeData });
      const textarea = screen.getByTestId('property-description') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Does things');
    });

    it('shows status select with current value', () => {
      renderPanel({ selectedNodeId: 'n1', nodeData });
      const select = screen.getByTestId('property-status') as HTMLSelectElement;
      expect(select.value).toBe('running');
    });

    it('calls onPropertyChange when label is changed', () => {
      const onChange = vi.fn();
      renderPanel({ selectedNodeId: 'n1', nodeData, onPropertyChange: onChange });
      fireEvent.change(screen.getByTestId('property-label'), {
        target: { value: 'New Label' },
      });
      expect(onChange).toHaveBeenCalledWith('n1', 'label', 'New Label');
    });

    it('calls onPropertyChange when description is changed', () => {
      const onChange = vi.fn();
      renderPanel({ selectedNodeId: 'n1', nodeData, onPropertyChange: onChange });
      fireEvent.change(screen.getByTestId('property-description'), {
        target: { value: 'New desc' },
      });
      expect(onChange).toHaveBeenCalledWith('n1', 'description', 'New desc');
    });

    it('calls onPropertyChange when status is changed', () => {
      const onChange = vi.fn();
      renderPanel({ selectedNodeId: 'n1', nodeData, onPropertyChange: onChange });
      fireEvent.change(screen.getByTestId('property-status'), {
        target: { value: 'error' },
      });
      expect(onChange).toHaveBeenCalledWith('n1', 'status', 'error');
    });

    it('fields are read-only when readOnly=true', () => {
      renderPanel({ selectedNodeId: 'n1', nodeData, readOnly: true });
      expect((screen.getByTestId('property-label') as HTMLInputElement).readOnly).toBe(true);
      expect((screen.getByTestId('property-description') as HTMLTextAreaElement).readOnly).toBe(
        true,
      );
      expect((screen.getByTestId('property-status') as HTMLSelectElement).disabled).toBe(true);
    });
  });

  /* ---------------------------------------------------------------- */
  /* Delete button                                                     */
  /* ---------------------------------------------------------------- */
  describe('delete button', () => {
    it('shows delete button when onDeleteNode is provided', () => {
      renderPanel({
        selectedNodeId: 'n1',
        nodeData: makeNodeData(),
        onDeleteNode: vi.fn(),
      });
      expect(screen.getByTestId('properties-delete-btn')).toBeInTheDocument();
    });

    it('does not show delete button in read-only mode', () => {
      renderPanel({
        selectedNodeId: 'n1',
        nodeData: makeNodeData(),
        onDeleteNode: vi.fn(),
        readOnly: true,
      });
      expect(screen.queryByTestId('properties-delete-btn')).toBeNull();
    });

    it('calls onDeleteNode when clicked', () => {
      const onDelete = vi.fn();
      renderPanel({
        selectedNodeId: 'node-abc',
        nodeData: makeNodeData(),
        onDeleteNode: onDelete,
      });
      fireEvent.click(screen.getByTestId('properties-delete-btn'));
      expect(onDelete).toHaveBeenCalledWith('node-abc');
    });

    it('has accessible aria-label', () => {
      renderPanel({
        selectedNodeId: 'n1',
        nodeData: makeNodeData(),
        onDeleteNode: vi.fn(),
      });
      expect(screen.getByTestId('properties-delete-btn').getAttribute('aria-label')).toBe(
        'Delete node n1',
      );
    });
  });

  /* ---------------------------------------------------------------- */
  /* Agent metadata                                                    */
  /* ---------------------------------------------------------------- */
  describe('agent metadata', () => {
    const agentData = makeNodeData({
      nodeType: 'agent',
      agentMeta: {
        model: 'gpt-4o',
        tools: ['search', 'browser'],
        maxIterations: 10,
      },
    });

    it('shows agent config section', () => {
      renderPanel({ selectedNodeId: 'a1', nodeData: agentData });
      expect(screen.getByTestId('properties-section-agent-config')).toBeInTheDocument();
    });

    it('shows model input with value', () => {
      renderPanel({ selectedNodeId: 'a1', nodeData: agentData });
      const input = screen.getByTestId('property-agent-model') as HTMLInputElement;
      expect(input.value).toBe('gpt-4o');
    });

    it('shows tools list', () => {
      renderPanel({ selectedNodeId: 'a1', nodeData: agentData });
      expect(screen.getByTestId('property-agent-tools')).toBeInTheDocument();
      expect(screen.getByText('search')).toBeInTheDocument();
      expect(screen.getByText('browser')).toBeInTheDocument();
    });

    it('shows max iterations input', () => {
      renderPanel({ selectedNodeId: 'a1', nodeData: agentData });
      const input = screen.getByTestId('property-agent-max-iterations') as HTMLInputElement;
      expect(input.value).toBe('10');
    });

    it('calls onPropertyChange when model changes', () => {
      const onChange = vi.fn();
      renderPanel({ selectedNodeId: 'a1', nodeData: agentData, onPropertyChange: onChange });
      fireEvent.change(screen.getByTestId('property-agent-model'), {
        target: { value: 'claude-3' },
      });
      expect(onChange).toHaveBeenCalledWith('a1', 'agentMeta.model', 'claude-3');
    });
  });

  /* ---------------------------------------------------------------- */
  /* Task metadata                                                     */
  /* ---------------------------------------------------------------- */
  describe('task metadata', () => {
    const taskData = makeNodeData({
      nodeType: 'task',
      taskMeta: {
        expectedOutput: 'JSON report',
        progress: 75,
        inputs: ['data.csv'],
        outputs: ['report.json'],
      },
    });

    it('shows task config section', () => {
      renderPanel({ selectedNodeId: 't1', nodeData: taskData });
      expect(screen.getByTestId('properties-section-task-config')).toBeInTheDocument();
    });

    it('shows expected output', () => {
      renderPanel({ selectedNodeId: 't1', nodeData: taskData });
      expect(screen.getByTestId('property-task-expected-output')).toHaveTextContent('JSON report');
    });

    it('shows progress bar', () => {
      renderPanel({ selectedNodeId: 't1', nodeData: taskData });
      expect(screen.getByTestId('property-task-progress')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('shows inputs', () => {
      renderPanel({ selectedNodeId: 't1', nodeData: taskData });
      expect(screen.getByTestId('property-task-inputs')).toBeInTheDocument();
      expect(screen.getByText('data.csv')).toBeInTheDocument();
    });

    it('shows outputs', () => {
      renderPanel({ selectedNodeId: 't1', nodeData: taskData });
      expect(screen.getByTestId('property-task-outputs')).toBeInTheDocument();
      expect(screen.getByText('report.json')).toBeInTheDocument();
    });
  });

  /* ---------------------------------------------------------------- */
  /* Tool metadata                                                     */
  /* ---------------------------------------------------------------- */
  describe('tool metadata', () => {
    const toolData = makeNodeData({
      nodeType: 'tool',
      toolMeta: {
        parameters: [
          { name: 'query', type: 'string' },
          { name: 'limit', type: 'number' },
        ],
        executionCount: 42,
        avgDuration: '1.2s',
      },
    });

    it('shows tool config section', () => {
      renderPanel({ selectedNodeId: 'tl1', nodeData: toolData });
      expect(screen.getByTestId('properties-section-tool-config')).toBeInTheDocument();
    });

    it('shows parameters', () => {
      renderPanel({ selectedNodeId: 'tl1', nodeData: toolData });
      expect(screen.getByTestId('property-tool-parameters')).toBeInTheDocument();
      expect(screen.getByText('query')).toBeInTheDocument();
      expect(screen.getByText('limit')).toBeInTheDocument();
    });

    it('shows execution count', () => {
      renderPanel({ selectedNodeId: 'tl1', nodeData: toolData });
      expect(screen.getByTestId('property-tool-executions')).toHaveTextContent('42');
    });

    it('shows average duration', () => {
      renderPanel({ selectedNodeId: 'tl1', nodeData: toolData });
      expect(screen.getByTestId('property-tool-duration')).toHaveTextContent('1.2s');
    });
  });

  /* ---------------------------------------------------------------- */
  /* LLM metadata                                                      */
  /* ---------------------------------------------------------------- */
  describe('llm metadata', () => {
    const llmData = makeNodeData({
      nodeType: 'llm',
      llmMeta: {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.7,
        tokenUsage: { input: 1500, output: 800 },
      },
    });

    it('shows llm config section', () => {
      renderPanel({ selectedNodeId: 'l1', nodeData: llmData });
      expect(screen.getByTestId('properties-section-llm-config')).toBeInTheDocument();
    });

    it('shows provider input', () => {
      renderPanel({ selectedNodeId: 'l1', nodeData: llmData });
      const input = screen.getByTestId('property-llm-provider') as HTMLInputElement;
      expect(input.value).toBe('openai');
    });

    it('shows model input', () => {
      renderPanel({ selectedNodeId: 'l1', nodeData: llmData });
      const input = screen.getByTestId('property-llm-model') as HTMLInputElement;
      expect(input.value).toBe('gpt-4o');
    });

    it('shows temperature input', () => {
      renderPanel({ selectedNodeId: 'l1', nodeData: llmData });
      const input = screen.getByTestId('property-llm-temperature') as HTMLInputElement;
      expect(input.value).toBe('0.7');
    });

    it('shows token usage', () => {
      renderPanel({ selectedNodeId: 'l1', nodeData: llmData });
      expect(screen.getByTestId('property-llm-token-usage')).toBeInTheDocument();
    });

    it('calls onPropertyChange when provider changes', () => {
      const onChange = vi.fn();
      renderPanel({ selectedNodeId: 'l1', nodeData: llmData, onPropertyChange: onChange });
      fireEvent.change(screen.getByTestId('property-llm-provider'), {
        target: { value: 'anthropic' },
      });
      expect(onChange).toHaveBeenCalledWith('l1', 'llmMeta.provider', 'anthropic');
    });
  });

  /* ---------------------------------------------------------------- */
  /* Width & className                                                 */
  /* ---------------------------------------------------------------- */
  describe('styling', () => {
    it('applies default width', () => {
      renderPanel();
      const panel = screen.getByTestId('properties-panel');
      expect(panel.style.width).toBe('280px');
    });

    it('accepts custom width', () => {
      renderPanel({ width: 350 });
      const panel = screen.getByTestId('properties-panel');
      expect(panel.style.width).toBe('350px');
    });

    it('merges custom className', () => {
      renderPanel({ className: 'my-panel' });
      const panel = screen.getByTestId('properties-panel');
      expect(panel.className).toContain('my-panel');
    });
  });
});
