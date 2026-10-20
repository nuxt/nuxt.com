import { Sandbox } from '@vercel/sandbox'
import { desc, inArray } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { getRun, resumeHook, start } from 'workflow/api'
import type { Template, TemplateCheckRow, TemplateCheckRunSummary, TemplateToCheck } from '#shared/types'
import { checkTemplatesWorkflow, completionToken } from '../../workflows/check-templates'
import { applyCheckReport, stopCheckRow, type CheckReport, type CheckRow } from './check-report'

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
export async function startTemplateChecks(baseURL: string, options: { slugs?: string[], failing?: boolean, trigger: 'cron' | 'admin' | 'task', startedBy?: string }) {
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

async function stopSandbox(name: string | null) {
  if (!name) return
  const sandbox = await Sandbox.get({ name }).catch(() => null)
  if (sandbox?.status === 'running') await sandbox.stop().catch(() => {})
}

/** Marks the row stopped first, so reports still in flight from its check are refused, then cancels that check and stops its sandbox. */
async function stopRow(row: CheckRow, by: string, options: { wakeParent: boolean }) {
  await db.update(schema.templateChecks).set(stopCheckRow(row, by, new Date())).where(eq(schema.templateChecks.slug, row.slug))
  if (row.state !== 'running') return
  await Promise.all([
    row.runId ? getRun(row.runId).cancel({ cancelReason: `Stopped by ${by}` }).catch(() => {}) : undefined,
    stopSandbox(row.sandbox)
  ])
  // A cancelled child never wakes its parent: do it for it, so the run moves on to the next template.
  if (options.wakeParent && row.batchId) {
    await resumeHook(completionToken(row.batchId, row.slug), { status: 'failed', error: `Stopped by ${by}` }).catch(() => {})
  }
}

/** Stops the checks of `slugs` (the rest of their runs goes on), or every run when `slugs` is omitted. */
export async function stopTemplateChecks(by: string, slugs?: string[]) {
  if (slugs?.length) {
    const rows = (await db.select().from(schema.templateChecks).where(inArray(schema.templateChecks.slug, slugs))).filter(row => row.state !== 'idle')
    if (!rows.length) throw createError({ statusCode: 409, statusMessage: 'These templates are not being checked.' })
    await Promise.all(rows.map(row => stopRow(row, by, { wakeParent: true })))
    return { stopped: rows.map(row => row.slug) }
  }

  const runs = await getActiveRuns()
  if (!runs.length) throw createError({ statusCode: 409, statusMessage: 'No templates are being checked.' })
  const stopped = await Promise.all(runs.map(async (run) => {
    await db.update(schema.templateCheckRuns).set({ state: 'stopped', finishedAt: new Date() }).where(eq(schema.templateCheckRuns.id, run.id))
    if (run.runId) await getRun(run.runId).cancel({ cancelReason: `Stopped by ${by}` }).catch(() => {})
    const rows = await db.select().from(schema.templateChecks)
      .where(and(eq(schema.templateChecks.batchId, run.id), inArray(schema.templateChecks.state, ['queued', 'running'])))
    await Promise.all([...rows.map(row => stopRow(row, by, { wakeParent: false })), stopSandbox(run.browser)])
    return rows.map(row => row.slug)
  }))
  return { stopped: stopped.flat() }
}

/** The failure in one line for the table: the first error line the log found, or its summary. */
function errorSummary(log: string | null) {
  if (!log) return null
  const lines = log.split('\n')
  const errors = lines.indexOf('==> Errors')
  const first = errors === -1 ? undefined : lines.slice(errors + 1).find(line => line.trim())
  return (first ?? lines.find(line => line.trim()) ?? '').trim().replace(/^ERROR\s+/, '').slice(0, 300) || null
}

function toRow(template: Template, row: CheckRow | undefined, activeRunIds: Set<string>): TemplateCheckRow {
  // A row left `queued` or `running` by a run that no longer runs is idle.
  const state = row && row.state !== 'idle' && row.batchId && activeRunIds.has(row.batchId) ? row.state : 'idle'
  return {
    slug: template.slug,
    name: template.name,
    repo: template.repo!,
    repoUrl: templateRepoUrl(template)!,
    live: canLivePreview(template),
    state,
    phase: state === 'running' ? row!.phase : null,
    phases: row?.phases ?? [],
    status: row?.status ?? null,
    step: row?.step ?? null,
    nuxt: row?.nuxt ?? null,
    hasSnapshot: !!row?.snapshotId,
    runId: row?.runId ?? null,
    hasLog: !!row?.log,
    error: state === 'idle' && row?.status === 'failed' ? errorSummary(row.log) : null,
    seconds: row?.seconds ?? null,
    startedAt: row?.startedAt?.toISOString() ?? null,
    checkedAt: row?.checkedAt?.toISOString() ?? null,
    passedAt: row?.passedAt?.toISOString() ?? null
  }
}

/** Every checkable template with its last check, and the current or last run, for `/admin/templates`. */
export async function getTemplateChecksOverview(): Promise<{ runs: TemplateCheckRunSummary[], lastRun: TemplateCheckRunSummary | null, rows: TemplateCheckRow[] }> {
  const [templates, rows, activeRuns, [lastRun]] = await Promise.all([
    listCheckableTemplates(),
    listTemplateChecks(),
    getActiveRuns(),
    db.select().from(schema.templateCheckRuns).where(sql`${schema.templateCheckRuns.state} != 'running'`).orderBy(desc(schema.templateCheckRuns.startedAt)).limit(1)
  ])
  const activeIds = new Set(activeRuns.map(run => run.id))
  const bySlug = new Map(rows.map(row => [row.slug, row]))

  const summary = (run: typeof activeRuns[number], active: boolean): TemplateCheckRunSummary => {
    const inRun = active ? rows.filter(row => row.batchId === run.id) : []
    const running = inRun.filter(row => row.state === 'running').length
    const queued = inRun.filter(row => row.state === 'queued').length
    return {
      id: run.id,
      runId: run.runId,
      state: active ? 'running' : run.state,
      trigger: run.trigger,
      startedBy: run.startedBy,
      total: run.total,
      running,
      queued,
      // A template the run checked may be in a newer run since: whatever isn't waiting is done.
      done: run.total - running - queued,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString() ?? null
    }
  }
  return {
    runs: activeRuns.map(run => summary(run, true)),
    lastRun: lastRun ? summary(lastRun, false) : null,
    rows: templates.map(template => toRow(template, bySlug.get(template.slug), activeIds))
  }
}

/** One template's check with its log, for the details panel. */
export async function getTemplateCheck(slug: string) {
  const [templates, [row], activeRuns] = await Promise.all([
    listCheckableTemplates(),
    db.select().from(schema.templateChecks).where(eq(schema.templateChecks.slug, slug)),
    getActiveRuns()
  ])
  const template = templates.find(template => template.slug === slug)
  if (!template) throw createError({ statusCode: 404, statusMessage: 'Template not found' })
  return { ...toRow(template, row, new Set(activeRuns.map(run => run.id))), log: row?.log ?? null }
}
