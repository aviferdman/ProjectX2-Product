/**
 * OAuthProviderList — TASK-167
 *
 * Renders a vertical list of OAuthProviderCard components.
 */
import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import type { OAuthConnection } from './types.js';
import { OAuthProviderCard } from './OAuthProviderCard.js';

export interface OAuthProviderListProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  connections: readonly OAuthConnection[];
  onConnect?: (id: string) => void;
  onDisconnect?: (id: string) => void;
}

export const OAuthProviderList = forwardRef<HTMLDivElement, OAuthProviderListProps>(
  function OAuthProviderList(
    { connections, onConnect, onDisconnect, className, ...props },
    ref,
  ) {
    if (connections.length === 0) {
      return (
        <div
          ref={ref}
          className={clsx(
            'flex flex-col items-center justify-center rounded-xl p-8',
            'border border-dashed border-[var(--cs-border-default,#18181b)]',
            'text-center',
            className,
          )}
          {...props}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mb-3 text-slate-600"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="text-sm font-medium text-[var(--cs-text-primary,#fafafa)]">
            No OAuth providers configured
          </p>
          <p className="mt-1 text-xs text-[var(--cs-text-secondary,#a1a1aa)]">
            Connect an OAuth provider to enable integrations.
          </p>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="list"
        aria-label="OAuth providers"
        className={clsx('flex flex-col gap-2', className)}
        {...props}
      >
        {connections.map((conn) => (
          <div role="listitem" key={conn.id}>
            <OAuthProviderCard
              connection={conn}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
            />
          </div>
        ))}
      </div>
    );
  },
);
