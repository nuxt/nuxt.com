import { defineSchedule } from 'eve/schedules'
import { internalFetch } from '../lib/internal-api.js'

const REQUEST_TIMEOUT_MS = 240_000

// TODO: once on Nuxt 5 / Nitro v3 (scheduled tasks deploy as Vercel cron jobs), run
// `purgeExpiredSiteData` from a scheduled task in the main app and keep only the Nuxi purge here.
export default defineSchedule({
  cron: '30 3 * * *',
  async run({ waitUntil }) {
    waitUntil(internalFetch('/api/internal/data-retention', {
      method: 'POST',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    }).then(result => console.info('[nuxi:data-retention]', result)))
  }
})
