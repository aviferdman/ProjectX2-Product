/**
 * Tool module — registry, permissions, executor, validation, and custom tool creation.
 *
 * @packageDocumentation
 */

export { createTool } from './create-tool.js';
export type { CreateToolOptions } from './create-tool.js';

export { defineTool, zodToToolSchema } from './define-tool.js';
export type { DefineToolOptions } from './define-tool.js';

export { ALLOW_ALL_POLICY, DENY_ALL_POLICY, PermissionManager } from './permission-manager.js';

export { collectTools, hasTools, tool } from './tool-decorator.js';
export type { ToolDecoratorOptions } from './tool-decorator.js';

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
