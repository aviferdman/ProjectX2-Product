/**
 * Tests for TASK-101: Discord Server Configuration and Setup
 *
 * Validates the Discord server configuration structure, validation functions,
 * and setup plan generation for the Crewspace community Discord server.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SERVER_CONFIG,
  ROLES,
  CATEGORIES,
  getAllChannels,
  getChannelNames,
  getRoleNames,
  validateNoDuplicateChannels,
  validateNoDuplicateRoles,
  validateRequiredChannels,
  validateServerConfig,
} from '../../../../community/discord/server-config.js';

import {
  generateSetupPlan,
  formatSetupPlan,
  formatRoleSummary,
  formatChannelSummary,
  parseArgs,
} from '../../../../community/discord/setup-discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../../../..');

// ── File Structure Tests ───────────────────────────────────────────

describe('TASK-101: Discord community files exist', () => {
  const discordDir = join(PROJECT_ROOT, 'community', 'discord');

  it('should have community/discord directory', () => {
    expect(existsSync(discordDir)).toBe(true);
  });

  it('should have server-config.ts', () => {
    expect(existsSync(join(discordDir, 'server-config.ts'))).toBe(true);
  });

  it('should have setup-discord.ts', () => {
    expect(existsSync(join(discordDir, 'setup-discord.ts'))).toBe(true);
  });

  it('should have index.ts', () => {
    expect(existsSync(join(discordDir, 'index.ts'))).toBe(true);
  });

  it('should have README.md', () => {
    expect(existsSync(join(discordDir, 'README.md'))).toBe(true);
  });

  it('README should document channel structure', () => {
    const readme = readFileSync(join(discordDir, 'README.md'), 'utf-8');
    expect(readme).toContain('welcome');
    expect(readme).toContain('rules');
    expect(readme).toContain('announcements');
    expect(readme).toContain('help');
    expect(readme).toContain('showcase');
  });

  it('README should document roles', () => {
    const readme = readFileSync(join(discordDir, 'README.md'), 'utf-8');
    expect(readme).toContain('Maintainer');
    expect(readme).toContain('Contributor');
    expect(readme).toContain('Community');
  });

  it('README should include setup instructions', () => {
    const readme = readFileSync(join(discordDir, 'README.md'), 'utf-8');
    expect(readme).toContain('--dry-run');
    expect(readme).toContain('DISCORD_BOT_TOKEN');
  });
});

// ── Server Configuration Tests ─────────────────────────────────────

describe('TASK-101: Server configuration', () => {
  it('should have server name "Crewspace"', () => {
    expect(SERVER_CONFIG.serverName).toBe('Crewspace');
  });

  it('should have a non-empty description', () => {
    expect(SERVER_CONFIG.description.length).toBeGreaterThan(0);
  });

  it('should have at least 3 roles', () => {
    expect(ROLES.length).toBeGreaterThanOrEqual(3);
  });

  it('should have at least 4 categories', () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(4);
  });

  it('should have at least 12 channels total', () => {
    const channels = getAllChannels(SERVER_CONFIG);
    expect(channels.length).toBeGreaterThanOrEqual(12);
  });

  it('should define a welcome channel', () => {
    expect(SERVER_CONFIG.welcomeChannelName).toBe('welcome');
  });

  it('should define a rules channel', () => {
    expect(SERVER_CONFIG.rulesChannelName).toBe('rules');
  });
});

// ── Role Configuration Tests ───────────────────────────────────────

describe('TASK-101: Role configuration', () => {
  it('should have Maintainer, Contributor, Community, and Bot roles', () => {
    const roleNames = getRoleNames(SERVER_CONFIG);
    expect(roleNames.has('Maintainer')).toBe(true);
    expect(roleNames.has('Contributor')).toBe(true);
    expect(roleNames.has('Community')).toBe(true);
    expect(roleNames.has('Bot')).toBe(true);
  });

  it('all roles should have valid hex colors', () => {
    for (const role of ROLES) {
      expect(role.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('all roles should have at least one permission', () => {
    for (const role of ROLES) {
      expect(role.permissions.length).toBeGreaterThan(0);
    }
  });

  it('all roles should have non-empty descriptions', () => {
    for (const role of ROLES) {
      expect(role.description.trim().length).toBeGreaterThan(0);
    }
  });

  it('Maintainer role should have ADMINISTRATOR permission', () => {
    const maintainer = ROLES.find((r) => r.name === 'Maintainer');
    expect(maintainer).toBeDefined();
    expect(maintainer!.permissions).toContain('ADMINISTRATOR');
  });
});

// ── Category & Channel Tests ───────────────────────────────────────

describe('TASK-101: Category and channel structure', () => {
  it('should have Info, General, Development, Showcase, and Voice categories', () => {
    const categoryNames = CATEGORIES.map((c) => c.name);
    expect(categoryNames.some((n) => n.includes('Info'))).toBe(true);
    expect(categoryNames.some((n) => n.includes('General'))).toBe(true);
    expect(categoryNames.some((n) => n.includes('Development'))).toBe(true);
    expect(categoryNames.some((n) => n.includes('Showcase'))).toBe(true);
    expect(categoryNames.some((n) => n.includes('Voice'))).toBe(true);
  });

  it('every category should have at least one channel', () => {
    for (const category of CATEGORIES) {
      expect(category.channels.length).toBeGreaterThan(0);
    }
  });

  it('should have essential community channels', () => {
    const channelNames = getChannelNames(SERVER_CONFIG);
    expect(channelNames.has('welcome')).toBe(true);
    expect(channelNames.has('rules')).toBe(true);
    expect(channelNames.has('announcements')).toBe(true);
    expect(channelNames.has('general')).toBe(true);
    expect(channelNames.has('help')).toBe(true);
    expect(channelNames.has('bug-reports')).toBe(true);
    expect(channelNames.has('feature-requests')).toBe(true);
    expect(channelNames.has('showcase')).toBe(true);
  });

  it('should have at least one voice channel', () => {
    const channels = getAllChannels(SERVER_CONFIG);
    const voiceChannels = channels.filter((c) => c.type === 'voice');
    expect(voiceChannels.length).toBeGreaterThan(0);
  });

  it('should have at least one forum channel', () => {
    const channels = getAllChannels(SERVER_CONFIG);
    const forumChannels = channels.filter((c) => c.type === 'forum');
    expect(forumChannels.length).toBeGreaterThan(0);
  });

  it('should have at least one announcement channel', () => {
    const channels = getAllChannels(SERVER_CONFIG);
    const announcementChannels = channels.filter((c) => c.type === 'announcement');
    expect(announcementChannels.length).toBeGreaterThan(0);
  });

  it('read-only channels should include welcome, rules, and announcements', () => {
    const channels = getAllChannels(SERVER_CONFIG);
    const readOnlyNames = channels.filter((c) => c.readOnly).map((c) => c.name);
    expect(readOnlyNames).toContain('welcome');
    expect(readOnlyNames).toContain('rules');
    expect(readOnlyNames).toContain('announcements');
  });

  it('all channels should have valid types', () => {
    const validTypes = new Set(['text', 'voice', 'forum', 'announcement']);
    for (const channel of getAllChannels(SERVER_CONFIG)) {
      expect(validTypes.has(channel.type)).toBe(true);
    }
  });
});

// ── Validation Function Tests ──────────────────────────────────────

describe('TASK-101: Validation functions', () => {
  it('validateServerConfig should pass for default config', () => {
    const result = validateServerConfig(SERVER_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('validateNoDuplicateChannels should pass for default config', () => {
    const result = validateNoDuplicateChannels(SERVER_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.duplicates).toHaveLength(0);
  });

  it('validateNoDuplicateRoles should pass for default config', () => {
    const result = validateNoDuplicateRoles(SERVER_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.duplicates).toHaveLength(0);
  });

  it('validateRequiredChannels should pass for default config', () => {
    const result = validateRequiredChannels(SERVER_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('should detect duplicate channel names', () => {
    const badConfig = {
      ...SERVER_CONFIG,
      categories: [
        { name: 'Cat A', channels: [{ name: 'dup', type: 'text' as const }] },
        { name: 'Cat B', channels: [{ name: 'dup', type: 'text' as const }] },
      ],
      welcomeChannelName: 'dup',
      rulesChannelName: 'dup',
    };
    const result = validateNoDuplicateChannels(badConfig);
    expect(result.valid).toBe(false);
    expect(result.duplicates).toContain('dup');
  });

  it('should detect duplicate role names', () => {
    const badConfig = {
      ...SERVER_CONFIG,
      roles: [
        { name: 'Admin', color: '#FF0000', permissions: ['ADMINISTRATOR'], mentionable: true, hoist: true, description: 'Admin' },
        { name: 'Admin', color: '#00FF00', permissions: ['SEND_MESSAGES'], mentionable: false, hoist: false, description: 'Another admin' },
      ],
    };
    const result = validateNoDuplicateRoles(badConfig);
    expect(result.valid).toBe(false);
    expect(result.duplicates).toContain('Admin');
  });

  it('should detect missing required channels', () => {
    const badConfig = {
      ...SERVER_CONFIG,
      categories: [{ name: 'Cat', channels: [{ name: 'general', type: 'text' as const }] }],
    };
    const result = validateRequiredChannels(badConfig);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('welcome');
    expect(result.missing).toContain('rules');
  });

  it('should detect empty server name', () => {
    const badConfig = { ...SERVER_CONFIG, serverName: '' };
    const result = validateServerConfig(badConfig);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('Server name'))).toBe(true);
  });

  it('should detect empty categories', () => {
    const badConfig = { ...SERVER_CONFIG, categories: [] };
    const result = validateServerConfig(badConfig);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('category'))).toBe(true);
  });
});

// ── Setup Plan Tests ───────────────────────────────────────────────

describe('TASK-101: Setup plan generation', () => {
  it('should generate a plan with correct totals', () => {
    const plan = generateSetupPlan(SERVER_CONFIG);
    expect(plan.serverName).toBe('Crewspace');
    expect(plan.totalRoles).toBe(ROLES.length);
    expect(plan.totalCategories).toBe(CATEGORIES.length);
    expect(plan.totalChannels).toBe(getAllChannels(SERVER_CONFIG).length);
  });

  it('should have actions for every role, category, and channel', () => {
    const plan = generateSetupPlan(SERVER_CONFIG);
    const expectedActions = ROLES.length + CATEGORIES.length + getAllChannels(SERVER_CONFIG).length;
    expect(plan.actions.length).toBe(expectedActions);
  });

  it('should have role actions first', () => {
    const plan = generateSetupPlan(SERVER_CONFIG);
    const firstRoleIdx = plan.actions.findIndex((a) => a.type === 'create-role');
    const firstCategoryIdx = plan.actions.findIndex((a) => a.type === 'create-category');
    expect(firstRoleIdx).toBeLessThan(firstCategoryIdx);
  });

  it('formatSetupPlan should produce readable output', () => {
    const plan = generateSetupPlan(SERVER_CONFIG);
    const output = formatSetupPlan(plan);
    expect(output).toContain('Crewspace');
    expect(output).toContain('Roles:');
    expect(output).toContain('Categories:');
    expect(output).toContain('Channels:');
    expect(output).toContain('create-role');
    expect(output).toContain('create-channel');
  });
});

// ── CLI Argument Parsing Tests ─────────────────────────────────────

describe('TASK-101: CLI argument parsing', () => {
  it('should detect --dry-run flag', () => {
    const args = parseArgs(['--dry-run']);
    expect(args.dryRun).toBe(true);
    expect(args.guildId).toBeNull();
  });

  it('should parse --guild-id value', () => {
    const args = parseArgs(['--guild-id', '123456789']);
    expect(args.dryRun).toBe(false);
    expect(args.guildId).toBe('123456789');
  });

  it('should handle both flags together', () => {
    const args = parseArgs(['--dry-run', '--guild-id', '999']);
    expect(args.dryRun).toBe(true);
    expect(args.guildId).toBe('999');
  });

  it('should handle no arguments', () => {
    const args = parseArgs([]);
    expect(args.dryRun).toBe(false);
    expect(args.guildId).toBeNull();
  });
});

// ── Formatting Helper Tests ────────────────────────────────────────

describe('TASK-101: Formatting helpers', () => {
  it('formatRoleSummary should include name, color, and description', () => {
    const summary = formatRoleSummary(ROLES[0]!);
    expect(summary).toContain(ROLES[0]!.name);
    expect(summary).toContain(ROLES[0]!.color);
    expect(summary).toContain(ROLES[0]!.description);
  });

  it('formatChannelSummary should include channel name and category', () => {
    const category = CATEGORIES[0]!;
    const channel = category.channels[0]!;
    const summary = formatChannelSummary(channel, category);
    expect(summary).toContain(channel.name);
    expect(summary).toContain(category.name);
  });

  it('formatChannelSummary should mark read-only channels', () => {
    const category = CATEGORIES[0]!;
    const readOnlyChannel = category.channels.find((c) => c.readOnly);
    expect(readOnlyChannel).toBeDefined();
    const summary = formatChannelSummary(readOnlyChannel!, category);
    expect(summary).toContain('read-only');
  });
});

// ── Community Docs References ──────────────────────────────────────

describe('TASK-101: Community docs reference Discord', () => {
  it('README.md should mention Discord', () => {
    const readme = readFileSync(join(PROJECT_ROOT, 'README.md'), 'utf-8');
    expect(readme).toMatch(/[Dd]iscord/);
  });

  it('CONTRIBUTING.md should mention Discord in Getting Help', () => {
    const contributing = readFileSync(join(PROJECT_ROOT, 'CONTRIBUTING.md'), 'utf-8');
    expect(contributing).toMatch(/[Dd]iscord/);
  });
});
