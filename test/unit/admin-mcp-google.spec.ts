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
  },
  googleCrux: { apiKey: 'crux-key' }
}))
const google = await import('../../server/utils/google')
vi.stubGlobal('searchConsoleFetch', google.searchConsoleFetch)
vi.stubGlobal('cruxFetch', google.cruxFetch)

type Tool = { handler: (input: Record<string, unknown>) => Promise<any> }
const analytics = (await import('../../server/mcp/tools/admin/search-console-analytics')).default as unknown as Tool
const webVitals = (await import('../../server/mcp/tools/admin/crux-web-vitals')).default as unknown as Tool

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

    const [result] = await Promise.all([analytics.handler(input), analytics.handler(input)])
    await analytics.handler(input)

    expect(result.rows).toEqual([{ page: 'https://nuxt.com/docs/4.x/api/composables/use-fetch', query: 'nuxt usefetch', clicks: 120, impressions: 4000, ctr: 3, position: 4.3 }])
    // Concurrent calls share one token exchange, and later calls reuse the cached token
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

const bins = (good: number | string, poor: number | string, start: number | string = 0) => [{ start, end: good }, { start: good, end: poor }, { start: poor }]

describe('admin Chrome UX Report tool', () => {
  it('rates each p75 against the thresholds CrUX returns', async () => {
    fetchMock.mockImplementation(async (url: string, options: { query: Record<string, string>, body: any }) => {
      expect(url).toBe('https://chromeuxreport.googleapis.com/v1/records:queryRecord')
      expect(options.query).toEqual({ key: 'crux-key' })
      expect(options.body).toMatchObject({ url: 'https://nuxt.com/docs/4.x/api', formFactor: 'PHONE' })
      return {
        record: {
          key: { url: 'https://nuxt.com/docs/4.x/api', formFactor: 'PHONE' },
          metrics: {
            largest_contentful_paint: { histogram: bins(2500, 4000).map((bin, i) => ({ ...bin, density: [0.7123, 0.2, 0.0877][i] })), percentiles: { p75: 2600 } },
            interaction_to_next_paint: { histogram: bins(200, 500).map(bin => ({ ...bin, density: 1 / 3 })), percentiles: { p75: 150 } },
            // CLS values and bounds are strings
            cumulative_layout_shift: { histogram: bins('0.10', '0.25', '0.00').map(bin => ({ ...bin, density: 1 / 3 })), percentiles: { p75: '0.05' } }
          },
          collectionPeriod: { firstDate: { year: 2026, month: 9, day: 27 }, lastDate: { year: 2026, month: 10, day: 24 } }
        }
      }
    })

    const result = await webVitals.handler({ url: '/docs/4.x/api', formFactor: 'PHONE' })

    expect(result.collectionPeriod).toEqual({ firstDate: '2026-09-27', lastDate: '2026-10-24' })
    expect(result.metrics.lcp).toEqual({ p75: 2600, rating: 'needs-improvement', goodPercent: 71.2, needsImprovementPercent: 20, poorPercent: 8.8 })
    expect(result.metrics.inp.rating).toBe('good')
    expect(result.metrics.cls).toMatchObject({ p75: 0.05, rating: 'good' })
    expect(result.assessment).toBe('failed')
  })

  it('maps the weekly history, keeping periods without data', async () => {
    fetchMock.mockImplementation(async (url: string, options: { body: any }) => {
      expect(url).toBe('https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord')
      expect(options.body).toMatchObject({ origin: 'https://nuxt.com', collectionPeriodCount: 2 })
      return {
        record: {
          key: { origin: 'https://nuxt.com' },
          metrics: {
            largest_contentful_paint: { histogramTimeseries: bins(2500, 4000), percentilesTimeseries: { p75s: [2400, null] } },
            interaction_to_next_paint: { histogramTimeseries: bins(200, 500), percentilesTimeseries: { p75s: [180, 190] } },
            cumulative_layout_shift: { histogramTimeseries: bins('0.10', '0.25', '0.00'), percentilesTimeseries: { p75s: ['0.30', '0.05'] } }
          },
          collectionPeriods: [
            { firstDate: { year: 2026, month: 9, day: 20 }, lastDate: { year: 2026, month: 10, day: 17 } },
            { firstDate: { year: 2026, month: 9, day: 27 }, lastDate: { year: 2026, month: 10, day: 24 } }
          ]
        }
      }
    })

    const { periods } = await webVitals.handler({ weeks: 2 })

    expect(periods).toEqual([
      { firstDate: '2026-09-20', lastDate: '2026-10-17', assessment: 'failed', lcp: { p75: 2400, rating: 'good' }, inp: { p75: 180, rating: 'good' }, cls: { p75: 0.3, rating: 'poor' } },
      { firstDate: '2026-09-27', lastDate: '2026-10-24', assessment: 'unknown', lcp: { p75: null, rating: null }, inp: { p75: 190, rating: 'good' }, cls: { p75: 0.05, rating: 'good' } }
    ])
  })

  it('reports pages without enough Chrome traffic instead of failing', async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error('404'), { statusCode: 404, data: { error: { message: 'chrome ux report data not found' } } }))

    await expect(webVitals.handler({ url: '/docs/4.x/rare-page' })).resolves.toMatchObject({ url: 'https://nuxt.com/docs/4.x/rare-page', found: false })
  })
})
