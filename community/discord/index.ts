/**
 * Crewspace Discord Community Configuration
 *
 * Exports the server configuration and utilities for setting up
 * and validating the Crewspace Discord server structure.
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
