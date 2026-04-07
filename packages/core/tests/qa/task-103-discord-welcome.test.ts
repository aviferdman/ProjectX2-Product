/**
 * Tests for TASK-103: Configure automated welcome messages for Discord
 *
 * Validates the welcome message configuration, template rendering,
 * variable extraction, and validation for the Crewspace Discord server.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// @ts-ignore TS6059 - file is outside package rootDir (community package)
import {
  DEFAULT_WELCOME_CONFIG,
  WELCOME_VARIABLES,
  MAX_CONTENT_LENGTH,
  MAX_EMBED_DESCRIPTION_LENGTH,
  MAX_EMBED_FIELDS,
  renderTemplate,
  renderEmbed,
  renderWelcomeMessage,
  extractVariables,
  extractMessageVariables,
  validateWelcomeConfig,
  formatWelcomeConfig,
  buildWelcomeContext,
} from '../../../../community/discord/welcome-messages.js';

// @ts-ignore TS6059 - file is outside package rootDir (community package)
import type {
  WelcomeConfig,
  WelcomeContext,
  WelcomeEmbed,
  WelcomeMessageConfig,
} from '../../../../community/discord/welcome-messages.js';

// @ts-ignore TS6059 - file is outside package rootDir (community package)
import { SERVER_CONFIG } from '../../../../community/discord/server-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../../../..');

// ── File Structure Tests ───────────────────────────────────────────

describe('TASK-103: Welcome message files exist', () => {
  const discordDir = join(PROJECT_ROOT, 'community', 'discord');

  it('should have welcome-messages.ts', () => {
    expect(existsSync(join(discordDir, 'welcome-messages.ts'))).toBe(true);
  });

  it('index.ts should export welcome message symbols', () => {
    const index = readFileSync(join(discordDir, 'index.ts'), 'utf-8');
    expect(index).toContain('DEFAULT_WELCOME_CONFIG');
    expect(index).toContain('renderTemplate');
    expect(index).toContain('validateWelcomeConfig');
    expect(index).toContain('WelcomeConfig');
  });

  it('README should document automated welcome messages', () => {
    const readme = readFileSync(join(discordDir, 'README.md'), 'utf-8');
    expect(readme).toContain('Automated Welcome Messages');
    expect(readme).toContain('{username}');
    expect(readme).toContain('{server}');
    expect(readme).toContain('welcome-messages.ts');
  });
});

// ── Default Configuration Tests ────────────────────────────────────

describe('TASK-103: Default welcome configuration', () => {
  it('should have channel message enabled', () => {
    expect(DEFAULT_WELCOME_CONFIG.channelMessage.enabled).toBe(true);
  });

  it('should have direct message enabled', () => {
    expect(DEFAULT_WELCOME_CONFIG.directMessage.enabled).toBe(true);
  });

  it('should auto-assign the Community role', () => {
    expect(DEFAULT_WELCOME_CONFIG.autoAssignRole).toBe('Community');
  });

  it('channel message should have non-empty content', () => {
    expect(DEFAULT_WELCOME_CONFIG.channelMessage.content.trim().length).toBeGreaterThan(0);
  });

  it('direct message should have non-empty content', () => {
    expect(DEFAULT_WELCOME_CONFIG.directMessage.content.trim().length).toBeGreaterThan(0);
  });

  it('channel message should have an embed', () => {
    expect(DEFAULT_WELCOME_CONFIG.channelMessage.embed).toBeDefined();
  });

  it('direct message should have an embed', () => {
    expect(DEFAULT_WELCOME_CONFIG.directMessage.embed).toBeDefined();
  });

  it('channel embed should have fields', () => {
    expect(DEFAULT_WELCOME_CONFIG.channelMessage.embed!.fields.length).toBeGreaterThan(0);
  });

  it('direct embed should have fields', () => {
    expect(DEFAULT_WELCOME_CONFIG.directMessage.embed!.fields.length).toBeGreaterThan(0);
  });

  it('channel embed should have a valid hex color', () => {
    expect(DEFAULT_WELCOME_CONFIG.channelMessage.embed!.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('direct embed should have a valid hex color', () => {
    expect(DEFAULT_WELCOME_CONFIG.directMessage.embed!.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should pass validation against default server config', () => {
    const result = validateWelcomeConfig(DEFAULT_WELCOME_CONFIG, SERVER_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });
});

// ── Template Rendering Tests ───────────────────────────────────────

describe('TASK-103: Template rendering', () => {
  const context: WelcomeContext = {
    username: 'Alice',
    server: 'Crewspace',
    memberCount: 42,
    rulesChannel: 'rules',
    introChannel: 'introductions',
  };

  it('should replace {username} with actual username', () => {
    const result = renderTemplate('Hello {username}!', context);
    expect(result).toBe('Hello Alice!');
  });

  it('should replace {server} with server name', () => {
    const result = renderTemplate('Welcome to {server}', context);
    expect(result).toBe('Welcome to Crewspace');
  });

  it('should replace {memberCount} with number', () => {
    const result = renderTemplate('We have {memberCount} members', context);
    expect(result).toBe('We have 42 members');
  });

  it('should replace multiple variables in one string', () => {
    const result = renderTemplate('{username} joined {server} (#{memberCount})', context);
    expect(result).toBe('Alice joined Crewspace (#42)');
  });

  it('should leave unknown variables untouched', () => {
    const result = renderTemplate('Hello {unknown}', context);
    expect(result).toBe('Hello {unknown}');
  });

  it('should handle strings with no variables', () => {
    const result = renderTemplate('No variables here', context);
    expect(result).toBe('No variables here');
  });

  it('should handle empty string', () => {
    const result = renderTemplate('', context);
    expect(result).toBe('');
  });

  it('should replace all occurrences of the same variable', () => {
    const result = renderTemplate('{username} is {username}', context);
    expect(result).toBe('Alice is Alice');
  });
});

// ── Embed Rendering Tests ──────────────────────────────────────────

describe('TASK-103: Embed rendering', () => {
  const context: WelcomeContext = {
    username: 'Bob',
    server: 'TestServer',
    memberCount: 100,
    rulesChannel: 'rules',
    introChannel: 'intros',
  };

  it('should render embed title', () => {
    const embed: WelcomeEmbed = {
      title: 'Welcome {username}',
      description: 'Joined {server}',
      color: '#000000',
      fields: [],
    };
    const rendered = renderEmbed(embed, context);
    expect(rendered.title).toBe('Welcome Bob');
  });

  it('should render embed description', () => {
    const embed: WelcomeEmbed = {
      title: 'Title',
      description: '{username} is member #{memberCount}',
      color: '#000000',
      fields: [],
    };
    const rendered = renderEmbed(embed, context);
    expect(rendered.description).toBe('Bob is member #100');
  });

  it('should render embed field names and values', () => {
    const embed: WelcomeEmbed = {
      title: 'Title',
      description: 'Desc',
      color: '#000000',
      fields: [{ name: 'Rules: #{rulesChannel}', value: 'Read #{rulesChannel}', inline: true }],
    };
    const rendered = renderEmbed(embed, context);
    expect(rendered.fields[0]!.name).toBe('Rules: #rules');
    expect(rendered.fields[0]!.value).toBe('Read #rules');
  });

  it('should render embed footer', () => {
    const embed: WelcomeEmbed = {
      title: 'Title',
      description: 'Desc',
      color: '#000000',
      fields: [],
      footer: 'Welcome to {server}!',
    };
    const rendered = renderEmbed(embed, context);
    expect(rendered.footer).toBe('Welcome to TestServer!');
  });

  it('should preserve embed color and thumbnail', () => {
    const embed: WelcomeEmbed = {
      title: 'Title',
      description: 'Desc',
      color: '#FF0000',
      fields: [],
      thumbnail: 'https://example.com/avatar.png',
    };
    const rendered = renderEmbed(embed, context);
    expect(rendered.color).toBe('#FF0000');
    expect(rendered.thumbnail).toBe('https://example.com/avatar.png');
  });
});

// ── Full Message Rendering Tests ───────────────────────────────────

describe('TASK-103: Full message rendering', () => {
  const context: WelcomeContext = {
    username: 'Carol',
    server: 'Crewspace',
    memberCount: 200,
    rulesChannel: 'rules',
    introChannel: 'introductions',
  };

  it('should render the default channel message', () => {
    const rendered = renderWelcomeMessage(DEFAULT_WELCOME_CONFIG.channelMessage, context);
    expect(rendered.content).toContain('Carol');
    expect(rendered.enabled).toBe(true);
    expect(rendered.embed).toBeDefined();
    expect(rendered.embed!.description).toContain('Carol');
    expect(rendered.embed!.description).toContain('200');
  });

  it('should render the default direct message', () => {
    const rendered = renderWelcomeMessage(DEFAULT_WELCOME_CONFIG.directMessage, context);
    expect(rendered.content).toContain('Carol');
    expect(rendered.content).toContain('Crewspace');
    expect(rendered.embed).toBeDefined();
    expect(rendered.embed!.description).toContain('Carol');
  });

  it('should handle message without embed', () => {
    const msg: WelcomeMessageConfig = {
      enabled: true,
      content: 'Hello {username}',
    };
    const rendered = renderWelcomeMessage(msg, context);
    expect(rendered.content).toBe('Hello Carol');
    expect(rendered.embed).toBeUndefined();
  });
});

// ── Variable Extraction Tests ──────────────────────────────────────

describe('TASK-103: Variable extraction', () => {
  it('should extract single variable', () => {
    expect(extractVariables('Hello {username}')).toEqual(['username']);
  });

  it('should extract multiple variables', () => {
    const vars = extractVariables('{username} joined {server}');
    expect(vars).toEqual(['username', 'server']);
  });

  it('should deduplicate variables', () => {
    const vars = extractVariables('{username} is {username}');
    expect(vars).toEqual(['username']);
  });

  it('should return empty array for no variables', () => {
    expect(extractVariables('No vars here')).toEqual([]);
  });

  it('should extract variables from full message config', () => {
    const vars = extractMessageVariables(DEFAULT_WELCOME_CONFIG.channelMessage);
    expect(vars).toContain('username');
    expect(vars).toContain('server');
    expect(vars).toContain('memberCount');
    expect(vars).toContain('rulesChannel');
  });

  it('should extract variables from message config without embed', () => {
    const msg: WelcomeMessageConfig = {
      enabled: true,
      content: 'Hello {username}',
    };
    expect(extractMessageVariables(msg)).toEqual(['username']);
  });
});

// ── Validation Tests ───────────────────────────────────────────────

describe('TASK-103: Welcome config validation', () => {
  it('should pass for default config', () => {
    const result = validateWelcomeConfig(DEFAULT_WELCOME_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('should pass for default config with server config', () => {
    const result = validateWelcomeConfig(DEFAULT_WELCOME_CONFIG, SERVER_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('should fail when both messages are disabled', () => {
    const config: WelcomeConfig = {
      channelMessage: { enabled: false, content: '' },
      directMessage: { enabled: false, content: '' },
      autoAssignRole: null,
    };
    const result = validateWelcomeConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('At least one'))).toBe(true);
  });

  it('should fail when enabled message has empty content', () => {
    const config: WelcomeConfig = {
      channelMessage: { enabled: true, content: '' },
      directMessage: { enabled: false, content: '' },
      autoAssignRole: null,
    };
    const result = validateWelcomeConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('content must not be empty'))).toBe(true);
  });

  it('should fail when content exceeds max length', () => {
    const config: WelcomeConfig = {
      channelMessage: { enabled: true, content: 'x'.repeat(MAX_CONTENT_LENGTH + 1) },
      directMessage: { enabled: false, content: '' },
      autoAssignRole: null,
    };
    const result = validateWelcomeConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('exceeds maximum length'))).toBe(true);
  });

  it('should fail for unknown template variables', () => {
    const config: WelcomeConfig = {
      channelMessage: { enabled: true, content: 'Hello {badVar}' },
      directMessage: { enabled: false, content: '' },
      autoAssignRole: null,
    };
    const result = validateWelcomeConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('unknown template variable'))).toBe(true);
  });

  it('should fail for invalid embed color', () => {
    const config: WelcomeConfig = {
      channelMessage: {
        enabled: true,
        content: 'Hello',
        embed: {
          title: 'Title',
          description: 'Desc',
          color: 'red',
          fields: [],
        },
      },
      directMessage: { enabled: false, content: '' },
      autoAssignRole: null,
    };
    const result = validateWelcomeConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('not a valid hex color'))).toBe(true);
  });

  it('should fail for empty embed title', () => {
    const config: WelcomeConfig = {
      channelMessage: {
        enabled: true,
        content: 'Hello',
        embed: {
          title: '',
          description: 'Desc',
          color: '#000000',
          fields: [],
        },
      },
      directMessage: { enabled: false, content: '' },
      autoAssignRole: null,
    };
    const result = validateWelcomeConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('embed title must not be empty'))).toBe(true);
  });

  it('should fail for empty embed description', () => {
    const config: WelcomeConfig = {
      channelMessage: {
        enabled: true,
        content: 'Hello',
        embed: {
          title: 'Title',
          description: '',
          color: '#000000',
          fields: [],
        },
      },
      directMessage: { enabled: false, content: '' },
      autoAssignRole: null,
    };
    const result = validateWelcomeConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('embed description must not be empty'))).toBe(true);
  });

  it('should fail for too-long embed description', () => {
    const config: WelcomeConfig = {
      channelMessage: {
        enabled: true,
        content: 'Hello',
        embed: {
          title: 'Title',
          description: 'x'.repeat(MAX_EMBED_DESCRIPTION_LENGTH + 1),
          color: '#000000',
          fields: [],
        },
      },
      directMessage: { enabled: false, content: '' },
      autoAssignRole: null,
    };
    const result = validateWelcomeConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('embed description exceeds'))).toBe(true);
  });

  it('should fail for too many embed fields', () => {
    const fields = Array.from({ length: MAX_EMBED_FIELDS + 1 }, (_, i) => ({
      name: `Field ${i}`,
      value: `Value ${i}`,
    }));
    const config: WelcomeConfig = {
      channelMessage: {
        enabled: true,
        content: 'Hello',
        embed: {
          title: 'Title',
          description: 'Desc',
          color: '#000000',
          fields,
        },
      },
      directMessage: { enabled: false, content: '' },
      autoAssignRole: null,
    };
    const result = validateWelcomeConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('maximum is'))).toBe(true);
  });

  it('should fail for empty embed field name', () => {
    const config: WelcomeConfig = {
      channelMessage: {
        enabled: true,
        content: 'Hello',
        embed: {
          title: 'Title',
          description: 'Desc',
          color: '#000000',
          fields: [{ name: '', value: 'val' }],
        },
      },
      directMessage: { enabled: false, content: '' },
      autoAssignRole: null,
    };
    const result = validateWelcomeConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('field name must not be empty'))).toBe(true);
  });

  it('should fail for empty embed field value', () => {
    const config: WelcomeConfig = {
      channelMessage: {
        enabled: true,
        content: 'Hello',
        embed: {
          title: 'Title',
          description: 'Desc',
          color: '#000000',
          fields: [{ name: 'Name', value: '' }],
        },
      },
      directMessage: { enabled: false, content: '' },
      autoAssignRole: null,
    };
    const result = validateWelcomeConfig(config);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('field value must not be empty'))).toBe(true);
  });

  it('should fail for empty autoAssignRole string', () => {
    const config: WelcomeConfig = {
      ...DEFAULT_WELCOME_CONFIG,
      autoAssignRole: '',
    };
    const result = validateWelcomeConfig(config);
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((i) => i.includes('autoAssignRole must not be an empty string')),
    ).toBe(true);
  });

  it('should fail for non-existent autoAssignRole when server config provided', () => {
    const config: WelcomeConfig = {
      ...DEFAULT_WELCOME_CONFIG,
      autoAssignRole: 'NonExistentRole',
    };
    const result = validateWelcomeConfig(config, SERVER_CONFIG);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('does not match any defined role'))).toBe(true);
  });

  it('should pass when autoAssignRole is null', () => {
    const config: WelcomeConfig = {
      ...DEFAULT_WELCOME_CONFIG,
      autoAssignRole: null,
    };
    const result = validateWelcomeConfig(config, SERVER_CONFIG);
    expect(result.valid).toBe(true);
  });
});

// ── Formatting Tests ───────────────────────────────────────────────

describe('TASK-103: Welcome config formatting', () => {
  it('should produce readable output for default config', () => {
    const output = formatWelcomeConfig(DEFAULT_WELCOME_CONFIG);
    expect(output).toContain('Discord Welcome Messages Configuration');
    expect(output).toContain('Channel Message');
    expect(output).toContain('Direct Message');
    expect(output).toContain('Auto-Assign Role');
    expect(output).toContain('Community');
    expect(output).toContain('Enabled');
  });

  it('should show Disabled for disabled messages', () => {
    const config: WelcomeConfig = {
      channelMessage: { enabled: true, content: 'Hi {username}' },
      directMessage: { enabled: false, content: '' },
      autoAssignRole: null,
    };
    const output = formatWelcomeConfig(config);
    expect(output).toContain('Enabled');
    expect(output).toContain('Disabled');
  });

  it('should list template variables used', () => {
    const output = formatWelcomeConfig(DEFAULT_WELCOME_CONFIG);
    expect(output).toContain('Template variables used:');
    expect(output).toContain('username');
  });

  it('should show (none) when no variables used', () => {
    const config: WelcomeConfig = {
      channelMessage: { enabled: true, content: 'Hello!' },
      directMessage: { enabled: false, content: '' },
      autoAssignRole: null,
    };
    const output = formatWelcomeConfig(config);
    expect(output).toContain('(none)');
  });
});

// ── buildWelcomeContext Tests ───────────────────────────────────────

describe('TASK-103: buildWelcomeContext', () => {
  it('should build context from server config', () => {
    const ctx = buildWelcomeContext(SERVER_CONFIG, 'TestUser', 150);
    expect(ctx.username).toBe('TestUser');
    expect(ctx.server).toBe('Crewspace');
    expect(ctx.memberCount).toBe(150);
    expect(ctx.rulesChannel).toBe('rules');
    expect(ctx.introChannel).toBe('introductions');
  });

  it('built context should render default messages without issues', () => {
    const ctx = buildWelcomeContext(SERVER_CONFIG, 'TestUser', 99);
    const rendered = renderWelcomeMessage(DEFAULT_WELCOME_CONFIG.channelMessage, ctx);
    expect(rendered.content).toContain('TestUser');
    expect(rendered.embed!.description).toContain('99');
  });
});

// ── Constants Tests ────────────────────────────────────────────────

describe('TASK-103: Welcome message constants', () => {
  it('WELCOME_VARIABLES should include the 5 standard variables', () => {
    expect(WELCOME_VARIABLES).toContain('username');
    expect(WELCOME_VARIABLES).toContain('server');
    expect(WELCOME_VARIABLES).toContain('memberCount');
    expect(WELCOME_VARIABLES).toContain('rulesChannel');
    expect(WELCOME_VARIABLES).toContain('introChannel');
    expect(WELCOME_VARIABLES).toHaveLength(5);
  });

  it('MAX_CONTENT_LENGTH should be 2000 (Discord limit)', () => {
    expect(MAX_CONTENT_LENGTH).toBe(2000);
  });

  it('MAX_EMBED_DESCRIPTION_LENGTH should be 4096 (Discord limit)', () => {
    expect(MAX_EMBED_DESCRIPTION_LENGTH).toBe(4096);
  });

  it('MAX_EMBED_FIELDS should be 25 (Discord limit)', () => {
    expect(MAX_EMBED_FIELDS).toBe(25);
  });
});
