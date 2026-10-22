import { z } from 'zod'
import { checkBotId } from 'botid/server'
import type { Sandbox } from '@vercel/sandbox'
import type { PreviewEvent, Template } from '#shared/types'

/**
 * Boots a live preview of a template in a Vercel Sandbox, for every visitor. Each preview runs a VM: BotID keeps bots out.
 * Streams NDJSON `PreviewEvent`s so the page can show each stage as it happens.
 */
export default defineEventHandler(async (event) => {
  const verification = await checkBotId()
  if (verification.isBot) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  const owner = await ensureRateLimitPrincipalId(event)

  const { slug } = await readValidatedBody(event, z.object({ slug: z.string().regex(/^[a-z0-9-]+$/) }).parse)
  const template = (await listByDir<Template>('/templates')).find(template => template.slug === slug)
  if (!template || !canLivePreview(template)) {
    throw createError({ statusCode: 400, message: 'This template has no live preview.' })
  }

  setResponseHeaders(event, { 'content-type': 'application/x-ndjson', 'cache-control': 'no-store' })
  const encoder = new TextEncoder()
  // A visitor who leaves before the stream ends never gets the preview: its sandbox stops instead of running for 10 minutes.
  let left = false
  let started: Sandbox | undefined
  const stop = (sandbox: Sandbox) => {
    sandbox.stop().catch(() => {})
    releasePreview(owner, sandbox.name).catch(() => {})
  }
  const leave = () => {
    if (left) return
    left = true
    if (started) stop(started)
  }
  event.node.res.once('close', () => {
    if (!event.node.res.writableFinished) leave()
  })

  return new ReadableStream({
    async start(controller) {
      const send = (data: PreviewEvent) => {
        if (!left) controller.enqueue(encoder.encode(`${JSON.stringify(data)}\n`))
      }
      try {
        const { sandbox, ...preview } = await startPreview(template, owner, step => send({ type: 'step', step }))
        started = sandbox
        if (left) return stop(sandbox)
        send({ type: 'ready', ...preview })
        await useNitroApp().hooks.callHook('templates:preview', { template, owner, sandbox, send })
      } catch (error) {
        // Only errors `startPreview` raises on purpose reach visitors: upstream ones can carry request or account details.
        if (!isError(error)) console.error('[templates] preview failed', error)
        send({ type: 'error', message: isError(error) && error.message ? error.message : 'The preview could not start.' })
      } finally {
        if (!left) controller.close()
      }
    },
    cancel: leave
  })
})
