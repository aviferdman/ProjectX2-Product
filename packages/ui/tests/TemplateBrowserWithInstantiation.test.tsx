/**
 * Tests for TemplateBrowserWithInstantiation — TASK-161
 *
 * Integration tests verifying the full browse → preview → instantiate flow.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { TemplateBrowserWithInstantiation } from '../src/components/templates/TemplateBrowserWithInstantiation.js';
import type { TemplateSummary } from '../src/components/templates/types.js';
import type { InstantiationResult } from '../src/hooks/useTemplateInstantiation.js';

/* ---------- Mock data ---------- */

const mockTemplates: TemplateSummary[] = [
  {
    id: 'tpl-1',
    name: 'Research Pipeline',
    description: 'Automated research workflow with web scraping',
    category: 'research',
    tags: ['research', 'scraping'],
    author: 'Crewspace',
    usageCount: 100,
    agentCount: 2,
    taskCount: 3,
    featured: true,
    popular: false,
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-03-20T00:00:00Z',
  },
  {
    id: 'tpl-2',
    name: 'Code Review Bot',
    description: 'Automated code review pipeline',
    category: 'code',
    tags: ['code', 'review'],
    author: 'DevTeam',
    usageCount: 50,
    agentCount: 1,
    taskCount: 2,
    featured: false,
    popular: true,
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: '2026-03-25T00:00:00Z',
  },
];

const mockResult: InstantiationResult = {
  workflowId: 'wf-42',
  templateId: 'tpl-1',
  workflowName: 'Research Pipeline',
  instantiatedAt: '2026-04-10T00:00:00.000Z',
};

/* ---------- Helpers ---------- */

function renderBrowser(
  overrides: Partial<React.ComponentProps<typeof TemplateBrowserWithInstantiation>> = {},
) {
  const defaultProps = {
    templates: mockTemplates,
    onInstantiate: vi.fn().mockResolvedValue(mockResult),
    ...overrides,
  };
  return render(<TemplateBrowserWithInstantiation {...defaultProps} />);
}

/* ================================================================== */
/* Tests                                                               */
/* ================================================================== */

describe('TemplateBrowserWithInstantiation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /* ---- Rendering ---- */

  it('renders the template browser page', () => {
    renderBrowser();
    expect(screen.getByText('Template Library')).toBeInTheDocument();
  });

  it('renders all templates', () => {
    renderBrowser();
    expect(screen.getByText('Research Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Code Review Bot')).toBeInTheDocument();
  });

  it('renders container with test id', () => {
    renderBrowser();
    expect(screen.getByTestId('template-browser-with-instantiation')).toBeInTheDocument();
  });

  it('passes loading state to browser', () => {
    renderBrowser({ loading: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  /* ---- Preview flow ---- */

  it('opens preview modal when preview is triggered', () => {
    renderBrowser();
    // Click the Preview button on a card (appears on hover)
    const previewBtn = screen.getByLabelText('Preview Research Pipeline');
    fireEvent.click(previewBtn);
    // Preview modal should appear
    expect(screen.getByTestId('preview-overlay')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Preview: Research Pipeline');
  });

  it('closes preview modal on close', () => {
    renderBrowser();
    // Open preview
    const previewBtn = screen.getByLabelText('Preview Research Pipeline');
    fireEvent.click(previewBtn);
    expect(screen.getByTestId('preview-overlay')).toBeInTheDocument();

    // Close via Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('preview-overlay')).toBeNull();
  });

  /* ---- Instantiation flow from browser ---- */

  it('opens instantiation dialog when Use Template is clicked on card', () => {
    renderBrowser();
    // Hover over card and click "Use" button
    const cards = screen.getAllByRole('article');
    const firstCard = cards[0];

    // Find the "Use" button within the card
    const useBtn = within(firstCard).getByLabelText(/use template/i);
    fireEvent.click(useBtn);

    // Instantiation dialog should appear
    expect(screen.getByTestId('instantiate-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('instantiate-form')).toBeInTheDocument();
  });

  it('pre-fills form with template name when instantiation starts', () => {
    renderBrowser();
    const cards = screen.getAllByRole('article');
    const useBtn = within(cards[0]).getByLabelText(/use template/i);
    fireEvent.click(useBtn);

    const nameInput = screen.getByLabelText('Workflow Name');
    expect(nameInput).toHaveValue('Research Pipeline');
  });

  /* ---- Full instantiation success flow ---- */

  it('completes full instantiation flow', async () => {
    const onInstantiate = vi.fn().mockResolvedValue(mockResult);
    const onSuccess = vi.fn();

    renderBrowser({ onInstantiate, onSuccess });

    // Start instantiation
    const cards = screen.getAllByRole('article');
    const useBtn = within(cards[0]).getByLabelText(/use template/i);
    fireEvent.click(useBtn);

    // Submit the form
    const form = screen.getByTestId('instantiate-form');
    fireEvent.submit(form);

    // Wait for success
    await waitFor(() => {
      expect(screen.getByTestId('instantiate-success')).toBeInTheDocument();
    });

    expect(screen.getByText('Workflow Created')).toBeInTheDocument();
    expect(onInstantiate).toHaveBeenCalledWith(
      'tpl-1',
      expect.objectContaining({
        workflowName: 'Research Pipeline',
      }),
    );
    expect(onSuccess).toHaveBeenCalledWith(mockResult);
  });

  /* ---- Instantiation error flow ---- */

  it('shows error state when instantiation fails', async () => {
    const onInstantiate = vi.fn().mockRejectedValue(new Error('Network error'));
    const onError = vi.fn();

    renderBrowser({ onInstantiate, onError });

    // Start instantiation
    const cards = screen.getAllByRole('article');
    const useBtn = within(cards[0]).getByLabelText(/use template/i);
    fireEvent.click(useBtn);

    // Submit
    const form = screen.getByTestId('instantiate-form');
    fireEvent.submit(form);

    // Wait for error
    await waitFor(() => {
      expect(screen.getByTestId('instantiate-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  /* ---- Cancel instantiation ---- */

  it('cancels instantiation and returns to browse', () => {
    renderBrowser();

    // Start instantiation
    const cards = screen.getAllByRole('article');
    const useBtn = within(cards[0]).getByLabelText(/use template/i);
    fireEvent.click(useBtn);

    expect(screen.getByTestId('instantiate-form')).toBeInTheDocument();

    // Cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Dialog should be gone
    expect(screen.queryByTestId('instantiate-overlay')).toBeNull();
    expect(screen.queryByTestId('instantiate-form')).toBeNull();
  });

  /* ---- Go to workflow ---- */

  it('calls onGoToWorkflow with workflow ID when user clicks Go to Workflow', async () => {
    const onGoToWorkflow = vi.fn();
    const onInstantiate = vi.fn().mockResolvedValue(mockResult);

    renderBrowser({ onInstantiate, onGoToWorkflow });

    // Start and complete instantiation
    const cards = screen.getAllByRole('article');
    const useBtn = within(cards[0]).getByLabelText(/use template/i);
    fireEvent.click(useBtn);

    const form = screen.getByTestId('instantiate-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('instantiate-success')).toBeInTheDocument();
    });

    // Click "Go to Workflow"
    fireEvent.click(screen.getByLabelText('Go to workflow'));
    expect(onGoToWorkflow).toHaveBeenCalledWith('wf-42');
  });

  /* ---- Done after success resets state ---- */

  it('resets state when Done is clicked after success', async () => {
    const onInstantiate = vi.fn().mockResolvedValue(mockResult);
    renderBrowser({ onInstantiate });

    // Complete instantiation
    const cards = screen.getAllByRole('article');
    const useBtn = within(cards[0]).getByLabelText(/use template/i);
    fireEvent.click(useBtn);

    fireEvent.submit(screen.getByTestId('instantiate-form'));

    await waitFor(() => {
      expect(screen.getByTestId('instantiate-success')).toBeInTheDocument();
    });

    // Click Close (done)
    fireEvent.click(screen.getByText('Close'));

    // Dialog should be gone, back to browse
    expect(screen.queryByTestId('instantiate-overlay')).toBeNull();
    expect(screen.getByText('Template Library')).toBeInTheDocument();
  });

  /* ---- Preview → Use flow ---- */

  it('transitions from preview to instantiation when Use Template is clicked in preview', () => {
    renderBrowser();

    // Open preview first via Preview button on card
    const previewBtn = screen.getByLabelText('Preview Research Pipeline');
    fireEvent.click(previewBtn);

    // Verify preview is open
    expect(screen.getByTestId('preview-overlay')).toBeInTheDocument();

    // Click "Use Template" in the preview dialog (not the card's button)
    const dialog = screen.getByRole('dialog');
    const useBtn = within(dialog).getByLabelText('Use template Research Pipeline');
    fireEvent.click(useBtn);

    // Preview should close, instantiation dialog should open
    expect(screen.queryByTestId('preview-overlay')).toBeNull();
    expect(screen.getByTestId('instantiate-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('instantiate-form')).toBeInTheDocument();
  });

  /* ---- Custom workflow name ---- */

  it('passes custom workflow name to onInstantiate', async () => {
    const onInstantiate = vi.fn().mockResolvedValue({
      ...mockResult,
      workflowName: 'My Custom Name',
    });

    renderBrowser({ onInstantiate });

    // Start instantiation
    const cards = screen.getAllByRole('article');
    const useBtn = within(cards[0]).getByLabelText(/use template/i);
    fireEvent.click(useBtn);

    // Change the name
    const nameInput = screen.getByLabelText('Workflow Name');
    fireEvent.change(nameInput, { target: { value: 'My Custom Name' } });

    // Submit
    fireEvent.submit(screen.getByTestId('instantiate-form'));

    await waitFor(() => {
      expect(onInstantiate).toHaveBeenCalledWith(
        'tpl-1',
        expect.objectContaining({
          workflowName: 'My Custom Name',
        }),
      );
    });
  });

  /* ---- Second template ---- */

  it('can instantiate a different template', async () => {
    const onInstantiate = vi.fn().mockResolvedValue({
      ...mockResult,
      templateId: 'tpl-2',
      workflowName: 'Code Review Bot',
    });

    renderBrowser({ onInstantiate });

    const cards = screen.getAllByRole('article');
    const useBtn = within(cards[1]).getByLabelText(/use template/i);
    fireEvent.click(useBtn);

    const nameInput = screen.getByLabelText('Workflow Name');
    expect(nameInput).toHaveValue('Code Review Bot');

    fireEvent.submit(screen.getByTestId('instantiate-form'));

    await waitFor(() => {
      expect(onInstantiate).toHaveBeenCalledWith(
        'tpl-2',
        expect.objectContaining({
          workflowName: 'Code Review Bot',
        }),
      );
    });
  });

  /* ---- No Go to Workflow without handler ---- */

  it('does not show Go to Workflow button when no handler is provided', async () => {
    const onInstantiate = vi.fn().mockResolvedValue(mockResult);
    renderBrowser({ onInstantiate });

    const cards = screen.getAllByRole('article');
    const useBtn = within(cards[0]).getByLabelText(/use template/i);
    fireEvent.click(useBtn);

    fireEvent.submit(screen.getByTestId('instantiate-form'));

    await waitFor(() => {
      expect(screen.getByTestId('instantiate-success')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText('Go to workflow')).toBeNull();
  });

  /* ---- Empty templates ---- */

  it('renders empty state when no templates provided', () => {
    renderBrowser({ templates: [] });
    expect(screen.getByText('No templates yet')).toBeInTheDocument();
  });
});
