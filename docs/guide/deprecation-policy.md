# Deprecation Policy

Crewspace follows a structured deprecation policy to evolve its public API while giving consumers time to migrate. This page covers the full lifecycle of a breaking change — from the initial deprecation notice to final removal.

## Guiding Principles

1. **No surprise removals** — Every breaking change goes through a deprecation period before removal.
2. **Runtime warnings** — Deprecated APIs emit a console warning the first time they are called, so issues surface during development.
3. **Clear migration path** — Every deprecation notice includes a replacement API or migration instructions.
4. **Semantic Versioning alignment** — Removals only happen in major version bumps (post-1.0) or minor bumps (pre-1.0), never in patches.

## Versioning & Breaking Changes

Crewspace follows [Semantic Versioning 2.0.0](https://semver.org/):

| Version range | Breaking changes allowed in | Deprecation removal in |
|---|---|---|
| **Pre-1.0** (`0.x.y`) | Minor bumps (`0.x+1.0`) | Next minor bump after deprecation |
| **Post-1.0** (`≥ 1.0.0`) | Major bumps only (`x+1.0.0`) | Next major bump after deprecation |

### Pre-1.0 policy

While Crewspace is pre-1.0, the API is still stabilizing. Breaking changes may land in minor releases (e.g., `0.2.0 → 0.3.0`), but they **must** still go through a deprecation cycle of at least one minor release:

```
0.2.0  — API deprecated with runtime warning
0.3.0  — Deprecated API removed
```

### Post-1.0 policy

After 1.0, deprecated APIs remain available for at least **one full major version cycle** before removal:

```
1.x.0  — API deprecated with runtime warning
2.0.0  — Earliest version where the deprecated API may be removed
```

## Deprecation Lifecycle

Every deprecation follows these stages:

### Stage 1 — Announce

- Add a `@deprecated` JSDoc tag to the API.
- Integrate the deprecation utilities to emit a runtime warning (see [Using the Deprecation Utilities](#using-the-deprecation-utilities) below).
- Document the deprecation in `CHANGELOG.md` under the **Deprecated** category.
- Add migration instructions to the changelog entry or a migration guide.

### Stage 2 — Warn

- The deprecated API continues to work normally.
- A runtime warning is emitted **once per process** the first time the API is called, including:
  - The name of the deprecated API
  - The version in which it was deprecated
  - The version in which it will be removed
  - The suggested replacement

### Stage 3 — Remove

- Remove the deprecated API in the appropriate version (see [Versioning & Breaking Changes](#versioning--breaking-changes)).
- Document the removal in `CHANGELOG.md` under the **Removed** category.
- If the replacement API was introduced alongside the deprecation, it should be stable by the time the old API is removed.

## Using the Deprecation Utilities

Crewspace provides built-in deprecation utilities in `@crewspace/core` to standardize runtime warnings.

### Imperative warning

Use `emitDeprecationWarning` for one-off deprecation checks inside a function body:

```typescript
import { emitDeprecationWarning } from '@crewspace/core';

function oldHelper(input: string): string {
  emitDeprecationWarning({
    name: 'oldHelper',
    message: 'This helper has been replaced.',
    since: '0.2.0',
    removeIn: '0.3.0',
    replacement: 'newHelper',
  });
  return newHelper(input);
}
```

### Function wrapper

Use `deprecatedFunction` to wrap a function so the warning is emitted automatically:

```typescript
import { deprecatedFunction } from '@crewspace/core';

const legacyParse = deprecatedFunction(
  originalParse,
  {
    name: 'legacyParse',
    message: 'Parsing API redesigned.',
    since: '0.3.0',
    removeIn: '0.4.0',
    replacement: 'parse',
  },
);
```

### Method decorator

Use the `@deprecated` decorator on class methods:

```typescript
import { deprecated } from '@crewspace/core';

class MyService {
  @deprecated({
    name: 'MyService.oldMethod',
    message: 'Use newMethod instead.',
    since: '0.2.0',
    removeIn: '0.3.0',
    replacement: 'MyService.newMethod',
  })
  oldMethod(): void {
    // original implementation
  }

  newMethod(): void {
    // replacement implementation
  }
}
```

### Custom registries

For libraries built on Crewspace that need their own deprecation tracking, create a dedicated `DeprecationRegistry`:

```typescript
import { DeprecationRegistry } from '@crewspace/core';

const myLibDeprecations = new DeprecationRegistry();

// Optionally set a custom handler
myLibDeprecations.setHandler((info) => {
  myLogger.warn(`Deprecated: ${info.name} — ${info.message}`);
});
```

## DeprecationInfo Fields

Every deprecation notice uses the `DeprecationInfo` interface:

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | ✅ | Identifier of the deprecated API (e.g., `"Agent.execute"`) |
| `message` | `string` | ✅ | Human-readable explanation of the deprecation |
| `since` | `string` | ✅ | Version in which the API was first deprecated |
| `removeIn` | `string` | ❌ | Version in which the API will be removed |
| `replacement` | `string` | ❌ | Suggested replacement API |

## Changelog Conventions

Deprecations and removals must be documented in `CHANGELOG.md` using [Keep a Changelog](https://keepachangelog.com/) categories:

- **Deprecated** — for newly deprecated APIs. Include the replacement and target removal version.
- **Removed** — for APIs that have been removed after their deprecation period.

Example entries:

```markdown
## [0.3.0]

### Deprecated
- `oldHelper()` is deprecated in favor of `newHelper()`. Will be removed in 0.4.0.

### Removed
- `legacyParse()` has been removed. Use `parse()` instead (deprecated since 0.2.0).
```

## Checklist for Maintainers

When deprecating an API:

- [ ] Add `@deprecated` JSDoc tag with migration instructions
- [ ] Integrate runtime warning using `emitDeprecationWarning`, `deprecatedFunction`, or `@deprecated` decorator
- [ ] Set `since` to the current release version
- [ ] Set `removeIn` to the planned removal version
- [ ] Set `replacement` to the new API name (if applicable)
- [ ] Add a **Deprecated** entry in `CHANGELOG.md`
- [ ] Update any documentation referencing the deprecated API

When removing a deprecated API:

- [ ] Verify the deprecation has been in place for at least one version cycle
- [ ] Remove the deprecated code
- [ ] Add a **Removed** entry in `CHANGELOG.md`
- [ ] Update the migration guide if needed
- [ ] Remove any related deprecation warning code

## Suppressing Warnings

In test suites or CI environments where deprecation warnings add noise, you can suppress them:

```typescript
import { globalDeprecationRegistry } from '@crewspace/core';

// Disable all warnings
globalDeprecationRegistry.setEnabled(false);

// Or redirect to a custom handler
globalDeprecationRegistry.setHandler(() => {
  // silenced
});

// Re-enable after tests
globalDeprecationRegistry.setEnabled(true);
globalDeprecationRegistry.reset();
```

## Summary

| Aspect | Policy |
|---|---|
| **Minimum deprecation period (pre-1.0)** | One minor version |
| **Minimum deprecation period (post-1.0)** | One major version |
| **Runtime warning** | Emitted once per process via `DeprecationRegistry` |
| **Required fields** | `name`, `message`, `since` |
| **Changelog tracking** | Deprecated / Removed categories |
| **SemVer compliance** | Removals never in patch releases |
