/**
 * Crewspace Discord Server Configuration
 *
 * Defines the channel structure, roles, and permissions for the
 * Crewspace community Discord server.
 *
 * This configuration is used by the setup script to create the server
 * structure and serves as the source of truth for the community layout.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface DiscordRole {
  readonly name: string;
  readonly color: string;
  readonly permissions: readonly string[];
  readonly mentionable: boolean;
  readonly hoist: boolean;
  readonly description: string;
}

export interface DiscordChannel {
  readonly name: string;
  readonly type: 'text' | 'voice' | 'forum' | 'announcement';
  readonly topic?: string;
  readonly slowMode?: number;
  readonly nsfw?: boolean;
  readonly readOnly?: boolean;
}

export interface DiscordCategory {
  readonly name: string;
  readonly channels: readonly DiscordChannel[];
}

export interface DiscordServerConfig {
  readonly serverName: string;
  readonly description: string;
  readonly roles: readonly DiscordRole[];
  readonly categories: readonly DiscordCategory[];
  readonly welcomeChannelName: string;
  readonly rulesChannelName: string;
}

// ── Roles ──────────────────────────────────────────────────────────

export const ROLES: readonly DiscordRole[] = [
  {
    name: 'Maintainer',
    color: '#E74C3C',
    permissions: ['ADMINISTRATOR'],
    mentionable: true,
    hoist: true,
    description: 'Core team members with full access',
  },
  {
    name: 'Contributor',
    color: '#3498DB',
    permissions: ['SEND_MESSAGES', 'CREATE_PUBLIC_THREADS', 'ATTACH_FILES', 'EMBED_LINKS'],
    mentionable: true,
    hoist: true,
    description: 'Community members who have contributed code or docs',
  },
  {
    name: 'Community',
    color: '#2ECC71',
    permissions: ['SEND_MESSAGES', 'CREATE_PUBLIC_THREADS', 'ADD_REACTIONS'],
    mentionable: false,
    hoist: false,
    description: 'Verified community members',
  },
  {
    name: 'Bot',
    color: '#95A5A6',
    permissions: ['SEND_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS'],
    mentionable: false,
    hoist: false,
    description: 'Automated bots (GitHub, CI notifications)',
  },
] as const;

// ── Categories & Channels ──────────────────────────────────────────

export const CATEGORIES: readonly DiscordCategory[] = [
  {
    name: '📢 Info',
    channels: [
      {
        name: 'welcome',
        type: 'text',
        topic: 'Welcome to the Crewspace community! Read the rules and introduce yourself.',
        readOnly: true,
      },
      {
        name: 'rules',
        type: 'text',
        topic: 'Community guidelines and Code of Conduct.',
        readOnly: true,
      },
      {
        name: 'announcements',
        type: 'announcement',
        topic: 'Official Crewspace announcements — releases, events, updates.',
        readOnly: true,
      },
      {
        name: 'changelog',
        type: 'text',
        topic: 'Automated release notes and version updates.',
        readOnly: true,
      },
    ],
  },
  {
    name: '💬 General',
    channels: [
      {
        name: 'general',
        type: 'text',
        topic: 'General discussion about Crewspace and AI agents.',
      },
      {
        name: 'introductions',
        type: 'text',
        topic: 'Introduce yourself to the community!',
      },
      {
        name: 'off-topic',
        type: 'text',
        topic: 'Non-Crewspace chat — keep it friendly.',
      },
    ],
  },
  {
    name: '🛠️ Development',
    channels: [
      {
        name: 'help',
        type: 'forum',
        topic: 'Ask questions about using Crewspace. Search before posting!',
      },
      {
        name: 'bug-reports',
        type: 'forum',
        topic: 'Report bugs here. Include reproduction steps and environment info.',
      },
      {
        name: 'feature-requests',
        type: 'forum',
        topic: 'Suggest new features or improvements.',
      },
      {
        name: 'contributing',
        type: 'text',
        topic: 'Discussion about contributing to Crewspace — PRs, code review, dev setup.',
      },
      {
        name: 'ci-notifications',
        type: 'text',
        topic: 'Automated CI/CD notifications from GitHub Actions.',
        readOnly: true,
      },
    ],
  },
  {
    name: '🎨 Showcase',
    channels: [
      {
        name: 'showcase',
        type: 'forum',
        topic: 'Share what you built with Crewspace! Projects, demos, and experiments.',
      },
      {
        name: 'templates',
        type: 'text',
        topic: 'Share and discuss agent templates and crew configurations.',
      },
    ],
  },
  {
    name: '🔊 Voice',
    channels: [
      {
        name: 'community-call',
        type: 'voice',
        topic: 'Weekly community calls and office hours.',
      },
      {
        name: 'pair-programming',
        type: 'voice',
        topic: 'Voice channel for pair programming sessions.',
      },
    ],
  },
] as const;

// ── Server Configuration ───────────────────────────────────────────

export const SERVER_CONFIG: DiscordServerConfig = {
  serverName: 'Crewspace',
  description:
    'Official community for Crewspace — the TypeScript-native agent orchestration framework. Get help, share projects, and contribute.',
  roles: ROLES,
  categories: CATEGORIES,
  welcomeChannelName: 'welcome',
  rulesChannelName: 'rules',
} as const;

// ── Helpers ────────────────────────────────────────────────────────

/** Returns all channels across all categories flattened into a single array. */
export function getAllChannels(config: DiscordServerConfig): readonly DiscordChannel[] {
  return config.categories.flatMap((cat) => cat.channels);
}

/** Returns all channel names as a Set for quick lookup. */
export function getChannelNames(config: DiscordServerConfig): ReadonlySet<string> {
  return new Set(getAllChannels(config).map((ch) => ch.name));
}

/** Returns all role names as a Set for quick lookup. */
export function getRoleNames(config: DiscordServerConfig): ReadonlySet<string> {
  return new Set(config.roles.map((r) => r.name));
}

/** Validates that a server config has no duplicate channel names. */
export function validateNoDuplicateChannels(config: DiscordServerConfig): {
  valid: boolean;
  duplicates: string[];
} {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const channel of getAllChannels(config)) {
    if (seen.has(channel.name)) {
      duplicates.push(channel.name);
    }
    seen.add(channel.name);
  }
  return { valid: duplicates.length === 0, duplicates };
}

/** Validates that a server config has no duplicate role names. */
export function validateNoDuplicateRoles(config: DiscordServerConfig): {
  valid: boolean;
  duplicates: string[];
} {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const role of config.roles) {
    if (seen.has(role.name)) {
      duplicates.push(role.name);
    }
    seen.add(role.name);
  }
  return { valid: duplicates.length === 0, duplicates };
}

/** Validates that welcome and rules channels exist in the config. */
export function validateRequiredChannels(config: DiscordServerConfig): {
  valid: boolean;
  missing: string[];
} {
  const names = getChannelNames(config);
  const missing: string[] = [];
  if (!names.has(config.welcomeChannelName)) {
    missing.push(config.welcomeChannelName);
  }
  if (!names.has(config.rulesChannelName)) {
    missing.push(config.rulesChannelName);
  }
  return { valid: missing.length === 0, missing };
}

/** Full validation of a Discord server config. Returns all issues found. */
export function validateServerConfig(config: DiscordServerConfig): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!config.serverName.trim()) {
    issues.push('Server name must not be empty');
  }

  if (!config.description.trim()) {
    issues.push('Server description must not be empty');
  }

  if (config.roles.length === 0) {
    issues.push('At least one role must be defined');
  }

  if (config.categories.length === 0) {
    issues.push('At least one category must be defined');
  }

  const channelResult = validateNoDuplicateChannels(config);
  if (!channelResult.valid) {
    issues.push(`Duplicate channel names: ${channelResult.duplicates.join(', ')}`);
  }

  const roleResult = validateNoDuplicateRoles(config);
  if (!roleResult.valid) {
    issues.push(`Duplicate role names: ${roleResult.duplicates.join(', ')}`);
  }

  const requiredResult = validateRequiredChannels(config);
  if (!requiredResult.valid) {
    issues.push(`Missing required channels: ${requiredResult.missing.join(', ')}`);
  }

  for (const category of config.categories) {
    if (category.channels.length === 0) {
      issues.push(`Category "${category.name}" has no channels`);
    }
  }

  for (const role of config.roles) {
    if (!role.name.trim()) {
      issues.push('Role name must not be empty');
    }
    if (!role.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      issues.push(`Role "${role.name}" has invalid color: ${role.color}`);
    }
    if (role.permissions.length === 0) {
      issues.push(`Role "${role.name}" has no permissions`);
    }
  }

  return { valid: issues.length === 0, issues };
}
