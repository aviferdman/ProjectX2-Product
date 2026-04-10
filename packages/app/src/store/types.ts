/**
 * App store types for global state management.
 * TASK-131: Centralized application state.
 */

/** Possible sidebar states. */
export type SidebarMode = 'expanded' | 'collapsed' | 'hidden';

/** Theme preference. */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Notification urgency level. */
export type NotificationLevel = 'info' | 'warning' | 'error' | 'success';

/** A single in-app notification. */
export interface AppNotification {
  readonly id: string;
  readonly message: string;
  readonly level: NotificationLevel;
  readonly timestamp: number;
  readonly dismissed: boolean;
}

/** Global application state. */
export interface AppState {
  readonly sidebarMode: SidebarMode;
  readonly theme: ThemeMode;
  readonly notifications: readonly AppNotification[];
  readonly activeWorkflowId: string | null;
}

/** Actions exposed by the app store context. */
export interface AppActions {
  setSidebarMode(mode: SidebarMode): void;
  setTheme(theme: ThemeMode): void;
  addNotification(message: string, level: NotificationLevel): void;
  dismissNotification(id: string): void;
  clearNotifications(): void;
  setActiveWorkflow(workflowId: string | null): void;
}

/** Combined store context value. */
export type AppContextValue = AppState & AppActions;
