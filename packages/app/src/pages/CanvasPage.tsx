/**
 * CanvasPage — placeholder canvas editor view.
 * TASK-131: Protected page scaffold.
 */
import React from 'react';
import { useParams } from 'react-router-dom';

export function CanvasPage(): React.JSX.Element {
  const { workflowId } = useParams<{ workflowId: string }>();

  return React.createElement(
    'main',
    { 'data-testid': 'canvas-page' },
    React.createElement('h1', null, 'Canvas Editor'),
    React.createElement('p', null, `Workflow: ${workflowId ?? 'none'}`),
  );
}
