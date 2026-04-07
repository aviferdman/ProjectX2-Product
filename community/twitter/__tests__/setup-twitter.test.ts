import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateSetupPlan,
  formatSetupPlan,
  formatProfileSummary,
  formatCategorySummary,
  parseArgs,
  main,
} from '../setup-twitter.js';
import {
  ACCOUNT_CONFIG,
  PROFILE,
  CONTENT_CATEGORIES,
  type TwitterAccountConfig,
} from '../account-config.js';

// ── generateSetupPlan ──────────────────────────────────────────────

describe('generateSetupPlan', () => {
  it('generates a plan from the default config', () => {
    const plan = generateSetupPlan(ACCOUNT_CONFIG);
    expect(plan.accountHandle).toBe('@crewspace_dev');
    expect(plan.totalCategories).toBe(CONTENT_CATEGORIES.length);
    expect(plan.totalHashtags).toBeGreaterThan(0);
    expect(plan.actions.length).toBeGreaterThan(0);
  });

  it('includes a create-account action', () => {
    const plan = generateSetupPlan(ACCOUNT_CONFIG);
    const createAction = plan.actions.find((a) => a.type === 'create-account');
    expect(createAction).toBeDefined();
    expect(createAction!.name).toBe('@crewspace_dev');
  });

  it('includes a set-profile action', () => {
    const plan = generateSetupPlan(ACCOUNT_CONFIG);
    const profileAction = plan.actions.find((a) => a.type === 'set-profile');
    expect(profileAction).toBeDefined();
    expect(profileAction!.details['bio']).toBe(PROFILE.bio);
  });

  it('includes one configure-category action per category', () => {
    const plan = generateSetupPlan(ACCOUNT_CONFIG);
    const categoryActions = plan.actions.filter((a) => a.type === 'configure-category');
    expect(categoryActions.length).toBe(CONTENT_CATEGORIES.length);
  });

  it('includes a set-pinned-tweet action', () => {
    const plan = generateSetupPlan(ACCOUNT_CONFIG);
    const pinAction = plan.actions.find((a) => a.type === 'set-pinned-tweet');
    expect(pinAction).toBeDefined();
  });

  it('includes a configure-schedule action', () => {
    const plan = generateSetupPlan(ACCOUNT_CONFIG);
    const scheduleAction = plan.actions.find((a) => a.type === 'configure-schedule');
    expect(scheduleAction).toBeDefined();
    expect(scheduleAction!.details['timezone']).toBe('UTC');
  });
});

// ── formatSetupPlan ────────────────────────────────────────────────

describe('formatSetupPlan', () => {
  it('produces a non-empty string', () => {
    const plan = generateSetupPlan(ACCOUNT_CONFIG);
    const output = formatSetupPlan(plan);
    expect(output.length).toBeGreaterThan(0);
  });

  it('includes the account handle', () => {
    const plan = generateSetupPlan(ACCOUNT_CONFIG);
    const output = formatSetupPlan(plan);
    expect(output).toContain('@crewspace_dev');
  });

  it('includes action types', () => {
    const plan = generateSetupPlan(ACCOUNT_CONFIG);
    const output = formatSetupPlan(plan);
    expect(output).toContain('create-account');
    expect(output).toContain('set-profile');
    expect(output).toContain('configure-category');
    expect(output).toContain('set-pinned-tweet');
    expect(output).toContain('configure-schedule');
  });

  it('includes total actions count', () => {
    const plan = generateSetupPlan(ACCOUNT_CONFIG);
    const output = formatSetupPlan(plan);
    expect(output).toContain(`Total actions: ${plan.actions.length}`);
  });
});

// ── formatProfileSummary ───────────────────────────────────────────

describe('formatProfileSummary', () => {
  it('includes display name and handle', () => {
    const summary = formatProfileSummary(PROFILE);
    expect(summary).toContain('Crewspace');
    expect(summary).toContain('@crewspace_dev');
  });

  it('includes bio text', () => {
    const summary = formatProfileSummary(PROFILE);
    expect(summary).toContain(PROFILE.bio);
  });
});

// ── formatCategorySummary ──────────────────────────────────────────

describe('formatCategorySummary', () => {
  it('includes category name and frequency', () => {
    const category = CONTENT_CATEGORIES[0]!;
    const summary = formatCategorySummary(category);
    expect(summary).toContain(category.name);
    expect(summary).toContain(category.frequency);
  });

  it('uses target icon for on-event frequency', () => {
    const onEvent = CONTENT_CATEGORIES.find((c) => c.frequency === 'on-event')!;
    const summary = formatCategorySummary(onEvent);
    expect(summary).toContain('🎯');
  });

  it('uses calendar icon for weekly frequency', () => {
    const weekly = CONTENT_CATEGORIES.find((c) => c.frequency === 'weekly')!;
    const summary = formatCategorySummary(weekly);
    expect(summary).toContain('📆');
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
    // First call should be JSON output
    const jsonOutput = logSpy.mock.calls[0]?.[0];
    expect(() => JSON.parse(jsonOutput as string)).not.toThrow();
  });

  it('runs without flags and prints checklist', () => {
    main([]);
    expect(process.exitCode).toBeUndefined();
    const allOutput = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allOutput).toContain('checklist');
  });
});
