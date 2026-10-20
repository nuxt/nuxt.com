import { describe, expect, it } from 'vitest'
import { applyCheckReport, emptyCheckRow, stopCheckRow, type CheckRow } from '../../server/utils/templates/check-report'

const started = new Date('2026-10-20T04:00:00Z')
const later = new Date('2026-10-20T04:01:30Z')
const finished = new Date('2026-10-20T04:06:00Z')

const passing: CheckRow = {
  ...emptyCheckRow('minimal'),
  status: 'passed', nuxt: '4.6.1', snapshotId: 'snap_old',
  checkedAt: new Date('2026-10-19T04:05:00Z'), passedAt: new Date('2026-10-19T04:05:00Z')
}
const queued: CheckRow = { ...passing, state: 'queued', batchId: 'batch_2' }
const running: CheckRow = {
  ...passing, state: 'running', batchId: 'batch_2', runId: 'wrun_2', phase: 'build', sandbox: 'sbx_1', startedAt: started,
  phases: [{ phase: 'setup', startedAt: started.getTime(), seconds: 20 }, { phase: 'install', startedAt: started.getTime() + 20_000, seconds: 40 }, { phase: 'build', startedAt: started.getTime() + 60_000 }]
}

describe('applyCheckReport', () => {
  it('starts a check queued by the same run', () => {
    const { accepted, row } = applyCheckReport(queued, { kind: 'start', slug: 'minimal', runId: 'wrun_2', batchId: 'batch_2' }, started)
    expect(accepted).toBe(true)
    expect(row).toMatchObject({ state: 'running', runId: 'wrun_2', phase: 'setup', phases: [{ phase: 'setup', startedAt: started.getTime() }], startedAt: started, status: 'passed' })
  })

  it('refuses to start a check that was stopped or queued by another run', () => {
    expect(applyCheckReport({ ...queued, state: 'idle' }, { kind: 'start', slug: 'minimal', runId: 'wrun_2', batchId: 'batch_2' }, started).accepted).toBe(false)
    expect(applyCheckReport(queued, { kind: 'start', slug: 'minimal', runId: 'wrun_2', batchId: 'batch_1' }, started).accepted).toBe(false)
    expect(applyCheckReport(undefined, { kind: 'start', slug: 'docus', runId: 'wrun_3', batchId: 'batch_2' }, started).accepted).toBe(false)
  })

  it('closes the previous phase when a check moves on', () => {
    const { row } = applyCheckReport(running, { kind: 'progress', slug: 'minimal', runId: 'wrun_2', phase: 'start' }, later)
    expect(row.phase).toBe('start')
    expect(row.phases).toEqual([running.phases![0], running.phases![1], { phase: 'build', startedAt: running.phases![2]!.startedAt, seconds: 30 }, { phase: 'start', startedAt: later.getTime() }])
  })

  it('updates the live log without opening a new phase', () => {
    const { row } = applyCheckReport(running, { kind: 'progress', slug: 'minimal', runId: 'wrun_2', phase: 'build', log: 'Building client…' }, later)
    expect(row).toMatchObject({ phase: 'build', log: 'Building client…', sandbox: 'sbx_1' })
    expect(row.phases).toHaveLength(3)
  })

  it('refuses reports from a check that no longer owns the row', () => {
    expect(applyCheckReport({ ...running, state: 'idle' }, { kind: 'progress', slug: 'minimal', runId: 'wrun_2', phase: 'start' }, later).accepted).toBe(false)
    expect(applyCheckReport(running, { kind: 'finish', slug: 'minimal', runId: 'wrun_1', status: 'passed' }, finished).accepted).toBe(false)
  })

  it('replaces the snapshot of a passing check and returns the old one to delete', () => {
    const { row, previousSnapshotId } = applyCheckReport(running, { kind: 'finish', slug: 'minimal', runId: 'wrun_2', status: 'passed', nuxt: '4.6.2', snapshotId: 'snap_new' }, finished)
    expect(previousSnapshotId).toBe('snap_old')
    expect(row).toMatchObject({ state: 'idle', phase: null, sandbox: null, status: 'passed', nuxt: '4.6.2', snapshotId: 'snap_new', passedAt: finished, checkedAt: finished, seconds: 360 })
  })

  it('keeps the last passing snapshot when the template now fails', () => {
    const { row, previousSnapshotId } = applyCheckReport(running, { kind: 'finish', slug: 'minimal', runId: 'wrun_2', status: 'failed', step: 'build', log: 'ERROR' }, finished)
    expect(previousSnapshotId).toBeUndefined()
    expect(row).toMatchObject({ status: 'failed', step: 'build', log: 'ERROR', snapshotId: 'snap_old', passedAt: passing.passedAt, checkedAt: finished })
  })

  it('drops the snapshot of a template that passes but can no longer run live', () => {
    const { row, previousSnapshotId } = applyCheckReport(running, { kind: 'finish', slug: 'minimal', runId: 'wrun_2', status: 'passed', nuxt: '4.6.2' }, finished)
    expect(previousSnapshotId).toBe('snap_old')
    expect(row.snapshotId).toBeNull()
  })

  it('keeps the last result when a check ends without one', () => {
    const { row } = applyCheckReport(running, { kind: 'finish', slug: 'minimal', runId: 'wrun_2', log: 'The check stopped before a result: timeout' }, finished)
    expect(row).toMatchObject({ state: 'idle', status: 'passed', snapshotId: 'snap_old', checkedAt: passing.checkedAt, log: 'The check stopped before a result: timeout' })
  })
})

describe('stopCheckRow', () => {
  it('says which phase a running check was stopped in and keeps the last result', () => {
    const row = stopCheckRow(running, 'HugoRCD', later)
    expect(row).toMatchObject({ state: 'idle', phase: null, sandbox: null, status: 'passed', snapshotId: 'snap_old', log: 'Stopped by HugoRCD during build.' })
    expect(row.phases!.at(-1)).toMatchObject({ phase: 'build', seconds: 30 })
  })

  it('stops a queued check before it started', () => {
    expect(stopCheckRow(queued, 'HugoRCD', later)).toMatchObject({ state: 'idle', log: 'Stopped by HugoRCD before it started.' })
  })
})
