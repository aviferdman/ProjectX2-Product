/**
 * Auth module — public API.
 * TASK-131: Authentication context and types.
 */
export { AuthProvider, useAuth, AUTH_INITIAL_STATE } from './AuthContext.js';
export type { AuthProviderProps, AuthAdapter } from './AuthContext.js';
export { createOAuthAuthAdapter } from './OAuthAuthAdapter.js';
export type {
  User,
  UserRole,
  AuthState,
  LoginCredentials,
  OAuthProviderType,
  AuthActions,
  AuthContextValue,
} from './types.js';
