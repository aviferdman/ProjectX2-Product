/**
 * Store module — public API.
 * TASK-131: Global app state management.
 */
export { AppProvider, useAppStore, APP_INITIAL_STATE } from './AppContext.js';
export type { AppProviderProps } from './AppContext.js';
export type {
  SidebarMode,
  ThemeMode,
  NotificationLevel,
  AppNotification,
  AppState,
  AppActions,
  AppContextValue,
} from './types.js';
