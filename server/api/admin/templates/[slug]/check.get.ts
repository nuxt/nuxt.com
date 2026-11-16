import { z } from 'zod'

export default defineEventHandler(async (event) => {
  await requireAdminUserSession(event)
  const { slug } = await getValidatedRouterParams(event, z.object({ slug: z.string().regex(/^[a-z0-9-]+$/) }).parse)
  setResponseHeader(event, 'cache-control', 'no-store')
  const [row] = await db.select({
    state: schema.templateChecks.state, phase: schema.templateChecks.phase,
    status: schema.templateChecks.status, step: schema.templateChecks.step, batchId: schema.templateChecks.batchId
  }).from(schema.templateChecks).where(eq(schema.templateChecks.slug, slug))
  if (!row) return { state: 'idle' as const, phase: null, status: null, step: null }
  const { batchId, ...check } = row
  // Use the workflow's stale-run rule so an interrupted check cannot disable the button forever.
  if (check.state !== 'idle' && !(await getActiveTemplateCheckRuns()).some(run => run.id === batchId)) {
    return { ...check, state: 'idle' as const, phase: null }
  }
  return check
})
