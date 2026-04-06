/**
 * Deprecation utilities for Crewspace public APIs.
 *
 * Provides a registry-backed deprecation system that emits warnings when
 * deprecated APIs are called, de-duplicates repeated warnings, and supports
 * method decorators and function wrappers.
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Describes a single deprecation notice. */
export interface DeprecationInfo {
  /** Identifier of the deprecated API (e.g. `"Agent.execute"`, `"createTool"`). */
  readonly name: string;
  /** Human-readable explanation of the deprecation. */
  readonly message: string;
  /** Version in which the API was first deprecated. */
  readonly since: string;
  /** Version in which the API will be (or was) removed. */
  readonly removeIn?: string | undefined;
  /** Suggested replacement API, if any. */
  readonly replacement?: string | undefined;
}

/** Handler invoked when a deprecation warning is emitted. */
export type DeprecationHandler = (info: DeprecationInfo) => void;

// ---------------------------------------------------------------------------
// Default handler
// ---------------------------------------------------------------------------

/** Default handler that logs to `console.warn`. */
export function defaultDeprecationHandler(info: DeprecationInfo): void {
  let msg = `[Crewspace deprecation] "${info.name}" is deprecated since v${info.since}.`;
  if (info.removeIn) {
    msg += ` It will be removed in v${info.removeIn}.`;
  }
  if (info.replacement) {
    msg += ` Use "${info.replacement}" instead.`;
  }
  if (info.message) {
    msg += ` ${info.message}`;
  }
  // eslint-disable-next-line no-console
  console.warn(msg);
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * Tracks which deprecation warnings have already been emitted so each warning
 * is shown at most once per process.
 *
 * @example
 * ```ts
 * const registry = new DeprecationRegistry();
 * registry.warn({ name: 'oldFn', message: 'Use newFn.', since: '0.2.0' });
 * // Second call is silently ignored:
 * registry.warn({ name: 'oldFn', message: 'Use newFn.', since: '0.2.0' });
 * ```
 */
export class DeprecationRegistry {
  private readonly _emitted = new Set<string>();
  private _handler: DeprecationHandler;
  private _enabled: boolean;

  constructor(handler?: DeprecationHandler) {
    this._handler = handler ?? defaultDeprecationHandler;
    this._enabled = true;
  }

  /** Returns the current handler. */
  get handler(): DeprecationHandler {
    return this._handler;
  }

  /** Replaces the deprecation handler. */
  setHandler(handler: DeprecationHandler): void {
    this._handler = handler;
  }

  /** Whether deprecation warnings are enabled. */
  get enabled(): boolean {
    return this._enabled;
  }

  /** Enable or disable all deprecation warnings. */
  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  /**
   * Emit a deprecation warning for the given API. Each unique `info.name`
   * is warned about at most once.
   *
   * @returns `true` if the warning was emitted, `false` if it was a duplicate.
   */
  warn(info: DeprecationInfo): boolean {
    if (!this._enabled) {
      return false;
    }
    if (this._emitted.has(info.name)) {
      return false;
    }
    this._emitted.add(info.name);
    this._handler(info);
    return true;
  }

  /** Returns the set of API names that have already been warned about. */
  get emittedNames(): ReadonlySet<string> {
    return this._emitted;
  }

  /** Clears the set of emitted warnings so they can be shown again. */
  reset(): void {
    this._emitted.clear();
  }
}

// ---------------------------------------------------------------------------
// Global registry (singleton for convenience)
// ---------------------------------------------------------------------------

/** Global deprecation registry shared across the framework. */
export const globalDeprecationRegistry = new DeprecationRegistry();

// ---------------------------------------------------------------------------
// emitDeprecationWarning — imperative API
// ---------------------------------------------------------------------------

/**
 * Emit a one-time deprecation warning via the global registry.
 *
 * @example
 * ```ts
 * function oldHelper() {
 *   emitDeprecationWarning({
 *     name: 'oldHelper',
 *     message: 'This helper is no longer maintained.',
 *     since: '0.2.0',
 *     replacement: 'newHelper',
 *   });
 *   // ...original logic
 * }
 * ```
 */
export function emitDeprecationWarning(info: DeprecationInfo): boolean {
  return globalDeprecationRegistry.warn(info);
}

// ---------------------------------------------------------------------------
// deprecatedFunction — wrap a standalone function
// ---------------------------------------------------------------------------

/**
 * Wrap a function so that invoking it emits a deprecation warning (once) and
 * then delegates to the original implementation.
 *
 * @example
 * ```ts
 * const legacyParse = deprecatedFunction(
 *   originalParse,
 *   {
 *     name: 'legacyParse',
 *     message: 'Parsing API redesigned.',
 *     since: '0.3.0',
 *     replacement: 'parse',
 *   },
 * );
 * ```
 */
export function deprecatedFunction<T extends (...args: never[]) => unknown>(
  fn: T,
  info: DeprecationInfo,
  registry?: DeprecationRegistry,
): T {
  const reg = registry ?? globalDeprecationRegistry;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const original = fn as (...a: any[]) => any;
  const wrapper = function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    reg.warn(info);
    return original.apply(this, args) as ReturnType<T>;
  };
  // Preserve `.name` and `.length` for introspection
  Object.defineProperty(wrapper, 'name', { value: fn.name, configurable: true });
  Object.defineProperty(wrapper, 'length', { value: fn.length, configurable: true });
  return wrapper as T;
}

// ---------------------------------------------------------------------------
// deprecated — method decorator
// ---------------------------------------------------------------------------

/**
 * Method decorator that emits a deprecation warning the first time the
 * decorated method is called.
 *
 * @example
 * ```ts
 * class MyClass {
 *   \@deprecated({
 *     name: 'MyClass.oldMethod',
 *     message: 'Use newMethod instead.',
 *     since: '0.2.0',
 *     replacement: 'MyClass.newMethod',
 *   })
 *   oldMethod() { ... }
 * }
 * ```
 */
export function deprecated(info: DeprecationInfo, registry?: DeprecationRegistry) {
  const reg = registry ?? globalDeprecationRegistry;
  return function (
    _target: unknown,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const original = descriptor.value as (...args: unknown[]) => unknown;
    descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
      reg.warn(info);
      return original.apply(this, args);
    };
    return descriptor;
  };
}
