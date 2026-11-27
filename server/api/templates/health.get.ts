import { defineHandler } from 'nuxt/server'

export default defineHandler((event) => {
  // Repository metadata is cached separately; build results must reflect a finished recheck immediately.
  event.res.headers.set('cache-control', 'no-store')
  return fetchTemplateHealth(event)
})
