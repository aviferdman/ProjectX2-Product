import { describe, it, expect } from 'vitest';
import { colors, sizing, radius, typography, transitions } from '../src/theme/tokens.js';

describe('Design tokens', () => {
  describe('colors', () => {
    it('has brand primary matching design spec', () => {
      expect(colors.brand.primary).toBe('#7c3aed');
    });

    it('has all surface values', () => {
      expect(colors.surface.app).toBe('#020617');
      expect(colors.surface.canvas).toBe('#0a0e1a');
      expect(colors.surface.panel).toBe('#0f172a');
      expect(colors.surface.card).toBe('#1e293b');
      expect(colors.surface.elevated).toBe('#334155');
    });

    it('has all status colors', () => {
      expect(colors.status.success).toBe('#10b981');
      expect(colors.status.warning).toBe('#f59e0b');
      expect(colors.status.error).toBe('#f43f5e');
      expect(colors.status.info).toBe('#0ea5e9');
    });

    it('has all node type colors', () => {
      expect(colors.node.agent.border).toBe('#7c3aed');
      expect(colors.node.task.border).toBe('#0284c7');
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
  });
});
