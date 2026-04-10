/**
 * CanvasPage — styled canvas editor view.
 * TASK-131: Protected page scaffold.
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '@crewspace/ui';

export function CanvasPage(): React.JSX.Element {
  const { workflowId } = useParams<{ workflowId: string }>();

  return (
    <main
      data-testid="canvas-page"
      className="min-h-screen bg-surface-canvas flex flex-col"
    >
      <div className="border-b border-border-default bg-surface-panel px-4 py-3 flex items-center gap-3">
        <h1 className="text-lg font-semibold text-text-primary">Canvas Editor</h1>
        <Badge variant="info">{workflowId ?? 'new'}</Badge>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-tertiary text-sm">
          Drag agents and tasks from the toolbar to build your workflow.
        </p>
      </div>
    </main>
  );
}
