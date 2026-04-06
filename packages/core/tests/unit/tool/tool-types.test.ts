/**
 * Unit tests for tool type definitions and enums.
 */

import { describe, expect, it } from 'vitest';

import {
  ToolCategory,
  ToolPermission,
} from '../../../src/types/tool.js';
import type {
  Tool,
  ToolEventMap,
  ToolParameterSchema,
  ToolPermissionPolicy,
  ToolResult,
} from '../../../src/types/tool.js';

// ---------------------------------------------------------------------------
// Enum value tests
// ---------------------------------------------------------------------------

describe('ToolPermission enum', () => {
  it('should have FILE_READ permission', () => {
    expect(ToolPermission.FILE_READ).toBe('file:read');
  });

  it('should have FILE_WRITE permission', () => {
    expect(ToolPermission.FILE_WRITE).toBe('file:write');
  });

  it('should have NETWORK permission', () => {
    expect(ToolPermission.NETWORK).toBe('network');
  });

  it('should have SHELL_EXEC permission', () => {
    expect(ToolPermission.SHELL_EXEC).toBe('shell:exec');
  });

  it('should have ENV_ACCESS permission', () => {
    expect(ToolPermission.ENV_ACCESS).toBe('env:access');
  });

  it('should have exactly 5 values', () => {
    const values = Object.values(ToolPermission);
    expect(values).toHaveLength(5);
  });
});

describe('ToolCategory enum', () => {
  it('should have FILE category', () => {
    expect(ToolCategory.FILE).toBe('file');
  });

  it('should have WEB category', () => {
    expect(ToolCategory.WEB).toBe('web');
  });

  it('should have SHELL category', () => {
    expect(ToolCategory.SHELL).toBe('shell');
  });

  it('should have DATA category', () => {
    expect(ToolCategory.DATA).toBe('data');
  });

  it('should have CUSTOM category', () => {
    expect(ToolCategory.CUSTOM).toBe('custom');
  });

  it('should have exactly 5 values', () => {
    const values = Object.values(ToolCategory);
    expect(values).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// Interface shape tests (compile-time + runtime validation)
// ---------------------------------------------------------------------------

describe('Tool interface', () => {
  it('should allow a minimal tool (name, description, execute)', () => {
    const tool: Tool = {
      name: 'noop',
      description: 'Does nothing',
      execute: async () => undefined,
    };

    expect(tool.name).toBe('noop');
    expect(tool.description).toBe('Does nothing');
    expect(tool.category).toBeUndefined();
    expect(tool.permissions).toBeUndefined();
    expect(tool.inputSchema).toBeUndefined();
    expect(tool.outputSchema).toBeUndefined();
    expect(tool.timeout).toBeUndefined();
  });

  it('should allow a fully specified tool', () => {
    const tool: Tool = {
      name: 'readFile',
      description: 'Read a file',
      category: ToolCategory.FILE,
      permissions: [ToolPermission.FILE_READ],
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
        },
        required: ['path'],
      },
      outputSchema: { type: 'string' },
      timeout: 5000,
      execute: async (input) => {
        const _path = (input as { path: string }).path;
        return `contents of ${_path}`;
      },
    };

    expect(tool.category).toBe(ToolCategory.FILE);
    expect(tool.permissions).toEqual([ToolPermission.FILE_READ]);
    expect(tool.timeout).toBe(5000);
  });
});

describe('ToolResult interface', () => {
  it('should represent a successful result', () => {
    const result: ToolResult = {
      success: true,
      data: { key: 'value' },
      duration: 42,
    };

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ key: 'value' });
    expect(result.error).toBeUndefined();
  });

  it('should represent a failed result', () => {
    const result: ToolResult = {
      success: false,
      error: 'Something went wrong',
      duration: 10,
    };

    expect(result.success).toBe(false);
    expect(result.error).toBe('Something went wrong');
    expect(result.data).toBeUndefined();
  });
});

describe('ToolPermissionPolicy interface', () => {
  it('should represent allow-all policy', () => {
    const policy: ToolPermissionPolicy = {
      defaultAction: 'allow',
    };
    expect(policy.defaultAction).toBe('allow');
  });

  it('should represent deny-default with allowed list', () => {
    const policy: ToolPermissionPolicy = {
      defaultAction: 'deny',
      allowed: [ToolPermission.FILE_READ],
      denied: [ToolPermission.SHELL_EXEC],
    };
    expect(policy.defaultAction).toBe('deny');
    expect(policy.allowed).toHaveLength(1);
    expect(policy.denied).toHaveLength(1);
  });
});

describe('ToolParameterSchema interface', () => {
  it('should represent a simple type', () => {
    const schema: ToolParameterSchema = {
      type: 'string',
      description: 'A name',
    };
    expect(schema.type).toBe('string');
  });

  it('should represent a nested object type', () => {
    const schema: ToolParameterSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name'],
    };
    expect(schema.properties).toBeDefined();
    expect(schema.required).toEqual(['name']);
  });

  it('should represent an array type', () => {
    const schema: ToolParameterSchema = {
      type: 'array',
      items: { type: 'string' },
    };
    expect(schema.items).toBeDefined();
  });

  it('should represent an enum type', () => {
    const schema: ToolParameterSchema = {
      type: 'string',
      enum: ['a', 'b', 'c'],
    };
    expect(schema.enum).toEqual(['a', 'b', 'c']);
  });
});
