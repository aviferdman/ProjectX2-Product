import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../src/components/ErrorBoundary.js';

// A component that throws during render
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test render error');
  }
  return <div>Content rendered successfully</div>;
}

// Suppress console.error for error boundary tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('renders default fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test render error')).toBeInTheDocument();
  });

  it('renders custom heading and message in default fallback', () => {
    render(
      <ErrorBoundary heading="Canvas Error" message="The canvas failed to load.">
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Canvas Error')).toBeInTheDocument();
    expect(screen.getByText('The canvas failed to load.')).toBeInTheDocument();
  });

  it('renders custom fallback ReactNode', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback UI</div>}>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom fallback UI')).toBeInTheDocument();
  });

  it('renders custom fallback render prop with error info', () => {
    render(
      <ErrorBoundary
        fallback={({ error }) => (
          <div>Error: {error.message}</div>
        )}
      >
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Error: Test render error')).toBeInTheDocument();
  });

  it('calls onError callback when error is caught', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Test render error');
  });

  it('resets error state when retry is clicked', () => {
    const onReset = vi.fn();
    let shouldThrow = true;

    function Conditional() {
      if (shouldThrow) throw new Error('Temporary error');
      return <div>Recovered content</div>;
    }

    const { rerender } = render(
      <ErrorBoundary onReset={onReset}>
        <Conditional />
      </ErrorBoundary>,
    );

    // Error state
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Fix the error condition and click retry
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(onReset).toHaveBeenCalledOnce();
    // After reset, re-render should succeed
    rerender(
      <ErrorBoundary onReset={onReset}>
        <Conditional />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });

  it('renders custom fallback render prop with resetErrorBoundary', () => {
    let shouldThrow = true;

    function Conditional() {
      if (shouldThrow) throw new Error('Error');
      return <div>Fixed</div>;
    }

    const { rerender } = render(
      <ErrorBoundary
        fallback={({ resetErrorBoundary }) => (
          <button onClick={resetErrorBoundary}>Reset</button>
        )}
      >
        <Conditional />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    rerender(
      <ErrorBoundary
        fallback={({ resetErrorBoundary }) => (
          <button onClick={resetErrorBoundary}>Reset</button>
        )}
      >
        <Conditional />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Fixed')).toBeInTheDocument();
  });
});
