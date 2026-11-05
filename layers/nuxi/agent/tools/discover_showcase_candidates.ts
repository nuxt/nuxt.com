import { defineDynamic, defineTool } from 'eve/tools'
import { z } from 'zod'
import { assertAdminMode, isAdminMode } from '../lib/identity/admin-mode.js'
import { internalFetch } from '../lib/internal-api.js'
import type { ShowcaseWebsite } from '../lib/showcase/check.js'
import { discoverShowcaseCandidates } from '../lib/showcase/discovery.js'

export default defineDynamic(async (ctx) => {
  if (!(await ctx.memo(ctx.turn?.id ?? null, () => isAdminMode(ctx.session.auth.current)))) return null

  return {
    discover_showcase_candidates: defineTool({
      description: 'Find sites recently detected or rescanned as Nuxt by nuxt.fyi, excluding current showcase hosts and sites without a safe source classification. Returns titles, Nuxt evidence, scan dates and Tranco rank for editorial review. A bounded feed sample, not every Nuxt site or proof of a new launch. Does not add entries to the showcase.',
      inputSchema: z.object({
        sinceDays: z.number().int().min(1).max(365).default(7),
        limit: z.number().int().min(1).max(30).default(20)
      }),
      async execute({ sinceDays, limit }, ctx) {
        await assertAdminMode(ctx.session.auth.current)
        const { websites } = await internalFetch<{ websites: ShowcaseWebsite[] }>('/api/internal/content', {
          method: 'POST',
          body: JSON.stringify({ kind: 'showcase' })
        })
        return discoverShowcaseCandidates({ websites, sinceDays, limit, signal: ctx.abortSignal })
      }
    })
  }
})
