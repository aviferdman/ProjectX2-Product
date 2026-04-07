/**
 * Crewspace Discord Bot Scaffold
 *
 * Provides the bot client lifecycle (auth, connect, disconnect) and the
 * automated welcome-message handler that fires when a new member joins.
 *
 * The module is designed around dependency injection: callers supply a
 * {@link DiscordClient} adapter so the bot logic is fully testable without
 * a live Discord connection or the discord.js package installed.
 *
 * Usage (with discord.js):
 * ```typescript
 * import { Client, GatewayIntentBits } from 'discord.js';
 * import { createBot } from './bot.js';
 * import { DEFAULT_WELCOME_CONFIG } from './welcome-messages.js';
 * import { SERVER_CONFIG } from './server-config.js';
 *
 * const djsClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
 *
 * const bot = createBot({
 *   token: process.env.DISCORD_BOT_TOKEN!,
 *   serverConfig: SERVER_CONFIG,
 *   welcomeConfig: DEFAULT_WELCOME_CONFIG,
 *   client: {
 *     login: (t) => djsClient.login(t).then(() => {}),
 *     destroy: () => djsClient.destroy().then(() => {}),
 *     onGuildMemberAdd: (handler) => { djsClient.on('guildMemberAdd', handler); },
 *     onReady: (handler) => { djsClient.once('ready', handler); },
 *   },
 * });
 *
 * await bot.start();
 * ```
 *
 * @packageDocumentation
 */

import type { DiscordServerConfig } from './server-config.js';
import type { WelcomeConfig, WelcomeContext } from './welcome-messages.js';
import {
  renderWelcomeMessage,
  buildWelcomeContext,
  validateWelcomeConfig,
} from './welcome-messages.js';

// ── Types ──────────────────────────────────────────────────────────

/** Minimal member object supplied to event handlers. */
export interface BotMember {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
}

/** Minimal guild (server) object supplied to event handlers. */
export interface BotGuild {
  readonly id: string;
  readonly name: string;
  readonly memberCount: number;
}

/** The result of handling a welcome event. */
export interface WelcomeResult {
  readonly member: BotMember;
  readonly guild: BotGuild;
  readonly context: WelcomeContext;
  readonly channelMessageSent: boolean;
  readonly directMessageSent: boolean;
  readonly roleAssigned: boolean;
}

/**
 * Adapter interface for Discord API interactions.
 *
 * Consumers provide an implementation backed by discord.js (or any other
 * library) so the bot logic remains decoupled and testable.
 */
export interface DiscordClient {
  /** Authenticate with the Discord gateway using the given token. */
  login(token: string): Promise<void>;
  /** Disconnect and clean up resources. */
  destroy(): Promise<void>;
  /** Register a handler for the `guildMemberAdd` event. */
  onGuildMemberAdd(handler: (member: BotMember, guild: BotGuild) => void): void;
  /** Register a one-time handler for the `ready` event. */
  onReady(handler: () => void): void;
}

/**
 * Adapter interface for sending messages through the Discord API.
 *
 * Separating message delivery from the client keeps the welcome handler
 * focused on business logic.
 */
export interface MessageSender {
  /** Send a message to a channel identified by name within a guild. */
  sendToChannel(guildId: string, channelName: string, content: string): Promise<boolean>;
  /** Send a direct message to a user. */
  sendDirectMessage(userId: string, content: string): Promise<boolean>;
  /** Assign a role by name to a member in a guild. */
  assignRole(guildId: string, memberId: string, roleName: string): Promise<boolean>;
}

/** Configuration required to create a bot instance. */
export interface BotConfig {
  /** Discord bot token for authentication. */
  readonly token: string;
  /** Discord server configuration (channels, roles, etc.). */
  readonly serverConfig: DiscordServerConfig;
  /** Welcome message templates and settings. */
  readonly welcomeConfig: WelcomeConfig;
  /** Discord client adapter. */
  readonly client: DiscordClient;
  /** Message sender adapter (optional — defaults to a no-op sender). */
  readonly sender?: MessageSender;
}

/** The bot lifecycle & event-handling API. */
export interface Bot {
  /** Start the bot: validate config, register handlers, authenticate. */
  start(): Promise<void>;
  /** Gracefully shut down the bot. */
  stop(): Promise<void>;
  /** Whether the bot is currently connected. */
  readonly isRunning: boolean;
  /** Handle a member-join event (exposed for testing). */
  handleMemberJoin(member: BotMember, guild: BotGuild): Promise<WelcomeResult>;
}

// ── Defaults ───────────────────────────────────────────────────────

/** A no-op message sender — logs actions but performs no real I/O. */
export const noopSender: MessageSender = {
  async sendToChannel(_guildId, _channelName, _content) {
    return false;
  },
  async sendDirectMessage(_userId, _content) {
    return false;
  },
  async assignRole(_guildId, _memberId, _roleName) {
    return false;
  },
};

// ── Validation ─────────────────────────────────────────────────────

/** Validate the full bot configuration before startup. */
export function validateBotConfig(config: BotConfig): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!config.token || config.token.trim().length === 0) {
    issues.push('Bot token must not be empty');
  }

  if (!config.client) {
    issues.push('A DiscordClient adapter is required');
  }

  const welcomeValidation = validateWelcomeConfig(config.welcomeConfig, config.serverConfig);
  if (!welcomeValidation.valid) {
    issues.push(...welcomeValidation.issues);
  }

  return { valid: issues.length === 0, issues };
}

// ── Welcome Handler ────────────────────────────────────────────────

/**
 * Build a rendered welcome message content string from a
 * WelcomeMessageConfig and context.
 */
function buildRenderedContent(
  config: WelcomeConfig,
  context: WelcomeContext,
  target: 'channel' | 'dm',
): string {
  const msgConfig = target === 'channel' ? config.channelMessage : config.directMessage;
  const rendered = renderWelcomeMessage(msgConfig, context);

  const parts: string[] = [rendered.content];
  if (rendered.embed) {
    parts.push(`**${rendered.embed.title}**`);
    parts.push(rendered.embed.description);
    for (const field of rendered.embed.fields) {
      parts.push(`**${field.name}**: ${field.value}`);
    }
    if (rendered.embed.footer) {
      parts.push(`_${rendered.embed.footer}_`);
    }
  }
  return parts.join('\n');
}

/**
 * Process a member-join event: send channel message, DM, and assign role.
 */
export async function handleWelcome(
  member: BotMember,
  guild: BotGuild,
  config: BotConfig,
  sender: MessageSender,
): Promise<WelcomeResult> {
  const context = buildWelcomeContext(config.serverConfig, member.displayName, guild.memberCount);

  let channelMessageSent = false;
  let directMessageSent = false;
  let roleAssigned = false;

  if (config.welcomeConfig.channelMessage.enabled) {
    const content = buildRenderedContent(config.welcomeConfig, context, 'channel');
    channelMessageSent = await sender.sendToChannel(
      guild.id,
      config.serverConfig.welcomeChannelName,
      content,
    );
  }

  if (config.welcomeConfig.directMessage.enabled) {
    const content = buildRenderedContent(config.welcomeConfig, context, 'dm');
    directMessageSent = await sender.sendDirectMessage(member.id, content);
  }

  if (config.welcomeConfig.autoAssignRole !== null) {
    roleAssigned = await sender.assignRole(
      guild.id,
      member.id,
      config.welcomeConfig.autoAssignRole,
    );
  }

  return {
    member,
    guild,
    context,
    channelMessageSent,
    directMessageSent,
    roleAssigned,
  };
}

// ── Bot Factory ────────────────────────────────────────────────────

/**
 * Create a new Crewspace Discord bot instance.
 *
 * The returned object exposes a clean lifecycle API (`start` / `stop`)
 * and an event handler (`handleMemberJoin`) for testability.
 */
export function createBot(config: BotConfig): Bot {
  let running = false;
  const sender = config.sender ?? noopSender;

  async function handleMemberJoin(member: BotMember, guild: BotGuild): Promise<WelcomeResult> {
    return handleWelcome(member, guild, config, sender);
  }

  return {
    get isRunning() {
      return running;
    },

    async start() {
      const validation = validateBotConfig(config);
      if (!validation.valid) {
        throw new Error(
          `Invalid bot configuration:\n${validation.issues.map((i) => `  - ${i}`).join('\n')}`,
        );
      }

      config.client.onGuildMemberAdd((member, guild) => {
        void handleMemberJoin(member, guild);
      });

      await new Promise<void>((resolve) => {
        config.client.onReady(() => {
          running = true;
          resolve();
        });
        void config.client.login(config.token);
      });
    },

    async stop() {
      if (!running) return;
      await config.client.destroy();
      running = false;
    },

    handleMemberJoin,
  };
}
