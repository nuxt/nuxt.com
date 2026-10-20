import type { TemplateCheckPhase, TemplateCheckPhaseTiming, TemplateCheckStep } from '../../../shared/types/templates'
import type { templateChecks } from '../../db/schema'

export type CheckRow = typeof templateChecks.$inferSelect

/** What `checkTemplatesWorkflow` reports about a template, from the child run that checks it. */
export type CheckReport
  = | { kind: 'start', slug: string, runId: string, batchId: string }
    | { kind: 'progress', slug: string, runId: string, phase: TemplateCheckPhase, sandbox?: string, log?: string }
    | { kind: 'finish', slug: string, runId: string, status?: 'passed' | 'failed', step?: TemplateCheckStep, nuxt?: string, snapshotId?: string, log?: string }

export function emptyCheckRow(slug: string): CheckRow {
  return {
    slug, state: 'idle', phase: null, phases: null, status: null, step: null, nuxt: null, snapshotId: null,
    runId: null, batchId: null, sandbox: null, log: null, seconds: null, startedAt: null, checkedAt: null, passedAt: null
  }
}

function closePhases(phases: TemplateCheckPhaseTiming[] | null, now: Date) {
  return (phases ?? []).map(timing => timing.seconds === undefined
    ? { ...timing, seconds: Math.max(0, Math.round((now.getTime() - timing.startedAt) / 1000)) }
    : timing)
}

/**
 * The row after a check reports, or `accepted: false` when the report comes from a check that was stopped or replaced.
 * A passing check replaces the snapshot and returns the old one, to delete.
 * A failing check keeps the last passing snapshot and `passedAt`, so the template "now fails" and its preview stays off until it passes again.
 */
export function applyCheckReport(previous: CheckRow | undefined, report: CheckReport, now: Date): { accepted: boolean, row: CheckRow, previousSnapshotId?: string } {
  const base = previous ?? emptyCheckRow(report.slug)

  if (report.kind === 'start') {
    if (base.state !== 'queued' || base.batchId !== report.batchId) return { accepted: false, row: base }
    return {
      accepted: true,
      row: { ...base, state: 'running', runId: report.runId, phase: 'setup', phases: [{ phase: 'setup', startedAt: now.getTime() }], sandbox: null, log: null, startedAt: now }
    }
  }

  if (base.state !== 'running' || base.runId !== report.runId) return { accepted: false, row: base }

  if (report.kind === 'progress') {
    const phases = report.phase === base.phase
      ? base.phases
      : [...closePhases(base.phases, now), { phase: report.phase, startedAt: now.getTime() }]
    return {
      accepted: true,
      row: { ...base, phase: report.phase, phases, sandbox: report.sandbox ?? base.sandbox, log: report.log ?? base.log }
    }
  }

  const finished = { ...base, state: 'idle' as const, phase: null, phases: closePhases(base.phases, now), sandbox: null }
  if (!report.status) {
    return { accepted: true, row: { ...finished, log: report.log ?? null } }
  }
  const result = {
    ...finished,
    status: report.status,
    checkedAt: now,
    seconds: base.startedAt ? Math.round((now.getTime() - base.startedAt.getTime()) / 1000) : null
  }
  if (report.status === 'failed') {
    return { accepted: true, row: { ...result, step: report.step ?? null, nuxt: report.nuxt ?? null, log: report.log ?? null } }
  }
  const snapshotId = report.snapshotId ?? null
  return {
    accepted: true,
    row: { ...result, step: null, nuxt: report.nuxt ?? null, log: null, snapshotId, passedAt: now },
    previousSnapshotId: base.snapshotId && base.snapshotId !== snapshotId ? base.snapshotId : undefined
  }
}

/** The row once an admin stops its check. Its last result stays. */
export function stopCheckRow(row: CheckRow, by: string, now: Date): CheckRow {
  const during = row.state === 'running' && row.phase ? ` during ${row.phase}` : ' before it started'
  return { ...row, state: 'idle', phase: null, phases: row.state === 'running' ? closePhases(row.phases, now) : row.phases, sandbox: null, log: `Stopped by ${by}${during}.` }
}
