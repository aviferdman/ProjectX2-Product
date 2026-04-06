/**
 * Registry for LLM provider factories.
 *
 * Enables dynamic provider creation from configuration objects — consumers
 * register factories by name and later create providers without importing
 * concrete classes.
 *
 * @packageDocumentation
 */

import { LLMProviderError } from '../errors/llm-errors.js';
import type { LLMProvider, LLMProviderConfig, LLMProviderFactory } from '../types/llm.js';

/**
 * A registry that maps provider names to their factory functions.
 *
 * @example
 * ```typescript
 * const registry = new LLMProviderRegistry();
 *
 * registry.register('openai', (config) => new OpenAIProvider(config));
 * registry.register('anthropic', (config) => new AnthropicProvider(config));
 *
 * const provider = registry.create({
 *   provider: 'openai',
 *   modelId: 'gpt-4o',
 *   apiKey: process.env.OPENAI_API_KEY!,
 * });
 * ```
 */
export class LLMProviderRegistry {
  private readonly _factories = new Map<string, LLMProviderFactory>();

  /**
   * Register a factory for a provider name.
   *
   * @param name    - Provider identifier (e.g. "openai")
   * @param factory - Function that creates a provider from config
   * @throws {LLMProviderError} If a factory with the same name is already registered
   */
  register(name: string, factory: LLMProviderFactory): void {
    if (this._factories.has(name)) {
      throw new LLMProviderError(name, `Provider "${name}" is already registered`);
    }
    this._factories.set(name, factory);
  }

  /**
   * Replace an existing factory registration.
   *
   * @param name    - Provider identifier
   * @param factory - New factory function
   */
  override(name: string, factory: LLMProviderFactory): void {
    this._factories.set(name, factory);
  }

  /**
   * Remove a registered factory.
   *
   * @param name - Provider identifier to remove
   * @returns `true` if the factory was found and removed
   */
  unregister(name: string): boolean {
    return this._factories.delete(name);
  }

  /**
   * Check whether a factory is registered for the given name.
   *
   * @param name - Provider identifier
   */
  has(name: string): boolean {
    return this._factories.has(name);
  }

  /**
   * List all registered provider names.
   */
  listProviders(): readonly string[] {
    return Array.from(this._factories.keys());
  }

  /**
   * Create a provider instance from configuration.
   *
   * @param config - Provider configuration (the `provider` field selects the factory)
   * @returns A new provider instance
   * @throws {LLMProviderError} If no factory is registered for the given provider name
   */
  create(config: LLMProviderConfig): LLMProvider {
    const factory = this._factories.get(config.provider);
    if (!factory) {
      const available = this.listProviders().join(', ') || 'none';
      throw new LLMProviderError(
        config.provider,
        `No factory registered for provider "${config.provider}". Available: [${available}]`,
      );
    }
    return factory(config);
  }

  /**
   * Create a provider from environment variables.
   *
   * Reads `CREWSPACE_LLM_PROVIDER` and `CREWSPACE_LLM_MODEL` from the
   * environment, plus provider-specific keys (e.g. `OPENAI_API_KEY`).
   *
   * @param overrides - Optional config fields to override environment values
   * @returns A new provider instance
   * @throws {LLMProviderError} If required environment variables are missing
   */
  createFromEnv(overrides?: Partial<LLMProviderConfig>): LLMProvider {
    const provider = overrides?.provider ?? process.env['CREWSPACE_LLM_PROVIDER'];
    const modelId = overrides?.modelId ?? process.env['CREWSPACE_LLM_MODEL'];

    if (!provider) {
      throw new LLMProviderError(
        'unknown',
        'CREWSPACE_LLM_PROVIDER environment variable is not set',
      );
    }
    if (!modelId) {
      throw new LLMProviderError(provider, 'CREWSPACE_LLM_MODEL environment variable is not set');
    }

    const apiKeyEnvMap: Record<string, string> = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
    };

    const apiKeyEnv = apiKeyEnvMap[provider];
    const apiKey = overrides?.apiKey ?? (apiKeyEnv ? process.env[apiKeyEnv] : undefined);

    const config: LLMProviderConfig = {
      provider,
      modelId,
      ...(apiKey !== undefined && { apiKey }),
      ...(overrides?.baseUrl !== undefined && { baseUrl: overrides.baseUrl }),
      ...(overrides?.maxRetries !== undefined && {
        maxRetries: overrides.maxRetries,
      }),
      ...(overrides?.timeout !== undefined && { timeout: overrides.timeout }),
      ...(overrides?.defaultOptions !== undefined && {
        defaultOptions: overrides.defaultOptions,
      }),
    };

    return this.create(config);
  }

  /**
   * Remove all registered factories.
   */
  clear(): void {
    this._factories.clear();
  }
}
