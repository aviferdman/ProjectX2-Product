# @crewspace/tools-file

> File tools for Crewspace agents — read, write, and list files with sandbox safety.

Part of the [Crewspace](https://github.com/aviferdman/ProjectX2-Product) agent orchestration framework.

## Installation

```bash
npm install @crewspace/tools-file
```

## Usage

```typescript
import { createFileTools } from '@crewspace/tools-file';

// Create all file tools with a sandbox base path
const tools = createFileTools({ basePath: '/workspace/project' });

// Register with an agent
agent.addTool(tools.readFile);
agent.addTool(tools.writeFile);
agent.addTool(tools.listFiles);
```

### Individual Tools

```typescript
import {
  createReadFileTool,
  createWriteFileTool,
  createListFilesTool,
} from '@crewspace/tools-file';

const readFile = createReadFileTool('/workspace');
const writeFile = createWriteFileTool('/workspace');
const listFiles = createListFilesTool('/workspace');
```

## API

### `createFileTools(options?)`

Creates a bundle of all file tools.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `basePath` | `string` | `process.cwd()` | Sandbox root for file operations |

### Tools

- **readFile** — Read file contents (max 10 MB)
- **writeFile** — Write content to a file (max 10 MB)
- **listFiles** — List directory entries with glob pattern support

## License

MIT
