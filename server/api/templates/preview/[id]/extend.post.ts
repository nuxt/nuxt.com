import { createError, defineHandler, getRouterParam } from 'nuxt/server'
/** Keeps the visitor's live preview running `PREVIEW_TIMEOUT_MS` longer, up to a total lifetime that is longer for admins. */
export default defineHandler(async (event) => {
  const owner = await getRateLimitPrincipalId(event)
  const sandbox = owner ? await getPreviewSandbox(getRouterParam(event, 'id', { decode: true })!, owner) : null
  if (sandbox?.status !== 'running') {
    throw createError({ status: 404, message: 'This preview has stopped.' })
  }

  const { maxLifetimeMs } = await getPreviewLimits(event)
  return extendPreview(owner!, sandbox, maxLifetimeMs)
})
