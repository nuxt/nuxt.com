import { createError } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RESTARTING_FILES, resolveAppPath } from '../../server/utils/templates/edit'

let handler: (event: unknown) => Promise<unknown>
const sandbox = { status: 'running' }
const body = { action: 'edit', principalId: 'visitor', sandboxId: 'preview', path: 'app/pages/index.vue' }
const readFile = vi.fn()
const writeFile = vi.fn().mockImplementation((_sandbox, path) => path)
const getSandbox = vi.fn()
const waitForRestart = vi.fn()
const requireInternal = vi.fn()

beforeEach(async () => {
  vi.stubGlobal('defineEventHandler', (value: unknown) => value)
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('requireInternalRequest', requireInternal)
  vi.stubGlobal('readValidatedBody', (_event: unknown, parse: (value: unknown) => unknown) => parse(body))
  vi.stubGlobal('getPreviewSandbox', getSandbox.mockResolvedValue(sandbox))
  vi.stubGlobal('waitForDevServer', vi.fn())
  vi.stubGlobal('resolveAppPath', resolveAppPath)
  vi.stubGlobal('RESTARTING_FILES', RESTARTING_FILES)
  vi.stubGlobal('readAppFile', readFile)
  vi.stubGlobal('writeAppFile', writeFile)
  vi.stubGlobal('devLogSize', vi.fn().mockResolvedValue(42))
  vi.stubGlobal('waitForRestart', waitForRestart)
  handler = (await import('../../server/api/internal/templates/preview.post')).default as any
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function request(value: Record<string, unknown>) {
  vi.stubGlobal('readValidatedBody', (_event: unknown, parse: (value: unknown) => unknown) => parse({ ...body, ...value }))
  return handler({})
}

describe('editing a template preview', () => {
  it('refuses requests without internal authentication', async () => {
    requireInternal.mockImplementationOnce(() => {
      throw createError({ statusCode: 401 })
    })
    await expect(request({ content: 'Hello' })).rejects.toMatchObject({ statusCode: 401 })
    expect(getSandbox).not.toHaveBeenCalled()
  })

  it('refuses missing, stopped or differently owned previews', async () => {
    for (const value of [null, { status: 'stopped' }]) {
      getSandbox.mockResolvedValueOnce(value)
      await expect(request({ content: 'Hello' })).rejects.toMatchObject({ statusCode: 404 })
    }
    expect(getSandbox).toHaveBeenCalledWith('preview', 'visitor')
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('applies an exact edit to the existing file', async () => {
    readFile.mockResolvedValue({ path: body.path, content: '<h1>Welcome</h1>', truncated: false })
    await expect(request({ edits: [{ find: 'Welcome', replace: 'Hello world' }] })).resolves.toEqual({ path: body.path })
    expect(writeFile).toHaveBeenCalledWith(sandbox, body.path, '<h1>Hello world</h1>')
    expect(waitForRestart).not.toHaveBeenCalled()
  })

  it.each(['Welcome Welcome', 'Something else'])('rejects an ambiguous or missing match without writing', async (content) => {
    readFile.mockResolvedValue({ path: body.path, content, truncated: false })
    await expect(request({ edits: [{ find: 'Welcome', replace: 'Hello' }] })).rejects.toMatchObject({ statusCode: 422 })
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('rejects edits to truncated files', async () => {
    readFile.mockResolvedValue({ path: body.path, content: 'Welcome', truncated: true })
    await expect(request({ edits: [{ find: 'Welcome', replace: 'Hello' }] })).rejects.toMatchObject({ statusCode: 422 })
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('waits for config changes to restart before reporting success', async () => {
    await expect(request({ path: 'nuxt.config.ts', content: 'export default defineNuxtConfig({})' })).resolves.toEqual({ path: 'nuxt.config.ts', restarted: true })
    expect(waitForRestart).toHaveBeenCalledWith(sandbox, 42)
  })
})

describe('starting the preview editor', () => {
  it.each([false, true])('streams startup before the result (failed: %s)', async (failed) => {
    vi.stubGlobal('getRateLimitPrincipalId', vi.fn().mockResolvedValue('visitor'))
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('preview'))
    vi.stubGlobal('setResponseHeaders', vi.fn())
    const start = vi.fn(async (_sandbox, onStarted: () => void) => {
      onStarted()
      if (failed) throw new Error('Startup failed')
      return 'https://preview.vercel.run'
    })
    vi.stubGlobal('waitForDevServer', start)
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const edit = (await import('../../server/api/templates/preview/[id]/edit.post')).default as any
      const stream = await edit({})
      const events = (await new Response(stream).text()).trim().split('\n').map(line => JSON.parse(line))
      expect(events).toEqual([
        { type: 'started' },
        failed ? { type: 'error', message: 'The dev server could not start.' } : { type: 'ready', url: 'https://preview.vercel.run' }
      ])
      expect(start).toHaveBeenCalledTimes(1)
      expect(getSandbox).toHaveBeenCalledWith('preview', 'visitor')
    } finally {
      log.mockRestore()
    }
  })
})
