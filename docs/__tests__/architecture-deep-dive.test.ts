import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const docsRoot = resolve(__dirname, '..');
const archPath = join(docsRoot, 'guide', 'architecture.md');

describe('Architecture deep-dive documentation', () => {
  it('should exist at docs/guide/architecture.md', () => {
    expect(existsSync(archPath)).toBe(true);
  });

  it('should have the correct title', () => {
    const content = readFileSync(archPath, 'utf-8');
    expect(content).toContain('# Architecture Deep Dive');
  });

  describe('required sections', () => {
    const content = readFileSync(archPath, 'utf-8');

    const requiredSections = [
      'High-Level Architecture',
      'Core Design Patterns',
      'Data Flow',
      'State Machines',
      'LLM Provider Architecture',
      'Tool System Architecture',
      'Memory System Architecture',
      'Error Handling Architecture',
      'Validation Architecture',
      'Extension Points',
    ];

    requiredSections.forEach((section) => {
      it(`should contain section: ${section}`, () => {
        expect(content).toContain(section);
      });
    });
  });

  describe('design patterns coverage', () => {
    const content = readFileSync(archPath, 'utf-8');

    const patterns = [
      'Observer Pattern',
      'Strategy Pattern',
      'Decorator Pattern',
      'Registry Pattern',
      'Builder Pattern',
      'Dependency Injection',
    ];

    patterns.forEach((pattern) => {
      it(`should document the ${pattern}`, () => {
        expect(content).toContain(pattern);
      });
    });
  });

  describe('core components coverage', () => {
    const content = readFileSync(archPath, 'utf-8');

    const components = [
      'Agent',
      'Crew',
      'Task',
      'ExecutionEngine',
      'LLMProvider',
      'Tool',
      'MemoryProvider',
      'ToolRegistry',
      'ToolExecutor',
      'PermissionManager',
      'CircuitBreaker',
      'RetryLLMProvider',
      'FallbackLLMProvider',
      'ShortTermMemory',
      'MemoryManager',
    ];

    components.forEach((component) => {
      it(`should reference ${component}`, () => {
        expect(content).toContain(component);
      });
    });
  });

  describe('state machines', () => {
    const content = readFileSync(archPath, 'utf-8');

    it('should document Agent status transitions', () => {
      expect(content).toContain('IDLE');
      expect(content).toContain('EXECUTING');
      expect(content).toContain('ERROR');
    });

    it('should document Task status transitions', () => {
      expect(content).toContain('PENDING');
      expect(content).toContain('RUNNING');
      expect(content).toContain('COMPLETED');
      expect(content).toContain('FAILED');
      expect(content).toContain('CANCELLED');
    });

    it('should document Circuit Breaker states', () => {
      expect(content).toContain('CLOSED');
      expect(content).toContain('OPEN');
      expect(content).toContain('HALF_OPEN');
    });
  });

  describe('event maps', () => {
    const content = readFileSync(archPath, 'utf-8');

    const eventMaps = [
      'AgentEventMap',
      'TaskEventMap',
      'CrewEventMap',
      'EngineEventMap',
      'ToolEventMap',
      'MemoryEventMap',
    ];

    eventMaps.forEach((eventMap) => {
      it(`should document ${eventMap}`, () => {
        expect(content).toContain(eventMap);
      });
    });
  });

  describe('error hierarchy', () => {
    const content = readFileSync(archPath, 'utf-8');

    const errorClasses = [
      'AgentConfigError',
      'AgentExecutionError',
      'TaskTimeoutError',
      'CircularDependencyError',
      'LLMProviderError',
      'LLMRateLimitError',
      'ToolPermissionError',
      'ToolNotFoundError',
      'MemoryConfigError',
    ];

    errorClasses.forEach((errorClass) => {
      it(`should document ${errorClass}`, () => {
        expect(content).toContain(errorClass);
      });
    });
  });

  describe('extension points', () => {
    const content = readFileSync(archPath, 'utf-8');

    it('should explain how to create a custom LLM provider', () => {
      expect(content).toContain('Custom LLM Provider');
      expect(content).toContain('implements LLMProvider');
    });

    it('should explain how to create a custom tool', () => {
      expect(content).toContain('Custom Tool');
      expect(content).toContain('defineTool');
    });

    it('should explain how to create a custom memory provider', () => {
      expect(content).toContain('Custom Memory Provider');
      expect(content).toContain('implements MemoryProvider');
    });

    it('should explain how to create a custom log transport', () => {
      expect(content).toContain('Custom Log Transport');
      expect(content).toContain('LogTransport');
    });
  });

  describe('code examples', () => {
    const content = readFileSync(archPath, 'utf-8');

    it('should contain TypeScript code blocks', () => {
      const tsBlocks = content.match(/```typescript/g);
      expect(tsBlocks).not.toBeNull();
      expect(tsBlocks!.length).toBeGreaterThanOrEqual(5);
    });

    it('should contain ASCII diagrams', () => {
      // Architecture diagram uses box-drawing characters
      expect(content).toContain('┌');
      expect(content).toContain('└');
      expect(content).toContain('│');
    });
  });

  describe('cross-references to framework modules', () => {
    const content = readFileSync(archPath, 'utf-8');

    it('should reference the package structure', () => {
      expect(content).toContain('@crewspace/core');
      expect(content).toContain('@crewspace/cli');
    });

    it('should reference key enums', () => {
      expect(content).toContain('ExecutionStrategy');
      expect(content).toContain('ToolPermission');
      expect(content).toContain('MemoryNamespace');
      expect(content).toContain('LogLevel');
    });

    it('should reference key interfaces', () => {
      expect(content).toContain('LLMResponse');
      expect(content).toContain('TaskResult');
      expect(content).toContain('MemoryEntry');
      expect(content).toContain('ToolResult');
    });
  });
});
