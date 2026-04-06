/**
 * Zod validation schemas for LLM provider configuration.
 *
 * Runtime validation for {@link LLMProviderConfig}, {@link LLMRequestOptions},
 * and {@link LLMMessage} — consistent with the validation patterns used
 * throughout the Crewspace framework (Agent, Crew, Task, Engine).
 *
 * @packageDocumentation
 */

import { z } from "zod";

import { LLMRole } from "../types/llm.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 300_000;
const MIN_TEMPERATURE = 0;
const MAX_TEMPERATURE = 2;
const MAX_RETRIES_UPPER_BOUND = 10;

// ---------------------------------------------------------------------------
// LLMRequestOptions schema
// ---------------------------------------------------------------------------

/**
 * Zod schema for {@link LLMRequestOptions}.
 *
 * Validates generation parameters (temperature, maxTokens, etc.) with
 * sensible bounds.
 */
export const LLMRequestOptionsSchema = z
  .object({
    temperature: z
      .number()
      .min(MIN_TEMPERATURE, `temperature must be ≥ ${String(MIN_TEMPERATURE)}`)
      .max(MAX_TEMPERATURE, `temperature must be ≤ ${String(MAX_TEMPERATURE)}`)
      .optional(),
    maxTokens: z
      .number()
      .int("maxTokens must be an integer")
      .positive("maxTokens must be positive")
      .optional(),
    stopSequences: z.array(z.string()).optional(),
    signal: z.custom<AbortSignal>().optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// LLMMessage schema
// ---------------------------------------------------------------------------

/** Zod schema for {@link LLMMessage}. */
export const LLMMessageSchema = z.object({
  role: z.nativeEnum(LLMRole, {
    errorMap: () => ({
      message: `role must be one of: ${Object.values(LLMRole).join(", ")}`,
    }),
  }),
  content: z.string().min(1, "Message content must not be empty"),
  name: z.string().optional(),
});

/**
 * Validates an array of {@link LLMMessage} objects.
 *
 * Enforces:
 * - Non-empty array
 * - At least one USER or SYSTEM message
 */
export const LLMMessagesSchema = z
  .array(LLMMessageSchema)
  .min(1, "Messages array must not be empty")
  .refine(
    (msgs) =>
      msgs.some((m) => m.role === LLMRole.USER || m.role === LLMRole.SYSTEM),
    { message: "Messages must contain at least one USER or SYSTEM message" },
  );

// ---------------------------------------------------------------------------
// LLMProviderConfig schema
// ---------------------------------------------------------------------------

const PROVIDER_NAME_PATTERN = /^[a-z][a-z0-9_-]*$/;

/**
 * Zod schema for {@link LLMProviderConfig}.
 *
 * Validates provider name, model ID, API credentials, and default options.
 *
 * @example
 * ```typescript
 * import { LLMProviderConfigSchema } from '@crewspace/core';
 *
 * const config = LLMProviderConfigSchema.parse({
 *   provider: 'openai',
 *   modelId: 'gpt-4o',
 *   apiKey: process.env.OPENAI_API_KEY,
 * });
 * ```
 */
export const LLMProviderConfigSchema = z.object({
  provider: z
    .string()
    .min(1, "Provider name must not be empty")
    .regex(
      PROVIDER_NAME_PATTERN,
      "Provider name must start with lowercase letter and contain only lowercase letters, digits, hyphens, or underscores",
    ),
  modelId: z.string().min(1, "Model ID must not be empty"),
  apiKey: z.string().min(1, "API key must not be empty").optional(),
  baseUrl: z.string().url("baseUrl must be a valid URL").optional(),
  maxRetries: z
    .number()
    .int("maxRetries must be an integer")
    .nonnegative("maxRetries must be ≥ 0")
    .max(
      MAX_RETRIES_UPPER_BOUND,
      `maxRetries must be ≤ ${String(MAX_RETRIES_UPPER_BOUND)}`,
    )
    .optional(),
  timeout: z
    .number()
    .int("timeout must be an integer")
    .min(MIN_TIMEOUT_MS, `timeout must be ≥ ${String(MIN_TIMEOUT_MS)}ms`)
    .max(MAX_TIMEOUT_MS, `timeout must be ≤ ${String(MAX_TIMEOUT_MS)}ms`)
    .optional(),
  defaultOptions: LLMRequestOptionsSchema.optional(),
});

// ---------------------------------------------------------------------------
// LLMModelInfo schema
// ---------------------------------------------------------------------------

/**
 * Zod schema for {@link LLMModelInfo}.
 *
 * Validates model metadata used for token budgeting and cost estimation.
 */
export const LLMModelInfoSchema = z.object({
  modelId: z.string().min(1, "modelId must not be empty"),
  provider: z.string().min(1, "provider must not be empty"),
  displayName: z.string().min(1, "displayName must not be empty"),
  maxContextTokens: z
    .number()
    .int()
    .positive("maxContextTokens must be positive"),
  maxOutputTokens: z
    .number()
    .int()
    .positive("maxOutputTokens must be positive"),
  supportsStreaming: z.boolean(),
  costPer1kInputTokens: z.number().nonnegative().optional(),
  costPer1kOutputTokens: z.number().nonnegative().optional(),
});

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Validate an {@link LLMProviderConfig} object.
 *
 * @param config - Raw configuration to validate
 * @returns The parsed (validated) config
 * @throws {ZodError} If validation fails
 */
export function validateLLMProviderConfig(
  config: unknown,
): z.infer<typeof LLMProviderConfigSchema> {
  return LLMProviderConfigSchema.parse(config);
}

/**
 * Validate an array of {@link LLMMessage} objects.
 *
 * @param messages - Raw messages to validate
 * @returns The parsed (validated) messages
 * @throws {ZodError} If validation fails
 */
export function validateLLMMessages(
  messages: unknown,
): z.infer<typeof LLMMessagesSchema> {
  return LLMMessagesSchema.parse(messages);
}
