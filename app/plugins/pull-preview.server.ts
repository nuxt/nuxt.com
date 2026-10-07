import { parsePullPath } from '#shared/utils/pull'

/**
 * Render a `/pull/:repo/:number/<path>` request as `<path>`, so pages, middleware and `route.path` stay unaware.
 * `router.options.ts` puts the prefix back on every link, and the client router hydrates from `payload.path`.
 */
export default defineNuxtPlugin({
  name: 'pull-preview',
  // Before `nuxt:router` reads `ssrContext.url`.
  order: -45,
  setup(nuxtApp) {
    const ssrContext = nuxtApp.ssrContext!
    // This plugin sets `usePullPreview()`, so it reads the URL instead.
    const preview = parsePullPath(ssrContext.url)
    // Not a preview: render the request as is.
    if (!preview) return

    ssrContext.url = nuxtApp.payload.path = preview.path
    usePullPreview().value = preview.target
  }
})
