import type { PreviewEditEvent } from '#shared/types'
import { createError, defineHandler, getRouterParam } from 'nuxt/server'

/**
 * Starts `nuxt dev` in the visitor's live preview, so Nuxi's edits show through hot module replacement.
 * Streams NDJSON `PreviewEditEvent`s so the page can show it starting. Calling it again while it runs waits for the same server.
 */
export default defineHandler(async (event) => {
  const owner = await getRateLimitPrincipalId(event)
  const sandbox = owner ? await getPreviewSandbox(getRouterParam(event, 'id')!, owner) : null
  if (sandbox?.status !== 'running') {
    throw createError({ status: 404, message: 'This preview has stopped.' })
  }

  event.res.headers.set('content-type', 'application/x-ndjson')
  event.res.headers.set('cache-control', 'no-store')
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
        // The page asks again after a reload or a failure: count each preview once.
        trackTemplateEvent(event, 'Template Editor Started', claimPreviewStep(sandbox, 'editor').then(first => first ? { template: sandbox.tags?.template } : null))
      } catch (error) {
        console.error('[templates] dev server failed', error)
        trackTemplateEvent(event, 'Template Preview Failed', { template: sandbox.tags?.template, reason: 'The dev server could not start.' })
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
