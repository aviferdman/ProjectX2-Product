# @crewspace/tools-shell

> Shell tools for Crewspace agents — execute commands with timeout and sandbox safety.

Part of the [Crewspace](https://github.com/aviferdman/ProjectX2-Product) agent orchestration framework.

## Installation

```bash
npm install @crewspace/tools-shell
```

## Usage

```typescript
import { createShellTools } from '@crewspace/tools-shell';

// Create shell tools with a sandbox base path
const tools = createShellTools({ basePath: '/workspace/project' });

// Register with an agent
agent.addTool(tools.shellExec);
```

### Individual Tools

```typescript
import { createShellExecTool } from '@crewspace/tools-shell';

const shellExec = createShellExecTool('/workspace');
```

### Destructive Command Detection

```typescript
import { checkDestructiveCommand, DESTRUCTIVE_PATTERNS } from '@crewspace/tools-shell';

const warning = checkDestructiveCommand('rm -rf /');
// Returns a warning string if the command matches known destructive patterns
```

## API

### `createShellTools(options?)`

Creates the shell tools bundle.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `basePath` | `string` | `process.cwd()` | Sandbox root for command execution |
| `defaultTimeoutMs` | `number` | `30000` | Default command timeout |

### Tools

- **shellExec** — Execute a shell command with timeout, sandbox, and output truncation

### Constants

- `DEFAULT_SHELL_TIMEOUT_MS` — 30,000 ms
- `MAX_SHELL_TIMEOUT_MS` — 300,000 ms (5 minutes)
- `MAX_OUTPUT_SIZE` — 1 MB

## License

MIT
