/**
 * Tests for UseTemplateDialog — TASK-161
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { UseTemplateDialog } from '../src/components/templates/UseTemplateDialog.js';
import type { TemplateSummary } from '../src/components/templates/types.js';
import type {
  InstantiationResult,
  InstantiationStatus,
} from '../src/hooks/useTemplateInstantiation.js';

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

const mockResult: InstantiationResult = {
  workflowId: 'wf-42',
  templateId: 'tpl-1',
  workflowName: 'My Research Pipeline',
  instantiatedAt: '2026-04-10T00:00:00.000Z',
};

/* ---------- Helpers ---------- */

function renderDialog(overrides: {
  template?: TemplateSummary | null;
  status?: InstantiationStatus;
  result?: InstantiationResult | null;
  error?: string | null;
  onConfirm?: () => void;
  onCancel?: () => void;
  onDone?: () => void;
  onGoToWorkflow?: (id: string) => void;
} = {}) {
  const defaultProps = {
    template: mockTemplate,
    status: 'configuring' as InstantiationStatus,
    result: null,
    error: null,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    onDone: vi.fn(),
  };
  const props = { ...defaultProps, ...overrides };
  return render(<UseTemplateDialog {...props} />);
}

/* ================================================================== */
/* Tests                                                               */
/* ================================================================== */

describe('UseTemplateDialog', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /* ---- Visibility ---- */

  it('renders nothing when template is null', () => {
    const { container } = renderDialog({ template: null });
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when status is idle', () => {
    const { container } = renderDialog({ status: 'idle' });
    expect(container.firstChild).toBeNull();
  });

  /* ---- Configuring state ---- */

  it('renders dialog with correct title when configuring', () => {
    renderDialog({ status: 'configuring' });
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute(
      'aria-label',
      'Use Template: Research Assistant',
    );
  });

  it('renders form with pre-filled workflow name', () => {
    renderDialog({ status: 'configuring' });
    const nameInput = screen.getByLabelText('Workflow Name');
    expect(nameInput).toHaveValue('Research Assistant');
  });

  it('renders form with pre-filled description', () => {
    renderDialog({ status: 'configuring' });
    const descInput = screen.getByLabelText(/Description/);
    expect(descInput).toHaveValue(
      'Automated research pipeline with web scraping and summarization',
    );
  });

  it('shows template meta info (agents, tasks, category)', () => {
    renderDialog({ status: 'configuring' });
    expect(screen.getByText('2 agents')).toBeInTheDocument();
    expect(screen.getByText('4 tasks')).toBeInTheDocument();
    expect(screen.getByText('Research')).toBeInTheDocument();
  });

  it('calls onConfirm with form values when form is submitted', () => {
    const onConfirm = vi.fn();
    renderDialog({ status: 'configuring', onConfirm });

    const form = screen.getByTestId('instantiate-form');
    fireEvent.submit(form);

    expect(onConfirm).toHaveBeenCalledWith({
      workflowName: 'Research Assistant',
      workflowDescription:
        'Automated research pipeline with web scraping and summarization',
    });
  });

  it('calls onConfirm with custom name when user edits the input', () => {
    const onConfirm = vi.fn();
    renderDialog({ status: 'configuring', onConfirm });

    const nameInput = screen.getByLabelText('Workflow Name');
    fireEvent.change(nameInput, { target: { value: 'Custom Pipeline' } });

    const form = screen.getByTestId('instantiate-form');
    fireEvent.submit(form);

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ workflowName: 'Custom Pipeline' }),
    );
  });

  it('does not submit when workflow name is empty', () => {
    const onConfirm = vi.fn();
    renderDialog({ status: 'configuring', onConfirm });

    const nameInput = screen.getByLabelText('Workflow Name');
    fireEvent.change(nameInput, { target: { value: '' } });

    const form = screen.getByTestId('instantiate-form');
    fireEvent.submit(form);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('does not submit when workflow name is only whitespace', () => {
    const onConfirm = vi.fn();
    renderDialog({ status: 'configuring', onConfirm });

    const nameInput = screen.getByLabelText('Workflow Name');
    fireEvent.change(nameInput, { target: { value: '   ' } });

    const form = screen.getByTestId('instantiate-form');
    fireEvent.submit(form);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('omits workflowDescription when description is blank', () => {
    const onConfirm = vi.fn();
    renderDialog({ status: 'configuring', onConfirm });

    const descInput = screen.getByLabelText(/Description/);
    fireEvent.change(descInput, { target: { value: '' } });

    const form = screen.getByTestId('instantiate-form');
    fireEvent.submit(form);

    expect(onConfirm).toHaveBeenCalledWith({
      workflowName: 'Research Assistant',
    });
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    renderDialog({ status: 'configuring', onCancel });

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when close icon is clicked', () => {
    const onCancel = vi.fn();
    renderDialog({ status: 'configuring', onCancel });

    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel on Escape key during configuring', () => {
    const onCancel = vi.fn();
    renderDialog({ status: 'configuring', onCancel });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  /* ---- Instantiating (loading) state ---- */

  it('shows loading state when status is instantiating', () => {
    renderDialog({ status: 'instantiating' });
    expect(screen.getByTestId('instantiate-loading')).toBeInTheDocument();
    expect(screen.getByText('Creating your workflow…')).toBeInTheDocument();
  });

  it('has correct dialog title while instantiating', () => {
    renderDialog({ status: 'instantiating' });
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-label',
      'Creating Workflow…',
    );
  });

  it('does not render close button while instantiating', () => {
    renderDialog({ status: 'instantiating' });
    expect(screen.queryByLabelText('Close dialog')).toBeNull();
  });

  /* ---- Success state ---- */

  it('shows success state with result info', () => {
    renderDialog({
      status: 'success',
      result: mockResult,
    });
    expect(screen.getByTestId('instantiate-success')).toBeInTheDocument();
    expect(screen.getByText('Workflow Created')).toBeInTheDocument();
    expect(screen.getByText('My Research Pipeline')).toBeInTheDocument();
  });

  it('calls onDone when Close button is clicked on success', () => {
    const onDone = vi.fn();
    renderDialog({ status: 'success', result: mockResult, onDone });

    fireEvent.click(screen.getByText('Close'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('renders Go to Workflow button when onGoToWorkflow is provided', () => {
    const onGoToWorkflow = vi.fn();
    renderDialog({
      status: 'success',
      result: mockResult,
      onGoToWorkflow,
    });

    const btn = screen.getByLabelText('Go to workflow');
    expect(btn).toBeInTheDocument();
  });

  it('calls onGoToWorkflow with workflow ID on click', () => {
    const onGoToWorkflow = vi.fn();
    renderDialog({
      status: 'success',
      result: mockResult,
      onGoToWorkflow,
    });

    fireEvent.click(screen.getByLabelText('Go to workflow'));
    expect(onGoToWorkflow).toHaveBeenCalledWith('wf-42');
  });

  it('does not render Go to Workflow button without handler', () => {
    renderDialog({ status: 'success', result: mockResult });
    expect(screen.queryByLabelText('Go to workflow')).toBeNull();
  });

  it('calls onDone on Escape key during success', () => {
    const onDone = vi.fn();
    renderDialog({ status: 'success', result: mockResult, onDone });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  /* ---- Error state ---- */

  it('shows error state with message', () => {
    renderDialog({
      status: 'error',
      error: 'Template not found',
    });
    expect(screen.getByTestId('instantiate-error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Template not found')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked on error', () => {
    const onCancel = vi.fn();
    renderDialog({ status: 'error', error: 'fail', onCancel });

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Try Again is clicked on error', () => {
    const onConfirm = vi.fn();
    renderDialog({ status: 'error', error: 'fail', onConfirm });

    fireEvent.click(screen.getByLabelText('Try again'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('has correct dialog title on error', () => {
    renderDialog({ status: 'error', error: 'fail' });
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Error');
  });

  /* ---- Accessibility ---- */

  it('has correct ARIA attributes on dialog', () => {
    renderDialog({ status: 'configuring' });
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label');
  });

  it('renders overlay with presentation role', () => {
    renderDialog({ status: 'configuring' });
    expect(screen.getByTestId('instantiate-overlay')).toHaveAttribute(
      'role',
      'presentation',
    );
  });

  it('renders loading state with status role', () => {
    renderDialog({ status: 'instantiating' });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  /* ---- Create Workflow button ---- */

  it('renders Create Workflow button with correct aria-label', () => {
    renderDialog({ status: 'configuring' });
    expect(
      screen.getByLabelText('Create workflow from template'),
    ).toBeInTheDocument();
  });

  it('disables Create Workflow when name is empty', () => {
    renderDialog({ status: 'configuring' });
    const nameInput = screen.getByLabelText('Workflow Name');
    fireEvent.change(nameInput, { target: { value: '' } });

    const btn = screen.getByLabelText('Create workflow from template');
    expect(btn).toBeDisabled();
  });
});
