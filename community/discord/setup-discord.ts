#!/usr/bin/env tsx
/**
 * Discord Server Setup Script
 *
 * Creates the Crewspace Discord server structure from the configuration
 * defined in server-config.ts.
 *
 * Usage:
 *   DISCORD_BOT_TOKEN=<token> tsx community/discord/setup-discord.ts [--dry-run]
 *
 * Options:
 *   --dry-run   Print the planned changes without executing them
 *   --guild-id  Target guild ID (required unless --dry-run)
 *
 * Prerequisites:
 *   - A Discord bot with the following permissions:
 *     - Manage Channels
 *     - Manage Roles
 *     - Manage Server
 *   - The bot must be added to the target server
 */

import {
  SERVER_CONFIG,
  getAllChannels,
  validateServerConfig,
  type DiscordCategory,
  type DiscordChannel,
  type DiscordRole,
  type DiscordServerConfig,
} from './server-config.js';

// ── Types ──────────────────────────────────────────────────────────

export interface SetupAction {
  type: 'create-role' | 'create-category' | 'create-channel';
  name: string;
  details: Record<string, unknown>;
}

export interface SetupPlan {
  serverName: string;
  actions: SetupAction[];
  totalRoles: number;
  totalCategories: number;
  totalChannels: number;
}

// ── Plan Generation ────────────────────────────────────────────────

/** Generate a setup plan from a server configuration without executing anything. */
export function generateSetupPlan(config: DiscordServerConfig): SetupPlan {
  const actions: SetupAction[] = [];

  for (const role of config.roles) {
    actions.push({
      type: 'create-role',
      name: role.name,
      details: {
        color: role.color,
        permissions: [...role.permissions],
        mentionable: role.mentionable,
        hoist: role.hoist,
      },
    });
  }

  for (const category of config.categories) {
    actions.push({
      type: 'create-category',
      name: category.name,
      details: {
        channelCount: category.channels.length,
      },
    });

    for (const channel of category.channels) {
      actions.push({
        type: 'create-channel',
        name: channel.name,
        details: {
          type: channel.type,
          topic: channel.topic ?? null,
          category: category.name,
          readOnly: channel.readOnly ?? false,
          slowMode: channel.slowMode ?? 0,
        },
      });
    }
  }

  return {
    serverName: config.serverName,
    actions,
    totalRoles: config.roles.length,
    totalCategories: config.categories.length,
    totalChannels: getAllChannels(config).length,
  };
}

// ── Formatting ─────────────────────────────────────────────────────

/** Format a setup plan as a human-readable string. */
export function formatSetupPlan(plan: SetupPlan): string {
  const lines: string[] = [
    `Discord Server Setup Plan: ${plan.serverName}`,
    '═'.repeat(50),
    '',
    `Roles: ${plan.totalRoles}`,
    `Categories: ${plan.totalCategories}`,
    `Channels: ${plan.totalChannels}`,
    '',
    'Actions:',
    '─'.repeat(50),
  ];

  for (const action of plan.actions) {
    const icon =
      action.type === 'create-role'
        ? '👤'
        : action.type === 'create-category'
          ? '📁'
          : '💬';
    lines.push(`  ${icon} ${action.type}: ${action.name}`);

    if (action.type === 'create-channel') {
      const details = action.details as Record<string, unknown>;
      lines.push(`     type: ${String(details['type'])}, category: ${String(details['category'])}`);
      if (details['topic']) {
        lines.push(`     topic: ${String(details['topic'])}`);
      }
    }
  }

  lines.push('', '─'.repeat(50));
  lines.push(`Total actions: ${plan.actions.length}`);

  return lines.join('\n');
}

// ── CLI Arguments ──────────────────────────────────────────────────

export interface CliArgs {
  dryRun: boolean;
  guildId: string | null;
}

export function parseArgs(argv: string[]): CliArgs {
  const dryRun = argv.includes('--dry-run');
  const guildIdx = argv.indexOf('--guild-id');
  const guildId = guildIdx !== -1 && argv.length > guildIdx + 1 ? argv[guildIdx + 1]! : null;

  return { dryRun, guildId };
}

// ── Role Formatting ────────────────────────────────────────────────

export function formatRoleSummary(role: DiscordRole): string {
  return `${role.name} (${role.color}) — ${role.description}`;
}

// ── Channel Formatting ─────────────────────────────────────────────

export function formatChannelSummary(channel: DiscordChannel, category: DiscordCategory): string {
  const typeIcon =
    channel.type === 'text'
      ? '#'
      : channel.type === 'voice'
        ? '🔊'
        : channel.type === 'forum'
          ? '💬'
          : '📢';
  const readOnly = channel.readOnly ? ' [read-only]' : '';
  return `${typeIcon} ${channel.name}${readOnly} (${category.name})`;
}

// ── Main ───────────────────────────────────────────────────────────

export function main(argv: string[] = process.argv.slice(2)): void {
  const args = parseArgs(argv);

  // Validate configuration
  const validation = validateServerConfig(SERVER_CONFIG);
  if (!validation.valid) {
    console.error('❌ Server configuration is invalid:');
    for (const issue of validation.issues) {
      console.error(`   - ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  const plan = generateSetupPlan(SERVER_CONFIG);
  console.log(formatSetupPlan(plan));

  if (args.dryRun) {
    console.log('\n✅ Dry run complete — no changes were made.');
    return;
  }

  if (!args.guildId) {
    console.error('\n❌ --guild-id is required when not using --dry-run');
    process.exitCode = 1;
    return;
  }

  const token = process.env['DISCORD_BOT_TOKEN'];
  if (!token) {
    console.error('\n❌ DISCORD_BOT_TOKEN environment variable is required');
    process.exitCode = 1;
    return;
  }

  console.log(`\n🚀 Would apply to guild ${args.guildId} (API integration pending discord.js setup)`);
  console.log('   Install discord.js and run this script to apply changes.');
}

// Run if executed directly
const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] !== undefined &&
  (process.argv[1].endsWith('setup-discord.ts') || process.argv[1].endsWith('setup-discord.js'));

if (isDirectRun) {
  main();
}
