/**
 * Deprecation module — barrel export.
 *
 * @packageDocumentation
 */

export {
  defaultDeprecationHandler,
  deprecated,
  deprecatedFunction,
  DeprecationRegistry,
  emitDeprecationWarning,
  globalDeprecationRegistry,
} from './deprecation.js';
export type { DeprecationHandler, DeprecationInfo } from './deprecation.js';
