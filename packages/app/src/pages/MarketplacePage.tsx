/**
 * MarketplacePage — placeholder marketplace browser view.
 * TASK-131: Protected page scaffold.
 */
import React from 'react';

export function MarketplacePage(): React.JSX.Element {
  return React.createElement(
    'main',
    { 'data-testid': 'marketplace-page' },
    React.createElement('h1', null, 'Marketplace'),
  );
}
