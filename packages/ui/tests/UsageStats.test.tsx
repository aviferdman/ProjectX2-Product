import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  PlanBadge,
  UsageProgressBar,
  UsageStatCard,
  UsageLimitAlert,
  UpgradePrompt,
  UsageStatsPanel,
  isUnlimited,
  getAlertSeverity,
  PLAN_DISPLAY_NAMES,
  USAGE_THRESHOLDS,
} from '../src/components/usage/index.js';
import type { UsageStats } from '../src/components/usage/types.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const freeStats: UsageStats = {
  accountId: 'acct-1',
  runsThisPeriod: 400,
  activeRuns: 1,
  planTier: 'free',
  limits: { maxRunsPerMonth: 500, maxConcurrentRuns: 2, maxAgents: 5, maxWorkflows: 10 },
  remainingRuns: 100,
  usagePercent: 80,
};

const proStats: UsageStats = {
  accountId: 'acct-2',
  runsThisPeriod: 1200,
  activeRuns: 5,
  planTier: 'pro',
  limits: { maxRunsPerMonth: -1, maxConcurrentRuns: 10, maxAgents: 20, maxWorkflows: 100 },
  remainingRuns: -1,
  usagePercent: 0,
};

const criticalStats: UsageStats = {
  accountId: 'acct-3',
  runsThisPeriod: 498,
  activeRuns: 2,
  planTier: 'free',
  limits: { maxRunsPerMonth: 500, maxConcurrentRuns: 2, maxAgents: 5, maxWorkflows: 10 },
  remainingRuns: 2,
  usagePercent: 99,
};

const enterpriseStats: UsageStats = {
  accountId: 'acct-4',
  runsThisPeriod: 50000,
  activeRuns: 30,
  planTier: 'enterprise',
  limits: { maxRunsPerMonth: -1, maxConcurrentRuns: -1, maxAgents: -1, maxWorkflows: -1 },
  remainingRuns: -1,
  usagePercent: 0,
};

/* ------------------------------------------------------------------ */
/* Type helpers                                                        */
/* ------------------------------------------------------------------ */
describe('isUnlimited', () => {
  it('returns true for -1', () => {
    expect(isUnlimited(-1)).toBe(true);
  });
  it('returns false for positive values', () => {
    expect(isUnlimited(500)).toBe(false);
  });
  it('returns false for 0', () => {
    expect(isUnlimited(0)).toBe(false);
  });
});

describe('getAlertSeverity', () => {
  it('returns undefined below warning threshold', () => {
    expect(getAlertSeverity(50)).toBeUndefined();
    expect(getAlertSeverity(79)).toBeUndefined();
  });
  it('returns warning at warning threshold', () => {
    expect(getAlertSeverity(USAGE_THRESHOLDS.warning)).toBe('warning');
    expect(getAlertSeverity(90)).toBe('warning');
  });
  it('returns critical at critical threshold', () => {
    expect(getAlertSeverity(USAGE_THRESHOLDS.critical)).toBe('critical');
    expect(getAlertSeverity(100)).toBe('critical');
  });
});

describe('PLAN_DISPLAY_NAMES', () => {
  it('has human-readable names for all tiers', () => {
    expect(PLAN_DISPLAY_NAMES.free).toBe('Free');
    expect(PLAN_DISPLAY_NAMES.pro).toBe('Pro');
    expect(PLAN_DISPLAY_NAMES.team).toBe('Team');
    expect(PLAN_DISPLAY_NAMES.enterprise).toBe('Enterprise');
  });
});

/* ------------------------------------------------------------------ */
/* PlanBadge                                                           */
/* ------------------------------------------------------------------ */
describe('PlanBadge', () => {
  it('renders the plan name', () => {
    render(<PlanBadge tier="free" />);
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('renders pro tier', () => {
    render(<PlanBadge tier="pro" />);
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('renders enterprise tier', () => {
    render(<PlanBadge tier="enterprise" />);
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('merges custom className', () => {
    const { container } = render(<PlanBadge tier="free" className="my-class" />);
    expect(container.firstElementChild?.className).toContain('my-class');
  });
});

/* ------------------------------------------------------------------ */
/* UsageProgressBar                                                    */
/* ------------------------------------------------------------------ */
describe('UsageProgressBar', () => {
  it('renders percentage text', () => {
    render(<UsageProgressBar percent={42} />);
    expect(screen.getByText('42% used')).toBeInTheDocument();
  });

  it('renders a progressbar role', () => {
    render(<UsageProgressBar percent={60} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '60');
  });

  it('clamps percent to 0-100', () => {
    render(<UsageProgressBar percent={150} />);
    expect(screen.getByText('100% used')).toBeInTheDocument();
  });

  it('shows unlimited text when unlimited', () => {
    render(<UsageProgressBar percent={0} unlimited />);
    expect(screen.getByText('Unlimited')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* UsageStatCard                                                       */
/* ------------------------------------------------------------------ */
describe('UsageStatCard', () => {
  it('renders label and value', () => {
    render(<UsageStatCard label="Runs" value={400} />);
    expect(screen.getByText('Runs')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
  });

  it('renders limit text when provided', () => {
    render(<UsageStatCard label="Runs" value={400} limit={500} />);
    expect(screen.getByText(/\/ 500/)).toBeInTheDocument();
  });

  it('renders footer text', () => {
    render(<UsageStatCard label="Runs" value={400} footer="100 remaining" />);
    expect(screen.getByText('100 remaining')).toBeInTheDocument();
  });

  it('does not render limit when undefined', () => {
    const { container } = render(<UsageStatCard label="Runs" value={400} />);
    expect(container.textContent).not.toContain('/');
  });
});

/* ------------------------------------------------------------------ */
/* UsageLimitAlert                                                     */
/* ------------------------------------------------------------------ */
describe('UsageLimitAlert', () => {
  it('renders heading and description', () => {
    render(
      <UsageLimitAlert severity="warning" heading="Approaching limit" description="80% used" />,
    );
    expect(screen.getByText('Approaching limit')).toBeInTheDocument();
    expect(screen.getByText('80% used')).toBeInTheDocument();
  });

  it('renders as an alert role', () => {
    render(<UsageLimitAlert severity="critical" heading="Limit reached" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders action button and fires callback', () => {
    const onAction = vi.fn();
    render(
      <UsageLimitAlert
        severity="warning"
        heading="Test"
        actionLabel="Upgrade"
        onAction={onAction}
      />,
    );
    fireEvent.click(screen.getByText('Upgrade'));
    expect(onAction).toHaveBeenCalled();
  });

  it('renders dismiss button and fires callback', () => {
    const onDismiss = vi.fn();
    render(<UsageLimitAlert severity="info" heading="Info" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('does not render action button without onAction', () => {
    render(<UsageLimitAlert severity="info" heading="Info" actionLabel="Click" />);
    expect(screen.queryByText('Click')).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* UpgradePrompt                                                       */
/* ------------------------------------------------------------------ */
describe('UpgradePrompt', () => {
  it('renders upgrade CTA for free tier', () => {
    render(<UpgradePrompt currentTier="free" onUpgrade={() => {}} />);
    expect(screen.getByText('Unlock more with Pro')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
  });

  it('renders upgrade CTA for pro tier', () => {
    render(<UpgradePrompt currentTier="pro" onUpgrade={() => {}} />);
    expect(screen.getByText('Unlock more with Team')).toBeInTheDocument();
  });

  it('renders upgrade CTA for team tier', () => {
    render(<UpgradePrompt currentTier="team" onUpgrade={() => {}} />);
    expect(screen.getByText('Unlock more with Enterprise')).toBeInTheDocument();
  });

  it('renders nothing for enterprise tier', () => {
    const { container } = render(<UpgradePrompt currentTier="enterprise" />);
    expect(container.innerHTML).toBe('');
  });

  it('fires onUpgrade callback', () => {
    const onUpgrade = vi.fn();
    render(<UpgradePrompt currentTier="free" onUpgrade={onUpgrade} />);
    fireEvent.click(screen.getByText('Upgrade to Pro'));
    expect(onUpgrade).toHaveBeenCalled();
  });

  it('fires onDismiss callback', () => {
    const onDismiss = vi.fn();
    render(<UpgradePrompt currentTier="free" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText('Dismiss upgrade prompt'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders custom heading and description', () => {
    render(<UpgradePrompt currentTier="free" heading="Custom title" description="Custom desc" />);
    expect(screen.getByText('Custom title')).toBeInTheDocument();
    expect(screen.getByText('Custom desc')).toBeInTheDocument();
  });

  it('renders custom button label', () => {
    render(<UpgradePrompt currentTier="free" onUpgrade={() => {}} buttonLabel="Go Pro Now" />);
    expect(screen.getByText('Go Pro Now')).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* UsageStatsPanel                                                     */
/* ------------------------------------------------------------------ */
describe('UsageStatsPanel', () => {
  it('renders heading and plan badge', () => {
    render(<UsageStatsPanel stats={freeStats} />);
    expect(screen.getByText('Usage')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    render(<UsageStatsPanel stats={freeStats} />);
    expect(screen.getByText('Runs this period')).toBeInTheDocument();
    expect(screen.getByText('Active runs')).toBeInTheDocument();
    expect(screen.getByText('Max agents')).toBeInTheDocument();
    expect(screen.getByText('Max workflows')).toBeInTheDocument();
  });

  it('renders progress bar with percent', () => {
    render(<UsageStatsPanel stats={freeStats} />);
    expect(screen.getByText('80% used')).toBeInTheDocument();
  });

  it('renders monthly runs count', () => {
    render(<UsageStatsPanel stats={freeStats} />);
    expect(screen.getByText('Monthly Runs')).toBeInTheDocument();
    expect(screen.getByText('400 / 500')).toBeInTheDocument();
  });

  it('shows warning alert at 80% usage', () => {
    render(<UsageStatsPanel stats={freeStats} />);
    expect(screen.getByText('Approaching run limit')).toBeInTheDocument();
  });

  it('shows critical alert at 95%+ usage', () => {
    render(<UsageStatsPanel stats={criticalStats} />);
    expect(screen.getByText('Run limit reached')).toBeInTheDocument();
  });

  it('does not show alert for unlimited plan', () => {
    render(<UsageStatsPanel stats={proStats} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows upgrade prompt for non-enterprise plans', () => {
    render(<UsageStatsPanel stats={freeStats} onUpgrade={() => {}} />);
    expect(screen.getByText('Unlock more with Pro')).toBeInTheDocument();
  });

  it('does not show upgrade prompt for enterprise', () => {
    render(<UsageStatsPanel stats={enterpriseStats} />);
    expect(screen.queryByText(/Unlock more/)).toBeNull();
  });

  it('hides upgrade prompt when showUpgradePrompt=false', () => {
    render(<UsageStatsPanel stats={freeStats} showUpgradePrompt={false} />);
    expect(screen.queryByText(/Unlock more/)).toBeNull();
  });

  it('shows loading state', () => {
    render(<UsageStatsPanel stats={freeStats} loading />);
    expect(screen.getByText('Loading usage data…')).toBeInTheDocument();
    expect(screen.queryByText('Usage')).toBeNull();
  });

  it('fires onUpgrade callback from upgrade prompt', () => {
    const onUpgrade = vi.fn();
    render(<UsageStatsPanel stats={freeStats} onUpgrade={onUpgrade} />);
    fireEvent.click(screen.getByText('Upgrade to Pro'));
    expect(onUpgrade).toHaveBeenCalled();
  });

  it('dismisses alert when dismiss is clicked', () => {
    render(<UsageStatsPanel stats={freeStats} />);
    expect(screen.getByText('Approaching run limit')).toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText('Dismiss')[0]);
    expect(screen.queryByText('Approaching run limit')).toBeNull();
  });

  it('dismisses upgrade prompt when dismiss is clicked', () => {
    render(<UsageStatsPanel stats={freeStats} />);
    expect(screen.getByText('Unlock more with Pro')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Dismiss upgrade prompt'));
    expect(screen.queryByText('Unlock more with Pro')).toBeNull();
  });

  it('shows unlimited for pro plan progress bar', () => {
    render(<UsageStatsPanel stats={proStats} />);
    const unlimitedElements = screen.getAllByText('Unlimited');
    expect(unlimitedElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders remaining runs in footer', () => {
    render(<UsageStatsPanel stats={freeStats} />);
    expect(screen.getByText('100 remaining')).toBeInTheDocument();
  });
});
