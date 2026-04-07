import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Crewspace',
  description:
    'TypeScript-native agent orchestration framework with visual canvas',
  base: '/',

  // Existing docs reference files outside the docs directory (examples/, README)
  ignoreDeadLinks: [/\.\.\/examples/, /\.\.\/README/],

  head: [
    ['meta', { name: 'theme-color', content: '#3178C6' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:site_name', content: 'Crewspace' }],
  ],

  themeConfig: {
    logo: undefined,

    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'API Reference', link: '/api-reference' },
      {
        text: 'GitHub',
        link: 'https://github.com/aviferdman/ProjectX2-Product',
      },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Crewspace?', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
        ],
      },
      {
        text: 'Guide',
        items: [
          { text: 'Core Concepts', link: '/guide/core-concepts' },
          { text: 'Architecture Deep Dive', link: '/guide/architecture' },
          { text: 'Agents', link: '/guide/agents' },
          { text: 'Tasks & Crews', link: '/guide/tasks-and-crews' },
          { text: 'Tool System', link: '/guide/tools' },
          { text: 'LLM Providers', link: '/guide/llm-providers' },
        ],
      },
      {
        text: 'Comparisons',
        items: [
          { text: 'Framework Comparison', link: '/guide/comparison' },
          {
            text: 'Migrating from LangChain',
            link: '/guide/migration-langchain',
          },
        ],
      },
      {
        text: 'Policies',
        items: [
          { text: 'Deprecation Policy', link: '/guide/deprecation-policy' },
        ],
      },
      {
        text: 'Performance',
        items: [
          { text: 'Performance Metrics', link: '/guide/performance-metrics' },
          { text: 'Benchmarks', link: '/guide/benchmarks' },
        ],
      },
      {
        text: 'Reference',
        items: [{ text: 'API Reference', link: '/api-reference' }],
      },
    ],

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/aviferdman/ProjectX2-Product',
      },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern:
        'https://github.com/aviferdman/ProjectX2-Product/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 Crewspace Contributors',
    },
  },
});
