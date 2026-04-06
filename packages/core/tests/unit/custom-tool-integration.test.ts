/**
 * Tests for TASK-092: Custom Tool Integration Example
 *
 * Validates the custom-tool-integration example file structure, tool creation
 * using all three approaches (defineTool, createTool, composeTool), agent
 * integration, and end-to-end crew execution with custom tools.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
import { defineTool } from '../../src/tool/define-tool.js';
import { createTool } from '../../src/tool/create-tool.js';
import { composeTool, isComposableTool } from '../../src/tool/compose-tool.js';
import { ToolRegistry } from '../../src/tool/tool-registry.js';
import { ToolExecutor } from '../../src/tool/tool-executor.js';
import { PermissionManager, ALLOW_ALL_POLICY } from '../../src/tool/permission-manager.js';
import { ToolCategory, ToolPermission } from '../../src/types/tool.js';
import type { LLMProvider, LLMResponse, LLMMessage, Tool, ToolResult } from '../../src/types/index.js';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = dirname(currentFilename);
const PROJECT_ROOT = join(currentDirname, '../../../..');
const EXAMPLES_DIR = join(PROJECT_ROOT, 'examples');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockLLMProvider(content?: string): LLMProvider {
  return {
    name: 'mock-provider',
    generateText: vi
      .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
      .mockResolvedValue({
        content: content ?? 'Mock response',
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
      }),
  };
}

// ---------------------------------------------------------------------------
// Example file validation
// ---------------------------------------------------------------------------

describe('TASK-092: Custom Tool Integration — Example File', () => {
  const examplePath = join(EXAMPLES_DIR, 'custom-tool-integration.ts');
  let content: string;

  it('should exist at examples/custom-tool-integration.ts', () => {
    expect(existsSync(examplePath)).toBe(true);
    content = readFileSync(examplePath, 'utf-8');
  });

  it('should include a file header comment', () => {
    expect(content).toMatch(/^\/\*\*/);
  });

  it('should import Agent and Crew from @crewspace/core', () => {
    expect(content).toContain('Agent');
    expect(content).toContain('Crew');
    expect(content).toContain("from '@crewspace/core'");
  });

  it('should import defineTool from @crewspace/core', () => {
    expect(content).toContain('defineTool');
  });

  it('should import createTool from @crewspace/core', () => {
    expect(content).toContain('createTool');
  });

  it('should import composeTool from @crewspace/core', () => {
    expect(content).toContain('composeTool');
  });

  it('should import ToolRegistry and ToolExecutor', () => {
    expect(content).toContain('ToolRegistry');
    expect(content).toContain('ToolExecutor');
  });

  it('should import ToolCategory and ToolPermission', () => {
    expect(content).toContain('ToolCategory');
    expect(content).toContain('ToolPermission');
  });

  it('should import z from zod for schema definitions', () => {
    expect(content).toContain("from 'zod'");
  });

  it('should demonstrate all three tool creation approaches', () => {
    expect(content).toContain('defineTool(');
    expect(content).toContain('createTool(');
    expect(content).toContain('composeTool(');
  });

  it('should create at least two agents', () => {
    const agentCreations = content.match(/new Agent\(/g) ?? [];
    expect(agentCreations.length).toBeGreaterThanOrEqual(2);
  });

  it('should create a Crew', () => {
    expect(content).toContain('new Crew');
  });

  it('should call crew.run()', () => {
    expect(content).toMatch(/\.run\(\)/);
  });

  it('should demonstrate task dependencies', () => {
    expect(content).toContain('dependencies');
  });

  it('should show lifecycle event subscription', () => {
    expect(content).toContain(".on('crew:");
  });

  it('should include usage instructions in header', () => {
    expect(content).toContain('npx tsx examples/custom-tool-integration.ts');
  });

  it('should mention mock provider replacement', () => {
    expect(content).toMatch(/[Rr]eplace.*real provider|[Mm]ock.*provider/);
  });

  it('should define agents with distinct roles', () => {
    expect(content).toMatch(/role:.*[Ii]nspector/);
    expect(content).toMatch(/role:.*[Rr]eporter|[Ww]riter/);
  });

  it('should define agents with backstories', () => {
    const backstoryCount = (content.match(/backstory:/g) ?? []).length;
    expect(backstoryCount).toBeGreaterThanOrEqual(2);
  });

  it('should use Zod schemas in defineTool calls', () => {
    expect(content).toContain('z.object(');
    expect(content).toContain('z.string()');
  });

  it('should use ToolCategory enum values', () => {
    expect(content).toContain('ToolCategory.CUSTOM');
    expect(content).toContain('ToolCategory.DATA');
  });

  it('should use ToolPermission enum values', () => {
    expect(content).toContain('ToolPermission.NETWORK');
    expect(content).toContain('ToolPermission.FILE_READ');
  });

  it('should demonstrate standalone ToolExecutor usage', () => {
    expect(content).toContain('new ToolExecutor');
    expect(content).toContain('executor.execute');
  });

  it('should demonstrate ToolRegistry usage', () => {
    expect(content).toContain('new ToolRegistry');
    expect(content).toContain('registry.register');
  });

  it('should demonstrate tool event listening', () => {
    expect(content).toContain("'tool:execute:start'");
    expect(content).toContain("'tool:execute:complete'");
  });
});

// ---------------------------------------------------------------------------
// defineTool — Type-safe tool with Zod schema
// ---------------------------------------------------------------------------

describe('TASK-092: Custom Tool Integration — defineTool', () => {
  const healthCheckTool = defineTool({
    name: 'healthCheck',
    description: 'Check the health status of a named service',
    category: ToolCategory.CUSTOM,
    permissions: [ToolPermission.NETWORK],
    schema: z.object({
      service: z.string(),
      timeout: z.number().optional(),
    }),
    async execute({ service, timeout }) {
      const latency = 50;
      return {
        service,
        status: latency < (timeout ?? 1000) ? 'healthy' : 'degraded',
        latencyMs: latency,
      };
    },
  });

  it('should create a tool with correct name and description', () => {
    expect(healthCheckTool.name).toBe('healthCheck');
    expect(healthCheckTool.description).toBe('Check the health status of a named service');
  });

  it('should have CUSTOM category', () => {
    expect(healthCheckTool.category).toBe(ToolCategory.CUSTOM);
  });

  it('should have NETWORK permission', () => {
    expect(healthCheckTool.permissions).toContain(ToolPermission.NETWORK);
  });

  it('should have an inputSchema derived from Zod', () => {
    expect(healthCheckTool.inputSchema).toBeDefined();
    expect(healthCheckTool.inputSchema?.type).toBe('object');
    expect(healthCheckTool.inputSchema?.properties).toBeDefined();
    expect(healthCheckTool.inputSchema?.properties?.['service']).toBeDefined();
  });

  it('should have an inputZodSchema', () => {
    expect(healthCheckTool.inputZodSchema).toBeDefined();
  });

  it('should execute successfully with valid input', async () => {
    const result = await healthCheckTool.execute({ service: 'api-gateway', timeout: 500 });
    const data = result as { service: string; status: string; latencyMs: number };
    expect(data.service).toBe('api-gateway');
    expect(data.status).toBe('healthy');
    expect(typeof data.latencyMs).toBe('number');
  });

  it('should execute with optional parameters omitted', async () => {
    const result = await healthCheckTool.execute({ service: 'web-app' });
    const data = result as { service: string; status: string };
    expect(data.service).toBe('web-app');
    expect(data.status).toBe('healthy');
  });

  it('should reject invalid input (missing required field)', async () => {
    await expect(healthCheckTool.execute({})).rejects.toThrow();
  });

  it('should reject invalid input (wrong type)', async () => {
    await expect(healthCheckTool.execute({ service: 123 })).rejects.toThrow();
  });

  it('should be frozen (immutable)', () => {
    expect(Object.isFrozen(healthCheckTool)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createTool — JSON Schema + manual typing
// ---------------------------------------------------------------------------

describe('TASK-092: Custom Tool Integration — createTool (JSON Schema)', () => {
  const diskUsageTool = createTool({
    name: 'diskUsage',
    description: 'Get disk usage statistics',
    category: ToolCategory.DATA,
    permissions: [ToolPermission.FILE_READ],
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File system path' },
      },
      required: ['path'],
    },
    async execute(input: unknown) {
      const { path } = input as { path: string };
      return { path, totalGb: 500, usedGb: 342, freeGb: 158, usagePercent: 68.4 };
    },
  });

  it('should create a tool with correct name', () => {
    expect(diskUsageTool.name).toBe('diskUsage');
  });

  it('should have DATA category', () => {
    expect(diskUsageTool.category).toBe(ToolCategory.DATA);
  });

  it('should have FILE_READ permission', () => {
    expect(diskUsageTool.permissions).toContain(ToolPermission.FILE_READ);
  });

  it('should have an inputSchema with object type', () => {
    expect(diskUsageTool.inputSchema?.type).toBe('object');
    expect(diskUsageTool.inputSchema?.properties?.['path']?.type).toBe('string');
    expect(diskUsageTool.inputSchema?.required).toContain('path');
  });

  it('should execute successfully', async () => {
    const result = await diskUsageTool.execute({ path: '/var/data' });
    const data = result as { path: string; usagePercent: number };
    expect(data.path).toBe('/var/data');
    expect(data.usagePercent).toBe(68.4);
  });

  it('should be frozen', () => {
    expect(Object.isFrozen(diskUsageTool)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createTool — with Zod schema via inputZodSchema
// ---------------------------------------------------------------------------

describe('TASK-092: Custom Tool Integration — createTool (Zod)', () => {
  const systemMetricsTool = createTool({
    name: 'systemMetrics',
    description: 'Retrieve CPU and memory usage metrics',
    category: ToolCategory.DATA,
    inputZodSchema: z.object({
      host: z.string(),
    }),
    async execute(input: unknown) {
      const { host } = input as { host: string };
      return { host, cpuPercent: 45.2, memoryPercent: 50.0 };
    },
  });

  it('should create a tool with auto-derived inputSchema from Zod', () => {
    expect(systemMetricsTool.inputSchema).toBeDefined();
    expect(systemMetricsTool.inputSchema?.type).toBe('object');
    expect(systemMetricsTool.inputSchema?.properties?.['host']).toBeDefined();
  });

  it('should have inputZodSchema for runtime validation', () => {
    expect(systemMetricsTool.inputZodSchema).toBeDefined();
  });

  it('should validate input via Zod and execute', async () => {
    const result = await systemMetricsTool.execute({ host: 'web-01' });
    const data = result as { host: string; cpuPercent: number };
    expect(data.host).toBe('web-01');
    expect(data.cpuPercent).toBe(45.2);
  });

  it('should reject invalid input via Zod validation', async () => {
    await expect(systemMetricsTool.execute({ host: 123 })).rejects.toThrow();
  });

  it('should reject missing required fields', async () => {
    await expect(systemMetricsTool.execute({})).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// composeTool — Tool that invokes other tools
// ---------------------------------------------------------------------------

describe('TASK-092: Custom Tool Integration — composeTool', () => {
  const innerToolA = defineTool({
    name: 'innerA',
    description: 'Returns alpha data',
    schema: z.object({ key: z.string() }),
    async execute({ key }) {
      return { key, value: 'alpha' };
    },
  });

  const innerToolB = defineTool({
    name: 'innerB',
    description: 'Returns beta data',
    schema: z.object({ key: z.string() }),
    async execute({ key }) {
      return { key, value: 'beta' };
    },
  });

  const combinedTool = composeTool({
    name: 'combined',
    description: 'Combines results from innerA and innerB',
    category: ToolCategory.CUSTOM,
    schema: z.object({ key: z.string() }),
    async execute({ key }, ctx) {
      const a: ToolResult = await ctx.callTool('innerA', { key });
      const b: ToolResult = await ctx.callTool('innerB', { key });
      return {
        key,
        results: [a.data, b.data],
        allSuccess: a.success && b.success,
      };
    },
  });

  it('should be identified as a composable tool', () => {
    expect(isComposableTool(combinedTool)).toBe(true);
  });

  it('should have correct name and description', () => {
    expect(combinedTool.name).toBe('combined');
    expect(combinedTool.description).toBe('Combines results from innerA and innerB');
  });

  it('should have CUSTOM category', () => {
    expect(combinedTool.category).toBe(ToolCategory.CUSTOM);
  });

  it('should have inputSchema derived from Zod', () => {
    expect(combinedTool.inputSchema).toBeDefined();
    expect(combinedTool.inputSchema?.type).toBe('object');
  });

  it('should throw when execute() is called without context (no-op)', async () => {
    await expect(combinedTool.execute({ key: 'test' })).rejects.toThrow(
      /context is not available/i,
    );
  });

  it('should execute via ToolExecutor with proper context wiring', async () => {
    const registry = ToolRegistry.from([innerToolA, innerToolB, combinedTool]);
    const pm = new PermissionManager(ALLOW_ALL_POLICY);
    const exec = new ToolExecutor(pm, { registry });

    const result = await exec.execute(combinedTool, { key: 'test-key' });
    expect(result.success).toBe(true);

    const data = result.data as { key: string; results: unknown[]; allSuccess: boolean };
    expect(data.key).toBe('test-key');
    expect(data.allSuccess).toBe(true);
    expect(data.results).toHaveLength(2);
  });

  it('should be frozen', () => {
    expect(Object.isFrozen(combinedTool)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ToolRegistry integration
// ---------------------------------------------------------------------------

describe('TASK-092: Custom Tool Integration — ToolRegistry', () => {
  let registry: ToolRegistry;
  const toolA = defineTool({
    name: 'toolA',
    description: 'Tool A',
    schema: z.object({}),
    async execute() { return 'a'; },
  });
  const toolB = createTool({
    name: 'toolB',
    description: 'Tool B',
    async execute() { return 'b'; },
  });

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('should register and retrieve tools by name', () => {
    registry.register(toolA);
    registry.register(toolB);
    expect(registry.get('toolA')).toBe(toolA);
    expect(registry.get('toolB')).toBe(toolB);
  });

  it('should report correct size', () => {
    registry.register(toolA);
    registry.register(toolB);
    expect(registry.size).toBe(2);
  });

  it('should list registered tool names', () => {
    registry.register(toolA);
    registry.register(toolB);
    expect(registry.getNames()).toContain('toolA');
    expect(registry.getNames()).toContain('toolB');
  });

  it('should throw on duplicate registration', () => {
    registry.register(toolA);
    expect(() => registry.register(toolA)).toThrow(/already registered/);
  });

  it('should create from array with ToolRegistry.from()', () => {
    const r = ToolRegistry.from([toolA, toolB]);
    expect(r.size).toBe(2);
    expect(r.has('toolA')).toBe(true);
    expect(r.has('toolB')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ToolExecutor with events
// ---------------------------------------------------------------------------

describe('TASK-092: Custom Tool Integration — ToolExecutor Events', () => {
  const simpleTool = defineTool({
    name: 'simple',
    description: 'A simple tool',
    schema: z.object({ value: z.string() }),
    async execute({ value }) {
      return { echo: value };
    },
  });

  it('should emit start and complete events on execution', async () => {
    const registry = ToolRegistry.from([simpleTool]);
    const pm = new PermissionManager(ALLOW_ALL_POLICY);
    const exec = new ToolExecutor(pm, { registry });

    const startSpy = vi.fn();
    const completeSpy = vi.fn();
    exec.on('tool:execute:start', startSpy);
    exec.on('tool:execute:complete', completeSpy);

    await exec.execute(simpleTool, { value: 'hello' });

    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(startSpy).toHaveBeenCalledWith('simple', { value: 'hello' });
    expect(completeSpy).toHaveBeenCalledTimes(1);
    expect(completeSpy.mock.calls[0]?.[0]).toBe('simple');
  });

  it('should produce a ToolResult with success and data', async () => {
    const registry = ToolRegistry.from([simpleTool]);
    const pm = new PermissionManager(ALLOW_ALL_POLICY);
    const exec = new ToolExecutor(pm, { registry });

    const result = await exec.execute(simpleTool, { value: 'test' });
    expect(result.success).toBe(true);
    expect((result.data as { echo: string }).echo).toBe('test');
    expect(typeof result.duration).toBe('number');
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Agent custom tool registration
// ---------------------------------------------------------------------------

describe('TASK-092: Custom Tool Integration — Agent Tool Registration', () => {
  const customTool1 = defineTool({
    name: 'customOne',
    description: 'Custom tool one',
    category: ToolCategory.CUSTOM,
    schema: z.object({ input: z.string() }),
    async execute({ input }) { return `result: ${input}`; },
  });

  const customTool2 = createTool({
    name: 'customTwo',
    description: 'Custom tool two',
    category: ToolCategory.DATA,
    async execute() { return 'done'; },
  });

  it('should register custom tools via constructor', () => {
    const agent = new Agent({
      id: 'tool-agent',
      role: 'Tool User',
      goal: 'Use custom tools',
      tools: [customTool1, customTool2],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('customOne')).toBe(true);
    expect(agent.hasTool('customTwo')).toBe(true);
    expect(agent.tools.size).toBe(2);
  });

  it('should register custom tools via addTool()', () => {
    const agent = new Agent({
      id: 'add-tool-agent',
      role: 'Tool User',
      goal: 'Use custom tools',
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.tools.size).toBe(0);
    agent.addTool(customTool1);
    expect(agent.tools.size).toBe(1);
    expect(agent.hasTool('customOne')).toBe(true);
  });

  it('should include custom tool descriptions in system prompt', () => {
    const agent = new Agent({
      id: 'prompt-agent',
      role: 'Helper',
      goal: 'Help',
      tools: [customTool1],
      llmProvider: createMockLLMProvider(),
    });

    const systemPrompt = agent.buildSystemPrompt();
    expect(systemPrompt).toContain('customOne');
    expect(systemPrompt).toContain('Custom tool one');
  });
});

// ---------------------------------------------------------------------------
// End-to-end crew with custom tools
// ---------------------------------------------------------------------------

describe('TASK-092: Custom Tool Integration — Crew End-to-End', () => {
  it('should run a crew with agents that have custom tools', async () => {
    const gatherTool = defineTool({
      name: 'gather',
      description: 'Gather data',
      category: ToolCategory.DATA,
      schema: z.object({ source: z.string() }),
      async execute({ source }) {
        return { source, data: [1, 2, 3] };
      },
    });

    const formatTool = createTool({
      name: 'format',
      description: 'Format data into text',
      category: ToolCategory.CUSTOM,
      async execute(input: unknown) {
        return `Formatted: ${JSON.stringify(input)}`;
      },
    });

    const collector = new Agent({
      id: 'collector',
      role: 'Data Collector',
      goal: 'Collect data from sources',
      tools: [gatherTool],
      llmProvider: createMockLLMProvider('Collected data from sensors'),
    });

    const formatter = new Agent({
      id: 'formatter',
      role: 'Report Formatter',
      goal: 'Format collected data',
      tools: [formatTool],
      llmProvider: createMockLLMProvider('Formatted report ready'),
    });

    const crew = new Crew({
      id: 'custom-tools-crew',
      name: 'Custom Tools Crew',
      agents: [collector, formatter],
      tasks: [
        {
          id: 'collect',
          description: 'Collect sensor data',
          agentId: 'collector',
        },
        {
          id: 'format-report',
          description: 'Format the collected data into a report',
          agentId: 'formatter',
          dependencies: ['collect'],
        },
      ],
    });

    const result = await crew.run();

    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(2);
    expect(result.taskResults.has('collect')).toBe(true);
    expect(result.taskResults.has('format-report')).toBe(true);

    const collectResult = result.taskResults.get('collect');
    expect(collectResult?.agentId).toBe('collector');
    expect(collectResult?.output).toBeTruthy();

    const formatResult = result.taskResults.get('format-report');
    expect(formatResult?.agentId).toBe('formatter');
    expect(formatResult?.output).toBeTruthy();
  });

  it('should handle crew events with custom-tool agents', async () => {
    const echoTool = defineTool({
      name: 'echo',
      description: 'Echo input back',
      schema: z.object({ message: z.string() }),
      async execute({ message }) { return message; },
    });

    const agent = new Agent({
      id: 'echo-agent',
      role: 'Echo Service',
      goal: 'Echo messages',
      tools: [echoTool],
      llmProvider: createMockLLMProvider('Echoed message'),
    });

    const crew = new Crew({
      id: 'echo-crew',
      agents: [agent],
      tasks: [{ id: 'echo-task', description: 'Echo hello', agentId: 'echo-agent' }],
    });

    const taskStartSpy = vi.fn();
    const taskCompleteSpy = vi.fn();
    crew.on('crew:task:start', taskStartSpy);
    crew.on('crew:task:complete', taskCompleteSpy);

    await crew.run();

    expect(taskStartSpy).toHaveBeenCalledTimes(1);
    expect(taskCompleteSpy).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Tool validation edge cases
// ---------------------------------------------------------------------------

describe('TASK-092: Custom Tool Integration — Validation', () => {
  it('defineTool should reject empty name', () => {
    expect(() =>
      defineTool({
        name: '',
        description: 'Bad tool',
        schema: z.object({}),
        async execute() { return null; },
      }),
    ).toThrow();
  });

  it('defineTool should reject invalid name characters', () => {
    expect(() =>
      defineTool({
        name: 'has spaces',
        description: 'Bad tool',
        schema: z.object({}),
        async execute() { return null; },
      }),
    ).toThrow();
  });

  it('createTool should reject empty name', () => {
    expect(() =>
      createTool({
        name: '',
        description: 'Bad tool',
        async execute() { return null; },
      }),
    ).toThrow();
  });

  it('composeTool should reject empty name', () => {
    expect(() =>
      composeTool({
        name: '',
        description: 'Bad tool',
        async execute() { return null; },
      }),
    ).toThrow();
  });

  it('defineTool should reject non-function execute', () => {
    expect(() =>
      defineTool({
        name: 'badExec',
        description: 'Bad tool',
        schema: z.object({}),
        execute: 'not-a-function' as unknown as () => Promise<unknown>,
      }),
    ).toThrow(/execute must be a function/);
  });
});
