# Crewspace

**TypeScript-native agent orchestration framework with visual canvas.**

Build, debug, and deploy multi-agent workflows in under 5 minutes.

## Packages

| Package | Description |
|---------|-------------|
| [`@crewspace/core`](./packages/core) | Core agent orchestration framework |

## Getting Started

### Prerequisites

- Node.js 18+ (or Bun)
- npm 10+

### Install

```bash
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm run test
```

## Development

This is a monorepo managed with npm workspaces.

```
crewspace/
├── packages/
│   └── core/          # @crewspace/core — agent framework
├── package.json       # Root workspace config
├── tsconfig.base.json # Shared TypeScript config
└── tsconfig.json      # Project references
```

## License

[MIT](./LICENSE)
