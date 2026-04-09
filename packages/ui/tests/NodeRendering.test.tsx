/**
 * Tests for TASK-136: Node rendering (agents, tasks, custom styles)
 *
 * Tests each specialized node component (AgentNode, TaskNode, ToolNode,
 * LLMNode), the NodeShell wrapper, and custom style overrides.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

/* ------------------------------------------------------------------ */
/* Mock @xyflow/react                                                  */
/* ------------------------------------------------------------------ */
vi.mock('@xyflow/react', () => {
  const actual = {
    Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
  };

  return {
    ...actual,
    Handle: ({ type, position }: any) => <div data-testid={`handle-${type}-${position}`} />,
  };
});

/* ------------------------------------------------------------------ */
/* Import components AFTER mock                                        */
/* ------------------------------------------------------------------ */
import { NodeShell } from '../src/components/canvas/NodeShell.js';
import { AgentNode } from '../src/components/canvas/AgentNode.js';
import { TaskNode } from '../src/components/canvas/TaskNode.js';
import { ToolNode } from '../src/components/canvas/ToolNode.js';
import { LLMNode } from '../src/components/canvas/LLMNode.js';
import { WorkflowNode } from '../src/components/canvas/WorkflowNode.js';
import type {
  WorkflowNodeData,
  AgentNodeMeta,
  TaskNodeMeta,
  ToolNodeMeta,
  LLMNodeMeta,
  NodeStyleOverrides,
} from '../src/components/canvas/types.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function makeNodeProps(data: WorkflowNodeData, selected = false) {
  return {
    id: 'test-node',
    data: data as any,
    selected,
    type: 'workflow',
    xPos: 0,
    yPos: 0,
    isConnectable: true,
    zIndex: 0,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    dragging: false,
    sourcePosition: undefined,
    targetPosition: undefined,
  } as any;
}

/* ================================================================== */
/* NodeShell                                                           */
/* ================================================================== */
describe('NodeShell', () => {
  it('renders with correct data-testid for each node type', () => {
    const { unmount } = render(<NodeShell nodeType="agent" label="Test Agent" />);
    expect(screen.getByTestId('workflow-node-agent')).toBeInTheDocument();
    unmount();

    const { unmount: u2 } = render(<NodeShell nodeType="task" label="Test Task" />);
    expect(screen.getByTestId('workflow-node-task')).toBeInTheDocument();
    u2();

    const { unmount: u3 } = render(<NodeShell nodeType="tool" label="Test Tool" />);
    expect(screen.getByTestId('workflow-node-tool')).toBeInTheDocument();
    u3();

    render(<NodeShell nodeType="llm" label="Test LLM" />);
    expect(screen.getByTestId('workflow-node-llm')).toBeInTheDocument();
  });

  it('displays the label text', () => {
    render(<NodeShell nodeType="agent" label="My Agent" />);
    expect(screen.getByText('My Agent')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<NodeShell nodeType="agent" label="A" description="Agent description" />);
    expect(screen.getByTestId('node-description')).toHaveTextContent('Agent description');
  });

  it('hides description when not provided', () => {
    render(<NodeShell nodeType="agent" label="A" />);
    expect(screen.queryByTestId('node-description')).toBeNull();
  });

  it('renders status badge for non-idle statuses', () => {
    render(<NodeShell nodeType="task" label="T" status="running" />);
    expect(screen.getByTestId('node-status-badge')).toHaveTextContent('running');
  });

  it('hides status badge for idle status', () => {
    render(<NodeShell nodeType="task" label="T" status="idle" />);
    expect(screen.queryByTestId('node-status-badge')).toBeNull();
  });

  it('renders children as node body', () => {
    render(
      <NodeShell nodeType="agent" label="A">
        <span data-testid="custom-child">Hello</span>
      </NodeShell>,
    );
    expect(screen.getByTestId('node-body')).toBeInTheDocument();
    expect(screen.getByTestId('custom-child')).toHaveTextContent('Hello');
  });

  it('renders footer when provided', () => {
    render(
      <NodeShell nodeType="agent" label="A" footer={<span>Footer content</span>} />,
    );
    expect(screen.getByTestId('node-footer')).toHaveTextContent('Footer content');
  });

  it('hides body and footer when not provided', () => {
    render(<NodeShell nodeType="agent" label="A" />);
    expect(screen.queryByTestId('node-body')).toBeNull();
    expect(screen.queryByTestId('node-footer')).toBeNull();
  });

  it('has accessible aria-label', () => {
    render(<NodeShell nodeType="agent" label="Research Agent" />);
    const node = screen.getByTestId('workflow-node-agent');
    expect(node.getAttribute('aria-label')).toBe('Agent node: Research Agent');
  });

  it('renders connection handles', () => {
    render(<NodeShell nodeType="agent" label="A" />);
    expect(screen.getByTestId('handle-target-top')).toBeInTheDocument();
    expect(screen.getByTestId('handle-source-bottom')).toBeInTheDocument();
  });

  it('applies selected styling', () => {
    render(<NodeShell nodeType="agent" label="A" selected />);
    const node = screen.getByTestId('workflow-node-agent');
    expect(node.className).toContain('shadow-node-selected');
    expect(node.className).toContain('ring-2');
  });

  it('applies custom style overrides', () => {
    const overrides: NodeStyleOverrides = {
      backgroundColor: '#ff0000',
      borderColor: '#00ff00',
      iconColor: '#0000ff',
    };
    render(<NodeShell nodeType="agent" label="A" styleOverrides={overrides} />);
    const node = screen.getByTestId('workflow-node-agent');
    expect(node.style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(node.style.borderColor).toBe('rgb(0, 255, 0)');
  });
});

/* ================================================================== */
/* AgentNode                                                           */
/* ================================================================== */
describe('AgentNode', () => {
  const baseData: WorkflowNodeData = {
    label: 'Research Agent',
    nodeType: 'agent',
    status: 'idle',
    description: 'Researches topics',
  };

  it('renders as an agent node', () => {
    render(<AgentNode {...makeNodeProps(baseData)} />);
    expect(screen.getByTestId('workflow-node-agent')).toBeInTheDocument();
  });

  it('displays agent label and description', () => {
    render(<AgentNode {...makeNodeProps(baseData)} />);
    expect(screen.getByText('Research Agent')).toBeInTheDocument();
    expect(screen.getByText('Researches topics')).toBeInTheDocument();
  });

  it('renders model info when agentMeta.model is set', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      agentMeta: { model: 'gpt-4o' },
    };
    render(<AgentNode {...makeNodeProps(data)} />);
    expect(screen.getByTestId('agent-model')).toHaveTextContent('gpt-4o');
  });

  it('renders tools list when agentMeta.tools is set', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      agentMeta: { tools: ['search', 'browse', 'code'] },
    };
    render(<AgentNode {...makeNodeProps(data)} />);
    const tools = screen.getByTestId('agent-tools');
    expect(tools).toHaveTextContent('search');
    expect(tools).toHaveTextContent('browse');
    expect(tools).toHaveTextContent('code');
  });

  it('renders max iterations when set', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      agentMeta: { maxIterations: 10 },
    };
    render(<AgentNode {...makeNodeProps(data)} />);
    expect(screen.getByTestId('agent-iterations')).toHaveTextContent('10');
  });

  it('renders capabilities count in footer', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      agentMeta: { capabilities: ['reasoning', 'tool-use', 'code-gen'] },
    };
    render(<AgentNode {...makeNodeProps(data)} />);
    expect(screen.getByTestId('agent-capabilities-count')).toHaveTextContent('3 capabilities');
  });

  it('uses singular "capability" for count of 1', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      agentMeta: { capabilities: ['reasoning'] },
    };
    render(<AgentNode {...makeNodeProps(data)} />);
    expect(screen.getByTestId('agent-capabilities-count')).toHaveTextContent('1 capability');
  });

  it('does not render body section without agentMeta', () => {
    render(<AgentNode {...makeNodeProps(baseData)} />);
    expect(screen.queryByTestId('node-body')).toBeNull();
  });
});

/* ================================================================== */
/* TaskNode                                                            */
/* ================================================================== */
describe('TaskNode', () => {
  const baseData: WorkflowNodeData = {
    label: 'Process Data',
    nodeType: 'task',
    status: 'idle',
  };

  it('renders as a task node', () => {
    render(<TaskNode {...makeNodeProps(baseData)} />);
    expect(screen.getByTestId('workflow-node-task')).toBeInTheDocument();
  });

  it('renders progress bar when taskMeta.progress is set', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      taskMeta: { progress: 65 },
    };
    render(<TaskNode {...makeNodeProps(data)} />);
    const progress = screen.getByTestId('task-progress');
    expect(progress).toHaveTextContent('65%');
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('65');
  });

  it('clamps progress bar width between 0 and 100', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      taskMeta: { progress: 150 },
    };
    render(<TaskNode {...makeNodeProps(data)} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.style.width).toBe('100%');
  });

  it('renders inputs when taskMeta.inputs is set', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      taskMeta: { inputs: ['query', 'context'] },
    };
    render(<TaskNode {...makeNodeProps(data)} />);
    const inputs = screen.getByTestId('task-inputs');
    expect(inputs).toHaveTextContent('query');
    expect(inputs).toHaveTextContent('context');
  });

  it('renders outputs when taskMeta.outputs is set', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      taskMeta: { outputs: ['result', 'summary'] },
    };
    render(<TaskNode {...makeNodeProps(data)} />);
    const outputs = screen.getByTestId('task-outputs');
    expect(outputs).toHaveTextContent('result');
    expect(outputs).toHaveTextContent('summary');
  });

  it('renders expected output in footer', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      taskMeta: { expectedOutput: 'JSON report' },
    };
    render(<TaskNode {...makeNodeProps(data)} />);
    expect(screen.getByTestId('task-expected-output')).toHaveTextContent('JSON report');
  });

  it('does not render body section without taskMeta', () => {
    render(<TaskNode {...makeNodeProps(baseData)} />);
    expect(screen.queryByTestId('node-body')).toBeNull();
  });
});

/* ================================================================== */
/* ToolNode                                                            */
/* ================================================================== */
describe('ToolNode', () => {
  const baseData: WorkflowNodeData = {
    label: 'Web Search',
    nodeType: 'tool',
    status: 'idle',
  };

  it('renders as a tool node', () => {
    render(<ToolNode {...makeNodeProps(baseData)} />);
    expect(screen.getByTestId('workflow-node-tool')).toBeInTheDocument();
  });

  it('renders parameters list when toolMeta.parameters is set', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      toolMeta: {
        parameters: [
          { name: 'query', type: 'string' },
          { name: 'limit', type: 'number' },
        ],
      },
    };
    render(<ToolNode {...makeNodeProps(data)} />);
    const params = screen.getByTestId('tool-parameters');
    expect(params).toHaveTextContent('query');
    expect(params).toHaveTextContent('string');
    expect(params).toHaveTextContent('limit');
    expect(params).toHaveTextContent('number');
  });

  it('renders footer stats when execution count and avg duration are set', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      toolMeta: { executionCount: 42, avgDuration: '1.2s' },
    };
    render(<ToolNode {...makeNodeProps(data)} />);
    const stats = screen.getByTestId('tool-footer-stats');
    expect(stats).toHaveTextContent('42');
    expect(stats).toHaveTextContent('1.2s');
  });

  it('does not render body section without toolMeta parameters', () => {
    render(<ToolNode {...makeNodeProps(baseData)} />);
    expect(screen.queryByTestId('tool-parameters')).toBeNull();
  });
});

/* ================================================================== */
/* LLMNode                                                             */
/* ================================================================== */
describe('LLMNode', () => {
  const baseData: WorkflowNodeData = {
    label: 'OpenAI GPT-4',
    nodeType: 'llm',
    status: 'idle',
  };

  it('renders as an llm node', () => {
    render(<LLMNode {...makeNodeProps(baseData)} />);
    expect(screen.getByTestId('workflow-node-llm')).toBeInTheDocument();
  });

  it('renders provider info when llmMeta.provider is set', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      llmMeta: { provider: 'OpenAI' },
    };
    render(<LLMNode {...makeNodeProps(data)} />);
    expect(screen.getByTestId('llm-provider')).toHaveTextContent('OpenAI');
  });

  it('renders model info when llmMeta.model is set', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      llmMeta: { model: 'gpt-4-turbo' },
    };
    render(<LLMNode {...makeNodeProps(data)} />);
    expect(screen.getByTestId('llm-model')).toHaveTextContent('gpt-4-turbo');
  });

  it('renders temperature when llmMeta.temperature is set', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      llmMeta: { temperature: 0.7 },
    };
    render(<LLMNode {...makeNodeProps(data)} />);
    expect(screen.getByTestId('llm-temperature')).toHaveTextContent('0.7');
  });

  it('renders max tokens when llmMeta.maxTokens is set', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      llmMeta: { maxTokens: 4096 },
    };
    render(<LLMNode {...makeNodeProps(data)} />);
    expect(screen.getByTestId('llm-max-tokens')).toHaveTextContent('4.1K');
  });

  it('renders token usage in footer when set', () => {
    const data: WorkflowNodeData = {
      ...baseData,
      llmMeta: { tokenUsage: { input: 1500, output: 2500000 } },
    };
    render(<LLMNode {...makeNodeProps(data)} />);
    const usage = screen.getByTestId('llm-token-usage');
    expect(usage).toHaveTextContent('1.5K');
    expect(usage).toHaveTextContent('2.5M');
  });

  it('does not render body section without llmMeta', () => {
    render(<LLMNode {...makeNodeProps(baseData)} />);
    expect(screen.queryByTestId('node-body')).toBeNull();
  });
});

/* ================================================================== */
/* WorkflowNode routing                                                */
/* ================================================================== */
describe('WorkflowNode (router)', () => {
  it('routes agent type to AgentNode', () => {
    const data: WorkflowNodeData = { label: 'Agent', nodeType: 'agent' };
    render(<WorkflowNode {...makeNodeProps(data)} />);
    expect(screen.getByTestId('workflow-node-agent')).toBeInTheDocument();
  });

  it('routes task type to TaskNode', () => {
    const data: WorkflowNodeData = { label: 'Task', nodeType: 'task' };
    render(<WorkflowNode {...makeNodeProps(data)} />);
    expect(screen.getByTestId('workflow-node-task')).toBeInTheDocument();
  });

  it('routes tool type to ToolNode', () => {
    const data: WorkflowNodeData = { label: 'Tool', nodeType: 'tool' };
    render(<WorkflowNode {...makeNodeProps(data)} />);
    expect(screen.getByTestId('workflow-node-tool')).toBeInTheDocument();
  });

  it('routes llm type to LLMNode', () => {
    const data: WorkflowNodeData = { label: 'LLM', nodeType: 'llm' };
    render(<WorkflowNode {...makeNodeProps(data)} />);
    expect(screen.getByTestId('workflow-node-llm')).toBeInTheDocument();
  });

  it('passes rich agent meta through to AgentNode', () => {
    const data: WorkflowNodeData = {
      label: 'Smart Agent',
      nodeType: 'agent',
      agentMeta: { model: 'claude-3', tools: ['calc'] },
    };
    render(<WorkflowNode {...makeNodeProps(data)} />);
    expect(screen.getByTestId('agent-model')).toHaveTextContent('claude-3');
    expect(screen.getByTestId('agent-tools')).toHaveTextContent('calc');
  });
});

/* ================================================================== */
/* Custom style overrides                                              */
/* ================================================================== */
describe('Custom style overrides', () => {
  it('applies backgroundColor override on AgentNode', () => {
    const data: WorkflowNodeData = {
      label: 'Custom',
      nodeType: 'agent',
      styleOverrides: { backgroundColor: 'rgb(255, 128, 0)' },
    };
    render(<AgentNode {...makeNodeProps(data)} />);
    const node = screen.getByTestId('workflow-node-agent');
    expect(node.style.backgroundColor).toBe('rgb(255, 128, 0)');
  });

  it('applies borderColor override on TaskNode', () => {
    const data: WorkflowNodeData = {
      label: 'Custom',
      nodeType: 'task',
      styleOverrides: { borderColor: 'rgb(0, 255, 128)' },
    };
    render(<TaskNode {...makeNodeProps(data)} />);
    const node = screen.getByTestId('workflow-node-task');
    expect(node.style.borderColor).toBe('rgb(0, 255, 128)');
  });
});

/* ================================================================== */
/* New type exports (compile-time check)                               */
/* ================================================================== */
describe('TASK-136 type exports', () => {
  it('AgentNodeMeta has expected shape', () => {
    const meta: AgentNodeMeta = {
      model: 'gpt-4',
      tools: ['search'],
      capabilities: ['reasoning'],
      maxIterations: 5,
    };
    expect(meta.model).toBe('gpt-4');
    expect(meta.tools).toHaveLength(1);
  });

  it('TaskNodeMeta has expected shape', () => {
    const meta: TaskNodeMeta = {
      inputs: ['a'],
      outputs: ['b'],
      progress: 50,
      expectedOutput: 'report',
    };
    expect(meta.progress).toBe(50);
  });

  it('ToolNodeMeta has expected shape', () => {
    const meta: ToolNodeMeta = {
      parameters: [{ name: 'q', type: 'string' }],
      executionCount: 10,
      avgDuration: '2s',
    };
    expect(meta.parameters).toHaveLength(1);
  });

  it('LLMNodeMeta has expected shape', () => {
    const meta: LLMNodeMeta = {
      provider: 'OpenAI',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4096,
      tokenUsage: { input: 100, output: 200 },
    };
    expect(meta.tokenUsage?.input).toBe(100);
  });

  it('NodeStyleOverrides has expected shape', () => {
    const style: NodeStyleOverrides = {
      backgroundColor: '#000',
      borderColor: '#fff',
      iconColor: '#f00',
      headerClassName: 'custom-header',
      bodyClassName: 'custom-body',
    };
    expect(style.backgroundColor).toBe('#000');
  });
});
