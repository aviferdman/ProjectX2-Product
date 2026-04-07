#!/usr/bin/env tsx
/**
 * GitHub Discussions Setup Script
 *
 * Generates a setup plan for Crewspace GitHub Discussions based on
 * the configuration in discussions-config.ts.
 *
 * Usage:
 *   tsx community/discussions/setup-discussions.ts [--dry-run]
 *
 * Options:
 *   --dry-run   Print the planned setup without executing (default behavior)
 *   --format    Output format: 'text' (default) or 'json'
 *
 * The script validates the configuration and outputs a human-readable
 * setup plan that can be used as a checklist when enabling Discussions.
 */

import {
  DISCUSSIONS_CONFIG,
  getAllLabels,
  validateDiscussionsConfig,
  type DiscussionCategory,
  type DiscussionsConfig,
} from './discussions-config.js';

// ── Types ──────────────────────────────────────────────────────────

export interface SetupAction {
  type:
    | 'enable-discussions'
    | 'create-category'
    | 'create-template'
    | 'add-contact-link'
    | 'configure-moderation'
    | 'pin-discussion';
  name: string;
  details: Record<string, unknown>;
}

export interface SetupPlan {
  repositoryUrl: string;
  actions: SetupAction[];
  totalCategories: number;
  totalLabels: number;
  totalTemplates: number;
}

// ── Plan Generation ────────────────────────────────────────────────

/** Generate a setup plan from a discussions configuration without executing anything. */
export function generateSetupPlan(config: DiscussionsConfig): SetupPlan {
  const actions: SetupAction[] = [];

  // Enable Discussions
  actions.push({
    type: 'enable-discussions',
    name: 'Enable GitHub Discussions',
    details: {
      repositoryUrl: config.repositoryUrl,
    },
  });

  // Create categories
  for (const category of config.categories) {
    actions.push({
      type: 'create-category',
      name: category.name,
      details: {
        slug: category.slug,
        description: category.description,
        emoji: category.emoji,
        format: category.format,
        labels: [...category.labels],
      },
    });

    actions.push({
      type: 'create-template',
      name: `Template: ${category.templateFile}`,
      details: {
        category: category.name,
        file: category.templateFile,
      },
    });
  }

  // Contact links
  for (const link of config.contactLinks) {
    actions.push({
      type: 'add-contact-link',
      name: link.name,
      details: {
        url: link.url,
        about: link.about,
      },
    });
  }

  // Moderation settings
  actions.push({
    type: 'configure-moderation',
    name: 'Moderation Settings',
    details: {
      requireApproval: config.moderation.requireApprovalForFirstPost,
      autoLockAfterDays: config.moderation.autoLockAfterDays,
      allowedReactions: [...config.moderation.allowedReactions],
    },
  });

  // Pinned discussions
  for (const title of config.moderation.pinnedDiscussions) {
    actions.push({
      type: 'pin-discussion',
      name: title,
      details: { title },
    });
  }

  return {
    repositoryUrl: config.repositoryUrl,
    actions,
    totalCategories: config.categories.length,
    totalLabels: getAllLabels(config).size,
    totalTemplates: config.categories.length,
  };
}

// ── Formatting ─────────────────────────────────────────────────────

/** Format a setup plan as a human-readable string. */
export function formatSetupPlan(plan: SetupPlan): string {
  const lines: string[] = [
    `GitHub Discussions Setup Plan`,
    '═'.repeat(55),
    '',
    `Repository: ${plan.repositoryUrl}`,
    `Categories: ${plan.totalCategories}`,
    `Labels: ${plan.totalLabels}`,
    `Templates: ${plan.totalTemplates}`,
    '',
    'Actions:',
    '─'.repeat(55),
  ];

  for (const action of plan.actions) {
    const icon =
      action.type === 'enable-discussions'
        ? '🔧'
        : action.type === 'create-category'
          ? '📁'
          : action.type === 'create-template'
            ? '📝'
            : action.type === 'add-contact-link'
              ? '🔗'
              : action.type === 'configure-moderation'
                ? '🛡️'
                : '📌';
    lines.push(`  ${icon} ${action.type}: ${action.name}`);

    if (action.type === 'create-category') {
      const details = action.details as Record<string, unknown>;
      lines.push(
        `     format: ${String(details['format'])}, labels: ${String((details['labels'] as string[]).join(', '))}`,
      );
    }
  }

  lines.push('', '─'.repeat(55));
  lines.push(`Total actions: ${plan.actions.length}`);

  return lines.join('\n');
}

// ── Category Formatting ────────────────────────────────────────────

export function formatCategorySummary(category: DiscussionCategory): string {
  const formatIcon = category.format === 'question-answer' ? '❓' : '💬';
  return `${category.emoji} ${category.name} (${formatIcon} ${category.format}) — ${category.description}`;
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
  const validation = validateDiscussionsConfig(DISCUSSIONS_CONFIG);
  if (!validation.valid) {
    console.error('❌ GitHub Discussions configuration is invalid:');
    for (const issue of validation.issues) {
      console.error(`   - ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  const plan = generateSetupPlan(DISCUSSIONS_CONFIG);

  if (args.format === 'json') {
    console.log(JSON.stringify(plan, null, 2));
  } else {
    console.log(formatSetupPlan(plan));
  }

  if (args.dryRun) {
    console.log(
      '\n✅ Dry run complete — this is a setup checklist for enabling GitHub Discussions.',
    );
    return;
  }

  console.log('\n📋 Setup checklist generated.');
  console.log('   Follow these steps to enable GitHub Discussions for Crewspace:');
  console.log('   1. Go to repository Settings → General → Features');
  console.log('   2. Check "Discussions" to enable the feature');
  console.log('   3. Create discussion categories as listed above');
  console.log('   4. Pin the welcome and Q&A guide discussions');
  console.log('   5. Update issue template config.yml to redirect questions to Discussions');
  console.log('   6. Discussion form templates are already in .github/DISCUSSION_TEMPLATE/');
}

// Run if executed directly
const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] !== undefined &&
  (process.argv[1].endsWith('setup-discussions.ts') ||
    process.argv[1].endsWith('setup-discussions.js'));

if (isDirectRun) {
  main();
}
