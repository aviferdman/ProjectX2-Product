/**
 * TASK-182: Tests for useToast hook
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../src/hooks/useToast.js';

describe('useToast', () => {
  it('starts with empty toast list', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('adds a toast via addToast', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.addToast({ variant: 'success', title: 'Saved' });
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Saved');
    expect(result.current.toasts[0].variant).toBe('success');
  });

  it('returns a unique id for each toast', () => {
    const { result } = renderHook(() => useToast());
    let id1: string = '';
    let id2: string = '';
    act(() => {
      id1 = result.current.addToast({ variant: 'info', title: 'A' });
      id2 = result.current.addToast({ variant: 'info', title: 'B' });
    });
    expect(id1).not.toBe(id2);
  });

  it('dismisses a toast by id', () => {
    const { result } = renderHook(() => useToast());
    let id: string = '';
    act(() => {
      id = result.current.addToast({ variant: 'error', title: 'Oops' });
    });
    expect(result.current.toasts).toHaveLength(1);
    act(() => {
      result.current.dismissToast(id);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('clears all toasts', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.addToast({ variant: 'info', title: 'A' });
      result.current.addToast({ variant: 'info', title: 'B' });
      result.current.addToast({ variant: 'info', title: 'C' });
    });
    expect(result.current.toasts).toHaveLength(3);
    act(() => {
      result.current.clearToasts();
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('caps toasts at maxToasts', () => {
    const { result } = renderHook(() => useToast({ maxToasts: 2 }));
    act(() => {
      result.current.addToast({ variant: 'info', title: 'A' });
      result.current.addToast({ variant: 'info', title: 'B' });
      result.current.addToast({ variant: 'info', title: 'C' });
    });
    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0].title).toBe('B');
    expect(result.current.toasts[1].title).toBe('C');
  });

  it('provides success shorthand', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.success('Saved', 'Your changes were saved.');
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].variant).toBe('success');
    expect(result.current.toasts[0].title).toBe('Saved');
    expect(result.current.toasts[0].message).toBe('Your changes were saved.');
  });

  it('provides error shorthand', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.error('Failed');
    });
    expect(result.current.toasts[0].variant).toBe('error');
  });

  it('provides warning shorthand', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.warning('Watch out');
    });
    expect(result.current.toasts[0].variant).toBe('warning');
  });

  it('provides info shorthand', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.info('FYI');
    });
    expect(result.current.toasts[0].variant).toBe('info');
  });

  it('applies default duration and dismissible', () => {
    const { result } = renderHook(() => useToast({ defaultDuration: 3000 }));
    act(() => {
      result.current.addToast({ variant: 'info', title: 'Test' });
    });
    expect(result.current.toasts[0].duration).toBe(3000);
    expect(result.current.toasts[0].dismissible).toBe(true);
  });

  it('preserves custom duration on individual toast', () => {
    const { result } = renderHook(() => useToast({ defaultDuration: 5000 }));
    act(() => {
      result.current.addToast({ variant: 'info', title: 'Custom', duration: 10000 });
    });
    expect(result.current.toasts[0].duration).toBe(10000);
  });
});
