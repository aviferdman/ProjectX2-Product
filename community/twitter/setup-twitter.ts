#!/usr/bin/env tsx
/**
 * Twitter/X Account Setup Script
 *
 * Generates a setup plan for the Crewspace Twitter/X account based on
 * the configuration in account-config.ts.
 *
 * Usage:
 *   tsx community/twitter/setup-twitter.ts [--dry-run]
 *
 * Options:
 *   --dry-run   Print the planned setup without executing (default behavior)
 *   --format    Output format: 'text' (default) or 'json'
 *
 * The script validates the configuration and outputs a human-readable
 * setup plan that can be used as a checklist when creating the account.
 */

import {
  ACCOUNT_CONFIG,
  getAllHashtags,
  validateAccountConfig,
  type ContentCategory,
  type TwitterAccountConfig,
  type TwitterProfile,
} from './account-config.js';

// ── Types ──────────────────────────────────────────────────────────

export interface SetupAction {
  type:
    | 'create-account'
    | 'set-profile'
    | 'configure-category'
    | 'set-pinned-tweet'
    | 'configure-schedule';
  name: string;
  details: Record<string, unknown>;
}

export interface SetupPlan {
  accountHandle: string;
  actions: SetupAction[];
  totalCategories: number;
  totalHashtags: number;
}

// ── Plan Generation ────────────────────────────────────────────────

/** Generate a setup plan from an account configuration without executing anything. */
export function generateSetupPlan(config: TwitterAccountConfig): SetupPlan {
  const actions: SetupAction[] = [];

  // Account creation action
  actions.push({
    type: 'create-account',
    name: config.profile.handle,
    details: {
      displayName: config.profile.displayName,
      handle: config.profile.handle,
    },
  });

  // Profile setup action
  actions.push({
    type: 'set-profile',
    name: 'Profile Setup',
    details: {
      bio: config.profile.bio,
      url: config.profile.url,
      location: config.profile.location,
    },
  });

  // Content category actions
  for (const category of config.contentCategories) {
    actions.push({
      type: 'configure-category',
      name: category.name,
      details: {
        description: category.description,
        frequency: category.frequency,
        hashtags: [...category.hashtags],
        exampleCount: category.examples.length,
      },
    });
  }

  // Pinned tweet action
  actions.push({
    type: 'set-pinned-tweet',
    name: 'Pinned Tweet',
    details: {
      purpose: config.pinnedTweet.purpose,
      templateLength: config.pinnedTweet.template.length,
    },
  });

  // Schedule action
  actions.push({
    type: 'configure-schedule',
    name: 'Posting Schedule',
    details: {
      timezone: config.postingSchedule.timezone,
      preferredDays: [...config.postingSchedule.preferredDays],
      preferredHoursUTC: [...config.postingSchedule.preferredHoursUTC],
      maxPostsPerDay: config.postingSchedule.maxPostsPerDay,
    },
  });

  return {
    accountHandle: config.profile.handle,
    actions,
    totalCategories: config.contentCategories.length,
    totalHashtags: getAllHashtags(config).size,
  };
}

// ── Formatting ─────────────────────────────────────────────────────

/** Format a setup plan as a human-readable string. */
export function formatSetupPlan(plan: SetupPlan): string {
  const lines: string[] = [
    `Twitter/X Account Setup Plan: ${plan.accountHandle}`,
    '═'.repeat(55),
    '',
    `Content Categories: ${plan.totalCategories}`,
    `Unique Hashtags: ${plan.totalHashtags}`,
    '',
    'Actions:',
    '─'.repeat(55),
  ];

  for (const action of plan.actions) {
    const icon =
      action.type === 'create-account'
        ? '🐦'
        : action.type === 'set-profile'
          ? '👤'
          : action.type === 'configure-category'
            ? '📋'
            : action.type === 'set-pinned-tweet'
              ? '📌'
              : '🕐';
    lines.push(`  ${icon} ${action.type}: ${action.name}`);

    if (action.type === 'configure-category') {
      const details = action.details as Record<string, unknown>;
      lines.push(
        `     frequency: ${String(details['frequency'])}, hashtags: ${String((details['hashtags'] as string[]).join(', '))}`,
      );
    }
  }

  lines.push('', '─'.repeat(55));
  lines.push(`Total actions: ${plan.actions.length}`);

  return lines.join('\n');
}

// ── Profile Formatting ─────────────────────────────────────────────

export function formatProfileSummary(profile: TwitterProfile): string {
  return `${profile.displayName} (${profile.handle}) — ${profile.bio}`;
}

// ── Category Formatting ────────────────────────────────────────────

export function formatCategorySummary(category: ContentCategory): string {
  const freqIcon =
    category.frequency === 'daily'
      ? '📅'
      : category.frequency === 'weekly'
        ? '📆'
        : category.frequency === 'on-event'
          ? '🎯'
          : '🗓️';
  return `${freqIcon} ${category.name} (${category.frequency}) — ${category.description}`;
}

// ── CLI Arguments ──────────────────────────────────────────────────

export interface CliArgs {
  dryRun: boolean;
  format: 'text' | 'json';
}

export function parseArgs(argv: string[]): CliArgs {
  const dryRun = argv.includes('--dry-run');
  const formatIdx = argv.indexOf('--format');
  const formatValue =
    formatIdx !== -1 && argv.length > formatIdx + 1 ? argv[formatIdx + 1] : undefined;
  const format: 'text' | 'json' = formatValue === 'json' ? 'json' : 'text';

  return { dryRun, format };
}

// ── Main ───────────────────────────────────────────────────────────

export function main(argv: string[] = process.argv.slice(2)): void {
  const args = parseArgs(argv);

  // Validate configuration
  const validation = validateAccountConfig(ACCOUNT_CONFIG);
  if (!validation.valid) {
    console.error('❌ Twitter account configuration is invalid:');
    for (const issue of validation.issues) {
      console.error(`   - ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  const plan = generateSetupPlan(ACCOUNT_CONFIG);

  if (args.format === 'json') {
    console.log(JSON.stringify(plan, null, 2));
  } else {
    console.log(formatSetupPlan(plan));
  }

  if (args.dryRun) {
    console.log('\n✅ Dry run complete — this is a setup checklist for manual account creation.');
    return;
  }

  console.log('\n📋 Setup checklist generated.');
  console.log('   Follow these steps to create the Crewspace Twitter/X account:');
  console.log('   1. Go to https://twitter.com/signup');
  console.log(`   2. Register the handle: ${ACCOUNT_CONFIG.profile.handle}`);
  console.log('   3. Set the profile bio, URL, and location as shown above');
  console.log('   4. Post and pin the introductory tweet');
  console.log('   5. Follow the posting schedule for each content category');
}

// Run if executed directly
const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] !== undefined &&
  (process.argv[1].endsWith('setup-twitter.ts') || process.argv[1].endsWith('setup-twitter.js'));

if (isDirectRun) {
  main();
}
