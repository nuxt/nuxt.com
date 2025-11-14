export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  if (!config.vercel.skewProtection) return

  const event = nuxtApp.ssrContext!.event
  if (event.headers.get('sec-fetch-dest') === 'document') {
    setCookie(event, '__vdpl', config.vercel.deploymentId, { httpOnly: true })
  }
})
