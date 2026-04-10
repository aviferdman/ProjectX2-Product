/**
 * DashboardPage — placeholder dashboard view.
 * TASK-131: Protected page scaffold.
 */
import React from 'react';
import { useAuth } from '../auth/index.js';

export function DashboardPage(): React.JSX.Element {
  const { user } = useAuth();

  return React.createElement(
    'main',
    { 'data-testid': 'dashboard-page' },
    React.createElement('h1', null, 'Dashboard'),
    user && React.createElement('p', null, `Welcome, ${user.name}`),
  );
}
