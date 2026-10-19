import { z } from 'zod'
import type { Template } from '#shared/types'

/** Boots a live preview of a template in a Vercel Sandbox. Signed-in visitors only outside dev, since each preview runs a VM. */
export default defineEventHandler(async (event) => {
  if (!import.meta.dev) await requireUserSession(event)

  const { slug } = await readValidatedBody(event, z.object({ slug: z.string().regex(/^[a-z0-9-]+$/) }).parse)
  const template = (await listByDir<Template>('/templates')).find(template => template.slug === slug)
  if (!template || !canLivePreview(template)) {
    throw createError({ statusCode: 400, message: 'This template has no live preview.' })
  }

  return startPreview(template)
})
