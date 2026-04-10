/**
 * ErrorBoundary — React error boundary for catching render-time errors.
 * TASK-181: Error handling and edge cases
 *
 * Catches JavaScript errors in child component tree and renders a fallback UI.
 * Supports custom fallback, retry (via remount), and error callbacks.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback.js';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI. Receives error, resetErrorBoundary function. */
  fallback?:
    | ReactNode
    | ((props: { error: Error; resetErrorBoundary: () => void }) => ReactNode)
    | undefined;
  /** Callback when an error is caught */
  onError?: ((error: Error, errorInfo: ErrorInfo) => void) | undefined;
  /** Callback when the boundary resets */
  onReset?: (() => void) | undefined;
  /** Heading text for the default fallback */
  heading?: string | undefined;
  /** Message text for the default fallback */
  message?: string | undefined;
}

export interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static displayName = 'ErrorBoundary';

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  resetErrorBoundary = (): void => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    const { children, fallback, heading, message } = this.props;

    if (error !== null) {
      // Custom fallback (render prop)
      if (typeof fallback === 'function') {
        return fallback({ error, resetErrorBoundary: this.resetErrorBoundary });
      }

      // Custom fallback (ReactNode)
      if (fallback !== undefined) {
        return fallback;
      }

      // Default fallback
      return (
        <ErrorFallback
          heading={heading ?? 'Something went wrong'}
          message={message ?? error.message}
          onRetry={this.resetErrorBoundary}
        />
      );
    }

    return children;
  }
}
