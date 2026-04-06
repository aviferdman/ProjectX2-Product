/**
 * Unit tests for tool validation schemas.
 */

import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import {
  isValidTool,
  ToolConfigSchema,
  ToolParameterSchemaSchema,
  ToolPermissionPolicySchema,
  validateToolConfig,
  validateToolPermissionPolicy,
} from '../../../src/tool/validation.js';
import { ToolCategory, ToolPermission } from '../../../src/types/tool.js';

// ---------------------------------------------------------------------------
// ToolConfigSchema
// ---------------------------------------------------------------------------

describe('ToolConfigSchema', () => {
  it('should accept a valid minimal tool config', () => {
    const result = ToolConfigSchema.parse({
      name: 'readFile',
      description: 'Read a file',
    });

    expect(result.name).toBe('readFile');
    expect(result.description).toBe('Read a file');
  });

  it('should accept a fully specified tool config', () => {
    const result = ToolConfigSchema.parse({
      name: 'webFetch',
      description: 'Fetch a URL',
      category: ToolCategory.WEB,
      permissions: [ToolPermission.NETWORK],
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The URL to fetch' },
        },
        required: ['url'],
      },
      outputSchema: {
        type: 'string',
        description: 'Response body',
      },
      timeout: 10000,
    });

    expect(result.name).toBe('webFetch');
    expect(result.category).toBe(ToolCategory.WEB);
    expect(result.permissions).toEqual([ToolPermission.NETWORK]);
    expect(result.timeout).toBe(10000);
  });

  it('should reject empty name', () => {
    expect(() => ToolConfigSchema.parse({ name: '', description: 'x' })).toThrow(ZodError);
  });

  it('should reject name starting with number', () => {
    expect(() => ToolConfigSchema.parse({ name: '1tool', description: 'x' })).toThrow(ZodError);
  });

  it('should reject name with spaces', () => {
    expect(() => ToolConfigSchema.parse({ name: 'my tool', description: 'x' })).toThrow(ZodError);
  });

  it('should accept name with hyphens and underscores', () => {
    const result = ToolConfigSchema.parse({ name: 'my-tool_v2', description: 'x' });
    expect(result.name).toBe('my-tool_v2');
  });

  it('should reject empty description', () => {
    expect(() => ToolConfigSchema.parse({ name: 'tool', description: '' })).toThrow(ZodError);
  });

  it('should reject negative timeout', () => {
    expect(() => ToolConfigSchema.parse({ name: 'tool', description: 'x', timeout: -1 })).toThrow(
      ZodError,
    );
  });

  it('should reject timeout exceeding maximum', () => {
    expect(() =>
      ToolConfigSchema.parse({ name: 'tool', description: 'x', timeout: 999999 }),
    ).toThrow(ZodError);
  });

  it('should reject non-integer timeout', () => {
    expect(() => ToolConfigSchema.parse({ name: 'tool', description: 'x', timeout: 1.5 })).toThrow(
      ZodError,
    );
  });

  it('should accept timeout of 0', () => {
    const result = ToolConfigSchema.parse({ name: 'tool', description: 'x', timeout: 0 });
    expect(result.timeout).toBe(0);
  });

  it('should reject invalid category', () => {
    expect(() =>
      ToolConfigSchema.parse({ name: 'tool', description: 'x', category: 'invalid' }),
    ).toThrow(ZodError);
  });

  it('should reject invalid permission values', () => {
    expect(() =>
      ToolConfigSchema.parse({ name: 'tool', description: 'x', permissions: ['invalid:perm'] }),
    ).toThrow(ZodError);
  });
});

// ---------------------------------------------------------------------------
// validateToolConfig helper
// ---------------------------------------------------------------------------

describe('validateToolConfig', () => {
  it('should return parsed config for valid input', () => {
    const result = validateToolConfig({ name: 'myTool', description: 'Does stuff' });
    expect(result.name).toBe('myTool');
  });

  it('should throw ZodError for invalid input', () => {
    expect(() => validateToolConfig({})).toThrow(ZodError);
  });
});

// ---------------------------------------------------------------------------
// ToolPermissionPolicySchema
// ---------------------------------------------------------------------------

describe('ToolPermissionPolicySchema', () => {
  it('should accept allow-all policy', () => {
    const result = ToolPermissionPolicySchema.parse({ defaultAction: 'allow' });
    expect(result.defaultAction).toBe('allow');
  });

  it('should accept deny-all policy', () => {
    const result = ToolPermissionPolicySchema.parse({ defaultAction: 'deny' });
    expect(result.defaultAction).toBe('deny');
  });

  it('should accept policy with allowed list', () => {
    const result = ToolPermissionPolicySchema.parse({
      defaultAction: 'deny',
      allowed: [ToolPermission.FILE_READ, ToolPermission.NETWORK],
    });
    expect(result.allowed).toEqual([ToolPermission.FILE_READ, ToolPermission.NETWORK]);
  });

  it('should accept policy with denied list', () => {
    const result = ToolPermissionPolicySchema.parse({
      defaultAction: 'allow',
      denied: [ToolPermission.SHELL_EXEC],
    });
    expect(result.denied).toEqual([ToolPermission.SHELL_EXEC]);
  });

  it('should reject invalid defaultAction', () => {
    expect(() => ToolPermissionPolicySchema.parse({ defaultAction: 'maybe' })).toThrow(ZodError);
  });

  it('should reject missing defaultAction', () => {
    expect(() => ToolPermissionPolicySchema.parse({})).toThrow(ZodError);
  });

  it('should reject invalid permission in allowed list', () => {
    expect(() =>
      ToolPermissionPolicySchema.parse({
        defaultAction: 'deny',
        allowed: ['fake:perm'],
      }),
    ).toThrow(ZodError);
  });
});

// ---------------------------------------------------------------------------
// validateToolPermissionPolicy helper
// ---------------------------------------------------------------------------

describe('validateToolPermissionPolicy', () => {
  it('should return parsed policy for valid input', () => {
    const result = validateToolPermissionPolicy({ defaultAction: 'allow' });
    expect(result.defaultAction).toBe('allow');
  });

  it('should throw ZodError for invalid input', () => {
    expect(() => validateToolPermissionPolicy({ defaultAction: 'bad' })).toThrow(ZodError);
  });
});

// ---------------------------------------------------------------------------
// ToolParameterSchemaSchema
// ---------------------------------------------------------------------------

describe('ToolParameterSchemaSchema', () => {
  it('should accept a simple string schema', () => {
    const result = ToolParameterSchemaSchema.parse({ type: 'string' });
    expect(result).toEqual({ type: 'string' });
  });

  it('should accept an object schema with properties', () => {
    const result = ToolParameterSchemaSchema.parse({
      type: 'object',
      properties: {
        name: { type: 'string', description: 'User name' },
        age: { type: 'number' },
      },
      required: ['name'],
    });

    expect(result['type']).toBe('object');
  });

  it('should accept an array schema with items', () => {
    const result = ToolParameterSchemaSchema.parse({
      type: 'array',
      items: { type: 'string' },
    });

    expect(result['type']).toBe('array');
  });

  it('should accept a schema with enum', () => {
    const result = ToolParameterSchemaSchema.parse({
      type: 'string',
      enum: ['red', 'green', 'blue'],
    });

    expect(result['type']).toBe('string');
  });

  it('should reject empty type', () => {
    expect(() => ToolParameterSchemaSchema.parse({ type: '' })).toThrow(ZodError);
  });

  it('should accept nested schemas', () => {
    const schema = {
      type: 'object',
      properties: {
        nested: {
          type: 'object',
          properties: {
            deep: { type: 'string' },
          },
        },
      },
    };

    expect(() => ToolParameterSchemaSchema.parse(schema)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// isValidTool
// ---------------------------------------------------------------------------

describe('isValidTool', () => {
  it('should return true for a valid tool object', () => {
    expect(
      isValidTool({
        name: 'myTool',
        description: 'Does things',
        execute: async () => undefined,
      }),
    ).toBe(true);
  });

  it('should return false for null', () => {
    expect(isValidTool(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isValidTool(undefined)).toBe(false);
  });

  it('should return false for primitive values', () => {
    expect(isValidTool('string')).toBe(false);
    expect(isValidTool(42)).toBe(false);
    expect(isValidTool(true)).toBe(false);
  });

  it('should return false when name is missing', () => {
    expect(isValidTool({ description: 'x', execute: async () => undefined })).toBe(false);
  });

  it('should return false when name is empty', () => {
    expect(isValidTool({ name: '', description: 'x', execute: async () => undefined })).toBe(false);
  });

  it('should return false when description is missing', () => {
    expect(isValidTool({ name: 'x', execute: async () => undefined })).toBe(false);
  });

  it('should return false when description is empty', () => {
    expect(isValidTool({ name: 'x', description: '', execute: async () => undefined })).toBe(false);
  });

  it('should return false when execute is not a function', () => {
    expect(isValidTool({ name: 'x', description: 'x', execute: 'not-a-fn' })).toBe(false);
  });

  it('should return false when execute is missing', () => {
    expect(isValidTool({ name: 'x', description: 'x' })).toBe(false);
  });
});
