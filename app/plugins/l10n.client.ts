import { isLocalisedPage } from '#shared/utils/l10n'

/**
 * - A page without a localised twin leaves the locale with a full load.
 * - Client-side navigation fetches `_payload.json` by page path, which under a locale is the English page's.
 *   Drop it once `nuxt:payload` has merged it, so `useAsyncData` fetches the localised page instead.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (!useDocsLocale().value) return

  const router = useRouter()

  // `to.fullPath` carries no locale prefix, so a full load of it lands on the English page.
  router.beforeEach((to) => {
    if (isLocalisedPage(to.path)) return

    window.location.assign(to.fullPath)
    return false
  })

  router.beforeResolve(() => {
    for (const key in nuxtApp.static.data) nuxtApp.static.data[key] = undefined
  })
})
