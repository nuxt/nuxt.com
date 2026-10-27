import { createVerify, generateKeyPairSync } from 'node:crypto'
import { createError } from 'h3'
import { describe, expect, it, vi } from 'vitest'

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const clientEmail = 'gsc@nuxt.iam.gserviceaccount.com'

const fetchMock = vi.fn()
vi.stubGlobal('$fetch', fetchMock)
vi.stubGlobal('defineMcpTool', <T>(definition: T) => definition)
vi.stubGlobal('createError', createError)
vi.stubGlobal('isMcpAdmin', () => true)
vi.stubGlobal('useRuntimeConfig', () => ({
  googleSearchConsole: {
    clientEmail,
    // As stored in an env var: PEM with escaped newlines
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString().replace(/\n/g, '\\n'),
    siteUrl: 'sc-domain:nuxt.com'
  }
}))
vi.stubGlobal('searchConsoleFetch', (await import('../../server/utils/search-console')).searchConsoleFetch)

type Tool = { handler: (input: Record<string, unknown>) => Promise<any> }
const analytics = (await import('../../server/mcp/tools/admin/search-console-analytics')).default as unknown as Tool

const input = { startDate: '2026-10-01', endDate: '2026-10-07', dimensions: ['page', 'query'], filters: [], type: 'web', rowLimit: 10, startRow: 0 }

describe('admin Search Console tools', () => {
  it('authenticates as the service account and maps rows to dimension names', async () => {
    fetchMock.mockImplementation(async (url: string, options: { body: any, headers?: Record<string, string> }) => {
      if (url === 'https://oauth2.googleapis.com/token') {
        const [header, claims, signature] = options.body.get('assertion').split('.')
        expect(createVerify('RSA-SHA256').update(`${header}.${claims}`).verify(publicKey, signature, 'base64url')).toBe(true)
        expect(JSON.parse(Buffer.from(claims, 'base64url').toString())).toMatchObject({
          iss: clientEmail,
          scope: 'https://www.googleapis.com/auth/webmasters.readonly',
          aud: 'https://oauth2.googleapis.com/token'
        })
        return { access_token: 'token-1', expires_in: 3600 }
      }
      expect(url).toBe('https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Anuxt.com/searchAnalytics/query')
      expect(options.headers).toEqual({ authorization: 'Bearer token-1' })
      return { rows: [{ keys: ['https://nuxt.com/docs/4.x/api/composables/use-fetch', 'nuxt usefetch'], clicks: 120, impressions: 4000, ctr: 0.03, position: 4.26 }] }
    })

    const result = await analytics.handler(input)
    await analytics.handler(input)

    expect(result.rows).toEqual([{ page: 'https://nuxt.com/docs/4.x/api/composables/use-fetch', query: 'nuxt usefetch', clicks: 120, impressions: 4000, ctr: 3, position: 4.3 }])
    // The access token is reused across calls
    expect(fetchMock.mock.calls.filter(([url]) => url.includes('oauth2')).length).toBe(1)
  })

  it('surfaces Google API errors to the MCP client', async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error('403'), { statusCode: 403, data: { error: { message: 'User does not have sufficient permission for site \'sc-domain:nuxt.com\'.' } } }))

    await expect(analytics.handler(input)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Google Search Console: User does not have sufficient permission for site \'sc-domain:nuxt.com\'.'
    })
  })
})
