import { z } from 'zod'
import { checkBotId } from 'botid/server'
import type { Template } from '#shared/types'

/** Boots a live preview of a template in a Vercel Sandbox, for every visitor. Each preview runs a VM: BotID keeps bots out. */
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

  return startPreview(template, owner)
})
