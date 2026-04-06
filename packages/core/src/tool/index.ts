/**
 * Tool module — registry, permissions, executor, validation, composition,
 * and custom tool creation.
 *
 * @packageDocumentation
 */

export { composeTool, isComposableTool } from './compose-tool.js';
export type { ComposableTool, ComposeToolOptions } from './compose-tool.js';

export { createTool } from './create-tool.js';
export type { CreateToolOptions } from './create-tool.js';

export { defineTool, zodToToolSchema } from './define-tool.js';
export type { DefineToolOptions } from './define-tool.js';

export { ALLOW_ALL_POLICY, DENY_ALL_POLICY, PermissionManager } from './permission-manager.js';

export { collectTools, hasTools, tool } from './tool-decorator.js';
export type { ToolDecoratorOptions } from './tool-decorator.js';

export { DEFAULT_MAX_COMPOSITION_DEPTH } from './tool-context.js';
export type { ToolContext } from './tool-context.js';

export { ToolExecutor } from './tool-executor.js';
export { ToolRegistry } from './tool-registry.js';

export {
  isValidTool,
  parseToolInput,
  ToolConfigSchema,
  ToolParameterSchemaSchema,
  ToolPermissionPolicySchema,
  validateToolConfig,
  validateToolPermissionPolicy,
} from './validation.js';
