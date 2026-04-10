/**
 * Crewspace Tailwind CSS configuration
 *
 * Extends Tailwind with the Crewspace design tokens (colors, typography,
 * spacing, shadows, animations) defined by the design team.
 *
 * The merge order (base → component themes) ensures foundational tokens
 * are always present while allowing component themes to specialize.
 *
 * Usage in consuming apps:
 *   import { crewspaceTailwindPreset } from '@crewspace/ui/tailwind';
 *   export default { presets: [crewspaceTailwindPreset] };
 */

import { designSystemTheme } from '../../src/design/tailwind/design-system-theme.js';
import { crewspaceTheme } from '../../src/design/tailwind/canvas-theme.js';
import { responsiveTheme } from '../../src/design/tailwind/responsive-theme.js';

/** Deep-merge two plain objects (second wins on conflicts) */
function deepMerge<T extends Record<string, unknown>>(a: T, b: Record<string, unknown>): T {
  const result = { ...a } as Record<string, unknown>;
  for (const key of Object.keys(b)) {
    if (
      result[key] &&
      typeof result[key] === 'object' &&
      !Array.isArray(result[key]) &&
      typeof b[key] === 'object' &&
      !Array.isArray(b[key])
    ) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        b[key] as Record<string, unknown>,
      );
    } else {
      result[key] = b[key];
    }
  }
  return result as T;
}

const mergedTheme = deepMerge(
  deepMerge(
    designSystemTheme as unknown as Record<string, unknown>,
    crewspaceTheme as unknown as Record<string, unknown>,
  ),
  responsiveTheme as unknown as Record<string, unknown>,
);

export const crewspaceTailwindPreset = {
  theme: {
    extend: mergedTheme,
  },
} as const;

export { designSystemTheme, crewspaceTheme, responsiveTheme, mergedTheme };
