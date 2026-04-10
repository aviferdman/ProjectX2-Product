/**
 * NotFoundPage — 404 fallback.
 * TASK-131: Catch-all route page.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@crewspace/ui';
import { ROUTES } from '../router/routes.js';

export function NotFoundPage(): React.JSX.Element {
  return (
    <main
      data-testid="not-found-page"
      className="min-h-screen bg-surface-app flex flex-col items-center justify-center p-6"
    >
      <h1 className="text-5xl font-bold text-text-primary mb-2">404</h1>
      <p className="text-text-secondary mb-6">
        The page you are looking for does not exist.
      </p>
      <Link to={ROUTES.DASHBOARD}>
        <Button variant="secondary">Back to Dashboard</Button>
      </Link>
    </main>
  );
}
