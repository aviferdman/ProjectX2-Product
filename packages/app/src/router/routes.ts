/**
 * Route configuration for the Crewspace application.
 * TASK-131: Centralized route definitions.
 */

/** Route path constants — single source of truth for navigation. */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CANVAS: '/canvas/:workflowId',
  TEMPLATES: '/templates',
  MARKETPLACE: '/marketplace',
  SETTINGS: '/settings',
} as const;

/** Helper to build the canvas route for a specific workflow. */
export function canvasPath(workflowId: string): string {
  return `/canvas/${encodeURIComponent(workflowId)}`;
}

/** Route metadata used by navigation components. */
export interface RouteEntry {
  readonly path: string;
  readonly label: string;
  readonly requiresAuth: boolean;
}

/** Ordered list of navigable routes for sidebar / navbar rendering. */
export const NAV_ROUTES: readonly RouteEntry[] = [
  { path: ROUTES.DASHBOARD, label: 'Dashboard', requiresAuth: true },
  { path: ROUTES.TEMPLATES, label: 'Templates', requiresAuth: true },
  { path: ROUTES.MARKETPLACE, label: 'Marketplace', requiresAuth: true },
  { path: ROUTES.SETTINGS, label: 'Settings', requiresAuth: true },
];
