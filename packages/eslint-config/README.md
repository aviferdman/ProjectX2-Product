# @crewspace/eslint-config

Shareable ESLint flat config for Crewspace projects. Enforces TypeScript best practices for agent orchestration — async correctness, type safety, and clean code patterns.

## Installation

```bash
npm install --save-dev @crewspace/eslint-config eslint typescript
```

## Quick Start

```js
// eslint.config.mjs
import { crewspaceConfig } from '@crewspace/eslint-config';

export default crewspaceConfig();
```

## Options

```js
export default crewspaceConfig({
  // Enable stricter rules (unsafe type checks, exhaustive switches)
  strict: true,

  // TypeScript project for type-aware rules (default: auto-detect)
  project: './tsconfig.json',

  // Root directory for project resolution
  tsconfigRootDir: import.meta.dirname,

  // Custom file patterns (default: ['**/*.ts'])
  files: ['src/**/*.ts'],

  // Extra ignore patterns
  ignores: ['generated/**'],

  // Relax rules for test files (default: true)
  testOverrides: true,

  // Custom test file patterns
  testFiles: ['**/*.test.ts', '**/*.spec.ts'],
});
```

## Individual Configs

For advanced composition, import configs individually:

```js
import { ignores, recommended, strict, testOverrides } from '@crewspace/eslint-config';

export default [
  ...ignores(),
  ...recommended({ project: true }),
  ...strict({}),
  ...testOverrides(),
];
```

## What's Included

### Recommended (default)

- ESLint recommended rules
- TypeScript recommended + stylistic type-checked rules
- **Async correctness**: `no-floating-promises`, `no-misused-promises`, `await-thenable`, `require-await`
- **Type safety**: `explicit-function-return-type`, `no-unused-vars`, `prefer-readonly`
- **Naming conventions**: camelCase variables, PascalCase types, UPPER_CASE enum members
- **Best practices**: `eqeqeq`, `no-eval`, `prefer-const`, `no-var`

### Strict (opt-in)

- All `strictTypeChecked` rules
- `no-unsafe-*` rules (assignment, call, member access, return, argument)
- `strict-boolean-expressions` — prevents truthy/falsy surprises
- `switch-exhaustiveness-check` — exhaustive switches for agent status enums
- `only-throw-error` — agents must throw proper Error objects

### Test Overrides (default: on)

Relaxes strict typing rules in test files so you can use mocks, `any`, and loose assertions freely.

## License

MIT
