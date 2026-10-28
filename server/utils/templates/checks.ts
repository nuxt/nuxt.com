import { desc, inArray } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import type { H3Event } from 'h3'
import { start } from 'workflow/api'
import type { Template } from '#shared/types'
import { checkTemplatesWorkflow } from '../../workflows/check-templates'
import { applyCheckReport, TEMPLATE_SNAPSHOT_TTL_MS, type CheckReport, type TemplateToCheck } from './check-report'

/** A run still `running` after this was cancelled outside nuxt.com or crashed: it no longer blocks a new one. */
const STALE_AFTER_MS = 3 * 60 * 60 * 1000

export async function recordTemplateCheck(report: CheckReport) {
  const [previous] = await db.select().from(schema.templateChecks).where(eq(schema.templateChecks.slug, report.slug))
  const { accepted, row, previousSnapshotId } = applyCheckReport(previous, report, new Date())
  if (!accepted) return { stopped: true }
  // Only while the row is still the one the report was checked against: another run may have queued the template since.
  const owner = report.kind === 'start'
    ? and(eq(schema.templateChecks.state, 'queued'), eq(schema.templateChecks.batchId, report.batchId))
    : and(eq(schema.templateChecks.state, 'running'), eq(schema.templateChecks.runId, report.runId))
  const updated = await db.update(schema.templateChecks).set(row)
    .where(and(eq(schema.templateChecks.slug, report.slug), owner))
    .returning({ slug: schema.templateChecks.slug })
  if (!updated.length) return { stopped: true }
  if (report.kind === 'finish' && report.status) {
    // The result is saved: a failure here must not fail the report, or its retry is refused and the workflow deletes the snapshot the row now points to.
    await clearHealthCache().catch(error => console.error('[templates] health cache clear failed', error))
  }
  return { stopped: false, previousSnapshotId }
}

/** `/api/templates/health` caches for 10 minutes: a new result shows right away instead. Otherwise it shows once the cache expires. */
async function clearHealthCache() {
  const storage = useStorage('cache')
  const keys = await storage.getKeys('nitro:handlers:template-health')
  await Promise.all(keys.map(key => storage.removeItem(key)))
}

/** Called by the run itself: its Chromium sandbox once created, then its end. Templates it didn't get to are no longer queued. */
export async function recordTemplateCheckRun(update: { id: string, browser?: string, finished?: boolean }) {
  if (update.browser) {
    await db.update(schema.templateCheckRuns).set({ browser: update.browser }).where(eq(schema.templateCheckRuns.id, update.id))
  }
  if (update.finished) {
    await db.update(schema.templateCheckRuns).set({ state: 'finished', finishedAt: new Date() })
      .where(and(eq(schema.templateCheckRuns.id, update.id), eq(schema.templateCheckRuns.state, 'running')))
    await db.update(schema.templateChecks).set({ state: 'idle', phase: null })
      .where(and(eq(schema.templateChecks.batchId, update.id), inArray(schema.templateChecks.state, ['queued', 'running'])))
  }
}

export async function listTemplateChecks() {
  return db.select().from(schema.templateChecks)
}

/** The snapshot of the last check, only while it passes and hasn't expired. A failing template keeps its snapshot until it expires, but has no live preview. */
export async function getPassingSnapshotId(slug: string) {
  const [row] = await db.select({ status: schema.templateChecks.status, snapshotId: schema.templateChecks.snapshotId, passedAt: schema.templateChecks.passedAt })
    .from(schema.templateChecks)
    .where(eq(schema.templateChecks.slug, slug))
  // An hour short of the expiry, so a preview never restores a snapshot that expires while it boots.
  const fresh = !!row?.passedAt && Date.now() - row.passedAt.getTime() < TEMPLATE_SNAPSHOT_TTL_MS - 60 * 60 * 1000
  return row?.status === 'passed' && fresh ? row.snapshotId ?? undefined : undefined
}

/** Templates with a public repository: the ones the check can install. */
async function listCheckableTemplates() {
  return (await listByDir<Template>('/templates'))
    .filter(template => template.repo && template.template !== 'module')
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Runs still going. Runs can overlap: a template is only ever checked by one of them. */
async function getActiveRuns() {
  return db.select().from(schema.templateCheckRuns)
    .where(and(eq(schema.templateCheckRuns.state, 'running'), sql`${schema.templateCheckRuns.startedAt} > ${Math.floor((Date.now() - STALE_AFTER_MS) / 1000)}`))
    .orderBy(desc(schema.templateCheckRuns.startedAt))
}

/** Starts a run over every template, the ones in `slugs`, or the ones that don't pass (`failing`). Templates another run checks are skipped. */
/** Where the check reports back. It sends internal secrets to this URL, so production never takes it from request headers. */
export function templateCheckBaseURL(event: H3Event) {
  return process.env.VERCEL_ENV === 'production' ? SITE_URL : getRequestURL(event, { xForwardedHost: true }).origin
}

export async function startTemplateChecks(baseURL: string, options: { slugs?: string[], failing?: boolean, trigger: 'cron' | 'task' | 'mcp', startedBy?: string }) {
  const [templates, rows, activeRuns] = await Promise.all([listCheckableTemplates(), listTemplateChecks(), getActiveRuns()])
  const bySlug = new Map(rows.map(row => [row.slug, row]))
  const activeIds = new Set(activeRuns.map(run => run.id))
  const busy = (slug: string) => {
    const row = bySlug.get(slug)
    return !!row && row.state !== 'idle' && !!row.batchId && activeIds.has(row.batchId)
  }
  const wanted = templates
    .filter(template => !options.slugs?.length || options.slugs.includes(template.slug))
    .filter(template => !options.failing || bySlug.get(template.slug)?.status !== 'passed')
  const selected = wanted.filter(template => !busy(template.slug))
  const skipped = wanted.filter(template => busy(template.slug)).map(template => template.slug)
  if (!selected.length) return { runId: null, queued: [], skipped }

  const input: TemplateToCheck[] = selected.map(template => ({
    slug: template.slug,
    repo: template.repo!,
    branch: template.branch,
    source: template.source,
    live: canLivePreview(template)
  }))
  // Queued before the workflow starts: a check only runs while its row is queued for this run.
  const batchId = crypto.randomUUID()
  const queued = { state: 'queued' as const, phase: null, batchId }
  const statements: BatchItem<'sqlite'>[] = [
    db.insert(schema.templateCheckRuns).values({ id: batchId, state: 'running', trigger: options.trigger, startedBy: options.startedBy ?? null, total: input.length, startedAt: new Date() }),
    ...input.map(({ slug }) => db.insert(schema.templateChecks).values({ slug, ...queued }).onConflictDoUpdate({ target: schema.templateChecks.slug, set: queued }))
  ]
  await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]])

  const run = await start(checkTemplatesWorkflow, [{ baseURL, batchId, templates: input }]).catch(async (error) => {
    await recordTemplateCheckRun({ id: batchId, finished: true })
    throw error
  })
  await db.update(schema.templateCheckRuns).set({ runId: run.runId }).where(eq(schema.templateCheckRuns.id, batchId))

  return { runId: run.runId, queued: input.map(template => template.slug), skipped }
}
