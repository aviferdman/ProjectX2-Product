/**
 * Tests for the MockLLMResponseSystem.
 *
 * TASK-078 — Validates pattern-based routing, conversation history tracking,
 * error simulation, latency modelling, and call-limit features.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from 'vitest';

import { LLMRole } from '../../src/types/llm.js';
import type { LLMMessage, LLMResponse } from '../../src/types/llm.js';
import { DEFAULT_MOCK_TOKEN_USAGE, MockLLMResponseSystem } from '../../src/testing/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function userMsg(content: string): LLMMessage {
  return { role: LLMRole.USER, content };
}

function systemMsg(content: string): LLMMessage {
  return { role: LLMRole.SYSTEM, content };
}

// ===========================================================================
// Construction & defaults
// ===========================================================================

describe('MockLLMResponseSystem', () => {
  describe('constructor & defaults', () => {
    it('should create with default config', () => {
      const system = new MockLLMResponseSystem();
      expect(system.callCount).toBe(0);
      expect(system.ruleCount).toBe(0);
      expect(system.callHistory).toEqual([]);
    });

    it('should return default response when no rules match', async () => {
      const system = new MockLLMResponseSystem();
      const provider = system.toProvider();

      const response = await provider.generateText([userMsg('hello')]);
      expect(response.content).toBe('Mock LLM response');
      expect(response.tokenUsage).toEqual(DEFAULT_MOCK_TOKEN_USAGE);
      expect(response.finishReason).toBe('stop');
    });

    it('should use custom default content from config', async () => {
      const system = new MockLLMResponseSystem({ defaultContent: 'Custom default' });
      const provider = system.toProvider();

      const response = await provider.generateText([userMsg('anything')]);
      expect(response.content).toBe('Custom default');
    });

    it('should use custom default token usage from config', async () => {
      const tokenUsage = { promptTokens: 5, completionTokens: 10, totalTokens: 15 };
      const system = new MockLLMResponseSystem({ defaultTokenUsage: tokenUsage });
      const provider = system.toProvider();

      const response = await provider.generateText([userMsg('anything')]);
      expect(response.tokenUsage).toEqual(tokenUsage);
    });

    it('should use custom default finish reason from config', async () => {
      const system = new MockLLMResponseSystem({ defaultFinishReason: 'length' });
      const provider = system.toProvider();

      const response = await provider.generateText([userMsg('anything')]);
      expect(response.finishReason).toBe('length');
    });

    it('should use custom provider name', () => {
      const system = new MockLLMResponseSystem({ name: 'my-mock' });
      expect(system.toProvider().name).toBe('my-mock');
    });
  });

  // =========================================================================
  // Pattern-based routing
  // =========================================================================

  describe('pattern-based routing', () => {
    it('should match rules using RegExp', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: /research/i, response: 'Found papers' });

      const provider = system.toProvider();
      const response = await provider.generateText([userMsg('Please do some Research')]);
      expect(response.content).toBe('Found papers');
    });

    it('should match rules using string (case-insensitive substring)', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: 'summarize', response: 'Summary: key points' });

      const provider = system.toProvider();
      const response = await provider.generateText([userMsg('Please SUMMARIZE this')]);
      expect(response.content).toBe('Summary: key points');
    });

    it('should match rules using custom predicate', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({
        match: (messages) => messages.length > 2,
        response: 'Long conversation detected',
      });

      const provider = system.toProvider();

      // Short conversation — should fall through to default
      const r1 = await provider.generateText([userMsg('hi')]);
      expect(r1.content).toBe('Mock LLM response');

      // Longer conversation — should match
      const r2 = await provider.generateText([
        systemMsg('Be helpful'),
        userMsg('hello'),
        userMsg('how are you'),
      ]);
      expect(r2.content).toBe('Long conversation detected');
    });

    it('should evaluate rules in insertion order (first match wins)', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: /hello/i, response: 'Rule 1 matched' });
      system.addRule({ match: /hello/i, response: 'Rule 2 matched' });

      const provider = system.toProvider();
      const response = await provider.generateText([userMsg('hello')]);
      expect(response.content).toBe('Rule 1 matched');
    });

    it('should fall through to default when no rule matches', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: /research/i, response: 'Research result' });

      const provider = system.toProvider();
      const response = await provider.generateText([userMsg('something else')]);
      expect(response.content).toBe('Mock LLM response');
    });

    it('should match against the last user message', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: /final question/i, response: 'Answer to final' });

      const provider = system.toProvider();
      const response = await provider.generateText([
        systemMsg('You are a helper'),
        userMsg('first question'),
        userMsg('final question'),
      ]);
      expect(response.content).toBe('Answer to final');
    });

    it('should support dynamic response handlers', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({
        match: /count/i,
        response: (messages) => `You sent ${String(messages.length)} messages`,
      });

      const provider = system.toProvider();
      const response = await provider.generateText([systemMsg('Be a counter'), userMsg('count')]);
      expect(response.content).toBe('You sent 2 messages');
    });

    it('should support fullResponse override', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({
        match: 'full',
        fullResponse: {
          content: 'Full override',
          tokenUsage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 },
          finishReason: 'length',
        },
      });

      const provider = system.toProvider();
      const response = await provider.generateText([userMsg('full response test')]);
      expect(response.content).toBe('Full override');
      expect(response.tokenUsage.totalTokens).toBe(3);
      expect(response.finishReason).toBe('length');
    });

    it('should support dynamic fullResponse handler', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({
        match: 'dynamic-full',
        fullResponse: (msgs) => ({
          content: `Dynamic: ${msgs.length} messages`,
          tokenUsage: {
            promptTokens: msgs.length,
            completionTokens: 1,
            totalTokens: msgs.length + 1,
          },
          finishReason: 'stop',
        }),
      });

      const provider = system.toProvider();
      const response = await provider.generateText([
        systemMsg('sys'),
        userMsg('dynamic-full test'),
      ]);
      expect(response.content).toBe('Dynamic: 2 messages');
      expect(response.tokenUsage.promptTokens).toBe(2);
    });

    it('should support per-rule tokenUsage and finishReason', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({
        match: 'special',
        response: 'Special response',
        tokenUsage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 },
        finishReason: 'length',
      });

      const provider = system.toProvider();
      const response = await provider.generateText([userMsg('special query')]);
      expect(response.tokenUsage.totalTokens).toBe(150);
      expect(response.finishReason).toBe('length');
    });
  });

  // =========================================================================
  // Error simulation
  // =========================================================================

  describe('error simulation', () => {
    it('should throw a static error for a rule', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: /fail/i, error: new Error('LLM failure') });

      const provider = system.toProvider();
      await expect(provider.generateText([userMsg('please fail')])).rejects.toThrow('LLM failure');
    });

    it('should throw a dynamic error from a factory function', async () => {
      let callCount = 0;
      const system = new MockLLMResponseSystem();
      system.addRule({
        match: /error/i,
        error: () => {
          callCount++;
          return new Error(`Error #${callCount}`);
        },
      });

      const provider = system.toProvider();
      await expect(provider.generateText([userMsg('error')])).rejects.toThrow('Error #1');
      await expect(provider.generateText([userMsg('error')])).rejects.toThrow('Error #2');
    });

    it('should record errors in call history', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: /boom/i, error: new Error('Boom!') });

      const provider = system.toProvider();
      try {
        await provider.generateText([userMsg('boom')]);
      } catch {
        // expected
      }

      expect(system.callCount).toBe(1);
      expect(system.callHistory[0].error?.message).toBe('Boom!');
      expect(system.callHistory[0].response).toBeUndefined();
    });

    it('should throw in strict mode when no rule matches', async () => {
      const system = new MockLLMResponseSystem({ strictMode: true });
      system.addRule({ match: /^specific$/i, response: 'Specific' });

      const provider = system.toProvider();
      await expect(provider.generateText([userMsg('unrelated query')])).rejects.toThrow(
        'No matching rule',
      );
    });

    it('should not throw in non-strict mode for unmatched queries', async () => {
      const system = new MockLLMResponseSystem({ strictMode: false });
      system.addRule({ match: /^specific$/i, response: 'Specific' });

      const provider = system.toProvider();
      const response = await provider.generateText([userMsg('unrelated query')]);
      expect(response.content).toBe('Mock LLM response');
    });
  });

  // =========================================================================
  // Call history & inspection
  // =========================================================================

  describe('call history & inspection', () => {
    it('should track call count', async () => {
      const system = new MockLLMResponseSystem();
      const provider = system.toProvider();

      await provider.generateText([userMsg('first')]);
      await provider.generateText([userMsg('second')]);
      await provider.generateText([userMsg('third')]);

      expect(system.callCount).toBe(3);
    });

    it('should record messages in call history', async () => {
      const system = new MockLLMResponseSystem();
      const provider = system.toProvider();

      const messages = [systemMsg('Be helpful'), userMsg('hello')];
      await provider.generateText(messages);

      expect(system.callHistory).toHaveLength(1);
      expect(system.callHistory[0].messages).toEqual(messages);
    });

    it('should record responses in call history', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: 'hello', response: 'Hi there!' });
      const provider = system.toProvider();

      await provider.generateText([userMsg('hello')]);

      expect(system.callHistory[0].response?.content).toBe('Hi there!');
    });

    it('should record timestamps and duration', async () => {
      const system = new MockLLMResponseSystem();
      const provider = system.toProvider();

      const before = Date.now();
      await provider.generateText([userMsg('hello')]);

      const call = system.callHistory[0];
      expect(call.timestamp).toBeGreaterThanOrEqual(before);
      expect(call.duration).toBeGreaterThanOrEqual(0);
    });

    it('should support getCallMessages helper', async () => {
      const system = new MockLLMResponseSystem();
      const provider = system.toProvider();

      await provider.generateText([userMsg('first')]);
      await provider.generateText([userMsg('second')]);

      expect(system.getCallMessages(0)?.[0].content).toBe('first');
      expect(system.getCallMessages(1)?.[0].content).toBe('second');
      expect(system.getCallMessages(99)).toBeUndefined();
    });

    it('should support getCallResponse helper', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: 'hello', response: 'Hi!' });
      const provider = system.toProvider();

      await provider.generateText([userMsg('hello')]);

      expect(system.getCallResponse(0)?.content).toBe('Hi!');
      expect(system.getCallResponse(99)).toBeUndefined();
    });

    it('should support wasCalledWithContent (string)', async () => {
      const system = new MockLLMResponseSystem();
      const provider = system.toProvider();

      await provider.generateText([userMsg('find research papers')]);

      expect(system.wasCalledWithContent('research')).toBe(true);
      expect(system.wasCalledWithContent('nonexistent')).toBe(false);
    });

    it('should support wasCalledWithContent (RegExp)', async () => {
      const system = new MockLLMResponseSystem();
      const provider = system.toProvider();

      await provider.generateText([userMsg('Analyze data set #42')]);

      expect(system.wasCalledWithContent(/data set #\d+/)).toBe(true);
      expect(system.wasCalledWithContent(/nonexistent/)).toBe(false);
    });
  });

  // =========================================================================
  // Call limits (maxMatches)
  // =========================================================================

  describe('call limits (maxMatches)', () => {
    it('should exhaust a rule after maxMatches', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: /hello/i, response: 'First rule', maxMatches: 2 });
      system.addRule({ match: /hello/i, response: 'Second rule' });

      const provider = system.toProvider();

      const r1 = await provider.generateText([userMsg('hello')]);
      expect(r1.content).toBe('First rule');

      const r2 = await provider.generateText([userMsg('hello')]);
      expect(r2.content).toBe('First rule');

      // First rule exhausted, falls through to second
      const r3 = await provider.generateText([userMsg('hello')]);
      expect(r3.content).toBe('Second rule');
    });

    it('should fall to default when all rules exhausted', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: /hello/i, response: 'Only once', maxMatches: 1 });

      const provider = system.toProvider();

      const r1 = await provider.generateText([userMsg('hello')]);
      expect(r1.content).toBe('Only once');

      const r2 = await provider.generateText([userMsg('hello')]);
      expect(r2.content).toBe('Mock LLM response');
    });
  });

  // =========================================================================
  // Latency simulation
  // =========================================================================

  describe('latency simulation', () => {
    it('should apply global latency', async () => {
      const system = new MockLLMResponseSystem({ latency: [20, 30] });
      const provider = system.toProvider();

      const start = Date.now();
      await provider.generateText([userMsg('hello')]);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(15); // allow some slack
    });

    it('should apply latency set via setLatency', async () => {
      const system = new MockLLMResponseSystem();
      system.setLatency(20, 30);
      const provider = system.toProvider();

      const start = Date.now();
      await provider.generateText([userMsg('hello')]);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(15);
    });

    it('should apply per-rule latency override', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: /slow/i, response: 'Slow response', latency: [30, 40] });
      system.addRule({ match: /fast/i, response: 'Fast response', latency: [0, 0] });

      const provider = system.toProvider();

      const startSlow = Date.now();
      await provider.generateText([userMsg('slow query')]);
      const slowElapsed = Date.now() - startSlow;

      const startFast = Date.now();
      await provider.generateText([userMsg('fast query')]);
      const fastElapsed = Date.now() - startFast;

      expect(slowElapsed).toBeGreaterThanOrEqual(25);
      expect(fastElapsed).toBeLessThan(20);
    });

    it('should record duration in call history', async () => {
      const system = new MockLLMResponseSystem({ latency: [10, 20] });
      const provider = system.toProvider();

      await provider.generateText([userMsg('hello')]);

      expect(system.callHistory[0].duration).toBeGreaterThanOrEqual(5);
    });
  });

  // =========================================================================
  // State management
  // =========================================================================

  describe('state management', () => {
    it('should clearHistory', async () => {
      const system = new MockLLMResponseSystem();
      const provider = system.toProvider();

      await provider.generateText([userMsg('hello')]);
      expect(system.callCount).toBe(1);

      system.clearHistory();
      expect(system.callCount).toBe(0);
      expect(system.callHistory).toEqual([]);
    });

    it('should resetRuleCounters', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: /hello/i, response: 'Once', maxMatches: 1 });
      const provider = system.toProvider();

      // Use up the rule
      const r1 = await provider.generateText([userMsg('hello')]);
      expect(r1.content).toBe('Once');

      const r2 = await provider.generateText([userMsg('hello')]);
      expect(r2.content).toBe('Mock LLM response'); // exhausted

      // Reset counters
      system.resetRuleCounters();

      const r3 = await provider.generateText([userMsg('hello')]);
      expect(r3.content).toBe('Once'); // rule active again
    });

    it('should clearRules', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: /hello/i, response: 'Custom' });
      expect(system.ruleCount).toBe(1);

      system.clearRules();
      expect(system.ruleCount).toBe(0);

      const provider = system.toProvider();
      const response = await provider.generateText([userMsg('hello')]);
      expect(response.content).toBe('Mock LLM response'); // falls to default
    });

    it('should reset everything', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: /hello/i, response: 'Custom' });
      const provider = system.toProvider();

      await provider.generateText([userMsg('hello')]);
      expect(system.callCount).toBe(1);
      expect(system.ruleCount).toBe(1);

      system.reset();
      expect(system.callCount).toBe(0);
      expect(system.ruleCount).toBe(0);
    });

    it('should setDefaultResponse', async () => {
      const system = new MockLLMResponseSystem();
      system.setDefaultResponse('New default');
      const provider = system.toProvider();

      const response = await provider.generateText([userMsg('anything')]);
      expect(response.content).toBe('New default');
    });

    it('should setStrictMode', async () => {
      const system = new MockLLMResponseSystem();
      const provider = system.toProvider();

      // Non-strict by default
      const r1 = await provider.generateText([userMsg('anything')]);
      expect(r1.content).toBe('Mock LLM response');

      // Enable strict mode
      system.setStrictMode(true);
      await expect(provider.generateText([userMsg('anything')])).rejects.toThrow(
        'No matching rule',
      );
    });
  });

  // =========================================================================
  // Provider caching
  // =========================================================================

  describe('provider caching', () => {
    it('should return the same provider instance on repeated toProvider calls', () => {
      const system = new MockLLMResponseSystem();
      const p1 = system.toProvider();
      const p2 = system.toProvider();
      expect(p1).toBe(p2);
    });

    it('should return a new provider after reset', () => {
      const system = new MockLLMResponseSystem();
      const p1 = system.toProvider();
      system.reset();
      const p2 = system.toProvider();
      expect(p1).not.toBe(p2);
    });
  });

  // =========================================================================
  // Fluent API (method chaining)
  // =========================================================================

  describe('fluent API', () => {
    it('should support method chaining', async () => {
      const system = new MockLLMResponseSystem();
      const provider = system
        .addRule({ match: /test/i, response: 'Test response' })
        .setDefaultResponse('Fallback')
        .setLatency(0, 0)
        .setStrictMode(false)
        .toProvider();

      const response = await provider.generateText([userMsg('test')]);
      expect(response.content).toBe('Test response');
    });
  });

  // =========================================================================
  // Integration: multi-rule routing
  // =========================================================================

  describe('integration: multi-rule routing', () => {
    it('should route different queries to different responses', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: /research/i, response: 'Found 3 papers on AI' });
      system.addRule({ match: /summarize/i, response: 'Summary: key findings are...' });
      system.addRule({ match: /translate/i, response: 'Translated: Bonjour le monde' });
      system.setDefaultResponse("I don't understand");

      const provider = system.toProvider();

      const r1 = await provider.generateText([userMsg('Please research AI agents')]);
      expect(r1.content).toBe('Found 3 papers on AI');

      const r2 = await provider.generateText([userMsg('Summarize the findings')]);
      expect(r2.content).toBe('Summary: key findings are...');

      const r3 = await provider.generateText([userMsg('Translate hello world to French')]);
      expect(r3.content).toBe('Translated: Bonjour le monde');

      const r4 = await provider.generateText([userMsg('Something random')]);
      expect(r4.content).toBe("I don't understand");

      expect(system.callCount).toBe(4);
    });

    it('should support mixed error and success rules', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ match: /good/i, response: 'Success!' });
      system.addRule({ match: /bad/i, error: new Error('Server error') });

      const provider = system.toProvider();

      const r1 = await provider.generateText([userMsg('good query')]);
      expect(r1.content).toBe('Success!');

      await expect(provider.generateText([userMsg('bad query')])).rejects.toThrow('Server error');

      expect(system.callCount).toBe(2);
      expect(system.callHistory[0].error).toBeUndefined();
      expect(system.callHistory[1].error?.message).toBe('Server error');
    });

    it('should simulate intermittent failures with maxMatches', async () => {
      const system = new MockLLMResponseSystem();
      // First call fails, subsequent succeed
      system.addRule({ match: /query/i, error: new Error('Rate limit'), maxMatches: 1 });
      system.addRule({ match: /query/i, response: 'Success after retry' });

      const provider = system.toProvider();

      await expect(provider.generateText([userMsg('query')])).rejects.toThrow('Rate limit');

      const r2 = await provider.generateText([userMsg('query')]);
      expect(r2.content).toBe('Success after retry');
    });
  });

  // =========================================================================
  // Edge cases
  // =========================================================================

  describe('edge cases', () => {
    it('should handle empty messages array', async () => {
      const system = new MockLLMResponseSystem();
      const provider = system.toProvider();

      const response = await provider.generateText([]);
      expect(response.content).toBe('Mock LLM response');
    });

    it('should handle messages with no user role', async () => {
      const system = new MockLLMResponseSystem();
      // When there are no user messages, matching falls back to the last message content
      system.addRule({ match: /^exact-user-only$/i, response: 'Matched' });

      const provider = system.toProvider();
      const response = await provider.generateText([systemMsg('just a system message')]);
      // Falls through because content doesn't match
      expect(response.content).toBe('Mock LLM response');
    });

    it('should record options in call history', async () => {
      const system = new MockLLMResponseSystem();
      const provider = system.toProvider();

      await provider.generateText([userMsg('hello')], {
        temperature: 0.7,
        maxTokens: 100,
      });

      expect(system.callHistory[0].options).toEqual({
        temperature: 0.7,
        maxTokens: 100,
      });
    });

    it('should handle rule with no response (uses default content)', async () => {
      const system = new MockLLMResponseSystem({ defaultContent: 'Default!' });
      system.addRule({ match: /hello/i, finishReason: 'length' });

      const provider = system.toProvider();
      const response = await provider.generateText([userMsg('hello')]);
      expect(response.content).toBe('Default!');
      expect(response.finishReason).toBe('length');
    });

    it('should support async dynamic response handlers', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({
        match: /async/i,
        response: async () => {
          await new Promise<void>((r) => setTimeout(r, 5));
          return 'Async response';
        },
      });

      const provider = system.toProvider();
      const response = await provider.generateText([userMsg('async test')]);
      expect(response.content).toBe('Async response');
    });

    it('should handle rule labels (no functional impact, for debugging)', async () => {
      const system = new MockLLMResponseSystem();
      system.addRule({ label: 'research-rule', match: /research/i, response: 'Papers found' });

      const provider = system.toProvider();
      const response = await provider.generateText([userMsg('research')]);
      expect(response.content).toBe('Papers found');
    });
  });
});
