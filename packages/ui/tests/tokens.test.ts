import { describe, it, expect } from 'vitest';
import {
  colors,
  sizing,
  radius,
  typography,
  transitions,
  shadows,
  fontWeight,
  lineHeight,
  letterSpacing,
  zIndex,
  spacing,
  duration,
  easing,
  opacity,
  breakpoints,
} from '../src/theme/tokens.js';

describe('Design tokens', () => {
  describe('colors', () => {
    it('has brand primary matching design spec', () => {
      expect(colors.brand.primary).toBe('#6366f1');
    });

    it('has all surface values', () => {
      expect(colors.surface.app).toBe('#09090b');
      expect(colors.surface.canvas).toBe('#0c0c14');
      expect(colors.surface.panel).toBe('#111113');
      expect(colors.surface.card).toBe('#18181b');
      expect(colors.surface.elevated).toBe('#27272a');
    });

    it('has all status colors', () => {
      expect(colors.status.success).toBe('#10b981');
      expect(colors.status.warning).toBe('#f59e0b');
      expect(colors.status.error).toBe('#ef4444');
      expect(colors.status.info).toBe('#06b6d4');
    });

    it('has all node type colors', () => {
      expect(colors.node.agent.border).toBe('#6366f1');
      expect(colors.node.task.border).toBe('#0891b2');
      expect(colors.node.tool.border).toBe('#059669');
      expect(colors.node.llm.border).toBe('#d97706');
    });
  });

  describe('sizing', () => {
    it('has node sizing defaults', () => {
      expect(sizing.node.defaultWidth).toBe(220);
      expect(sizing.node.minWidth).toBe(180);
      expect(sizing.node.maxWidth).toBe(280);
    });

    it('has toolbar sizing', () => {
      expect(sizing.toolbar.height).toBe(48);
      expect(sizing.toolbar.buttonSize).toBe(36);
    });

    it('has sidebar sizing', () => {
      expect(sizing.sidebar.width).toBe(280);
      expect(sizing.sidebar.collapsedWidth).toBe(48);
    });
  });

  describe('radius', () => {
    it('has node radius from design spec', () => {
      expect(radius.node).toBe(10);
    });

    it('has standard radius scale', () => {
      expect(radius.sm).toBe(4);
      expect(radius.md).toBe(6);
      expect(radius.lg).toBe(8);
    });
  });

  describe('typography', () => {
    it('has Inter as primary font', () => {
      expect(typography.fontFamily.sans).toContain('Inter');
    });

    it('has JetBrains Mono as mono font', () => {
      expect(typography.fontFamily.mono).toContain('JetBrains Mono');
    });
  });

  describe('transitions', () => {
    it('has all transition presets', () => {
      expect(transitions.fast).toContain('100ms');
      expect(transitions.normal).toContain('200ms');
      expect(transitions.slow).toContain('300ms');
      expect(transitions.spring).toContain('cubic-bezier');
    });

    it('has slower preset', () => {
      expect(transitions.slower).toContain('500ms');
    });
  });

  describe('shadows', () => {
    it('has elevation scale', () => {
      expect(shadows.xs).toContain('rgba');
      expect(shadows.sm).toContain('rgba');
      expect(shadows.md).toContain('rgba');
      expect(shadows.lg).toContain('rgba');
      expect(shadows.xl).toContain('rgba');
    });

    it('has none value', () => {
      expect(shadows.none).toBe('none');
    });
  });

  describe('fontWeight', () => {
    it('has standard weight levels', () => {
      expect(fontWeight.normal).toBe(400);
      expect(fontWeight.medium).toBe(500);
      expect(fontWeight.semibold).toBe(600);
      expect(fontWeight.bold).toBe(700);
    });
  });

  describe('lineHeight', () => {
    it('has standard scale', () => {
      expect(lineHeight.tight).toBe(1.25);
      expect(lineHeight.normal).toBe(1.5);
      expect(lineHeight.relaxed).toBe(1.625);
    });
  });

  describe('letterSpacing', () => {
    it('has standard range', () => {
      expect(letterSpacing.tight).toBe('-0.01em');
      expect(letterSpacing.normal).toBe('0');
      expect(letterSpacing.wide).toBe('0.025em');
    });
  });

  describe('zIndex', () => {
    it('follows correct layer ordering', () => {
      expect(zIndex.base).toBeLessThan(zIndex.node);
      expect(zIndex.node).toBeLessThan(zIndex.toolbar);
      expect(zIndex.dropdown).toBeLessThan(zIndex.modal);
      expect(zIndex.modal).toBeLessThan(zIndex.tooltip);
    });
  });

  describe('spacing', () => {
    it('follows 4px grid', () => {
      expect(spacing[1]).toBe(4);
      expect(spacing[2]).toBe(8);
      expect(spacing[4]).toBe(16);
    });
  });

  describe('duration', () => {
    it('values are numeric ms', () => {
      expect(duration.fast).toBe(100);
      expect(duration.normal).toBe(200);
    });
  });

  describe('easing', () => {
    it('has standard curves', () => {
      expect(easing.default).toBe('ease-out');
      expect(easing.spring).toContain('cubic-bezier');
    });
  });

  describe('opacity', () => {
    it('has semantic values', () => {
      expect(opacity.disabled).toBe(0.4);
      expect(opacity.overlay).toBe(0.6);
    });
  });

  describe('breakpoints', () => {
    it('matches responsive spec', () => {
      expect(breakpoints.sm).toBe(640);
      expect(breakpoints.lg).toBe(1024);
    });
  });
});
