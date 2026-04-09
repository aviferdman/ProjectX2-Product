/**
 * Crewspace — Tailwind CSS theme extensions for the Landing Page
 * TASK-183: Create marketing assets (landing page design, screenshots, demo video)
 *
 * Merge into your tailwind.config.ts:
 *   import { landingPageTheme } from './src/design/tailwind/landing-page-theme';
 *   export default { theme: { extend: { ...landingPageTheme } } };
 */

export const landingPageTheme = {
  colors: {
    // Page layout
    'lp-layout': {
      bg: '#020617',
    },

    // Navigation
    'lp-nav': {
      bg: 'rgba(2,6,23,0.8)',
      border: 'rgba(148,163,184,0.08)',
      link: '#94a3b8',
      'link-hover': '#f8fafc',
      'link-active': '#c4b5fd',
      'mobile-bg': 'rgba(2,6,23,0.95)',
    },

    // Hero section
    'lp-hero': {
      'grid-color': 'rgba(148,163,184,0.04)',
      'badge-bg': 'rgba(139,92,246,0.12)',
      'badge-border': 'rgba(139,92,246,0.25)',
      'badge-text': '#c4b5fd',
      headline: '#f8fafc',
      subheadline: '#94a3b8',
    },

    // CTA buttons
    'lp-cta': {
      'primary-bg': '#7c3aed',
      'primary-bg-hover': '#8b5cf6',
      'primary-bg-active': '#6d28d9',
      'primary-text': '#ffffff',
      'secondary-bg-hover': 'rgba(148,163,184,0.08)',
      'secondary-border': 'rgba(148,163,184,0.2)',
      'secondary-border-hover': 'rgba(148,163,184,0.35)',
      'secondary-text': '#e2e8f0',
    },

    // Feature section
    'lp-feature': {
      'heading-color': '#f8fafc',
      'subtext-color': '#94a3b8',
    },

    // Feature cards
    'lp-feature-card': {
      bg: 'rgba(15,23,42,0.6)',
      'bg-hover': 'rgba(15,23,42,0.8)',
      border: 'rgba(148,163,184,0.08)',
      'border-hover': 'rgba(139,92,246,0.2)',
      'icon-bg': 'rgba(139,92,246,0.1)',
      'icon-color': '#a78bfa',
      'title-color': '#f8fafc',
      'desc-color': '#94a3b8',
    },

    // Code demo
    'lp-code': {
      bg: 'rgba(15,23,42,0.8)',
      border: 'rgba(148,163,184,0.1)',
      'header-bg': 'rgba(15,23,42,0.6)',
      'header-border': 'rgba(148,163,184,0.08)',
      'dot-red': '#f43f5e',
      'dot-yellow': '#fbbf24',
      'dot-green': '#34d399',
      filename: '#64748b',
      'line-number': '#334155',
      text: '#e2e8f0',
      keyword: '#c4b5fd',
      string: '#34d399',
      comment: '#475569',
      function: '#38bdf8',
      type: '#fbbf24',
      'highlight-bg': 'rgba(139,92,246,0.08)',
      'highlight-border': 'rgba(139,92,246,0.3)',
      'tab-bg': 'rgba(30,41,59,0.5)',
      'tab-bg-active': 'rgba(139,92,246,0.12)',
      'tab-text': '#64748b',
      'tab-text-active': '#c4b5fd',
      'tab-border-active': '#8b5cf6',
    },

    // Screenshot gallery
    'lp-screenshot': {
      bg: 'rgba(15,23,42,0.5)',
      border: 'rgba(148,163,184,0.08)',
      'chrome-bg': '#0f172a',
      'chrome-border': 'rgba(148,163,184,0.1)',
      'url-bg': 'rgba(30,41,59,0.6)',
      'url-text': '#64748b',
      caption: '#64748b',
      'thumb-border': 'rgba(148,163,184,0.1)',
      'thumb-border-active': '#8b5cf6',
    },

    // Video embed
    'lp-video': {
      bg: '#0f172a',
      border: 'rgba(148,163,184,0.08)',
      'play-bg': 'rgba(124,58,237,0.9)',
      'play-bg-hover': 'rgba(139,92,246,0.95)',
      'play-icon': '#ffffff',
      overlay: 'rgba(0,0,0,0.4)',
      'duration-bg': 'rgba(0,0,0,0.7)',
      'duration-text': '#e2e8f0',
      'progress-track': 'rgba(255,255,255,0.2)',
      'progress-fill': '#8b5cf6',
    },

    // Social proof / testimonials
    'lp-testimonial': {
      bg: 'rgba(15,23,42,0.4)',
      border: 'rgba(148,163,184,0.06)',
      quote: '#e2e8f0',
      'quote-mark': 'rgba(139,92,246,0.3)',
      'author-name': '#f8fafc',
      'author-role': '#64748b',
      'avatar-border': 'rgba(139,92,246,0.2)',
    },

    // Logo bar
    'lp-logo-bar': {
      DEFAULT: 'rgba(148,163,184,0.4)',
      hover: 'rgba(148,163,184,0.7)',
    },

    // Stats bar
    'lp-stats': {
      bg: 'rgba(139,92,246,0.06)',
      border: 'rgba(139,92,246,0.12)',
      value: '#f8fafc',
      label: '#94a3b8',
      divider: 'rgba(148,163,184,0.1)',
    },

    // Footer CTA
    'lp-footer-cta': {
      heading: '#f8fafc',
      subtext: '#94a3b8',
      divider: 'rgba(148,163,184,0.08)',
    },

    // Footer
    'lp-footer': {
      bg: '#020617',
      border: 'rgba(148,163,184,0.08)',
      text: '#64748b',
      link: '#94a3b8',
      'link-hover': '#f8fafc',
      heading: '#e2e8f0',
    },
  },

  spacing: {
    // Layout
    'lp-content-max-w': '1280px',
    'lp-content-p': '24px',
    'lp-section-gap': '96px',

    // Navigation
    'lp-nav-h': '64px',
    'lp-nav-logo-h': '32px',

    // Hero
    'lp-hero-min-h': '640px',
    'lp-hero-pt': '120px',
    'lp-hero-pb': '80px',
    'lp-hero-grid-size': '32px',
    'lp-badge-h': '28px',
    'lp-headline-max-w': '800px',
    'lp-subheadline-max-w': '640px',

    // CTA buttons
    'lp-cta-h': '48px',
    'lp-cta-h-sm': '40px',
    'lp-cta-gap': '12px',
    'lp-cta-icon': '18px',

    // Feature cards
    'lp-feature-padding': '32px',
    'lp-feature-icon-size': '48px',
    'lp-feature-grid-gap': '24px',
    'lp-feature-heading-max-w': '640px',

    // Code demo
    'lp-code-padding': '24px',
    'lp-code-max-w': '720px',
    'lp-code-header-h': '44px',
    'lp-code-dot-size': '12px',
    'lp-code-tab-h': '36px',

    // Screenshot gallery
    'lp-shot-padding': '4px',
    'lp-chrome-h': '40px',
    'lp-chrome-dot-size': '10px',
    'lp-url-h': '28px',
    'lp-gallery-gap': '24px',
    'lp-thumb-size': '80px',

    // Video embed
    'lp-play-size': '72px',
    'lp-play-icon-size': '28px',
    'lp-video-progress-h': '4px',

    // Social proof
    'lp-testimonial-padding': '32px',
    'lp-avatar-size': '48px',
    'lp-logo-h': '28px',
    'lp-logo-gap': '48px',
    'lp-testimonial-gap': '24px',

    // Stats
    'lp-stats-padding': '32px',

    // Footer CTA
    'lp-footer-cta-py': '96px',

    // Footer
    'lp-footer-py': '64px',
    'lp-footer-gap': '32px',
  },

  fontSize: {
    // Hero typography
    'lp-headline': ['3.5rem', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.025em' }],
    'lp-headline-tablet': ['2.75rem', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.025em' }],
    'lp-headline-mobile': ['2rem', { lineHeight: '1.15', fontWeight: '800', letterSpacing: '-0.02em' }],
    'lp-subheadline': ['1.25rem', { lineHeight: '1.6', fontWeight: '400' }],
    'lp-subheadline-mobile': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
    'lp-badge': ['0.8125rem', { lineHeight: '1', fontWeight: '500' }],

    // Section headings
    'lp-section-heading': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
    'lp-section-heading-mobile': ['1.75rem', { lineHeight: '1.2', fontWeight: '700' }],
    'lp-section-subtext': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],

    // Feature card
    'lp-card-title': ['1.125rem', { lineHeight: '1.3', fontWeight: '600' }],
    'lp-card-desc': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],

    // Code demo
    'lp-code-filename': ['0.75rem', { lineHeight: '1', fontWeight: '500' }],
    'lp-code-text': ['0.875rem', { lineHeight: '1.7', fontWeight: '400' }],
    'lp-code-tab': ['0.8125rem', { lineHeight: '1', fontWeight: '500' }],

    // CTA button
    'lp-cta-btn': ['1rem', { lineHeight: '1', fontWeight: '600' }],

    // Screenshot caption
    'lp-caption': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],

    // Video duration
    'lp-duration': ['0.75rem', { lineHeight: '1', fontWeight: '500' }],

    // Testimonial
    'lp-quote': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
    'lp-quote-mark': ['3rem', { lineHeight: '1', fontWeight: '400' }],
    'lp-author-name': ['0.875rem', { lineHeight: '1.25', fontWeight: '600' }],
    'lp-author-role': ['0.8125rem', { lineHeight: '1.25', fontWeight: '400' }],

    // Stats
    'lp-stat-value': ['2.5rem', { lineHeight: '1.1', fontWeight: '800' }],
    'lp-stat-label': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],

    // Footer CTA
    'lp-fcta-heading': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
    'lp-fcta-heading-mobile': ['1.75rem', { lineHeight: '1.2', fontWeight: '700' }],
    'lp-fcta-subtext': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],

    // Footer
    'lp-footer-heading': ['0.8125rem', { lineHeight: '1', fontWeight: '600' }],
    'lp-footer-link': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
  },

  borderRadius: {
    'lp-cta': '12px',
    'lp-badge': '9999px',
    'lp-card': '16px',
    'lp-code': '16px',
    'lp-screenshot': '16px',
    'lp-video': '16px',
    'lp-testimonial': '16px',
    'lp-stats': '16px',
    'lp-icon': '12px',
    'lp-url': '6px',
    'lp-thumb': '8px',
    'lp-duration': '6px',
    'lp-play': '9999px',
    'lp-avatar': '9999px',
  },

  boxShadow: {
    // CTA button
    'lp-cta': '0 4px 16px rgba(124,58,237,0.4)',
    'lp-cta-hover': '0 8px 24px rgba(124,58,237,0.5)',
    'lp-cta-glow': '0 0 40px rgba(139,92,246,0.25)',
    // Feature card
    'lp-card': '0 4px 24px rgba(0,0,0,0.2)',
    'lp-card-hover': '0 8px 32px rgba(0,0,0,0.3)',
    // Code demo
    'lp-code': '0 8px 32px rgba(0,0,0,0.4)',
    // Screenshot
    'lp-screenshot': '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(148,163,184,0.06)',
    // Video
    'lp-video': '0 24px 48px rgba(0,0,0,0.5)',
    'lp-play': '0 8px 32px rgba(124,58,237,0.5)',
    // CTA pulse
    'lp-cta-pulse': '0 0 0 0 rgba(139,92,246,0.3)',
    // Play pulse
    'lp-play-pulse': '0 0 0 0 rgba(124,58,237,0.4)',
  },

  animation: {
    'lp-hero-enter': 'lp-hero-enter 600ms cubic-bezier(0.22,1,0.36,1)',
    'lp-feature-enter': 'lp-feature-enter 400ms cubic-bezier(0.22,1,0.36,1)',
    'lp-scroll-reveal': 'lp-scroll-reveal 500ms cubic-bezier(0.22,1,0.36,1)',
    'lp-cursor-blink': 'lp-cursor-blink 1s step-end infinite',
    'lp-screenshot-fade': 'lp-screenshot-fade 400ms ease-out',
    'lp-gradient-shift': 'lp-gradient-shift 8s ease-in-out infinite',
    'lp-float': 'lp-float 6s ease-in-out infinite',
    'lp-cta-pulse': 'lp-cta-pulse 2s ease-out infinite',
    'lp-count-up': 'lp-count-up 1200ms cubic-bezier(0.22,1,0.36,1)',
    'lp-play-pulse': 'lp-play-pulse 2s ease-out infinite',
    'lp-logo-slide': 'lp-logo-slide 30s linear infinite',
  },

  keyframes: {
    'lp-hero-enter': {
      from: { opacity: '0', transform: 'translateY(24px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    'lp-feature-enter': {
      from: { opacity: '0', transform: 'translateY(16px) scale(0.98)' },
      to: { opacity: '1', transform: 'translateY(0) scale(1)' },
    },
    'lp-scroll-reveal': {
      from: { opacity: '0', transform: 'translateY(20px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    'lp-cursor-blink': {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0' },
    },
    'lp-screenshot-fade': {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    'lp-gradient-shift': {
      '0%, 100%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
    },
    'lp-float': {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-12px)' },
    },
    'lp-cta-pulse': {
      '0%': { boxShadow: '0 0 0 0 rgba(139,92,246,0.3)' },
      '70%': { boxShadow: '0 0 0 12px rgba(139,92,246,0)' },
      '100%': { boxShadow: '0 0 0 0 rgba(139,92,246,0)' },
    },
    'lp-count-up': {
      from: { opacity: '0', transform: 'translateY(8px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    'lp-play-pulse': {
      '0%': { boxShadow: '0 0 0 0 rgba(124,58,237,0.4)' },
      '70%': { boxShadow: '0 0 0 16px rgba(124,58,237,0)' },
      '100%': { boxShadow: '0 0 0 0 rgba(124,58,237,0)' },
    },
    'lp-logo-slide': {
      from: { transform: 'translateX(0)' },
      to: { transform: 'translateX(-50%)' },
    },
  },
} as const;
