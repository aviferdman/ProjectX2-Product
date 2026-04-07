/**
 * Discord Automated Welcome Messages Configuration
 *
 * Defines welcome message templates, rendering, and validation for the
 * Crewspace community Discord server. Messages are sent when new members
 * join the server.
 *
 * @packageDocumentation
 */

import type { DiscordServerConfig } from './server-config.js';

// ── Types ──────────────────────────────────────────────────────────

/** Supported template variables that can appear in welcome messages. */
export type WelcomeVariable =
  | 'username'
  | 'server'
  | 'memberCount'
  | 'rulesChannel'
  | 'introChannel';

/** A Discord embed field (title + value). */
export interface EmbedField {
  readonly name: string;
  readonly value: string;
  readonly inline?: boolean;
}

/** A Discord embed structure for rich welcome messages. */
export interface WelcomeEmbed {
  readonly title: string;
  readonly description: string;
  readonly color: string;
  readonly fields: readonly EmbedField[];
  readonly footer?: string;
  readonly thumbnail?: string;
}

/** Configuration for a single welcome message target. */
export interface WelcomeMessageConfig {
  /** Whether this message is enabled. */
  readonly enabled: boolean;
  /** Plain-text content (sent before embed, supports template variables). */
  readonly content: string;
  /** Optional rich embed attached to the message. */
  readonly embed?: WelcomeEmbed;
}

/** Full welcome messages configuration. */
export interface WelcomeConfig {
  /** Message posted in the welcome channel when a member joins. */
  readonly channelMessage: WelcomeMessageConfig;
  /** Direct message sent to the new member. */
  readonly directMessage: WelcomeMessageConfig;
  /** Whether to auto-assign a role to new members. */
  readonly autoAssignRole: string | null;
}

/** Result of validating a WelcomeConfig. */
export interface WelcomeConfigValidation {
  readonly valid: boolean;
  readonly issues: readonly string[];
}

/** Context object used to resolve template variables at render time. */
export interface WelcomeContext {
  readonly username: string;
  readonly server: string;
  readonly memberCount: number;
  readonly rulesChannel: string;
  readonly introChannel: string;
}

// ── Constants ──────────────────────────────────────────────────────

/** All recognized template variable names. */
export const WELCOME_VARIABLES: readonly WelcomeVariable[] = [
  'username',
  'server',
  'memberCount',
  'rulesChannel',
  'introChannel',
] as const;

/** Maximum allowed length for a rendered welcome message content string. */
export const MAX_CONTENT_LENGTH = 2000;

/** Maximum allowed length for an embed description. */
export const MAX_EMBED_DESCRIPTION_LENGTH = 4096;

/** Maximum number of embed fields. */
export const MAX_EMBED_FIELDS = 25;

// ── Default Configuration ──────────────────────────────────────────

/** Default channel welcome message embed. */
const DEFAULT_CHANNEL_EMBED: WelcomeEmbed = {
  title: '👋 Welcome to {server}!',
  description:
    'Hey **{username}**, thanks for joining! We now have **{memberCount}** members.\n\n' +
    'Please read the rules in #{rulesChannel} and introduce yourself in #{introChannel}.',
  color: '#5865F2',
  fields: [
    {
      name: '📖 Rules',
      value: 'Check out #{rulesChannel} for our community guidelines.',
      inline: true,
    },
    {
      name: '💬 Introduce Yourself',
      value: 'Say hi in #{introChannel} and tell us about your projects!',
      inline: true,
    },
    {
      name: '🛠️ Get Help',
      value: 'Have questions? Post in #help — the community is here for you.',
      inline: false,
    },
  ],
  footer: 'Crewspace — TypeScript-native agent orchestration',
};

/** Default direct message embed. */
const DEFAULT_DM_EMBED: WelcomeEmbed = {
  title: 'Welcome to {server}! 🎉',
  description:
    'Hi **{username}**! Thanks for joining the Crewspace community.\n\n' +
    'Here are some resources to get you started:',
  color: '#2ECC71',
  fields: [
    {
      name: '📚 Documentation',
      value: 'https://crewspace.dev/docs',
      inline: false,
    },
    {
      name: '💻 GitHub',
      value: 'https://github.com/aviferdman/ProjectX2-Product',
      inline: false,
    },
    {
      name: '🤝 Contributing',
      value: 'Want to contribute? Check out our Contributing Guide on GitHub.',
      inline: false,
    },
  ],
  footer: 'This is an automated message — reply in the server for help!',
};

/** The default welcome configuration for the Crewspace Discord server. */
export const DEFAULT_WELCOME_CONFIG: WelcomeConfig = {
  channelMessage: {
    enabled: true,
    content: 'Welcome to the server, **{username}**! 🎉',
    embed: DEFAULT_CHANNEL_EMBED,
  },
  directMessage: {
    enabled: true,
    content: 'Hey {username}, welcome to **{server}**!',
    embed: DEFAULT_DM_EMBED,
  },
  autoAssignRole: 'Community',
};

// ── Template Rendering ─────────────────────────────────────────────

/** Pattern that matches `{variableName}` placeholders. */
const TEMPLATE_PATTERN = /\{(\w+)\}/g;

/**
 * Render a template string by replacing `{variable}` placeholders with
 * values from the provided context.
 *
 * Unknown variables are left as-is so validation can catch them.
 */
export function renderTemplate(template: string, context: WelcomeContext): string {
  return template.replace(TEMPLATE_PATTERN, (match, key: string) => {
    if (key in context) {
      const value = context[key as keyof WelcomeContext];
      return String(value);
    }
    return match;
  });
}

/**
 * Render an entire WelcomeEmbed by resolving template variables in all
 * text fields.
 */
export function renderEmbed(embed: WelcomeEmbed, context: WelcomeContext): WelcomeEmbed {
  return {
    title: renderTemplate(embed.title, context),
    description: renderTemplate(embed.description, context),
    color: embed.color,
    fields: embed.fields.map((field) => ({
      name: renderTemplate(field.name, context),
      value: renderTemplate(field.value, context),
      inline: field.inline,
    })),
    footer: embed.footer ? renderTemplate(embed.footer, context) : undefined,
    thumbnail: embed.thumbnail,
  };
}

/**
 * Render a full WelcomeMessageConfig (content + embed) with the given context.
 */
export function renderWelcomeMessage(
  config: WelcomeMessageConfig,
  context: WelcomeContext,
): WelcomeMessageConfig {
  return {
    enabled: config.enabled,
    content: renderTemplate(config.content, context),
    embed: config.embed ? renderEmbed(config.embed, context) : undefined,
  };
}

// ── Variable Extraction ────────────────────────────────────────────

/**
 * Extract all template variable names found in a string.
 * Returns variables in the order they first appear.
 */
export function extractVariables(template: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const pattern = /\{(\w+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(template)) !== null) {
    const name = match[1]!;
    if (!seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}

/**
 * Extract all template variables from a WelcomeMessageConfig (content + embed).
 */
export function extractMessageVariables(config: WelcomeMessageConfig): string[] {
  const parts: string[] = [config.content];
  if (config.embed) {
    parts.push(config.embed.title, config.embed.description);
    for (const field of config.embed.fields) {
      parts.push(field.name, field.value);
    }
    if (config.embed.footer) {
      parts.push(config.embed.footer);
    }
  }
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of parts) {
    for (const v of extractVariables(part)) {
      if (!seen.has(v)) {
        seen.add(v);
        result.push(v);
      }
    }
  }
  return result;
}

// ── Validation ─────────────────────────────────────────────────────

/**
 * Validate that a hex color string is well-formed (`#RRGGBB`).
 */
function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Validate a WelcomeMessageConfig independently.
 */
function validateMessageConfig(
  config: WelcomeMessageConfig,
  label: string,
): string[] {
  const issues: string[] = [];

  if (config.enabled && config.content.trim().length === 0) {
    issues.push(`${label}: content must not be empty when enabled`);
  }

  if (config.content.length > MAX_CONTENT_LENGTH) {
    issues.push(
      `${label}: content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`,
    );
  }

  // Validate template variables
  const validNames = new Set<string>(WELCOME_VARIABLES);
  const variables = extractMessageVariables(config);
  for (const v of variables) {
    if (!validNames.has(v)) {
      issues.push(`${label}: unknown template variable "{${v}}"`);
    }
  }

  if (config.embed) {
    if (config.embed.title.trim().length === 0) {
      issues.push(`${label}: embed title must not be empty`);
    }
    if (config.embed.description.trim().length === 0) {
      issues.push(`${label}: embed description must not be empty`);
    }
    if (config.embed.description.length > MAX_EMBED_DESCRIPTION_LENGTH) {
      issues.push(
        `${label}: embed description exceeds maximum length of ${MAX_EMBED_DESCRIPTION_LENGTH}`,
      );
    }
    if (!isValidHexColor(config.embed.color)) {
      issues.push(`${label}: embed color "${config.embed.color}" is not a valid hex color`);
    }
    if (config.embed.fields.length > MAX_EMBED_FIELDS) {
      issues.push(
        `${label}: embed has ${config.embed.fields.length} fields, maximum is ${MAX_EMBED_FIELDS}`,
      );
    }
    for (const field of config.embed.fields) {
      if (field.name.trim().length === 0) {
        issues.push(`${label}: embed field name must not be empty`);
      }
      if (field.value.trim().length === 0) {
        issues.push(`${label}: embed field value must not be empty`);
      }
    }
  }

  return issues;
}

/**
 * Validate a full WelcomeConfig.
 *
 * Optionally pass a DiscordServerConfig to cross-check that the
 * autoAssignRole references an existing role.
 */
export function validateWelcomeConfig(
  config: WelcomeConfig,
  serverConfig?: DiscordServerConfig,
): WelcomeConfigValidation {
  const issues: string[] = [];

  issues.push(...validateMessageConfig(config.channelMessage, 'channelMessage'));
  issues.push(...validateMessageConfig(config.directMessage, 'directMessage'));

  if (!config.channelMessage.enabled && !config.directMessage.enabled) {
    issues.push('At least one of channelMessage or directMessage must be enabled');
  }

  if (config.autoAssignRole !== null) {
    if (config.autoAssignRole.trim().length === 0) {
      issues.push('autoAssignRole must not be an empty string (use null to disable)');
    }

    if (serverConfig) {
      const roleNames = new Set(serverConfig.roles.map((r) => r.name));
      if (!roleNames.has(config.autoAssignRole)) {
        issues.push(
          `autoAssignRole "${config.autoAssignRole}" does not match any defined role`,
        );
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

// ── Formatting ─────────────────────────────────────────────────────

/**
 * Format a WelcomeConfig as a human-readable summary string.
 */
export function formatWelcomeConfig(config: WelcomeConfig): string {
  const lines: string[] = [
    'Discord Welcome Messages Configuration',
    '═'.repeat(45),
    '',
  ];

  const ch = config.channelMessage;
  lines.push(`Channel Message: ${ch.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  if (ch.enabled) {
    lines.push(`  Content: ${ch.content}`);
    if (ch.embed) {
      lines.push(`  Embed: "${ch.embed.title}" (${ch.embed.fields.length} fields)`);
    }
  }

  lines.push('');

  const dm = config.directMessage;
  lines.push(`Direct Message: ${dm.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  if (dm.enabled) {
    lines.push(`  Content: ${dm.content}`);
    if (dm.embed) {
      lines.push(`  Embed: "${dm.embed.title}" (${dm.embed.fields.length} fields)`);
    }
  }

  lines.push('');
  lines.push(
    `Auto-Assign Role: ${config.autoAssignRole ?? 'None'}`,
  );
  lines.push('');
  lines.push('─'.repeat(45));

  const vars = new Set<string>();
  for (const v of extractMessageVariables(config.channelMessage)) vars.add(v);
  for (const v of extractMessageVariables(config.directMessage)) vars.add(v);
  lines.push(`Template variables used: ${[...vars].join(', ') || '(none)'}`);

  return lines.join('\n');
}

/**
 * Build a default WelcomeContext from a DiscordServerConfig and runtime data.
 */
export function buildWelcomeContext(
  serverConfig: DiscordServerConfig,
  username: string,
  memberCount: number,
): WelcomeContext {
  return {
    username,
    server: serverConfig.serverName,
    memberCount,
    rulesChannel: serverConfig.rulesChannelName,
    introChannel: 'introductions',
  };
}
