import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOAuthFlow } from '../src/hooks/useOAuthFlow.js';
import type { OAuthConnection } from '../src/components/oauth/types.js';

const mockConnection: OAuthConnection = {
  id: 'conn-1',
  provider: 'github',
  providerName: 'GitHub',
  status: 'disconnected',
};

const mockConnectedConnection: OAuthConnection = {
  id: 'conn-2',
  provider: 'google',
  providerName: 'Google',
  status: 'connected',
  connectedAt: '2026-01-01T00:00:00Z',
  accountLabel: 'user@google.com',
};

describe('useOAuthFlow', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() =>
      useOAuthFlow({
        onConnect: vi.fn(),
        onDisconnect: vi.fn(),
      }),
    );
    expect(result.current.flowStatus).toBe('idle');
    expect(result.current.activeConnection).toBeNull();
    expect(result.current.isDisconnect).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('transitions to confirming on startConnect', () => {
    const { result } = renderHook(() =>
      useOAuthFlow({
        onConnect: vi.fn(),
        onDisconnect: vi.fn(),
      }),
    );
    act(() => {
      result.current.startConnect(mockConnection);
    });
    expect(result.current.flowStatus).toBe('confirming');
    expect(result.current.activeConnection).toEqual(mockConnection);
    expect(result.current.isDisconnect).toBe(false);
  });

  it('transitions to confirming on startDisconnect', () => {
    const { result } = renderHook(() =>
      useOAuthFlow({
        onConnect: vi.fn(),
        onDisconnect: vi.fn(),
      }),
    );
    act(() => {
      result.current.startDisconnect(mockConnectedConnection);
    });
    expect(result.current.flowStatus).toBe('confirming');
    expect(result.current.activeConnection).toEqual(mockConnectedConnection);
    expect(result.current.isDisconnect).toBe(true);
  });

  it('transitions through in-progress to success on confirm (connect)', async () => {
    const onConnect = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useOAuthFlow({
        onConnect,
        onDisconnect: vi.fn(),
        onSuccess,
      }),
    );
    act(() => {
      result.current.startConnect(mockConnection);
    });
    await act(async () => {
      await result.current.confirm();
    });
    expect(onConnect).toHaveBeenCalledWith('conn-1');
    expect(result.current.flowStatus).toBe('success');
    expect(onSuccess).toHaveBeenCalledWith('conn-1', 'connect');
  });

  it('transitions through in-progress to success on confirm (disconnect)', async () => {
    const onDisconnect = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useOAuthFlow({
        onConnect: vi.fn(),
        onDisconnect,
        onSuccess,
      }),
    );
    act(() => {
      result.current.startDisconnect(mockConnectedConnection);
    });
    await act(async () => {
      await result.current.confirm();
    });
    expect(onDisconnect).toHaveBeenCalledWith('conn-2');
    expect(result.current.flowStatus).toBe('success');
    expect(onSuccess).toHaveBeenCalledWith('conn-2', 'disconnect');
  });

  it('transitions to error on connect failure', async () => {
    const onConnect = vi.fn().mockRejectedValue(new Error('Auth timeout'));
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useOAuthFlow({
        onConnect,
        onDisconnect: vi.fn(),
        onError,
      }),
    );
    act(() => {
      result.current.startConnect(mockConnection);
    });
    await act(async () => {
      await result.current.confirm();
    });
    expect(result.current.flowStatus).toBe('error');
    expect(result.current.error).toBe('Auth timeout');
    expect(onError).toHaveBeenCalledWith(
      'conn-1',
      expect.objectContaining({ message: 'Auth timeout' }),
    );
  });

  it('handles non-Error exceptions gracefully', async () => {
    const onConnect = vi.fn().mockRejectedValue('string error');
    const { result } = renderHook(() =>
      useOAuthFlow({
        onConnect,
        onDisconnect: vi.fn(),
      }),
    );
    act(() => {
      result.current.startConnect(mockConnection);
    });
    await act(async () => {
      await result.current.confirm();
    });
    expect(result.current.flowStatus).toBe('error');
    expect(result.current.error).toBe('An unknown error occurred');
  });

  it('cancel resets to idle', () => {
    const { result } = renderHook(() =>
      useOAuthFlow({
        onConnect: vi.fn(),
        onDisconnect: vi.fn(),
      }),
    );
    act(() => {
      result.current.startConnect(mockConnection);
    });
    expect(result.current.flowStatus).toBe('confirming');
    act(() => {
      result.current.cancel();
    });
    expect(result.current.flowStatus).toBe('idle');
    expect(result.current.activeConnection).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('reset returns to idle after success', async () => {
    const onConnect = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useOAuthFlow({
        onConnect,
        onDisconnect: vi.fn(),
      }),
    );
    act(() => {
      result.current.startConnect(mockConnection);
    });
    await act(async () => {
      await result.current.confirm();
    });
    expect(result.current.flowStatus).toBe('success');
    act(() => {
      result.current.reset();
    });
    expect(result.current.flowStatus).toBe('idle');
    expect(result.current.activeConnection).toBeNull();
  });

  it('does nothing on confirm when no activeConnection', async () => {
    const onConnect = vi.fn();
    const { result } = renderHook(() =>
      useOAuthFlow({
        onConnect,
        onDisconnect: vi.fn(),
      }),
    );
    await act(async () => {
      await result.current.confirm();
    });
    expect(onConnect).not.toHaveBeenCalled();
    expect(result.current.flowStatus).toBe('idle');
  });
});
