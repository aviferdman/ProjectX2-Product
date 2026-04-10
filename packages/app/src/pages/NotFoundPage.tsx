/**
 * NotFoundPage — 404 fallback.
 * TASK-131: Catch-all route page.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../router/routes.js';

export function NotFoundPage(): React.JSX.Element {
  return React.createElement(
    'main',
    { 'data-testid': 'not-found-page' },
    React.createElement('h1', null, '404 — Page not found'),
    React.createElement(
      'p',
      null,
      'The page you are looking for does not exist.',
    ),
    React.createElement(Link, { to: ROUTES.DASHBOARD }, 'Back to Dashboard'),
  );
}
