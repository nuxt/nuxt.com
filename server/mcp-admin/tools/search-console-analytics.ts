import { z } from 'zod'

const DIMENSIONS = ['query', 'page', 'country', 'device', 'date', 'searchAppearance'] as const

type AnalyticsResponse = {
  rows?: Array<{ keys?: string[], clicks: number, impressions: number, ctr: number, position: number }>
  responseAggregationType?: string
}

function isoDate(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

const inputSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Start date (YYYY-MM-DD, inclusive). Default: 28 days before `endDate`.'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('End date (YYYY-MM-DD, inclusive). Default: 3 days ago (last complete data).'),
  dimensions: z.array(z.enum(DIMENSIONS)).max(3).default(['query']).describe('Dimensions to group by. Empty array returns totals only.'),
  filters: z.array(z.object({
    dimension: z.enum(['query', 'page', 'country', 'device', 'searchAppearance']),
    operator: z.enum(['contains', 'equals', 'notContains', 'notEquals', 'includingRegex', 'excludingRegex']).default('contains'),
    expression: z.string().describe('Value to match. Countries are ISO 3166-1 alpha-3 lowercase (e.g. "fra"); devices are DESKTOP, MOBILE, TABLET. Regex uses RE2 syntax.')
  })).default([]).describe('Filters, all combined with AND.'),
  type: z.enum(['web', 'image', 'video', 'news', 'discover', 'googleNews']).default('web').describe('Search type.'),
  rowLimit: z.number().int().min(1).max(25000).default(100).describe('Maximum rows to return (Google caps at 25000).'),
  startRow: z.number().int().min(0).default(0).describe('Pagination offset.')
})

export default defineMcpTool({
  name: 'search-console-analytics',
  title: 'Search Console Analytics',
  group: 'admin',
  description: `Queries Google Search performance for nuxt.com (Search Console search analytics): clicks, impressions, CTR and average position, grouped by any of query, page, country, device, date, searchAppearance.

WHEN TO USE: Find top queries for a docs page (\`dimensions=["query"]\` + a \`page\` filter), pages losing traffic (compare two windows), high-impression / low-CTR pages, or queries ranking 8-20 worth improving. Use \`dimensions=["date"]\` for trends.

NOTES: Data lags ~2-3 days and goes back 16 months. Rows are sorted by clicks (desc). \`page\` values are full URLs (https://nuxt.com/...). CTR is a percentage.`,
  inputSchema: inputSchema.meta({ examples: [
    { dimensions: ['page'], rowLimit: 50 },
    { dimensions: ['query'], filters: [{ dimension: 'page', operator: 'contains', expression: '/docs/4.x/getting-started/data-fetching' }] },
    { dimensions: ['date'], startDate: '2026-01-01', endDate: '2026-03-31' }
  ] satisfies z.input<typeof inputSchema>[] }),
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  },
  async handler({ startDate, endDate, dimensions, filters, type, rowLimit, startRow }) {
    const end = endDate ?? isoDate(3)
    const start = startDate ?? new Date(new Date(end).getTime() - 27 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const { rows = [], responseAggregationType } = await searchConsoleFetch<AnalyticsResponse>('/webmasters/v3/sites/{siteUrl}/searchAnalytics/query', {
      method: 'POST',
      body: {
        startDate: start,
        endDate: end,
        dimensions,
        type,
        rowLimit,
        startRow,
        dimensionFilterGroups: filters.length ? [{ groupType: 'and', filters }] : undefined
      }
    })

    return {
      window: { startDate: start, endDate: end },
      dimensions,
      aggregation: responseAggregationType,
      total: rows.length,
      startRow,
      rows: rows.map(row => ({
        ...Object.fromEntries(dimensions.map((dimension, i) => [dimension, row.keys?.[i]])),
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: Math.round(row.ctr * 10000) / 100,
        position: Math.round(row.position * 10) / 10
      }))
    }
  }
})
