/**
 * Crewspace Icon Registry — SVG path data for the curated icon set
 * TASK-127: Create icon set and visual assets
 *
 * All icons use a 24×24 viewBox and stroke-based rendering (Lucide-compatible).
 * Each entry contains an array of SVG path/element data strings.
 *
 * Usage:
 *   import { iconPaths, ICON_CATEGORIES } from '../icons/registry';
 *   const paths = iconPaths['home']; // string[]
 */

/* ------------------------------------------------------------------ */
/* Icon path data registry                                             */
/* ------------------------------------------------------------------ */

export interface IconPathData {
  /** SVG path `d` attribute strings (stroke-based, 24×24 viewBox) */
  paths: string[];
  /** Optional additional SVG elements (circles, rects, polylines, etc.) */
  elements?: string[];
}

/**
 * Complete icon path data registry. Keys are Lucide-compatible icon names.
 * Paths are designed for stroke rendering at 24×24 viewBox.
 */
export const iconRegistry: Record<string, IconPathData> = {
  // --- Navigation ---
  home: {
    paths: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
    elements: ['<polyline points="9 22 9 12 15 12 15 22"/>'],
  },
  menu: {
    paths: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  },
  'chevron-right': {
    paths: ['M9 18l6-6-6-6'],
  },
  'chevron-left': {
    paths: ['M15 18l-6-6 6-6'],
  },
  'chevron-down': {
    paths: ['M6 9l6 6 6-6'],
  },
  'chevron-up': {
    paths: ['M18 15l-6-6-6 6'],
  },
  'arrow-right': {
    paths: ['M5 12h14', 'M12 5l7 7-7 7'],
  },
  'arrow-left': {
    paths: ['M19 12H5', 'M12 19l-7-7 7-7'],
  },
  'external-link': {
    paths: [
      'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
      'M15 3h6v6',
      'M10 14L21 3',
    ],
  },
  'more-horizontal': {
    paths: [],
    elements: [
      '<circle cx="12" cy="12" r="1"/>',
      '<circle cx="19" cy="12" r="1"/>',
      '<circle cx="5" cy="12" r="1"/>',
    ],
  },
  'more-vertical': {
    paths: [],
    elements: [
      '<circle cx="12" cy="12" r="1"/>',
      '<circle cx="12" cy="5" r="1"/>',
      '<circle cx="12" cy="19" r="1"/>',
    ],
  },

  // --- Actions ---
  plus: {
    paths: ['M12 5v14', 'M5 12h14'],
  },
  minus: {
    paths: ['M5 12h14'],
  },
  x: {
    paths: ['M18 6L6 18', 'M6 6l12 12'],
  },
  check: {
    paths: ['M20 6L9 17l-5-5'],
  },
  pencil: {
    paths: [
      'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z',
    ],
  },
  'trash-2': {
    paths: ['M3 6h18', 'M8 6V4h8v2', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M10 11v6', 'M14 11v6'],
  },
  copy: {
    paths: [
      'M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z',
      'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
    ],
  },
  download: {
    paths: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  },
  upload: {
    paths: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'],
  },
  'refresh-cw': {
    paths: ['M23 4v6h-6', 'M1 20v-6h6', 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10', 'M1 14l4.64 4.36A9 9 0 0 0 20.49 15'],
  },
  search: {
    paths: ['M21 21l-6-6'],
    elements: ['<circle cx="11" cy="11" r="8"/>'],
  },
  filter: {
    paths: ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'],
  },
  settings: {
    paths: [
      'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
    ],
    elements: ['<circle cx="12" cy="12" r="3"/>'],
  },
  save: {
    paths: [
      'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z',
      'M17 21v-8H7v8',
      'M7 3v5h8',
    ],
  },
  undo: {
    paths: ['M3 7v6h6', 'M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13'],
  },
  redo: {
    paths: ['M21 7v6h-6', 'M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13'],
  },

  // --- Node types ---
  bot: {
    paths: [
      'M12 8V4H8',
      'M2 14h20',
      'M6 18h.01',
      'M18 18h.01',
    ],
    elements: [
      '<rect width="16" height="12" x="4" y="8" rx="2"/>',
    ],
  },
  'clipboard-list': {
    paths: [
      'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
      'M12 11h4',
      'M12 16h4',
      'M8 11h.01',
      'M8 16h.01',
    ],
    elements: [
      '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>',
    ],
  },
  wrench: {
    paths: [
      'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    ],
  },
  sparkles: {
    paths: [
      'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z',
      'M20 3v4',
      'M22 5h-4',
    ],
  },
  'pen-line': {
    paths: [
      'M12 20h9',
      'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
    ],
  },
  'bar-chart-3': {
    paths: ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  },
  network: {
    paths: ['M12 12V4', 'M12 12l-7 7', 'M12 12l7 7'],
    elements: [
      '<circle cx="12" cy="4" r="2"/>',
      '<circle cx="5" cy="19" r="2"/>',
      '<circle cx="19" cy="19" r="2"/>',
      '<circle cx="12" cy="12" r="2"/>',
    ],
  },
  'code-2': {
    paths: ['M17 17l5-5-5-5', 'M7 7l-5 5 5 5'],
  },
  'shield-check': {
    paths: [
      'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
      'M9 12l2 2 4-4',
    ],
  },

  // --- Status ---
  'check-circle': {
    paths: ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4L12 14.01l-3-3'],
  },
  'alert-triangle': {
    paths: [
      'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
      'M12 9v4',
      'M12 17h.01',
    ],
  },
  'x-circle': {
    paths: ['M15 9l-6 6', 'M9 9l6 6'],
    elements: ['<circle cx="12" cy="12" r="10"/>'],
  },
  info: {
    paths: ['M12 16v-4', 'M12 8h.01'],
    elements: ['<circle cx="12" cy="12" r="10"/>'],
  },
  loader: {
    paths: ['M12 2v4', 'M12 18v4', 'M4.93 4.93l2.83 2.83', 'M16.24 16.24l2.83 2.83', 'M2 12h4', 'M18 12h4', 'M4.93 19.07l2.83-2.83', 'M16.24 7.76l2.83-2.83'],
  },
  clock: {
    paths: ['M12 6v6l4 2'],
    elements: ['<circle cx="12" cy="12" r="10"/>'],
  },
  pause: {
    paths: [],
    elements: [
      '<rect width="4" height="16" x="6" y="4"/>',
      '<rect width="4" height="16" x="14" y="4"/>',
    ],
  },

  // --- Content ---
  'file-text': {
    paths: [
      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
      'M14 2v6h6',
      'M16 13H8',
      'M16 17H8',
      'M10 9H8',
    ],
  },
  folder: {
    paths: [
      'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
    ],
  },
  image: {
    paths: [
      'M21 3H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z',
      'M2 16l5-5 5 5 3-3 6 6',
    ],
    elements: ['<circle cx="8.5" cy="8.5" r="1.5"/>'],
  },
  terminal: {
    paths: ['M4 17l6-6-6-6', 'M12 19h8'],
  },
  database: {
    paths: ['M12 8c4.97 0 9-1.34 9-3s-4.03-3-9-3-9 1.34-9 3 4.03 3 9 3z', 'M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5', 'M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3'],
  },
  globe: {
    paths: ['M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'],
    elements: ['<circle cx="12" cy="12" r="10"/>'],
  },
  link: {
    paths: [
      'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
      'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
    ],
  },
  key: {
    paths: [
      'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
    ],
  },
  lock: {
    paths: ['M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'],
  },
  unlock: {
    paths: ['M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z', 'M7 11V7a5 5 0 0 1 9.9-1'],
  },

  // --- Layout ---
  'panel-left': {
    paths: ['M9 3v18'],
    elements: [
      '<rect width="18" height="18" x="3" y="3" rx="2"/>',
    ],
  },
  'layout-grid': {
    paths: [],
    elements: [
      '<rect width="7" height="7" x="3" y="3" rx="1"/>',
      '<rect width="7" height="7" x="14" y="3" rx="1"/>',
      '<rect width="7" height="7" x="14" y="14" rx="1"/>',
      '<rect width="7" height="7" x="3" y="14" rx="1"/>',
    ],
  },
  list: {
    paths: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  },
  columns: {
    paths: ['M12 3v18'],
    elements: [
      '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>',
    ],
  },
  'maximize-2': {
    paths: ['M15 3h6v6', 'M9 21H3v-6', 'M21 3l-7 7', 'M3 21l7-7'],
  },
  'minimize-2': {
    paths: ['M4 14h6v6', 'M20 10h-6V4', 'M14 10l7-7', 'M3 21l7-7'],
  },
  'zoom-in': {
    paths: ['M21 21l-6-6', 'M8 11h6', 'M11 8v6'],
    elements: ['<circle cx="11" cy="11" r="8"/>'],
  },
  'zoom-out': {
    paths: ['M21 21l-6-6', 'M8 11h6'],
    elements: ['<circle cx="11" cy="11" r="8"/>'],
  },
  scan: {
    paths: ['M3 7V5a2 2 0 0 1 2-2h2', 'M17 3h2a2 2 0 0 1 2 2v2', 'M21 17v2a2 2 0 0 1-2 2h-2', 'M7 21H5a2 2 0 0 1-2-2v-2'],
  },

  // --- Communication ---
  bell: {
    paths: [
      'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9',
      'M13.73 21a2 2 0 0 1-3.46 0',
    ],
  },
  'message-square': {
    paths: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  },
  mail: {
    paths: [
      'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z',
      'M22 6l-10 7L2 6',
    ],
  },
  'share-2': {
    paths: ['M18 8l-6-6-6 6', 'M12 2v13'],
    elements: [],
  },
  users: {
    paths: [
      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
      'M22 21v-2a4 4 0 0 0-3-3.87',
      'M16 3.13a4 4 0 0 1 0 7.75',
    ],
    elements: ['<circle cx="9" cy="7" r="4"/>'],
  },
  user: {
    paths: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'],
    elements: ['<circle cx="12" cy="7" r="4"/>'],
  },

  // --- Workflow ---
  play: {
    paths: ['M5 3l14 9-14 9V3z'],
  },
  square: {
    paths: [],
    elements: [
      '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>',
    ],
  },
  'skip-forward': {
    paths: ['M5 4l10 8-10 8V4z', 'M19 5v14'],
  },
  rewind: {
    paths: ['M11 19l-9-7 9-7v14z', 'M22 19l-9-7 9-7v14z'],
  },
  'git-branch': {
    paths: ['M6 3v12', 'M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 9a9 9 0 0 1-9 9'],
  },
  'git-fork': {
    paths: ['M12 15V3', 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M12 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9'],
  },
  repeat: {
    paths: ['M17 1l4 4-4 4', 'M3 11V9a4 4 0 0 1 4-4h14', 'M7 23l-4-4 4-4', 'M21 13v2a4 4 0 0 1-4 4H3'],
  },
  shuffle: {
    paths: ['M16 3h5v5', 'M4 20L21 3', 'M21 16v5h-5', 'M15 15l6 6', 'M4 4l5 5'],
  },
  workflow: {
    paths: [],
    elements: [
      '<rect width="8" height="8" x="3" y="3" rx="2"/>',
      '<rect width="8" height="8" x="13" y="13" rx="2"/>',
    ],
  },
  zap: {
    paths: ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
  },

  // --- Brand ---
  brain: {
    paths: [
      'M12 2a4.5 4.5 0 0 0-4.33 3.28A3.5 3.5 0 0 0 4 8.5c0 .86.31 1.65.83 2.26A3.5 3.5 0 0 0 4 13.5a3.5 3.5 0 0 0 3.67 3.49A4.5 4.5 0 0 0 12 20a4.5 4.5 0 0 0 4.33-3.01A3.5 3.5 0 0 0 20 13.5a3.5 3.5 0 0 0-.83-2.26A3.5 3.5 0 0 0 20 8.5a3.5 3.5 0 0 0-3.67-3.22A4.5 4.5 0 0 0 12 2z',
      'M12 2v18',
    ],
  },
  cpu: {
    paths: [
      'M9 2v2',
      'M15 2v2',
      'M9 20v2',
      'M15 20v2',
      'M2 9h2',
      'M2 15h2',
      'M20 9h2',
      'M20 15h2',
    ],
    elements: [
      '<rect width="12" height="12" x="6" y="6" rx="2"/>',
      '<rect width="4" height="4" x="10" y="10"/>',
    ],
  },
  'hard-drive': {
    paths: ['M22 12H2', 'M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z', 'M6 16h.01', 'M10 16h.01'],
  },
  rocket: {
    paths: [
      'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z',
      'M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z',
      'M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0',
      'M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5',
    ],
  },
  star: {
    paths: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
  },
  heart: {
    paths: ['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'],
  },
  shield: {
    paths: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  },
  award: {
    paths: ['M7.21 15L2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15', 'M11 12L5.12 2.2', 'M13 12l5.88-9.8', 'M8 7h8'],
    elements: ['<circle cx="12" cy="17" r="5"/>'],
  },

  // --- Additional utility icons ---
  'user-circle': {
    paths: ['M18 20a6 6 0 0 0-12 0'],
    elements: ['<circle cx="12" cy="10" r="4"/>', '<circle cx="12" cy="12" r="10"/>'],
  },
  'list-ordered': {
    paths: ['M10 6h11', 'M10 12h11', 'M10 18h11', 'M4 6h1v4', 'M4 10h2', 'M6 18H4c0-1 2-2 2-3s-1-1.5-2-1'],
  },
  hand: {
    paths: [
      'M18 11V6a2 2 0 0 0-4 0v5',
      'M14 10V4a2 2 0 0 0-4 0v6',
      'M10 10.5V6a2 2 0 0 0-4 0v8',
      'M18 8a2 2 0 0 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15',
    ],
  },
  'file-output': {
    paths: [
      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
      'M14 2v6h6',
      'M10 15l-3 3 3 3',
      'M7 18h10',
    ],
  },
  'square-check': {
    paths: ['M9 11l3 3L22 4'],
    elements: [
      '<rect width="18" height="18" x="3" y="3" rx="2"/>',
    ],
  },
  puzzle: {
    paths: [
      'M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.611a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.685a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.611-1.611a2.404 2.404 0 0 1 1.704-.706c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02z',
    ],
  },
  calculator: {
    paths: [
      'M8 19H5',
      'M8 15H5',
      'M19 15h-3',
      'M19 19h-3',
      'M8 11H5',
      'M19 11h-3',
    ],
    elements: [
      '<rect width="18" height="18" x="3" y="3" rx="2"/>',
      '<rect width="10" height="2" x="7" y="6"/>',
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Category definitions                                                */
/* ------------------------------------------------------------------ */

/** Icon categories mapping to logical groups */
export const ICON_CATEGORIES = {
  navigation: [
    'home', 'menu', 'chevron-right', 'chevron-left', 'chevron-down',
    'chevron-up', 'arrow-right', 'arrow-left', 'external-link',
    'more-horizontal', 'more-vertical',
  ],
  action: [
    'plus', 'minus', 'x', 'check', 'pencil', 'trash-2', 'copy',
    'download', 'upload', 'refresh-cw', 'search', 'filter', 'settings',
    'save', 'undo', 'redo',
  ],
  node: [
    'bot', 'clipboard-list', 'wrench', 'sparkles', 'pen-line',
    'bar-chart-3', 'network', 'code-2', 'shield-check',
  ],
  status: [
    'check-circle', 'alert-triangle', 'x-circle', 'info', 'loader',
    'clock', 'pause',
  ],
  content: [
    'file-text', 'folder', 'image', 'code-2', 'terminal', 'database',
    'globe', 'link', 'key', 'lock', 'unlock',
  ],
  layout: [
    'panel-left', 'layout-grid', 'list', 'columns', 'maximize-2',
    'minimize-2', 'zoom-in', 'zoom-out', 'scan',
  ],
  communication: [
    'bell', 'message-square', 'mail', 'share-2', 'users', 'user',
  ],
  workflow: [
    'play', 'square', 'skip-forward', 'rewind', 'git-branch',
    'git-fork', 'repeat', 'shuffle', 'workflow', 'zap',
  ],
  brand: [
    'brain', 'sparkles', 'cpu', 'hard-drive', 'rocket', 'star',
    'heart', 'shield', 'award',
  ],
} as const;

export type IconCategory = keyof typeof ICON_CATEGORIES;
export type IconName = keyof typeof iconRegistry;

/** Total count of unique icons in the registry */
export const ICON_COUNT = Object.keys(iconRegistry).length;

/**
 * Look up icon path data by name. Returns undefined if not found.
 */
export function getIconData(name: string): IconPathData | undefined {
  return iconRegistry[name];
}

/**
 * Get all icon names in a category.
 */
export function getIconsByCategory(category: IconCategory): readonly string[] {
  return ICON_CATEGORIES[category];
}

/**
 * Check if an icon name exists in the registry.
 */
export function hasIcon(name: string): name is IconName {
  return name in iconRegistry;
}
