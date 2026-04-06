/**
 * LLM provider module — base classes, utilities, registry, and validation.
 *
 * @packageDocumentation
 */

export { BaseLLMProvider } from './base-provider.js';
export { ModelCatalog } from './model-catalog.js';
export {
  createAnthropicProvider,
  AnthropicProvider,
  createOpenAIProvider,
  OpenAIProvider,
} from './providers/index.js';
export { LLMProviderRegistry } from './provider-registry.js';
export { CircuitBreaker, CircuitState } from './circuit-breaker.js';
export type { CircuitBreakerConfig, CircuitBreakerSnapshot } from './circuit-breaker.js';
export { createRetryProvider, RetryLLMProvider } from './retry-provider.js';
export type { RetryLLMProviderOptions, RetryStats } from './retry-provider.js';
export { buildRetryConfig, calculateDelay, isRetryableError, withRetry } from './retry.js';
export type { OnRetryCallback, RetryConfig, RetryContext } from './retry.js';
export { DefaultLLMStreamResponse } from './stream-response.js';
export { isStreamingProvider } from './type-guards.js';
export { TokenUsageTracker } from './usage-tracker.js';
export type { UsageRecord, UsageRecordInput, UsageReport, UsageSummary } from './usage-tracker.js';
export { createUsageTrackingProvider, UsageTrackingProvider } from './usage-tracking-provider.js';
export type {
  UsageTrackingProviderOptions,
  UsageTrackingProviderResult,
} from './usage-tracking-provider.js';
export {
  LLMMessageSchema,
  LLMMessagesSchema,
  LLMModelInfoSchema,
  LLMProviderConfigSchema,
  LLMRequestOptionsSchema,
  validateLLMMessages,
  validateLLMProviderConfig,
} from './validation.js';
