/**
 * OAuthProviderCard — TASK-167
 *
 * Displays a single OAuth provider with its connection status
 * and connect/disconnect actions.
 */
import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import type { OAuthConnection } from './types.js';
import { OAuthStatusBadge } from './OAuthStatusBadge.js';

export interface OAuthProviderCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  connection: OAuthConnection;
  onConnect?: (id: string) => void;
  onDisconnect?: (id: string) => void;
}

const providerIcons: Record<string, React.ReactNode> = {
  github: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  ),
  google: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  ),
  slack: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z" />
    </svg>
  ),
  microsoft: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  ),
  custom: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
};

function formatConnectedDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export const OAuthProviderCard = forwardRef<HTMLDivElement, OAuthProviderCardProps>(
  function OAuthProviderCard(
    { connection, onConnect, onDisconnect, className, ...props },
    ref,
  ) {
    const isInProgress =
      connection.status === 'connecting' ||
      connection.status === 'disconnecting';
    const isConnected = connection.status === 'connected';

    const handleConnect = (e: React.MouseEvent) => {
      e.stopPropagation();
      onConnect?.(connection.id);
    };

    const handleDisconnect = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDisconnect?.(connection.id);
    };

    return (
      <div
        ref={ref}
        role="article"
        aria-label={`OAuth provider: ${connection.providerName}`}
        className={clsx(
          'flex items-center gap-4 rounded-xl p-4',
          'border border-[var(--cs-border-default,#1e293b)] bg-[var(--cs-bg-card,#0f172a)]',
          'transition-all duration-150',
          'hover:border-[var(--cs-border-hover,#334155)] hover:bg-[var(--cs-bg-card-hover,#1e293b)]',
          className,
        )}
        {...props}
      >
        {/* Provider icon */}
        <div
          className={clsx(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            'bg-[var(--cs-bg-surface,#020617)] text-slate-300',
          )}
        >
          {providerIcons[connection.provider] ?? providerIcons.custom}
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--cs-text-primary,#f8fafc)] truncate">
              {connection.providerName}
            </span>
            <OAuthStatusBadge status={connection.status} />
          </div>

          {isConnected && connection.accountLabel && (
            <span className="text-xs text-[var(--cs-text-secondary,#94a3b8)] truncate">
              {connection.accountLabel}
            </span>
          )}

          {isConnected && connection.connectedAt && (
            <span className="text-[11px] text-[var(--cs-text-secondary,#94a3b8)]">
              Connected {formatConnectedDate(connection.connectedAt)}
            </span>
          )}

          {connection.status === 'error' && connection.error && (
            <span className="text-xs text-rose-400 truncate">
              {connection.error}
            </span>
          )}

          {isConnected && connection.scopes && connection.scopes.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {connection.scopes.map((scope) => (
                <span
                  key={scope}
                  className={clsx(
                    'inline-flex items-center rounded px-1.5 py-0.5',
                    'text-[10px] font-medium',
                    'bg-slate-800 text-slate-400 border border-slate-700',
                  )}
                >
                  {scope}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="shrink-0">
          {isConnected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isInProgress}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-lg px-3 h-8',
                'border border-rose-700/50 bg-rose-900/20 text-rose-300',
                'text-xs font-medium',
                'transition-colors duration-150',
                'hover:bg-rose-900/40 hover:border-rose-600',
                'disabled:opacity-50 disabled:pointer-events-none',
              )}
              aria-label={`Disconnect ${connection.providerName}`}
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={isInProgress}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-lg px-3 h-8',
                'bg-violet-600 text-white',
                'text-xs font-medium',
                'transition-all duration-150',
                'hover:bg-violet-500',
                'disabled:opacity-50 disabled:pointer-events-none',
              )}
              aria-label={`Connect ${connection.providerName}`}
            >
              {connection.status === 'connecting' ? 'Connecting…' : 'Connect'}
            </button>
          )}
        </div>
      </div>
    );
  },
);
