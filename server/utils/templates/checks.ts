import { desc } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { start } from 'workflow/api'
import type { Template } from '#shared/types'
import { checkTemplatesWorkflow } from '../../workflows/check-templates'
import { TEMPLATE_SNAPSHOT_TTL_MS, type CheckRow, type TemplateToCheck } from './check-report'
import { recordTemplateCheckRun } from './check-store'

/** A run still `running` after this was cancelled outside nuxt.com or crashed: it no longer blocks a new one. */
const STALE_AFTER_MS = 3 * 60 * 60 * 1000

export async function listTemplateChecks() {
  return db.select().from(schema.templateChecks)
}

/** The snapshot of the last check, only while it passes and hasn't expired. A failing template keeps its snapshot until it expires, but has no live preview. */
export async function getPassingSnapshotId(slug: string) {
  const [row] = await db.select({ status: schema.templateChecks.status, snapshotId: schema.templateChecks.snapshotId, passedAt: schema.templateChecks.passedAt })
    .from(schema.templateChecks)
    .where(eq(schema.templateChecks.slug, slug))
  return row && hasLiveSnapshot(row) ? row.snapshotId! : undefined
}

/** The row passed and its snapshot can still boot a preview: an hour short of the expiry, so a preview never restores a snapshot that expires while it boots. */
export function hasLiveSnapshot(row: Pick<CheckRow, 'status' | 'snapshotId' | 'passedAt'>) {
  const age = row.passedAt ? Date.now() - row.passedAt.getTime() : NaN
  return row.status === 'passed' && !!row.snapshotId && !!row.passedAt
    && age >= 0 && age < TEMPLATE_SNAPSHOT_TTL_MS - 60 * 60 * 1000
}

/** Templates with a public repository: the ones the check can install. */
async function listCheckableTemplates() {
  return (await listByDir<Template>('/templates'))
    .filter(template => template.repo && template.template !== 'module')
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Runs still going. Runs can overlap: a template is only ever checked by one of them. */
export async function getActiveTemplateCheckRuns() {
  return db.select().from(schema.templateCheckRuns)
    .where(and(eq(schema.templateCheckRuns.state, 'running'), sql`${schema.templateCheckRuns.startedAt} > ${Math.floor((Date.now() - STALE_AFTER_MS) / 1000)}`))
    .orderBy(desc(schema.templateCheckRuns.startedAt))
}

/** Starts a run over every template, the ones in `slugs`, or the ones that don't pass (`failing`). Templates another run checks are skipped. */
export async function startTemplateChecks(options: { slugs?: string[], failing?: boolean, trigger: 'cron' | 'task' | 'mcp' | 'admin', startedBy?: string }) {
  const [templates, rows, activeRuns] = await Promise.all([listCheckableTemplates(), listTemplateChecks(), getActiveTemplateCheckRuns()])
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

  const run = await start(checkTemplatesWorkflow, [{ batchId, templates: input }]).catch(async (error) => {
    await recordTemplateCheckRun(db, { id: batchId, finished: true })
    throw error
  })
  await db.update(schema.templateCheckRuns).set({ runId: run.runId }).where(eq(schema.templateCheckRuns.id, batchId))

  return { runId: run.runId, queued: input.map(template => template.slug), skipped }
}
