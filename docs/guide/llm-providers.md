# LLM Providers

Crewspace is provider-agnostic. Swap LLM backends without changing agent code.

## Supported Providers

| Provider | Class | Factory |
|----------|-------|---------|
| OpenAI | `OpenAIProvider` | `createOpenAIProvider()` |
| Anthropic | `AnthropicProvider` | `createAnthropicProvider()` |
| Ollama | `OllamaProvider` | `createOllamaProvider()` |

## Usage

### OpenAI

```typescript
import { createOpenAIProvider } from '@crewspace/core';

const llm = createOpenAIProvider({
  modelId: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY!,
});
```

### Anthropic

```typescript
import { createAnthropicProvider } from '@crewspace/core';

const claude = createAnthropicProvider({
  modelId: 'claude-sonnet-4-20250514',
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
```

### Ollama (Local)

```typescript
import { createOllamaProvider } from '@crewspace/core';

const local = createOllamaProvider({ modelId: 'llama3' });
```

## Resilience Decorators

Wrap any provider with resilience features:

### Retry with Backoff

```typescript
import { createRetryProvider } from '@crewspace/core';

const resilient = createRetryProvider(llm, {
  maxRetries: 3,
  baseDelay: 1000,
  backoffMultiplier: 2,
});
```

### Fallback Chains

```typescript
import { createFallbackProvider } from '@crewspace/core';

const withFallback = createFallbackProvider(llm, [claude, local]);
```

### Usage Tracking

```typescript
import { createUsageTrackingProvider } from '@crewspace/core';

const tracked = createUsageTrackingProvider(llm);
const usage = tracked.getUsage();
```

## Streaming

Streaming providers implement `generateStream()` returning an `AsyncIterable<LLMStreamChunk>`:

```typescript
const provider = createOpenAIProvider({ modelId: 'gpt-4o', apiKey: '...' });

const stream = await provider.generateStream({
  messages: [{ role: 'user', content: 'Hello!' }],
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

## Custom Providers

Implement the `LLMProvider` interface to create custom providers:

```typescript
import type { LLMProvider, LLMRequest, LLMResponse } from '@crewspace/core';

class CustomProvider implements LLMProvider {
  readonly id = 'custom';
  readonly modelId = 'my-model';

  async generateText(request: LLMRequest): Promise<LLMResponse> {
    // Your implementation
    return { content: '...', usage: { inputTokens: 0, outputTokens: 0 } };
  }
}
```
