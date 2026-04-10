/**
 * Route configuration for the Crewspace application.
 * Lovable-style: prompt-first landing → workflow editor with chat.
 */

/** Route path constants — single source of truth for navigation. */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CANVAS: '/canvas/:workflowId',
  WORKFLOW: '/workflow/:workflowId',
  TEMPLATES: '/templates',
  MARKETPLACE: '/marketplace',
  SETTINGS: '/settings',
} as const;

/** Helper to build the canvas route for a specific workflow. */
export function canvasPath(workflowId: string): string {
  return `/canvas/${encodeURIComponent(workflowId)}`;
}

/** Helper to build the workflow route for a specific workflow. */
export function workflowPath(workflowId: string): string {
  return `/workflow/${encodeURIComponent(workflowId)}`;
}

/** Route metadata used by navigation components. */
export interface RouteEntry {
  readonly path: string;
  readonly label: string;
  readonly icon?: string;
  readonly requiresAuth: boolean;
}

/** Ordered list of navigable routes for sidebar / navbar rendering. */
export const NAV_ROUTES: readonly RouteEntry[] = [
  { path: ROUTES.HOME, label: 'Home', icon: 'home', requiresAuth: false },
  { path: ROUTES.DASHBOARD, label: 'Projects', icon: 'folder', requiresAuth: true },
  { path: ROUTES.TEMPLATES, label: 'Templates', icon: 'template', requiresAuth: true },
  { path: ROUTES.MARKETPLACE, label: 'Marketplace', icon: 'store', requiresAuth: true },
  { path: ROUTES.SETTINGS, label: 'Settings', icon: 'settings', requiresAuth: true },
];
