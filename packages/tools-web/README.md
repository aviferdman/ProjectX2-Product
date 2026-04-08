# @crewspace/tools-web

> Web tools for Crewspace agents — fetch URLs, parse HTML, and search the web.

Part of the [Crewspace](https://github.com/aviferdman/ProjectX2-Product) agent orchestration framework.

## Installation

```bash
npm install @crewspace/tools-web
```

## Usage

```typescript
import { createWebTools } from '@crewspace/tools-web';

// Create all web tools with shared rate limiting
const tools = createWebTools();

// Register with an agent
agent.addTool(tools.fetchUrl);
agent.addTool(tools.parseHtml);
agent.addTool(tools.webSearch);
```

### Individual Tools

```typescript
import {
  createFetchUrlTool,
  createParseHtmlTool,
  createWebSearchTool,
} from '@crewspace/tools-web';

const fetchUrl = createFetchUrlTool({ timeoutMs: 10_000 });
const parseHtml = createParseHtmlTool();
const webSearch = createWebSearchTool();
```

### HTML Utilities

```typescript
import { stripTags, extractLinks, extractMetadata } from '@crewspace/tools-web';

const text = stripTags('<p>Hello <b>world</b></p>');
const links = extractLinks('<a href="/about">About</a>');
const meta = extractMetadata('<meta name="description" content="My site">');
```

## API

### `createWebTools(options?)`

Creates a bundle of all web tools with optional shared rate limiter.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rateLimit` | `RateLimiterConfig \| false` | `30 req/60s` | Rate limiting config |
| `userAgent` | `string` | `Crewspace/0.1.0` | User-Agent header |
| `timeoutMs` | `number` | `30000` | Request timeout |

### Tools

- **fetchUrl** — Fetch a URL via HTTP/HTTPS
- **parseHtml** — Parse HTML to extract text, links, or metadata
- **webSearch** — Search the web via DuckDuckGo

## License

MIT
