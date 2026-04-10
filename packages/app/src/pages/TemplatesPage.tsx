/**
 * TemplatesPage — placeholder template browser view.
 * TASK-131: Protected page scaffold.
 */
import React from 'react';

export function TemplatesPage(): React.JSX.Element {
  return React.createElement(
    'main',
    { 'data-testid': 'templates-page' },
    React.createElement('h1', null, 'Templates'),
  );
}
