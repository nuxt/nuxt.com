import { desc, inArray } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { start } from 'workflow/api'
import type { Template, TemplateToCheck } from '#shared/types'
import { checkTemplatesWorkflow } from '../../workflows/check-templates'
import { applyCheckReport, type CheckReport } from './check-report'

/** A run still `running` after this was cancelled outside nuxt.com or crashed: it no longer blocks a new one. */
const STALE_AFTER_MS = 3 * 60 * 60 * 1000

export async function recordTemplateCheck(report: CheckReport) {
  const [previous] = await db.select().from(schema.templateChecks).where(eq(schema.templateChecks.slug, report.slug))
  const { accepted, row, previousSnapshotId } = applyCheckReport(previous, report, new Date())
  if (!accepted) return { stopped: true }
  await db.insert(schema.templateChecks).values(row).onConflictDoUpdate({ target: schema.templateChecks.slug, set: row })
  if (report.kind === 'finish' && report.status) await clearHealthCache()
  return { stopped: false, previousSnapshotId }
}

/** `/api/templates/health` caches for 10 minutes: a new result shows right away instead. */
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

/** The snapshot of the last check, only while it passes: a failing template keeps its snapshot but has no live preview. */
export async function getPassingSnapshotId(slug: string) {
  const [row] = await db.select({ status: schema.templateChecks.status, snapshotId: schema.templateChecks.snapshotId })
    .from(schema.templateChecks)
    .where(eq(schema.templateChecks.slug, slug))
  return row?.status === 'passed' ? row.snapshotId ?? undefined : undefined
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
export async function startTemplateChecks(baseURL: string, options: { slugs?: string[], failing?: boolean, trigger: 'cron' | 'task', startedBy?: string }) {
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
