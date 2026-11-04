import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineNuxtModule } from 'nuxt/kit'
import { L10N_LOCALE_CODES } from '../shared/utils/l10n'

interface VercelRoute {
  src: string
  status?: number
  headers?: Record<string, string>
  has?: unknown[]
  missing?: unknown[]
  methods?: string[]
  continue?: boolean
}

/**
 * CDN routes sending agents on localised docs pages to the English page, which negotiates its markdown twin.
 *
 * Localised pages are cached, so the check runs on the CDN like `nuxt-agent-discovery`'s own: its
 * negotiated redirects (`307` with `Vary`) are read from `routes`, and each distinct condition
 * (markdown in `Accept`, an agent user agent) is reused for every locale.
 */
export function localeNegotiationRoutes(routes: VercelRoute[], locales: readonly string[]): VercelRoute[] {
  const conditions = new Map<string, Pick<VercelRoute, 'has' | 'missing'> & { vary: string }>()
  for (const route of routes) {
    if (route.status !== 307 || !route.has || !route.headers?.Vary) continue
    const condition = { has: route.has, ...(route.missing ? { missing: route.missing } : {}) }
    conditions.set(JSON.stringify(condition), { ...condition, vary: route.headers.Vary })
  }
  if (!conditions.size) return []

  const vary = [...conditions.values()][0]!.vary
  return locales.flatMap((locale) => {
    const src = `^/${locale}(/docs/(?!.*\\.[^/]*$).*)$`
    return [
      { src, headers: { Vary: vary }, methods: ['GET', 'HEAD'], continue: true },
      ...[...conditions.values()].map(({ vary, ...condition }) => ({
        src,
        status: 307,
        headers: { Location: '$1', Vary: vary },
        ...condition,
        methods: ['GET', 'HEAD']
      }))
    ]
  })
}

export default defineNuxtModule({
  meta: {
    name: 'l10n-negotiation'
  },
  setup(_options, nuxt) {
    nuxt.hook('nitro:init', (nitro) => {
      if (nitro.options.dev || !nitro.options.preset.includes('vercel')) return

      // Registered after `nuxt-agent-discovery`, so its routes are already in the output.
      nitro.hooks.hook('compiled', async () => {
        const file = resolve(nitro.options.output.dir, 'config.json')
        const config = JSON.parse(await readFile(file, 'utf8')) as { routes: VercelRoute[] }
        const routes = localeNegotiationRoutes(config.routes, L10N_LOCALE_CODES)
        if (!routes.length) return

        config.routes.unshift(...routes)
        await writeFile(file, JSON.stringify(config, null, 2), 'utf8')
      })
    })
  }
})
