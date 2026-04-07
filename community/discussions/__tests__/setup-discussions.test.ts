import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateSetupPlan,
  formatSetupPlan,
  formatCategorySummary,
  parseArgs,
  main,
} from '../setup-discussions.js';
import { DISCUSSIONS_CONFIG, DISCUSSION_CATEGORIES } from '../discussions-config.js';

// ── generateSetupPlan ──────────────────────────────────────────────

describe('generateSetupPlan', () => {
  it('generates a plan from the default config', () => {
    const plan = generateSetupPlan(DISCUSSIONS_CONFIG);
    expect(plan.repositoryUrl).toContain('github.com');
    expect(plan.totalCategories).toBe(DISCUSSION_CATEGORIES.length);
    expect(plan.totalLabels).toBeGreaterThan(0);
    expect(plan.totalTemplates).toBe(DISCUSSION_CATEGORIES.length);
    expect(plan.actions.length).toBeGreaterThan(0);
  });

  it('includes an enable-discussions action', () => {
    const plan = generateSetupPlan(DISCUSSIONS_CONFIG);
    const enableAction = plan.actions.find((a) => a.type === 'enable-discussions');
    expect(enableAction).toBeDefined();
  });

  it('includes one create-category action per category', () => {
    const plan = generateSetupPlan(DISCUSSIONS_CONFIG);
    const categoryActions = plan.actions.filter((a) => a.type === 'create-category');
    expect(categoryActions.length).toBe(DISCUSSION_CATEGORIES.length);
  });

  it('includes one create-template action per category', () => {
    const plan = generateSetupPlan(DISCUSSIONS_CONFIG);
    const templateActions = plan.actions.filter((a) => a.type === 'create-template');
    expect(templateActions.length).toBe(DISCUSSION_CATEGORIES.length);
  });

  it('includes contact link actions', () => {
    const plan = generateSetupPlan(DISCUSSIONS_CONFIG);
    const linkActions = plan.actions.filter((a) => a.type === 'add-contact-link');
    expect(linkActions.length).toBe(DISCUSSIONS_CONFIG.contactLinks.length);
  });

  it('includes a configure-moderation action', () => {
    const plan = generateSetupPlan(DISCUSSIONS_CONFIG);
    const modAction = plan.actions.find((a) => a.type === 'configure-moderation');
    expect(modAction).toBeDefined();
  });

  it('includes pin-discussion actions for pinned discussions', () => {
    const plan = generateSetupPlan(DISCUSSIONS_CONFIG);
    const pinActions = plan.actions.filter((a) => a.type === 'pin-discussion');
    expect(pinActions.length).toBe(DISCUSSIONS_CONFIG.moderation.pinnedDiscussions.length);
  });
});

// ── formatSetupPlan ────────────────────────────────────────────────

describe('formatSetupPlan', () => {
  it('produces a non-empty string', () => {
    const plan = generateSetupPlan(DISCUSSIONS_CONFIG);
    const output = formatSetupPlan(plan);
    expect(output.length).toBeGreaterThan(0);
  });

  it('includes the repository URL', () => {
    const plan = generateSetupPlan(DISCUSSIONS_CONFIG);
    const output = formatSetupPlan(plan);
    expect(output).toContain('github.com');
  });

  it('includes action types', () => {
    const plan = generateSetupPlan(DISCUSSIONS_CONFIG);
    const output = formatSetupPlan(plan);
    expect(output).toContain('enable-discussions');
    expect(output).toContain('create-category');
    expect(output).toContain('create-template');
    expect(output).toContain('add-contact-link');
    expect(output).toContain('configure-moderation');
  });

  it('includes total actions count', () => {
    const plan = generateSetupPlan(DISCUSSIONS_CONFIG);
    const output = formatSetupPlan(plan);
    expect(output).toContain(`Total actions: ${plan.actions.length}`);
  });
});

// ── formatCategorySummary ──────────────────────────────────────────

describe('formatCategorySummary', () => {
  it('includes category name and description', () => {
    const category = DISCUSSION_CATEGORIES[0]!;
    const summary = formatCategorySummary(category);
    expect(summary).toContain(category.name);
    expect(summary).toContain(category.description);
  });

  it('uses question mark icon for question-answer format', () => {
    const qa = DISCUSSION_CATEGORIES.find((c) => c.format === 'question-answer')!;
    const summary = formatCategorySummary(qa);
    expect(summary).toContain('❓');
  });

  it('uses chat icon for open format', () => {
    const open = DISCUSSION_CATEGORIES.find((c) => c.format === 'open')!;
    const summary = formatCategorySummary(open);
    expect(summary).toContain('💬');
  });

  it('includes category emoji', () => {
    const category = DISCUSSION_CATEGORIES[0]!;
    const summary = formatCategorySummary(category);
    expect(summary).toContain(category.emoji);
  });
});

// ── parseArgs ──────────────────────────────────────────────────────

describe('parseArgs', () => {
  it('defaults to non-dry-run with text format', () => {
    const args = parseArgs([]);
    expect(args.dryRun).toBe(false);
    expect(args.format).toBe('text');
  });

  it('parses --dry-run flag', () => {
    const args = parseArgs(['--dry-run']);
    expect(args.dryRun).toBe(true);
  });

  it('parses --format json', () => {
    const args = parseArgs(['--format', 'json']);
    expect(args.format).toBe('json');
  });

  it('parses --format text', () => {
    const args = parseArgs(['--format', 'text']);
    expect(args.format).toBe('text');
  });

  it('defaults to text for unknown format values', () => {
    const args = parseArgs(['--format', 'xml']);
    expect(args.format).toBe('text');
  });

  it('handles combined flags', () => {
    const args = parseArgs(['--dry-run', '--format', 'json']);
    expect(args.dryRun).toBe(true);
    expect(args.format).toBe('json');
  });
});

// ── main ───────────────────────────────────────────────────────────

describe('main', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.exitCode = undefined;
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    process.exitCode = undefined;
  });

  it('runs with --dry-run without errors', () => {
    main(['--dry-run']);
    expect(process.exitCode).toBeUndefined();
    expect(logSpy).toHaveBeenCalled();
    const allOutput = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allOutput).toContain('Dry run complete');
  });

  it('runs with --format json', () => {
    main(['--dry-run', '--format', 'json']);
    expect(process.exitCode).toBeUndefined();
    const jsonOutput = logSpy.mock.calls[0]?.[0];
    expect(() => JSON.parse(jsonOutput as string)).not.toThrow();
  });

  it('runs without flags and prints checklist', () => {
    main([]);
    expect(process.exitCode).toBeUndefined();
    const allOutput = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allOutput).toContain('checklist');
  });

  it('includes Q&A category in the plan output', () => {
    main(['--dry-run']);
    const allOutput = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allOutput).toContain('Q&A');
  });
});
