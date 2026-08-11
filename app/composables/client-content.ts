import { createContentClient } from 'comark-content/client'
import sqlQueryClient from 'comark-content/plugins/sql-query/client'
import searchClient from 'comark-content/plugins/sqlite-full-text-search/client'

/**
 * Browser/SSR client for the Comark Content handler at `/api/content`.
 * Uses Nuxt `$fetch` so SSR payloads hydrate without a second round-trip.
 */
export const clientContent = createContentClient({
  fetch: $fetch,
  plugins: [
    sqlQueryClient(),
    searchClient()
  ]
})
