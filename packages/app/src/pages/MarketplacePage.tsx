/**
 * MarketplacePage — styled marketplace browser view.
 * TASK-131: Protected page scaffold.
 */
import React from 'react';
import { Card, CardBody } from '@crewspace/ui';

export function MarketplacePage(): React.JSX.Element {
  return (
    <main
      data-testid="marketplace-page"
      className="min-h-screen bg-surface-app p-6"
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Marketplace</h1>
        <p className="text-text-secondary mb-6">
          Discover integrations, tools, and extensions for your workflows.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card hoverable>
            <CardBody>
              <p className="text-sm text-text-tertiary">Integrations coming soon.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}
