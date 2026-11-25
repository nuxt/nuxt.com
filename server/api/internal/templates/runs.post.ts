import { z } from 'zod'

/** Called by `checkTemplatesWorkflow` with its Chromium sandbox once created, then once the run ends. */
export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const update = await readValidatedBody(event, z.object({
    id: z.string().uuid(),
    browser: z.string().max(200).optional(),
    finished: z.boolean().optional()
  }).parse)
  await recordTemplateCheckRun(update)
  return { ok: true }
})
