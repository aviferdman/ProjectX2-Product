/**
 * Auth types for the Crewspace application.
 * TASK-131: Authentication state management
 */

/** Represents an authenticated user. */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl?: string;
  readonly role: UserRole;
}

/** User roles within Crewspace. */
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

/** Authentication state. */
export interface AuthState {
  readonly user: User | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
}

/** Credentials for email/password login. */
export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

/** Supported OAuth providers. */
export type OAuthProviderType = 'github' | 'google' | 'microsoft';

/** Actions exposed by the auth context. */
export interface AuthActions {
  login(credentials: LoginCredentials): Promise<void>;
  loginWithOAuth(provider: OAuthProviderType): Promise<void>;
  logout(): Promise<void>;
  refreshSession(): Promise<void>;
}

/** Combined auth context value. */
export type AuthContextValue = AuthState & AuthActions;
