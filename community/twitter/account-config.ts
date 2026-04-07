/**
 * Crewspace Twitter/X Account Configuration
 *
 * Defines the account profile, content categories, hashtags, and posting
 * schedule for the official Crewspace Twitter/X account.
 *
 * This configuration is used by the setup script to generate a setup plan
 * and serves as the source of truth for the social media presence.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface TwitterProfile {
  readonly handle: string;
  readonly displayName: string;
  readonly bio: string;
  readonly url: string;
  readonly location: string;
}

export interface ContentCategory {
  readonly name: string;
  readonly description: string;
  readonly hashtags: readonly string[];
  readonly frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'on-event';
  readonly examples: readonly string[];
}

export interface PinnedTweet {
  readonly purpose: string;
  readonly template: string;
}

export interface PostingSchedule {
  readonly timezone: string;
  readonly preferredDays: readonly string[];
  readonly preferredHoursUTC: readonly number[];
  readonly maxPostsPerDay: number;
}

export interface TwitterAccountConfig {
  readonly profile: TwitterProfile;
  readonly contentCategories: readonly ContentCategory[];
  readonly pinnedTweet: PinnedTweet;
  readonly postingSchedule: PostingSchedule;
  readonly globalHashtags: readonly string[];
}

// ── Profile ────────────────────────────────────────────────────────

export const PROFILE: TwitterProfile = {
  handle: '@crewspace_dev',
  displayName: 'Crewspace',
  bio: '🚀 TypeScript-native agent orchestration framework. Build, debug, and deploy multi-agent workflows in under 5 minutes. Open source.',
  url: 'https://github.com/aviferdman/ProjectX2-Product',
  location: 'Open Source',
} as const;

// ── Content Categories ─────────────────────────────────────────────

export const CONTENT_CATEGORIES: readonly ContentCategory[] = [
  {
    name: 'Release Announcements',
    description: 'New version releases, changelogs, and breaking changes',
    hashtags: ['#release', '#opensource'],
    frequency: 'on-event',
    examples: [
      '🎉 Crewspace v{version} is out! {highlights} — upgrade now: npm install @crewspace/core@{version}',
      "🆕 What's new in Crewspace v{version}: {summary}. Full changelog: {link}",
    ],
  },
  {
    name: 'Feature Highlights',
    description: 'Deep dives into specific features and capabilities',
    hashtags: ['#devtools', '#AI'],
    frequency: 'weekly',
    examples: [
      '💡 Did you know? Crewspace supports parallel task execution with configurable concurrency. Build faster workflows with the ExecutionEngine.',
      '🔌 Swap LLM providers without changing agent code — OpenAI, Anthropic, or Ollama. Provider-agnostic by design.',
    ],
  },
  {
    name: 'Community Showcase',
    description: 'Highlighting projects and contributions from the community',
    hashtags: ['#builtwithcrewspace', '#community'],
    frequency: 'weekly',
    examples: [
      '🎨 Community spotlight: {user} built {project} with Crewspace! Check it out: {link}',
      '👏 Shoutout to {user} for their contribution to Crewspace — {description}. Thank you!',
    ],
  },
  {
    name: 'Tips & Tutorials',
    description: 'Quick tips, code snippets, and tutorial links',
    hashtags: ['#typescript', '#tutorial'],
    frequency: 'biweekly',
    examples: [
      '🛠️ Quick tip: Use `defineTool` with Zod schemas for type-safe custom tools in your agents.',
      '📖 New guide: Building your first multi-agent crew in 5 minutes → {link}',
    ],
  },
  {
    name: 'Ecosystem & Industry',
    description: 'AI agent ecosystem news, partnerships, and relevant industry updates',
    hashtags: ['#AIagents', '#LLM'],
    frequency: 'biweekly',
    examples: [
      "🌐 The AI agent ecosystem is growing fast. Here's how Crewspace fits in: {link}",
      '📊 Interesting thread on multi-agent architectures — our take: {summary}',
    ],
  },
] as const;

// ── Pinned Tweet ───────────────────────────────────────────────────

export const PINNED_TWEET: PinnedTweet = {
  purpose: 'Introduce Crewspace and link to key resources',
  template:
    '🚀 Crewspace — TypeScript-native agent orchestration framework\n\n' +
    '✅ Type-safe by default\n' +
    '✅ Provider-agnostic (OpenAI, Anthropic, Ollama)\n' +
    '✅ Event-driven execution\n' +
    '✅ Rich tool system\n\n' +
    '⭐ GitHub: github.com/aviferdman/ProjectX2-Product\n' +
    '💬 Discord: discord.gg/crewspace\n\n' +
    '#TypeScript #AI #OpenSource #AIagents',
} as const;

// ── Posting Schedule ───────────────────────────────────────────────

export const POSTING_SCHEDULE: PostingSchedule = {
  timezone: 'UTC',
  preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  preferredHoursUTC: [14, 17],
  maxPostsPerDay: 3,
} as const;

// ── Global Hashtags ────────────────────────────────────────────────

export const GLOBAL_HASHTAGS: readonly string[] = [
  '#crewspace',
  '#TypeScript',
  '#AIagents',
  '#OpenSource',
] as const;

// ── Account Configuration ──────────────────────────────────────────

export const ACCOUNT_CONFIG: TwitterAccountConfig = {
  profile: PROFILE,
  contentCategories: CONTENT_CATEGORIES,
  pinnedTweet: PINNED_TWEET,
  postingSchedule: POSTING_SCHEDULE,
  globalHashtags: GLOBAL_HASHTAGS,
} as const;

// ── Helpers ────────────────────────────────────────────────────────

/** Returns all unique hashtags across global and all content categories. */
export function getAllHashtags(config: TwitterAccountConfig): ReadonlySet<string> {
  const tags = new Set<string>(config.globalHashtags);
  for (const category of config.contentCategories) {
    for (const tag of category.hashtags) {
      tags.add(tag);
    }
  }
  return tags;
}

/** Returns all content category names. */
export function getCategoryNames(config: TwitterAccountConfig): readonly string[] {
  return config.contentCategories.map((c) => c.name);
}

/** Returns content categories filtered by frequency. */
export function getCategoriesByFrequency(
  config: TwitterAccountConfig,
  frequency: ContentCategory['frequency'],
): readonly ContentCategory[] {
  return config.contentCategories.filter((c) => c.frequency === frequency);
}

// ── Validation ─────────────────────────────────────────────────────

/** Validates that the Twitter handle starts with @ and contains only valid characters. */
export function validateHandle(handle: string): { valid: boolean; issue?: string } {
  if (!handle.startsWith('@')) {
    return { valid: false, issue: 'Handle must start with @' };
  }
  const name = handle.slice(1);
  if (name.length === 0 || name.length > 15) {
    return { valid: false, issue: 'Handle must be between 1 and 15 characters (excluding @)' };
  }
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    return { valid: false, issue: 'Handle may only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

/** Validates that the bio does not exceed Twitter's character limit. */
export function validateBio(bio: string): { valid: boolean; issue?: string } {
  if (bio.length === 0) {
    return { valid: false, issue: 'Bio must not be empty' };
  }
  if (bio.length > 160) {
    return { valid: false, issue: `Bio exceeds 160 character limit (${bio.length} characters)` };
  }
  return { valid: true };
}

/** Validates that hashtags start with # and contain only valid characters. */
export function validateHashtag(tag: string): { valid: boolean; issue?: string } {
  if (!tag.startsWith('#')) {
    return { valid: false, issue: `Hashtag "${tag}" must start with #` };
  }
  const body = tag.slice(1);
  if (body.length === 0) {
    return { valid: false, issue: 'Hashtag must not be empty after #' };
  }
  if (!/^[A-Za-z0-9_]+$/.test(body)) {
    return { valid: false, issue: `Hashtag "${tag}" contains invalid characters` };
  }
  return { valid: true };
}

/** Validates that the posting schedule has valid hours and days. */
export function validatePostingSchedule(schedule: PostingSchedule): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const validDays = new Set([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ]);

  if (schedule.preferredDays.length === 0) {
    issues.push('At least one preferred day must be specified');
  }
  for (const day of schedule.preferredDays) {
    if (!validDays.has(day)) {
      issues.push(`Invalid day: ${day}`);
    }
  }

  if (schedule.preferredHoursUTC.length === 0) {
    issues.push('At least one preferred hour must be specified');
  }
  for (const hour of schedule.preferredHoursUTC) {
    if (hour < 0 || hour > 23 || !Number.isInteger(hour)) {
      issues.push(`Invalid hour: ${String(hour)} (must be integer 0-23)`);
    }
  }

  if (schedule.maxPostsPerDay < 1) {
    issues.push('maxPostsPerDay must be at least 1');
  }

  return { valid: issues.length === 0, issues };
}

/** Validates that no duplicate content category names exist. */
export function validateNoDuplicateCategories(config: TwitterAccountConfig): {
  valid: boolean;
  duplicates: string[];
} {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const category of config.contentCategories) {
    if (seen.has(category.name)) {
      duplicates.push(category.name);
    }
    seen.add(category.name);
  }
  return { valid: duplicates.length === 0, duplicates };
}

/** Full validation of a Twitter account configuration. Returns all issues found. */
export function validateAccountConfig(config: TwitterAccountConfig): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Validate profile
  const handleResult = validateHandle(config.profile.handle);
  if (!handleResult.valid) {
    issues.push(handleResult.issue!);
  }

  if (!config.profile.displayName.trim()) {
    issues.push('Display name must not be empty');
  }

  const bioResult = validateBio(config.profile.bio);
  if (!bioResult.valid) {
    issues.push(bioResult.issue!);
  }

  if (!config.profile.url.trim()) {
    issues.push('Profile URL must not be empty');
  }

  // Validate content categories
  if (config.contentCategories.length === 0) {
    issues.push('At least one content category must be defined');
  }

  const categoryResult = validateNoDuplicateCategories(config);
  if (!categoryResult.valid) {
    issues.push(`Duplicate content categories: ${categoryResult.duplicates.join(', ')}`);
  }

  for (const category of config.contentCategories) {
    if (!category.name.trim()) {
      issues.push('Content category name must not be empty');
    }
    if (!category.description.trim()) {
      issues.push(`Content category "${category.name}" has no description`);
    }
    if (category.examples.length === 0) {
      issues.push(`Content category "${category.name}" has no example tweets`);
    }
  }

  // Validate hashtags
  for (const tag of config.globalHashtags) {
    const tagResult = validateHashtag(tag);
    if (!tagResult.valid) {
      issues.push(tagResult.issue!);
    }
  }

  for (const category of config.contentCategories) {
    for (const tag of category.hashtags) {
      const tagResult = validateHashtag(tag);
      if (!tagResult.valid) {
        issues.push(tagResult.issue!);
      }
    }
  }

  // Validate posting schedule
  const scheduleResult = validatePostingSchedule(config.postingSchedule);
  if (!scheduleResult.valid) {
    issues.push(...scheduleResult.issues);
  }

  // Validate pinned tweet
  if (!config.pinnedTweet.purpose.trim()) {
    issues.push('Pinned tweet purpose must not be empty');
  }
  if (!config.pinnedTweet.template.trim()) {
    issues.push('Pinned tweet template must not be empty');
  }

  return { valid: issues.length === 0, issues };
}
