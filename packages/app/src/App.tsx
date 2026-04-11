/**
 * App — root application component.
 * TASK-131: Composes auth, store, and router providers.
 */
import React from 'react';
import { AuthProvider } from './auth/index.js';
import type { AuthAdapter } from './auth/index.js';
import { AppProvider } from './store/index.js';
import { CrewProvider } from './store/index.js';
import type { AppState } from './store/index.js';
import { AppRouter } from './router/index.js';

export interface AppProps {
  authAdapter: AuthAdapter;
  initialAppState?: Partial<AppState>;
  children?: React.ReactNode;
}

/**
 * Root application shell.
 * Wraps the component tree with AuthProvider → AppProvider → CrewProvider → AppRouter.
 */
export function App({ authAdapter, initialAppState, children }: AppProps): React.JSX.Element {
  return (
    <AuthProvider adapter={authAdapter}>
      <AppProvider {...(initialAppState !== undefined ? { initialState: initialAppState } : {})}>
        <CrewProvider>
          <AppRouter>{children}</AppRouter>
        </CrewProvider>
      </AppProvider>
    </AuthProvider>
  );
}
