/**
 * Zod validation schemas for tool configuration and permissions.
 *
 * Runtime validation for {@link Tool}, {@link ToolPermissionPolicy},
 * and {@link ToolParameterSchema} — consistent with the validation patterns
 * used throughout the Crewspace framework.
 *
 * @packageDocumentation
 */

import { z } from 'zod';

import { ToolCategory, ToolPermission } from '../types/tool.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOL_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const MAX_TIMEOUT_MS = 300_000;

// ---------------------------------------------------------------------------
// ToolParameterSchema validation
// ---------------------------------------------------------------------------

/**
 * Zod schema for {@link ToolParameterSchema}.
 *
 * Validates a simplified JSON Schema object used to describe tool input/output.
 */
export const ToolParameterSchemaSchema: z.ZodType<Record<string, unknown>> = z.lazy(() =>
  z.object({
    type: z.string().min(1, 'type must not be empty'),
    description: z.string().optional(),
    properties: z.record(ToolParameterSchemaSchema).optional(),
    required: z.array(z.string()).optional(),
    items: ToolParameterSchemaSchema.optional(),
    enum: z.array(z.unknown()).optional(),
  }),
);

// ---------------------------------------------------------------------------
// Tool validation schema
// ---------------------------------------------------------------------------

/**
 * Zod schema for validating {@link Tool} configuration (excluding `execute`).
 *
 * The `execute` function cannot be validated by Zod, so it is checked
 * separately as a runtime type guard.
 */
export const ToolConfigSchema = z.object({
  name: z
    .string()
    .min(1, 'Tool name must not be empty')
    .regex(
      TOOL_NAME_PATTERN,
      'Tool name must start with a letter and contain only letters, digits, hyphens, or underscores',
    ),
  description: z.string().min(1, 'Tool description must not be empty'),
  category: z.nativeEnum(ToolCategory).optional(),
  permissions: z.array(z.nativeEnum(ToolPermission)).optional(),
  inputSchema: ToolParameterSchemaSchema.optional(),
  outputSchema: ToolParameterSchemaSchema.optional(),
  timeout: z
    .number()
    .int('timeout must be an integer')
    .nonnegative('timeout must be ≥ 0')
    .max(MAX_TIMEOUT_MS, `timeout must be ≤ ${String(MAX_TIMEOUT_MS)}ms`)
    .optional(),
});

// ---------------------------------------------------------------------------
// ToolPermissionPolicy validation schema
// ---------------------------------------------------------------------------

/** Zod schema for {@link ToolPermissionPolicy}. */
export const ToolPermissionPolicySchema = z.object({
  defaultAction: z.enum(['allow', 'deny'], {
    errorMap: () => ({ message: "defaultAction must be 'allow' or 'deny'" }),
  }),
  allowed: z.array(z.nativeEnum(ToolPermission)).optional(),
  denied: z.array(z.nativeEnum(ToolPermission)).optional(),
});

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Validate a tool's configuration properties (name, description, permissions,
 * schemas, timeout).
 *
 * Does **not** validate the `execute` function — use {@link isValidTool} for
 * a complete runtime check.
 *
 * @param config - Raw configuration to validate
 * @returns The parsed config
 * @throws {ZodError} If validation fails
 */
export function validateToolConfig(config: unknown): z.infer<typeof ToolConfigSchema> {
  return ToolConfigSchema.parse(config);
}

/**
 * Validate a {@link ToolPermissionPolicy}.
 *
 * @param policy - Raw policy to validate
 * @returns The parsed policy
 * @throws {ZodError} If validation fails
 */
export function validateToolPermissionPolicy(
  policy: unknown,
): z.infer<typeof ToolPermissionPolicySchema> {
  return ToolPermissionPolicySchema.parse(policy);
}

/**
 * Runtime type guard: checks whether `value` satisfies the {@link Tool}
 * interface (has name, description, and execute function).
 */
export function isValidTool(value: unknown): value is {
  name: string;
  description: string;
  execute: (input: unknown) => Promise<unknown>;
} {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    typeof obj['name'] === 'string' &&
    obj['name'].length > 0 &&
    typeof obj['description'] === 'string' &&
    obj['description'].length > 0 &&
    typeof obj['execute'] === 'function'
  );
}
