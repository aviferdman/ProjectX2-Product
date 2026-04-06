/**
 * Unit tests for the deprecation utilities.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  defaultDeprecationHandler,
  deprecated,
  deprecatedFunction,
  DeprecationRegistry,
  emitDeprecationWarning,
  globalDeprecationRegistry,
} from '../../../src/deprecation/deprecation.js';
import type { DeprecationInfo } from '../../../src/deprecation/deprecation.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInfo(overrides?: Partial<DeprecationInfo>): DeprecationInfo {
  return {
    name: 'testApi',
    message: 'Use newApi instead.',
    since: '0.2.0',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// defaultDeprecationHandler
// ---------------------------------------------------------------------------

describe('defaultDeprecationHandler', () => {
  it('should log a warning to console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const info = makeInfo();
    defaultDeprecationHandler(info);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0]![0]).toContain('"testApi"');
    expect(spy.mock.calls[0]![0]).toContain('v0.2.0');
    spy.mockRestore();
  });

  it('should include removeIn version when provided', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    defaultDeprecationHandler(makeInfo({ removeIn: '1.0.0' }));
    expect(spy.mock.calls[0]![0]).toContain('v1.0.0');
    spy.mockRestore();
  });

  it('should include replacement when provided', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    defaultDeprecationHandler(makeInfo({ replacement: 'betterApi' }));
    expect(spy.mock.calls[0]![0]).toContain('"betterApi"');
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// DeprecationRegistry
// ---------------------------------------------------------------------------

describe('DeprecationRegistry', () => {
  describe('construction', () => {
    it('should use defaultDeprecationHandler when none provided', () => {
      const registry = new DeprecationRegistry();
      expect(registry.handler).toBe(defaultDeprecationHandler);
    });

    it('should accept a custom handler', () => {
      const handler = vi.fn();
      const registry = new DeprecationRegistry(handler);
      expect(registry.handler).toBe(handler);
    });

    it('should be enabled by default', () => {
      const registry = new DeprecationRegistry();
      expect(registry.enabled).toBe(true);
    });
  });

  describe('warn', () => {
    it('should invoke the handler on first call', () => {
      const handler = vi.fn();
      const registry = new DeprecationRegistry(handler);
      const info = makeInfo();

      const emitted = registry.warn(info);

      expect(emitted).toBe(true);
      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(info);
    });

    it('should de-duplicate by name', () => {
      const handler = vi.fn();
      const registry = new DeprecationRegistry(handler);
      const info = makeInfo();

      registry.warn(info);
      const emittedAgain = registry.warn(info);

      expect(emittedAgain).toBe(false);
      expect(handler).toHaveBeenCalledOnce();
    });

    it('should emit separate warnings for different names', () => {
      const handler = vi.fn();
      const registry = new DeprecationRegistry(handler);

      registry.warn(makeInfo({ name: 'apiA' }));
      registry.warn(makeInfo({ name: 'apiB' }));

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should not invoke handler when disabled', () => {
      const handler = vi.fn();
      const registry = new DeprecationRegistry(handler);
      registry.setEnabled(false);

      const emitted = registry.warn(makeInfo());

      expect(emitted).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should resume emitting after re-enable', () => {
      const handler = vi.fn();
      const registry = new DeprecationRegistry(handler);

      registry.setEnabled(false);
      registry.warn(makeInfo());
      registry.setEnabled(true);
      const emitted = registry.warn(makeInfo());

      expect(emitted).toBe(true);
      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe('emittedNames', () => {
    it('should track emitted API names', () => {
      const registry = new DeprecationRegistry(vi.fn());
      registry.warn(makeInfo({ name: 'a' }));
      registry.warn(makeInfo({ name: 'b' }));

      expect(registry.emittedNames.has('a')).toBe(true);
      expect(registry.emittedNames.has('b')).toBe(true);
      expect(registry.emittedNames.size).toBe(2);
    });
  });

  describe('reset', () => {
    it('should clear emitted set', () => {
      const handler = vi.fn();
      const registry = new DeprecationRegistry(handler);
      registry.warn(makeInfo());
      expect(registry.emittedNames.size).toBe(1);

      registry.reset();

      expect(registry.emittedNames.size).toBe(0);
    });

    it('should allow re-emission after reset', () => {
      const handler = vi.fn();
      const registry = new DeprecationRegistry(handler);
      const info = makeInfo();

      registry.warn(info);
      registry.reset();
      const emitted = registry.warn(info);

      expect(emitted).toBe(true);
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('setHandler', () => {
    it('should replace the handler', () => {
      const first = vi.fn();
      const second = vi.fn();
      const registry = new DeprecationRegistry(first);

      registry.setHandler(second);
      registry.warn(makeInfo());

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledOnce();
      expect(registry.handler).toBe(second);
    });
  });
});

// ---------------------------------------------------------------------------
// emitDeprecationWarning (global registry helper)
// ---------------------------------------------------------------------------

describe('emitDeprecationWarning', () => {
  afterEach(() => {
    globalDeprecationRegistry.reset();
    globalDeprecationRegistry.setHandler(defaultDeprecationHandler);
    globalDeprecationRegistry.setEnabled(true);
  });

  it('should emit via the global registry', () => {
    const handler = vi.fn();
    globalDeprecationRegistry.setHandler(handler);

    const emitted = emitDeprecationWarning(makeInfo({ name: 'globalTest' }));

    expect(emitted).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('should de-duplicate via the global registry', () => {
    const handler = vi.fn();
    globalDeprecationRegistry.setHandler(handler);

    emitDeprecationWarning(makeInfo({ name: 'globalDupe' }));
    const second = emitDeprecationWarning(makeInfo({ name: 'globalDupe' }));

    expect(second).toBe(false);
    expect(handler).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// deprecatedFunction
// ---------------------------------------------------------------------------

describe('deprecatedFunction', () => {
  it('should call the original function and return its result', () => {
    const original = (a: number, b: number): number => a + b;
    const registry = new DeprecationRegistry(vi.fn());
    const wrapped = deprecatedFunction(original, makeInfo(), registry);

    const result = wrapped(3, 4);

    expect(result).toBe(7);
  });

  it('should emit a deprecation warning on first call', () => {
    const handler = vi.fn();
    const registry = new DeprecationRegistry(handler);
    const info = makeInfo({ name: 'oldFn' });
    const wrapped = deprecatedFunction(() => {}, info, registry);

    wrapped();

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(info);
  });

  it('should only warn once across multiple calls', () => {
    const handler = vi.fn();
    const registry = new DeprecationRegistry(handler);
    const wrapped = deprecatedFunction(() => {}, makeInfo(), registry);

    wrapped();
    wrapped();
    wrapped();

    expect(handler).toHaveBeenCalledOnce();
  });

  it('should preserve the original function name', () => {
    function myOriginal() {}
    const wrapped = deprecatedFunction(myOriginal, makeInfo(), new DeprecationRegistry(vi.fn()));
    expect(wrapped.name).toBe('myOriginal');
  });

  it('should preserve the original function length', () => {
    function twoArgs(_a: string, _b: number) {}
    const wrapped = deprecatedFunction(twoArgs, makeInfo(), new DeprecationRegistry(vi.fn()));
    expect(wrapped.length).toBe(2);
  });

  it('should preserve `this` context', () => {
    const obj = {
      value: 42,
      getValue(this: { value: number }): number {
        return this.value;
      },
    };
    const registry = new DeprecationRegistry(vi.fn());
    obj.getValue = deprecatedFunction(obj.getValue, makeInfo(), registry);

    expect(obj.getValue()).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// deprecated (method decorator)
// ---------------------------------------------------------------------------

describe('deprecated (method decorator)', () => {
  it('should emit a warning when the decorated method is called', () => {
    const handler = vi.fn();
    const registry = new DeprecationRegistry(handler);
    const info = makeInfo({ name: 'MyClass.old' });

    class MyClass {
      @deprecated(info, registry)
      old(): string {
        return 'result';
      }
    }

    const instance = new MyClass();
    const result = instance.old();

    expect(result).toBe('result');
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(info);
  });

  it('should only warn once across multiple invocations', () => {
    const handler = vi.fn();
    const registry = new DeprecationRegistry(handler);

    class MyClass {
      @deprecated(makeInfo({ name: 'MyClass.repeat' }), registry)
      repeat(): void {}
    }

    const instance = new MyClass();
    instance.repeat();
    instance.repeat();
    instance.repeat();

    expect(handler).toHaveBeenCalledOnce();
  });

  it('should preserve method arguments and return value', () => {
    const registry = new DeprecationRegistry(vi.fn());

    class Calculator {
      @deprecated(makeInfo({ name: 'Calculator.add' }), registry)
      add(a: number, b: number): number {
        return a + b;
      }
    }

    const calc = new Calculator();
    expect(calc.add(5, 3)).toBe(8);
  });

  it('should preserve `this` context inside the method', () => {
    const registry = new DeprecationRegistry(vi.fn());

    class Greeter {
      readonly greeting = 'hello';

      @deprecated(makeInfo({ name: 'Greeter.greet' }), registry)
      greet(): string {
        return this.greeting;
      }
    }

    expect(new Greeter().greet()).toBe('hello');
  });
});
