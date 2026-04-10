import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorFallback } from '../src/components/ErrorFallback.js';

describe('ErrorFallback', () => {
  it('renders with default heading and message', () => {
    render(<ErrorFallback />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText('An unexpected error occurred. Please try again.'),
    ).toBeInTheDocument();
  });

  it('renders custom heading and message', () => {
    render(
      <ErrorFallback
        heading="Connection failed"
        message="Could not reach the server."
      />,
    );
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(
      screen.getByText('Could not reach the server.'),
    ).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorFallback onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorFallback />);
    expect(
      screen.queryByRole('button', { name: /try again/i }),
    ).not.toBeInTheDocument();
  });

  it('renders custom retry label', () => {
    render(<ErrorFallback onRetry={() => {}} retryLabel="Reload Data" />);
    expect(
      screen.getByRole('button', { name: /reload data/i }),
    ).toBeInTheDocument();
  });

  it('renders secondary action button', () => {
    const onSecondary = vi.fn();
    render(
      <ErrorFallback
        onSecondary={onSecondary}
        secondaryLabel="Go Back"
      />,
    );

    const secondaryButton = screen.getByRole('button', { name: /go back/i });
    expect(secondaryButton).toBeInTheDocument();
    fireEvent.click(secondaryButton);
    expect(onSecondary).toHaveBeenCalledOnce();
  });

  it('does not render secondary button without both label and handler', () => {
    render(<ErrorFallback secondaryLabel="Go Back" />);
    expect(
      screen.queryByRole('button', { name: /go back/i }),
    ).not.toBeInTheDocument();
  });

  it('applies error severity styling by default', () => {
    render(<ErrorFallback />);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('border-red-800/50');
  });

  it('applies warning severity styling', () => {
    render(<ErrorFallback severity="warning" />);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('border-amber-800/50');
  });

  it('renders inline variant without border/padding', () => {
    render(<ErrorFallback inline />);
    const alert = screen.getByRole('alert');
    expect(alert.className).not.toContain('border');
    expect(alert.className).not.toContain('py-16');
  });

  it('merges custom className', () => {
    render(<ErrorFallback className="my-custom-class" />);
    expect(screen.getByRole('alert').className).toContain('my-custom-class');
  });

  it('forwards ref', () => {
    let element: HTMLDivElement | null = null;
    render(<ErrorFallback ref={(el) => { element = el; }} />);
    expect(element).toBeInstanceOf(HTMLDivElement);
  });

  it('has role="alert" for accessibility', () => {
    render(<ErrorFallback />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
