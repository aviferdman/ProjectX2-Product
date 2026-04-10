/**
 * DashboardPage — styled dashboard view.
 * TASK-131: Protected page scaffold.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody, Button } from '@crewspace/ui';
import { useAuth } from '../auth/index.js';
import { ROUTES, canvasPath } from '../router/routes.js';

export function DashboardPage(): React.JSX.Element {
  const { user } = useAuth();

  return (
    <main
      data-testid="dashboard-page"
      className="min-h-screen bg-surface-app p-6"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          {user && (
            <p className="mt-1 text-text-secondary">Welcome back, {user.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card hoverable>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text-primary">Workflows</h2>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-secondary mb-4">
                Create and manage your AI agent workflows.
              </p>
              <Link to={canvasPath('new')}>
                <Button size="sm">New Workflow</Button>
              </Link>
            </CardBody>
          </Card>

          <Card hoverable>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text-primary">Templates</h2>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-secondary mb-4">
                Browse pre-built workflow templates.
              </p>
              <Link to={ROUTES.TEMPLATES}>
                <Button variant="secondary" size="sm">Browse</Button>
              </Link>
            </CardBody>
          </Card>

          <Card hoverable>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text-primary">Marketplace</h2>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-secondary mb-4">
                Discover integrations and extensions.
              </p>
              <Link to={ROUTES.MARKETPLACE}>
                <Button variant="secondary" size="sm">Explore</Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}
