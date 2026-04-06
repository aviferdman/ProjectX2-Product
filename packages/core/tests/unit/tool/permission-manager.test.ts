/**
 * Unit tests for the PermissionManager.
 */

import { describe, expect, it } from 'vitest';

import { ToolPermissionError } from '../../../src/errors/tool-errors.js';
import {
  ALLOW_ALL_POLICY,
  DENY_ALL_POLICY,
  PermissionManager,
} from '../../../src/tool/permission-manager.js';
import { ToolPermission } from '../../../src/types/tool.js';
import type { Tool, ToolPermissionPolicy } from '../../../src/types/tool.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTool(overrides: Partial<Tool> & { name: string; description: string }): Tool {
  return {
    execute: async () => undefined,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PermissionManager', () => {
  // -----------------------------------------------------------------------
  // ALLOW_ALL_POLICY
  // -----------------------------------------------------------------------

  describe('with ALLOW_ALL_POLICY', () => {
    const manager = new PermissionManager(ALLOW_ALL_POLICY);

    it('should permit every permission', () => {
      for (const perm of Object.values(ToolPermission)) {
        expect(manager.isPermitted(perm)).toBe(true);
      }
    });

    it('should return empty denied list for any set of permissions', () => {
      const all = Object.values(ToolPermission);
      expect(manager.getDeniedPermissions(all)).toEqual([]);
    });

    it('should not throw on assertPermitted', () => {
      expect(() => {
        manager.assertPermitted('anyTool', Object.values(ToolPermission));
      }).not.toThrow();
    });

    it('should expose the policy via getter', () => {
      expect(manager.policy).toBe(ALLOW_ALL_POLICY);
    });
  });

  // -----------------------------------------------------------------------
  // DENY_ALL_POLICY
  // -----------------------------------------------------------------------

  describe('with DENY_ALL_POLICY', () => {
    const manager = new PermissionManager(DENY_ALL_POLICY);

    it('should deny every permission', () => {
      for (const perm of Object.values(ToolPermission)) {
        expect(manager.isPermitted(perm)).toBe(false);
      }
    });

    it('should return all permissions as denied', () => {
      const all = Object.values(ToolPermission);
      expect(manager.getDeniedPermissions(all)).toEqual(all);
    });

    it('should throw ToolPermissionError on assertPermitted', () => {
      expect(() => {
        manager.assertPermitted('myTool', [ToolPermission.FILE_READ]);
      }).toThrow(ToolPermissionError);
    });

    it('should include denied permissions in the error', () => {
      try {
        manager.assertPermitted('myTool', [ToolPermission.FILE_READ, ToolPermission.NETWORK]);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ToolPermissionError);
        const permErr = err as ToolPermissionError;
        expect(permErr.toolName).toBe('myTool');
        expect(permErr.deniedPermissions).toEqual([ToolPermission.FILE_READ, ToolPermission.NETWORK]);
        expect(permErr.requiredPermissions).toEqual([ToolPermission.FILE_READ, ToolPermission.NETWORK]);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Custom deny-default policy with allowed list
  // -----------------------------------------------------------------------

  describe('with deny-default + allowed list', () => {
    const policy: ToolPermissionPolicy = {
      defaultAction: 'deny',
      allowed: [ToolPermission.FILE_READ, ToolPermission.NETWORK],
    };
    const manager = new PermissionManager(policy);

    it('should permit explicitly allowed permissions', () => {
      expect(manager.isPermitted(ToolPermission.FILE_READ)).toBe(true);
      expect(manager.isPermitted(ToolPermission.NETWORK)).toBe(true);
    });

    it('should deny permissions not in allowed list', () => {
      expect(manager.isPermitted(ToolPermission.FILE_WRITE)).toBe(false);
      expect(manager.isPermitted(ToolPermission.SHELL_EXEC)).toBe(false);
      expect(manager.isPermitted(ToolPermission.ENV_ACCESS)).toBe(false);
    });

    it('should return only denied permissions', () => {
      const requested = [ToolPermission.FILE_READ, ToolPermission.SHELL_EXEC];
      expect(manager.getDeniedPermissions(requested)).toEqual([ToolPermission.SHELL_EXEC]);
    });
  });

  // -----------------------------------------------------------------------
  // Custom allow-default policy with denied list
  // -----------------------------------------------------------------------

  describe('with allow-default + denied list', () => {
    const policy: ToolPermissionPolicy = {
      defaultAction: 'allow',
      denied: [ToolPermission.SHELL_EXEC],
    };
    const manager = new PermissionManager(policy);

    it('should permit all permissions except denied', () => {
      expect(manager.isPermitted(ToolPermission.FILE_READ)).toBe(true);
      expect(manager.isPermitted(ToolPermission.FILE_WRITE)).toBe(true);
      expect(manager.isPermitted(ToolPermission.NETWORK)).toBe(true);
      expect(manager.isPermitted(ToolPermission.ENV_ACCESS)).toBe(true);
    });

    it('should deny explicitly denied permissions', () => {
      expect(manager.isPermitted(ToolPermission.SHELL_EXEC)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Explicit deny overrides explicit allow
  // -----------------------------------------------------------------------

  describe('when permission is in both allowed and denied', () => {
    const policy: ToolPermissionPolicy = {
      defaultAction: 'deny',
      allowed: [ToolPermission.SHELL_EXEC],
      denied: [ToolPermission.SHELL_EXEC],
    };
    const manager = new PermissionManager(policy);

    it('should deny (explicit deny wins)', () => {
      expect(manager.isPermitted(ToolPermission.SHELL_EXEC)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // checkTool
  // -----------------------------------------------------------------------

  describe('checkTool', () => {
    it('should not throw for a tool with no permissions', () => {
      const manager = new PermissionManager(DENY_ALL_POLICY);
      const tool = makeTool({ name: 'noop', description: 'No-op tool' });
      expect(() => manager.checkTool(tool)).not.toThrow();
    });

    it('should not throw for a tool with empty permissions array', () => {
      const manager = new PermissionManager(DENY_ALL_POLICY);
      const tool = makeTool({ name: 'noop', description: 'No-op tool', permissions: [] });
      expect(() => manager.checkTool(tool)).not.toThrow();
    });

    it('should not throw when all tool permissions are allowed', () => {
      const manager = new PermissionManager(ALLOW_ALL_POLICY);
      const tool = makeTool({
        name: 'readFile',
        description: 'Read a file',
        permissions: [ToolPermission.FILE_READ],
      });
      expect(() => manager.checkTool(tool)).not.toThrow();
    });

    it('should throw ToolPermissionError when tool permissions are denied', () => {
      const manager = new PermissionManager(DENY_ALL_POLICY);
      const tool = makeTool({
        name: 'shell',
        description: 'Run shell cmd',
        permissions: [ToolPermission.SHELL_EXEC],
      });
      expect(() => manager.checkTool(tool)).toThrow(ToolPermissionError);
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle empty permissions array in getDeniedPermissions', () => {
      const manager = new PermissionManager(DENY_ALL_POLICY);
      expect(manager.getDeniedPermissions([])).toEqual([]);
    });

    it('should handle assertPermitted with empty permissions array', () => {
      const manager = new PermissionManager(DENY_ALL_POLICY);
      expect(() => manager.assertPermitted('tool', [])).not.toThrow();
    });
  });
});
