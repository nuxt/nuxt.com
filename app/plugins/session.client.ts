/** Loads the session once the app is ready: before rendering on client-only routes, after hydration on server-rendered ones. */
export default defineNuxtPlugin(async (nuxtApp) => {
  if (!nuxtApp.payload.serverRendered) {
    await useUserSession().fetch()
  } else {
    nuxtApp.hook('app:suspense:resolve', () => useUserSession().fetch())
  }
})
