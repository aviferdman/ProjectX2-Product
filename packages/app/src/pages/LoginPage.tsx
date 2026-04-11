/**
 * LoginPage — Lovable-style login view with OAuth support.
 * TASK-131: Auth scaffold page.
 */
import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/index.js';
import type { OAuthProviderType } from '../auth/index.js';
import { ROUTES } from '../router/routes.js';

const OAUTH_PROVIDERS: { id: OAuthProviderType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'github',
    label: 'Continue with GitHub',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    id: 'google',
    label: 'Continue with Google',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
  },
  {
    id: 'microsoft',
    label: 'Continue with Microsoft',
    icon: (
      <svg width="18" height="18" viewBox="0 0 23 23">
        <rect x="1" y="1" width="10" height="10" fill="#F25022" />
        <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
        <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
        <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
      </svg>
    ),
  },
];

export function LoginPage(): React.JSX.Element {
  const { login, loginWithOAuth, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [oauthLoading, setOauthLoading] = useState<OAuthProviderType | null>(null);

  const from = (location.state as { from?: string } | undefined)?.from ?? ROUTES.DASHBOARD;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
    navigate(from, { replace: true });
  };

  const handleOAuthLogin = useCallback(
    async (provider: OAuthProviderType) => {
      setOauthLoading(provider);
      try {
        await loginWithOAuth(provider);
        navigate(from, { replace: true });
      } finally {
        setOauthLoading(null);
      }
    },
    [loginWithOAuth, navigate, from],
  );

  return (
    <main
      data-testid="login-page"
      className="min-h-screen bg-[var(--cs-surface-app)] flex flex-col items-center justify-center p-4 hero-glow"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 animate-fadeInDown">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center animate-pulseGlow">
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

      <div className="w-full max-w-md animate-fadeInUp rounded-2xl border border-[var(--cs-border-default)] bg-[var(--cs-surface-panel)] p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[var(--cs-text-primary)]">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">
            Sign in to orchestrate your AI agent workflows
          </p>
        </div>

        {error && (
          <div
            role="alert"
            data-testid="login-error"
            className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2.5 text-sm text-rose-400 flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {/* ── OAuth Buttons ───────────────────────────────── */}
        <div className="flex flex-col gap-2.5 mb-6">
          {OAUTH_PROVIDERS.map((provider) => {
            const loading = oauthLoading === provider.id;
            return (
              <button
                key={provider.id}
                onClick={() => handleOAuthLogin(provider.id)}
                disabled={isLoading || oauthLoading !== null}
                className="flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-xl border border-[var(--cs-border-default)] bg-[var(--cs-surface-card)] hover:bg-white/[0.06] hover:border-[var(--cs-border-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-[var(--cs-text-primary)] transition-all duration-200 focus-ring"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-[var(--cs-text-secondary)]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  provider.icon
                )}
                {provider.label}
              </button>
            );
          })}
        </div>

        {/* ── Divider ────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[var(--cs-border-subtle)]" />
          <span className="text-xs text-[var(--cs-text-tertiary)] uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-[var(--cs-border-subtle)]" />
        </div>

        {/* ── Email/Password Form ────────────────────────── */}
        <form onSubmit={handleSubmit} aria-label="Login form" className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-[var(--cs-text-secondary)] mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] text-sm text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-[var(--cs-text-secondary)] mb-1.5">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] text-sm text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || oauthLoading !== null}
            className="w-full mt-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 focus-ring"
          >
            {isLoading && !oauthLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--cs-text-tertiary)]">
          Don't have an account?{' '}
          <button className="text-indigo-400 hover:text-indigo-300 transition-colors focus-ring">
            Get started free
          </button>
        </p>
      </div>

      <p className="mt-8 text-xs text-[var(--cs-text-tertiary)] animate-fadeIn" style={{ animationDelay: '400ms' }}>
        © {new Date().getFullYear()} CrewSpace · AI Agent Orchestration
      </p>
    </main>
  );
}
