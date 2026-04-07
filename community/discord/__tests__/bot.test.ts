import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createBot,
  handleWelcome,
  validateBotConfig,
  noopSender,
  type BotConfig,
  type BotMember,
  type BotGuild,
  type DiscordClient,
  type MessageSender,
} from '../bot.js';
import { SERVER_CONFIG } from '../server-config.js';
import { DEFAULT_WELCOME_CONFIG } from '../welcome-messages.js';
import type { WelcomeConfig } from '../welcome-messages.js';

// ── Helpers ────────────────────────────────────────────────────────

function createMockClient(): DiscordClient & {
  _triggerReady: () => void;
  _triggerMemberAdd: (member: BotMember, guild: BotGuild) => void;
} {
  let readyHandler: (() => void) | null = null;
  let memberAddHandler: ((m: BotMember, g: BotGuild) => void) | null = null;

  return {
    login: vi.fn(async () => {
      // Simulate async connect then fire ready
      queueMicrotask(() => readyHandler?.());
    }),
    destroy: vi.fn(async () => {}),
    onGuildMemberAdd: vi.fn((handler) => {
      memberAddHandler = handler;
    }),
    onReady: vi.fn((handler) => {
      readyHandler = handler;
    }),
    _triggerReady() {
      readyHandler?.();
    },
    _triggerMemberAdd(member, guild) {
      memberAddHandler?.(member, guild);
    },
  };
}

function createMockSender(): MessageSender & {
  sendToChannel: ReturnType<typeof vi.fn>;
  sendDirectMessage: ReturnType<typeof vi.fn>;
  assignRole: ReturnType<typeof vi.fn>;
} {
  return {
    sendToChannel: vi.fn(async () => true),
    sendDirectMessage: vi.fn(async () => true),
    assignRole: vi.fn(async () => true),
  };
}

const SAMPLE_MEMBER: BotMember = {
  id: 'user-123',
  username: 'testuser',
  displayName: 'Test User',
};

const SAMPLE_GUILD: BotGuild = {
  id: 'guild-456',
  name: 'Crewspace',
  memberCount: 42,
};

function makeConfig(overrides?: Partial<BotConfig>): BotConfig {
  return {
    token: 'test-token-abc',
    serverConfig: SERVER_CONFIG,
    welcomeConfig: DEFAULT_WELCOME_CONFIG,
    client: createMockClient(),
    sender: createMockSender(),
    ...overrides,
  };
}

// ── validateBotConfig ──────────────────────────────────────────────

describe('validateBotConfig', () => {
  it('passes with a valid configuration', () => {
    const result = validateBotConfig(makeConfig());
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('rejects an empty token', () => {
    const result = validateBotConfig(makeConfig({ token: '' }));
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Bot token must not be empty');
  });

  it('rejects a whitespace-only token', () => {
    const result = validateBotConfig(makeConfig({ token: '   ' }));
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Bot token must not be empty');
  });

  it('surfaces welcome config validation issues', () => {
    const badWelcome: WelcomeConfig = {
      channelMessage: { enabled: false, content: '' },
      directMessage: { enabled: false, content: '' },
      autoAssignRole: null,
    };
    const result = validateBotConfig(makeConfig({ welcomeConfig: badWelcome }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('At least one'))).toBe(true);
  });
});

// ── noopSender ─────────────────────────────────────────────────────

describe('noopSender', () => {
  it('returns false for sendToChannel', async () => {
    expect(await noopSender.sendToChannel('g', 'c', 'msg')).toBe(false);
  });

  it('returns false for sendDirectMessage', async () => {
    expect(await noopSender.sendDirectMessage('u', 'msg')).toBe(false);
  });

  it('returns false for assignRole', async () => {
    expect(await noopSender.assignRole('g', 'u', 'role')).toBe(false);
  });
});

// ── handleWelcome ──────────────────────────────────────────────────

describe('handleWelcome', () => {
  let sender: ReturnType<typeof createMockSender>;
  let config: BotConfig;

  beforeEach(() => {
    sender = createMockSender();
    config = makeConfig({ sender });
  });

  it('sends channel message when enabled', async () => {
    const result = await handleWelcome(SAMPLE_MEMBER, SAMPLE_GUILD, config, sender);
    expect(sender.sendToChannel).toHaveBeenCalledOnce();
    expect(sender.sendToChannel).toHaveBeenCalledWith(
      'guild-456',
      'welcome',
      expect.stringContaining('Test User'),
    );
    expect(result.channelMessageSent).toBe(true);
  });

  it('sends direct message when enabled', async () => {
    const result = await handleWelcome(SAMPLE_MEMBER, SAMPLE_GUILD, config, sender);
    expect(sender.sendDirectMessage).toHaveBeenCalledOnce();
    expect(sender.sendDirectMessage).toHaveBeenCalledWith(
      'user-123',
      expect.stringContaining('Test User'),
    );
    expect(result.directMessageSent).toBe(true);
  });

  it('assigns auto-assign role', async () => {
    const result = await handleWelcome(SAMPLE_MEMBER, SAMPLE_GUILD, config, sender);
    expect(sender.assignRole).toHaveBeenCalledOnce();
    expect(sender.assignRole).toHaveBeenCalledWith('guild-456', 'user-123', 'Community');
    expect(result.roleAssigned).toBe(true);
  });

  it('includes member count in rendered content', async () => {
    await handleWelcome(SAMPLE_MEMBER, SAMPLE_GUILD, config, sender);
    const channelContent = sender.sendToChannel.mock.calls[0]?.[2] as string;
    expect(channelContent).toContain('42');
  });

  it('includes server name in rendered content', async () => {
    await handleWelcome(SAMPLE_MEMBER, SAMPLE_GUILD, config, sender);
    const channelContent = sender.sendToChannel.mock.calls[0]?.[2] as string;
    expect(channelContent).toContain('Crewspace');
  });

  it('skips channel message when disabled', async () => {
    const disabledWelcome: WelcomeConfig = {
      ...DEFAULT_WELCOME_CONFIG,
      channelMessage: { ...DEFAULT_WELCOME_CONFIG.channelMessage, enabled: false },
    };
    config = makeConfig({ welcomeConfig: disabledWelcome, sender });
    const result = await handleWelcome(SAMPLE_MEMBER, SAMPLE_GUILD, config, sender);
    expect(sender.sendToChannel).not.toHaveBeenCalled();
    expect(result.channelMessageSent).toBe(false);
  });

  it('skips direct message when disabled', async () => {
    const disabledWelcome: WelcomeConfig = {
      ...DEFAULT_WELCOME_CONFIG,
      directMessage: { ...DEFAULT_WELCOME_CONFIG.directMessage, enabled: false },
    };
    config = makeConfig({ welcomeConfig: disabledWelcome, sender });
    const result = await handleWelcome(SAMPLE_MEMBER, SAMPLE_GUILD, config, sender);
    expect(sender.sendDirectMessage).not.toHaveBeenCalled();
    expect(result.directMessageSent).toBe(false);
  });

  it('skips role assignment when autoAssignRole is null', async () => {
    const noRoleWelcome: WelcomeConfig = {
      ...DEFAULT_WELCOME_CONFIG,
      autoAssignRole: null,
    };
    config = makeConfig({ welcomeConfig: noRoleWelcome, sender });
    const result = await handleWelcome(SAMPLE_MEMBER, SAMPLE_GUILD, config, sender);
    expect(sender.assignRole).not.toHaveBeenCalled();
    expect(result.roleAssigned).toBe(false);
  });

  it('returns the resolved WelcomeContext', async () => {
    const result = await handleWelcome(SAMPLE_MEMBER, SAMPLE_GUILD, config, sender);
    expect(result.context.username).toBe('Test User');
    expect(result.context.server).toBe('Crewspace');
    expect(result.context.memberCount).toBe(42);
    expect(result.context.rulesChannel).toBe('rules');
    expect(result.context.introChannel).toBe('introductions');
  });

  it('handles sender failures gracefully', async () => {
    sender.sendToChannel.mockResolvedValue(false);
    sender.sendDirectMessage.mockResolvedValue(false);
    sender.assignRole.mockResolvedValue(false);

    const result = await handleWelcome(SAMPLE_MEMBER, SAMPLE_GUILD, config, sender);
    expect(result.channelMessageSent).toBe(false);
    expect(result.directMessageSent).toBe(false);
    expect(result.roleAssigned).toBe(false);
  });
});

// ── createBot ──────────────────────────────────────────────────────

describe('createBot', () => {
  it('creates a bot that is not running initially', () => {
    const bot = createBot(makeConfig());
    expect(bot.isRunning).toBe(false);
  });

  it('starts and becomes running after login', async () => {
    const config = makeConfig();
    const bot = createBot(config);
    await bot.start();
    expect(bot.isRunning).toBe(true);
    expect(config.client.login).toHaveBeenCalledWith('test-token-abc');
  });

  it('registers guildMemberAdd handler on start', async () => {
    const config = makeConfig();
    const bot = createBot(config);
    await bot.start();
    expect(config.client.onGuildMemberAdd).toHaveBeenCalledOnce();
  });

  it('registers ready handler on start', async () => {
    const config = makeConfig();
    const bot = createBot(config);
    await bot.start();
    expect(config.client.onReady).toHaveBeenCalledOnce();
  });

  it('stops and becomes not running', async () => {
    const config = makeConfig();
    const bot = createBot(config);
    await bot.start();
    await bot.stop();
    expect(bot.isRunning).toBe(false);
    expect(config.client.destroy).toHaveBeenCalledOnce();
  });

  it('stop is a no-op when not running', async () => {
    const config = makeConfig();
    const bot = createBot(config);
    await bot.stop();
    expect(config.client.destroy).not.toHaveBeenCalled();
  });

  it('throws on start with invalid config', async () => {
    const config = makeConfig({ token: '' });
    const bot = createBot(config);
    await expect(bot.start()).rejects.toThrow('Invalid bot configuration');
  });

  it('exposes handleMemberJoin for direct testing', async () => {
    const sender = createMockSender();
    const config = makeConfig({ sender });
    const bot = createBot(config);

    const result = await bot.handleMemberJoin(SAMPLE_MEMBER, SAMPLE_GUILD);
    expect(result.member).toBe(SAMPLE_MEMBER);
    expect(result.guild).toBe(SAMPLE_GUILD);
    expect(sender.sendToChannel).toHaveBeenCalled();
  });

  it('uses noopSender when no sender is provided', async () => {
    const client = createMockClient();
    const config: BotConfig = {
      token: 'tok',
      serverConfig: SERVER_CONFIG,
      welcomeConfig: DEFAULT_WELCOME_CONFIG,
      client,
    };
    const bot = createBot(config);
    // Should not throw — noop sender silently returns false
    await expect(bot.handleMemberJoin(SAMPLE_MEMBER, SAMPLE_GUILD)).resolves.toBeDefined();
  });
});
