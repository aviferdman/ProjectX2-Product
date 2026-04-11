/**
 * AuthContext — React context for authentication state.
 * TASK-131: Provides login, logout, and session management.
 */
import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { AuthState, AuthContextValue, LoginCredentials, OAuthProviderType, User } from './types.js';

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; user: User }
  | { type: 'LOGIN_FAILURE'; error: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_START' }
  | { type: 'REFRESH_SUCCESS'; user: User }
  | { type: 'REFRESH_FAILURE'; error: string };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REFRESH_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
    case 'REFRESH_SUCCESS':
      return { user: action.user, isAuthenticated: true, isLoading: false, error: null };
    case 'LOGIN_FAILURE':
    case 'REFRESH_FAILURE':
      return { user: null, isAuthenticated: false, isLoading: false, error: action.error };
    case 'LOGOUT':
      return { ...initialState };
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextValue | null>(null);
AuthContext.displayName = 'AuthContext';

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

/**
 * Access the current auth state and actions.
 * Must be called within an `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Provider props                                                      */
/* ------------------------------------------------------------------ */

/** Adapter interface for pluggable auth backends. */
export interface AuthAdapter {
  login(credentials: LoginCredentials): Promise<User>;
  loginWithOAuth?(provider: OAuthProviderType): Promise<User>;
  logout(): Promise<void>;
  refreshSession(): Promise<User>;
}

export interface AuthProviderProps {
  adapter: AuthAdapter;
  children: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function AuthProvider({ adapter, children }: AuthProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      dispatch({ type: 'LOGIN_START' });
      try {
        const user = await adapter.login(credentials);
        dispatch({ type: 'LOGIN_SUCCESS', user });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        dispatch({ type: 'LOGIN_FAILURE', error: message });
      }
    },
    [adapter],
  );

  const loginWithOAuth = useCallback(
    async (provider: OAuthProviderType) => {
      dispatch({ type: 'LOGIN_START' });
      try {
        if (!adapter.loginWithOAuth) {
          throw new Error('OAuth login is not supported by this auth adapter');
        }
        const user = await adapter.loginWithOAuth(provider);
        dispatch({ type: 'LOGIN_SUCCESS', user });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'OAuth login failed';
        dispatch({ type: 'LOGIN_FAILURE', error: message });
      }
    },
    [adapter],
  );

  const logout = useCallback(async () => {
    try {
      await adapter.logout();
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  }, [adapter]);

  const refreshSession = useCallback(async () => {
    dispatch({ type: 'REFRESH_START' });
    try {
      const user = await adapter.refreshSession();
      dispatch({ type: 'REFRESH_SUCCESS', user });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Session refresh failed';
      dispatch({ type: 'REFRESH_FAILURE', error: message });
    }
  }, [adapter]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, loginWithOAuth, logout, refreshSession }),
    [state, login, loginWithOAuth, logout, refreshSession],
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

export { initialState as AUTH_INITIAL_STATE };
