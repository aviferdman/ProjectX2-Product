/**
 * Crewspace Twitter/X Community Configuration
 *
 * Exports the account configuration and utilities for setting up
 * and validating the Crewspace Twitter/X account.
 */

export {
  ACCOUNT_CONFIG,
  PROFILE,
  CONTENT_CATEGORIES,
  PINNED_TWEET,
  POSTING_SCHEDULE,
  GLOBAL_HASHTAGS,
  getAllHashtags,
  getCategoryNames,
  getCategoriesByFrequency,
  validateHandle,
  validateBio,
  validateHashtag,
  validatePostingSchedule,
  validateNoDuplicateCategories,
  validateAccountConfig,
} from './account-config.js';

export type {
  TwitterProfile,
  ContentCategory,
  PinnedTweet,
  PostingSchedule,
  TwitterAccountConfig,
} from './account-config.js';

export {
  generateSetupPlan,
  formatSetupPlan,
  formatProfileSummary,
  formatCategorySummary,
  parseArgs,
} from './setup-twitter.js';

export type { SetupAction, SetupPlan, CliArgs } from './setup-twitter.js';
