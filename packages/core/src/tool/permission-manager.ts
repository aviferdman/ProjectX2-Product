/**
 * Permission manager — evaluates {@link ToolPermissionPolicy} against tool requirements.
 *
 * The permission manager is the security gate between an agent and its tools.
 * Before executing a tool the framework calls {@link PermissionManager.check}
 * which returns the list of denied permissions (empty if all are granted).
 *
 * @packageDocumentation
 */

import {
  ToolPermissionError,
} from '../errors/tool-errors.js';
import type {
  Tool,
  ToolPermission,
  ToolPermissionPolicy,
} from '../types/tool.js';

// ---------------------------------------------------------------------------
// Default policies
// ---------------------------------------------------------------------------

/** Policy that allows all permissions (no restrictions). */
export const ALLOW_ALL_POLICY: ToolPermissionPolicy = {
  defaultAction: 'allow',
} as const;

/** Policy that denies all permissions (maximum restriction). */
export const DENY_ALL_POLICY: ToolPermissionPolicy = {
  defaultAction: 'deny',
} as const;

// ---------------------------------------------------------------------------
// Permission Manager
// ---------------------------------------------------------------------------

/**
 * Evaluates tool permissions against a configured policy.
 *
 * @example
 * ```typescript
 * const manager = new PermissionManager({
 *   defaultAction: 'deny',
 *   allowed: [ToolPermission.FILE_READ, ToolPermission.NETWORK],
 * });
 *
 * manager.isPermitted(ToolPermission.FILE_READ);  // true
 * manager.isPermitted(ToolPermission.SHELL_EXEC); // false
 * ```
 */
export class PermissionManager {
  private readonly _policy: ToolPermissionPolicy;
  private readonly _allowedSet: ReadonlySet<ToolPermission>;
  private readonly _deniedSet: ReadonlySet<ToolPermission>;

  constructor(policy: ToolPermissionPolicy) {
    this._policy = policy;
    this._allowedSet = new Set(policy.allowed ?? []);
    this._deniedSet = new Set(policy.denied ?? []);
  }

  /** The active permission policy (read-only). */
  get policy(): ToolPermissionPolicy {
    return this._policy;
  }

  /**
   * Check whether a single permission is granted.
   *
   * Evaluation order:
   * 1. If the permission is in `denied` → **denied** (explicit deny wins).
   * 2. If the permission is in `allowed` → **allowed**.
   * 3. Fall back to `defaultAction`.
   */
  isPermitted(permission: ToolPermission): boolean {
    if (this._deniedSet.has(permission)) {
      return false;
    }
    if (this._allowedSet.has(permission)) {
      return true;
    }
    return this._policy.defaultAction === 'allow';
  }

  /**
   * Return the subset of `permissions` that are denied by the current policy.
   *
   * An empty array means all requested permissions are granted.
   */
  getDeniedPermissions(permissions: readonly ToolPermission[]): ToolPermission[] {
    return permissions.filter((p) => !this.isPermitted(p));
  }

  /**
   * Assert that every permission in `required` is granted.
   *
   * @param toolName    - Tool name (used in the error message)
   * @param required    - Permissions the tool declares
   * @throws {ToolPermissionError} If any permission is denied
   */
  assertPermitted(toolName: string, required: readonly ToolPermission[]): void {
    const denied = this.getDeniedPermissions(required);
    if (denied.length > 0) {
      throw new ToolPermissionError(toolName, required, denied);
    }
  }

  /**
   * Convenience method: check a tool's declared permissions.
   *
   * @param tool - The tool to check
   * @throws {ToolPermissionError} If any declared permission is denied
   */
  checkTool(tool: Tool): void {
    if (tool.permissions && tool.permissions.length > 0) {
      this.assertPermitted(tool.name, tool.permissions);
    }
  }
}
