# @crewspace/cli

[![npm version](https://img.shields.io/npm/v/@crewspace/cli.svg)](https://www.npmjs.com/package/@crewspace/cli)
[![npm downloads](https://img.shields.io/npm/dm/@crewspace/cli.svg)](https://www.npmjs.com/package/@crewspace/cli)
[![license](https://img.shields.io/npm/l/@crewspace/cli.svg)](https://github.com/aviferdman/ProjectX2-Product/blob/main/LICENSE)

Command-line interface for [Crewspace](https://github.com/aviferdman/ProjectX2-Product) — scaffold, run, and validate multi-agent workflows in TypeScript.

## Installation

```bash
npm install -g @crewspace/cli
```

Or use directly with `npx`:

```bash
npx crewspace <command>
```

## Commands

### `crewspace run`

Run a Crewspace workflow from a configuration file.

```bash
crewspace run --config ./my-workflow.ts
```

### `crewspace validate`

Validate a workflow configuration file without executing it.

```bash
crewspace validate --config ./my-workflow.ts
```

### `crewspace init`

Scaffold a new Crewspace project.

```bash
crewspace init my-project
```

## Options

| Option | Description |
|--------|-------------|
| `--config, -c` | Path to workflow configuration file |
| `--verbose, -v` | Enable verbose output |
| `--quiet, -q` | Suppress non-essential output |
| `--log-level` | Set log level (debug, info, warn, error) |
| `--help, -h` | Show help |
| `--version` | Show version |

## Requirements

- Node.js >= 18.0.0
- `@crewspace/core` >= 0.1.0 (peer dependency)

## License

MIT — see [LICENSE](./LICENSE) for details.
