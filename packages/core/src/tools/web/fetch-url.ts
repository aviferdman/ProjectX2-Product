/**
 * Built-in fetchUrl tool — make HTTP/HTTPS requests.
 *
 * Uses the Node.js 18+ built-in `fetch` API (no external dependencies).
 *
 * @packageDocumentation
 */

import { ToolExecutionError } from '../../errors/tool-errors.js';
import type { Tool } from '../../types/tool.js';
import { ToolCategory, ToolPermission } from '../../types/tool.js';
import { parseToolInput } from '../../tool/validation.js';
import { FetchUrlInputSchema } from './schemas.js';
import type { FetchUrlOutput } from './types.js';
import { DEFAULT_TIMEOUT_MS, DEFAULT_USER_AGENT, MAX_RESPONSE_SIZE } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

function validateUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ToolExecutionError('fetchUrl', `Invalid URL: ${url}`);
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new ToolExecutionError(
      'fetchUrl',
      `Unsupported protocol "${parsed.protocol}". Only HTTP and HTTPS are allowed.`,
    );
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Options for creating a fetchUrl tool. */
export interface FetchUrlToolOptions {
  /** Custom User-Agent header. */
  readonly userAgent?: string;
  /** Default request timeout in milliseconds. */
  readonly timeoutMs?: number;
}

/**
 * Create a fetchUrl {@link Tool} for making HTTP requests.
 *
 * @param options - Optional configuration
 * @returns A `Tool` instance
 */
export function createFetchUrlTool(options?: FetchUrlToolOptions): Tool {
  const userAgent = options?.userAgent ?? DEFAULT_USER_AGENT;
  const defaultTimeout = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return {
    name: 'fetchUrl',
    description: 'Fetch a URL via HTTP/HTTPS and return the response body',
    category: ToolCategory.WEB,
    permissions: [ToolPermission.NETWORK],
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to fetch (http or https)' },
        method: {
          type: 'string',
          description: 'HTTP method (GET or HEAD)',
          enum: ['GET', 'HEAD'],
        },
        headers: {
          type: 'object',
          description: 'Additional request headers',
        },
        timeoutMs: {
          type: 'number',
          description: 'Request timeout in milliseconds',
        },
        maxSize: {
          type: 'number',
          description: 'Maximum response body size in bytes',
        },
      },
      required: ['url'],
    },
    inputZodSchema: FetchUrlInputSchema,
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'number', description: 'HTTP status code' },
        statusText: { type: 'string', description: 'HTTP status text' },
        body: { type: 'string', description: 'Response body' },
        contentType: { type: 'string', description: 'Content type' },
        url: { type: 'string', description: 'Final URL after redirects' },
        size: { type: 'number', description: 'Response body size in bytes' },
      },
      required: ['status', 'statusText', 'body', 'contentType', 'url', 'size'],
    },

    async execute(input: unknown): Promise<FetchUrlOutput> {
      const parsed = parseToolInput('fetchUrl', FetchUrlInputSchema, input);
      const {
        url,
        method,
        headers: requestHeaders,
        timeoutMs,
        maxSize,
      } = parsed;

      validateUrl(url);

      const timeout = timeoutMs ?? defaultTimeout;
      const maxBodySize = maxSize ?? MAX_RESPONSE_SIZE;
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort();
      }, timeout);

      try {
        const response = await fetch(url, {
          method,
          headers: {
            'User-Agent': userAgent,
            ...requestHeaders,
          },
          signal: controller.signal,
          redirect: 'follow',
        });

        const text = await response.text();
        const bodySize = Buffer.byteLength(text, 'utf-8');

        if (bodySize > maxBodySize) {
          throw new ToolExecutionError(
            'fetchUrl',
            `Response body (${String(bodySize)} bytes) exceeds maximum (${String(maxBodySize)} bytes)`,
          );
        }

        return {
          status: response.status,
          statusText: response.statusText,
          body: text,
          contentType: response.headers.get('content-type') ?? '',
          url: response.url,
          size: bodySize,
        };
      } catch (err: unknown) {
        if (err instanceof ToolExecutionError) throw err;

        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('abort')) {
          throw new ToolExecutionError('fetchUrl', `Request timed out after ${String(timeout)}ms`);
        }
        throw new ToolExecutionError(
          'fetchUrl',
          `HTTP request failed: ${message}`,
          err instanceof Error ? err : undefined,
        );
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
