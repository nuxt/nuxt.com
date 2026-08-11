import { defineNuxtModule } from '@nuxt/kit'

/**
 * Docs config module — previously used `content:file:beforeParse` to:
 * 1. Disable docs README → moved to server/utils/content.ts file:parsed hook
 * 2. Generate config docs from schema (3.x only) → moved to server/utils/content.ts file:parsed hook
 *    using modules/docs-config-generate.ts for the schema-to-markdown logic.
 *
 * This module is kept as a no-op placeholder for compatibility with nuxt.config.
 */
export default defineNuxtModule(() => {})
