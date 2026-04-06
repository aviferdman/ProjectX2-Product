import { describe, expect, it } from 'vitest';

import {
  createExecCommandTool,
  createShellTools,
  DEFAULT_TIMEOUT_MS,
  DENIED_COMMANDS,
  MAX_OUTPUT_SIZE,
  MAX_TIMEOUT_MS,
} from '../../../../src/tools/shell/index.js';

describe('shell tools barrel exports', () => {
  it('should export createExecCommandTool', () => {
    expect(typeof createExecCommandTool).toBe('function');
  });

  it('should export createShellTools', () => {
    expect(typeof createShellTools).toBe('function');
  });

  it('should export DEFAULT_TIMEOUT_MS', () => {
    expect(typeof DEFAULT_TIMEOUT_MS).toBe('number');
  });

  it('should export MAX_TIMEOUT_MS', () => {
    expect(typeof MAX_TIMEOUT_MS).toBe('number');
  });

  it('should export MAX_OUTPUT_SIZE', () => {
    expect(typeof MAX_OUTPUT_SIZE).toBe('number');
  });

  it('should export DENIED_COMMANDS', () => {
    expect(Array.isArray(DENIED_COMMANDS)).toBe(true);
  });
});
