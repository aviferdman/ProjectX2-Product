/**
 * OAuthSettingsPanel — TASK-167
 *
 * Full-page panel that combines the provider list and connect dialog
 * into a cohesive settings experience. This is the main entry-point
 * component for managing OAuth connections.
 */
import React, { forwardRef, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import type { OAuthConnection, OAuthFlowStatus } from './types.js';
import { OAuthProviderList } from './OAuthProviderList.js';
import { OAuthConnectDialog } from './OAuthConnectDialog.js';

export interface OAuthSettingsPanelProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  connections: readonly OAuthConnection[];
  /** Async callback to perform the connect action. */
  onConnect?: (id: string) => Promise<void>;
  /** Async callback to perform the disconnect action. */
  onDisconnect?: (id: string) => Promise<void>;
  /** Show loading skeleton. */
  loading?: boolean;
}

export const OAuthSettingsPanel = forwardRef<HTMLDivElement, OAuthSettingsPanelProps>(
  function OAuthSettingsPanel(
    { connections, onConnect, onDisconnect, loading, className, ...props },
    ref,
  ) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [activeConnection, setActiveConnection] =
      useState<OAuthConnection | null>(null);
    const [isDisconnect, setIsDisconnect] = useState(false);
    const [flowStatus, setFlowStatus] = useState<OAuthFlowStatus>('idle');
    const [flowError, setFlowError] = useState<string | null>(null);

    const openDialog = useCallback(
      (id: string, disconnect: boolean) => {
        const conn = connections.find((c) => c.id === id) ?? null;
        if (!conn) return;
        setActiveConnection(conn);
        setIsDisconnect(disconnect);
        setFlowStatus('confirming');
        setFlowError(null);
        setDialogOpen(true);
      },
      [connections],
    );

    const handleConnect = useCallback(
      (id: string) => openDialog(id, false),
      [openDialog],
    );

    const handleDisconnect = useCallback(
      (id: string) => openDialog(id, true),
      [openDialog],
    );

    const handleClose = useCallback(() => {
      setDialogOpen(false);
      setFlowStatus('idle');
      setFlowError(null);
      setActiveConnection(null);
    }, []);

    const handleConfirm = useCallback(async () => {
      if (!activeConnection) return;
      setFlowStatus('in-progress');
      setFlowError(null);

      try {
        if (isDisconnect) {
          await onDisconnect?.(activeConnection.id);
        } else {
          await onConnect?.(activeConnection.id);
        }
        setFlowStatus('success');
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'An unknown error occurred';
        setFlowError(msg);
        setFlowStatus('error');
      }
    }, [activeConnection, isDisconnect, onConnect, onDisconnect]);

    const connectedCount = connections.filter(
      (c) => c.status === 'connected',
    ).length;

    return (
      <div
        ref={ref}
        className={clsx('flex flex-col gap-5', className)}
        {...props}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--cs-text-primary,#fafafa)]">
              OAuth Connections
            </h2>
            <p className="mt-1 text-sm text-[var(--cs-text-secondary,#a1a1aa)]">
              Manage your connected OAuth providers for integrations.
            </p>
          </div>
          <span className="text-xs text-[var(--cs-text-secondary,#a1a1aa)]">
            {connectedCount} of {connections.length} connected
          </span>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12" role="status" aria-label="Loading OAuth providers">
            <svg
              className="h-6 w-6 animate-spin text-indigo-400"
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
          </div>
        )}

        {/* Provider list */}
        {!loading && (
          <OAuthProviderList
            connections={connections}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        )}

        {/* Dialog */}
        <OAuthConnectDialog
          open={dialogOpen}
          onClose={handleClose}
          connection={activeConnection}
          flowStatus={flowStatus}
          isDisconnect={isDisconnect}
          error={flowError}
          onConfirm={handleConfirm}
        />
      </div>
    );
  },
);
