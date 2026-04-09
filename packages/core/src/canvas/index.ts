/**
 * Canvas state management exports.
 *
 * @packageDocumentation
 */

// Storage
export { InMemoryCanvasStateStorage, _resetCanvasIdCounter } from './canvas-state-storage.js';

// Service
export { CanvasStateService } from './canvas-state-service.js';
export type { CanvasStateServiceConfig } from './canvas-state-service.js';

// Errors
export {
  CanvasNotFoundError,
  CanvasValidationError,
  CanvasHistoryEmptyError,
} from './canvas-state-errors.js';

// Types
export type {
  CanvasEdge,
  CanvasEdgeVariant,
  CanvasHistoryEntry,
  CanvasNode,
  CanvasNodeKind,
  CanvasNodeStatus,
  CanvasPosition,
  CanvasSnapshot,
  CanvasStateStorageProvider,
  CanvasViewport,
  CreateCanvasStateInput,
  ListCanvasStatesOptions,
  ListCanvasStatesResult,
  StoredCanvasState,
  UpdateCanvasStateInput,
} from './canvas-state-types.js';
