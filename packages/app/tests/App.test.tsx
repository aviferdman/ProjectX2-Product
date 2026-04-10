/**
 * App root component tests.
 * TASK-131: Verifies the App component renders and composes providers.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { App } from '../src/App.js';
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

function createAdapter(): AuthAdapter {
  return {
    login: vi.fn().mockResolvedValue(mockUser),
    logout: vi.fn().mockResolvedValue(undefined),
    refreshSession: vi.fn().mockResolvedValue(mockUser),
  };
}

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe('App', () => {
  it('renders without crashing', () => {
    const adapter = createAdapter();
    const { container } = render(React.createElement(App, { authAdapter: adapter }));

    expect(container).toBeTruthy();
  });

  it('shows login page when not authenticated (default redirect from /)', () => {
    const adapter = createAdapter();
    render(React.createElement(App, { authAdapter: adapter }));

    // The default route "/" redirects to "/dashboard" which is protected → redirects to "/login"
    expect(screen.getByTestId('login-page')).toBeTruthy();
  });

  it('accepts initial app state overrides', () => {
    const adapter = createAdapter();
    const { container } = render(
      React.createElement(App, {
        authAdapter: adapter,
        initialAppState: { theme: 'dark', sidebarMode: 'collapsed' },
      }),
    );

    expect(container).toBeTruthy();
  });
});
