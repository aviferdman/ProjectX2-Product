/**
 * LoginPage — Lovable-style login view.
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
      className="min-h-screen bg-[var(--cs-surface-app)] flex flex-col items-center justify-center p-4 hero-glow"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 animate-fadeInDown">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulseGlow">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="text-xl font-semibold text-[var(--cs-text-primary)] tracking-tight">
          <span className="gradient-text">Crew</span>Space
        </span>
      </div>

      <Card className="w-full max-w-md animate-fadeInUp">
        <CardBody>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-text-primary">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Sign in to orchestrate your AI agent workflows
            </p>
          </div>

          {error && (
            <div
              role="alert"
              data-testid="login-error"
              className="mb-4 rounded-lg bg-status-error/10 border border-status-error/30 px-3 py-2.5 text-sm text-status-error flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
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

          <p className="mt-6 text-center text-xs text-text-tertiary">
            Don't have an account?{' '}
            <button className="text-violet-400 hover:text-violet-300 transition-colors focus-ring">
              Get started free
            </button>
          </p>
        </CardBody>
      </Card>

      <p className="mt-8 text-xs text-[var(--cs-text-tertiary)] animate-fadeIn" style={{ animationDelay: '400ms' }}>
        © {new Date().getFullYear()} CrewSpace · AI Agent Orchestration
      </p>
    </main>
  );
}
