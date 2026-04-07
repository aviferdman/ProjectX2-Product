/**
 * Crewspace Discord Community Configuration
 *
 * Exports the server configuration and utilities for setting up
 * and validating the Crewspace Discord server structure, including
 * automated welcome messages for new members.
 */

export {
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
} from './server-config.js';

export type {
  DiscordRole,
  DiscordChannel,
  DiscordCategory,
  DiscordServerConfig,
} from './server-config.js';

export {
  generateSetupPlan,
  formatSetupPlan,
  formatRoleSummary,
  formatChannelSummary,
  parseArgs,
} from './setup-discord.js';

export type { SetupAction, SetupPlan, CliArgs } from './setup-discord.js';

// Welcome Messages
export {
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
} from './welcome-messages.js';

export type {
  WelcomeVariable,
  EmbedField,
  WelcomeEmbed,
  WelcomeMessageConfig,
  WelcomeConfig,
  WelcomeConfigValidation,
  WelcomeContext,
} from './welcome-messages.js';

// Bot
export {
  createBot,
  handleWelcome,
  validateBotConfig,
  noopSender,
} from './bot.js';

export type {
  BotMember,
  BotGuild,
  WelcomeResult,
  DiscordClient,
  MessageSender,
  BotConfig,
  Bot,
} from './bot.js';
