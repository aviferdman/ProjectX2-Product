import { describe, it, expect } from 'vitest';
import * as toolsShell from '../../src/index.js';

describe('@crewspace/tools-shell', () => {
  describe('exports', () => {
    it('should export createShellTools factory', () => {
      expect(toolsShell.createShellTools).toBeDefined();
      expect(typeof toolsShell.createShellTools).toBe('function');
    });

    it('should export createShellExecTool', () => {
      expect(toolsShell.createShellExecTool).toBeDefined();
      expect(typeof toolsShell.createShellExecTool).toBe('function');
    });

    it('should export checkDestructiveCommand', () => {
      expect(toolsShell.checkDestructiveCommand).toBeDefined();
      expect(typeof toolsShell.checkDestructiveCommand).toBe('function');
    });

    it('should export ShellExecInputSchema', () => {
      expect(toolsShell.ShellExecInputSchema).toBeDefined();
    });

    it('should export constants', () => {
      expect(toolsShell.DEFAULT_SHELL_TIMEOUT_MS).toBeDefined();
      expect(toolsShell.MAX_SHELL_TIMEOUT_MS).toBeDefined();
      expect(toolsShell.MAX_OUTPUT_SIZE).toBeDefined();
      expect(toolsShell.DESTRUCTIVE_PATTERNS).toBeDefined();
    });
  });

  describe('createShellTools', () => {
    it('should return an object with shellExec tool', () => {
      const tools = toolsShell.createShellTools();

      expect(tools).toBeDefined();
      expect(tools.shellExec).toBeDefined();
    });

    it('should accept basePath option', () => {
      const tools = toolsShell.createShellTools({ basePath: '/tmp/test' });

      expect(tools.shellExec).toBeDefined();
    });

    it('should accept defaultTimeoutMs option', () => {
      const tools = toolsShell.createShellTools({ defaultTimeoutMs: 5000 });

      expect(tools.shellExec).toBeDefined();
    });

    it('should create tool with name property', () => {
      const tools = toolsShell.createShellTools();

      expect(tools.shellExec.name).toBe('shellExec');
    });
  });

  describe('checkDestructiveCommand', () => {
    it('should detect rm -rf as destructive', () => {
      const result = toolsShell.checkDestructiveCommand('rm -rf /');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should not flag safe commands', () => {
      const result = toolsShell.checkDestructiveCommand('echo hello');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should detect format commands', () => {
      const result = toolsShell.checkDestructiveCommand('mkfs.ext4 /dev/sda');
      expect(result).toBeDefined();
    });
  });

  describe('DESTRUCTIVE_PATTERNS', () => {
    it('should be an array of RegExp patterns', () => {
      expect(Array.isArray(toolsShell.DESTRUCTIVE_PATTERNS)).toBe(true);
      expect(toolsShell.DESTRUCTIVE_PATTERNS.length).toBeGreaterThan(0);
      for (const p of toolsShell.DESTRUCTIVE_PATTERNS) {
        expect(p).toBeInstanceOf(RegExp);
      }
    });
  });

  describe('schemas', () => {
    it('should validate ShellExecInputSchema', () => {
      const valid = toolsShell.ShellExecInputSchema.safeParse({ command: 'echo hello' });
      expect(valid.success).toBe(true);
    });

    it('should reject ShellExecInputSchema with missing command', () => {
      const invalid = toolsShell.ShellExecInputSchema.safeParse({});
      expect(invalid.success).toBe(false);
    });

    it('should reject ShellExecInputSchema with empty command', () => {
      const invalid = toolsShell.ShellExecInputSchema.safeParse({ command: '' });
      expect(invalid.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const valid = toolsShell.ShellExecInputSchema.safeParse({
        command: 'ls',
        cwd: '/tmp',
        timeoutMs: 5000,
      });
      expect(valid.success).toBe(true);
    });
  });

  describe('constants', () => {
    it('should have expected constant values', () => {
      expect(toolsShell.DEFAULT_SHELL_TIMEOUT_MS).toBe(30_000);
      expect(toolsShell.MAX_SHELL_TIMEOUT_MS).toBe(300_000);
      expect(toolsShell.MAX_OUTPUT_SIZE).toBe(1024 * 1024);
    });
  });
});
