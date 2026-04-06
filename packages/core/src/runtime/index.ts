/**
 * Runtime detection and compatibility utilities.
 *
 * @packageDocumentation
 */

export {
  assertCompatible,
  checkCompatibility,
  detectRuntime,
  getRuntimeVersion,
  MIN_NODE_MAJOR,
  parseVersion,
  REQUIRED_GLOBALS,
  REQUIRED_WEB_GLOBALS,
} from './runtime-compat.js';
export type {
  CompatCheck,
  CompatReport,
  RuntimeName,
  RuntimeVersion,
} from './runtime-compat.js';
