import { z } from 'zod'
import { defineHandler, readValidatedBody } from 'nuxt/server'

/** Called by `checkTemplatesWorkflow` with its Chromium sandbox once created, then once the run ends. */
export default defineHandler(async (event) => {
  requireInternalRequest(event)

  const update = await readValidatedBody(event, z.object({
    id: z.string().uuid(),
    browser: z.string().max(200).optional(),
    finished: z.boolean().optional()
  }).parse)
  await recordTemplateCheckRun(update)
  return { ok: true }
})
