/**
 * AppContext — React context for global application state.
 * TASK-131: Centralized state management via useReducer.
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import type {
  AppState,
  AppContextValue,
  SidebarMode,
  ThemeMode,
  NotificationLevel,
  AppNotification,
} from './types.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

let notificationCounter = 0;

function generateNotificationId(): string {
  notificationCounter += 1;
  return `notif-${Date.now()}-${String(notificationCounter)}`;
}

/** Reset counter (exposed for testing only). */
export function _resetNotificationCounter(): void {
  notificationCounter = 0;
}

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

type AppAction =
  | { type: 'SET_SIDEBAR_MODE'; mode: SidebarMode }
  | { type: 'SET_THEME'; theme: ThemeMode }
  | { type: 'ADD_NOTIFICATION'; notification: AppNotification }
  | { type: 'DISMISS_NOTIFICATION'; id: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_ACTIVE_WORKFLOW'; workflowId: string | null };

const initialState: AppState = {
  sidebarMode: 'expanded',
  theme: 'light',
  notifications: [],
  activeWorkflowId: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SIDEBAR_MODE':
      return { ...state, sidebarMode: action.mode };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.notification] };
    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, dismissed: true } : n,
        ),
      };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    case 'SET_ACTIVE_WORKFLOW':
      return { ...state, activeWorkflowId: action.workflowId };
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

const AppContext = createContext<AppContextValue | null>(null);
AppContext.displayName = 'AppContext';

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

/**
 * Access global application state and actions.
 * Must be called within an `<AppProvider>`.
 */
export function useAppStore(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppStore must be used within an <AppProvider>');
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export interface AppProviderProps {
  initialState?: Partial<AppState>;
  children: React.ReactNode;
}

export function AppProvider({
  initialState: overrides,
  children,
}: AppProviderProps): React.JSX.Element {
  const merged: AppState = { ...initialState, ...overrides };
  const [state, dispatch] = useReducer(appReducer, merged);

  /* Apply data-theme attribute to <html> for CSS variable switching */
  useEffect(() => {
    const html = document.documentElement;
    if (state.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        html.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    } else {
      html.setAttribute('data-theme', state.theme);
    }
  }, [state.theme]);

  const setSidebarMode = useCallback((mode: SidebarMode) => {
    dispatch({ type: 'SET_SIDEBAR_MODE', mode });
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    dispatch({ type: 'SET_THEME', theme });
  }, []);

  const addNotification = useCallback((message: string, level: NotificationLevel) => {
    const notification: AppNotification = {
      id: generateNotificationId(),
      message,
      level,
      timestamp: Date.now(),
      dismissed: false,
    };
    dispatch({ type: 'ADD_NOTIFICATION', notification });
  }, []);

  const dismissNotification = useCallback((id: string) => {
    dispatch({ type: 'DISMISS_NOTIFICATION', id });
  }, []);

  const clearNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  }, []);

  const setActiveWorkflow = useCallback((workflowId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_WORKFLOW', workflowId });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      setSidebarMode,
      setTheme,
      addNotification,
      dismissNotification,
      clearNotifications,
      setActiveWorkflow,
    }),
    [
      state,
      setSidebarMode,
      setTheme,
      addNotification,
      dismissNotification,
      clearNotifications,
      setActiveWorkflow,
    ],
  );

  return React.createElement(AppContext.Provider, { value }, children);
}

export { initialState as APP_INITIAL_STATE };
