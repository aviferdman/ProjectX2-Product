import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TemplatePreviewModal,
  WorkflowDiagram,
} from '../src/components/templates/index.js';
import type {
  TemplateSummary,
  WorkflowDiagramNode,
  WorkflowDiagramEdge,
} from '../src/components/templates/index.js';

/* ---------- Mock data ---------- */

const mockTemplate: TemplateSummary = {
  id: 'tpl-1',
  name: 'Research Assistant',
  description: 'Automated research pipeline with web scraping and summarization',
  category: 'research',
  tags: ['research', 'scraping', 'GPT-4'],
  author: 'Crewspace',
  usageCount: 1234,
  agentCount: 2,
  taskCount: 4,
  featured: true,
  popular: false,
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-03-20T14:00:00Z',
};

const mockTemplateNoTags: TemplateSummary = {
  id: 'tpl-2',
  name: 'Simple Bot',
  description: 'A simple bot',
  category: 'automation',
  tags: [],
  author: 'Author',
  usageCount: 50,
  agentCount: 1,
  taskCount: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

/* ================================================================== */
/* WorkflowDiagram                                                     */
/* ================================================================== */

describe('WorkflowDiagram', () => {
  const nodes: WorkflowDiagramNode[] = [
    { id: 'a1', label: 'Agent 1', type: 'agent' },
    { id: 't1', label: 'Task 1', type: 'task' },
    { id: 't2', label: 'Task 2', type: 'task' },
  ];
  const edges: WorkflowDiagramEdge[] = [
    { from: 'a1', to: 't1' },
    { from: 'a1', to: 't2' },
  ];

  it('renders an SVG with role=img', () => {
    render(<WorkflowDiagram nodes={nodes} edges={edges} />);
    expect(screen.getByRole('img', { name: 'Workflow diagram' })).toBeInTheDocument();
  });

  it('renders all nodes', () => {
    render(<WorkflowDiagram nodes={nodes} edges={edges} />);
    expect(screen.getByTestId('node-a1')).toBeInTheDocument();
    expect(screen.getByTestId('node-t1')).toBeInTheDocument();
    expect(screen.getByTestId('node-t2')).toBeInTheDocument();
  });

  it('renders edges between connected nodes', () => {
    render(<WorkflowDiagram nodes={nodes} edges={edges} />);
    expect(screen.getByTestId('edge-a1-t1')).toBeInTheDocument();
    expect(screen.getByTestId('edge-a1-t2')).toBeInTheDocument();
  });

  it('renders node labels', () => {
    render(<WorkflowDiagram nodes={nodes} edges={edges} />);
    expect(screen.getByText('Agent 1')).toBeInTheDocument();
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('truncates long labels', () => {
    const longNode: WorkflowDiagramNode[] = [
      { id: 'x', label: 'This is a very long label that should be truncated', type: 'agent' },
    ];
    render(<WorkflowDiagram nodes={longNode} edges={[]} />);
    expect(screen.getByText('This is a very …')).toBeInTheDocument();
  });

  it('shows empty state when no nodes', () => {
    render(<WorkflowDiagram nodes={[]} edges={[]} />);
    expect(screen.getByText('No workflow steps defined')).toBeInTheDocument();
  });

  it('handles nodes with no edges', () => {
    const soloNodes: WorkflowDiagramNode[] = [
      { id: 'a', label: 'Solo Agent', type: 'agent' },
      { id: 'b', label: 'Solo Task', type: 'task' },
    ];
    render(<WorkflowDiagram nodes={soloNodes} edges={[]} />);
    expect(screen.getByTestId('node-a')).toBeInTheDocument();
    expect(screen.getByTestId('node-b')).toBeInTheDocument();
  });

  it('skips edges referencing non-existent nodes', () => {
    const singleNode: WorkflowDiagramNode[] = [
      { id: 'a', label: 'Agent', type: 'agent' },
    ];
    const badEdges: WorkflowDiagramEdge[] = [{ from: 'a', to: 'missing' }];
    render(<WorkflowDiagram nodes={singleNode} edges={badEdges} />);
    // Should not crash; node renders fine
    expect(screen.getByTestId('node-a')).toBeInTheDocument();
  });
});

/* ================================================================== */
/* TemplatePreviewModal                                                */
/* ================================================================== */

describe('TemplatePreviewModal', () => {
  it('renders nothing when template is null', () => {
    const { container } = render(
      <TemplatePreviewModal template={null} onClose={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with template name', () => {
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={() => {}} />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-label', 'Preview: Research Assistant');
  });

  it('renders template description', () => {
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={() => {}} />,
    );
    expect(
      screen.getByText(/Automated research pipeline/),
    ).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={() => {}} />,
    );
    expect(screen.getByText('Research')).toBeInTheDocument();
  });

  it('renders featured badge when featured', () => {
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={() => {}} />,
    );
    expect(screen.getByText('★ Featured')).toBeInTheDocument();
  });

  it('renders popular badge when popular', () => {
    const popular = { ...mockTemplate, popular: true };
    render(
      <TemplatePreviewModal template={popular} onClose={() => {}} />,
    );
    expect(screen.getByText('🔥 Popular')).toBeInTheDocument();
  });

  it('renders tags', () => {
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={() => {}} />,
    );
    expect(screen.getByText('research')).toBeInTheDocument();
    expect(screen.getByText('scraping')).toBeInTheDocument();
    expect(screen.getByText('GPT-4')).toBeInTheDocument();
  });

  it('does not render tags section when no tags', () => {
    render(
      <TemplatePreviewModal template={mockTemplateNoTags} onClose={() => {}} />,
    );
    // The tags section should not be present
    expect(screen.queryByText('research')).toBeNull();
  });

  it('renders agent and task counts', () => {
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={() => {}} />,
    );
    expect(screen.getByText('2 agents')).toBeInTheDocument();
    expect(screen.getByText('4 tasks')).toBeInTheDocument();
  });

  it('renders usage count', () => {
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={() => {}} />,
    );
    expect(screen.getByText('1.2k uses')).toBeInTheDocument();
  });

  it('renders author', () => {
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={() => {}} />,
    );
    expect(screen.getByText('by Crewspace')).toBeInTheDocument();
  });

  it('renders workflow diagram section', () => {
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={() => {}} />,
    );
    expect(screen.getByText('Workflow')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Workflow diagram' })).toBeInTheDocument();
  });

  it('renders workflow diagram with generated nodes', () => {
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={() => {}} />,
    );
    // 2 agents + 4 tasks
    expect(screen.getByTestId('node-agent-0')).toBeInTheDocument();
    expect(screen.getByTestId('node-agent-1')).toBeInTheDocument();
    expect(screen.getByTestId('node-task-0')).toBeInTheDocument();
    expect(screen.getByTestId('node-task-3')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const handler = vi.fn();
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={handler} />,
    );
    fireEvent.click(screen.getByLabelText('Close preview'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Close footer button clicked', () => {
    const handler = vi.fn();
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={handler} />,
    );
    // Footer close button
    const buttons = screen.getAllByText('Close');
    fireEvent.click(buttons[0]);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key', () => {
    const handler = vi.fn();
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={handler} />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking overlay', () => {
    const handler = vi.fn();
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={handler} />,
    );
    const overlay = screen.getByTestId('preview-overlay');
    fireEvent.click(overlay);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside dialog', () => {
    const handler = vi.fn();
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={handler} />,
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(handler).not.toHaveBeenCalled();
  });

  it('renders Use Template button when onUseTemplate provided', () => {
    const handler = vi.fn();
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        onClose={() => {}}
        onUseTemplate={handler}
      />,
    );
    const btn = screen.getByLabelText('Use template Research Assistant');
    expect(btn).toBeInTheDocument();
  });

  it('calls onUseTemplate with template id', () => {
    const handler = vi.fn();
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        onClose={() => {}}
        onUseTemplate={handler}
      />,
    );
    fireEvent.click(screen.getByLabelText('Use template Research Assistant'));
    expect(handler).toHaveBeenCalledWith('tpl-1');
  });

  it('does not render Use Template button when onUseTemplate not provided', () => {
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={() => {}} />,
    );
    expect(screen.queryByText('Use Template')).toBeNull();
  });

  it('has correct accessibility attributes', () => {
    render(
      <TemplatePreviewModal template={mockTemplate} onClose={() => {}} />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Preview: Research Assistant');
  });
});
