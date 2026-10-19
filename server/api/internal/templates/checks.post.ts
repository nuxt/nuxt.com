import { z } from 'zod'
import { TEMPLATE_CHECK_PHASES } from '#shared/types'

const slug = z.string().regex(/^[a-z0-9-]+$/)
const runId = z.string().min(1).max(200)
const log = z.string().transform(log => log.slice(-16000))

/**
 * Called by `checkTemplatesWorkflow` as a template check starts, moves to a new phase and finishes.
 * `stopped: true` tells the check another run took over its template. A passing finish returns the snapshot it replaced, to delete.
 */
export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const report = await readValidatedBody(event, z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('start'), slug, runId, batchId: z.string().min(1).max(200) }),
    z.object({ kind: z.literal('progress'), slug, runId, phase: z.enum(TEMPLATE_CHECK_PHASES), sandbox: z.string().max(200).optional(), log: log.optional() }),
    z.object({
      kind: z.literal('finish'),
      slug,
      runId,
      status: z.enum(['passed', 'failed']).optional(),
      step: z.enum(['install', 'build', 'start']).optional(),
      nuxt: z.string().max(50).optional(),
      snapshotId: z.string().max(200).optional(),
      log: log.optional()
    })
  ]).parse)

  const result = await recordTemplateCheck(report)
  if (report.kind === 'finish' && report.status && !result.stopped) {
    console.log(`[templates] ${report.slug} ${report.status}${report.step ? ` at ${report.step}` : ''} (run ${report.runId})`)
  }
  return result
})
