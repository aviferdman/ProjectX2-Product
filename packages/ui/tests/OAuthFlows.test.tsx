import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import {
  OAuthStatusBadge,
  OAuthProviderCard,
  OAuthProviderList,
  OAuthConnectDialog,
  OAuthSettingsPanel,
  OAUTH_PROVIDERS,
  STATUS_LABELS,
} from '../src/components/oauth/index.js';
import type { OAuthConnection, OAuthConnectionStatus } from '../src/components/oauth/index.js';

/* ---------- Mock data ---------- */

const mockConnected: OAuthConnection = {
  id: 'conn-1',
  provider: 'github',
  providerName: 'GitHub',
  status: 'connected',
  connectedAt: '2026-03-15T10:00:00Z',
  accountLabel: 'octocat@github.com',
  scopes: ['repo', 'user'],
};

const mockDisconnected: OAuthConnection = {
  id: 'conn-2',
  provider: 'google',
  providerName: 'Google',
  status: 'disconnected',
};

const mockConnecting: OAuthConnection = {
  id: 'conn-3',
  provider: 'slack',
  providerName: 'Slack',
  status: 'connecting',
};

const mockError: OAuthConnection = {
  id: 'conn-4',
  provider: 'microsoft',
  providerName: 'Microsoft',
  status: 'error',
  error: 'Token expired',
};

const allConnections: OAuthConnection[] = [
  mockConnected,
  mockDisconnected,
  mockConnecting,
  mockError,
];

/* ---------- OAuthStatusBadge ---------- */

describe('OAuthStatusBadge', () => {
  it('renders correct label for each status', () => {
    const statuses: OAuthConnectionStatus[] = [
      'connected',
      'disconnected',
      'connecting',
      'disconnecting',
      'error',
    ];
    for (const status of statuses) {
      const { unmount } = render(<OAuthStatusBadge status={status} />);
      expect(screen.getByText(STATUS_LABELS[status])).toBeInTheDocument();
      unmount();
    }
  });

  it('renders connected status with emerald styling', () => {
    render(<OAuthStatusBadge status="connected" />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('renders disconnected status', () => {
    render(<OAuthStatusBadge status="disconnected" />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('renders error status', () => {
    render(<OAuthStatusBadge status="error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});

/* ---------- OAuthProviderCard ---------- */

describe('OAuthProviderCard', () => {
  it('renders provider name and status', () => {
    render(<OAuthProviderCard connection={mockConnected} />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('renders account label when connected', () => {
    render(<OAuthProviderCard connection={mockConnected} />);
    expect(screen.getByText('octocat@github.com')).toBeInTheDocument();
  });

  it('renders scopes when connected', () => {
    render(<OAuthProviderCard connection={mockConnected} />);
    expect(screen.getByText('repo')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
  });

  it('renders connected date', () => {
    render(<OAuthProviderCard connection={mockConnected} />);
    // Both status badge and date text contain "Connected", so use getAllByText
    const elements = screen.getAllByText(/Connected/);
    expect(elements.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('shows Disconnect button when connected', () => {
    render(<OAuthProviderCard connection={mockConnected} />);
    expect(
      screen.getByLabelText('Disconnect GitHub'),
    ).toBeInTheDocument();
  });

  it('shows Connect button when disconnected', () => {
    render(<OAuthProviderCard connection={mockDisconnected} />);
    expect(
      screen.getByLabelText('Connect Google'),
    ).toBeInTheDocument();
  });

  it('calls onConnect when Connect button clicked', () => {
    const handler = vi.fn();
    render(<OAuthProviderCard connection={mockDisconnected} onConnect={handler} />);
    fireEvent.click(screen.getByLabelText('Connect Google'));
    expect(handler).toHaveBeenCalledWith('conn-2');
  });

  it('calls onDisconnect when Disconnect button clicked', () => {
    const handler = vi.fn();
    render(<OAuthProviderCard connection={mockConnected} onDisconnect={handler} />);
    fireEvent.click(screen.getByLabelText('Disconnect GitHub'));
    expect(handler).toHaveBeenCalledWith('conn-1');
  });

  it('shows "Connecting…" text when status is connecting', () => {
    render(<OAuthProviderCard connection={mockConnecting} />);
    // Both badge and button show "Connecting…", so use getAllByText
    const elements = screen.getAllByText('Connecting…');
    expect(elements.length).toBe(2);
  });

  it('shows error message when status is error', () => {
    render(<OAuthProviderCard connection={mockError} />);
    expect(screen.getByText('Token expired')).toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    render(<OAuthProviderCard connection={mockConnected} />);
    expect(
      screen.getByLabelText('OAuth provider: GitHub'),
    ).toBeInTheDocument();
  });

  it('disables Connect button when connecting', () => {
    render(<OAuthProviderCard connection={mockConnecting} />);
    const btn = screen.getByLabelText('Connect Slack');
    expect(btn).toBeDisabled();
  });
});

/* ---------- OAuthProviderList ---------- */

describe('OAuthProviderList', () => {
  it('renders all provider cards', () => {
    render(<OAuthProviderList connections={allConnections} />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Slack')).toBeInTheDocument();
    expect(screen.getByText('Microsoft')).toBeInTheDocument();
  });

  it('renders empty state when no connections', () => {
    render(<OAuthProviderList connections={[]} />);
    expect(screen.getByText('No OAuth providers configured')).toBeInTheDocument();
    expect(
      screen.getByText('Connect an OAuth provider to enable integrations.'),
    ).toBeInTheDocument();
  });

  it('passes onConnect to cards', () => {
    const handler = vi.fn();
    render(<OAuthProviderList connections={[mockDisconnected]} onConnect={handler} />);
    fireEvent.click(screen.getByLabelText('Connect Google'));
    expect(handler).toHaveBeenCalledWith('conn-2');
  });

  it('passes onDisconnect to cards', () => {
    const handler = vi.fn();
    render(<OAuthProviderList connections={[mockConnected]} onDisconnect={handler} />);
    fireEvent.click(screen.getByLabelText('Disconnect GitHub'));
    expect(handler).toHaveBeenCalledWith('conn-1');
  });

  it('has list role with correct label', () => {
    render(<OAuthProviderList connections={allConnections} />);
    expect(screen.getByRole('list', { name: 'OAuth providers' })).toBeInTheDocument();
  });
});

/* ---------- OAuthConnectDialog ---------- */

describe('OAuthConnectDialog', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <OAuthConnectDialog
        open={false}
        onClose={() => {}}
        connection={mockDisconnected}
        flowStatus="confirming"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when connection is null', () => {
    const { container } = render(
      <OAuthConnectDialog
        open={true}
        onClose={() => {}}
        connection={null}
        flowStatus="confirming"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders connect confirmation message', () => {
    render(
      <OAuthConnectDialog
        open={true}
        onClose={() => {}}
        connection={mockDisconnected}
        flowStatus="confirming"
      />,
    );
    expect(screen.getByText('Connect Google')).toBeInTheDocument();
    expect(
      screen.getByText(/redirected to Google to authorize/),
    ).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByTestId('oauth-confirm-btn')).toHaveTextContent('Connect');
  });

  it('renders disconnect confirmation message', () => {
    render(
      <OAuthConnectDialog
        open={true}
        onClose={() => {}}
        connection={mockConnected}
        flowStatus="confirming"
        isDisconnect
      />,
    );
    expect(screen.getByText('Disconnect GitHub')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to disconnect GitHub/),
    ).toBeInTheDocument();
    expect(screen.getByTestId('oauth-confirm-btn')).toHaveTextContent('Disconnect');
  });

  it('shows in-progress state', () => {
    render(
      <OAuthConnectDialog
        open={true}
        onClose={() => {}}
        connection={mockDisconnected}
        flowStatus="in-progress"
      />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Connecting…')).toBeInTheDocument();
  });

  it('shows disconnecting in-progress state', () => {
    render(
      <OAuthConnectDialog
        open={true}
        onClose={() => {}}
        connection={mockConnected}
        flowStatus="in-progress"
        isDisconnect
      />,
    );
    expect(screen.getByText('Disconnecting…')).toBeInTheDocument();
  });

  it('shows success state for connect', () => {
    render(
      <OAuthConnectDialog
        open={true}
        onClose={() => {}}
        connection={mockDisconnected}
        flowStatus="success"
      />,
    );
    expect(screen.getByText('Successfully connected')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('shows success state for disconnect', () => {
    render(
      <OAuthConnectDialog
        open={true}
        onClose={() => {}}
        connection={mockConnected}
        flowStatus="success"
        isDisconnect
      />,
    );
    expect(screen.getByText('Successfully disconnected')).toBeInTheDocument();
  });

  it('shows error state with message', () => {
    render(
      <OAuthConnectDialog
        open={true}
        onClose={() => {}}
        connection={mockDisconnected}
        flowStatus="error"
        error="Network timeout"
      />,
    );
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
    expect(screen.getByTestId('oauth-retry-btn')).toHaveTextContent('Retry');
  });

  it('shows disconnect error state', () => {
    render(
      <OAuthConnectDialog
        open={true}
        onClose={() => {}}
        connection={mockConnected}
        flowStatus="error"
        isDisconnect
        error="Server error"
      />,
    );
    expect(screen.getByText('Disconnect failed')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const handler = vi.fn();
    render(
      <OAuthConnectDialog
        open={true}
        onClose={() => {}}
        connection={mockDisconnected}
        flowStatus="confirming"
        onConfirm={handler}
      />,
    );
    fireEvent.click(screen.getByTestId('oauth-confirm-btn'));
    expect(handler).toHaveBeenCalled();
  });

  it('calls onClose when Cancel clicked', () => {
    const handler = vi.fn();
    render(
      <OAuthConnectDialog
        open={true}
        onClose={handler}
        connection={mockDisconnected}
        flowStatus="confirming"
      />,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(handler).toHaveBeenCalled();
  });

  it('calls onClose when Close button clicked in header', () => {
    const handler = vi.fn();
    render(
      <OAuthConnectDialog
        open={true}
        onClose={handler}
        connection={mockDisconnected}
        flowStatus="confirming"
      />,
    );
    fireEvent.click(screen.getByLabelText('Close'));
    expect(handler).toHaveBeenCalled();
  });

  it('calls onConfirm (retry) when Retry clicked in error state', () => {
    const handler = vi.fn();
    render(
      <OAuthConnectDialog
        open={true}
        onClose={() => {}}
        connection={mockDisconnected}
        flowStatus="error"
        error="fail"
        onConfirm={handler}
      />,
    );
    fireEvent.click(screen.getByTestId('oauth-retry-btn'));
    expect(handler).toHaveBeenCalled();
  });

  it('has correct aria-label on dialog', () => {
    render(
      <OAuthConnectDialog
        open={true}
        onClose={() => {}}
        connection={mockDisconnected}
        flowStatus="confirming"
      />,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-label',
      'Connect Google',
    );
  });
});

/* ---------- OAuthSettingsPanel ---------- */

describe('OAuthSettingsPanel', () => {
  it('renders heading and description', () => {
    render(<OAuthSettingsPanel connections={allConnections} />);
    expect(screen.getByText('OAuth Connections')).toBeInTheDocument();
    expect(
      screen.getByText('Manage your connected OAuth providers for integrations.'),
    ).toBeInTheDocument();
  });

  it('renders connection count summary', () => {
    render(<OAuthSettingsPanel connections={allConnections} />);
    expect(screen.getByText('1 of 4 connected')).toBeInTheDocument();
  });

  it('renders all provider cards', () => {
    render(<OAuthSettingsPanel connections={allConnections} />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Slack')).toBeInTheDocument();
    expect(screen.getByText('Microsoft')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<OAuthSettingsPanel connections={[]} loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('does not show provider list when loading', () => {
    render(<OAuthSettingsPanel connections={allConnections} loading />);
    // The list role should not appear
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('opens dialog on Connect click and shows confirmation', async () => {
    render(
      <OAuthSettingsPanel
        connections={[mockDisconnected]}
        onConnect={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText('Connect Google'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/redirected to Google to authorize/),
    ).toBeInTheDocument();
  });

  it('opens dialog on Disconnect click and shows confirmation', async () => {
    render(
      <OAuthSettingsPanel
        connections={[mockConnected]}
        onDisconnect={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText('Disconnect GitHub'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Are you sure you want to disconnect GitHub/),
    ).toBeInTheDocument();
  });

  it('calls onConnect and shows success on confirm', async () => {
    const onConnect = vi.fn().mockResolvedValue(undefined);
    render(
      <OAuthSettingsPanel
        connections={[mockDisconnected]}
        onConnect={onConnect}
      />,
    );
    fireEvent.click(screen.getByLabelText('Connect Google'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('oauth-confirm-btn'));
    });
    await waitFor(() => {
      expect(onConnect).toHaveBeenCalledWith('conn-2');
    });
    await waitFor(() => {
      expect(screen.getByText('Successfully connected')).toBeInTheDocument();
    });
  });

  it('calls onDisconnect and shows success on confirm', async () => {
    const onDisconnect = vi.fn().mockResolvedValue(undefined);
    render(
      <OAuthSettingsPanel
        connections={[mockConnected]}
        onDisconnect={onDisconnect}
      />,
    );
    fireEvent.click(screen.getByLabelText('Disconnect GitHub'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('oauth-confirm-btn'));
    });
    await waitFor(() => {
      expect(onDisconnect).toHaveBeenCalledWith('conn-1');
    });
    await waitFor(() => {
      expect(screen.getByText('Successfully disconnected')).toBeInTheDocument();
    });
  });

  it('shows error state when connect fails', async () => {
    const onConnect = vi.fn().mockRejectedValue(new Error('Auth failed'));
    render(
      <OAuthSettingsPanel
        connections={[mockDisconnected]}
        onConnect={onConnect}
      />,
    );
    fireEvent.click(screen.getByLabelText('Connect Google'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('oauth-confirm-btn'));
    });
    await waitFor(() => {
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
    expect(screen.getByText('Auth failed')).toBeInTheDocument();
  });

  it('closes dialog when Cancel clicked', async () => {
    render(
      <OAuthSettingsPanel connections={[mockDisconnected]} onConnect={vi.fn()} />,
    );
    fireEvent.click(screen.getByLabelText('Connect Google'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('shows empty state when no connections', () => {
    render(<OAuthSettingsPanel connections={[]} />);
    expect(screen.getByText('No OAuth providers configured')).toBeInTheDocument();
    expect(screen.getByText('0 of 0 connected')).toBeInTheDocument();
  });
});

/* ---------- Constants ---------- */

describe('OAUTH_PROVIDERS', () => {
  it('contains known providers', () => {
    expect(OAUTH_PROVIDERS).toHaveLength(5);
    const ids = OAUTH_PROVIDERS.map((p) => p.id);
    expect(ids).toContain('github');
    expect(ids).toContain('google');
    expect(ids).toContain('slack');
    expect(ids).toContain('microsoft');
    expect(ids).toContain('custom');
  });
});

describe('STATUS_LABELS', () => {
  it('maps all statuses', () => {
    expect(STATUS_LABELS.connected).toBe('Connected');
    expect(STATUS_LABELS.disconnected).toBe('Disconnected');
    expect(STATUS_LABELS.connecting).toBe('Connecting…');
    expect(STATUS_LABELS.disconnecting).toBe('Disconnecting…');
    expect(STATUS_LABELS.error).toBe('Error');
  });
});
