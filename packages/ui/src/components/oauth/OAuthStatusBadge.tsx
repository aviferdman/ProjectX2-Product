/**
 * OAuthStatusBadge — TASK-167
 *
 * Small pill that shows the connection status of an OAuth provider.
 */
import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import type { OAuthConnectionStatus } from './types.js';
import { STATUS_LABELS } from './types.js';

const statusStyles: Record<OAuthConnectionStatus, string> = {
  connected: 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50',
  disconnected: 'bg-slate-800 text-slate-400 border-slate-600',
  connecting: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
  disconnecting: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
  error: 'bg-rose-900/30 text-rose-300 border-rose-700/50',
};

export interface OAuthStatusBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  status: OAuthConnectionStatus;
}

export const OAuthStatusBadge = forwardRef<HTMLSpanElement, OAuthStatusBadgeProps>(
  function OAuthStatusBadge({ status, className, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5',
          'text-[11px] font-semibold uppercase tracking-wider',
          statusStyles[status],
          className,
        )}
        {...props}
      >
        {/* Animated dot for in-progress states */}
        {(status === 'connecting' || status === 'disconnecting') && (
          <span
            className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current"
            aria-hidden="true"
          />
        )}
        {/* Solid dot for connected */}
        {status === 'connected' && (
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
            aria-hidden="true"
          />
        )}
        {STATUS_LABELS[status]}
      </span>
    );
  },
);
