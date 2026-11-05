import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('eve/tools', () => ({ defineDynamic: (value: unknown) => value, defineTool: (value: unknown) => value }))
vi.mock('../../layers/nuxi/agent/lib/internal-api', () => ({ internalFetch: vi.fn() }))

const { internalFetch } = await import('../../layers/nuxi/agent/lib/internal-api')
const preview = (await import('../../layers/nuxi/agent/tools/app-preview')).default as any
const web = { principalId: 'visitor', principalType: 'anonymous', issuer: 'nuxt.com' }
const context = (auth: unknown) => ({ session: { auth: { current: auth } } })

afterEach(() => vi.clearAllMocks())

describe('Nuxi live preview access', () => {
  it('offers editing tools only to browser sessions', () => {
    for (const auth of [undefined, { issuer: 'slack' }, { issuer: 'discord' }, { principalId: 'eve:app', principalType: 'runtime' }]) {
      expect(preview(context(auth))).toBeNull()
    }
    expect(Object.keys(preview(context(web)))).toEqual([
      'list_app_files', 'read_app_file', 'edit_app_file', 'add_app_module', 'check_app_page'
    ])
  })

  it('rechecks the caller when executing a previously offered tool', () => {
    const tools = preview(context(web))
    expect(() => tools.read_app_file.execute({ sandboxId: 'preview', path: 'app.vue' }, context({ issuer: 'slack' }))).toThrow('browser session')
    expect(() => tools.read_app_file.execute({ sandboxId: 'preview', path: 'app.vue' }, context({ issuer: 'nuxt.com' }))).toThrow('browser session')
    expect(internalFetch).not.toHaveBeenCalled()
  })

  it('binds sandbox requests to the authenticated visitor', async () => {
    await preview(context(web)).edit_app_file.execute({ sandboxId: 'preview', path: 'app.vue', content: '<h1>Hello</h1>' }, context(web))
    const [path, request] = vi.mocked(internalFetch).mock.calls[0]!
    expect(path).toBe('/api/internal/templates/preview')
    expect(JSON.parse(request!.body as string)).toEqual({
      action: 'edit', principalId: 'visitor', sandboxId: 'preview', path: 'app.vue', content: '<h1>Hello</h1>'
    })
  })
})
