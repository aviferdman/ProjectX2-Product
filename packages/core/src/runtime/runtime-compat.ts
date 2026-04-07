/**
 * Runtime compatibility detection and validation for Crewspace.
 *
 * Provides utilities to detect the current JavaScript runtime (Node.js, Bun,
 * Deno) and verify that required platform APIs are available. Crewspace
 * requires Node.js ≥ 18.0.0 or a Bun/Deno version that provides equivalent
 * Web-standard and Node-compat APIs.
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported JavaScript runtimes. */
export type RuntimeName = 'node' | 'bun' | 'deno' | 'unknown';

/** Parsed runtime version (major.minor.patch). */
export interface RuntimeVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly raw: string;
}

/** Result of a single API compatibility check. */
export interface CompatCheck {
  /** Human-readable name of the API being checked (e.g. "fetch"). */
  readonly name: string;
  /** Whether the API is available in the current runtime. */
  readonly available: boolean;
  /** If unavailable, a hint on how to polyfill or upgrade. */
  readonly hint?: string;
}

/** Full compatibility report for the current runtime. */
export interface CompatReport {
  /** Detected runtime name. */
  readonly runtime: RuntimeName;
  /** Detected runtime version, or `null` if unknown. */
  readonly version: RuntimeVersion | null;
  /** Whether the runtime meets all requirements. */
  readonly compatible: boolean;
  /** Individual API checks. */
  readonly checks: readonly CompatCheck[];
  /** Human-readable summary string. */
  readonly summary: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum supported Node.js major version. */
export const MIN_NODE_MAJOR = 18;

/**
 * APIs required by Crewspace core that are globally available in Node ≥ 18
 * and Bun ≥ 1.0.
 */
export const REQUIRED_GLOBALS = [
  'AbortController',
  'AbortSignal',
  'URL',
  'URLSearchParams',
  'TextEncoder',
  'TextDecoder',
  'structuredClone',
  'queueMicrotask',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
] as const;

/**
 * APIs that should be available globally in Node ≥ 18 (via `--experimental-fetch`
 * which became stable in 18.0) and Bun.
 */
export const REQUIRED_WEB_GLOBALS = [
  'fetch',
  'Request',
  'Response',
  'Headers',
] as const;

// ---------------------------------------------------------------------------
// Detection helpers
// ---------------------------------------------------------------------------

/**
 * Detect the current JavaScript runtime.
 *
 * Detection order: Bun → Deno → Node → unknown.
 */
export function detectRuntime(): RuntimeName {
  /* eslint-disable @typescript-eslint/no-unnecessary-condition */
  // Bun sets the global `Bun` object.
  if (typeof globalThis !== 'undefined' && 'Bun' in globalThis) {
    return 'bun';
  }
  // Deno sets the global `Deno` object.
  if (typeof globalThis !== 'undefined' && 'Deno' in globalThis) {
    return 'deno';
  }
  // Node.js sets `process.versions.node`.
  if (
    typeof process !== 'undefined' &&
    process.versions != null &&
    typeof process.versions['node'] === 'string'
  ) {
    return 'node';
  }
  return 'unknown';
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */
}

/**
 * Parse a semver-ish version string (e.g. "20.11.1") into structured parts.
 * Returns `null` if the string cannot be parsed.
 */
export function parseVersion(raw: string): RuntimeVersion | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(raw);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    raw,
  };
}

/**
 * Get the version of the current runtime.
 *
 * - **Node.js** – `process.versions.node`
 * - **Bun** – `process.versions.bun` (Bun emulates the Node `process` object)
 * - **Deno** – `Deno.version.deno`
 */
export function getRuntimeVersion(): RuntimeVersion | null {
  const runtime = detectRuntime();

  switch (runtime) {
    case 'bun': {
      const raw =
        typeof process !== 'undefined' && process.versions != null
          ? (process.versions as Record<string, string | undefined>)['bun']
          : undefined;
      return raw ? parseVersion(raw) : null;
    }
    case 'deno': {
      const raw = (globalThis as Record<string, unknown>)['Deno'];
      if (raw && typeof raw === 'object' && 'version' in raw) {
        const ver = (raw as { version: Record<string, string> }).version;
        return parseVersion(ver['deno'] ?? '');
      }
      return null;
    }
    case 'node': {
      const raw = process.versions['node'];
      return raw ? parseVersion(raw) : null;
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Compatibility checking
// ---------------------------------------------------------------------------

/** Check whether a named global is available. */
function checkGlobal(name: string, hint?: string): CompatCheck {
  const available = typeof globalThis !== 'undefined' && name in globalThis;
  return {
    name,
    available,
    hint: available ? undefined : (hint ?? `Global "${name}" is not available. Upgrade your runtime.`),
  };
}

/**
 * Check whether the current Node.js version meets the minimum requirement.
 * Always passes for non-Node runtimes (they have their own checks).
 */
function checkNodeVersion(version: RuntimeVersion | null): CompatCheck {
  const runtime = detectRuntime();
  if (runtime !== 'node') {
    return { name: `Node.js >= ${MIN_NODE_MAJOR}`, available: true };
  }
  if (!version) {
    return {
      name: `Node.js >= ${MIN_NODE_MAJOR}`,
      available: false,
      hint: 'Could not determine Node.js version.',
    };
  }
  const ok = version.major >= MIN_NODE_MAJOR;
  return {
    name: `Node.js >= ${MIN_NODE_MAJOR}`,
    available: ok,
    hint: ok
      ? undefined
      : `Node.js ${version.raw} is below the minimum required version ${MIN_NODE_MAJOR}.0.0.`,
  };
}

/** Check that ESM (`import.meta`) works. */
function checkESM(): CompatCheck {
  // Use indirect eval to check import.meta at runtime without a compile-time
  // syntax error when this file is compiled to CommonJS.
  let available = false;
  try {
    // eslint-disable-next-line no-eval
    available = eval("typeof import.meta !== 'undefined' && import.meta.url != null") === true;
  } catch {
    // import.meta is not available in CommonJS context
  }
  return {
    name: 'ESM (import.meta)',
    available,
    hint: available ? undefined : 'ES Module support is required.',
  };
}

/** Check for `node:` prefixed module availability (Node ≥ 16, Bun ≥ 1). */
function checkNodeProtocol(): CompatCheck {
  try {
    // Dynamic import of node:path to test the protocol.
    // We don't actually need the module; we're checking the protocol works.
    // Since this is a sync check, we test via `process.versions` as a proxy:
    // if we're on Node >= 16 or Bun, the protocol is supported.
    const runtime = detectRuntime();
    const available = runtime === 'node' || runtime === 'bun';
    return {
      name: 'node: protocol imports',
      available,
      hint: available
        ? undefined
        : 'node: protocol imports are required for built-in file tools.',
    };
  } catch {
    return {
      name: 'node: protocol imports',
      available: false,
      hint: 'node: protocol imports are not available.',
    };
  }
}

/**
 * Run all compatibility checks and return a detailed report.
 *
 * This is the primary entry point for consumers who want to verify their
 * environment before using Crewspace.
 */
export function checkCompatibility(): CompatReport {
  const runtime = detectRuntime();
  const version = getRuntimeVersion();

  const checks: CompatCheck[] = [
    checkNodeVersion(version),
    checkESM(),
    checkNodeProtocol(),
    ...REQUIRED_GLOBALS.map((name) => checkGlobal(name)),
    ...REQUIRED_WEB_GLOBALS.map((name) =>
      checkGlobal(name, `Global "${name}" is not available. Node.js >= 18 provides this natively.`),
    ),
  ];

  const compatible = checks.every((c) => c.available);

  const failing = checks.filter((c) => !c.available);
  const summary = compatible
    ? `Crewspace is compatible with ${runtime} ${version?.raw ?? '(unknown version)'}.`
    : `Crewspace is NOT compatible: ${failing.map((c) => c.name).join(', ')} — ${failing.length} check(s) failed.`;

  return { runtime, version, compatible, checks, summary };
}

/**
 * Assert that the current runtime is compatible. Throws an `Error` with
 * a descriptive message if any check fails.
 */
export function assertCompatible(): void {
  const report = checkCompatibility();
  if (!report.compatible) {
    const details = report.checks
      .filter((c) => !c.available)
      .map((c) => `  - ${c.name}: ${c.hint ?? 'unavailable'}`)
      .join('\n');
    throw new Error(
      `Runtime compatibility check failed for ${report.runtime} ${report.version?.raw ?? '(unknown)'}:\n${details}`,
    );
  }
}
