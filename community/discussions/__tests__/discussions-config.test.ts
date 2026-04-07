import { describe, it, expect } from 'vitest';
import {
  DISCUSSIONS_CONFIG,
  DISCUSSION_CATEGORIES,
  MODERATION_SETTINGS,
  CONTACT_LINKS,
  getCategoryNames,
  getCategorySlugs,
  getCategoriesByFormat,
  getAllLabels,
  getCategoryBySlug,
  validateSlug,
  validateNoDuplicateCategories,
  validateTemplateFiles,
  validateDiscussionsConfig,
  type DiscussionsConfig,
} from '../discussions-config.js';

// ── Default config validity ────────────────────────────────────────

describe('DISCUSSIONS_CONFIG (default)', () => {
  it('passes full validation', () => {
    const result = validateDiscussionsConfig(DISCUSSIONS_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('has a valid repository URL', () => {
    expect(DISCUSSIONS_CONFIG.repositoryUrl).toContain('github.com');
  });

  it('has at least one category', () => {
    expect(DISCUSSION_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('includes a Q&A category with question-answer format', () => {
    const qa = DISCUSSION_CATEGORIES.find((c) => c.slug === 'q-a');
    expect(qa).toBeDefined();
    expect(qa!.format).toBe('question-answer');
  });

  it('has moderation settings with allowed reactions', () => {
    expect(MODERATION_SETTINGS.allowedReactions.length).toBeGreaterThan(0);
  });

  it('has at least one contact link', () => {
    expect(CONTACT_LINKS.length).toBeGreaterThan(0);
  });

  it('has pinned discussions defined', () => {
    expect(MODERATION_SETTINGS.pinnedDiscussions.length).toBeGreaterThan(0);
  });
});

// ── validateSlug ───────────────────────────────────────────────────

describe('validateSlug', () => {
  it('accepts a valid slug', () => {
    expect(validateSlug('q-a').valid).toBe(true);
  });

  it('accepts a single word slug', () => {
    expect(validateSlug('general').valid).toBe(true);
  });

  it('accepts a multi-segment slug', () => {
    expect(validateSlug('show-and-tell').valid).toBe(true);
  });

  it('rejects an empty slug', () => {
    const result = validateSlug('');
    expect(result.valid).toBe(false);
    expect(result.issue).toContain('empty');
  });

  it('rejects slugs with uppercase letters', () => {
    const result = validateSlug('Q-A');
    expect(result.valid).toBe(false);
  });

  it('rejects slugs with leading hyphens', () => {
    const result = validateSlug('-general');
    expect(result.valid).toBe(false);
  });

  it('rejects slugs with trailing hyphens', () => {
    const result = validateSlug('general-');
    expect(result.valid).toBe(false);
  });

  it('rejects slugs with consecutive hyphens', () => {
    const result = validateSlug('show--tell');
    expect(result.valid).toBe(false);
  });

  it('rejects slugs with special characters', () => {
    const result = validateSlug('q&a');
    expect(result.valid).toBe(false);
  });
});

// ── validateNoDuplicateCategories ──────────────────────────────────

describe('validateNoDuplicateCategories', () => {
  it('passes when there are no duplicates', () => {
    const result = validateNoDuplicateCategories(DISCUSSIONS_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.duplicates).toHaveLength(0);
  });

  it('detects duplicate category slugs', () => {
    const config: DiscussionsConfig = {
      ...DISCUSSIONS_CONFIG,
      categories: [DISCUSSION_CATEGORIES[0]!, DISCUSSION_CATEGORIES[0]!],
    };
    const result = validateNoDuplicateCategories(config);
    expect(result.valid).toBe(false);
    expect(result.duplicates.length).toBeGreaterThan(0);
  });
});

// ── validateTemplateFiles ──────────────────────────────────────────

describe('validateTemplateFiles', () => {
  it('passes for the default config', () => {
    const result = validateTemplateFiles(DISCUSSIONS_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('rejects empty template file names', () => {
    const config: DiscussionsConfig = {
      ...DISCUSSIONS_CONFIG,
      categories: [
        {
          ...DISCUSSION_CATEGORIES[0]!,
          templateFile: '',
        },
      ],
    };
    const result = validateTemplateFiles(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('template'))).toBe(true);
  });

  it('rejects non-YAML template files', () => {
    const config: DiscussionsConfig = {
      ...DISCUSSIONS_CONFIG,
      categories: [
        {
          ...DISCUSSION_CATEGORIES[0]!,
          templateFile: 'template.json',
        },
      ],
    };
    const result = validateTemplateFiles(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('.yml'))).toBe(true);
  });
});

// ── validateDiscussionsConfig (integration) ────────────────────────

describe('validateDiscussionsConfig', () => {
  it('reports missing repository URL', () => {
    const config: DiscussionsConfig = {
      ...DISCUSSIONS_CONFIG,
      repositoryUrl: '',
    };
    const result = validateDiscussionsConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('Repository URL'))).toBe(true);
  });

  it('reports empty categories', () => {
    const config: DiscussionsConfig = {
      ...DISCUSSIONS_CONFIG,
      categories: [],
    };
    const result = validateDiscussionsConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('category'))).toBe(true);
  });

  it('reports category with empty name', () => {
    const config: DiscussionsConfig = {
      ...DISCUSSIONS_CONFIG,
      categories: [
        {
          ...DISCUSSION_CATEGORIES[0]!,
          name: '  ',
        },
      ],
    };
    const result = validateDiscussionsConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('name'))).toBe(true);
  });

  it('reports category with no description', () => {
    const config: DiscussionsConfig = {
      ...DISCUSSIONS_CONFIG,
      categories: [
        {
          ...DISCUSSION_CATEGORIES[0]!,
          description: '',
        },
      ],
    };
    const result = validateDiscussionsConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('description'))).toBe(true);
  });

  it('reports category with no emoji', () => {
    const config: DiscussionsConfig = {
      ...DISCUSSIONS_CONFIG,
      categories: [
        {
          ...DISCUSSION_CATEGORIES[0]!,
          emoji: '',
        },
      ],
    };
    const result = validateDiscussionsConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('emoji'))).toBe(true);
  });

  it('reports category with no labels', () => {
    const config: DiscussionsConfig = {
      ...DISCUSSIONS_CONFIG,
      categories: [
        {
          ...DISCUSSION_CATEGORIES[0]!,
          labels: [],
        },
      ],
    };
    const result = validateDiscussionsConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('labels'))).toBe(true);
  });

  it('reports category with no welcome message', () => {
    const config: DiscussionsConfig = {
      ...DISCUSSIONS_CONFIG,
      categories: [
        {
          ...DISCUSSION_CATEGORIES[0]!,
          welcomeMessage: '',
        },
      ],
    };
    const result = validateDiscussionsConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('welcome message'))).toBe(true);
  });

  it('reports empty moderation reactions', () => {
    const config: DiscussionsConfig = {
      ...DISCUSSIONS_CONFIG,
      moderation: {
        ...MODERATION_SETTINGS,
        allowedReactions: [],
      },
    };
    const result = validateDiscussionsConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('reaction'))).toBe(true);
  });

  it('reports contact link with no name', () => {
    const config: DiscussionsConfig = {
      ...DISCUSSIONS_CONFIG,
      contactLinks: [{ name: '', url: 'https://example.com', about: 'Example' }],
    };
    const result = validateDiscussionsConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('name'))).toBe(true);
  });

  it('reports contact link with no URL', () => {
    const config: DiscussionsConfig = {
      ...DISCUSSIONS_CONFIG,
      contactLinks: [{ name: 'Test', url: '', about: 'Example' }],
    };
    const result = validateDiscussionsConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('URL'))).toBe(true);
  });
});

// ── Helpers ────────────────────────────────────────────────────────

describe('getCategoryNames', () => {
  it('returns all category names', () => {
    const names = getCategoryNames(DISCUSSIONS_CONFIG);
    expect(names).toContain('Q&A');
    expect(names).toContain('Ideas');
    expect(names).toContain('Show & Tell');
    expect(names).toContain('General');
    expect(names.length).toBe(DISCUSSION_CATEGORIES.length);
  });
});

describe('getCategorySlugs', () => {
  it('returns all category slugs', () => {
    const slugs = getCategorySlugs(DISCUSSIONS_CONFIG);
    expect(slugs).toContain('q-a');
    expect(slugs).toContain('ideas');
    expect(slugs).toContain('show-and-tell');
    expect(slugs).toContain('general');
  });
});

describe('getCategoriesByFormat', () => {
  it('filters question-answer categories', () => {
    const qa = getCategoriesByFormat(DISCUSSIONS_CONFIG, 'question-answer');
    expect(qa.length).toBeGreaterThan(0);
    for (const cat of qa) {
      expect(cat.format).toBe('question-answer');
    }
  });

  it('filters open categories', () => {
    const open = getCategoriesByFormat(DISCUSSIONS_CONFIG, 'open');
    expect(open.length).toBeGreaterThan(0);
    for (const cat of open) {
      expect(cat.format).toBe('open');
    }
  });
});

describe('getAllLabels', () => {
  it('includes labels from all categories', () => {
    const labels = getAllLabels(DISCUSSIONS_CONFIG);
    expect(labels.has('question')).toBe(true);
    expect(labels.has('idea')).toBe(true);
    expect(labels.has('showcase')).toBe(true);
    expect(labels.has('discussion')).toBe(true);
  });

  it('deduplicates labels', () => {
    const config: DiscussionsConfig = {
      ...DISCUSSIONS_CONFIG,
      categories: [
        { ...DISCUSSION_CATEGORIES[0]!, labels: ['same'] },
        { ...DISCUSSION_CATEGORIES[1]!, labels: ['same'] },
      ],
    };
    const labels = getAllLabels(config);
    expect(labels.size).toBe(1);
  });
});

describe('getCategoryBySlug', () => {
  it('finds a category by slug', () => {
    const category = getCategoryBySlug(DISCUSSIONS_CONFIG, 'q-a');
    expect(category).toBeDefined();
    expect(category!.name).toBe('Q&A');
  });

  it('returns undefined for unknown slug', () => {
    const category = getCategoryBySlug(DISCUSSIONS_CONFIG, 'nonexistent');
    expect(category).toBeUndefined();
  });
});
