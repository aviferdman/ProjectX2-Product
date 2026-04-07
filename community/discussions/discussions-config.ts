/**
 * Crewspace GitHub Discussions Configuration
 *
 * Defines the discussion categories, form templates, and moderation
 * settings for the Crewspace GitHub Discussions forum. This serves as
 * the source of truth for the Discussions setup.
 *
 * GitHub Discussions categories map to DISCUSSION_TEMPLATE/*.yml files
 * in the .github directory.
 */

// ── Types ──────────────────────────────────────────────────────────

export type DiscussionFormat = 'open' | 'question-answer';

export interface DiscussionCategory {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly emoji: string;
  readonly format: DiscussionFormat;
  readonly templateFile: string;
  readonly labels: readonly string[];
  readonly welcomeMessage: string;
}

export interface ModerationSettings {
  readonly requireApprovalForFirstPost: boolean;
  readonly autoLockAfterDays: number | null;
  readonly allowedReactions: readonly string[];
  readonly pinnedDiscussions: readonly string[];
}

export interface DiscussionsConfig {
  readonly repositoryUrl: string;
  readonly categories: readonly DiscussionCategory[];
  readonly moderation: ModerationSettings;
  readonly contactLinks: readonly ContactLink[];
}

export interface ContactLink {
  readonly name: string;
  readonly url: string;
  readonly about: string;
}

// ── Categories ─────────────────────────────────────────────────────

export const DISCUSSION_CATEGORIES: readonly DiscussionCategory[] = [
  {
    name: 'Q&A',
    slug: 'q-a',
    description: 'Ask questions and get answers from the Crewspace community and maintainers',
    emoji: '💬',
    format: 'question-answer',
    templateFile: 'q-a.yml',
    labels: ['question'],
    welcomeMessage:
      'Welcome to Crewspace Q&A! Please search existing discussions before posting. ' +
      'Mark an answer as accepted to help others find solutions quickly.',
  },
  {
    name: 'Ideas',
    slug: 'ideas',
    description: 'Share and discuss ideas for new features or improvements',
    emoji: '💡',
    format: 'open',
    templateFile: 'ideas.yml',
    labels: ['idea'],
    welcomeMessage:
      'Have an idea for Crewspace? Share it here! Upvote ideas you like to help us prioritize.',
  },
  {
    name: 'Show & Tell',
    slug: 'show-and-tell',
    description: 'Show off projects and workflows built with Crewspace',
    emoji: '🎨',
    format: 'open',
    templateFile: 'show-and-tell.yml',
    labels: ['showcase'],
    welcomeMessage:
      'Built something with Crewspace? We\'d love to see it! Share your project, demo, or code.',
  },
  {
    name: 'General',
    slug: 'general',
    description: 'General conversations about Crewspace, AI agents, and the community',
    emoji: '💬',
    format: 'open',
    templateFile: 'general.yml',
    labels: ['discussion'],
    welcomeMessage:
      'Welcome to the Crewspace community! This is the place for general conversations ' +
      'about the framework, AI agents, architecture, and anything else.',
  },
] as const;

// ── Moderation ─────────────────────────────────────────────────────

export const MODERATION_SETTINGS: ModerationSettings = {
  requireApprovalForFirstPost: false,
  autoLockAfterDays: null,
  allowedReactions: ['👍', '👎', '❤️', '🎉', '🚀', '👀'],
  pinnedDiscussions: [
    'Welcome to Crewspace Discussions!',
    'How to ask a good question',
  ],
} as const;

// ── Contact Links ──────────────────────────────────────────────────

export const CONTACT_LINKS: readonly ContactLink[] = [
  {
    name: 'GitHub Discussions Q&A',
    url: 'https://github.com/aviferdman/ProjectX2-Product/discussions/categories/q-a',
    about: 'Ask questions and get help from the Crewspace community',
  },
  {
    name: 'Discord Community',
    url: 'https://discord.gg/crewspace',
    about: 'Join our Discord for real-time chat and support',
  },
  {
    name: 'Documentation',
    url: 'https://crewspace.dev/docs',
    about: 'Check the documentation for guides and API references',
  },
] as const;

// ── Full Config ────────────────────────────────────────────────────

export const DISCUSSIONS_CONFIG: DiscussionsConfig = {
  repositoryUrl: 'https://github.com/aviferdman/ProjectX2-Product',
  categories: DISCUSSION_CATEGORIES,
  moderation: MODERATION_SETTINGS,
  contactLinks: CONTACT_LINKS,
} as const;

// ── Helpers ────────────────────────────────────────────────────────

/** Returns all category names. */
export function getCategoryNames(config: DiscussionsConfig): readonly string[] {
  return config.categories.map((c) => c.name);
}

/** Returns all category slugs. */
export function getCategorySlugs(config: DiscussionsConfig): readonly string[] {
  return config.categories.map((c) => c.slug);
}

/** Returns categories filtered by format. */
export function getCategoriesByFormat(
  config: DiscussionsConfig,
  format: DiscussionFormat,
): readonly DiscussionCategory[] {
  return config.categories.filter((c) => c.format === format);
}

/** Returns all unique labels across all categories. */
export function getAllLabels(config: DiscussionsConfig): ReadonlySet<string> {
  const labels = new Set<string>();
  for (const category of config.categories) {
    for (const label of category.labels) {
      labels.add(label);
    }
  }
  return labels;
}

/** Finds a category by slug. */
export function getCategoryBySlug(
  config: DiscussionsConfig,
  slug: string,
): DiscussionCategory | undefined {
  return config.categories.find((c) => c.slug === slug);
}

// ── Validation ─────────────────────────────────────────────────────

/** Validates that a slug contains only lowercase alphanumeric characters and hyphens. */
export function validateSlug(slug: string): { valid: boolean; issue?: string } {
  if (slug.length === 0) {
    return { valid: false, issue: 'Slug must not be empty' };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      valid: false,
      issue: `Slug "${slug}" must contain only lowercase letters, numbers, and hyphens (no leading/trailing hyphens)`,
    };
  }
  return { valid: true };
}

/** Validates that no duplicate category slugs exist. */
export function validateNoDuplicateCategories(config: DiscussionsConfig): {
  valid: boolean;
  duplicates: string[];
} {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const category of config.categories) {
    if (seen.has(category.slug)) {
      duplicates.push(category.slug);
    }
    seen.add(category.slug);
  }
  return { valid: duplicates.length === 0, duplicates };
}

/** Validates that each category has a corresponding template file reference. */
export function validateTemplateFiles(config: DiscussionsConfig): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  for (const category of config.categories) {
    if (!category.templateFile.trim()) {
      issues.push(`Category "${category.name}" has no template file specified`);
    }
    if (!category.templateFile.endsWith('.yml') && !category.templateFile.endsWith('.yaml')) {
      issues.push(
        `Category "${category.name}" template file "${category.templateFile}" must be a .yml or .yaml file`,
      );
    }
  }
  return { valid: issues.length === 0, issues };
}

/** Full validation of a GitHub Discussions configuration. Returns all issues found. */
export function validateDiscussionsConfig(config: DiscussionsConfig): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Validate repository URL
  if (!config.repositoryUrl.trim()) {
    issues.push('Repository URL must not be empty');
  }

  // Validate categories exist
  if (config.categories.length === 0) {
    issues.push('At least one discussion category must be defined');
  }

  // Validate no duplicate slugs
  const dupResult = validateNoDuplicateCategories(config);
  if (!dupResult.valid) {
    issues.push(`Duplicate category slugs: ${dupResult.duplicates.join(', ')}`);
  }

  // Validate each category
  for (const category of config.categories) {
    if (!category.name.trim()) {
      issues.push('Category name must not be empty');
    }

    const slugResult = validateSlug(category.slug);
    if (!slugResult.valid) {
      issues.push(slugResult.issue!);
    }

    if (!category.description.trim()) {
      issues.push(`Category "${category.name}" has no description`);
    }

    if (!category.emoji.trim()) {
      issues.push(`Category "${category.name}" has no emoji`);
    }

    if (category.labels.length === 0) {
      issues.push(`Category "${category.name}" has no labels`);
    }

    if (!category.welcomeMessage.trim()) {
      issues.push(`Category "${category.name}" has no welcome message`);
    }
  }

  // Validate template files
  const templateResult = validateTemplateFiles(config);
  if (!templateResult.valid) {
    issues.push(...templateResult.issues);
  }

  // Validate contact links
  for (const link of config.contactLinks) {
    if (!link.name.trim()) {
      issues.push('Contact link name must not be empty');
    }
    if (!link.url.trim()) {
      issues.push(`Contact link "${link.name}" has no URL`);
    }
    if (!link.about.trim()) {
      issues.push(`Contact link "${link.name}" has no description`);
    }
  }

  // Validate moderation settings
  if (config.moderation.allowedReactions.length === 0) {
    issues.push('At least one allowed reaction must be specified');
  }

  return { valid: issues.length === 0, issues };
}
