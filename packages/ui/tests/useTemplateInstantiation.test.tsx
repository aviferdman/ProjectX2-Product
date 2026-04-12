/**
 * Tests for useTemplateInstantiation hook — TASK-161
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useTemplateInstantiation,
  type InstantiationResult,
  type InstantiationTemplate,
} from '../src/hooks/useTemplateInstantiation.js';

/* ---------- Mock data ---------- */

const mockTemplate: InstantiationTemplate = {
  id: 'tpl-1',
  name: 'Research Pipeline',
  description: 'Automated research workflow',
};

const mockResult: InstantiationResult = {
  workflowId: 'wf-42',
  templateId: 'tpl-1',
  workflowName: 'My Research Pipeline',
  instantiatedAt: '2026-04-10T00:00:00.000Z',
};

/* ---------- Helpers ---------- */

function createOptions(overrides?: Partial<Parameters<typeof useTemplateInstantiation>[0]>) {
  return {
    onInstantiate: vi.fn().mockResolvedValue(mockResult),
    ...overrides,
  };
}

/* ================================================================== */
/* Tests                                                               */
/* ================================================================== */

describe('useTemplateInstantiation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /* ---- Initial state ---- */

  it('starts in idle status', () => {
    const { result } = renderHook(() => useTemplateInstantiation(createOptions()));
    expect(result.current.status).toBe('idle');
    expect(result.current.selectedTemplate).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  /* ---- startInstantiation ---- */

  it('transitions to configuring when startInstantiation is called', () => {
    const { result } = renderHook(() => useTemplateInstantiation(createOptions()));

    act(() => {
      result.current.startInstantiation(mockTemplate);
    });

    expect(result.current.status).toBe('configuring');
    expect(result.current.selectedTemplate).toEqual(mockTemplate);
  });

  /* ---- cancelInstantiation ---- */

  it('returns to idle when cancelInstantiation is called', () => {
    const { result } = renderHook(() => useTemplateInstantiation(createOptions()));

    act(() => {
      result.current.startInstantiation(mockTemplate);
    });
    expect(result.current.status).toBe('configuring');

    act(() => {
      result.current.cancelInstantiation();
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.selectedTemplate).toBeNull();
  });

  /* ---- Successful instantiation ---- */

  it('transitions through instantiating → success on confirm', async () => {
    const onInstantiate = vi.fn().mockResolvedValue(mockResult);
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useTemplateInstantiation({ onInstantiate, onSuccess }));

    act(() => {
      result.current.startInstantiation(mockTemplate);
    });

    await act(async () => {
      await result.current.confirmInstantiation({
        workflowName: 'My Research Pipeline',
      });
    });

    expect(result.current.status).toBe('success');
    expect(result.current.result).toEqual(mockResult);
    expect(result.current.error).toBeNull();
    expect(onInstantiate).toHaveBeenCalledWith('tpl-1', {
      workflowName: 'My Research Pipeline',
    });
    expect(onSuccess).toHaveBeenCalledWith(mockResult);
  });

  /* ---- Failed instantiation ---- */

  it('transitions to error when instantiation fails', async () => {
    const onInstantiate = vi.fn().mockRejectedValue(new Error('Network error'));
    const onError = vi.fn();
    const { result } = renderHook(() => useTemplateInstantiation({ onInstantiate, onError }));

    act(() => {
      result.current.startInstantiation(mockTemplate);
    });

    await act(async () => {
      await result.current.confirmInstantiation({
        workflowName: 'Test',
      });
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Network error');
    expect(result.current.result).toBeNull();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError.mock.calls[0][0].message).toBe('Network error');
  });

  it('handles non-Error rejection', async () => {
    const onInstantiate = vi.fn().mockRejectedValue('string error');
    const { result } = renderHook(() => useTemplateInstantiation({ onInstantiate }));

    act(() => {
      result.current.startInstantiation(mockTemplate);
    });

    await act(async () => {
      await result.current.confirmInstantiation({
        workflowName: 'Test',
      });
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('An unknown error occurred');
  });

  /* ---- Reset ---- */

  it('resets from success back to idle', async () => {
    const { result } = renderHook(() => useTemplateInstantiation(createOptions()));

    act(() => {
      result.current.startInstantiation(mockTemplate);
    });

    await act(async () => {
      await result.current.confirmInstantiation({
        workflowName: 'My Workflow',
      });
    });
    expect(result.current.status).toBe('success');

    act(() => {
      result.current.reset();
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.selectedTemplate).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('resets from error back to idle', async () => {
    const onInstantiate = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useTemplateInstantiation({ onInstantiate }));

    act(() => {
      result.current.startInstantiation(mockTemplate);
    });

    await act(async () => {
      await result.current.confirmInstantiation({ workflowName: 'x' });
    });
    expect(result.current.status).toBe('error');

    act(() => {
      result.current.reset();
    });
    expect(result.current.status).toBe('idle');
  });

  /* ---- Confirm without template (no-op) ---- */

  it('does nothing if confirmInstantiation is called without a selected template', async () => {
    const onInstantiate = vi.fn();
    const { result } = renderHook(() => useTemplateInstantiation({ onInstantiate }));

    await act(async () => {
      await result.current.confirmInstantiation({ workflowName: 'Test' });
    });

    expect(onInstantiate).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  /* ---- Passes optional description ---- */

  it('passes workflowDescription to onInstantiate', async () => {
    const onInstantiate = vi.fn().mockResolvedValue(mockResult);
    const { result } = renderHook(() => useTemplateInstantiation({ onInstantiate }));

    act(() => {
      result.current.startInstantiation(mockTemplate);
    });

    await act(async () => {
      await result.current.confirmInstantiation({
        workflowName: 'My Pipeline',
        workflowDescription: 'A description',
      });
    });

    expect(onInstantiate).toHaveBeenCalledWith('tpl-1', {
      workflowName: 'My Pipeline',
      workflowDescription: 'A description',
    });
  });
});
