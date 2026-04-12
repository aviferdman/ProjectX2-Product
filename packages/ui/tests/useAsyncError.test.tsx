import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAsyncError } from '../src/hooks/useAsyncError.js';

describe('useAsyncError', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in idle state', () => {
    const fn = vi.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsyncError(fn));

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.retryCount).toBe(0);
  });

  it('transitions to loading then success on execute', async () => {
    const fn = vi.fn().mockResolvedValue('result-data');
    const { result } = renderHook(() => useAsyncError(fn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.data).toBe('result-data');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('transitions to error on failure', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Network failure'));
    const onError = vi.fn();
    const { result } = renderHook(() => useAsyncError(fn, { onError }));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toBe('Network failure');
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeNull();
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0].message).toBe('Network failure');
  });

  it('normalizes non-Error rejections to Error objects', async () => {
    const fn = vi.fn().mockRejectedValue('string error');
    const { result } = renderHook(() => useAsyncError(fn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('string error');
  });

  it('normalizes non-string, non-Error rejections', async () => {
    const fn = vi.fn().mockRejectedValue(42);
    const { result } = renderHook(() => useAsyncError(fn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('An unknown error occurred');
  });

  it('retries failed operations with exponential backoff', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');

    const { result } = renderHook(() => useAsyncError(fn, { maxRetries: 2, retryDelayMs: 100 }));

    const promise = act(async () => {
      const executePromise = result.current.execute();
      // First retry after 100ms
      await vi.advanceTimersByTimeAsync(100);
      // Second retry after 200ms (exponential backoff)
      await vi.advanceTimersByTimeAsync(200);
      return executePromise;
    });

    await promise;

    expect(fn).toHaveBeenCalledTimes(3);
    expect(result.current.status).toBe('success');
    expect(result.current.data).toBe('success');
  });

  it('reports error after exhausting retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Persistent failure'));
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useAsyncError(fn, { maxRetries: 1, retryDelayMs: 100, onError }),
    );

    const promise = act(async () => {
      const executePromise = result.current.execute();
      await vi.advanceTimersByTimeAsync(100);
      return executePromise;
    });

    await promise;

    expect(fn).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
    expect(result.current.status).toBe('error');
    expect(onError).toHaveBeenCalledOnce();
  });

  it('retry() re-executes with the last arguments', async () => {
    let callCount = 0;
    const fn = vi.fn().mockImplementation(async (...args: unknown[]) => {
      callCount++;
      if (callCount === 1) throw new Error('First fail');
      return `ok:${args[0]}`;
    });

    const { result } = renderHook(() => useAsyncError(fn));

    await act(async () => {
      await result.current.execute('myarg');
    });

    expect(result.current.status).toBe('error');

    await act(async () => {
      await result.current.retry();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.data).toBe('ok:myarg');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('reset() clears all state back to idle', async () => {
    const fn = vi.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsyncError(fn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.status).toBe('success');

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.retryCount).toBe(0);
  });

  it('passes arguments to the async function', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => useAsyncError(fn));

    await act(async () => {
      await result.current.execute('arg1', 'arg2');
    });

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});
