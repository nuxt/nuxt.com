import { and, eq, inArray } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { templateCheckRuns, templateChecks } from '../../db/schema'
import { applyCheckReport, type CheckReport } from './check-report'

/**
 * Writes of `checkTemplatesWorkflow` to `template_checks` and `template_check_runs`. They take the database, because on Vercel
 * the workflow runs outside Nitro: its steps open the database themselves instead of calling back into the app.
 */
// `any`: the app's `db` and the workflow's client differ in result type and schema.
type Database = BaseSQLiteDatabase<'async', any, any>

/** `stopped` means the row no longer belongs to this check (another run queued the template). A passing finish returns the snapshot it replaced, to delete. */
export async function recordTemplateCheck(db: Database, report: CheckReport) {
  if ('log' in report && report.log) report = { ...report, log: report.log.slice(-16000) }
  const [previous] = await db.select().from(templateChecks).where(eq(templateChecks.slug, report.slug))
  const { accepted, row, previousSnapshotId } = applyCheckReport(previous, report, new Date())
  if (!accepted) return { stopped: true }
  // Only while the row is still the one the report was checked against: another run may have queued the template since.
  const owner = report.kind === 'start'
    ? and(eq(templateChecks.state, 'queued'), eq(templateChecks.batchId, report.batchId))
    : and(eq(templateChecks.state, 'running'), eq(templateChecks.runId, report.runId))
  const updated = await db.update(templateChecks).set(row)
    .where(and(eq(templateChecks.slug, report.slug), owner))
    .returning({ slug: templateChecks.slug })
  if (!updated.length) return { stopped: true }
  return { stopped: false, previousSnapshotId }
}

/** Called by the run itself: its Chromium sandbox once created, then its end. Templates it didn't get to are no longer queued. */
export async function recordTemplateCheckRun(db: Database, update: { id: string, browser?: string, finished?: boolean }) {
  if (update.browser) {
    await db.update(templateCheckRuns).set({ browser: update.browser }).where(eq(templateCheckRuns.id, update.id))
  }
  if (update.finished) {
    await db.update(templateCheckRuns).set({ state: 'finished', finishedAt: new Date() })
      .where(and(eq(templateCheckRuns.id, update.id), eq(templateCheckRuns.state, 'running')))
    await db.update(templateChecks).set({ state: 'idle', phase: null })
      .where(and(eq(templateChecks.batchId, update.id), inArray(templateChecks.state, ['queued', 'running'])))
  }
}
