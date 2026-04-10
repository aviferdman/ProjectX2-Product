/**
 * NotFoundPage — 404 fallback with consistent branding.
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
      className="min-h-screen bg-[var(--cs-surface-app)] flex flex-col items-center justify-center p-6 hero-glow"
    >
      <div className="animate-fadeInUp text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center animate-float">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(167 139 250)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>
        <h1 className="text-6xl font-extrabold gradient-text mb-3">404</h1>
        <p className="text-lg text-[var(--cs-text-secondary)] mb-2">
          Page not found
        </p>
        <p className="text-sm text-[var(--cs-text-tertiary)] mb-8 max-w-sm mx-auto">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link to={ROUTES.HOME} className="focus-ring rounded-xl">
          <Button variant="secondary">Back to Home</Button>
        </Link>
      </div>
    </main>
  );
}
