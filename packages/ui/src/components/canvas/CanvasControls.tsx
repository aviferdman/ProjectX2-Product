/**
 * Zoom / fit-view control panel for the canvas.
 * TASK-135: Implement React Flow canvas
 */
import { Controls, type ControlProps } from '@xyflow/react';
import { clsx } from 'clsx';
import { Z_INDEX } from './types.js';

export type CanvasControlsProps = Omit<ControlProps, 'className'> & {
  className?: string;
};

export function CanvasControls({ className, ...rest }: CanvasControlsProps) {
  return (
    <Controls
      className={clsx('cs-canvas-controls', className)}
      style={{ zIndex: Z_INDEX.toolbar }}
      showInteractive={false}
      {...rest}
    />
  );
}

CanvasControls.displayName = 'CanvasControls';
