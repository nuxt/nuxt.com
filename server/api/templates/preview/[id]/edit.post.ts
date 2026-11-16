import type { PreviewEditEvent } from '#shared/types'

/**
 * Starts `nuxt dev` in the visitor's live preview, so Nuxi's edits show through hot module replacement.
 * Streams NDJSON `PreviewEditEvent`s so the page can show it starting. Calling it again while it runs waits for the same server.
 */
export default defineEventHandler(async (event) => {
  const owner = await getRateLimitPrincipalId(event)
  const sandbox = owner ? await getPreviewSandbox(getRouterParam(event, 'id')!, owner) : null
  if (sandbox?.status !== 'running') {
    throw createError({ statusCode: 404, message: 'This preview has stopped.' })
  }

  setResponseHeaders(event, { 'content-type': 'application/x-ndjson', 'cache-control': 'no-store' })
  const encoder = new TextEncoder()
  let cancelled = false
  return new ReadableStream({
    async start(controller) {
      const send = (data: PreviewEditEvent) => {
        if (!cancelled) controller.enqueue(encoder.encode(`${JSON.stringify(data)}\n`))
      }
      try {
        const url = await waitForDevServer(sandbox, () => send({ type: 'started' }))
        send({ type: 'ready', url })
      } catch (error) {
        console.error('[templates] dev server failed', error)
        send({ type: 'error', message: 'The dev server could not start.' })
      } finally {
        if (!cancelled) controller.close()
      }
    },
    cancel() {
      cancelled = true
    }
  })
})
