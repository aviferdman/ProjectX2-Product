/**
 * Tests for the custom tool decorator API — advanced scenarios.
 *
 * TASK-036: Write tests for custom tool decorator API.
 *
 * Covers:
 * - @tool decorator with Zod `schema` option (runtime validation + auto-derived inputSchema)
 * - @tool decorator precedence when both `schema` and `inputSchema` are provided
 * - createTool with `inputZodSchema` for Zod-based validation
 * - ToolInputValidationError with structured issues
 * - collectTools / hasTools edge cases (null prototype, metadata isolation)
 * - Multiple classes sharing no metadata
 * - Instance isolation with Zod-validated decorator tools
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ToolConfigError, ToolInputValidationError } from '../../../src/errors/tool-errors.js';
import { createTool } from '../../../src/tool/create-tool.js';
import { collectTools, hasTools, tool } from '../../../src/tool/tool-decorator.js';
import { ToolRegistry } from '../../../src/tool/tool-registry.js';
import { ToolCategory, ToolPermission } from '../../../src/types/tool.js';

// ===========================================================================
// @tool decorator with Zod `schema` option
// ===========================================================================

describe('@tool decorator with Zod schema', () => {
  it('validates input at runtime via Zod schema', async () => {
    class ZodTools {
      @tool({
        description: 'Greet with validated name',
        schema: z.object({ name: z.string() }),
      })
      async greet(input: unknown): Promise<string> {
        const { name } = input as { name: string };
        return `Hello, ${name}!`;
      }
    }

    const tools = collectTools(new ZodTools());
    expect(tools).toHaveLength(1);

    // Valid input works
    expect(await tools[0]!.execute({ name: 'Alice' })).toBe('Hello, Alice!');

    // Invalid input throws ToolInputValidationError
    await expect(tools[0]!.execute({ name: 123 })).rejects.toThrow(ToolInputValidationError);
    await expect(tools[0]!.execute({})).rejects.toThrow(ToolInputValidationError);
    await expect(tools[0]!.execute('not-an-object')).rejects.toThrow();
  });

  it('auto-derives inputSchema from Zod schema when inputSchema is not provided', () => {
    class AutoSchema {
      @tool({
        description: 'Search tool',
        schema: z.object({
          query: z.string(),
          limit: z.number().optional(),
        }),
      })
      async search(input: unknown): Promise<unknown> {
        return input;
      }
    }

    const tools = collectTools(new AutoSchema());
    const t = tools[0]!;

    expect(t.inputSchema).toBeDefined();
    expect(t.inputSchema?.type).toBe('object');
    expect(t.inputSchema?.properties?.['query']).toEqual({ type: 'string' });
    expect(t.inputSchema?.properties?.['limit']).toEqual({ type: 'number' });
    expect(t.inputSchema?.required).toEqual(['query']);
  });

  it('uses explicit inputSchema over Zod-derived schema when both are provided', () => {
    const explicitSchema = {
      type: 'object' as const,
      properties: { custom: { type: 'string' as const } },
      required: ['custom'] as string[],
    };

    class BothSchemas {
      @tool({
        description: 'Has both schemas',
        inputSchema: explicitSchema,
        schema: z.object({ query: z.string() }),
      })
      async dual(input: unknown): Promise<unknown> {
        return input;
      }
    }

    const tools = collectTools(new BothSchemas());
    const t = tools[0]!;

    // inputSchema should be the explicit one, not derived from Zod
    expect(t.inputSchema).toEqual(explicitSchema);
  });

  it('sets inputZodSchema on collected tool when schema option is provided', () => {
    const zodSchema = z.object({ value: z.number() });

    class WithZodMeta {
      @tool({
        description: 'Has Zod schema',
        schema: zodSchema,
      })
      async process(input: unknown): Promise<unknown> {
        return input;
      }
    }

    const tools = collectTools(new WithZodMeta());
    expect(tools[0]!.inputZodSchema).toBeDefined();
  });

  it('does not set inputZodSchema when schema option is not provided', () => {
    class NoZodSchema {
      @tool({ description: 'No Zod' })
      async plain(input: unknown): Promise<unknown> {
        return input;
      }
    }

    const tools = collectTools(new NoZodSchema());
    expect(tools[0]!.inputZodSchema).toBeUndefined();
  });

  it('validates complex nested Zod schemas at runtime', async () => {
    class NestedTools {
      @tool({
        description: 'Process user data',
        schema: z.object({
          user: z.object({
            name: z.string().min(1),
            email: z.string().email(),
            age: z.number().int().positive(),
          }),
          tags: z.array(z.string()),
        }),
      })
      async processUser(input: unknown): Promise<unknown> {
        return input;
      }
    }

    const tools = collectTools(new NestedTools());
    const t = tools[0]!;

    // Valid input
    const validInput = {
      user: { name: 'Bob', email: 'bob@example.com', age: 30 },
      tags: ['admin', 'active'],
    };
    expect(await t.execute(validInput)).toEqual(validInput);

    // Invalid email
    await expect(
      t.execute({
        user: { name: 'Bob', email: 'not-an-email', age: 30 },
        tags: [],
      }),
    ).rejects.toThrow(ToolInputValidationError);

    // Missing required field
    await expect(
      t.execute({
        user: { name: 'Bob', email: 'bob@example.com' },
        tags: [],
      }),
    ).rejects.toThrow();

    // Wrong type for tags
    await expect(
      t.execute({
        user: { name: 'Bob', email: 'bob@example.com', age: 30 },
        tags: 'not-an-array',
      }),
    ).rejects.toThrow();
  });

  it('applies Zod transforms before passing input to the method', async () => {
    class TransformTools {
      @tool({
        description: 'Trim and lowercase',
        schema: z.object({
          text: z.string().trim().toLowerCase(),
        }),
      })
      async normalize(input: unknown): Promise<string> {
        const { text } = input as { text: string };
        return text;
      }
    }

    const tools = collectTools(new TransformTools());
    expect(await tools[0]!.execute({ text: '  HELLO  ' })).toBe('hello');
  });

  it('combines Zod validation with category, permissions, and timeout', () => {
    class FullOptions {
      @tool({
        description: 'Full-featured tool',
        category: ToolCategory.WEB,
        permissions: [ToolPermission.NETWORK],
        timeout: 5000,
        schema: z.object({ url: z.string().url() }),
      })
      async fetch(input: unknown): Promise<unknown> {
        return input;
      }
    }

    const tools = collectTools(new FullOptions());
    const t = tools[0]!;

    expect(t.category).toBe(ToolCategory.WEB);
    expect(t.permissions).toEqual([ToolPermission.NETWORK]);
    expect(t.timeout).toBe(5000);
    expect(t.inputSchema).toBeDefined();
    expect(t.inputZodSchema).toBeDefined();
  });

  it('supports multiple Zod-validated methods on a single class', async () => {
    class MultiZod {
      @tool({
        description: 'Add numbers',
        schema: z.object({ a: z.number(), b: z.number() }),
      })
      async add(input: unknown): Promise<number> {
        const { a, b } = input as { a: number; b: number };
        return a + b;
      }

      @tool({
        description: 'Concat strings',
        schema: z.object({ parts: z.array(z.string()) }),
      })
      async concat(input: unknown): Promise<string> {
        const { parts } = input as { parts: string[] };
        return parts.join('');
      }
    }

    const tools = collectTools(new MultiZod());
    expect(tools).toHaveLength(2);

    const addTool = tools.find((t) => t.name === 'add')!;
    const concatTool = tools.find((t) => t.name === 'concat')!;

    expect(await addTool.execute({ a: 10, b: 20 })).toBe(30);
    await expect(addTool.execute({ a: 'x', b: 'y' })).rejects.toThrow(ToolInputValidationError);

    expect(await concatTool.execute({ parts: ['a', 'b', 'c'] })).toBe('abc');
    await expect(concatTool.execute({ parts: [1, 2, 3] })).rejects.toThrow(
      ToolInputValidationError,
    );
  });

  it('provides structured ToolInputValidationError issues on Zod failure', async () => {
    class StrictTool {
      @tool({
        description: 'Strict input',
        schema: z.object({
          name: z.string(),
          age: z.number().int().positive(),
        }),
      })
      async validate(input: unknown): Promise<unknown> {
        return input;
      }
    }

    const tools = collectTools(new StrictTool());

    try {
      await tools[0]!.execute({ name: 123, age: -5 });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ToolInputValidationError);
      const validationError = err as ToolInputValidationError;
      expect(validationError.issues.length).toBeGreaterThan(0);
      expect(validationError.toolName).toBe('validate');

      // Each issue should have path, message, and code
      for (const issue of validationError.issues) {
        expect(typeof issue.path).toBe('string');
        expect(typeof issue.message).toBe('string');
        expect(typeof issue.code).toBe('string');
      }
    }
  });
});

// ===========================================================================
// createTool with inputZodSchema
// ===========================================================================

describe('createTool with inputZodSchema', () => {
  it('validates input at runtime via Zod schema', async () => {
    const t = createTool({
      name: 'zodCreate',
      description: 'Zod-validated createTool',
      inputZodSchema: z.object({ count: z.number().int().positive() }),
      async execute(input) {
        return input;
      },
    });

    expect(await t.execute({ count: 5 })).toEqual({ count: 5 });
    await expect(t.execute({ count: -1 })).rejects.toThrow(ToolInputValidationError);
    await expect(t.execute({ count: 'bad' })).rejects.toThrow(ToolInputValidationError);
    await expect(t.execute({})).rejects.toThrow(ToolInputValidationError);
  });

  it('auto-derives inputSchema from inputZodSchema', () => {
    const t = createTool({
      name: 'zodDerived',
      description: 'Auto-derived schema',
      inputZodSchema: z.object({
        query: z.string(),
        maxResults: z.number().optional(),
      }),
      async execute(input) {
        return input;
      },
    });

    expect(t.inputSchema).toBeDefined();
    expect(t.inputSchema?.type).toBe('object');
    expect(t.inputSchema?.properties?.['query']).toEqual({ type: 'string' });
    expect(t.inputSchema?.properties?.['maxResults']).toEqual({ type: 'number' });
    expect(t.inputSchema?.required).toEqual(['query']);
  });

  it('uses explicit inputSchema over Zod-derived schema', () => {
    const explicitSchema = {
      type: 'object' as const,
      properties: { explicit: { type: 'string' as const } },
    };

    const t = createTool({
      name: 'explicitWins',
      description: 'Explicit schema wins',
      inputSchema: explicitSchema,
      inputZodSchema: z.object({ different: z.string() }),
      async execute(input) {
        return input;
      },
    });

    expect(t.inputSchema).toEqual(explicitSchema);
  });

  it('sets inputZodSchema on the created tool', () => {
    const schema = z.object({ x: z.number() });
    const t = createTool({
      name: 'hasZod',
      description: 'With Zod',
      inputZodSchema: schema,
      async execute(input) {
        return input;
      },
    });

    expect(t.inputZodSchema).toBeDefined();
  });

  it('applies Zod transforms before calling execute', async () => {
    const t = createTool({
      name: 'zodTransform',
      description: 'Transform input',
      inputZodSchema: z.object({
        text: z.string().trim().toUpperCase(),
      }),
      async execute(input) {
        return input;
      },
    });

    expect(await t.execute({ text: '  hello  ' })).toEqual({ text: 'HELLO' });
  });

  it('integrates Zod-validated createTool with ToolRegistry', async () => {
    const t = createTool({
      name: 'zodRegistered',
      description: 'Zod + Registry',
      inputZodSchema: z.object({ value: z.string() }),
      async execute(input) {
        const { value } = input as { value: string };
        return value.toUpperCase();
      },
    });

    const registry = new ToolRegistry();
    registry.register(t);

    const registered = registry.get('zodRegistered');
    expect(await registered.execute({ value: 'test' })).toBe('TEST');
    await expect(registered.execute({ value: 42 })).rejects.toThrow(ToolInputValidationError);
  });
});

// ===========================================================================
// collectTools edge cases
// ===========================================================================

describe('collectTools edge cases', () => {
  it('returns empty array for Object.create(null)', () => {
    const nullProto = Object.create(null) as object;
    expect(collectTools(nullProto)).toEqual([]);
  });

  it('metadata does not leak between different classes', () => {
    class ClassA {
      @tool({ description: 'Tool A' })
      async toolA(_input: unknown): Promise<unknown> {
        return 'a';
      }
    }

    class ClassB {
      @tool({ description: 'Tool B' })
      async toolB(_input: unknown): Promise<unknown> {
        return 'b';
      }
    }

    const toolsA = collectTools(new ClassA());
    const toolsB = collectTools(new ClassB());

    expect(toolsA).toHaveLength(1);
    expect(toolsA[0]!.name).toBe('toolA');

    expect(toolsB).toHaveLength(1);
    expect(toolsB[0]!.name).toBe('toolB');
  });

  it('independent instances of same class share decorator metadata but bind independently', async () => {
    class SharedClass {
      constructor(private readonly label: string) {}

      @tool({ description: 'Get label' })
      async getLabel(_input: unknown): Promise<string> {
        return this.label;
      }
    }

    const instance1 = new SharedClass('first');
    const instance2 = new SharedClass('second');

    const tools1 = collectTools(instance1);
    const tools2 = collectTools(instance2);

    expect(tools1).toHaveLength(1);
    expect(tools2).toHaveLength(1);

    expect(await tools1[0]!.execute({})).toBe('first');
    expect(await tools2[0]!.execute({})).toBe('second');
  });

  it('handles class with no methods at all', () => {
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    class Empty {}
    expect(collectTools(new Empty())).toEqual([]);
  });

  it('handles class with mixed decorated and non-decorated methods', async () => {
    class Mixed {
      @tool({ description: 'Decorated' })
      async decorated(_input: unknown): Promise<string> {
        return 'decorated';
      }

      async notDecorated(): Promise<string> {
        return 'plain';
      }
    }

    const tools = collectTools(new Mixed());
    expect(tools).toHaveLength(1);
    expect(tools[0]!.name).toBe('decorated');
  });
});

// ===========================================================================
// hasTools edge cases
// ===========================================================================

describe('hasTools edge cases', () => {
  it('returns false for Object.create(null)', () => {
    const nullProto = Object.create(null) as object;
    expect(hasTools(nullProto)).toBe(false);
  });

  it('returns true even before collectTools is called', () => {
    class HasDecoratedMethod {
      @tool({ description: 'Exists' })
      async method(_input: unknown): Promise<unknown> {
        return null;
      }
    }

    const instance = new HasDecoratedMethod();
    // hasTools should work even without calling collectTools first
    expect(hasTools(instance)).toBe(true);
  });
});

// ===========================================================================
// @tool decorator name validation edge cases
// ===========================================================================

describe('@tool decorator name validation', () => {
  it('accepts single-character name', () => {
    class Single {
      @tool({ description: 'Single char name' })
      async a(_input: unknown): Promise<unknown> {
        return null;
      }
    }

    const tools = collectTools(new Single());
    expect(tools[0]!.name).toBe('a');
  });

  it('rejects names with spaces', () => {
    expect(() => {
      class Bad {
        @tool({ name: 'bad name', description: 'Invalid' })
        async method(_input: unknown): Promise<unknown> {
          return null;
        }
      }
    }).toThrow(ToolConfigError);
  });

  it('rejects names starting with a digit', () => {
    expect(() => {
      class Bad {
        @tool({ name: '9tool', description: 'Invalid' })
        async method(_input: unknown): Promise<unknown> {
          return null;
        }
      }
    }).toThrow(ToolConfigError);
  });

  it('rejects names with special characters', () => {
    expect(() => {
      class Bad {
        @tool({ name: 'tool.name', description: 'Invalid' })
        async method(_input: unknown): Promise<unknown> {
          return null;
        }
      }
    }).toThrow(ToolConfigError);
  });

  it('accepts hyphens and underscores in name', () => {
    class Valid {
      @tool({ name: 'my-tool_v2', description: 'Valid name' })
      async method(_input: unknown): Promise<unknown> {
        return null;
      }
    }

    const tools = collectTools(new Valid());
    expect(tools[0]!.name).toBe('my-tool_v2');
  });

  it('rejects whitespace-only description', () => {
    expect(() => {
      class Bad {
        @tool({ description: '   ' })
        async method(_input: unknown): Promise<unknown> {
          return null;
        }
      }
    }).toThrow(ToolConfigError);
  });
});

// ===========================================================================
// ToolInputValidationError structure
// ===========================================================================

describe('ToolInputValidationError from Zod-validated tools', () => {
  it('includes tool name in the error', async () => {
    class ErrorDetail {
      @tool({
        name: 'myValidator',
        description: 'Validator',
        schema: z.object({ required: z.string() }),
      })
      async validate(input: unknown): Promise<unknown> {
        return input;
      }
    }

    const tools = collectTools(new ErrorDetail());

    try {
      await tools[0]!.execute({});
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ToolInputValidationError);
      const validationError = err as ToolInputValidationError;
      expect(validationError.toolName).toBe('myValidator');
      expect(validationError.message).toContain('myValidator');
    }
  });

  it('includes path information for nested field errors', async () => {
    class NestedValidator {
      @tool({
        description: 'Nested validation',
        schema: z.object({
          config: z.object({
            port: z.number().int().positive(),
          }),
        }),
      })
      async validate(input: unknown): Promise<unknown> {
        return input;
      }
    }

    const tools = collectTools(new NestedValidator());

    try {
      await tools[0]!.execute({ config: { port: 'not-a-number' } });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ToolInputValidationError);
      const validationError = err as ToolInputValidationError;
      const paths = validationError.issues.map((i) => i.path);
      // Should include a path like "config.port"
      expect(paths.some((p) => p.includes('config') && p.includes('port'))).toBe(true);
    }
  });

  it('includes multiple issues when multiple fields are invalid', async () => {
    class MultiError {
      @tool({
        description: 'Multi-field validation',
        schema: z.object({
          name: z.string(),
          age: z.number(),
          active: z.boolean(),
        }),
      })
      async validate(input: unknown): Promise<unknown> {
        return input;
      }
    }

    const tools = collectTools(new MultiError());

    try {
      await tools[0]!.execute({ name: 123, age: 'not-a-number', active: 'not-a-boolean' });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ToolInputValidationError);
      const validationError = err as ToolInputValidationError;
      // Should have at least 3 issues (one per invalid field)
      expect(validationError.issues.length).toBeGreaterThanOrEqual(3);
    }
  });
});

// ===========================================================================
// End-to-end: @tool decorator with Zod + ToolRegistry
// ===========================================================================

describe('end-to-end: @tool decorator with Zod + ToolRegistry', () => {
  it('collects and registers Zod-validated decorator tools', async () => {
    class MathTools {
      @tool({
        description: 'Multiply two numbers',
        category: ToolCategory.DATA,
        schema: z.object({
          a: z.number(),
          b: z.number(),
        }),
      })
      async multiply(input: unknown): Promise<number> {
        const { a, b } = input as { a: number; b: number };
        return a * b;
      }

      @tool({
        description: 'Divide two numbers',
        category: ToolCategory.DATA,
        schema: z.object({
          numerator: z.number(),
          denominator: z.number().refine((n) => n !== 0, 'Cannot divide by zero'),
        }),
      })
      async divide(input: unknown): Promise<number> {
        const { numerator, denominator } = input as { numerator: number; denominator: number };
        return numerator / denominator;
      }
    }

    const registry = new ToolRegistry();
    const tools = collectTools(new MathTools());
    for (const t of tools) {
      registry.register(t);
    }

    expect(registry.has('multiply')).toBe(true);
    expect(registry.has('divide')).toBe(true);

    // Valid operations
    expect(await registry.get('multiply').execute({ a: 6, b: 7 })).toBe(42);
    expect(await registry.get('divide').execute({ numerator: 10, denominator: 2 })).toBe(5);

    // Zod validation failures
    await expect(registry.get('multiply').execute({ a: 'x', b: 'y' })).rejects.toThrow(
      ToolInputValidationError,
    );
    await expect(
      registry.get('divide').execute({ numerator: 10, denominator: 0 }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// createTool edge cases
// ===========================================================================

describe('createTool edge cases', () => {
  it('does not wrap execute when no inputZodSchema is provided', async () => {
    const t = createTool({
      name: 'noValidation',
      description: 'No Zod schema',
      async execute(input) {
        return input;
      },
    });

    // Any input should pass through without validation
    expect(await t.execute('raw-string')).toBe('raw-string');
    expect(await t.execute(42)).toBe(42);
    expect(await t.execute(null)).toBe(null);
    expect(await t.execute(undefined)).toBe(undefined);
  });

  it('creates tools with all optional fields omitted', () => {
    const t = createTool({
      name: 'minimal',
      description: 'Minimal tool',
      async execute() {
        return null;
      },
    });

    expect(t.name).toBe('minimal');
    expect(t.description).toBe('Minimal tool');
    expect(t.category).toBeUndefined();
    expect(t.permissions).toBeUndefined();
    expect(t.inputSchema).toBeUndefined();
    expect(t.inputZodSchema).toBeUndefined();
    expect(t.outputSchema).toBeUndefined();
    expect(t.timeout).toBeUndefined();
  });

  it('supports zero timeout (no limit)', () => {
    const t = createTool({
      name: 'noLimit',
      description: 'No time limit',
      timeout: 0,
      async execute() {
        return null;
      },
    });

    expect(t.timeout).toBe(0);
  });
});
