export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  if (!config.vercel.skewProtection) return

  const event = nuxtApp.ssrContext!.event
  const secFetchDest = getRequestHeader(nuxtApp.ssrContext!.event, 'sec-fetch-dest')
  if (secFetchDest === 'document') {
    setCookie(event, '__vdpl', config.vercel.deploymentId, { httpOnly: true })
  }
})
