/**
 * TASK-081: Comprehensive README.md Validation Tests
 *
 * Validates that the root README covers all major framework features
 * including the quick start guide, core concepts, LLM providers,
 * tool system, error handling, and architecture.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(currentDir, '../../../..');

let content: string;

beforeAll(() => {
  content = readFileSync(join(PROJECT_ROOT, 'README.md'), 'utf-8');
});

describe('TASK-081: Quick Start Guide Completeness', () => {
  it('should have numbered quick-start steps', () => {
    expect(content).toContain('### 1.');
    expect(content).toContain('### 2.');
    expect(content).toContain('### 3.');
    expect(content).toContain('### 4.');
  });

  it('should show Agent creation with id, role, goal, and backstory', () => {
    expect(content).toContain("id: 'researcher'");
    expect(content).toContain("role: 'Research Analyst'");
    expect(content).toContain("goal: 'Find and summarize relevant information'");
    expect(content).toContain('backstory:');
  });

  it('should show LLM provider connection step', () => {
    expect(content).toContain('createOpenAIProvider');
    expect(content).toContain('setLLMProvider');
    expect(content).toContain('OPENAI_API_KEY');
  });

  it('should show Anthropic and Ollama alternatives', () => {
    expect(content).toContain('createAnthropicProvider');
    expect(content).toContain('createOllamaProvider');
    expect(content).toContain('ANTHROPIC_API_KEY');
  });

  it('should show tool attachment step', () => {
    expect(content).toContain('defineTool');
    expect(content).toContain('createFileTools');
    expect(content).toContain('addTool');
  });

  it('should show Zod schema in tool example', () => {
    expect(content).toContain('z.object');
    expect(content).toContain('z.number()');
    expect(content).toContain('z.enum');
  });

  it('should show Crew creation with task dependency model', () => {
    expect(content).toContain('new Crew({');
    expect(content).toContain('agentId:');
    expect(content).toContain('crew.run()');
    expect(content).toContain('taskResults');
  });

  it('should show ExecutionEngine advanced example', () => {
    expect(content).toContain('new ExecutionEngine');
    expect(content).toContain('ExecutionStrategy.PARALLEL');
    expect(content).toContain('maxConcurrency');
    expect(content).toContain('engine.addTask');
    expect(content).toContain('engine.run()');
  });

  it('should show lifecycle hooks example', () => {
    expect(content).toContain('onBeforeTask');
  });
});

describe('TASK-081: Core Concepts Section', () => {
  it('should have a Core Concepts section', () => {
    expect(content).toContain('## Core Concepts');
  });

  it('should describe Agent concept', () => {
    expect(content).toMatch(/### Agent\b/);
    expect(content).toContain('role, goal, backstory');
  });

  it('should describe Task concept with status machine', () => {
    expect(content).toMatch(/### Task\b/);
    expect(content).toContain('PENDING');
    expect(content).toContain('RUNNING');
    expect(content).toContain('COMPLETED');
    expect(content).toContain('FAILED');
  });

  it('should describe Crew concept with topological sort', () => {
    expect(content).toMatch(/### Crew\b/);
    expect(content).toContain('topological sort');
  });

  it('should describe ExecutionEngine concept', () => {
    expect(content).toMatch(/### ExecutionEngine\b/);
    expect(content).toContain('SEQUENTIAL');
    expect(content).toContain('PARALLEL');
    expect(content).toContain('fail-fast');
  });

  it('should describe Tool System concept', () => {
    expect(content).toMatch(/### Tool System\b/);
    expect(content).toContain('ToolRegistry');
    expect(content).toContain('ToolExecutor');
    expect(content).toContain('PermissionManager');
  });

  it('should describe LLM Providers concept', () => {
    expect(content).toMatch(/### LLM Providers\b/);
    expect(content).toContain('generateText');
    expect(content).toContain('generateStream');
  });
});

describe('TASK-081: LLM Provider Documentation', () => {
  it('should list all three built-in providers in a table', () => {
    expect(content).toContain('OpenAIProvider');
    expect(content).toContain('AnthropicProvider');
    expect(content).toContain('OllamaProvider');
  });

  it('should document resilience decorators', () => {
    expect(content).toContain('createRetryProvider');
    expect(content).toContain('createFallbackProvider');
    expect(content).toContain('createUsageTrackingProvider');
  });
});

describe('TASK-081: Error Handling Documentation', () => {
  it('should have an Error Handling section', () => {
    expect(content).toMatch(/### Error Handling\b/);
  });

  it('should list Agent error classes', () => {
    expect(content).toContain('AgentConfigError');
    expect(content).toContain('AgentExecutionError');
  });

  it('should list Task error classes', () => {
    expect(content).toContain('TaskConfigError');
    expect(content).toContain('TaskExecutionError');
    expect(content).toContain('TaskTimeoutError');
  });

  it('should list Tool error classes', () => {
    expect(content).toContain('ToolConfigError');
    expect(content).toContain('ToolPermissionError');
    expect(content).toContain('ToolInputValidationError');
  });

  it('should list LLM error classes', () => {
    expect(content).toContain('LLMProviderError');
    expect(content).toContain('LLMRateLimitError');
    expect(content).toContain('LLMAuthenticationError');
    expect(content).toContain('LLMContextLengthError');
  });
});

describe('TASK-081: Architecture Documentation', () => {
  it('should document Zod runtime validation decision', () => {
    expect(content).toContain('Zod runtime validation');
  });

  it('should document EventEmitter3 decision', () => {
    expect(content).toContain('EventEmitter3');
  });

  it('should document immutability decision', () => {
    expect(content).toMatch(/[Ii]mmutable|readonly/);
  });
});

describe('TASK-081: Project Structure Detail', () => {
  it('should show agent directory', () => {
    expect(content).toContain('agent/');
  });

  it('should show crew directory', () => {
    expect(content).toContain('crew/');
  });

  it('should show task directory', () => {
    expect(content).toContain('task/');
  });

  it('should show engine directory', () => {
    expect(content).toContain('engine/');
  });

  it('should show llm directory', () => {
    expect(content).toContain('llm/');
  });

  it('should show tool directory', () => {
    expect(content).toContain('tool/');
  });

  it('should show tools directory for built-in tools', () => {
    expect(content).toContain('tools/');
  });

  it('should show errors directory', () => {
    expect(content).toContain('errors/');
  });

  it('should show validation directory', () => {
    expect(content).toContain('validation/');
  });
});

describe('TASK-081: README Size and Quality', () => {
  it('should be significantly comprehensive (>= 6000 characters)', () => {
    expect(content.length).toBeGreaterThanOrEqual(6000);
  });

  it('should have at least 8 top-level sections', () => {
    const sectionCount = (content.match(/^## /gm) ?? []).length;
    expect(sectionCount).toBeGreaterThanOrEqual(8);
  });

  it('should have at least 10 code blocks', () => {
    const codeBlockCount = (content.match(/```/g) ?? []).length / 2;
    expect(codeBlockCount).toBeGreaterThanOrEqual(10);
  });

  it('should have TypeScript code examples', () => {
    const tsBlockCount = (content.match(/```typescript/g) ?? []).length;
    expect(tsBlockCount).toBeGreaterThanOrEqual(5);
  });

  it('should contain both bash and typescript code blocks', () => {
    expect(content).toContain('```bash');
    expect(content).toContain('```typescript');
  });
});
