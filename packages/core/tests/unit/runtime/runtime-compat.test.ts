import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  assertCompatible,
  checkCompatibility,
  detectRuntime,
  getRuntimeVersion,
  MIN_NODE_MAJOR,
  parseVersion,
  REQUIRED_GLOBALS,
  REQUIRED_WEB_GLOBALS,
} from '../../../src/runtime/runtime-compat.js';
import type {
  CompatCheck,
  CompatReport,
  RuntimeName,
  RuntimeVersion,
} from '../../../src/runtime/runtime-compat.js';

// ---------------------------------------------------------------------------
// parseVersion
// ---------------------------------------------------------------------------

describe('parseVersion', () => {
  it('should parse a simple semver string', () => {
    const v = parseVersion('20.11.1');
    expect(v).toEqual({ major: 20, minor: 11, patch: 1, raw: '20.11.1' });
  });

  it('should parse a version prefixed with "v"', () => {
    const v = parseVersion('v18.0.0');
    expect(v).toEqual({ major: 18, minor: 0, patch: 0, raw: 'v18.0.0' });
  });

  it('should parse a version with prerelease suffix', () => {
    const v = parseVersion('21.0.0-nightly.202301');
    expect(v).not.toBeNull();
    expect(v!.major).toBe(21);
    expect(v!.minor).toBe(0);
    expect(v!.patch).toBe(0);
  });

  it('should return null for empty string', () => {
    expect(parseVersion('')).toBeNull();
  });

  it('should return null for garbage input', () => {
    expect(parseVersion('not-a-version')).toBeNull();
  });

  it('should return null for partial version', () => {
    expect(parseVersion('18')).toBeNull();
    expect(parseVersion('18.0')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// detectRuntime
// ---------------------------------------------------------------------------

describe('detectRuntime', () => {
  it('should return a valid runtime name', () => {
    const runtime = detectRuntime();
    const validRuntimes: RuntimeName[] = ['node', 'bun', 'deno', 'unknown'];
    expect(validRuntimes).toContain(runtime);
  });

  it('should detect "node" in a standard Node.js environment', () => {
    // When running tests with vitest on Node.js, this should be 'node'
    // (unless running under Bun, in which case 'bun').
    const runtime = detectRuntime();
    expect(['node', 'bun']).toContain(runtime);
  });
});

// ---------------------------------------------------------------------------
// getRuntimeVersion
// ---------------------------------------------------------------------------

describe('getRuntimeVersion', () => {
  it('should return a non-null version in Node.js/Bun', () => {
    const version = getRuntimeVersion();
    expect(version).not.toBeNull();
    expect(version!.major).toBeGreaterThanOrEqual(1);
    expect(version!.raw).toBeTruthy();
  });

  it('should return a version that matches process.versions', () => {
    const runtime = detectRuntime();
    const version = getRuntimeVersion();
    if (runtime === 'node') {
      expect(version!.raw).toBe(process.versions['node']);
    } else if (runtime === 'bun') {
      const bunVersion = (process.versions as Record<string, string | undefined>)['bun'];
      expect(version!.raw).toBe(bunVersion);
    }
  });

  it('should have major >= MIN_NODE_MAJOR for Node.js', () => {
    const runtime = detectRuntime();
    if (runtime === 'node') {
      const version = getRuntimeVersion();
      expect(version!.major).toBeGreaterThanOrEqual(MIN_NODE_MAJOR);
    }
  });
});

// ---------------------------------------------------------------------------
// checkCompatibility
// ---------------------------------------------------------------------------

describe('checkCompatibility', () => {
  it('should return a CompatReport', () => {
    const report = checkCompatibility();
    expect(report).toHaveProperty('runtime');
    expect(report).toHaveProperty('version');
    expect(report).toHaveProperty('compatible');
    expect(report).toHaveProperty('checks');
    expect(report).toHaveProperty('summary');
    expect(typeof report.compatible).toBe('boolean');
    expect(Array.isArray(report.checks)).toBe(true);
  });

  it('should be compatible in the current environment', () => {
    const report = checkCompatibility();
    expect(report.compatible).toBe(true);
    expect(report.summary).toContain('compatible');
  });

  it('should include checks for all required globals', () => {
    const report = checkCompatibility();
    const checkedNames = report.checks.map((c) => c.name);
    for (const name of REQUIRED_GLOBALS) {
      expect(checkedNames).toContain(name);
    }
  });

  it('should include checks for all required web globals', () => {
    const report = checkCompatibility();
    const checkedNames = report.checks.map((c) => c.name);
    for (const name of REQUIRED_WEB_GLOBALS) {
      expect(checkedNames).toContain(name);
    }
  });

  it('should mark all required globals as available', () => {
    const report = checkCompatibility();
    for (const check of report.checks) {
      if ([...REQUIRED_GLOBALS, ...REQUIRED_WEB_GLOBALS].includes(check.name as never)) {
        expect(check.available).toBe(true);
      }
    }
  });

  it('should include Node.js version check', () => {
    const report = checkCompatibility();
    const versionCheck = report.checks.find((c) => c.name.startsWith('Node.js'));
    expect(versionCheck).toBeDefined();
    expect(versionCheck!.available).toBe(true);
  });

  it('should include ESM check', () => {
    const report = checkCompatibility();
    const esmCheck = report.checks.find((c) => c.name.includes('ESM'));
    expect(esmCheck).toBeDefined();
    expect(esmCheck!.available).toBe(true);
  });

  it('should include node: protocol check', () => {
    const report = checkCompatibility();
    const protocolCheck = report.checks.find((c) => c.name.includes('node:'));
    expect(protocolCheck).toBeDefined();
    expect(protocolCheck!.available).toBe(true);
  });

  it('checks should not have hints when available', () => {
    const report = checkCompatibility();
    for (const check of report.checks) {
      if (check.available) {
        expect(check.hint).toBeUndefined();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// assertCompatible
// ---------------------------------------------------------------------------

describe('assertCompatible', () => {
  it('should not throw in a compatible environment', () => {
    expect(() => assertCompatible()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Node.js 18+ / Bun API surface tests
//
// These tests directly exercise platform APIs that Crewspace depends on,
// ensuring they behave as expected across Node.js 18+ and Bun.
// ---------------------------------------------------------------------------

describe('Runtime API surface — globals', () => {
  it('AbortController creates signals and triggers abort', () => {
    const controller = new AbortController();
    expect(controller.signal.aborted).toBe(false);
    controller.abort('test reason');
    expect(controller.signal.aborted).toBe(true);
  });

  it('URL parses and reconstructs URLs', () => {
    const url = new URL('https://example.com:8080/path?q=1#hash');
    expect(url.hostname).toBe('example.com');
    expect(url.port).toBe('8080');
    expect(url.pathname).toBe('/path');
    expect(url.searchParams.get('q')).toBe('1');
    expect(url.hash).toBe('#hash');
  });

  it('URLSearchParams works', () => {
    const params = new URLSearchParams({ a: '1', b: '2' });
    expect(params.get('a')).toBe('1');
    params.set('c', '3');
    expect(params.has('c')).toBe(true);
  });

  it('TextEncoder / TextDecoder roundtrips', () => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const encoded = encoder.encode('hello 🌍');
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(decoder.decode(encoded)).toBe('hello 🌍');
  });

  it('structuredClone deep-clones objects', () => {
    const original = { a: 1, b: { c: [2, 3] } };
    const clone = structuredClone(original);
    expect(clone).toEqual(original);
    expect(clone).not.toBe(original);
    expect(clone.b).not.toBe(original.b);
  });

  it('queueMicrotask schedules a microtask', async () => {
    let called = false;
    queueMicrotask(() => {
      called = true;
    });
    // Microtasks fire before the next macro-task.
    await Promise.resolve();
    expect(called).toBe(true);
  });

  it('setTimeout / clearTimeout work', async () => {
    let fired = false;
    const timer = setTimeout(() => {
      fired = true;
    }, 5);
    clearTimeout(timer);
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
    expect(fired).toBe(false);
  });

  it('setInterval / clearInterval work', async () => {
    let count = 0;
    const id = setInterval(() => {
      count++;
    }, 5);
    await new Promise<void>((resolve) => setTimeout(resolve, 30));
    clearInterval(id);
    expect(count).toBeGreaterThan(0);
  });
});

describe('Runtime API surface — Web APIs', () => {
  it('fetch is a function', () => {
    expect(typeof fetch).toBe('function');
  });

  it('Request constructor works', () => {
    const req = new Request('https://example.com', { method: 'POST' });
    expect(req.method).toBe('POST');
    expect(req.url).toBe('https://example.com/');
  });

  it('Response constructor works', () => {
    const res = new Response('body', { status: 201 });
    expect(res.status).toBe(201);
  });

  it('Headers constructor works', () => {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    expect(headers.get('Content-Type')).toBe('application/json');
  });
});

describe('Runtime API surface — ES2022+ features', () => {
  it('Array.at() works', () => {
    expect([1, 2, 3].at(-1)).toBe(3);
  });

  it('Object.hasOwn() works', () => {
    expect(Object.hasOwn({ a: 1 }, 'a')).toBe(true);
    expect(Object.hasOwn({ a: 1 }, 'b')).toBe(false);
  });

  it('Error.cause is supported', () => {
    const cause = new Error('root');
    const wrapper = new Error('wrapped', { cause });
    expect(wrapper.cause).toBe(cause);
  });

  it('String.replaceAll() works', () => {
    expect('a-b-c'.replaceAll('-', '_')).toBe('a_b_c');
  });

  it('Promise.allSettled() works', async () => {
    const results = await Promise.allSettled([
      Promise.resolve(1),
      Promise.reject(new Error('fail')),
    ]);
    expect(results).toHaveLength(2);
    expect(results[0]!.status).toBe('fulfilled');
    expect(results[1]!.status).toBe('rejected');
  });

  it('top-level await is supported (import.meta exists)', () => {
    // If import.meta is defined, the runtime supports ES modules / top-level await.
    expect(import.meta).toBeDefined();
    expect(typeof import.meta.url).toBe('string');
  });

  it('WeakRef is available', () => {
    const obj = { data: 42 };
    const ref = new WeakRef(obj);
    expect(ref.deref()).toBe(obj);
  });

  it('FinalizationRegistry is available', () => {
    expect(typeof FinalizationRegistry).toBe('function');
  });
});

describe('Runtime API surface — Node.js built-in modules (node: protocol)', () => {
  it('node:path can be imported', async () => {
    const path = await import('node:path');
    expect(typeof path.join).toBe('function');
    expect(typeof path.resolve).toBe('function');
  });

  it('node:fs can be imported', async () => {
    const fs = await import('node:fs');
    expect(typeof fs.readFileSync).toBe('function');
  });

  it('node:fs/promises can be imported', async () => {
    const fsp = await import('node:fs/promises');
    expect(typeof fsp.readFile).toBe('function');
  });

  it('node:url can be imported', async () => {
    const url = await import('node:url');
    expect(typeof url.fileURLToPath).toBe('function');
  });

  it('node:crypto can be imported', async () => {
    const crypto = await import('node:crypto');
    expect(typeof crypto.randomUUID).toBe('function');
    // Verify it actually produces a UUID v4 format
    const uuid = crypto.randomUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('node:events can be imported', async () => {
    const events = await import('node:events');
    expect(typeof events.EventEmitter).toBe('function');
  });

  it('node:util can be imported', async () => {
    const util = await import('node:util');
    expect(typeof util.promisify).toBe('function');
  });
});

describe('Runtime API surface — Async/Concurrency patterns', () => {
  it('async generators work', async () => {
    async function* gen(): AsyncGenerator<number> {
      yield 1;
      yield 2;
      yield 3;
    }
    const values: number[] = [];
    for await (const v of gen()) {
      values.push(v);
    }
    expect(values).toEqual([1, 2, 3]);
  });

  it('Promise.any() resolves with first success', async () => {
    const result = await Promise.any([
      Promise.reject(new Error('fail')),
      Promise.resolve(42),
      Promise.resolve(99),
    ]);
    expect(result).toBe(42);
  });

  it('AbortSignal.timeout() creates a signal that aborts after duration', async () => {
    const signal = AbortSignal.timeout(50);
    expect(signal.aborted).toBe(false);
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    expect(signal.aborted).toBe(true);
  });

  it('AbortSignal.abort() creates a pre-aborted signal', () => {
    const signal = AbortSignal.abort('reason');
    expect(signal.aborted).toBe(true);
  });
});

describe('Runtime API surface — EventEmitter3 (cross-runtime)', () => {
  it('eventemitter3 works (used by Crewspace core)', async () => {
    const { EventEmitter } = await import('eventemitter3');
    const ee = new EventEmitter();
    const received: string[] = [];
    ee.on('msg', (data: string) => received.push(data));
    ee.emit('msg', 'hello');
    ee.emit('msg', 'world');
    expect(received).toEqual(['hello', 'world']);
  });
});

describe('Runtime API surface — Zod (cross-runtime)', () => {
  it('zod schema validation works', async () => {
    const { z } = await import('zod');
    const schema = z.object({ name: z.string(), age: z.number().min(0) });
    const valid = schema.safeParse({ name: 'Alice', age: 30 });
    expect(valid.success).toBe(true);
    const invalid = schema.safeParse({ name: 'Bob', age: -1 });
    expect(invalid.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Type-level checks (compile-time verification)
// ---------------------------------------------------------------------------

describe('Type exports', () => {
  it('RuntimeName type is correctly constrained', () => {
    const names: RuntimeName[] = ['node', 'bun', 'deno', 'unknown'];
    expect(names).toHaveLength(4);
  });

  it('RuntimeVersion type has expected shape', () => {
    const v: RuntimeVersion = { major: 20, minor: 0, patch: 0, raw: '20.0.0' };
    expect(v.major).toBe(20);
    expect(v.raw).toBe('20.0.0');
  });

  it('CompatCheck type has expected shape', () => {
    const check: CompatCheck = { name: 'test', available: true };
    expect(check.available).toBe(true);
    expect(check.hint).toBeUndefined();
  });

  it('CompatReport type has expected shape', () => {
    const report: CompatReport = {
      runtime: 'node',
      version: { major: 20, minor: 0, patch: 0, raw: '20.0.0' },
      compatible: true,
      checks: [],
      summary: 'ok',
    };
    expect(report.compatible).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('Constants', () => {
  it('MIN_NODE_MAJOR is 18', () => {
    expect(MIN_NODE_MAJOR).toBe(18);
  });

  it('REQUIRED_GLOBALS contains expected entries', () => {
    expect(REQUIRED_GLOBALS).toContain('AbortController');
    expect(REQUIRED_GLOBALS).toContain('structuredClone');
    expect(REQUIRED_GLOBALS).toContain('URL');
    expect(REQUIRED_GLOBALS).toContain('TextEncoder');
    expect(REQUIRED_GLOBALS).toContain('setTimeout');
  });

  it('REQUIRED_WEB_GLOBALS contains expected entries', () => {
    expect(REQUIRED_WEB_GLOBALS).toContain('fetch');
    expect(REQUIRED_WEB_GLOBALS).toContain('Request');
    expect(REQUIRED_WEB_GLOBALS).toContain('Response');
    expect(REQUIRED_WEB_GLOBALS).toContain('Headers');
  });
});
