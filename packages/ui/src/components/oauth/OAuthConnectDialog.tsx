/**
 * OAuthConnectDialog — TASK-167
 *
 * Modal dialog that confirms an OAuth connect or disconnect action
 * and shows progress / success / error states.
 */
import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import type { OAuthFlowStatus, OAuthConnection } from './types.js';

export interface OAuthConnectDialogProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  open: boolean;
  onClose: () => void;
  /** The connection being acted on. */
  connection: OAuthConnection | null;
  /** Current flow lifecycle status. */
  flowStatus: OAuthFlowStatus;
  /** Whether the pending action is a disconnect (vs. connect). */
  isDisconnect?: boolean;
  /** Error message when flowStatus === 'error'. */
  error?: string | null;
  /** Callback to confirm the action. */
  onConfirm?: () => void;
}

export const OAuthConnectDialog = forwardRef<HTMLDivElement, OAuthConnectDialogProps>(
  function OAuthConnectDialog(
    {
      open,
      onClose,
      connection,
      flowStatus,
      isDisconnect = false,
      error,
      onConfirm,
      className,
      ...props
    },
    ref,
  ) {
    if (!open || !connection) return null;

    const title = isDisconnect
      ? `Disconnect ${connection.providerName}`
      : `Connect ${connection.providerName}`;

    const isInProgress = flowStatus === 'in-progress';
    const isSuccess = flowStatus === 'success';
    const isError = flowStatus === 'error';

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isInProgress) onClose();
        }}
      >
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={clsx(
            'w-full max-w-md rounded-xl',
            'border border-slate-700 bg-[var(--cs-bg-panel,#0f172a)]',
            'shadow-xl',
            className,
          )}
          {...props}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isInProgress}
              className={clsx(
                'rounded-md p-1 text-slate-400 transition-colors',
                'hover:bg-[var(--cs-bg-card-hover,#1e293b)] hover:text-white',
                'disabled:opacity-50 disabled:pointer-events-none',
              )}
              aria-label="Close"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 4l10 10M14 4L4 14" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            {/* Confirming state */}
            {flowStatus === 'confirming' && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-[var(--cs-text-secondary,#94a3b8)]">
                  {isDisconnect
                    ? `Are you sure you want to disconnect ${connection.providerName}? Integrations using this provider will stop working.`
                    : `You will be redirected to ${connection.providerName} to authorize access. This may open a new window.`}
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={clsx(
                      'inline-flex items-center rounded-lg px-3 h-8',
                      'border border-slate-600 bg-transparent text-slate-300',
                      'text-xs font-medium transition-colors',
                      'hover:bg-slate-800 hover:text-white',
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    className={clsx(
                      'inline-flex items-center rounded-lg px-3 h-8',
                      'text-xs font-medium transition-all',
                      isDisconnect
                        ? 'bg-rose-600 text-white hover:bg-rose-500'
                        : 'bg-violet-600 text-white hover:bg-violet-500',
                    )}
                    data-testid="oauth-confirm-btn"
                  >
                    {isDisconnect ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            )}

            {/* In-progress state */}
            {isInProgress && (
              <div className="flex flex-col items-center gap-3 py-4" role="status">
                <svg
                  className="h-8 w-8 animate-spin text-violet-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <p className="text-sm text-[var(--cs-text-secondary,#94a3b8)]">
                  {isDisconnect ? 'Disconnecting…' : 'Connecting…'}
                </p>
              </div>
            )}

            {/* Success state */}
            {isSuccess && (
              <div className="flex flex-col items-center gap-3 py-4">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-emerald-400"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm font-medium text-emerald-300">
                  {isDisconnect ? 'Successfully disconnected' : 'Successfully connected'}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className={clsx(
                    'inline-flex items-center rounded-lg px-3 h-8',
                    'bg-violet-600 text-white text-xs font-medium',
                    'transition-all hover:bg-violet-500',
                  )}
                >
                  Done
                </button>
              </div>
            )}

            {/* Error state */}
            {isError && (
              <div className="flex flex-col items-center gap-3 py-4">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-rose-400"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="text-sm font-medium text-rose-300">
                  {isDisconnect ? 'Disconnect failed' : 'Connection failed'}
                </p>
                {error && (
                  <p className="text-xs text-[var(--cs-text-secondary,#94a3b8)] text-center">
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={clsx(
                      'inline-flex items-center rounded-lg px-3 h-8',
                      'border border-slate-600 bg-transparent text-slate-300',
                      'text-xs font-medium transition-colors',
                      'hover:bg-slate-800 hover:text-white',
                    )}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    className={clsx(
                      'inline-flex items-center rounded-lg px-3 h-8',
                      'bg-violet-600 text-white text-xs font-medium',
                      'transition-all hover:bg-violet-500',
                    )}
                    data-testid="oauth-retry-btn"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);
