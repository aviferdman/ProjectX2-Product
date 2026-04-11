/**
 * AppRouter — top-level route tree for the Crewspace SPA.
 * Lovable-style: prompt-first home → workflow editor with chat.
 */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ROUTES } from './routes.js';
import { ProtectedRoute } from './ProtectedRoute.js';
import { HomePage } from '../pages/HomePage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { CanvasPage } from '../pages/CanvasPage.js';
import { WorkflowPage } from '../pages/WorkflowPage.js';
import { TemplatesPage } from '../pages/TemplatesPage.js';
import { MarketplacePage } from '../pages/MarketplacePage.js';
import { SettingsPage } from '../pages/SettingsPage.js';
import { NotFoundPage } from '../pages/NotFoundPage.js';
import { CrewsPage } from '../pages/CrewsPage.js';
import { CrewDetail } from '../components/crews/CrewDetail.js';

export interface AppRouterProps {
  children?: React.ReactNode;
}

function ProtectedChildren({ children }: { children: React.ReactNode }): React.JSX.Element {
  return React.createElement(ProtectedRoute, null, children);
}

export function AppRouter({ children }: AppRouterProps): React.JSX.Element {
  return React.createElement(
    BrowserRouter,
    null,
    children,
    React.createElement(
      Routes,
      null,
      /* Public routes */
      React.createElement(Route, {
        path: ROUTES.HOME,
        element: React.createElement(HomePage),
      }),
      React.createElement(Route, {
        path: ROUTES.LOGIN,
        element: React.createElement(LoginPage),
      }),
      /* Main workflow editor route */
      React.createElement(Route, {
        path: ROUTES.WORKFLOW,
        element: React.createElement(WorkflowPage),
      }),
      /* Dashboard — public for now (skip auth) */
      React.createElement(Route, {
        path: ROUTES.DASHBOARD,
        element: React.createElement(DashboardPage),
      }),
      /* Crews */
      React.createElement(Route, {
        path: ROUTES.CREWS,
        element: React.createElement(CrewsPage),
      }),
      React.createElement(Route, {
        path: ROUTES.CREW_DETAIL,
        element: React.createElement(CrewDetail),
      }),
      React.createElement(Route, {
        path: ROUTES.CANVAS,
        element: React.createElement(ProtectedChildren, null, React.createElement(CanvasPage)),
      }),
      React.createElement(Route, {
        path: ROUTES.TEMPLATES,
        element: React.createElement(ProtectedChildren, null, React.createElement(TemplatesPage)),
      }),
      React.createElement(Route, {
        path: ROUTES.MARKETPLACE,
        element: React.createElement(ProtectedChildren, null, React.createElement(MarketplacePage)),
      }),
      React.createElement(Route, {
        path: ROUTES.SETTINGS,
        element: React.createElement(ProtectedChildren, null, React.createElement(SettingsPage)),
      }),
      /* Catch-all */
      React.createElement(Route, {
        path: '*',
        element: React.createElement(NotFoundPage),
      }),
    ),
  );
}
