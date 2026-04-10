/**
 * LoginPage — styled login view using Crewspace design system.
 * TASK-131: Auth scaffold page.
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Input, Card, CardBody } from '@crewspace/ui';
import { useAuth } from '../auth/index.js';
import { ROUTES } from '../router/routes.js';

export function LoginPage(): React.JSX.Element {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const from = (location.state as { from?: string } | undefined)?.from ?? ROUTES.DASHBOARD;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
    navigate(from, { replace: true });
  };

  return (
    <main
      data-testid="login-page"
      className="min-h-screen bg-surface-app flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-md">
        <CardBody>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-text-primary">
              Sign in to Crewspace
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Build, debug, and deploy AI agent workflows
            </p>
          </div>

          {error && (
            <div
              role="alert"
              data-testid="login-error"
              className="mb-4 rounded-md bg-status-error/10 border border-status-error/30 px-3 py-2 text-sm text-status-error"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} aria-label="Login form" className="flex flex-col gap-4">
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              className="w-full mt-2"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
