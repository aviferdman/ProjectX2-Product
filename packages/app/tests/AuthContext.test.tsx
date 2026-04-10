/**
 * AuthContext tests.
 * TASK-131: Verifies login, logout, session refresh, and error flows.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../src/auth/index.js';
import type { AuthAdapter, User } from '../src/auth/index.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const mockUser: User = {
  id: 'u-1',
  email: 'alice@crewspace.dev',
  name: 'Alice',
  role: 'admin',
};

function createMockAdapter(overrides?: Partial<AuthAdapter>): AuthAdapter {
  return {
    login: vi.fn().mockResolvedValue(mockUser),
    logout: vi.fn().mockResolvedValue(undefined),
    refreshSession: vi.fn().mockResolvedValue(mockUser),
    ...overrides,
  };
}

/** Renders a consumer that exposes auth state for assertions. */
function AuthConsumer({ onRender }: { onRender: (ctx: ReturnType<typeof useAuth>) => void }) {
  const ctx = useAuth();
  onRender(ctx);
  return null;
}

function renderWithAuth(adapter: AuthAdapter, ui?: React.ReactElement) {
  let captured!: ReturnType<typeof useAuth>;
  const consumer = React.createElement(AuthConsumer, {
    onRender: (ctx) => {
      captured = ctx;
    },
  });
  const result = render(
    React.createElement(AuthProvider, { adapter }, ui ?? consumer),
  );
  return { ...result, getContext: () => captured };
}

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe('AuthContext', () => {
  it('provides initial unauthenticated state', () => {
    const adapter = createMockAdapter();
    const { getContext } = renderWithAuth(adapter);

    expect(getContext().isAuthenticated).toBe(false);
    expect(getContext().user).toBeNull();
    expect(getContext().isLoading).toBe(false);
    expect(getContext().error).toBeNull();
  });

  it('logs in successfully', async () => {
    const adapter = createMockAdapter();
    const { getContext } = renderWithAuth(adapter);

    await act(async () => {
      await getContext().login({ email: 'alice@crewspace.dev', password: 'secret' });
    });

    expect(adapter.login).toHaveBeenCalledWith({
      email: 'alice@crewspace.dev',
      password: 'secret',
    });
    expect(getContext().isAuthenticated).toBe(true);
    expect(getContext().user).toEqual(mockUser);
  });

  it('handles login failure', async () => {
    const adapter = createMockAdapter({
      login: vi.fn().mockRejectedValue(new Error('Invalid credentials')),
    });
    const { getContext } = renderWithAuth(adapter);

    await act(async () => {
      await getContext().login({ email: 'bad@x.com', password: 'wrong' });
    });

    expect(getContext().isAuthenticated).toBe(false);
    expect(getContext().error).toBe('Invalid credentials');
  });

  it('logs out and clears state', async () => {
    const adapter = createMockAdapter();
    const { getContext } = renderWithAuth(adapter);

    await act(async () => {
      await getContext().login({ email: 'alice@crewspace.dev', password: 'secret' });
    });
    expect(getContext().isAuthenticated).toBe(true);

    await act(async () => {
      await getContext().logout();
    });

    expect(getContext().isAuthenticated).toBe(false);
    expect(getContext().user).toBeNull();
    expect(adapter.logout).toHaveBeenCalled();
  });

  it('refreshes session successfully', async () => {
    const adapter = createMockAdapter();
    const { getContext } = renderWithAuth(adapter);

    await act(async () => {
      await getContext().refreshSession();
    });

    expect(adapter.refreshSession).toHaveBeenCalled();
    expect(getContext().isAuthenticated).toBe(true);
    expect(getContext().user).toEqual(mockUser);
  });

  it('handles refresh failure', async () => {
    const adapter = createMockAdapter({
      refreshSession: vi.fn().mockRejectedValue(new Error('Token expired')),
    });
    const { getContext } = renderWithAuth(adapter);

    await act(async () => {
      await getContext().refreshSession();
    });

    expect(getContext().isAuthenticated).toBe(false);
    expect(getContext().error).toBe('Token expired');
  });

  it('throws when useAuth is called outside AuthProvider', () => {
    function Orphan() {
      useAuth();
      return null;
    }

    expect(() => render(React.createElement(Orphan))).toThrow(
      'useAuth must be used within an <AuthProvider>',
    );
  });
});
