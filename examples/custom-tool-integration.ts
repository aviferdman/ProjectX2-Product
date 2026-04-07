/**
 * Crewspace — Custom Tool Integration Example
 *
 * This example demonstrates how to create and integrate custom tools with
 * Crewspace agents. It covers all three tool-creation approaches:
 *
 *   1. **defineTool** — Type-safe tools with Zod schema validation
 *   2. **createTool** — Flexible tools with JSON Schema or Zod
 *   3. **composeTool** — Tools that invoke other tools via ToolContext
 *
 * The example builds a "DevOps Helper" crew with two agents:
 *   - **Inspector** — uses custom tools to gather system metrics
 *   - **Reporter** — uses a composed tool to aggregate and format a report
 *
 * Key concepts:
 *   - Creating tools with `defineTool` (Zod schema → typed execute)
 *   - Creating tools with `createTool` (JSON Schema + manual typing)
 *   - Creating composed tools with `composeTool` (tool-calling-tools)
 *   - Using ToolCategory and ToolPermission for classification
 *   - Registering custom tools on agents via constructor and addTool()
 *   - Using ToolRegistry and ToolExecutor for standalone execution
 *   - Subscribing to tool lifecycle events
 *
 * Prerequisites:
 *   npm install @crewspace/core
 *
 * Usage:
 *   npx tsx examples/custom-tool-integration.ts
 *
 * Note: This example uses a mock LLM provider for demonstration purposes.
 * Replace it with a real provider (OpenAI, Anthropic, Ollama) for production use.
 */

import {
  Agent,
  Crew,
  createTool,
  defineTool,
  composeTool,
  ToolRegistry,
  ToolExecutor,
  PermissionManager,
  ALLOW_ALL_POLICY,
  ToolCategory,
  ToolPermission,
} from '@crewspace/core';
import type { LLMProvider, LLMMessage, LLMResponse, Tool, ToolResult } from '@crewspace/core';
import { z } from 'zod';

// -- Mock LLM provider (replace with createOpenAIProvider() for real use) ----

function createMockProvider(name: string): LLMProvider {
  return {
    name,
    async generateText(_messages: readonly LLMMessage[]): Promise<LLMResponse> {
      return {
        content: `[${name}] Processed with custom tools.`,
        tokenUsage: { promptTokens: 15, completionTokens: 25, totalTokens: 40 },
        finishReason: 'stop',
      };
    },
  };
}

// ============================================================================
// 1. defineTool — Type-safe tool with Zod schema
// ============================================================================

/**
 * A tool that checks the "health" of a service by name.
 * Uses `defineTool` for full Zod-powered type safety.
 */
const healthCheckTool = defineTool({
  name: 'healthCheck',
  description: 'Check the health status of a named service',
  category: ToolCategory.CUSTOM,
  permissions: [ToolPermission.NETWORK],
  schema: z.object({
    service: z.string().describe('Name of the service to check'),
    timeout: z.number().optional().describe('Timeout in milliseconds'),
  }),
  async execute({ service, timeout }) {
    // In production, this would make an HTTP call to the service
    const latency = Math.floor(Math.random() * 200) + 10;
    const isHealthy = latency < (timeout ?? 1000);
    return {
      service,
      status: isHealthy ? 'healthy' : 'degraded',
      latencyMs: latency,
      checkedAt: new Date().toISOString(),
    };
  },
});

// ============================================================================
// 2. createTool — Flexible tool with JSON Schema
// ============================================================================

/**
 * A tool that returns disk usage metrics for a given path.
 * Uses `createTool` with a manual JSON Schema definition.
 */
const diskUsageTool = createTool({
  name: 'diskUsage',
  description: 'Get disk usage statistics for a given path',
  category: ToolCategory.DATA,
  permissions: [ToolPermission.FILE_READ],
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File system path to check' },
    },
    required: ['path'],
  },
  async execute(input: unknown) {
    const { path } = input as { path: string };
    // Simulated disk usage data
    return {
      path,
      totalGb: 500,
      usedGb: 342,
      freeGb: 158,
      usagePercent: 68.4,
    };
  },
});

/**
 * A tool that retrieves CPU and memory metrics.
 * Uses `createTool` with a Zod schema via inputZodSchema.
 */
const systemMetricsTool = createTool({
  name: 'systemMetrics',
  description: 'Retrieve current CPU and memory usage metrics',
  category: ToolCategory.DATA,
  inputZodSchema: z.object({
    host: z.string().describe('Hostname or IP address'),
  }),
  async execute(input: unknown) {
    const { host } = input as { host: string };
    return {
      host,
      cpuPercent: 45.2,
      memoryUsedMb: 8192,
      memoryTotalMb: 16384,
      memoryPercent: 50.0,
      uptimeHours: 720,
    };
  },
});

// ============================================================================
// 3. composeTool — Tool that calls other tools
// ============================================================================

/**
 * A composed tool that runs a full infrastructure audit by calling
 * healthCheck, diskUsage, and systemMetrics in sequence.
 *
 * Uses `composeTool` so the execute callback receives a ToolContext
 * enabling it to invoke other registered tools.
 */
const infraAuditTool = composeTool({
  name: 'infraAudit',
  description: 'Run a full infrastructure audit combining health, disk, and system checks',
  category: ToolCategory.CUSTOM,
  permissions: [ToolPermission.NETWORK, ToolPermission.FILE_READ],
  schema: z.object({
    service: z.string().describe('Service name to audit'),
    host: z.string().describe('Host to check metrics on'),
    diskPath: z.string().describe('Disk path to check usage'),
  }),
  async execute({ service, host, diskPath }, ctx) {
    // Call other tools through the context
    const healthResult: ToolResult = await ctx.callTool('healthCheck', { service });
    const diskResult: ToolResult = await ctx.callTool('diskUsage', { path: diskPath });
    const metricsResult: ToolResult = await ctx.callTool('systemMetrics', { host });

    return {
      service,
      host,
      health: healthResult.data,
      disk: diskResult.data,
      system: metricsResult.data,
      auditedAt: new Date().toISOString(),
      overallStatus:
        healthResult.success && diskResult.success && metricsResult.success ? 'pass' : 'fail',
    };
  },
});

// ============================================================================
// 4. Standalone tool execution with ToolRegistry + ToolExecutor
// ============================================================================

console.log('=== Crewspace Custom Tool Integration ===\n');
console.log('--- Part 1: Standalone Tool Execution ---\n');

// Register tools in a registry
const registry = new ToolRegistry();
registry.register(healthCheckTool);
registry.register(diskUsageTool);
registry.register(systemMetricsTool);
registry.register(infraAuditTool);

console.log(`Registered tools: ${registry.getNames().join(', ')}`);
console.log(`Total tools: ${String(registry.size)}`);

// Create an executor with an allow-all permission policy
const permissionManager = new PermissionManager(ALLOW_ALL_POLICY);
const executor = new ToolExecutor(permissionManager, { registry });

// Listen to tool execution events
executor.on('tool:execute:start', (toolName, _input) => {
  console.log(`  ▶ Executing tool: ${toolName}`);
});

executor.on('tool:execute:complete', (toolName, result) => {
  console.log(`  ✓ Tool "${toolName}" completed (${String(result.duration)}ms)`);
});

// Execute individual tools
console.log('\n1. Health check (defineTool):');
const healthResult = await executor.execute(healthCheckTool, {
  service: 'api-gateway',
  timeout: 500,
});
console.log(`   Status: ${String((healthResult.data as Record<string, unknown>)?.['status'])}`);

console.log('\n2. Disk usage (createTool):');
const diskResult = await executor.execute(diskUsageTool, { path: '/var/data' });
console.log(`   Usage: ${String((diskResult.data as Record<string, unknown>)?.['usagePercent'])}%`);

console.log('\n3. System metrics (createTool + Zod):');
const metricsResult = await executor.execute(systemMetricsTool, { host: 'web-server-01' });
console.log(`   CPU: ${String((metricsResult.data as Record<string, unknown>)?.['cpuPercent'])}%`);

console.log('\n4. Infrastructure audit (composeTool):');
const auditResult = await executor.execute(infraAuditTool, {
  service: 'api-gateway',
  host: 'web-server-01',
  diskPath: '/var/data',
});
console.log(
  `   Overall: ${String((auditResult.data as Record<string, unknown>)?.['overallStatus'])}`,
);

// ============================================================================
// 5. Agent integration — custom tools in a Crew
// ============================================================================

console.log('\n--- Part 2: Agent Integration ---\n');

// Inspector agent uses health check, disk usage, and system metrics tools
const inspector = new Agent({
  id: 'inspector',
  role: 'Infrastructure Inspector',
  goal: 'Gather system health, disk, and performance metrics',
  backstory:
    'You are a meticulous DevOps engineer who checks every metric before ' +
    'declaring a system healthy. You use specialized monitoring tools.',
  tools: [healthCheckTool, diskUsageTool, systemMetricsTool],
  llmProvider: createMockProvider('inspector-llm'),
});

// Reporter agent uses the composed infraAudit tool for full reports
const reporter = new Agent({
  id: 'reporter',
  role: 'DevOps Report Writer',
  goal: 'Compile infrastructure metrics into clear status reports',
  backstory:
    'You produce concise, actionable infrastructure reports that help ' +
    'teams make informed decisions about system health.',
  tools: [infraAuditTool],
  llmProvider: createMockProvider('reporter-llm'),
});

// Verify tool registrations
console.log(`Inspector tools: [${Array.from(inspector.tools.keys()).join(', ')}]`);
console.log(`Reporter tools: [${Array.from(reporter.tools.keys()).join(', ')}]`);

// Build and run a crew
const devopsCrew = new Crew({
  id: 'devops-crew',
  name: 'DevOps Helper Crew',
  agents: [inspector, reporter],
  tasks: [
    {
      id: 'inspect',
      description:
        'Check the health of api-gateway, disk usage on /var/data, and ' +
        'system metrics on web-server-01.',
      agentId: 'inspector',
      expectedOutput: 'Individual health, disk, and system metric results',
    },
    {
      id: 'report',
      description:
        'Run a full infrastructure audit and compile the results into ' +
        'a status report with recommendations.',
      agentId: 'reporter',
      dependencies: ['inspect'],
      expectedOutput: 'A formatted infrastructure status report',
    },
  ],
});

// Subscribe to crew events
devopsCrew.on('crew:start', (crewId) => {
  console.log(`\n🚀 Crew "${crewId}" started`);
});

devopsCrew.on('crew:task:start', (_crewId, taskId, agentId) => {
  console.log(`▶ Task "${taskId}" → agent "${agentId}"`);
});

devopsCrew.on('crew:task:complete', (_crewId, taskId, result) => {
  console.log(`✓ Task "${taskId}" completed (${String(result.duration)}ms)`);
});

devopsCrew.on('crew:complete', (_crewId, runResult) => {
  console.log(`🏁 Crew finished in ${String(runResult.duration)}ms`);
});

// Run the crew
const crewResult = await devopsCrew.run();

// Display results
console.log('\n=== Crew Results ===');
console.log(`Success: ${String(crewResult.success)}`);
console.log(`Tasks: ${String(crewResult.taskResults.size)}`);

for (const [taskId, taskResult] of crewResult.taskResults) {
  console.log(`\n--- ${taskId} (agent: ${String(taskResult.agentId)}) ---`);
  console.log(`Output: ${taskResult.output.slice(0, 120)}`);
}

// ============================================================================
// 6. Summary — tool categories and permissions
// ============================================================================

console.log('\n=== Tool Summary ===');
const allTools: Tool[] = [healthCheckTool, diskUsageTool, systemMetricsTool, infraAuditTool];
for (const t of allTools) {
  const perms = t.permissions?.join(', ') ?? 'none';
  console.log(`${t.name}: category=${String(t.category)}, permissions=[${perms}]`);
}

console.log('\n=== Custom Tool Integration Complete ===');
