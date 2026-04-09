/**
 * Crewspace — Tailwind CSS theme extensions for Responsive Layouts
 * TASK-169: Design responsive breakpoints (mobile, tablet, desktop)
 *
 * Merge into your tailwind.config.ts alongside other themes:
 *   import { responsiveTheme } from './src/design/tailwind/responsive-theme';
 *   export default { theme: { extend: { ...canvasTheme, ...dashboardTheme, ...responsiveTheme } } };
 *
 * Breakpoints follow Tailwind conventions (mobile-first, min-width):
 *   xs: 375px, sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
 */

export const responsiveTheme = {
  screens: {
    xs: '375px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  spacing: {
    /* Container padding per breakpoint (use with responsive utilities) */
    'container-p-xs': '12px',
    'container-p-sm': '16px',
    'container-p-md': '20px',
    'container-p-lg': '24px',
    'container-p-xl': '24px',
    'container-p-2xl': '32px',

    /* Header heights */
    'header-mobile': '48px',
    'header-desktop': '56px',

    /* Sidebar widths */
    'sidebar-collapsed': '64px',
    'sidebar-expanded': '240px',
    'sidebar-overlay': '280px',

    /* Properties panel */
    'properties-panel-w': '320px',

    /* Touch targets */
    'touch-min': '44px',
    'touch-comfortable': '48px',
    'touch-gap': '8px',

    /* Grid gaps */
    'grid-gap-mobile': '12px',
    'grid-gap-tablet': '16px',
    'grid-gap-desktop': '20px',
  },

  maxWidth: {
    'content-xl': '1280px',
    'content-2xl': '1440px',
  },

  maxHeight: {
    'bottom-sheet': '60vh',
    'modal-desktop': '85vh',
  },

  fontSize: {
    /* Responsive page title: use text-page-title-mobile md:text-page-title-desktop */
    'page-title-mobile': ['1.25rem', { lineHeight: '1.25', fontWeight: '700' }],
    'page-title-desktop': ['1.5rem', { lineHeight: '1.25', fontWeight: '700' }],

    /* Responsive section title */
    'section-title-mobile': ['0.875rem', { lineHeight: '1.25', fontWeight: '600' }],
    'section-title-desktop': ['1rem', { lineHeight: '1.25', fontWeight: '600' }],

    /* Responsive body text */
    'body-mobile': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
    'body-desktop': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
  },

  gridTemplateColumns: {
    /* Workflow / template card grids */
    'cards-1': 'repeat(1, minmax(0, 1fr))',
    'cards-2': 'repeat(2, minmax(0, 1fr))',
    'cards-3': 'repeat(3, minmax(0, 1fr))',
    'cards-4': 'repeat(4, minmax(0, 1fr))',

    /* Stat card grids */
    'stats-2': 'repeat(2, minmax(140px, 1fr))',
    'stats-4': 'repeat(4, minmax(200px, 1fr))',

    /* Dashboard layout at different breakpoints */
    'layout-mobile': '1fr',
    'layout-sidebar-collapsed': '64px 1fr',
    'layout-sidebar-expanded': '240px 1fr',
    'layout-full': '240px 1fr 320px',
  },

  animation: {
    /* Responsive sidebar transitions */
    'sidebar-slide-in': 'sidebar-slide-in 250ms cubic-bezier(0.16, 1, 0.3, 1)',
    'sidebar-slide-out': 'sidebar-slide-out 200ms ease-out',
    'bottom-sheet-up': 'bottom-sheet-up 300ms cubic-bezier(0.16, 1, 0.3, 1)',
    'bottom-sheet-down': 'bottom-sheet-down 200ms ease-out',
    'overlay-fade-in': 'overlay-fade-in 200ms ease-out',
    'overlay-fade-out': 'overlay-fade-out 150ms ease-in',
  },

  keyframes: {
    'sidebar-slide-in': {
      from: { transform: 'translateX(-100%)' },
      to: { transform: 'translateX(0)' },
    },
    'sidebar-slide-out': {
      from: { transform: 'translateX(0)' },
      to: { transform: 'translateX(-100%)' },
    },
    'bottom-sheet-up': {
      from: { transform: 'translateY(100%)' },
      to: { transform: 'translateY(0)' },
    },
    'bottom-sheet-down': {
      from: { transform: 'translateY(0)' },
      to: { transform: 'translateY(100%)' },
    },
    'overlay-fade-in': {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    'overlay-fade-out': {
      from: { opacity: '1' },
      to: { opacity: '0' },
    },
  },
} as const;
