import { createError } from 'h3'
import { describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()
vi.stubGlobal('$fetch', fetchMock)
vi.stubGlobal('defineMcpTool', <T>(definition: T) => definition)
vi.stubGlobal('createError', createError)
vi.stubGlobal('useEvent', () => ({}))
vi.stubGlobal('fetchModules', async () => [i18n])

const i18n = { name: 'i18n', npm: '@nuxtjs/i18n', description: 'i18n features', category: 'Extensions', type: 'community' }

type Tool = { handler: (input: Record<string, unknown>) => Promise<any> }
const getModule = (await import('../../server/mcp/tools/modules/get-module')).default as unknown as Tool

describe('get-module', () => {
  it('resolves an npm package name to its module', async () => {
    // api.nuxt.com/modules/<slug> knows slugs only, and 404s on npm names
    fetchMock.mockImplementation(async (url: string) => {
      if (url === 'https://api.nuxt.com/modules/i18n') return i18n
      throw Object.assign(new Error('Not Found'), { statusCode: 404, statusMessage: 'Not Found' })
    })
    await expect(getModule.handler({ slug: '@nuxtjs/i18n' })).resolves.toMatchObject({ name: 'i18n', npm: '@nuxtjs/i18n', url: 'https://nuxt.com/modules/i18n' })
  })
})
