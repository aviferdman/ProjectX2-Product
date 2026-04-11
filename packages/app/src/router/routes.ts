/**
 * Route configuration for the Crewspace application.
 * Lovable-style: prompt-first landing → workflow editor with chat.
 */

/** Route path constants — single source of truth for navigation. */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CREWS: '/crews',
  CREW_DETAIL: '/crews/:crewId',
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

/** Helper to build the crew detail route. */
export function crewPath(crewId: string): string {
  return `/crews/${encodeURIComponent(crewId)}`;
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
  { path: ROUTES.CREWS, label: 'My Crews', icon: 'users', requiresAuth: false },
  { path: ROUTES.TEMPLATES, label: 'Templates', icon: 'template', requiresAuth: true },
  { path: ROUTES.MARKETPLACE, label: 'Marketplace', icon: 'store', requiresAuth: true },
  { path: ROUTES.SETTINGS, label: 'Settings', icon: 'settings', requiresAuth: true },
];
