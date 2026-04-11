/**
 * Custom dotted-grid background for the canvas viewport.
 * TASK-135: Implement React Flow canvas
 */
import { Background, BackgroundVariant } from '@xyflow/react';
import { CANVAS_CONFIG } from './types.js';

export interface CanvasBackgroundProps {
  /** Override grid dot spacing in pixels. */
  gap?: number;
  /** Override dot size in pixels. */
  size?: number;
}

export function CanvasBackground({
  gap = CANVAS_CONFIG.gridSize,
  size = 1,
}: CanvasBackgroundProps) {
  return (
    <Background
      variant={BackgroundVariant.Dots}
      gap={gap}
      size={size}
      color="rgba(113,113,122,0.12)"
    />
  );
}

CanvasBackground.displayName = 'CanvasBackground';
