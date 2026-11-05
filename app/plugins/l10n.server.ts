import { parseLocalePath } from '#shared/utils/l10n'

/**
 * Render a `/<locale>/docs/…` request as `/docs/…`, so pages, middleware and `route.path` stay unaware.
 * `router.options.ts` puts the prefix back on every link, and the client router hydrates from `payload.path`.
 * Only localised pages get here: `server/middleware/l10n.ts` redirects the rest.
 */
export default defineNuxtPlugin({
  name: 'l10n',
  dependsOn: ['pull-preview'],
  order: -45,
  setup(nuxtApp) {
    if (usePullPreview().value) return

    const ssrContext = nuxtApp.ssrContext!
    const parsed = parseLocalePath(ssrContext.url)
    if (!parsed?.locale) return

    ssrContext.url = nuxtApp.payload.path = parsed.path
    useDocsLocale().value = parsed.locale
  }
})
