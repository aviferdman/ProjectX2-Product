import { describe, it, expect } from 'vitest';
import {
  ACCOUNT_CONFIG,
  PROFILE,
  CONTENT_CATEGORIES,
  PINNED_TWEET,
  POSTING_SCHEDULE,
  GLOBAL_HASHTAGS,
  getAllHashtags,
  getCategoryNames,
  getCategoriesByFrequency,
  validateHandle,
  validateBio,
  validateHashtag,
  validatePostingSchedule,
  validateNoDuplicateCategories,
  validateAccountConfig,
  type TwitterAccountConfig,
  type PostingSchedule,
} from '../account-config.js';

// ── Default config validity ────────────────────────────────────────

describe('ACCOUNT_CONFIG (default)', () => {
  it('passes full validation', () => {
    const result = validateAccountConfig(ACCOUNT_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('has a valid handle', () => {
    expect(PROFILE.handle).toBe('@crewspace_dev');
    expect(validateHandle(PROFILE.handle).valid).toBe(true);
  });

  it('has a bio within 160 characters', () => {
    expect(PROFILE.bio.length).toBeLessThanOrEqual(160);
    expect(validateBio(PROFILE.bio).valid).toBe(true);
  });

  it('has at least one content category', () => {
    expect(CONTENT_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('has at least one global hashtag', () => {
    expect(GLOBAL_HASHTAGS.length).toBeGreaterThan(0);
  });

  it('has a non-empty pinned tweet template', () => {
    expect(PINNED_TWEET.template.length).toBeGreaterThan(0);
    expect(PINNED_TWEET.purpose.length).toBeGreaterThan(0);
  });

  it('has valid posting schedule', () => {
    expect(POSTING_SCHEDULE.maxPostsPerDay).toBeGreaterThan(0);
    expect(POSTING_SCHEDULE.preferredDays.length).toBeGreaterThan(0);
    expect(POSTING_SCHEDULE.preferredHoursUTC.length).toBeGreaterThan(0);
  });
});

// ── validateHandle ─────────────────────────────────────────────────

describe('validateHandle', () => {
  it('accepts a valid handle', () => {
    expect(validateHandle('@crewspace_dev').valid).toBe(true);
  });

  it('rejects handle without @', () => {
    const result = validateHandle('crewspace');
    expect(result.valid).toBe(false);
    expect(result.issue).toContain('@');
  });

  it('rejects empty name after @', () => {
    const result = validateHandle('@');
    expect(result.valid).toBe(false);
  });

  it('rejects handle longer than 15 characters', () => {
    const result = validateHandle('@abcdefghijklmnop');
    expect(result.valid).toBe(false);
    expect(result.issue).toContain('15');
  });

  it('rejects handle with invalid characters', () => {
    const result = validateHandle('@crew-space');
    expect(result.valid).toBe(false);
    expect(result.issue).toContain('letters');
  });

  it('accepts handle at exact 15-character limit', () => {
    expect(validateHandle('@abcdefghijklmno').valid).toBe(true);
  });
});

// ── validateBio ────────────────────────────────────────────────────

describe('validateBio', () => {
  it('accepts a valid bio', () => {
    expect(validateBio('A short bio.').valid).toBe(true);
  });

  it('rejects an empty bio', () => {
    const result = validateBio('');
    expect(result.valid).toBe(false);
    expect(result.issue).toContain('empty');
  });

  it('rejects a bio over 160 characters', () => {
    const result = validateBio('x'.repeat(161));
    expect(result.valid).toBe(false);
    expect(result.issue).toContain('160');
  });

  it('accepts a bio at exactly 160 characters', () => {
    expect(validateBio('x'.repeat(160)).valid).toBe(true);
  });
});

// ── validateHashtag ────────────────────────────────────────────────

describe('validateHashtag', () => {
  it('accepts a valid hashtag', () => {
    expect(validateHashtag('#TypeScript').valid).toBe(true);
  });

  it('rejects hashtag without #', () => {
    const result = validateHashtag('TypeScript');
    expect(result.valid).toBe(false);
    expect(result.issue).toContain('#');
  });

  it('rejects empty hashtag after #', () => {
    const result = validateHashtag('#');
    expect(result.valid).toBe(false);
    expect(result.issue).toContain('empty');
  });

  it('rejects hashtag with special characters', () => {
    const result = validateHashtag('#type-script');
    expect(result.valid).toBe(false);
    expect(result.issue).toContain('invalid');
  });

  it('accepts hashtag with underscores', () => {
    expect(validateHashtag('#AI_agents').valid).toBe(true);
  });
});

// ── validatePostingSchedule ────────────────────────────────────────

describe('validatePostingSchedule', () => {
  it('accepts a valid schedule', () => {
    const result = validatePostingSchedule(POSTING_SCHEDULE);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('rejects empty preferred days', () => {
    const schedule: PostingSchedule = {
      ...POSTING_SCHEDULE,
      preferredDays: [],
    };
    const result = validatePostingSchedule(schedule);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('day'))).toBe(true);
  });

  it('rejects invalid day names', () => {
    const schedule: PostingSchedule = {
      ...POSTING_SCHEDULE,
      preferredDays: ['Funday'],
    };
    const result = validatePostingSchedule(schedule);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('Funday'))).toBe(true);
  });

  it('rejects empty preferred hours', () => {
    const schedule: PostingSchedule = {
      ...POSTING_SCHEDULE,
      preferredHoursUTC: [],
    };
    const result = validatePostingSchedule(schedule);
    expect(result.valid).toBe(false);
  });

  it('rejects invalid hours', () => {
    const schedule: PostingSchedule = {
      ...POSTING_SCHEDULE,
      preferredHoursUTC: [25],
    };
    const result = validatePostingSchedule(schedule);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('25'))).toBe(true);
  });

  it('rejects negative hours', () => {
    const schedule: PostingSchedule = {
      ...POSTING_SCHEDULE,
      preferredHoursUTC: [-1],
    };
    const result = validatePostingSchedule(schedule);
    expect(result.valid).toBe(false);
  });

  it('rejects maxPostsPerDay less than 1', () => {
    const schedule: PostingSchedule = {
      ...POSTING_SCHEDULE,
      maxPostsPerDay: 0,
    };
    const result = validatePostingSchedule(schedule);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('maxPostsPerDay'))).toBe(true);
  });
});

// ── validateNoDuplicateCategories ──────────────────────────────────

describe('validateNoDuplicateCategories', () => {
  it('passes when there are no duplicates', () => {
    const result = validateNoDuplicateCategories(ACCOUNT_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.duplicates).toHaveLength(0);
  });

  it('detects duplicate category names', () => {
    const config: TwitterAccountConfig = {
      ...ACCOUNT_CONFIG,
      contentCategories: [CONTENT_CATEGORIES[0]!, CONTENT_CATEGORIES[0]!],
    };
    const result = validateNoDuplicateCategories(config);
    expect(result.valid).toBe(false);
    expect(result.duplicates).toContain('Release Announcements');
  });
});

// ── validateAccountConfig (integration) ────────────────────────────

describe('validateAccountConfig', () => {
  it('reports missing display name', () => {
    const config: TwitterAccountConfig = {
      ...ACCOUNT_CONFIG,
      profile: { ...PROFILE, displayName: '  ' },
    };
    const result = validateAccountConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('Display name'))).toBe(true);
  });

  it('reports missing URL', () => {
    const config: TwitterAccountConfig = {
      ...ACCOUNT_CONFIG,
      profile: { ...PROFILE, url: '' },
    };
    const result = validateAccountConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('URL'))).toBe(true);
  });

  it('reports empty content categories', () => {
    const config: TwitterAccountConfig = {
      ...ACCOUNT_CONFIG,
      contentCategories: [],
    };
    const result = validateAccountConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('content category'))).toBe(true);
  });

  it('reports empty pinned tweet purpose', () => {
    const config: TwitterAccountConfig = {
      ...ACCOUNT_CONFIG,
      pinnedTweet: { purpose: '', template: 'Hello!' },
    };
    const result = validateAccountConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('purpose'))).toBe(true);
  });

  it('reports empty pinned tweet template', () => {
    const config: TwitterAccountConfig = {
      ...ACCOUNT_CONFIG,
      pinnedTweet: { purpose: 'Test', template: '' },
    };
    const result = validateAccountConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('template'))).toBe(true);
  });

  it('reports category with no examples', () => {
    const config: TwitterAccountConfig = {
      ...ACCOUNT_CONFIG,
      contentCategories: [
        {
          name: 'Empty Category',
          description: 'No examples here',
          hashtags: ['#test'],
          frequency: 'weekly',
          examples: [],
        },
      ],
    };
    const result = validateAccountConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('example'))).toBe(true);
  });

  it('reports invalid global hashtags', () => {
    const config: TwitterAccountConfig = {
      ...ACCOUNT_CONFIG,
      globalHashtags: ['noHash'],
    };
    const result = validateAccountConfig(config);
    expect(result.valid).toBe(false);
  });
});

// ── Helpers ────────────────────────────────────────────────────────

describe('getAllHashtags', () => {
  it('includes global and category hashtags', () => {
    const tags = getAllHashtags(ACCOUNT_CONFIG);
    expect(tags.has('#crewspace')).toBe(true);
    expect(tags.has('#release')).toBe(true);
    expect(tags.has('#devtools')).toBe(true);
  });

  it('deduplicates hashtags', () => {
    const config: TwitterAccountConfig = {
      ...ACCOUNT_CONFIG,
      globalHashtags: ['#same'],
      contentCategories: [
        {
          name: 'Test',
          description: 'Test',
          hashtags: ['#same'],
          frequency: 'weekly',
          examples: ['example'],
        },
      ],
    };
    const tags = getAllHashtags(config);
    expect(tags.size).toBe(1);
  });
});

describe('getCategoryNames', () => {
  it('returns all category names', () => {
    const names = getCategoryNames(ACCOUNT_CONFIG);
    expect(names).toContain('Release Announcements');
    expect(names).toContain('Feature Highlights');
    expect(names.length).toBe(CONTENT_CATEGORIES.length);
  });
});

describe('getCategoriesByFrequency', () => {
  it('filters weekly categories', () => {
    const weekly = getCategoriesByFrequency(ACCOUNT_CONFIG, 'weekly');
    expect(weekly.length).toBeGreaterThan(0);
    for (const cat of weekly) {
      expect(cat.frequency).toBe('weekly');
    }
  });

  it('filters on-event categories', () => {
    const onEvent = getCategoriesByFrequency(ACCOUNT_CONFIG, 'on-event');
    expect(onEvent.length).toBeGreaterThan(0);
    for (const cat of onEvent) {
      expect(cat.frequency).toBe('on-event');
    }
  });

  it('returns empty for unused frequency', () => {
    const daily = getCategoriesByFrequency(ACCOUNT_CONFIG, 'daily');
    expect(daily).toHaveLength(0);
  });
});
