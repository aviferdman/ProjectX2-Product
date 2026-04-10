/**
 * ProtectedRoute — wrapper that redirects unauthenticated users.
 * TASK-131: Route-level auth guard.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/index.js';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Where to redirect when not authenticated (default: "/login"). */
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return React.createElement('div', { 'aria-busy': 'true', role: 'status' }, 'Loading…');
  }

  if (!isAuthenticated) {
    return React.createElement(Navigate, {
      to: redirectTo,
      replace: true,
      state: { from: location.pathname },
    });
  }

  return React.createElement(React.Fragment, null, children);
}
