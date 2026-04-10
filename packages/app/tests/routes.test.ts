/**
 * Route configuration tests.
 * TASK-131: Verifies route constants and helpers.
 */
import { describe, it, expect } from 'vitest';
import { ROUTES, NAV_ROUTES, canvasPath } from '../src/router/routes.js';

describe('routes', () => {
  it('defines all expected route paths', () => {
    expect(ROUTES.HOME).toBe('/');
    expect(ROUTES.LOGIN).toBe('/login');
    expect(ROUTES.DASHBOARD).toBe('/dashboard');
    expect(ROUTES.CANVAS).toBe('/canvas/:workflowId');
    expect(ROUTES.TEMPLATES).toBe('/templates');
    expect(ROUTES.MARKETPLACE).toBe('/marketplace');
    expect(ROUTES.SETTINGS).toBe('/settings');
  });

  it('canvasPath builds correct URL', () => {
    expect(canvasPath('wf-123')).toBe('/canvas/wf-123');
  });

  it('canvasPath encodes special characters', () => {
    expect(canvasPath('hello world')).toBe('/canvas/hello%20world');
  });

  it('NAV_ROUTES lists navigable authenticated routes', () => {
    expect(NAV_ROUTES.length).toBeGreaterThanOrEqual(3);
    for (const route of NAV_ROUTES) {
      expect(route.requiresAuth).toBe(true);
      expect(route.label).toBeTruthy();
      expect(route.path).toBeTruthy();
    }
  });
});
