/**
 * Crewspace Tailwind CSS configuration
 *
 * Extends Tailwind with the Crewspace design tokens (colors, typography,
 * spacing, shadows, animations) defined by the design team.
 *
 * Usage in consuming apps:
 *   import { crewspaceTailwindPreset } from '@crewspace/ui/tailwind';
 *   export default { presets: [crewspaceTailwindPreset] };
 */

import { crewspaceTheme } from '../../src/design/tailwind/canvas-theme.js';

export const crewspaceTailwindPreset = {
  theme: {
    extend: crewspaceTheme,
  },
} as const;

export { crewspaceTheme };
