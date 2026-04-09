/**
 * Lazy module loader for deferred initialization of heavy subsystems.
 *
 * Enables fine-grained code splitting by deferring the import and
 * initialization of expensive modules (LLM providers, memory backends,
 * tool registries) until they are actually needed.
 *
 * @packageDocumentation
 */

/** Status of a lazy-loaded module. */
export type LazyModuleStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** Configuration for a lazy module loader. */
export interface LazyModuleConfig<T> {
  /** Factory function that loads and returns the module. */
  loader: () => Promise<T>;
  /** Called when the module finishes loading. */
  onLoad?: (mod: T) => void;
  /** Called when the module fails to load. */
  onError?: (error: Error) => void;
  /** Maximum number of retry attempts on failure. Default: 0. */
  retries?: number;
  /** Delay in ms between retry attempts. Default: 1000. */
  retryDelay?: number;
}

/**
 * Lazy module loader — defers expensive imports until first access.
 *
 * The module is loaded once on the first call to `get()` and cached
 * thereafter. Concurrent calls during loading are deduplicated.
 *
 * @example
 * ```ts
 * const heavyModule = new LazyModule({
 *   loader: () => import('./heavy-module.js'),
 *   retries: 2,
 * });
 *
 * // Module is NOT imported yet
 * const mod = await heavyModule.get(); // triggers import
 * const mod2 = await heavyModule.get(); // returns cached
 * ```
 */
export class LazyModule<T> {
  private instance: T | undefined;
  private promise: Promise<T> | null = null;
  private loadError: Error | null = null;
  private _status: LazyModuleStatus = 'idle';
  private readonly loader: () => Promise<T>;
  private readonly onLoad?: (mod: T) => void;
  private readonly onError?: (error: Error) => void;
  private readonly retries: number;
  private readonly retryDelay: number;

  constructor(config: LazyModuleConfig<T>) {
    this.loader = config.loader;
    this.onLoad = config.onLoad;
    this.onError = config.onError;
    this.retries = config.retries ?? 0;
    this.retryDelay = config.retryDelay ?? 1000;
  }

  /** Current loading status. */
  get status(): LazyModuleStatus {
    return this._status;
  }

  /** Whether the module has been loaded successfully. */
  get isLoaded(): boolean {
    return this._status === 'loaded';
  }

  /** The last error encountered during loading, if any. */
  get error(): Error | null {
    return this.loadError;
  }

  /**
   * Get the lazy-loaded module. Triggers loading on the first call.
   * Subsequent calls return the cached instance.
   */
  async get(): Promise<T> {
    if (this.instance !== undefined) {
      return this.instance;
    }

    if (this.promise) {
      return this.promise;
    }

    this._status = 'loading';
    this.loadError = null;

    this.promise = this.loadWithRetry().then(
      (mod) => {
        this.instance = mod;
        this._status = 'loaded';
        this.promise = null;
        if (this.onLoad) this.onLoad(mod);
        return mod;
      },
      (err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        this.loadError = error;
        this._status = 'error';
        this.promise = null;
        if (this.onError) this.onError(error);
        throw error;
      },
    );

    return this.promise;
  }

  /**
   * Reset the loader so the next `get()` call re-imports the module.
   * Useful after a failed load or for testing.
   */
  reset(): void {
    this.instance = undefined;
    this.promise = null;
    this.loadError = null;
    this._status = 'idle';
  }

  /** Return the cached instance if already loaded, or undefined. */
  peek(): T | undefined {
    return this.instance;
  }

  private async loadWithRetry(): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        return await this.loader();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < this.retries) {
          await this.delay(this.retryDelay);
        }
      }
    }
    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Registry for managing multiple lazy-loaded modules.
 *
 * @example
 * ```ts
 * const registry = new LazyModuleRegistry();
 * registry.register('llm', { loader: () => import('./llm/index.js') });
 * registry.register('memory', { loader: () => import('./memory/index.js') });
 *
 * const llm = await registry.get<typeof import('./llm/index.js')>('llm');
 * ```
 */
export class LazyModuleRegistry {
  private readonly modules = new Map<string, LazyModule<unknown>>();

  /** Register a new lazy module under the given name. */
  register<T>(name: string, config: LazyModuleConfig<T>): void {
    this.modules.set(name, new LazyModule(config) as LazyModule<unknown>);
  }

  /** Get a lazy-loaded module by name. */
  async get<T>(name: string): Promise<T> {
    const mod = this.modules.get(name);
    if (!mod) {
      throw new Error(`Lazy module "${name}" is not registered`);
    }
    return (await mod.get()) as T;
  }

  /** Check the status of a registered module. */
  status(name: string): LazyModuleStatus | undefined {
    return this.modules.get(name)?.status;
  }

  /** Check whether a module is registered. */
  has(name: string): boolean {
    return this.modules.has(name);
  }

  /** Reset a specific module or all modules. */
  reset(name?: string): void {
    if (name) {
      this.modules.get(name)?.reset();
    } else {
      for (const mod of this.modules.values()) {
        mod.reset();
      }
    }
  }

  /** List all registered module names. */
  names(): string[] {
    return Array.from(this.modules.keys());
  }
}
