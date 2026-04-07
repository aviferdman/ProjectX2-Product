/**
 * Crewspace GitHub Discussions Community Configuration
 *
 * Exports the discussions configuration and utilities for setting up
 * and validating the Crewspace GitHub Discussions forum.
 */

export {
  DISCUSSIONS_CONFIG,
  DISCUSSION_CATEGORIES,
  MODERATION_SETTINGS,
  CONTACT_LINKS,
  getCategoryNames,
  getCategorySlugs,
  getCategoriesByFormat,
  getAllLabels,
  getCategoryBySlug,
  validateSlug,
  validateNoDuplicateCategories,
  validateTemplateFiles,
  validateDiscussionsConfig,
} from './discussions-config.js';

export type {
  DiscussionFormat,
  DiscussionCategory,
  ModerationSettings,
  DiscussionsConfig,
  ContactLink,
} from './discussions-config.js';

export {
  generateSetupPlan,
  formatSetupPlan,
  formatCategorySummary,
  parseArgs,
} from './setup-discussions.js';

export type { SetupAction, SetupPlan, CliArgs } from './setup-discussions.js';
