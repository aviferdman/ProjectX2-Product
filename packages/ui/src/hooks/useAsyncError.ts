/**
 * useAsyncError — Hook for standardized async error handling with retry.
 * TASK-181: Error handling and edge cases
 *
 * Wraps an async operation with loading/error/success state tracking,
 * automatic retry support, and error normalization.
 */
import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseAsyncErrorOptions {
  /** Maximum number of retry attempts (default: 0 = no retry) */
  maxRetries?: number;
  /** Delay between retries in ms (default: 1000). Doubles on each retry. */
  retryDelayMs?: number;
  /** Callback when error occurs (after all retries exhausted) */
  onError?: (error: Error) => void;
}

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseAsyncErrorResult<T> {
  /** Current status of the async operation */
  status: AsyncStatus;
  /** The resolved data (null until success) */
  data: T | null;
  /** The error object (null if no error) */
  error: Error | null;
  /** Whether the operation is currently loading */
  isLoading: boolean;
  /** Whether the operation has errored */
  isError: boolean;
  /** Execute the async operation */
  execute: (...args: unknown[]) => Promise<T | null>;
  /** Retry the last failed operation */
  retry: () => Promise<T | null>;
  /** Reset to idle state, clearing error and data */
  reset: () => void;
  /** Current retry attempt number (0 = first attempt) */
  retryCount: number;
}

function normalizeError(err: unknown): Error {
  if (err instanceof Error) return err;
  return new Error(typeof err === 'string' ? err : 'An unknown error occurred');
}

export function useAsyncError<T>(
  asyncFn: (...args: unknown[]) => Promise<T>,
  options: UseAsyncErrorOptions = {},
): UseAsyncErrorResult<T> {
  const { maxRetries = 0, retryDelayMs = 1000, onError } = options;

  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const mountedRef = useRef(true);
  const lastArgsRef = useRef<unknown[]>([]);
  const asyncFnRef = useRef(asyncFn);
  const optionsRef = useRef({ maxRetries, retryDelayMs, onError });

  asyncFnRef.current = asyncFn;
  optionsRef.current = { maxRetries, retryDelayMs, onError };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const executeWithRetry = useCallback(
    async (args: unknown[], attempt: number): Promise<T | null> => {
      if (!mountedRef.current) return null;

      setStatus('loading');
      setError(null);
      setRetryCount(attempt);

      try {
        const result = await asyncFnRef.current(...args);
        if (!mountedRef.current) return null;
        setData(result);
        setStatus('success');
        setRetryCount(0);
        return result;
      } catch (err) {
        if (!mountedRef.current) return null;

        const normalized = normalizeError(err);
        const opts = optionsRef.current;

        if (attempt < opts.maxRetries) {
          const delay = opts.retryDelayMs * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          if (!mountedRef.current) return null;
          return executeWithRetry(args, attempt + 1);
        }

        setError(normalized);
        setStatus('error');
        opts.onError?.(normalized);
        return null;
      }
    },
    [],
  );

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      lastArgsRef.current = args;
      return executeWithRetry(args, 0);
    },
    [executeWithRetry],
  );

  const retry = useCallback(async (): Promise<T | null> => {
    return executeWithRetry(lastArgsRef.current, 0);
  }, [executeWithRetry]);

  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
    setRetryCount(0);
  }, []);

  return {
    status,
    data,
    error,
    isLoading: status === 'loading',
    isError: status === 'error',
    execute,
    retry,
    reset,
    retryCount,
  };
}
