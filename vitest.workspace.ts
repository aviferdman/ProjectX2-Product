import { defineWorkspace } from 'vitest/config';

/**
 * Vitest workspace configuration for monorepo.
 * Each package defines its own vitest.config.ts with specific settings.
 */
export default defineWorkspace(['packages/*']);
