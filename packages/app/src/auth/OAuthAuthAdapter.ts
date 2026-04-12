/**
 * OAuthAuthAdapter — OAuth-based authentication adapter.
 *
 * Supports GitHub, Google, and Microsoft OAuth flows via popup window.
 * Persists session in localStorage for refresh across page reloads.
 */
import type { AuthAdapter } from './AuthContext.js';
import type { User, LoginCredentials, OAuthProviderType } from './types.js';

const SESSION_KEY = 'crewspace:auth-session';

interface OAuthConfig {
  github?: { clientId: string; redirectUri: string };
  google?: { clientId: string; redirectUri: string };
  microsoft?: { clientId: string; tenantId?: string; redirectUri: string };
}

interface StoredSession {
  user: User;
  accessToken: string;
  provider: OAuthProviderType;
  expiresAt: number;
}

const OAUTH_ENDPOINTS: Record<
  OAuthProviderType,
  { authorizeUrl: string; tokenUrl: string; userInfoUrl: string }
> = {
  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
  },
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },
  microsoft: {
    authorizeUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
  },
};

const SCOPES: Record<OAuthProviderType, string> = {
  github: 'read:user user:email',
  google: 'openid email profile',
  microsoft: 'openid email profile User.Read',
};

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

function storeSession(session: StoredSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage full or disabled — session won't persist across reloads
  }
}

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw) as StoredSession;
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function createOAuthAuthAdapter(config: OAuthConfig): AuthAdapter {
  return {
    async login(_credentials: LoginCredentials): Promise<User> {
      // Email/password login — delegate to a backend API if available.
      // For now, fall back to checking for an existing session.
      const session = loadSession();
      if (session) return session.user;
      throw new Error('Email/password login is not configured. Use OAuth to sign in.');
    },

    async loginWithOAuth(provider: OAuthProviderType): Promise<User> {
      const providerConfig = config[provider];
      if (!providerConfig) {
        throw new Error(`OAuth provider "${provider}" is not configured`);
      }

      const endpoints = OAUTH_ENDPOINTS[provider];
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateState();

      // Build authorization URL
      const tenantId = (provider === 'microsoft' && config.microsoft?.tenantId) || 'common';
      const authorizeUrl = new URL(endpoints.authorizeUrl.replace('{tenantId}', tenantId));

      authorizeUrl.searchParams.set('client_id', providerConfig.clientId);
      authorizeUrl.searchParams.set('redirect_uri', providerConfig.redirectUri);
      authorizeUrl.searchParams.set('response_type', 'code');
      authorizeUrl.searchParams.set('scope', SCOPES[provider]);
      authorizeUrl.searchParams.set('state', state);
      authorizeUrl.searchParams.set('code_challenge', codeChallenge);
      authorizeUrl.searchParams.set('code_challenge_method', 'S256');

      // Store PKCE verifier and state for the callback
      sessionStorage.setItem('crewspace:oauth-verifier', codeVerifier);
      sessionStorage.setItem('crewspace:oauth-state', state);
      sessionStorage.setItem('crewspace:oauth-provider', provider);

      // Open popup
      const width = 500;
      const height = 650;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;
      const popup = window.open(
        authorizeUrl.toString(),
        'crewspace-oauth',
        `width=${width},height=${height},left=${left},top=${top},popup=yes`,
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Wait for the popup to redirect back with the authorization code
      const code = await new Promise<string>((resolve, reject) => {
        const checkInterval = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(checkInterval);
              reject(new Error('OAuth popup was closed'));
              return;
            }
            // Check if the popup has redirected to our redirect URI
            const popupUrl = popup.location.href;
            if (popupUrl.startsWith(providerConfig.redirectUri)) {
              clearInterval(checkInterval);
              const url = new URL(popupUrl);
              const returnedState = url.searchParams.get('state');
              const authCode = url.searchParams.get('code');
              const error = url.searchParams.get('error');
              popup.close();

              if (error) {
                reject(
                  new Error(`OAuth error: ${url.searchParams.get('error_description') ?? error}`),
                );
                return;
              }
              if (returnedState !== state) {
                reject(new Error('OAuth state mismatch — possible CSRF attack'));
                return;
              }
              if (!authCode) {
                reject(new Error('No authorization code received'));
                return;
              }
              resolve(authCode);
            }
          } catch {
            // Cross-origin — popup is still on the OAuth provider's page
          }
        }, 200);

        // Timeout after 5 minutes
        setTimeout(
          () => {
            clearInterval(checkInterval);
            popup.close();
            reject(new Error('OAuth login timed out'));
          },
          5 * 60 * 1000,
        );
      });

      // Exchange code for token — in production this goes through your backend.
      // Here we call the token endpoint directly (works for GitHub with CORS proxy,
      // Google with PKCE, and Microsoft with SPA flow).
      const tokenResponse = await fetch(endpoints.tokenUrl.replace('{tenantId}', tenantId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          client_id: providerConfig.clientId,
          code,
          redirect_uri: providerConfig.redirectUri,
          grant_type: 'authorization_code',
          code_verifier: codeVerifier,
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const text = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${text}`);
      }

      const tokenData = (await tokenResponse.json()) as {
        access_token: string;
        expires_in?: number;
      };
      const accessToken = tokenData.access_token;
      const expiresIn = tokenData.expires_in ?? 3600;

      // Fetch user profile
      const userResponse = await fetch(endpoints.userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const profile = (await userResponse.json()) as Record<string, unknown>;
      const user = mapProfileToUser(provider, profile);

      // Persist session
      storeSession({
        user,
        accessToken,
        provider,
        expiresAt: Date.now() + expiresIn * 1000,
      });

      // Clean up PKCE values
      sessionStorage.removeItem('crewspace:oauth-verifier');
      sessionStorage.removeItem('crewspace:oauth-state');
      sessionStorage.removeItem('crewspace:oauth-provider');

      return user;
    },

    async logout(): Promise<void> {
      clearSession();
    },

    async refreshSession(): Promise<User> {
      const session = loadSession();
      if (session) return session.user;
      throw new Error('No active session');
    },
  };
}

function mapProfileToUser(provider: OAuthProviderType, profile: Record<string, unknown>): User {
  switch (provider) {
    case 'github':
      return {
        id: `github-${String(profile['id'] ?? '')}`,
        email: String(profile['email'] ?? `${String(profile['login'] ?? '')}@github.com`),
        name: String(profile['name'] ?? profile['login'] ?? 'GitHub User'),
        ...(profile['avatar_url'] ? { avatarUrl: String(profile['avatar_url']) } : {}),
        role: 'member',
      };
    case 'google':
      return {
        id: `google-${String(profile['id'] ?? '')}`,
        email: String(profile['email'] ?? ''),
        name: String(profile['name'] ?? 'Google User'),
        ...(profile['picture'] ? { avatarUrl: String(profile['picture']) } : {}),
        role: 'member',
      };
    case 'microsoft':
      return {
        id: `ms-${String(profile['id'] ?? '')}`,
        email: String(profile['mail'] ?? profile['userPrincipalName'] ?? ''),
        name: String(profile['displayName'] ?? 'Microsoft User'),
        role: 'member',
      };
  }
}
