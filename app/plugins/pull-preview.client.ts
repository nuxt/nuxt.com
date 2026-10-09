import { isPullContentPage } from '#shared/utils/pull'

/**
 * - A page without content leaves the preview, as `server/middleware/pull-preview.ts` does on a full load.
 * - Client-side navigation fetches `_payload.json` by page path, which in a preview is production's.
 *   Drop it once `nuxt:payload` has merged it, so `useAsyncData` fetches through the preview instead.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (!usePullPreview().value) return

  const router = useRouter()

  // `to.fullPath` carries no preview prefix, so a full load of it lands on production.
  router.beforeEach((to) => {
    if (isPullContentPage(to.fullPath)) return

    window.location.assign(to.fullPath)
    return false
  })

  router.beforeResolve(() => {
    for (const key in nuxtApp.static.data) nuxtApp.static.data[key] = undefined
  })
})
