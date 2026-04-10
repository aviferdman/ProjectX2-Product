/**
 * useOAuthFlow — TASK-167
 *
 * React hook that manages the OAuth connect/disconnect lifecycle:
 * idle → confirming → in-progress → success / error.
 *
 * The actual connect/disconnect logic is injected via callbacks,
 * keeping the hook decoupled from any transport layer.
 */
import { useState, useCallback, useRef } from 'react';
import type {
  OAuthConnection,
  OAuthFlowStatus,
} from '../components/oauth/types.js';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface UseOAuthFlowOptions {
  /** Async callback to connect an OAuth provider. */
  onConnect: (connectionId: string) => Promise<void>;
  /** Async callback to disconnect an OAuth provider. */
  onDisconnect: (connectionId: string) => Promise<void>;
  /** Called after a successful connect/disconnect. */
  onSuccess?: (connectionId: string, action: 'connect' | 'disconnect') => void;
  /** Called when connect/disconnect fails. */
  onError?: (connectionId: string, error: Error) => void;
}

export interface UseOAuthFlowResult {
  /** Current lifecycle status. */
  readonly flowStatus: OAuthFlowStatus;
  /** The connection being acted on, or `null` when idle. */
  readonly activeConnection: OAuthConnection | null;
  /** Whether the current action is a disconnect. */
  readonly isDisconnect: boolean;
  /** Error message (available when flowStatus === 'error'). */
  readonly error: string | null;
  /** Begin a connect flow — opens the confirmation dialog. */
  startConnect: (connection: OAuthConnection) => void;
  /** Begin a disconnect flow — opens the confirmation dialog. */
  startDisconnect: (connection: OAuthConnection) => void;
  /** Confirm and execute the pending action. */
  confirm: () => Promise<void>;
  /** Cancel the current flow and return to idle. */
  cancel: () => void;
  /** Reset from success/error back to idle. */
  reset: () => void;
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useOAuthFlow(
  options: UseOAuthFlowOptions,
): UseOAuthFlowResult {
  const [flowStatus, setFlowStatus] = useState<OAuthFlowStatus>('idle');
  const [activeConnection, setActiveConnection] =
    useState<OAuthConnection | null>(null);
  const [isDisconnect, setIsDisconnect] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const startConnect = useCallback((connection: OAuthConnection) => {
    setActiveConnection(connection);
    setIsDisconnect(false);
    setError(null);
    setFlowStatus('confirming');
  }, []);

  const startDisconnect = useCallback((connection: OAuthConnection) => {
    setActiveConnection(connection);
    setIsDisconnect(true);
    setError(null);
    setFlowStatus('confirming');
  }, []);

  const confirm = useCallback(async () => {
    if (!activeConnection) return;

    setFlowStatus('in-progress');
    setError(null);

    try {
      if (isDisconnect) {
        await optionsRef.current.onDisconnect(activeConnection.id);
      } else {
        await optionsRef.current.onConnect(activeConnection.id);
      }
      setFlowStatus('success');
      optionsRef.current.onSuccess?.(
        activeConnection.id,
        isDisconnect ? 'disconnect' : 'connect',
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      setFlowStatus('error');
      optionsRef.current.onError?.(
        activeConnection.id,
        err instanceof Error ? err : new Error(message),
      );
    }
  }, [activeConnection, isDisconnect]);

  const cancel = useCallback(() => {
    setActiveConnection(null);
    setError(null);
    setFlowStatus('idle');
  }, []);

  const reset = useCallback(() => {
    setActiveConnection(null);
    setError(null);
    setFlowStatus('idle');
  }, []);

  return {
    flowStatus,
    activeConnection,
    isDisconnect,
    error,
    startConnect,
    startDisconnect,
    confirm,
    cancel,
    reset,
  };
}
