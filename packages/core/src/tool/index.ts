/**
 * Tool module — registry, permissions, executor, and validation.
 *
 * @packageDocumentation
 */

export {
  ALLOW_ALL_POLICY,
  DENY_ALL_POLICY,
  PermissionManager,
} from './permission-manager.js';

export { ToolExecutor } from './tool-executor.js';
export { ToolRegistry } from './tool-registry.js';

export {
  isValidTool,
  ToolConfigSchema,
  ToolParameterSchemaSchema,
  ToolPermissionPolicySchema,
  validateToolConfig,
  validateToolPermissionPolicy,
} from './validation.js';
