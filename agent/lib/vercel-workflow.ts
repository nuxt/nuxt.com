import { WorkflowWorldError } from '@workflow/errors'
import { createVercelWorld } from '@workflow/world-vercel'
import type { WorkflowRunWithoutData } from '@workflow/world'

export class ObservabilityAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ObservabilityAuthError'
  }
}

const AUTH_HINT = 'On Vercel (Eve service), VERCEL_OIDC_TOKEN is used automatically. Locally, run `vercel env pull` or set WORKFLOW_VERCEL_AUTH_TOKEN from `vercel login`.'

const EVE_SESSION_TYPE = '$eve.type'
const EVE_TRIGGER = '$eve.trigger'
const EVE_TITLE = '$eve.title'
const EVE_INPUT_TOKENS = '$eve.input_tokens'
const EVE_OUTPUT_TOKENS = '$eve.output_tokens'
const EVE_MODEL = '$eve.model'

export interface AgentRunSummary {
  runId: string
  status: string
  trigger?: string
  title?: string
  model?: string
  inputTokens: number
  outputTokens: number
  durationMs: number | null
  createdAt: string
  completedAt: string | null
  dashboardUrl: string
}

export interface AgentObservabilityStats {
  window: { sinceDays: number, since: string }
  environment: string
  totals: {
    sessions: number
    completed: number
    failed: number
    running: number
    inputTokens: number
    outputTokens: number
  }
  /** Raw trigger counts keyed by Eve channel (e.g. slack, http, future connectors). */
  byTrigger: Record<string, { sessions: number, inputTokens: number, outputTokens: number }>
  /** Same data as byTrigger, sorted by session count (matches Vercel dashboard "Trigger" column). */
  channelBreakdown: Array<{ channel: string, sessions: number, inputTokens: number, outputTokens: number }>
  recentSessions: AgentRunSummary[]
  dashboard: {
    location: string
    note: string
  }
}

function readAttr(run: WorkflowRunWithoutData, key: string): string | undefined {
  const record = run as WorkflowRunWithoutData & {
    attributes?: Record<string, string>
    executionContext?: Record<string, unknown>
  }
  const fromAttributes = record.attributes?.[key]
  if (typeof fromAttributes === 'string' && fromAttributes.length > 0) return fromAttributes

  const ctx = record.executionContext
  if (ctx && typeof ctx[key] === 'string') return ctx[key]
  return undefined
}

function readNumberAttr(run: WorkflowRunWithoutData, key: string): number {
  const raw = readAttr(run, key)
  if (!raw) return 0
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
}

function durationMs(run: WorkflowRunWithoutData): number | null {
  if (!run.startedAt) return null
  const end = run.completedAt ?? run.updatedAt ?? null
  if (!end) return null
  return Math.max(0, end.getTime() - run.startedAt.getTime())
}

function dashboardUrl(runId: string): string {
  const team = process.env.VERCEL_TEAM_SLUG?.trim() || 'vercel'
  const project = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()?.replace(/^https?:\/\//, '').split('.')[0]
    || process.env.VERCEL_PROJECT_NAME?.trim()
    || 'nuxt'
  return `https://vercel.com/${team}/${project}/observability/agent-runs/${runId}`
}

function createWorld() {
  const authToken = process.env.WORKFLOW_VERCEL_AUTH_TOKEN?.trim()
  const projectId = process.env.VERCEL_PROJECT_ID?.trim() || process.env.WORKFLOW_VERCEL_PROJECT?.trim()
  const teamId = process.env.VERCEL_TEAM_ID?.trim() || process.env.WORKFLOW_VERCEL_TEAM?.trim()
  const environment = process.env.VERCEL_ENV?.trim()
    || process.env.WORKFLOW_VERCEL_ENV?.trim()
    || 'production'

  // Proxy mode (api.vercel.com) requires a Vercel auth token, not OIDC alone.
  const projectConfig = authToken && projectId && teamId
    ? { projectId, teamId, environment, projectName: process.env.VERCEL_PROJECT_NAME?.trim() || 'nuxt' }
    : undefined

  return createVercelWorld({
    token: authToken,
    projectConfig
  })
}

function isSessionRun(run: WorkflowRunWithoutData): boolean {
  const type = readAttr(run, EVE_SESSION_TYPE)
  if (type === 'session') return true
  if (type === 'turn' || type === 'subagent') return false
  // Fallback when attributes are absent: treat root workflow runs as sessions.
  return !run.workflowName.toLowerCase().includes('turn')
}

async function listSessionRuns(since: Date, maxPages = 8): Promise<WorkflowRunWithoutData[]> {
  const world = createWorld()
  const runs: WorkflowRunWithoutData[] = []
  let cursor: string | undefined

  for (let page = 0; page < maxPages; page++) {
    const response = await world.runs.list({
      resolveData: 'none',
      pagination: {
        limit: 100,
        cursor,
        sortOrder: 'desc'
      }
    })

    for (const run of response.data) {
      if (run.createdAt < since) {
        return runs
      }
      if (isSessionRun(run)) {
        runs.push(run)
      }
    }

    if (!response.hasMore || !response.cursor) break
    cursor = response.cursor
  }

  return runs
}

function summarizeRun(run: WorkflowRunWithoutData): AgentRunSummary {
  return {
    runId: run.runId,
    status: run.status,
    trigger: readAttr(run, EVE_TRIGGER),
    title: readAttr(run, EVE_TITLE),
    model: readAttr(run, EVE_MODEL),
    inputTokens: readNumberAttr(run, EVE_INPUT_TOKENS),
    outputTokens: readNumberAttr(run, EVE_OUTPUT_TOKENS),
    durationMs: durationMs(run),
    createdAt: run.createdAt.toISOString(),
    completedAt: run.completedAt?.toISOString() ?? null,
    dashboardUrl: dashboardUrl(run.runId)
  }
}

function rethrowObservabilityError(error: unknown): never {
  if (error instanceof ObservabilityAuthError) throw error
  if (error instanceof WorkflowWorldError && error.status === 401) {
    throw new ObservabilityAuthError(`Vercel Workflow API unauthorized. ${AUTH_HINT}`)
  }
  throw error
}

export async function fetchAgentObservabilityStats(sinceDays: number): Promise<AgentObservabilityStats> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)
  const environment = process.env.VERCEL_ENV?.trim()
    || process.env.WORKFLOW_VERCEL_ENV?.trim()
    || 'production'

  let sessions: WorkflowRunWithoutData[]
  try {
    sessions = await listSessionRuns(since)
  } catch (error) {
    rethrowObservabilityError(error)
  }
  const byTrigger: Record<string, { sessions: number, inputTokens: number, outputTokens: number }> = {}

  let inputTokens = 0
  let outputTokens = 0
  let completed = 0
  let failed = 0
  let running = 0

  for (const run of sessions) {
    const summary = summarizeRun(run)
    inputTokens += summary.inputTokens
    outputTokens += summary.outputTokens

    if (run.status === 'completed') completed++
    else if (run.status === 'failed') failed++
    else if (run.status === 'running' || run.status === 'pending') running++

    const trigger = summary.trigger ?? 'unknown'
    const bucket = byTrigger[trigger] ?? { sessions: 0, inputTokens: 0, outputTokens: 0 }
    bucket.sessions++
    bucket.inputTokens += summary.inputTokens
    bucket.outputTokens += summary.outputTokens
    byTrigger[trigger] = bucket
  }

  const recentSessions = sessions
    .slice(0, 15)
    .map(summarizeRun)

  const channelBreakdown = Object.entries(byTrigger)
    .map(([channel, stats]) => ({ channel, ...stats }))
    .sort((a, b) => b.sessions - a.sessions)

  return {
    window: { sinceDays, since: since.toISOString() },
    environment,
    totals: {
      sessions: sessions.length,
      completed,
      failed,
      running,
      inputTokens,
      outputTokens
    },
    byTrigger,
    channelBreakdown,
    recentSessions,
    dashboard: {
      location: 'Vercel dashboard → nuxt project → Observability → Agent Runs',
      note: 'Sessions are grouped by Eve trigger/channel (slack, http, and future connectors). Token totals may differ slightly from the dashboard when turn-level runs are included there.'
    }
  }
}
