/**
 * Crewspace — Memory and Learning Example
 *
 * This example demonstrates how to use Crewspace's memory system to build
 * agents that remember past interactions, learn from context, and share
 * knowledge across scopes. It showcases:
 *
 *   1. **ShortTermMemory** — In-memory storage with retention policies
 *   2. **MemoryManager** — Coordinating multiple memory providers
 *   3. **ScopedMemory** — Namespace-aware memory with visibility hierarchies
 *   4. **MemorySearchBuilder** — Fluent query API for searching memory
 *   5. **Memory events** — Observing add, evict, delete, and clear events
 *   6. **Agent with memory** — An agent that stores and recalls conversation context
 *
 * The example builds a "Learning Assistant" that:
 *   - Stores user interactions in short-term memory
 *   - Uses scoped memory to isolate agent-level and crew-level knowledge
 *   - Searches past interactions to provide contextual responses
 *   - Demonstrates retention policies that evict old entries automatically
 *
 * Key concepts:
 *   - Creating and configuring ShortTermMemory with retention policies
 *   - Using createMemoryEntry for type-safe entry creation
 *   - MemoryManager with multiple providers
 *   - ScopedMemory for namespace isolation (AGENT → CREW → GLOBAL)
 *   - MemorySearchBuilder for fluent querying and text search
 *   - Memory lifecycle events (memory:add, memory:evict, memory:clear)
 *   - Integrating memory with Agent for context-aware responses
 *
 * Prerequisites:
 *   npm install @crewspace/core
 *
 * Usage:
 *   npx tsx examples/memory-and-learning.ts
 *
 * Note: This example uses a mock LLM provider for demonstration purposes.
 * Replace it with a real provider (OpenAI, Anthropic, Ollama) for production use.
 */

import {
  Agent,
  ShortTermMemory,
  MemoryManager,
  ScopedMemory,
  MemorySearchBuilder,
  createMemoryEntry,
} from '@crewspace/core';
import { MemoryNamespace, MemoryRole, LLMRole } from '@crewspace/core';
import type { LLMProvider, LLMMessage, LLMResponse, MemoryEntry } from '@crewspace/core';

// -- Mock LLM provider (replace with createOpenAIProvider() for real use) ----

function createMemoryAwareMockProvider(
  memoryProvider: ShortTermMemory,
): LLMProvider {
  return {
    name: 'memory-aware-mock',
    async generateText(messages: readonly LLMMessage[]): Promise<LLMResponse> {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === LLMRole.USER);
      const query = (lastUserMessage?.content ?? '').toLowerCase();

      // Search memory for relevant past interactions
      const searchResult = await memoryProvider.search(query, { limit: 3 });
      const hasMemories = searchResult.total > 0;

      let content: string;
      if (query.includes('remember') || query.includes('recall')) {
        if (hasMemories) {
          const recalled = searchResult.entries
            .map((e) => `- ${e.content}`)
            .join('\n');
          content = `I recall the following from our past interactions:\n${recalled}`;
        } else {
          content = "I don't have any relevant memories about that topic yet.";
        }
      } else if (query.includes('teach') || query.includes('learn')) {
        content =
          "I've noted that information. I'll remember it for our future conversations. " +
          'My memory system stores this in short-term memory with automatic retention policies.';
      } else if (query.includes('summary') || query.includes('what do you know')) {
        const totalEntries = await memoryProvider.count();
        content =
          `I currently have ${String(totalEntries)} entries in my memory. ` +
          (hasMemories
            ? `Recent relevant topics include: ${searchResult.entries.map((e) => e.content.slice(0, 40)).join('; ')}`
            : 'No entries match your current query.');
      } else {
        content =
          "That's interesting! I'm storing this interaction in memory so I can reference it later.";
      }

      return {
        content,
        tokenUsage: {
          promptTokens: messages.length * 20,
          completionTokens: 30,
          totalTokens: messages.length * 20 + 30,
        },
        finishReason: 'stop',
      };
    },
  };
}

// ============================================================================
// Part 1: ShortTermMemory with Retention Policies
// ============================================================================

console.log('=== Crewspace Memory and Learning Example ===\n');
console.log('--- Part 1: ShortTermMemory with Retention Policies ---\n');

// Create a short-term memory with retention: max 5 entries
const shortTermMemory = new ShortTermMemory({
  defaultNamespace: MemoryNamespace.AGENT,
  retention: {
    maxEntries: 5,
  },
});

// Subscribe to memory events
const eventLog: string[] = [];

shortTermMemory.on('memory:add', (entry: MemoryEntry) => {
  eventLog.push(`add:${entry.id}`);
  console.log(`  📝 Memory added: "${entry.content.slice(0, 50)}..." [${entry.namespace}]`);
});

shortTermMemory.on('memory:evict', (entries: readonly MemoryEntry[]) => {
  eventLog.push(`evict:${String(entries.length)}`);
  console.log(`  🗑️  Evicted ${String(entries.length)} old entries (retention policy)`);
});

shortTermMemory.on('memory:delete', (id: string) => {
  eventLog.push(`delete:${id}`);
  console.log(`  ❌ Memory deleted: ${id}`);
});

shortTermMemory.on('memory:clear', (_ns: MemoryNamespace | undefined, count: number) => {
  eventLog.push(`clear:${String(count)}`);
  console.log(`  🧹 Cleared ${String(count)} entries`);
});

// Add entries using the helper function
console.log('Adding entries to short-term memory:');
const entry1 = await shortTermMemory.add(
  createMemoryEntry('The user prefers TypeScript over JavaScript', MemoryRole.SYSTEM, MemoryNamespace.AGENT, { topic: 'preferences' }),
);
const entry2 = await shortTermMemory.add(
  createMemoryEntry('User asked about building REST APIs with Express', MemoryRole.USER, MemoryNamespace.AGENT, { topic: 'apis' }),
);
const entry3 = await shortTermMemory.add(
  createMemoryEntry('Explained async/await patterns in Node.js', MemoryRole.ASSISTANT, MemoryNamespace.AGENT, { topic: 'patterns' }),
);
const entry4 = await shortTermMemory.add(
  createMemoryEntry('User is working on a microservices architecture', MemoryRole.USER, MemoryNamespace.AGENT, { topic: 'architecture' }),
);
const entry5 = await shortTermMemory.add(
  createMemoryEntry('Discussed database connection pooling strategies', MemoryRole.ASSISTANT, MemoryNamespace.AGENT, { topic: 'database' }),
);

console.log(`\nTotal entries: ${String(await shortTermMemory.count())}`);

// Adding a 6th entry triggers eviction of the oldest (retention: maxEntries=5)
console.log('\nAdding 6th entry (triggers eviction):');
await shortTermMemory.add(
  createMemoryEntry('User wants to learn about Docker containerization', MemoryRole.USER, MemoryNamespace.AGENT, { topic: 'devops' }),
);

console.log(`Total entries after eviction: ${String(await shortTermMemory.count())}`);

// Search memory by text
console.log('\nSearching memory for "database":');
const searchResult = await shortTermMemory.search('database');
for (const entry of searchResult.entries) {
  console.log(`  Found: "${entry.content}" (role: ${entry.role})`);
}
console.log(`  Total matches: ${String(searchResult.total)}`);

// ============================================================================
// Part 2: MemorySearchBuilder — Fluent Query API
// ============================================================================

console.log('\n--- Part 2: MemorySearchBuilder — Fluent Queries ---\n');

// Query only user messages, sorted oldest-first
const userMessages = await new MemorySearchBuilder(shortTermMemory)
  .withRole(MemoryRole.USER)
  .ascending()
  .limit(10)
  .execute();

console.log('User messages (oldest first):');
for (const entry of userMessages.entries) {
  console.log(`  [${entry.role}] ${entry.content}`);
}
console.log(`Total user messages: ${String(userMessages.total)}`);

// Search with filters: assistant messages containing "pattern"
console.log('\nSearching assistant messages for "pattern":');
const assistantSearch = await new MemorySearchBuilder(shortTermMemory)
  .withRole(MemoryRole.ASSISTANT)
  .search('pattern');

for (const entry of assistantSearch.entries) {
  console.log(`  [${entry.role}] ${entry.content}`);
}

// Query with metadata filter
console.log('\nQuerying by metadata (topic=architecture):');
const archEntries = await new MemorySearchBuilder(shortTermMemory)
  .withMetadata({ topic: 'architecture' })
  .execute();

for (const entry of archEntries.entries) {
  console.log(`  [${entry.role}] ${entry.content} (topic: ${String(entry.metadata?.topic)})`);
}

// ============================================================================
// Part 3: ScopedMemory — Namespace Isolation
// ============================================================================

console.log('\n--- Part 3: ScopedMemory — Namespace Isolation ---\n');

// Create a shared memory store
const sharedStore = new ShortTermMemory({
  retention: { maxEntries: 100 },
});

// Create scoped memories for two agents and a crew
const agentAMemory = new ScopedMemory({
  provider: sharedStore,
  namespace: MemoryNamespace.AGENT,
  ownerId: 'agent-alpha',
});

const agentBMemory = new ScopedMemory({
  provider: sharedStore,
  namespace: MemoryNamespace.AGENT,
  ownerId: 'agent-beta',
});

const crewMemory = new ScopedMemory({
  provider: sharedStore,
  namespace: MemoryNamespace.CREW,
  ownerId: 'research-crew',
});

// Agent A stores a finding
const agentAEntry = await agentAMemory.add(
  createMemoryEntry('Found a critical security vulnerability in the auth module', MemoryRole.ASSISTANT, MemoryNamespace.AGENT, { severity: 'high' }),
);
console.log(`Agent Alpha stored: "${agentAEntry.content}"`);

// Agent B stores a different finding
const agentBEntry = await agentBMemory.add(
  createMemoryEntry('Performance benchmarks show 3x improvement after caching', MemoryRole.ASSISTANT, MemoryNamespace.AGENT, { severity: 'info' }),
);
console.log(`Agent Beta stored: "${agentBEntry.content}"`);

// Crew stores shared knowledge
const crewEntry = await crewMemory.add(
  createMemoryEntry('Project deadline is next Friday — prioritize critical items', MemoryRole.SYSTEM, MemoryNamespace.CREW),
);
console.log(`Crew stored: "${crewEntry.content}"`);

// Demonstrate visibility hierarchy:
// - Agent A can see its own entries + crew entries (not Agent B's)
// - Crew can see crew entries only (not agent-level entries)
const agentAVisible = await agentAMemory.query({ limit: 10 });
const agentBVisible = await agentBMemory.query({ limit: 10 });
const crewVisible = await crewMemory.query({ limit: 10 });

console.log(`\nVisibility check:`);
console.log(`  Agent Alpha sees ${String(agentAVisible.total)} entries (own + crew)`);
console.log(`  Agent Beta sees ${String(agentBVisible.total)} entries (own + crew)`);
console.log(`  Crew sees ${String(crewVisible.total)} entries (crew-level only)`);

// Agent A searches for "security" — finds its own entry
const agentASearch = await agentAMemory.search('security');
console.log(`\nAgent Alpha search for "security": ${String(agentASearch.total)} result(s)`);

// Agent B searches for "security" — should NOT find Agent A's entry
const agentBSearch = await agentBMemory.search('security');
console.log(`Agent Beta search for "security": ${String(agentBSearch.total)} result(s)`);

// ============================================================================
// Part 4: MemoryManager — Coordinating Multiple Providers
// ============================================================================

console.log('\n--- Part 4: MemoryManager — Multiple Providers ---\n');

const primaryMemory = new ShortTermMemory({
  defaultNamespace: MemoryNamespace.AGENT,
  retention: { maxEntries: 50 },
});

const backupMemory = new ShortTermMemory({
  defaultNamespace: MemoryNamespace.AGENT,
  retention: { maxEntries: 200 },
});

// Give unique names for the manager
Object.defineProperty(backupMemory, 'name', { value: 'backup-memory' });

const manager = new MemoryManager({
  providers: [primaryMemory, backupMemory],
});

// Track manager events
manager.on('memory:add', (entry: MemoryEntry) => {
  console.log(`  📦 Manager stored: "${entry.content.slice(0, 50)}..."`);
});

// Add through the manager — goes to ALL providers
console.log('Storing through MemoryManager (replicates to all providers):');
await manager.add(
  createMemoryEntry('Important learning: Always validate user input on the server', MemoryRole.SYSTEM, MemoryNamespace.GLOBAL),
);
await manager.add(
  createMemoryEntry('Pattern: Use middleware for cross-cutting concerns', MemoryRole.ASSISTANT, MemoryNamespace.GLOBAL),
);

// Both providers have the entries
const primaryCount = await primaryMemory.count();
const backupCount = await backupMemory.count();
console.log(`\nPrimary memory: ${String(primaryCount)} entries`);
console.log(`Backup memory: ${String(backupCount)} entries`);
console.log(`Manager count (via primary): ${String(await manager.count())}`);

// Search through the manager
console.log('\nSearching via manager for "middleware":');
const managerSearch = await manager.search('middleware');
for (const entry of managerSearch.entries) {
  console.log(`  Found: "${entry.content}"`);
}

// ============================================================================
// Part 5: Agent with Memory Integration
// ============================================================================

console.log('\n--- Part 5: Agent with Memory Integration ---\n');

// Create a memory-backed agent
const agentMemory = new ShortTermMemory({
  retention: { maxEntries: 20 },
});

const learningAgent = new Agent({
  id: 'learning-assistant',
  role: 'Memory-Enhanced Learning Assistant',
  goal: 'Remember past interactions and provide context-aware responses',
  backstory:
    'You are an AI assistant with persistent memory. You store important facts ' +
    'from conversations and recall them when relevant. Your memory system uses ' +
    'namespace scoping and retention policies for efficient knowledge management.',
  llmProvider: createMemoryAwareMockProvider(agentMemory),
});

// Track agent events
learningAgent.on('agent:start', (_agentId, taskInput) => {
  console.log(`\n💬 User: ${taskInput.description}`);
});

learningAgent.on('agent:complete', (_agentId, result) => {
  console.log(`🤖 Assistant: ${result.output}`);
});

// Helper: interact with the agent and store the interaction in memory
async function interact(userMessage: string): Promise<string> {
  // Store the user message in memory
  await agentMemory.add(
    createMemoryEntry(userMessage, MemoryRole.USER, MemoryNamespace.AGENT, { type: 'interaction' }),
  );

  // Execute the agent
  const result = await learningAgent.execute({
    description: userMessage,
    context: { memoryEnabled: true },
  });

  // Store the assistant response in memory
  await agentMemory.add(
    createMemoryEntry(result.output, MemoryRole.ASSISTANT, MemoryNamespace.AGENT, { type: 'interaction' }),
  );

  return result.output;
}

// Simulate a learning conversation
console.log('Starting a learning conversation:');
await interact('Teach me about event-driven architecture');
await interact('Learn: Redis is great for pub/sub messaging');
await interact('What do you remember about architecture?');
await interact('Give me a summary of what you know');

// Show final memory state
const finalCount = await agentMemory.count();
const allEntries = await agentMemory.query({ limit: 50, sortOrder: 'asc' });

console.log('\n=== Final Memory State ===');
console.log(`Total entries in agent memory: ${String(finalCount)}`);
console.log(`\nAll stored entries (oldest first):`);
for (const entry of allEntries.entries) {
  const roleIcon = entry.role === MemoryRole.USER ? '👤' : '🤖';
  console.log(`  ${roleIcon} [${entry.role}] ${entry.content.slice(0, 70)}${entry.content.length > 70 ? '...' : ''}`);
}

// Show event summary
console.log('\n=== Event Log Summary ===');
console.log(`Total memory events captured: ${String(eventLog.length)}`);
const addEvents = eventLog.filter((e) => e.startsWith('add:')).length;
const evictEvents = eventLog.filter((e) => e.startsWith('evict:')).length;
console.log(`  Add events: ${String(addEvents)}`);
console.log(`  Evict events: ${String(evictEvents)}`);

console.log('\n=== Memory and Learning Example Complete ===');
