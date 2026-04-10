import type { Config } from 'tailwindcss';
import { crewspaceTailwindPreset } from '../ui/src/theme/tailwind-config.js';

export default {
  presets: [crewspaceTailwindPreset as unknown as Partial<Config>],
  content: [
    './src/**/*.{ts,tsx}',
    './index.html',
    '../ui/src/**/*.{ts,tsx}',
  ],
} satisfies Config;
