import { waitUntil } from '@vercel/functions'

/**
 * Nitro's Vercel (Node) entry leaves `event.context.waitUntil` unset, so `event.waitUntil` only collects
 * the promise: cache writes of `defineCachedFunction` and SWR revalidations could stop with the response.
 * Vercel's `waitUntil` keeps the function alive until they settle (a no-op outside Vercel).
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    event.context.waitUntil ||= waitUntil
  })
})
