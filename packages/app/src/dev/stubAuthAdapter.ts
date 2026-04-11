/**
 * Stub auth adapter for local development.
 * Accepts any credentials and returns a fake user.
 */
import type { AuthAdapter } from '../auth/index.js';
import type { User, LoginCredentials, OAuthProviderType } from '../auth/index.js';

const STUB_USER: User = {
  id: 'dev-user-1',
  email: 'dev@crewspace.local',
  name: 'Dev User',
  role: 'owner',
};

export const stubAuthAdapter: AuthAdapter = {
  async login(_credentials: LoginCredentials): Promise<User> {
    return STUB_USER;
  },

  async loginWithOAuth(_provider: OAuthProviderType): Promise<User> {
    // Simulate a brief delay to mimic OAuth popup flow
    await new Promise((r) => setTimeout(r, 800));
    return { ...STUB_USER, name: `Dev User (OAuth)` };
  },

  async logout(): Promise<void> {
    // no-op in dev
  },

  async refreshSession(): Promise<User> {
    return STUB_USER;
  },
};
