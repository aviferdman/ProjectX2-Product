# @crewspace/prettier-config

Shareable Prettier config for Crewspace projects. Enforces consistent formatting across agent orchestration codebases — single quotes, trailing commas, 2-space indentation, and 100-char line width.

## Installation

```bash
npm install --save-dev @crewspace/prettier-config prettier
```

## Quick Start

Reference the package directly in your `package.json`:

```json
{
  "prettier": "@crewspace/prettier-config"
}
```

Or create a `.prettierrc.mjs` file:

```js
import config from '@crewspace/prettier-config';

export default config;
```

## Customization

Use `createConfig()` to override specific options while keeping Crewspace defaults:

```js
// .prettierrc.mjs
import { createConfig } from '@crewspace/prettier-config';

export default createConfig({
  printWidth: 120,
  tabWidth: 4,
});
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `semi` | `boolean` | `true` | Print semicolons at ends of statements |
| `singleQuote` | `boolean` | `true` | Use single quotes instead of double |
| `trailingComma` | `"all" \| "es5" \| "none"` | `"all"` | Trailing commas in multi-line structures |
| `printWidth` | `number` | `100` | Line width before wrapping |
| `tabWidth` | `number` | `2` | Spaces per indentation level |
| `useTabs` | `boolean` | `false` | Indent with tabs |
| `bracketSpacing` | `boolean` | `true` | Spaces in object literal braces |
| `arrowParens` | `"always" \| "avoid"` | `"always"` | Parens around sole arrow function param |
| `endOfLine` | `"lf" \| "crlf" \| "cr" \| "auto"` | `"lf"` | Line ending style |
| `overrides` | `Partial<Options>` | — | Additional Prettier options (for plugins etc.) |

## Ignore Patterns

The package also exports recommended ignore patterns:

```js
import { DEFAULT_IGNORE_PATTERNS } from '@crewspace/prettier-config';

// ['dist', 'node_modules', 'coverage', 'package-lock.json', '*.md']
console.log(DEFAULT_IGNORE_PATTERNS);
```

Use these in your `.prettierignore` file or pass to Prettier's CLI.

## What's Configured

The Crewspace Prettier config enforces:

- **Single quotes** — consistent with TypeScript ecosystem conventions
- **Trailing commas** (`all`) — cleaner git diffs when adding items
- **100-char line width** — readable without excessive wrapping
- **2-space indentation** — TypeScript community standard
- **LF line endings** — cross-platform consistency in git repos
- **Semicolons** — explicit statement termination
- **Always arrow parens** — consistent `(x) => x` style
- **Bracket spacing** — `{ foo }` not `{foo}`

## License

MIT
