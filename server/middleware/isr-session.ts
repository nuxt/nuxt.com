/**
 * Vercel ISR renders a page once and serves that HTML to everyone, but unlike Nitro's
 * `cachedEventHandler` it leaves `event.context.cache` unset. `nuxt-auth-utils` reads that flag
 * to skip the server session fetch and refetch on the client instead; without it, the visitor
 * who triggered the render has their session baked in and nobody else can appear logged in.
 */
export default defineEventHandler((event) => {
  if (!getRouteRules(event).isr) return

  event.context.cache ||= { options: {} }
})
