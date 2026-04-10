/**
 * @crewspace/app — React application scaffold.
 * TASK-131: Routing, auth, and state management.
 *
 * This package provides:
 * - Authentication context (login, logout, session refresh)
 * - Global app state management (sidebar, theme, notifications)
 * - Route definitions with auth guards
 * - Placeholder page components
 */

// App root
export { App } from './App.js';
export type { AppProps } from './App.js';

// Auth
export {
  AuthProvider,
  useAuth,
  AUTH_INITIAL_STATE,
} from './auth/index.js';
export type {
  AuthProviderProps,
  AuthAdapter,
  User,
  UserRole,
  AuthState,
  LoginCredentials,
  AuthActions,
  AuthContextValue,
} from './auth/index.js';

// Store
export {
  AppProvider,
  useAppStore,
  APP_INITIAL_STATE,
} from './store/index.js';
export type {
  AppProviderProps,
  SidebarMode,
  ThemeMode,
  NotificationLevel,
  AppNotification,
  AppState,
  AppActions,
  AppContextValue,
} from './store/index.js';

// Router
export {
  AppRouter,
  ProtectedRoute,
  ROUTES,
  NAV_ROUTES,
  canvasPath,
} from './router/index.js';
export type {
  AppRouterProps,
  ProtectedRouteProps,
  RouteEntry,
} from './router/index.js';

// Pages
export {
  LoginPage,
  DashboardPage,
  CanvasPage,
  TemplatesPage,
  MarketplacePage,
  SettingsPage,
  NotFoundPage,
} from './pages/index.js';
