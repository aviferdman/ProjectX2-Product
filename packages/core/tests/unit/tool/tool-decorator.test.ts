/**
 * Tests for the @tool decorator, createTool, and defineTool APIs.
 *
 * TASK-032: Create @tool decorator for custom tool creation.
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ToolConfigError } from '../../../src/errors/tool-errors.js';
import { createTool } from '../../../src/tool/create-tool.js';
import { defineTool, zodToToolSchema } from '../../../src/tool/define-tool.js';
import { collectTools, hasTools, tool } from '../../../src/tool/tool-decorator.js';
import { ToolRegistry } from '../../../src/tool/tool-registry.js';
import { ToolCategory, ToolPermission } from '../../../src/types/tool.js';

// ===========================================================================
// createTool
// ===========================================================================

describe('createTool', () => {
  it('creates a valid tool with minimal options', async () => {
    const t = createTool({
      name: 'echo',
      description: 'Echo the input back',
      async execute(input) {
        return input;
      },
    });

    expect(t.name).toBe('echo');
    expect(t.description).toBe('Echo the input back');
    expect(t.category).toBeUndefined();
    expect(t.permissions).toBeUndefined();
    expect(t.inputSchema).toBeUndefined();
    expect(await t.execute('hello')).toBe('hello');
  });

  it('creates a tool with all options', async () => {
    const t = createTool({
      name: 'readConfig',
      description: 'Read a configuration file',
      category: ToolCategory.FILE,
      permissions: [ToolPermission.FILE_READ],
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
      outputSchema: {
        type: 'object',
        properties: { content: { type: 'string' } },
      },
      timeout: 5000,
      async execute(input) {
        const { path } = input as { path: string };
        return { content: `contents of ${path}` };
      },
    });

    expect(t.name).toBe('readConfig');
    expect(t.category).toBe(ToolCategory.FILE);
    expect(t.permissions).toEqual([ToolPermission.FILE_READ]);
    expect(t.timeout).toBe(5000);
    expect(await t.execute({ path: '/etc/config' })).toEqual({
      content: 'contents of /etc/config',
    });
  });

  it('returns a frozen object', () => {
    const t = createTool({
      name: 'frozen',
      description: 'A frozen tool',
      async execute() {
        return null;
      },
    });

    expect(Object.isFrozen(t)).toBe(true);
  });

  it('throws ToolConfigError for empty name', () => {
    expect(() =>
      createTool({
        name: '',
        description: 'bad',
        async execute() {
          return null;
        },
      }),
    ).toThrow(ToolConfigError);
  });

  it('throws ToolConfigError for invalid name characters', () => {
    expect(() =>
      createTool({
        name: '123invalid',
        description: 'bad name',
        async execute() {
          return null;
        },
      }),
    ).toThrow(ToolConfigError);
  });

  it('throws ToolConfigError for empty description', () => {
    expect(() =>
      createTool({
        name: 'noDesc',
        description: '',
        async execute() {
          return null;
        },
      }),
    ).toThrow(ToolConfigError);
  });

  it('throws ToolConfigError for invalid timeout', () => {
    expect(() =>
      createTool({
        name: 'badTimeout',
        description: 'bad timeout',
        timeout: -1,
        async execute() {
          return null;
        },
      }),
    ).toThrow(ToolConfigError);
  });

  it('throws ToolConfigError for excessive timeout', () => {
    expect(() =>
      createTool({
        name: 'hugeTimeout',
        description: 'too big',
        timeout: 999_999,
        async execute() {
          return null;
        },
      }),
    ).toThrow(ToolConfigError);
  });

  it('integrates with ToolRegistry', () => {
    const t = createTool({
      name: 'registerable',
      description: 'Can be registered',
      category: ToolCategory.CUSTOM,
      async execute() {
        return 'done';
      },
    });

    const registry = new ToolRegistry();
    registry.register(t);
    expect(registry.has('registerable')).toBe(true);
    expect(registry.get('registerable')).toBe(t);
  });

  it('supports names with hyphens and underscores', () => {
    const t = createTool({
      name: 'my-tool_v2',
      description: 'Valid name',
      async execute() {
        return null;
      },
    });
    expect(t.name).toBe('my-tool_v2');
  });
});

// ===========================================================================
// defineTool (Zod integration)
// ===========================================================================

describe('defineTool', () => {
  it('creates a tool with typed execute from Zod schema', async () => {
    const t = defineTool({
      name: 'add',
      description: 'Add two numbers',
      schema: z.object({
        a: z.number(),
        b: z.number(),
      }),
      async execute({ a, b }) {
        return a + b;
      },
    });

    expect(t.name).toBe('add');
    expect(await t.execute({ a: 2, b: 3 })).toBe(5);
  });

  it('validates input at runtime via Zod', async () => {
    const t = defineTool({
      name: 'strict',
      description: 'Strict typed tool',
      schema: z.object({ value: z.string() }),
      async execute({ value }) {
        return value.toUpperCase();
      },
    });

    // Valid input works
    expect(await t.execute({ value: 'hello' })).toBe('HELLO');

    // Invalid input throws ZodError
    await expect(t.execute({ value: 123 })).rejects.toThrow();
    await expect(t.execute({})).rejects.toThrow();
    await expect(t.execute('not-an-object')).rejects.toThrow();
  });

  it('generates inputSchema from Zod schema', () => {
    const t = defineTool({
      name: 'withSchema',
      description: 'Has auto-generated schema',
      schema: z.object({
        query: z.string(),
        limit: z.number().optional(),
      }),
      async execute({ query }) {
        return query;
      },
    });

    expect(t.inputSchema).toBeDefined();
    expect(t.inputSchema?.type).toBe('object');
    expect(t.inputSchema?.properties).toBeDefined();
    expect(t.inputSchema?.properties?.['query']).toEqual({ type: 'string' });
    expect(t.inputSchema?.properties?.['limit']).toEqual({ type: 'number' });
    expect(t.inputSchema?.required).toEqual(['query']);
  });

  it('returns a frozen object', () => {
    const t = defineTool({
      name: 'frozenDefined',
      description: 'Frozen',
      schema: z.object({}),
      async execute() {
        return null;
      },
    });
    expect(Object.isFrozen(t)).toBe(true);
  });

  it('preserves category, permissions, timeout', () => {
    const t = defineTool({
      name: 'fullOptions',
      description: 'All options',
      category: ToolCategory.WEB,
      permissions: [ToolPermission.NETWORK],
      timeout: 10000,
      schema: z.object({ url: z.string() }),
      async execute({ url }) {
        return url;
      },
    });

    expect(t.category).toBe(ToolCategory.WEB);
    expect(t.permissions).toEqual([ToolPermission.NETWORK]);
    expect(t.timeout).toBe(10000);
  });

  it('throws ToolConfigError for invalid name', () => {
    expect(() =>
      defineTool({
        name: '',
        description: 'bad',
        schema: z.object({}),
        async execute() {
          return null;
        },
      }),
    ).toThrow(ToolConfigError);
  });

  it('handles nested Zod objects', () => {
    const t = defineTool({
      name: 'nested',
      description: 'Nested schema',
      schema: z.object({
        user: z.object({
          name: z.string(),
          age: z.number(),
        }),
      }),
      async execute({ user }) {
        return user;
      },
    });

    expect(t.inputSchema?.properties?.['user']).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name', 'age'],
    });
  });

  it('handles Zod arrays', () => {
    const t = defineTool({
      name: 'arrayTool',
      description: 'Array input',
      schema: z.object({
        items: z.array(z.string()),
      }),
      async execute({ items }) {
        return items;
      },
    });

    expect(t.inputSchema?.properties?.['items']).toEqual({
      type: 'array',
      items: { type: 'string' },
    });
  });

  it('handles Zod enums', () => {
    const t = defineTool({
      name: 'enumTool',
      description: 'Enum input',
      schema: z.object({
        color: z.enum(['red', 'green', 'blue']),
      }),
      async execute({ color }) {
        return color;
      },
    });

    expect(t.inputSchema?.properties?.['color']).toEqual({
      type: 'string',
      enum: ['red', 'green', 'blue'],
    });
  });

  it('handles Zod booleans', async () => {
    const t = defineTool({
      name: 'boolTool',
      description: 'Boolean input',
      schema: z.object({
        verbose: z.boolean(),
      }),
      async execute({ verbose }) {
        return verbose;
      },
    });

    expect(t.inputSchema?.properties?.['verbose']).toEqual({ type: 'boolean' });
    expect(await t.execute({ verbose: true })).toBe(true);
  });

  it('handles Zod defaults', async () => {
    const t = defineTool({
      name: 'defaultTool',
      description: 'Default values',
      schema: z.object({
        name: z.string(),
        count: z.number().default(10),
      }),
      async execute({ name, count }) {
        return `${name}:${String(count)}`;
      },
    });

    // count has a default, so it should be optional in the required list
    expect(t.inputSchema?.required).toEqual(['name']);
    expect(await t.execute({ name: 'test' })).toBe('test:10');
  });
});

// ===========================================================================
// zodToToolSchema
// ===========================================================================

describe('zodToToolSchema', () => {
  it('converts z.string()', () => {
    expect(zodToToolSchema(z.string())).toEqual({ type: 'string' });
  });

  it('converts z.number()', () => {
    expect(zodToToolSchema(z.number())).toEqual({ type: 'number' });
  });

  it('converts z.boolean()', () => {
    expect(zodToToolSchema(z.boolean())).toEqual({ type: 'boolean' });
  });

  it('converts z.object()', () => {
    const schema = z.object({
      x: z.number(),
      y: z.string().optional(),
    });

    const result = zodToToolSchema(schema);
    expect(result.type).toBe('object');
    expect(result.properties?.['x']).toEqual({ type: 'number' });
    expect(result.properties?.['y']).toEqual({ type: 'string' });
    expect(result.required).toEqual(['x']);
  });

  it('converts z.array()', () => {
    expect(zodToToolSchema(z.array(z.number()))).toEqual({
      type: 'array',
      items: { type: 'number' },
    });
  });

  it('converts z.enum()', () => {
    expect(zodToToolSchema(z.enum(['a', 'b', 'c']))).toEqual({
      type: 'string',
      enum: ['a', 'b', 'c'],
    });
  });

  it('converts z.literal()', () => {
    const result = zodToToolSchema(z.literal('fixed'));
    expect(result.type).toBe('string');
    expect(result.enum).toEqual(['fixed']);
  });

  it('preserves descriptions', () => {
    const schema = z.object({
      name: z.string().describe('The person name'),
    });

    const result = zodToToolSchema(schema);
    expect(result.properties?.['name']?.description).toBe('The person name');
  });

  it('handles z.optional() wrapping', () => {
    const schema = z.object({
      required: z.string(),
      optional: z.string().optional(),
    });
    const result = zodToToolSchema(schema);
    expect(result.required).toEqual(['required']);
  });

  it('handles z.nullable()', () => {
    const result = zodToToolSchema(z.string().nullable());
    expect(result.type).toBe('string');
  });

  it('handles z.default()', () => {
    const result = zodToToolSchema(z.number().default(42));
    expect(result.type).toBe('number');
  });
});

// ===========================================================================
// @tool decorator + collectTools
// ===========================================================================

describe('@tool decorator', () => {
  it('decorates a method and collects tools', async () => {
    class MyToolbox {
      @tool({ description: 'Say hello' })
      async greet(input: unknown): Promise<string> {
        const { name } = input as { name: string };
        return `Hello, ${name}!`;
      }
    }

    const toolbox = new MyToolbox();
    const tools = collectTools(toolbox);

    expect(tools).toHaveLength(1);
    expect(tools[0]!.name).toBe('greet');
    expect(tools[0]!.description).toBe('Say hello');
    expect(await tools[0]!.execute({ name: 'World' })).toBe('Hello, World!');
  });

  it('supports explicit name override', () => {
    class T {
      @tool({ name: 'customName', description: 'Custom named' })
      async _internalMethod(_input: unknown): Promise<unknown> {
        return null;
      }
    }

    const tools = collectTools(new T());
    expect(tools[0]!.name).toBe('customName');
  });

  it('supports multiple decorated methods', () => {
    class MultiTool {
      @tool({ description: 'First tool' })
      async alpha(_input: unknown): Promise<unknown> {
        return 'a';
      }

      @tool({ description: 'Second tool' })
      async beta(_input: unknown): Promise<unknown> {
        return 'b';
      }

      @tool({ description: 'Third tool' })
      async gamma(_input: unknown): Promise<unknown> {
        return 'c';
      }
    }

    const tools = collectTools(new MultiTool());
    expect(tools).toHaveLength(3);
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('preserves category, permissions, schemas, and timeout', () => {
    class WithOptions {
      @tool({
        description: 'Full options',
        category: ToolCategory.FILE,
        permissions: [ToolPermission.FILE_READ],
        inputSchema: { type: 'object', properties: { path: { type: 'string' } } },
        outputSchema: { type: 'string' },
        timeout: 3000,
      })
      async readFile(_input: unknown): Promise<unknown> {
        return null;
      }
    }

    const tools = collectTools(new WithOptions());
    const t = tools[0]!;
    expect(t.category).toBe(ToolCategory.FILE);
    expect(t.permissions).toEqual([ToolPermission.FILE_READ]);
    expect(t.inputSchema).toEqual({ type: 'object', properties: { path: { type: 'string' } } });
    expect(t.outputSchema).toEqual({ type: 'string' });
    expect(t.timeout).toBe(3000);
  });

  it('binds method to instance (preserves this)', async () => {
    class Stateful {
      private readonly prefix = 'PREFIX';

      @tool({ description: 'Uses this' })
      async format(input: unknown): Promise<string> {
        const { text } = input as { text: string };
        return `${this.prefix}: ${text}`;
      }
    }

    const instance = new Stateful();
    const tools = collectTools(instance);
    const result = await tools[0]!.execute({ text: 'data' });
    expect(result).toBe('PREFIX: data');
  });

  it('returns frozen tools', () => {
    class F {
      @tool({ description: 'Frozen' })
      async fn(_input: unknown): Promise<unknown> {
        return null;
      }
    }

    const tools = collectTools(new F());
    expect(Object.isFrozen(tools[0]!)).toBe(true);
  });

  it('returns empty array for non-decorated instances', () => {
    class Plain {
      async notATool(): Promise<void> {
        /* no decorator */
      }
    }

    expect(collectTools(new Plain())).toEqual([]);
  });

  it('produces independent tools per instance', async () => {
    class Counter {
      count = 0;

      @tool({ description: 'Increment counter' })
      async increment(_input: unknown): Promise<number> {
        this.count += 1;
        return this.count;
      }
    }

    const a = new Counter();
    const b = new Counter();
    const toolsA = collectTools(a);
    const toolsB = collectTools(b);

    await toolsA[0]!.execute({});
    await toolsA[0]!.execute({});
    const resultA = await toolsA[0]!.execute({});
    const resultB = await toolsB[0]!.execute({});

    expect(resultA).toBe(3);
    expect(resultB).toBe(1);
  });

  it('throws ToolConfigError for invalid name at decoration time', () => {
    expect(() => {
      class Bad {
        @tool({ name: '123bad', description: 'Invalid' })
        async method(_input: unknown): Promise<unknown> {
          return null;
        }
      }
    }).toThrow(ToolConfigError);
  });

  it('throws ToolConfigError for empty description at decoration time', () => {
    expect(() => {
      class Bad {
        @tool({ description: '' })
        async method(_input: unknown): Promise<unknown> {
          return null;
        }
      }
    }).toThrow(ToolConfigError);
  });

  it('integrates collected tools with ToolRegistry', async () => {
    class Tools {
      @tool({ description: 'Ping', category: ToolCategory.CUSTOM })
      async ping(_input: unknown): Promise<string> {
        return 'pong';
      }
    }

    const registry = new ToolRegistry();
    const tools = collectTools(new Tools());
    for (const t of tools) {
      registry.register(t);
    }

    expect(registry.has('ping')).toBe(true);
    const result = await registry.get('ping').execute({});
    expect(result).toBe('pong');
  });
});

// ===========================================================================
// hasTools
// ===========================================================================

describe('hasTools', () => {
  it('returns true for decorated instances', () => {
    class WithTool {
      @tool({ description: 'A tool' })
      async fn(_input: unknown): Promise<unknown> {
        return null;
      }
    }

    expect(hasTools(new WithTool())).toBe(true);
  });

  it('returns false for plain instances', () => {
    class Plain {
      async notATool(): Promise<void> {
        /* noop */
      }
    }

    expect(hasTools(new Plain())).toBe(false);
  });

  it('returns false for plain objects', () => {
    expect(hasTools({})).toBe(false);
    expect(hasTools({ name: 'not a toolbox' })).toBe(false);
  });
});

// ===========================================================================
// End-to-end integration
// ===========================================================================

describe('end-to-end: defineTool + ToolRegistry', () => {
  it('creates and registers a Zod-validated tool', async () => {
    const calculatorTool = defineTool({
      name: 'calculator',
      description: 'Perform arithmetic',
      category: ToolCategory.DATA,
      schema: z.object({
        op: z.enum(['add', 'sub', 'mul', 'div']),
        a: z.number(),
        b: z.number(),
      }),
      async execute({ op, a, b }) {
        switch (op) {
          case 'add':
            return a + b;
          case 'sub':
            return a - b;
          case 'mul':
            return a * b;
          case 'div':
            return a / b;
        }
      },
    });

    const registry = new ToolRegistry();
    registry.register(calculatorTool);

    const t = registry.get('calculator');
    expect(await t.execute({ op: 'mul', a: 6, b: 7 })).toBe(42);
    await expect(t.execute({ op: 'bad', a: 1, b: 2 })).rejects.toThrow();
  });
});

describe('end-to-end: createTool + ToolRegistry', () => {
  it('creates and registers a simple tool', async () => {
    const echoTool = createTool({
      name: 'echo',
      description: 'Echo input back',
      async execute(input) {
        return input;
      },
    });

    const registry = new ToolRegistry();
    registry.register(echoTool);

    expect(await registry.get('echo').execute('test')).toBe('test');
  });
});
