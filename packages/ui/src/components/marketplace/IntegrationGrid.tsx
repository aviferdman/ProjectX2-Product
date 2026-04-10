import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import type { IntegrationSummary } from './types.js';
import { IntegrationCard } from './IntegrationCard.js';

export interface IntegrationGridProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  integrations: IntegrationSummary[];
  onInstall?: ((id: string) => void) | undefined;
  onViewDetails?: ((id: string) => void) | undefined;
}

export const IntegrationGrid = forwardRef<HTMLDivElement, IntegrationGridProps>(
  function IntegrationGrid(
    { integrations, onInstall, onViewDetails, className, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={clsx(
          'grid gap-4',
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          className,
        )}
        style={{
          gridTemplateColumns:
            'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
        }}
        {...props}
      >
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onInstall={onInstall}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    );
  },
);
