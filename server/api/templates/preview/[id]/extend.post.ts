/** Keeps the visitor's live preview running `PREVIEW_TIMEOUT_MS` longer, up to a total lifetime that is longer for admins. */
export default defineEventHandler(async (event) => {
  const owner = await getRateLimitPrincipalId(event)
  const sandbox = owner ? await getPreviewSandbox(getRouterParam(event, 'id')!, owner) : null
  if (sandbox?.status !== 'running') {
    throw createError({ statusCode: 404, message: 'This preview has stopped.' })
  }

  const { maxLifetimeMs } = await getPreviewLimits(event)
  return extendPreview(owner!, sandbox, maxLifetimeMs)
})
