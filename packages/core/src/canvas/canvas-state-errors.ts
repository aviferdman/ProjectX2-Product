/**
 * Custom error classes for canvas state operations.
 *
 * @packageDocumentation
 */

import { CrewspaceError, ErrorCode } from '../errors/base.js';

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

export const CANVAS_NOT_FOUND = 'CANVAS_NOT_FOUND' as unknown as ErrorCode;
export const CANVAS_VALIDATION = 'CANVAS_VALIDATION' as unknown as ErrorCode;
export const CANVAS_HISTORY_EMPTY = 'CANVAS_HISTORY_EMPTY' as unknown as ErrorCode;

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

/** Thrown when a canvas state is not found by ID. */
export class CanvasNotFoundError extends CrewspaceError {
  public readonly canvasId: string;

  constructor(canvasId: string) {
    super(`Canvas state "${canvasId}" not found`, CANVAS_NOT_FOUND);
    this.name = 'CanvasNotFoundError';
    this.canvasId = canvasId;
  }

  protected override getDetails(): Record<string, unknown> {
    return { canvasId: this.canvasId };
  }
}

/** Thrown when canvas input fails validation. */
export class CanvasValidationError extends CrewspaceError {
  constructor(message: string) {
    super(message, CANVAS_VALIDATION);
    this.name = 'CanvasValidationError';
  }
}

/** Thrown when undo/redo is attempted with no history available. */
export class CanvasHistoryEmptyError extends CrewspaceError {
  public readonly canvasId: string;
  public readonly direction: 'undo' | 'redo';

  constructor(canvasId: string, direction: 'undo' | 'redo') {
    super(`No ${direction} history available for canvas "${canvasId}"`, CANVAS_HISTORY_EMPTY);
    this.name = 'CanvasHistoryEmptyError';
    this.canvasId = canvasId;
    this.direction = direction;
  }

  protected override getDetails(): Record<string, unknown> {
    return { canvasId: this.canvasId, direction: this.direction };
  }
}
