/**
 * Built-in webSearch tool — search the web using DuckDuckGo Instant Answer API.
 *
 * Uses the free DuckDuckGo API (no API key required, $0 budget).
 *
 * @packageDocumentation
 */

import { ToolExecutionError } from '../../errors/tool-errors.js';
import type { Tool } from '../../types/tool.js';
import { ToolCategory, ToolPermission } from '../../types/tool.js';
import type { SearchResult, WebSearchInput, WebSearchOutput } from './types.js';
import { DEFAULT_TIMEOUT_MS, DEFAULT_USER_AGENT, HARD_MAX_RESULTS } from './types.js';

// ---------------------------------------------------------------------------
// DuckDuckGo API types
// ---------------------------------------------------------------------------

const DDG_API_URL = 'https://api.duckduckgo.com/';

interface DdgRelatedTopic {
  readonly Text?: string;
  readonly FirstURL?: string;
  readonly Result?: string;
  readonly Topics?: readonly DdgRelatedTopic[];
  readonly Name?: string;
}

interface DdgApiResponse {
  readonly Abstract?: string;
  readonly AbstractText?: string;
  readonly AbstractURL?: string;
  readonly AbstractSource?: string;
  readonly Answer?: string;
  readonly AnswerType?: string;
  readonly Heading?: string;
  readonly RelatedTopics?: readonly DdgRelatedTopic[];
  readonly Results?: readonly DdgRelatedTopic[];
  readonly Definition?: string;
  readonly DefinitionURL?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractTitleFromResult(result: string): string {
  const match = /<a[^>]*>(.*?)<\/a>/i.exec(result);
  return match ? (match[1] ?? result) : result;
}

function extractResults(topics: readonly DdgRelatedTopic[]): SearchResult[] {
  const results: SearchResult[] = [];

  for (const topic of topics) {
    if (topic.Topics && topic.Topics.length > 0) {
      results.push(...extractResults(topic.Topics));
      continue;
    }

    if (topic.Text && topic.FirstURL) {
      results.push({
        title: extractTitleFromResult(topic.Result ?? topic.Text),
        url: topic.FirstURL,
        snippet: topic.Text,
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Options for creating a webSearch tool. */
export interface WebSearchToolOptions {
  /** Custom User-Agent header. */
  readonly userAgent?: string;
  /** Request timeout in milliseconds. */
  readonly timeoutMs?: number;
}

/**
 * Create a webSearch {@link Tool} using DuckDuckGo Instant Answer API.
 *
 * @param options - Optional configuration
 * @returns A `Tool` instance
 */
export function createWebSearchTool(options?: WebSearchToolOptions): Tool {
  const userAgent = options?.userAgent ?? DEFAULT_USER_AGENT;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return {
    name: 'webSearch',
    description: 'Search the web using DuckDuckGo and return results',
    category: ToolCategory.WEB,
    permissions: [ToolPermission.NETWORK],
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        maxResults: {
          type: 'number',
          description: `Max results to return (default: 10, max: ${String(HARD_MAX_RESULTS)})`,
        },
      },
      required: ['query'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query used' },
        results: {
          type: 'array',
          description: 'Search results',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              url: { type: 'string' },
              snippet: { type: 'string' },
            },
          },
        },
        count: { type: 'number', description: 'Number of results' },
      },
      required: ['query', 'results', 'count'],
    },

    async execute(input: unknown): Promise<WebSearchOutput> {
      const { query, maxResults = 10 } = input as WebSearchInput;

      if (!query || typeof query !== 'string') {
        throw new ToolExecutionError('webSearch', 'input.query must be a non-empty string');
      }

      const limit = Math.min(Math.max(1, maxResults), HARD_MAX_RESULTS);

      const params = new URLSearchParams({
        q: query,
        format: 'json',
        no_html: '1',
        skip_disambig: '1',
      });

      const url = `${DDG_API_URL}?${params.toString()}`;
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': userAgent },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new ToolExecutionError(
            'webSearch',
            `DuckDuckGo API returned status ${String(response.status)}`,
          );
        }

        const data = (await response.json()) as DdgApiResponse;

        const allResults = extractResults(data.RelatedTopics ?? []);

        // Prepend abstract as first result if available
        if (data.AbstractText && data.AbstractURL) {
          allResults.unshift({
            title: data.Heading ?? query,
            url: data.AbstractURL,
            snippet: data.AbstractText,
          });
        }

        const results = allResults.slice(0, limit);

        return { query, results, count: results.length };
      } catch (err: unknown) {
        if (err instanceof ToolExecutionError) throw err;

        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('abort')) {
          throw new ToolExecutionError(
            'webSearch',
            `Search timed out after ${String(timeoutMs)}ms`,
          );
        }
        throw new ToolExecutionError(
          'webSearch',
          `Web search failed: ${message}`,
          err instanceof Error ? err : undefined,
        );
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
