/**
 * Unit tests for tool error classes.
 */

import { describe, expect, it } from 'vitest';

import {
  ToolConfigError,
  ToolExecutionError,
  ToolNotFoundError,
  ToolPermissionError,
  ToolTimeoutError,
} from '../../../src/errors/tool-errors.js';
import { ToolPermission } from '../../../src/types/tool.js';

describe('ToolConfigError', () => {
  it('should include tool name in message when provided', () => {
    const error = new ToolConfigError('invalid config', 'readFile');
    expect(error.message).toBe('Tool "readFile": invalid config');
    expect(error.toolName).toBe('readFile');
    expect(error.name).toBe('ToolConfigError');
  });

  it('should work without tool name', () => {
    const error = new ToolConfigError('something is wrong');
    expect(error.message).toBe('something is wrong');
    expect(error.toolName).toBeUndefined();
  });

  it('should be an instance of Error', () => {
    expect(new ToolConfigError('x')).toBeInstanceOf(Error);
  });
});

describe('ToolNotFoundError', () => {
  it('should include tool name in message', () => {
    const error = new ToolNotFoundError('webFetch');
    expect(error.message).toBe('Tool "webFetch" is not registered');
    expect(error.toolName).toBe('webFetch');
    expect(error.name).toBe('ToolNotFoundError');
  });

  it('should be an instance of Error', () => {
    expect(new ToolNotFoundError('x')).toBeInstanceOf(Error);
  });
});

describe('ToolExecutionError', () => {
  it('should include tool name in message', () => {
    const error = new ToolExecutionError('shellExec', 'command failed');
    expect(error.message).toBe('Tool "shellExec" execution failed: command failed');
    expect(error.toolName).toBe('shellExec');
    expect(error.name).toBe('ToolExecutionError');
  });

  it('should capture cause', () => {
    const cause = new Error('root cause');
    const error = new ToolExecutionError('tool', 'failed', cause);
    expect(error.cause).toBe(cause);
  });

  it('should work without cause', () => {
    const error = new ToolExecutionError('tool', 'failed');
    expect(error.cause).toBeUndefined();
  });

  it('should be an instance of Error', () => {
    expect(new ToolExecutionError('x', 'y')).toBeInstanceOf(Error);
  });
});

describe('ToolPermissionError', () => {
  it('should list denied permissions in message', () => {
    const error = new ToolPermissionError(
      'shellExec',
      [ToolPermission.SHELL_EXEC, ToolPermission.ENV_ACCESS],
      [ToolPermission.SHELL_EXEC],
    );
    expect(error.message).toContain('shell:exec');
    expect(error.toolName).toBe('shellExec');
    expect(error.requiredPermissions).toEqual([ToolPermission.SHELL_EXEC, ToolPermission.ENV_ACCESS]);
    expect(error.deniedPermissions).toEqual([ToolPermission.SHELL_EXEC]);
    expect(error.name).toBe('ToolPermissionError');
  });

  it('should handle multiple denied permissions', () => {
    const error = new ToolPermissionError(
      'tool',
      [ToolPermission.FILE_READ, ToolPermission.FILE_WRITE],
      [ToolPermission.FILE_READ, ToolPermission.FILE_WRITE],
    );
    expect(error.message).toContain('file:read');
    expect(error.message).toContain('file:write');
  });

  it('should be an instance of Error', () => {
    expect(new ToolPermissionError('x', [], [])).toBeInstanceOf(Error);
  });
});

describe('ToolTimeoutError', () => {
  it('should include timeout value in message', () => {
    const error = new ToolTimeoutError('slowTool', 5000);
    expect(error.message).toBe('Tool "slowTool" exceeded timeout of 5000ms');
    expect(error.toolName).toBe('slowTool');
    expect(error.timeoutMs).toBe(5000);
    expect(error.name).toBe('ToolTimeoutError');
  });

  it('should be an instance of Error', () => {
    expect(new ToolTimeoutError('x', 100)).toBeInstanceOf(Error);
  });
});
