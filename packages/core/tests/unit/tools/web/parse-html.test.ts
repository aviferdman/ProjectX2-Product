import { describe, expect, it } from 'vitest';

import { ToolExecutionError } from '../../../../src/errors/tool-errors.js';
import {
  createParseHtmlTool,
  decodeHtmlEntities,
  extractLinks,
  extractMetadata,
  extractTitle,
  stripTags,
} from '../../../../src/tools/web/parse-html.js';
import { ToolCategory } from '../../../../src/types/tool.js';

// ---------------------------------------------------------------------------
// Utility function tests
// ---------------------------------------------------------------------------

describe('stripTags', () => {
  it('should strip simple HTML tags', () => {
    expect(stripTags('<p>Hello</p>')).toBe('Hello');
  });

  it('should remove script blocks', () => {
    expect(stripTags('<script>alert("x")</script>Text')).toBe('Text');
  });

  it('should remove style blocks', () => {
    expect(stripTags('<style>.a{color:red}</style>Text')).toBe('Text');
  });

  it('should handle nested tags', () => {
    expect(stripTags('<div><span>Hello</span> <b>world</b></div>')).toBe('Hello world');
  });

  it('should collapse whitespace', () => {
    expect(stripTags('  <p>  Hello   world  </p>  ')).toBe('Hello world');
  });

  it('should return empty string for empty input', () => {
    expect(stripTags('')).toBe('');
  });

  it('should handle plain text without tags', () => {
    expect(stripTags('Just plain text')).toBe('Just plain text');
  });
});

describe('decodeHtmlEntities', () => {
  it('should decode &amp;', () => {
    expect(decodeHtmlEntities('&amp;')).toBe('&');
  });

  it('should decode &lt; and &gt;', () => {
    expect(decodeHtmlEntities('&lt;div&gt;')).toBe('<div>');
  });

  it('should decode &quot;', () => {
    expect(decodeHtmlEntities('&quot;hello&quot;')).toBe('"hello"');
  });

  it('should decode &#39;', () => {
    expect(decodeHtmlEntities("it&#39;s")).toBe("it's");
  });

  it('should decode &nbsp;', () => {
    expect(decodeHtmlEntities('hello&nbsp;world')).toBe('hello world');
  });

  it('should decode numeric entities', () => {
    expect(decodeHtmlEntities('&#65;')).toBe('A');
    expect(decodeHtmlEntities('&#8212;')).toBe('—');
  });

  it('should handle multiple entities in one string', () => {
    expect(decodeHtmlEntities('&lt;a href=&quot;url&quot;&gt;')).toBe('<a href="url">');
  });

  it('should leave text without entities unchanged', () => {
    expect(decodeHtmlEntities('plain text')).toBe('plain text');
  });
});

describe('extractTitle', () => {
  it('should extract title from well-formed HTML', () => {
    expect(extractTitle('<html><head><title>My Page</title></head></html>')).toBe('My Page');
  });

  it('should return empty string when no title', () => {
    expect(extractTitle('<html><head></head></html>')).toBe('');
  });

  it('should decode entities in title', () => {
    expect(extractTitle('<title>A &amp; B</title>')).toBe('A & B');
  });

  it('should trim whitespace in title', () => {
    expect(extractTitle('<title>  Hello  </title>')).toBe('Hello');
  });
});

describe('extractLinks', () => {
  it('should extract links from HTML', () => {
    const html = '<a href="https://example.com">Example</a>';
    const links = extractLinks(html);
    expect(links).toHaveLength(1);
    expect(links[0]).toEqual({ text: 'Example', href: 'https://example.com' });
  });

  it('should extract multiple links', () => {
    const html = '<a href="/a">A</a> <a href="/b">B</a>';
    const links = extractLinks(html);
    expect(links).toHaveLength(2);
    expect(links[0]?.href).toBe('/a');
    expect(links[1]?.href).toBe('/b');
  });

  it('should strip tags from link text', () => {
    const html = '<a href="/x"><b>Bold</b> text</a>';
    const links = extractLinks(html);
    expect(links[0]?.text).toBe('Bold text');
  });

  it('should decode entities in href', () => {
    const html = '<a href="/path?a=1&amp;b=2">Link</a>';
    const links = extractLinks(html);
    expect(links[0]?.href).toBe('/path?a=1&b=2');
  });

  it('should skip links with empty href', () => {
    const html = '<a href="">Empty</a>';
    const links = extractLinks(html);
    expect(links).toHaveLength(0);
  });

  it('should return empty array when no links', () => {
    expect(extractLinks('<p>No links here</p>')).toEqual([]);
  });

  it('should handle single and double quotes in href', () => {
    const html1 = '<a href="https://a.com">A</a>';
    const html2 = "<a href='https://b.com'>B</a>";
    expect(extractLinks(html1)).toHaveLength(1);
    expect(extractLinks(html2)).toHaveLength(1);
  });
});

describe('extractMetadata', () => {
  it('should extract title and description', () => {
    const html = `
      <html>
        <head>
          <title>Test Page</title>
          <meta name="description" content="A test page">
        </head>
      </html>
    `;
    const meta = extractMetadata(html);
    expect(meta.title).toBe('Test Page');
    expect(meta.description).toBe('A test page');
  });

  it('should extract multiple meta tags', () => {
    const html = `
      <meta name="author" content="John">
      <meta name="keywords" content="test,page">
    `;
    const meta = extractMetadata(html);
    expect(meta.meta['author']).toBe('John');
    expect(meta.meta['keywords']).toBe('test,page');
  });

  it('should handle property attribute (OpenGraph)', () => {
    const html = '<meta property="og:title" content="OG Title">';
    const meta = extractMetadata(html);
    expect(meta.meta['og:title']).toBe('OG Title');
  });

  it('should return empty strings when no metadata', () => {
    const meta = extractMetadata('<html><body></body></html>');
    expect(meta.title).toBe('');
    expect(meta.description).toBe('');
    expect(Object.keys(meta.meta)).toHaveLength(0);
  });

  it('should decode entities in meta content', () => {
    const html = '<meta name="description" content="A &amp; B">';
    const meta = extractMetadata(html);
    expect(meta.description).toBe('A & B');
  });

  it('should handle reverse attribute order (content before name)', () => {
    const html = '<meta content="Reversed Value" name="reversed-key">';
    const meta = extractMetadata(html);
    expect(meta.meta['reversed-key']).toBe('Reversed Value');
  });

  it('should handle reverse attribute order with property attribute', () => {
    const html = '<meta content="OG Reversed" property="og:reversed">';
    const meta = extractMetadata(html);
    expect(meta.meta['og:reversed']).toBe('OG Reversed');
  });

  it('should not overwrite existing key from first pass with reverse pattern', () => {
    // Both tags are captured by the first regex pass. The second tag overwrites the first.
    // The second-pass regex guards against overwriting with !(key in meta).
    const html = `
      <meta name="author" content="First">
      <meta content="Second" name="author">
    `;
    const meta = extractMetadata(html);
    // The first pass captures both since it matches all <meta> tags
    expect(meta.meta['author']).toBe('Second');
  });

  it('should handle meta tag with empty content value', () => {
    const html = '<meta name="robots" content="">';
    const meta = extractMetadata(html);
    expect(meta.meta['robots']).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Tool tests
// ---------------------------------------------------------------------------

describe('createParseHtmlTool', () => {
  it('should create a tool with correct metadata', () => {
    const tool = createParseHtmlTool();
    expect(tool.name).toBe('parseHtml');
    expect(tool.description).toContain('Parse');
    expect(tool.category).toBe(ToolCategory.WEB);
    expect(tool.permissions).toEqual([]);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('should extract text from HTML', async () => {
    const tool = createParseHtmlTool();
    const result = (await tool.execute({
      html: '<p>Hello <b>world</b></p>',
      extract: 'text',
    })) as { text: string };

    expect(result.text).toContain('Hello');
    expect(result.text).toContain('world');
    expect(result.text).not.toContain('<');
  });

  it('should extract links from HTML', async () => {
    const tool = createParseHtmlTool();
    const result = (await tool.execute({
      html: '<a href="https://example.com">Example</a>',
      extract: 'links',
    })) as { links: Array<{ text: string; href: string }> };

    expect(result.links).toHaveLength(1);
    expect(result.links[0]?.href).toBe('https://example.com');
  });

  it('should extract metadata from HTML', async () => {
    const tool = createParseHtmlTool();
    const result = (await tool.execute({
      html: '<title>Test</title><meta name="description" content="Desc">',
      extract: 'metadata',
    })) as { metadata: { title: string; description: string } };

    expect(result.metadata.title).toBe('Test');
    expect(result.metadata.description).toBe('Desc');
  });

  it('should throw on empty html', async () => {
    const tool = createParseHtmlTool();
    await expect(tool.execute({ html: '', extract: 'text' })).rejects.toThrow(
      ToolExecutionError,
    );
  });

  it('should throw on missing html', async () => {
    const tool = createParseHtmlTool();
    await expect(tool.execute({ extract: 'text' })).rejects.toThrow(ToolExecutionError);
  });

  it('should throw on invalid extract mode', async () => {
    const tool = createParseHtmlTool();
    await expect(tool.execute({ html: '<p>test</p>', extract: 'invalid' })).rejects.toThrow(
      "must be one of",
    );
  });

  it('should throw on missing extract mode', async () => {
    const tool = createParseHtmlTool();
    await expect(tool.execute({ html: '<p>test</p>' })).rejects.toThrow(ToolExecutionError);
  });

  it('should handle complex HTML for text extraction', async () => {
    const tool = createParseHtmlTool();
    const html = `
      <html>
        <head><title>Test</title></head>
        <body>
          <script>var x = 1;</script>
          <style>.a { color: red; }</style>
          <h1>Title</h1>
          <p>Paragraph with <a href="#">link</a></p>
        </body>
      </html>
    `;
    const result = (await tool.execute({ html, extract: 'text' })) as { text: string };
    expect(result.text).toContain('Title');
    expect(result.text).toContain('Paragraph');
    expect(result.text).toContain('link');
    expect(result.text).not.toContain('var x');
    expect(result.text).not.toContain('color: red');
  });
});
