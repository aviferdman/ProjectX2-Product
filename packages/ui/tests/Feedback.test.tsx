/**
 * TASK-182: Tests for StatusEmpty, StatusLoading, StatusSuccess, Toast,
 * ToastContainer, AsyncStateView components and useToast hook.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StatusEmpty } from '../src/components/feedback/StatusEmpty.js';
import { StatusLoading } from '../src/components/feedback/StatusLoading.js';
import { StatusSuccess } from '../src/components/feedback/StatusSuccess.js';
import { Toast } from '../src/components/feedback/Toast.js';
import { ToastContainer } from '../src/components/feedback/ToastContainer.js';
import { AsyncStateView } from '../src/components/feedback/AsyncStateView.js';
import type { AsyncState, ToastEntry } from '../src/components/feedback/types.js';

/* ------------------------------------------------------------------ */
/* StatusEmpty                                                         */
/* ------------------------------------------------------------------ */
describe('StatusEmpty', () => {
  it('renders default heading and description', () => {
    render(<StatusEmpty />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display.')).toBeInTheDocument();
  });

  it('renders custom heading and description', () => {
    render(<StatusEmpty heading="No results" description="Try a different search." />);
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('Try a different search.')).toBeInTheDocument();
  });

  it('renders action button when onAction and actionLabel are provided', () => {
    const onAction = vi.fn();
    render(<StatusEmpty actionLabel="Create" onAction={onAction} />);
    const btn = screen.getByRole('button', { name: /create/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('does not render action button when actionLabel is missing', () => {
    render(<StatusEmpty onAction={() => {}} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders secondary action button', () => {
    const onSecondary = vi.fn();
    render(<StatusEmpty secondaryLabel="Go Back" onSecondary={onSecondary} />);
    const btn = screen.getByRole('button', { name: /go back/i });
    fireEvent.click(btn);
    expect(onSecondary).toHaveBeenCalledOnce();
  });

  it('applies compact variant class', () => {
    render(<StatusEmpty compact />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('py-8');
    expect(el.className).not.toContain('py-16');
  });

  it('forwards ref', () => {
    let element: HTMLDivElement | null = null;
    render(<StatusEmpty ref={(el) => { element = el; }} />);
    expect(element).toBeInstanceOf(HTMLDivElement);
  });

  it('merges custom className', () => {
    render(<StatusEmpty className="my-class" />);
    expect(screen.getByRole('status').className).toContain('my-class');
  });

  it('renders custom icon', () => {
    render(<StatusEmpty icon={<span data-testid="custom-icon">★</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* StatusLoading                                                       */
/* ------------------------------------------------------------------ */
describe('StatusLoading', () => {
  it('renders with role="status"', () => {
    render(<StatusLoading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders a loading message', () => {
    render(<StatusLoading message="Fetching data…" />);
    expect(screen.getByText('Fetching data…')).toBeInTheDocument();
  });

  it('renders a progress bar when progress is set', () => {
    render(<StatusLoading progress={42} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
  });

  it('does not render progress bar when progress is not set', () => {
    render(<StatusLoading />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('applies overlay styles', () => {
    render(<StatusLoading overlay />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('absolute');
    expect(el.className).toContain('inset-0');
  });

  it('applies compact styles', () => {
    render(<StatusLoading compact />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('py-8');
    expect(el.className).not.toContain('py-16');
  });

  it('clamps progress between 0 and 100', () => {
    render(<StatusLoading progress={150} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.style.width).toBe('100%');
  });

  it('forwards ref', () => {
    let element: HTMLDivElement | null = null;
    render(<StatusLoading ref={(el) => { element = el; }} />);
    expect(element).toBeInstanceOf(HTMLDivElement);
  });

  it('uses message as aria-label', () => {
    render(<StatusLoading message="Loading agents" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading agents');
  });
});

/* ------------------------------------------------------------------ */
/* StatusSuccess                                                       */
/* ------------------------------------------------------------------ */
describe('StatusSuccess', () => {
  it('renders default heading', () => {
    render(<StatusSuccess />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('renders custom heading and message', () => {
    render(<StatusSuccess heading="Workflow created" message="Your workflow is ready." />);
    expect(screen.getByText('Workflow created')).toBeInTheDocument();
    expect(screen.getByText('Your workflow is ready.')).toBeInTheDocument();
  });

  it('renders action button', () => {
    const onAction = vi.fn();
    render(<StatusSuccess actionLabel="Open" onAction={onAction} />);
    const btn = screen.getByRole('button', { name: /open/i });
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('renders secondary action', () => {
    const onSecondary = vi.fn();
    render(<StatusSuccess secondaryLabel="Dismiss" onSecondary={onSecondary} />);
    const btn = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(btn);
    expect(onSecondary).toHaveBeenCalledOnce();
  });

  it('applies compact variant', () => {
    render(<StatusSuccess compact />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('py-8');
  });

  it('renders custom icon', () => {
    render(<StatusSuccess icon={<span data-testid="custom">✓</span>} />);
    expect(screen.getByTestId('custom')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    let element: HTMLDivElement | null = null;
    render(<StatusSuccess ref={(el) => { element = el; }} />);
    expect(element).toBeInstanceOf(HTMLDivElement);
  });

  it('applies emerald border style', () => {
    render(<StatusSuccess />);
    expect(screen.getByRole('status').className).toContain('border-emerald-800/50');
  });
});

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */
describe('Toast', () => {
  it('renders title and message', () => {
    render(<Toast title="Saved" message="Changes have been saved." />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Changes have been saved.')).toBeInTheDocument();
  });

  it('renders dismiss button when dismissible', () => {
    const onDismiss = vi.fn();
    render(<Toast title="Note" dismissible onDismiss={onDismiss} />);
    const btn = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(btn);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('does not render dismiss button when not dismissible', () => {
    render(<Toast title="Note" dismissible={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('auto-dismisses after duration', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast title="Auto" duration={3000} onDismiss={onDismiss} />);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(onDismiss).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('does not auto-dismiss when duration is 0', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast title="Sticky" duration={0} onDismiss={onDismiss} />);
    vi.advanceTimersByTime(10000);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('applies success variant styles', () => {
    render(<Toast title="Done" variant="success" />);
    expect(screen.getByRole('alert').className).toContain('border-emerald-800/50');
  });

  it('applies error variant styles', () => {
    render(<Toast title="Failed" variant="error" />);
    expect(screen.getByRole('alert').className).toContain('border-red-800/50');
  });

  it('applies warning variant styles', () => {
    render(<Toast title="Warn" variant="warning" />);
    expect(screen.getByRole('alert').className).toContain('border-amber-800/50');
  });

  it('applies info variant styles', () => {
    render(<Toast title="Info" variant="info" />);
    expect(screen.getByRole('alert').className).toContain('border-sky-800/50');
  });

  it('forwards ref', () => {
    let element: HTMLDivElement | null = null;
    render(<Toast title="Ref" ref={(el) => { element = el; }} />);
    expect(element).toBeInstanceOf(HTMLDivElement);
  });
});

/* ------------------------------------------------------------------ */
/* ToastContainer                                                      */
/* ------------------------------------------------------------------ */
describe('ToastContainer', () => {
  const sampleToasts: ToastEntry[] = [
    { id: '1', variant: 'success', title: 'Saved' },
    { id: '2', variant: 'error', title: 'Failed', message: 'Network error' },
  ];

  it('renders all toasts', () => {
    render(<ToastContainer toasts={sampleToasts} />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders nothing when toasts list is empty', () => {
    const { container } = render(<ToastContainer toasts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onDismiss with correct id', () => {
    const onDismiss = vi.fn();
    render(<ToastContainer toasts={sampleToasts} onDismiss={onDismiss} />);
    const buttons = screen.getAllByRole('button', { name: /dismiss/i });
    fireEvent.click(buttons[0]);
    expect(onDismiss).toHaveBeenCalledWith('1');
  });

  it('applies position class top-right by default', () => {
    render(<ToastContainer toasts={sampleToasts} />);
    const container = screen.getByLabelText('Notifications');
    expect(container.className).toContain('top-4');
    expect(container.className).toContain('right-4');
  });

  it('applies bottom-center position class', () => {
    render(<ToastContainer toasts={sampleToasts} position="bottom-center" />);
    const container = screen.getByLabelText('Notifications');
    expect(container.className).toContain('bottom-4');
  });

  it('has aria-live="polite"', () => {
    render(<ToastContainer toasts={sampleToasts} />);
    expect(screen.getByLabelText('Notifications')).toHaveAttribute('aria-live', 'polite');
  });
});

/* ------------------------------------------------------------------ */
/* AsyncStateView                                                      */
/* ------------------------------------------------------------------ */
describe('AsyncStateView', () => {
  it('renders loading state', () => {
    const state: AsyncState<string[]> = { status: 'loading', data: null, error: null };
    render(<AsyncStateView state={state}>Content</AsyncStateView>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders loading state with custom message', () => {
    const state: AsyncState<string[]> = { status: 'loading', data: null, error: null };
    render(
      <AsyncStateView state={state} loadingMessage="Fetching workflows…">
        Content
      </AsyncStateView>,
    );
    expect(screen.getByText('Fetching workflows…')).toBeInTheDocument();
  });

  it('renders error state with error message', () => {
    const state: AsyncState<string[]> = {
      status: 'error',
      data: null,
      error: new Error('Network timeout'),
    };
    render(<AsyncStateView state={state}>Content</AsyncStateView>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
  });

  it('renders retry button in error state', () => {
    const onRetry = vi.fn();
    const state: AsyncState<string[]> = {
      status: 'error',
      data: null,
      error: new Error('Fail'),
    };
    render(
      <AsyncStateView state={state} onRetry={onRetry}>
        Content
      </AsyncStateView>,
    );
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders custom error heading and message', () => {
    const state: AsyncState<string[]> = {
      status: 'error',
      data: null,
      error: new Error('Fail'),
    };
    render(
      <AsyncStateView
        state={state}
        errorHeading="Connection lost"
        errorMessage="Check your internet."
      >
        Content
      </AsyncStateView>,
    );
    expect(screen.getByText('Connection lost')).toBeInTheDocument();
    expect(screen.getByText('Check your internet.')).toBeInTheDocument();
  });

  it('renders empty state when data is empty array', () => {
    const state: AsyncState<string[]> = { status: 'success', data: [], error: null };
    render(
      <AsyncStateView state={state} emptyHeading="No items" emptyDescription="Add some.">
        Content
      </AsyncStateView>,
    );
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Add some.')).toBeInTheDocument();
  });

  it('renders empty state with action', () => {
    const onEmpty = vi.fn();
    const state: AsyncState<string[]> = { status: 'success', data: [], error: null };
    render(
      <AsyncStateView
        state={state}
        emptyActionLabel="Create"
        onEmptyAction={onEmpty}
      >
        Content
      </AsyncStateView>,
    );
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    expect(onEmpty).toHaveBeenCalledOnce();
  });

  it('renders children when data is present', () => {
    const state: AsyncState<string[]> = {
      status: 'success',
      data: ['a', 'b'],
      error: null,
    };
    render(
      <AsyncStateView state={state}>
        <p>Items loaded</p>
      </AsyncStateView>,
    );
    expect(screen.getByText('Items loaded')).toBeInTheDocument();
  });

  it('supports render function children', () => {
    const state: AsyncState<string[]> = {
      status: 'success',
      data: ['a', 'b'],
      error: null,
    };
    render(
      <AsyncStateView state={state}>
        {(data: string[]) => <p>Count: {data.length}</p>}
      </AsyncStateView>,
    );
    expect(screen.getByText('Count: 2')).toBeInTheDocument();
  });

  it('uses custom isEmpty predicate', () => {
    const state: AsyncState<{ items: string[] }> = {
      status: 'success',
      data: { items: [] },
      error: null,
    };
    render(
      <AsyncStateView
        state={state}
        isEmpty={(d: { items: string[] }) => d.items.length === 0}
        emptyHeading="Empty list"
      >
        Content
      </AsyncStateView>,
    );
    expect(screen.getByText('Empty list')).toBeInTheDocument();
  });

  it('renders empty div for idle state', () => {
    const state: AsyncState<string[]> = { status: 'idle', data: null, error: null };
    const { container } = render(<AsyncStateView state={state}>Content</AsyncStateView>);
    const view = container.querySelector('.cs-async-state-view');
    expect(view).toBeInTheDocument();
    expect(view?.children.length).toBe(0);
  });

  it('renders empty state when data is null on success', () => {
    const state: AsyncState<string[] | null> = { status: 'success', data: null, error: null };
    render(<AsyncStateView state={state}>Content</AsyncStateView>);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    let element: HTMLDivElement | null = null;
    const state: AsyncState<string[]> = { status: 'idle', data: null, error: null };
    render(<AsyncStateView state={state} ref={(el) => { element = el; }}>Content</AsyncStateView>);
    expect(element).toBeInstanceOf(HTMLDivElement);
  });
});
