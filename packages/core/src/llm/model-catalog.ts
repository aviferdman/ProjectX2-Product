/**
 * Pre-defined model metadata catalog for known LLM providers.
 *
 * Provides {@link LLMModelInfo} entries for OpenAI, Anthropic, and Ollama
 * models. Used for token budgeting, cost estimation, and capability checks.
 *
 * @packageDocumentation
 */

import type { LLMModelInfo } from "../types/llm.js";

// ---------------------------------------------------------------------------
// OpenAI models
// ---------------------------------------------------------------------------

const GPT_4O: LLMModelInfo = {
  modelId: "gpt-4o",
  provider: "openai",
  displayName: "GPT-4o",
  maxContextTokens: 128_000,
  maxOutputTokens: 16_384,
  supportsStreaming: true,
  costPer1kInputTokens: 0.0025,
  costPer1kOutputTokens: 0.01,
};

const GPT_4O_MINI: LLMModelInfo = {
  modelId: "gpt-4o-mini",
  provider: "openai",
  displayName: "GPT-4o mini",
  maxContextTokens: 128_000,
  maxOutputTokens: 16_384,
  supportsStreaming: true,
  costPer1kInputTokens: 0.00015,
  costPer1kOutputTokens: 0.0006,
};

const GPT_4_TURBO: LLMModelInfo = {
  modelId: "gpt-4-turbo",
  provider: "openai",
  displayName: "GPT-4 Turbo",
  maxContextTokens: 128_000,
  maxOutputTokens: 4_096,
  supportsStreaming: true,
  costPer1kInputTokens: 0.01,
  costPer1kOutputTokens: 0.03,
};

// ---------------------------------------------------------------------------
// Anthropic models
// ---------------------------------------------------------------------------

const CLAUDE_3_5_SONNET: LLMModelInfo = {
  modelId: "claude-3-5-sonnet-20241022",
  provider: "anthropic",
  displayName: "Claude 3.5 Sonnet",
  maxContextTokens: 200_000,
  maxOutputTokens: 8_192,
  supportsStreaming: true,
  costPer1kInputTokens: 0.003,
  costPer1kOutputTokens: 0.015,
};

const CLAUDE_3_5_HAIKU: LLMModelInfo = {
  modelId: "claude-3-5-haiku-20241022",
  provider: "anthropic",
  displayName: "Claude 3.5 Haiku",
  maxContextTokens: 200_000,
  maxOutputTokens: 8_192,
  supportsStreaming: true,
  costPer1kInputTokens: 0.001,
  costPer1kOutputTokens: 0.005,
};

const CLAUDE_3_OPUS: LLMModelInfo = {
  modelId: "claude-3-opus-20240229",
  provider: "anthropic",
  displayName: "Claude 3 Opus",
  maxContextTokens: 200_000,
  maxOutputTokens: 4_096,
  supportsStreaming: true,
  costPer1kInputTokens: 0.015,
  costPer1kOutputTokens: 0.075,
};

// ---------------------------------------------------------------------------
// Ollama models (local — no cost)
// ---------------------------------------------------------------------------

const LLAMA_3_1_8B: LLMModelInfo = {
  modelId: "llama3.1:8b",
  provider: "ollama",
  displayName: "Llama 3.1 8B",
  maxContextTokens: 128_000,
  maxOutputTokens: 4_096,
  supportsStreaming: true,
};

const MISTRAL_7B: LLMModelInfo = {
  modelId: "mistral:7b",
  provider: "ollama",
  displayName: "Mistral 7B",
  maxContextTokens: 32_000,
  maxOutputTokens: 4_096,
  supportsStreaming: true,
};

const CODELLAMA_13B: LLMModelInfo = {
  modelId: "codellama:13b",
  provider: "ollama",
  displayName: "Code Llama 13B",
  maxContextTokens: 16_000,
  maxOutputTokens: 4_096,
  supportsStreaming: true,
};

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

/** All known models indexed by model ID. */
const ALL_MODELS: ReadonlyMap<string, LLMModelInfo> = new Map<
  string,
  LLMModelInfo
>([
  [GPT_4O.modelId, GPT_4O],
  [GPT_4O_MINI.modelId, GPT_4O_MINI],
  [GPT_4_TURBO.modelId, GPT_4_TURBO],
  [CLAUDE_3_5_SONNET.modelId, CLAUDE_3_5_SONNET],
  [CLAUDE_3_5_HAIKU.modelId, CLAUDE_3_5_HAIKU],
  [CLAUDE_3_OPUS.modelId, CLAUDE_3_OPUS],
  [LLAMA_3_1_8B.modelId, LLAMA_3_1_8B],
  [MISTRAL_7B.modelId, MISTRAL_7B],
  [CODELLAMA_13B.modelId, CODELLAMA_13B],
]);

/**
 * Model catalog — look up metadata for known LLM models.
 *
 * @example
 * ```typescript
 * import { ModelCatalog } from '@crewspace/core';
 *
 * const info = ModelCatalog.get('gpt-4o');
 * if (info) {
 *   console.log(`${info.displayName} — ${info.maxContextTokens} token context`);
 * }
 *
 * const openaiModels = ModelCatalog.getByProvider('openai');
 * ```
 */
export const ModelCatalog = {
  /**
   * Look up model info by exact model ID.
   *
   * @param modelId - The model identifier (e.g. "gpt-4o")
   * @returns Model info or `undefined` if not found
   */
  get(modelId: string): LLMModelInfo | undefined {
    return ALL_MODELS.get(modelId);
  },

  /**
   * List all models for a given provider.
   *
   * @param provider - Provider name (e.g. "openai", "anthropic", "ollama")
   * @returns Array of model info objects
   */
  getByProvider(provider: string): readonly LLMModelInfo[] {
    return Array.from(ALL_MODELS.values()).filter(
      (m) => m.provider === provider,
    );
  },

  /**
   * List all known model IDs.
   */
  listModelIds(): readonly string[] {
    return Array.from(ALL_MODELS.keys());
  },

  /**
   * List all known provider names.
   */
  listProviders(): readonly string[] {
    const providers = new Set(
      Array.from(ALL_MODELS.values()).map((m) => m.provider),
    );
    return Array.from(providers);
  },

  /**
   * Check whether a model ID is in the catalog.
   *
   * @param modelId - The model identifier
   */
  has(modelId: string): boolean {
    return ALL_MODELS.has(modelId);
  },

  /**
   * Get the total number of known models.
   */
  get size(): number {
    return ALL_MODELS.size;
  },

  /**
   * Estimate the cost of a request given token counts.
   *
   * @param modelId - The model identifier
   * @param promptTokens - Number of input tokens
   * @param completionTokens - Number of output tokens
   * @returns Cost in USD, or `undefined` if model has no pricing info
   */
  estimateCost(
    modelId: string,
    promptTokens: number,
    completionTokens: number,
  ): number | undefined {
    const info = ALL_MODELS.get(modelId);
    if (!info) return undefined;
    if (
      info.costPer1kInputTokens === undefined ||
      info.costPer1kOutputTokens === undefined
    ) {
      return undefined;
    }
    return (
      (promptTokens / 1000) * info.costPer1kInputTokens +
      (completionTokens / 1000) * info.costPer1kOutputTokens
    );
  },
} as const;
