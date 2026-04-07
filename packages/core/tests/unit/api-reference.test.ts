/**
 * QA Validation Tests for TASK-083: API Reference Documentation
 *
 * Validates completeness, accuracy, and structure of the API reference
 * documentation at docs/api-reference.md.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../../../..');
const API_REF_PATH = join(PROJECT_ROOT, 'docs', 'api-reference.md');

let content: string;

beforeAll(() => {
  content = readFileSync(API_REF_PATH, 'utf-8');
});

describe('TASK-083: API Reference Documentation', () => {
  describe('File existence and structure', () => {
    it('should exist at docs/api-reference.md', () => {
      expect(existsSync(API_REF_PATH)).toBe(true);
    });

    it('should have a title heading', () => {
      expect(content).toMatch(/^# API Reference/m);
    });

    it('should reference @crewspace/core', () => {
      expect(content).toContain('@crewspace/core');
    });

    it('should include the version number', () => {
      expect(content).toContain('0.1.0');
    });

    it('should have a table of contents', () => {
      expect(content).toContain('Table of Contents');
    });

    it('should be substantial (at least 10,000 chars)', () => {
      expect(content.length).toBeGreaterThan(10000);
    });

    it('should have multiple H2 sections (>= 10)', () => {
      const h2Count = (content.match(/^## /gm) ?? []).length;
      expect(h2Count).toBeGreaterThanOrEqual(10);
    });

    it('should have multiple H3 sections (>= 20)', () => {
      const h3Count = (content.match(/^### /gm) ?? []).length;
      expect(h3Count).toBeGreaterThanOrEqual(20);
    });

    it('should not have broken markdown links (empty targets)', () => {
      const brokenLinkPattern = /\]\(\s*\)/;
      expect(content).not.toMatch(brokenLinkPattern);
    });
  });

  describe('Core Classes documentation', () => {
    it('should document the Agent class', () => {
      expect(content).toContain('### Agent');
      expect(content).toContain('new Agent(config: AgentConfig)');
    });

    it('should document Agent properties', () => {
      expect(content).toContain('`id`');
      expect(content).toContain('`role`');
      expect(content).toContain('`goal`');
      expect(content).toContain('`backstory`');
      expect(content).toContain('`maxIterations`');
      expect(content).toContain('`status`');
    });

    it('should document Agent methods', () => {
      expect(content).toContain('`setLLMProvider`');
      expect(content).toContain('`addTool`');
      expect(content).toContain('`removeTool`');
      expect(content).toContain('`execute`');
    });

    it('should document the Crew class', () => {
      expect(content).toContain('### Crew');
      expect(content).toContain('new Crew(config: CrewConfig)');
    });

    it('should document Crew methods', () => {
      expect(content).toContain('`run`');
      expect(content).toContain('`reset`');
    });

    it('should document the Task class', () => {
      expect(content).toContain('### Task');
      expect(content).toContain('new Task(config: TaskConfig)');
    });

    it('should document Task methods', () => {
      expect(content).toContain('`assignAgent`');
      expect(content).toContain('`setStatus`');
      expect(content).toContain('`complete`');
      expect(content).toContain('`fail`');
      expect(content).toContain('`cancel`');
      expect(content).toContain('`toTaskInput`');
      expect(content).toContain('`toCrewTask`');
    });

    it('should document Task status transitions', () => {
      expect(content).toContain('Status Transitions');
      expect(content).toContain('PENDING');
      expect(content).toContain('RUNNING');
      expect(content).toContain('COMPLETED');
      expect(content).toContain('FAILED');
      expect(content).toContain('CANCELLED');
    });

    it('should document the ExecutionEngine class', () => {
      expect(content).toContain('### ExecutionEngine');
      expect(content).toContain('new ExecutionEngine(config: ExecutionEngineConfig)');
    });

    it('should document ExecutionEngine methods', () => {
      expect(content).toContain('`addTask`');
      expect(content).toContain('`addAgent`');
      expect(content).toContain('`beforeTask`');
      expect(content).toContain('`afterTask`');
      expect(content).toContain('`onTaskError`');
    });

    it('should document hook types', () => {
      expect(content).toContain('BeforeTaskHook');
      expect(content).toContain('AfterTaskHook');
      expect(content).toContain('OnTaskErrorHook');
    });
  });

  describe('LLM Providers documentation', () => {
    it('should document the LLMProvider interface', () => {
      expect(content).toContain('### LLMProvider');
      expect(content).toContain('generateText');
    });

    it('should document the StreamingLLMProvider interface', () => {
      expect(content).toContain('### StreamingLLMProvider');
      expect(content).toContain('generateStream');
    });

    it('should document concrete providers', () => {
      expect(content).toContain('### OpenAIProvider');
      expect(content).toContain('### AnthropicProvider');
      expect(content).toContain('### OllamaProvider');
    });

    it('should document factory functions for providers', () => {
      expect(content).toContain('createOpenAIProvider');
      expect(content).toContain('createAnthropicProvider');
      expect(content).toContain('createOllamaProvider');
    });

    it('should document RetryLLMProvider', () => {
      expect(content).toContain('### RetryLLMProvider');
      expect(content).toContain('createRetryProvider');
    });

    it('should document FallbackLLMProvider', () => {
      expect(content).toContain('### FallbackLLMProvider');
      expect(content).toContain('createFallbackProvider');
    });

    it('should document UsageTrackingProvider', () => {
      expect(content).toContain('### UsageTrackingProvider');
      expect(content).toContain('createUsageTrackingProvider');
    });

    it('should document LLMProviderRegistry', () => {
      expect(content).toContain('### LLMProviderRegistry');
      expect(content).toContain('register');
      expect(content).toContain('create');
    });

    it('should document TokenUsageTracker', () => {
      expect(content).toContain('### TokenUsageTracker');
      expect(content).toContain('getReport');
    });

    it('should document ModelCatalog', () => {
      expect(content).toContain('### ModelCatalog');
    });

    it('should document CircuitBreaker', () => {
      expect(content).toContain('### CircuitBreaker');
      expect(content).toContain('isAllowed');
      expect(content).toContain('recordSuccess');
      expect(content).toContain('recordFailure');
    });

    it('should document DefaultLLMStreamResponse', () => {
      expect(content).toContain('### DefaultLLMStreamResponse');
      expect(content).toContain('toResponse');
    });
  });

  describe('Tool System documentation', () => {
    it('should document the Tool interface', () => {
      expect(content).toMatch(/### Tool\b/);
      expect(content).toContain('readonly name: string');
      expect(content).toContain('execute(input: unknown): Promise<unknown>');
    });

    it('should document ToolRegistry', () => {
      expect(content).toContain('### ToolRegistry');
      expect(content).toContain('`getByCategory`');
      expect(content).toContain('`getByPermission`');
    });

    it('should document ToolExecutor', () => {
      expect(content).toContain('### ToolExecutor');
    });

    it('should document PermissionManager', () => {
      expect(content).toContain('### PermissionManager');
      expect(content).toContain('ALLOW_ALL_POLICY');
      expect(content).toContain('DENY_ALL_POLICY');
    });

    it('should document defineTool', () => {
      expect(content).toContain('### defineTool');
      expect(content).toContain('DefineToolOptions');
    });

    it('should document createTool', () => {
      expect(content).toContain('### createTool');
    });

    it('should document composeTool', () => {
      expect(content).toContain('### composeTool');
      expect(content).toContain('DEFAULT_MAX_COMPOSITION_DEPTH');
    });

    it('should document tool decorator', () => {
      expect(content).toContain('tool (decorator)');
      expect(content).toContain('collectTools');
      expect(content).toContain('hasTools');
    });
  });

  describe('Built-in Tools documentation', () => {
    it('should document File Tools', () => {
      expect(content).toContain('### File Tools');
      expect(content).toContain('createFileTools');
      expect(content).toContain('createReadFileTool');
      expect(content).toContain('createWriteFileTool');
      expect(content).toContain('createListFilesTool');
    });

    it('should document file tool constants', () => {
      expect(content).toContain('MAX_READ_SIZE');
      expect(content).toContain('MAX_WRITE_SIZE');
      expect(content).toContain('DEFAULT_MAX_ENTRIES');
      expect(content).toContain('HARD_MAX_ENTRIES');
    });

    it('should document Web Tools', () => {
      expect(content).toContain('### Web Tools');
      expect(content).toContain('createWebTools');
      expect(content).toContain('createFetchUrlTool');
      expect(content).toContain('createParseHtmlTool');
      expect(content).toContain('createWebSearchTool');
    });

    it('should document HTML utility functions', () => {
      expect(content).toContain('stripTags');
      expect(content).toContain('extractTitle');
      expect(content).toContain('extractMetadata');
      expect(content).toContain('extractLinks');
      expect(content).toContain('decodeHtmlEntities');
    });
  });

  describe('Memory System documentation', () => {
    it('should document the MemoryProvider interface', () => {
      expect(content).toContain('### MemoryProvider');
      expect(content).toContain('add(entry: MemoryEntry)');
      expect(content).toContain('get(id: string)');
      expect(content).toContain('query(options');
      expect(content).toContain('search(text');
      expect(content).toContain('delete(id');
      expect(content).toContain('clear(namespace');
      expect(content).toContain('count(namespace');
    });

    it('should document ShortTermMemory', () => {
      expect(content).toContain('### ShortTermMemory');
    });

    it('should document MemoryManager', () => {
      expect(content).toContain('### MemoryManager');
    });
  });

  describe('Configuration Interfaces documentation', () => {
    it('should document AgentConfig', () => {
      expect(content).toContain('### AgentConfig');
      expect(content).toContain('readonly id: string');
      expect(content).toContain('readonly role: string');
      expect(content).toContain('readonly goal: string');
    });

    it('should document CrewConfig', () => {
      expect(content).toContain('### CrewConfig');
      expect(content).toContain('readonly agents');
      expect(content).toContain('readonly tasks');
    });

    it('should document CrewTask', () => {
      expect(content).toContain('### CrewTask');
      expect(content).toContain('readonly agentId');
      expect(content).toContain('readonly dependencies');
    });

    it('should document TaskConfig', () => {
      expect(content).toContain('### TaskConfig');
      expect(content).toContain('readonly timeout');
      expect(content).toContain('readonly retries');
      expect(content).toContain('readonly priority');
    });

    it('should document ExecutionEngineConfig', () => {
      expect(content).toContain('### ExecutionEngineConfig');
      expect(content).toContain('readonly strategy');
      expect(content).toContain('readonly maxConcurrency');
      expect(content).toContain('readonly globalTimeout');
      expect(content).toContain('taskErrorPolicy');
    });

    it('should document LLMProviderConfig', () => {
      expect(content).toContain('### LLMProviderConfig');
      expect(content).toContain('readonly provider');
      expect(content).toContain('readonly modelId');
      expect(content).toContain('readonly apiKey');
    });

    it('should document LLMRequestOptions', () => {
      expect(content).toContain('### LLMRequestOptions');
      expect(content).toContain('temperature');
      expect(content).toContain('maxTokens');
    });

    it('should document MemoryConfig', () => {
      expect(content).toContain('### MemoryConfig');
    });

    it('should document ToolPermissionPolicy', () => {
      expect(content).toContain('### ToolPermissionPolicy');
      expect(content).toContain('defaultAction');
    });
  });

  describe('Data Types documentation', () => {
    it('should document TaskInput', () => {
      expect(content).toContain('### TaskInput');
    });

    it('should document TaskResult', () => {
      expect(content).toContain('### TaskResult');
      expect(content).toContain('readonly output: string');
      expect(content).toContain('readonly duration: number');
    });

    it('should document CrewRunResult', () => {
      expect(content).toContain('### CrewRunResult');
      expect(content).toContain('taskResults');
      expect(content).toContain('success');
    });

    it('should document EngineRunResult', () => {
      expect(content).toContain('### EngineRunResult');
    });

    it('should document LLMMessage', () => {
      expect(content).toContain('### LLMMessage');
      expect(content).toContain('readonly role: LLMRole');
    });

    it('should document LLMResponse', () => {
      expect(content).toContain('### LLMResponse');
      expect(content).toContain('tokenUsage');
      expect(content).toContain('finishReason');
    });

    it('should document LLMStreamChunk', () => {
      expect(content).toContain('### LLMStreamChunk');
    });

    it('should document LLMStreamResponse', () => {
      expect(content).toContain('### LLMStreamResponse');
      expect(content).toContain('toResponse');
    });

    it('should document LLMModelInfo', () => {
      expect(content).toContain('### LLMModelInfo');
      expect(content).toContain('maxContextTokens');
      expect(content).toContain('maxOutputTokens');
    });

    it('should document TokenUsage', () => {
      expect(content).toContain('### TokenUsage');
      expect(content).toContain('promptTokens');
      expect(content).toContain('completionTokens');
    });

    it('should document ToolResult', () => {
      expect(content).toContain('### ToolResult');
    });

    it('should document ToolParameterSchema', () => {
      expect(content).toContain('### ToolParameterSchema');
    });

    it('should document MemoryEntry', () => {
      expect(content).toContain('### MemoryEntry');
    });

    it('should document MemoryQueryOptions', () => {
      expect(content).toContain('### MemoryQueryOptions');
    });

    it('should document MemoryQueryResult', () => {
      expect(content).toContain('### MemoryQueryResult');
    });

    it('should document MemoryRetentionPolicy', () => {
      expect(content).toContain('### MemoryRetentionPolicy');
    });
  });

  describe('Enums documentation', () => {
    const requiredEnums = [
      'AgentStatus',
      'CrewStatus',
      'TaskStatus',
      'TaskPriority',
      'EngineStatus',
      'ExecutionStrategy',
      'LLMRole',
      'ToolPermission',
      'ToolCategory',
      'MemoryNamespace',
      'MemoryRole',
      'CircuitState',
    ];

    for (const enumName of requiredEnums) {
      it(`should document ${enumName} enum`, () => {
        expect(content).toContain(`### ${enumName}`);
      });
    }

    it('should show enum values for AgentStatus', () => {
      expect(content).toContain("IDLE = 'idle'");
      expect(content).toContain("EXECUTING = 'executing'");
    });

    it('should show enum values for TaskStatus', () => {
      expect(content).toContain("PENDING = 'pending'");
      expect(content).toContain("RUNNING = 'running'");
      expect(content).toContain("COMPLETED = 'completed'");
      expect(content).toContain("FAILED = 'failed'");
      expect(content).toContain("CANCELLED = 'cancelled'");
    });

    it('should show enum values for ExecutionStrategy', () => {
      expect(content).toContain("SEQUENTIAL = 'sequential'");
      expect(content).toContain("PARALLEL = 'parallel'");
    });

    it('should show enum values for ToolPermission', () => {
      expect(content).toContain("FILE_READ = 'file:read'");
      expect(content).toContain("FILE_WRITE = 'file:write'");
      expect(content).toContain("NETWORK = 'network'");
      expect(content).toContain("SHELL_EXEC = 'shell:exec'");
    });
  });

  describe('Event Maps documentation', () => {
    const requiredEventMaps = [
      'AgentEventMap',
      'CrewEventMap',
      'TaskEventMap',
      'EngineEventMap',
      'ToolEventMap',
      'MemoryEventMap',
    ];

    for (const eventMap of requiredEventMaps) {
      it(`should document ${eventMap}`, () => {
        expect(content).toContain(`### ${eventMap}`);
      });
    }

    it('should document agent events', () => {
      expect(content).toContain('`agent:start`');
      expect(content).toContain('`agent:complete`');
      expect(content).toContain('`agent:error`');
      expect(content).toContain('`agent:llm:start`');
      expect(content).toContain('`agent:llm:complete`');
    });

    it('should document crew events', () => {
      expect(content).toContain('`crew:start`');
      expect(content).toContain('`crew:complete`');
      expect(content).toContain('`crew:task:start`');
      expect(content).toContain('`crew:task:complete`');
    });

    it('should document task events', () => {
      expect(content).toContain('`task:start`');
      expect(content).toContain('`task:complete`');
      expect(content).toContain('`task:error`');
      expect(content).toContain('`task:retry`');
      expect(content).toContain('`task:timeout`');
    });

    it('should document engine events', () => {
      expect(content).toContain('`engine:start`');
      expect(content).toContain('`engine:complete`');
      expect(content).toContain('`engine:cancelled`');
      expect(content).toContain('`engine:task:start`');
      expect(content).toContain('`engine:task:retry`');
    });

    it('should document tool events', () => {
      expect(content).toContain('`tool:execute:start`');
      expect(content).toContain('`tool:execute:complete`');
      expect(content).toContain('`tool:permission:denied`');
    });

    it('should document memory events', () => {
      expect(content).toContain('`memory:add`');
      expect(content).toContain('`memory:delete`');
      expect(content).toContain('`memory:clear`');
      expect(content).toContain('`memory:evict`');
    });
  });

  describe('Error Classes documentation', () => {
    it('should document Agent errors', () => {
      expect(content).toContain('AgentConfigError');
      expect(content).toContain('AgentExecutionError');
    });

    it('should document Crew errors', () => {
      expect(content).toContain('CrewConfigError');
      expect(content).toContain('CrewExecutionError');
    });

    it('should document Task errors', () => {
      expect(content).toContain('TaskConfigError');
      expect(content).toContain('TaskExecutionError');
      expect(content).toContain('TaskTimeoutError');
      expect(content).toContain('CircularDependencyError');
    });

    it('should document Engine errors', () => {
      expect(content).toContain('EngineConfigError');
      expect(content).toContain('EngineExecutionError');
    });

    it('should document LLM errors', () => {
      expect(content).toContain('LLMProviderError');
      expect(content).toContain('LLMRateLimitError');
      expect(content).toContain('LLMAuthenticationError');
      expect(content).toContain('LLMContextLengthError');
      expect(content).toContain('LLMStreamError');
    });

    it('should document Tool errors', () => {
      expect(content).toContain('ToolConfigError');
      expect(content).toContain('ToolNotFoundError');
      expect(content).toContain('ToolExecutionError');
      expect(content).toContain('ToolPermissionError');
      expect(content).toContain('ToolTimeoutError');
      expect(content).toContain('ToolCompositionError');
      expect(content).toContain('ToolInputValidationError');
    });

    it('should document Memory errors', () => {
      expect(content).toContain('MemoryConfigError');
      expect(content).toContain('MemoryOperationError');
      expect(content).toContain('MemoryQueryError');
    });
  });

  describe('Utility Functions documentation', () => {
    it('should document dependency resolution utilities', () => {
      expect(content).toContain('topologicalSort');
      expect(content).toContain('getExecutionLevels');
      expect(content).toContain('detectCircularDependencies');
      expect(content).toContain('assertNoCycles');
    });

    it('should document task execution utilities', () => {
      expect(content).toContain('executeWithRetry');
      expect(content).toContain('executeWithTimeout');
      expect(content).toContain('TaskExecutionWrapper');
    });

    it('should document task formatting utilities', () => {
      expect(content).toContain('formatTaskList');
      expect(content).toContain('formatTaskDependencyTree');
      expect(content).toContain('formatTaskPlanTree');
    });

    it('should document LLM utilities', () => {
      expect(content).toContain('isStreamingProvider');
      expect(content).toContain('buildRetryConfig');
      expect(content).toContain('calculateDelay');
      expect(content).toContain('isRetryableError');
      expect(content).toContain('withRetry');
      expect(content).toContain('zodToToolSchema');
    });

    it('should document validation functions', () => {
      expect(content).toContain('validateToolConfig');
      expect(content).toContain('validateToolPermissionPolicy');
      expect(content).toContain('parseToolInput');
      expect(content).toContain('isValidTool');
      expect(content).toContain('validateLLMProviderConfig');
      expect(content).toContain('validateLLMMessages');
    });

    it('should document Zod validation schemas', () => {
      expect(content).toContain('ToolConfigSchema');
      expect(content).toContain('LLMProviderConfigSchema');
      expect(content).toContain('LLMMessageSchema');
    });
  });

  describe('Code examples', () => {
    it('should include TypeScript code examples', () => {
      const codeBlockCount = (content.match(/```typescript/g) ?? []).length;
      expect(codeBlockCount).toBeGreaterThanOrEqual(10);
    });

    it('should show Agent creation example', () => {
      expect(content).toContain('new Agent({');
      expect(content).toContain("id: 'researcher'");
    });

    it('should show Crew creation example', () => {
      expect(content).toContain('new Crew({');
    });

    it('should show import statements', () => {
      expect(content).toContain("import { Agent } from '@crewspace/core'");
    });

    it('should show defineTool example', () => {
      expect(content).toContain("import { defineTool } from '@crewspace/core'");
    });

    it('should show LLM provider creation examples', () => {
      expect(content).toContain("import { createOpenAIProvider } from '@crewspace/core'");
      expect(content).toContain("import { createAnthropicProvider } from '@crewspace/core'");
    });
  });

  describe('Cross-references', () => {
    it('should link to getting-started.md', () => {
      expect(content).toContain('getting-started.md');
    });

    it('should link to examples', () => {
      expect(content).toContain('examples');
    });

    it('should link to README', () => {
      expect(content).toContain('README.md');
    });
  });

  describe('Matches exported API surface', () => {
    it('should document all public classes from index.ts', () => {
      const classes = ['Agent', 'Crew', 'Task', 'ExecutionEngine', 'ParallelExecutor'];
      for (const cls of classes) {
        expect(content).toContain(cls);
      }
    });

    it('should document all public enums from index.ts', () => {
      const enums = [
        'AgentStatus',
        'CrewStatus',
        'TaskStatus',
        'TaskPriority',
        'EngineStatus',
        'ExecutionStrategy',
        'LLMRole',
        'ToolPermission',
        'ToolCategory',
        'MemoryNamespace',
        'MemoryRole',
      ];
      for (const e of enums) {
        expect(content).toContain(e);
      }
    });

    it('should document key configuration interfaces', () => {
      const interfaces = [
        'AgentConfig',
        'CrewConfig',
        'CrewTask',
        'TaskConfig',
        'ExecutionEngineConfig',
        'LLMProviderConfig',
        'LLMRequestOptions',
        'MemoryConfig',
        'ToolPermissionPolicy',
      ];
      for (const iface of interfaces) {
        expect(content).toContain(iface);
      }
    });

    it('should document all event maps', () => {
      const eventMaps = [
        'AgentEventMap',
        'CrewEventMap',
        'TaskEventMap',
        'EngineEventMap',
        'ToolEventMap',
        'MemoryEventMap',
      ];
      for (const em of eventMaps) {
        expect(content).toContain(em);
      }
    });

    it('should document all LLM data types', () => {
      const types = [
        'LLMMessage',
        'LLMResponse',
        'LLMStreamChunk',
        'LLMStreamResponse',
        'LLMModelInfo',
        'TokenUsage',
      ];
      for (const t of types) {
        expect(content).toContain(t);
      }
    });

    it('should document all error classes', () => {
      const errors = [
        'AgentConfigError',
        'AgentExecutionError',
        'CrewConfigError',
        'CrewExecutionError',
        'TaskConfigError',
        'TaskExecutionError',
        'TaskTimeoutError',
        'CircularDependencyError',
        'EngineConfigError',
        'EngineExecutionError',
        'LLMProviderError',
        'LLMRateLimitError',
        'LLMAuthenticationError',
        'LLMContextLengthError',
        'LLMStreamError',
        'ToolConfigError',
        'ToolNotFoundError',
        'ToolExecutionError',
        'ToolPermissionError',
        'ToolTimeoutError',
        'ToolCompositionError',
        'ToolInputValidationError',
        'MemoryConfigError',
        'MemoryOperationError',
        'MemoryQueryError',
      ];
      for (const err of errors) {
        expect(content).toContain(err);
      }
    });
  });
});
