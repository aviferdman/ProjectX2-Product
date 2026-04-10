/**
 * OAuth flow types — TASK-167
 */

/** Supported OAuth provider identifiers. */
export type OAuthProvider =
  | 'github'
  | 'google'
  | 'slack'
  | 'microsoft'
  | 'custom';

/** Connection status of an OAuth provider. */
export type OAuthConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'disconnecting'
  | 'error';

/** A configured OAuth connection. */
export interface OAuthConnection {
  readonly id: string;
  readonly provider: OAuthProvider;
  readonly providerName: string;
  readonly status: OAuthConnectionStatus;
  readonly connectedAt?: string;
  readonly accountLabel?: string;
  readonly scopes?: readonly string[];
  readonly error?: string;
}

/** Lifecycle status of an OAuth flow (connect or disconnect). */
export type OAuthFlowStatus =
  | 'idle'
  | 'confirming'
  | 'in-progress'
  | 'success'
  | 'error';

/** Display metadata for providers. */
export interface OAuthProviderMeta {
  readonly id: OAuthProvider;
  readonly name: string;
  readonly description: string;
}

export const OAUTH_PROVIDERS: OAuthProviderMeta[] = [
  { id: 'github', name: 'GitHub', description: 'Source control and CI/CD' },
  { id: 'google', name: 'Google', description: 'Google Workspace and APIs' },
  { id: 'slack', name: 'Slack', description: 'Team messaging and notifications' },
  { id: 'microsoft', name: 'Microsoft', description: 'Azure and Microsoft 365' },
  { id: 'custom', name: 'Custom', description: 'Custom OAuth provider' },
];

/** Map status to display labels. */
export const STATUS_LABELS: Record<OAuthConnectionStatus, string> = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  connecting: 'Connecting…',
  disconnecting: 'Disconnecting…',
  error: 'Error',
};
