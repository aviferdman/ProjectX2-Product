/**
 * Advanced mock LLM response system for comprehensive workflow testing.
 *
 * Provides a configurable system that supports pattern-based routing,
 * conversation history tracking, error simulation, and latency modelling.
 *
 * @example
 * ```typescript
 * const system = new MockLLMResponseSystem();
 * system.addRule({ pattern: /research/i, content: 'Found 3 papers' });
 * system.addRule({ pattern: /summarize/i, content: 'Summary: ...' });
 * system.setDefaultResponse('Generic response');
 * system.setLatency(10, 50);
 *
 * const provider = system.toProvider();
 * const agent = new Agent({ id: 'a', role: 'R', goal: 'G', llmProvider: provider });
 * ```
 *
 * @packageDocumentation
 */

import type {
  LLMMessage,
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  TokenUsage,
} from '../types/llm.js';
import { DEFAULT_MOCK_TOKEN_USAGE } from './mock-llm-provider.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A recorded call to the mock LLM system, capturing
 * the input messages, request options, and the response produced.
 */
export interface MockLLMCall {
  /** The messages sent to the provider. */
  readonly messages: readonly LLMMessage[];
  /** The request options (if any). */
  readonly options: LLMRequestOptions | undefined;
  /** The response returned (undefined if an error was thrown). */
  readonly response: LLMResponse | undefined;
  /** The error thrown (undefined if the call succeeded). */
  readonly error: Error | undefined;
  /** Timestamp (ms) when the call was made. */
  readonly timestamp: number;
  /** Duration of the call in milliseconds (including simulated latency). */
  readonly duration: number;
}

/**
 * Predicate that determines whether a response rule matches the incoming
 * messages.
 *
 * Return `true` to activate the rule.
 */
export type MockResponseMatcher = (
  messages: readonly LLMMessage[],
  options?: LLMRequestOptions,
) => boolean;

/**
 * A single response rule that maps a matcher to a response (or error).
 */
export interface MockResponseRule {
  /** Human-readable label for debugging (optional). */
  readonly label?: string;

  /**
   * Matcher that selects this rule. Can be:
   * - `RegExp` — tested against the **last user message** content
   * - `string` — substring match against the **last user message** content
   * - `MockResponseMatcher` — custom predicate receiving all messages
   */
  readonly match: RegExp | string | MockResponseMatcher;

  /**
   * The response content to return when the rule matches.
   * Can be a static string or a dynamic handler.
   */
  readonly response?: string | ((messages: readonly LLMMessage[], options?: LLMRequestOptions) => string | Promise<string>);

  /** Full LLM response override (takes precedence over `response`). */
  readonly fullResponse?: LLMResponse | ((messages: readonly LLMMessage[], options?: LLMRequestOptions) => LLMResponse | Promise<LLMResponse>);

  /** If set, throw this error instead of returning a response. */
  readonly error?: Error | (() => Error);

  /** Token usage override for this rule. */
  readonly tokenUsage?: TokenUsage;

  /** Finish reason override for this rule. */
  readonly finishReason?: string;

  /**
   * Maximum number of times this rule can match. After exhaustion the
   * system falls through to the next matching rule. `undefined` means unlimited.
   */
  readonly maxMatches?: number;

  /** Per-rule latency override in milliseconds `[min, max]`. */
  readonly latency?: readonly [min: number, max: number];
}

/**
 * Configuration for the {@link MockLLMResponseSystem}.
 */
export interface MockLLMResponseSystemConfig {
  /** Provider name (default: `"mock-response-system"`). */
  readonly name?: string;

  /** Default response content when no rule matches (default: `"Mock LLM response"`). */
  readonly defaultContent?: string;

  /** Default token usage (default: {@link DEFAULT_MOCK_TOKEN_USAGE}). */
  readonly defaultTokenUsage?: TokenUsage;

  /** Default finish reason (default: `"stop"`). */
  readonly defaultFinishReason?: string;

  /**
   * Global latency range in milliseconds `[min, max]`.
   * A random delay in this range is applied to every call.
   * Default: no latency.
   */
  readonly latency?: readonly [min: number, max: number];

  /**
   * If `true`, throw when no rule matches and no default response is set.
   * Default: `false` (returns the default response).
   */
  readonly strictMode?: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getLastUserContent(messages: readonly LLMMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user' || messages[i].role === ('user' as string)) {
      return messages[i].content;
    }
  }
  return messages.length > 0 ? messages[messages.length - 1].content : '';
}

function matchesRule(
  rule: MockResponseRule,
  messages: readonly LLMMessage[],
  options?: LLMRequestOptions,
): boolean {
  const { match } = rule;

  if (typeof match === 'function') {
    return match(messages, options);
  }

  const lastContent = getLastUserContent(messages);

  if (match instanceof RegExp) {
    return match.test(lastContent);
  }

  // string — substring match (case-insensitive)
  return lastContent.toLowerCase().includes(match.toLowerCase());
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// MockLLMResponseSystem
// ---------------------------------------------------------------------------

/**
 * Advanced mock LLM response system for testing agent workflows.
 *
 * Features:
 * - **Pattern-based routing** — match rules by regex, substring, or custom predicate
 * - **Conversation history** — every call is recorded with messages, response, and timing
 * - **Error simulation** — per-rule or intermittent error injection
 * - **Latency modelling** — global or per-rule random delay ranges
 * - **Call limits** — rules can auto-expire after N matches
 *
 * @example
 * ```typescript
 * const system = new MockLLMResponseSystem();
 * system.addRule({ match: /research/i, response: 'Found 3 papers' });
 * system.addRule({ match: /summarize/i, response: 'Summary: ...' });
 * system.setLatency(10, 50);
 *
 * const provider = system.toProvider();
 * // ... use with Agent / Crew
 *
 * expect(system.callCount).toBe(2);
 * expect(system.callHistory[0].response?.content).toBe('Found 3 papers');
 * ```
 */
export class MockLLMResponseSystem {
  private readonly _name: string;
  private _defaultContent: string;
  private _defaultTokenUsage: TokenUsage;
  private _defaultFinishReason: string;
  private _latency: readonly [number, number] | undefined;
  private _strictMode: boolean;

  private readonly _rules: Array<MockResponseRule & { _matchCount: number }> = [];
  private readonly _callHistory: MockLLMCall[] = [];
  private _provider: LLMProvider | undefined;

  constructor(config: MockLLMResponseSystemConfig = {}) {
    this._name = config.name ?? 'mock-response-system';
    this._defaultContent = config.defaultContent ?? 'Mock LLM response';
    this._defaultTokenUsage = config.defaultTokenUsage ?? DEFAULT_MOCK_TOKEN_USAGE;
    this._defaultFinishReason = config.defaultFinishReason ?? 'stop';
    this._latency = config.latency;
    this._strictMode = config.strictMode ?? false;
  }

  // -----------------------------------------------------------------------
  // Configuration
  // -----------------------------------------------------------------------

  /** Add a response rule. Rules are evaluated in insertion order. */
  addRule(rule: MockResponseRule): this {
    this._rules.push({ ...rule, _matchCount: 0 });
    return this;
  }

  /** Set the default response content (used when no rule matches). */
  setDefaultResponse(content: string): this {
    this._defaultContent = content;
    return this;
  }

  /** Set global latency range `[min, max]` in milliseconds. */
  setLatency(min: number, max: number): this {
    this._latency = [min, max];
    return this;
  }

  /** Enable or disable strict mode. */
  setStrictMode(strict: boolean): this {
    this._strictMode = strict;
    return this;
  }

  // -----------------------------------------------------------------------
  // Inspection
  // -----------------------------------------------------------------------

  /** Number of calls made to this system. */
  get callCount(): number {
    return this._callHistory.length;
  }

  /** Full call history in chronological order. */
  get callHistory(): readonly MockLLMCall[] {
    return [...this._callHistory];
  }

  /** Get the messages sent in the Nth call (0-indexed). */
  getCallMessages(index: number): readonly LLMMessage[] | undefined {
    return this._callHistory[index]?.messages;
  }

  /** Get the response from the Nth call (0-indexed). */
  getCallResponse(index: number): LLMResponse | undefined {
    return this._callHistory[index]?.response;
  }

  /** Check whether a specific content pattern appeared in any call's messages. */
  wasCalledWithContent(pattern: RegExp | string): boolean {
    return this._callHistory.some((call) =>
      call.messages.some((msg) =>
        typeof pattern === 'string'
          ? msg.content.toLowerCase().includes(pattern.toLowerCase())
          : pattern.test(msg.content),
      ),
    );
  }

  /** Number of rules currently registered. */
  get ruleCount(): number {
    return this._rules.length;
  }

  // -----------------------------------------------------------------------
  // State management
  // -----------------------------------------------------------------------

  /** Clear all call history. */
  clearHistory(): this {
    this._callHistory.length = 0;
    return this;
  }

  /** Reset match counts on all rules. */
  resetRuleCounters(): this {
    for (const rule of this._rules) {
      rule._matchCount = 0;
    }
    return this;
  }

  /** Remove all rules. */
  clearRules(): this {
    this._rules.length = 0;
    return this;
  }

  /** Full reset: clear history, rules, and cached provider. */
  reset(): this {
    this.clearHistory();
    this.clearRules();
    this._provider = undefined;
    return this;
  }

  // -----------------------------------------------------------------------
  // Provider generation
  // -----------------------------------------------------------------------

  /**
   * Create (or return cached) an {@link LLMProvider} backed by this system.
   *
   * The provider is cached so that the same instance is returned on
   * repeated calls. Call {@link reset} to invalidate the cache.
   */
  toProvider(): LLMProvider {
    if (!this._provider) {
      this._provider = {
        name: this._name,
        generateText: async (
          messages: readonly LLMMessage[],
          options?: LLMRequestOptions,
        ): Promise<LLMResponse> => {
          return this._handleCall(messages, options);
        },
      };
    }
    return this._provider;
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private async _handleCall(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions,
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    let response: LLMResponse | undefined;
    let error: Error | undefined;

    try {
      // Find the first matching rule
      const rule = this._findMatchingRule(messages, options);

      // Apply latency
      const latency = rule?.latency ?? this._latency;
      if (latency) {
        const delay = randomInRange(latency[0], latency[1]);
        if (delay > 0) {
          await new Promise<void>((resolve) => setTimeout(resolve, delay));
        }
      }

      // Check abort signal
      if (options?.signal?.aborted) {
        throw new Error('Request aborted');
      }

      if (rule) {
        // Check for error
        if (rule.error) {
          throw typeof rule.error === 'function' ? rule.error() : rule.error;
        }

        // Build response
        if (rule.fullResponse) {
          response =
            typeof rule.fullResponse === 'function'
              ? await rule.fullResponse(messages, options)
              : rule.fullResponse;
        } else {
          const content =
            rule.response !== undefined
              ? typeof rule.response === 'function'
                ? await rule.response(messages, options)
                : rule.response
              : this._defaultContent;

          response = {
            content,
            tokenUsage: rule.tokenUsage ?? this._defaultTokenUsage,
            finishReason: rule.finishReason ?? this._defaultFinishReason,
          };
        }
      } else if (this._strictMode) {
        throw new Error(
          `MockLLMResponseSystem: No matching rule for messages (strict mode). ` +
          `Last message: "${getLastUserContent(messages).slice(0, 100)}"`,
        );
      } else {
        response = {
          content: this._defaultContent,
          tokenUsage: this._defaultTokenUsage,
          finishReason: this._defaultFinishReason,
        };
      }

      return response;
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));
      throw error;
    } finally {
      this._callHistory.push({
        messages: [...messages],
        options,
        response,
        error,
        timestamp: startTime,
        duration: Date.now() - startTime,
      });
    }
  }

  private _findMatchingRule(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions,
  ): (MockResponseRule & { _matchCount: number }) | undefined {
    for (const rule of this._rules) {
      // Skip exhausted rules
      if (rule.maxMatches !== undefined && rule._matchCount >= rule.maxMatches) {
        continue;
      }

      if (matchesRule(rule, messages, options)) {
        rule._matchCount++;
        return rule;
      }
    }
    return undefined;
  }
}
