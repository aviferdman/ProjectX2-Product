import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const docsRoot = resolve(__dirname, '..');

describe('VitePress docs site configuration', () => {
  it('should have a valid VitePress config file', async () => {
    const configPath = join(docsRoot, '.vitepress', 'config.mts');
    expect(existsSync(configPath)).toBe(true);

    const config = await import(configPath);
    const resolved = config.default;

    expect(resolved).toBeDefined();
    expect(resolved.title).toBe('Crewspace');
    expect(resolved.description).toContain('TypeScript');
  });

  it('should define nav items', async () => {
    const config = (await import(join(docsRoot, '.vitepress', 'config.mts')))
      .default;
    const nav = config.themeConfig?.nav;

    expect(nav).toBeDefined();
    expect(Array.isArray(nav)).toBe(true);
    expect(nav.length).toBeGreaterThanOrEqual(2);

    const navTexts = nav.map((item: { text: string }) => item.text);
    expect(navTexts).toContain('Guide');
    expect(navTexts).toContain('API Reference');
  });

  it('should define sidebar sections', async () => {
    const config = (await import(join(docsRoot, '.vitepress', 'config.mts')))
      .default;
    const sidebar = config.themeConfig?.sidebar;

    expect(sidebar).toBeDefined();
    expect(Array.isArray(sidebar)).toBe(true);
    expect(sidebar.length).toBeGreaterThanOrEqual(2);

    const sectionTexts = sidebar.map(
      (section: { text: string }) => section.text,
    );
    expect(sectionTexts).toContain('Introduction');
    expect(sectionTexts).toContain('Guide');
    expect(sectionTexts).toContain('Reference');
  });

  it('should enable local search', async () => {
    const config = (await import(join(docsRoot, '.vitepress', 'config.mts')))
      .default;
    expect(config.themeConfig?.search?.provider).toBe('local');
  });
});

describe('VitePress docs content', () => {
  it('should have an index page with frontmatter', () => {
    const indexPath = join(docsRoot, 'index.md');
    expect(existsSync(indexPath)).toBe(true);

    const content = readFileSync(indexPath, 'utf-8');
    expect(content).toContain('layout: home');
    expect(content).toContain('Crewspace');
    expect(content).toContain('features:');
  });

  it('should have a getting-started guide', () => {
    const filePath = join(docsRoot, 'getting-started.md');
    expect(existsSync(filePath)).toBe(true);

    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('Getting Started');
    expect(content).toContain('npm install');
  });

  it('should have an api-reference page', () => {
    const filePath = join(docsRoot, 'api-reference.md');
    expect(existsSync(filePath)).toBe(true);

    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('API Reference');
  });

  const guidePages = [
    { file: 'core-concepts.md', expectedContent: 'Core Concepts' },
    { file: 'architecture.md', expectedContent: 'Architecture Deep Dive' },
    { file: 'agents.md', expectedContent: 'Agents' },
    { file: 'tasks-and-crews.md', expectedContent: 'Tasks' },
    { file: 'tools.md', expectedContent: 'Tool System' },
    { file: 'llm-providers.md', expectedContent: 'LLM Providers' },
    { file: 'benchmarks.md', expectedContent: 'Benchmarks' },
    { file: 'comparison.md', expectedContent: 'Framework Comparison' },
    { file: 'performance-metrics.md', expectedContent: 'Performance Metrics Tracker' },
  ];

  guidePages.forEach(({ file, expectedContent }) => {
    it(`should have guide page: ${file}`, () => {
      const filePath = join(docsRoot, 'guide', file);
      expect(existsSync(filePath)).toBe(true);

      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain(expectedContent);
    });
  });
});

describe('VitePress docs sidebar links', () => {
  it('all sidebar links should point to existing docs files', async () => {
    const config = (await import(join(docsRoot, '.vitepress', 'config.mts')))
      .default;
    const sidebar = config.themeConfig?.sidebar;

    const links: string[] = [];
    for (const section of sidebar) {
      for (const item of section.items) {
        links.push(item.link);
      }
    }

    for (const link of links) {
      // VitePress links like '/getting-started' map to 'getting-started.md'
      const relativePath = link === '/' ? 'index.md' : `${link.slice(1)}.md`;
      const fullPath = join(docsRoot, relativePath);
      expect(
        existsSync(fullPath),
        `Sidebar link "${link}" should have corresponding file at ${relativePath}`,
      ).toBe(true);
    }
  });
});
