/**
 * Tests for Zod-based schema validation of tool inputs.
 *
 * TASK-033: Add Zod-based schema validation for tool inputs.
 *
 * Covers:
 * - createTool with inputZodSchema
 * - @tool decorator with schema option
 * - parseToolInput helper
 * - ToolExecutor integration with inputZodSchema
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ToolInputValidationError } from '../../../src/errors/tool-errors.js';
import { createTool } from '../../../src/tool/create-tool.js';
import { collectTools, tool } from '../../../src/tool/tool-decorator.js';
import { ToolExecutor } from '../../../src/tool/tool-executor.js';
import { ALLOW_ALL_POLICY, PermissionManager } from '../../../src/tool/permission-manager.js';
import { parseToolInput } from '../../../src/tool/validation.js';
import { ToolCategory, ToolPermission } from '../../../src/types/tool.js';

// ===========================================================================
// createTool with inputZodSchema
// ===========================================================================

describe('createTool with inputZodSchema', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
  });

  it('validates input and passes parsed data to execute', async () => {
    const t = createTool({
      name: 'greet',
      description: 'Greet by name and age',
      inputZodSchema: schema,
      async execute(input) {
        const { name, age } = input as { name: string; age: number };
        return `${name} is ${String(age)}`;
      },
    });

    expect(await t.execute({ name: 'Alice', age: 30 })).toBe('Alice is 30');
  });

  it('throws ToolInputValidationError for invalid input', async () => {
    const t = createTool({
      name: 'greet',
      description: 'Greet by name and age',
      inputZodSchema: schema,
      async execute(input) {
        return input;
      },
    });

    await expect(t.execute({ name: '', age: 30 })).rejects.toThrow(ToolInputValidationError);
    await expect(t.execute({ name: 'Alice', age: -5 })).rejects.toThrow(ToolInputValidationError);
    await expect(t.execute({})).rejects.toThrow(ToolInputValidationError);
    await expect(t.execute('not-an-object')).rejects.toThrow(ToolInputValidationError);
  });

  it('auto-generates inputSchema from Zod schema', () => {
    const t = createTool({
      name: 'autogen',
      description: 'Auto-generated schema',
      inputZodSchema: z.object({
        query: z.string(),
        limit: z.number().optional(),
      }),
      async execute(input) {
        return input;
      },
    });

    expect(t.inputSchema).toBeDefined();
    expect(t.inputSchema?.type).toBe('object');
    expect(t.inputSchema?.properties?.['query']).toEqual({ type: 'string' });
    expect(t.inputSchema?.properties?.['limit']).toEqual({ type: 'number' });
    expect(t.inputSchema?.required).toEqual(['query']);
  });

  it('prefers explicit inputSchema over auto-generated one', () => {
    const explicitSchema = {
      type: 'object' as const,
      properties: { custom: { type: 'string' as const } },
    };

    const t = createTool({
      name: 'explicit',
      description: 'Explicit schema wins',
      inputSchema: explicitSchema,
      inputZodSchema: z.object({ query: z.string() }),
      async execute(input) {
        return input;
      },
    });

    expect(t.inputSchema).toEqual(explicitSchema);
  });

  it('still validates via Zod even when explicit inputSchema is provided', async () => {
    const t = createTool({
      name: 'bothSchemas',
      description: 'Both schemas provided',
      inputSchema: { type: 'object' },
      inputZodSchema: z.object({ value: z.number().positive() }),
      async execute(input) {
        return input;
      },
    });

    await expect(t.execute({ value: -1 })).rejects.toThrow(ToolInputValidationError);
    expect(await t.execute({ value: 42 })).toEqual({ value: 42 });
  });

  it('sets inputZodSchema on the tool object', () => {
    const zodSchema = z.object({ x: z.number() });
    const t = createTool({
      name: 'withZod',
      description: 'Has Zod schema',
      inputZodSchema: zodSchema,
      async execute(input) {
        return input;
      },
    });

    expect(t.inputZodSchema).toBe(zodSchema);
  });

  it('does not set inputZodSchema when not provided', () => {
    const t = createTool({
      name: 'noZod',
      description: 'No Zod schema',
      async execute(input) {
        return input;
      },
    });

    expect(t.inputZodSchema).toBeUndefined();
  });

  it('passes through input without validation when no Zod schema', async () => {
    const t = createTool({
      name: 'passthrough',
      description: 'No validation',
      async execute(input) {
        return input;
      },
    });

    expect(await t.execute('any-string')).toBe('any-string');
    expect(await t.execute(42)).toBe(42);
    expect(await t.execute(null)).toBe(null);
  });

  it('applies Zod defaults and transforms', async () => {
    const t = createTool({
      name: 'defaults',
      description: 'Zod defaults',
      inputZodSchema: z.object({
        name: z.string(),
        count: z.number().default(10),
      }),
      async execute(input) {
        return input;
      },
    });

    const result = await t.execute({ name: 'test' });
    expect(result).toEqual({ name: 'test', count: 10 });
  });

  it('works with complex Zod schemas (enums, arrays, nested)', async () => {
    const t = createTool({
      name: 'complex',
      description: 'Complex Zod schema',
      inputZodSchema: z.object({
        action: z.enum(['create', 'delete']),
        tags: z.array(z.string()).min(1),
        metadata: z.object({
          priority: z.number().int().min(1).max(5),
        }),
      }),
      async execute(input) {
        return input;
      },
    });

    const valid = { action: 'create', tags: ['important'], metadata: { priority: 3 } };
    expect(await t.execute(valid)).toEqual(valid);

    await expect(
      t.execute({ action: 'invalid', tags: ['x'], metadata: { priority: 1 } }),
    ).rejects.toThrow(ToolInputValidationError);

    await expect(
      t.execute({ action: 'create', tags: [], metadata: { priority: 1 } }),
    ).rejects.toThrow(ToolInputValidationError);

    await expect(
      t.execute({ action: 'create', tags: ['x'], metadata: { priority: 10 } }),
    ).rejects.toThrow(ToolInputValidationError);
  });

  it('returns frozen tool', () => {
    const t = createTool({
      name: 'frozen',
      description: 'Frozen with Zod',
      inputZodSchema: z.object({ x: z.number() }),
      async execute(input) {
        return input;
      },
    });

    expect(Object.isFrozen(t)).toBe(true);
  });

  it('preserves category, permissions, and timeout alongside Zod schema', () => {
    const t = createTool({
      name: 'fullOpts',
      description: 'Full options with Zod',
      category: ToolCategory.DATA,
      permissions: [ToolPermission.NETWORK],
      inputZodSchema: z.object({ url: z.string() }),
      timeout: 5000,
      async execute(input) {
        return input;
      },
    });

    expect(t.category).toBe(ToolCategory.DATA);
    expect(t.permissions).toEqual([ToolPermission.NETWORK]);
    expect(t.timeout).toBe(5000);
    expect(t.inputZodSchema).toBeDefined();
    expect(t.inputSchema).toBeDefined();
  });
});

// ===========================================================================
// @tool decorator with Zod schema
// ===========================================================================

describe('@tool decorator with Zod schema', () => {
  it('validates input when schema is provided', async () => {
    class MyToolbox {
      @tool({
        description: 'Search with validated input',
        schema: z.object({
          query: z.string().min(1),
          maxResults: z.number().int().positive().optional(),
        }),
      })
      async search(input: unknown): Promise<unknown> {
        const { query } = input as { query: string };
        return `results for: ${query}`;
      }
    }

    const tools = collectTools(new MyToolbox());
    expect(tools).toHaveLength(1);

    const t = tools[0]!;
    expect(await t.execute({ query: 'hello' })).toBe('results for: hello');
    await expect(t.execute({ query: '' })).rejects.toThrow(ToolInputValidationError);
    await expect(t.execute({})).rejects.toThrow(ToolInputValidationError);
  });

  it('auto-generates inputSchema from Zod schema', () => {
    class SchemaGen {
      @tool({
        description: 'Auto schema',
        schema: z.object({
          path: z.string(),
          recursive: z.boolean().optional(),
        }),
      })
      async listFiles(_input: unknown): Promise<unknown> {
        return [];
      }
    }

    const tools = collectTools(new SchemaGen());
    const t = tools[0]!;

    expect(t.inputSchema).toBeDefined();
    expect(t.inputSchema?.type).toBe('object');
    expect(t.inputSchema?.properties?.['path']).toEqual({ type: 'string' });
    expect(t.inputSchema?.properties?.['recursive']).toEqual({ type: 'boolean' });
    expect(t.inputSchema?.required).toEqual(['path']);
  });

  it('sets inputZodSchema on collected tool', () => {
    const zodSchema = z.object({ x: z.number() });

    class WithZod {
      @tool({ description: 'Has Zod', schema: zodSchema })
      async fn(_input: unknown): Promise<unknown> {
        return null;
      }
    }

    const tools = collectTools(new WithZod());
    expect(tools[0]!.inputZodSchema).toBe(zodSchema);
  });

  it('prefers explicit inputSchema over Zod-derived one', () => {
    const explicit = {
      type: 'object' as const,
      properties: { custom: { type: 'string' as const } },
    };

    class ExplicitSchema {
      @tool({
        description: 'Explicit wins',
        inputSchema: explicit,
        schema: z.object({ different: z.number() }),
      })
      async fn(_input: unknown): Promise<unknown> {
        return null;
      }
    }

    const tools = collectTools(new ExplicitSchema());
    expect(tools[0]!.inputSchema).toEqual(explicit);
  });

  it('applies Zod defaults and transforms', async () => {
    class Defaults {
      @tool({
        description: 'With defaults',
        schema: z.object({
          name: z.string(),
          limit: z.number().default(20),
        }),
      })
      async fetch(input: unknown): Promise<unknown> {
        return input;
      }
    }

    const tools = collectTools(new Defaults());
    const result = await tools[0]!.execute({ name: 'test' });
    expect(result).toEqual({ name: 'test', limit: 20 });
  });

  it('preserves this binding with Zod validation', async () => {
    class Stateful {
      private readonly prefix = 'RESULT';

      @tool({
        description: 'Uses this',
        schema: z.object({ value: z.string() }),
      })
      async process(input: unknown): Promise<string> {
        const { value } = input as { value: string };
        return `${this.prefix}: ${value}`;
      }
    }

    const tools = collectTools(new Stateful());
    expect(await tools[0]!.execute({ value: 'data' })).toBe('RESULT: data');
  });

  it('does not set inputZodSchema when schema is not provided', () => {
    class NoZod {
      @tool({ description: 'No Zod' })
      async fn(_input: unknown): Promise<unknown> {
        return null;
      }
    }

    const tools = collectTools(new NoZod());
    expect(tools[0]!.inputZodSchema).toBeUndefined();
  });

  it('passes through input without validation when no schema', async () => {
    class Passthrough {
      @tool({ description: 'No validation' })
      async fn(input: unknown): Promise<unknown> {
        return input;
      }
    }

    const tools = collectTools(new Passthrough());
    expect(await tools[0]!.execute('any-string')).toBe('any-string');
    expect(await tools[0]!.execute(42)).toBe(42);
  });
});

// ===========================================================================
// parseToolInput
// ===========================================================================

describe('parseToolInput', () => {
  const schema = z.object({
    name: z.string(),
    count: z.number().int().positive(),
  });

  it('returns parsed value for valid input', () => {
    const result = parseToolInput('myTool', schema, { name: 'test', count: 5 });
    expect(result).toEqual({ name: 'test', count: 5 });
  });

  it('throws ToolInputValidationError for invalid input', () => {
    expect(() => parseToolInput('myTool', schema, { name: 123, count: 'bad' })).toThrow(
      ToolInputValidationError,
    );
  });

  it('includes tool name in error', () => {
    try {
      parseToolInput('mySpecialTool', schema, {});
      expect.fail('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ToolInputValidationError);
      expect((err as ToolInputValidationError).message).toContain('mySpecialTool');
    }
  });

  it('includes structured issues in error', () => {
    try {
      parseToolInput('validator', schema, { name: 42, count: -1 });
      expect.fail('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ToolInputValidationError);
      const validationErr = err as ToolInputValidationError;
      expect(validationErr.issues).toBeDefined();
      expect(validationErr.issues.length).toBeGreaterThan(0);
      for (const issue of validationErr.issues) {
        expect(issue).toHaveProperty('path');
        expect(issue).toHaveProperty('message');
        expect(issue).toHaveProperty('code');
      }
    }
  });

  it('applies Zod defaults', () => {
    const withDefaults = z.object({
      name: z.string(),
      limit: z.number().default(10),
    });

    const result = parseToolInput('defaults', withDefaults, { name: 'test' });
    expect(result).toEqual({ name: 'test', limit: 10 });
  });

  it('re-throws non-Zod errors as-is', () => {
    const badSchema = z.string().transform(() => {
      throw new TypeError('custom error');
    });

    expect(() => parseToolInput('bad', badSchema, 'trigger')).toThrow(TypeError);
  });
});

// ===========================================================================
// ToolExecutor integration with inputZodSchema
// ===========================================================================

describe('ToolExecutor with inputZodSchema', () => {
  const pm = new PermissionManager(ALLOW_ALL_POLICY);
  const executor = new ToolExecutor(pm);

  it('validates input via inputZodSchema before execution', async () => {
    const t = createTool({
      name: 'validated',
      description: 'Validated tool',
      inputZodSchema: z.object({ value: z.number().positive() }),
      async execute(input) {
        return input;
      },
    });

    const result = await executor.execute(t, { value: 42 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ value: 42 });
  });

  it('throws ToolInputValidationError for invalid input', async () => {
    const t = createTool({
      name: 'strictTool',
      description: 'Strict tool',
      inputZodSchema: z.object({ value: z.string().email() }),
      async execute(input) {
        return input;
      },
    });

    await expect(executor.execute(t, { value: 'not-an-email' })).rejects.toThrow(
      ToolInputValidationError,
    );
  });

  it('works without inputZodSchema', async () => {
    const t = createTool({
      name: 'noValidation',
      description: 'No Zod',
      async execute(input) {
        return input;
      },
    });

    const result = await executor.execute(t, 'anything');
    expect(result.success).toBe(true);
    expect(result.data).toBe('anything');
  });
});
