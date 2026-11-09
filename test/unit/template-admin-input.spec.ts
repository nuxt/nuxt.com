import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createError } from 'h3'

vi.stubGlobal('defineMcpTool', (tool: unknown) => tool)
const { default: tool } = await import('../../server/mcp/tools/admin/start-template-checks')
afterEach(() => vi.unstubAllGlobals())

describe('template check selection', () => {
  it('rejects an empty selection instead of checking every template', () => {
    expect(tool.inputSchema.slugs.safeParse([]).success).toBe(false)
  })

  it('accepts a selected template or an omitted selection', () => {
    expect(tool.inputSchema.slugs.safeParse(['docus']).success).toBe(true)
    expect(tool.inputSchema.slugs.safeParse(undefined).success).toBe(true)
  })
})

describe('admin template check controls', () => {
  const event = {}
  const user = { role: 'admin', username: 'HugoRCD' }
  let session: ReturnType<typeof vi.fn>
  let authorized: ReturnType<typeof vi.fn>
  let start: ReturnType<typeof vi.fn>
  let select: ReturnType<typeof vi.fn>
  let where: ReturnType<typeof vi.fn>
  let activeRuns: ReturnType<typeof vi.fn>
  let readCheck: (event: unknown) => Promise<unknown>
  let startCheck: (event: unknown) => Promise<unknown>

  beforeEach(async () => {
    session = vi.fn().mockResolvedValue({ user })
    authorized = vi.fn().mockResolvedValue(true)
    start = vi.fn().mockResolvedValue({ runId: 'run', queued: ['minimal'], skipped: [] })
    where = vi.fn().mockResolvedValue([])
    activeRuns = vi.fn().mockResolvedValue([{ id: 'batch' }])
    select = vi.fn(() => ({ from: () => ({ where }) }))
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('createError', createError)
    vi.stubGlobal('requireUserSession', session)
    vi.stubGlobal('isAuthorizedAdmin', authorized)
    vi.stubGlobal('getValidatedRouterParams', (_event: unknown, parse: (value: unknown) => unknown) => parse({ slug: 'minimal' }))
    vi.stubGlobal('startTemplateChecks', start)
    vi.stubGlobal('getActiveTemplateCheckRuns', activeRuns)
    vi.stubGlobal('templateCheckBaseURL', () => 'https://preview.example')
    vi.stubGlobal('setResponseStatus', vi.fn())
    vi.stubGlobal('setResponseHeader', vi.fn())
    vi.stubGlobal('db', { select })
    vi.stubGlobal('schema', { templateChecks: { slug: 'slug', state: 'state', phase: 'phase', status: 'status', step: 'step' } })
    vi.stubGlobal('eq', (field: string, value: string) => ({ field, value }))
    readCheck = (await import('../../server/api/admin/templates/[slug]/check.get')).default as any
    startCheck = (await import('../../server/api/admin/templates/[slug]/check.post')).default as any
  })

  it('requires a signed-in admin before reading or starting a check', async () => {
    for (const handler of [readCheck, startCheck]) {
      session.mockRejectedValueOnce(createError({ statusCode: 401 }))
      await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
      session.mockResolvedValueOnce({ user: { ...user, role: 'user' } })
      await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
    }
    expect(select).not.toHaveBeenCalled()
    expect(start).not.toHaveBeenCalled()
  })

  it('rechecks current admin membership instead of trusting the saved role alone', async () => {
    authorized.mockResolvedValue(false)
    for (const handler of [readCheck, startCheck]) {
      await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
    }
    expect(authorized).toHaveBeenCalledWith(event, user.username)
    expect(select).not.toHaveBeenCalled()
    expect(start).not.toHaveBeenCalled()
  })

  it('checks only the selected template on the current deployment', async () => {
    await expect(startCheck(event)).resolves.toMatchObject({ queued: ['minimal'] })
    expect(start).toHaveBeenCalledWith('https://preview.example', { slugs: ['minimal'], trigger: 'admin', startedBy: user.username })
    expect(setResponseStatus).toHaveBeenCalledWith(event, 202)
  })

  it('reports an unknown template when the selected check queues nothing', async () => {
    start.mockResolvedValue({ runId: null, queued: [], skipped: [] })
    await expect(startCheck(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('allows the first check when there is no history, and reads progress for this template only', async () => {
    await expect(readCheck(event)).resolves.toEqual({ state: 'idle', phase: null, status: null, step: null })
    const running = { state: 'running', phase: 'build', status: null, step: null }
    where.mockResolvedValue([{ ...running, batchId: 'batch' }])
    await expect(readCheck(event)).resolves.toEqual(running)
    expect(where).toHaveBeenLastCalledWith({ field: 'slug', value: 'minimal' })
  })

  it('returns idle for a running record whose workflow is no longer active', async () => {
    where.mockResolvedValue([{ state: 'running', phase: 'build', status: null, step: null, batchId: 'old-batch' }])
    await expect(readCheck(event)).resolves.toEqual({ state: 'idle', phase: null, status: null, step: null })
  })
})
