/**
 * Type guard for checking streaming capability at runtime.
 *
 * @packageDocumentation
 */

import type { LLMProvider, StreamingLLMProvider } from "../types/llm.js";

/**
 * Check whether an LLM provider supports streaming.
 *
 * @param provider - The provider to test
 * @returns `true` if the provider has a `generateStream` method
 *
 * @example
 * ```typescript
 * if (isStreamingProvider(provider)) {
 *   const stream = await provider.generateStream(messages);
 *   for await (const chunk of stream) {
 *     process.stdout.write(chunk.content);
 *   }
 * } else {
 *   const response = await provider.generateText(messages);
 *   console.log(response.content);
 * }
 * ```
 */
export function isStreamingProvider(
  provider: LLMProvider,
): provider is StreamingLLMProvider {
  return (
    typeof (provider as StreamingLLMProvider).generateStream === "function"
  );
}
