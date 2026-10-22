import { defineDynamic, defineTool } from 'eve/tools'
import { z } from 'zod'
import { assertAdminMode, isAdminMode } from '../lib/identity/admin-mode.js'
import { internalFetch } from '../lib/internal-api.js'
import { checkShowcaseWebsites, type ShowcaseCheck, type ShowcaseWebsite } from '../lib/showcase/check.js'

export default defineDynamic({
  events: {
    'session.started': async (_event, ctx) => {
      if (!(await isAdminMode(ctx.session.auth.current))) return null

      return {
        check_showcase_sites: defineTool({
          description: 'Fetch the homepage of every website on https://nuxt.com/showcase and report whether each one still serves Nuxt. Returns `switched` (served a real page with no Nuxt marker, with the framework it now uses when recognisable), `unverified` (blocked by bot protection, errored or timed out — not evidence either way) and `confirmed` sites. Pass `names` to check only some showcase entries.',
          inputSchema: z.object({
            names: z.array(z.string().trim().min(1)).optional().describe('Showcase entry names to check (case-insensitive substring match). Omit to check every site.')
          }),
          async execute({ names }, ctx) {
            await assertAdminMode(ctx.session.auth.current)

            const { websites } = await internalFetch<{ websites: ShowcaseWebsite[] }>('/api/internal/content', {
              method: 'POST',
              body: JSON.stringify({ kind: 'showcase' })
            })

            const needles = names?.map(name => name.toLowerCase())
            const selected = needles
              ? websites.filter(website => needles.some(needle => website.name.toLowerCase().includes(needle)))
              : websites

            if (!selected.length) {
              return { error: `No showcase entry matches: ${names!.join(', ')}` }
            }

            const results = await checkShowcaseWebsites(selected, ctx.abortSignal)
            const byVerdict = (verdict: ShowcaseCheck['verdict']) => results.filter(result => result.verdict === verdict)

            return {
              checkedAt: new Date().toISOString(),
              total: results.length,
              switched: byVerdict('switched'),
              unverified: byVerdict('unverified'),
              confirmed: byVerdict('nuxt').map(({ name }) => name)
            }
          }
        })
      }
    }
  }
})
