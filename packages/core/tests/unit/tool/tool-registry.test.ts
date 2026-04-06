/**
 * Unit tests for the ToolRegistry.
 */

import { describe, expect, it } from 'vitest';

import { ToolConfigError, ToolNotFoundError } from '../../../src/errors/tool-errors.js';
import { ToolRegistry } from '../../../src/tool/tool-registry.js';
import { ToolCategory, ToolPermission } from '../../../src/types/tool.js';
import type { Tool } from '../../../src/types/tool.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTool(name: string, overrides?: Partial<Tool>): Tool {
  return {
    name,
    description: `${name} description`,
    execute: async () => undefined,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ToolRegistry', () => {
  // -----------------------------------------------------------------------
  // register / get
  // -----------------------------------------------------------------------

  describe('register and get', () => {
    it('should register a tool and retrieve it by name', () => {
      const registry = new ToolRegistry();
      const tool = makeTool('readFile');
      registry.register(tool);

      expect(registry.get('readFile')).toBe(tool);
    });

    it('should throw ToolConfigError when registering a duplicate name', () => {
      const registry = new ToolRegistry();
      registry.register(makeTool('readFile'));

      expect(() => registry.register(makeTool('readFile'))).toThrow(ToolConfigError);
    });

    it('should throw ToolConfigError for empty tool name', () => {
      const registry = new ToolRegistry();
      const tool = makeTool('');

      expect(() => registry.register(tool)).toThrow(ToolConfigError);
    });

    it('should throw ToolConfigError for whitespace-only tool name', () => {
      const registry = new ToolRegistry();
      const tool = makeTool('   ');

      expect(() => registry.register(tool)).toThrow(ToolConfigError);
    });

    it('should throw ToolNotFoundError for unregistered tool', () => {
      const registry = new ToolRegistry();

      expect(() => registry.get('nonexistent')).toThrow(ToolNotFoundError);
    });

    it('should include tool name in ToolNotFoundError', () => {
      const registry = new ToolRegistry();

      try {
        registry.get('missing-tool');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ToolNotFoundError);
        expect((err as ToolNotFoundError).toolName).toBe('missing-tool');
      }
    });
  });

  // -----------------------------------------------------------------------
  // find
  // -----------------------------------------------------------------------

  describe('find', () => {
    it('should return the tool if found', () => {
      const registry = new ToolRegistry();
      const tool = makeTool('webFetch');
      registry.register(tool);

      expect(registry.find('webFetch')).toBe(tool);
    });

    it('should return undefined if not found', () => {
      const registry = new ToolRegistry();

      expect(registry.find('nonexistent')).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // has
  // -----------------------------------------------------------------------

  describe('has', () => {
    it('should return true for registered tool', () => {
      const registry = new ToolRegistry();
      registry.register(makeTool('tool-a'));

      expect(registry.has('tool-a')).toBe(true);
    });

    it('should return false for unregistered tool', () => {
      const registry = new ToolRegistry();

      expect(registry.has('tool-b')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // unregister
  // -----------------------------------------------------------------------

  describe('unregister', () => {
    it('should remove a registered tool and return true', () => {
      const registry = new ToolRegistry();
      registry.register(makeTool('tool-x'));

      expect(registry.unregister('tool-x')).toBe(true);
      expect(registry.has('tool-x')).toBe(false);
    });

    it('should return false when unregistering a tool that does not exist', () => {
      const registry = new ToolRegistry();

      expect(registry.unregister('nonexistent')).toBe(false);
    });

    it('should allow re-registration after unregister', () => {
      const registry = new ToolRegistry();
      const tool1 = makeTool('tool-y');
      const tool2 = makeTool('tool-y');

      registry.register(tool1);
      registry.unregister('tool-y');
      registry.register(tool2);

      expect(registry.get('tool-y')).toBe(tool2);
    });
  });

  // -----------------------------------------------------------------------
  // size / getAll / getNames / clear
  // -----------------------------------------------------------------------

  describe('size, getAll, getNames, clear', () => {
    it('should report correct size', () => {
      const registry = new ToolRegistry();
      expect(registry.size).toBe(0);

      registry.register(makeTool('a'));
      registry.register(makeTool('b'));
      expect(registry.size).toBe(2);
    });

    it('should return all tools', () => {
      const registry = new ToolRegistry();
      const toolA = makeTool('a');
      const toolB = makeTool('b');
      registry.register(toolA);
      registry.register(toolB);

      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContain(toolA);
      expect(all).toContain(toolB);
    });

    it('should return all tool names', () => {
      const registry = new ToolRegistry();
      registry.register(makeTool('alpha'));
      registry.register(makeTool('beta'));

      const names = registry.getNames();
      expect(names).toContain('alpha');
      expect(names).toContain('beta');
    });

    it('should clear all tools', () => {
      const registry = new ToolRegistry();
      registry.register(makeTool('a'));
      registry.register(makeTool('b'));

      registry.clear();
      expect(registry.size).toBe(0);
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // getByCategory
  // -----------------------------------------------------------------------

  describe('getByCategory', () => {
    it('should return tools matching the category', () => {
      const registry = new ToolRegistry();
      registry.register(makeTool('readFile', { category: ToolCategory.FILE }));
      registry.register(makeTool('writeFile', { category: ToolCategory.FILE }));
      registry.register(makeTool('webFetch', { category: ToolCategory.WEB }));

      const fileTools = registry.getByCategory(ToolCategory.FILE);
      expect(fileTools).toHaveLength(2);
      expect(fileTools.map((t) => t.name)).toContain('readFile');
      expect(fileTools.map((t) => t.name)).toContain('writeFile');
    });

    it('should return empty array when no tools match', () => {
      const registry = new ToolRegistry();
      registry.register(makeTool('readFile', { category: ToolCategory.FILE }));

      expect(registry.getByCategory(ToolCategory.SHELL)).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // getByPermission
  // -----------------------------------------------------------------------

  describe('getByPermission', () => {
    it('should return tools requiring the specified permission', () => {
      const registry = new ToolRegistry();
      registry.register(makeTool('readFile', { permissions: [ToolPermission.FILE_READ] }));
      registry.register(makeTool('webFetch', { permissions: [ToolPermission.NETWORK] }));
      registry.register(
        makeTool('shellExec', {
          permissions: [ToolPermission.SHELL_EXEC, ToolPermission.ENV_ACCESS],
        }),
      );

      const networkTools = registry.getByPermission(ToolPermission.NETWORK);
      expect(networkTools).toHaveLength(1);
      expect(networkTools[0]!.name).toBe('webFetch');

      const envTools = registry.getByPermission(ToolPermission.ENV_ACCESS);
      expect(envTools).toHaveLength(1);
      expect(envTools[0]!.name).toBe('shellExec');
    });

    it('should return empty array when no tools require the permission', () => {
      const registry = new ToolRegistry();
      registry.register(makeTool('noop'));

      expect(registry.getByPermission(ToolPermission.FILE_READ)).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Iterator
  // -----------------------------------------------------------------------

  describe('iterator', () => {
    it('should be iterable via for...of', () => {
      const registry = new ToolRegistry();
      registry.register(makeTool('a'));
      registry.register(makeTool('b'));

      const names: string[] = [];
      for (const tool of registry) {
        names.push(tool.name);
      }

      expect(names).toHaveLength(2);
      expect(names).toContain('a');
      expect(names).toContain('b');
    });
  });

  // -----------------------------------------------------------------------
  // Static from()
  // -----------------------------------------------------------------------

  describe('ToolRegistry.from', () => {
    it('should create a registry with pre-registered tools', () => {
      const tools = [makeTool('a'), makeTool('b'), makeTool('c')];
      const registry = ToolRegistry.from(tools);

      expect(registry.size).toBe(3);
      expect(registry.has('a')).toBe(true);
      expect(registry.has('b')).toBe(true);
      expect(registry.has('c')).toBe(true);
    });

    it('should throw on duplicate tool names', () => {
      const tools = [makeTool('dup'), makeTool('dup')];

      expect(() => ToolRegistry.from(tools)).toThrow(ToolConfigError);
    });

    it('should create an empty registry from empty array', () => {
      const registry = ToolRegistry.from([]);

      expect(registry.size).toBe(0);
    });
  });
});
