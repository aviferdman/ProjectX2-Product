/**
 * Built-in parseHtml tool — extract text, links, or metadata from HTML.
 *
 * Uses lightweight regex-based parsing (no external DOM library required).
 *
 * @packageDocumentation
 */

import { ToolExecutionError } from '../../errors/tool-errors.js';
import type { Tool } from '../../types/tool.js';
import { ToolCategory } from '../../types/tool.js';
import type { ExtractedLink, HtmlMetadata, ParseHtmlInput, ParseHtmlOutput } from './types.js';

// ---------------------------------------------------------------------------
// Extraction utilities
// ---------------------------------------------------------------------------

/** Strip HTML tags and decode common entities, returning plain text. */
export function stripTags(html: string): string {
  let text = html;
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<[^>]+>/g, ' ');
  text = decodeHtmlEntities(text);
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

/** Decode common HTML entities. */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_match: string, code: string) => {
      const codePoint = parseInt(code, 10);
      return isNaN(codePoint) ? _match : String.fromCharCode(codePoint);
    });
}

/** Extract the page title from HTML. */
export function extractTitle(html: string): string {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? decodeHtmlEntities(match[1]?.trim() ?? '') : '';
}

/** Extract all `<a href="...">text</a>` links from HTML. */
export function extractLinks(html: string): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  const pattern = /<a\s[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    const href = (match[1] ?? '').trim();
    const text = stripTags(match[2] ?? '').trim();
    if (href) {
      links.push({ text, href: decodeHtmlEntities(href) });
    }
  }

  return links;
}

/** Extract metadata from HTML `<head>`. */
export function extractMetadata(html: string): HtmlMetadata {
  const title = extractTitle(html);

  const meta: Record<string, string> = {};
  const metaPattern = /<meta\s[^>]*>/gi;
  let metaMatch: RegExpExecArray | null;

  while ((metaMatch = metaPattern.exec(html)) !== null) {
    const tag = metaMatch[0];
    const nameAttr =
      /name=["']([^"']+)["']/i.exec(tag)?.[1] ??
      /property=["']([^"']+)["']/i.exec(tag)?.[1];
    const contentAttr = /content=["']([^"']*?)["']/i.exec(tag)?.[1];

    if (nameAttr && contentAttr !== undefined) {
      meta[nameAttr] = decodeHtmlEntities(contentAttr);
    }
  }

  // Handle reverse attribute order: content before name
  const metaPattern2 = /<meta\s[^>]*content\s*=\s*["']([^"']*)["'][^>]*(?:name|property)\s*=\s*["']([^"']*)["'][^>]*\/?>/gi;
  let match2: RegExpExecArray | null;
  while ((match2 = metaPattern2.exec(html)) !== null) {
    const value = match2[1];
    const key = match2[2];
    if (key !== undefined && value !== undefined && !(key in meta)) {
      meta[key] = decodeHtmlEntities(value);
    }
  }

  const description = meta['description'] ?? '';

  return { title, description, meta };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a parseHtml {@link Tool}.
 *
 * @returns A `Tool` instance that extracts text, links, or metadata from HTML
 */
export function createParseHtmlTool(): Tool {
  return {
    name: 'parseHtml',
    description: 'Parse HTML content and extract text, links, or metadata',
    category: ToolCategory.WEB,
    permissions: [],
    inputSchema: {
      type: 'object',
      properties: {
        html: { type: 'string', description: 'HTML content to parse' },
        extract: {
          type: 'string',
          description: 'What to extract: text, links, or metadata',
          enum: ['text', 'links', 'metadata'],
        },
      },
      required: ['html', 'extract'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Extracted plain text' },
        links: {
          type: 'array',
          description: 'Extracted links',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              href: { type: 'string' },
            },
          },
        },
        metadata: {
          type: 'object',
          description: 'Extracted metadata',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            meta: { type: 'object' },
          },
        },
      },
    },

    async execute(input: unknown): Promise<ParseHtmlOutput> {
      const { html, extract } = input as ParseHtmlInput;

      if (!html || typeof html !== 'string') {
        throw new ToolExecutionError('parseHtml', 'input.html must be a non-empty string');
      }

      if (!extract || !['text', 'links', 'metadata'].includes(extract)) {
        throw new ToolExecutionError(
          'parseHtml',
          "input.extract must be one of: 'text', 'links', 'metadata'",
        );
      }

      switch (extract) {
        case 'text':
          return { text: stripTags(html) };
        case 'links':
          return { links: extractLinks(html) };
        case 'metadata':
          return { metadata: extractMetadata(html) };
        default:
          throw new ToolExecutionError('parseHtml', `Unknown extract mode: ${extract as string}`);
      }
    },
  };
}
