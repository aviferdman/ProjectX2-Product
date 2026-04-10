/**
 * SettingsPage — placeholder settings view.
 * TASK-131: Protected page scaffold.
 */
import React from 'react';

export function SettingsPage(): React.JSX.Element {
  return React.createElement(
    'main',
    { 'data-testid': 'settings-page' },
    React.createElement('h1', null, 'Settings'),
  );
}
