import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  WorkflowStatusBadge,
  WorkflowCard,
  WorkflowListRow,
  SearchBar,
  FilterChips,
  ViewToggle,
  DashboardToolbar,
  EmptyState,
  WorkflowGrid,
  WorkflowList,
  DashboardPage,
} from '../src/components/dashboard/index.js';
import type { WorkflowSummary } from '../src/components/dashboard/types.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const mockWorkflow: WorkflowSummary = {
  id: 'wf-1',
  name: 'Test Workflow',
  description: 'A test workflow description',
  status: 'active',
  agentCount: 3,
  taskCount: 5,
  createdAt: '2026-04-01T10:00:00Z',
  updatedAt: '2026-04-09T08:00:00Z',
};

const mockWorkflows: WorkflowSummary[] = [
  mockWorkflow,
  {
    id: 'wf-2',
    name: 'Draft Workflow',
    description: 'Still in progress',
    status: 'draft',
    agentCount: 1,
    taskCount: 2,
    createdAt: '2026-04-02T10:00:00Z',
    updatedAt: '2026-04-08T08:00:00Z',
  },
  {
    id: 'wf-3',
    name: 'Error Workflow',
    status: 'error',
    agentCount: 2,
    taskCount: 4,
    createdAt: '2026-04-03T10:00:00Z',
    updatedAt: '2026-04-07T08:00:00Z',
  },
];

/* ------------------------------------------------------------------ */
/* WorkflowStatusBadge                                                 */
/* ------------------------------------------------------------------ */
describe('WorkflowStatusBadge', () => {
  it('renders the status label', () => {
    render(<WorkflowStatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders draft status', () => {
    render(<WorkflowStatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders error status', () => {
    render(<WorkflowStatusBadge status="error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders archived status', () => {
    render(<WorkflowStatusBadge status="archived" />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('merges custom className', () => {
    const { container } = render(<WorkflowStatusBadge status="active" className="my-class" />);
    expect(container.firstElementChild?.className).toContain('my-class');
  });
});

/* ------------------------------------------------------------------ */
/* WorkflowCard                                                        */
/* ------------------------------------------------------------------ */
describe('WorkflowCard', () => {
  it('renders workflow name and description', () => {
    render(<WorkflowCard workflow={mockWorkflow} />);
    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    expect(screen.getByText('A test workflow description')).toBeInTheDocument();
  });

  it('renders agent and task counts', () => {
    render(<WorkflowCard workflow={mockWorkflow} />);
    expect(screen.getByText(/3 agents/)).toBeInTheDocument();
    expect(screen.getByText(/5 tasks/)).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<WorkflowCard workflow={mockWorkflow} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('calls onOpen when clicked', () => {
    const onOpen = vi.fn();
    render(<WorkflowCard workflow={mockWorkflow} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: /open workflow/i }));
    expect(onOpen).toHaveBeenCalledWith('wf-1');
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    const onOpen = vi.fn();
    render(<WorkflowCard workflow={mockWorkflow} onOpen={onOpen} onDelete={onDelete} />);
    fireEvent.click(screen.getByTitle('Delete'));
    expect(onDelete).toHaveBeenCalledWith('wf-1');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('calls onDuplicate when duplicate button clicked', () => {
    const onDuplicate = vi.fn();
    const onOpen = vi.fn();
    render(<WorkflowCard workflow={mockWorkflow} onOpen={onOpen} onDuplicate={onDuplicate} />);
    fireEvent.click(screen.getByTitle('Duplicate'));
    expect(onDuplicate).toHaveBeenCalledWith('wf-1');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('renders without description', () => {
    const wf = { ...mockWorkflow, description: undefined };
    const { container } = render(<WorkflowCard workflow={wf} />);
    expect(container.querySelector('.line-clamp-2')).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* WorkflowListRow                                                     */
/* ------------------------------------------------------------------ */
describe('WorkflowListRow', () => {
  const renderInTable = (ui: React.ReactElement) =>
    render(<table><tbody>{ui}</tbody></table>);

  it('renders workflow name', () => {
    renderInTable(<WorkflowListRow workflow={mockWorkflow} />);
    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    renderInTable(<WorkflowListRow workflow={mockWorkflow} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('calls onOpen when row is clicked', () => {
    const onOpen = vi.fn();
    renderInTable(<WorkflowListRow workflow={mockWorkflow} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('row'));
    expect(onOpen).toHaveBeenCalledWith('wf-1');
  });

  it('shows selected styling', () => {
    renderInTable(<WorkflowListRow workflow={mockWorkflow} selected />);
    const row = screen.getByRole('row');
    expect(row.getAttribute('aria-selected')).toBe('true');
  });
});

/* ------------------------------------------------------------------ */
/* SearchBar                                                           */
/* ------------------------------------------------------------------ */
describe('SearchBar', () => {
  it('renders search input with placeholder', () => {
    render(<SearchBar value="" onValueChange={() => {}} />);
    expect(screen.getByPlaceholderText('Search workflows…')).toBeInTheDocument();
  });

  it('calls onValueChange when typing', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onValueChange={onChange} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'test' } });
    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('renders current value', () => {
    render(<SearchBar value="hello" onValueChange={() => {}} />);
    expect(screen.getByRole('searchbox')).toHaveValue('hello');
  });
});

/* ------------------------------------------------------------------ */
/* FilterChips                                                         */
/* ------------------------------------------------------------------ */
describe('FilterChips', () => {
  it('renders all filter options', () => {
    render(<FilterChips value="all" onChange={() => {}} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('marks active filter as checked', () => {
    render(<FilterChips value="active" onChange={() => {}} />);
    const activeBtn = screen.getByText('Active');
    expect(activeBtn.getAttribute('aria-checked')).toBe('true');
    const allBtn = screen.getByText('All');
    expect(allBtn.getAttribute('aria-checked')).toBe('false');
  });

  it('calls onChange when chip is clicked', () => {
    const onChange = vi.fn();
    render(<FilterChips value="all" onChange={onChange} />);
    fireEvent.click(screen.getByText('Draft'));
    expect(onChange).toHaveBeenCalledWith('draft');
  });
});

/* ------------------------------------------------------------------ */
/* ViewToggle                                                          */
/* ------------------------------------------------------------------ */
describe('ViewToggle', () => {
  it('renders grid and list buttons', () => {
    render(<ViewToggle value="grid" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: 'Grid view' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'List view' })).toBeInTheDocument();
  });

  it('marks the active mode', () => {
    render(<ViewToggle value="list" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: 'List view' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'Grid view' }).getAttribute('aria-checked')).toBe('false');
  });

  it('calls onChange on click', () => {
    const onChange = vi.fn();
    render(<ViewToggle value="grid" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'List view' }));
    expect(onChange).toHaveBeenCalledWith('list');
  });
});

/* ------------------------------------------------------------------ */
/* DashboardToolbar                                                    */
/* ------------------------------------------------------------------ */
describe('DashboardToolbar', () => {
  it('renders search, filters, view toggle, and create button', () => {
    render(
      <DashboardToolbar
        search=""
        onSearchChange={() => {}}
        statusFilter="all"
        onStatusFilterChange={() => {}}
        viewMode="grid"
        onViewModeChange={() => {}}
        onCreate={() => {}}
      />,
    );
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Grid view' })).toBeInTheDocument();
    expect(screen.getByText('New Workflow')).toBeInTheDocument();
  });

  it('calls onCreate when button clicked', () => {
    const onCreate = vi.fn();
    render(
      <DashboardToolbar
        search=""
        onSearchChange={() => {}}
        statusFilter="all"
        onStatusFilterChange={() => {}}
        viewMode="grid"
        onViewModeChange={() => {}}
        onCreate={onCreate}
      />,
    );
    fireEvent.click(screen.getByText('New Workflow'));
    expect(onCreate).toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/* EmptyState                                                          */
/* ------------------------------------------------------------------ */
describe('EmptyState', () => {
  it('renders default text', () => {
    render(<EmptyState />);
    expect(screen.getByText('No workflows yet')).toBeInTheDocument();
  });

  it('renders custom heading and description', () => {
    render(<EmptyState heading="Custom" description="Custom desc" />);
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('Custom desc')).toBeInTheDocument();
  });

  it('renders action button and fires callback', () => {
    const onAction = vi.fn();
    render(<EmptyState onAction={onAction} />);
    fireEvent.click(screen.getByText('Create Workflow'));
    expect(onAction).toHaveBeenCalled();
  });

  it('does not render button when no onAction', () => {
    render(<EmptyState />);
    expect(screen.queryByText('Create Workflow')).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* WorkflowGrid                                                        */
/* ------------------------------------------------------------------ */
describe('WorkflowGrid', () => {
  it('renders a card for each workflow', () => {
    render(<WorkflowGrid workflows={mockWorkflows} />);
    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    expect(screen.getByText('Draft Workflow')).toBeInTheDocument();
    expect(screen.getByText('Error Workflow')).toBeInTheDocument();
  });

  it('renders empty grid when no workflows', () => {
    const { container } = render(<WorkflowGrid workflows={[]} />);
    expect(container.querySelector('.grid')?.children.length).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* WorkflowList                                                        */
/* ------------------------------------------------------------------ */
describe('WorkflowList', () => {
  it('renders a row for each workflow', () => {
    render(<WorkflowList workflows={mockWorkflows} />);
    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    expect(screen.getByText('Draft Workflow')).toBeInTheDocument();
    expect(screen.getByText('Error Workflow')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<WorkflowList workflows={mockWorkflows} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Last Updated')).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* DashboardPage                                                       */
/* ------------------------------------------------------------------ */
describe('DashboardPage', () => {
  it('renders toolbar and workflow grid by default', () => {
    render(<DashboardPage workflows={mockWorkflows} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
  });

  it('shows empty state when no workflows', () => {
    render(<DashboardPage workflows={[]} />);
    expect(screen.getByText('No workflows yet')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<DashboardPage workflows={[]} loading />);
    expect(screen.getByText('Loading workflows…')).toBeInTheDocument();
  });

  it('filters workflows by search text', () => {
    render(<DashboardPage workflows={mockWorkflows} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Draft' } });
    expect(screen.getByText('Draft Workflow')).toBeInTheDocument();
    expect(screen.queryByText('Test Workflow')).toBeNull();
  });

  it('filters workflows by status', () => {
    render(<DashboardPage workflows={mockWorkflows} />);
    // Click the Error filter chip (role=radio) instead of the status badge
    fireEvent.click(screen.getByRole('radio', { name: 'Error' }));
    expect(screen.getByText('Error Workflow')).toBeInTheDocument();
    expect(screen.queryByText('Test Workflow')).toBeNull();
  });

  it('switches to list view', () => {
    render(<DashboardPage workflows={mockWorkflows} />);
    fireEvent.click(screen.getByRole('radio', { name: 'List view' }));
    // List view renders a table with headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('shows "no matching" state when search has no results', () => {
    render(<DashboardPage workflows={mockWorkflows} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'xyz-nonexistent' } });
    expect(screen.getByText('No matching workflows')).toBeInTheDocument();
  });

  it('shows workflow count', () => {
    render(<DashboardPage workflows={mockWorkflows} />);
    expect(screen.getByText(/Showing 3 of 3 workflows/)).toBeInTheDocument();
  });

  it('defaults to list view when specified', () => {
    render(<DashboardPage workflows={mockWorkflows} defaultViewMode="list" />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('shows error state when error prop is provided', () => {
    render(<DashboardPage workflows={[]} error="Failed to fetch workflows" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to load workflows')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch workflows')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked in error state', () => {
    const onRetry = vi.fn();
    render(
      <DashboardPage workflows={[]} error="Server error" onRetry={onRetry} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('error state takes priority over loading state', () => {
    render(
      <DashboardPage workflows={[]} loading error="Connection failed" />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Loading workflows…')).not.toBeInTheDocument();
  });
});
