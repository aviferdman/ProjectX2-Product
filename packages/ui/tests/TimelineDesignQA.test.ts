/**
 * Design QA: Timeline implementation vs specs.
 * TASK-147: Verify design token values, CSS variables, Tailwind theme,
 * and component constants match the TASK-140 design spec.
 */
import { describe, it, expect } from 'vitest';
import {
  TIMELINE_SIZING,
  EVENT_STYLES,
  SELECTION,
  PLAYHEAD,
  GRID,
  LANE,
  LOG_SIZING,
  LOG_LEVEL_STYLES,
  LOG_COLORS,
  SYNTAX_COLORS,
} from '../src/components/timeline/index.js';
import { timelineTheme } from '../../../src/design/tailwind/timeline-theme.js';
import timelineTokens from '../../../src/design/tokens/timeline.json';

/* ================================================================== */
/* §3.1 Time Axis sizing                                               */
/* ================================================================== */
describe('Time Axis (§3.1)', () => {
  it('axis height is 32px', () => {
    expect(TIMELINE_SIZING.axisHeight).toBe(32);
  });

  it('grid line color matches spec', () => {
    expect(GRID.lineColor).toBe('rgba(113,113,122,0.06)');
  });

  it('axis tick color matches slate-600', () => {
    expect(GRID.axisTickColor).toBe('#3f3f46');
  });

  it('axis line color matches slate-700', () => {
    expect(GRID.axisLineColor).toBe('#27272a');
  });
});

/* ================================================================== */
/* §3.2 Agent Lane sizing                                              */
/* ================================================================== */
describe('Agent Lanes (§3.2)', () => {
  it('lane height is 48px', () => {
    expect(TIMELINE_SIZING.laneHeight).toBe(48);
  });

  it('lane label width is 160px', () => {
    expect(TIMELINE_SIZING.laneLabelWidth).toBe(160);
  });

  it('lane background matches spec', () => {
    expect(LANE.bg).toBe('rgba(17,17,19,0.6)');
    expect(LANE.bgAlt).toBe('rgba(17,17,19,0.8)');
  });
});

/* ================================================================== */
/* §3.3 Event Block sizing & colors                                    */
/* ================================================================== */
describe('Event Blocks (§3.3)', () => {
  it('event min width is 8px', () => {
    expect(TIMELINE_SIZING.eventMinWidth).toBe(8);
  });

  it('event height is 28px', () => {
    expect(TIMELINE_SIZING.eventHeight).toBe(28);
  });

  it('event border radius is 4px', () => {
    expect(TIMELINE_SIZING.eventBorderRadius).toBe(4);
  });

  it('event border width is 1.5px', () => {
    expect(TIMELINE_SIZING.eventBorderWidth).toBe(1.5);
  });

  it('event marker size is 12px', () => {
    expect(TIMELINE_SIZING.eventMarkerSize).toBe(12);
  });

  it('event padding matches spec 4px 6px', () => {
    expect(TIMELINE_SIZING.eventPadding).toEqual({ x: 6, y: 4 });
  });

  // Event type colors per spec table
  it('LLM Call — amber palette', () => {
    const s = EVENT_STYLES['llm-call'];
    expect(s.bg).toBe('rgba(245,158,11,0.2)');
    expect(s.border).toBe('#f59e0b');
    expect(s.iconColor).toBe('#fbbf24');
  });

  it('Tool Use — emerald palette', () => {
    const s = EVENT_STYLES['tool-use'];
    expect(s.bg).toBe('rgba(16,185,129,0.2)');
    expect(s.border).toBe('#10b981');
    expect(s.iconColor).toBe('#34d399');
  });

  it('Task Start — sky palette', () => {
    const s = EVENT_STYLES['task-start'];
    expect(s.bg).toBe('rgba(14,165,233,0.2)');
    expect(s.border).toBe('#06b6d4');
    expect(s.iconColor).toBe('#22d3ee');
  });

  it('Task Complete — emerald palette', () => {
    const s = EVENT_STYLES['task-complete'];
    expect(s.bg).toBe('rgba(16,185,129,0.15)');
    expect(s.border).toBe('#10b981');
    expect(s.iconColor).toBe('#34d399');
  });

  it('Error — rose palette', () => {
    const s = EVENT_STYLES.error;
    expect(s.bg).toBe('rgba(244,63,94,0.2)');
    expect(s.border).toBe('#ef4444');
    expect(s.iconColor).toBe('#f87171');
  });

  it('Message — violet palette', () => {
    const s = EVENT_STYLES.message;
    expect(s.bg).toBe('rgba(99,102,241,0.15)');
    expect(s.border).toBe('#818cf8');
    expect(s.iconColor).toBe('#818cf8');
  });
});

/* ================================================================== */
/* §3.3 Event States                                                   */
/* ================================================================== */
describe('Event selection (§3.3)', () => {
  it('selection ring is violet-500', () => {
    expect(SELECTION.ringColor).toBe('#818cf8');
  });

  it('selection glow matches spec', () => {
    expect(SELECTION.glowColor).toBe('rgba(99,102,241,0.25)');
  });

  it('ring width is 2px', () => {
    expect(SELECTION.ringWidth).toBe(2);
  });
});

/* ================================================================== */
/* §3.4 Playhead                                                       */
/* ================================================================== */
describe('Playhead (§3.4)', () => {
  it('playhead color is violet-500', () => {
    expect(PLAYHEAD.color).toBe('#818cf8');
  });

  it('playhead glow matches spec', () => {
    expect(PLAYHEAD.glowColor).toBe('rgba(99,102,241,0.3)');
  });

  it('playhead width is 2px', () => {
    expect(TIMELINE_SIZING.playheadWidth).toBe(2);
  });

  it('playhead handle is 12px', () => {
    expect(TIMELINE_SIZING.playheadHandleSize).toBe(12);
  });
});

/* ================================================================== */
/* §4 Log Viewer sizing                                                */
/* ================================================================== */
describe('Log Viewer (§4)', () => {
  it('row height is 32px', () => {
    expect(LOG_SIZING.rowHeight).toBe(32);
  });

  it('timestamp column is 100px', () => {
    expect(LOG_SIZING.timestampWidth).toBe(100);
  });

  it('level column is 56px', () => {
    expect(LOG_SIZING.levelWidth).toBe(56);
  });

  it('agent column is 120px', () => {
    expect(LOG_SIZING.agentWidth).toBe(120);
  });

  it('row background colors match spec', () => {
    expect(LOG_COLORS.rowBg).toBe('transparent');
    expect(LOG_COLORS.rowBgAlt).toBe('rgba(24,24,27,0.3)');
    expect(LOG_COLORS.rowBgHover).toBe('rgba(24,24,27,0.6)');
    expect(LOG_COLORS.rowBgSelected).toBe('rgba(99,102,241,0.1)');
  });

  it('row border matches spec', () => {
    expect(LOG_COLORS.rowBorder).toBe('rgba(39,39,42,0.3)');
  });

  it('timestamp color is #52525b', () => {
    expect(LOG_COLORS.timestamp).toBe('#52525b');
  });

  it('search highlight colors match spec', () => {
    expect(LOG_COLORS.searchHighlight).toBe('rgba(251,191,36,0.3)');
    expect(LOG_COLORS.searchHighlightActive).toBe('rgba(251,191,36,0.6)');
  });
});

/* ================================================================== */
/* §4.3 Level Badges                                                   */
/* ================================================================== */
describe('Level Badges (§4.3)', () => {
  it('DEBUG — slate-400 on slate bg', () => {
    expect(LOG_LEVEL_STYLES.debug.color).toBe('#a1a1aa');
    expect(LOG_LEVEL_STYLES.debug.bg).toBe('rgba(113,113,122,0.1)');
  });

  it('INFO — sky-400 on sky bg', () => {
    expect(LOG_LEVEL_STYLES.info.color).toBe('#22d3ee');
    expect(LOG_LEVEL_STYLES.info.bg).toBe('rgba(14,165,233,0.1)');
  });

  it('WARN — amber-400 on amber bg', () => {
    expect(LOG_LEVEL_STYLES.warn.color).toBe('#fbbf24');
    expect(LOG_LEVEL_STYLES.warn.bg).toBe('rgba(245,158,11,0.1)');
  });

  it('ERROR — rose-400 on rose bg', () => {
    expect(LOG_LEVEL_STYLES.error.color).toBe('#f87171');
    expect(LOG_LEVEL_STYLES.error.bg).toBe('rgba(244,63,94,0.1)');
  });
});

/* ================================================================== */
/* §4.5 Syntax Highlighting                                            */
/* ================================================================== */
describe('Syntax Highlighting (§4.5)', () => {
  it('string token is emerald-400', () => {
    expect(SYNTAX_COLORS.string).toBe('#34d399');
  });

  it('number token is amber-400', () => {
    expect(SYNTAX_COLORS.number).toBe('#fbbf24');
  });

  it('boolean token is violet-400', () => {
    expect(SYNTAX_COLORS.boolean).toBe('#818cf8');
  });

  it('null token is violet-400', () => {
    expect(SYNTAX_COLORS.null).toBe('#818cf8');
  });

  it('key token is sky-400', () => {
    expect(SYNTAX_COLORS.key).toBe('#22d3ee');
  });

  it('error token is rose-400', () => {
    expect(SYNTAX_COLORS.error).toBe('#f87171');
  });

  it('punctuation token is slate-400', () => {
    expect(SYNTAX_COLORS.punctuation).toBe('#a1a1aa');
  });
});

/* ================================================================== */
/* Design tokens JSON — cross-check against spec                       */
/* ================================================================== */
describe('Design tokens JSON', () => {
  const tokens = timelineTokens.crewspace.timeline;

  it('panel sizing tokens match spec', () => {
    expect(tokens.sizing['panel-min-height'].value).toBe('200px');
    expect(tokens.sizing['panel-default-height'].value).toBe('320px');
    expect(tokens.sizing['panel-max-height'].value).toBe('600px');
  });

  it('lane sizing tokens match spec', () => {
    expect(tokens.sizing['lane-height'].value).toBe('48px');
    expect(tokens.sizing['lane-label-width'].value).toBe('160px');
  });

  it('event sizing tokens match spec', () => {
    expect(tokens.sizing['event-height'].value).toBe('28px');
    expect(tokens.sizing['event-min-width'].value).toBe('8px');
    expect(tokens.sizing['event-marker-size'].value).toBe('12px');
  });

  it('axis sizing tokens match spec', () => {
    expect(tokens.sizing['axis-height'].value).toBe('32px');
    expect(tokens.sizing['tick-height'].value).toBe('8px');
  });

  it('filter sizing tokens match spec', () => {
    expect(tokens.sizing['filter-bar-height'].value).toBe('40px');
    expect(tokens.sizing['filter-chip-height'].value).toBe('28px');
  });

  it('log sizing tokens match spec', () => {
    expect(tokens.sizing['log-row-height'].value).toBe('32px');
    expect(tokens.sizing['log-timestamp-width'].value).toBe('100px');
    expect(tokens.sizing['log-level-width'].value).toBe('56px');
    expect(tokens.sizing['log-agent-width'].value).toBe('120px');
  });

  it('syntax tokens exist and match spec', () => {
    expect(tokens.syntax.string.value).toBe('#34d399');
    expect(tokens.syntax.number.value).toBe('#fbbf24');
    expect(tokens.syntax.boolean.value).toBe('#818cf8');
    expect(tokens.syntax.null.value).toBe('#818cf8');
    expect(tokens.syntax.key.value).toBe('#22d3ee');
    expect(tokens.syntax.error.value).toBe('#f87171');
    expect(tokens.syntax.punctuation.value).toBe('#a1a1aa');
  });

  it('event color tokens match spec', () => {
    expect(tokens.event['llm-call'].bg.value).toBe('rgba(245,158,11,0.2)');
    expect(tokens.event['tool-use'].bg.value).toBe('rgba(16,185,129,0.2)');
    expect(tokens.event['task-start'].bg.value).toBe('rgba(14,165,233,0.2)');
    expect(tokens.event['task-complete'].bg.value).toBe('rgba(16,185,129,0.15)');
    expect(tokens.event.error.bg.value).toBe('rgba(244,63,94,0.2)');
    expect(tokens.event.message.bg.value).toBe('rgba(99,102,241,0.15)');
  });
});

/* ================================================================== */
/* Tailwind theme — cross-check against spec                           */
/* ================================================================== */
describe('Tailwind theme', () => {
  it('timeline spacing values match spec', () => {
    expect(timelineTheme.spacing['timeline-panel-min-h']).toBe('200px');
    expect(timelineTheme.spacing['timeline-panel-h']).toBe('320px');
    expect(timelineTheme.spacing['timeline-panel-max-h']).toBe('600px');
    expect(timelineTheme.spacing['timeline-axis-h']).toBe('32px');
    expect(timelineTheme.spacing['timeline-lane-h']).toBe('48px');
    expect(timelineTheme.spacing['timeline-lane-label-w']).toBe('160px');
    expect(timelineTheme.spacing['timeline-event-h']).toBe('28px');
    expect(timelineTheme.spacing['timeline-event-min-w']).toBe('8px');
    expect(timelineTheme.spacing['timeline-event-marker']).toBe('12px');
    expect(timelineTheme.spacing['timeline-playhead-w']).toBe('2px');
    expect(timelineTheme.spacing['timeline-playhead-handle']).toBe('12px');
    expect(timelineTheme.spacing['timeline-filter-bar-h']).toBe('40px');
    expect(timelineTheme.spacing['timeline-chip-h']).toBe('28px');
    expect(timelineTheme.spacing['log-row-h']).toBe('32px');
    expect(timelineTheme.spacing['log-ts-w']).toBe('100px');
    expect(timelineTheme.spacing['log-level-w']).toBe('56px');
    expect(timelineTheme.spacing['log-agent-w']).toBe('120px');
  });

  it('syntax color theme values match spec', () => {
    expect(timelineTheme.colors.syntax.string).toBe('#34d399');
    expect(timelineTheme.colors.syntax.number).toBe('#fbbf24');
    expect(timelineTheme.colors.syntax.boolean).toBe('#818cf8');
    expect(timelineTheme.colors.syntax.null).toBe('#818cf8');
    expect(timelineTheme.colors.syntax.key).toBe('#22d3ee');
    expect(timelineTheme.colors.syntax.error).toBe('#f87171');
    expect(timelineTheme.colors.syntax.punctuation).toBe('#a1a1aa');
  });

  it('event color theme values match spec', () => {
    expect(timelineTheme.colors.event.llm.bg).toBe('rgba(245,158,11,0.2)');
    expect(timelineTheme.colors.event.tool.bg).toBe('rgba(16,185,129,0.2)');
    expect(timelineTheme.colors.event['task-start'].bg).toBe('rgba(14,165,233,0.2)');
    expect(timelineTheme.colors.event['task-complete'].bg).toBe('rgba(16,185,129,0.15)');
    expect(timelineTheme.colors.event.error.bg).toBe('rgba(244,63,94,0.2)');
    expect(timelineTheme.colors.event.message.bg).toBe('rgba(99,102,241,0.15)');
  });

  it('playhead animation is 2s ease-in-out infinite', () => {
    expect(timelineTheme.animation['playhead-pulse']).toBe(
      'playhead-pulse 2s ease-in-out infinite',
    );
  });

  it('event-enter animation is 150ms ease-out', () => {
    expect(timelineTheme.animation['event-enter']).toBe('event-enter 150ms ease-out');
  });

  it('font sizes match spec', () => {
    // Axis: 0.6875rem / 400 (11px)
    expect(timelineTheme.fontSize['timeline-axis'][0]).toBe('0.6875rem');
    // Lane label: 0.75rem / 600 (12px semibold)
    expect(timelineTheme.fontSize['timeline-lane-label'][0]).toBe('0.75rem');
    // Event label: 0.6875rem / 500 (11px medium)
    expect(timelineTheme.fontSize['timeline-event-label'][0]).toBe('0.6875rem');
    // Level badge: 0.625rem / 600 (10px semibold)
    expect(timelineTheme.fontSize['log-level'][0]).toBe('0.625rem');
  });
});
