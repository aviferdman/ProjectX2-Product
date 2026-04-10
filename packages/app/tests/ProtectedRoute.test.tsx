/**
 * ProtectedRoute tests.
 * TASK-131: Verifies auth-guarded route behaviour.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../src/auth/index.js';
import type { AuthAdapter, User } from '../src/auth/index.js';
import { ProtectedRoute } from '../src/router/ProtectedRoute.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const mockUser: User = {
  id: 'u-1',
  email: 'alice@crewspace.dev',
  name: 'Alice',
  role: 'member',
};

function createAdapter(overrides?: Partial<AuthAdapter>): AuthAdapter {
  return {
    login: vi.fn().mockResolvedValue(mockUser),
    logout: vi.fn().mockResolvedValue(undefined),
    refreshSession: vi.fn().mockResolvedValue(mockUser),
    ...overrides,
  };
}

/**
 * Renders ProtectedRoute inside a MemoryRouter with a login fallback route
 * so Navigate has a real destination and doesn't hang.
 */
function renderProtected(adapter: AuthAdapter) {
  const child = React.createElement('div', { 'data-testid': 'protected-content' }, 'Secret');
  const loginFallback = React.createElement('div', { 'data-testid': 'login-redirect' }, 'Login');

  return render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/dashboard'] },
      React.createElement(
        AuthProvider,
        { adapter },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: '/dashboard',
            element: React.createElement(ProtectedRoute, null, child),
          }),
          React.createElement(Route, {
            path: '/login',
            element: loginFallback,
          }),
        ),
      ),
    ),
  );
}

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to login', () => {
    const adapter = createAdapter();
    renderProtected(adapter);

    expect(screen.queryByTestId('protected-content')).toBeNull();
    expect(screen.getByTestId('login-redirect')).toBeTruthy();
  });

  it('does not render children when unauthenticated', () => {
    const adapter = createAdapter();
    renderProtected(adapter);

    expect(screen.queryByTestId('protected-content')).toBeNull();
  });
});
