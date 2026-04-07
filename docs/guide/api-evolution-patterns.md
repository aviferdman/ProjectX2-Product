# API Evolution Patterns

This guide documents safe patterns for evolving the Crewspace public API without breaking existing consumers. Use these patterns when adding features, refactoring internals, or deprecating old interfaces.

## Core Principle

Every public API change must be **backward-compatible** within a semver-appropriate release. Breaking changes require a deprecation cycle (see [Deprecation Policy](./deprecation-policy.md)).

---

## Pattern 1: Additive Configuration

**Goal:** Add new options to an existing config object without breaking callers who don't pass the new fields.

### ✅ Safe — Optional properties with defaults

```typescript
// v0.1.0 — original config
interface AgentConfig {
  id: string;
  role: string;
  goal: string;
}

// v0.2.0 — add optional field with a sensible default
interface AgentConfig {
  id: string;
  role: string;
  goal: string;
  maxRetries?: number; // defaults to 3 if omitted
}
```

Existing callers that omit `maxRetries` continue to work because the field is optional and handled with a default internally:

```typescript
const retries = config.maxRetries ?? 3;
```

### ❌ Unsafe — Required properties

```typescript
// BREAKING: callers that don't pass `maxRetries` will get type errors
interface AgentConfig {
  id: string;
  role: string;
  goal: string;
  maxRetries: number; // required — breaks existing code
}
```

---

## Pattern 2: Function Overloading

**Goal:** Extend a function's accepted inputs without changing the return type for existing callers.

### ✅ Safe — Accept broader input via union types

```typescript
// v0.1.0
function createTool(name: string, handler: ToolHandler): Tool;

// v0.2.0 — also accept a config object
function createTool(config: ToolConfig): Tool;
function createTool(nameOrConfig: string | ToolConfig, handler?: ToolHandler): Tool {
  const config = typeof nameOrConfig === 'string'
    ? { name: nameOrConfig, handler: handler! }
    : nameOrConfig;
  // ...implementation
}
```

### ❌ Unsafe — Changing parameter order or removing overloads

```typescript
// BREAKING: old callers passing (string, handler) now get errors
function createTool(config: ToolConfig): Tool;
```

---

## Pattern 3: Wrapper-Based Deprecation

**Goal:** Replace an old API with a new one while keeping the old API functional during the deprecation period.

### ✅ Safe — Use `deprecatedFunction` wrapper

```typescript
import { deprecatedFunction } from '@crewspace/core';

// New implementation
function parseConfig(input: string): Config {
  // improved parsing logic
}

// Old API wraps the new one with a deprecation warning
const legacyParse = deprecatedFunction(parseConfig, {
  name: 'legacyParse',
  message: 'Parsing has been redesigned for better error handling.',
  since: '0.2.0',
  removeIn: '0.3.0',
  replacement: 'parseConfig',
});

export { parseConfig, legacyParse };
```

Callers using `legacyParse` see a console warning once but their code continues working.

---

## Pattern 4: Rename via Re-export

**Goal:** Rename a public symbol without immediately breaking consumers.

### ✅ Safe — Export both names during transition

```typescript
// v0.2.0 — introduce the new name, keep the old name as deprecated
export { TaskRunner } from './task-runner.js';

// Deprecated alias — will be removed in v0.3.0
import { TaskRunner } from './task-runner.js';
import { deprecatedFunction } from './deprecation/index.js';

/** @deprecated Use `TaskRunner` instead. Will be removed in v0.3.0. */
export const TaskExecutor = deprecatedFunction(
  (...args: ConstructorParameters<typeof TaskRunner>) => new TaskRunner(...args),
  {
    name: 'TaskExecutor',
    message: 'Class has been renamed.',
    since: '0.2.0',
    removeIn: '0.3.0',
    replacement: 'TaskRunner',
  },
);
```

### ❌ Unsafe — Remove the old name immediately

```typescript
// BREAKING: callers importing TaskExecutor will fail
// export { TaskExecutor } — removed!
export { TaskRunner } from './task-runner.js';
```

---

## Pattern 5: Method Decorator Deprecation

**Goal:** Deprecate a class method while keeping it functional.

### ✅ Safe — Use `@deprecated` decorator

```typescript
import { deprecated } from '@crewspace/core';

class Agent {
  @deprecated({
    name: 'Agent.execute',
    message: 'Use Agent.run() for better streaming support.',
    since: '0.2.0',
    removeIn: '0.3.0',
    replacement: 'Agent.run',
  })
  async execute(input: string): Promise<string> {
    return this.run(input);
  }

  async run(input: string): Promise<string> {
    // new implementation with streaming
  }
}
```

---

## Pattern 6: Return Type Widening

**Goal:** Enrich what a function returns without breaking callers that use existing fields.

### ✅ Safe — Add optional fields to return type

```typescript
// v0.1.0
interface TaskResult {
  output: string;
  status: 'success' | 'error';
}

// v0.2.0 — add optional metadata without changing existing fields
interface TaskResult {
  output: string;
  status: 'success' | 'error';
  duration?: number;       // new — optional
  tokenUsage?: TokenUsage; // new — optional
}
```

### ❌ Unsafe — Remove or rename existing fields

```typescript
// BREAKING: callers accessing `output` will get undefined
interface TaskResult {
  result: string;  // renamed from `output`
  status: 'success' | 'error';
}
```

---

## Pattern 7: Event Type Extension

**Goal:** Add new event types to a typed event emitter.

### ✅ Safe — Extend the event map

```typescript
// v0.1.0
interface AgentEventMap {
  'agent:start': { taskId: string };
  'agent:complete': { taskId: string; output: string };
}

// v0.2.0 — add new event (does not affect existing listeners)
interface AgentEventMap {
  'agent:start': { taskId: string };
  'agent:complete': { taskId: string; output: string };
  'agent:retry': { taskId: string; attempt: number }; // new
}
```

### ❌ Unsafe — Change existing event payload shapes

```typescript
// BREAKING: listeners expecting { taskId: string } will break
interface AgentEventMap {
  'agent:start': { task: TaskConfig }; // was { taskId: string }
}
```

---

## Pattern 8: Enum / Union Extension

**Goal:** Add new variants to a status enum or union type.

### ✅ Safe — Add new members (if consumers handle unknown values)

```typescript
// v0.1.0
type TaskStatus = 'pending' | 'running' | 'done' | 'error';

// v0.2.0 — add 'cancelled'
type TaskStatus = 'pending' | 'running' | 'done' | 'error' | 'cancelled';
```

> **Note:** Adding enum members is safe for code that uses `default` / `else` branches. However, exhaustive `switch` statements without a `default` may trigger TypeScript errors. Document new variants clearly in the changelog.

---

## CI Enforcement

The Crewspace CI pipeline includes an automated semver compliance check that detects breaking changes in the public API surface. When a PR removes or changes an existing export:

1. The `semver:check` CI job compares current exports against the committed baseline.
2. If breaking changes are detected, the job fails.
3. To proceed, the developer must:
   - Bump the version appropriately (minor bump for pre-1.0, major for post-1.0).
   - Run `npm run semver:update` to regenerate the baseline.
   - Commit the updated baseline alongside the breaking change.

This ensures every breaking change is intentional, version-bumped, and documented.

```bash
# Check for breaking changes (CI mode)
npm run semver:check

# Regenerate baseline after an intentional breaking change
npm run semver:update
```

---

## Quick Reference

| Change type | Safe? | Action required |
|---|---|---|
| Add optional config field | ✅ Yes | None — provide a default |
| Add new export | ✅ Yes | None — additive |
| Add new event type | ✅ Yes | None — existing listeners unaffected |
| Add union variant | ⚠️ Mostly | Document in changelog |
| Remove an export | ❌ No | Deprecation cycle + version bump |
| Rename an export | ❌ No | Keep old name as deprecated alias |
| Change required fields | ❌ No | Add as optional first, require later |
| Change return type shape | ❌ No | Deprecation cycle on the function |
| Narrow accepted input types | ❌ No | Deprecation cycle |

## Further Reading

- [Deprecation Policy](./deprecation-policy.md) — Full lifecycle of a breaking change
- [Semantic Versioning 2.0.0](https://semver.org/) — The versioning specification
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — Commit conventions and versioning section
