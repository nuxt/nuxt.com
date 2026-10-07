/**
 * Client-side navigation fetches `_payload.json` by page path, which in a preview is production's.
 * Drop it once `nuxt:payload` has merged it, so `useAsyncData` fetches through the preview instead.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (!usePullPreview().value) return

  useRouter().beforeResolve(() => {
    for (const key in nuxtApp.static.data) nuxtApp.static.data[key] = undefined
  })
})
