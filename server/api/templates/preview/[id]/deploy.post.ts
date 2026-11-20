import type { PreviewDeployEvent } from '#shared/types'

/**
 * Deploys the visitor's live preview, with their edits, to Vercel without an account. They claim it to keep it.
 * Streams NDJSON `PreviewDeployEvent`s: the deploy takes about a minute.
 */
export default defineEventHandler(async (event) => {
  const owner = await getRateLimitPrincipalId(event)
  const sandbox = owner ? await getPreviewSandbox(getRouterParam(event, 'id')!, owner) : null
  if (!owner || sandbox?.status !== 'running') {
    throw createError({ statusCode: 404, message: 'This preview has stopped.' })
  }
  // Checked before the slot is taken, so a preview too old to deploy doesn't cost the visitor their cooldown.
  const { maxLifetimeMs } = await getPreviewLimits(event)
  const stopsAt = await keepPreviewForDeploy(owner, sandbox, maxLifetimeMs)
  const reservedAt = await reserveDeploy(owner)

  setResponseHeaders(event, { 'content-type': 'application/x-ndjson', 'cache-control': 'no-store' })
  const encoder = new TextEncoder()
  let cancelled = false
  return new ReadableStream({
    async start(controller) {
      const send = (data: PreviewDeployEvent) => {
        if (!cancelled) controller.enqueue(encoder.encode(`${JSON.stringify(data)}\n`))
      }
      let result: PreviewDeployEvent
      try {
        send({ type: 'started', stopsAt })
        await pauseDevServer(sandbox)
        result = { type: 'ready', ...await deployPreview(sandbox) }
      } catch (error) {
        await shortenDeployCooldown(owner, reservedAt).catch(() => {})
        if (!isError(error)) console.error('[templates] deploy failed', error)
        result = { type: 'error', message: isError(error) && error.message ? error.message : 'The deploy failed.' }
      }
      // The page starts live editing again on the last event, so editing is unblocked before it's sent.
      await resumeDevServer(sandbox).catch(error => console.error('[templates] could not resume editing after a deploy', error))
      send(result)
      if (!cancelled) controller.close()
    },
    cancel() {
      cancelled = true
    }
  })
})
